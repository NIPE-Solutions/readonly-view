import { isReadonlyView, readonlyView } from '../../src/index';
import type { DeepReadonly } from '../../src/index';

const typedView = readonlyView({ nested: { value: 1 } });
const viewCheck: DeepReadonly<{ nested: { value: number } }> = typedView;
const predicateCheck: boolean = isReadonlyView(typedView);
void viewCheck;
void predicateCheck;

declare const primitive: DeepReadonly<string | number | null | undefined>;
const primitiveCheck: string | number | null | undefined = primitive;
void primitiveCheck;

declare const view: DeepReadonly<{
    readonly optional?: { value: string } | null;
    tuple: [number, { value: string }, ...Array<{ active: boolean }>];
    readonlyTuple: readonly ['fixed', { count: number }];
    map: Map<{ id: number }, { value: string }>;
    readonlyMap: ReadonlyMap<string, { value: string }>;
    set: Set<{ id: number }>;
    readonlySet: ReadonlySet<{ id: number }>;
    date: Date;
    method(value: number): string;
}>;

// @ts-expect-error nested optional value is readonly
view.optional!.value = 'changed';
// @ts-expect-error tuple element is deeply readonly
view.tuple[1].value = 'changed';
// @ts-expect-error tuple rest element is deeply readonly
view.tuple[2]!.active = false;
// @ts-expect-error readonly tuple cannot be assigned
view.readonlyTuple[1].count = 2;
// @ts-expect-error map is readonly
view.map.set({ id: 1 }, { value: 'x' });
// @ts-expect-error map values are deeply readonly
view.readonlyMap.get('x')!.value = 'changed';
// @ts-expect-error set is readonly
view.set.add({ id: 1 });
// @ts-expect-error set values are deeply readonly
for (const value of view.readonlySet) value.id = 2;
// @ts-expect-error Date mutation is absent
view.date.setTime(0);

const methodResult: string = view.method(1);
void methodResult;

declare const functionView: DeepReadonly<() => { value: number }>;
// @ts-expect-error function results are deeply readonly at runtime and in types
functionView().value = 2;

declare class Constructed {
    value: number;
}
declare const constructorView: DeepReadonly<typeof Constructed>;
const constructed = new constructorView();
// @ts-expect-error constructed results are deeply readonly
constructed.value = 2;

type RecursiveNode = {
    value: number;
    next?: RecursiveNode;
};
declare const node: DeepReadonly<RecursiveNode>;
// @ts-expect-error recursive properties are readonly
node.next!.value = 2;

declare const symbolKey: unique symbol;
declare const symbolView: DeepReadonly<{ [symbolKey]: { value: number } }>;
// @ts-expect-error symbol-keyed nested values are readonly
symbolView[symbolKey].value = 2;

type Union =
    { kind: 'a'; value: { count: number } } | { kind: 'b'; value: string };
declare const union: DeepReadonly<Union>;
if (union.kind === 'a') {
    // @ts-expect-error unions distribute and nested values are readonly
    union.value.count = 2;
}
