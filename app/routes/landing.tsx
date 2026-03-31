import { Link } from "react-router";
import { AppShell } from "~/components/layout/app-shell";
import { Button } from "~/components/ui/button";
import { BRANDING } from "~/config/branding";
import { MIDNIGHT_PBL } from "~/config/midnight";

export default function Landing() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
        {/* Midnight wordmark */}
        <div className="mb-12 sm:mb-16">
          <p className="font-heading text-4xl font-bold tracking-tight text-mn-text sm:text-5xl md:text-6xl">
            midnight
          </p>
          <p className="mt-1 font-heading text-lg text-mn-text-muted sm:text-xl">
            From Aiken to Compact
          </p>
        </div>

        {/* Course description */}
        <div className="mb-12 sm:mb-16 max-w-2xl">
          <p className="text-base text-mn-text-muted leading-relaxed sm:text-lg">
            {BRANDING.longDescription}
          </p>
        </div>

        {/* Course outline */}
        <div className="mb-12 sm:mb-16">
          <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-mn-text-muted">
            Course Outline
          </h2>
          <div className="divide-y divide-midnight-border border-t border-b border-midnight-border">
            <OutlineItem number={1} title="Midnight Architecture for Cardano Developers" lessons={3} />
            <OutlineItem number={2} title="Compact Language Fundamentals" lessons={3} />
            <OutlineItem number={3} title="The Privacy Model — Proving Without Revealing" lessons={3} />
            <OutlineItem number={4} title="Developer Workflow — Compile, Prove, Deploy" lessons={3} />
            <OutlineItem number={5} title="Building Credential Systems on Midnight" lessons={3} />
            <OutlineItem number={6} title="Dual-Chain Architecture — Cardano + Midnight" lessons={3} />
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Link to="/">
            <Button size="lg">Start Learning</Button>
          </Link>
          <p className="text-sm text-mn-text-muted">
            Self-paced. On-chain credentials via{" "}
            <a
              href={BRANDING.links.andamio}
              target="_blank"
              rel="noopener noreferrer"
              className="text-mn-primary transition-colors hover:text-mn-text underline underline-offset-2"
            >
              Andamio
            </a>
            .
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function OutlineItem({
  number,
  title,
  lessons,
}: {
  number: number;
  title: string;
  lessons: number;
}) {
  return (
    <div className="flex items-baseline gap-4 py-3 sm:py-4">
      <span className="text-sm font-mono text-mn-text-muted w-6 shrink-0">
        {number}
      </span>
      <span className="flex-1 text-sm text-mn-text sm:text-base">{title}</span>
      <span className="text-xs text-mn-text-muted shrink-0">
        {lessons} lessons
      </span>
    </div>
  );
}
