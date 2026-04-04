# Lesson 102.1: Two State Models, One Goal

**SLT:** I can compare Midnight's dual-state model to Cardano's EUTXO model.

**Type:** Exploration

---

## One Model vs Two

On Cardano, you have one state model: EUTXO. Everything — tokens, datums, spending conditions — lives in UTXOs. To change state, you consume a UTXO and create a new one. The model is uniform. Whether you're transferring ADA, updating a datum on a script address, or minting a native asset, you're consuming and recreating UTXOs.

Midnight splits its state model in two.

**Tokens** use a UTXO-like model called ZSwap. Coins are commitments in a Merkle tree. To spend a coin, you reveal a nullifier that proves you own it (without revealing which commitment it corresponds to). New coins are new commitments. This is structurally similar to EUTXO — consume inputs, create outputs — but with a privacy layer built in.

**Contracts** use an account model. Each contract has persistent state fields that circuits read and write directly. There's no consume-and-recreate. A circuit runs, reads the current `value` field, computes a new value, and writes it back. The state mutates in place.

This is the first architectural choice that will feel unfamiliar. On Cardano, you never thought about which model to use — there was only one. On Midnight, the first question for every feature is: does this belong in the token layer (UTXO) or the contract layer (account)?

---

## The EUTXO Model (What You Know)

A quick inventory of what EUTXO gives you, so we can see what changes:

| Property | How EUTXO Achieves It |
|----------|----------------------|
| **Determinism** | A transaction either succeeds or fails — you know before submitting |
| **Concurrency** | Different UTXOs can be spent in parallel — no global state contention |
| **Local reasoning** | A validator only sees its own transaction, not the entire chain state |
| **Composability** | Multiple script UTXOs can be consumed in one transaction |
| **State** | Carried in datums, attached to UTXOs, recreated with each spend |

These properties are design achievements, not accidents. They come from the consume-and-recreate model. When you move to an account model for contract state, some of these properties change.

---

## Midnight's Contract State Model

A Compact contract declares its state as ledger fields:

```
export ledger messages: Map<Bytes<32>, Opaque<'string'>>;
export ledger round: Counter;
export ledger authority: Bytes<32>;
```

These fields persist between transactions. A circuit reads them, computes, and writes back:

```
export circuit post(content: Opaque<'string'>): [] {
  const sk = authorKey();
  const pk = publicKey(round, sk);
  messages.insert(disclose(pk), content);
  round.increment(1);
}
```

No datum recreation. No new UTXO. The `messages` map just grows. The `round` counter just increments. State mutates in place.

If you've worked with Ethereum smart contracts, this will look familiar. If you've only worked with Cardano, this is the biggest mental shift: **the contract owns its state and modifies it directly.**

---

## What Changes, What Stays

| Property | Cardano (EUTXO) | Midnight (Contracts) | Midnight (Tokens/ZSwap) |
|----------|-----------------|---------------------|------------------------|
| **Determinism** | Full — know outcome before submit | Partial — guaranteed phase always succeeds, fallible phase might not | Full — spend proofs are deterministic |
| **Concurrency** | Natural — parallel UTXO consumption | Needs Kachina transcripts (Lesson 102.2) | Natural — independent coin spends |
| **State location** | Datum on UTXO | Ledger fields on contract | Commitments in Merkle tree |
| **State update** | Consume old UTXO → create new | Read field → compute → write back | Nullify old commitment → create new |
| **Privacy** | None — all public | `disclose()` controls boundary | Shielded by default |
| **Composability** | Multiple scripts in one tx | One contract call per circuit execution | Multiple coin operations in one tx |

The token layer (ZSwap) preserves most EUTXO intuitions. The contract layer trades EUTXO's concurrency and determinism for direct state mutation and privacy.

---

## The Datum Gap

This is the comparison that matters most for developers building data-rich applications.

On Cardano, a UTXO carries a datum — structured data attached to value. The datum IS the application state. A credential, a vote record, a governance proposal — they're all datums sitting on script UTXOs. The spending validator enforces rules about how the datum can change.

On Midnight, contract state lives in ledger fields, not attached to individual tokens. There's no equivalent of "this token carries this data." Tokens are values in a Merkle tree. Contract state is fields on a contract address.

This changes how you think about design:

- **Cardano:** One UTXO per entity. A credential is a UTXO with a datum. To update the credential, consume the UTXO and create a new one with updated datum.
- **Midnight:** One contract per application. A credential is a record in a contract's state. To update, call a circuit that modifies the relevant field.

Neither is better. They're optimized for different things. EUTXO is optimized for parallel, independent state transitions. Account model is optimized for shared state with privacy.

---

## When the Hybrid Model Helps

Midnight's hybrid design means you pick the right model per feature:

**Use the token layer (ZSwap) when:**
- You need fungible or semi-fungible value transfer
- Privacy of balances and transfer history matters
- Parallel processing of independent transfers is important
- You want UTXO-style guarantees

**Use the contract layer when:**
- You need shared mutable state (a registry, a vote tally, a message board)
- Privacy of computation matters — inputs stay hidden, only results disclosed
- Your logic requires reading and writing multiple fields atomically
- You need programmable rules about what gets revealed

**The Cardano comparison:** On Cardano, everything goes through EUTXO whether it's a simple ADA transfer or a complex multi-step governance action. Midnight lets you choose. Simple value transfer? Token layer, UTXO-style. Complex stateful logic with privacy? Contract layer, account-style.

---

## Questions to Consider

- On Cardano, you can compose multiple script executions in a single transaction. On Midnight, contract calls are one-circuit-per-transaction. How does this change how you decompose a multi-step workflow?
- The datum-on-UTXO pattern lets you attach arbitrary data to value. Midnight separates tokens from contract state. What happens when you need a token that carries data — like a credential that represents both value and evidence?
- Midnight's token layer (ZSwap) is private by default. Cardano's UTXO layer is public by default. What does this mean for applications that need auditability?

---

## What's Next

Lesson 102.2 explains how Midnight solves the concurrency problem that account-based contract state introduces — using Kachina transcripts, a pattern that will feel familiar if you've ever used Terraform.

---

## Conversation Starters

You're designing a simple auction system. On Cardano, you'd put the auction state (current bid, bidder, deadline) in a datum on a script UTXO. Each bid consumes the UTXO and creates a new one with updated state.

Map this design to Midnight:
- Which parts belong in the contract layer (account model) and which in the token layer (ZSwap)?
- What state would you put in ledger fields? What would stay private via witnesses?
- Where does Midnight's model give you something Cardano's doesn't — and where does it take something away?
