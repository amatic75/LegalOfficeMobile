# Legal Office Mobile

## What This Is

A React Native (Expo SDK 54) mobile application for Serbian law office management. It provides lawyers and legal staff with fast access to clients, cases, documents, calendar, and deadlines from their phones. This is the mobile companion to the Legal Office web platform, designed as a showcase/prototype with mocked backend data and a clean API service layer ready for .NET backend integration.

## Core Value

Lawyers can instantly look up case details, client info, and upcoming deadlines from their phone — fast search and fast input on mobile is the application's primary differentiator.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Home dashboard with client/case counts, recent cases, upcoming deadlines, quick actions
- [ ] Client registration and profile management (individual + corporate)
- [ ] Client list with search and filtering
- [ ] Client detail view with contact info, communication log, linked cases, documents
- [ ] Case creation with type taxonomy (Civil, Criminal, Family, Corporate)
- [ ] Case list with search, filtering, status badges
- [ ] Case detail view with parties, documents, notes, timeline
- [ ] Case status workflow (New > Active > Pending > Closed > Archived)
- [ ] Document list per case with folder organization
- [ ] Document upload from device file picker
- [ ] Camera scanning for physical documents
- [ ] Document preview (PDF, images) inline in app
- [ ] Calendar monthly view with event dots
- [ ] Calendar weekly view with event blocks
- [ ] Calendar agenda/list view of upcoming events
- [ ] Event creation (hearings, meetings, deadlines)
- [ ] In-app notifications screen with deadline alerts and case updates
- [ ] Global search across clients, cases, documents
- [ ] Settings with language switcher (Serbian Latin, Serbian Cyrillic, English)
- [ ] User profile screen in settings
- [ ] Mocked API service layer with Serbian realistic data
- [ ] Golden/navy design system matching the GoldenHomeDesignIdea reference
- [ ] LOIcon for app icon, LOSplashScreen for splash screen
- [ ] Bottom tab navigation: Home, Clients, Cases, Calendar, More
- [ ] i18n framework with all strings translatable

### Out of Scope

- Authentication/login screens — skip for this version, assume logged-in user
- Billing/invoicing/financial module — backend-dependent, not for showcase
- OCR text extraction — requires backend AI processing
- Voice notes — P3 feature, not needed for showcase
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
- Design reference: GoldenHomeDesignIdea.png shows warm golden/amber accents, white/cream backgrounds, navy blue header elements, card-based layout, professional aesthetic
- App icon: LOIcon.png (courthouse with golden columns, navy roof)
- Splash screen: LOSplashScreen.png (navy background, golden courthouse, "Legal Office" text)
- Team needs this as a visual/functional prototype to align on UX before backend development

## Constraints

- **Expo SDK**: Must use SDK 54 for Expo Go compatibility on Android
- **No native modules**: Must stay within Expo Go compatible libraries (no bare workflow)
- **No auth**: Skip login/authentication entirely — app starts at home dashboard
- **Mock data only**: All backend calls mocked with realistic Serbian data
- **API abstraction**: Service layer must be cleanly separated so real API calls can replace mocks
- **i18n from day one**: All user-facing strings must go through translation system
- **Design system**: Must follow golden/navy/white color palette from GoldenHomeDesignIdea reference

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo SDK 54 + Expo Go | Team tests on real Android devices via Expo Go | — Pending |
| Skip authentication | Focus on core UX, not login flows | — Pending |
| Mock all backend calls | Frontend-first development, showcase for team alignment | — Pending |
| Serbian Latin as default language | Primary market is Serbia, Latin script most common | — Pending |
| 5-tab navigation (Home, Clients, Cases, Calendar, More) | Clients elevated to top-level tab per user preference | — Pending |
| i18n with 3 locales (sr-Latn, sr-Cyrl, en) | Support both Serbian scripts plus English from the start | — Pending |

---
*Last updated: 2026-03-10 after initialization*
