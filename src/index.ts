import type { DeepReadonly } from './public-types';

export { DirectMutationError, UnsupportedTypeError } from './errors';
export type { DeepReadonly } from './public-types';

export function readonlyView<T>(source: T): DeepReadonly<T> {
    void source;
    throw new Error('readonlyView is not implemented');
}

export function isReadonlyView(value: unknown): boolean {
    void value;
    return false;
}
