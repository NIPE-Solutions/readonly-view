import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyPackage } from './verify-package.mjs';

test('the packed artifact works for real consumers and hides internals', async () => {
    const result = await verifyPackage();
    assert.ok(result.files.includes('dist/index.js'));
    assert.ok(result.files.includes('dist/index.cjs'));
    assert.ok(result.files.includes('dist/index.d.ts'));
    assert.match(result.declaration, /DeepReadonly/);
});
