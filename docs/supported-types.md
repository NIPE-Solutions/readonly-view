# Supported types

| Value                         | Status           | Semantics                                     |
| ----------------------------- | ---------------- | --------------------------------------------- |
| Primitive                     | Full             | Returned unchanged                            |
| Plain/null-prototype object   | Full             | Live reflection and deep values               |
| Array/tuple                   | Full             | `Array.isArray`; mutations reject             |
| Map                           | Full             | Wrapped keys, values, iteration               |
| Set                           | Full             | Wrapped values and iteration                  |
| Date                          | Full             | Reads work; every `set*` rejects              |
| Function                      | Documented       | Readonly `this`; external effects possible    |
| Custom class                  | Documented       | Prototype retained; private brands may reject |
| Consumer Proxy                | Trust limitation | Source traps bound guarantees                 |
| RegExp, Error                 | Unsupported      | Stateful/native semantics                     |
| URL, URLSearchParams          | Unsupported      | Need dedicated adapters                       |
| Buffers, DataView, TypedArray | Unsupported      | Mutable backing memory                        |
| WeakMap, WeakSet, Promise     | Unsupported      | Native slots/unsafe exposure                  |

Unsupported roots and lazily reached values throw `UnsupportedTypeError`.
