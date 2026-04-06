/**
 * Card — React version for use inside client islands.
 *
 * Mirrors the Astro Card component's styling.
 * Card.astro is for server-rendered pages; this is for React islands.
 */

import type { ReactNode } from "react";

// =============================================================================
// Card
// =============================================================================

interface CardProps {
  children: ReactNode;
  className?: string;
  noHover?: boolean;
}

export function Card({ children, className = "", noHover = true }: CardProps) {
  const hoverClass = noHover
    ? ""
    : "transition-colors duration-200 hover:border-[#ffffff20]";

  return (
    <div
      className={`rounded-sm border border-midnight-border bg-midnight-card ${hoverClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

// =============================================================================
// CardHeader
// =============================================================================

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div
      className={`border-b border-midnight-border px-4 py-4 sm:px-6 ${className}`.trim()}
    >
      {children}
    </div>
  );
}

// =============================================================================
// CardBody
// =============================================================================

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return (
    <div className={`px-4 py-4 sm:px-6 ${className}`.trim()}>{children}</div>
  );
}
