import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * SSR-safe React Query provider.
 *
 * Creates a new QueryClient per request on the server (prevents
 * cross-request data leakage). Uses a singleton on the client
 * (persists cache across navigations).
 */

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Course content is static — generous stale time prevents
        // unnecessary refetches when navigating between lessons.
        // 5 minutes matches the server-side module cache TTL.
        staleTime: 5 * 60 * 1000, // 5 minutes

        // Keep unused query data in cache for 30 minutes so that
        // back-navigation reuses cached data without a flash.
        gcTime: 30 * 60 * 1000, // 30 minutes

        // Don't refetch on window focus — course content doesn't
        // change frequently and refetching on tab switch is jarring.
        refetchOnWindowFocus: false,

        // Retry transient failures (network blips, 5xx) twice
        // with React Query's default exponential backoff.
        retry: 2,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new client
    return makeQueryClient();
  }
  // Browser: singleton
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
