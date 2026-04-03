# Context Gathering Results

Session: 2026-04-03
Phase: 4 (readiness-assessed) → ready for Phase 5-7

## Central Course Insight

Hello world has ZERO private state. Bulletin board has a secret key that never leaves your machine.

`disclose()` is the bridge:
- Hello world: `disclose(customMessage)` — private input becomes public. That's all it does.
- Bulletin board: `disclose(publicKey(localSecretKey(), sequence))` — the HASH of private data becomes public. The private data itself stays in local LevelDB and only enters the ZK proof circuit.

**The whole Midnight value proposition in two code examples: you choose what crosses the boundary.**

The course walks learners from "everything public" (hello world) to "selective disclosure" (bulletin board) across six modules.

## Custom Example Pair (to build next session)

The Midnight docs examples (hello-world, bulletin board) teach the mechanics but aren't ours. We're building a unique pair that makes the same insight land through Andamio's domain:

### Public version: `submitAnswer(answer)`
```compact
export circuit submitAnswer(answer: Opaque<"string">): [] {
  result = disclose(answer);
}
```
Your answer is disclosed. Everyone sees it. Wrong answers are immortalized on-chain. This is how most blockchains work.

### Private version: `submitAnswer(answer)`
```compact
witness localAnswer(): Opaque<"string">;

export circuit submitAnswer(answer: Opaque<"string">): [] {
  result = disclose(checkAnswer(answer));  // only true/false crosses the boundary
}
```
Only "correct" or "incorrect" is public. The ZK proof guarantees a real answer was submitted — you can't fake a pass. But your wrong answer doesn't expose what you tried.

**Same function name. Same learner action. The only difference is what crosses the `disclose()` boundary.**

This is falsifiable, privacy-preserving assessment. The Andamio connection: When should proof of learning be public? When should only the outcome be visible?

