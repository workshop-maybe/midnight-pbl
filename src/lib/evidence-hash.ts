/**
 * Deterministic hashing of TipTap JSONContent for on-chain evidence commitment.
 *
 * Uses blake2b (32-byte output → 64-char hex) with key-sorted normalization
 * to ensure identical content always produces the same hash regardless of
 * JSON key ordering.
 *
 * @see ~/projects/01-projects/andamio-platform/andamio-app-v2/src/lib/hashing.ts
 */

import { blake2b } from "blakejs";
import type { JSONContent } from "@tiptap/core";

/**
 * Recursively normalize a JSONContent tree by sorting object keys.
 * Arrays preserve order; objects get alphabetically sorted keys.
 */
function normalizeContentStructure(content: JSONContent): JSONContent {
  if (!content || typeof content !== "object") {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map(normalizeContentStructure);
  }

  const normalized: JSONContent = {};
  const sortedKeys = Object.keys(content).sort();

  sortedKeys.forEach((key) => {
    normalized[key] = normalizeContentStructure(content[key] as JSONContent);
  });

  return normalized;
}

/**
 * Hash TipTap JSON content using blake2b.
 * Returns a 64-character hex string (32 bytes).
 */
export function hashEvidence(content: JSONContent): string {
  const normalized = normalizeContentStructure(content);
  const hash = blake2b(Buffer.from(JSON.stringify(normalized)), undefined, 32);
  return Buffer.from(hash).toString("hex");
}
