# Choosing an approach

ReadonlyView is one way to model ownership. It is not a replacement for every form of readonly or immutable state. Choose the tool that matches the lifecycle you need.

## TypeScript `readonly`

Choose TypeScript `readonly` when you need compile-time guidance for a typed API and runtime enforcement is not required. It does not change JavaScript behavior: a caller can still mutate a value at runtime if it has a mutable reference or casts around the type.

## `Object.freeze`

Choose `Object.freeze` when a shallow runtime boundary is enough and preventing top-level writes on that particular object is acceptable. Its nested objects remain mutable, and freezing the owner’s object means the owner cannot continue changing top-level properties.

## Deep freeze

Choose deep freeze when a value must become deeply immutable and neither owner nor consumer should update it. It eagerly traverses the reachable graph and changes the source objects’ mutability, so it does not fit a live owner-controlled surface.

## Cloning and snapshots

Choose cloning or snapshots when consumers need a historical, isolated point in time. A snapshot intentionally becomes stale after its creation; make a new one when the source changes. Use an Immer-style immutable-update workflow when producing successive states from convenient draft mutations is the primary job.

## ReadonlyView

Choose ReadonlyView when an owner continues to mutate a live graph, consumers must see those changes through an existing reference, and consumers must not mutate through that public access path. It creates a lazy runtime membrane without freezing, copying, or managing state.

## Comparison

| Capability              | TypeScript `readonly` | `Object.freeze`            | Deep freeze          | Snapshot / Immer        | ReadonlyView    |
| ----------------------- | --------------------- | -------------------------- | -------------------- | ----------------------- | --------------- |
| Compile-time protection | Yes, where typed      | No                         | No                   | Optional types          | Yes             |
| Runtime depth           | None                  | Shallow                    | Deep                 | Snapshot/draft-specific | Deep            |
| Owner retains mutation  | Yes                   | Top-level no; nested yes   | No                   | Yes, on original        | Yes             |
| Live owner updates      | Yes                   | Nested updates remain live | N/A: owner is frozen | No: new snapshot/state  | Yes             |
| Traversal/copying       | None                  | None                       | Eager traversal      | Produces/copies state   | Lazy, on access |
| New-state production    | No                    | No                         | No                   | Yes                     | No              |

These approaches solve different ownership and lifecycle problems. Immer helps create new state; snapshots preserve a past state; freezing constrains the source itself; TypeScript guides typed callers. ReadonlyView exposes an existing owner-controlled graph without granting mutation through the view.
