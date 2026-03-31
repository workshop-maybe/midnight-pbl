import { Link } from "react-router";
import { AppShell } from "~/components/layout/app-shell";
import { Button } from "~/components/ui/button";
import { BRANDING } from "~/config/branding";
import { MIDNIGHT_PBL } from "~/config/midnight";

export default function Landing() {
  return (
    <AppShell>
      {/* Hero */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            {/* Title */}
            <h1 className="mb-6 text-3xl font-bold font-heading tracking-tight text-mn-text sm:text-4xl md:text-5xl lg:text-6xl">
              {MIDNIGHT_PBL.title}
            </h1>

            {/* Description */}
            <p className="mb-8 text-base text-mn-text-muted sm:text-lg md:text-xl">
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
