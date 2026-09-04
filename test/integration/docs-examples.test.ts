import { expect, it } from 'vitest';
import {
    DirectMutationError,
    readonlyView,
    type DeepReadonly,
} from '../../src/index';

class Client {
    #state = { connected: false, user: null as { name: string } | null };
    readonly state = readonlyView(this.#state);

    connect(user: { name: string }) {
        this.#state.connected = true;
        this.#state.user = user;
    }
}

class Registry {
    #entries = new Map<string, { name: string }>();
    readonly entries = readonlyView(this.#entries);

    register(key: string, value: { name: string }) {
        this.#entries.set(key, value);
    }
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

function rejectsDirectMutation(action: () => void) {
    try {
        action();
    } catch (error) {
        if (error instanceof DirectMutationError) return;
        throw error;
    }
    throw new Error('Expected DirectMutationError');
}

it('matches the primary ownership example', () => {
    const source = { user: { name: 'Alice', roles: ['admin'] } };
    const view = readonlyView(source);

    expect(() => Reflect.set(view.user, 'name', 'Eve')).toThrow(
        DirectMutationError,
    );
    expect(() => (view.user.roles as string[]).push('editor')).toThrow(
        DirectMutationError,
    );

    source.user.name = 'Bob';
    source.user.roles.push('editor');
    expect(view.user).toEqual({ name: 'Bob', roles: ['admin', 'editor'] });
});

it('matches the standalone owner-side live updates example', () => {
    const source = { user: { name: 'Alice' } };
    const view = readonlyView(source);

    source.user.name = 'Bob';

    expect(view.user.name).toBe('Bob');
});

it('matches the standalone mutation rejection example', () => {
    const source = { item: { id: 1 } };
    const view = readonlyView(source);

    let errorName: string | undefined;
    try {
        Reflect.set(view.item, 'id', 2);
    } catch (error) {
        if (error instanceof DirectMutationError) {
            errorName = error.name;
        } else {
            throw error;
        }
    }

    expect(errorName).toBe('DirectMutationError');
    expect(source.item.id).toBe(1);
});

it('keeps array, Map, Set, and Date reads live while rejecting writes', () => {
    const source = {
        items: [{ id: 1 }],
        map: new Map([['selected', { id: 1 }]]),
        set: new Set([{ id: 1 }]),
        updatedAt: new Date('2026-09-03T00:00:00.000Z'),
    };
    const view = readonlyView(source);

    source.items.push({ id: 2 });
    source.map.set('next', { id: 2 });
    source.set.add({ id: 2 });
    source.updatedAt.setUTCDate(4);

    expect(view.items.map((item) => item.id)).toEqual([1, 2]);
    expect(view.map.get('next')?.id).toBe(2);
    expect([...view.set].map((item) => item.id)).toEqual([1, 2]);
    expect(view.updatedAt.toISOString()).toBe('2026-09-04T00:00:00.000Z');
    expect(() => (view.items as { id: number }[]).push({ id: 3 })).toThrow(
        DirectMutationError,
    );
    expect(() => (view.map as Map<string, { id: number }>).clear()).toThrow(
        DirectMutationError,
    );
    expect(() => (view.set as Set<{ id: number }>).clear()).toThrow(
        DirectMutationError,
    );
    expect(() => (view.updatedAt as Date).setUTCDate(5)).toThrow(
        DirectMutationError,
    );
});

it('preserves cycles in a readonly view', () => {
    type Node = { label: string; self?: Node };
    const source: Node = { label: 'root' };
    source.self = source;

    const view = readonlyView(source);

    expect(view.self).toBe(view);
    expect(() => Reflect.set(view.self!, 'label', 'changed')).toThrow(
        DirectMutationError,
    );
});

it('preserves shared identity across objects and collections', () => {
    const shared = { id: 1 };
    const source = {
        items: [shared],
        map: new Map([['selected', shared]]),
        set: new Set([shared]),
    };
    const view = readonlyView(source);

    expect(view.items[0]).toBe(view.map.get('selected'));
    expect([...view.set][0]).toBe(view.items[0]);
    expect(() => Reflect.set(view.items[0]!, 'id', 2)).toThrow(
        DirectMutationError,
    );
});

it('matches the SDK public state example and its retained-alias limit', () => {
    const client = new Client();
    const view = client.state;
    const user = { name: 'Alice' };

    client.connect(user);
    user.name = 'Bob';
    const sourceUserSnapshot = { ...user };

    expect(view.connected).toBe(true);
    expect(view.user).toEqual({ name: 'Bob' });
    rejectsDirectMutation(() => {
        Reflect.set(view.user!, 'name', 'Eve');
    });
    expect(user).toEqual(sourceUserSnapshot);
});

it('matches the registry read-only Map example', () => {
    const registry = new Registry();
    const view = registry.entries;

    registry.register('primary', { name: 'Alice' });

    expect([...view.entries()]).toEqual([['primary', { name: 'Alice' }]]);
    const entriesBeforeRejection = [...view.entries()];
    rejectsDirectMutation(() =>
        (view as Map<string, { name: string }>).set('next', { name: 'Eve' }),
    );
    expect([...view.entries()]).toEqual(entriesBeforeRejection);
    expect([...registry.entries.entries()]).toEqual(entriesBeforeRejection);
});

it('matches the plugin read-only context example', () => {
    const source: PluginContext = { configuration: { retries: 3 } };
    const plugin = new Plugin();
    const context = readonlyView(source);

    plugin.initialize(context);

    expect(plugin.retries()).toBe(3);
    source.configuration.retries = 4;
    expect(plugin.retries()).toBe(4);

    rejectsDirectMutation(() => plugin.configureRetries(5));
    expect(source.configuration.retries).toBe(4);
    expect(plugin.retries()).toBe(4);
});
