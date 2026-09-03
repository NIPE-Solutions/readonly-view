import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { build } from 'esbuild';

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, '..', '..');
const packageName = '@nipe-solutions/readonly-view';

export async function verifyPackage() {
    const temporary = await mkdtemp(join(tmpdir(), 'readonly-view-package-'));
    try {
        const { stdout } = await exec(
            'npm',
            ['pack', '--json', '--pack-destination', temporary],
            { cwd: root },
        );
        const [packed] = JSON.parse(stdout);
        const files = packed.files.map((entry) => entry.path);
        if (
            files.some((file) => /^(src|test|website|benchmarks)\//.test(file))
        ) {
            throw new Error(
                `Development file leaked into package: ${files.join(', ')}`,
            );
        }

        const tarball = join(temporary, packed.filename);
        await writeFile(
            join(temporary, 'package.json'),
            JSON.stringify({
                type: 'module',
                dependencies: { [packageName]: `file:${tarball}` },
            }),
        );
        await exec(
            'npm',
            ['install', '--ignore-scripts', '--no-package-lock'],
            { cwd: temporary },
        );

        await writeFile(
            join(temporary, 'esm.mjs'),
            `import * as api from '${packageName}';\nconst source={value:1}; const view=api.readonlyView(source); source.value=2; if(view.value!==2) throw new Error('ESM live view failed'); console.log(Object.keys(api).sort().join(','));`,
        );
        const esm = await exec('node', ['esm.mjs'], { cwd: temporary });
        if (
            esm.stdout.trim() !==
            'DirectMutationError,UnsupportedTypeError,isReadonlyView,readonlyView'
        )
            throw new Error(`Unexpected exports: ${esm.stdout}`);

        await writeFile(
            join(temporary, 'cjs.cjs'),
            `const api=require('${packageName}'); const source={value:1}; const view=api.readonlyView(source); source.value=2; if(view.value!==2) throw new Error('CJS failed');`,
        );
        await exec('node', ['cjs.cjs'], { cwd: temporary });

        await writeFile(
            join(temporary, 'consumer.ts'),
            `import { readonlyView, type DeepReadonly } from '${packageName}'; const view: DeepReadonly<{value:number}> = readonlyView({value:1}); // @ts-expect-error readonly\nview.value=2;`,
        );
        await writeFile(
            join(temporary, 'tsconfig.json'),
            JSON.stringify({
                compilerOptions: {
                    strict: true,
                    noEmit: true,
                    module: 'ESNext',
                    moduleResolution: 'Bundler',
                    target: 'ES2022',
                    skipLibCheck: false,
                },
                include: ['consumer.ts'],
            }),
        );
        await exec(
            process.execPath,
            [
                resolve(root, 'node_modules/typescript/bin/tsc'),
                '-p',
                'tsconfig.json',
            ],
            { cwd: temporary },
        );

        await writeFile(
            join(temporary, 'bundle-entry.js'),
            `import { readonlyView } from '${packageName}'; console.log(readonlyView({value:1}).value);`,
        );
        await build({
            absWorkingDir: temporary,
            entryPoints: ['bundle-entry.js'],
            outfile: 'bundle.js',
            bundle: true,
            format: 'esm',
            platform: 'browser',
        });

        let privateBlocked = false;
        try {
            await import(`${packageName}/src/membrane`);
        } catch {
            privateBlocked = true;
        }
        if (!privateBlocked)
            throw new Error('Private package subpath was importable');

        const declaration = await readFile(
            resolve(root, 'dist/index.d.ts'),
            'utf8',
        );
        if (/from ['"]\.\//.test(declaration))
            throw new Error('Declaration leaks private module paths');
        return { files, declaration };
    } finally {
        await rm(temporary, { force: true, recursive: true });
    }
}
