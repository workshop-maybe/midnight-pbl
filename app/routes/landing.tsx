import { Link } from "react-router";
import { AppShell } from "~/components/layout/app-shell";
import { Button } from "~/components/ui/button";
import { Card, CardBody } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { BRANDING } from "~/config/branding";
import { MIDNIGHT_PBL } from "~/config/midnight";

export default function Landing() {
  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Gradient backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-mn-primary/5 via-transparent to-transparent" />

        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <Badge variant="info" className="mb-6">
              Project-Based Learning on Cardano
            </Badge>

            {/* Title */}
            <h1 className="mb-6 text-4xl font-bold font-heading tracking-tight sm:text-5xl lg:text-6xl">
              <span className="gradient-text">{MIDNIGHT_PBL.title}</span>
            </h1>

            {/* Description */}
            <p className="mb-8 text-lg text-mn-text-muted sm:text-xl">
              {BRANDING.longDescription}
            </p>

            {/* CTA */}
            <div className="flex items-center justify-center gap-4">
              <Link to={MIDNIGHT_PBL.routes.learn}>
                <Button size="lg">Start Learning</Button>
              </Link>
              <a
                href={BRANDING.links.midnight}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="lg">
                  About Midnight
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="6 Modules"
            description="From Aiken fundamentals to Compact smart contracts on Midnight Network."
            icon="📚"
          />
          <FeatureCard
            title="On-Chain Credentials"
            description="Complete assignments and earn verifiable credentials stored on Cardano."
            icon="🏆"
          />
          <FeatureCard
            title="Self-Paced"
            description="Complete modules in any order. Learn at your own pace with no prerequisites."
            icon="⚡"
          />
        </div>
      </section>
    </AppShell>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Card>
      <CardBody>
        <span className="mb-3 block text-3xl" role="img">
          {icon}
        </span>
        <h3 className="mb-2 text-lg font-semibold font-heading text-mn-text">
          {title}
        </h3>
        <p className="text-sm text-mn-text-muted">{description}</p>
      </CardBody>
    </Card>
  );
}
