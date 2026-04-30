---
phase: 02-client-and-case-management
plan: 01
subsystem: ui
tags: [react-native, flatlist, zustand, i18n, crud, validation, expo-router, linking]

# Dependency graph
requires:
  - phase: 01-foundation-and-app-shell
    provides: "Tab navigation shell, service layer with mock data, i18n infrastructure, design tokens"
provides:
  - "Full client CRUD screens (list, detail, create, edit)"
  - "Extended IClientService/ICaseService with write operations"
  - "Representative type for corporate clients"
  - "CaseSubtype union, CASE_TYPE_SUBTYPES mapping, STATUS_TRANSITIONS, STATUS_COLORS constants"
  - "JMBG/PIB/MB/email/phone validation utilities"
  - "useDebounce hook for search"
  - "useClientStore for persistent search/filter state"
  - "clients i18n namespace in 3 locales"
affects: [02-02-cases, 03-documents-calendar]

# Tech tracking
tech-stack:
  added: []
  patterns: [FlatList-search-filter-refresh, dynamic-route-params, conditional-form, linking-actions, zustand-filter-store]

key-files:
  created:
    - app/(tabs)/clients/[id].tsx
    - app/(tabs)/clients/new.tsx
    - app/(tabs)/clients/edit/[id].tsx
    - src/hooks/useDebounce.ts
    - src/utils/validators.ts
    - src/stores/client-store.ts
    - src/i18n/locales/sr-Latn/clients.json
    - src/i18n/locales/sr-Cyrl/clients.json
    - src/i18n/locales/en/clients.json
  modified:
    - src/services/types.ts
    - src/services/mock/mock-client.ts
    - src/services/mock/data/clients.ts
    - src/i18n/index.ts
    - app/(tabs)/clients/_layout.tsx
    - app/(tabs)/clients/index.tsx

key-decisions:
  - "Mutable mock arrays for session-persistent CRUD instead of returning static data"
  - "Form duplication between new and edit screens for simplicity over shared component abstraction"
  - "Client type indicator read-only on edit screen (cannot change type after creation)"

patterns-established:
  - "FlatList with search bar, filter chips, and pull-to-refresh for entity lists"
  - "Dynamic route with useLocalSearchParams + Stack.Screen options for detail screens"
  - "Conditional form with type toggle for individual/corporate variants"
  - "Linking.openURL for phone/email contact actions with golden color indicating tappability"
  - "Zustand store for UI filter state that persists across tab switches"

# Metrics
duration: 9min
completed: 2026-03-11
---

# Phase 2 Plan 1: Client Management Summary

**Searchable/filterable client list with detail profiles, JMBG/PIB-validated create/edit forms, tappable phone/email via Linking, and mutable mock CRUD layer**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-11T13:54:34Z
- **Completed:** 2026-03-11T14:04:22Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Full client list with FlatList, debounced search, 3 filter chips (All/Individual/Corporate), pull-to-refresh, and FAB for new client
- Client detail screen with profile card, info section, tappable phone/email (Linking.openURL), corporate representatives, and linked cases with status badges
- Create/edit forms with individual/corporate toggle, JMBG checksum validation, PIB/MB digit validation, and inline error display
- Extended type system with Representative, CaseSubtype, STATUS_TRANSITIONS, STATUS_COLORS, and full CRUD service interfaces
- Session-persistent mock service layer with mutable in-memory arrays for create/update operations

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend data layer, utilities, i18n, and store** - `e78c4cf` (feat)
2. **Task 2: Build client screens with navigation** - `4da6648` (feat)

## Files Created/Modified
- `src/services/types.ts` - Extended with Representative, CaseSubtype, CASE_TYPE_SUBTYPES, STATUS_TRANSITIONS, STATUS_COLORS, and CRUD service methods
- `src/services/mock/mock-client.ts` - Mutable mock client/case services with create, update, search, getCases, updateCaseStatus
- `src/services/mock/data/clients.ts` - Added representatives arrays to corporate clients (c3, c5, c7)
- `src/hooks/useDebounce.ts` - Generic debounce hook with configurable delay
- `src/utils/validators.ts` - JMBG (modulo-11 checksum), PIB, MB, email, phone, required field validators
- `src/stores/client-store.ts` - Zustand store for searchQuery and typeFilter persistence
- `src/i18n/index.ts` - Registered clients namespace for all 3 locales
- `src/i18n/locales/sr-Latn/clients.json` - Client translations in Serbian Latin
- `src/i18n/locales/sr-Cyrl/clients.json` - Client translations in Serbian Cyrillic
- `src/i18n/locales/en/clients.json` - Client translations in English
- `app/(tabs)/clients/_layout.tsx` - Stack layout with screen-specific titles for index, [id], new, edit/[id]
- `app/(tabs)/clients/index.tsx` - Full client list replacing placeholder
- `app/(tabs)/clients/[id].tsx` - Client detail with profile, contacts, representatives, linked cases
- `app/(tabs)/clients/new.tsx` - Create client form with type toggle and validation
- `app/(tabs)/clients/edit/[id].tsx` - Edit client form pre-filled with existing data

## Decisions Made
- Used mutable `let clients = [...mockClients]` at module level in mock-client.ts so CRUD mutations persist within a session (reset on app restart is acceptable for mock layer)
- Duplicated FormField component in new.tsx and edit/[id].tsx instead of creating a shared component -- keeps things simple and avoids premature abstraction
- Type indicator on edit screen is read-only (no toggle) since changing client type after creation would lose data fields
- Cross-tab linked case navigation (`router.push('/(tabs)/cases/' + id)`) from client detail -- case detail screen does not yet exist (Plan 02 will create it), so tapping navigates to a not-yet-built route (acceptable per plan)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Case management screens (Plan 02) can now build on the extended IClientService/ICaseService interfaces
- Case create form can use the client list for client picker since getClients/searchClients is operational
- STATUS_TRANSITIONS and STATUS_COLORS constants are ready for case status workflow
- CaseSubtype and CASE_TYPE_SUBTYPES mapping ready for case type/subtype picker
- The mutable mock service pattern established here should be followed for case CRUD

## Self-Check: PASSED

- All 15 files verified on disk
- Commit e78c4cf (Task 1) verified in git log
- Commit 4da6648 (Task 2) verified in git log
- TypeScript compiles with zero errors
- Metro bundler export completes successfully

---
*Phase: 02-client-and-case-management*
*Completed: 2026-03-11*
