import { execFile } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const artifacts = resolve(root, '.artifacts');

await rm(artifacts, { force: true, recursive: true });
await mkdir(artifacts, { recursive: true });
const { stdout } = await exec(
    'npm',
    ['pack', '--json', '--pack-destination', artifacts],
    { cwd: root },
);
const [packed] = JSON.parse(stdout);
console.log(`Packed .artifacts/${packed.filename} (${packed.size} bytes)`);
