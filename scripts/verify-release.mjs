import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const lock = JSON.parse(
    await readFile(resolve(root, 'package-lock.json'), 'utf8'),
);

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

assert(pkg.name === '@nipe-solutions/readonly-view', 'Unexpected package name');
assert(pkg.version === lock.version, 'package-lock root version is stale');
assert(
    pkg.version === lock.packages[''].version,
    'package-lock package version is stale',
);
assert(pkg.license === 'MIT', 'Package license must be MIT');
assert(
    pkg.files.length === 1 && pkg.files[0] === 'dist',
    'files allowlist changed',
);
assert(pkg.sideEffects === false, 'Package must remain side-effect free');
assert(
    pkg.repository.url.includes('NIPE-Solutions/readonly-view'),
    'Repository metadata is stale',
);

for (const file of [
    'LICENSE',
    'README.md',
    'CHANGELOG.md',
    'dist/index.js',
    'dist/index.cjs',
    'dist/index.d.ts',
]) {
    await stat(resolve(root, file));
}

const changelog = await readFile(resolve(root, 'CHANGELOG.md'), 'utf8');
assert(
    changelog.includes('## Unreleased'),
    'CHANGELOG needs an Unreleased section',
);
console.log(`Release metadata verified for ${pkg.name}@${pkg.version}`);
