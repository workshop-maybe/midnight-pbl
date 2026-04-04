# Lesson 102.3: Midnight's Relationship to Cardano

**SLT:** I can describe Midnight's relationship to Cardano as a partner chain.

**Type:** Exploration

---

## What Midnight Is Not

You've probably heard Midnight described as a sidechain, a layer 2, or "Cardano's privacy chain." None of these are right.

- **Not a sidechain.** A sidechain inherits its parent chain's consensus and typically uses the same execution model. Midnight uses neither Ouroboros consensus nor the Plutus VM.
- **Not a Layer 2.** Layer 2 solutions settle transactions back to a base layer for finality. Midnight has its own finality.
- **Not a fork of Cardano.** Midnight isn't built on the Cardano node. It's built on the Polkadot SDK (Substrate), compiled to WebAssembly.

Midnight is a **partner chain** — an independent blockchain with structural connections to Cardano. It has its own consensus (AURA for block production, GRANDPA for finality), its own ledger, its own VM (Impact), and its own smart contract language (Compact). But it draws on Cardano for two things: validator selection and token economics.

---

## What's Shared

### 1. Validator Selection

Midnight selects block producers from Cardano's stake pool operator set. SPOs who opt in can validate blocks on both chains using the same infrastructure and stake. Over 180 SPOs participated in Testnet-02.

The network launched with trusted nodes operated by Shielded (the organization behind Midnight), plus community-registered SPO nodes. A parameter called 'D' — analogous to Cardano's decentralization parameter — controls the balance between permissioned and community validators. In the Kukolu phase (federated mainnet), this starts centralized and shifts outward.

This means Midnight's security inherits from Cardano's existing stake distribution — one of the largest and most distributed proof-of-stake validator sets in operation. SPOs don't need to choose between chains. They can secure both.

### 2. Token Economics

Midnight's economic link to Cardano works through the **Native Token Observation Pallet**. This component watches the Cardano ledger for movements of cNIGHT tokens. When cNIGHT moves on Cardano, corresponding DUST creation or destruction events fire on Midnight.

DUST is Midnight's gas token — you need it to pay for transactions and proof verification. The observation link means Midnight's economic activity is anchored to a Cardano-native asset. NIGHT (on Midnight, fixed supply of 24 billion) is the store of value and governance token. DUST is shielded, non-transferable, and decays — it's generated from staked NIGHT and consumed by transactions.

### 3. Wallet Infrastructure

The Lace wallet supports both networks. Same wallet, separate chains. A developer or user interacts with Cardano and Midnight through a single interface. This is operational convenience, not a protocol-level connection — but it matters for UX and adoption.

---

## What's Not Shared

| Aspect | Cardano | Midnight |
|--------|---------|----------|
| **VM** | Plutus VM (CEK machine, Turing-complete) | Impact VM (stack-based, non-Turing-complete) |
| **Smart contract language** | Plutus / Aiken / Opshin | Compact |
| **Execution model** | EUTXO (consume and recreate) | Hybrid (UTXO for tokens, account for contracts) |
| **Consensus** | Ouroboros Praos | AURA + GRANDPA (Substrate-based) |
| **Block time** | ~20 seconds | ~6 seconds |
| **State visibility** | All public | `disclose()` controls public/private boundary |
| **Proof system** | None (deterministic execution) | ZK proofs (Halo 2 on BLS12-381) for every tx |
| **Infrastructure** | Cardano node (Haskell) | Substrate node (Rust/WebAssembly) |

The bottom line: your smart contract code does not port. Validators written in Aiken, Plutus, or Opshin will not run on Midnight. The VM, the state model, and the compilation target are all different. Modules 103-104 cover what changes and what translates at the language level.

---

## The One-Way Bridge

This is the architectural fact that shapes everything about dual-chain design:

**Midnight reads Cardano. Cardano does not read Midnight.**

The Native Token Observation Pallet watches Cardano state. It can verify that cNIGHT moved, that a UTXO exists, that a token was minted. This is a one-way observation — Midnight as a reader of Cardano's public ledger.

