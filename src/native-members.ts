export type NativeKind = 'Map' | 'Set' | 'Date';
export type NativeMemberKind = 'read' | 'mutator' | 'special' | 'unsupported';

interface NativeMemberPolicy {
    readonly read: ReadonlySet<PropertyKey>;
    readonly mutator: ReadonlySet<PropertyKey>;
    readonly special: ReadonlySet<PropertyKey>;
    readonly unsupported: ReadonlySet<PropertyKey>;
}

const mapPolicy: NativeMemberPolicy = {
    read: new Set<PropertyKey>(['constructor']),
    mutator: new Set<PropertyKey>([
        'clear',
        'delete',
        'getOrInsert',
        'getOrInsertComputed',
        'set',
    ]),
    special: new Set<PropertyKey>([
        'entries',
        'forEach',
        'get',
        'has',
        'keys',
        'size',
        'values',
        Symbol.iterator,
        Symbol.toStringTag,
    ]),
    unsupported: new Set<PropertyKey>(),
};

const setPolicy: NativeMemberPolicy = {
    read: new Set<PropertyKey>(['constructor']),
    mutator: new Set<PropertyKey>(['add', 'clear', 'delete']),
    special: new Set<PropertyKey>([
        'difference',
        'entries',
        'forEach',
        'has',
        'intersection',
        'isDisjointFrom',
        'isSubsetOf',
        'isSupersetOf',
        'keys',
        'size',
        'symmetricDifference',
        'union',
        'values',
        Symbol.iterator,
        Symbol.toStringTag,
    ]),
    unsupported: new Set<PropertyKey>(),
};

const datePolicy: NativeMemberPolicy = {
    read: new Set<PropertyKey>([
        'constructor',
        'getDate',
        'getDay',
        'getFullYear',
        'getHours',
        'getMilliseconds',
        'getMinutes',
        'getMonth',
        'getSeconds',
        'getTime',
        'getTimezoneOffset',
        'getUTCDate',
        'getUTCDay',
        'getUTCFullYear',
        'getUTCHours',
        'getUTCMilliseconds',
        'getUTCMinutes',
        'getUTCMonth',
        'getUTCSeconds',
        'getYear',
        'toDateString',
        'toGMTString',
        'toISOString',
        'toLocaleDateString',
        'toLocaleString',
        'toLocaleTimeString',
        'toString',
        'toTimeString',
        'toUTCString',
        'valueOf',
    ]),
    mutator: new Set<PropertyKey>([
        'setDate',
        'setFullYear',
        'setHours',
        'setMilliseconds',
        'setMinutes',
        'setMonth',
        'setSeconds',
        'setTime',
        'setUTCDate',
        'setUTCFullYear',
        'setUTCHours',
        'setUTCMilliseconds',
        'setUTCMinutes',
        'setUTCMonth',
        'setUTCSeconds',
        'setYear',
    ]),
    special: new Set<PropertyKey>(['toJSON', Symbol.toPrimitive]),
    unsupported: new Set<PropertyKey>(),
};

const nativePolicies: ReadonlyMap<NativeKind, NativeMemberPolicy> = new Map([
    ['Map', mapPolicy],
    ['Set', setPolicy],
    ['Date', datePolicy],
]);

const nativeMemberKinds = [
    'read',
    'mutator',
    'special',
    'unsupported',
] as const;

export function nativeMemberKind(
    kind: NativeKind,
    property: PropertyKey,
): NativeMemberKind | undefined {
    const policy = nativePolicies.get(kind);
    for (const memberKind of nativeMemberKinds) {
        if (policy?.[memberKind].has(property) === true) return memberKind;
    }
    return undefined;
}
