import { isObjectLike, unsupportedKind } from './classify';
import { DirectMutationError, UnsupportedTypeError } from './errors';
import {
    nativeMemberKind,
    type NativeKind,
    type NativeMemberKind,
} from './native-members';
import type { DeepReadonly } from './public-types';

const knownViewSources = new WeakMap<object, object>();
const knownViewWrappers = new WeakMap<object, (value: unknown) => unknown>();
type RuntimeConstructor = new (...arguments_: never[]) => object;
const arrayMutators = new Set<PropertyKey>([
    'copyWithin',
    'fill',
    'pop',
    'push',
    'reverse',
    'shift',
    'sort',
    'splice',
    'unshift',
]);
const setCompositionMethods = new Set<PropertyKey>([
    'difference',
    'intersection',
    'symmetricDifference',
    'union',
]);
const setRelationMethods = new Set<PropertyKey>([
    'isDisjointFrom',
    'isSubsetOf',
    'isSupersetOf',
]);

function unwrapKnownView(value: unknown): unknown {
    return isObjectLike(value) ? (knownViewSources.get(value) ?? value) : value;
}

function wrapForKnownView(view: object, value: unknown): unknown {
    return knownViewWrappers.get(view)?.(value) ?? value;
}

function nativeSetLikeIterator(value: unknown): unknown {
    if (!isObjectLike(value)) return value;

    const iterator = value;
    const nextMethod = Reflect.get(iterator, 'next', iterator) as unknown;
    const next = unwrapKnownView(nextMethod);
    if (typeof next !== 'function') return value;

    return {
        next(): IteratorResult<unknown> {
            const result: unknown = Reflect.apply(next, iterator, []);
            if (!isObjectLike(result)) return result as IteratorResult<unknown>;
            const done: unknown = Reflect.get(result, 'done', result);
            if (done) return { done: true, value: undefined };
            return {
                done: false,
                value: unwrapKnownView(Reflect.get(result, 'value', result)),
            };
        },
        get return(): unknown {
            const returnMethod = Reflect.get(
                iterator,
                'return',
                iterator,
            ) as unknown;
            const callable = unwrapKnownView(returnMethod);
            if (typeof callable !== 'function') return returnMethod;
            return (...arguments_: unknown[]): unknown => {
                const result: unknown = Reflect.apply(
                    callable,
                    iterator,
                    arguments_,
                );
                return result;
            };
        },
        [Symbol.iterator]() {
            return this;
        },
    };
}

function nativeSetOperand(value: unknown): unknown {
    if (!isObjectLike(value)) return value;

    const receiver = value;
    return {
        get size(): unknown {
            const size: unknown = Reflect.get(receiver, 'size', receiver);
            return size;
        },
        get has(): unknown {
            const method = Reflect.get(receiver, 'has', receiver) as unknown;
            const callable = unwrapKnownView(method);
            if (typeof callable !== 'function') return method;
            return (member: unknown) => {
                const result: unknown = Reflect.apply(callable, receiver, [
                    wrapForKnownView(receiver, member),
                ]);
                return result;
            };
        },
        get keys(): unknown {
            const method = Reflect.get(receiver, 'keys', receiver) as unknown;
            const callable = unwrapKnownView(method);
            if (typeof callable !== 'function') return method;
            return () =>
                nativeSetLikeIterator(Reflect.apply(callable, receiver, []));
        },
    };
}

function objectKind(source: object): string {
    if (Array.isArray(source)) return 'Array';
    if (source instanceof Map) return 'Map';
    if (source instanceof Set) return 'Set';
    if (source instanceof Date) return 'Date';
    if (typeof source === 'function') return 'Function';
    return 'Object';
}

function descriptorOwner(source: object, property: PropertyKey): object | null {
    let current: object | null = source;
    while (current !== null) {
        if (Reflect.getOwnPropertyDescriptor(current, property) !== undefined)
            return current;
        current = Reflect.getPrototypeOf(current);
    }
    return null;
}

function mutation(
    source: object,
    operation: string,
    property?: PropertyKey,
): never {
    const details =
        property === undefined
            ? { objectKind: objectKind(source), operation }
            : { objectKind: objectKind(source), operation, property };

    throw new DirectMutationError(details);
}

