# Seven escape routes from a naïve readonly Proxy

> Publication status: unpublished draft for human review. Publish as one seven-part thread only after checking the destination’s current character-count, disclosure, link, and code-formatting rules.

## 1/7 — The premise

A JavaScript readonly Proxy looks simple: reject `set` and `delete`. That blocks `view.x = 1`, but nested reads can still return mutable objects. Deep readonly is an exposure problem: every route out needs the same membrane. `@nipe-solutions/readonly-view`

## 2/7 — Descriptors

`Object.getOwnPropertyDescriptor(view, 'child')` can expose a raw `descriptor.value`. Proxy invariants also constrain non-configurable properties. A controlled shadow target lets a view report wrapped values without changing source descriptors.

## 3/7 — Returns and getters

Getters and methods are exits too. Their results need wrapping, and user code should receive the readonly `this`. Binding `this` to the source restores mutation. Closures can still have outside effects; a readonly view does not make code pure.

## 4/7 — Callbacks

Callbacks can retain their arguments. Array callbacks need viewed items; Map `forEach` needs wrapped values, keys, and the Map view; Set needs wrapped values and its view. A read-only-sounding method can still leak a raw reference.

## 5/7 — Iterators

Iterators delay exposure: the value appears later from `next()`. `values()`, `entries()`, `Symbol.iterator`, `for...of`, and destructuring all need protected yields, with the same identity consumers see through ordinary reads.

## 6/7 — Internal-slot built-ins

Map, Set, and Date rely on native internal slots. A generic Proxy may fail receiver checks; binding every method to the source enables mutators. Dedicated adapters give reviewed reads valid receivers, wrap outputs, and reject writes.

## 7/7 — Future methods and failing closed

Native APIs evolve. Treat each method as a reviewed read, rejected mutator, or unsupported operation; fail explicitly until classified. ReadonlyView is not a sandbox or state manager.

Docs: https://readonly-view.nipesolutions.com/

Source: https://github.com/NIPE-Solutions/readonly-view
