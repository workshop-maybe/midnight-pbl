# Lesson 101.1: Scaffold and Deploy Your First Midnight DApp

**SLT:** I can scaffold and deploy a Midnight DApp to the Preprod testnet using `create-mn-app`.

**Type:** How To Guide

---

## Prerequisites

Before you start:
- **Node.js 22+** installed
- **Docker** installed and running
- **Compact compiler** installed (see below)

### Install the Compact Compiler

The Compact compiler is a standalone binary — not an npm package. Install it via the official installer script:

```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
```

This installs the `compact` CLI manager to `$HOME/.local/bin`. Make sure it's in your PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

**Two versions to know about:** `compact --version` shows the CLI manager version (e.g. 0.5.1). The *compiler toolchain* is managed separately. Install the compatible compiler version:

```bash
compact update 0.29.0
```

Verify the toolchain is installed:

```bash
compact list
```

You should see 0.29.0 as the default. Version pinning matters — the latest compiler may be incompatible with SDK 3.0.0.

---

## Step 1: Scaffold

```bash
npx create-mn-app midnight-pbl-scaffold
```

The scaffolder offers three templates:
- **Contract** (Hello World) — single package, one circuit, no witness functions. Start here.
- **Full DApp** (Bulletin Board) — monorepo with contract, API, CLI, and UI packages. Private state. Witness functions. Module 103+.
- **Connector** — coming soon.

Choose **Contract (Hello World)**. You get:

```
midnight-pbl-scaffold/
├── contracts/
│   └── hello-world.compact       # Your smart contract
├── src/
│   ├── deploy.ts                 # Wallet + compile + deploy pipeline
│   ├── cli.ts                    # Interact with deployed contract
│   └── check-balance.ts          # Query wallet balance
├── docker-compose.yml            # Proof server configuration
├── package.json                  # 17 @midnight-ntwrk SDK packages
└── tsconfig.json
```

Install dependencies:

```bash
cd midnight-pbl-scaffold
npm install
```

---

## Step 2: Start the Proof Server

The proof server generates zero-knowledge proofs for every transaction. It's a Docker container running a native binary — not something you can skip.

```bash
docker compose up -d
```

Or run it directly:

```bash
docker run -p 6300:6300 midnightntwrk/proof-server:latest midnight-proof-server -v
```

Verify it's running:

```bash
curl -s http://127.0.0.1:6300 && echo "Proof server is up"
```

To watch proof server activity during deploy and interactions, stream the logs in a separate terminal:

```bash
docker compose logs -f
```

**ARM Mac users:** The default `docker-compose.yml` includes `platform: linux/amd64`, which forces emulation and kills performance. Remove that line if you're on Apple Silicon:

```yaml
# docker-compose.yml — remove this line on ARM Macs:
# platform: linux/amd64
```

---

## Step 3: Compile the Contract

```bash
npm run compile
```

This runs the Compact compiler against `contracts/hello-world.compact` and produces:
- `contracts/managed/hello-world/contract/index.js` — compiled contract code
- `contracts/managed/hello-world/keys/` — prover and verifier keys for each circuit
- `contracts/managed/hello-world/zkir/` — zero-knowledge intermediate representation

The compilation output is what the proof server uses to generate proofs. Without it, no transactions.

---

## Step 4: Deploy to Preprod

```bash
npm run deploy
```

The deploy script walks you through five steps:

### 4a. Wallet Setup

Choose **[1] Create new wallet**. A 64-character hex seed is generated and saved to `.midnight-seed` (chmod 600). Back this up — it's your key to the wallet.

**Never commit `.midnight-seed` to git.** It contains your wallet's private key. If you cloned the `midnight-pbl` repo, it's already in `.gitignore`. If you scaffolded elsewhere, add `.midnight-seed` to your `.gitignore`.

The wallet derives three key sets:
- **Zswap keys** — for shielded token operations
- **NightExternal keys** — for unshielded NIGHT transactions
- **Dust keys** — for gas token operations

### 4b. Fund the Wallet

The script prints your wallet address and waits. Visit the faucet:

```
https://faucet.preprod.midnight.network/
```

Paste your address, request tNight. The script detects the incoming funds and continues.

