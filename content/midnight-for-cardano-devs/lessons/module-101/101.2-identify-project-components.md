# Lesson 101.2: What's in a Midnight Project

**SLT:** I can identify the key components of a Midnight project and relate them to Cardano equivalents.

**Type:** Exploration

---

## The Scaffolded Project

In Lesson 101.1, you ran `create-mn-app` and deployed a contract. Now look at what you got.

The hello world template produces this structure:

```
midnight-project/
├── contracts/
│   └── hello-world.compact       # Smart contract source
├── src/
│   ├── deploy.ts                 # Wallet setup + compilation + deployment
│   ├── cli.ts                    # Interact with deployed contract
│   └── check-balance.ts          # Query wallet balance
├── docker-compose.yml            # Proof server configuration
├── package.json                  # SDK dependencies (17 @midnight-ntwrk packages)
└── tsconfig.json
```

Six components. If you've built on Cardano, each one has a counterpart you already know.

---

## Component by Component

### 1. The Compact Contract (`contracts/hello-world.compact`)

This is the smart contract. A `.compact` file defines what the contract stores, what it does, and what data crosses the privacy boundary.

```
pragma language_version >= 0.16;

export ledger customMessage: Opaque<'string'>;

export circuit storeMessage(message: Opaque<'string'>): Opaque<'string'> {
  customMessage = disclose(message);
  return customMessage;
}

export circuit readMessage(): Opaque<'string'> {
  return customMessage;
}
```

Three things to notice:
- `export ledger customMessage` — persistent state, publicly readable on-chain
- `export circuit storeMessage` — an entry point that transactions call
- `disclose(message)` — explicitly moves the message from private computation to public state

**Cardano equivalent:** This is your validator script. `.compact` maps to `.ak` (Aiken) or `.hs` (Plutus). But the role is different — a Cardano validator checks whether a state transition is allowed. A Compact circuit performs the state transition. Validator as judge vs circuit as actor.

### 2. The Deploy Script (`src/deploy.ts`)

A 480-line TypeScript file that handles:
- Wallet creation and funding
- Compact contract compilation
- Contract deployment to the network
- Proof generation for the deployment transaction

**Cardano equivalent:** Your off-chain transaction builder. On Cardano, this is the code that constructs transactions — selects UTXOs, sets datums, calculates fees, signs, and submits. On Midnight, the deploy script does the same but also triggers proof generation and manages the wallet's interaction with the proof server.

### 3. The CLI (`src/cli.ts`)

A command-line tool for interacting with the deployed contract. Call `storeMessage`, call `readMessage`, see the results. Each interaction triggers a full transaction cycle — local execution, proof generation, submission, confirmation.

**Cardano equivalent:** Your off-chain interaction code. Whatever you use to build and submit transactions against a deployed validator — `cardano-cli`, Lucid, Mesh, Atlas. Same role: construct a transaction that interacts with on-chain state.

### 4. The Proof Server (`docker-compose.yml`)

```yaml
services:
  proof-server:
    image: midnightntwrk/proof-server:7.0.0
    ports:
      - "6300:6300"
```

A Docker container running a native binary that generates zero-knowledge proofs. When your circuit executes locally, the results go to the proof server, which produces a succinct proof that the computation was correct — without revealing private inputs.

**Cardano equivalent:** None. This is genuinely new. On Cardano, validators run deterministically on-chain — no proof needed because everyone can see the inputs and re-verify. On Midnight, the proof server is the infrastructure that makes privacy possible. It's the most important piece you don't have on Cardano.

The proof server is local infrastructure. It runs on your machine (or a server you control). It sees your private inputs in order to generate the proof. This is a trust boundary — whoever runs the proof server can see your pre-proof data.

### 5. SDK Dependencies (`package.json`)

Seventeen `@midnight-ntwrk` packages covering:
- Contract compilation and deployment
- Wallet and key management
- Proof generation client
- Network communication
- Type definitions for the Compact runtime

