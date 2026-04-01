/**
 * Badge — React version for use inside client islands.
 *
 * Mirrors the Astro Badge component's styling.
 * Badge.astro is for server-rendered pages; this is for React islands.
 */

import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "accent";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-midnight-surface text-mn-text-muted border-midnight-border",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  error: "bg-error/10 text-error border-error/30",
  info: "bg-mn-primary/10 text-mn-primary border-mn-primary/30",
  accent: "bg-mn-primary/10 text-mn-primary border-mn-primary/30",
};

export function Badge({
  variant = "default",
  className = "",
  children,
}: BadgeProps) {
  const style = variantStyles[variant] ?? variantStyles.default;

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${style} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