### 4c. DUST Registration

NIGHT alone doesn't pay fees — you need DUST. The script registers your NIGHT UTXOs for DUST generation and waits for DUST to accumulate.

This can take a few blocks. The script retries up to 8 times with 15-second intervals if DUST is insufficient for the deployment transaction.

### 4d. Contract Deployment

The script deploys the compiled contract to preprod. This triggers proof generation for the deployment transaction — expect 30-60 seconds.

On success, you get a contract address:

```
Contract Address: 72bd2d70...492c1c
```

### 4e. Set the Answer Key (for PBL examples)

If you're deploying the course's custom contracts (public-answer or private-answer), the script prompts you to set a correct answer. The answer is hashed with SHA-256, and only the hash goes on-chain via `persistentHash()`.

---

## Step 5: Interact

```bash
npm run cli
```

The CLI connects to your deployed contract and offers:
1. **Store/submit** — call a circuit (triggers proof generation, ~30-60 seconds)
2. **Read state** — query public ledger fields via the indexer
3. **Check balance** — see tNight and DUST balances

Try storing a message. Watch the timing. The proof generation delay is real — this is what privacy costs in computation time.

---

## Verify from the Outside

Anyone can read your contract's public state without a wallet or SDK. The indexer exposes a GraphQL API:

```bash
curl -s -X POST https://indexer.preprod.midnight.network/api/v3/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ contractAction(address: \"YOUR_CONTRACT_ADDRESS\") { state } }"}'
```

If you stored a message using the hello world contract, the hex-encoded state contains your message in plaintext. This is the concrete proof that `disclose()` makes data public — no authentication, no SDK, just a GET request.

---

## What Can Go Wrong

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Contract not compiled!` | Didn't run compile step | `npm run compile` |
| Proof server timeout | Docker not running or wrong port | `docker compose up -d` |
| `Not enough Dust` | Wallet is new, DUST hasn't accumulated | Wait a few blocks, retry `npm run deploy` |
| Compilation fails with version error | Compact toolchain vs SDK mismatch | `compact update 0.29.0` then verify with `compact list` |
| Extremely slow proof generation | ARM Mac with `platform: linux/amd64` in docker-compose | Remove the platform line |
| Wallet sync hangs | Network connectivity or WebSocket issues | Check `https://indexer.preprod.midnight.network` is reachable |

---

## The Working Version Combo

Pin these versions. They work together as of April 2026:

| Component | Version |
|-----------|---------|
| Compact CLI manager (`compact --version`) | 0.5.1+ |
| Compact toolchain (`compact list`) | 0.29.0 |
| compact-runtime | 0.14.0 |
| SDK packages (`@midnight-ntwrk/*`) | 3.0.0 |
| Proof server | `midnightntwrk/proof-server:latest` (or `7.0.0`) |
| Node.js | 22+ |

Do NOT run `compact update` without a version number — it installs 0.30.0 which is incompatible with the current SDK.

---

## What You Just Did

You deployed a smart contract to a privacy-preserving blockchain. The contract stores a message on a public ledger, verified by a zero-knowledge proof. Every interaction — storing, reading, deploying — went through the proof server.

This is the full Midnight development loop:
1. Write Compact contract
2. Compile to ZK circuits
3. Deploy with proof-verified transaction
4. Interact — every call generates a new proof

On Cardano, the loop is: write validator, build transaction, submit. No proof server, no ZK compilation, no privacy layer. The extra steps on Midnight are the cost of privacy infrastructure. Lesson 101.2 maps these components to what you already know from Cardano. Lesson 101.3 explains why proof generation takes the time it does.

---

## Questions to Consider

- The deploy script creates a wallet, funds it, registers for DUST, deploys, and sets state — five steps where Cardano needs two (fund wallet, submit transaction). Which of these steps are inherent to privacy, and which are SDK complexity that could be simplified?
- Your `.midnight-seed` file is the key to everything. On Cardano, you might use a hardware wallet or a browser extension. What's the equivalent security model for Midnight development workflows?
- The proof server runs locally and sees your private inputs. In a production deployment, who runs the proof server? What changes about the trust model?
