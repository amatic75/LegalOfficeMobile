# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-14)

**Core value:** Lawyers can instantly look up case details, client info, and upcoming deadlines from their phone
**Current focus:** v1.1 Phase 8 in progress — Billing and Invoicing

## Current Position

Milestone: v1.1 Enhanced Features
Phase: 8 of 9 (Billing and Invoicing)
Plan: 1/2 complete
Status: Plan 08-01 complete, Plan 08-02 next
Last activity: 2026-03-15 — Plan 08-01 executed

Progress: [███████░░░] 70%

## Performance Metrics

**Velocity:**
- Total plans completed: 16
- Average duration: 10min
- Total execution time: 2h 40min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 40min | 13min |
| 02-client-case | 2 | 18min | 9min |
| 03-documents-calendar | 2 | 21min | 10min |
| 04-dashboard-search-and-notifications | 2 | 11min | 5.5min |
| 05-enhanced-case-management-and-voice-notes | 2 | 18min | 9min |
| 06-enhanced-documents-clients-calendar-and-mobile | 2 | 30min | 15min |
| 07-advanced-search-and-notifications | 2 | 22min | 11min |
| 08-billing-and-invoicing | 1 | 8min | 8min |

**Recent Trend:**
- Last 5 plans: 06-01 (14min), 06-02 (16min), 07-01 (16min), 07-02 (6min), 08-01 (8min)
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v1.1 Roadmap]: 5 phases at quick depth -- CaseManagement+Voice, Docs+Clients+Calendar+Mobile, Search+Notifications, Billing, Reporting
- [v1.1 Roadmap]: Voice notes grouped with case management (VOICE relates to CASE-01 notes)
- [v1.1 Roadmap]: Billing (Phase 8) depends on time/expense tracking from Phase 5 (CASE-06/CASE-07)
- [v1.1 Roadmap]: Reporting (Phase 9) depends on billing data from Phase 8
- [v1.0]: Inline styles over NativeWind, absolute paths in expo-router v6, mutable mock arrays for CRUD
- [05-01]: EditableInfoRow component for inline field editing (tap-to-edit with golden highlight)
- [05-01]: Tree picker is read-only display; actual subtype changed via edit screen
- [05-01]: SECTION_CARD style constant for white card sections with golden border
- [05-02]: Combined billing list merges time entries and expenses sorted by date (newest first)
- [05-02]: Dictation simulated with placeholder text (real STT needs native modules, not Expo Go compatible)
- [05-02]: Waveform visualization with 25 static bars and animated playhead
- [05-02]: expo-av added for voice recording/playback (Expo Go compatible)
- [06-01]: Folder chip selector pattern for categorized document browsing
- [06-01]: Document scanning confirmation uses Alert + setTimeout overlay (Expo Go compatible)
- [06-01]: Version history generated inline from document version field and createdAt
- [06-01]: Tag editing reuses PREDEFINED_TAGS from case management
- [06-02]: Intake wizard uses step state (0-3) with inline rendering, not separate screens
- [06-02]: Conflict detection uses debounced useEffect (300ms) for reactive overlap checking
- [06-02]: Event edit mode reuses same screen with state toggle (editMode flag)
- [06-02]: Quick-action bar loads client via case.clientId for phone/court data
- [07-01]: Quick filter chips use toggle behavior (tap again to deactivate)
- [07-01]: Filter modals use temp state pattern to allow cancel without applying
- [07-01]: Search history auto-tracked on debounced query, deduplicated against last entry
- [07-01]: MOCK_LAWYERS array inline in search screen (users service returns single user)
- [07-02]: Long-press action menu for snooze/quick-actions (Expo Go compatible, no gesture handler)
- [07-02]: Custom ToggleSwitch using Pressable+View instead of RN Switch (consistent golden styling)
- [07-02]: Snoozed notifications hidden from list while snoozedUntil is in the future
- [07-02]: Overdue urgency derived from today urgency + isRead on deadline notifications
- [08-01]: formatRSD helper for Serbian number formatting (dot thousands, comma decimal) across billing screens
- [08-01]: Payment recording deferred to Plan 02, placeholder Alert on detail screen
- [08-01]: Invoice number format INV-YYYY-NNN generated on creation

### Pending Todos

None yet.

### Blockers/Concerns

- [RESOLVED] NativeWind v4 + Expo SDK 54 -- inline styles preferred for reliability
- [RESOLVED] expo-router v6 relative routing -- use absolute paths
- [RESOLVED] gorhom bottom-sheet SDK 54 stability -- using Modal instead

## Session Continuity

Last session: 2026-03-15
Stopped at: Completed 08-01-PLAN.md
Resume file: None
