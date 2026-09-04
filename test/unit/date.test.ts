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

    it.each([
        ['toJSON', 'toISOString', 'toJSON', [], 'mutated', 1],
        [
            'Symbol.toPrimitive(number)',
            'valueOf',
            Symbol.toPrimitive,
            ['number'],
            2,
            2,
        ],
        [
            'Symbol.toPrimitive(string)',
            'toString',
            Symbol.toPrimitive,
            ['string'],
            'mutated',
            3,
        ],
    ] as const)(
        '%s does not give an own %s override the mutable source',
        (_, overrideName, methodName, arguments_, returnValue, mutatedTime) => {
            const source = new Date(0);
            Object.defineProperty(source, overrideName, {
                configurable: true,
                value(this: Date) {
                    this.setTime(mutatedTime);
                    return returnValue;
                },
            });
            const view = readonlyView(source);
            const method: unknown = Reflect.get(view, methodName);

            expect(typeof method).toBe('function');
            expect(() => {
                Reflect.apply(
                    method as (...arguments_: unknown[]) => unknown,
                    view,
                    arguments_,
                );
            }).toThrow(DirectMutationError);
            expect(source.getTime()).toBe(0);
        },
    );
});
