---
phase: 04-dashboard-search-and-notifications
plan: 01
subsystem: ui
tags: [zustand, i18n, react-native, expo-router, dashboard, notifications, fab, urgency-colors]

# Dependency graph
requires:
  - phase: 03-documents-calendar
    provides: CalendarEvent types, mock calendar data, calendar screens for navigation
  - phase: 02-client-case
    provides: CaseSummary types, mock case/client data, case/client screens for navigation
  - phase: 01-foundation
    provides: Service layer, i18n framework, Zustand stores, theme tokens
provides:
  - Interactive home dashboard with service-layer-driven stats, navigable elements, urgency deadlines
  - AppNotification type, UrgencyLevel, URGENCY_COLORS, getDeadlineUrgency utility
  - INotificationService interface and mock implementation
  - Zustand notification store with synchronous init and mark-as-read actions
  - i18n namespaces for home, search, and notifications screens (en, sr-Latn, sr-Cyrl)
affects: [04-02-search-notifications-screens]

# Tech tracking
tech-stack:
  added: []
  patterns: [useFocusEffect data refresh, speed-dial FAB with backdrop, urgency color system]

key-files:
  created:
    - src/services/mock/data/notifications.ts
    - src/stores/notification-store.ts
    - src/i18n/locales/en/home.json
    - src/i18n/locales/en/search.json
    - src/i18n/locales/en/notifications.json
    - src/i18n/locales/sr-Latn/home.json
    - src/i18n/locales/sr-Latn/search.json
    - src/i18n/locales/sr-Latn/notifications.json
    - src/i18n/locales/sr-Cyrl/home.json
    - src/i18n/locales/sr-Cyrl/search.json
    - src/i18n/locales/sr-Cyrl/notifications.json
  modified:
    - src/services/types.ts
    - src/services/mock/mock-client.ts
    - src/i18n/index.ts
    - app/(tabs)/index.tsx

key-decisions:
  - "Synchronous notification store init with mockNotifications to avoid badge flicker"
  - "Speed-dial FAB with backdrop overlay for clear action dismissal"
  - "STATUS_COLORS from types.ts used for case status badges instead of local statusColors map"

patterns-established:
  - "Urgency color system: getDeadlineUrgency + URGENCY_COLORS for consistent deadline urgency across screens"
  - "Speed-dial FAB: backdrop + positioned action pills pattern for quick actions"
  - "useFocusEffect + isMounted pattern for data refresh on screen focus"

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 4 Plan 1: Home Dashboard and Notification Foundation Summary

**Interactive home dashboard with service-layer stats, urgency-colored deadlines, speed-dial FAB, notification store, and 3 new i18n namespaces**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T07:53:22Z
- **Completed:** 2026-03-12T07:58:41Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Transformed static home screen into data-driven dashboard loading stats via service layer with useFocusEffect refresh
- Three tappable stat cards (clients, cases, deadlines) with navigation to respective tabs
- Deadline items display urgency color indicators (today=red, 1d=orange, 3d=amber, 7d=yellow) using getDeadlineUrgency
- Speed-dial FAB with backdrop opens to 3 quick actions: new client, new case, scan document
- Bell icon in header shows unread notification count badge from Zustand notification store
- All dashboard elements navigable: stat cards, case cards, deadline rows, search bar
- Notification data layer (types, mock data, store, service) ready for Plan 02's notification screen
- 9 i18n JSON files (home, search, notifications) for all 3 locales ready for Plan 02

## Task Commits

Each task was committed atomically:

1. **Task 1: Add notification types, mock data, notification store, and i18n namespaces** - `3a88e05` (feat)
2. **Task 2: Enhance home screen with service layer, navigation, urgency deadlines, and speed-dial FAB** - `4943446` (feat)

## Files Created/Modified
- `src/services/types.ts` - Added AppNotification, UrgencyLevel, URGENCY_COLORS, getDeadlineUrgency, INotificationService, updated ServiceRegistry
- `src/services/mock/data/notifications.ts` - 11 mock notifications with mixed urgency/read states
- `src/services/mock/mock-client.ts` - Added mockNotificationService to mockServices
- `src/stores/notification-store.ts` - Zustand store with synchronous init, markAsRead, markAllAsRead
- `src/i18n/index.ts` - Added imports and registrations for home, search, notifications namespaces
- `src/i18n/locales/en/home.json` - English home dashboard translations
- `src/i18n/locales/en/search.json` - English search translations
- `src/i18n/locales/en/notifications.json` - English notification translations
- `src/i18n/locales/sr-Latn/home.json` - Serbian Latin home translations
- `src/i18n/locales/sr-Latn/search.json` - Serbian Latin search translations
- `src/i18n/locales/sr-Latn/notifications.json` - Serbian Latin notification translations
- `src/i18n/locales/sr-Cyrl/home.json` - Serbian Cyrillic home translations
- `src/i18n/locales/sr-Cyrl/search.json` - Serbian Cyrillic search translations
- `src/i18n/locales/sr-Cyrl/notifications.json` - Serbian Cyrillic notification translations
- `app/(tabs)/index.tsx` - Complete rewrite: service layer, navigation, urgency deadlines, FAB

## Decisions Made
- Used synchronous notification store initialization with mockNotifications directly (not async load) to prevent badge count flicker on app start
- Replaced local statusColors map with STATUS_COLORS from types.ts for consistent case status badges across the app
- Speed-dial FAB uses full-screen semi-transparent backdrop for intuitive dismissal

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Notification store, types, and mock data ready for Plan 02's notification list screen
- i18n namespaces (search, notifications) ready for Plan 02's search and notification screens
- Home dashboard navigation links to search (/(tabs)/more/search) and notifications (/(tabs)/more/notifications) ready for Plan 02

## Self-Check: PASSED

All 15 files verified present. Both commit hashes (3a88e05, 4943446) confirmed. Key exports (useNotificationStore, INotificationService in ServiceRegistry, getDeadlineUrgency, URGENCY_COLORS) verified.

---
*Phase: 04-dashboard-search-and-notifications*
*Completed: 2026-03-12*
