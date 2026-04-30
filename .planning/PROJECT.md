# Legal Office Mobile

## What This Is

A React Native (Expo SDK 54) mobile application for Serbian law office management. It provides lawyers and legal staff with fast access to clients, cases, documents, calendar, and deadlines from their phones. This is the mobile companion to the Legal Office web platform, built as a functional prototype with mocked backend data and a clean API service layer ready for .NET backend integration.

## Core Value

Lawyers can instantly look up case details, client info, and upcoming deadlines from their phone — fast search and fast input on mobile is the application's primary differentiator.

## Requirements

### Validated

- ✓ Home dashboard with client/case counts, recent cases, upcoming deadlines, quick actions — v1.0
- ✓ Client registration and profile management (individual + corporate) — v1.0
- ✓ Client list with search and filtering — v1.0
- ✓ Client detail view with contact info, linked cases, phone/email actions — v1.0
- ✓ Case creation with type taxonomy (Civil, Criminal, Family, Corporate) — v1.0
- ✓ Case list with search, filtering, status badges — v1.0
- ✓ Case detail view with parties, documents, calendar events, status workflow — v1.0
- ✓ Case status workflow (New > Active > Pending > Closed > Archived) — v1.0
- ✓ Document list per case with type filtering — v1.0
- ✓ Document upload from device file picker — v1.0
- ✓ Camera capture for physical documents — v1.0
- ✓ Document preview (PDF, images) inline in app — v1.0
- ✓ Calendar monthly view with event dots — v1.0
- ✓ Calendar weekly view with agenda list — v1.0
- ✓ Calendar agenda/list view of upcoming events — v1.0
- ✓ Event creation (hearings, meetings, deadlines) — v1.0
- ✓ In-app notifications screen with deadline alerts — v1.0
- ✓ Global search across clients, cases, events — v1.0
- ✓ Settings with language switcher (Serbian Latin, Serbian Cyrillic, English) — v1.0
- ✓ User profile screen in settings — v1.0
- ✓ Mocked API service layer with Serbian realistic data — v1.0
- ✓ Golden/cream design system matching GoldenHomeDesignIdea reference — v1.0
- ✓ Bottom tab navigation: Home, Clients, Cases, Calendar, More — v1.0
- ✓ i18n framework with all strings translatable — v1.0
- ✓ Enhanced case management: text notes CRUD, inline-editable opposing party/court/judge/tags, 3-level subtype tree, time/expense tracking, bidirectional case linking — v1.1
- ✓ Voice notes with expo-av recording/playback + waveform visualization; simulated dictation — v1.1
- ✓ Document folders with chip selector, metadata editing, version history timeline, scanning confirmation flow — v1.1
- ✓ 4-step client intake wizard with conflict detection, communication history, client-level documents, corporate contacts — v1.1
- ✓ Calendar conflict detection (debounced), event editing, recurring event patterns — v1.1
- ✓ Mobile quick-action bar on case/client detail (call, navigate to court) — v1.1
- ✓ Advanced search: saved searches, quick filter chips, search history, multi-dimensional filter modals — v1.1
- ✓ Enhanced notifications: preferences, snooze via long-press, quick actions, escalation, history — v1.1
- ✓ Billing & invoicing: invoice list, tariff/hourly/flat-fee calculator, payment recording, outstanding balances per client/case — v1.1
- ✓ Reporting dashboards: financial, case management, performance with pie/bar charts — v1.1

### Active

**v1.2 Client Depth & Directory:**
- Client detail file upload for client-level documents (ID, powers of attorney)
- Client detail recent-activities timeline aggregated across all cases
- Client detail upcoming-activities/deadlines aggregated across all cases
- Client detail full expenses list across all client cases
- Client detail unpaid/outstanding balance rollup
- Directory feature (More tab): unified 3-tab page for Lawyers / Judges / Courts with CRUD

### Out of Scope

