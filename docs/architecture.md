# Architecture

A membrane owns source-to-view and view-to-source WeakMaps. `wrap` classifies one value, creates a controlled shadow target, registers identity, and returns a Proxy. Nested values are wrapped only when exposed.

## Shadows and invariants

Directly proxying a non-configurable, non-writable object property would require returning its exact mutable value. ReadonlyView proxies extensible shadows and virtualizes live descriptors. Prototype objects are wrapped too, so reflection cannot recover a mutable custom prototype. Arrays use array shadows, functions use callable shadows, and Map, Set, and Date use dedicated adapters.

Shadows remain extensible because `preventExtensions` throws, permitting live keys. Array `length` receives a compatible descriptor. Mutation traps never forward.

## Reads and methods

Keys, membership, prototypes, and descriptors delegate to current source state, then object results pass through the membrane. Descriptor values, accessors, iterators, callbacks, collections, and prototypes cannot expose raw objects. Map/Set translate same-membrane view keys privately. Only exact native methods receive valid internal-slot sources; user-defined methods receive readonly `this`. Private fields may fail brand checks.

## Memory

WeakMaps create no global strong ownership of user graphs. Separate calls use separate caches.
