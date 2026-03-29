/**
 * App Layout Route
 *
 * Wraps all content routes with the AppShell (nav + footer) and
 * the client-only provider chain (MeshProvider + AuthProvider).
 *
 * The .client.tsx providers are loaded via React.lazy + Suspense
 * to ensure they only render on the client. During SSR, children
 * render without providers (auth context returns safe defaults).
 *
 * @see app/components/layout/app-shell.tsx
 * @see app/components/providers/mesh-provider.client.tsx
 * @see app/contexts/auth-context.client.tsx
 */

import { Outlet } from "react-router";
import { lazy, Suspense, useState, useEffect, type ReactNode } from "react";
import { AppShell } from "~/components/layout/app-shell";
import { ErrorPage } from "~/components/error/error-boundary";

// Lazy-load client-only providers — React.lazy ensures they're
// never imported during SSR. The .client.tsx files are excluded
// from the server bundle by React Router v7.
const MeshProviderWrapper = lazy(() =>
  import("~/components/providers/mesh-provider.client").then((mod) => ({
    default: mod.MeshProviderWrapper,
  }))
);

const AuthProvider = lazy(() =>
  import("~/contexts/auth-context.client").then((mod) => ({
    default: mod.AuthProvider,
  }))
);

/**
 * Client-only provider chain that wraps content routes.
 * Falls back to rendering children without providers during SSR
 * and while the lazy imports resolve.
 */
function ClientProviders({ children }: { children: ReactNode }) {
  // Track whether we're on the client AFTER hydration completes.
  // Using useEffect instead of typeof window avoids hydration mismatch —
  // both SSR and client initial render produce the same tree (just children).
  // After hydration, useEffect fires and we wrap with providers.
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <MeshProviderWrapper>
        <AuthProvider>{children}</AuthProvider>
      </MeshProviderWrapper>
    </Suspense>
  );
}

export function loader() {
  // Empty loader for now — can be used to prefetch shared data
  return null;
}

export default function AppLayout() {
  return (
    <ClientProviders>
      <AppShell>
        <Outlet />
      </AppShell>
    </ClientProviders>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  return <ErrorPage error={error} />;
}
