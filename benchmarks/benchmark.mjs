import { performance } from 'node:perf_hooks';
import { readonlyView } from '../dist/index.js';

const smoke = process.argv.includes('--smoke');
const iterations = smoke ? 100 : 100000;

function bench(name, operation) {
    const start = performance.now();
    let result;
    for (let index = 0; index < iterations; index += 1) result = operation();
    const elapsed = performance.now() - start;
    if (result === undefined) throw new Error(name + ' returned undefined');
    console.log(
        name.padEnd(24) +
            ' ' +
            elapsed.toFixed(2) +
            ' ms (' +
            iterations +
            ' iterations)',
    );
}

const shared = { value: 1 };
const source = {
    nested: { child: shared },
    array: Array.from({ length: 100 }, (_, value) => ({ value })),
    map: new Map([['x', shared]]),
    set: new Set([shared]),
    date: new Date(0),
};
const view = readonlyView(source);
const largeSource = Object.fromEntries(
    Array.from({ length: 10000 }, (_, index) => ['key' + index, { index }]),
);
const deepSource = { one: { two: { three: { four: { value: 1 } } } } };
const deepView = readonlyView(deepSource);

console.log(
    'Node ' + process.version + '; ' + process.platform + '/' + process.arch,
);
bench('plain nested read', () => source.nested.child.value);
bench('view repeated read', () => view.nested.child.value);
bench('view creation', () => readonlyView(source));
bench('first nested access', () => readonlyView(source).nested.child.value);
bench('large object creation', () => readonlyView(largeSource));
bench('deep nested read', () => deepView.one.two.three.four.value);
bench('array iteration', () =>
    view.array.reduce((sum, item) => sum + item.value, 0),
);
bench('Map read', () => view.map.get('x')?.value ?? 0);
bench('Set iteration', () => [...view.set][0]?.value ?? 0);
bench('Date read', () => view.date.getTime());
bench('shallow freeze', () => Object.freeze({ ...source }).nested.child.value);

function deepFreeze(value, seen = new WeakSet()) {
    if (typeof value !== 'object' || value === null || seen.has(value))
        return value;
    seen.add(value);
    for (const nested of Object.values(value)) deepFreeze(nested, seen);
    return Object.freeze(value);
}
bench(
    'recursive deep freeze',
    () => deepFreeze({ nested: { child: { value: 1 } } }).nested.child.value,
);
