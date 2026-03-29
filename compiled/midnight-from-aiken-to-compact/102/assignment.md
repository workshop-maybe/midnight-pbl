# Module Assignment

## Task

Install the Compact toolchain, compile both example contracts (counter and bulletin board), deploy the counter to preprod (or standalone), and document the artifacts and workflow. This is a hands-on module where your deliverables prove you have a working development environment and understand the compilation and deployment pipeline.

## Deliverables

1. Setup verification: output of `compact --version`, `compact compile --version`, and proof server health check (`curl -s http://localhost:6300 -o /dev/null -w "%{http_code}"`)
2. Compilation analysis: for both the counter and bulletin board contracts, report the number of provable vs pure circuits, proving key and verification key sizes, and how `Maybe<Opaque<"string">>` in Compact maps to TypeScript in the generated `index.d.ts`
3. Deployment walkthrough: deploy the counter contract to preprod (or standalone), record the contract address, increment three times noting proof generation time for each, confirm the counter reads 3, then exit and rejoin using saved seed and contract address to verify state persistence

## Notes

**Estimated time:** 90-120 minutes (includes toolchain installation and first-compilation parameter download)

**Prerequisites:** macOS or Linux, Docker Desktop running, Node.js v22.15+

**Common issues:** first compilation downloads ~500MB universal parameters; Apple Silicon Macs may need Docker VMM enabled; DUST generation takes time after faucet funding