function requiredNativeMemberKind(
    kind: NativeKind,
    property: PropertyKey,
): Exclude<NativeMemberKind, 'unsupported'> {
    const memberKind = nativeMemberKind(kind, property);
    if (memberKind === undefined || memberKind === 'unsupported') {
        throw new UnsupportedTypeError(`${kind}.${String(property)}`);
    }
    return memberKind;
}

export function isKnownReadonlyView(value: unknown): boolean {
    return isObjectLike(value) && knownViewSources.has(value);
}

export interface Membrane {
    wrap<T>(value: T): DeepReadonly<T>;
    unwrapSameMembrane(value: unknown): unknown;
}

export function createMembrane(): Membrane {
    const sourceToView = new WeakMap<object, object>();
    const viewToSource = new WeakMap<object, object>();
    const methodCache = new WeakMap<object, Map<PropertyKey, unknown>>();

    function cachedMethod(
        source: object,
        property: PropertyKey,
        create: () => unknown,
    ): unknown {
        let methods = methodCache.get(source);
        if (methods === undefined) {
            methods = new Map();
            methodCache.set(source, methods);
        }
        if (methods.has(property)) return methods.get(property);
        const method = create();
        methods.set(property, method);
        return method;
    }

    function arrayMethod(
        source: unknown[],
        property: PropertyKey,
        receiver: object,
        method: (...arguments_: unknown[]) => unknown,
    ): unknown {
        if (arrayMutators.has(property)) {
            return cachedMethod(
                source,
                property,
                () => () => mutation(source, String(property)),
            );
        }
        if (descriptorOwner(source, property) !== Array.prototype) {
            return wrap(method);
        }

        return cachedMethod(source, property, () => {
            if (
                property === Symbol.iterator ||
                property === 'entries' ||
                property === 'keys' ||
                property === 'values'
            ) {
                return () => {
                    const iterator = Reflect.apply(
                        method,
                        receiver,
                        [],
                    ) as Iterator<unknown>;
                    return {
                        next(): IteratorResult<unknown> {
                            const result = iterator.next();
                            return result.done
                                ? result
                                : { done: false, value: wrap(result.value) };
                        },
                        [Symbol.iterator]() {
                            return this;
                        },
                    };
                };
            }

            return (...arguments_: unknown[]) =>
                Reflect.apply(method, receiver, arguments_);
        });
    }

    function unwrapSameMembrane(value: unknown): unknown {
        return isObjectLike(value) ? (viewToSource.get(value) ?? value) : value;
    }

    function wrapIterator(
        iterator: Iterator<unknown>,
    ): IterableIterator<unknown> {
        return {
            next(): IteratorResult<unknown> {
                const result = iterator.next();
                return result.done
                    ? result
                    : { done: false, value: wrap(result.value) };
            },
            [Symbol.iterator]() {
                return this;
            },
        };
    }

    function mapProperty(
        source: Map<unknown, unknown>,
        property: PropertyKey,
        receiver: object,
    ): unknown {
        const owner = descriptorOwner(source, property);
        const classifiedKind = nativeMemberKind('Map', property);
        if (owner !== null && classifiedKind === 'mutator') {
            return cachedMethod(
                source,
                property,
                () => () => mutation(source, String(property)),
            );
        }
        if (owner !== Map.prototype) {
            return wrap(Reflect.get(source, property, receiver));
        }

        const memberKind = requiredNativeMemberKind('Map', property);
        if (memberKind === 'special' && property === 'size') return source.size;
        if (memberKind === 'read' && property === 'constructor') {
            return wrap(Reflect.get(source, property, receiver));
        }
        if (memberKind === 'special' && property === Symbol.toStringTag) {
            return Reflect.get(source, property, source);
        }

        return cachedMethod(source, property, () => {
            if (memberKind === 'mutator') {
                return () => mutation(source, String(property));
            }
            const method = Reflect.get(source, property, source) as (
                ...arguments_: unknown[]
            ) => unknown;
            if (memberKind === 'special' && property === 'get') {
                return (key: unknown) =>
                    wrap(
                        Reflect.apply(method, source, [
                            unwrapSameMembrane(key),
                        ]),
                    );
            }
            if (memberKind === 'special' && property === 'has') {
                return (key: unknown) =>
                    Reflect.apply(method, source, [unwrapSameMembrane(key)]);
            }
            if (memberKind === 'special' && property === 'forEach') {
                return (
                    callback: (
                        value: unknown,
                        key: unknown,
                        map: object,
                    ) => void,
                    thisArgument?: unknown,
                ) => {
                    return Reflect.apply(method, source, [
                        (value: unknown, key: unknown) =>
                            Reflect.apply(callback, thisArgument, [
                                wrap(value),
                                wrap(key),
                                receiver,
                            ]),
                    ]);
                };
            }
            if (
                memberKind === 'special' &&
                (property === Symbol.iterator ||
                    property === 'entries' ||
                    property === 'keys' ||
                    property === 'values')
            ) {
                return () =>
                    wrapIterator(
                        Reflect.apply(method, source, []) as Iterator<unknown>,
                    );
            }

            throw new UnsupportedTypeError(`Map.${String(property)}`);
        });
    }

    function setProperty(
        source: Set<unknown>,
        property: PropertyKey,
        receiver: object,
    ): unknown {
        const owner = descriptorOwner(source, property);
        const classifiedKind = nativeMemberKind('Set', property);
        if (owner !== null && classifiedKind === 'mutator') {
            return cachedMethod(
                source,
                property,
                () => () => mutation(source, String(property)),
            );
        }
        if (owner !== Set.prototype) {
            return wrap(Reflect.get(source, property, receiver));
        }

        const memberKind = requiredNativeMemberKind('Set', property);
        if (memberKind === 'special' && property === 'size') return source.size;
        if (memberKind === 'read' && property === 'constructor') {
            return wrap(Reflect.get(source, property, receiver));
        }
        if (memberKind === 'special' && property === Symbol.toStringTag) {
            return Reflect.get(source, property, source);
        }

        return cachedMethod(source, property, () => {
            if (memberKind === 'mutator') {
                return () => mutation(source, String(property));
            }
            if (memberKind === 'special' && property === 'has') {
                return (value: unknown) =>
                    source.has(unwrapSameMembrane(value));
            }
            if (memberKind === 'special' && property === 'forEach') {
                return (
                    callback: (
                        value: unknown,
                        second: unknown,
                        set: object,
                    ) => void,
                    thisArgument?: unknown,
                ) => {
                    return source.forEach((value) => {
                        const wrapped = wrap(value);
                        Reflect.apply(callback, thisArgument, [
                            wrapped,
                            wrapped,
                            receiver,
                        ]);
                    });
                };
            }
            const method: unknown = Reflect.get(source, property, source);
            if (typeof method !== 'function') return wrap(method);

            if (setCompositionMethods.has(property)) {
                return (other: unknown) => {
                    const result: unknown = Reflect.apply(method, source, [
                        nativeSetOperand(other),
                    ]);
                    return wrap(result);
                };
            }
            if (setRelationMethods.has(property)) {
                return (other: unknown) => {
                    const result: unknown = Reflect.apply(method, source, [
                        nativeSetOperand(other),
                    ]);
                    return result;
                };
            }
            if (
                memberKind === 'special' &&
                (property === Symbol.iterator ||
                    property === 'entries' ||
                    property === 'keys' ||
                    property === 'values')
            ) {
                return () =>
                    wrapIterator(
                        Reflect.apply(method, source, []) as Iterator<unknown>,
                    );
            }

            throw new UnsupportedTypeError(`Set.${String(property)}`);
        });
    }

    function dateProperty(
        source: Date,
        property: PropertyKey,
        receiver: object,
    ): unknown {
        const native = descriptorOwner(source, property) === Date.prototype;
        if (!native) return wrap(Reflect.get(source, property, receiver));
        const memberKind = requiredNativeMemberKind('Date', property);
        if (memberKind === 'read' && property === 'constructor') {
            return wrap(Reflect.get(source, property, receiver));
        }
        const value: unknown = Reflect.get(source, property, source);
        if (typeof value !== 'function') return wrap(value);
        return cachedMethod(source, property, () => {
            if (memberKind === 'mutator') {
                return () => mutation(source, String(property));
            }
            if (
                memberKind === 'special' &&
                (property === 'toJSON' || property === Symbol.toPrimitive)
            ) {
                return (...arguments_: unknown[]) => {
                    const result: unknown = Reflect.apply(
                        value,
                        receiver,
                        arguments_,
                    );
                    return wrap(result);
                };
            }
            return (...arguments_: unknown[]) => {
                const result: unknown = Reflect.apply(
                    value,
                    source,
                    arguments_,
                );
                return wrap(result);
            };
        });
    }

    function wrap<T>(value: T): DeepReadonly<T> {
        if (!isObjectLike(value)) return value as DeepReadonly<T>;
        if (knownViewSources.has(value)) return value as DeepReadonly<T>;

        const rejectedKind = unsupportedKind(value);
        if (rejectedKind !== undefined) {
            throw new UnsupportedTypeError(rejectedKind);
        }

        const cached = sourceToView.get(value);
        if (cached !== undefined) return cached as DeepReadonly<T>;

        const source = value;
        const shadow = Array.isArray(source)
            ? []
            : typeof source === 'function'
              ? function callableShadow(...arguments_: unknown[]): unknown {
                    void arguments_;
                    return undefined;
                }.bind(undefined)
              : (Object.create(Reflect.getPrototypeOf(source)) as object);
        const viewReference: { current?: object } = {};
        const handler: ProxyHandler<object> = {
            apply(_target, thisArgument: unknown, argumentsList: unknown[]) {
                const callableSource = source as (
                    ...arguments_: unknown[]
                ) => unknown;
                return wrap(
                    Reflect.apply(callableSource, thisArgument, argumentsList),
                );
            },
            construct(
                _target,
                argumentsList: unknown[],
                newTarget: RuntimeConstructor,
            ) {
                const constructed: unknown = Reflect.construct(
                    source as RuntimeConstructor,
                    argumentsList,
                    newTarget === viewReference.current
                        ? (source as RuntimeConstructor)
                        : newTarget,
                );
                return wrap(constructed) as object;
            },
            defineProperty(_target, property) {
                return mutation(source, 'define property', property);
            },
            deleteProperty(_target, property) {
                return mutation(source, 'delete', property);
            },
            get(_target, property, receiver: object) {
                if (source instanceof Date)
                    return dateProperty(source, property, receiver);
                if (source instanceof Map) {
                    return mapProperty(source, property, receiver);
                }
                if (source instanceof Set) {
                    return setProperty(source, property, receiver);
                }
                if (Array.isArray(source) && property === 'constructor') {
                    return Array;
                }

                const result: unknown = Reflect.get(source, property, receiver);
                if (Array.isArray(source) && typeof result === 'function') {
                    return arrayMethod(
                        source,
                        property,
                        receiver,
                        result as (...arguments_: unknown[]) => unknown,
                    );
                }
                return wrap(result);
            },
            getOwnPropertyDescriptor(_target, property) {
                const descriptor = Reflect.getOwnPropertyDescriptor(
                    source,
                    property,
                );
                if (descriptor === undefined) return undefined;

                if (Array.isArray(source) && property === 'length') {
                    return {
                        configurable: false,
                        enumerable: false,
                        value: source.length,
                        writable: true,
                    };
                }

                if ('value' in descriptor) {
                    return {
                        configurable: true,
                        enumerable: descriptor.enumerable ?? false,
                        value: wrap(descriptor.value),
                        writable: descriptor.writable ?? false,
                    };
                }

                const viewDescriptor: PropertyDescriptor = {
                    configurable: true,
                    enumerable: descriptor.enumerable ?? false,
                };

                if (descriptor.get !== undefined) {
                    const getter = descriptor.get;
                    viewDescriptor.get = function (this: unknown) {
                        return wrap(Reflect.apply(getter, this, []));
                    };
                }

                if (descriptor.set !== undefined) {
                    viewDescriptor.set = function () {
                        return mutation(source, 'set', property);
                    };
                }

                return viewDescriptor;
            },
            getPrototypeOf() {
                return wrap(Reflect.getPrototypeOf(source));
            },
            has(_target, property) {
                return Reflect.has(source, property);
            },
            ownKeys() {
                return Reflect.ownKeys(source);
            },
            preventExtensions() {
                return mutation(source, 'preventExtensions');
            },
            set(_target, property) {
                return mutation(source, 'set', property);
            },
            setPrototypeOf() {
                return mutation(source, 'setPrototypeOf');
            },
        };

        const view = new Proxy(shadow, handler);
        viewReference.current = view;
        sourceToView.set(source, view);
        viewToSource.set(view, source);
        knownViewSources.set(view, source);
        knownViewWrappers.set(view, wrap);
        return view as DeepReadonly<T>;
    }

    return {
        unwrapSameMembrane,
        wrap,
    };
}

export function readonlyView<T>(source: T): DeepReadonly<T> {
    if (!isObjectLike(source) || knownViewSources.has(source)) {
        return source as DeepReadonly<T>;
    }

    return createMembrane().wrap(source);
}
