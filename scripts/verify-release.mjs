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
assert(
    pkg.homepage === 'https://readonly-view.nipesolutions.com',
    'Homepage is stale',
);
assert(pkg.version === '2.0.0', 'Unexpected package version');
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

const vercel = JSON.parse(await readFile(resolve(root, 'vercel.json'), 'utf8'));
assert(
    vercel.buildCommand === 'npm run build:website',
    'Unexpected Vercel build',
);
assert(vercel.framework === null, 'Unexpected Vercel framework');
assert(vercel.installCommand === 'npm ci', 'Unexpected Vercel install');
assert(vercel.outputDirectory === 'website/dist', 'Unexpected Vercel output');

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
