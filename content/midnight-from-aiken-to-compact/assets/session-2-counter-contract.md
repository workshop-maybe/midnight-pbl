# Counter Contract: Compilation Results (2026-03-23)

Source: github.com/midnightntwrk/example-counter
Compiler: compact 0.30.0 (language 0.22.0, runtime 0.15.0)
Result: **Compiled successfully** — 1 circuit

## Source Code (counter.compact)

```compact
pragma language_version >= 0.20;

import CompactStandardLibrary;

// public state
export ledger round: Counter;

// transition function changing public state
export circuit increment(): [] {
  round.increment(1);
}
```

This is the simplest possible Compact contract: one ledger field, one circuit, no witnesses.

## Witnesses (witnesses.ts)

```typescript
export type CounterPrivateState = {
  privateCounter: number;
};

export const witnesses = {};
```

Empty witnesses object — this contract has no private state.

## Compilation Output

```
Compiling 1 circuits:
```

### Output Directory Structure

```
src/managed/counter/
├── compiler/
│   └── contract-info.json     # Contract metadata
├── contract/
│   ├── index.d.ts             # TypeScript type definitions
│   ├── index.js               # JavaScript contract binding
│   └── index.js.map           # Source map
├── keys/
│   ├── increment.prover       # 14K — ZK proving key
│   └── increment.verifier     # 1.3K — ZK verification key
└── zkir/
    ├── increment.bzkir        # 64B — Binary ZK intermediate representation
    └── increment.zkir         # 784B — Text ZK intermediate representation
```

### Generated TypeScript Types (index.d.ts)

```typescript
import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {}

export type ImpureCircuits<PS> = {
  increment(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly round: bigint;
}

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
```

### contract-info.json

```json
{
  "compiler-version": "0.30.0",
  "language-version": "0.22.0",
  "runtime-version": "0.15.0",
  "circuits": [
    {
      "name": "increment",
      "pure": false,
      "proof": true,
      "arguments": [],
      "result-type": { "type-name": "Tuple", "types": [] }
    }
  ],
  "witnesses": [],
  "contracts": []
}
```

## Key Observations

1. **One circuit per entry point.** The `increment` circuit compiles to its own prover/verifier key pair and ZKIR files.
2. **Tiny prover keys for simple circuits.** 14K for a counter increment vs 2.7MB for the bboard's `post` circuit.
3. **Generated TypeScript is fully typed.** The `Ledger` type has `readonly round: bigint`. The `Circuit` type signature matches the Compact declaration exactly.
4. **Pure vs impure circuits.** The contract-info marks `increment` as `pure: false` (it modifies state) and `proof: true` (it generates a ZK proof).
5. **Counter maps to bigint.** Compact's `Counter` type becomes `bigint` in TypeScript.
