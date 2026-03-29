/**
 * App Layout Route
 *
 * Wraps all content routes with the AppShell (nav + footer).
 * MeshProvider and AuthProvider are NOT added here yet — that's Unit 3.
 *
 * @see app/components/layout/app-shell.tsx
 */

import { Outlet } from "react-router";
import { AppShell } from "~/components/layout/app-shell";
import { ErrorPage } from "~/components/error/error-boundary";

export function loader() {
  // Empty loader for now — can be used to prefetch shared data
  return null;
}

export default function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  return <ErrorPage error={error} />;
}
