# Lesson 1.3: Midnight's Relationship to Cardano

## What Midnight Is Not

If you've been building on Cardano, you've probably heard Midnight described as a sidechain, a layer 2, or "Cardano's privacy chain." None of these are quite right.

- **Not a sidechain.** A sidechain inherits its parent chain's consensus and typically uses the same execution model. Midnight does neither.
- **Not a Layer 2.** Layer 2 solutions settle transactions back to a base layer for finality. Midnight has its own finality.
- **Not a fork of Cardano.** Midnight isn't built on the Cardano node. It's built on the Polkadot SDK (Substrate).

Midnight is a **partner chain** — an independent blockchain with a structural relationship to Cardano. It has its own consensus, its own ledger, its own VM, and its own smart contract language. But it draws on Cardano for validator selection and token economics.

---

## What's Shared, What's Not

This is the part that matters most for Aiken developers.

| Aspect | Shared? | Details |
|--------|---------|---------|
| **Wallet** | Yes | Lace wallet supports both networks. Same wallet, separate chains. |
| **Validator set** | Partially | Midnight selects validators from Cardano SPOs. 180+ participated in Testnet-02. |
| **Token economics** | Linked | cNIGHT tokens on Cardano map to DUST generation capacity on Midnight via the Native Token Observation Pallet. |
| **VM** | No | Cardano runs the Plutus VM (CEK machine). Midnight runs the Impact VM (stack-based, non-Turing-complete). |
| **Smart contract language** | No | Cardano uses Plutus/Aiken. Midnight uses Compact. |
| **Execution model** | No | Cardano uses eUTxO. Midnight uses a hybrid: UTXO for tokens, account-based for contract state. |
| **Consensus** | No | Cardano uses Ouroboros. Midnight uses Substrate-based consensus (AURA for block production, GRANDPA for finality). |
| **Block time** | No | Cardano: 20 seconds. Midnight: 6 seconds. |

The bottom line: if you've written Aiken validators, you know the Cardano side. But your Aiken code will not run on Midnight. The VM, the state model, and the compilation target are all different. Module 2 will cover what changes and what translates.

---

## The Partner Chain Model

The term "partner chain" describes a specific kind of relationship. Midnight is independent — it runs its own consensus and finalizes its own transactions — but it has two structural connections to Cardano:

### 1. Validator Selection

Midnight doesn't build its own validator set from scratch. Instead, it observes Cardano to determine which stake pool operators are eligible to produce blocks on Midnight. This means Cardano SPOs can opt in to also validate Midnight blocks, using the same infrastructure and stake that secures Cardano.

The network launched with 12 trusted nodes operated by Shielded (the organization behind Midnight), plus community-registered SPO nodes. A parameter called 'D' — similar to Cardano's own decentralization parameter — controls the balance between permissioned validators and community nodes.

### 2. Token Economics

Midnight's economic link to Cardano works through the **Native Token Observation Pallet**. This component watches Cardano for movements of cNIGHT tokens. When cNIGHT moves on Cardano, corresponding DUST creation or destruction events fire on Midnight's ledger.

DUST is Midnight's gas token — you need it to pay for transactions and proof verification. The 1:1 observation link means Midnight's economic activity is anchored to a Cardano-native asset.

This is a one-way observation: Midnight reads Cardano state. There is no general-purpose mechanism for Cardano contracts to read Midnight state. (Module 6 will cover what this means for dual-chain architectures.)

---

## Who Builds Midnight

Midnight is developed by **Shielded**, a separate entity from IOG (Input Output Global). The foundational research — the Kachina protocol (published at IEEE CSF 2021) and the ZSwap protocol — was produced by IOG researchers, and Charles Hoskinson first announced Midnight at the Cardano Summit in November 2022. But Shielded operates the network, the developer tools, and the documentation independently.

---

## Where Midnight Is Now

Midnight is pre-mainnet. The roadmap has four phases, named in Hawaiian:

| Phase | Name | What Happens |
|-------|------|-------------|
| 1 | **Hilo** | Token Genesis — cNIGHT distribution begins |
| 2 | **Kukolu** | Federated Mainnet — core team + selected validators |
| 3 | **Mōhalu** | Incentivized Mainnet — SPO onboarding, community validation |
| 4 | **Hua** | Full Decentralization — community-governed |

As of March 2026, Testnet-02 has ended and the team is approaching the Kukolu phase. A preprod testnet is maintained for active development. Governance is currently centralized via a sudo key, with decentralization planned for later phases.

For developers, this means: you can build and deploy on preprod today, but expect breaking changes between releases. The Compact compiler is at version 0.30.0, with the CLI at version 0.5.0.

---

## Why This Matters for Aiken Developers

Understanding the partner chain model tells you three things:

1. **Your Cardano skills are still valuable.** The public credential layer, the validator set, and the economic anchor all live on Cardano. Midnight adds a privacy layer on top — it doesn't replace what you've built.

2. **You need a new language, not just a new framework.** Compact is not Aiken with privacy features bolted on. It's a different language for a different VM with a different execution model. The concepts translate (Module 2 will show you how), but the code does not.

3. **The two chains are complementary, not competitive.** Cardano handles what should be public and verifiable. Midnight handles what should be private but provable. A credential system that uses both — public registry on Cardano, private attributes on Midnight — is stronger than either chain alone.

---

## Questions to consider:

- Midnight selects validators from Cardano SPOs. What happens if the majority of selected validators go offline? Does Midnight inherit Cardano's liveness properties or does it have its own?
- The Native Token Observation Pallet is a one-way bridge — Midnight reads Cardano. What would it take to build the reverse direction? What trust assumptions would change?
- Midnight is built on the Polkadot SDK (Substrate) but is not a Polkadot parachain. What does it gain from Substrate without joining the Polkadot ecosystem?

---

## What's Next

Lesson 1.1 and 1.2 covered the technical differences — execution models and the dual-ledger system. Now that you understand the structural relationship, Module 2 introduces the language you'll use to build on Midnight: Compact.

---

## Conversation Starters

Explain the Midnight partner chain model to a fellow Aiken developer who assumes Midnight is "just a Cardano sidechain." In your explanation, address:

- Why it's not a sidechain
- What is shared between the two chains and what is not
- Why an Aiken validator won't run on Midnight
- How the two chains can be used together
