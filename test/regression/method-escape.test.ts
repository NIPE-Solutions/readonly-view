import { expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

it('does not bind a reflected method to its mutable source', () => {
    const source = {
        nested: { value: 1 },
        expose() {
            return this.nested;
        },
    };
    const view = readonlyView(source);
    const method = Object.getOwnPropertyDescriptor(view, 'expose')
        ?.value as () => {
        readonly value: number;
    };
    const exposed = method.call(view);

    expect(exposed).toBe(view.nested);
    expect(() => Reflect.set(exposed, 'value', 2)).toThrow(DirectMutationError);
});
