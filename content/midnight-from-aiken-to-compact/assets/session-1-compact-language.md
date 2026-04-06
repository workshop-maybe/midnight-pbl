# Compact Language Reference (Fetched 2026-03-23)

Source: docs.midnight.network/compact/writing, /data-types/ledger-adt, /data-types/opaque_data

## Core Structure

A Compact contract begins with language version and imports:

```
pragma language_version 0.22;
import CompactStandardLibrary;
```

## Ledger Declarations

The ledger section defines on-chain state. Each field uses the `export ledger` keyword:

```
export ledger authority: Bytes<32>;
export ledger value: Uint<64>;
export ledger state: State;
export ledger round: Counter;
```

## Constructor

Initialize ledger fields upon deployment:

```
constructor(sk: Bytes<32>, v: Uint<64>) {
  authority = disclose(publicKey(round, sk));
  value = disclose(v);
  state = State.SET;
}
```

The `disclose()` primitive marks values for public visibility on the ledger.

## Circuit Definitions

Circuits are entry points callable by transactions. Export them to make them accessible:

```
export circuit get(): Uint<64> {
  assert(state == State.SET, "Attempted to get uninitialized value");
  return value;
}
```

Circuits support fixed computational bounds and can read/modify ledger state.

## Witness Functions

Witnesses retrieve confidential local data from the user's machine. Implementation occurs in TypeScript DApp code, not Compact:

```
witness secretKey(): Bytes<32>;
```

Results cannot be inherently trusted by the contract.

## State Mutation Example

```
export circuit set(v: Uint<64>): [] {
  assert(state == State.UNSET, "Attempted to set initialized value");
  const sk = secretKey();
  const pk = publicKey(round, sk);
  authority = disclose(pk);
  value = disclose(v);
  state = State.SET;
}
```

## Counter Operations

Increment counters to prevent linkability across rounds:

```
round.increment(1);
```

## Hash and Commitment Functions

Standard library provides:

```
circuit transientHash<T>(value: T): Field;
circuit transientCommit<T>(value: T, rand: Field): Field;
circuit persistentHash<T>(value: T): Bytes<32>;
circuit persistentCommit<T>(value: T, rand: Bytes<32>): Bytes<32>;
```

Use `persistent*` variants for ledger storage; `transient*` for temporary values.

## Confidentiality Model

All data not in a ledger field or circuit argument/return remains confidential. All computation outside witness functions is cryptographically enforced as correct.

Anything passed as an argument to a `ledger` operation, as well as all reads and writes of the ledger itself, are publicly visible. The exception is `MerkleTree` and `HistoricMerkleTree` data types, which provide shielding capabilities.

---

## Ledger Data Types

### Kernel
Built-in ADT for balance checks, block time validation, coin claims, and minting:
- `balance(token_type)` — returns current contract balance
- `balanceGreaterThan/balanceLessThan(token_type, amount)` — balance comparisons
- `blockTimeGreaterThan/blockTimeLessThan(time)` — temporal checks
- `mintShielded/mintUnshielded(domain_sep, amount)` — token creation
- `self()` — returns current contract address

### Cell<value_type>
A single Cell containing a value. Used implicitly when the ledger field type is an ordinary Compact type. Cannot write Cell explicitly in declarations.
- `read()` — retrieve current value
- `write(value)` — overwrite contents
- `writeCoin(coin, recipient)` — store shielded coin info
- `resetToDefault()` — reset to type default

### Counter
Simple numeric counter (0-based by default).
- `increment/decrement(amount: Uint<16>)` — adjust value
- `read()` — returns `Uint<64>`
- `lessThan(threshold)` — comparison
- `resetToDefault()` — reset to 0

### Set<value_type>
Unbounded set of values.
- `insert(elem)` / `remove(elem)` — membership management
- `member(elem)` — membership test
- `isEmpty()` / `size()` — introspection
- `insertCoin(coin, recipient)` — add shielded coins
- `resetToDefault()` — clear to empty set

### Map<key_type, value_type>
Unbounded set of key-value mappings.
- `insert(key, value)` / `remove(key)`
- `lookup(key)` — retrieve value
- `member(key)` — key existence check
- `insertDefault(key)` — add with default value
- `insertCoin(key, coin, recipient)` — map shielded coins

### List<value_type>
Unbounded list.
- `pushFront(value)` / `popFront()` — front insertion/removal
- `head()` — returns `Maybe<value_type>`
- `length()` — returns `Uint<64>`
- `isEmpty()` — check if empty

### MerkleTree<nat, value_type>
Bounded Merkle tree of depth `nat` where `2 <= nat <= 32`.
- `insert(item)` / `insertIndex(item, index)` — add leaves
- `insertHash(hash)` / `insertHashIndex(hash, index)` — hash-based insertion
- `checkRoot(rt)` — verify root match
- `isFull()` — capacity check
- TypeScript-only: `root()`, `firstFree()`, `pathForLeaf()`, `findPathForLeaf()`

### HistoricMerkleTree<nat, value_type>
Standard Merkle tree with historical root tracking.
- All MerkleTree operations plus:
- `resetHistory()` — resets history, leaving only current root valid
- `history()` — iterate past valid roots (TypeScript)

### Primitive Types
- **Uint<bits>**: Unsigned integers
- **Bytes<size>**: Fixed-size byte arrays
- **Field**: Scalar field elements
- **Boolean**: Logical values
- **Either<A, B>**: Union types

---

## Opaque Data Types

Two opaque types: `Opaque<'string'>` and `Opaque<'Uint8Array'>`

These allow "foreign" JavaScript data to be stored and passed around on behalf of a DApp. Within Compact, they cannot be inspected or manipulated — they serve as black boxes. On-chain representation is NOT hidden (`Uint8Array` is the byte array, `string` is UTF-8 encoded).

The Bulletin Board example demonstrates: a `post` circuit accepts `Opaque<'string'>` from JavaScript, stores in public state without inspection, and `take_down` retrieves and returns it.
