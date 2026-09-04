# Use cases

Use ReadonlyView when an owner must publish **live** state for consumers to inspect, while retaining the only intended mutation path. It is especially useful at public API, plugin, and subsystem boundaries.

The examples below use a small helper so the expected runtime rejection is explicit.

```ts
import { DirectMutationError } from '@nipe-solutions/readonly-view';

function rejectsDirectMutation(action: () => void) {
    try {
        action();
    } catch (error) {
        if (error instanceof DirectMutationError) return;
        throw error;
    }
    throw new Error('Expected DirectMutationError');
}
```

## SDK public state

- **Owner:** the SDK.
- **Consumer:** the application using it.
- **Why a clone becomes stale:** connection state can change when the SDK connects, disconnects, or receives new data.
- **Allowed owner mutation:** the SDK changes its private state through methods such as `connect`.
- **Rejected consumer mutation:** application code cannot change public state through `state`.

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
        this.#state.connected = true; // allowed owner mutation
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
console.log(state.connected); // true: the existing view stays live
```

`connect(user)` deliberately preserves the supplied object reference. That means a consumer retaining `user` can still mutate that separate alias. ReadonlyView closes the public `state` path; it does not fix input ownership by itself.

## Internal registry

- **Owner:** the registry.
- **Consumer:** code that searches or renders registered entries.
- **Why a clone becomes stale:** the next registration changes the `Map`.
- **Allowed owner mutation:** the registry adds entries through `register`.
- **Rejected consumer mutation:** consumers cannot call mutating `Map` methods through `entries`.

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
        this.#entries.set(key, value); // allowed owner mutation
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

## Plugin context

- **Owner:** the host.
- **Consumer:** a plugin.
- **Why a clone becomes stale:** it stops reflecting host-side configuration changes.
- **Allowed owner mutation:** the host updates its source configuration.
- **Rejected consumer mutation:** plugin code cannot mutate nested settings through its context.

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

class Plugin {
    #context: DeepReadonly<PluginContext> = readonlyView({
        configuration: { retries: 0 },
    });

    initialize(context: DeepReadonly<PluginContext>) {
        this.#context = context;
    }

    retries() {
        return this.#context.configuration.retries;
    }

    configureRetries(retries: number) {
        return Reflect.set(this.#context.configuration, 'retries', retries);
    }
}

const source: PluginContext = { configuration: { retries: 3 } };
const plugin = new Plugin();
plugin.initialize(readonlyView(source));
console.log(plugin.retries()); // 3

source.configuration.retries = 4; // allowed host-side mutation
console.log(plugin.retries()); // 4: the retained context stays live

rejectsDirectMutation(() => plugin.configureRetries(5));
console.log(plugin.retries()); // 4: the rejected plugin update preserves it
```

## Other good fits

### Response caches

A client or service owns a response cache while middleware and diagnostics inspect it. A cache snapshot is stale after a revalidation or eviction; publish a view when consumers need current entries but must not alter cache contents.

### Configuration managers

A configuration manager owns the active, resolved configuration while components read it. A clone becomes stale after a reload or a feature-flag change. Keep updates in the manager and expose a view to components.

### Engine state

An engine owns its current scene, document, or session graph while renderers and tools inspect it. A snapshot is the wrong surface when those tools must see the next owner-driven tick without receiving write capability.

### Diagnostic state

A long-lived service owns counters, status, or recent events while support tooling reads them. Views let diagnostics see changes as they happen without turning observability into a mutation API.

## When not to use ReadonlyView

Do not use ReadonlyView when you need an immutable point-in-time snapshot, structural sharing and new-state production, subscriptions or state lifecycle features, or a way to stop the owner from mutating data. Use snapshots, persistent/immutable data structures, deep freeze, or a state-management tool designed for those needs. It is also not a security sandbox: see the [security and trust model](security-and-trust.md).
