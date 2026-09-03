# Architecture

A membrane owns source-to-view and view-to-source WeakMaps. `wrap` classifies one value, creates a controlled shadow target, registers identity, and returns a Proxy. Nested values are wrapped only when exposed.

## Shadows and invariants

Directly proxying a non-configurable, non-writable object property would require returning its exact mutable value. ReadonlyView proxies extensible shadows and virtualizes live descriptors. Objects/classes expose the source prototype; arrays use array shadows; functions use callable shadows; Map, Set, and Date use adapters.

Shadows remain extensible because `preventExtensions` throws, permitting live keys. Array `length` receives a compatible descriptor. Mutation traps never forward.

## Reads and methods

Keys, membership, prototypes, and descriptors delegate to current source state. Object outputs from descriptors, accessors, iterators, callbacks, and collections are wrapped. Map/Set translate same-membrane view keys privately. User methods receive readonly `this`; native adapters receive valid internal-slot sources. Private fields may fail brand checks.

## Memory

WeakMaps create no global strong ownership of user graphs. Separate calls use separate caches.
