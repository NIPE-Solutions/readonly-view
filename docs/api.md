# API reference

ReadonlyView exposes a small public API for publishing a live, deeply readonly access path. See the [ownership mental model](mental-model.md) for the owner/consumer boundary and [guarantees and non-guarantees](guarantees.md) for the complete runtime contract.

## `readonlyView`

### Signature

```ts
function readonlyView<T>(source: T): DeepReadonly<T>;
```

### Purpose

Creates an independent readonly membrane around a supported object-like source. It is for an owner that continues to mutate its source while consumers read the current graph without a mutation path through the returned view.

### Minimal example

```ts
import { readonlyView } from '@nipe-solutions/readonly-view';

const source = { status: 'connecting' };
const view = readonlyView(source);

source.status = 'connected';
console.log(view.status); // connected
```

### Guarantees

- Reads observe the owner’s current source state.
- Writes through supported view paths throw `DirectMutationError`.
- Nested supported values are wrapped lazily, without an eager graph walk.
- Shared references and cycles keep stable identity within one membrane.
- The source is not intentionally frozen, sealed, copied, or otherwise mutated by wrapping.

### Edge cases

Primitives are returned unchanged. Passing an existing ReadonlyView returns it unchanged. Each call with a non-view object creates an independent membrane, so wrappers from two calls are not identical even when they wrap the same source. Unsupported roots throw immediately; unsupported nested values throw only when consumer code reaches them. Consult [supported types](supported-types.md) for the inventory and [security and trust](security-and-trust.md) for alias and hostile-code limits.

## `isReadonlyView`

### Signature

```ts
function isReadonlyView(value: unknown): boolean;
```

### Purpose

Recognizes views created by this package. Use it when an API needs to distinguish a ReadonlyView from an ordinary object before deciding whether to wrap or handle it specially.

### Minimal example

```ts
import { isReadonlyView, readonlyView } from '@nipe-solutions/readonly-view';

const view = readonlyView({ enabled: true });
console.log(isReadonlyView(view)); // true
console.log(isReadonlyView({ enabled: true })); // false
```

### Guarantees

It returns `true` for package views, which `readonlyView` treats idempotently. It does not claim that an arbitrary proxy, frozen object, or TypeScript readonly value is a ReadonlyView.

### Edge cases

The predicate is about the package’s runtime views, not structural typing. Primitives and unrelated objects return `false`.

## `DirectMutationError`

### Signature

```ts
class DirectMutationError extends Error {
    readonly name: 'DirectMutationError';
    readonly operation: string;
    readonly property?: PropertyKey;
    readonly objectKind: string;
    constructor(details: {
        readonly operation: string;
        readonly property?: PropertyKey;
        readonly objectKind: string;
    });
}
```

### Purpose

Signals that code attempted to mutate a supported value through a ReadonlyView. Catch it when mutation attempts are an expected boundary check; normally, letting it surface identifies an API misuse.

### Minimal example

```ts
import {
    DirectMutationError,
    readonlyView,
} from '@nipe-solutions/readonly-view';

const view = readonlyView({ settings: { retries: 3 } });

try {
    Reflect.set(view.settings, 'retries', 5);
} catch (error) {
    if (error instanceof DirectMutationError) {
        console.log(error.operation, error.property, error.objectKind);
    }
}
```

### Guarantees

The error has `name === 'DirectMutationError'`, an `operation`, an `objectKind`, and a `property` when that operation applies to a property. These fields are metadata for diagnostics; the source remains unchanged after the rejected write.

### Edge cases

Collection and object operations can have different operation/property combinations, so treat `property` as optional. This error describes mutation through a supported view path, not mutation through an original source alias.

## `UnsupportedTypeError`

### Signature

```ts
class UnsupportedTypeError extends Error {
    readonly name: 'UnsupportedTypeError';
    readonly kind: string;
    constructor(kind: string);
}
```

### Purpose

Signals that ReadonlyView cannot safely protect a native or otherwise unsupported value, or that a sensitive built-in exposes an unclassified native member.

### Minimal example

```ts
import {
    readonlyView,
    UnsupportedTypeError,
} from '@nipe-solutions/readonly-view';

try {
    readonlyView(/pattern/);
} catch (error) {
    if (error instanceof UnsupportedTypeError) {
        console.log(error.kind); // RegExp
    }
}
```

### Guarantees

The error has `name === 'UnsupportedTypeError'` and a `kind` naming the unsupported value type or native member. Unsupported roots fail during wrapping; unsupported values deeper in an otherwise supported graph fail lazily when accessed. An unclassified Map, Set, or Date prototype member fails before its implementation is invoked with the mutable source.

### Edge cases

Do not use this as a generic validation error. It is a deliberate fail-closed boundary for values and native operations that need dedicated handling. See the [supported type matrix](supported-types.md) for the current list and rationale.

## `DeepReadonly`

### Signature

```ts
type DeepReadonly<T> = T extends Primitive
    ? T
    : T extends abstract new (...arguments_: never[]) => object
      ? DeepReadonlyConstructor<T>
      : T extends (...arguments_: never[]) => unknown
        ? DeepReadonlyFunction<T>
        : T extends Date
          ? ReadonlyDate
          : T extends readonly unknown[]
            ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
            : T extends ReadonlyMap<infer Key, infer Value>
              ? ReadonlyMap<DeepReadonly<Key>, DeepReadonly<Value>>
              : T extends ReadonlySet<infer Value>
                ? DeepReadonlySet<Value>
                : T extends object
                  ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
                  : T;
```

This is the exported conditional type; its private helper aliases are omitted here for readability. See the [source declaration](../src/public-types.ts) for those helper definitions.

### Purpose

Models the compile-time shape returned by `readonlyView`. It recursively preserves primitives while presenting objects, arrays/tuples, `Map`, `Set`, and `Date` with readonly operations; nested results are readonly too.

### Minimal example

```ts
import { readonlyView, type DeepReadonly } from '@nipe-solutions/readonly-view';

type PluginContext = { configuration: { retries: number } };

const context: DeepReadonly<PluginContext> = readonlyView({
    configuration: { retries: 3 },
});

// @ts-expect-error nested property is readonly
context.configuration.retries = 5;
```

### Guarantees

`DeepReadonly<T>` is distributive across unions and retains optionals, nullability, symbols, recursive structures, readonly collection APIs, and deeply readonly function/constructor results. It models the supported runtime contract but does not itself add runtime enforcement.

### Edge cases

TypeScript cannot generically preserve every overloaded or generic callable signature while transforming its return type. For complex callable APIs, publish a user-defined readonly interface at the boundary. A successful `DeepReadonly<T>` type also does not make an unsupported runtime value supported; rely on the [supported types](supported-types.md) list for runtime behavior.
