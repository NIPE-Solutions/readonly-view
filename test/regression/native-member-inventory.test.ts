import { describe, expect, it } from 'vitest';
import { UnsupportedTypeError, readonlyView } from '../../src/index';
import { nativeMemberKind, type NativeKind } from '../../src/native-members';

function assertNativeInventory(kind: NativeKind, prototype: object): void {
    for (const property of Reflect.ownKeys(prototype)) {
        expect(
            nativeMemberKind(kind, property),
            `${kind}.${String(property)}`,
        ).toBeDefined();
    }
}

describe('native member inventory', () => {
    it.each([
        ['Map', Map.prototype],
        ['Set', Set.prototype],
        ['Date', Date.prototype],
    ] as const)(
        'classifies every runtime %s prototype member',
        (kind, prototype) => {
            assertNativeInventory(kind, prototype);
        },
    );

    it.each([
        ['Map', new Map([['retained', 1]])],
        ['Set', new Set(['retained'])],
        ['Date', new Date(0)],
    ] as const)(
        'fails closed before an unknown %s prototype method can mutate its raw receiver',
        (kind, source) => {
            const property = Symbol(`unknown${kind}Method`);
            const prototype = Object.getPrototypeOf(source) as object;
            let called = false;

            Object.defineProperty(prototype, property, {
                configurable: true,
                value(this: Map<unknown, unknown> | Set<unknown> | Date) {
                    called = true;
                    if (this instanceof Date) {
                        this.setTime(1);
                        return this.getTime();
                    }
                    this.clear();
                    return this.values();
                },
            });

            try {
                const view = readonlyView(source);
                expect(() => {
                    const method: unknown = Reflect.get(view, property);
                    if (typeof method !== 'function') {
                        throw new TypeError('Expected a callable method');
                    }
                    Reflect.apply(method, view, []);
                }).toThrow(
                    new UnsupportedTypeError(`${kind}.${String(property)}`),
                );
                expect(called).toBe(false);
                if (source instanceof Date) {
                    expect(source.getTime()).toBe(0);
                } else if (source instanceof Map) {
                    expect([...source]).toEqual([['retained', 1]]);
                } else {
                    expect([...source]).toEqual(['retained']);
                }
            } finally {
                Reflect.deleteProperty(prototype, property);
            }
        },
    );
});
