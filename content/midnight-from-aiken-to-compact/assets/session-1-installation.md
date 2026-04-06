# Installation Guide (Fetched 2026-03-23)

Source: docs.midnight.network/getting-started/installation

## System Requirements

- **Linux or Mac** (Windows not supported)
- Google Chrome browser
- Visual Studio Code
- Docker Desktop
- Lace Wallet (Beta, requires Cardano wallet setup first)

## Compact Toolchain Installation

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
```

### Shell PATH Configuration

```bash
source ~/.zshrc   # for zsh
# or
source ~/.bashrc  # for bash
```

### Update Compiler

```bash
compact update
```

### Verify Installation

```bash
compact --version
compact compile --version
which compact
```

## Proof Server Setup

**Docker Image:** `midnightntwrk/proof-server:7.0.0`

```bash
docker run -p 6300:6300 midnightntwrk/proof-server:7.0.0 -- midnight-proof-server -v
```

Listens at `http://localhost:6300`. Alternative port: `-p 6301:6300` if 6300 is unavailable.

## VS Code Extension

Download VSIX package from GitHub releases, install via "Extensions > Install from VSIX."

## Current Testnet Status (as of 2026-03-23)

- **Testnet-02:** Was active until end of February 2026
- **Preview:** Reserved for core engineering rapid development
- Moving toward **Mōhalu** (Incentivized Mainnet)
- Transitioning from Docker-only to pre-compiled binaries for `midnight-node`
- Registration wizard being removed in favor of scriptable processes
- Subscribe to Midnight Validator Digest at mpc.midnight.network for updates
