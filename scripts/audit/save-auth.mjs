// One-shot helper: open a headed Chromium, wait for you to log in, save the
// resulting session (cookies + localStorage) to a storageState file that
// measure-typography.mjs can then load for auth-gated pages.
//
// Usage:
//   BASE_URL=http://localhost:4321 node scripts/audit/save-auth.mjs
//
// The browser opens, you connect your wallet and complete the sign-in flow
// as normal. When authenticated and /dashboard is reachable, come back to
// this terminal and press Enter. The session is written to
//   scripts/audit/.auth/user.json
// and the browser closes.
//
// Wallet-sign flow needs an actual wallet extension, which Playwright's
// default profile does not have. See INJECT_JWT mode below for the
// no-extension workaround:
//
//   INJECT_JWT=<long.jwt.string> INJECT_WALLET_ADDR=addr1... \
//     BASE_URL=https://midnight-pbl.io \
//     node scripts/audit/save-auth.mjs
//
// In INJECT mode we skip the UI login: the script writes the JWT directly
// into localStorage keys the app already uses, then saves storageState.
// Fastest path when you already have a valid JWT from a normal browser
// session (DevTools → Application → localStorage → midnight_pbl_jwt).

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import readline from "node:readline";

const BASE_URL = (process.env.BASE_URL || "https://midnight-pbl.io").replace(/\/$/, "");
const OUT_PATH = process.env.STORAGE_STATE || "scripts/audit/.auth/user.json";
const INJECT_JWT = process.env.INJECT_JWT;
const INJECT_WALLET_ADDR = process.env.INJECT_WALLET_ADDR;

const JWT_KEY = "midnight_pbl_jwt";
const WALLET_KEY = "midnight_pbl_wallet";

function pressEnter(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  mkdirSync(dirname(OUT_PATH), { recursive: true });

  const browser = await chromium.launch({ headless: Boolean(INJECT_JWT) });
  const context = await browser.newContext();
  const page = await context.newPage();

  if (INJECT_JWT) {
    // Land on the origin so we can set localStorage for this origin.
    await page.goto(BASE_URL);
    await page.evaluate(
      ({ jwt, addr, jwtKey, walletKey }) => {
        localStorage.setItem(jwtKey, jwt);
        if (addr) localStorage.setItem(walletKey, addr);
      },
      { jwt: INJECT_JWT, addr: INJECT_WALLET_ADDR, jwtKey: JWT_KEY, walletKey: WALLET_KEY }
    );
    // Verify by hitting /dashboard.
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    const url = page.url();
    if (url.includes("/dashboard")) {
      console.error(`[ok] /dashboard reachable with injected JWT.`);
    } else {
      console.error(`[warn] After injection, ended on ${url} — JWT may be invalid or expired.`);
    }
    await context.storageState({ path: OUT_PATH });
    console.error(`[done] storage state saved → ${OUT_PATH}`);
    await browser.close();
    return;
  }

  await page.goto(BASE_URL);
  console.error(
    `\nBrowser opened at ${BASE_URL}.\n` +
      `Complete the wallet connect + sign-in flow. When /dashboard loads,\n` +
      `return to this terminal and press Enter to save the session.\n`
  );
  await pressEnter("Press Enter when signed in... ");

  await context.storageState({ path: OUT_PATH });
  console.error(`[done] storage state saved → ${OUT_PATH}`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
