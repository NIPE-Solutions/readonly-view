import { describe, expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

describe('custom methods on supported native values', () => {
    it('does not expose Date custom properties or a mutable receiver', () => {
        const source = Object.assign(new Date(0), {
            child: { value: 1 },
            advance(this: Date) {
                Date.prototype.setTime.call(this, 100);
            },
        });
        const view = readonlyView(source) as unknown as {
            readonly child: { readonly value: number };
            advance(): void;
        };

        expect(view.child).not.toBe(source.child);
        expect(() => view.advance()).toThrow();
        expect(source.getTime()).toBe(0);
        expect(() => Reflect.set(view.child, 'value', 2)).toThrow(
            DirectMutationError,
        );
    });

    it.each([
        [
            'Map',
            new Map<string, number>(),
            function (this: Map<string, number>) {
                this.set('unsafe', 1);
            },
        ],
        [
            'Set',
            new Set<string>(),
            function (this: Set<string>) {
                this.add('unsafe');
            },
        ],
    ] as const)(
        'does not give a custom %s method the source',
        (_, source, mutate) => {
            const value = Object.assign(source, { mutate });
            const view = readonlyView(value) as unknown as { mutate(): void };

            expect(() => view.mutate()).toThrow();
            expect(source.size).toBe(0);
        },
    );
});
