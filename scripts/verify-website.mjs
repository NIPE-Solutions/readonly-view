import { access, readFile } from 'node:fs/promises';

const distUrl = new URL('../website/dist/', import.meta.url);
const pages = new Map([
    [
        'privacy/index.html',
        ['Privacy Policy', 'Vercel Inc.', 'no non-essential cookies'],
    ],
    [
        'impressum/index.html',
        ['Impressum', 'NIPE Solutions e.U.', 'ATU78464412'],
    ],
    [
        'de/datenschutz/index.html',
        ['Datenschutzerklärung', 'Vercel Inc.', 'Datenschutzbehörde'],
    ],
    [
        'de/impressum/index.html',
        ['Impressum', 'NIPE Solutions e.U.', 'FN 585066t'],
    ],
]);
const pageHtml = new Map([
    ['index.html', await readFile(new URL('index.html', distUrl), 'utf8')],
]);

for (const [path, expectedContent] of pages) {
    const html = await readFile(new URL(path, distUrl), 'utf8');
    pageHtml.set(path, html);
    for (const content of expectedContent) {
        if (!html.includes(content))
            throw new Error(`${path} is missing defining content: ${content}`);
    }
}

const home = pageHtml.get('index.html');
if (home === undefined) throw new Error('Missing built home page');

for (const heading of [
    'Ownership model',
    'Supported types',
    'Proxy invariants',
    'API reference',
    'Migration from ImmuView v1',
    'Security and trust model',
]) {
    if (!home.includes(heading))
        throw new Error('Missing website section: ' + heading);
}

for (const route of pages.keys()) {
    const publicRoute = `/${route.replace('index.html', '')}`;
    if (!home.includes(`href="${publicRoute}"`))
        throw new Error('Home page does not link legal route: ' + publicRoute);
}

for (const example of [
    'Nested protection',
    'Owner-side live updates',
    'Arrays',
    'Map and Set',
    'Date',
    'Circular references',
    'Shared identity',
    'Mutation rejection',
]) {
    if (!home.includes(example))
        throw new Error('Missing website example: ' + example);
}

function exampleCard(heading) {
    const marker = `<h3>${heading}</h3>`;
    const start = home.indexOf(marker);
    const end = home.indexOf('</article>', start);
    if (start < 0 || end < 0)
        throw new Error('Missing website example card: ' + heading);
    return home.slice(start, end);
}

for (const [heading, expectedContent] of [
    [
        'Owner-side live updates',
        [
            "import { readonlyView } from '@nipe-solutions/readonly-view'",
            'const source =',
            'const view = readonlyView(source)',
        ],
    ],
    [
        'Mutation rejection',
        [
            'DirectMutationError',
            "from '@nipe-solutions/readonly-view'",
            'const source =',
            'const view = readonlyView(source)',
            'error instanceof DirectMutationError',
        ],
    ],
]) {
    const card = exampleCard(heading);
    for (const content of expectedContent) {
        if (!card.includes(content))
            throw new Error(`${heading} example is not standalone: ${content}`);
    }
}

const iconAssets = [
    '/favicon.svg',
    '/favicon-32x32.png',
    '/apple-touch-icon.png',
    '/site.webmanifest',
];
for (const [path, html] of pageHtml) {
    if (html.includes('v2 alpha'))
        throw new Error(`${path} unexpectedly contains v2 alpha`);
    for (const asset of iconAssets) {
        if (!html.includes(asset))
            throw new Error(`${path} does not link ${asset}`);
    }
}
for (const asset of iconAssets) {
    await access(new URL(asset.slice(1), distUrl));
}

const origin = 'https://readonly-view.nipesolutions.com';
const canonicalUrls = [];
for (const [path, html] of pageHtml) {
    const route = path === 'index.html' ? '' : path.replace('index.html', '');
    const expectedUrl = `${origin}/${route}`;
    canonicalUrls.push(expectedUrl);

    const canonicalTags = (html.match(/<link\b[^>]*>/g) ?? []).filter((tag) =>
        tag.includes('rel="canonical"'),
    );
    if (canonicalTags.length !== 1)
        throw new Error(
            `${path} has ${canonicalTags.length} canonical tags; expected 1`,
        );
    const canonicalTag = canonicalTags[0];
    const canonicalUrl = canonicalTag?.match(/href="([^"]+)"/)?.[1];
    if (canonicalUrl !== expectedUrl)
        throw new Error(
            `${path} canonical URL is ${canonicalUrl ?? 'missing'}; expected ${expectedUrl}`,
        );

    const openGraphTags = (html.match(/<meta\b[^>]*>/g) ?? []).filter((tag) =>
        tag.includes('property="og:url"'),
    );
    if (openGraphTags.length !== 1)
        throw new Error(
            `${path} has ${openGraphTags.length} Open Graph URL tags; expected 1`,
        );
    const openGraphTag = openGraphTags[0];
    const openGraphUrl = openGraphTag?.match(/content="([^"]+)"/)?.[1];
    if (openGraphUrl !== expectedUrl)
        throw new Error(
            `${path} Open Graph URL is ${openGraphUrl ?? 'missing'}; expected ${expectedUrl}`,
        );
}

const robots = await readFile(new URL('robots.txt', distUrl), 'utf8');
if (!robots.includes(`${origin}/sitemap.xml`))
    throw new Error('robots.txt does not link the production sitemap');
const sitemap = await readFile(new URL('sitemap.xml', distUrl), 'utf8');
for (const url of canonicalUrls) {
    if (!sitemap.includes(`<loc>${url}</loc>`))
        throw new Error('Sitemap is missing: ' + url);
}

if (home.includes('react'))
    throw new Error('Website unexpectedly references React');
await access(new URL('assets', distUrl));
console.log('Website structure verified');
