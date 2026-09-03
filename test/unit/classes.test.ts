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
    it('preserves prototypes while protecting public fields', () => {
        const source = new Account();
        const view = readonlyView(source);

        expect(view).toBeInstanceOf(Account);
        expect(view.readBalance()).toBe(100);
        expect(() => view.withdraw(10)).toThrow(DirectMutationError);
        expect(source.balance).toBe(100);
    });

    it('preserves native private-brand rejection', () => {
        const view = readonlyView(new Account());

        expect(() => view.readSecret()).toThrow(TypeError);
    });
});
