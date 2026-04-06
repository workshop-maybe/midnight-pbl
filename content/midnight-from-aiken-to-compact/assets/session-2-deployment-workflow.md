# Deployment Workflow and Infrastructure (2026-03-23)

Source: example-counter README, Docker compose files

## Network Targets

| Network | Description | How to Run |
|---------|-------------|-----------|
| **Preprod** | Public testnet (recommended) | `npm run preprod-ps` |
| **Preview** | Public preview testnet | `npm run preview-ps` |
| **Standalone** | Fully local (node + indexer + proof server) | `npm run standalone` |

## Preprod Deployment Flow

### 1. Start Proof Server

```yaml
# proof-server.yml
services:
  proof-server:
    image: 'midnightntwrk/proof-server:7.0.0'
    command: ['midnight-proof-server -v']
    ports:
      - '6300:6300'
    environment:
      RUST_BACKTRACE: 'full'
```

```bash
cd counter-cli
docker compose -f proof-server.yml up
```

Wait for: `INFO actix_server::server: starting service: "actix-web-service-0.0.0.0:6300", workers: 24, listening on: 0.0.0.0:6300`

Healthcheck endpoint: `http://localhost:6300/version`

### 2. Create/Restore Wallet

CLI provides headless wallet (separate from Lace browser wallet):
- Option [1]: Create new wallet → generates seed + unshielded address (`mn_addr_preprod1...`)
- Option [2]: Restore from saved seed

### 3. Fund via Faucet

**Preprod Faucet URL:** https://faucet.preprod.midnight.network

1. Copy unshielded address from CLI output
2. Paste into faucet, request tNight tokens
3. CLI detects funds automatically

### 4. Wait for DUST Generation

After receiving tNight:
1. CLI registers NIGHT UTXOs for dust generation
2. DUST generates over time (computational resource, not transferable)
3. CLI shows balance when ready:

```
Contract Actions                    DUST: 405,083,000,000,000
```

### 5. Deploy Contract

- CLI option [1]: Deploy new contract
- Steps: proving → balancing → submission
- Output: contract address (save this)

### 6. Interact

- Increment counter (submits real transaction on preprod)
- Display current value (queries blockchain)

## Standalone (Fully Local) Stack

```yaml
# standalone.yml — three services
services:
  proof-server:
    image: 'midnightntwrk/proof-server:7.0.0'
  indexer:
    image: 'midnightntwrk/indexer-standalone:3.0.0'
  node:
    image: 'midnightntwrk/midnight-node:0.20.0'
```

Standalone runs everything locally — no testnet access needed. Good for development.

## Docker Image Versions (current)

| Image | Version |
|-------|---------|
| proof-server | 7.0.0 |
| indexer-standalone | 3.0.0 |
| midnight-node | 0.20.0 |

## Apple Silicon Note

If proof server hangs on Mac ARM: Docker Desktop → Settings → General → "Virtual Machine Options" → select **Docker VMM**. Restart Docker.

## Common Troubleshooting

| Issue | Solution |
|-------|----------|
| `connect ECONNREFUSED 127.0.0.1:6300` | Start proof server first |
| Proof server hangs (ARM Mac) | Enable Docker VMM |
| DUST balance drops to 0 after failed deploy | Restart DApp to release locked coins |
| Wallet shows 0 after faucet | Wait for sync to complete |

## Key Discovery: Node.js Version Requirement

README specifies **Node.js v22.15+**. James currently has v25.8.0 which should be compatible.
