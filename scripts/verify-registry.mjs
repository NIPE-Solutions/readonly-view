import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const pkg = JSON.parse(
    await readFile(resolve(import.meta.dirname, '..', 'package.json'), 'utf8'),
);
const specifier = `${pkg.name}@${pkg.version}`;
const mode = process.argv[2];

async function registryVersion() {
    try {
        const { stdout } = await exec('npm', [
            'view',
            specifier,
            'version',
            '--json',
        ]);
        return JSON.parse(stdout);
    } catch {
        return undefined;
    }
}

if (mode === 'unpublished') {
    if ((await registryVersion()) !== undefined) {
        throw new Error(`${specifier} already exists on npm`);
    }
    console.log(`${specifier} is available on npm`);
} else if (mode === 'published') {
    for (let attempt = 1; attempt <= 12; attempt += 1) {
        if ((await registryVersion()) === pkg.version) {
            console.log(`${specifier} is visible on npm`);
            process.exit(0);
        }
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 10_000));
    }
    throw new Error(`${specifier} did not become visible on npm`);
} else {
    throw new Error('Expected registry mode: unpublished or published');
}
