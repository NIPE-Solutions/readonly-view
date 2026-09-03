# Security and trust model

ReadonlyView prevents accidental mutation through supported view paths. It is not isolation for hostile JavaScript.

The implementation does not serialize sources, evaluate code, copy with `for...in`, write source descriptors, or depend on `Symbol.toStringTag`. User getters/functions and supplied proxies may execute arbitrary code. Anyone holding the source may mutate it. Mutable-memory native objects are rejected because Proxy cannot protect their backing storage.
