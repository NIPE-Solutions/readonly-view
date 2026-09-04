# ReadonlyView

Expose live internal data without exposing mutation. [ReadonlyView on npm](https://www.npmjs.com/package/@nipe-solutions/readonly-view) is a lazy, live, deeply readonly runtime membrane for TypeScript; it is not a state manager, clone, frozen snapshot, or mutation API. Read the [documentation](https://readonly-view.nipesolutions.com) or browse the [source on GitHub](https://github.com/NIPE-Solutions/readonly-view).

```ts
import {
    DirectMutationError,
    readonlyView,
} from '@nipe-solutions/readonly-view';

function rejectsDirectMutation(action: () => void) {
    try {
        action();
    } catch (error) {
        if (error instanceof DirectMutationError) return;
        throw error;
    }
    throw new Error('Expected DirectMutationError');
}

const source = { user: { name: 'Alice', roles: ['admin'] } };
const view = readonlyView(source);

rejectsDirectMutation(() => {
    // @ts-expect-error readonly view
    view.user.name = 'Eve';
});
source.user.name = 'Bob';
console.log(view.user.name); // Bob
```

## Install

```bash
npm install @nipe-solutions/readonly-view
pnpm add @nipe-solutions/readonly-view
yarn add @nipe-solutions/readonly-view
bun add @nipe-solutions/readonly-view
```

Requires Node.js 22 or 24, or a current evergreen browser.

## Why this exists (SDK)

SDKs often own mutable connection state but should not let consumers rewrite it through the public view. Keep the state private and publish a view; it gives consumers no new mutation path.

```ts
import {
    DirectMutationError,
    readonlyView,
} from '@nipe-solutions/readonly-view';

function rejectsDirectMutation(action: () => void) {
    try {
        action();
    } catch (error) {
        if (error instanceof DirectMutationError) return;
        throw error;
    }
    throw new Error('Expected DirectMutationError');
}

class Client {
    #state = { connected: false, user: null as { name: string } | null };
    readonly state = readonlyView(this.#state);

    connect(user: { name: string }) {
        this.#state.connected = true;
        this.#state.user = user;
    }
}

const client = new Client();
const state = client.state;
client.connect({ name: 'Alice' });

rejectsDirectMutation(() => {
    // @ts-expect-error readonly SDK state
    state.user!.name = 'Eve';
});
console.log(state.connected); // true: the view stays live after rejection
```

ReadonlyView only removes mutation capability from the view. The owner must still control other mutable aliases: `connect(user)` above preserves the supplied object reference, so a consumer that retains `user` can still mutate it. Copy or normalize inputs when that is not acceptable.

## Use ReadonlyView when

Use it at an ownership boundary: an SDK publishes public state, a registry exposes its entries, or a host gives plugins context. Consumers can read live data without gaining a mutation path through the view; the owner must control any other mutable aliases.

```ts
import {
    DirectMutationError,
    readonlyView,
} from '@nipe-solutions/readonly-view';

function rejectsDirectMutation(action: () => void) {
    try {
        action();
    } catch (error) {
        if (error instanceof DirectMutationError) return;
        throw error;
    }
    throw new Error('Expected DirectMutationError');
}

class Registry {
    #entries = new Map<string, { name: string }>();
    readonly entries = readonlyView(this.#entries);

    register(key: string, value: { name: string }) {
        this.#entries.set(key, value);
    }
}

const registry = new Registry();
registry.register('primary', { name: 'Alice' });
rejectsDirectMutation(() => {
    // @ts-expect-error readonly registry Map
    registry.entries.set('next', { name: 'Eve' });
});
console.log(registry.entries.get('primary')?.name); // Alice
```

```ts
import {
    DirectMutationError,
    readonlyView,
    type DeepReadonly,
} from '@nipe-solutions/readonly-view';

function rejectsDirectMutation(action: () => void) {
    try {
        action();
    } catch (error) {
        if (error instanceof DirectMutationError) return;
        throw error;
    }
    throw new Error('Expected DirectMutationError');
}

type PluginContext = { configuration: { retries: number } };

function initialize(context: DeepReadonly<PluginContext>) {
    console.log(context.configuration.retries);
    rejectsDirectMutation(() => {
        // @ts-expect-error readonly nested plugin configuration
        context.configuration.retries = 5;
    });
    console.log(context.configuration.retries); // 3
}

const source: PluginContext = { configuration: { retries: 3 } };
initialize(readonlyView(source));
```

## Comparison

| Capability              | TypeScript `readonly` | `Object.freeze`            | Deep freeze          | Snapshot / Immer        | ReadonlyView    |
| ----------------------- | --------------------- | -------------------------- | -------------------- | ----------------------- | --------------- |
| Compile-time protection | Yes, where typed      | No                         | No                   | Optional types          | Yes             |
| Runtime depth           | None                  | Shallow                    | Deep                 | Snapshot/draft-specific | Deep            |
| Owner retains mutation  | Yes                   | Top-level no; nested yes   | No                   | Yes, on original        | Yes             |
| Live owner updates      | Yes                   | Nested updates remain live | N/A: owner is frozen | No: new snapshot/state  | Yes             |
| Traversal/copying       | None                  | None                       | Eager traversal      | Produces/copies state   | Lazy, on access |
| New-state production    | No                    | No                         | No                   | Yes                     | No              |

These tools solve different problems. Immer produces new state through convenient mutations; ReadonlyView exposes existing owner-controlled data without granting mutation through the view.

## Ownership mental model

`source` is owned by the library, host, or state container. `readonlyView(source)` gives a consumer a separate capability: read the same live graph. Owner writes are visible through the view; any write through the view is rejected. It does not make the source immutable or revoke mutable aliases the consumer already holds.

## Guarantees

- Writes through the view throw `DirectMutationError`.
- Supported nested values are protected lazily.
- The source is never intentionally changed, frozen, sealed, or eagerly traversed.
- Owner-side changes remain visible.
- Shared references and cycles preserve identity inside one membrane.
- Unsupported built-ins throw `UnsupportedTypeError`.

See [guarantees and non-guarantees](docs/guarantees.md).

## Supported values

Fully supported: primitives, plain/null-prototype objects, arrays/tuples, Map, Set, Date, symbols, accessors, shared references, and cycles. Functions and custom classes have documented receiver/private-field semantics. Mutable native buffers, typed arrays, weak collections, Promise, RegExp, Error, URL, and URLSearchParams are rejected. See the [support matrix](docs/supported-types.md).

## When not to use it

Do not use ReadonlyView when you need immutable snapshots, structural sharing with new-state production, or a mechanism to prevent the owner from mutating data. Use a snapshot, persistent data structure, deep freeze, or a state-management tool designed for that job instead.

## Performance

Initial wrapping creates one proxy and does not walk the graph. Nested proxies are created on access and reused through WeakMaps. Proxy reads still have overhead. See [performance](docs/performance.md) and [benchmarks](benchmarks/README.md).

## API

- `readonlyView<T>(source: T): DeepReadonly<T>` creates an independent membrane. Primitives return unchanged; an existing view is returned unchanged.
- `isReadonlyView(value: unknown): boolean` recognizes ReadonlyView proxies.
- `DirectMutationError` exposes `operation`, optional `property`, and `objectKind`.
- `UnsupportedTypeError` exposes `kind`.
- `DeepReadonly<T>` models the runtime readonly contract recursively.

## Documentation

[Documentation site](https://readonly-view.nipesolutions.com) · [Architecture](docs/architecture.md) · [API](docs/api.md) · [Supported types](docs/supported-types.md) · [Compatibility](docs/compatibility.md) · [Migration](docs/migration-v1-v2.md) · [Security](docs/security-and-trust.md) · [Contributing](CONTRIBUTING.md)

## License

MIT
