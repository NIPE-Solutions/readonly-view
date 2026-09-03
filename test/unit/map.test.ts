import { describe, expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

describe('Map', () => {
    it('reads live wrapped keys and values', () => {
        const key = { id: 1 };
        const value = { value: 1 };
        const source = new Map<object | string, { value: number }>([
            [key, value],
        ]);
        const view = readonlyView(source);

        expect(view.size).toBe(1);
        const viewKey = [...view.keys()][0]!;
        expect(viewKey).not.toBe(key);
        expect(view.get(key)).not.toBe(value);
        expect(view.get(viewKey)).toBe([...view.values()][0]);
        expect([...view.entries()][0]).toEqual([viewKey, view.get(key)]);

        source.set('next', { value: 2 });
        expect(view.get('next')?.value).toBe(2);
    });

    it('wraps forEach arguments and rejects mutation', () => {
        const value = { value: 1 };
        const source = new Map([['key', value]]);
        const view = readonlyView(source);
        let seen: unknown;
        view.forEach((entryValue, key, map) => {
            seen = entryValue;
            expect(key).toBe('key');
            expect(map).toBe(view);
        });

        expect(seen).toBe(view.get('key'));
        expect(() => (view as Map<string, object>).set('x', {})).toThrow(
            DirectMutationError,
        );
        expect(() => (view as Map<string, object>).delete('key')).toThrow(
            DirectMutationError,
        );
        expect(() => (view as Map<string, object>).clear()).toThrow(
            DirectMutationError,
        );
        expect(source.size).toBe(1);
    });
});
