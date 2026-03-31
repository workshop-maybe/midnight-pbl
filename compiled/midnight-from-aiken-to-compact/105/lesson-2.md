# Lesson 5.2: Anonymous Membership with MerkleTree and Nullifiers

## Beyond Individual Verification

Lesson 5.1 showed how to verify a single credential: the user provides it via a witness, the circuit checks the signature, and the proof confirms the claim. The verifier knows "this person holds a valid credential from issuer X."

But what if the question is different? "Does this person hold any credential from this set of 1,000 issued credentials?" If you verify the credential directly, the verifier can tell which specific credential was used. For some applications — anonymous voting, anonymous access control, anonymous team capability proofs — that's a leak.

MerkleTree commitments solve this. You store hashed credentials in a tree. The user proves they know a leaf in the tree without revealing which leaf. Combined with nullifiers, you get single-use anonymous proofs.

---

## The MerkleTree Pattern

### Step 1: Commitment

When a credential is issued, a commitment (hash of the credential) is inserted into a MerkleTree on the ledger:

```compact
export ledger credentials: MerkleTree<16, Bytes<32>>;

export circuit register_credential(commitment: Bytes<32>): [] {
  credentials.insert(commitment);
}
```

The commitment is a `persistentHash` of the credential data. The credential itself is never on-chain — only its hash. The MerkleTree stores up to 2^16 (65,536) commitments.

### Step 2: Membership Proof

To prove they hold a credential, the user provides the credential via a witness. The circuit hashes it and checks the hash against the MerkleTree:

```compact
witness load_credential(): Bytes<64>;

export circuit prove_membership(): [] {
  const cred = load_credential();
  const commitment = persistentHash(cred);

  // The MerkleTree proves this commitment exists
  // without revealing which leaf it is
  assert credentials.member(commitment)
         "Credential not found in registry";
}
```

The `member()` check uses a Merkle proof internally. The prover supplies the leaf and its path; the verifier checks the path leads to the tree's root. The proof reveals nothing about which leaf was used — only that some valid leaf was provided.

### Step 3: Nullifiers (Single-Use)

Without nullifiers, the same credential can be used to generate unlimited proofs. For applications like voting or one-time access, you need to prevent reuse.

A nullifier is a deterministic value derived from the credential. It's unique to the credential but unlinkable to the commitment:

```compact
export ledger nullifiers: Set<Bytes<32>>;

export circuit prove_membership_once(): [] {
  const cred = load_credential();
  const commitment = persistentHash(cred);
  const nullifier = derive_nullifier(cred);

  // Verify the credential is in the tree
  assert credentials.member(commitment)
         "Credential not found";

  // Verify this credential hasn't been used before
  assert !nullifiers.member(nullifier)
         "Credential already used";

  // Record the nullifier to prevent reuse
  nullifiers.insert(nullifier);
}
```

