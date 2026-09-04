/// <reference lib="es2025.collection" />

import type { DeepReadonly } from '../../src/index';

type ModernSetMethod =
    | 'union'
    | 'intersection'
    | 'difference'
    | 'symmetricDifference'
    | 'isSubsetOf'
    | 'isSupersetOf'
    | 'isDisjointFrom';

type ReadonlySetBase<Value> = Omit<ReadonlySet<Value>, ModernSetMethod>;

declare const setView: DeepReadonly<Set<{ id: number }>>;
declare const otherSet: ReadonlySet<{ label: string }>;

const unionResult = setView.union(otherSet);
const intersectionResult = setView.intersection(
    new Set<{ id: number; label: string }>(),
);
const differenceResult = setView.difference(otherSet);
const symmetricDifferenceResult = setView.symmetricDifference(otherSet);

const readonlyUnion: ReadonlySetBase<
    Readonly<{ id: number }> | Readonly<{ label: string }>
> = unionResult;
const readonlyIntersection: ReadonlySetBase<
    Readonly<{ id: number; label: string }>
> = intersectionResult;
const readonlyDifference: ReadonlySetBase<Readonly<{ id: number }>> =
    differenceResult;
const readonlySymmetricDifference: ReadonlySetBase<
    Readonly<{ id: number }> | Readonly<{ label: string }>
> = symmetricDifferenceResult;

const relationResult: boolean = setView.isSubsetOf(otherSet);
const supersetResult: boolean = setView.isSupersetOf(otherSet);
const disjointResult: boolean = setView.isDisjointFrom(otherSet);
const chainedResult = unionResult.difference(otherSet);
declare const unionReturnTypeResult: ReturnType<typeof setView.union>;
declare const intersectionReturnTypeResult: ReturnType<
    typeof setView.intersection
>;
declare const differenceReturnTypeResult: ReturnType<typeof setView.difference>;
declare const symmetricDifferenceReturnTypeResult: ReturnType<
    typeof setView.symmetricDifference
>;

// @ts-expect-error Set composition results are readonly views at runtime
unionResult.add({ id: 2 });
// @ts-expect-error Set composition members are deeply readonly
for (const value of intersectionResult) value.label = 'changed';
// @ts-expect-error difference results expose no delete operation
differenceResult.delete({ id: 1 });
// @ts-expect-error symmetric difference members are deeply readonly
for (const value of symmetricDifferenceResult) value.label = 'changed';
// @ts-expect-error chained composition results stay readonly
chainedResult.clear();
// @ts-expect-error union utility types expose no mutable native overload
unionReturnTypeResult.add({ id: 2 });
// @ts-expect-error intersection utility types expose no mutable native overload
intersectionReturnTypeResult.add({ id: 2 });
// @ts-expect-error difference utility types expose no mutable native overload
differenceReturnTypeResult.add({ id: 2 });
// @ts-expect-error symmetric difference utility types expose no mutable native overload
symmetricDifferenceReturnTypeResult.add({ id: 2 });

void readonlyUnion;
void readonlyIntersection;
void readonlyDifference;
void readonlySymmetricDifference;
void relationResult;
void supersetResult;
void disjointResult;
