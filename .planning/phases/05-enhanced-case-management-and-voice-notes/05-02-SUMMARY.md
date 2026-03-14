---
phase: 05-enhanced-case-management-and-voice-notes
plan: 02
subsystem: ui
tags: [react-native, case-management, billing, time-entries, expenses, case-linking, voice-notes, audio, expo-av, dictation, i18n]

# Dependency graph
requires:
  - phase: 05-enhanced-case-management-and-voice-notes
    plan: 01
    provides: CaseNote, TimeEntry, Expense, CaseLink types, mock services, i18n keys, Notes section with disabled voice button
provides:
  - Billing section with combined time entry and expense list, inline forms, billable toggle
  - Related Cases section with bidirectional linking, search picker, relationship types
  - Voice note recording with expo-av, inline playback with waveform visualization
  - Simulated dictation button for speech-to-text UX pattern
affects: [phase-8-billing, phase-9-reporting]

# Tech tracking
tech-stack:
  added: [expo-av]
  patterns: [inline audio player with waveform bars, combined billing list pattern]

key-files:
  created: []
  modified:
    - app/(tabs)/cases/[id].tsx
    - package.json

key-decisions:
  - "Combined billing list merges time entries and expenses sorted by date (newest first)"
  - "Dictation is simulated with placeholder text since real STT requires native modules not compatible with Expo Go"
  - "Waveform visualization uses 25 static bars with playhead animation based on playback progress"
  - "Related cases search filters client-side from all cases (matching on caseNumber or title)"

patterns-established:
  - "Inline audio player: play/pause with waveform bar visualization and progress tracking"
  - "Combined billing list: time entries (golden border) and expenses (green border) in one chronological view"

# Metrics
duration: 10min
completed: 2026-03-14
---

# Phase 5 Plan 2: Billing, Related Cases, and Voice Notes Summary

**Combined time/expense billing section, bidirectional case linking with search picker, and voice note recording/playback with expo-av waveform visualization**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-14T00:31:35Z
- **Completed:** 2026-03-14T00:41:52Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Billing section with combined chronological list of time entries (hours, billable toggle, description) and expenses (amount in RSD, category badge, description) with inline forms and delete confirmation
- Related Cases section with bidirectional linking via search picker, relationship type selection (Related, Appeal, Parent, Predecessor), navigation to linked cases, and remove link with confirmation
- Voice note recording using expo-av with permission handling, duration counter, and automatic save to notes list
- Inline audio player with play/pause, playback progress tracking, and 25-bar waveform visualization
- Dictation button in text note editor with simulated 3-second speech-to-text flow

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Billing section (time entries and expenses) on case detail** - `3bd3589` (feat)
2. **Task 2: Build Related Cases section with search picker and bidirectional linking** - `fb7dc00` (feat)
3. **Task 3: Install expo-av and implement voice note recording, playback, and dictation** - `d55e97a` (feat)

## Files Created/Modified
- `app/(tabs)/cases/[id].tsx` - Billing section, Related Cases section, voice recording/playback, dictation button, waveform visualization (1807 lines)
- `package.json` - Added expo-av dependency for audio recording and playback
- `package-lock.json` - Updated lockfile with expo-av dependency tree

## Decisions Made
- Combined billing list merges time entries and expenses into one chronological view sorted by date (newest first), with golden left border for time entries and green for expenses
- Dictation is simulated: tapping mic starts a 3-second timer, then appends placeholder transcription text since real speech-to-text requires native modules not compatible with Expo Go
- Waveform visualization uses 25 static bars of varying heights; bars change color from gray to blue as playback progresses
- Related cases search is client-side filtering from all cases (fetched once when picker opens) rather than a server-side search

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 11 Phase 5 requirements are now fully implemented (CASE-01 through CASE-08, VOICE-01 through VOICE-03)
- Time entry billable flag is in place for Phase 8 billing integration
- Expense categories and amounts are tracked in RSD for future invoice generation
- Voice note audio URIs are stored for potential future backend transcription service
- Phase 5 is complete; next phase in roadmap can begin

## Self-Check: PASSED

All 2 key files verified present. All 3 task commits (3bd3589, fb7dc00, d55e97a) confirmed in git log. Case detail screen is 1807 lines (min 500 required). expo-av dependency confirmed in package.json.

---
*Phase: 05-enhanced-case-management-and-voice-notes*
*Completed: 2026-03-14*