The nullifier derivation must be deterministic (same credential always produces same nullifier) but unlinkable (you can't derive the commitment from the nullifier or vice versa). A common approach:

```compact
circuit derive_nullifier(cred: Bytes<64>): Bytes<32> {
  return persistentHash<Vector<2, Bytes<32>>>([
    pad(32, "nullifier:"),
    persistentHash(cred)
  ]);
}
```

Using a domain separator (`"nullifier:"`) ensures the nullifier hash is in a different domain from the commitment hash, even though both are derived from the same credential.

---

## Why This Works

An observer watching the ledger sees:

1. **MerkleTree insertions** — a series of commitment hashes. They can't tell what credentials they represent.
2. **Nullifier insertions** — a series of nullifier hashes. They can't link a nullifier to a commitment because the derivation uses a different domain.
3. **Successful proof transactions** — the ZK proof passed, meaning the prover holds a valid credential. But which one? The observer can't tell.

The only information leaked is:
- The credential set is growing (number of commitments)
- Credentials are being used (number of nullifiers)
- The total count of unique credentials used

---

## Comparison to Brick Towers' Approach

The Brick Towers identity system (Lesson 5.1) uses signature verification, not MerkleTree proofs:

| Aspect | Signature-Based (Brick Towers) | MerkleTree-Based |
|--------|-------------------------------|-----------------|
| What's proven | "My credential was signed by issuer X" | "I hold one of the credentials in set S" |
| Anonymity set | 1 (the specific credential) | N (all credentials in the tree) |
| Issuer linkability | Verifier knows which issuer signed | Verifier sees only the tree root |
| Credential reuse | Unlimited (no nullifiers) | Controllable via nullifiers |
| Setup complexity | Simpler — just store issuer public key | More complex — maintain MerkleTree |
| Use case fit | Individual verification (age check) | Anonymous membership (voting, access) |

Use signature-based verification when the verifier needs to know the claim but not the identity (Lesson 5.1's age check). Use MerkleTree when the verifier shouldn't know even which credential was used.

---

## The Witness Implementation

```typescript
type CredentialPrivateState = {
  readonly credentials: Uint8Array[];  // Array of credential data
  readonly merkleProofs: Map<string, MerkleProof>;  // Cached proofs
};

export const witnesses = {
  load_credential: ({
    privateState,
  }: WitnessContext<Ledger, CredentialPrivateState>): [
    CredentialPrivateState,
    Uint8Array,
  ] => {
    // Return the credential the user wants to prove
    const cred = privateState.credentials[0];
    return [privateState, cred];
  },
};
```

The witness provides the raw credential data. The circuit handles hashing, MerkleTree membership checking, and nullifier derivation. The witness doesn't need to compute any proofs — the ZK circuit does that.

---

## HistoricMerkleTree for Append-Only Registries

If credentials are added over time, the MerkleTree root changes with each insertion. A proof generated against an old root becomes invalid.

`HistoricMerkleTree<n, T>` solves this by tracking historical roots:

```compact
export ledger credentials: HistoricMerkleTree<16, Bytes<32>>;
```

A membership proof is valid against any historical root, not just the current one. This means a user can generate a proof, and even if new credentials are added before the proof is verified, it still passes.

Use `HistoricMerkleTree` for credential registries where insertions happen concurrently with verifications. Use plain `MerkleTree` when the tree is populated once and then read-only.

---

## Putting It Together: Anonymous Credential System

Here's a complete contract skeleton:

```compact
pragma language_version >= 0.20;

import CompactStandardLibrary;

export ledger credentials: HistoricMerkleTree<16, Bytes<32>>;
export ledger nullifiers: Set<Bytes<32>>;
export ledger issuer: Bytes<32>;

witness load_credential(): Bytes<64>;

constructor(issuer_pk: Bytes<32>) {
  issuer = issuer_pk;
}

// Called by the issuer to register a new credential
export circuit register(commitment: Bytes<32>): [] {
  credentials.insert(commitment);
}

// Called by a credential holder to prove membership (one-time)
export circuit prove_once(): [] {
  const cred = load_credential();
  const commitment = persistentHash(cred);
  const nullifier = persistentHash<Vector<2, Bytes<32>>>([
    pad(32, "nullifier:"),
    persistentHash(cred)
  ]);

  assert credentials.member(commitment)
         "Not a registered credential";
  assert !nullifiers.member(nullifier)
         "Already used";

  nullifiers.insert(nullifier);
}
```

---

## Questions to consider:

- MerkleTree depth determines capacity (2^n leaves). Depth 16 holds 65,536 credentials. What happens if you need more? What are the tradeoffs of deeper trees?
- The nullifier prevents reuse, but it also means a user can only prove once. How would you modify the pattern for applications where the user needs to prove multiple times but each proof should be unique (e.g., voting in multiple elections)?
- If an attacker knows the full set of possible credentials, they could compute all commitments and check each against the tree. How does the commitment scheme defend against this? When is `persistentCommit` (with randomness) needed over `persistentHash`?

---

## Assignment

Design an anonymous voting system using MerkleTree commitments and nullifiers:

1. How are voter credentials registered? What's the commitment?
2. How does a voter cast a vote? What does the circuit check?
3. How do you prevent double-voting while keeping votes anonymous?
4. How do you count votes without linking them to voters?
5. Write the Compact contract skeleton with ledger fields, witnesses, and circuit signatures
