export function isObjectLike(
    value: unknown,
): value is object | ((...arguments_: never[]) => unknown) {
    return (
        (typeof value === 'object' && value !== null) ||
        typeof value === 'function'
    );
}
