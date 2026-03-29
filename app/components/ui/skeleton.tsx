interface SkeletonProps {
  className?: string;
  /** Width — Tailwind class like "w-full" or "w-48" */
  width?: string;
  /** Height — Tailwind class like "h-4" or "h-12" */
  height?: string;
  /** Use rounded-xl for card-shaped skeletons */
  rounded?: boolean;
}

/**
 * Skeleton — Midnight design system.
 *
 * Animated loading placeholder with subtle pulse effect.
 */
export function Skeleton({
  className = "",
  width = "w-full",
  height = "h-4",
  rounded = false,
}: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse bg-midnight-surface
        ${rounded ? "rounded-xl" : "rounded-md"}
        ${width} ${height}
        ${className}
      `.trim()}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton group for card-shaped loading states.
 */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-midnight-border bg-[#0a0e19eb] p-6 ${className}`}
    >
      <Skeleton height="h-5" width="w-2/3" className="mb-3" />
      <Skeleton height="h-3" width="w-full" className="mb-2" />
      <Skeleton height="h-3" width="w-4/5" className="mb-4" />
      <Skeleton height="h-8" width="w-24" rounded />
    </div>
  );
}
