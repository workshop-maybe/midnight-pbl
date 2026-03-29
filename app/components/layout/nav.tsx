import { Link } from "react-router";
import { lazy, Suspense } from "react";
import { BRANDING } from "~/config/branding";
import { MIDNIGHT_PBL } from "~/config/midnight";

/**
 * Lazy-load the ConnectWallet component — it's .client.tsx and
 * depends on Mesh SDK. During SSR and while loading, the placeholder
 * skeleton is shown instead.
 */
const ConnectWallet = lazy(() =>
  import("~/components/auth/connect-wallet.client").then((mod) => ({
    default: mod.ConnectWallet,
  }))
);

/**
 * Wallet button placeholder shown during SSR and lazy load.
 */
function WalletPlaceholder() {
  return (
    <div className="h-9 w-[140px] rounded-lg border border-midnight-border bg-midnight-surface" />
  );
}

/**
 * Sticky navigation bar.
 *
 * Shows course title, nav links, and the wallet connect button.
 */
export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-midnight-border bg-midnight/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand / course title */}
        <Link
          to={MIDNIGHT_PBL.routes.landing}
          className="flex items-center gap-3 text-mn-text transition-colors hover:text-mn-primary-light"
        >
          <span className="text-lg font-semibold font-heading">
            {BRANDING.name}
          </span>
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-6">
          <Link
            to={MIDNIGHT_PBL.routes.learn}
            className="text-sm text-mn-text-muted transition-colors hover:text-mn-text"
          >
            Learn
          </Link>
          <Link
            to={MIDNIGHT_PBL.routes.dashboard}
            className="text-sm text-mn-text-muted transition-colors hover:text-mn-text"
          >
            Dashboard
          </Link>

          {/* Wallet connect button — lazy-loaded .client.tsx component */}
          {typeof window === "undefined" ? (
            <WalletPlaceholder />
          ) : (
            <Suspense fallback={<WalletPlaceholder />}>
              <ConnectWallet />
            </Suspense>
          )}
        </div>
      </div>
    </nav>
  );
}
