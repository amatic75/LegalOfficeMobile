---
phase: 10-client-detail-depth
plan: 01
subsystem: api, ui
tags: [mock-services, aggregation, i18n, image-picker, document-picker, expo]

# Dependency graph
requires:
  - phase: 06-enhanced-documents-clients-calendar-and-mobile
    provides: IClientDocumentService, ClientDocument type, mock client documents
  - phase: 08-billing-invoicing
    provides: IBillingService, Invoice type with payments
  - phase: 05-case-notes-time-expense
    provides: ICaseNoteService, ITimeEntryService, IExpenseService
provides:
  - ClientActivity, ClientExpenseItem, ClientOutstandingSummary types
  - IClientAggregationService with 4 cross-case aggregation methods
  - ACTIVITY_TYPE_ICONS constant
  - File picker and camera capture on client document section
  - i18n keys for 5 new client detail sections (en, sr-Latn, sr-Cyrl)
affects: [10-02-PLAN, client-detail-depth]

# Tech tracking
tech-stack:
  added: []
  patterns: [cross-case aggregation service, file picker + camera capture on client documents]

key-files:
  created: []
  modified:
    - src/services/types.ts
    - src/services/mock/mock-client.ts
    - src/i18n/locales/en/clients.json
    - src/i18n/locales/sr-Latn/clients.json
    - src/i18n/locales/sr-Cyrl/clients.json
    - app/(tabs)/clients/[id].tsx

key-decisions:
  - "Aggregation service implemented as separate IClientAggregationService rather than extending existing per-entity services"
  - "File picker and camera capture added as inline buttons within document section card, not as a separate screen"

patterns-established:
  - "Cross-case aggregation: service pulls data from multiple existing services (cases, notes, events, time entries, expenses, invoices) and maps to unified types"

# Metrics
duration: 5min
completed: 2026-04-11
---

# Phase 10 Plan 01: Client Aggregation Services, Document Upload, and i18n Summary

**Cross-case aggregation service with 4 methods (activity, expenses, outstanding), file picker + camera capture on client documents, i18n keys for 5 new sections in 3 locales**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-11T15:47:35Z
- **Completed:** 2026-04-11T15:52:22Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- ClientActivity, ClientExpenseItem, ClientOutstandingSummary types and IClientAggregationService interface added to ServiceRegistry
- Mock aggregation service implements getRecentActivity, getUpcomingActivity, getExpenses, getOutstandingSummary across all of a client's linked cases
- Client detail document section now supports file picker (PDF, JPEG, PNG) and camera capture with permission handling
- i18n keys added for documents, recentActivity, upcomingActivity, expenses, and outstanding sections in all 3 locales (en, sr-Latn, sr-Cyrl)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ClientActivity type, aggregation service interfaces, and mock implementations** - `c58e699` (feat)
2. **Task 2: Upgrade client document section with file picker and camera capture** - `2b8123b` (feat)

## Files Created/Modified
- `src/services/types.ts` - Added ClientActivity, ClientExpenseItem, ClientOutstandingSummary types, IClientAggregationService interface, ACTIVITY_TYPE_ICONS constant
- `src/services/mock/mock-client.ts` - Implemented mockClientAggregationService with 4 cross-case aggregation methods
- `src/i18n/locales/en/clients.json` - Added i18n keys for documents, recentActivity, upcomingActivity, expenses, outstanding
- `src/i18n/locales/sr-Latn/clients.json` - Serbian Latin translations for all 5 new sections
- `src/i18n/locales/sr-Cyrl/clients.json` - Serbian Cyrillic translations for all 5 new sections
- `app/(tabs)/clients/[id].tsx` - Added ImagePicker and DocumentPicker imports, upload/capture handlers, and action buttons

## Decisions Made
- Aggregation service implemented as separate IClientAggregationService rather than extending existing per-entity services — keeps service boundaries clean and avoids modifying stable interfaces
- File picker and camera capture added as inline buttons within the document section card (not a separate screen) — matches the compact client detail page layout

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All types, service interfaces, mock implementations, and i18n keys ready for Plan 02 to render the 5 new sections
- Document upload UX (file picker + camera) is functional and can be tested immediately
- No blockers for Plan 02

## Self-Check: PASSED

All 7 files verified present. Both commit hashes (c58e699, 2b8123b) confirmed in git log.

---
*Phase: 10-client-detail-depth*
*Completed: 2026-04-11*
