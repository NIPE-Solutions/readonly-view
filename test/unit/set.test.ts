import { describe, expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

describe('Set', () => {
    it('reads live wrapped values and supports view lookup', () => {
        const value = { value: 1 };
        const source = new Set([value]);
        const view = readonlyView(source);
        const viewValue = [...view][0]!;

        expect(view.size).toBe(1);
        expect(viewValue).not.toBe(value);
        expect(view.has(value)).toBe(true);
        expect(view.has(viewValue)).toBe(true);
        expect([...view.entries()][0]).toEqual([viewValue, viewValue]);

        source.add({ value: 2 });
        expect(view.size).toBe(2);
    });

    it('wraps forEach values and rejects mutation', () => {
        const source = new Set([{ value: 1 }]);
        const view = readonlyView(source);
        view.forEach((value, secondValue, set) => {
            expect(value).toBe(secondValue);
            expect(value).toBe([...view][0]);
            expect(set).toBe(view);
        });

        expect(() => (view as Set<object>).add({})).toThrow(
            DirectMutationError,
        );
        expect(() => (view as Set<object>).delete({})).toThrow(
            DirectMutationError,
        );
        expect(() => (view as Set<object>).clear()).toThrow(
            DirectMutationError,
        );
        expect(source.size).toBe(1);
    });

    it('supports the native forEach thisArg', () => {
        const token = {};
        const view = readonlyView(new Set([1]));
        let called = false;

        view.forEach(function (this: unknown) {
            expect(this).toBe(token);
            called = true;
        }, token);

        expect(called).toBe(true);
    });
});
