# Lesson 4.2: Compiling a Compact Contract

## What You'll Do

Compile two Compact contracts — the counter and the bulletin board — and examine what the compiler produces. By the end, you'll know what every file in the `managed/` directory does and how the artifacts connect to the proof generation and verification pipeline.

---

## Prerequisites

- Compact compiler installed (Lesson 4.1)
- Node.js v22.15+
- The example repos cloned:

```bash
git clone https://github.com/midnightntwrk/example-counter
git clone https://github.com/midnightntwrk/example-bboard
```

---

## Step 1: Compile the Counter Contract

```bash
cd example-counter/contract
npm install
npm run compact
```

Expected output:

```
Compiling 1 circuits:
```

**Verify the output exists:**

```bash
ls src/managed/counter/
```

You should see four directories: `compiler/`, `contract/`, `keys/`, `zkir/`.

If this is your first compilation with ZK parameter generation, the compiler downloads universal parameters (~500MB). This is a one-time download stored in your `~/.compact/` directory.

---

## Step 2: Examine the Counter Artifacts

### contract-info.json

```bash
cat src/managed/counter/compiler/contract-info.json
```

```json
{
  "compiler-version": "0.30.0",
  "language-version": "0.22.0",
  "runtime-version": "0.15.0",
  "circuits": [
    {
      "name": "increment",
      "pure": false,
      "proof": true,
      "arguments": [],
      "result-type": { "type-name": "Tuple", "types": [] }
    }
  ],
  "witnesses": [],
  "contracts": []
}
```

This is the contract's metadata. It tells you:
- **One circuit** named `increment`, marked `pure: false` (it modifies state) and `proof: true` (calling it generates a ZK proof)
- **No witnesses** — the counter has no private inputs
- **Version info** — compiler 0.30.0, language 0.22.0, runtime 0.15.0

### Generated TypeScript (index.d.ts)

```bash
cat src/managed/counter/contract/index.d.ts
```

The key types:

```typescript
export type Ledger = {
  readonly round: bigint;
}

export type Circuits<PS> = {
  increment(context: CircuitContext<PS>): CircuitResults<PS, []>;
}

export declare class Contract<PS> {
  witnesses: Witnesses<PS>;
  circuits: Circuits<PS>;
  constructor(witnesses: Witnesses<PS>);
  initialState(context: ConstructorContext<PS>): ConstructorResult<PS>;
}
```

The Compact `Counter` type maps to TypeScript `bigint`. The `increment` circuit takes a `CircuitContext` and returns `CircuitResults` with an empty tuple (matching the Compact return type `[]`).

### Proving and Verification Keys

```bash
ls -lh src/managed/counter/keys/
```

```
14K  increment.prover
1.3K increment.verifier
```

- **increment.prover** (14K) — the proving key. The proof server uses this to generate ZK proofs when a user calls `increment()`.
- **increment.verifier** (1.3K) — the verification key. The Midnight network uses this to verify the proofs.

The proving key is always much larger than the verification key. This is by design — proof generation is expensive, verification is cheap.

### ZKIR Files

```bash
ls -lh src/managed/counter/zkir/
```

```
64B   increment.bzkir
784B  increment.zkir
```

- **increment.zkir** — human-readable ZK intermediate representation. The circuit expressed as constraints.
- **increment.bzkir** — binary form consumed by the proof server.

---

## Step 3: Compile the Bulletin Board Contract

```bash
cd ../../example-bboard/contract
npm install
npm run compact
```

Expected output:

```
Compiling 2 circuits:
```

Two provable circuits: `post` and `takeDown`. The `publicKey` circuit is pure (no proof) so it doesn't count in the compilation message.

**Verify:**

```bash
ls src/managed/bboard/
```

Same four directories.

---

## Step 4: Compare the Artifacts

```bash
ls -lh src/managed/bboard/keys/
```