- Authentication/login screens — skip for this version, assume logged-in user
- OCR text extraction — requires backend AI processing
- E-signature integration — requires real provider setup
- Client portal (client-facing) — separate concern
- Real backend integration — mocked for now, service layer ready
- Push notifications (actual) — will show notification screen UI only
- Offline sync — beyond showcase scope
- Email integration — backend feature

## Context

- Part of a larger Legal Office suite: .NET 10/C# backend + PostgreSQL + React web + React Native mobile
- Target market is Serbian law offices (small to enterprise)
- The mobile app's USP is fast search and fast case data input
- Backend API will be a .NET modular monolith — mobile app should assume RESTful JSON endpoints
- Serbian legal system has specific case type taxonomy (Civil, Criminal, Family, Corporate with subtypes)
- Serbian locale: dates DD.MM.YYYY, numbers 1.234,56, addresses and court names in Serbian
- Design reference: GoldenHomeDesignIdea.png — warm golden/cream gradient backgrounds, golden accents (#B68C3C), card-based layout, professional aesthetic
- App icon: LOIcon.png (courthouse with golden columns, navy roof)
- Splash screen: LOSplashScreen.png (navy background, golden courthouse, "Legal Office" text)
- **Current state:** v1.0 MVP shipped with 8,952 LOC TypeScript across 112 files. All 57 v1 requirements implemented. Tech stack: Expo SDK 54, expo-router v6, Zustand, i18next, react-native-calendars.

## Constraints

- **Expo SDK**: Must use SDK 54 for Expo Go compatibility on Android
- **No native modules**: Must stay within Expo Go compatible libraries (no bare workflow)
- **No auth**: Skip login/authentication entirely — app starts at home dashboard
- **Mock data only**: All backend calls mocked with realistic Serbian data
- **API abstraction**: Service layer must be cleanly separated so real API calls can replace mocks
- **i18n from day one**: All user-facing strings must go through translation system
- **Inline styles**: All screens use inline styles (NativeWind className unreliable on device)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo SDK 54 + Expo Go | Team tests on real Android devices via Expo Go | ✓ Good — works reliably |
| Skip authentication | Focus on core UX, not login flows | ✓ Good — faster iteration |
| Mock all backend calls | Frontend-first development, showcase for team alignment | ✓ Good — clean IService interfaces ready for swap |
| Serbian Latin as default language | Primary market is Serbia, Latin script most common | ✓ Good |
| 5-tab navigation (Home, Clients, Cases, Calendar, More) | Clients elevated to top-level tab per user preference | ✓ Good |
| i18n with 3 locales (sr-Latn, sr-Cyrl, en) | Support both Serbian scripts plus English from the start | ✓ Good — instant switching works |
| Inline styles over NativeWind className | NativeWind v4 unreliable rendering on device | ✓ Good — consistent cross-platform |
| Mutable mock arrays for CRUD | Session-persistent data without persistence layer | ✓ Good — realistic UX |
| ExpandableCalendar + AgendaList for weekly view | TimelineList unreliable in react-native-calendars | ✓ Good — stable replacement |
| Absolute paths in expo-router v6 | Relative routing broken in v6 | ✓ Good — required workaround |

## Current Milestone: v1.2 Client Depth & Directory

**Goal:** Deepen the client detail page so lawyers get a true client-centric view (documents with real uploads, activity history + upcoming work across all their cases, expenses and outstanding balances) — and introduce a unified directory for the external/internal people and institutions a law office interacts with (lawyers, judges, courts).

**Target features:**
- Client detail file upload for client-level documents (picker + camera capture, parity with case-level documents)
- Client detail recent-activities timeline aggregated across all of that client's cases
- Client detail upcoming-activities/deadlines list aggregated across all of that client's cases
- Client detail full expenses list across all client cases
- Client detail unpaid/outstanding balance rollup per client
- New More → Directory page with 3 tabs (Lawyers / Judges / Courts) and CRUD on each

**Scope origin:** The 4 features above were captured as pending todos during/after v1.1 ship and grouped into this milestone.

---
*Last updated: 2026-04-11 after v1.1 shipped and v1.2 milestone started*
