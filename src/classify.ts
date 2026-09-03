export function isObjectLike(
    value: unknown,
): value is object | ((...arguments_: never[]) => unknown) {
    return (
        (typeof value === 'object' && value !== null) ||
        typeof value === 'function'
    );
}

export function unsupportedKind(value: object): string | undefined {
    if (value instanceof RegExp) return 'RegExp';
    if (value instanceof Error) return 'Error';
    if (value instanceof URL) return 'URL';
    if (value instanceof URLSearchParams) return 'URLSearchParams';
    if (value instanceof DataView) return 'DataView';
    if (value instanceof Uint8Array) return 'Uint8Array';
    if (value instanceof Int8Array) return 'Int8Array';
    if (value instanceof Uint8ClampedArray) return 'Uint8ClampedArray';
    if (value instanceof Int16Array) return 'Int16Array';
    if (value instanceof Uint16Array) return 'Uint16Array';
    if (value instanceof Int32Array) return 'Int32Array';
    if (value instanceof Uint32Array) return 'Uint32Array';
    if (value instanceof Float32Array) return 'Float32Array';
    if (value instanceof Float64Array) return 'Float64Array';
    if (value instanceof BigInt64Array) return 'BigInt64Array';
    if (value instanceof BigUint64Array) return 'BigUint64Array';
    if (value instanceof ArrayBuffer) return 'ArrayBuffer';
    if (
        typeof SharedArrayBuffer !== 'undefined' &&
        value instanceof SharedArrayBuffer
    )
        return 'SharedArrayBuffer';
    if (value instanceof WeakMap) return 'WeakMap';
    if (value instanceof WeakSet) return 'WeakSet';
    if (value instanceof Promise) return 'Promise';
    return undefined;
}
