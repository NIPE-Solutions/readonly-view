import { describe, expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

describe('array mutation escapes', () => {
    it('rejects index, length, and deletion writes', () => {
        const source = [{ value: 1 }, { value: 2 }];
        const view = readonlyView(source);

        expect(() => Reflect.set(view, '0', { value: 3 })).toThrow(
            DirectMutationError,
        );
        expect(() => Reflect.set(view, 'length', 0)).toThrow(
            DirectMutationError,
        );
        expect(() => Reflect.deleteProperty(view, '0')).toThrow(
            DirectMutationError,
        );
        expect(source).toEqual([{ value: 1 }, { value: 2 }]);
    });

    it.each([
        [
            'copyWithin',
            (view: readonly number[]) => (view as number[]).copyWithin(0, 1),
        ],
        ['fill', (view: readonly number[]) => (view as number[]).fill(0)],
        ['pop', (view: readonly number[]) => (view as number[]).pop()],
        ['push', (view: readonly number[]) => (view as number[]).push(3)],
        ['reverse', (view: readonly number[]) => (view as number[]).reverse()],
        ['shift', (view: readonly number[]) => (view as number[]).shift()],
        ['sort', (view: readonly number[]) => (view as number[]).sort()],
        [
            'splice',
            (view: readonly number[]) => (view as number[]).splice(0, 1),
        ],
        ['unshift', (view: readonly number[]) => (view as number[]).unshift(0)],
    ] as const)('rejects %s', (_name, mutate) => {
        const source = [1, 2];
        const view = readonlyView(source);

        expect(() => mutate(view)).toThrow(DirectMutationError);
        expect(source).toEqual([1, 2]);
    });
});
