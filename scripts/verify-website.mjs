import { access, readFile } from 'node:fs/promises';

const html = await readFile(
    new URL('../website/dist/index.html', import.meta.url),
    'utf8',
);
for (const heading of [
    'Ownership model',
    'Supported types',
    'Proxy invariants',
    'API reference',
    'Migration from ImmuView v1',
    'Security and trust model',
]) {
    if (!html.includes(heading))
        throw new Error('Missing website section: ' + heading);
}
if (html.includes('react'))
    throw new Error('Website unexpectedly references React');
await access(new URL('../website/dist/assets', import.meta.url));
console.log('Website structure verified');
