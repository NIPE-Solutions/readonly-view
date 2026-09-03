import { expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

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
