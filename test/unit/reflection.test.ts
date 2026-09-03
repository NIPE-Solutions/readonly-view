import { describe, expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

describe('view reflection', () => {
    it('enumerates current string and symbol keys without invoking getters', () => {
        const symbol = Symbol('secret');
        let getterReads = 0;
        const source = {
            visible: { value: 1 },
            [symbol]: { value: 2 },
            get computed() {
                getterReads += 1;
                return { value: 3 };
            },
        };
        const view = readonlyView(source);

        expect(Object.keys(view)).toEqual(['visible', 'computed']);
        expect(Object.getOwnPropertyNames(view)).toEqual([
            'visible',
            'computed',
        ]);
        expect(Object.getOwnPropertySymbols(view)).toEqual([symbol]);
        expect(Reflect.ownKeys(view)).toEqual(['visible', 'computed', symbol]);
        expect(getterReads).toBe(0);
    });

    it('wraps values exposed by reflection helpers', () => {
        const symbol = Symbol('secret');
        const source = {
            child: { value: 1 },
            [symbol]: { value: 2 },
        };
        const view = readonlyView(source);

        const descriptor = Object.getOwnPropertyDescriptor(view, 'child');
        const values = Object.values(view);
        const entries = Object.entries(view);

        expect(descriptor?.configurable).toBe(true);
        expect(descriptor?.enumerable).toBe(true);
        expect(descriptor?.writable).toBe(true);
        expect(descriptor?.value).toBe(view.child);
        expect(values[0]).toBe(view.child);
        expect(entries[0]).toEqual(['child', view.child]);
        expect(() =>
            Reflect.set(descriptor?.value as object, 'value', 2),
        ).toThrow(DirectMutationError);
        expect(() => Reflect.set(view[symbol], 'value', 3)).toThrow(
            DirectMutationError,
        );
    });

    it('supports has, Reflect.get, for-in, spread, and destructuring', () => {
        const source = Object.create({ inherited: { value: 2 } }) as {
            own: { value: number };
            inherited: { value: number };
        };
        source.own = { value: 1 };
        const view = readonlyView(source);

        const keys: string[] = [];
        for (const key in view) keys.push(key);
        const spread = { ...view };
        const { own } = view;

        expect('own' in view).toBe(true);
        expect('inherited' in view).toBe(true);
        expect(Reflect.get(view, 'own')).toBe(view.own);
        expect(keys).toEqual(['own', 'inherited']);
        expect(spread.own).toBe(view.own);
        expect(own).toBe(view.own);
    });

    it('protects custom prototype observation and preserves null', () => {
        const customPrototype = { inherited: { value: 1 } };
        const customSource = Object.create(customPrototype) as {
            value: number;
        };
        customSource.value = 1;
        const nullSource = Object.assign(Object.create(null) as object, {
            value: 1,
        });

        const viewedPrototype = Object.getPrototypeOf(
            readonlyView(customSource),
        ) as { inherited: { value: number } };
        expect(viewedPrototype).not.toBe(customPrototype);
        expect(() =>
            Reflect.set(viewedPrototype.inherited, 'value', 2),
        ).toThrow(DirectMutationError);
        expect(customPrototype.inherited.value).toBe(1);
        expect(Object.getPrototypeOf(readonlyView(nullSource))).toBeNull();
    });
});
