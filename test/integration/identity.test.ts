import { describe, expect, it } from 'vitest';
import { readonlyView } from '../../src/index';

describe('membrane identity', () => {
    it('preserves shared and repeated identity inside one membrane', () => {
        const shared = { value: 1 };
        const view = readonlyView({ first: shared, second: shared });

        expect(view.first).toBe(view.second);
        expect(view.first).toBe(view.first);
    });

    it('supports direct and multi-node cycles', () => {
        interface Node {
            name: string;
            next?: Node;
        }

        const first: Node = { name: 'first' };
        const second: Node = { name: 'second' };
        const third: Node = { name: 'third' };
        first.next = second;
        second.next = third;
        third.next = first;

        const view = readonlyView(first);

        expect(view.next?.next?.next).toBe(view);
    });

    it('creates independent membranes for separate top-level calls', () => {
        const source = { nested: { value: 1 } };

        const first = readonlyView(source);
        const second = readonlyView(source);

        expect(first).not.toBe(second);
        expect(first.nested).not.toBe(second.nested);
    });

    it('returns an existing view unchanged', () => {
        const first = readonlyView({ value: 1 });

        expect(readonlyView(first)).toBe(first);
    });
});
