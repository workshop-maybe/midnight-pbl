# Lesson 4.3: Deploying to Preprod

## What You'll Do

Deploy the counter contract to Midnight's preprod testnet, fund a wallet with test tokens, and interact with the deployed contract through the CLI. This is your first on-chain transaction on Midnight.

---

## Prerequisites

- Compact toolchain installed and contracts compiled (Lessons 4.1 and 4.2)
- Docker Desktop running
- The example-counter repo cloned and built:

```bash
cd example-counter
npm install
cd contract && npm run compact && npm run build && cd ..
cd counter-cli && npm install && cd ..
```

---

## Step 1: Start the Proof Server and CLI

The counter CLI can auto-start the proof server:

```bash
cd example-counter/counter-cli
npm run preprod-ps
```

This pulls the Docker image (`midnightntwrk/proof-server:7.0.0`), starts the proof server on port 6300, and launches the CLI.

**Verify the proof server is running:**

The CLI output should include the proof server startup. If you see connection errors, start the proof server manually in a separate terminal:

```bash
cd example-counter/counter-cli
docker compose -f proof-server.yml up
```

Wait for:
```
INFO actix_server::server: starting service: "actix-web-service-0.0.0.0:6300", workers: 24, listening on: 0.0.0.0:6300
```

Then in another terminal:
```bash
cd example-counter/counter-cli
npm run preprod
```

**Apple Silicon note:** If the proof server hangs, open Docker Desktop → Settings → General → "Virtual Machine Options" → select **Docker VMM**. Restart Docker.

---

## Step 2: Create a Wallet

The CLI presents options:

```
[1] Create a new wallet
[2] Restore wallet from seed
```

Choose **[1]**. The system generates a headless wallet (separate from Lace or other browser wallets) and displays:

```
──────────────────────────────────────────────────────────────
  Wallet Overview                            Network: preprod
──────────────────────────────────────────────────────────────
  Seed: <64-character hex string>

  Unshielded Address (send tNight here):
  mn_addr_preprod1...
──────────────────────────────────────────────────────────────
```

Save the seed and unshielded address. You'll need the seed to restore this wallet in future sessions.

---

## Step 3: Fund Your Wallet

1. Copy the unshielded address (`mn_addr_preprod1...`)
2. Visit the preprod faucet: **https://faucet.preprod.midnight.network**
3. Paste your address and request tNight tokens

The CLI detects incoming funds automatically. No manual refresh needed.

**If the faucet is unavailable:** The preprod network is in active development. If the faucet is down, try again later or check the [Midnight Discord](https://discord.gg/midnight-network) for status updates.

---

## Step 4: Wait for DUST Generation

After receiving tNight, the CLI registers your NIGHT UTXOs for dust generation. DUST is Midnight's gas token — non-transferable, tied to your NIGHT holdings. You need it for every transaction.

The CLI shows progress:

```
✓ Registering 1 NIGHT UTXO(s) for dust generation
✓ Waiting for dust to generate
✓ Configuring providers
```

DUST generates over time. The CLI waits until you have enough to deploy. When ready:

```
──────────────────────────────────────────────────────────────
  Contract Actions                    DUST: 405,083,000,000,000
──────────────────────────────────────────────────────────────
  [1] Deploy a new counter contract
  [2] Join an existing counter contract
  [3] Monitor DUST balance
  [4] Exit
```

---

## Step 5: Deploy the Counter Contract

Choose **[1]** to deploy. The CLI:

1. Builds the deployment transaction
2. Sends the circuit to the proof server for proof generation
3. Balances the transaction (attaches DUST for gas)
4. Submits the transaction to the preprod network

```
✓ Deploying counter contract
Contract deployed at: <contract address>
```

Save the contract address. You'll need it to reconnect in future sessions.

**What just happened:** The deployment transaction included the contract's initial state (round = 0), the verification keys for the `increment` circuit, and a ZK proof that the constructor executed correctly. The network verified the proof, accepted the transaction, and the contract is now live on preprod.

---

## Step 6: Interact with the Contract

After deployment, the counter menu appears:

```
[1] Increment counter
[2] Display current counter value
[3] Exit
```

**Increment the counter** (option [1]):

The CLI calls the `increment` circuit. The proof server generates a ZK proof, the transaction is submitted, and the on-chain counter increments by 1. Each increment is a real transaction on Midnight preprod.

**Display current value** (option [2]):

Reads the current `round` value from the on-chain ledger state.

---

## Step 7: Rejoin in a Future Session

Next time you run the CLI:

1. Choose **[2]** to restore wallet from seed
2. Enter your saved seed
3. Wait for sync and DUST generation
4. Choose **[2]** to join existing contract
5. Enter your saved contract address

The CLI reconnects to the deployed contract. You can continue incrementing.

---

## What's Happening Under the Hood

Each `increment` call follows the pipeline from Lesson 3.2:

```
CLI calls increment()
    → Runtime evaluates circuit (round.increment(1))
    → Proof server generates ZK proof using increment.prover key
    → Transaction: proof + new state (round = N+1) + gas
    → Network verifies proof using increment.verifier key
    → Ledger updated: round = N+1
```

The counter is simple enough that proof generation is nearly instant. More complex circuits (like the bulletin board's `post`) take longer because they include hash computation and `disclose()` operations.

---

## The Standalone Alternative

If preprod is unavailable, run everything locally:

```bash
cd example-counter/counter-cli
npm run standalone
```

This starts three Docker containers:
- `midnightntwrk/midnight-node:0.20.0` — a local Midnight node
- `midnightntwrk/indexer-standalone:3.0.0` — a local blockchain indexer
- `midnightntwrk/proof-server:7.0.0` — the proof server

No faucet needed — the local network provides funds automatically. Good for development when you don't need real testnet interaction.

---

## Troubleshooting

**`connect ECONNREFUSED 127.0.0.1:6300`**

The proof server isn't running. Start it with `docker compose -f proof-server.yml up` in a separate terminal.

**DUST balance stays at 0**

DUST generation takes time after registering NIGHT UTXOs. Wait a few minutes. If it persists, check that the faucet transaction confirmed — the CLI should show the NIGHT balance.

**DUST balance drops to 0 after a failed deploy**

Known issue. Restart the CLI to release locked DUST coins.

**Wallet shows 0 balance after faucet**

Wait for the sync to complete. The CLI needs to scan the chain for your transactions. If still 0, verify you sent to the correct unshielded address.

**Proof server hangs (no output)**

On Apple Silicon Macs, enable Docker VMM (Settings → General → "Virtual Machine Options" → Docker VMM). Restart Docker.

---

## What's Next

You've installed the toolchain, compiled contracts, and deployed to a live network. Module 5 applies everything you've learned to build credential systems — the use case where Midnight's privacy model matters most.

---

## Conversation Starters

Deploy the counter contract to preprod (or standalone) and complete the following:

1. Record the compiler version, contract address, and initial round value
2. Increment the counter three times. How long does each proof take?
3. Display the counter value — confirm it reads 3
4. Exit and rejoin using your saved seed and contract address. Does the counter value persist?
5. Try deploying the bulletin board contract using the same process (it uses `example-bboard/bboard-cli`). What differences do you notice in proof generation time?
