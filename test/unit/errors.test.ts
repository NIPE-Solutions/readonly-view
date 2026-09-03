import { describe, expect, it } from 'vitest';
import { DirectMutationError, UnsupportedTypeError } from '../../src/index';

describe('DirectMutationError', () => {
    it('reports a property mutation without retaining the source', () => {
        const error = new DirectMutationError({
            objectKind: 'Object',
            operation: 'set',
            property: 'name',
        });

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(DirectMutationError);
        expect(error.name).toBe('DirectMutationError');
        expect(error.message).toBe(
            'Cannot mutate readonly view: attempted to set property "name" on Object.',
        );
        expect(error.operation).toBe('set');
        expect(error.property).toBe('name');
        expect(error.objectKind).toBe('Object');
        expect(Object.keys(error)).not.toContain('source');
    });

    it('formats symbol properties without inspecting a source object', () => {
        const property = Symbol('secret');
        const error = new DirectMutationError({
            objectKind: 'Object',
            operation: 'delete',
            property,
        });

        expect(error.message).toBe(
            'Cannot mutate readonly view: attempted to delete property Symbol(secret) on Object.',
        );
        expect(error.property).toBe(property);
    });

    it('reports operations that have no property', () => {
        const error = new DirectMutationError({
            objectKind: 'Array',
            operation: 'preventExtensions',
        });

        expect(error.message).toBe(
            'Cannot mutate readonly view: attempted to preventExtensions on Array.',
        );
        expect(error.property).toBeUndefined();
    });
});

describe('UnsupportedTypeError', () => {
    it('reports only the unsupported kind', () => {
        const error = new UnsupportedTypeError('RegExp');

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(UnsupportedTypeError);
        expect(error.name).toBe('UnsupportedTypeError');
        expect(error.kind).toBe('RegExp');
        expect(error.message).toBe(
            'Cannot create a readonly view for unsupported value type RegExp.',
        );
    });
});