There is no general-purpose mechanism for Cardano contracts to verify Midnight state. A Plutus validator cannot check whether a ZK proof was verified on Midnight, whether a contract state changed, or whether a nullifier was spent.

Building the reverse direction would require one of:
- **Oracle attestation** — a trusted service that watches Midnight and posts claims on Cardano
- **ZK proof verification in Plutus** — Cardano verifying Midnight's Halo 2 proofs natively (BLS primitives are being added, but full SNARK verification is not yet available)
- **SPO cross-attestation** — validators running both chains signing cross-chain state claims

Module 106 explores what this means for dual-chain architecture in detail. For now, the practical implication: anything that starts on Midnight and needs to be recognized on Cardano requires an intermediary. Anything that starts on Cardano can be observed directly by Midnight.

---

## Who Builds Midnight

Midnight is developed by **Shielded**, a separate entity from IOG (Input Output Global). The foundational research — the Kachina protocol (IEEE CSF 2021) and the ZSwap protocol — was produced by IOG researchers. Charles Hoskinson first announced Midnight at the Cardano Summit in November 2022. But Shielded operates the network, developer tools, and documentation independently.

The Compact compiler, the proof server, the SDK, the `create-mn-app` scaffolder, the documentation at docs.midnight.network — these are Shielded products, maintained on Shielded's release cadence.

---

## Where Midnight Is Now

Midnight is pre-mainnet. The roadmap has four phases:

| Phase | Name | What Happens |
|-------|------|-------------|
| 1 | **Hilo** | Token Genesis — cNIGHT distribution begins |
| 2 | **Kukolu** | Federated Mainnet — core team + selected validators |
| 3 | **Mohalu** | Incentivized Mainnet — SPO onboarding, community validation |
| 4 | **Hua** | Full Decentralization — community-governed |

The team is approaching Kukolu. A preprod testnet is maintained for development. Governance is currently centralized via a sudo key, with decentralization planned for later phases.

For developers: you can build and deploy on preprod today, but expect breaking changes between releases. The Compact compiler is at version 0.30.0, the CLI at 0.5.0, the SDK at 3.0.0. Version pinning matters — a scaffolded project that works with one version combo may break with the next.

---

## Why This Matters for Cardano Developers

Three implications of the partner chain model:

1. **Your Cardano skills are still valuable.** The public credential layer, the validator set, and the economic anchor all live on Cardano. Midnight adds a privacy layer alongside — it doesn't replace what you've built.

2. **You need a new language, not just a new framework.** Compact is not Aiken with privacy bolted on. It's a different language for a different VM with a different execution model. The concepts translate — validators become circuits, datums become ledger fields, redeemers become witnesses — but the code does not.

3. **The two chains are complementary, not competitive.** Cardano handles what should be public and verifiable. Midnight handles what should be private but provable. The partner chain model makes this complementarity structural, not incidental — shared validators, linked economics, common wallet.

---

## Questions to Consider

- Midnight selects validators from Cardano SPOs. What happens to Midnight's liveness if a significant fraction of selected validators go offline? Does Midnight inherit Cardano's liveness guarantees, or does it need its own?
- The Native Token Observation Pallet is one-way — Midnight reads Cardano. What would it take to build the reverse? How do the trust assumptions change when you need Cardano to trust claims about Midnight state?
- Midnight is built on the Polkadot SDK but is not a Polkadot parachain. What does it gain from Substrate — and what does it give up by not joining the Polkadot relay chain?

---

## What's Next

Module 102 has covered Midnight's architecture from three angles: the dual-state model (102.1), the concurrency protocol (102.2), and the partner chain relationship (102.3). Module 103 introduces the language you'll write in — Compact — starting with `disclose()` and the privacy boundary.

---

## Conversation Starters

A fellow Cardano developer says: "Midnight is just a Cardano sidechain with privacy features."

Write a correction that covers:
- Why the sidechain label is wrong (different consensus, different VM, different infrastructure)
- What IS shared between the two chains (validators, economics, wallet)
- Why your Aiken/Plutus code won't run on Midnight
- Why the partner chain model is stronger than "just privacy" — it's complementary architecture
