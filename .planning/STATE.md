# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-11)

**Core value:** Lawyers can instantly look up case details, client info, and upcoming deadlines from their phone
**Current focus:** v1.2 Client Depth & Directory -- COMPLETE

## Current Position

Milestone: v1.2 Client Depth & Directory
Phase: 11 of 11 (Directory Management)
Plan: 2 of 2 complete
Status: v1.2 milestone complete
Last activity: 2026-04-20 — completed quick task 3: financial overview top KPI cards laid out as 2×2 grid

Progress: [##########] 100%

## Performance Metrics

**Lifetime velocity:**
- Total plans completed: 22 (v1.0: 9, v1.1: 10, v1.2: 3)
- Total execution time: 3h 9min
- Average duration: 9min/plan

**By milestone:**

| Milestone | Plans | Total Time | Avg/Plan |
|-----------|-------|------------|----------|
| v1.0 MVP | 9 | 1h 22min | 9.1min |
| v1.1 Enhanced Features | 10 | 1h 31min | 9.1min |
| v1.2 Client Depth & Directory | 4/4 | 21min | 5min |

Detailed phase-by-phase metrics archived in `.planning/milestones/v1.1-ROADMAP.md`.

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table and archived per-milestone in `.planning/milestones/v[X.Y]-ROADMAP.md`.

**Carried forward from prior milestones (still active):**
- [v1.0]: Inline styles over NativeWind, absolute paths in expo-router v6, mutable mock arrays for CRUD
- [v1.0]: ExpandableCalendar + AgendaList for weekly view (TimelineList unreliable)
- [v1.1]: SECTION_CARD shared style constant (white card with golden border)
- [v1.1]: EditableInfoRow pattern for inline tap-to-edit fields
- [v1.1]: formatRSD helper defined inline per screen for Serbian number formatting
- [v1.1]: expo-av for voice recording/playback (Expo Go compatible)
- [v1.1]: Long-press action menu instead of swipe gestures (Expo Go compatible)
- [v1.1]: Custom ToggleSwitch component (Pressable+View) for consistent golden styling
- [v1.1]: Filter modals use temp state pattern to allow cancel without applying
- [v1.1]: Modal pattern instead of gorhom bottom-sheet (SDK 54 stability)

**v1.2 decisions:**
- [10-01]: IClientAggregationService as separate service (not extending existing per-entity services)
- [10-01]: File picker/camera capture as inline buttons within document section card
- [10-02]: formatRSD defined inline per component (consistent with v1.1 pattern)
- [10-02]: Outstanding drill-down uses Modal pattern (consistent with existing modals in the file)
- [11-01]: In-screen Pressable tab bar for directory (not nested expo-router tabs)
- [11-01]: Unified IDirectoryService replaces ICourtService for all 3 entity types
- [11-02]: EditableInfoRow duplicated per detail screen (consistent with cases/[id].tsx pattern)
- [11-02]: MOCK_LAWYERS replaced with useFocusEffect + directory.getLawyers() for live search filter data

### Pending Todos

3 pending:
- `2026-04-20-directory-aware-editing-for-opposing-counsel-court-judge-lawyer` — opposing counsel link parity + directory-backed search picker + inline "create new" for court/judge/lawyer/opposing counsel on case detail and edit screens.
- `2026-04-20-time-and-expenses-card-revamp-currency-picker-datetime-paid-confirmation-client-rollup` — currency selector, datetime picker, paid-confirmation alert, prominent unpaid total, and client-page version with per-case grouping for the Vreme & Troskovi card.
- `2026-04-20-app-wide-navigation-history-policy-in-page-back-vs-tab-reset` — audit every in-page link to use `returnTo` so back returns to origin (cross-tab); verify bottom-tab presses fully reset history and back at a tab root does nothing.

Done this session:
- ~~`2026-04-20-financial-overview-top-kpi-cards-to-2x2-grid-layout`~~ → quick task 3 (commit `127c06d`).

(The 4 v1.1-era todos were absorbed into v1.2 milestone scope on 2026-04-11 and moved to `.planning/todos/done/`: client-page uploads, client-page activities timeline, client-page expenses, lawyers/judges/courts directory.)

### Blockers/Concerns

**Carried forward:**
- [RESOLVED] NativeWind v4 + Expo SDK 54 — inline styles preferred for reliability
- [RESOLVED] expo-router v6 relative routing — use absolute paths
- [RESOLVED] gorhom bottom-sheet SDK 54 stability — using Modal instead

**Technical debt carried into v1.2:**
- [RESOLVED] `MOCK_LAWYERS` inline in search screen (07-01) — replaced by directory service in 11-02
- `formatRSD` duplicated inline per billing/reporting screen — optional extraction when v1.2 touches client-expenses aggregation

**v1.2 blockers:** None known.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Mark expenses paid/unpaid, merge expense sections on client page, add directory navigation links | 2026-04-13 | a47a7a1 | [1-mark-expenses-paid-unpaid-merge-expense-](./quick/1-mark-expenses-paid-unpaid-merge-expense-/) |
| 2 | Add file upload and photo capture option (uncommitted in STATE — present on disk only, see `./quick/2-add-file-upload-and-photo-capture-option/`) | — | — | [2-add-file-upload-and-photo-capture-option](./quick/2-add-file-upload-and-photo-capture-option/) |
| 3 | Financial overview top KPI cards laid out as 2×2 grid | 2026-04-20 | 127c06d | [3-financial-overview-top-kpi-cards-to-2x2-](./quick/3-financial-overview-top-kpi-cards-to-2x2-/) |

## Session Continuity

Last session: 2026-04-13
Stopped at: Completed quick task 1 — expense paid/unpaid toggle, merged expenses section, directory navigation links
Resume file: None
