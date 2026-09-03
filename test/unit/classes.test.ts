import { describe, expect, it } from 'vitest';
import { DirectMutationError, readonlyView } from '../../src/index';

class Account {
    balance = 100;
    #secret = 7;

    withdraw(amount: number) {
        this.balance -= amount;
    }

    readBalance() {
        return this.balance;
    }

    readSecret() {
        return this.#secret;
    }
}

describe('custom classes', () => {
    it('protects public fields and prototype access', () => {
        const source = new Account();
        const view = readonlyView(source);

        expect(view).not.toBeInstanceOf(Account);
        expect(Object.getPrototypeOf(view)).not.toBe(Account.prototype);
        expect(view.readBalance()).toBe(100);
        expect(() => view.withdraw(10)).toThrow(DirectMutationError);
        expect(source.balance).toBe(100);
    });

    it('wraps normally constructed instances', () => {
        class Value {
            constructor(public value: number) {}
        }
        const ViewValue = readonlyView(Value);
        const result = new ViewValue(1);

        expect(result.value).toBe(1);
        expect(() => Reflect.set(result, 'value', 2)).toThrow(
            DirectMutationError,
        );
        expect(result).not.toBeInstanceOf(Value);
    });

    it('preserves native private-brand rejection', () => {
        const view = readonlyView(new Account());

        expect(() => view.readSecret()).toThrow(TypeError);
    });
});
