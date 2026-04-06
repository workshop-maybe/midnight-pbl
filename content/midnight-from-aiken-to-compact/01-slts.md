# SLTs: Building on Midnight — From Aiken to Compact

## Module 1: Midnight Architecture for Cardano Developers

- 1.1: I can compare Midnight's execution model to Cardano's eUTxO model.
- 1.2: I can describe the dual-ledger system and when data lives on the public ledger versus the private ledger.
- 1.3: I can explain how Midnight relates to Cardano as a partner chain.

## Module 2: Compact Language Fundamentals

- 2.1: I can describe the core components of a Compact contract.
- 2.2: I can compare Aiken concepts to their Compact equivalents.
- 2.3: I can write a Compact contract that declares ledger state and exposes a circuit to modify it.

## Module 3: The Privacy Model — Proving Without Revealing

- 3.1: I can explain how Compact's disclose() primitive controls what becomes public versus what stays private.
- 3.2: I can describe how a ZK proof is generated from a Compact circuit and verified on-chain by the Impact VM.
- 3.3: I can implement a witness function in TypeScript that provides private data to a Compact circuit.

## Module 4: Developer Workflow — Compile, Prove, Deploy

- 4.1: I can install the Compact toolchain and run the proof server locally via Docker.
- 4.2: I can compile a Compact contract and identify its output artifacts.
- 4.3: I can deploy a contract to the Midnight preprod testnet and interact with it via the TypeScript SDK.

## Module 5: Building Credential Systems on Midnight

- 5.1: I can design a Compact contract that verifies a signed credential without revealing its attributes.
- 5.2: I can use MerkleTree commitments and nullifiers to prove credential membership without exposing which credential.
- 5.3: I can implement selective disclosure — proving a specific claim about a credential holder without revealing their identity.

## Module 6: Dual-Chain Architecture — Cardano + Midnight (Optional)

- 6.1: I can design an architecture where public credential verification runs on Cardano and private attribute proofs run on Midnight.
- 6.2: I can describe the current interoperability constraints between Cardano and Midnight.
- 6.3: I can evaluate when a use case requires Midnight's privacy features versus when Cardano's public verification is sufficient.
