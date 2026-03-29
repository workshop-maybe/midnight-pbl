# Lesson 3.2: From Circuit to Proof to Verification

## The Pipeline

Every Midnight transaction includes a zero-knowledge proof. The proof says: "this computation was performed correctly." The verifier doesn't see the private inputs — only that the circuit logic was satisfied.

The pipeline has four stages: compile, prove, submit, verify. Understanding each stage tells you what happens when a user calls a circuit and why it takes the time it does.

---

## Stage 1: Compile

Lesson 4.2 walks through this hands-on. The Compact compiler transforms a `.compact` file into four types of artifact:

```
src/managed/counter/
├── compiler/contract-info.json     # Circuit metadata
├── contract/index.d.ts + index.js  # TypeScript bindings
├── keys/increment.prover           # Proving key
├── keys/increment.verifier         # Verification key
└── zkir/increment.zkir             # ZK intermediate representation
```

The critical outputs are the **proving key** and **verification key**. They're mathematically linked:
- The **proving key** is used by the proof server to generate proofs. It encodes the circuit's logic as constraints.
- The **verification key** is used by the Midnight network to check proofs. It's much smaller than the proving key.

The counter's `increment` circuit produces a 14K proving key and a 1.3K verification key. The bulletin board's `post` circuit — which includes hashing, assertions, and `disclose()` calls — produces a 2.7MB proving key and a 2.1K verification key. More complex circuits mean more constraints, which mean larger keys and longer proof generation.

The **ZKIR** (Zero-Knowledge Intermediate Representation) is the circuit expressed as constraints. The `.zkir` file is human-readable; the `.bzkir` file is the binary form the proof server consumes.

---

## Stage 2: Prove

When a user calls a circuit from their DApp, the proof generation happens locally on their machine via the proof server.

The flow:

1. **DApp code calls a circuit** — e.g., `contract.circuits.increment(context)`
2. **The runtime evaluates the circuit** — it executes the Compact logic, collecting the witness values, ledger reads, and state transitions
3. **The runtime sends the constraint system to the proof server** — the proof server (Docker container on port 6300) receives the ZKIR and the private inputs
4. **The proof server generates a ZK proof** — using the proving key, it produces a proof that the computation satisfies all constraints without revealing the private inputs
5. **The proof is bundled into a transaction** — the proof, the public outputs (disclosed values), and the state changes form a transaction

The proof server is the computationally expensive part. Generating a proof for the counter's `increment` is fast (small circuit). Generating a proof for the bulletin board's `post` takes longer because the circuit includes hash computation and multiple `disclose()` operations.

**Why local?** The proof server runs on the user's machine because the private inputs (witness values) must never leave. If the proof server ran remotely, the user would have to send their secret key over the network.

---

## Stage 3: Submit

The transaction — containing the proof, disclosed values, and state effects — is submitted to the Midnight network.

A Midnight transaction includes:
- **Declared gas bound** — determines the fee
- **Declared effects** — what the transaction claims it will do (nullifier claims, coin operations, contract calls)
- **The ZK proof** — cryptographic evidence the computation was correct
- **Disclosed values** — the public outputs from `disclose()` calls
- **New contract state** — the updated ledger values

The transaction declares its effects upfront. The proof proves those effects are correct. The network verifies the proof against the verification key.

---

## Stage 4: Verify

The Impact VM verifies the transaction on-chain.

The verification checks:
1. **Proof validity** — does the ZK proof verify against the circuit's verification key?
2. **Effects consistency** — do the declared effects match what the proof claims?
3. **State transition** — is the new state consistent with the old state plus the proven computation?
4. **Gas bounds** — does the transaction have sufficient gas?
5. **Nullifiers** — if any nullifiers are claimed, are they fresh (not already spent)?

Verification is fast — much faster than proof generation. The verification key is small, and checking a proof is a single cryptographic operation. This asymmetry (expensive to prove, cheap to verify) is the fundamental property of zero-knowledge proofs.

If verification succeeds, the ledger is updated with the new contract state. If it fails, the transaction is rejected and no state changes occur.

---

## What the Proof Actually Proves

