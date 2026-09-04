import { describe, expect, it } from 'vitest';
import {
    DirectMutationError,
    isReadonlyView,
    readonlyView,
} from '../../src/index';

interface SetLike<Value> {
    readonly size: number;
    has(value: Value): boolean;
    keys(): Iterator<Value>;
}

type CompositionMethod =
    'union' | 'intersection' | 'difference' | 'symmetricDifference';

type RelationMethod = 'isSubsetOf' | 'isSupersetOf' | 'isDisjointFrom';

type ModernSet<Value> = Set<Value> & {
    [Method in CompositionMethod]: (other: SetLike<Value>) => Set<Value>;
} & {
    [Method in RelationMethod]: (other: SetLike<Value>) => boolean;
};

const compositionCases = [
    ['union', ['source', 'shared', 'operand']],
    ['intersection', ['shared']],
    ['difference', ['source']],
    ['symmetricDifference', ['source', 'operand']],
] as const satisfies readonly (readonly [
    CompositionMethod,
    readonly string[],
])[];

const relationCases = [
    ['isSubsetOf', false],
    ['isSupersetOf', false],
    ['isDisjointFrom', false],
] as const satisfies readonly (readonly [RelationMethod, boolean])[];

function hasSetMethod(methodName: CompositionMethod | RelationMethod): boolean {
    return typeof Reflect.get(Set.prototype, methodName) === 'function';
}

describe('Set', () => {
    it('reads live wrapped values and supports view lookup', () => {
        const value = { value: 1 };
        const source = new Set([value]);
        const view = readonlyView(source);
        const viewValue = [...view][0]!;

        expect(view.size).toBe(1);
        expect(viewValue).not.toBe(value);
        expect(view.has(value)).toBe(true);
        expect(view.has(viewValue)).toBe(true);
        expect([...view.entries()][0]).toEqual([viewValue, viewValue]);

        source.add({ value: 2 });
        expect(view.size).toBe(2);
    });

    it('wraps forEach values and rejects mutation', () => {
        const source = new Set([{ value: 1 }]);
        const view = readonlyView(source);
        view.forEach((value, secondValue, set) => {
            expect(value).toBe(secondValue);
            expect(value).toBe([...view][0]);
            expect(set).toBe(view);
        });

        expect(() => (view as Set<object>).add({})).toThrow(
            DirectMutationError,
        );
        expect(() => (view as Set<object>).delete({})).toThrow(
            DirectMutationError,
        );
        expect(() => (view as Set<object>).clear()).toThrow(
            DirectMutationError,
        );
        expect(source.size).toBe(1);
    });

    it('supports the native forEach thisArg', () => {
        const token = {};
        const view = readonlyView(new Set([1]));
        let called = false;

        view.forEach(function (this: unknown) {
            expect(this).toBe(token);
            called = true;
        }, token);

        expect(called).toBe(true);
    });

    it.each(compositionCases)(
        '%s accepts source and readonly-view operands and returns a readonly Set',
        (methodName, expectedIds) => {
            if (!hasSetMethod(methodName)) return;

            const sourceOnly = { id: 'source', nested: { value: 1 } };
            const shared = { id: 'shared', nested: { value: 2 } };
            const operandOnly = { id: 'operand', nested: { value: 3 } };
            const graph = {
                source: new Set([sourceOnly, shared]),
                operand: new Set([shared, operandOnly]),
            };
            const graphView = readonlyView(graph);
            const independentOperandView = readonlyView(graph.operand);
            const modernView = graphView.source as unknown as ModernSet<
                typeof sourceOnly
            >;
            const invoke = (operand: SetLike<typeof sourceOnly>) =>
                modernView[methodName].call(graphView.source, operand);

            for (const operand of [
                graph.operand,
                graphView.operand,
                independentOperandView,
            ]) {
                const result = invoke(operand);
                const members = [...result];

                expect(members.map((member) => member.id)).toEqual(expectedIds);
                expect(isReadonlyView(result)).toBe(true);
                expect(() =>
                    result.add({ id: 'new', nested: { value: 4 } }),
                ).toThrow(DirectMutationError);
                for (const member of members) {
                    expect(isReadonlyView(member)).toBe(true);
                    expect(() =>
                        Reflect.set(member.nested, 'value', 99),
                    ).toThrow(DirectMutationError);
                }
            }
        },
    );

    it.each(relationCases)(
        '%s accepts source and readonly-view operands',
        (methodName, expected) => {
            if (!hasSetMethod(methodName)) return;

            const shared = { id: 'shared' };
            const graph = {
                source: new Set([{ id: 'source' }, shared]),
                operand: new Set([shared, { id: 'operand' }]),
            };
            const graphView = readonlyView(graph);
            const independentOperandView = readonlyView(graph.operand);
            const modernView = graphView.source as unknown as ModernSet<
                typeof shared
            >;
            const invoke = (operand: SetLike<typeof shared>) =>
                modernView[methodName].call(graphView.source, operand);

            expect(invoke(graph.operand)).toBe(expected);
            expect(invoke(graphView.operand)).toBe(expected);
            expect(invoke(independentOperandView)).toBe(expected);
        },
    );
});
