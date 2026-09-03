import { isObjectLike } from './classify';
import { DirectMutationError } from './errors';
import type { DeepReadonly } from './public-types';

const knownViews = new WeakSet<object>();
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

function objectKind(source: object): string {
    return Array.isArray(source) ? 'Array' : 'Object';
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

export function isKnownReadonlyView(value: unknown): boolean {
    return isObjectLike(value) && knownViews.has(value);
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
        return cachedMethod(source, property, () => {
            if (arrayMutators.has(property)) {
                return () => mutation(source, String(property));
            }

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

    function wrap<T>(value: T): DeepReadonly<T> {
        if (!isObjectLike(value)) return value as DeepReadonly<T>;
        if (knownViews.has(value)) return value as DeepReadonly<T>;

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
                    newTarget,
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
                return Reflect.getPrototypeOf(source);
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
        sourceToView.set(source, view);
        viewToSource.set(view, source);
        knownViews.add(view);
        return view as DeepReadonly<T>;
    }

    return {
        unwrapSameMembrane(value: unknown): unknown {
            return isObjectLike(value)
                ? (viewToSource.get(value) ?? value)
                : value;
        },
        wrap,
    };
}

export function readonlyView<T>(source: T): DeepReadonly<T> {
    if (!isObjectLike(source) || knownViews.has(source)) {
        return source as DeepReadonly<T>;
    }

    return createMembrane().wrap(source);
}
