# Lesson 103.3: Writing Witness Functions in TypeScript

**SLT:** I can implement a TypeScript witness function that provides private data to a Compact circuit.

**Type:** Developer Documentation

---

## Where Private Data Comes From

In the custom example contracts (Module 103-104), all private data entered through circuit parameters:

```compact
export circuit submitAnswer(answer: Bytes<32>): [] {
  // answer comes from the caller — it's a parameter
}
```

The SDK handled this with `CompiledContract.withVacantWitnesses` — no witness functions needed because no persistent private state was involved.

The bulletin board template is different. The user has a **secret key** that persists across sessions, stored locally in a LevelDB database. The circuit needs this key but can't take it as a parameter — it would have to be passed with every transaction call. Instead, the Compact contract declares a **witness function** and the TypeScript DApp implements it.

This is the Compact/TypeScript split: the contract says "I need private data," the DApp says "here it is."

---

## The Compact Side

The bulletin board contract declares one witness:

```compact
witness localSecretKey(): Bytes<32>;
```

That's the entire Compact declaration. No implementation, no body. Just a name, parameters (none here), and a return type. The Compact compiler generates a typed interface that the TypeScript implementation must satisfy.

The witness is called inside circuits:

```compact
export circuit post(newMessage: Opaque<"string">): [] {
  assert(state == State.VACANT, "Attempted to post to an occupied board");
  owner = disclose(publicKey(localSecretKey(), sequence as Field as Bytes<32>));
  message = disclose(some<Opaque<"string">>(newMessage));
  state = State.OCCUPIED;
}
```

When `post` executes locally, it calls `localSecretKey()`. The runtime routes this call to your TypeScript implementation. The secret key enters the circuit, gets hashed with the sequence counter to derive a public key, and only the public key is disclosed. The secret key itself never leaves the ZK proof.

---

## The TypeScript Side

The witness implementation lives in a separate file:

```typescript
import { Ledger } from "./managed/bboard/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";
```

Two imports. `Ledger` is the compiler-generated type for the contract's public state. `WitnessContext` is the runtime type that gives your witness access to context.

### Private State Type

```typescript
export type BBoardPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createBBoardPrivateState = (secretKey: Uint8Array) => ({
  secretKey,
});
```

This is the shape of your local private state. For the bulletin board, it's just a secret key. For a credential system (Module 105), it would be an array of signed credentials. For a wallet, it might be a set of viewing keys.

The private state is stored locally (LevelDB in the CLI, in-memory in the browser UI) and never transmitted to the network.

### The Witness Object

```typescript
export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, BBoardPrivateState>): [
    BBoardPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],
};
```

One field per Compact `witness` declaration. The field name (`localSecretKey`) must match exactly.

### The WitnessContext Interface

Every witness function receives a `WitnessContext<L, PS>` as its first argument:

```typescript
WitnessContext<Ledger, BBoardPrivateState> = {
  ledger: Ledger;           // Current on-chain state (read-only)
  privateState: BBoardPrivateState;  // Your local private state
  contractAddress: string;  // The deployed contract's address
}
```

Three fields:
- **`ledger`** — the contract's public state, read from the indexer. Your witness can make decisions based on on-chain state (e.g., check which issuer is trusted before selecting a credential).
- **`privateState`** — your local data. This is where secrets live.
- **`contractAddress`** — the deployed contract's address. Useful if your DApp interacts with multiple contracts.

The `localSecretKey` witness only needs `privateState`, so it destructures just that field.

### The Return Tuple

Every witness returns `[newPrivateState, returnValue]`:

```typescript
[BBoardPrivateState, Uint8Array]
```

- **First element:** the updated private state. If your witness modifies local state (e.g., increments a nonce), return the new version. If nothing changed, return `privateState` unchanged.
- **Second element:** the value sent to the Compact circuit. Must match the return type declared in Compact (`Bytes<32>` → `Uint8Array`).

This tuple pattern is universal. Even if your witness doesn't change private state, you return the existing state as the first element.

---

## Wiring It Up

The custom example contracts used `withVacantWitnesses`:

```typescript
const compiledContract = CompiledContract.make('private-answer', PrivateAnswer.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);
```

The bulletin board uses `withWitnesses`:

```typescript
import * as Witnesses from "./witnesses";

const compiledContract = CompiledContract.make<
  Contract<Witnesses.BBoardPrivateState>
>("bboard", Contract<Witnesses.BBoardPrivateState>).pipe(
  CompiledContract.withWitnesses(Witnesses.witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);
```

The difference: `withWitnesses(witnesses)` connects your TypeScript implementations to the compiled contract. The SDK type-checks that your witness object matches the Compact declarations — wrong names or return types produce compile-time errors.

When deploying, you also provide the initial private state:

```typescript
const deployed = await deployContract(providers, {
  compiledContract,
  privateStateId: 'bboardPrivateState',
  initialPrivateState: createBBoardPrivateState(secretKey),
});
```

The `initialPrivateState` is what the witness sees as `privateState` on the first call. After that, whatever your witness returns as the first tuple element becomes the new private state for subsequent calls.

---

## Type Mappings: Compact to TypeScript

When writing witnesses, you need to know how Compact types map to TypeScript:

