---
phase: 10-client-detail-depth
plan: 02
subsystem: ui
tags: [cross-case-activity, expenses, outstanding, drill-down-modal, flatlist, i18n]

# Dependency graph
requires:
  - phase: 10-client-detail-depth
    provides: IClientAggregationService with 4 methods, ClientActivity/ClientExpenseItem/ClientOutstandingSummary types, ACTIVITY_TYPE_ICONS, i18n keys
  - phase: 08-billing-invoicing
    provides: Invoice type with payments for outstanding aggregation
  - phase: 05-case-notes-time-expense
    provides: TimeEntry, Expense types for expense aggregation
provides:
  - Recent Activity section with 3-item preview and See All navigation
  - Upcoming Activity section with 3-item preview and See All navigation
  - Full activity list screen (activity.tsx) with FlatList
  - Expenses section grouped by case with total sum
  - Outstanding summary card with grand total and per-invoice drill-down modal
  - Complete client detail page with all cross-case sections
affects: [client-detail-depth, 11-directory-search-finalization]

# Tech tracking
tech-stack:
  added: []
  patterns: [grouped-by-case expense rendering with color-coded left borders, outstanding drill-down modal with per-invoice detail]

key-files:
  created:
    - app/(tabs)/clients/activity.tsx
  modified:
    - app/(tabs)/clients/[id].tsx
    - app/(tabs)/clients/_layout.tsx

key-decisions:
  - "formatRSD defined inline in component (consistent with v1.1 decision for Serbian number formatting)"
  - "Outstanding drill-down uses Modal pattern (consistent with existing communication/document modals in the file)"

patterns-established:
  - "Expense grouping: group by caseId with case name headers, golden left border for time entries, green for expenses"
  - "EmptyState reusable local component: icon + text centered, used across all new sections"

# Metrics
duration: 4min
completed: 2026-04-11
---

# Phase 10 Plan 02: Cross-case Activity, Expenses, and Outstanding Sections Summary

**4 new cross-case sections on client detail (Recent Activity, Upcoming Activity, Expenses grouped by case, Outstanding with drill-down modal) plus See All activity screen**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-11T15:54:58Z
- **Completed:** 2026-04-11T15:58:44Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Client detail page now shows Recent Activity and Upcoming Activity sections with 3-item previews, distinct icons per activity type, and case names on every item
- "See all" navigation links open full activity list screen (activity.tsx) with FlatList for both recent and upcoming modes
- Expenses section displays total sum at top and items grouped by case with color-coded left borders (golden for time entries, green for expenses)
- Outstanding summary card shows grand total in red with a "View Details" button that opens a drill-down modal showing per-invoice breakdown
- All 5 new sections placed in correct order: Documents > Recent Activity > Upcoming Activity > Expenses > Outstanding (before Linked Cases)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Recent Activity and Upcoming Activity sections with See All screen** - `01cbf22` (feat)
2. **Task 2: Add Expenses section and Outstanding summary card with drill-down** - `1059516` (feat)

## Files Created/Modified
- `app/(tabs)/clients/[id].tsx` - Added 4 new sections (Recent Activity, Upcoming Activity, Expenses, Outstanding), EmptyState and ActivityItem local components, formatRSD helper, groupExpensesByCase renderer, outstanding drill-down modal
- `app/(tabs)/clients/activity.tsx` - New screen for full activity list with FlatList, accepts clientId/mode/clientName params
- `app/(tabs)/clients/_layout.tsx` - Added Stack.Screen route for activity screen

## Decisions Made
- formatRSD defined inline in component (consistent with v1.1 decision for Serbian number formatting per screen)
- Outstanding drill-down uses Modal pattern (consistent with existing communication/document modals already in the file)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Client detail page is now complete with all cross-case sections (documents, activity, expenses, outstanding)
- Phase 10 (Client Detail Depth) is fully complete
- Ready for Phase 11 (Directory, Search, and Finalization)

## Self-Check: PASSED

All 3 files verified present. Both commit hashes (01cbf22, 1059516) confirmed in git log.

---
*Phase: 10-client-detail-depth*
*Completed: 2026-04-11*
