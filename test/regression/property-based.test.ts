import fc from 'fast-check';
import { expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

it('preserves sources for generated nested object and array graphs', () => {
    fc.assert(
        fc.property(
            fc.array(fc.dictionary(fc.string(), fc.integer()), {
                maxLength: 20,
            }),
            (items) => {
                const snapshot = structuredClone(items);
                const view = readonlyView(items);

                expect(Array.isArray(view)).toBe(true);
                const first = view[0];
                if (first !== undefined) {
                    expect(() => Reflect.set(first, 'generated', true)).toThrow(
                        DirectMutationError,
                    );
                }
                expect(items).toEqual(snapshot);
            },
        ),
        { numRuns: 100 },
    );
});
