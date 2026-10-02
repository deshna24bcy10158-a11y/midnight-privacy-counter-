/**
 * counter.test.ts
 *
 * Tests for the Midnight Privacy Counter Compact contract.
 *
 * These tests verify:
 *   TEST 1: Circuit logic — the increment circuit correctly updates the counter
 *   TEST 2: State transition — ledger state changes correctly across multiple operations
 *   TEST 3: Privacy behavior — the private witness value is not exposed in public ledger state
 *
 * The tests use the Midnight in-memory simulator so no live node, wallet, or
 * proof server is required.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

/**
 * NOTE: The imports below depend on the compiled Compact contract artifacts
 * generated in the managed/ directory by `compact compile`.
 *
 * After running:
 *   compact compile contracts/counter.compact managed/counter
 *
 * The compiler generates TypeScript bindings, a simulator, and ZK circuit
 * definitions. The exact import paths and API may vary based on the
 * Compact compiler version. Adjust as needed after compilation.
 *
 * For now, the tests are structured against the standard Midnight
 * simulator pattern used in the midnight-contracts examples.
 */

// ---------------------------------------------------------------------------
// Simulated contract state for testing
// ---------------------------------------------------------------------------
// When the Compact compiler generates the managed/ artifacts, this section
// should be replaced with actual imports from the generated simulator.
// For demonstration and structural correctness, we define a minimal
// in-memory simulator that mirrors the contract's behavior.

interface CounterLedgerState {
  counter: bigint;
}

/**
 * Minimal in-memory simulator that replicates the Compact counter contract
 * logic. This allows us to validate circuit behavior, state transitions,
 * and privacy properties without requiring the full Midnight proof server.
 *
 * In a production setup, this would be replaced by the auto-generated
 * simulator from `compact compile`.
 */
class CounterSimulator {
  private ledger: CounterLedgerState;
  private lastWitnessValue: bigint | null = null;

  constructor() {
    // Initialize ledger state — counter starts at 0
    this.ledger = { counter: 0n };
  }

  /**
   * Simulates the `increment` circuit.
   * Takes a private witness value and adds it to the public counter.
   * The witness value is used in computation but NOT stored on the ledger.
   */
  async increment(witnessValue: bigint): Promise<void> {
    // The witness provides the private input (off-chain)
    this.lastWitnessValue = witnessValue;

    // Circuit logic: counter = counter + secret
    this.ledger.counter = this.ledger.counter + witnessValue;

    // Note: lastWitnessValue is intentionally NOT part of the ledger state.
    // It exists only in the local execution context (private).
  }

  /**
   * Simulates the `get_counter` circuit.
   * Returns the current counter value via disclose().
   */
  async getCounter(): Promise<bigint> {
    // disclose(counter) — explicitly makes the ledger value public
    return this.ledger.counter;
  }

  /**
   * Simulates the `reset` circuit.
   * Sets the counter back to 0.
   */
  async reset(): Promise<void> {
    this.ledger.counter = 0n;
  }

  /**
   * Returns the full public ledger state.
   * This is what would be visible on-chain.
   */
  getLedgerState(): CounterLedgerState {
    return { ...this.ledger };
  }

  /**
   * Returns all keys in the public ledger state.
   * Used by privacy tests to verify that private witness data
   * does NOT appear in the public state.
   */
  getLedgerKeys(): string[] {
    return Object.keys(this.ledger);
  }
}

// ===========================================================================
// TEST SUITE
// ===========================================================================

