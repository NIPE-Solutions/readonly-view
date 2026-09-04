# Build a live readonly state surface for a TypeScript SDK

> Publication status: unpublished draft for human review.

SDKs often need to expose state that they continue to own: connection status, the active account, cached capabilities, or recent events. The straightforward implementation returns an object. Unfortunately, that makes the SDK’s internal write path public too.

In this tutorial we will turn that leaked mutable reference into a tested, live readonly surface using `@nipe-solutions/readonly-view`.

The target contract is precise:

- the `Client` owns and mutates its source state;
- consumers keep one stable `client.state` reference;
- that reference reflects later `Client` updates;
- writes made through `client.state` throw at runtime;
- caller-owned input objects do not remain aliases into the SDK state.

ReadonlyView is not a sandbox or state manager. The last sections cover the trust, type-support, and performance boundaries that still belong in the SDK design.

## 1. Start with the leaked reference

Here is a small client with public mutable state:

```ts
type User = {
    id: string;
    name: string;
};

type ClientState = {
    connected: boolean;
    user: User | null;
};

export class Client {
    readonly state: ClientState = {
        connected: false,
        user: null,
    };

    connect(user: User) {
        this.state.connected = true;
        this.state.user = user;
    }
}
```

`readonly state` only prevents replacing the `state` property on `Client`. It does not make the object stored there readonly:

```ts
const client = new Client();
client.connect({ id: 'a-1', name: 'Alice' });

client.state.connected = false;
client.state.user!.name = 'Eve';
```

Both assignments change SDK-owned state without going through an SDK method.

We could return a clone, but then a previously returned value would not reflect a later `connect` or `disconnect`. We could freeze the state, but the `Client` itself needs to keep changing it. This API needs two capabilities over the same live graph: an owner reference and a consumer view.

## 2. Keep the mutable source private

First, separate the source from the public property:

```ts
export class Client {
    #state: ClientState = {
        connected: false,
        user: null,
    };

    connect(user: User) {
        this.#state.connected = true;
        this.#state.user = user;
    }
}
```

Private syntax stops consumers from naming `#state`, but they still need a supported way to inspect it. Returning `this.#state` from a getter would recreate the leak. Returning a new clone on every read would change the lifecycle to snapshots.

Adding a TypeScript `DeepReadonly<ClientState>` return type alone would improve editor guidance, but the JavaScript object would remain mutable at runtime. The public value needs both a deep-readonly type and a runtime boundary.

## 3. Install and expose a view

Install the package:

```sh
npm install @nipe-solutions/readonly-view
```

Then create the public view once, beside the private source:

```ts
import { readonlyView } from '@nipe-solutions/readonly-view';

type User = {
    id: string;
    name: string;
};

type ClientEvent = {
    type: 'connected' | 'disconnected';
};

type ClientState = {
    connected: boolean;
    user: User | null;
    events: ClientEvent[];
};

export class Client {
    #state: ClientState = {
        connected: false,
        user: null,
        events: [],
    };

    readonly state = readonlyView(this.#state);

    connect(user: User) {
        this.#state.connected = true;
        this.#state.user = { id: user.id, name: user.name };
        this.#state.events.push({ type: 'connected' });
    }

    disconnect() {
        this.#state.connected = false;
        this.#state.user = null;
        this.#state.events.push({ type: 'disconnected' });
    }
}
```

`readonlyView(this.#state)` does not copy or freeze `#state`. It creates a separate membrane. The `Client` continues to use the ordinary mutable reference, while consumers receive a `DeepReadonly<ClientState>` view whose supported nested values are wrapped lazily.

Notice that `connect` copies the two fields from `user`. That is not required by ReadonlyView; it is a separate input-ownership decision. Without the copy, a caller retaining the original `user` object could change that alias later. A readonly output boundary cannot repair a mutable input alias.

For a richer input graph, validate and copy or normalize the parts the client intends to own.

## 4. Use one stable consumer reference

