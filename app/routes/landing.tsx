import { Link } from "react-router";
import { AppShell } from "~/components/layout/app-shell";
import { Button } from "~/components/ui/button";
import { BRANDING } from "~/config/branding";
import { MIDNIGHT_PBL } from "~/config/midnight";

export default function Landing() {
  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Gradient backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-mn-primary/5 via-transparent to-transparent" />

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            {/* Title */}
            <h1 className="mb-6 text-4xl font-bold font-heading tracking-tight sm:text-5xl lg:text-6xl">
              <span className="gradient-text">{MIDNIGHT_PBL.title}</span>
            </h1>

            {/* Description */}
            <p className="mb-8 text-lg text-mn-text-muted sm:text-xl">
              {BRANDING.longDescription}
            </p>

            {/* CTA */}
            <div className="flex items-center justify-center">
              <Link to="/">
                <Button size="lg">Start Learning</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <ul className="space-y-3 text-sm text-mn-text-muted">
          <li>
            <span className="font-medium text-mn-text">6 modules</span>{" "}
            — from Aiken fundamentals to Compact smart contracts on Midnight Network.
          </li>
          <li>
            <span className="font-medium text-mn-text">On-chain credentials</span>{" "}
            — complete assignments and earn verifiable credentials stored on Cardano.
          </li>
          <li>
            <span className="font-medium text-mn-text">Self-paced</span>{" "}
            — complete modules in any order, no prerequisites.
          </li>
        </ul>
      </section>
    </AppShell>
  );
}
