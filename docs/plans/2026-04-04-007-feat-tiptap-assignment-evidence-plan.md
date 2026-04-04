---
title: "feat: TipTap editor for assignment evidence submission"
type: feat
status: active
date: 2026-04-04
---

# feat: TipTap editor for assignment evidence submission

## Overview

Replace the simple textarea + URL inputs evidence form with a TipTap rich text editor for assignment submissions. Evidence is stored as TipTap `JSONContent`, hashed with blake2b (matching the template reference implementation), and committed on-chain via the existing transaction flow.

## Problem Frame

The current `EvidenceForm` uses a plain textarea and URL inputs. For a developer PBL course, learners need rich formatting — code blocks, headings, lists, links — to properly document their evidence. The Andamio app template already has a production TipTap editor; this plan adapts a simplified version for the midnight-pbl-site's Astro island architecture.

## Requirements Trace

- R1. Assignment evidence is entered in a TipTap rich text editor with basic formatting (bold, italic, headings, lists, code blocks, links)
- R2. Evidence is stored as TipTap `JSONContent` and sent to the Andamio API
- R3. Evidence is hashed deterministically (blake2b, key-sorted normalization) before on-chain commitment
- R4. Read-only evidence display uses TipTap viewer for previously submitted content
- R5. The existing assignment status branches (NOT_STARTED, IN_PROGRESS, PENDING_APPROVAL, etc.) continue working with the new editor
- R6. Editor works as a React island (`client:only="react"`) — no SSR

## Scope Boundaries

- No image upload or drag-and-drop — text-only editor
- No fullscreen/focus mode — keep the editor simple
- No tables — unnecessary for evidence submission
- Toolbar limited to essentials: bold, italic, heading, bullet list, ordered list, code block, link
- No changes to the assignment Astro page or server-side rendering
- No changes to the transaction flow (`useTransaction`, API routes, SSE watcher)

## Context & Research

### Relevant Code and Patterns

- **Template ContentEditor**: `~/projects/01-projects/andamio-platform/andamio-app-template/src/components/editor/components/ContentEditor/index.tsx` — full-featured editor (610 lines). We adapt a simplified version.
- **Template SharedExtensionKit**: `~/projects/01-projects/andamio-platform/andamio-app-template/src/components/editor/extension-kits/shared.ts` — extension configuration
- **Template hashing**: `~/projects/01-projects/andamio-platform/andamio-app-template/src/lib/hashing.ts` — blake2b + key-sorted normalization
- **Current EvidenceForm**: `src/components/assignment/EvidenceForm.tsx` — textarea + URL inputs (to be replaced)
- **Current EnrollmentFlow**: `src/components/assignment/EnrollmentFlow.tsx` — orchestrates DB save → TX, currently uses SHA-256 on `{notes, urls}`
- **Current AssignmentInteractive**: `src/components/assignment/AssignmentInteractive.tsx` — status-branching container

### Template TipTap Packages (all ^3.20.1)

Core: `@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`
Extensions needed: `@tiptap/extension-code-block-lowlight`, `@tiptap/extension-link`
Supporting: `lowlight`, `blakejs`