The view stays live, so consumers do not need to request a replacement after each owner action:

```ts
const client = new Client();
const state = client.state;

console.log(state.connected); // false

client.connect({ id: 'a-1', name: 'Alice' });

console.log(state.connected); // true
console.log(state.user?.name); // 'Alice'
console.log(state.events[0]?.type); // 'connected'
```

The same `state` reference reads the owner’s current graph. If the owner replaces `#state.user`, the next `state.user` read sees the replacement. If the same nested source object is reachable through several paths, one membrane reuses one wrapper, preserving shared identity and cycles.

Liveness is not reactivity. No event is emitted merely because the source changes. Add your SDK’s normal events, observable, callback, or subscription API if consumers need notifications; use the view as the payload or read surface, not as the state lifecycle manager.

## 5. Add consumer-boundary tests

The first test proves both the TypeScript shape and the runtime rejection. This example uses Vitest, but the assertions translate directly to other test runners.

```ts
import { describe, expect, it } from 'vitest';
import { DirectMutationError } from '@nipe-solutions/readonly-view';
import { Client } from './client';

describe('Client public state', () => {
    it('rejects consumer writes through every tested view path', () => {
        const client = new Client();
        client.connect({ id: 'a-1', name: 'Alice' });
        const state = client.state;

        expect(() => {
            // @ts-expect-error public state is readonly
            state.connected = false;
        }).toThrow(DirectMutationError);

        expect(() => {
            // @ts-expect-error nested state is readonly
            state.user!.name = 'Eve';
        }).toThrow(DirectMutationError);

        expect(() => {
            // @ts-expect-error readonly arrays do not expose push
            state.events.push({ type: 'disconnected' });
        }).toThrow(DirectMutationError);

        expect(state.connected).toBe(true);
        expect(state.user?.name).toBe('Alice');
        expect(state.events.map((event) => event.type)).toEqual(['connected']);
    });
});
```

The `@ts-expect-error` comments do two jobs: the type-checking test fails if an assignment unexpectedly becomes legal, while the test runner still executes the emitted JavaScript and checks the runtime error. If your test pipeline separates type tests and runtime tests, keep equivalent cases in both suites.

Use `Reflect.set` when you want a runtime-only assertion without deliberately writing type-invalid source:

```ts
expect(() => Reflect.set(client.state, 'connected', false)).toThrow(
    DirectMutationError,
);
```

Add cases for the shapes your real SDK exposes: array methods, Map and Set mutation methods, nested descriptors, and any custom class behavior at the boundary.

## 6. Add owner-liveness and alias tests

Consumer rejection is only half the contract. The next test proves that legitimate owner operations remain visible through the existing view and that the copied input is no longer a mutable alias:

```ts
import { describe, expect, it } from 'vitest';
import { Client } from './client';

describe('Client-owned updates', () => {
    it('keeps one view live while owner methods update the source', () => {
        const client = new Client();
        const state = client.state;
        const input = { id: 'a-1', name: 'Alice' };

        client.connect(input);

        expect(client.state).toBe(state);
        expect(state.connected).toBe(true);
        expect(state.user).toEqual({ id: 'a-1', name: 'Alice' });
        expect(state.events.map((event) => event.type)).toEqual(['connected']);

        input.name = 'Mallory';
        expect(state.user?.name).toBe('Alice');

        client.disconnect();

        expect(client.state).toBe(state);
        expect(state.connected).toBe(false);
        expect(state.user).toBeNull();
        expect(state.events.map((event) => event.type)).toEqual([
            'connected',
            'disconnected',
        ]);
    });
});
```

These tests state the ownership model more clearly than a generic “is readonly” assertion:

- the public reference stays stable;
- owner methods still work;
- consumer writes through the view do not;
- the SDK does not accidentally retain the tested caller-owned alias.

## 7. Decide what belongs in public state

