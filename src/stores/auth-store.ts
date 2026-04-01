/**
 * Auth Store — Vanilla Zustand store for authentication state
 *
 * Vanilla store (no React dependency) that manages auth state across
 * independently hydrated Astro islands. Because Astro islands are
 * separate React roots, they can't share React context. This store
 * lives at module level and is shared by all islands.
 *
 * Persists JWT and wallet address to localStorage.
 * On creation, attempts to restore state from stored JWT.
 *
 * @see @/lib/andamio-auth.ts — JWT utilities
 * @see @/types/auth.ts — AuthUser, AuthState types
 */

import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import {
  getStoredJWT,
  isJWTExpired,
  decodeJWTPayload,
  storeJWT,
  clearJWT,
} from "@/lib/andamio-auth";
import { AuthExpiredError, withTimeout } from "@/lib/api-utils";
import type { AuthUser, AuthState } from "@/types/auth";

// =============================================================================
// Constants
// =============================================================================

const WALLET_STORAGE_KEY = "midnight_pbl_wallet";

// =============================================================================
// Types
// =============================================================================

export type AuthStatus = AuthState;

interface AuthStoreState {
  status: AuthStatus;
  user: AuthUser | null;
  jwt: string | null;
  walletAddress: string | null;
  error: string | null;
}

interface AuthStoreActions {
  /** Set authenticated state with user, JWT, and wallet address */
  setAuthenticated: (user: AuthUser, jwt: string, walletAddress: string) => void;
  /** Clear all auth state (wallet disconnected) */
  setDisconnected: () => void;
  /** Set wallet connected without auth */
  setWalletConnected: (walletAddress: string) => void;
  /** Set scanning token state */
  setScanningToken: () => void;
  /** Set authenticating state */
  setAuthenticating: () => void;
  /** Set needs registration state */
  setNeedsRegistration: () => void;
  /** Set error state */
  setError: (message: string) => void;
  /** Get the current JWT (returns null if expired) */
  getJwt: () => string | null;
  /** Fetch with Authorization header; throws AuthExpiredError if JWT invalid */
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export type AuthStore = AuthStoreState & AuthStoreActions;

// =============================================================================
// localStorage Helpers
// =============================================================================

function storeWalletAddress(address: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, address);
    } catch {
      // localStorage may be unavailable
    }
  }
}

function getStoredWalletAddress(): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(WALLET_STORAGE_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

function clearWalletAddress(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(WALLET_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
    }
  }
}

// =============================================================================
// Initial State from localStorage
// =============================================================================

function getInitialState(): AuthStoreState {
  // Server-side: return disconnected
  if (typeof window === "undefined") {
    return {
      status: "DISCONNECTED",
      user: null,
      jwt: null,
      walletAddress: null,
      error: null,
    };
  }

  const storedJWT = getStoredJWT();
  const storedWallet = getStoredWalletAddress();

  if (!storedJWT || isJWTExpired(storedJWT)) {
    // Clear stale data
    clearJWT();
    clearWalletAddress();
    return {
      status: "DISCONNECTED",
      user: null,
      jwt: null,
      walletAddress: null,
      error: null,
    };
  }

  // Valid JWT found — restore session
  const payload = decodeJWTPayload(storedJWT);
  if (!payload) {
    clearJWT();
    clearWalletAddress();
    return {
      status: "DISCONNECTED",
      user: null,
      jwt: null,
      walletAddress: null,
      error: null,
    };
  }

  const walletAddress = storedWallet ?? payload.cardanoBech32Addr ?? null;

  return {
    status: "AUTHENTICATED",
    user: {
      alias: payload.accessTokenAlias ?? "",
      address: payload.cardanoBech32Addr ?? walletAddress ?? "",
    },
    jwt: storedJWT,
    walletAddress,
    error: null,
  };
}

// =============================================================================
// Store
// =============================================================================

export const authStore = createStore<AuthStore>()((set, get) => ({
  // Initial state (restored from localStorage if possible)
  ...getInitialState(),

  // Actions
  setAuthenticated: (user: AuthUser, jwt: string, walletAddress: string) => {
    storeJWT(jwt);
    storeWalletAddress(walletAddress);
    set({
      status: "AUTHENTICATED",
      user,
      jwt,
      walletAddress,
      error: null,
    });
  },

  setDisconnected: () => {
    clearJWT();
    clearWalletAddress();
    set({
      status: "DISCONNECTED",
      user: null,
      jwt: null,
      walletAddress: null,
      error: null,
    });
  },

  setWalletConnected: (walletAddress: string) => {
    storeWalletAddress(walletAddress);
    set({
      status: "WALLET_CONNECTED",
      walletAddress,
      user: null,
      jwt: null,
      error: null,
    });
  },

  setScanningToken: () => {
    set({ status: "SCANNING_TOKEN", error: null });
  },

  setAuthenticating: () => {
    set({ status: "AUTHENTICATING", error: null });
  },

  setNeedsRegistration: () => {
    set({ status: "NEEDS_REGISTRATION", error: null });
  },

  setError: (message: string) => {
    set({ status: "AUTH_ERROR", error: message });
  },

  getJwt: () => {
    const { jwt } = get();
    if (!jwt) return null;
    if (isJWTExpired(jwt)) {
      // JWT expired — fully disconnect (clear wallet too)
      clearJWT();
      clearWalletAddress();
      set({
        status: "DISCONNECTED",
        user: null,
        jwt: null,
        walletAddress: null,
        error: null,
      });
      return null;
    }
    return jwt;
  },

  authenticatedFetch: async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const jwt = get().getJwt();
    if (!jwt) {
      throw new AuthExpiredError();
    }

    return withTimeout(
      fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${jwt}`,
        },
      }),
      15_000
    );
  },
}));

// =============================================================================
// React Hook Wrapper
// =============================================================================

/**
 * React hook for consuming the auth store in React islands.
 *
 * Uses zustand's `useStore` to subscribe a React component to store changes.
 * Can be used with a selector for performance:
 *
 * ```tsx
 * const status = useAuthStore((s) => s.status);
 * const { user, jwt } = useAuthStore((s) => ({ user: s.user, jwt: s.jwt }));
 * ```
 */
export function useAuthStore(): AuthStore;
export function useAuthStore<T>(selector: (state: AuthStore) => T): T;
export function useAuthStore<T>(selector?: (state: AuthStore) => T) {
  if (selector) {
    return useStore(authStore, selector);
  }
  return useStore(authStore) as T;
}
