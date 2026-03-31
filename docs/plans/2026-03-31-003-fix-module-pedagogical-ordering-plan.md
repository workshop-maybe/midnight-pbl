---
title: "fix: Sort modules by pedagogical order, not module code"
type: fix
status: active
date: 2026-03-31
---

# Fix Module Pedagogical Ordering

## Overview

Modules are sorted by module code (101-106), but the lesson content follows a different pedagogical sequence. The API investigation confirmed:

| Module Code | Lesson Prefix | Title | Intended Order |
|---|---|---|---|
| 104 | 1.x | Midnight Architecture | 1st |
| 105 | 2.x | Compact Fundamentals | 2nd |
| 106 | 3.x | Privacy Model | 3rd |
| 102 | 4.x | Developer Workflow | 4th |
| 103 | 5.x | Credential Systems | 5th |
| 101 | 6.x | Dual-Chain Architecture | 6th |

When sorted by code, "Module 1" (code 101) shows "Lesson 6.1" content — the curriculum's last module.

## Problem Frame

The Andamio API returns modules in on-chain hash order (arbitrary). The app's `sortModulesByCode` function sorts by module code string, which produces 101→106. But the course author numbered lessons 1.x through 6.x in a completely different sequence (104→105→106→102→103→101). There is no field in the API response that explicitly carries pedagogical order — the only signal is the lesson title prefix.

## Requirements Trace

- R1. Course overview grid must display modules in pedagogical order (1st through 6th)
- R2. "Module N" badge on cards must match the pedagogical position, not the code
- R3. Sidebar, lesson pages, and all navigation must be consistent with the new order
- R4. No hardcoded ordering — derive order from the lesson title prefix or a configuration map

## Scope Boundaries

- Do not change the API (it's an external service)
- Do not rename module codes on-chain
- Do not change lesson content titles
- Do not change URL structure — `/learn/101/1` still routes to module code 101, lesson index 1

## Key Technical Decisions

- **Use a config-driven ordering map instead of parsing lesson titles**: Parsing "Lesson N.x" from the first SLT's lesson title at runtime would require fetching all SLTs for all modules before rendering the overview — an expensive N+1 API call. A static map in `midnight.ts` is simpler, faster, and explicit. The course has 6 fixed modules; a config map is appropriate.

- **Sort order applied at the display layer, not in `sortModulesByCode`**: The `sortModulesByCode` utility is used by the server-side cache in `gateway.server.ts`. Changing its sort behavior would affect caching assumptions. Instead, apply pedagogical ordering in the components that render module lists (course-overview, dashboard).

## Open Questions

### Resolved During Planning

- **Where does the pedagogical order come from?** From the lesson title prefix (confirmed by API investigation). Since there's no API field for it, we encode it in config.
- **Should URLs change?** No. `/learn/101/1` stays. The module code is the stable identifier. Only display order and "Module N" labels change.

### Deferred to Implementation

- **What if a 7th module is added?** The config map will need updating. This is acceptable — course structure changes are rare and require content authoring anyway.

## Implementation Units

- [ ] **Unit 1: Add pedagogical order map to midnight.ts**

**Goal:** Define a static mapping from module code to pedagogical position.

**Requirements:** R4

**Dependencies:** None

**Files:**
- Modify: `app/config/midnight.ts`

**Approach:**
- Add a `moduleOrder` map to `MIDNIGHT_PBL` that maps module code → display position (1-based)
- Add a helper function to sort a `CourseModule[]` by pedagogical order, falling back to code order for unknown modules
- The map is: `{ "104": 1, "105": 2, "106": 3, "102": 4, "103": 5, "101": 6 }`

**Patterns to follow:**
- Existing `MIDNIGHT_PBL` config structure in `app/config/midnight.ts`

**Test scenarios:**
- Modules with codes in the map sort by their mapped position
- Unknown module codes sort after known ones

**Verification:**
- `MIDNIGHT_PBL.moduleOrder` exists and maps all 6 codes

---

- [ ] **Unit 2: Sort course overview by pedagogical order**

**Goal:** Module grid shows modules in curriculum sequence, with correct "Module N" numbering.

**Requirements:** R1, R2

**Dependencies:** Unit 1

**Files:**
- Modify: `app/routes/course-overview.tsx`

**Approach:**
- Replace the current `.sort()` by `parseInt(moduleCode)` with the new pedagogical sort helper
- The `index` passed to `ModuleCard` will now reflect pedagogical position

**Patterns to follow:**
- Current sort pattern in `course-overview.tsx` (sort before `.map()`)

**Test scenarios:**
- Module 104 appears first with label "Module 1"
- Module 101 appears last with label "Module 6"

**Verification:**
- Course overview at `/` shows modules in order: 104, 105, 106, 102, 103, 101

---

- [ ] **Unit 3: Sort dashboard progress by pedagogical order**

**Goal:** Dashboard module progress cards match the course overview order.

**Requirements:** R3

**Dependencies:** Unit 1

**Files:**
- Modify: `app/components/dashboard/dashboard-interactive.client.tsx`

**Approach:**
- Apply the same pedagogical sort to the modules list before rendering progress cards
- The `index` prop passed to `ModuleProgress` must reflect pedagogical position

**Patterns to follow:**
- Current sort in course-overview (Unit 2)

**Test scenarios:**
- Dashboard progress grid mirrors course overview order

**Verification:**
- Dashboard at `/dashboard` shows modules in same order as course overview

## Risks & Dependencies

- **Risk: Config map becomes stale** — If course structure changes (new modules, reordered curriculum), the config map must be updated manually. Mitigation: the map is in one file (`midnight.ts`) and is easy to find and update.

## Sources & References

- API investigation: modules endpoint returns codes 101-106 in hash order; lesson titles encode pedagogical sequence as "Lesson N.x"
- Current sort: `app/hooks/api/course/use-course.ts:367` (`sortModulesByCode`)
- Course overview sort: `app/routes/course-overview.tsx:70`
- Config file: `app/config/midnight.ts`