A runtime membrane still needs a supported value policy. `@nipe-solutions/readonly-view` fully supports primitives, plain and null-prototype objects, arrays and tuples, Map, Set, Date, shared references, cycles, symbols, and accessors. Functions and custom classes have documented receiver and private-field trade-offs.

Several native families are deliberately unsupported, including RegExp, Error, URL, URLSearchParams, ArrayBuffer, SharedArrayBuffer, DataView, typed arrays, WeakMap, WeakSet, and Promise. They contain internal-slot or backing-memory behavior that a generic object Proxy cannot safely make readonly.

An unsupported root throws immediately. An unsupported nested value throws lazily when a consumer reaches it:

```ts
import {
    readonlyView,
    UnsupportedTypeError,
} from '@nipe-solutions/readonly-view';

const state = readonlyView({ matcher: /online/i });

try {
    void state.matcher; // throws only when this nested value is reached
} catch (error) {
    if (!(error instanceof UnsupportedTypeError)) throw error;
}
```

This is useful feedback during SDK design. Convert an unsupported value into an owned plain-data representation, expose an explicit read method, or keep it outside public state. Do not cast the TypeScript type and assume the runtime value became supported.

Check the current [supported-type matrix](https://github.com/NIPE-Solutions/readonly-view/blob/main/docs/supported-types.md) before adding a new public-state field.

## 8. Account for Proxy overhead

Creating a view classifies and wraps the root; it does not walk the entire state graph. The first read of a supported nested object creates its proxy, and later reads in the same membrane reuse that identity.

Laziness avoids eager copying, but every mediated read still has Proxy overhead. Collection adapters and protected iterators also allocate results. Keep the boundary at an API edge rather than wrapping and rewrapping values inside a hot inner loop, and benchmark the access patterns that matter to your SDK. Do not infer application-level performance from bundle size or a synthetic ratio.

If consumers read a small stable projection at very high frequency, an explicit getter or selector may be simpler and avoid repeated Proxy access. The goal is a clear ownership boundary, not using a membrane everywhere.

## 9. State the trust boundary in your API docs

Document these points beside the public state property:

1. **The view is not the source.** Writes through supported view paths throw, but the owner can continue to mutate its private reference.
2. **Other aliases still matter.** Anyone holding a source or retained input reference can use that reference. Copy or normalize inputs when the SDK needs exclusive ownership.
3. **Functions and getters are code.** They may close over mutable values or cause external side effects. A readonly receiver does not make arbitrary code pure.
4. **Consumer proxies are trusted inputs.** Their traps may execute while the membrane interacts with them.
5. **This is not hostile-code isolation.** Use an appropriate process, realm, worker, permission, or protocol boundary for untrusted code.

That language prevents “runtime readonly” from being mistaken for a broader security guarantee.

## 10. Know when to choose another shape

This `Client` pattern fits when the SDK is the clear owner, the data must stay live, and consumers benefit from inspecting a graph through a stable reference.

Choose a different approach when:

- a response should capture one point in time—return a snapshot;
- each update should produce a new state version—use an immutable-update workflow;
- the entire graph should become immutable for the owner too—deep-freeze it;
- consumers need notification and lifecycle behavior—add a subscription or state-management mechanism;
- the public API can be smaller—prefer explicit query methods or selectors;
- consumers are hostile—use an isolation boundary rather than an object Proxy.

## The completed boundary

The final design is deliberately small:

```text
Client methods ──mutate──▶ private #state
                               │
                          readonlyView()
                               │
Application ◀────reads──── client.state
```

One owner keeps ordinary mutation authority. Consumers receive a lazy, live, deeply readonly access path for supported values. Tests cover both sides of that contract, and input handling closes aliases that the output membrane cannot control.

Read the complete [ownership model](https://github.com/NIPE-Solutions/readonly-view/blob/main/docs/mental-model.md), try the [documentation site](https://readonly-view.nipesolutions.com/), or inspect the [repository and tests](https://github.com/NIPE-Solutions/readonly-view). The package used in this tutorial is `@nipe-solutions/readonly-view`.
