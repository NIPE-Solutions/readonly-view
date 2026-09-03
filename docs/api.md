# API reference

## readonlyView

`readonlyView<T>(source: T): DeepReadonly<T>` returns primitives unchanged and objects as independent deeply readonly live views.

## isReadonlyView

`isReadonlyView(value: unknown): boolean` recognizes package views.

## DirectMutationError

Fields: `operation`, optional `property`, and `objectKind`.

## UnsupportedTypeError

Field: `kind`.

## DeepReadonly

A distributive recursive type for objects, arrays/tuples, Map, Set, Date, functions, optionals, nullability, symbols, unions, and recursive structures.
