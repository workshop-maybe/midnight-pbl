# Interoperability and DUST Architecture (Fetched 2026-03-23)

Source: docs.midnight.network/blog/dust-architecture, /blog/testnet-02-transition

## DUST System Overview

DUST is Midnight's resource credit system for gas computation. Using an analogy:
- **Night** = Solar Panel (valuable asset you hold)
- **Dust** = Electricity (computational throughput / gas generated)

Key characteristics:
- Shielded and non-transferable — tied exclusively to gas
- Dynamically computed from associated Night UTXOs
- Value grows over time to a maximum, then decays after backing Night is spent

## DUST Generation

Operates on a commitment/nullifier paradigm similar to ZSwap:
- Append-only Merkle tree for commitments
- Nullifier set for spent UTXOs
- Root history with time filtering

### Value Calculation — Four Linear Time Segments

1. **Generation phase** (creation to capacity)
2. **Maximum capacity** (until Night is spent)
3. **Decay phase** (after Night spent)
4. **Zero balance** (permanent)

## Cross-Chain Bridge: Native Token Observation

The **Native Token Observation Pallet** (`pallet_cnight_observation`) manages Cardano NIGHT (cNIGHT) to DUST generation:

### Process Flow

1. Users register Cardano reward address + DUST public key on Cardano
2. cNIGHT creation/destruction events broadcast from Cardano
3. Midnight pallet validates single valid registration exists
4. System generates corresponding DUST creation/destruction events
5. Block events batch into single system transaction via LedgerApi
6. Midnight ledger executes transaction — DUST supply updates 1:1 with cNIGHT movements

## Current Interoperability Constraints

- **Grace Period:** Transactions accepted if timestamp is within a window relative to block time (e.g., 3 hours)
- **Non-persistent DUST:** System may redistribute it on hardforks
- Protocol reserves right to modify DUST allocation rules (e.g., for garbage collection)
- Privacy: Wallets should use bit-prefixes (stochastic filtering) rather than exact lookups
- **Bridge is one-directional:** cNIGHT on Cardano → DUST on Midnight. No general-purpose message passing or arbitrary asset bridging.
- **No smart contract interop:** Contracts on Midnight cannot call Cardano contracts or vice versa. The only cross-chain mechanism is the Native Token Observation for DUST generation.

## Testnet Transition (as of late 2025)

- Testnet-02 ran until end of February 2026
- Preview environment maintained by core engineering only (not independent SPOs)
- Moving toward Mōhalu (Incentivized Mainnet)
- Node distribution shifting from Docker-only to pre-compiled binaries
- Registration wizard being removed for scriptable processes
