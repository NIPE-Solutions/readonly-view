# ReadonlyView

A deeply readonly, lazy, live view over mutable JavaScript data.

```ts
import { readonlyView } from '@nipe-solutions/readonly-view';

const source = { user: { name: 'Alice', roles: ['admin'] } };
const view = readonlyView(source);

view.user.name = 'Bob'; // TypeScript error + DirectMutationError
source.user.name = 'Bob';
console.log(view.user.name); // Bob
```

ReadonlyView is a runtime-enforced readonly membrane with strong TypeScript types. It is not a state manager, clone, frozen snapshot, or mutation API.

## Install

```bash
npm install @nipe-solutions/readonly-view
```

Requires Node.js 22 or 24, or a current evergreen browser.

## Guarantees

- Writes through the view throw `DirectMutationError`.
- Supported nested values are protected lazily.
- The source is never intentionally changed, frozen, sealed, or eagerly traversed.
- Owner-side changes remain visible.
- Shared references and cycles preserve identity inside one membrane.
- Unsupported built-ins throw `UnsupportedTypeError`.

See [guarantees and non-guarantees](docs/guarantees.md).

## Comparison

| Capability                 | TypeScript readonly | Object.freeze |   Immer    | ReadonlyView |
| -------------------------- | :-----------------: | :-----------: | :--------: | :----------: |
| Compile-time deep readonly |     Custom type     |      No       |     No     |     Yes      |
| Runtime deep readonly      |         No          |    Shallow    | Draft only |     Yes      |
| Lazy                       |         N/A         |      N/A      |     No     |     Yes      |
| Live backing object        |         N/A         |      Yes      |     No     |     Yes      |
| Original remains mutable   |         Yes         |      No       |    Yes     |     Yes      |
| Creates new state          |         No          |      No       |    Yes     |      No      |

These tools solve different problems. Immer produces new state through convenient mutations; ReadonlyView exposes existing owner-controlled data without granting mutation through the view.

## Supported values

Fully supported: primitives, plain/null-prototype objects, arrays/tuples, Map, Set, Date, symbols, accessors, shared references, and cycles. Functions and custom classes have documented receiver/private-field semantics. Mutable native buffers, typed arrays, weak collections, Promise, RegExp, Error, URL, and URLSearchParams are rejected. See the [support matrix](docs/supported-types.md).

## API

- `readonlyView<T>(source: T): DeepReadonly<T>` creates an independent membrane. Primitives return unchanged; an existing view is returned unchanged.
- `isReadonlyView(value: unknown): boolean` recognizes ReadonlyView proxies.
- `DirectMutationError` exposes `operation`, optional `property`, and `objectKind`.
- `UnsupportedTypeError` exposes `kind`.
- `DeepReadonly<T>` models the runtime readonly contract recursively.

## Performance

Initial wrapping creates one proxy and does not walk the graph. Nested proxies are created on access and reused through WeakMaps. Proxy reads still have overhead. See [performance](docs/performance.md) and [benchmarks](benchmarks/README.md).

## Documentation

[Architecture](docs/architecture.md) · [API](docs/api.md) · [Supported types](docs/supported-types.md) · [Compatibility](docs/compatibility.md) · [Migration](docs/migration-v1-v2.md) · [Security](docs/security-and-trust.md) · [Contributing](CONTRIBUTING.md)

## License

MIT
