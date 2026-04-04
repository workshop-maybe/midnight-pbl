---
title: "feat: Add copy button to code blocks"
type: feat
status: completed
date: 2026-04-04
---

# feat: Add copy button to code blocks

## Overview

Add a copy-to-clipboard button to every code block on lesson pages. Lesson pages are prerendered with zero client JS, so this will be a small vanilla JS script — no React island needed.

## Problem Frame

Code examples on lesson pages (especially Compact/TypeScript) are reference material that learners need to paste into their own projects. Currently they must manually select text inside `<pre>` blocks, which is error-prone (easy to miss leading/trailing whitespace or grab the language label text).

## Requirements Trace

- R1. Every `<pre>` block inside `.prose-midnight` gets a visible copy button
- R2. Clicking the button copies the code text (not the language label) to the clipboard
- R3. Visual feedback confirms the copy succeeded
- R4. Button styling matches the existing Midnight dark theme (dark bg, muted text, gold accent on interaction)
- R5. Works on prerendered lesson pages without adding a React island

## Scope Boundaries

- Assignment pages and dashboard are out of scope (they use React islands with different rendering)
- No changes to the markdown rendering pipeline — the button is injected client-side
- No external clipboard library — use the native `navigator.clipboard` API

## Context & Research

### Relevant Code and Patterns

- `src/lib/markdown.ts:82` — code block HTML output: `<pre><code class="hljs language-{lang}" data-language="{lang}">...</code></pre>`
- `src/styles/globals.css:230-262` — existing `<pre>` styles including `position: relative` (already set, good for absolute positioning of the button)
- `src/styles/globals.css:247-262` — language label uses `::before` pseudo-element positioned `top: 0; right: 0`
- `src/pages/learn/[moduleCode]/[lessonIndex].astro:90` — content injected via `set:html={contentHtml}` into `<article class="prose-midnight">`

### Key Constraint

The language label already occupies `top-right` via a `::before` pseudo-element on `<code>`. The copy button needs to avoid overlapping — it should sit to the left of the language label, or below it, or in a different corner.

## Key Technical Decisions

- **Vanilla JS, not React island**: Lesson pages have zero client JS. A small `<script>` tag keeps the page weight minimal and avoids hydration overhead for a simple DOM interaction.
- **Button injected via JS, not server-rendered**: The `renderMarkdown` pipeline produces sanitized HTML from TipTap JSON. Injecting buttons server-side would mean adding non-content elements into the content pipeline and dealing with sanitization. Client-side injection is cleaner.
- **`navigator.clipboard.writeText`**: Supported in all modern browsers. No fallback needed for this audience (developers learning Midnight).
- **Button position — top-right, shift language label**: Place the copy button at `top: 0; right: 0` and shift the language label to sit to its left. This keeps the toolbar area compact. Alternatively, position the copy button at bottom-right to avoid the label entirely.

## Implementation Units

- [x] **Unit 1: Copy button script and styles**

  **Goal:** Add a client-side script that injects copy buttons into code blocks and CSS to style them.

  **Requirements:** R1, R2, R3, R4, R5

  **Dependencies:** None

  **Files:**
  - Create: `src/components/CodeCopyButton.astro` — Astro component containing `<script>` and `<style>` tags
  - Modify: `src/pages/learn/[moduleCode]/[lessonIndex].astro` — include the component
  - Modify: `src/styles/globals.css` — adjust language label positioning if the copy button shares the top-right corner

  **Approach:**
  - Create an Astro component with an inline `<script>` that runs on page load
  - Script queries all `.prose-midnight pre` elements, creates a button element for each, appends it to the `<pre>`
  - Button click handler: grab `pre > code` text content, call `navigator.clipboard.writeText()`, swap button text/icon to "Copied!" for ~2s
  - Style the button to match the theme: small, semi-transparent dark background, positioned absolute within the `<pre>` (which already has `position: relative`)
  - Adjust the existing language label CSS so the label and button don't overlap

  **Patterns to follow:**
  - The existing language label pattern (absolute positioning inside `<pre>`, muted colors, small font) — the copy button should feel like a sibling element
  - Existing Midnight color tokens in `globals.css`

  **Test scenarios:**
  - Happy path: code block with a language label — button appears, clicking copies code text, feedback shows "Copied!"
  - Happy path: code block without a language label — button still appears and works
  - Edge case: very short code block (one line) — button doesn't overflow or obscure content
  - Edge case: code block with horizontal scroll — button stays fixed in position (doesn't scroll with content)

  **Verification:**
  - Visit a lesson page, see copy buttons on all code blocks
  - Click a button, paste elsewhere, confirm the copied text matches the code block content (no language label text, no extra whitespace)
  - Button shows "Copied!" feedback briefly, then resets
  - `npm run build` succeeds, `npm run typecheck` passes

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `navigator.clipboard` requires secure context (HTTPS) | Production is on Cloud Run with HTTPS. Dev server on localhost also qualifies as secure context. |

## Sources & References

- Existing code block styles: `src/styles/globals.css:230-262`
- Lesson page template: `src/pages/learn/[moduleCode]/[lessonIndex].astro`
