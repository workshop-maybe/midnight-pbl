# Lesson 5.1: Verifying Credentials Without Revealing Them

## The Problem

An identity provider issues a credential — your name, date of birth, national ID. A shop needs to verify you're over 21. On Cardano, the credential goes on-chain: public, permanent, linked to your wallet. Everyone knows your birthday.

On Midnight, the credential stays on your machine. A Compact circuit reads it privately, checks the claim, and produces a ZK proof. The shop sees "verified: over 21." It never sees your name, your birthday, or your national ID.

This lesson walks through how Brick Towers built this pattern in their [midnight-identity](https://github.com/bricktowers/midnight-identity) project.

---

## The Credential Structure

A credential is a struct with identity attributes and a cryptographic signature from a trusted issuer:

```compact
struct CredentialSubject {
    id: Bytes<32>;                    // Wallet public key
    first_name: Bytes<32>;
    last_name: Bytes<32>;
    national_identifier: Bytes<32>;
    birth_timestamp: Uint<64>;
}

struct Signature {
    pk: CurvePoint;    // Issuer's public key
    R: CurvePoint;     // Nonce commitment
    s: Field;          // Signature scalar
}

struct SignedCredentialSubject {
    subject: CredentialSubject;
    signature: Signature;
}
```

This follows the [W3C Verifiable Credentials](https://w3c-ccg.github.io/vc-data-model/#credential-subject) model. The `CredentialSubject` holds the claims. The `Signature` binds them to a trusted issuer.

All fields use fixed-size types (`Bytes<32>`, `Uint<64>`, `CurvePoint`, `Field`). This is a ZK constraint — the proof system needs known bit widths. Variable-length strings get padded to `Bytes<32>`.

---

## The Verification Circuit

The shop contract verifies the credential inside a circuit:

```compact
export ledger trusted_issuer_public_key: CurvePoint;

witness get_identity(): SignedCredentialSubject;

export circuit submit_order(id: Bytes<16>): [] {
  const order = get_order(id);
  const identity = get_identity();

  // 1. Verify the credential was issued by a trusted party
  assert identity.signature.pk == trusted_issuer_public_key
         "The identity is not issued by a trusted issuer";

  // 2. Verify the credential belongs to the caller
  assert identity.subject.id == own_public_key().bytes
         "Provided identity is not matching the wallet owner";

  // 3. Verify the signature is valid
  verify_signature(subject_hash(identity.subject), identity.signature);

  // 4. Check the age claim
  assert order.timestamp - identity.subject.birth_timestamp
         > 21 * 365 * 24 * 60 * 60 * 1000
         "User is not over 21 years old";

  // ... payment processing
}
```

Four verification steps, and none of them disclose the credential:

1. **Issuer check.** The signature's public key must match the trusted issuer stored on the ledger. This prevents forged credentials.
2. **Ownership check.** The credential's `id` must match the caller's wallet public key (`own_public_key()`). This prevents using someone else's credential.
3. **Signature verification.** The `verify_signature` circuit mathematically checks that the signature is valid for the credential's content hash. If any attribute was tampered with, the hash won't match and verification fails.
4. **Age check.** Simple arithmetic: current timestamp minus birth timestamp must exceed 21 years in milliseconds. The birth timestamp is private — only the boolean result (over 21 or not) matters.

The credential enters via the `get_identity()` witness. It's processed entirely inside the ZK circuit. The proof says "this credential is valid, from a trusted issuer, belongs to the caller, and the holder is over 21." The credential attributes never appear on-chain.

---

## Signature Verification In-Circuit

The `verify_signature` circuit implements Schnorr signature verification using elliptic curve arithmetic:

```compact
pure circuit verify_signature(msg: Bytes<32>, signature: Signature): [] {
    const {pk, R, s} = signature;

    // Compute challenge: c = H(R || pk || msg)
    const c: Field = transient_hash<Bytes96>(
      Bytes96 { b0: point_to_bytes(R), b1: point_to_bytes(pk), b2: msg }
    );

    // Verify: s * G == R + c * pk
    const lhs: CurvePoint = ec_mul_generator(s);
    const c_pk: CurvePoint = ec_mul(pk, c);
    const rhs: CurvePoint = ec_add(R, c_pk);

    assert lhs == rhs "Signature verification failed";
}
```

This is a standard Schnorr verification equation. The Compact standard library provides the elliptic curve operations: `ec_mul_generator` (scalar × base point), `ec_mul` (scalar × point), `ec_add` (point addition).

The circuit is marked `pure` — it doesn't read or write ledger state. It's a utility that other circuits call. Pure circuits don't generate their own ZK proofs; they're inlined into the calling circuit's proof.

`transient_hash` is used instead of `persistent_hash` because the challenge value is ephemeral — it's used during verification and then discarded. It doesn't need the collision resistance guarantees of persistent hashing.

---

## The Witness Side

The TypeScript witness provides the credential from the user's local state:

```typescript
export type ShopPrivateState = {
  readonly orders: Record<string, Order>;
  readonly signedCredentialSubject?: SignedCredentialSubject;
};

export const witnesses = {
  get_identity: ({
    privateState,
  }: WitnessContext<Ledger, ShopPrivateState>): [ShopPrivateState, SignedCredentialSubject] => {
    if (privateState.signedCredentialSubject) {
      return [privateState, privateState.signedCredentialSubject];
    } else throw new Error('No identity found');
  },
};
```

The credential was stored in `privateState` during a previous step (the user authenticated with the identity provider and received a signed credential). The witness returns it unchanged. If no credential exists, it throws — the circuit never runs without valid private state.

---

## The Full Flow

1. **Off-chain:** User authenticates with an identity provider (IDP). The IDP verifies their documents and issues a `SignedCredentialSubject` — a credential struct signed with the IDP's private key.

2. **Local storage:** The user stores the signed credential in their DApp's private state.

3. **On-chain setup:** The shop contract stores `trusted_issuer_public_key` on the ledger. Anyone can read which issuers the shop trusts.

4. **Transaction:** User calls `submit_order`. The witness provides the credential. The circuit verifies issuer, ownership, signature, and age. The proof is generated locally. Only the payment information is disclosed.

5. **Verification:** The Midnight network verifies the ZK proof. The shop receives a confirmed order. It never sees the credential.

---

## Design Decisions

**Why signature-based (not MerkleTree-based)?**

This system verifies individual credentials via digital signatures. Each credential is checked independently. This is the simpler pattern — good for "prove this specific claim about yourself." Lesson 5.2 covers the MerkleTree pattern, which enables "prove you hold one of N credentials" without revealing which one.

**Why `own_public_key()` for binding?**

The credential's `id` field is the wallet's public key. The circuit checks `identity.subject.id == own_public_key().bytes`. This binds the credential to the wallet that's calling the circuit, preventing someone from using a stolen credential.

**Why fixed-size fields?**

ZK circuits need fixed sizes. `first_name: Bytes<32>` means names are padded to 32 bytes. This leaks the maximum length but not the actual content. A more privacy-preserving design would hash the name before including it in the credential.

---

## Questions to consider:

- The trusted issuer public key is stored on the ledger (public). What happens if the issuer's key is compromised? How would you design credential revocation?
- The age check uses millisecond arithmetic. What edge cases exist? (Leap years? Time zones? Clock skew between the order timestamp and the birth timestamp?)
- This system trusts a single issuer. How would you extend it to accept credentials from multiple issuers without deploying a new contract?

---

## Things to Try

Design a Compact contract for professional certification verification:

1. Define a `CertificationCredential` struct with fields for: holder ID, certification type, issuing authority, issue date, and expiry date
2. Write a `verify_certification` circuit that checks: the credential is from a trusted authority, it hasn't expired, and the holder matches the caller
3. Decide what gets disclosed and what stays private. The verifier needs to know the certification type but not the holder's identity.
4. Write the witness function signature in TypeScript
