# Lesson 104.1: Build a Privacy-Preserving Application

**SLT:** I can build a privacy-preserving application on Midnight that uses ZK proofs to hide user inputs while updating public state.

**Type:** Developer Documentation

---

## What You're Building

A complete DApp where:
- An instructor deploys a contract and sets a secret answer key
- A learner submits an answer
- The blockchain records whether the answer was correct
- **The answer itself never appears on-chain**

The ZK proof guarantees the check was honest. You can't fake a pass. But failure doesn't reveal what you tried. This is the private-answer contract from Lesson 103.1, now wired to a full TypeScript DApp.

---

## The Contract (Review)

```compact
pragma language_version >= 0.16;
import CompactStandardLibrary;

export ledger answerKeyHash: Bytes<32>;
export ledger lastCorrect: Boolean;
export ledger submissions: Counter;

export circuit setAnswerKey(key: Bytes<32>): [] {
  answerKeyHash = disclose(persistentHash<Bytes<32>>(key));
}

export circuit submitAnswer(answer: Bytes<32>): [] {
  const hash = persistentHash<Bytes<32>>(answer);
  lastCorrect = disclose(hash == answerKeyHash);
  submissions += 1;
}
```

Two circuits. Three public ledger fields. The answer enters `submitAnswer` as a private parameter, gets hashed inside the circuit, compared to the stored hash, and only the boolean result is disclosed.

---

## The TypeScript Stack

The DApp code connects five SDK components:

### 1. Compiled Contract

```typescript
import { CompiledContract } from '@midnight-ntwrk/compact-js';

const PrivateAnswer = await import(pathToFileURL(contractPath).href);

const compiledContract = CompiledContract.make('private-answer', PrivateAnswer.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);
```

`CompiledContract.make` takes the compiled Compact output and wraps it for the SDK. `withVacantWitnesses` tells the SDK this contract doesn't use witness functions — all private data comes through circuit parameters, not through a TypeScript callback. `withCompiledFileAssets` points to the prover/verifier keys and ZKIR files.

**Cardano comparison:** This is like loading your compiled Plutus/Aiken script for use with a transaction builder. The difference is that the compiled output includes ZK circuit artifacts, not just a validator script.

### 2. Wallet

```typescript
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { UnshieldedWallet } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';

const wallet = new WalletFacade(shieldedWallet, unshieldedWallet, dustWallet);
```

Three wallet types combined in a facade:
- **ShieldedWallet** — manages ZSwap keys for shielded token operations
- **UnshieldedWallet** — manages NIGHT (public) transactions
- **DustWallet** — manages DUST generation and spending for gas fees

**Cardano comparison:** On Cardano, a single wallet handles everything. Midnight splits wallets by privacy level because different token types have different visibility guarantees.

### 3. Providers

```typescript
const providers = {
  privateStateProvider: levelPrivateStateProvider({...}),
  publicDataProvider: indexerPublicDataProvider(CONFIG.indexer, CONFIG.indexerWS),
  zkConfigProvider: new NodeZkConfigProvider(zkConfigPath),
  proofProvider: httpClientProofProvider(CONFIG.proofServer, zkConfigProvider),
  walletProvider,
  midnightProvider: walletProvider,
};
```

Six providers wire the DApp to the network:

| Provider | Role | Cardano Equivalent |
|----------|------|-------------------|
| `privateStateProvider` | Stores private state locally (LevelDB) | No equivalent — Cardano has no private state |
| `publicDataProvider` | Reads on-chain state from the indexer | Blockfrost API / Ogmios |
| `zkConfigProvider` | Loads prover/verifier keys for ZK circuits | No equivalent |
| `proofProvider` | Sends circuits to proof server, gets proofs back | No equivalent |
| `walletProvider` | Handles transaction balancing, signing, submission | Wallet connector (CIP-30) |
| `midnightProvider` | Network interaction facade | Node connection |

### 4. Contract Interaction

**Deploying:**

```typescript
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';

const deployed = await deployContract(providers, {
  compiledContract,
  privateStateId: 'privateAnswerState',
  initialPrivateState: {},
});
```

The SDK handles compilation artifact loading, proof generation for the deployment transaction, transaction balancing (DUST fees), and submission. The deployment transaction itself is ZK-proven.

**Calling a circuit:**

```typescript
const tx = await deployed.callTx.submitAnswer(answerBytes);
```

One line. The SDK:
1. Executes the circuit locally with the provided parameter
2. Generates public and private transcripts
3. Sends the circuit + private inputs to the proof server
4. Receives the ZK proof
5. Balances the transaction (DUST fees)
6. Signs and submits
7. Waits for confirmation
8. Returns the transaction result