For the counter contract:

```compact
export circuit increment(): [] {
  round.increment(1);
}
```

The proof says: "I executed the `increment` circuit. The round counter was `N` before. It is now `N+1`. The computation was correct."

For the bulletin board's `post` circuit:

```compact
export circuit post(newMessage: Opaque<"string">): [] {
  assert(state == State.VACANT, "Board is occupied");
  owner = disclose(publicKey(localSecretKey(), sequence as Field as Bytes<32>));
  message = disclose(some<Opaque<"string">>(newMessage));
  state = State.OCCUPIED;
}
```

The proof says: "I executed the `post` circuit. The board was VACANT. I derived a public key from a secret key I possess (but I'm not revealing the secret key). The public key is `0xabc...`. The message is 'Hello'. The board is now OCCUPIED. All of this is correct."

The verifier sees the public key and the message (because they were disclosed). The verifier does not see the secret key. The proof guarantees the public key was honestly derived — the prover couldn't have faked it.

---

## Proof Size and Performance

Circuit complexity directly affects proof generation time and key sizes:

| Contract | Circuit | Proving Key | Verification Key | ZKIR |
|----------|---------|-------------|-----------------|------|
| Counter | `increment` | 14K | 1.3K | 784B |
| Bboard | `post` | 2.7MB | 2.1K | 4.5K |
| Bboard | `takeDown` | 2.7MB | 2.1K | 6.0K |

The verification key stays small regardless of circuit complexity. This is by design — on-chain verification cost should be predictable. The proving key scales with the number of constraints, which means more complex logic takes longer to prove but doesn't burden the network.

The bboard's circuits are ~200x larger than the counter's because they include:
- `persistentHash` computation (the public key derivation)
- Multiple `disclose()` operations
- Assertion checks
- Opaque type handling

Each of these adds constraints to the ZK circuit.

---

## The First-Run Download

When you first compile with ZK parameter generation, the compiler downloads a set of universal parameters (~500MB). These are public cryptographic parameters shared across all Midnight circuits (similar to a trusted setup, but universal — they work for any circuit up to a certain size). This is a one-time download.

---

## The Full Picture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐     ┌───────────┐
│  Compile     │     │  Prove       │     │  Submit    │     │  Verify   │
│              │     │              │     │            │     │           │
│  .compact    │     │  DApp calls  │     │  Tx with   │     │  Impact   │
│     ↓        │     │  circuit     │     │  proof +   │     │  VM checks│
│  ZKIR +      │────▶│     ↓        │────▶│  effects   │────▶│  proof    │
│  proving key │     │  Proof       │     │  goes to   │     │  against  │
│  + verify key│     │  server      │     │  network   │     │  verify   │
│              │     │  generates   │     │            │     │  key      │
│              │     │  ZK proof    │     │            │     │           │
└─────────────┘     └──────────────┘     └────────────┘     └───────────┘
  Developer's         User's machine       Midnight          Midnight
  machine             (private inputs       network           validators
  (one-time)          stay here)
```

---

## Questions to consider:

- The proof server runs locally so private inputs never leave the user's machine. What happens if a mobile user doesn't have the resources to run a proof server? What architectural options exist?
- Verification is fast, but proof generation for complex circuits can take seconds or longer. How does this affect the user experience compared to submitting an Aiken transaction on Cardano?
- The bulletin board's `publicKey` circuit is marked `pure: true, proof: false` — it doesn't generate a ZK proof. Why not? When does a circuit need a proof and when doesn't it?

---

## What's Next

Lesson 3.3 shows the TypeScript side: how to implement the witness functions that feed private data into the proving pipeline.

---

## Assignment

Trace the lifecycle of a single transaction through the four stages for the bulletin board's `takeDown` circuit:

1. **Compile:** What artifacts does the `takeDown` circuit produce? What constraints does it encode?
2. **Prove:** What private inputs enter the proof? What public outputs come out? What does the proof server verify during generation?
3. **Submit:** What does the transaction contain? What are the declared effects?
4. **Verify:** What does the Impact VM check? If the caller provides the wrong secret key, at which stage does the failure occur?
