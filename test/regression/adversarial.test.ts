import { describe, expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

describe('adversarial exposure routes', () => {
    it('protects values from properties descriptors collections and iteration', () => {
        const shared = { value: 1 };
        const view = readonlyView({
            direct: shared,
            array: [shared],
            map: new Map([['x', shared]]),
            set: new Set([shared]),
            get getter() {
                return shared;
            },
        });
        const exposed = [
            view.direct,
            view.array[0],
            view.map.get('x'),
            [...view.set][0],
            view.getter,
            Object.values(view)[0],
            Object.entries(view)[0]?.[1],
            Object.getOwnPropertyDescriptor(view, 'direct')?.value,
        ];

        for (const value of exposed) {
            expect(value).toBe(view.direct);
            expect(() => Reflect.set(value as object, 'value', 2)).toThrow(
                DirectMutationError,
            );
        }
        expect(shared.value).toBe(1);
    });
});
