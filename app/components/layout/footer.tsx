import { BRANDING } from "~/config/branding";

/**
 * Minimal footer with attribution links.
 */
export function Footer() {
  return (
    <footer className="border-t border-midnight-border bg-midnight-surface py-8 supports-[padding:env(safe-area-inset-bottom)]:pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-mn-text-muted">
            Built with{" "}
            <a
              href={BRANDING.links.andamio}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center text-mn-primary transition-colors hover:text-mn-text"
            >
              Andamio
            </a>
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href={BRANDING.links.midnight}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center text-sm text-mn-text-muted transition-colors hover:text-mn-text"
            >
              Midnight Network
            </a>
            <a
              href={BRANDING.links.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center text-sm text-mn-text-muted transition-colors hover:text-mn-text"
            >
              Docs
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
