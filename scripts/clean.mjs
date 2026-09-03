import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputDirectory = resolve(import.meta.dirname, '..', 'dist');

await rm(outputDirectory, { force: true, recursive: true });
