# Writing a Compact Contract with disclose()

## One Function, Two Contracts

This lesson uses the course's signature example: two contracts that do the same thing — check an answer — with one critical difference. The public version discloses the answer. The private version doesn't.

Same function name. Same learner action. One line of difference.

---

## The Public Contract

```compact
pragma language_version >= 0.16;

import CompactStandardLibrary;

// PUBLIC answer submission — your answer is visible to everyone on-chain.
// Wrong answers are immortalized. Right answers can be copied.

export ledger answerKeyHash: Bytes<32>;
export ledger lastAnswer: Bytes<32>;
export ledger lastCorrect: Boolean;
export ledger submissions: Counter;

export circuit setAnswerKey(key: Bytes<32>): [] {
  answerKeyHash = disclose(persistentHash<Bytes<32>>(key));
}

export circuit submitAnswer(answer: Bytes<32>): [] {
  const hash = persistentHash<Bytes<32>>(answer);
  lastCorrect = disclose(hash == answerKeyHash);
  lastAnswer = disclose(answer);
  submissions += 1;
}
```

Four ledger fields. Two circuits. Everything important is wrapped in `disclose()`.

### What's on-chain (public):
- `answerKeyHash` — the hash of the correct answer (set by the instructor)
- `lastAnswer` — the raw answer bytes the learner submitted
- `lastCorrect` — whether the answer was correct
- `submissions` — how many submissions have been made

### What an observer learns:
Everything. The answer hash, the submitted answer, whether it was right. If you submit a wrong answer, it's on-chain forever. If you submit the right answer, anyone else can copy it.

---

## The Private Contract

```compact
pragma language_version >= 0.16;

import CompactStandardLibrary;

// PRIVATE answer submission — only pass/fail crosses the boundary.
// The ZK proof guarantees a real answer was checked.
// You can't fake a pass, but failure doesn't expose what you tried.

export ledger answerKeyHash: Bytes<32>;
export ledger lastCorrect: Boolean;
export ledger submissions: Counter;

export circuit setAnswerKey(key: Bytes<32>): [] {
  answerKeyHash = disclose(persistentHash<Bytes<32>>(key));
}

export circuit submitAnswer(answer: Bytes<32>): [] {
  const hash = persistentHash<Bytes<32>>(answer);
  lastCorrect = disclose(hash == answerKeyHash);
  // answer is NOT disclosed — it never leaves the proof circuit
  submissions += 1;
}
```

Three ledger fields. Same two circuits. One line removed.

### What's on-chain (public):
- `answerKeyHash` — the hash of the correct answer
- `lastCorrect` — whether the answer was correct
- `submissions` — how many submissions have been made

### What's NOT on-chain:
- `lastAnswer` — gone. The ledger field doesn't exist. The answer stays inside the ZK proof circuit and is never disclosed.

### What an observer learns:
Someone submitted an answer. It was correct (or not). That's it. Not what the answer was. Not what wrong answers were tried. The ZK proof guarantees a real answer was checked — you can't fake a pass — but failure doesn't expose what you tried.

---

## The Difference: One Line

The public contract has:

```compact
lastAnswer = disclose(answer);
```

The private contract doesn't. That's the entire privacy difference.

The `answer` parameter enters both circuits identically. Both circuits hash it. Both circuits compare the hash. Both circuits disclose the boolean result. The only question is whether the raw answer also crosses the `disclose()` boundary.

This is the core Midnight design decision, surfaced in the simplest possible example: **you choose what crosses the boundary.**

---

## Building These Contracts

### Contract Structure

Every Compact contract has four parts:

**1. Pragma and imports**

```compact
pragma language_version >= 0.16;
import CompactStandardLibrary;
```

Pins the compiler version. The standard library provides `persistentHash`, `publicKey`, and other cryptographic primitives.

**2. Ledger declarations**

```compact
export ledger answerKeyHash: Bytes<32>;
export ledger lastCorrect: Boolean;
export ledger submissions: Counter;
```

Each `export ledger` field is persistent, public, on-chain state. The `export` keyword makes it readable from outside the contract (by DApp code or the indexer). The types available:

| Type | Use |
|------|-----|
| `Bytes<n>` | Fixed-size byte arrays (hashes, keys, encoded data) |
| `Boolean` | True/false |
| `Counter` | Auto-incrementing integer (concurrent-safe) |
| `Uint<n>` | Unsigned integer of n bits |
| `Opaque<'string'>` | JavaScript string passed through (used in hello world) |
| `Map<K, V>` | Key-value store (used in bulletin board) |

**3. Circuits**

```compact
export circuit submitAnswer(answer: Bytes<32>): [] {
  // ...
}
```

Circuits are the contract's entry points — what transactions call. `export` makes them callable from DApp code. Parameters enter privately by default. The circuit body performs computation, optionally calls `disclose()`, and updates ledger state.

**4. Comments as documentation**

Comments in Compact work like comments in any language. Use them to mark what's public and what's private — the compiler doesn't enforce the comments, but readers need to know the design intent.

---

## Key Patterns

### Pattern 1: Hash-then-disclose

