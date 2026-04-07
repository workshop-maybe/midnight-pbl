# Lesson 105.3: Anonymous Membership with MerkleTree and Nullifiers

**SLT:** I can use MerkleTree commitments and nullifiers to prove credential membership without exposing which credential.

**Type:** Developer Documentation

---

## Beyond Individual Verification

Lesson 105.2 showed how to verify a single credential: the user provides it via a witness, the circuit checks the signature, and the proof confirms the claim. The verifier knows "this person holds a valid credential from issuer X."

But what if the question is different? "Does this person hold any credential from this set of 1,000 issued credentials?" If you verify the credential directly, the verifier can tell which specific credential was used. For some applications — anonymous voting, anonymous access control, anonymous team proofs — that's a privacy leak.

MerkleTree commitments solve this. You store hashed credentials in a tree. The user proves they know a leaf without revealing which leaf. Combined with nullifiers, you get single-use anonymous proofs.

---

## The Three-Step Pattern

### Step 1: Commitment

When a credential is issued, a commitment (hash of the credential) is inserted into a MerkleTree:

```compact
export ledger credentials: MerkleTree<16, Bytes<32>>;

export circuit register_credential(commitment: Bytes<32>): [] {
  credentials.insert(commitment);
}
```

The commitment is a `persistentHash` of the credential data. The credential itself is never on-chain — only its hash. `MerkleTree<16, Bytes<32>>` stores up to 2^16 (65,536) commitments.

**Cardano comparison:** On Cardano, credential registration means minting a native asset with a datum. The credential data IS the datum — public, readable, on-chain. On Midnight, registration means inserting a hash into a tree. The data behind the hash stays private.

### Step 2: Membership Proof

To prove they hold a credential, the user provides it via a witness. The circuit hashes it and checks against the tree:

```compact
witness load_credential(): Bytes<64>;

export circuit prove_membership(): [] {
  const cred = load_credential();
  const commitment = persistentHash(cred);

  assert credentials.member(commitment)
         "Credential not found in registry";
}
```

The `member()` check uses a Merkle proof internally. The prover supplies the leaf and its path; the verifier checks the path leads to the tree's root. The proof reveals nothing about which leaf was used — only that some valid leaf exists.

### Step 3: Nullifiers (Single-Use)

Without nullifiers, the same credential generates unlimited proofs. For voting or one-time access, you need to prevent reuse:

```compact
export ledger nullifiers: Set<Bytes<32>>;

export circuit prove_membership_once(): [] {
  const cred = load_credential();
  const commitment = persistentHash(cred);
  const nullifier = persistentHash<Vector<2, Bytes<32>>>([
    pad(32, "nullifier:"),
    persistentHash(cred)
  ]);

  assert credentials.member(commitment)
         "Credential not found";

  assert !nullifiers.member(nullifier)
         "Credential already used";

  nullifiers.insert(nullifier);
}
```

The nullifier is deterministic (same credential always produces the same nullifier) but unlinkable (you can't derive the commitment from the nullifier). The domain separator `"nullifier:"` ensures the nullifier hash is in a different domain from the commitment hash, even though both derive from the same credential.

---

## Why This Works

An observer watching the ledger sees:

1. **MerkleTree insertions** — commitment hashes. Can't tell what credentials they represent.
2. **Nullifier insertions** — nullifier hashes. Can't link a nullifier to a commitment (different domain).
3. **Successful proof transactions** — the ZK proof passed. But which credential? The observer can't tell.

The only information leaked:
- The credential set is growing (number of commitments)
- Credentials are being used (number of nullifiers)
- The count of unique credentials used

---

## Signature-Based vs MerkleTree-Based

Two patterns for two different needs:

| Aspect | Signature-Based (Lesson 105.2) | MerkleTree-Based |
|--------|-------------------------------|-----------------|
| What's proven | "My credential was signed by issuer X" | "I hold one of the credentials in set S" |
| Anonymity set | 1 (the specific credential) | N (all credentials in the tree) |
| Issuer linkability | Verifier knows which issuer signed | Verifier sees only the tree root |
| Credential reuse | Unlimited (no nullifiers) | Controllable via nullifiers |
| Setup complexity | Simple — store issuer public key | More complex — maintain MerkleTree |
| Use case fit | Individual verification (age check, certification) | Anonymous membership (voting, access control) |

Use signature-based when the verifier needs to know the claim but not the identity. Use MerkleTree when the verifier shouldn't know even which credential was used.

---

## HistoricMerkleTree for Growing Registries

If credentials are added over time, the tree root changes with each insertion. A proof generated against an old root becomes invalid if new credentials are added before the proof is verified.

`HistoricMerkleTree` solves this by tracking historical roots:

```compact
export ledger credentials: HistoricMerkleTree<16, Bytes<32>>;
```

A membership proof is valid against any historical root, not just the current one. A user generates a proof, new credentials get added, and the proof still passes.

Use `HistoricMerkleTree` for credential registries where insertions happen concurrently with verifications. Use plain `MerkleTree` when the tree is populated once and then read-only.

---

## Complete Contract: Anonymous Credential System

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

This is a production-ready skeleton. The `register` circuit adds credentials. The `prove_once` circuit verifies membership and prevents reuse. The witness provides the credential from local storage.

---

## Combining Both Patterns

A production credential system often combines signature-based verification (Lesson 105.2) and MerkleTree-based anonymity:

```
Credential Issuance (Cardano):
  └── Public registry: "credential X exists, issued by Y"

Credential Commitment (Midnight):
  └── MerkleTree: anonymous set membership

Individual Verification:
  └── Signature check: "this credential is authentic"

Selective Disclosure:
  └── Boolean proof: "holder meets criterion Z"

Single-Use Proof:
  └── Nullifier: "this credential was used once for this purpose"
```

The Cardano layer provides the trust anchor. The Midnight layer provides the privacy. Selective disclosure is the interface between them. Lesson 106.1 designs this dual-chain architecture in full.

---

## Questions to Consider

- MerkleTree depth determines capacity (2^n leaves). Depth 16 holds 65,536 credentials. What are the tradeoffs of deeper trees? How does depth affect proof generation time?
- The nullifier prevents reuse, but it also means a user can only prove once. How would you modify the pattern for applications where the user proves multiple times but each proof should be unique (e.g., voting in separate elections)?
- If an attacker knows the full set of possible credentials, they could compute all commitments and check each against the tree. When is `persistentCommit` (with randomness) needed over `persistentHash`?

---

## What's Next

Lesson 106.1 brings the credential patterns together with a dual-chain architecture — public verification on Cardano, private proofs on Midnight, and the manual coordination pattern that connects them today.

---

## Things to Try

Design an anonymous voting system using MerkleTree commitments and nullifiers:

1. How are voter credentials registered? What's the commitment?
2. How does a voter cast a vote? What does the circuit check?
3. How do you prevent double-voting while keeping votes anonymous?
4. How do you count votes without linking them to voters?
5. Write the Compact contract skeleton with ledger fields, witnesses, and circuit signatures
