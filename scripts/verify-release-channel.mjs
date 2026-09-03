import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const pkg = JSON.parse(
    await readFile(resolve(import.meta.dirname, '..', 'package.json'), 'utf8'),
);
const channel = process.argv[2];
const prerelease = pkg.version.includes('-');

if (channel !== 'next' && channel !== 'latest') {
    throw new Error(`Unsupported npm channel: ${channel ?? '(missing)'}`);
}
if (prerelease && channel !== 'next') {
    throw new Error('Prerelease versions must use the next channel');
}
if (!prerelease && channel !== 'latest') {
    throw new Error('Stable versions must use the latest channel');
}

console.log(`${pkg.version} is valid for the ${channel} channel`);
