import { describe, expect, it } from 'vitest';
import {
    DirectMutationError,
    isReadonlyView,
    readonlyView,
} from '../../src/index';

describe('readonlyView objects', () => {
    it('returns primitive inputs unchanged', () => {
        const symbol = Symbol('value');
        expect(readonlyView(null)).toBeNull();
        expect(readonlyView(undefined)).toBeUndefined();
        expect(readonlyView(1)).toBe(1);
        expect(readonlyView('value')).toBe('value');
        expect(readonlyView(true)).toBe(true);
        expect(readonlyView(10n)).toBe(10n);
        expect(readonlyView(symbol)).toBe(symbol);
    });

    it('creates a lazy live nested view', () => {
        let getterReads = 0;
        const first = { name: 'Alice' };
        const second = { name: 'Bob' };
        const source = {
            child: first,
            get computed() {
                getterReads += 1;
                return { value: this.child.name };
            },
        };

        const view = readonlyView(source);
        expect(getterReads).toBe(0);
        expect(view.child.name).toBe('Alice');
        expect(getterReads).toBe(0);

        source.child = second;
        expect(view.child.name).toBe('Bob');
        expect(view.computed.value).toBe('Bob');
        expect(getterReads).toBe(1);
    });

    it('reflects source property additions and removals', () => {
        const source: Record<string, unknown> = { present: 1 };
        const view = readonlyView(source);

        source.added = { value: 2 };
        delete source.present;

        expect('present' in view).toBe(false);
        expect(view.added).toEqual({ value: 2 });
    });

    it('rejects direct and nested mutations with typed errors', () => {
        const source = { nested: { value: 1 } };
        const view = readonlyView(source);

        expect(() => Reflect.set(view, 'extra', true)).toThrow(
            DirectMutationError,
        );
        expect(() => Reflect.set(view.nested, 'value', 2)).toThrow(
            DirectMutationError,
        );
        expect(source).toEqual({ nested: { value: 1 } });
    });

    it('recognizes views but not sources or primitives', () => {
        const source = { value: 1 };
        const view = readonlyView(source);

        expect(isReadonlyView(view)).toBe(true);
        expect(isReadonlyView(source)).toBe(false);
        expect(isReadonlyView(1)).toBe(false);
    });
});
