# Lesson 2.2: From Aiken to Compact

## Two Languages, One Developer

If you've written Aiken validators, you already have the mental models that matter: typed state, explicit constraints, on-chain verification. Compact uses different syntax and a different execution model, but the concerns are the same.

This lesson maps what you know in Aiken to what you'll write in Compact. It won't teach you Compact syntax in detail — that's Lesson 2.3. The goal here is orientation: when you see a Compact concept, you should know which Aiken concept it replaces and what changed.

---

## The Core Mapping

| Aiken | Compact | What Changed |
|-------|---------|-------------|
| Validator | Circuit | Validators approve/reject. Circuits execute and mutate state. |
| Datum | Ledger fields | Datums are per-UTxO, consumed and recreated. Ledger fields persist across transactions. |
| Redeemer | Circuit parameters | Both provide input to the script. Compact parameters can be private. |
| `check` / `expect` | `assert` | Same role: enforce a condition or abort. |
| Custom types | `enum`, structs | Compact enums work similarly. Struct syntax differs. |
| `pub fn` | `export circuit` | Both control external visibility. |
| (no equivalent) | `witness` | Private input from user's machine. Aiken has no equivalent — everything is on-chain. |
| (no equivalent) | `disclose()` | Explicit visibility control. In Aiken, everything is public by default. |
| Script context | `Kernel` built-in | Kernel provides balance checks, block time, contract address. Narrower than ScriptContext. |
| Minting policy | `Kernel.mintShielded/mintUnshielded` | Token minting is a Kernel operation, not a separate script. |

---

## State: Datum vs. Ledger

In Aiken, state lives in datums attached to UTxOs. To update state, you consume the UTxO and create a new one with the updated datum. The validator checks that the transition is valid.

```aiken
// Aiken: state is a datum type
type CounterDatum {
  count: Int,
}

// Validator checks the transition
validator {
  fn increment(datum: CounterDatum, _redeemer: Void, _ctx: ScriptContext) -> Bool {
    expect CounterDatum { count } = datum
    count >= 0
  }
}
```

In Compact, state lives in ledger fields. The circuit reads and writes them directly. No consumption and recreation.

```compact
// Compact: state is a ledger field
export ledger round: Counter;

// Circuit performs the transition
export circuit increment(): [] {
  round.increment(1);
}
```

The Aiken validator says "this transition is allowed." The Compact circuit says "do this transition." The validator is a judge. The circuit is an actor.

**What this means for you:** In Aiken, you spend most of your effort defining valid transitions and checking edge cases in the validator. In Compact, the circuit defines the transition itself, and the ZK proof guarantees it was executed correctly. You shift from defensive validation to direct computation.

---

## Entry Points: Validator vs. Circuit

An Aiken validator has a fixed signature: datum, redeemer, script context. Every validator follows this pattern.

```aiken
validator {
  fn spend(datum: MyDatum, redeemer: MyRedeemer, ctx: ScriptContext) -> Bool {
    // ... return True or False
  }
}
```

A Compact circuit has a flexible signature. Parameters are typed but you choose what they are. The return type can be a value, not just a boolean.

```compact
export circuit post(newMessage: Opaque<"string">): [] {
  assert(state == State.VACANT, "Board is occupied");
  owner = disclose(publicKey(localSecretKey(), sequence as Field as Bytes<32>));
  message = disclose(some<Opaque<"string">>(newMessage));
  state = State.OCCUPIED;
}

export circuit takeDown(): Opaque<"string"> {
  assert(state == State.OCCUPIED, "Board is empty");
  // ... returns the taken-down message
}
```

Key differences:
- **Multiple circuits per contract.** Aiken has one validator per script address. Compact contracts expose multiple circuits, each with a different purpose.
- **Circuits return values.** `takeDown()` returns the message content. Aiken validators only return True/False.
- **No script context.** Compact circuits access the ledger directly. They don't receive a transaction-level context the way Aiken validators do. Contract-level info (address, balance, block time) comes from the `Kernel` built-in.

---

## Types: Similar but Different

Aiken and Compact both use algebraic data types, but the syntax and capabilities diverge.

**Enums:**

```aiken
// Aiken
type State {
  Vacant
  Occupied
}
```

```compact
// Compact
export enum State {
  VACANT,
  OCCUPIED
}
```

