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
        // Course content is mostly static — generous stale time
        staleTime: 60 * 1000, // 1 minute
        // Don't refetch on window focus for better DX
        refetchOnWindowFocus: false,
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
