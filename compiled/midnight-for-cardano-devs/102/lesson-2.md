# Lesson 102.2: How Kachina Transcripts Handle Concurrency

**SLT:** I can explain how Kachina transcripts handle concurrent state updates.

**Type:** Exploration

---

## The Problem Midnight Has to Solve

Lesson 102.1 showed that Midnight's contract state mutates in place. A circuit reads a field, computes, writes it back. This is the account model — and the account model has a concurrency problem.

On Cardano, two users can spend different UTXOs at the same time. No conflict. Each UTXO is independent state. But on Midnight, two users calling the same contract are both trying to read and write the same ledger fields. If Alice reads `counter = 5` and Bob reads `counter = 5` at the same time, both compute `counter = 6`, and both submit — one of them is wrong. The state should be 7, not 6.

Cardano's EUTXO model avoids this by design. Every state change creates a new UTXO. Two transactions that consume the same UTXO can't both succeed — the ledger rejects the second one, and the builder retries with the new state. Clean, but it creates contention at popular script addresses.

Midnight chose an account model for contract state because it needed mutable fields for privacy-preserving computation. The tradeoff: concurrency doesn't come for free. Kachina is how Midnight gets it back.

---

## Transcripts, Not Transactions

The Kachina protocol, published at IEEE CSF 2021, introduces a key idea: **don't apply state changes immediately. Record them as a transcript and apply them later.**

When you call a circuit on Midnight, the execution happens on your machine. The contract reads its current state, your circuit runs, and the result is a transcript — a record of what was read, what was computed, and what should change. Nothing actually changes yet.

Two transcripts are produced:

1. **Public transcript** — records the effects visible on-chain: which ledger fields change, what values are disclosed, which tokens move. This goes into the transaction.
2. **Private transcript** — records the private inputs (witness data) and intermediate computations. This stays on your machine, protected by the ZK proof.

The transaction you submit contains the public transcript plus a ZK proof that the transcript was honestly computed from valid inputs. The private transcript never leaves your machine.

---

## The Terraform Analogy

If you've used Terraform, you already know this pattern:

| Step | Terraform | Kachina |
|------|-----------|---------|
| **1. Plan** | `terraform plan` — reads current state, computes desired changes, outputs a plan | Circuit executes locally — reads contract state, computes, produces a transcript |
| **2. Review** | You review the plan diff | The ZK proof guarantees the transcript is honest |
| **3. Apply** | `terraform apply` — state changes execute | Block producer orders transcripts and applies them to the ledger |
| **Conflict** | Two plans that touch the same resource — one fails on apply | Two transcripts that touch the same field — one may be rejected |

The key insight: **computation happens at plan time, not at apply time.** The block producer doesn't re-execute your circuit. It verifies your proof and applies your transcript. This is why proving is expensive (tens of seconds on your machine) and verification is cheap (milliseconds on the network).

---

## How Concurrent Transcripts Merge

When multiple users call the same contract around the same time, the block producer receives multiple transcripts. Here's what happens:

1. **Ordering.** The block producer chooses an order for the transcripts in the block. This order determines the final state.

2. **Sequential application.** Transcripts are applied one at a time against the evolving state. The first transcript applies cleanly. The second transcript may or may not conflict — it depends on whether it touches state that the first transcript changed.

3. **Conflict detection.** If a transcript's reads are inconsistent with the state after applying prior transcripts, it fails. The fallible phase of the transaction doesn't execute. The guaranteed phase (fees) still applies.

This is optimistic concurrency. You compute your transcript against the state you see right now, submit it, and hope nobody else changes the same state before yours applies. If they do, your transaction's fallible phase fails and you try again.

---

## What This Means for Developers

### Concurrency Is Possible, Not Automatic

On Cardano, parallelism is structural — different UTXOs, no conflict. On Midnight, parallelism depends on what state your circuit touches.

- **Two users posting to a bulletin board** — likely succeeds for both. Each `post` inserts a new entry. Insertions don't conflict with each other.
- **Two users updating the same counter** — one succeeds, one fails. Both read the same value, both write back an increment. The second one's read is stale.
- **Two users interacting with different fields** — succeeds for both. No overlapping state.

