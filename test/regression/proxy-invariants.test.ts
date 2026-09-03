import { describe, expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

describe('Proxy invariant regressions', () => {
    it.each([
        ['frozen', Object.freeze({ child: { mutable: true } })],
        ['sealed', Object.seal({ child: { mutable: true } })],
        [
            'non-extensible',
            Object.preventExtensions({ child: { mutable: true } }),
        ],
    ] as const)('reads nested values from %s sources', (_label, source) => {
        const child = source.child;
        const view = readonlyView(source);

        expect(view.child.mutable).toBe(true);
        expect(view.child).not.toBe(child);
        expect(() => Reflect.set(view.child, 'mutable', false)).toThrow(
            DirectMutationError,
        );
        expect(child.mutable).toBe(true);
    });

    it('does not leak a non-configurable non-writable child', () => {
        const child = { mutable: true };
        const source = {};
        Object.defineProperty(source, 'child', {
            configurable: false,
            enumerable: true,
            value: child,
            writable: false,
        });

        const view = readonlyView(source) as Readonly<{
            child: Readonly<{ mutable: boolean }>;
        }>;
        const descriptor = Object.getOwnPropertyDescriptor(view, 'child');

        expect(() => view.child).not.toThrow();
        expect(view.child).not.toBe(child);
        expect(descriptor?.value).toBe(view.child);
        expect(descriptor?.configurable).toBe(true);
    });

    it('keeps the shadow extensible and rejects attempts to change it', () => {
        const source = Object.preventExtensions({ value: 1 });
        const view = readonlyView(source);

        expect(Object.isExtensible(view)).toBe(true);
        expect(() => Object.preventExtensions(view)).toThrow(
            DirectMutationError,
        );
        expect(Object.isExtensible(view)).toBe(true);
    });

    it('rejects every generic reflective mutation route', () => {
        const view = readonlyView({ value: 1 });

        expect(() => Reflect.set(view, 'value', 2)).toThrow(
            DirectMutationError,
        );
        expect(() => Reflect.deleteProperty(view, 'value')).toThrow(
            DirectMutationError,
        );
        expect(() =>
            Reflect.defineProperty(view, 'value', { value: 2 }),
        ).toThrow(DirectMutationError);
        expect(() => Object.assign(view, { value: 2 })).toThrow(
            DirectMutationError,
        );
        expect(() => {
            Object.setPrototypeOf(view, null);
        }).toThrow(DirectMutationError);
    });
});
