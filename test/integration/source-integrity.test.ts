import { describe, expect, it } from 'vitest';
import { readonlyView } from '../../src/index';

describe('source integrity', () => {
    it('does not alter descriptors, prototype, extensibility, or nested values', () => {
        const symbol = Symbol('metadata');
        const prototype = { inherited: true };
        const child = { value: 1 };
        const source = Object.create(prototype) as {
            child: { value: number };
            [symbol]: { enabled: boolean };
        };
        Object.defineProperties(source, {
            child: {
                configurable: false,
                enumerable: true,
                value: child,
                writable: false,
            },
            [symbol]: {
                configurable: true,
                enumerable: false,
                value: { enabled: true },
                writable: true,
            },
        });

        const beforeDescriptors = Object.getOwnPropertyDescriptors(source);
        const beforePrototype = Object.getPrototypeOf(source) as object | null;
        const beforeExtensible = Object.isExtensible(source);

        const view = readonlyView(source);
        void view.child.value;
        void view[symbol].enabled;
        Object.keys(view);
        Object.getOwnPropertyDescriptors(view);

        expect(Object.getOwnPropertyDescriptors(source)).toEqual(
            beforeDescriptors,
        );
        expect(Object.getPrototypeOf(source)).toBe(beforePrototype);
        expect(Object.isExtensible(source)).toBe(beforeExtensible);
        expect(source.child).toBe(child);
    });
});