```
2.7M  post.prover
2.1K  post.verifier
2.7M  takeDown.prover
2.1K  takeDown.verifier
```

Compare to the counter:

| Artifact | Counter `increment` | Bboard `post` | Bboard `takeDown` |
|----------|-------------------|---------------|-------------------|
| Prover key | 14K | 2.7MB | 2.7MB |
| Verifier key | 1.3K | 2.1K | 2.1K |
| ZKIR (text) | 784B | 4.5K | 6.0K |

The bulletin board's circuits are ~200x larger proving keys. The difference comes from:
- `persistentHash` computation (used in `publicKey` derivation)
- `disclose()` operations (each adds constraints)
- `assert` checks (condition evaluation + abort logic)
- `Opaque<"string">` handling (variable-length data)

Verification keys stay small regardless of complexity. On-chain verification cost is predictable.

### Check contract-info.json

```bash
cat src/managed/bboard/compiler/contract-info.json
```

Three circuits listed:
- `post` — `pure: false, proof: true` — modifies state, generates proof
- `takeDown` — `pure: false, proof: true` — modifies state, generates proof
- `publicKey` — `pure: true, proof: false` — utility function, no proof needed

One witness:
- `localSecretKey` — returns `Bytes<32>`

---

## Step 5: Build the TypeScript Package

After compilation, build the TypeScript bindings:

```bash
npm run build
```

This runs the TypeScript compiler and copies the `managed/` directory into `dist/`. The result is a publishable npm package that other parts of your DApp (CLI, UI) can import.

**Verify the build:**

```bash
ls dist/managed/bboard/contract/
```

You should see `index.d.ts`, `index.js`, and `index.js.map`.

---

## Step 6: Run the Contract Tests

```bash
npm run test
```

The example repos include unit tests that exercise the circuits using the compact runtime. If the tests pass, the compilation artifacts are valid and the circuits execute correctly.

If tests fail with "Cannot find module," you need to build first: `npm run compact && npm run build`.

---

## The Artifact Map

```
.compact source
    │
    ▼ compact compile
    │
    ├── compiler/contract-info.json  ← metadata (circuits, witnesses, versions)
    │
    ├── contract/index.d.ts          ← TypeScript types (Ledger, Circuits, Witnesses)
    ├── contract/index.js            ← Runtime binding (circuit execution logic)
    │
    ├── keys/{circuit}.prover        ← Proving key → proof server uses this
    ├── keys/{circuit}.verifier      ← Verification key → network uses this
    │
    └── zkir/{circuit}.zkir          ← ZK constraints (human-readable)
        zkir/{circuit}.bzkir         ← ZK constraints (binary, for proof server)
```

Every exported circuit with `proof: true` gets its own set of `.prover`, `.verifier`, `.zkir`, and `.bzkir` files. Pure circuits don't generate proof artifacts.

---

## Troubleshooting

**"No default compiler set"**

Run `compact update` to install and set a default compiler version.

**First compilation takes a long time**

The first run downloads universal ZK parameters (~500MB). Subsequent compilations reuse them.

**"Cannot find module" when running tests**

Build first: `npm run compact && npm run build`. The tests import from `dist/`, which requires both compilation and TypeScript build.

**Compilation succeeds but no `keys/` directory**

Check that the circuit is marked `proof: true` in contract-info.json. Pure circuits don't generate keys.

---

## What's Next

Lesson 4.3 takes the compiled contract and deploys it to preprod — your first on-chain transaction on Midnight.

---

## Assignment

Compile both example contracts on your machine and answer:

1. How many provable circuits does each contract have? How many pure circuits?
2. What's the size ratio between the counter's proving key and the bulletin board's proving key? What accounts for the difference?
3. Look at the generated `index.d.ts` for the bulletin board. How does `Maybe<Opaque<"string">>` in Compact map to TypeScript?
4. Open `increment.zkir` and `post.zkir`. What differences do you notice in the constraint structure?
