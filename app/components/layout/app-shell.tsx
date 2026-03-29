import { type ReactNode } from "react";
import { Nav } from "./nav";
import { Footer } from "./footer";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Page wrapper — nav + content + footer.
 *
 * Used by routes that need the full app chrome.
 * The landing page uses this directly; nested content routes
 * will use the layout route in Unit 2.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
