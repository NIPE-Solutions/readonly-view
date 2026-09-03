# 0005: Support public-state class instances with guarded receivers

Status: Accepted

Custom class instances use the ordinary object membrane. Public methods are invoked with the readonly receiver, so assignments through `this` throw `DirectMutationError`. Prototype identity and `instanceof` are preserved.

Methods that require JavaScript private-field brand checks are not generically usable through a proxy and may throw the engine's `TypeError`. Functions can also mutate independently captured source references; ReadonlyView is not a capability sandbox.
