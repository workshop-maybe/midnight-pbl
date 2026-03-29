/**
 * Wallet address utilities
 *
 * Defensive helper for getting a bech32 wallet address from Mesh SDK.
 * Tries v2 API first, falls back to v1, handles hex-to-bech32 conversion.
 *
 * NO direct Mesh SDK module-level imports — the @meshsdk/core import
 * is lazy (dynamic import) so this file is safe to import from .client.tsx
 * files without SSR issues.
 *
 * @see ~/projects/01-projects/cardano-xp/src/lib/wallet-address.ts — Reference
 */

/**
 * Minimal wallet interface for address retrieval.
 * Matches both Mesh SDK v1 and v2 wallet shapes.
 */
interface WalletLike {
  getChangeAddressBech32?: () => Promise<string>;
  getChangeAddress?: () => Promise<string>;
}

/**
 * Get the wallet's change address in bech32 format.
 *
 * Strategy:
 * 1. Try v2 `getChangeAddressBech32()` — returns bech32 directly
 * 2. Fall back to `getChangeAddress()` — may return hex or bech32
 * 3. If hex, lazy-import @meshsdk/core for conversion
 */
export async function getWalletAddressBech32(
  wallet: WalletLike
): Promise<string> {
  // v2: explicit bech32 method
  if (typeof wallet.getChangeAddressBech32 === "function") {
    try {
      return await wallet.getChangeAddressBech32();
    } catch {
      // Method exists but threw — fall through
    }
  }

  // v1 fallback
  if (typeof wallet.getChangeAddress !== "function") {
    throw new Error("Wallet does not support getChangeAddress");
  }

  const rawAddress = await wallet.getChangeAddress();

  if (!rawAddress || typeof rawAddress !== "string" || rawAddress.length < 10) {
    throw new Error("Wallet returned invalid address");
  }

  // Already bech32
  if (rawAddress.startsWith("addr")) {
    return rawAddress;
  }

  // Hex → bech32 via lazy import (avoids SSR WASM crash)
  const { core } = await import("@meshsdk/core");
  const addressObj = core.Address.fromString(rawAddress);
  if (!addressObj) {
    throw new Error(
      `Failed to parse wallet address: ${rawAddress.slice(0, 20)}...`
    );
  }
  return addressObj.toBech32();
}
