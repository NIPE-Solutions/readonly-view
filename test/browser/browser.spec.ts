import { expect, test } from '@playwright/test';

test('the built package enforces core semantics', async ({ page }) => {
    await page.goto('/test/browser/index.html');
    const result = await page.evaluate(async () => {
        const api = await import('/dist/index.js');
        const shared = { value: 1 };
        const source = {
            direct: shared,
            array: [shared],
            map: new Map([['x', shared]]),
            set: new Set([shared]),
            date: new Date(0),
        };
        const view = api.readonlyView(source);
        let mutationName = '';
        try {
            view.direct.value = 2;
        } catch (error) {
            mutationName = error instanceof Error ? error.name : '';
        }
        source.direct.value = 3;
        return {
            arrayIdentity: Array.isArray(view.array),
            date: view.date.getTime(),
            identity:
                view.direct === view.array[0] &&
                view.direct === view.map.get('x') &&
                view.direct === [...view.set][0],
            live: view.direct.value,
            mutationName,
        };
    });

    expect(result).toEqual({
        arrayIdentity: true,
        date: 0,
        identity: true,
        live: 3,
        mutationName: 'DirectMutationError',
    });
});
