/**
 * Credentials List — displays earned credentials on the dashboard.
 *
 * Shows each credential with course name, claim date, and on-chain
 * reference. Empty state shown when no credentials exist.
 *
 * Does NOT import Mesh SDK — safe for any rendering context.
 *
 * @see ~/hooks/api/use-dashboard.ts — DashboardCredential type
 */

import { Card, CardBody } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import type { DashboardCredential } from "~/hooks/api/use-dashboard";

// =============================================================================
// Types
// =============================================================================

interface CredentialsListProps {
  credentials: DashboardCredential[];
  courseTitle: string;
}

// =============================================================================
// Component
// =============================================================================

export function CredentialsList({
  credentials,
  courseTitle,
}: CredentialsListProps) {
  if (credentials.length === 0) {
    return (
      <Card noHover>
        <CardBody className="py-8 text-center">
          <div className="mb-3 flex justify-center">
            <CredentialIcon className="h-10 w-10 text-mn-text-muted/40" />
          </div>
          <p className="text-sm text-mn-text-muted">
            No credentials earned yet.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {credentials.map((credential, index) => (
        <Card key={credential.txHash ?? index}>
          <CardBody className="flex items-start gap-3 sm:items-center sm:gap-4">
            {/* Credential icon */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm border border-mn-primary/30 bg-mn-primary/10">
              <CredentialIcon className="h-5 w-5 text-mn-primary" />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-semibold text-mn-text truncate">
                  {courseTitle}
                </h4>
                <Badge variant="accent">Credential</Badge>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mn-text-muted">
                {credential.claimDate && (
                  <span>
                    Claimed{" "}
                    {new Date(credential.claimDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </span>
                )}

                {credential.txHash && (
                  <span className="font-mono truncate max-w-[200px]">
                    TX: {credential.txHash.slice(0, 12)}...
                    {credential.txHash.slice(-6)}
                  </span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// Icons
// =============================================================================

function CredentialIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
      />
    </svg>
  );
}
