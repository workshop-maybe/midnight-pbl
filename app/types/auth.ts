/**
 * Auth type exports — server-importable, NO Mesh SDK imports.
 *
 * These types define the auth state shape and can be safely imported
 * from any file, including server-side loaders. Mesh SDK types
 * (which require WASM) are never referenced here.
 */

// =============================================================================
// User
// =============================================================================

/**
 * Authenticated user info extracted from JWT + wallet.
 */
export interface AuthUser {
  /** User alias from access token (e.g., "CMI663VI") */
  alias: string;
  /** Wallet address in bech32 format */
  address: string;
}

// =============================================================================
// Auth State
// =============================================================================

/**
 * Discrete auth states — mirrors the state machine in the plan.
 *
 * DISCONNECTED → WALLET_CONNECTED → SCANNING_TOKEN → AUTO_AUTH / NEEDS_REGISTRATION → AUTHENTICATED
 */
export type AuthState =
  | "DISCONNECTED"
  | "WALLET_CONNECTED"
  | "SCANNING_TOKEN"
  | "AUTHENTICATING"
  | "AUTHENTICATED"
  | "NEEDS_REGISTRATION"
  | "AUTH_ERROR";

// =============================================================================
// Context Value
// =============================================================================

/**
 * Shape of the auth context provided to the component tree.
 */
export interface AuthContextValue {
  /** Current discrete auth state */
  authState: AuthState;

  /** Whether the user is fully authenticated with a valid JWT */
  isAuthenticated: boolean;

  /** Authenticated user info (null when not authenticated) */
  user: AuthUser | null;

  /** Current JWT (null when not authenticated) */
  jwt: string | null;

  /** Whether an auth flow is in progress */
  isAuthenticating: boolean;

  /** Human-readable auth error (null when no error) */
  authError: string | null;

  /** Whether a CIP-30 wallet is connected (may not be authenticated yet) */
  isWalletConnected: boolean;

  /** Trigger the full auth flow (nonce → sign → validate → JWT) */
  authenticate: () => Promise<void>;

  /** Clear auth state and disconnect wallet */
  logout: () => void;

  /** Refresh auth state from stored JWT (e.g., after minting access token) */
  refreshAuth: () => void;

  /** Fetch wrapper that injects Authorization header */
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;

  /** Whether the access token scan failed (transient error) */
  scanFailed: boolean;

  /** Retry scanning for the access token UTXO */
  retryScan: () => void;

  /** Skip scan retry and go directly to registration */
  goToRegistration: () => void;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Response from POST /api/v2/auth/login/session
 */
export interface LoginSession {
  id: string;
  nonce: string;
  expires_at: string;
}

/**
 * Wallet signature from CIP-30 signData
 */
export interface WalletSignature {
  signature: string;
  key: string;
}

/**
 * Response from POST /api/v2/auth/login/validate
 */
export interface ValidateResponse {
  jwt: string;
  user: {
    id: string;
    cardano_bech32_addr: string;
    access_token_alias: string | null;
    created_at?: string;
    updated_at?: string;
  };
}
