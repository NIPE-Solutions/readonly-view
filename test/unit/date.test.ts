import { describe, expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

describe('Date', () => {
    it('supports reads and live source mutation', () => {
        const source = new Date('2024-01-02T03:04:05.006Z');
        const view = readonlyView(source);

        expect(view.getTime()).toBe(source.getTime());
        expect(view.getUTCFullYear()).toBe(2024);
        expect(view.toISOString()).toBe('2024-01-02T03:04:05.006Z');
        expect(view.toJSON()).toBe('2024-01-02T03:04:05.006Z');

        source.setUTCFullYear(2025);
        expect(view.getUTCFullYear()).toBe(2025);
    });

    it('rejects all available setter methods', () => {
        const source = new Date(0);
        const view = readonlyView(source);
        const setters = Object.getOwnPropertyNames(Date.prototype).filter(
            (name) => name.startsWith('set'),
        );

        for (const setter of setters) {
            expect(() =>
                Reflect.apply(
                    Reflect.get(view, setter) as (
                        ...arguments_: unknown[]
                    ) => unknown,
                    view,
                    [1],
                ),
            ).toThrow(DirectMutationError);
        }
        expect(source.getTime()).toBe(0);
    });
});