Extensions NOT needed (scope boundary): image, table/*, text-align, text-style, color, underline, bubble-menu

## Key Technical Decisions

- **Simplified editor, not full template port**: The template editor is 610 lines with fullscreen mode, image upload, word count, and a 1100-line toolbar. We build a ~150-line editor with a compact toolbar covering essentials. Rationale: less code to maintain, faster to ship, sufficient for evidence submission.
- **blake2b hashing over SHA-256**: Matches the template reference implementation. Uses `blakejs` package + key-sorted normalization for deterministic hashing of JSONContent. The current SHA-256 approach hashes `{notes, urls}` — since we're changing the evidence format anyway, switching hash algorithm is safe.
- **Reuse existing EnrollmentFlow orchestration**: The DB-save → TX flow doesn't change. Only the evidence shape changes from `{notes, urls}` to `JSONContent`, and the hash function changes.
- **TipTap viewer for read-only display**: Use `@tiptap/react` with `editable: false` for displaying submitted evidence. This ensures rendering parity between what was written and what is displayed.
- **StarterKit for base extensions**: Provides heading, bold, italic, strike, hard break, code, history (undo/redo), bullet list, ordered list, list item, blockquote out of the box. Add code-block-lowlight and link separately.

## Open Questions

### Resolved During Planning

- **Which TipTap version?**: Use `^3.20.1` matching the template. TipTap v3 is current and stable.
- **How to handle existing evidence in old format?**: The `AssignmentInteractive` already handles `networkEvidence` as `EvidencePayload | null`. For old-format evidence (`{notes, urls}`), the viewer falls back to displaying it as plain text. New submissions use JSONContent.

### Deferred to Implementation

- **Exact toolbar button styling**: Will follow the Midnight dark theme but exact CSS deferred to implementation.
- **Code block language list**: Which languages to register with lowlight — defer to what highlight.js common subset provides.

## Implementation Units

- [ ] **Unit 1: Add TipTap dependencies**

  **Goal:** Install TipTap packages and blake2b hashing library.

  **Requirements:** R1, R3

  **Dependencies:** None

  **Files:**
  - Modify: `package.json`

  **Approach:**
  - Install: `@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-code-block-lowlight`, `@tiptap/extension-link`, `lowlight`, `blakejs`
  - Verify `npm run typecheck` still passes after install

  **Verification:**
  - All packages in `package.json`, `npm install` succeeds, typecheck passes

- [ ] **Unit 2: Evidence editor component**

  **Goal:** Create a simplified TipTap editor component for evidence submission with a compact toolbar.

  **Requirements:** R1, R6

  **Dependencies:** Unit 1

  **Files:**
  - Create: `src/components/editor/EvidenceEditor.tsx`

  **Approach:**
  - Single-file component with editor + toolbar (no separate toolbar file)
  - Use `useEditor` from `@tiptap/react` with StarterKit (heading levels 2-4, lists, blockquote, code, history), CodeBlockLowlight, and Link
  - Compact toolbar row with icon buttons: Bold, Italic, H2, H3, BulletList, OrderedList, CodeBlock, Link, Undo, Redo
  - Props: `content?: JSONContent`, `onContentChange?: (content: JSONContent) => void`, `placeholder?: string`, `disabled?: boolean`
  - Style to match Midnight dark theme: dark background, light text, gold accent for active toolbar buttons
  - `EditorContent` component from `@tiptap/react` renders the editing area

  **Patterns to follow:**
  - Template's `ContentEditor` for `useEditor` setup and `onContentChange` callback pattern (compare JSON before firing to avoid cursor jumping)
  - Template's `SharedExtensionKit` for extension configuration

  **Test scenarios:**
  - Happy path: Mount editor with no content → type text → onContentChange fires with JSONContent
  - Happy path: Mount editor with existing JSONContent → content renders in editor
  - Edge case: Empty editor → onContentChange should not fire with empty doc
  - Edge case: disabled=true → editor is not editable

  **Verification:**
  - Editor renders in a React island, accepts input, fires onContentChange with valid JSONContent

- [ ] **Unit 3: Evidence viewer component**

  **Goal:** Create a read-only TipTap viewer for displaying submitted evidence.

  **Requirements:** R4

  **Dependencies:** Unit 1

  **Files:**
  - Create: `src/components/editor/EvidenceViewer.tsx`

  **Approach:**
  - Use `useEditor` with `editable: false` and same extensions as the editor (ensures rendering parity)
  - Props: `content: JSONContent | null`
  - Fallback: if content is null or not valid JSONContent, show "No evidence submitted" message
  - Handle legacy evidence format: if content looks like `{notes, urls}` (old format), render as plain text

  **Patterns to follow:**
  - Template's `ContentViewer` component

  **Test scenarios:**
  - Happy path: Pass JSONContent → renders formatted content
  - Edge case: Pass null → shows fallback message
  - Edge case: Pass old-format `{notes: "...", urls: [...]}` → renders as plain text gracefully

  **Verification:**
  - Viewer renders JSONContent identically to how it was written in the editor

- [ ] **Unit 4: Blake2b evidence hashing**

  **Goal:** Add deterministic hashing of JSONContent evidence using blake2b with key-sorted normalization.

  **Requirements:** R3

  **Dependencies:** Unit 1

  **Files:**
  - Create: `src/lib/evidence-hash.ts`

  **Approach:**
  - Port `hashNormalizedContent` and `normalizeContentStructure` from template's `src/lib/hashing.ts`
  - Uses `blakejs` for blake2b (32-byte output → 64-char hex)
  - Normalization: recursively sort object keys alphabetically before hashing for deterministic output regardless of JSON key ordering
  - Export: `hashEvidence(content: JSONContent): string`

  **Patterns to follow:**
  - Template's `src/lib/hashing.ts` — direct port

  **Test scenarios:**
  - Happy path: Hash a JSONContent object → returns 64-char hex string
  - Happy path: Hash the same content twice → returns identical hash
  - Edge case: Hash content with keys in different order → returns identical hash (normalization works)

  **Verification:**
  - Hashing is deterministic and matches template behavior

- [ ] **Unit 5: Integrate editor into assignment flow**

  **Goal:** Replace EvidenceForm with EvidenceEditor in the assignment submission flow. Update EnrollmentFlow to handle JSONContent evidence and blake2b hashing.

  **Requirements:** R1, R2, R3, R5

  **Dependencies:** Units 2, 3, 4

  **Files:**
  - Modify: `src/components/assignment/EnrollmentFlow.tsx` — change evidence type from `EvidenceFormData` to `JSONContent`, use `hashEvidence` instead of SHA-256
  - Modify: `src/components/assignment/AssignmentInteractive.tsx` — replace `EvidenceForm` with `EvidenceEditor` for editing states, `EvidenceViewer` for read-only states
  - Modify: `src/hooks/api/course/use-assignment-commitment.ts` — update `EvidencePayload` type to accept `JSONContent`
  - Delete: `src/components/assignment/EvidenceForm.tsx` — no longer needed

  **Approach:**
  - `EnrollmentFlow` receives `JSONContent` from `EvidenceEditor` via `onContentChange` callback
  - On submit: hash with `hashEvidence()`, save to DB via gateway, then execute TX
  - The API payload shape changes: `evidence` field becomes JSONContent instead of `{notes, urls}`
  - `AssignmentInteractive` status branches:
    - NOT_STARTED / ASSIGNMENT_DENIED: Show `EvidenceEditor` inside `EnrollmentFlow`
    - IN_PROGRESS: Show `EvidenceEditor` with existing evidence pre-loaded
    - PENDING_APPROVAL: Show `EvidenceViewer` with submitted evidence (read-only)
  - Handle backward compatibility: if `networkEvidence` is old-format `{notes, urls}`, `EvidenceViewer` shows it as plain text

  **Patterns to follow:**
  - Current `EnrollmentFlow.handleSubmit()` flow (DB save → TX execute)
  - Template's `AssignmentCommitment` component for the lock/finalize pattern (optional — can keep the simpler direct-submit pattern)

  **Test scenarios:**
  - Happy path: Enter evidence in editor → submit → DB save succeeds → TX executes → commitment status updates
  - Happy path: Load existing JSONContent evidence → editor shows pre-filled content → update → new hash
  - Happy path: View submitted evidence in PENDING_APPROVAL state → viewer renders formatted content
  - Error path: DB save fails → error shown, TX not attempted
  - Error path: TX signing declined → error shown, evidence still saved in DB
  - Edge case: Empty editor → submit button disabled
  - Integration: Evidence hash in DB matches hash in on-chain TX params

  **Verification:**
  - Full assignment submission flow works end-to-end: enter evidence → submit → see pending status
  - Existing status branches continue rendering correctly
  - Build succeeds, typecheck passes

## System-Wide Impact

- **Interaction graph:** `EvidenceEditor` → `EnrollmentFlow.handleSubmit()` → `gatewayAuthPost` (DB save) → `useTransaction.execute` (on-chain TX) → `txStore.startWatching` (SSE confirmation). No new interactions — same flow, different evidence format.
- **Error propagation:** Unchanged. DB save errors prevent TX attempt. TX errors are caught and displayed.
- **State lifecycle risks:** None new. Evidence is saved to DB before TX, preventing orphaned on-chain records.
- **API surface parity:** The Andamio API accepts arbitrary JSON in the `evidence` field — no API changes needed.
- **Unchanged invariants:** Transaction flow, SSE watcher, auth store, dashboard queries — all unchanged.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| TipTap v3 SSR incompatibility with Astro | Use `client:only="react"` — editor never SSR'd. Same pattern as WalletController. |
| Bundle size increase from TipTap + lowlight | Only include common languages in lowlight. TipTap core is ~50KB gzipped — acceptable for interactive pages. |
| Old-format evidence display | EvidenceViewer has fallback for `{notes, urls}` format — displays as plain text. |

## Sources & References

- Template editor: `~/projects/01-projects/andamio-platform/andamio-app-template/src/components/editor/`
- Template hashing: `~/projects/01-projects/andamio-platform/andamio-app-template/src/lib/hashing.ts`
- Current assignment flow: `src/components/assignment/`
- Current evidence form: `src/components/assignment/EvidenceForm.tsx`
