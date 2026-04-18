/**
 * Dynamic robots.txt endpoint.
 *
 * Prerendered at build time so it ships as a static file, but built
 * from config so forks automatically reference their own sitemap URL
 * via `BRANDING.siteUrl`.
 *
 * The `Disallow` entries for `/dashboard` and assignment routes are
 * defense-in-depth — the pages also emit `<meta name="robots" content
 * ="noindex, nofollow">` via `SEOHead`, but some crawlers ignore meta
 * robots.
 */
import type { APIRoute } from "astro";
import { BRANDING } from "@/config/branding";

export const prerender = true;

export const GET: APIRoute = () => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /dashboard",
    "Disallow: /learn/*/assignment",
    "",
    `Sitemap: ${BRANDING.siteUrl}/sitemap-index.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
