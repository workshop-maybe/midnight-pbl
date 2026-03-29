/**
 * Dashboard Nav Link — .client.tsx
 *
 * Renders the Dashboard navigation link only when the user is
 * authenticated. MUST be .client.tsx because it reads from the
 * auth context (which depends on useWallet from @meshsdk/react).
 *
 * @see ~/contexts/auth-context.client.tsx — Auth context
 */

import { Link } from "react-router";
import { useAuth } from "~/contexts/auth-context.client";
import { MIDNIGHT_PBL } from "~/config/midnight";

export function DashboardLink() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Link
      to={MIDNIGHT_PBL.routes.dashboard}
      prefetch="intent"
      className="text-sm text-mn-text-muted transition-colors hover:text-mn-text"
    >
      Dashboard
    </Link>
  );
}