**Cardano equivalent:** Your SDK stack — `@meshsdk/core`, `lucid-cardano`, `cardano-serialization-lib`, `@blockfrost/blockfrost-js`. Same pattern: a collection of packages that handle wallet operations, transaction building, and network interaction. Midnight's SDK is broader because it also handles proof generation and the privacy-specific runtime.

### 6. Balance Checker (`src/check-balance.ts`)

Queries the wallet for DUST (gas token) and tDUST (testnet) balances.

**Cardano equivalent:** Any balance query tool — `cardano-cli query utxo`, Blockfrost API, wallet balance check. Same concept, different token model (DUST vs ADA).

---

## The Mapping

| Midnight Component | Cardano Equivalent | Key Difference |
|-------------------|-------------------|----------------|
| `.compact` contract | `.ak` / `.hs` validator | Circuit performs state transitions; validator approves/rejects |
| `deploy.ts` | Off-chain tx builder | Also handles proof generation and compilation |
| `cli.ts` | `cardano-cli` / Lucid / Mesh | Each interaction triggers ZK proof generation |
| Proof server (Docker) | **No equivalent** | New infrastructure requirement for privacy |
| `@midnight-ntwrk/*` SDK | `@meshsdk/*` / Lucid / CSL | Broader scope — includes proof generation runtime |
| `check-balance.ts` | UTXO query / balance check | Queries DUST, not ADA |

---

## What the Scaffolder Doesn't Show You

The hello world template is deliberately simple. It uses `disclose()` on everything — the stored message is fully public. There's no private state, no witness functions, no secret data.

The bulletin board template — the other option from `create-mn-app` — tells a different story. It's a monorepo with four packages (`contract/`, `api/`, `cli/`, `ui/`), a witness function that provides a secret key, private state stored in a local LevelDB database, and ZK proofs that verify ownership without revealing identity.

The jump from hello world to bulletin board is the jump from "Midnight as a transparent blockchain with extra steps" to "Midnight as a privacy-preserving platform." Everything in the hello world project exists in the bulletin board project — but with the privacy layer actually engaged.

Module 103 is where you start writing contracts that use that privacy layer. For now, the inventory above is what you need: six components, each with a Cardano equivalent (except the proof server), arranged in a pattern you already know.

---

## The Proof Server Is the Difference

If one thing sticks from this lesson, it should be this: the proof server is the component that has no Cardano equivalent, and it's the one that makes everything else work differently.

On Cardano, your transaction builder constructs a transaction and submits it. The network validates it by running the script. Simple.

On Midnight, your local code executes the circuit, generates transcripts, sends them to the proof server, waits for a proof (this takes seconds, not milliseconds), and then submits the proven transaction. The network validates it by checking the proof — fast, cheap, and without seeing your private inputs.

Every interaction you build will include this step. It's not optional. It's not a feature toggle. The proof server is running for every transaction, even the hello world one that discloses everything. The privacy infrastructure is always on — what varies is how much you use it.

---

## Questions to Consider

- The proof server sees your private inputs before the proof is generated. On Cardano, there's no equivalent trust boundary — everything is either on your machine or on-chain. How does the proof server's position change your deployment architecture? What if you're building for users who can't run their own proof server?
- The hello world template has one `package.json`. The bulletin board has four packages in a monorepo. What drove that architectural split? When would you choose one structure over the other?
- Midnight's SDK includes 17 packages. Cardano's ecosystem has many competing SDKs (Mesh, Lucid, CSL, Atlas). What are the tradeoffs of a single official SDK vs a competitive ecosystem?

---

## What's Next

Module 102 examines Midnight's architecture in depth — the dual-state model (102.1), how concurrent transactions work (102.2), and the partner chain relationship to Cardano (102.3).

---

## Conversation Starters

You're explaining Midnight to a Cardano developer who has built DApps with Aiken and Lucid. They ask: "What new infrastructure do I need to run?"

Walk them through the six components above. For each one, tell them:
- What it does
- What they already know from Cardano that maps to it
- What's genuinely new (things they don't have a mental model for yet)
