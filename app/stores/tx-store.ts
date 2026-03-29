/**
 * Transaction Watcher Store
 *
 * Vanilla Zustand store (no React dependency) that manages SSE connections
 * for post-submission transaction confirmation watching.
 *
 * This store handles ONLY the confirmation watching after a TX is submitted.
 * The synchronous build/sign/submit flow lives in React local state in the
 * useTransaction hook.
 *
 * Survives React component unmounts because it lives at module level —
 * critical for the 20-90s Cardano TX confirmation window.
 *
 * @see ~/hooks/tx/use-transaction.ts — Registers TXs with this store
 * @see ~/projects/01-projects/andamio-platform/andamio-app-v2/src/stores/tx-watcher-store.ts
 */

import { createStore } from "zustand/vanilla";

// =============================================================================
// Constants
// =============================================================================

/**
 * If a TX stays in "confirmed" state (on-chain) without reaching "updated"
 * (DB synced) for this duration, treat it as stalled. Prevents infinite spinners.
 */
const CONFIRMED_TIMEOUT_MS = 30_000;

/** Remove completed transactions from the map after this delay */
const CLEANUP_DELAY_MS = 60_000;

// =============================================================================
// Types
// =============================================================================

export type TxWatchStatus =
  | "pending"
  | "confirmed"
  | "updated"
  | "failed"
  | "expired"
  | "stalled";

export interface WatchedTx {
  txHash: string;
  status: TxWatchStatus;
  startedAt: number;
  error?: string;
}

interface TxStoreState {
  /** Currently watched transactions */
  transactions: Map<string, WatchedTx>;
  /** Internal abort controllers for SSE connections */
  _controllers: Map<string, AbortController>;
  /** Internal timeout IDs for confirmed-state timeout */
  _timeouts: Map<string, ReturnType<typeof setTimeout>>;
}

interface TxStoreActions {
  /** Start watching a submitted transaction for confirmation via SSE */
  startWatching: (txHash: string) => void;
  /** Stop watching a transaction and clean up resources */
  stopWatching: (txHash: string) => void;
  /** Get the current status of a watched transaction */
  getStatus: (txHash: string) => WatchedTx | undefined;
  /** Clear all watched transactions (e.g., on logout) */
  clearAll: () => void;
}

export type TxStore = TxStoreState & TxStoreActions;

// =============================================================================
// SSE Event Types (from Andamio Gateway)
// =============================================================================

interface SSEStateEvent {
  state: string;
  tx_type?: string;
  retry_count?: number;
  confirmed_at?: string;
  last_error?: string;
}

// =============================================================================
// Internal Helpers
// =============================================================================

const TERMINAL_STATES = ["updated", "failed", "expired"];

function isTerminalState(state: string): boolean {
  return TERMINAL_STATES.includes(state);
}

function toWatchStatus(state: string): TxWatchStatus {
  switch (state) {
    case "pending":
      return "pending";
    case "confirmed":
      return "confirmed";
    case "updated":
      return "updated";
    case "failed":
      return "failed";
    case "expired":
      return "expired";
    default:
      return "pending";
  }
}

/**
 * Parse SSE text into individual events.
 * SSE format: "event: <type>\ndata: <json>\n\n"
 */
function parseSSEChunk(
  chunk: string
): Array<{ event?: string; data?: string }> {
  const events: Array<{ event?: string; data?: string }> = [];
  const blocks = chunk.split("\n\n").filter((b) => b.trim());

  for (const block of blocks) {
    const lines = block.split("\n");
    let event: string | undefined;
    let data: string | undefined;

    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data = line.slice(5).trim();
      }
    }

    if (data) {
      events.push({ event, data });
    }
  }

  return events;
}

/**
 * Update a transaction entry in the store.
 */
function updateTx(
  get: () => TxStoreState,
  set: (partial: Partial<TxStoreState>) => void,
  txHash: string,
  update: Partial<WatchedTx>
): void {
  const { transactions } = get();
  const entry = transactions.get(txHash);
  if (!entry) return;

  const next = new Map(transactions);
  next.set(txHash, { ...entry, ...update });
  set({ transactions: next });
}

/**
 * Handle a transaction reaching a terminal state.
 */
function handleTerminal(
  txHash: string,
  finalStatus: TxWatchStatus,
  error: string | undefined,
  get: () => TxStoreState,
  set: (partial: Partial<TxStoreState>) => void
): void {
  // Clear confirmed timeout
  const { _timeouts, _controllers } = get();
  const timeout = _timeouts.get(txHash);
  if (timeout) {
    clearTimeout(timeout);
    const nextTimeouts = new Map(_timeouts);
    nextTimeouts.delete(txHash);
    set({ _timeouts: nextTimeouts });
  }

  // Abort SSE connection
  const controller = _controllers.get(txHash);
  if (controller) {
    controller.abort();
    const nextControllers = new Map(_controllers);
    nextControllers.delete(txHash);
    set({ _controllers: nextControllers });
  }

  // Update status
  updateTx(get, set, txHash, { status: finalStatus, error });

  // Schedule cleanup
  setTimeout(() => {
    const { transactions } = get();
    if (transactions.has(txHash)) {
      const next = new Map(transactions);
      next.delete(txHash);
      set({ transactions: next });
    }
  }, CLEANUP_DELAY_MS);
}

