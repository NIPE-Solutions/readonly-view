import { describe, expect, it } from 'vitest';
import { UnsupportedTypeError, readonlyView } from '../../src/index';

const unsupported: Array<[string, object]> = [
    ['RegExp', /value/g],
    ['Error', new Error('message')],
    ['URL', new URL('https://example.com')],
    ['URLSearchParams', new URLSearchParams('a=1')],
    ['ArrayBuffer', new ArrayBuffer(8)],
    ['DataView', new DataView(new ArrayBuffer(8))],
    ['Uint8Array', new Uint8Array(2)],
    ['WeakMap', new WeakMap()],
    ['WeakSet', new WeakSet()],
    ['Promise', Promise.resolve(1)],
];

describe('unsupported built-ins', () => {
    it.each(unsupported)('rejects %s roots', (kind, source) => {
        expect(() => readonlyView(source)).toThrowError(
            new UnsupportedTypeError(kind),
        );
    });

    it('rejects unsupported nested values lazily', () => {
        const source = { safe: { value: 1 }, unsafe: /value/g };
        const view = readonlyView(source);

        expect(view.safe.value).toBe(1);
        expect(() => view.unsafe).toThrow(UnsupportedTypeError);
    });
});
