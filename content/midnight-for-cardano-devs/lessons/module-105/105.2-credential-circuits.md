# Lesson 105.2: Verifying Credentials Without Revealing Them

**SLT:** I can design a Compact circuit that verifies a credential without revealing its attributes.

**Type:** Developer Documentation

---

## The Problem

An identity provider issues a credential — your name, date of birth, certification level. A verifier needs to confirm you're qualified. On Cardano, the credential goes on-chain: public, permanent, linked to your wallet. Everyone sees your details.

On Midnight, the credential stays on your machine. A Compact circuit reads it privately, checks the claim, and produces a ZK proof. The verifier sees "verified: qualified." They never see your name, your birthday, or your other credentials.

This is the pattern that makes Midnight useful for enterprises. Not "hide everything" and not "reveal everything." Reveal exactly what's needed.

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

All fields use fixed-size types (`Bytes<32>`, `Uint<64>`, `CurvePoint`, `Field`). This is a ZK constraint — the proof system needs known bit widths. Variable-length strings get padded to `Bytes<32>`.

**Cardano comparison:** On Cardano, credential data lives in a datum — flexible, structured, publicly readable. On Midnight, credential data lives in a witness — typed, fixed-size, and never on-chain.

---

## The Verification Circuit

Four checks, zero disclosures:

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

  // Only the payment crosses the boundary
  receive(disclose(order.payment));
}
```

What each step does:

1. **Issuer check.** The signature's public key must match the trusted issuer stored on the ledger. Prevents forged credentials.
2. **Ownership check.** The credential's `id` must match the caller's wallet (`own_public_key()`). Prevents using someone else's credential.
3. **Signature verification.** Schnorr verification: the signature is mathematically valid for the credential's content hash. If any attribute was tampered with, verification fails.
4. **Claim check.** Arithmetic: current timestamp minus birth timestamp exceeds 21 years. The birth timestamp is private — only the boolean result matters.

The credential enters via `get_identity()` — a witness function. It's processed entirely inside the ZK circuit. The proof says "valid credential, trusted issuer, belongs to caller, holder is over 21." The attributes never appear on-chain.

---

## Signature Verification In-Circuit

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

Standard Schnorr verification. The `pure` keyword means this circuit doesn't read or write ledger state — it's a utility inlined into the calling circuit's proof. No separate proof generation.

`transient_hash` (not `persistent_hash`) because the challenge value is ephemeral — used during verification and discarded. It doesn't need the collision-resistance guarantees of persistent hashing.

---

## The Witness Side

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

The witness returns `[newPrivateState, returnValue]` — every witness uses this tuple pattern. The credential was stored in `privateState` during a previous step (the user authenticated with an identity provider). If no credential exists, the witness throws and the circuit never runs.

**This is the pattern that was missing from the custom example contracts.** The public-answer and private-answer contracts use `withVacantWitnesses` because all private data comes through circuit parameters. Credential circuits use real witness functions because the private data (the credential) persists in local state across sessions.

---

## Three Disclosure Levels

Selective disclosure isn't binary. You control how much to reveal per attribute:

### Level 1: Boolean Proof (Reveal Nothing)

Prove a fact without revealing the attribute:

```compact
// Prove: "I am over 21"
// Verifier learns: one bit — yes or no
assert timestamp - cred.subject.birth_timestamp > threshold
```

### Level 2: Derived Value (Reveal a Transformation)

Disclose a computed value that reveals less than the raw attribute:

```compact
// Prove: "My age bracket is 25-34"
// Verifier learns: the bracket, not the exact age
const age_years = (timestamp - cred.subject.birth_timestamp)
                  / (365 * 24 * 60 * 60 * 1000);
const bracket = if (age_years < 25) { 0 }
                else if (age_years < 35) { 1 }
                else if (age_years < 45) { 2 }
                else { 3 };
disclose(bracket);
```

### Level 3: Partial Attribute (Reveal a Slice)

Disclose part of an attribute:

```compact
// Prove: "My national ID starts with 'US'"
// Verifier learns: country prefix, not the full ID
disclose(slice(cred.subject.national_identifier, 0, 2));
```

Choose the minimum level that satisfies the verifier's need. Most use cases only require Level 1.

---

## Team Capability Proofs

Individual selective disclosure extends to teams. An enterprise can prove "we have N certified members" without revealing who:

```compact
export ledger team_credentials: MerkleTree<16, Bytes<32>>;

witness load_member_credentials(): Vector<20, SignedCredentialSubject>;

export circuit prove_team_capability(
  required_cert: Bytes<32>,
  min_count: Uint<8>
): [] {
  const members = load_member_credentials();
  var count: Uint<8> = 0;

  for (i in 0..20) {
    const cred = members[i];
    if (cred.subject.id != pad(32, "")) {
      verify_signature(subject_hash(cred.subject), cred.signature);
      if (cred.subject.certification_type == required_cert) {
        count = count + 1;
      }
    }
  }

  assert count >= min_count "Insufficient team capability";
  disclose(count);
}
```

The verifier learns: "this team has at least N members with certification X." They don't learn who, what other certifications exist, or which specific credentials were used.

---

## The Trust Chain

Every selective disclosure proof rests on five links:

1. **Issuer trust.** The verifier trusts the issuer's public key (stored on the ledger).
2. **Signature validity.** The ZK proof guarantees the credential's signature is valid.
3. **Ownership binding.** The credential is bound to the caller's wallet via `own_public_key()`.
4. **Claim truth.** The specific claim is checked arithmetically inside the circuit.
5. **Proof soundness.** The ZK proof guarantees all of the above without revealing the inputs.

If any link breaks — compromised issuer key, stolen credential, tampered attributes — the chain fails. The circuit's assertions catch it at proof generation time. A bad proof never reaches the network.

---

## Questions to Consider

- The trusted issuer public key is stored on the ledger (public). What happens if the issuer's key is compromised? How would you design credential revocation?
- This system trusts a single issuer. How would you extend it to accept credentials from multiple issuers without deploying a new contract?
- The age check leaks information at boundaries. If someone barely passes, the verifier can estimate their age within a narrow window. How would you design a fuzzier check?

---

## What's Next

Lesson 105.3 introduces the MerkleTree pattern — proving "I hold one of N credentials" without revealing which one. That's the anonymous membership problem, and combined with this lesson's verification patterns, it completes the credential toolkit.

---

## Things to Try

Design a Compact contract for professional certification verification:

1. Define a `CertificationCredential` struct with: holder ID, certification type, issuing authority, issue date, expiry date
2. Write a `verify_certification` circuit that checks: trusted authority, not expired, holder matches caller
3. Decide what gets disclosed — the verifier needs to know the certification type but not the holder's identity
4. Write the witness function signature in TypeScript
5. Which disclosure level (boolean, derived, partial) is appropriate for each attribute?
