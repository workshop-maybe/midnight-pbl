# Lesson 3.1: Controlling Visibility with disclose()

## The Default Is Private

In Compact, computation is private by default. When a circuit runs, the values it manipulates — local variables, witness inputs, intermediate results — never appear on-chain. The ZK proof guarantees the computation was correct, but the inputs and intermediate steps are invisible to observers.

This is the opposite of Cardano. On Cardano, the default is public. Every datum, every redeemer, every piece of transaction metadata is visible to anyone reading the chain. Privacy on Cardano requires external mechanisms.

On Midnight, you start private and selectively reveal. The tool for revealing is `disclose()`.

---

## What disclose() Does

`disclose()` takes a value and marks it for inclusion in the public transaction record. Without it, the value stays behind the ZK proof.

Compare these two circuit fragments:

**Private — value stays hidden:**
```
export circuit setSecret(v: Uint<64>): [] {
  value = v;
}
```

Here, `v` enters the circuit as a parameter, gets written to the ledger, and the ZK proof guarantees the write happened correctly. But — and this is the subtlety — the ledger itself is public. So `value` on the ledger is readable after the transaction. The parameter `v` is what's private: observers can see the new ledger state but can't see which transaction input produced it.

**Public — value explicitly disclosed:**
```
export circuit setPublic(v: Uint<64>): [] {
  value = disclose(v);
}
```

Now `v` is part of the transaction's public record. Observers can see both the input value and the resulting ledger state. The connection between "this input" and "this state change" is explicit.

---

## When to Use disclose()

The decision comes down to: does the observer need to know the input, or just the result?

### Disclose when the input matters

A public key derived from a secret key:

```
constructor(sk: Bytes<32>, v: Uint<64>) {
  authority = disclose(publicKey(round, sk));
  value = disclose(v);
  state = State.SET;
}
```

The deployer's secret key (`sk`) stays private. The public key derived from it is disclosed because other users need to know who controls the contract. The initial `value` is disclosed because it's the starting state everyone should agree on.

### Don't disclose when only the proof matters

A circuit that verifies a credential without revealing it:

```
export circuit proveEligibility(): [] {
  const cred = loadCredential();         // witness — private
  const hash = persistentHash(cred);     // computed — private
  assert(credentials.member(hash));       // verified against ledger
  // No disclose() — the proof itself is sufficient
}
```

The credential enters privately, gets hashed, and the hash is checked against a Merkle tree on the ledger. The transaction proves "I have a valid credential" without revealing which one. No `disclose()` needed because the verifier doesn't need to see the credential — they just need to see the proof succeed.

---

## disclose() and the Ledger Visibility Rule

There's an important interaction between `disclose()` and ledger writes.

Ledger fields are always readable on-chain. If you write to a ledger field, the new value is visible regardless of whether you used `disclose()`. So what does `disclose()` actually add?

It makes the **input** visible, not just the **output**.

Without `disclose()`:
- Observer sees: ledger field changed to X
- Observer doesn't see: what input caused the change

With `disclose()`:
- Observer sees: ledger field changed to X because input was Y

This matters for auditability. If your contract manages a public treasury, you might want observers to verify not just the new balance but the specific deposit amount that produced it.

---

## Hashes and Commitments: Privacy on a Public Ledger

Sometimes you need to store something on the ledger — so it's persistent and verifiable — but you don't want to reveal the raw value. Compact's standard library provides two approaches:

**Deterministic hashing:**
```
const h = persistentHash(secretValue);
ledgerField = h;
```

The hash is public on the ledger. The preimage is private. Anyone with the same input can verify the hash, which means `persistentHash` is linkable — the same input always produces the same hash.

**Randomized commitment:**
```
const c = persistentCommit(secretValue, randomness);
ledgerField = c;
```

The commitment is public. Both the value and the randomness are needed to open it. Different randomness means different commitments for the same value. This breaks linkability — observers can't tell if two commitments hide the same value.

Use `persistentHash` when linkability is acceptable (e.g., a public key). Use `persistentCommit` when it's not (e.g., a credential in a set where membership should be anonymous).

---

## The Privacy Gradient

Putting it all together, Compact gives you a gradient of visibility:

| Level | Mechanism | What's Visible | Use When |
|-------|-----------|----------------|----------|
| **Fully private** | No `disclose()`, no ledger write | Nothing on-chain | Intermediate computations, witness data |
| **Proven but hidden** | No `disclose()`, assertion against ledger | Proof succeeds or fails | Credential checks, eligibility |
| **Hashed on ledger** | `persistentHash()` or `persistentCommit()` | Hash/commitment only | Need persistence without revealing the value |
| **Fully public** | `disclose()` | Input value on public record | Deployer identity, initial state, audit trail |

You're not choosing between "private" and "public." You're choosing the right point on this gradient for each piece of data in your contract.

---

## Comparison to Cardano

On Cardano, there's no gradient. Everything the Plutus validator touches — datum, redeemer, script context — is on-chain. If you want privacy, you hash values off-chain and submit only the hash. But Cardano has no mechanism to prove the off-chain computation was correct.

Midnight's `disclose()` fills the gap between "fully public" and "trust me, I computed this correctly." The ZK proof replaces the trust. `disclose()` lets you choose exactly how much of the computation to reveal.

---

## Questions to consider:

- If ledger state is always public anyway, why not just `disclose()` everything? What information does withholding `disclose()` actually protect?
- A contract uses `persistentHash` to store credential hashes. An attacker who knows the set of possible credentials can hash each one and check against the ledger. How would you defend against this? When does `persistentCommit` solve it and when doesn't it?
- In the constructor example, the secret key is private but the public key is disclosed. Could a future quantum computer reverse this? How does this compare to the same risk on Cardano?

---

## What's Next

Lesson 3.2 follows the data from the other direction: once a circuit runs and a proof is generated, how does it get verified on-chain?

---

## Conversation Starters

You're building a sealed-bid auction on Midnight. Each bidder submits a bid that should remain hidden until the reveal phase. Design the data flow:

1. What does the `submitBid` circuit look like? What gets disclosed and what stays private?
2. How do you store the bid on the ledger so the bidder can prove it later?
3. What does the `revealBid` circuit look like?
4. At what point does the bid amount become public, and through which mechanism?