| Compact Type | TypeScript Type | Notes |
|-------------|----------------|-------|
| `Bytes<32>` | `Uint8Array` | Fixed-length byte array |
| `Uint<64>` | `bigint` | Arbitrary-precision integer |
| `Field` | `bigint` | Scalar field element |
| `Boolean` | `boolean` | |
| `Counter` | `bigint` | Read-only in witnesses (increment happens in circuit) |
| `Opaque<"string">` | `string` | Passed through without circuit inspection |
| `Opaque<"Uint8Array">` | `Uint8Array` | Passed through without circuit inspection |
| `Maybe<T>` | `{ is_some: boolean; value: T }` | Compact's optional type |
| `enum State { A, B }` | TypeScript enum | Compiler generates the enum |
| `CurvePoint` | SDK curve point type | For elliptic curve operations |
| `Vector<N, T>` | Fixed-length array of T | |

The compiler-generated `index.d.ts` in `managed/bboard/contract/` defines exact types. When in doubt, read the generated types — they're the source of truth.

---

## Witnesses That Read Ledger State

The `localSecretKey` witness ignores the ledger. But witnesses CAN read on-chain state to make decisions:

```typescript
export const witnesses = {
  selectCredential: ({
    ledger,
    privateState,
  }: WitnessContext<Ledger, CredentialPrivateState>): [
    CredentialPrivateState,
    Uint8Array,
  ] => {
    // Read the trusted issuer from on-chain state
    const trustedIssuer = ledger.trusted_issuer_public_key;

    // Find a credential that matches
    const matching = privateState.credentials.find(
      (cred) => cred.issuerPk === trustedIssuer
    );

    if (!matching) throw new Error("No matching credential found");
    return [privateState, matching.data];
  },
};
```

The witness reads `ledger.trusted_issuer_public_key` (public state) and selects a credential from `privateState.credentials` (private state). The circuit doesn't know how the selection was made — it just receives the credential and verifies it.

---

## Witnesses That Update State

Witnesses can modify private state. A common pattern: increment a nonce to prevent replay:

```typescript
export const witnesses = {
  getCredentialWithNonce: ({
    privateState,
  }: WitnessContext<Ledger, NoncePrivateState>): [
    NoncePrivateState,
    Uint8Array,
  ] => {
    const nonce = privateState.nonce + 1;
    const newState = { ...privateState, nonce };
    return [newState, privateState.credential];
  },
};
```

The returned `newState` becomes the private state for the next witness call. This is how local state evolves across transactions without touching the network.

---

## The Trust Model

**Witnesses are untrusted by design.** The Compact circuit cannot verify that the witness returned honest data. If a witness lies — returns a fabricated credential, a wrong key, garbage bytes — the circuit processes whatever it receives.

The ZK proof guarantees the computation was correct *for the inputs provided*. It does NOT guarantee the inputs were authentic.

This is why the verification pattern in Module 105 exists:

```compact
// The circuit verifies the witness's output
assert identity.signature.pk == trusted_issuer_public_key
assert identity.subject.id == own_public_key().bytes
verify_signature(subject_hash(identity.subject), identity.signature);
```

The witness provides the credential. The circuit verifies it. If the witness lied (forged credential, wrong issuer), the assertions fail and proof generation aborts. A bad proof never reaches the network.

**Cardano comparison:** On Cardano, the redeemer is also "untrusted input" — anyone can provide any redeemer. The validator checks it. Same pattern, different mechanism. The difference: on Cardano, the redeemer is public (everyone sees what was provided). On Midnight, the witness data is private (only the proof of correct processing is visible).

---

## When to Use Witnesses vs Circuit Parameters

| Use witnesses when | Use circuit parameters when |
|-------------------|----------------------------|
| Private data persists across sessions (secret keys, credentials) | Private data is per-transaction (an answer, a vote) |
| The DApp needs to select from local state (pick the right credential) | The caller provides the data directly |
| Local state should update after each call (nonce increment) | No local state management needed |
| The contract is part of a larger DApp with a state management layer | The contract is standalone (CLI interaction) |

The custom example contracts (public-answer, private-answer) used circuit parameters — the answer is provided fresh each time, no persistence needed. The bulletin board uses a witness — the secret key persists and must be the same across post and takeDown calls.

---

## Questions to Consider

- The bulletin board's `publicKey` circuit hashes the secret key with the sequence counter: `persistentHash([pad(32, "bboard:pk:"), sequence, sk])`. Why include the sequence? What attack does this prevent? (Hint: without it, the same public key appears every time the same user posts.)
- Witnesses can read ledger state but not write it. What would change about the security model if witnesses could write to the ledger directly?
- The private state provider stores data in LevelDB (CLI) or in-memory (browser). What happens if the user loses their private state? Can they recover their secret key? What's the recovery model?

---

## What's Next

Module 103 is complete. You can write Compact contracts with `disclose()` (103.1), understand the privacy boundary through the client/server mental model (103.2), and implement witness functions that provide private data from local state (this lesson). Module 104 builds on all three to construct a complete privacy-preserving application.

---

## Things to Try

Extend the bulletin board's witness to support multiple secret keys — one per "persona":

1. Change `BBoardPrivateState` to hold an array of keys and a selected index
2. Add a second witness `selectPersona(index: Uint<8>): Bytes<32>` that returns a specific key
3. Update the `post` circuit to call `selectPersona` instead of `localSecretKey`
4. What changes about the privacy model? Can an observer link posts from different personas if they're backed by keys in the same private state?
