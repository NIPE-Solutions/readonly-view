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

test('story navigation and calls to action lead to their destinations', async ({
    page,
}) => {
    await page.goto(websiteOrigin + '/');

    const sidebar = page.getByRole('navigation', { name: 'Documentation' });
    for (const [name, id] of [
        ['Why this exists', 'why'],
        ['Use cases', 'use-cases'],
        ['Choose the right tool', 'comparison'],
        ['Good fit / Not a fit', 'fit'],
    ] as const) {
        await sidebar.getByRole('link', { name, exact: true }).click();
        await expect(page).toHaveURL(`${websiteOrigin}/#${id}`);
        await expect(page.locator(`#${id}`)).toBeInViewport();
    }

    for (const [name, href] of [
        [
            'Install from npm',
            'https://www.npmjs.com/package/@nipe-solutions/readonly-view',
        ],
        ['Read the documentation', '#introduction'],
        ['View on GitHub', 'https://github.com/NIPE-Solutions/readonly-view'],
    ] as const) {
        const links = page.getByRole('link', { name, exact: true });
        await expect(links).toHaveCount(2);
        for (const link of await links.all()) {
            await expect(link).toHaveAttribute('href', href);
        }
    }
});

test('story sections have one visible level-two heading each', async ({
    page,
}) => {
    await page.goto(websiteOrigin + '/');

    for (const [id, name] of [
        ['why', 'Why this exists'],
        ['use-cases', 'Built for public read surfaces'],
        ['comparison', 'Choose the right tool'],
        ['fit', 'Is ReadonlyView a fit?'],
    ] as const) {
        const headings = page
            .locator(`#${id}`)
            .getByRole('heading', { level: 2 });
        await expect(headings).toHaveCount(1);
        await expect(headings).toHaveText(name);
        await expect(headings).toBeVisible();
    }
});

test('documentation has no narrow-screen overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(websiteOrigin + '/#use-cases');
    await expect(page.locator('#use-cases')).toBeInViewport();
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
            if (width === 320 && route.startsWith('/de/')) {
                const mastheadWidths = await page
                    .locator('.masthead')
                    .evaluate((masthead) => ({
                        client: masthead.clientWidth,
                        scroll: masthead.scrollWidth,
                    }));
                expect(mastheadWidths.scroll).toBeLessThanOrEqual(
                    mastheadWidths.client,
                );
            }
            const layout = await page.evaluate(() => {
                const viewport = document.documentElement.clientWidth;
                const overflow = Array.from(
                    document.querySelectorAll<HTMLElement>('body, body *'),
                ).flatMap((element) => {
                    const rect = element.getBoundingClientRect();
                    if (
                        rect.left >= 0 &&
                        Math.ceil(rect.right) <= viewport &&
                        element.scrollWidth <= element.clientWidth
                    ) {
                        return [];
                    }
                    return [
                        {
                            client: element.clientWidth,
                            element:
                                element.tagName.toLowerCase() +
                                (element.className
                                    ? `.${element.className.split(' ').join('.')}`
                                    : ''),
                            left: Number(rect.left.toFixed(2)),
                            right: Number(rect.right.toFixed(2)),
                            scroll: element.scrollWidth,
                        },
                    ];
                });
                return {
                    body: document.body.scrollWidth,
                    overflow,
                    viewport,
                };
            });
            expect(
                layout.body,
                JSON.stringify(layout.overflow),
            ).toBeLessThanOrEqual(layout.viewport);
        });
    }
}
