# Lesson 1.2: Public Ledger, Private Ledger

## The Core Rule

Midnight has one rule that governs everything about data visibility:

**Anything passed as an argument to a ledger operation, and all reads and writes of the ledger itself, are publicly visible.**

That's the public ledger. Everything else — intermediate computations, witness data, values that never touch the ledger — stays private. There's no configuration toggle. No privacy setting. The boundary is structural: if your data touches the ledger, it's public. If it doesn't, it's private and enforced by zero-knowledge proofs.

---

## What "Public" Means

When you declare a ledger field in Compact:

```
export ledger authority: Bytes<32>;
export ledger value: Uint<64>;
```

Both `authority` and `value` are stored on Midnight's ledger in the clear. Anyone observing the chain can read them, just as anyone on Cardano can read datum fields attached to UTxOs.

When a circuit writes to a ledger field using `disclose()`:

```
authority = disclose(publicKey(round, sk));
value = disclose(v);
```

The disclosed values become part of the transaction's public record. The `disclose()` call is an explicit decision: this value crosses from private computation into public state.

---

## What "Private" Means

Everything inside a circuit that doesn't touch the ledger stays private. The circuit computes on it, the ZK proof guarantees the computation was correct, but the values themselves never appear on-chain.

A witness function provides private inputs from the user's local environment:

```
witness secretKey(): Bytes<32>;
```

The secret key enters the circuit, gets used in computation (e.g., deriving a public key), and the result of that computation may or may not be disclosed. The secret key itself never leaves the user's machine.

This is the fundamental difference from Cardano. On Cardano, the Plutus validator sees the datum and redeemer — both are on-chain, both are public. On Midnight, witness data is private by default and only becomes public through explicit `disclose()` calls.

---

## Privacy Techniques on the Ledger

Even within the public ledger, you can limit what's revealed. Midnight provides three patterns:

### 1. Hashes and Commitments

Instead of storing raw values on the ledger, store their hashes:

```
persistentHash<T>(value: T): Bytes<32>
persistentCommit<T>(value: T, rand: Bytes<32>): Bytes<32>
```

The hash is public. The preimage is private. A later circuit can prove knowledge of the preimage without revealing it.

`persistentHash` is deterministic — the same value always produces the same hash. `persistentCommit` adds randomness, so the same value produces different commitments each time. Use commitments when you need to prevent correlation between entries.

### 2. Merkle Trees

`MerkleTree<n, T>` and `HistoricMerkleTree<n, T>` are the exception to the "ledger is public" rule. They store commitments in a tree structure that enables membership proofs without revealing which leaf you're proving.

You can prove "I have a value in this tree" without revealing the value or its position. This is the foundation for credential systems (Module 5) and token privacy (ZSwap).

### 3. The Commitment/Nullifier Pattern

This combines Merkle Trees with a Set to create single-use tokens:

1. A commitment goes into a MerkleTree (proves existence)
2. When spent, a nullifier goes into a Set (prevents double-spend)
3. The nullifier is unlinkable to the commitment — observers can't tell which commitment was spent

ZSwap uses this pattern for Midnight's native token system. You'll build on it in Module 5 for credential revocation.

---

## Where Data Lives: A Decision Map

| Data | Where | Why |
|------|-------|-----|
| Credential existence | Public ledger | Others need to verify it exists |
| Credential attributes | Private (witness) | Holder controls what's revealed |
| Token balance | Public ledger (or shielded via ZSwap) | Depends on whether balance should be visible |
| Contract state | Public ledger fields | Read/written by circuits, visible on-chain |
| Intermediate computation | Private (circuit) | Never touches ledger, proven by ZK |
| User's secret key | Private (witness) | Enters circuit locally, never on-chain |
| Membership proof | MerkleTree on ledger | Proves inclusion without revealing which member |
| Revocation status | Set on ledger (nullifiers) | Proves something was used, not which thing |

---

## Comparison to Cardano

On Cardano, the privacy model is simple: everything is public. Datums, redeemers, transaction metadata, token balances — all visible on-chain. If you want privacy, you handle it off-chain and only put hashes on the ledger. But the Plutus VM has no mechanism to prove that off-chain computation was correct.

Midnight's dual-ledger fills that gap:

| Property | Cardano | Midnight |
|----------|---------|----------|
| Default visibility | Public | Public for ledger, private for computation |
| Private computation | Off-chain (unverified) | In-circuit (ZK-proven) |
| Selective disclosure | Manual, no enforcement | Built into the language (`disclose()`) |
| Membership proofs | Not natively supported | MerkleTree with ZK proofs |
| Single-use proofs | Not natively supported | Commitment/nullifier pattern |

---

## The Mental Model

Think of a Compact circuit as a one-way membrane. Data enters privately through witnesses. Computation happens inside. Only what you explicitly `disclose()` exits to the public ledger. Everything else stays behind the membrane, verified by a ZK proof.

On Cardano, there's no membrane. Everything the validator touches is already public. Midnight's contribution is making that membrane a first-class part of the programming model — not an afterthought.

---

## Questions to consider:

- If you're building a voting system, which parts should live on the public ledger and which should stay private? What does the verifier need to see?
- The commitment/nullifier pattern enables single-use proofs. What applications beyond token transfers benefit from "prove once, prevent reuse"?
- Midnight's `persistentHash` is deterministic — the same input always produces the same hash. When is that a feature and when is it a liability?

---

## What's Next

Lesson 1.3 explains how Midnight relates to Cardano as a partner chain — what's shared, what's not, and why your Aiken code won't run on Midnight.

---

## Things to Try

Design the data layout for a simple reputation system on Midnight. For each piece of data, decide whether it belongs on the public ledger, in a MerkleTree, or as private witness data. Justify each choice.

Your system should handle:
- Issuing a reputation score to a user
- Allowing the user to prove their score exceeds a threshold without revealing the exact score
- Preventing the user from using the same proof twice
