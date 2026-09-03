import { describe, expect, it } from 'vitest';
import { readonlyView } from '../../src/index';

describe('arrays', () => {
    it('preserves array observation and live source changes', () => {
        const source = [{ value: 1 }, { value: 2 }];
        const view = readonlyView(source);

        expect(Array.isArray(view)).toBe(true);
        expect(Object.getPrototypeOf(view)).not.toBe(Array.prototype);
        expect(view.length).toBe(2);
        expect(view[0]).toBe(view[0]);
        expect(view[0]).not.toBe(source[0]);

        source.push({ value: 3 });
        expect(view.length).toBe(3);
        expect(view[2]?.value).toBe(3);

        source.length = 1;
        expect([...view].map((item) => item.value)).toEqual([1]);
    });

    it('observes replacement of custom method properties', () => {
        const source = Object.assign([1], { read: (): number => 1 });
        const view = readonlyView(source);

        expect(view.read()).toBe(1);
        source.read = () => 2;
        expect(view.read()).toBe(2);
    });

    it('supports non-mutating methods with protected callback values', () => {
        const source = [{ value: 1 }, { value: 2 }];
        const view = readonlyView(source);

        expect(view.map((item) => item.value)).toEqual([1, 2]);
        expect(view.filter((item) => item.value > 1)[0]).toBe(view[1]);
        expect(view.find((item) => item.value === 1)).toBe(view[0]);
        expect(view.slice(0, 1)[0]).toBe(view[0]);
        expect(view.entries().next().value).toEqual([0, view[0]]);
    });
});
