import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, '..', '..');
const verifier = resolve(root, 'scripts/verify-registry.mjs');

async function runVerifier(registry) {
    const cache = await mkdtemp(join(tmpdir(), 'readonly-view-npm-cache-'));
    try {
        try {
            const result = await exec(
                process.execPath,
                [verifier, 'unpublished'],
                {
                    cwd: root,
                    env: {
                        ...process.env,
                        npm_config_cache: cache,
                        npm_config_fetch_retries: '0',
                        npm_config_fetch_timeout: '1000',
                        npm_config_registry: registry,
                    },
                },
            );
            return { ...result, exitCode: 0 };
        } catch (error) {
            return {
                stdout: error.stdout ?? '',
                stderr: error.stderr ?? '',
                exitCode: error.code,
            };
        }
    } finally {
        await rm(cache, { force: true, recursive: true });
    }
}

async function withRegistryResponse(statusCode, body, assertion) {
    const server = createServer((_request, response) => {
        response.writeHead(statusCode, { 'content-type': 'application/json' });
        response.end(JSON.stringify(body));
    });
    await new Promise((resolveListen) =>
        server.listen(0, '127.0.0.1', resolveListen),
    );
    const { port } = server.address();
    try {
        await assertion(`http://127.0.0.1:${port}/`);
    } finally {
        await new Promise((resolveClose, rejectClose) =>
            server.close((error) =>
                error ? rejectClose(error) : resolveClose(),
            ),
        );
    }
}

test('unpublished mode accepts the registry package-not-found response', async () => {
    await withRegistryResponse(
        404,
        { error: 'Not found' },
        async (registry) => {
            const result = await runVerifier(registry);
            assert.equal(result.exitCode, 0);
            assert.match(result.stdout, /is available on npm/);
        },
    );
});

for (const [statusCode, label] of [
    [401, 'authentication'],
    [500, 'server'],
]) {
    test(`unpublished mode rejects an npm ${label} error`, async () => {
        await withRegistryResponse(
            statusCode,
            { error: `${label} failure` },
            async (registry) => {
                const result = await runVerifier(registry);
                assert.notEqual(result.exitCode, 0);
            },
        );
    });
}

test('unpublished mode rejects a registry network error', async () => {
    const server = createServer();
    await new Promise((resolveListen) =>
        server.listen(0, '127.0.0.1', resolveListen),
    );
    const { port } = server.address();
    await new Promise((resolveClose, rejectClose) =>
        server.close((error) => (error ? rejectClose(error) : resolveClose())),
    );

    const result = await runVerifier(`http://127.0.0.1:${port}/`);
    assert.notEqual(result.exitCode, 0);
});