### Design for Non-Overlapping State

The lesson for contract design: structure your ledger state to minimize conflicts.

- Use `Map` types where each user writes to their own key — parallel by default
- Use `Counter` types that support commutative updates (increment doesn't depend on current value)
- Avoid patterns where every transaction must read and write the same field

This is the same intuition Cardano developers use when designing multi-UTXO patterns to reduce contention at a single script address. The mechanism is different, but the design principle is the same: **partition your state so concurrent users don't collide.**

### The Guaranteed/Fallible Split

Unlike Cardano where a transaction either fully succeeds or is rejected entirely, Midnight transactions have two phases:

- **Guaranteed phase** — fee payments and must-succeed operations. Always applies.
- **Fallible phase** — your contract logic. May fail if state has changed since you computed your transcript.

If the fallible phase fails, you still pay fees. This is closer to Ethereum's gas model than Cardano's all-or-nothing model. Design accordingly: don't assume your transaction will succeed just because it was valid when you computed it.

---

## UC Security — Why This Isn't Just Optimistic Locking

Optimistic concurrency is a common database pattern. What makes Kachina different is its security guarantee.

The Universal Composability (UC) framework proves that Kachina's protocol behaves identically to an ideal system where a perfectly trusted party manages the state — no matter what else is running concurrently on the network.

For developers, this means:

- **Privacy survives concurrency.** Two conflicting transcripts don't leak information about each other's private inputs. Even when your transcript fails, the only public information is "the fallible phase failed" — not why, not what your inputs were.
- **Composition is safe.** A contract proven secure under Kachina stays secure when deployed alongside thousands of other contracts. The UC composition theorem guarantees this.
- **The adversary gets nothing useful from failures.** An attacker who deliberately causes your transaction to fail (by front-running with their own transcript) learns nothing about your private state.

You don't need to understand the proof. But you should know the guarantee exists, because it's what makes Midnight's privacy claims meaningful under real-world conditions — not just in isolation.

---

## Kachina vs EUTXO: The Tradeoff Summary

| Dimension | EUTXO (Cardano) | Kachina (Midnight) |
|-----------|------------------|--------------------|
| **Concurrency model** | Structural — different UTXOs, no conflict | Optimistic — compute locally, apply in order |
| **Failure mode** | Transaction rejected entirely (retry with new state) | Fallible phase fails, fees still paid |
| **When conflicts happen** | Two txs consuming the same UTXO | Two transcripts writing the same field |
| **Developer strategy** | Multi-UTXO patterns to reduce contention | Partitioned state (Maps, per-user keys) |
| **Privacy on failure** | N/A — all data public | Private inputs protected even on failure |
| **Computation location** | On-chain (validator runs during validation) | Local (your machine, then proof verified) |
| **Formal guarantee** | Determinism via EUTXO model | UC security via Kachina protocol |

---

## Questions to Consider

- On Cardano, if your transaction fails due to a consumed UTXO, your transaction builder retries automatically. On Midnight, if your transcript fails, you've already paid fees. How does this change how you handle retries? What UX patterns would you build to handle this gracefully?
- Kachina guarantees privacy survives concurrent failures. Imagine an attacker repeatedly submitting conflicting transcripts to make your transactions fail. They learn nothing about your private state — but they can still grief you into paying fees. How would you defend against this?
- The `Counter` type in Compact supports commutative increments — multiple concurrent increments all succeed because order doesn't matter. What other ledger field patterns could be designed for conflict-free concurrent updates?

---

## What's Next

Lesson 102.3 zooms out from Midnight's internal architecture to explain its relationship to Cardano as a partner chain — what's shared, what's separate, and what that means for developers building on both.

---

## Conversation Starters

Your team is designing a voting contract on Midnight. Requirements:
- Users can vote once
- Vote choices must be private
- The tally must be publicly verifiable
- 10,000 users might vote within the same block window

Using what you know about Kachina transcripts and concurrency, sketch the contract design:
- How do you structure the ledger state to allow 10,000 concurrent votes without transcript conflicts?
- What goes in the public transcript vs the private transcript for each vote?
- How does the tally update work — can you avoid making the tally field a bottleneck?
