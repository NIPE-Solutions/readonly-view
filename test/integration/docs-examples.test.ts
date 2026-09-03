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