```compact
answerKeyHash = disclose(persistentHash<Bytes<32>>(key));
```

The raw key enters as a private circuit parameter. `persistentHash()` produces a deterministic hash. Only the hash is disclosed. The key stays private.

This pattern is used in both contracts for `setAnswerKey`. Even in the "public" contract, the correct answer itself is never disclosed — only its hash. The instructor's answer key is always private. What changes between contracts is whether the *learner's* answer is disclosed.

### Pattern 2: Compare-then-disclose

```compact
lastCorrect = disclose(hash == answerKeyHash);
```

The comparison happens inside the circuit (private). The boolean result is disclosed. The observer learns "correct" or "incorrect" without learning what was compared.

### Pattern 3: Increment without disclosure

```compact
submissions += 1;
```

The `Counter` type supports `+= 1` directly. No `disclose()` needed — the counter value is a ledger field and is inherently public. Counter increments are also concurrent-safe (Lesson 102.2) — multiple simultaneous submissions won't conflict.

### Pattern 4: Omit to keep private

The private contract simply doesn't have:

```compact
lastAnswer = disclose(answer);
```

There's no "make this private" annotation. Privacy is the default. You make things public by disclosing them. Omit the disclosure and the data stays in the proof.

### Pattern 5: persistentHash vs persistentCommit

Both contracts use `persistentHash` for the answer key:

```compact
answerKeyHash = disclose(persistentHash<Bytes<32>>(key));
```

`persistentHash` is **deterministic** — the same input always produces the same hash. This means it's **linkable**: if two contracts store the hash of the same answer, an observer can tell they're the same answer.

Compact also provides `persistentCommit`, which adds randomness:

```compact
persistentCommit<T>(value: T, rand: Bytes<32>): Bytes<32>
```

The same value with different randomness produces different commitments. Use commitments when you need to prevent correlation — for example, if the same credential is registered in multiple MerkleTree systems (Module 105), you don't want an observer linking them via identical hashes.

| Function | Deterministic | Linkable | Use when |
|----------|--------------|----------|----------|
| `persistentHash` | Yes | Yes — same input = same output | Public key derivation, answer checking, any case where linkability is acceptable |
| `persistentCommit` | No | No — randomness makes each output unique | Credential sets, anonymous registrations, any case where correlation is a privacy leak |

For the answer-checking contracts, `persistentHash` is correct — you WANT the learner's hash to match the stored hash. For credential systems (Module 105), you'll use `persistentCommit` to prevent cross-system correlation.

---

## Compile and Deploy

From the project directory:

```bash
npm run compile    # Compile Compact → ZK circuits + prover/verifier keys
npm run deploy     # Deploy to preprod (interactive — sets answer key)
npm run cli        # Submit answers, read state
```

The compile step produces artifacts in `contracts/managed/`:
- `contract/index.js` — compiled contract, importable from TypeScript
- `keys/*.prover` / `keys/*.verifier` — per-circuit proving and verification keys
- `zkir/*.zkir` / `zkir/*.bzkir` — zero-knowledge intermediate representation

Each circuit gets its own prover and verifier key pair. `setAnswerKey` and `submitAnswer` each have separate keys because they're separate ZK circuits.

---

## Reading State from Outside

After deploying and submitting an answer, query the public state via the indexer:

```bash
curl -s -X POST https://indexer.preprod.midnight.network/api/v3/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ contractAction(address: \"YOUR_CONTRACT_ADDRESS\") { state } }"}'
```

**Public contract:** The response contains the answer key hash, the last answer (in hex), the boolean result, and the submission count.

**Private contract:** The response contains the answer key hash, the boolean result, and the submission count. No answer field. The data doesn't exist on-chain because it was never disclosed.

This is the concrete, verifiable proof that `disclose()` controls the boundary. Not "trust us, it's private." Query it yourself. The data isn't there.

---

## Questions to Consider

- Both contracts disclose the boolean result (`lastCorrect`). What if you didn't even want to reveal pass/fail? Could you design a contract where the only public state is "a valid submission was made" — with no result disclosed?
- The `Counter` type is concurrent-safe but also public. If `submissions` reveals how many attempts someone made, is that a privacy leak? How would you count submissions privately?
- The instructor's answer key is hash-protected in both contracts. But `persistentHash` is deterministic — the same answer always produces the same hash. If the answer space is small (e.g., "yes"/"no"), an observer could brute-force the hash. How would you defend against this?

---

## What's Next

Lesson 103.2 (already covered) connected this to the client-side/server-side mental model. Lesson 103.3 will implement the TypeScript side — witness functions that provide private data from outside the circuit.

---

## Things to Try

Write a Compact contract for a simple poll:
- An instructor sets a question (disclosed) and a list of valid options (disclosed as hashes)
- A voter submits their choice (private — not disclosed)
- The contract tallies votes per option (disclosed as counts)
- An observer can see the tally but not who voted for what

Decide:
- Which fields are `export ledger`?
- Which values get `disclose()`?
- What stays private inside the circuit?
- How do you prevent someone from voting twice? (Hint: you'll need a mechanism from Module 104)
