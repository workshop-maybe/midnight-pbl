# Impact VM and Execution Model (Fetched 2026-03-23)

Source: docs.midnight.network/concepts/how-midnight-works/impact

## Core Execution Architecture

Impact VM is Midnight's **stack-based, non-Turing-complete state manipulation language** for on-chain program execution. It operates on a three-component stack: context object, effects object, and contract state.

### Key Characteristics

**Execution Model:**
- Program execution proceeds linearly with no backward jumps
- Every operation is bounded in execution time
- Programs either abort (invalidating transactions) or succeed
- Final stack shape must match initial shape
- Results must match declared effects; state must be storable

**Non-Turing Completeness:**
Ensures termination guarantees and cost predictability. Contrasts with Plutus VM's Turing-complete approach on Cardano.

## State Values and Data Types

Five fundamental value types:

1. **Null** — empty values
2. **Field-aligned binary cells** (`<x: y>`) — basic binary data
3. **Maps** — key-value structures from FAB values to state values
4. **Arrays** (0 < n < 16 elements) — fixed-size collections
5. **Merkle Trees** (depth 1-32) — sparse, cryptographic data structures

**Field-Aligned Binary (FAB):** Foundational data type using alignment atoms:
- `f` (field alignment)
- `c` (compression alignment via hashing)
- `b_n_` (n-byte alignment for compact field encoding)

## Transaction Processing and Effects

**Execution Transcripts contain:**
- Declared gas bound (derives fees)
- Declared effects object (binds contract semantics)
- Program to execute

**Effects Array** (initialized as `[{}, {}, {}, {}, {}]`):
1. Nullifier claims
2. Received coin claims
3. Spent coin claims
4. Contract call claims
5. Minted coins by specialization hash

**Context Array** (partially initialized):
1. Current contract address (256-bit)
2. Newly allocated coin mappings
3. Block timestamp (64-bit UNIX seconds)
4. Timestamp tolerance bound (32-bit)
5. Block hash (256-bit)

## Opcode Set

35+ operations across categories:

| Category | Examples |
|----------|----------|
| **Logic** | `eq`, `lt`, `and`, `or`, `neg` |
| **Stack** | `dup`, `swap`, `pop` |
| **Arithmetic** | `add`, `sub`, `addi`, `subi` |
| **Data** | `push`, `pushs`, `type`, `size`, `new` |
| **Indexing** | `idx`, `idxc`, `idxp`, `idxpc` |
| **Mutation** | `ins`, `insc`, `rem`, `remc` |
| **Control** | `jmp`, `branch`, `ckpt` |
| **I/O** | `log` (events), `root` (Merkle roots) |

Each operation specifies stack effects, arguments, unscaled cost, and execution semantics.

## Hybrid UTXO+Account Model

Midnight combines both models:
- **UTXO elements:** Coin commitments, nullifiers, spent/received coin tracking
- **Account elements:** Contract state, address-based context, balance tracking
- **Specialized hashing:** CoinCommitment-indexed Merkle trees for coin allocation

## Smart Contract Execution

Contracts are written in Compact (not manually in Impact). The execution flow:

1. Contract receives input via context/effects
2. Program executes linearly against stack with cost tracking
3. Operations modify state immutably (values replaced, never mutated)
4. Gas bounds enforce cost limits
5. Final state marked storable becomes the new contract state
6. Weak values (in-memory only) cannot contaminate persistent state

**Note:** Impact is still under active revision. Expect attributes, including storage-related costs, to change.

## Comparison to Cardano's Plutus VM

| Aspect | Impact VM (Midnight) | Plutus VM (Cardano) |
|--------|---------------------|-------------------|
| Turing completeness | No | Yes |
| Execution model | Stack-based, linear | Lambda calculus |
| State model | Hybrid UTXO+account | Pure eUTxO |
| Termination | Guaranteed | Cost-bounded |
| Privacy | ZK-proof integration | Public |
| Gas/fees | Declared gas bound | ExUnits budget |
