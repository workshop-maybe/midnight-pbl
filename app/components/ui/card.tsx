import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Disable the hover glow effect */
  noHover?: boolean;
  as?: "div" | "section" | "article";
}

/**
 * Card — charcoal design system.
 *
 * Flat dark surface with subtle border. Optional border
 * brighten on hover.
 */
export function Card({
  children,
  className = "",
  noHover = true,
  as: Element = "div",
}: CardProps) {
  return (
    <Element
      className={`
        rounded-sm border border-midnight-border bg-midnight-card
        ${noHover ? "" : "transition-colors duration-200 hover:border-[#ffffff20]"}
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
    <div className={`border-b border-midnight-border px-4 py-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return <div className={`px-4 py-4 sm:px-6 ${className}`}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div className={`border-t border-midnight-border px-4 py-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}
