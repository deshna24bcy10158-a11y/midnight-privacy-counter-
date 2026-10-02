/**
 * Managed TypeScript Declaration for `counter.compact`
 */

export interface CounterWitnesses {
  secret_increment_val(): Promise<bigint> | bigint;
}

export interface CounterLedger {
  counter: bigint;
}

export class Contract {
  constructor(initialState?: CounterLedger);
  ledger: CounterLedger;
  increment(witnesses: CounterWitnesses): Promise<{ status: string; newCounter: bigint }>;
  disclose(): Promise<bigint>;
}

export declare const contractTree: object;
export default Contract;