Compact enums are simpler — no associated data on variants (unlike Aiken's constructors with fields).

**Option/Maybe:**

```aiken
// Aiken: Option<a> is built-in
let msg: Option<ByteArray> = Some("hello")
```

```compact
// Compact: Maybe<T> with some<T>() and none<T>() constructors
export ledger message: Maybe<Opaque<"string">>;
message = some<Opaque<"string">>(content);
message = none<Opaque<"string">>();
```

**Integers and bytes:**

```aiken
// Aiken: unbounded Int, ByteArray
let x: Int = 42
let b: ByteArray = #"deadbeef"
```

```compact
// Compact: sized types
export ledger value: Uint<64>;    // 64-bit unsigned
export ledger key: Bytes<32>;     // 32-byte array
export ledger f: Field;           // scalar field element
```

Compact requires explicit sizes. There's no unbounded integer. This constraint comes from the ZK circuit — every value needs a known bit width for the proof system.

---

## Privacy: The Concept Aiken Doesn't Have

This is where Compact diverges most from Aiken. Two concepts have no Aiken equivalent:

### Witnesses

```compact
witness localSecretKey(): Bytes<32>;

export circuit post(newMessage: Opaque<"string">): [] {
  owner = disclose(publicKey(localSecretKey(), sequence as Field as Bytes<32>));
  // localSecretKey() is private — never on-chain
  // publicKey() result is disclosed — visible on-chain
}
```

In Aiken, every input to the validator is on-chain. The datum is on-chain. The redeemer is on-chain. There is no concept of private input.

In Compact, witnesses provide data from the user's local environment. The data enters the ZK circuit, gets used in computation, and only the results that are explicitly `disclose()`d become public.

### disclose()

```compact
// This value goes on the public ledger
authority = disclose(publicKey(round, sk));

// This value also goes on the ledger, but the connection
// between the input (sk) and the output is hidden
value = disclose(v);
```

In Aiken, you never think about what to reveal — everything is revealed. In Compact, `disclose()` is the explicit act of making something public. Omitting it keeps the value behind the ZK proof.

---

## Assertions: check vs. assert

The pattern is nearly identical:

```aiken
// Aiken
expect True = count >= 0
// or
if count < 0 {
  fail
}
```

```compact
// Compact
assert(state == State.VACANT, "Board is occupied");
```

Both abort the transaction if the condition fails. Compact's `assert` takes an error message string. The practical difference: in Aiken, a failed check means the validator returns False and the transaction is rejected. In Compact, a failed assert means the circuit aborts and no ZK proof is generated.

---

## What Doesn't Translate

Some Aiken patterns have no direct Compact equivalent:

| Aiken Pattern | Compact Situation |
|--------------|------------------|
| **Multi-validator composition** (spending + minting in one tx) | One contract, multiple circuits. No separate minting policy — use `Kernel.mintShielded()`. |
| **UTxO scanning** (finding specific UTxOs in ScriptContext) | No UTxO scanning. Ledger state is directly accessible. |
| **Reference inputs** (reading datum without spending) | Not applicable. Ledger fields are always readable. |
| **Transaction-level checks** (checking outputs, signatories) | No transaction context. Circuits operate on contract state. Cross-contract interaction is limited. |
| **Plutus builtins** (bytearray slicing, integer arithmetic) | Compact has its own standard library. Different names, similar operations. |

---

## The Bulletin Board: Side by Side

Here's how you might think about the bulletin board contract in Aiken terms vs. how it's actually written in Compact:

**What an Aiken developer would expect:**

A datum holding the board state. A redeemer with `Post` and `TakeDown` actions. A validator that checks the poster's signature and the state transition. Everything public.

**What Compact actually does:**

```compact
witness localSecretKey(): Bytes<32>;

export circuit post(newMessage: Opaque<"string">): [] {
  assert(state == State.VACANT, "Board is occupied");
  owner = disclose(publicKey(localSecretKey(), sequence as Field as Bytes<32>));
  message = disclose(some<Opaque<"string">>(newMessage));
  state = State.OCCUPIED;
}
```

The secret key is private. The public key is derived inside the circuit and disclosed. The message is disclosed (it's a public bulletin board). The sequence counter increments on takedown to break linkability between posting rounds. None of this is possible in Aiken — there's no mechanism for private input or selective disclosure.

---

## Questions to consider:

- Aiken's eUTxO model enables concurrency — two transactions spending different UTxOs can run in parallel. Compact's account model means circuits read/write shared state. What does this imply for high-throughput applications?
- In Aiken, you can compose validators at the transaction level — one script mints, another spends, and they both see the same ScriptContext. How would you achieve multi-step logic across circuits in a single Compact contract?
- The bulletin board uses a sequence counter to break linkability. In Aiken, all data is public, so linkability is the default. What Aiken applications would benefit from Compact's unlinkability pattern?

---

## What's Next

Lesson 2.3 puts this into practice — you'll walk through writing a Compact contract from scratch, using the counter and bulletin board as examples.

---

## Assignment

Take a simple Aiken validator you've written (or use the counter example) and map each component to its Compact equivalent:

1. Identify the datum → which ledger fields would replace it?
2. Identify the redeemer → which circuit parameters and witnesses would replace it?
3. Identify the validation logic → how does it change when the circuit performs the transition instead of checking it?
4. Identify any data that would benefit from being private → where would you use witnesses and omit `disclose()`?