### Next steps for the examples
- [ ] Design the `checkAnswer` circuit — how does it verify correctness without a witness providing the answer key?
- [ ] Decide: does the answer key come from a witness (instructor's private state) or is it hashed on-chain?
- [ ] Build both contracts in `contract/` directory
- [ ] Build a CLI that lets learners submit answers to both versions and see the difference
- [ ] Write the lesson that walks through the comparison

## Working Environment

### Sandbox location
`~/projects/03-resources/midnight/midnight-pbl-test-app/` — has a deployed hello-world contract on preprod.

### Working version combo (CRITICAL)
- **Compact CLI**: 0.5.1 (`~/.local/bin/compact`)
- **Compact compiler**: 0.29.0 (`compact update 0.29.0`)
- **compact-runtime**: 0.14.0
- **SDK packages**: 3.0.0 (all `@midnight-ntwrk/midnight-js-*`)
- **Proof server**: `docker run -p 6300:6300 midnightntwrk/proof-server:latest midnight-proof-server -v` (NOT docker-compose, NOT version-pinned)
- **Node.js**: v23.5.0
- **create-mn-app**: 0.3.26

### Version pitfalls documented
1. `create-mn-app@0.3.26` + `compact update` (latest=0.30.0) = broken. Compiler output expects compact-runtime 0.15.0 but scaffolder installs 0.14.0.
2. Scaffolder's `docker-compose.yml` forces `platform: linux/amd64` — kills proof generation on Apple Silicon. Fix: remove that line, or run proof server manually.
3. Updating compact-runtime to 0.15.0 breaks SDK (ContractMaintenanceAuthority error). The full SDK 3.0.0 is not compatible with runtime 0.15.0.
4. Deleting `package-lock.json` causes npm to resolve `ledger-v8` as transitive dep, breaking everything. Never delete the lock file.
5. Proof provider has a default timeout of 300,000ms (5 min). May need increase for cold starts: `httpClientProofProvider(url, zkConfig, { timeout: 1_200_000 })`.

### Deployed contract
- **Address**: `72bd2d70218ca788140d170272e3b19c1e948dd2a2895cbd77d6ef3657492c1c`
- **Network**: preprod
- **Wallet seed**: saved in `~/projects/03-resources/midnight/midnight-pbl-test-app/.midnight-seed`
- **Wallet address**: `mn_addr_preprod176unf5u4u7equ0y6mwjh92af37kgvjpsft6j7kad6m9rajwdndyqjsm404`
- **Message stored**: "Hello from Midnight Project-Based Learning" at block 190193

### Bulletin board scaffold
`~/projects/03-resources/midnight/midnight-pbl-bboard/` — not deployed, used for source inspection only.

## Toolchain Installation (for Lesson 101.1)

### Prerequisites
- Google Chrome, VS Code, Docker Desktop, Lace Wallet (beta)
- Linux or Mac only (no Windows)

### Installation sequence
```bash
# 1. Install Compact CLI
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
source ~/.zshrc

# 2. Pin compiler to 0.29.0 (not latest!)
compact update 0.29.0

# 3. Start proof server (keep this terminal open)
docker run -p 6300:6300 midnightntwrk/proof-server:latest midnight-proof-server -v

# 4. Scaffold (in a new terminal)
npx create-mn-app my-app
# Pick: Contract > Hello World

# 5. Fix runtime version
cd my-app
npm install @midnight-ntwrk/compact-runtime@0.14.0
rm -rf contracts/managed
npm run compile
npm run deploy
```

### Wallet reuse across projects
```bash
# Copy seed from one project to another
cp ../other-project/.midnight-seed .
# Deploy will detect saved seed and offer to reuse it
npm run deploy
# Choose: "Use saved wallet? [Y/n] y"
```

## Timing Data (for SLT 101.3)

| Phase | Time |
|-------|------|
| Compact compile (hello-world, k=6) | ~0.4 seconds |
| First wallet sync | Several minutes |
| Faucet to wallet | ~2-3 minutes |
| Proof generation (contract deploy) | ~0.5 seconds |
| Proof generation (storeMessage tx) | ~1.2 seconds (2 proofs) |
| Full transaction round-trip | ~60 seconds |
| Proof server startup + key download | ~7 seconds |

**Key insight**: Proof generation is fast (~1s). 98% of transaction time is network (wallet balancing, submission, block confirmation).

## Scaffolder Output: Project Types

### `create-mn-app` v0.3.26 offers:

**Project types:**
1. Contract — deploy and test contracts
2. Full DApp — full application with UI
3. Connector — (Coming Soon)

**Contract templates:**
- Hello World (only option under Contract type)

**Full DApp templates** (via `--template` flag):
- `hello-world`, `counter`, `bboard`

### Contract vs Full DApp structure

| | Contract (hello-world) | Full DApp (bulletin board) |
|---|---|---|
| Structure | Single package.json, flat | Monorepo: contract/, api/, cli/, ui/ |
| Compact contract | 1 circuit, no witness | 3 circuits, witness function |
| Private state | None (withVacantWitnesses) | BBoardPrivateState with secret key |
| TypeScript | Deploy + interact scripts | Typed API layer, observable state |
| Privacy | Everything disclosed | Secret key stays private, only hash goes public |

## Key Teaching Examples

### 1. `disclose()` means PUBLIC — anyone can read it
```bash
curl -s -X POST https://indexer.preprod.midnight.network/api/v3/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ contractAction(address: \"72bd2d70218ca788140d170272e3b19c1e948dd2a2895cbd77d6ef3657492c1c\") { state } }"}'
```
Decodes to: `midnight:contract-state[v6]:8 ... Hello from Midnight Project-Based Learning`

No wallet, no SDK, no auth needed. Just the contract address + a curl command.

### 2. Midnight contracts vs Cardano tx metadata

| | Cardano Metadata | Midnight Contract State |
|---|---|---|
| What it is | Arbitrary JSON blob attached to tx | Typed fields in contract public ledger |
| Validation | None — any bytes go in | ZK-proven — circuit enforces data rules |
| Queryability | By tx hash, requires custom indexing | By contract address, GraphQL out of the box |
| Structure | Untyped (integer keys to CBOR values) | Typed by Compact contract definition |
| Verification | "This blob was in this tx" | "This state transition was proven correct" |

**Teaching hook**: "On Cardano, you attach data to transactions. On Midnight, you define data in your contract — and the ZK proof guarantees it got there correctly."

### 3. Witness function pattern (from bulletin board)
```compact
witness localSecretKey(): Bytes<32>;

export circuit post(newMessage: Opaque<"string">): [] {
  owner = disclose(publicKey(localSecretKey(), sequence as Field as Bytes<32>));
  message = disclose(some<Opaque<"string">>(newMessage));
}
```
```typescript
export const witnesses = {
  localSecretKey: ({ privateState }: WitnessContext<Ledger, BBoardPrivateState>):
    [BBoardPrivateState, Uint8Array] => [privateState, privateState.secretKey],
};
```
Secret key flows into ZK proof circuit but never hits the public ledger. Only a hash is disclosed.

### 4. SDK provider stack
| Provider | Package | Purpose |
|----------|---------|---------|
| privateStateProvider | midnight-js-level-private-state-provider | LevelDB for contract private state |
| publicDataProvider | midnight-js-indexer-public-data-provider | GraphQL to indexer |
| zkConfigProvider | midnight-js-node-zk-config-provider | Compiled circuit artifacts |
| proofProvider | midnight-js-http-client-proof-provider | Proof requests to proof server |
| walletProvider | Custom (WalletFacade) | Balancing, signing, submission |

### 5. Three wallet types in WalletFacade
- **ShieldedWallet** — Zswap (privacy-preserving transfers)
- **UnshieldedWallet** — NIGHT token management
- **DustWallet** — DUST fee management (gas token)

Key derivation: `HDWallet` with three roles: `Roles.Zswap`, `Roles.NightExternal`, `Roles.Dust`

## Research Results

### Sponsored Transactions (SLT 105.2) — DEFER
- No developer-facing API exists yet
- Whitepaper describes DUST sponsorship as first-class concept
- DUST Capacity Exchange planned for Mohalu phase (mid-2026)
- `payFees: false` option exists in facade SDK — plumbing being built
- Workaround: developer backend wallet fronts DUST fees server-side
- **SLT 105.2 should be deferred or rewritten as conceptual exploration**

### MIP Deployment Process (SLT 105.3) — READY
- MIP repo: `github.com/midnightntwrk/midnight-improvement-proposals`
- 3-dimension risk rubric confirmed at `mps/contract-deployment-rubric.md`:
  - Privacy-at-Risk (1-3): what leaks if ZK fault?
  - Value-at-Risk (1-3): how much can users lose?
  - State-Space-at-Risk (1-3): how much ledger state generated?
- Score of 3 in ANY dimension blocks deployment
- Process: fork repo → `mps/deployments/your-app.md` with self-assessment → PR → review
- Real examples: PR #73 (Proof of Spy, 1/1/1), PR #72 (Sundae demos, 1/1/1 and 1/1/2)

### Cross-Chain Interop (SLTs 106.1, 106.3) — READY
- **No DApp-level cross-chain**: Compact cannot query Cardano state
- **Infrastructure-level only**: Midnight node reads Cardano via db-sync + mainchain-follower
- **Validator sharing works**: Cardano SPOs register as Midnight validators, 180+ on Testnet-02
- **Token observation**: cNIGHT on Cardano → DUST on Midnight (one-directional)
- **No bridge for arbitrary tokens, no oracle, no cross-chain contract calls**
- **Dual-chain app pattern**: off-chain coordinator submits to both chains independently

## SLT Readiness After Context Gathering

| SLT | Status | Notes |
|-----|--------|-------|
| 101.1 | **Ready** | Full procedure documented with pitfalls |
| 101.2 | **Ready** | Project structure + Cardano comparisons |
| 101.3 | **Ready** | Timing data gathered |
| 102.1-3 | **Ready** | Were already ready (stable concepts) |
| 103.1 | **Ready** | hello-world.compact with disclose() |
| 103.2 | **Ready** | Privacy model comparison material |
| 103.3 | **Ready** | Witness function from bboard |
| 104.1 | **Partially ready** | Bboard source gives the pattern; custom example will complete it |
| 104.2 | **Ready** | Tx lifecycle comparison material |
| 104.3 | **Ready** | Timing data + proof server benchmarks |
| 105.1 | **Ready** | NIGHT/DUST flow observed live |
| 105.2 | **Defer** | Sponsored tx API doesn't exist yet |
| 105.3 | **Ready** | MIP rubric + real examples |
| 106.1 | **Ready** | Cross-chain research complete |
| 106.2 | **Ready** | Was already ready |
| 106.3 | **Ready** | Open questions documented |

**17 of 18 SLTs ready. 1 deferred (105.2).**

## Next Session Plan

1. **Build custom example contracts** — the submitAnswer public/private pair
2. **Resume `/coach:course-workflow`** — Phase 5 (delegation map), Phase 6 (gather screenshots/code), Phase 7 (write lessons)
3. **Start with the 8 Exploration SLTs** — they're the conceptual backbone, all fully ready
4. **Then Developer Documentation SLTs** — using custom examples instead of Midnight's docs examples
