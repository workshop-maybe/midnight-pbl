# Progress Schema

## File Location

- Plugin context: `${CLAUDE_PLUGIN_DATA}/progress.json`
- Clone context: `./progress.json` (project root)

## Schema

```json
{
  "version": 1,
  "course": "midnight-for-cardano-devs",
  "started_at": "2026-04-06T10:00:00Z",
  "last_active": "2026-04-06T14:30:00Z",
  "current_module": 101,
  "current_lesson": 1,
  "modules": {
    "101": {
      "status": "in_progress",
      "started_at": "2026-04-06T10:00:00Z",
      "completed_at": null,
      "lessons": {
        "1": "completed",
        "2": "in_progress",
        "3": "not_started"
      },
      "assignment": "not_submitted"
    },
    "102": {
      "status": "locked",
      "started_at": null,
      "completed_at": null,
      "lessons": {
        "1": "not_started",
        "2": "not_started",
        "3": "not_started"
      },
      "assignment": "not_submitted"
    }
  }
}
```

## Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| `version` | number | Schema version. Currently 1. |
| `course` | string | Course slug. Always `midnight-for-cardano-devs`. |
| `started_at` | ISO 8601 | When the learner first started the course |
| `last_active` | ISO 8601 | Last interaction timestamp. Update on every state change. |
| `current_module` | number | Module the learner is currently working on (101–106) |
| `current_lesson` | number | Lesson number within current module (1–3) |

## Module Status Values

| Status | Meaning |
|--------|---------|
| `locked` | Prerequisites not met. Cannot access. |
| `unlocked` | Prerequisites met. Not started. |
| `in_progress` | At least one lesson started. |
| `completed` | Assignment accepted by assessor. |

## Lesson Status Values

| Status | Meaning |
|--------|---------|
| `not_started` | Lesson not yet delivered |
| `in_progress` | Lesson started but exercise not completed |
| `completed` | Lesson fully delivered including exercise |

## Assignment Status Values

| Status | Meaning |
|--------|---------|
| `not_submitted` | No submission yet |
| `submitted` | Evidence submitted, awaiting assessment |
| `revision_requested` | Assessor asked for revision |
| `accepted` | Assessor accepted — module complete |

## Initialization

On first run, create progress.json with:
- M101 status: `unlocked`
- M102–M106 status: `locked`
- All lessons: `not_started`
- All assignments: `not_submitted`
- `current_module`: 101
- `current_lesson`: 1

## Lesson Inventory per Module

| Module | Lessons |
|--------|---------|
| 101 | 1, 2, 3 |
| 102 | 1, 2, 3 |
| 103 | 1, 2, 3 |
| 104 | 1, 2, 3 |
| 105 | 1, 2, 3 |
| 106 | 1, 2 (lesson 3 pending) |
