# Module Assignment

## Task

Explain the Midnight partner chain model and its technical differences from Cardano to a fellow Aiken developer. Your explanation should demonstrate understanding of the execution model differences, the dual-ledger privacy system, and the structural relationship between the two chains.

## Deliverables

1. A written comparison of Midnight's Impact VM and Cardano's Plutus VM that addresses: why Midnight chose non-Turing-completeness, how validation-vs-execution changes what contracts can do, and one scenario where each model has an advantage
2. A data layout for a simple reputation system on Midnight specifying which data belongs on the public ledger, in a MerkleTree, or as private witness data, with justification for each choice
3. An explanation of the partner chain model that covers: why Midnight is not a sidechain, what is shared between the two chains (wallet, validator set, token economics) and what is not (VM, language, consensus), and how the two chains complement each other

## Notes

**Estimated time:** 60-90 minutes

**Key concepts to address:** Impact VM vs Plutus VM, eUTxO vs hybrid state model, disclose() and the public/private boundary, Native Token Observation Pallet, partner chain vs sidechain vs L2
