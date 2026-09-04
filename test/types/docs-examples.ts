import { readonlyView, type DeepReadonly } from '../../src/index';

const source = { user: { name: 'Alice', roles: ['admin'] } };
const view = readonlyView(source);

// @ts-expect-error readonly property
view.user.name = 'Bob';
// @ts-expect-error readonly array
view.user.roles.push('editor');

source.user.name = 'Bob';

class Client {
    #state = { connected: false, user: null as { name: string } | null };
    readonly state = readonlyView(this.#state);

    connect(user: { name: string }) {
        this.#state.connected = true;
        this.#state.user = user;
    }
}

const client = new Client();
client.connect({ name: 'Alice' });
client.state.connected;
client.state.user?.name;

// @ts-expect-error readonly SDK state
client.state.connected = false;

class Registry {
    #entries = new Map<string, { name: string }>();
    readonly entries = readonlyView(this.#entries);

    register(key: string, value: { name: string }) {
        this.#entries.set(key, value);
    }
}

const registry = new Registry();
registry.register('primary', { name: 'Alice' });
registry.entries.get('primary')?.name;

// @ts-expect-error readonly registry Map
registry.entries.set('next', { name: 'Eve' });

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
}

const pluginSource: PluginContext = { configuration: { retries: 3 } };
const pluginContext = readonlyView(pluginSource);
const plugin = new Plugin();
plugin.initialize(pluginContext);
plugin.retries(); // 3

pluginSource.configuration.retries = 4;
plugin.retries(); // 4: the retained plugin context stays live

// @ts-expect-error readonly nested plugin configuration
pluginContext.configuration.retries = 5;

plugin.retries(); // 4: the rejected consumer update preserves the owner value
