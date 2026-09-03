import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { gzipSync } from 'node:zlib';
import { transform } from 'esbuild';

const budget = JSON.parse(
    await readFile(new URL('./size-budget.json', import.meta.url), 'utf8'),
);
const esm = await readFile(
    new URL('../dist/index.js', import.meta.url),
    'utf8',
);
const declarations = await readFile(
    new URL('../dist/index.d.ts', import.meta.url),
);
const exec = promisify(execFile);
const { stdout } = await exec('npm', ['pack', '--json', '--dry-run'], {
    cwd: new URL('..', import.meta.url),
});
const [packed] = JSON.parse(stdout);
const minified = await transform(esm, {
    minify: true,
    format: 'esm',
    target: 'es2022',
});
const sizes = {
    esmMinified: Buffer.byteLength(minified.code),
    esmGzip: gzipSync(minified.code).byteLength,
    declarations: declarations.byteLength,
    packed: packed.size,
};

let failed = false;
for (const [name, size] of Object.entries(sizes)) {
    const limit = budget[name];
    console.log(name + ': ' + size + ' B / ' + limit + ' B');
    if (size > limit) failed = true;
}
if (failed) process.exitCode = 1;
