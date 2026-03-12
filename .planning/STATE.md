# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Lawyers can instantly look up case details, client info, and upcoming deadlines from their phone
**Current focus:** Phase 4 - Dashboard, Search, and Notifications

## Current Position

Phase: 4 of 4 (Dashboard, Search, and Notifications)
Plan: 1 of 2 in current phase -- COMPLETE
Status: Executing Phase 4
Last activity: 2026-03-12 -- Completed 04-01-PLAN.md

Progress: [█████░░░░░] 50% of Phase 4

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 11min
- Total execution time: 1.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 40min | 13min |
| 02-client-case | 2 | 18min | 9min |
| 03-documents-calendar | 2 | 21min | 10min |
| 04-dashboard-search-and-notifications | 1 | 5min | 5min |

**Recent Trend:**
- Last 5 plans: 02-01 (9min), 02-02 (9min), 03-01 (8min), 03-02 (13min), 04-01 (5min)
- Trend: stable/improving

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 4 phases at quick depth -- Foundation/Shell, Clients/Cases, Docs/Calendar, Dashboard/Search/Notifications
- [Roadmap]: Settings (language switcher, profile) grouped with Foundation since i18n is a foundation concern
- [Roadmap]: Clients and Cases combined into one phase -- same CRUD pattern, clients built first as case dependency
- [01-01]: SDK downgraded to 54 per user request -- expo-router v6, react 19.1.0, react-native 0.81.5
- [01-01]: Button uses useState for pressed state instead of Pressable className function -- avoids NativeWind type conflict
- [01-02]: auth-store uses dynamic import() for services to avoid circular dependency between stores and services
- [01-02]: LOCALES array uses native-script labels for intuitive language switcher UX
- [01-02]: Service layer created during i18n task because auth-store type-check requires api-client module to exist
- [01-03]: All screens use inline styles instead of NativeWind className for reliable rendering on device
- [01-03]: expo-router v6 requires absolute paths (/(tabs)/more/settings) not relative (./settings)
- [01-03]: Tab bar height includes insets.bottom for Android 3-button navigation compatibility
- [01-03]: Home screen follows GoldenHomeDesignIdea.png: navy header, stat cards, case carousel, deadlines, FAB
- [02-01]: Mutable mock arrays for session-persistent CRUD instead of static data returns
- [02-01]: Form duplication between new and edit screens for simplicity over shared component abstraction
- [02-01]: Client type indicator read-only on edit screen (cannot change type after creation)
- [03-01]: Mock URI placeholder approach for document preview -- shows info message instead of broken viewer
- [03-01]: DOC_TYPE_ICONS as exported constant in types.ts for reuse across screens
- [03-02]: ExpandableCalendar with Positions.CLOSED + AgendaList for week view instead of unreliable TimelineList
- [03-02]: eventsToMarkedDates utility in types.ts for reusable multi-dot calendar marking
- [03-02]: Inline case picker (horizontal scroll) in event creation form matching Phase 2 pattern
- [04-01]: Synchronous notification store init with mockNotifications to avoid badge flicker
- [04-01]: STATUS_COLORS from types.ts reused for case badges instead of local map
- [04-01]: Speed-dial FAB with full-screen backdrop for intuitive dismissal

### Pending Todos

None yet.

### Blockers/Concerns

- [RESOLVED] NativeWind v4 + Expo SDK 54 setup validated -- but inline styles preferred for reliability
- [RESOLVED] expo-router v6 relative routing doesn't work -- use absolute paths
- [RESOLVED] Android 3-button nav overlaps tab bar -- fixed with safe area insets
- [RESOLVED] react-native-calendars Expo Go compatibility -- confirmed working, pure JS library
- [RESOLVED] Bottom sheet (gorhom) SDK 54 stability -- confirmed unstable, using Modal instead

## Session Continuity

Last session: 2026-03-12
Stopped at: Completed 04-01-PLAN.md (Home Dashboard and Notification Foundation)
Resume file: None
