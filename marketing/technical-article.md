# Why a readonly Proxy is harder than it looks

> Publication status: unpublished draft for human review.

JavaScript makes the first version of a readonly object look almost trivial:

```ts
function naiveReadonly<T extends object>(source: T): T {
    return new Proxy(source, {
        set() {
            throw new Error('readonly');
        },
        deleteProperty() {
            throw new Error('readonly');
        },
    });
}
```

This blocks `view.count = 2` and `delete view.count`. It does not yet create a deeply readonly boundary.

The hard part is not recognizing writes. It is making sure that every read path returns either a primitive or another protected view, never a mutable object from behind the boundary. JavaScript can expose values through property descriptors, accessors, methods, callbacks, iterators, prototypes, and native objects with hidden state. A serious implementation has to account for all of them while still obeying the language’s Proxy invariants.

That requirement leads to a more useful mental model: a readonly Proxy is not one wrapper. It is a **membrane** around an object graph.

## Start with the ownership boundary

Imagine an SDK that owns mutable connection state:

```ts
const source = {
    connection: { status: 'connecting' },
};
```

The SDK should be able to change `source.connection.status`. An application should be able to observe that change through an existing reference, but it should not be able to change the same state through that public reference.

A shallow Proxy only protects the first object:

```ts
const view = naiveReadonly(source);

view.connection.status = 'offline'; // writes to the raw nested object
```

A membrane adds an identity-aware wrapping operation to every exposure route:

```ts
const nested = view.connection;

nested === view.connection; // stable identity inside this membrane
Reflect.set(nested, 'status', 'offline'); // throws

source.connection.status = 'connected';
nested.status; // 'connected'
```

The wrapper cache matters. If the same source object appears in two places, consumers should see the same view in both places. It also lets cycles terminate without recursively copying the graph. The result remains live because reads still consult the owner’s current source; wrapping does not freeze or clone it.

That solves ordinary nested reads. Then reflection opens another door.

## Escape route 1: property descriptors

`Object.getOwnPropertyDescriptor` can reveal a property without using an ordinary property read:

```ts
const child = { editable: true };
const source = { child };
const view = naiveReadonly(source);

const descriptor = Object.getOwnPropertyDescriptor(view, 'child');
descriptor?.value === child; // true in a naive implementation
```

If `descriptor.value` is the raw child, the consumer can mutate it. A deep readonly view therefore has to virtualize descriptors too: a data descriptor returned for the view contains the wrapped value, and an accessor descriptor must not hand out a source-bound getter or setter.

There is a second, less obvious problem. Proxy traps are constrained by invariants. Consider a non-configurable, non-writable property:

```ts
const child = { editable: true };
const source = {};

Object.defineProperty(source, 'child', {
    configurable: false,
    writable: false,
    value: child,
});
```

If `source` is the Proxy target, the `get` trap is not allowed to report a different value for `child`. Returning a protected wrapper instead of the exact `child` reference violates the invariant and causes a `TypeError`. Returning the exact value obeys the invariant but leaks mutation access.

### Why shadow targets help

A controlled **shadow target** breaks that deadlock. The Proxy targets a fresh object owned by the membrane rather than the source itself. Traps read the live shape from the source, while the shadow carries only the invariant-sensitive shape needed by the Proxy.

This lets the view expose a configurable descriptor whose value is another view, even when the source descriptor is non-configurable. It also means a frozen, sealed, or non-extensible source can remain untouched. The view describes the virtual readonly surface; it does not promise byte-for-byte descriptor identity with the source.

Shadows have their own constraints. Arrays need array shadows so `Array.isArray(view)` remains true, and their non-configurable `length` descriptor must stay compatible. Callable values need callable shadows. A live view generally keeps its shadow extensible and rejects `preventExtensions`, because future owner-side keys still need to appear.

## Escape route 2: getters and method returns

A property may produce an object by running code:

```ts
const source = {
    child: { editable: true },
    get selected() {
        return this.child;
    },
    findSelected() {
        return this.child;
    },
};
```

Wrapping `source.child` is not enough. Both `view.selected` and `view.findSelected()` must pass their results back through the same membrane.

The receiver is just as important as the return value. If the membrane binds a user method or getter to the mutable source, code inside it can write through `this`:

```ts
const source = {
    count: 0,
    increment() {
        this.count += 1;
    },
};
```

Calling `view.increment()` should use the view as `this`. The assignment then reaches the readonly trap and is rejected. Binding the method to `source` would turn an apparently safe method call into a mutation escape.

This decision has honest trade-offs. Methods that depend on JavaScript private fields may fail their native brand check when `this` is a Proxy. Rebinding those methods to the source would make them work, but it would also let public methods mutate the source. A conservative readonly boundary keeps the protected receiver and documents the private-field limitation.

The membrane also cannot remove effects that do not travel through `this`. A function that closes over `source`, writes a module variable, sends a request, or changes another object can still do those things. Readonly access is not arbitrary-code isolation.

## Escape route 3: callback arguments

Collections expose values by calling consumer code. Consider an array method:

```ts
const source = [{ status: 'queued' }];
const view = readonlyView(source);

view.forEach((item) => {
    Reflect.set(item, 'status', 'running'); // must throw
});
```

If the array implementation runs against the raw source, the callback receives the raw item. Non-mutating generic array methods need to operate against the view so index reads pass through the membrane. Their returned objects must be wrapped too.

`Map.prototype.forEach` and `Set.prototype.forEach` add more detail. A Map callback receives `(value, key, map)`; all object-valued entries must be protected, and the third argument must be the readonly Map view rather than the mutable source. A Set callback receives the same value twice plus the Set, so both value positions need the same wrapped identity.

