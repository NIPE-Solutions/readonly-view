type Primitive = null | undefined | string | number | boolean | bigint | symbol;

type DateMutator = Extract<keyof Date, `set${string}`>;

type ReadonlyDate = Readonly<Omit<Date, DateMutator>>;

type DeepReadonlyFunction<T extends (...arguments_: never[]) => unknown> = ((
    ...arguments_: Parameters<T>
) => DeepReadonly<ReturnType<T>>) & {
    readonly [Key in keyof T]: DeepReadonly<T[Key]>;
};

type DeepReadonlyConstructor<
    T extends abstract new (...arguments_: never[]) => object,
> = T extends new (...arguments_: infer Arguments) => infer Instance
    ? (new (...arguments_: Arguments) => DeepReadonly<Instance>) & {
          readonly [Key in keyof T]: DeepReadonly<T[Key]>;
      }
    : T;

export type DeepReadonly<T> = T extends Primitive
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
                ? ReadonlySet<DeepReadonly<Value>>
                : T extends object
                  ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
                  : T;
