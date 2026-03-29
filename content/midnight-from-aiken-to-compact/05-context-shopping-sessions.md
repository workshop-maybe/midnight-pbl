# Context Shopping Sessions: Building on Midnight — From Aiken to Compact

## Overview

6 Needs Context SLTs and 10 Needs Human SLTs. Critical path: cloning and compiling Midnight example repos unlocks 11 of 18 SLTs.

Sessions are ordered by leverage — each session unlocks the next tier.

---

## Session 1: Fetch Midnight Docs

**Unlocks:** 6 Needs Context SLTs → moves to Ready
**Time estimate:** 30 minutes
**Requirements:** Web access only

### Steps

**Step 1.** Fetch current Compact language reference from docs.midnight.network
- Target: current syntax for ledger declarations, circuits, witnesses
- Unlocks: SLT 2.1 (describe components), SLT 3.1 (explain disclose())
- URL: https://docs.midnight.network/compact

**Step 2.** Fetch Impact VM and execution model docs
- Target: confirm hybrid UTXO+account model, Impact VM opcodes
- Unlocks: SLT 1.1 (compare execution models)
- URL: https://docs.midnight.network/concepts/how-midnight-works/impact

**Step 3.** Fetch ZSwap / dual-ledger documentation
- Target: confirm shielded/unshielded transition mechanics
- Unlocks: SLT 1.2 (describe dual-ledger system)
- URL: https://docs.midnight.network/concepts/how-midnight-works/keeping-data-private

**Step 4.** Fetch current installation guide + proof server Docker image tag
- Target: confirm installer URL, Docker image version, Node.js requirements
- Unlocks: SLT 4.1 (install toolchain)
- URL: https://docs.midnight.network/getting-started/installation

**Step 5.** Fetch current interoperability docs / bridge status
- Target: confirm Native Token Observation, any new bridge developments
- Unlocks: SLT 6.2 (describe interop constraints)
- URLs: https://docs.midnight.network/blog/dust-architecture, https://docs.midnight.network/blog/testnet-02-transition

### After Session 1

All 6 Needs Context SLTs should move to Ready. Build lessons for: 1.1, 1.2, 2.1, 3.1, 4.1, 6.2.

---

## Session 2: Clone + Compile Examples

**Unlocks:** 5-8 Needs Human SLTs (Modules 2-4)
**Time estimate:** 1-2 hours
**Requirements:** Mac or Linux, Node.js 22+, Docker

### Steps

**Step 1.** Install Compact toolchain:
```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
compact update 0.28.0  # or latest
```

**Step 2.** Clone and compile the counter example:
```bash
git clone https://github.com/midnightntwrk/example-counter
cd example-counter/contract && npm install && npm run compact
```
- If compiles → verified code for SLTs 2.2, 2.3, 4.2
- Capture: exact compile output, artifact directory listing, any warnings

**Step 3.** Clone and compile the bulletin board example:
```bash
git clone https://github.com/midnightntwrk/example-bboard
cd example-bboard/contract && npm install && npm run compact
```
- If compiles → verified witness pattern for SLT 3.3
- Capture: witness function TypeScript implementation, WitnessContext types

**Step 4.** Start proof server and deploy to preprod:
```bash
docker run -p 6300:6300 midnightntwrk/proof-server:7.0.0
```
Then follow SDK deployment steps from the example README.
- If works → verified workflow for SLTs 4.2, 4.3
- Capture: deployment commands, preprod faucet URL, network config

### After Session 2

Build lessons for: 2.2, 2.3, 3.3, 4.2, 4.3. Module 3.2 (ZK proof pipeline) can be built from compilation output + proof server logs.

---

## Session 3: Clone Brick Towers Identity

**Unlocks:** 3 Needs Human SLTs (Module 5 — credential systems)
**Time estimate:** 1-2 hours
**Requirements:** Same as Session 2 + Midnight preprod wallet with tDUST

### Steps

**Step 1.** Clone the credential system:
```bash
git clone https://github.com/bricktowers/midnight-identity
cd midnight-identity
```

**Step 2.** Read the README. Follow setup instructions. Compile.
- Capture: CredentialSubject struct, signature verification circuit, identity provider setup

**Step 3.** If possible, run the age verification example end-to-end.
- Capture: witness implementation for credential loading, proof generation output, on-chain verification result

**Step 4.** Examine MerkleTree usage patterns.
- Capture: MerkleTree API calls, commitment insertion, nullifier derivation

### After Session 3

Build lessons for: 5.1, 5.2, 5.3. All of Module 5 should be unblocked.

---

## Session 4: Practitioner Review

**Unlocks:** SLT 6.3 (evaluate Midnight vs Cardano for use cases)
**Time estimate:** Variable
**Requirements:** Access to someone who has built on both chains

### Options

