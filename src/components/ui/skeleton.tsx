/**
 * Skeleton — React version for use inside client islands.
 *
 * Animated loading placeholder with pulse effect.
 * Skeleton.astro is for server-rendered pages; this is for React islands.
 */

// =============================================================================
// Skeleton
// =============================================================================

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-midnight-surface rounded-md ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

// =============================================================================
// SkeletonCard
// =============================================================================

export function SkeletonCard() {
  return (
    <div className="rounded-sm border border-midnight-border bg-midnight-card p-4 sm:p-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
