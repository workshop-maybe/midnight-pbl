# Brick Towers Midnight Identity: Code Analysis (2026-03-24)

Source: github.com/bricktowers/midnight-identity
Language version: pragma >= 0.14.0 (older SDK, compact-runtime ^0.7.0)
Note: May not compile on compiler 0.30.0 due to API changes. Code patterns remain valid.

## Architecture

5 Compact contracts + supporting services:

```
midnight-identity/
├── crypto/Crypto.compact              # Shared crypto module (signatures, hashing)
├── identity-contract/src/identity.compact  # Re-exports from Crypto
├── shop-contract/src/shop.compact     # Age-gated wine shop with payment
├── signature-registry-contract/src/registry.compact  # Wallet ↔ signing key link
├── token-contract/src/token.compact   # tBTC token minting
├── identity-provider-api/             # Issues signed credentials (off-chain)
├── shop-api/                          # Shop backend
├── shop-ui/                           # React frontend
└── signature-registry-indexer/        # Blockchain event listener
```

## Crypto Module (Crypto.compact)

### CredentialSubject Struct

```compact
export struct CredentialSubject {
    id: Bytes<32>;                    // midnight wallet own_public_key
    first_name: Bytes<32>;
    last_name: Bytes<32>;
    national_identifier: Bytes<32>;
    birth_timestamp: Uint<64>;
}
```

### Signature Struct (Schnorr-like)

```compact
export struct Signature {
    pk: CurvePoint;
    R: CurvePoint;
    s: Field;
}

export struct SignedCredentialSubject {
    subject: CredentialSubject;
    signature: Signature;
}
```

### Signature Verification Circuit

```compact
export pure circuit verify_signature(msg: Bytes<32>, signature: Signature): [] {
    const {pk, R, s} = signature;
    const R_bytes = point_to_bytes(R);
    const pk_bytes = point_to_bytes(pk);
    const c_bytes = Bytes96 { b0: R_bytes, b1: pk_bytes, b2: msg };
    const c: Field = transient_hash<Bytes96>(c_bytes);
    const lhs: CurvePoint = ec_mul_generator(s);
    const c_pk: CurvePoint = ec_mul(pk, c);
    const rhs: CurvePoint = ec_add(R, c_pk);
    assert lhs == rhs "Signature verification failed";
}
```

Uses elliptic curve operations: `ec_mul_generator`, `ec_mul`, `ec_add`. Pure circuit — no state mutation.

### Key Derivation and Signing

```compact
export pure circuit derive_pk(sk_bytes: Bytes<32>): CurvePoint {
    const sk: Field = 0; // transient_hash<Bytes<32>>(sk_bytes);
    const pk: CurvePoint = ec_mul_generator(sk);
    return pk;
}

export pure circuit sign(msg: Bytes<32>, sk_bytes: Bytes<32>): Signature {
    const sk: Field = transient_hash<Bytes<32>>(sk_bytes);
    const pk: CurvePoint = ec_mul_generator(sk);
    const nonce_input = Bytes64 { b0: sk_bytes, b1: msg };
    const k: Field = transient_hash<Bytes64>(nonce_input);
    const R: CurvePoint = ec_mul_generator(k);
    // Schnorr: s = k + H(R||pk||msg) * sk
    const c: Field = transient_hash<Bytes96>(Bytes96 { b0: point_to_bytes(R), b1: point_to_bytes(pk), b2: msg });
    const s: Field = k + (c * sk);
    return Signature { pk, R, s };
}
```

### Subject Hashing

```compact
export pure circuit subject_hash(credentialSubject: CredentialSubject): Bytes<32> {
    return persistent_hash<CredentialSubject>(credentialSubject);
}
```

## Shop Contract (shop.compact) — Age Verification

```compact
export struct Order {
    id: Bytes<16>;
    user_wallet_pk: Bytes<32>;
    timestamp: Uint<64>;
    items: Vector<100, Bytes<16>>;
    payment: CoinInfo;
}

witness get_order(id: Bytes<16>): Order;
witness get_identity(): SignedCredentialSubject;

export circuit submit_order(id: Bytes<16>): [] {
  const order = get_order(id);
  const identity = get_identity();

  // 1. Verify issuer is trusted
  assert identity.signature.pk == trusted_issuer_public_key "Not trusted issuer";

  // 2. Verify identity belongs to caller
  assert identity.subject.id == own_public_key().bytes "Not wallet owner";

  // 3. Verify signature
  verify_signature(subject_hash(identity.subject), identity.signature);

  // 4. Verify age >= 21
  assert order.timestamp - identity.subject.birth_timestamp > 21 * 365 * 24 * 60 * 60 * 1000 "Not over 21";

  // 5. Verify payment amount
  const order_total = fold((acc, item) => (acc + available_items.lookup(item)) as Uint<32>, 0 as Uint<32>, order.items);
  assert order_total == order.payment.value "Payment mismatch";

  // 6. Process payment
  receive(disclose(order.payment));
  assert order.payment.color == expected_coin_color "Not tBTC";
  send_immediate(disclose(order.payment), left<ZswapCoinPublicKey, ContractAddress>(store_owner_public_key), disclose(order.payment.value));
}
```

## Shop Witnesses (TypeScript)

```typescript
export type ShopPrivateState = {
  readonly orders: Record<string, Order>;
  readonly signedCredentialSubject?: SignedCredentialSubject;
};

export const witnesses = {
  get_order: ({ privateState }: WitnessContext<Ledger, ShopPrivateState>, orderId: Uint8Array):
    [ShopPrivateState, Order] => [privateState, privateState.orders[toHex(orderId)]],

  get_identity: ({ privateState }: WitnessContext<Ledger, ShopPrivateState>):
    [ShopPrivateState, SignedCredentialSubject] => {
    if (privateState.signedCredentialSubject) {
      return [privateState, privateState.signedCredentialSubject];
    } else throw new Error('No identity found');
  },
};
```

## Signature Registry (registry.compact)

Simple linking contract — maps wallet public key to signing public key:

```compact
export ledger wallet_public_key: ZswapCoinPublicKey;
export ledger signing_public_key: CurvePoint;

export circuit register(signing_key: CurvePoint): [] {
  wallet_public_key = own_public_key();
  signing_public_key = signing_key;
}
```

## Key Observations for Course Lessons

1. **Signature-based, not MerkleTree-based.** This system verifies credentials via digital signatures (Schnorr), not MerkleTree membership proofs. This is a simpler pattern — good for SLT 5.1.
2. **The CredentialSubject struct is a Compact implementation of W3C Verifiable Credentials.** Comment in code: "Could be used as a credential subject as defined in https://w3c-ccg.github.io/vc-data-model/#credential-subject"
3. **Age verification is arithmetic, not comparison.** `order.timestamp - birth_timestamp > 21 years in ms`. Private birth_timestamp never disclosed.
4. **Multi-witness pattern.** The shop contract uses two witnesses: one for the order, one for the identity. Both are private.
5. **Coin operations.** `receive()`, `send_immediate()`, `disclose(order.payment)` — shows how ZSwap coins integrate with circuits.
6. **Module imports.** `import "../../crypto/Crypto"` — Compact supports module system for shared code.
7. **MerkleTree pattern still needed for SLT 5.2.** The Brick Towers system doesn't use MerkleTree for anonymous credential sets — each credential is verified individually via signature. MerkleTree would enable "I hold one of N credentials" without revealing which one.
8. **No nullifiers in this system.** Credentials can be reused. For single-use proofs (SLT 5.2), we'd add a nullifier Set.
