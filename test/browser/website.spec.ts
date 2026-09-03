import { expect, test } from '@playwright/test';

const websiteOrigin = 'http://127.0.0.1:42873';

test('documentation navigation and live demo work', async ({ page }) => {
    await page.goto(websiteOrigin + '/');
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
    await page.goto(websiteOrigin + '/');
    const widths = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        viewport: document.documentElement.clientWidth,
    }));
    expect(widths.body).toBeLessThanOrEqual(widths.viewport);
});

const legalRoutes = [
    ['/privacy/', 'Privacy Policy', 'Deutsch'],
    ['/impressum/', 'Impressum', 'Deutsch'],
    ['/de/datenschutz/', 'Datenschutzerklärung', 'English'],
    ['/de/impressum/', 'Impressum', 'English'],
] as const;

for (const [route, heading, language] of legalRoutes) {
    for (const width of [390, 320]) {
        test(`${route} loads styles and has no ${width}px overflow`, async ({
            page,
        }) => {
            const stylesheets: { status: number; url: string }[] = [];
            const failedStylesheets: string[] = [];
            page.on('response', (response) => {
                if (response.request().resourceType() === 'stylesheet') {
                    stylesheets.push({
                        status: response.status(),
                        url: response.url(),
                    });
                }
            });
            page.on('requestfailed', (request) => {
                if (request.resourceType() === 'stylesheet') {
                    failedStylesheets.push(request.url());
                }
            });
            await page.setViewportSize({ width, height: 844 });
            await page.goto(websiteOrigin + route);
            await expect(
                page.getByRole('heading', { level: 1, name: heading }),
            ).toBeVisible();
            await expect(
                page.getByRole('link', { name: language }),
            ).toBeVisible();
            await expect(page.getByRole('contentinfo')).toBeVisible();
            expect(failedStylesheets).toEqual([]);
            expect(stylesheets).toHaveLength(2);
            expect(stylesheets).toEqual(
                stylesheets.map(({ url }) => ({ status: 200, url })),
            );
            expect(
                await page.evaluate(() => document.body.scrollWidth),
            ).toBeLessThanOrEqual(
                await page.evaluate(() => document.documentElement.clientWidth),
            );
        });
    }
}