Callbacks are easy to overlook because the collection method itself sounds read-only. The consumer can retain any callback argument after the call finishes. One raw argument is enough to reopen the mutation path.

## Escape route 4: iterators

Iteration is another value-returning API spread over several calls:

```ts
const iterator = view.values();
const result = iterator.next();
const item = result.value;
```

Protecting only `view.values()` is insufficient. The iterator’s later `next()` call is where the nested value appears. The same applies to `keys()`, `entries()`, `Symbol.iterator`, array iterators, `for...of`, and destructuring.

A readonly adapter can expose an iterator facade that forwards `next()` and wraps each yielded value before returning it. Entry iterators need to protect both the key and the value. Values reached by iteration should resolve to the same view identities as values reached by `get`, indexing, or another property path.

This is why “deep” should describe exposure routes, not merely property depth. The object graph includes anything consumer code can reach through the interface, regardless of whether it arrived through `view.child`, a callback, or the fourth call to `next()`.

## Escape route 5: native internal slots

Some built-ins store their real state in specification-level internal slots rather than ordinary properties. A generic Proxy does not acquire those slots.

```ts
const map = new Map([['selected', { id: 1 }]]);
const proxy = new Proxy(map, {});

proxy.get('selected'); // typically fails an incompatible-receiver check
```

Blindly binding every Map method to the source fixes the receiver error but reintroduces mutation:

```ts
proxy.clear(); // would run with the mutable Map as its receiver
```

Supported built-ins therefore need dedicated adapters. For a Map, readonly operations can run with the valid native receiver, but returned keys and values must be wrapped. `set`, `delete`, and `clear` must reject before touching the source. Set needs the analogous treatment. Date read methods require a real Date receiver, while its `set*` family must be blocked.

There is another distinction inside a native instance: an exact built-in method may receive the internal-slot source when its semantics have been reviewed, but a custom method attached by user code should still receive the readonly view. Otherwise an innocent-looking custom method becomes a source-bound escape.

Other built-ins need their own designs. Typed arrays and `DataView` expose mutable backing memory. URL objects have native setters and mutators. Promise, WeakMap, WeakSet, RegExp, Error, ArrayBuffer, and similar objects have semantics that a generic object membrane cannot safely guess. Returning a half-working Proxy is worse than producing an explicit unsupported-type error.

## Escape route 6: future native APIs

JavaScript’s standard library evolves. A handwritten list that blocks every mutator today can become incomplete when a runtime adds a new method tomorrow.

That creates a maintenance rule: treat each supported native surface as an inventory, not an open-ended passthrough. Every method needs an understood category:

- a read whose receiver and return values are adapted;
- a mutation that rejects before reaching the source;
- or an unsupported operation that fails explicitly until its semantics are implemented and tested.

Tests can compare the methods present on target runtime prototypes with the inventory, including legacy methods that are easy to forget. New platform methods should trigger review rather than inherit a “probably read-only” assumption.

ReadonlyView follows the same fail-closed principle at the type-family level: Map, Set, and Date have dedicated behavior, while documented native families without safe adapters throw `UnsupportedTypeError`. Unsupported roots fail when wrapped; unsupported nested values fail lazily when a consumer reaches them. The support matrix—not a successful TypeScript type—is the runtime authority.

This policy does not make future JavaScript changes automatically safe. It makes reviewing them an explicit part of maintaining the readonly contract.

## What the membrane guarantees—and what it cannot

For supported values, a complete membrane can reject writes made through the view, lazily protect nested exposures, retain stable identity within one membrane, preserve cycles, and keep owner-side changes visible. It can do that without intentionally freezing, sealing, copying, or rewriting the source.

It cannot revoke another reference. If an SDK accepts an object from a consumer and stores that same object, the consumer can still mutate its original reference. Input copying or normalization is a separate ownership decision. Getters and functions can cause external side effects, and consumer-supplied proxies can run arbitrary traps. Those are trust-boundary questions, not problems a readonly view can solve alone.

The membrane is neither a sandbox nor a state manager. It does not isolate arbitrary code, create successor state, emit subscriptions, or manage an application lifecycle.

Proxy reads also carry overhead. Laziness avoids an eager walk of the graph, but it does not make mediated access free. Measure your own workload when the boundary is on a hot path.

## When this technique is appropriate

A live readonly membrane is a good fit when:

- an SDK publishes current connection or session state;
- a registry exposes current Map entries while keeping registration behind owner methods;
- a host gives plugins a live configuration or context;
- cache, engine, or diagnostic consumers need an existing reference to reflect later owner updates;
- the owner can keep the source and other mutable aliases under its control.

It is not the right technique when:

- consumers need an immutable point-in-time snapshot;
- an update should produce a new state value with structural sharing;
- nobody, including the owner, should mutate the graph;
- subscriptions, transactions, reducers, persistence, or lifecycle management are required;
- hostile code needs process, realm, or capability isolation;
- the graph primarily contains unsupported native values.

Those cases call for snapshots, deep freeze, persistent data structures, an immutable-update library, a state manager, or a stronger isolation boundary.

The lesson is broader than one package: readonly behavior is a property of every route by which a value crosses a boundary. A `set` trap is only the beginning.

`@nipe-solutions/readonly-view` is an open-source implementation of this design. Read the [documentation](https://readonly-view.nipesolutions.com/) or inspect the [source and tests](https://github.com/NIPE-Solutions/readonly-view).
