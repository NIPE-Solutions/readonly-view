# 0005: Support public-state class instances with guarded receivers

Status: Accepted

Custom class instances use the ordinary object membrane. Public methods are invoked with the readonly receiver, so assignments through `this` throw `DirectMutationError`. Prototype reflection returns a readonly view of the prototype. Consequently, a view is not `instanceof` its source class; preserving that identity would require exposing the mutable prototype through `Object.getPrototypeOf`.

Constructing through a constructor view runs ordinary initialization before wrapping the instance. The resulting instance is protected and has the same prototype tradeoff. Methods that require JavaScript private-field brand checks are not generically usable through a proxy and may throw the engine's `TypeError`. Functions can also mutate independently captured source references; ReadonlyView is not a capability sandbox.
