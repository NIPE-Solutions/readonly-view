import { describe, expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

type FutureMap = Map<object, object> & {
    getOrInsert(key: object, defaultValue: object): object;
    getOrInsertComputed(key: object, callback: (key: object) => object): object;
};

describe('future Map mutators', () => {
    it.each(['getOrInsert', 'getOrInsertComputed'] as const)(
        'blocks %s before a source-prototype shim executes',
        (methodName) => {
            const retainedKey = { id: 'retained' };
            const retainedValue = { value: 1 };
            const source = new Map<object, object>([
                [retainedKey, retainedValue],
            ]);
            const sourcePrototype = Object.create(Map.prototype) as Map<
                object,
                object
            >;
            let called = false;

            Object.defineProperty(sourcePrototype, methodName, {
                configurable: true,
                value(this: Map<object, object>, key: object) {
                    called = true;
                    const inserted = { unsafe: true };
                    this.set(key, inserted);
                    return inserted;
                },
            });
            Object.setPrototypeOf(source, sourcePrototype);

            const view = readonlyView(source) as unknown as FutureMap;
            const snapshot = [...source];
            const invoke =
                methodName === 'getOrInsert'
                    ? () => view.getOrInsert({}, {})
                    : () => view.getOrInsertComputed({}, () => ({}));

            expect(invoke).toThrow(DirectMutationError);
            expect(called).toBe(false);
            expect([...source]).toEqual(snapshot);
        },
    );
});
