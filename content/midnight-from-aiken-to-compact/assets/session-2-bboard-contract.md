# Bulletin Board Contract: Compilation Results (2026-03-23)

Source: github.com/midnightntwrk/example-bboard
Compiler: compact 0.30.0 (language 0.22.0, runtime 0.15.0)
Result: **Compiled successfully** — 2 provable circuits + 1 pure circuit

## Source Code (bboard.compact)

```compact
pragma language_version >= 0.20;

import CompactStandardLibrary;

export enum State {
  VACANT,
  OCCUPIED
}

export ledger state: State;
export ledger message: Maybe<Opaque<"string">>;
export ledger sequence: Counter;
export ledger owner: Bytes<32>;

constructor() {
  state = State.VACANT;
  message = none<Opaque<"string">>();
  sequence.increment(1);
}

witness localSecretKey(): Bytes<32>;

export circuit post(newMessage: Opaque<"string">): [] {
  assert(state == State.VACANT, "Attempted to post to an occupied board");
  owner = disclose(publicKey(localSecretKey(), sequence as Field as Bytes<32>));
  message = disclose(some<Opaque<"string">>(newMessage));
  state = State.OCCUPIED;
}

export circuit takeDown(): Opaque<"string"> {
  assert(state == State.OCCUPIED, "Attempted to take down post from an empty board");
  assert(owner == publicKey(localSecretKey(), sequence as Field as Bytes<32>), "Attempted to take down post, but not the current owner");
  const formerMsg = message.value;
  state = State.VACANT;
  sequence.increment(1);
  message = none<Opaque<"string">>();
  return formerMsg;
}

export circuit publicKey(sk: Bytes<32>, sequence: Bytes<32>): Bytes<32> {
  return persistentHash<Vector<3, Bytes<32>>>([pad(32, "bboard:pk:"), sequence, sk]);
}
```

## Witnesses (witnesses.ts)

```typescript
import { Ledger } from "./managed/bboard/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type BBoardPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createBBoardPrivateState = (secretKey: Uint8Array) => ({
  secretKey,
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, BBoardPrivateState>): [
    BBoardPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],
};
```

### Witness Implementation Pattern

The witness function:
1. Takes a `WitnessContext<Ledger, BBoardPrivateState>` — provides access to ledger state, private state, and contract address
2. Returns a tuple: `[newPrivateState, returnValue]`
3. Destructures to extract only `privateState` (doesn't need ledger or contractAddress)
4. Returns the private state unchanged plus the secret key bytes

This is the canonical witness pattern for Midnight: the witness is a function from context to `[updatedPrivateState, value]`.

## Compilation Output

```
Compiling 2 circuits:
```

Note: `publicKey` is a pure circuit (no state mutation, no proof) so it's compiled but doesn't generate prover/verifier keys.

### Output Directory Structure

```
src/managed/bboard/
├── compiler/
│   └── contract-info.json
├── contract/
│   ├── index.d.ts
│   ├── index.js
│   └── index.js.map
├── keys/
│   ├── post.prover            # 2.7MB — ZK proving key
│   ├── post.verifier          # 2.1K — ZK verification key
│   ├── takeDown.prover        # 2.7MB — ZK proving key
│   └── takeDown.verifier      # 2.1K — ZK verification key
└── zkir/
    ├── post.bzkir             # 308B
    ├── post.zkir              # 4.5K
    ├── takeDown.bzkir         # 394B
    └── takeDown.zkir          # 6.0K
```

### Generated TypeScript Types (index.d.ts)

```typescript
export enum State { VACANT = 0, OCCUPIED = 1 }

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  post(context: __compactRuntime.CircuitContext<PS>, newMessage_0: string): __compactRuntime.CircuitResults<PS, []>;
  takeDown(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, string>;
}

export type PureCircuits = {
  publicKey(sk_0: Uint8Array, sequence_0: Uint8Array): Uint8Array;
}

export type Ledger = {
  readonly state: State;
  readonly message: { is_some: boolean, value: string };
  readonly sequence: bigint;
  readonly owner: Uint8Array;
}
```

### contract-info.json

```json
{
  "compiler-version": "0.30.0",
  "language-version": "0.22.0",
  "runtime-version": "0.15.0",
  "circuits": [
    { "name": "post", "pure": false, "proof": true, "arguments": [{ "name": "newMessage", "type": { "type-name": "Opaque", "tsType": "string" } }] },
    { "name": "takeDown", "pure": false, "proof": true, "arguments": [] },
    { "name": "publicKey", "pure": true, "proof": false, "arguments": [{ "name": "sk", ... }, { "name": "sequence", ... }] }
  ],
  "witnesses": [
    { "name": "localSecretKey", "arguments": [], "result type": { "type-name": "Bytes", "length": 32 } }
  ]
}
```

## Key Observations

1. **Prover keys scale with circuit complexity.** Counter's `increment` prover is 14K. Bboard's `post` and `takeDown` provers are 2.7MB each. The hashing, assertions, and `disclose()` calls add ZK circuit gates.
2. **Pure circuits don't generate proofs.** `publicKey` is marked `pure: true, proof: false`. It's a utility function — no state mutation, no ZK proof needed.
3. **Witness type safety.** The generated `Witnesses<PS>` type enforces the return shape: `[PS, Uint8Array]`. DApp code must conform.
4. **Opaque types map cleanly.** `Opaque<"string">` in Compact becomes `string` in TypeScript. `Maybe<Opaque<"string">>` becomes `{ is_some: boolean, value: string }`.
5. **disclose() in action.** The `post` circuit uses `disclose()` on the public key and message — making them visible on the ledger. The secret key (from witness) stays private.
6. **Sequence counter for unlinkability.** Each `takeDown` increments the sequence, so the next `post` derives a different public key from the same secret key. Different rounds can't be linked to the same user.
7. **WitnessContext pattern.** The TypeScript witness receives `WitnessContext<Ledger, PS>` with `{ ledger, privateState, contractAddress }`. This is the standard interface for all Midnight witness implementations.
