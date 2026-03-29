import { Link, useLocation } from "react-router";
import { lazy, Suspense, useState, useEffect, useCallback } from "react";
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
 * Lazy-load the DashboardLink — it's .client.tsx and reads auth
 * context to conditionally render the Dashboard nav item.
 */
const DashboardLink = lazy(() =>
  import("~/components/layout/dashboard-link.client").then((mod) => ({
    default: mod.DashboardLink,
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
 * On mobile (<640px), links and wallet collapse into a hamburger menu.
 * Safe-area insets are respected for notched phones.
 */
export function Nav() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLearnActive =
    location.pathname === "/" ||
    location.pathname.startsWith("/learn");

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [mobileOpen, handleKeyDown]);

  return (
    <nav className="sticky top-0 z-50 border-b border-midnight-border bg-midnight/80 backdrop-blur-md supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand / course title */}
        <Link
          to="/"
          prefetch="intent"
          className="flex items-center gap-3 text-mn-text transition-colors hover:text-mn-primary-light"
        >
          <span className="text-lg font-semibold font-heading">
            {BRANDING.name}
          </span>
        </Link>

        {/* Desktop navigation links (hidden on mobile) */}
        <div className="hidden sm:flex sm:items-center sm:gap-6">
          <Link
            to={MIDNIGHT_PBL.routes.learn}
            prefetch="intent"
            className={`min-h-[44px] flex items-center text-sm transition-colors hover:text-mn-text ${
              isLearnActive ? "text-mn-text" : "text-mn-text-muted"
            }`}
          >
            Learn
          </Link>
          {/* Dashboard link — only shown when authenticated */}
          {typeof window === "undefined" ? null : (
            <Suspense fallback={null}>
              <DashboardLink />
            </Suspense>
          )}

          {/* Wallet connect button — lazy-loaded .client.tsx component */}
          {typeof window === "undefined" ? (
            <WalletPlaceholder />
          ) : (
            <Suspense fallback={<WalletPlaceholder />}>
              <ConnectWallet />
            </Suspense>
          )}
        </div>

        {/* Mobile hamburger button (visible on <640px) */}
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-mn-text transition-colors hover:bg-midnight-surface sm:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <NavCloseIcon /> : <NavMenuIcon />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 z-40 bg-black/50 sm:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 right-0 z-50 border-b border-midnight-border bg-midnight/95 backdrop-blur-md sm:hidden supports-[padding:env(safe-area-inset-left)]:pl-[env(safe-area-inset-left)] supports-[padding:env(safe-area-inset-right)]:pr-[env(safe-area-inset-right)]">
            <div className="flex flex-col gap-2 px-4 py-4">
              <Link
                to={MIDNIGHT_PBL.routes.learn}
                prefetch="intent"
                className={`min-h-[44px] flex items-center rounded-lg px-3 text-sm transition-colors hover:bg-midnight-surface ${
                  isLearnActive ? "text-mn-text" : "text-mn-text-muted"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                Learn
              </Link>
              {typeof window === "undefined" ? null : (
                <Suspense fallback={null}>
                  <MobileDashboardLink onNavigate={() => setMobileOpen(false)} />
                </Suspense>
              )}
              <div className="pt-2 border-t border-midnight-border">
                {typeof window === "undefined" ? (
                  <WalletPlaceholder />
                ) : (
                  <Suspense fallback={<WalletPlaceholder />}>
                    <ConnectWallet />
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

/**
 * Lazy-load a mobile-friendly DashboardLink that closes the menu on tap.
 */
const MobileDashboardLinkInner = lazy(() =>
  import("~/components/layout/dashboard-link.client").then((mod) => ({
    default: mod.DashboardLink,
  }))
);

function MobileDashboardLink({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div onClick={onNavigate}>
      <MobileDashboardLinkInner />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nav Icons
// ---------------------------------------------------------------------------

function NavMenuIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function NavCloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