The `answerBytes` parameter enters the circuit privately. The proof server sees it (necessary for proof generation), but it never appears in the transaction submitted to the network.

**Reading public state:**

```typescript
const contractState = await providers.publicDataProvider.queryContractState(contractAddress);
const ledgerState = PrivateAnswer.ledger(contractState.data);

console.log(`Last correct: ${ledgerState.lastCorrect}`);
console.log(`Submissions: ${ledgerState.submissions}`);
// No "lastAnswer" field — it doesn't exist on this contract
```

The compiled contract module exports a `ledger()` function that deserializes on-chain state into typed fields. For the private contract, there's no `lastAnswer` field to read — it was never declared as a ledger field, because it was never meant to be public.

### 5. Answer Encoding

```typescript
import { createHash } from 'node:crypto';

function textToBytes32(text: string): Uint8Array {
  return createHash('sha256').update(text).digest();
}
```

Text answers are SHA-256 hashed to produce `Bytes<32>` — the type the circuit expects. This happens client-side before the data enters the circuit. The circuit then does its own `persistentHash()` on the input to compare against the stored key hash.

Two hashes:
1. **Client-side SHA-256** — converts text to bytes (encoding, not privacy)
2. **In-circuit `persistentHash()`** — produces the hash stored on-chain (privacy-relevant)

---

## The Full Lifecycle

When a learner submits an answer to the private contract:

```
Learner types "my answer"
    ↓
CLI: SHA-256("my answer") → Bytes<32>
    ↓
SDK: Execute submitAnswer(answerBytes) locally
    ↓ (circuit runs on learner's machine)
Circuit: persistentHash(answer) → compare to answerKeyHash → result = true/false
    ↓
SDK: Generate public transcript (lastCorrect = true, submissions += 1)
     Generate private transcript (answer bytes, intermediate hash)
    ↓
SDK → Proof Server: circuit + private inputs → ZK proof (~1.2s)
    ↓
SDK: Balance transaction (select DUST, generate spend proofs)
    ↓
SDK → Network: submit proven transaction
    ↓
Block producer: verify proof (~6ms), apply state changes
    ↓
Indexer: contract state updated
    ↓
CLI: "The blockchain only knows if you passed — not what you answered."
```

At no point does the raw answer appear on-chain. The proof server saw it (to generate the proof), but the proof server is local infrastructure — it's running on the learner's machine or a trusted server.

---

## What the Public Contract Shows (For Comparison)

The public version of the same app has one extra ledger field and one extra `disclose()`:

```compact
export ledger lastAnswer: Bytes<32>;    // ← this field exists

lastAnswer = disclose(answer);           // ← this line exists
```

When you read the public contract's state, the answer is right there:

```typescript
console.log(`Last answer: ${Buffer.from(ledgerState.lastAnswer).toString('hex')}`);
```

Anyone querying the indexer sees every answer ever submitted. Wrong answers immortalized. Right answers copyable. The private contract avoids this by simply not disclosing the data.

---

## Questions to Consider

- The SDK handles proof generation, transaction balancing, and submission in a single `callTx.submitAnswer()` call. What happens under the hood if the proof server is slow or unreachable? How would you build retry logic or timeout handling?
- The `withVacantWitnesses` flag means this contract gets all private data through circuit parameters, not witness functions. What's the difference? When would you need witness functions instead? (Preview: the bulletin board template uses them for persistent private state.)
- Both contracts use `persistentHash()` for the answer key. This is deterministic — the same input always produces the same hash. If an attacker knows the answer space is small (e.g., multiple choice A/B/C/D), they could hash all options and compare to `answerKeyHash`. How would you defend against this? (Hint: `persistentCommit()` adds randomness.)

---

## What's Next

Lesson 104.2 (already covered) compared the transaction lifecycles side by side. Lesson 104.3 evaluates the cost of privacy — timing, compute, DUST, and the question of when the tradeoff is worth it.

---

## Things to Try

Clone the private-answer project and modify it:

1. Add a `attempts` ledger field (type `Counter`) that counts how many times each unique submitter has tried. What changes about privacy if attempt count is per-user?

2. Change the circuit so that `lastCorrect` is only disclosed if the answer IS correct. If wrong, disclose nothing — the observer can't even tell an attempt was made. What are the tradeoffs?

3. Add a second circuit `checkMyAnswer(answer: Bytes<32>): Boolean` that returns the result to the caller but doesn't update any ledger state. A read-only check. Does this still generate a proof? Does it still cost DUST?
