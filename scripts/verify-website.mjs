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
const canonicalUrls = [
    `${origin}/`,
    ...[...pages.keys()].map(
        (path) => `${origin}/${path.replace('index.html', '')}`,
    ),
];
for (const url of canonicalUrls) {
    if (![...pageHtml.values()].some((html) => html.includes(url)))
        throw new Error('Missing canonical page URL: ' + url);
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
