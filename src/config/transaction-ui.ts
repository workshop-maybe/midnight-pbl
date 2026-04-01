/**
 * Transaction UI Configuration
 *
 * Centralized UI strings and API endpoints for the 4 transaction types
 * used in the Midnight PBL app.
 *
 * @see ~/projects/01-projects/andamio-platform/andamio-app-v2/src/config/transaction-ui.ts
 */

// =============================================================================
// Types
// =============================================================================

/**
 * The 4 transaction types this app supports.
 */
export type TransactionType =
  | "GLOBAL_GENERAL_ACCESS_TOKEN_MINT"
  | "COURSE_STUDENT_ASSIGNMENT_COMMIT"
  | "COURSE_STUDENT_ASSIGNMENT_UPDATE"
  | "COURSE_STUDENT_CREDENTIAL_CLAIM";

/**
 * UI metadata for a transaction type.
 */
export interface TransactionUIConfig {
  /** POST endpoint on the Andamio API (relative to /api/v2) */
  endpoint: string;
  /** Human-readable label for the transaction */
  label: string;
  /** Success message shown after TX completes */
  successMessage: string;
  /** Error message prefix shown on failure */
  errorMessage: string;
  /**
   * Whether this TX requires DB updates after on-chain confirmation.
   * Access token mint does not — assignment and credential TXs do.
   */
  requiresDBUpdate: boolean;
}

// =============================================================================
// Configuration
// =============================================================================

export const TRANSACTION_UI: Record<TransactionType, TransactionUIConfig> = {
  GLOBAL_GENERAL_ACCESS_TOKEN_MINT: {
    endpoint: "/api/v2/tx/global/user/access-token/mint",
    label: "Mint Access Token",
    successMessage: "Access token created! Authenticating...",
    errorMessage: "Failed to mint access token",
    requiresDBUpdate: false,
  },

  COURSE_STUDENT_ASSIGNMENT_COMMIT: {
    endpoint: "/api/v2/tx/course/student/assignment/commit",
    label: "Submit Assignment",
    successMessage: "Assignment submitted!",
    errorMessage: "Failed to submit assignment",
    requiresDBUpdate: true,
  },

  COURSE_STUDENT_ASSIGNMENT_UPDATE: {
    endpoint: "/api/v2/tx/course/student/assignment/update",
    label: "Update Assignment",
    successMessage: "Assignment updated!",
    errorMessage: "Failed to update assignment",
    requiresDBUpdate: true,
  },

  COURSE_STUDENT_CREDENTIAL_CLAIM: {
    endpoint: "/api/v2/tx/course/student/credential/claim",
    label: "Claim Credential",
    successMessage: "Credential claimed!",
    errorMessage: "Failed to claim credential",
    requiresDBUpdate: true,
  },
};

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get UI config for a transaction type.
 */
export function getTransactionUI(txType: TransactionType): TransactionUIConfig {
  return TRANSACTION_UI[txType];
}

/**
 * Check if a string is one of the 4 valid transaction types.
 */
export function isValidTransactionType(
  value: string
): value is TransactionType {
  return value in TRANSACTION_UI;
}

/**
 * Transaction types that require a JWT (user must be authenticated).
 * Access token mint is excluded — first-time users don't have a JWT yet.
 */
export const TX_TYPES_REQUIRING_JWT: TransactionType[] = [
  "COURSE_STUDENT_ASSIGNMENT_COMMIT",
  "COURSE_STUDENT_ASSIGNMENT_UPDATE",
  "COURSE_STUDENT_CREDENTIAL_CLAIM",
];

/**
 * Check if a transaction type requires JWT authentication.
 */
export function requiresJWT(txType: TransactionType): boolean {
  return TX_TYPES_REQUIRING_JWT.includes(txType);
}
