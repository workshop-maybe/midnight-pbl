/**
 * JSON-LD (schema.org) builders for SEO structured data.
 *
 * Pure functions — take plain data in, return plain JS objects. Callers
 * pass the output to `<SEOHead jsonLd={[...]}>` which serializes each
 * entry into a `<script type="application/ld+json">` block.
 *
 * The only non-obvious correctness requirement is that text in schemas
 * must match visible text on the page exactly (Google enforces this
 * for FAQ + Course rich results). The feature pages are responsible
 * for threading the same strings through both the DOM and these
 * builders.
 */

import type { CourseModule, Lesson } from "@/types/course";
import { BRANDING } from "@/config/branding";

// =============================================================================
// URL helpers
// =============================================================================

/** Join a path onto a site origin, collapsing any duplicate slashes. */
export function absUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

// =============================================================================
// Shared sub-types
// =============================================================================

export interface FAQEntry {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  /** Visible name for the crumb. */
  name: string;
  /** Path (leading slash) or absolute URL. */
  item: string;
}

// =============================================================================
// Course
// =============================================================================

export interface BuildCourseSchemaArgs {
  courseName: string;
  courseDescription: string;
  siteUrl: string;
  modules: CourseModule[];
  /** Credential awarded on completion. Short phrase, e.g. "On-chain credential". */
  credentialAwarded?: string;
}

/**
 * Build a `Course` schema for the homepage.
 *
 * Google Course requirements: `name`, `description`, `provider`.
 * `hasCourseInstance` is recommended to surface delivery modes.
 */
export function buildCourseSchema(args: BuildCourseSchemaArgs) {
  const { courseName, courseDescription, siteUrl, modules, credentialAwarded } =
    args;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: courseName,
    description: courseDescription,
    url: absUrl(siteUrl, "/"),
    provider: {
      "@type": "Organization",
      name: "Andamio",
      url: BRANDING.links.andamio,
    },
    ...(credentialAwarded
      ? { educationalCredentialAwarded: credentialAwarded }
      : {}),
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        name: `${courseName} — self-paced (web)`,
        courseMode: "online",
        courseWorkload: "PT20H",
      },
    ],
    hasPart: modules
      .filter((m) => m.moduleCode)
      .map((m) => ({
        "@type": "Course",
        name: m.title ?? `Module ${m.moduleCode}`,
        ...(m.description ? { description: m.description } : {}),
        url: absUrl(siteUrl, `/learn/${m.moduleCode}/1`),
      })),
  };
}

// =============================================================================
// LearningResource (per-lesson)
// =============================================================================

export interface BuildLearningResourceArgs {
  lesson: Lesson;
  module: CourseModule;
  lessonIndex: number;
  /** Description copy to use; already resolved by caller (fallback chain applied). */
  description: string;
  siteUrl: string;
}

export function buildLearningResourceSchema(args: BuildLearningResourceArgs) {
  const { lesson, module, lessonIndex, description, siteUrl } = args;
  const moduleCode = module.moduleCode ?? "";
  const lessonUrl = absUrl(siteUrl, `/learn/${moduleCode}/${lessonIndex}`);

  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title ?? `Lesson ${lessonIndex}`,
    description,
    url: lessonUrl,
    learningResourceType: "Lesson",
    inLanguage: "en",
    isPartOf: {
      "@type": "Course",
      name: BRANDING.name,
      url: absUrl(siteUrl, "/"),
    },
  };
}

// =============================================================================
// BreadcrumbList
// =============================================================================

export function buildBreadcrumbList(items: BreadcrumbItem[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: /^https?:\/\//i.test(item.item)
        ? item.item
        : absUrl(siteUrl, item.item),
    })),
  };
}

// =============================================================================
// FAQPage
// =============================================================================

export function buildFAQPage(entries: FAQEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}
