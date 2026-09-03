function formatProperty(property: PropertyKey): string {
    if (typeof property === 'symbol') {
        return String(property);
    }

    return JSON.stringify(String(property));
}

export class DirectMutationError extends Error {
    override readonly name = 'DirectMutationError';
    readonly operation: string;
    readonly property?: PropertyKey;
    readonly objectKind: string;

    constructor(details: {
        readonly operation: string;
        readonly property?: PropertyKey;
        readonly objectKind: string;
    }) {
        const propertyMessage =
            details.property === undefined
                ? ''
                : ` property ${formatProperty(details.property)}`;

        super(
            `Cannot mutate readonly view: attempted to ${details.operation}${propertyMessage} on ${details.objectKind}.`,
        );

        this.operation = details.operation;
        this.objectKind = details.objectKind;

        if (details.property !== undefined) {
            this.property = details.property;
        }
    }
}

export class UnsupportedTypeError extends Error {
    override readonly name = 'UnsupportedTypeError';
    readonly kind: string;

    constructor(kind: string) {
        super(
            `Cannot create a readonly view for unsupported value type ${kind}.`,
        );
        this.kind = kind;
    }
}