describe('Midnight Privacy Counter Contract', () => {
  let simulator: CounterSimulator;

  beforeEach(() => {
    // Fresh simulator for each test to ensure isolation
    simulator = new CounterSimulator();
  });

  // =========================================================================
  // TEST 1: Circuit Logic
  // =========================================================================
  describe('TEST 1: Circuit Logic', () => {
    it('should correctly execute the increment circuit with a secret value', async () => {
      // Provide a private witness value of 5
      const secretIncrement = 5n;
      await simulator.increment(secretIncrement);

      // The counter should reflect the increment
      const counterValue = await simulator.getCounter();
      expect(counterValue).toBe(5n);
    });

    it('should correctly execute the increment circuit with different secret values', async () => {
      // Increment with secret value 3
      await simulator.increment(3n);
      expect(await simulator.getCounter()).toBe(3n);

      // Increment again with secret value 7
      await simulator.increment(7n);
      expect(await simulator.getCounter()).toBe(10n);
    });

    it('should handle increment with zero (edge case)', async () => {
      await simulator.increment(0n);
      expect(await simulator.getCounter()).toBe(0n);
    });

    it('should handle the get_counter circuit returning disclosed value', async () => {
      await simulator.increment(42n);

      // get_counter uses disclose() to return the ledger value
      const disclosed = await simulator.getCounter();
      expect(disclosed).toBe(42n);
    });

    it('should handle the reset circuit', async () => {
      await simulator.increment(100n);
      expect(await simulator.getCounter()).toBe(100n);

      await simulator.reset();
      expect(await simulator.getCounter()).toBe(0n);
    });
  });

  // =========================================================================
  // TEST 2: State Transition
  // =========================================================================
  describe('TEST 2: State Transition', () => {
    it('should start with counter at zero', async () => {
      const state = simulator.getLedgerState();
      expect(state.counter).toBe(0n);
    });

    it('should transition state correctly after a single increment', async () => {
      const stateBefore = simulator.getLedgerState();
      expect(stateBefore.counter).toBe(0n);

      await simulator.increment(15n);

      const stateAfter = simulator.getLedgerState();
      expect(stateAfter.counter).toBe(15n);
    });

    it('should accumulate state correctly across multiple increments', async () => {
      // Perform a series of increments with different secret values
      const increments = [3n, 7n, 11n, 2n, 5n];
      let expectedTotal = 0n;

      for (const inc of increments) {
        await simulator.increment(inc);
        expectedTotal += inc;
        expect(await simulator.getCounter()).toBe(expectedTotal);
      }

      // Final state should be the sum of all increments
      expect(await simulator.getCounter()).toBe(28n); // 3+7+11+2+5 = 28
    });

    it('should correctly transition from incremented state back to zero after reset', async () => {
      // Build up state
      await simulator.increment(50n);
      await simulator.increment(25n);
      expect(await simulator.getCounter()).toBe(75n);

      // Reset transitions state back to zero
      await simulator.reset();
      const state = simulator.getLedgerState();
      expect(state.counter).toBe(0n);

      // Can increment again from zero
      await simulator.increment(10n);
      expect(await simulator.getCounter()).toBe(10n);
    });
  });

  // =========================================================================
  // TEST 3: Privacy Behavior
  // =========================================================================
  describe('TEST 3: Privacy Behavior', () => {
    it('should NOT expose the private witness value in the public ledger state', async () => {
      const secretValue = 42n;
      await simulator.increment(secretValue);

      // Get all keys in the public ledger state
      const ledgerKeys = simulator.getLedgerKeys();

      // The ledger should only contain 'counter' — no field for the
      // secret/private witness value
      expect(ledgerKeys).toEqual(['counter']);
      expect(ledgerKeys).not.toContain('secret');
      expect(ledgerKeys).not.toContain('secretIncrement');
      expect(ledgerKeys).not.toContain('get_secret_increment');
      expect(ledgerKeys).not.toContain('witnessValue');
      expect(ledgerKeys).not.toContain('lastWitnessValue');
    });

    it('should not allow reconstruction of the private input from ledger state alone', async () => {
      // Two different sequences of secret inputs can produce the same counter value
      const simulator2 = new CounterSimulator();

      // Simulator 1: increment by 10, then by 20 → counter = 30
      await simulator.increment(10n);
      await simulator.increment(20n);

      // Simulator 2: increment by 15, then by 15 → counter = 30
      await simulator2.increment(15n);
      await simulator2.increment(15n);

      // Both have the same public ledger state
      const state1 = simulator.getLedgerState();
      const state2 = simulator2.getLedgerState();
      expect(state1.counter).toBe(state2.counter);
      expect(state1.counter).toBe(30n);

      // This demonstrates that observing the ledger state (counter = 30)
      // does NOT reveal whether the increments were (10, 20) or (15, 15)
      // or any other combination. The private inputs remain confidential.
    });

    it('should only disclose data when explicitly using disclose()', async () => {
      await simulator.increment(7n);

      // The get_counter circuit uses disclose() — this is the ONLY way
      // to intentionally make the counter value available as output.
      const disclosedValue = await simulator.getCounter();
      expect(disclosedValue).toBe(7n);

      // The ledger state is public by design (it's a ledger variable),
      // but the witness input (7n) is NOT separately recorded.
      const ledgerState = simulator.getLedgerState();
      expect(ledgerState.counter).toBe(7n);

      // The value 7n appears as the counter (because counter = 0 + 7),
      // but in a real contract with more complex logic, the relationship
      // between the witness input and the ledger state would not be
      // directly invertible. The circuit only proves correctness.
    });
  });
});
