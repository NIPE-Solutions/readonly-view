import { expect, test } from '@playwright/test';

test('documentation navigation and live demo work', async ({ page }) => {
    await page.goto('/website/index.html');
    await expect(
        page.getByRole('heading', {
            name: 'The source stays mutable. The view does not.',
        }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Run owner mutation' }).click();
    await expect(page.locator('#demo-output')).toContainText("'Bob'");
    await page.getByRole('button', { name: 'Try view mutation' }).click();
    await expect(page.locator('#demo-output')).toContainText(
        'DirectMutationError',
    );
    await expect(
        page.getByRole('heading', { name: 'Proxy invariants' }),
    ).toBeAttached();
});

test('documentation has no narrow-screen overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/website/index.html');
    const widths = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        viewport: document.documentElement.clientWidth,
    }));
    expect(widths.body).toBeLessThanOrEqual(widths.viewport);
});
