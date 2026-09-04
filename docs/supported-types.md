# Supported types

| Value                         | Status           | Semantics                                                       |
| ----------------------------- | ---------------- | --------------------------------------------------------------- |
| Primitive                     | Full             | Returned unchanged                                              |
| Plain/null-prototype object   | Full             | Live reflection and deep values                                 |
| Array/tuple                   | Full             | `Array.isArray`; mutations reject                               |
| Map                           | Full             | Inventoried reads wrap keys/values; mutators reject             |
| Set                           | Full             | Inventoried reads; available composition/relation methods       |
| Date                          | Full             | Inventoried reads work; every standard setter rejects           |
| Function                      | Documented       | Readonly `this`; external effects possible                      |
| Custom class                  | Documented       | Prototype viewed; `instanceof` false; private brands may reject |
| Consumer Proxy                | Trust limitation | Source traps bound guarantees                                   |
| RegExp, Error                 | Unsupported      | Stateful/native semantics                                       |
| URL, URLSearchParams          | Unsupported      | Need dedicated adapters                                         |
| Buffers, DataView, TypedArray | Unsupported      | Mutable backing memory                                          |
| WeakMap, WeakSet, Promise     | Unsupported      | Native slots/unsafe exposure                                    |

Unsupported roots and lazily reached values throw `UnsupportedTypeError`.
Unclassified native members on Map, Set, and Date also fail closed instead of
being invoked with the mutable source as their receiver. Where the runtime
provides modern Set composition methods, their fresh Set results and members
remain readonly through the originating membrane.