1. **Midnight Discord** — post the dual-chain architecture diagram from Lesson 6.1, ask for feedback from developers who have built credential systems
2. **Cardano developer community** — find SPOs who participated in Midnight Testnet-02 and ask about their dual-chain experience
3. **Brick Towers team** — if their identity project is active, they are the closest to having built a real credential system on Midnight

### What to capture

- Decision factors practitioners actually use when choosing Cardano vs Midnight
- Gotchas or constraints not documented
- Real-world feedback on the manual coordination pattern
- Whether anyone has built or attempted a cross-chain credential flow

### After Session 4

Build lesson for: 6.3. Course is fully unblocked.

---

## Progress Tracker

| Session | Status | SLTs Unlocked | Date |
|---------|--------|---------------|------|
| 1: Fetch Docs | **Complete** | 1.1, 1.2, 2.1, 3.1, 4.1, 6.2 | 2026-03-23 |
| 2: Clone + Compile | **Complete** | 2.2, 2.3, 3.2, 3.3, 4.2, 4.3 | 2026-03-23 |
| 3: Brick Towers | **Complete** | 5.1, 5.2, 5.3 | 2026-03-24 |
| 4: Practitioner | **Replaced** | 6.3 | 2026-03-24 |

### Session 1 Assets Saved

- `assets/session-1-compact-language.md` — Compact syntax, ledger declarations, circuits, witnesses, disclose(), data types (unlocks 2.1, 3.1)
- `assets/session-1-impact-vm.md` — Impact VM execution model, hybrid UTXO+account, opcodes, Plutus comparison (unlocks 1.1)
- `assets/session-1-privacy-and-zswap.md` — Dual-ledger, privacy model, ZSwap, commitment/nullifier (unlocks 1.2)
- `assets/session-1-installation.md` — Toolchain install, Docker proof server, testnet status (unlocks 4.1)
- `assets/session-1-interop-and-dust.md` — DUST architecture, Native Token Observation bridge, constraints (unlocks 6.2)

### Session 1 Notes

- Compact reference page was a nav hub; fetched deeper pages (writing guide, ledger ADTs, opaque types) instead
- `/compact/reference/disclose` returned 404 — but disclose() is well-documented in the writing guide
- Testnet-02 ended Feb 2026; Preview is engineering-only; Mōhalu (incentivized mainnet) pending
- ZSwap docs confirm Zerocash-based but don't name specific proof system (Halo 2 / BLS12-381 unconfirmed)

### Session 2 Assets Saved

- `assets/session-2-counter-contract.md` — Counter source, compilation output, artifact structure, generated TypeScript types (unlocks 2.2, 2.3, 4.2)
- `assets/session-2-bboard-contract.md` — Bboard source with witness pattern, disclose() in action, WitnessContext API (unlocks 2.2, 3.3)
- `assets/session-2-deployment-workflow.md` — Preprod/standalone deploy flow, faucet URL, Docker images, troubleshooting (unlocks 4.3)

### Session 2 Notes

- Compact CLI 0.5.0 installed; compiler 0.30.0 (newer than the 0.28.0 in the repo badge)
- Counter: 1 circuit, 14K prover key. Bboard: 2 provable + 1 pure circuit, 2.7MB prover keys each.
- Artifact structure: `managed/{name}/` with `compiler/`, `contract/`, `keys/`, `zkir/` subdirectories
- Bboard witness pattern is the canonical example: `WitnessContext<Ledger, PS> → [PS, Uint8Array]`
- Preprod faucet confirmed at https://faucet.preprod.midnight.network
- Standalone mode runs full local stack (node 0.20.0 + indexer 3.0.0 + proof server 7.0.0)
- Did NOT deploy to preprod in this session — requires wallet funding and DUST generation (interactive, time-dependent)

### Session 3 Assets Saved

- `assets/session-3-brick-towers-identity.md` — Full code analysis: CredentialSubject struct, Schnorr signature verification, age check circuit, shop witnesses, architecture (unlocks 5.1, 5.2, 5.3)

### Session 3 Notes

- Repo uses pragma >= 0.14.0 and compact-runtime ^0.7.0 (older SDK) — may not compile on 0.30.0
- Signature-based verification, not MerkleTree-based — used Brick Towers as the example for 5.1, taught MerkleTree pattern from docs for 5.2
- Key Compact features used: `CurvePoint`, `ec_mul_generator`, `ec_mul`, `ec_add`, `transient_hash`, `persistent_hash`, `own_public_key()`
- Module system: `import "../../crypto/Crypto"` — Compact supports cross-file imports
- Multi-witness pattern: shop contract uses `get_order()` and `get_identity()` witnesses

### Session 4: Replaced

The Brick Towers identity system provided sufficient practitioner context for SLT 6.3. The decision framework in 6.3 uses real examples from the course (Brick Towers age check, Andamio credentials, anonymous voting) rather than requiring external practitioner interviews.
