import { BRANDING } from "~/config/branding";

/**
 * Minimal footer with attribution links.
 */
export function Footer() {
  return (
    <footer className="border-t border-midnight-border bg-midnight/50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-mn-text-muted">
            Built with{" "}
            <a
              href={BRANDING.links.andamio}
              target="_blank"
              rel="noopener noreferrer"
              className="text-mn-primary-light transition-colors hover:text-mn-text"
            >
              Andamio
            </a>
          </p>
          <div className="flex items-center gap-6">
            <a
              href={BRANDING.links.midnight}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-mn-text-muted transition-colors hover:text-mn-text"
            >
              Midnight Network
            </a>
            <a
              href={BRANDING.links.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-mn-text-muted transition-colors hover:text-mn-text"
            >
              Docs
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
