# Ownership mental model

ReadonlyView is for an ownership boundary: one party keeps a mutable source graph, while another party needs to inspect its current state without gaining a mutation path.

```text
Owner code ──mutable reference──▶ Source object graph
                                      │
                                 readonlyView()
                                      │
Consumer code ◀──readonly access── Readonly membrane
```

## The parts

- **Owner:** the library, SDK, host, registry, or state container that owns the source and decides when it changes.
- **Source object graph:** the owner's live objects, arrays, collections, and their nested references.
- **`readonlyView`:** the boundary function that creates a view of that graph.
- **Readonly membrane:** the proxy layer that mediates values reached through the view. It allows reads and rejects writes.
- **Consumer:** code that receives the view, such as an application using an SDK or a plugin running in a host.

The owner can still mutate the source. Those changes remain visible through an existing view because the view reads the same live graph; it is not a copied snapshot.

## Lazy, live views

`readonlyView(source)` creates the top-level view without walking the entire graph. When consumer code reads a supported nested object, ReadonlyView wraps that value then. The wrapper is reused when the same source value is reached again in that membrane, so shared references and cycles keep stable view identity.

```ts
import { readonlyView } from '@nipe-solutions/readonly-view';

const shared = { id: 1 };
const source = { first: shared, second: shared };
const view = readonlyView(source);

console.log(view.first === view.second); // true
source.first.id = 2;
console.log(view.second.id); // 2
```

Each top-level `readonlyView(source)` call creates its own membrane. The corresponding wrappers from separate calls are intentionally not the same identity. Passing an existing ReadonlyView back to `readonlyView` is idempotent and returns that existing view.

## Protection follows the access path

ReadonlyView protects access through its view, not the source graph globally. It does not freeze the source, make every alias readonly, or revoke mutable references that a consumer already held.

```ts
import { readonlyView } from '@nipe-solutions/readonly-view';

const source = { configuration: { retries: 3 } };
const view = readonlyView(source);

source.configuration.retries = 5; // owner-side mutation remains allowed
console.log(view.configuration.retries); // 5
```

At a boundary, the owner therefore needs to control other mutable aliases too. If an API accepts and retains an object supplied by a consumer, that consumer can still change its retained original reference. Copy or normalize input at that separate boundary when needed.

For the precise contract, read the [guarantees and non-guarantees](guarantees.md). See the [supported types](supported-types.md) for values that can be viewed and the [security and trust model](security-and-trust.md) for the limits of protection in hostile or untrusted JavaScript.
