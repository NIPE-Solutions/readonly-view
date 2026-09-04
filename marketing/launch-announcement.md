# Launch announcement drafts

> Publication status: unpublished drafts for human review. Choose one channel section at a time; do not paste this whole file into a destination.

## GitHub / NIPE announcement

### ReadonlyView v2: expose live data without exposing mutation

We have released `@nipe-solutions/readonly-view`, a small TypeScript and JavaScript primitive for a specific library boundary:

- your SDK, host, or registry owns a mutable object graph;
- consumers need to read its current state through a stable reference;
- consumers should not gain a mutation path through that public reference.

```ts
import { readonlyView } from '@nipe-solutions/readonly-view';

const source = { connection: { status: 'connecting' } };
const state = readonlyView(source);

source.connection.status = 'connected';
console.log(state.connection.status); // 'connected'

Reflect.set(state.connection, 'status', 'offline'); // throws
```

The view is lazy, live, and deeply readonly for supported values. ReadonlyView does not clone or freeze the source: owner-side changes remain visible, and nested values are wrapped when consumers reach them. Maps, Sets, Dates, arrays, shared references, cycles, descriptors, iterators, and callback arguments have explicit handling rather than relying on a shallow `get`/`set` Proxy.

Equally important, this is not a sandbox or a state manager. It only removes mutation capability from the view. It cannot revoke a source reference that somebody already holds, and unsupported native values fail explicitly instead of being exposed with incomplete protection.

Install:

```sh
npm install @nipe-solutions/readonly-view
```

Documentation: <https://readonly-view.nipesolutions.com/>

Source and issue tracker: <https://github.com/NIPE-Solutions/readonly-view>

ReadonlyView is MIT licensed. We welcome concrete bug reports and small reproductions, especially around JavaScript reflection and new native APIs.

## Personal LinkedIn

I kept running into an API design problem that sounds simple until JavaScript gets involved.

An SDK owns live mutable state. The application needs to inspect that state. Returning the object leaks a write path; cloning it gives the application yesterday’s answer.

That led me to build `@nipe-solutions/readonly-view`:

```ts
const state = readonlyView(source);

source.connected = true; // the owner can update it
state.connected; // true
Reflect.set(state, 'connected', false); // throws
```

The interesting work was not the `set` trap. It was closing less obvious routes: descriptor values, getter and method returns, callback arguments, iterators, collection methods, and built-ins with internal slots. The library uses a lazy membrane and fails explicitly when a value cannot be protected safely.

I also want to be clear about its boundary. ReadonlyView is not a sandbox and it is not a state manager. It does not freeze the owner’s source or revoke another mutable alias. It gives a consumer a live, deeply readonly access path for supported values.

If you maintain an SDK, plugin host, registry, configuration manager, or diagnostic surface, I’d be interested to hear how you model this boundary today.

Docs: <https://readonly-view.nipesolutions.com/>

Repository: <https://github.com/NIPE-Solutions/readonly-view>

## NIPE LinkedIn

Open-source release: `@nipe-solutions/readonly-view`.

ReadonlyView is designed for public read surfaces where one component owns mutable data and another component needs a live view without receiving a mutation path.

```ts
const publicState = readonlyView(internalState);

internalState.status = 'ready';
publicState.status; // 'ready'
Reflect.deleteProperty(publicState, 'status'); // throws
```

The package combines TypeScript’s recursive readonly shape with runtime enforcement across supported nested objects, arrays, Map, Set, Date, reflection, callbacks, and iteration. Wrapping is lazy, so creating a view does not walk the entire graph.

The scope is intentionally narrow. ReadonlyView is not a sandbox, state manager, snapshot, or deep-freeze utility. The owner remains responsible for other mutable aliases, and values that cannot be safely adapted are rejected explicitly.

Read the guide and interactive example: <https://readonly-view.nipesolutions.com/>

Review the implementation: <https://github.com/NIPE-Solutions/readonly-view>

## X / Bluesky launch thread

> Review current per-post limits after links are pasted. Numbering is included so the sequence survives reposting.

**1/5**

An SDK owns mutable state. Consumers need to see the latest state—but returning the object also returns a write path, while cloning it produces a snapshot.

`@nipe-solutions/readonly-view` is built for that boundary. 🧵

**2/5**

```ts
const state = readonlyView(source);

source.status = 'ready';
state.status; // 'ready'

Reflect.set(state, 'status', 'offline'); // throws
```

The source stays mutable. The view does not.

**3/5**

“Readonly” has more exits than a `set` trap: nested values, descriptors, getters, method returns, callback arguments, iterators, Map/Set methods, and native internal slots.

ReadonlyView handles supported exposure routes through one lazy membrane.

**4/5**

The boundary matters: ReadonlyView is not a sandbox or state manager. It does not freeze the source or revoke other aliases. Unsupported native values throw explicitly rather than receiving partial protection.

**5/5**

Use `@nipe-solutions/readonly-view` when an owner keeps mutating a live graph and consumers need a stable, deeply readonly access path.

Docs: <https://readonly-view.nipesolutions.com/>

Source: <https://github.com/NIPE-Solutions/readonly-view>

## Adaptable community post

### Show: a live readonly view for SDK and plugin boundaries

Disclosure: I am involved in ReadonlyView. I’m sharing it because the underlying API-design trade-off may be useful even if this package is not the right choice for your project.

Suppose a library owns this state:

```ts
const source = {
    connection: { status: 'connecting' },
    peers: new Map<string, { latency: number }>(),
};
```

Returning `source` lets callers mutate library-owned data. A deep clone removes that mutation path but becomes stale as soon as the library connects or receives another peer. Deep-freezing the source also blocks the library’s own updates.

`@nipe-solutions/readonly-view` takes a different approach: keep the source private and return a live readonly membrane.

```ts
import { readonlyView } from '@nipe-solutions/readonly-view';

const state = readonlyView(source);

source.connection.status = 'connected';
console.log(state.connection.status); // 'connected'

Reflect.set(state.connection, 'status', 'offline'); // throws
state.peers.clear(); // throws
```

The implementation had to account for more than property assignment. Values can escape through getters, descriptors, methods, array callbacks, iterators, and native collections. Supported values are wrapped lazily and share stable identity inside one membrane; unsupported native values throw when reached.

This is intentionally not a sandbox or a state manager. It cannot revoke a mutable alias a consumer already has, prevent side effects inside arbitrary user code, create historical snapshots, or manage subscriptions. It is one runtime boundary for code that already has an owner/consumer trust model.

The source, tests, limitations, and decision guide are here:

- Documentation: <https://readonly-view.nipesolutions.com/>
- Repository: <https://github.com/NIPE-Solutions/readonly-view>

I’d value feedback on the boundary and unsupported-type policy. If you expose live library-owned state today, do you return snapshots, freeze values, publish selectors, or use another pattern?

> Before posting: adapt the title, disclosure, formatting, and invitation to the specific community. Remove this note and confirm that project posts are permitted.
