import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Disable the hover glow effect */
  noHover?: boolean;
  as?: "div" | "section" | "article";
}

/**
 * Glassmorphic card — Midnight design system.
 *
 * Semi-transparent dark background with subtle border and
 * sky-blue glow on hover. 20px border radius.
 */
export function Card({
  children,
  className = "",
  noHover = false,
  as: Element = "div",
}: CardProps) {
  return (
    <Element
      className={`
        rounded-xl border border-midnight-border bg-[#0a0e19eb]
        backdrop-blur-sm
        ${noHover ? "" : "transition-shadow duration-200 hover:shadow-[0_0_24px_var(--mn-glow)]"}
        ${className}
      `.trim()}
    >
      {children}
    </Element>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div className={`border-b border-midnight-border px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div className={`border-t border-midnight-border px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}
