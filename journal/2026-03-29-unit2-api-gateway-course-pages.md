# Unit 2: API Gateway Proxy & Course Content Pages

**Date:** 2026-03-29
**Branch:** feat/midnight-pbl-site-phase-1

## What was built

The complete read-only course browsing experience:

1. **Server-side API gateway** (`app/lib/gateway.server.ts`) — direct calls to Andamio API with retry logic and timeout. Used in route loaders for SSR.

2. **Client-side API proxy** (`app/routes/api/gateway-proxy.ts`) — catch-all resource route at `/api/gateway/*` that forwards requests with the API key injected server-side. Verified API key does NOT leak to client bundle.

3. **Client gateway helpers** (`app/lib/gateway.ts`) — framework-agnostic fetch wrappers that route through the proxy. Includes `GatewayError` class and type guards.

4. **Shared utilities** (`app/lib/api-utils.ts`) — `withTimeout`, `fetchWithRetry` (5xx only, linear backoff), `ApiError` class.

5. **React Query hooks** — colocated types pattern from cardano-xp:
   - `use-course.ts`: CourseModule, SLT, Lesson, Assignment, Introduction types + transforms + `useCourseModules` hook
   - `use-course-content.ts`: `useSLTs`, `useLesson`, `useAssignment`, `useIntroduction` hooks
   - `query-keys.ts`: centralized key factories

6. **Four content routes** (all with `shouldRevalidate: false`):
   - `/learn` — course overview with module grid
   - `/learn/:moduleCode` — module detail with intro, SLT list, assignment link
   - `/learn/:moduleCode/:lessonIndex` — lesson with prev/next nav
   - `/learn/:moduleCode/assignment` — assignment shell (submission UI in Unit 5)

7. **UI components** — `ModuleCard`, `ModuleHeader`, `SLTList`, `LessonContent` (TipTap JSON -> Markdown -> react-markdown)

8. **Markdown rendering** — `react-markdown` + `remark-gfm` + `rehype-highlight`, custom `.prose-midnight` styles in globals.css

## Key decisions

- **Types colocated with hooks** rather than a separate types directory. Transforms are exported for server-side reuse — single source of truth.
- **Assignment route ordered before `:lessonIndex`** in routes.ts to prevent "assignment" from being captured by the parameterized segment.
- **TipTap JSON extraction** — lessons store content as ProseMirror/TipTap JSON. `LessonContent` walks the JSON tree extracting markdown, then renders via react-markdown. This avoids a TipTap dependency for read-only rendering.
- **`shouldRevalidate: false`** on all content routes — course content is static, no need to re-fetch on back-navigation.

## Verification

- `npx tsc --noEmit` passes
- `npm run build` succeeds
- API key confirmed absent from client bundle
- Route structure: landing (standalone) + app-layout wrapping learn/* routes + resource-only gateway proxy