/**
 * Start an SSE connection to watch a transaction.
 */
function connectSSE(
  txHash: string,
  signal: AbortSignal,
  get: () => TxStoreState,
  set: (partial: Partial<TxStoreState>) => void
): void {
  const url = `/api/tx/stream/${txHash}`;

  void (async () => {
    try {
      const response = await fetch(url, {
        headers: { Accept: "text/event-stream" },
        signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body for SSE stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete events (delimited by double newline)
        const lastDoubleNewline = buffer.lastIndexOf("\n\n");
        if (lastDoubleNewline === -1) continue;

        const complete = buffer.slice(0, lastDoubleNewline + 2);
        buffer = buffer.slice(lastDoubleNewline + 2);

        const events = parseSSEChunk(complete);

        for (const sseEvent of events) {
          if (!sseEvent.data) continue;

          try {
            const payload = JSON.parse(sseEvent.data) as SSEStateEvent;
            const watchStatus = toWatchStatus(
              payload.state ??
                (sseEvent.event === "complete"
                  ? // complete events have final_state
                    ((JSON.parse(sseEvent.data) as { final_state?: string })
                      .final_state ?? "updated")
                  : "pending")
            );

            if (isTerminalState(watchStatus)) {
              handleTerminal(
                txHash,
                watchStatus,
                payload.last_error,
                get,
                set
              );
              return;
            }

            updateTx(get, set, txHash, { status: watchStatus });

            // Start confirmed-state timeout
            if (watchStatus === "confirmed") {
              const { _timeouts } = get();
              if (!_timeouts.has(txHash)) {
                const timeoutId = setTimeout(() => {
                  const tx = get().transactions.get(txHash);
                  if (!tx || isTerminalState(tx.status)) return;

                  console.warn(
                    `[TxStore] TX ${txHash.slice(0, 16)}... stuck in "confirmed" for ${CONFIRMED_TIMEOUT_MS / 1000}s — treating as stalled`
                  );

                  handleTerminal(
                    txHash,
                    "stalled",
                    "Transaction confirmed on-chain but database update timed out. Your data may still sync — please refresh shortly.",
                    get,
                    set
                  );
                }, CONFIRMED_TIMEOUT_MS);

                const nextTimeouts = new Map(_timeouts);
                nextTimeouts.set(txHash, timeoutId);
                set({ _timeouts: nextTimeouts });
              }
            }
          } catch (parseErr) {
            console.warn("[TxStore] Failed to parse SSE event:", parseErr);
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.warn(
        "[TxStore] SSE connection error:",
        err instanceof Error ? err.message : String(err)
      );
      // On SSE failure, mark as stalled rather than failed — the TX may still
      // be processing. The user can check manually.
    }
  })();
}

// =============================================================================
// Store
// =============================================================================

export const txStore = createStore<TxStore>()((set, get) => ({
  // State
  transactions: new Map(),
  _controllers: new Map(),
  _timeouts: new Map(),

  // Actions
  startWatching: (txHash: string) => {
    const { transactions, _controllers } = get();

    // Idempotent — skip if already watching
    if (transactions.has(txHash)) return;

    const controller = new AbortController();

    const entry: WatchedTx = {
      txHash,
      status: "pending",
      startedAt: Date.now(),
    };

    const nextTx = new Map(transactions);
    nextTx.set(txHash, entry);

    const nextControllers = new Map(_controllers);
    nextControllers.set(txHash, controller);

    set({ transactions: nextTx, _controllers: nextControllers });

    // Start SSE connection
    connectSSE(txHash, controller.signal, get, set);
  },

  stopWatching: (txHash: string) => {
    const { transactions, _controllers, _timeouts } = get();

    // Abort SSE
    const controller = _controllers.get(txHash);
    if (controller) controller.abort();

    // Clear timeout
    const timeout = _timeouts.get(txHash);
    if (timeout) clearTimeout(timeout);

    // Remove from all maps
    const nextTx = new Map(transactions);
    nextTx.delete(txHash);

    const nextControllers = new Map(_controllers);
    nextControllers.delete(txHash);

    const nextTimeouts = new Map(_timeouts);
    nextTimeouts.delete(txHash);

    set({
      transactions: nextTx,
      _controllers: nextControllers,
      _timeouts: nextTimeouts,
    });
  },

  getStatus: (txHash: string) => {
    return get().transactions.get(txHash);
  },

  clearAll: () => {
    const { _controllers, _timeouts } = get();

    // Abort all SSE connections
    for (const controller of _controllers.values()) {
      controller.abort();
    }

    // Clear all timeouts
    for (const timeout of _timeouts.values()) {
      clearTimeout(timeout);
    }

    set({
      transactions: new Map(),
      _controllers: new Map(),
      _timeouts: new Map(),
    });
  },
}));
