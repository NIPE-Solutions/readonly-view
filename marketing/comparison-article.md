# Readonly, frozen, snapshot, or live view? Choose by lifecycle

> Publication status: unpublished draft for human review.
>
> Publication gate: complete the [launch checklist](README.md#launch-checklist) for this draft. Code fragments must keep their labels and be validated in a complete harness before publication.

“Make this readonly” can describe at least five different requirements:

1. prevent accidental writes in typed application code;
2. reject top-level writes at runtime;
3. make an entire value immutable for everyone;
4. preserve one point in time or produce a successor state;
5. let one owner keep updating data while consumers receive a live read-only access path.

Those requirements sound related, but they imply different ownership and lifecycle choices. TypeScript `readonly`, `Object.freeze`, deep freeze, snapshots, immutable-update libraries, and live readonly views are complementary tools—not progressively “stronger” versions of one idea.

The fastest way to choose is to ask who may mutate the data and whether consumers need the past or the present.

## The short decision guide

Choose **TypeScript `readonly`** when compile-time guidance is enough.

Choose **`Object.freeze`** when a shallow runtime constraint on that exact object is enough.

Choose **deep freeze** when the reachable graph should stop changing for both owner and consumer.

Choose a **clone or snapshot** when consumers need an isolated point in time.

Choose an **Immer-style immutable-update workflow** when the main operation is producing successor state, often with structural sharing.

Choose a **live readonly view** when one owner keeps changing a graph, existing consumer references must reflect those changes, and writes through the public access path should fail.

If none of these descriptions matches, an explicit query API or event/subscription interface may be a better boundary than publishing an object graph at all.

## Comparison at a glance

| Question                                                  | TypeScript `readonly`             | `Object.freeze`                                     | Deep freeze      | Snapshot / clone                               | Immer-style update                                          | Live readonly view                             |
| --------------------------------------------------------- | --------------------------------- | --------------------------------------------------- | ---------------- | ---------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| Compile-time guidance                                     | Yes, where typed                  | No by itself                                        | No by itself     | Optional                                       | Optional                                                    | Yes with an accompanying deep-readonly type    |
| Runtime write rejection                                   | No                                | Top-level only                                      | Deep             | No inherent rejection; writes stay in the copy | Draft-specific                                              | Deep through supported view paths              |
| May the owner keep mutating the same source?              | Yes                               | Not at the frozen top level                         | No               | Yes                                            | Original stays separate; normal updates produce a successor | Yes                                            |
| Do existing consumer references show later owner changes? | Yes, because runtime is unchanged | Nested changes can; frozen top-level changes cannot | No owner changes | No                                             | No; consumers receive a state version                       | Yes                                            |
| Eager graph traversal or copying                          | No                                | No                                                  | Usually yes      | Yes for the captured graph                     | Produces/copies state as needed                             | No initial graph walk; nested wrapping is lazy |
| Produces new application state                            | No                                | No                                                  | No               | Produces a copy                                | Yes                                                         | No                                             |

This table describes typical use, not every library implementation. Snapshot algorithms support different value types, and immutable-update libraries make different trade-offs. Check the tool you actually plan to use.

## TypeScript `readonly`: guidance for typed consumers

TypeScript can express an API that consumers should not mutate:

```ts
type Connection = {
    readonly status: 'connecting' | 'connected';
};

function render(connection: Connection) {
    // connection.status = 'connected'; // compile-time error
}
```

This is often exactly enough. It is cheap, communicates intent, and catches mistakes before code runs.

It does not change the JavaScript value. A cast, untyped caller, reflected assignment, or another mutable alias can still write at runtime. Choose types alone when callers are trusted, the boundary is internal, or runtime rejection would add complexity without meaningful benefit.

## `Object.freeze`: a shallow runtime rule

`Object.freeze` changes one object so its existing own properties cannot be reassigned or deleted and new properties cannot be added.

```ts
const configuration = Object.freeze({
    retries: 3,
    labels: { environment: 'production' },
});

Reflect.set(configuration, 'retries', 5); // fails
configuration.labels.environment = 'test'; // nested object is still mutable
```

The operation is shallow. It also constrains the exact source object, which means its owner cannot later replace `retries` on that object.

Choose it for small constants, finalized records, or surfaces where shallow enforcement matches the real requirement. Do not describe a frozen outer object as a deeply immutable graph unless its nested values are handled separately.

## Deep freeze: make the graph stop changing

A deep-freeze utility traverses reachable values and freezes them recursively. It fits values that should become final for everyone: parsed configuration after startup, immutable fixtures, or finalized domain values.

That finality is also the limitation. If an SDK needs to change `connected` after opening a socket, freezing the owned state conflicts with its lifecycle. Deep freeze usually performs an eager graph walk, must define behavior for cycles and unusual values, and changes the mutability of the source objects themselves.

Choose deep freeze when shared immutability is the goal. Do not choose it when the owner must keep updating the same graph.

## Clones and snapshots: preserve a point in time

A snapshot separates the consumer’s value from future owner changes:

_Illustrative fragment: define the initial `source` fixture in the publication validation harness._

```ts
const snapshot = structuredClone(source);

source.status = 'connected';
snapshot.status; // the earlier status
```

That staleness is a feature when building audit records, undo history, request payloads, test captures, or render inputs tied to one version. It is a bug when the consumer expects an existing `state` reference to stay current.

Cloning also has semantics to choose: which types are supported, whether prototypes survive, how identity and cycles are handled, and whether the copy itself should be frozen. “Just clone it” is a lifecycle decision, not merely an implementation detail.

Choose a snapshot when time and isolation matter more than liveness. Produce another snapshot when the owner changes.

## Immer-style updates: produce the next state

Immutable-update libraries solve a state-production problem. They let update code work against a controlled draft and then produce a new state value, often reusing unchanged structure.

Conceptually:

_Illustrative fragment: import `produce` and define `previousState` in the publication validation harness._

```ts
const nextState = produce(previousState, (draft) => {
    draft.connection.status = 'connected';
});
```

This is a strong fit for reducers, undo/redo, predictable state transitions, and systems where versions of state are first-class. Consumers move from `previousState` to `nextState` rather than watching one reference reflect owner-side mutation.

A live readonly view is not a replacement for that workflow. It produces no successor state, tracks no transactions, and manages no lifecycle. Conversely, an immutable-update library is not primarily a way to publish one owner-controlled mutable graph through a stable consumer reference.

Choose based on whether the central verb is **produce** or **observe**.

## Live readonly views: separate owner and consumer capabilities

Consider an SDK with long-lived state:

```ts
import { readonlyView } from '@nipe-solutions/readonly-view';

class Client {
    #state = { connected: false };
    readonly state = readonlyView(this.#state);

    connect() {
        this.#state.connected = true;
    }
}

const client = new Client();
const state = client.state;

client.connect();
console.log(state.connected); // true
Reflect.set(state, 'connected', false); // throws
```

The owner retains the ordinary mutable source. The consumer gets a different capability: read the current graph through a stable view. Supported nested values are protected lazily rather than copied or frozen.

This model fits SDK public state, registries, plugin contexts, configuration managers, caches, engines, and diagnostic surfaces when consumers need current data but writes should stay behind owner APIs.

It comes with boundaries:

- it does not create a snapshot or emit change notifications;
- it does not prevent owner-side mutation;
- it protects only access through the view, not another source alias;
- Proxy reads have runtime overhead;
- native values need deliberate support, and unsupported values should fail explicitly;
- it is not a security sandbox or a state manager.

For `@nipe-solutions/readonly-view`, Map, Set, Date, arrays, plain objects, cycles, shared references, reflection, callbacks, and iterators have documented semantics. Other internal-slot built-ins may be unsupported rather than partially wrapped. Check the current support matrix before choosing the boundary.

## Three questions that usually decide it

### 1. Who is allowed to mutate?

- **Only typed discipline matters:** TypeScript `readonly` may be enough.
- **Nobody should mutate:** freeze or deep freeze the finalized value.
- **Update logic should create versions:** use an immutable-update workflow.
- **One owner may mutate, consumers may not through the public path:** use a live readonly view.

### 2. Should an existing consumer reference represent now or then?

- **Then:** return a snapshot.
- **Now:** use a query API, selector, subscription-backed store, or live view depending on whether consumers need a graph and whether they need notifications.

### 3. Is the consumer trusted JavaScript in the same process?

A runtime readonly view can reject writes through its supported paths, but it cannot contain arbitrary code or revoke references already held elsewhere. If the consumer is hostile, use an isolation boundary designed for that threat model. If it is trusted but mistake-prone plugin or application code, a readonly view may be useful defense in depth for the public API.

## Common combinations

These approaches are not mutually exclusive:

- publish TypeScript readonly types for every public API, then add runtime enforcement only at important boundaries;
- take snapshots from an owner-controlled source for history while exposing a live view for current diagnostics;
- freeze finalized configuration inputs, but expose changing operational state through a view;
- use an immutable-update workflow inside the owner and expose the owner’s current state through selectors or an appropriate readonly surface.

The combination should preserve one clear answer to “who owns mutation?” If several parts of the system can still reach mutable aliases, wrapping one export does not settle ownership by itself.

## A practical recommendation

Write the requirement without using the word “readonly”:

> The SDK owns connection state. It may update that state in place. Applications holding the public `state` reference must see later SDK updates, and writes through that reference must throw.

That sentence points to a live readonly view.

Change it to “applications need the state exactly as it was when the request completed,” and it points to a snapshot. Change it to “each action should produce a new state version,” and it points to an immutable-update workflow. Change it to “this configuration must never change again,” and it points to freezing.

Choose the lifecycle first. The implementation choice usually follows.

For a complete live-view contract, see the ReadonlyView [decision guide](https://github.com/NIPE-Solutions/readonly-view/blob/main/docs/choosing-an-approach.md), [documentation](https://readonly-view.nipesolutions.com/), and [source](https://github.com/NIPE-Solutions/readonly-view). `@nipe-solutions/readonly-view` is not a sandbox or state manager; it is one focused option for an owner-controlled live graph.
