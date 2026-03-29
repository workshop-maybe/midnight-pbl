import { type ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "violet";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-midnight-surface text-mn-text-muted border-midnight-border",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  error: "bg-error/10 text-error border-error/30",
  info: "bg-info/10 text-info border-info/30",
  violet: "bg-mn-violet/10 text-mn-violet border-mn-violet/30",
};

/**
 * Badge — Midnight design system.
 *
 * Small colored label for status indicators, tags, and categories.
 */
export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-md border
        px-2.5 py-0.5 text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `.trim()}
    >
      {children}
    </span>
  );
}
