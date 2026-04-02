# Quickstart Comparison — Academy vs Docs

Date: 2026-04-02
Status: Planning doc — will cover with hands-on example

## Two Different Quickstarts Exist

### Academy Quickstart (Lesson)
- Manual install of every tool: Node.js, Compact compiler, Docker, proof server, VS Code extension, Lace wallet, faucet
- Step-by-step, hand-holding approach
- Extensive troubleshooting (WSL, PATH, version mismatches)
- End state: tools installed, nothing built yet
- Contract compilation and deployment come in later lessons
- Time to deployed contract: multiple lessons

### Docs Quickstart (`create-mn-app`)
- `npx create-mn-app [project-name]` scaffolds everything
- Proof server via docker-compose, started by `npm run setup`
- CLI generates wallet seed — no Lace browser extension needed
- Templates: Hello world, Counter, Bulletin board
- End state: deployed contract on Preprod, interactive CLI to call it
- Time to deployed contract: ~10 minutes

## Comparison

| | Academy | Docs |
|---|---|---|
| Goal | Install tools manually | Get to a working DApp |
| Proof server | Manual `docker run` | `docker-compose.yml` + `npm run setup` |
| Wallet | Lace browser extension, manual | CLI-generated seed, no browser |
| Contract | Not until later lessons | Compiled and deployed during setup |
| Troubleshooting | Extensive | Minimal — tooling handles it |
| End state | Tools ready | Deployed contract + CLI interaction |

## PBL Approach

**Start with the docs approach.** Get learners to a deployed contract immediately using `create-mn-app`. Build first, understand the plumbing second.

The manual setup knowledge (Academy style) comes later when learners need to understand what's under the hood — proof server internals, compiler flags, wallet architecture. That's the "why does this work?" layer, not the starting point.

### Hands-on Plan

1. **First touch:** `npx create-mn-app` → pick template → `npm run setup` → deployed contract in minutes
2. **Interact:** Use the CLI to store a message, read it, check balance. Feel the proof generation time.
3. **Inspect:** Look at what `create-mn-app` actually generated. Open the `.compact` file. Read `docker-compose.yml`. Understand what `npm run setup` did for you.
4. **Modify:** Change the contract. Redeploy. See the cycle.
5. **Go deeper (later):** Manual proof server setup, compiler options, wallet internals — when the learner needs to know, not before.

### Project Structure to Teach

```
my-app/
├── contracts/
│   └── hello-world.compact    # Compact smart contract
├── src/
│   ├── cli.ts                 # Interact with deployed contract
│   ├── deploy.ts              # Deploy contract to Preprod
│   └── check-balance.ts       # Check wallet balance
├── docker-compose.yml         # Proof server config
├── package.json
└── deployment.json            # Wallet seed + contract address
```

### Hello World Contract (Starting Point)

```compact
pragma language_version 0.22;

export ledger message: Opaque<"string">;

export circuit storeMessage(newMessage: Opaque<"string">): [] {
  message = disclose(newMessage);
}
```

Key teaching moments in this tiny contract:
- `export ledger` = public state (on the blockchain)
- `circuit` = function that generates a ZK proof
- `disclose()` = explicitly moving data from private to public
- This is the client-side/server-side split in action — `newMessage` starts private, `disclose` makes it public

### Templates as Learning Progression

| Template | What it teaches |
|---|---|
| Hello world | Basic contract, public state, deploy/interact cycle |
| Counter | State mutation, increment/decrement, multiple circuit functions |
| Bulletin board | ZK proofs for identity, privacy-preserving posting, owner verification without revealing identity |

The bulletin board template is the most interesting for Andamio comparison — it's doing anonymous verified posting, which is the inverse of Andamio's model (attributed verified contribution).

### Comparison to Andamio Dev Tooling

`create-mn-app` is a good onramp pattern. Worth noting how this compares to Andamio's developer experience:
- Andamio CLI for project setup
- Template-based scaffolding
- Time-to-first-deployment as a key metric

The quality of the "first 10 minutes" experience determines whether a developer sticks around.
