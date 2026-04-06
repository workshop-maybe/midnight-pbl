# Lesson 2.1: Anatomy of a Compact Contract

## Five Building Blocks

Every Compact contract is built from five components: a pragma, ledger declarations, a constructor, circuits, and witnesses. Before you write any Compact code (that's Module 2.3), you need a mental model of how these pieces fit together.

---

## 1. Pragma and Imports

A Compact file starts by declaring its language version and importing the standard library:

```
pragma language_version 0.22;
import CompactStandardLibrary;
```

The pragma locks the contract to a specific compiler version. This matters because Compact is pre-1.0 and breaking changes happen between releases. The standard library provides cryptographic primitives — hashing, commitments, public key derivation — that you'll use in nearly every contract.

---

## 2. Ledger Declarations

The ledger section defines what the contract stores on-chain:

```
export ledger authority: Bytes<32>;
export ledger value: Uint<64>;
export ledger state: State;
export ledger round: Counter;
```

Each `export ledger` field is persistent state. It survives between transactions and is publicly readable on the Midnight ledger.

The `export` keyword makes the field accessible from outside the contract (by DApp code or other contracts). Without `export`, the field exists but is internal.

**Types available for ledger fields:**

| Type | What It Stores |
|------|---------------|
| `Uint<n>` | Unsigned integer of n bits |
| `Bytes<n>` | Fixed-size byte array |
| `Field` | Scalar field element (used in ZK arithmetic) |
| `Boolean` | True or false |
| `Counter` | Auto-incrementing value (prevents linkability across rounds) |
| `Set<T>` | Unbounded set — good for nullifiers |
| `Map<K, V>` | Unbounded key-value store |
| `List<T>` | Unbounded list with front insertion |
| `MerkleTree<n, T>` | Bounded tree (depth 2-32) — membership proofs without revealing which member |
| `HistoricMerkleTree<n, T>` | MerkleTree with historical root tracking |
| `Opaque<'string'>` | JavaScript string passed through without inspection |
| `Opaque<'Uint8Array'>` | JavaScript byte array passed through without inspection |

You don't write `Cell<Uint<64>>`. Compact wraps ledger fields in `Cell` implicitly. You declare the value type; the runtime handles the container.

---

## 3. Constructor

The constructor initializes ledger state when the contract is deployed:

```
constructor(sk: Bytes<32>, v: Uint<64>) {
  authority = disclose(publicKey(round, sk));
  value = disclose(v);
  state = State.SET;
}
```

This runs once. The `disclose()` calls mark `authority` and `value` as public — they'll be visible on the ledger. The `state` field is set directly without `disclose()` because enum values on the ledger are already public by the ledger visibility rule.

Constructor parameters can be private. In this example, `sk` (a secret key) enters via the deployer but only the derived public key gets disclosed.

---

## 4. Circuits

Circuits are the contract's entry points. They're what transactions call:

```
export circuit get(): Uint<64> {
  assert(state == State.SET, "Attempted to get uninitialized value");
  return value;
}

export circuit set(v: Uint<64>): [] {
  assert(state == State.UNSET, "Attempted to set initialized value");
  const sk = secretKey();
  const pk = publicKey(round, sk);
  authority = disclose(pk);
  value = disclose(v);
  state = State.SET;
}
```

Circuits can read and write ledger state, call witness functions for private data, perform assertions, and use `disclose()` to make values public. The Compact compiler converts each circuit into a zero-knowledge circuit — the ZK proof guarantees the computation was correct without revealing private inputs.

The `export` keyword makes the circuit callable from DApp code. Internal circuits (without `export`) can be used as helpers within the contract.

**What circuits can't do:** They can't make network calls, read from other contracts, or perform unbounded loops. Compact is non-Turing-complete by design — every circuit has a fixed computational bound, which is what makes the ZK proof feasible.

---

## 5. Witnesses

Witnesses are declarations for private data that will come from the user's machine at runtime:

```
witness secretKey(): Bytes<32>;
```

In the Compact file, a witness is just a type signature. The actual implementation lives in TypeScript, in the DApp code:

```typescript
// In your TypeScript DApp
const witnesses = {
  secretKey: () => userSecretKey
};
```

When a circuit calls `secretKey()`, the runtime fetches the value from the TypeScript environment. The value enters the ZK circuit for computation but never appears on-chain.

**Critical design point:** Witnesses are untrusted. The contract cannot verify that the witness returned honest data. If a witness lies, the circuit may produce an incorrect result — but the ZK proof will still verify that the computation was performed correctly on whatever input was provided. The contract must use other mechanisms (like verifying a signature against a known public key) to establish trust.

---

## How They Fit Together

```
┌──────────────────────────────────────────┐
│  Compact Contract                        │
│                                          │
│  pragma + imports                        │
│                                          │
│  ┌─────────────────────┐                 │
│  │  Ledger (on-chain)  │                 │
│  │  - authority         │  ◄── public    │
│  │  - value             │                │
│  │  - state             │                │
│  │  - round (Counter)   │                │
│  └──────────▲──────────┘                 │
│             │ read/write                  │
│  ┌──────────┴──────────┐                 │
│  │  Circuits           │                 │
│  │  - constructor()    │  ◄── entry      │
│  │  - get()            │      points     │
│  │  - set(v)           │                 │
│  └──────────▲──────────┘                 │
│             │ calls                       │
│  ┌──────────┴──────────┐                 │
│  │  Witnesses          │                 │
│  │  - secretKey()      │  ◄── private    │
│  └─────────────────────┘     (TypeScript)│
└──────────────────────────────────────────┘
```

Data flows upward: witnesses provide private inputs, circuits compute on them and decide what to disclose, and disclosed values land on the public ledger.

---

## Comparison to Aiken

If you're coming from Aiken, the biggest conceptual shift: in Aiken, you write validators that check proposed state transitions. In Compact, you write circuits that perform the state transitions. The validator is a judge. The circuit is an actor. Lesson 2.2 maps every Aiken concept to its Compact equivalent in detail.

---

## Questions to consider:

- Witnesses are untrusted by design. What mechanisms does a Compact contract have to verify that witness data is authentic? How does this compare to how an Aiken validator trusts its redeemer?
- The `Counter` type exists specifically to prevent linkability across rounds. What attack does it prevent, and why doesn't a simple `Uint<64>` provide the same protection?
- Opaque types (`Opaque<'string'>`, `Opaque<'Uint8Array'>`) pass JavaScript data through without Compact being able to inspect it. What's the use case for a type the contract can't read?

---

## What's Next

Lesson 2.2 maps each Aiken concept to its Compact equivalent, showing you where your existing knowledge transfers and where things change.

---

## Conversation Starters

Given this Compact contract skeleton, identify each component and explain its role:

```
pragma language_version 0.22;
import CompactStandardLibrary;

export ledger messages: Map<Bytes<32>, Opaque<'string'>>;
export ledger round: Counter;

witness authorKey(): Bytes<32>;

constructor() {
  round.increment(1);
}

export circuit post(content: Opaque<'string'>): [] {
  const sk = authorKey();
  const pk = publicKey(round, sk);
  messages.insert(disclose(pk), content);
  round.increment(1);
}
```

For each component, answer:
- What is its role in the contract?
- What data is public and what is private?
- Why does the constructor increment the round counter?
