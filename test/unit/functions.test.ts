import { describe, expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

describe('functions and methods', () => {
    it('uses the readonly receiver for methods', () => {
        const source = {
            count: 1,
            increment() {
                this.count += 1;
            },
            read() {
                return this.count;
            },
        };
        const view = readonlyView(source);

        expect(view.read()).toBe(1);
        expect(() => view.increment()).toThrow(DirectMutationError);
        expect(source.count).toBe(1);
        expect(view.read).toBe(view.read);
    });

    it('wraps function return values and owned properties', () => {
        const child = { value: 1 };
        const sourceFunction = Object.assign(() => child, { child });
        const view = readonlyView(sourceFunction);

        expect(view()).toBe(view.child);
        expect(view.child).not.toBe(child);
        expect(() => Reflect.set(view.child, 'value', 2)).toThrow(
            DirectMutationError,
        );
    });

    it('cannot prevent side effects through captured mutable references', () => {
        const source = { count: 0, mutate: () => undefined };
        source.mutate = () => {
            source.count += 1;
        };
        const view = readonlyView(source);

        view.mutate();
        expect(source.count).toBe(1);
    });
});
