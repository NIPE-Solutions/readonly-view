# ReadonlyView

Let consumers read your internal state while keeping writes with the code that owns it. ReadonlyView gives an SDK, registry, or application subsystem a live, deeply readonly view over a mutable JavaScript object graph. Owner updates remain visible through the same view; writes through that view fail in TypeScript and at runtime.

Use it when consumers need current data and should call your methods to change it. The owner must keep the mutable source and any other mutable references under control.

[Documentation](https://readonly-view.nipesolutions.com) · [npm](https://www.npmjs.com/package/@nipe-solutions/readonly-view) · [Choosing an approach](docs/choosing-an-approach.md)

## A live view of owner-controlled state

```bash
npm install @nipe-solutions/readonly-view
```

Requires Node.js 22 or 24, or a current evergreen browser. The package includes TypeScript declarations and ESM/CommonJS entry points.

```ts
import { readonlyView } from '@nipe-solutions/readonly-view';

class Client {
    #state = { connected: false, user: null as { name: string } | null };
    readonly state = readonlyView(this.#state);

    connect(user: { name: string }) {
        this.#state.connected = true;
        this.#state.user = { name: user.name };
    }
}

const client = new Client();
const state = client.state;

console.log(state.connected); // false
client.connect({ name: 'Alice' });
console.log(state.connected, state.user?.name); // true, Alice
```

The consumer keeps one `state` reference. `connect()` changes the private source, and the view reflects that change without a subscription or a copied snapshot. It does not trigger UI rerenders; notification and state-management behavior belong to your application.

This example copies the incoming user's name into owner-controlled data. Assigning the supplied `user` object directly would retain a mutable alias: whoever kept that object could still change it. ReadonlyView cannot revoke references a consumer already has. Copy or normalize inputs when your ownership boundary requires it.

## What happens when a consumer writes?

The types reject a direct assignment. JavaScript consumers, casts, or suppressed type errors still encounter a runtime check:

```ts
import {
    DirectMutationError,
    readonlyView,
} from '@nipe-solutions/readonly-view';

const source = { settings: { retries: 3 } };
const view = readonlyView(source);

try {
    // @ts-expect-error Deliberately demonstrate a rejected readonly write.
    view.settings.retries = 5;
} catch (error) {
    if (!(error instanceof DirectMutationError)) throw error;
    console.log(error.operation, error.property); // set, retries
}

console.log(source.settings.retries); // 3: the write never reached the source.
source.settings.retries = 4;
console.log(view.settings.retries); // 4: owner writes remain allowed.
```

Nested objects and supported collections are protected lazily. Array mutation, `Map.set()`, `Set.add()`, and Date setters also throw `DirectMutationError` when called through the view. Shared references and cycles preserve their identity within one view's membrane.

## Choose it for the boundary you have

ReadonlyView fits an SDK publishing connection state, a registry exposing entries, or a host passing trusted plugins a read-only context. In each case there is one owner, consumers need a live reference, and writes should go through the owner's API.

| Your requirement                                                        | Usually choose                                                                     |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Only compile-time guidance for trusted TypeScript callers               | TypeScript `readonly` or a readonly type                                           |
| Make the object itself stop accepting writes                            | `Object.freeze()` for shallow protection, or a suitable deep-freeze implementation |
| Capture a value at one point in time                                    | A snapshot or clone                                                                |
| Produce new immutable state with structural sharing                     | Immer or persistent data structures                                                |
| Keep owner mutation while rejecting consumer writes through a live view | ReadonlyView                                                                       |

ReadonlyView is not a security sandbox for hostile JavaScript. Getters, functions, and supplied Proxy traps may execute arbitrary code or affect state outside the view. Use process, realm, worker, permission, or protocol isolation for that threat model. Read the [security and trust model](docs/security-and-trust.md) and [guarantees](docs/guarantees.md).

## Supported data and limits

Primitives, plain and null-prototype objects, arrays/tuples, Map, Set, Date, symbols, accessors, shared references, and cycles are supported. Functions and custom classes have specific receiver and private-field semantics; a class view does not preserve `instanceof`.

Mutable buffers, DataView, typed arrays, weak collections, Promise, RegExp, Error, URL, and URLSearchParams are rejected with `UnsupportedTypeError`. An unsupported nested value fails when it is reached, rather than during an eager traversal. See the [support matrix](docs/supported-types.md) before exposing an existing graph.

The source is not intentionally changed, frozen, sealed, or walked when you create a view. Wrapping starts with one proxy; nested proxies are created on access and cached with WeakMaps. Proxy reads still have overhead. The [performance guide](docs/performance.md) and [benchmark methodology](benchmarks/README.md) explain the tradeoffs.

## Public API

- `readonlyView<T>(source: T): DeepReadonly<T>` creates an independent membrane. Primitives and existing views are returned unchanged.
- `isReadonlyView(value: unknown): boolean` recognizes the package's views.
- `DirectMutationError` reports `operation`, optional `property`, and `objectKind`.
- `UnsupportedTypeError` reports the unsupported `kind`.
- `DeepReadonly<T>` describes the recursive readonly contract in TypeScript.

The [API reference](docs/api.md), [mental model](docs/mental-model.md), [use cases](docs/use-cases.md), and [compatibility notes](docs/compatibility.md) explain the details. Upgrading from v1? Read the [v2 migration guide](docs/migration-v1-v2.md).

## Local development

```bash
npm ci
npm run dev:website
```

`npm run check` runs formatting, lint, types, unit and type tests, bundle-size and packed-package checks, website verification, and a benchmark smoke run. See [Contributing](CONTRIBUTING.md) for browser testing and development conventions.

[MIT](LICENSE) © Nicholas Petrasek and ReadonlyView contributors · [NIPE Open Source](https://opensource.nipesolutions.com)
