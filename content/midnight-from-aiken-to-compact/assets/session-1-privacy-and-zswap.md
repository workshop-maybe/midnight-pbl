# Privacy Model, Dual-Ledger, and ZSwap (Fetched 2026-03-23)

Source: docs.midnight.network/concepts/how-midnight-works/keeping-data-private, /zswap

## Public vs. Private Data

**Core rule:** Anything passed as an argument to a `ledger` operation in Compact, as well as all reads and writes of the ledger itself, are publicly visible.

**Exception:** `MerkleTree` and `HistoricMerkleTree` data types provide shielding capabilities.

**Key distinction:** What is public is the argument or ledger value itself, not the code that manipulates it.

## Privacy Techniques

### 1. Hashes and Commitments
Use `persistentHash` and `persistentCommit` to store only hashed representations rather than raw data on the ledger.

### 2. Merkle Trees
`MerkleTree<n, T>` and `HistoricMerkleTree<n, T>` enable proving membership without revealing which value is being proven.

### 3. Commitment/Nullifier Pattern
Used by ZSwap: commitments stored in a Merkle tree paired with nullifiers in a Set to enable single-use tokens.

## disclose() Primitive

The `disclose()` function marks values for public visibility on the ledger. Used in constructors and circuits to explicitly control what becomes public:

```
constructor(sk: Bytes<32>, v: Uint<64>) {
  authority = disclose(publicKey(round, sk));
  value = disclose(v);
  state = State.SET;
}
```

Without `disclose()`, data processed in circuits remains private — only proven correct via zero-knowledge proofs.

---

## ZSwap

ZSwap is a shielded token mechanism based on Zerocash, extended with native token support and atomic swaps. The fundamental unit is an offer containing inputs, outputs, transient coins, and a balance vector.

### Outputs (Coin Creation)
Create new coins with commitments added to a global Merkle tree. Each output includes:
- A commitment
- A Pedersen commitment encoding type/value
- Optional contract address
- Optional ciphertext for users
- A zero-knowledge proof verifying correctness

### Inputs (Coin Spending)
Spend existing coins by referencing their commitment without revealing it, producing an unlinkable nullifier. Each input includes:
- The nullifier
- A Pedersen commitment
- Optional contract address
- A Merkle tree root
- A zero-knowledge proof

### Validation
- Outputs valid when their proof verifies
- Inputs require proof verification AND Merkle tree root must match a past root from the network

### Token Types
Token types are either 256-bit collision-resistant hashes or a predefined zero value (native token). Custom tokens can be issued from contracts, with types derived as hash of contract address + user-provided domain-separator.

### Status
Native currency implementation details are not yet stable and will undergo further revisions. Performance of basic operations has not been optimized.
