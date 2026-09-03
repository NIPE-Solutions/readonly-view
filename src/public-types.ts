type Primitive = null | undefined | string | number | boolean | bigint | symbol;

type DateMutator = Extract<keyof Date, `set${string}`>;

type ReadonlyDate = Readonly<Omit<Date, DateMutator>>;

type DeepReadonlyFunction<T extends (...arguments_: never[]) => unknown> = ((
    ...arguments_: Parameters<T>
) => ReturnType<T>) & {
    readonly [Key in keyof T]: DeepReadonly<T[Key]>;
};

export type DeepReadonly<T> = T extends Primitive
    ? T
    : T extends (...arguments_: never[]) => unknown
      ? DeepReadonlyFunction<T>
      : T extends Date
        ? ReadonlyDate
        : T extends readonly unknown[]
          ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
          : T extends ReadonlyMap<infer Key, infer Value>
            ? ReadonlyMap<DeepReadonly<Key>, DeepReadonly<Value>>
            : T extends ReadonlySet<infer Value>
              ? ReadonlySet<DeepReadonly<Value>>
              : T extends object
                ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
                : T;
