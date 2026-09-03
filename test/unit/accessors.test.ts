import { describe, expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

describe('accessors', () => {
    it('runs getters with the readonly receiver and wraps results', () => {
        const source = {
            child: { value: 1 },
            get result() {
                return this.child;
            },
        };
        const view = readonlyView(source);

        expect(view.result).toBe(view.child);
        expect(() => Reflect.set(view.result, 'value', 2)).toThrow(
            DirectMutationError,
        );
    });

    it('blocks setters through properties and reflected descriptors', () => {
        const source = {
            value: 1,
            set changed(value: number) {
                this.value = value;
            },
        };
        const view = readonlyView(source);
        const descriptor = Object.getOwnPropertyDescriptor(view, 'changed');

        expect(() => Reflect.set(view, 'changed', 2)).toThrow(
            DirectMutationError,
        );
        expect(() => descriptor?.set?.call(view, 2)).toThrow(
            DirectMutationError,
        );
        expect(source.value).toBe(1);
    });
});
