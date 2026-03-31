# Lesson 1.1: Two VMs, Two Philosophies

## Starting Point

You know the Cardano execution model. A transaction carries a script, the Plutus VM evaluates it, and if the script succeeds the transaction is valid. Scripts are pure functions — they can't modify state, they can only approve or reject a spend. The eUTxO model means every input is consumed and every output is created fresh. No mutable state. No side effects.

Midnight makes different choices. Understanding where they diverge — and why — tells you what kinds of applications each chain is built for.

---

## The Plutus VM (Cardano)

Cardano's Plutus VM is a CEK machine that evaluates lambda calculus. It's Turing-complete. Scripts receive a datum, a redeemer, and a script context, then return True or False. Nothing else.

Key properties:

- **Pure validation.** Scripts don't modify state. They decide whether a transaction is allowed.
- **eUTxO model.** Every piece of state is a UTxO. To change state, you consume a UTxO and create a new one.
- **Deterministic.** You can predict whether a transaction will succeed before submitting it.
- **ExUnits budget.** CPU and memory limits are declared upfront and enforced during execution.
- **Local reasoning.** A script only sees the transaction that invoked it. It can't read other contracts.

If you've written Aiken validators, you've worked within these constraints. You decompose your logic into validators that approve or reject datum transitions, and you structure your state as UTxOs that get consumed and recreated.

---

## The Impact VM (Midnight)

Midnight's Impact VM is a stack-based machine. It's explicitly non-Turing-complete — programs execute linearly with no backward jumps. Every program terminates.

Key properties:

- **State mutation.** Contracts have persistent state that is read and written directly. No UTxO recreation.
- **Hybrid model.** Tokens use a UTXO-like commitment/nullifier scheme (ZSwap). Contract state uses an account model.
- **Stack-based execution.** Programs manipulate a stack of context, effects, and contract state.
- **Gas-bounded.** A declared gas bound determines fees and caps execution cost.
- **Effects system.** Transactions declare their effects upfront: nullifier claims, coin spends, contract calls. The VM verifies that the program produces exactly those effects.

The non-Turing-complete design is a deliberate tradeoff. Midnight generates zero-knowledge proofs for every transaction. Bounded execution means every proof terminates and every verification cost is predictable.

---

## Side by Side

| Aspect | Cardano (Plutus VM) | Midnight (Impact VM) |
|--------|--------------------|--------------------|
| **Computation model** | Lambda calculus (CEK machine) | Stack-based, linear execution |
| **Turing complete** | Yes | No |
| **State model** | eUTxO — consume and recreate | Hybrid — UTXO for tokens, account for contracts |
| **What scripts do** | Validate: approve or reject a spend | Execute: read state, compute, write state |
| **State mutation** | Never — scripts are pure | Direct — contracts read/write ledger fields |
| **Cost model** | ExUnits (CPU + memory) declared upfront | Gas bound declared upfront |
| **Termination** | Guaranteed by ExUnits budget | Guaranteed by design (no backward jumps) |
| **Privacy** | All data public | ZK proofs — private data never leaves user's machine |
| **Block time** | ~20 seconds | ~6 seconds |

---

## What This Means in Practice

The biggest shift is from validation to execution.

On Cardano, your Aiken validator is a gatekeeper. It inspects a proposed state transition and says yes or no. The transaction builder (off-chain code) is responsible for constructing the new state. The validator just checks it.

On Midnight, your Compact circuit is the computation itself. It reads the current contract state, performs logic, and writes the new state. There's no separate off-chain builder constructing the next state — the circuit does it. The ZK proof guarantees the computation was correct without revealing the private inputs.

This changes how you think about contract design:

- **Aiken:** You think about what transitions are valid. "Can this UTxO be spent under these conditions?"
- **Compact:** You think about what the contract does. "Given this input, update the ledger state."

The Impact VM's five fundamental value types — Null, Field-aligned binary cells, Maps, Arrays (up to 16 elements), and Merkle Trees (depth 1-32) — reflect this execution-first design. These aren't types for a type checker. They're the values that live on the stack during program execution.

---

## Why Non-Turing-Complete?

This is the question that surprises most Cardano developers, since Plutus is Turing-complete.

Midnight generates a zero-knowledge proof for every transaction. The proof says: "this computation was performed correctly on these private inputs." For that proof to be sound, the computation must be bounded. Unbounded loops would mean unbounded proof generation time and unbounded verification cost.

By making Impact non-Turing-complete — no backward jumps, linear execution only — every program's cost is known before it runs. The proof system can guarantee termination. This is why the 35+ opcodes include `jmp` (forward jump) and `branch` (conditional forward jump) but nothing that creates a loop.

The tradeoff: you can't express arbitrary recursion. In practice, this means you decompose recursive logic into bounded iterations or handle it in the witness layer (TypeScript), where the proof system doesn't need to verify every step.

---

## Questions to consider:

- If Impact VM contracts mutate state directly, what happens to the concurrency advantages of the eUTxO model? How might Midnight handle multiple users calling the same contract?
- Cardano's determinism lets you know a transaction will succeed before submitting it. Does Midnight's model preserve that property, or does direct state mutation introduce new failure modes?
- ZK proofs guarantee computation correctness without revealing inputs. What does this change about the trust model between a contract and its users compared to Cardano's public validation?

---

## What's Next

Lesson 1.2 examines how Midnight's dual-ledger system draws the boundary between public and private data.

---

## Assignment

A colleague building on Cardano asks: "If Midnight's VM isn't Turing-complete, doesn't that make it less capable than Plutus?"

Write a response that addresses:
- Why Midnight chose non-Turing-completeness and what it enables
- How the validation-vs-execution difference changes what contracts can do
- One scenario where Midnight's model handles something that would be difficult on Cardano, and one where Cardano's eUTxO model has an advantage
