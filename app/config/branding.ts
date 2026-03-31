/**
 * Branding Configuration
 *
 * Centralizes app identity for easy customization.
 * Pattern: cardano-xp:/src/config/branding.ts
 */

export const BRANDING = {
  /** App name displayed in header, title, etc. */
  name: "Midnight PBL",

  /** Secondary text */
  tagline: "From Aiken to Compact",

  /** Full app title for page titles */
  fullTitle: "Midnight PBL — From Aiken to Compact",

  /** Short description for meta tags */
  description:
    "Learn to build on Midnight Network with project-based learning. Earn on-chain credentials.",

  /** Longer description for landing pages */
  longDescription:
    "Six modules that take you from Aiken smart contract fundamentals to Compact development on Midnight Network. Complete assignments, submit evidence, and earn verifiable on-chain credentials through Andamio.",

  /** URL paths for logos/icons */
  logo: {
    /** Favicon path */
    favicon: "/favicon.ico",
    /** OG image for social sharing */
    ogImage: "/og-image.png",
  },

  /** External links */
  links: {
    /** Midnight Network */
    midnight: "https://midnight.network",
    /** Andamio platform */
    andamio: "https://andamio.io",
    /** Documentation */
    docs: "https://docs.andamio.io",
  },

  /** Charcoal palette — mirrors CSS custom properties for JS consumers */
  colors: {
    accent: "#d4a053",
    primary: "#d4a053",
    bgDark: "#1c1c1c",
    bgSurface: "#242424",
    bgCard: "#2a2a2a",
    textOnDark: "#e8e8e8",
    textMuted: "#999999",
    borderDark: "#ffffff12",
  },

  /** Font families */
  fonts: {
    heading: "Outfit",
    body: "Urbanist",
    prose: "Lora",
    mono: "Geist Mono",
  },
} as const;

/**
 * Get the full page title with app name suffix.
 */
export function getPageTitle(pageTitle?: string): string {
  if (!pageTitle) return BRANDING.fullTitle;
  return `${pageTitle} | ${BRANDING.name}`;
}

export type Branding = typeof BRANDING;
