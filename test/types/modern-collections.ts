/// <reference lib="es2025.collection" />

import type { DeepReadonly } from '../../src/index';

declare const setView: DeepReadonly<Set<{ id: number }>>;
declare const otherSet: ReadonlySet<{ label: string }>;

const unionResult = setView.union(otherSet);
const intersectionResult = setView.intersection(
    new Set<{ id: number; label: string }>(),
);
const differenceResult = setView.difference(otherSet);
const symmetricDifferenceResult = setView.symmetricDifference(otherSet);

const readonlyUnion: ReadonlySet<
    Readonly<{ id: number }> | Readonly<{ label: string }>
> = unionResult;
const readonlyIntersection: ReadonlySet<
    Readonly<{ id: number; label: string }>
> = intersectionResult;
const readonlyDifference: ReadonlySet<Readonly<{ id: number }>> =
    differenceResult;
const readonlySymmetricDifference: ReadonlySet<
    Readonly<{ id: number }> | Readonly<{ label: string }>
> = symmetricDifferenceResult;

const relationResult: boolean = setView.isSubsetOf(otherSet);
const supersetResult: boolean = setView.isSupersetOf(otherSet);
const disjointResult: boolean = setView.isDisjointFrom(otherSet);
const chainedResult = unionResult.difference(otherSet);

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

void readonlyUnion;
void readonlyIntersection;
void readonlyDifference;
void readonlySymmetricDifference;
void relationResult;
void supersetResult;
void disjointResult;
