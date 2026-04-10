/**
 * Branding configuration — single source of truth for course identity.
 *
 * When you fork this repo to publish your own course, edit every field
 * below. These strings and URLs are the only things that change for a
 * rebrand; colors and fonts live in `src/styles/globals.css` because
 * Tailwind v4's `@theme` block needs compile-time tokens.
 *
 * Pattern: cardano-xp:/src/config/branding.ts
 */

export const BRANDING = {
  /** Short app name — used in nav, page titles. */
  name: "Midnight PBL",

  /** Tagline under the main title. */
  tagline: "From Aiken to Compact",

  /** Full page title — used as the default `<title>` on the homepage. */
  fullTitle: "Midnight PBL — From Aiken to Compact",

  /** Short description for meta tags / OG card. */
  description:
    "Learn to build on Midnight Network with project-based learning. Earn on-chain credentials.",

  /** Longer description for the landing page. */
  longDescription:
    "Six modules that take you from Aiken smart contract fundamentals to Compact development on Midnight Network. Complete assignments, submit evidence, and earn verifiable on-chain credentials through Andamio.",

  /** Homepage hero text — the big title + subtitle at the top of `/`. */
  hero: {
    title: "midnight pbl",
    subtitle: "From Aiken to Compact",
  },

  /** Asset paths under `public/`. */
  logo: {
    /** Favicon. */
    favicon: "/favicon.ico",
    /** OG image for social sharing. */
    ogImage: "/og-image.png",
    /** Hero symbol shown next to the homepage wordmark. Leave blank to hide. */
    heroSymbol: "/midnight_logo_pack/02_Symbol/Midnight-RGB_Symbol-White.svg",
    /** Footer / bottom-of-homepage mark. Leave blank to hide. */
    wordmark:
      "/midnight_logo_pack/01_symbol_wordmark/Horizontal/Midnight-RGB_Logo-Horizontal-White.svg",
  },

  /** External links used across the app. */
  links: {
    /** Primary network / brand this course covers. */
    midnight: "https://midnight.network",
    /** Andamio platform — the credential issuer. */
    andamio: "https://andamio.io",
    /** Andamio docs — linked in the footer. */
    docs: "https://docs.andamio.io",
    /** This course's GitHub repo — update after forking. */
    github: "https://github.com/workshop-maybe/midnight-pbl",
    /** Fork URL — GitHub appends `/fork` to the repo. */
    githubFork: "https://github.com/workshop-maybe/midnight-pbl/fork",
    /** Issue tracker — used by the "Give Feedback" button and the agent harness. */
    githubIssues: "https://github.com/workshop-maybe/midnight-pbl/issues",
  },
} as const;

/**
 * Get a full page title with the app name as a suffix.
 */
export function getPageTitle(pageTitle?: string): string {
  if (!pageTitle) return BRANDING.fullTitle;
  return `${pageTitle} | ${BRANDING.name}`;
}

export type Branding = typeof BRANDING;
