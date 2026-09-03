import { expect, it } from 'vitest';
import { readonlyView } from '../../src/index';

it('preserves identity across objects arrays Map and Set', () => {
    const shared = { id: 1 };
    const view = readonlyView({
        direct: shared,
        array: [shared],
        map: new Map([['x', shared]]),
        set: new Set([shared]),
    });

    expect(view.direct).toBe(view.array[0]);
    expect(view.direct).toBe(view.map.get('x'));
    expect([...view.set][0]).toBe(view.direct);
});
