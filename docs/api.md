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

A distributive recursive type for objects, arrays/tuples, Map, Set, Date, functions, constructors, optionals, nullability, symbols, unions, and recursive structures. Function and constructor results are deeply readonly. TypeScript cannot generically transform every overload or generic call signature without losing information; complex callable APIs may need a user-defined public interface.
