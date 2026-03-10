# Project Research Summary

**Project:** LegalOfficeMobile
**Domain:** Law Office Management Mobile App (Serbian Market)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

This is a React Native (Expo SDK 54) mobile application for Serbian lawyers to manage cases, clients, documents, and court calendars. The product targets an uncontested niche: no known competitor serves the Serbian legal market with localized case taxonomy, dual-script support (Cyrillic + Latin), and mobile-first workflows. The standard approach for this type of app is a tabbed navigation shell with domain-specific CRUD screens, backed by a service abstraction layer that starts with mocked data and later swaps to a real .NET backend. The stack is well-established -- Expo Router for navigation, Zustand for client state, NativeWind for styling, react-hook-form + Zod for validated forms, and i18next for internationalization. All libraries are verified Expo Go compatible.

The recommended approach is to build foundation-first: types, theme, i18n infrastructure, and the mock service layer must be established before any feature screen work begins. The architecture uses a strict layered pattern -- thin route files delegate to screen components, which consume custom hooks, which orchestrate Zustand stores and service calls. This layering is non-negotiable because the mock-to-real-API transition must be seamless; only service internals change when the .NET backend arrives. The Serbian legal taxonomy (Civil/Criminal/Family/Corporate with subtypes) and three-locale support (sr-Latn, sr-Cyrl, en) are structural concerns that permeate every screen, so they must be baked into the foundation, not retrofitted.

The primary risks are: (1) Expo Go boundary violations -- accidentally choosing libraries that require native modules will cause runtime crashes, and several obvious choices for PDF viewing and document scanning are incompatible; (2) nested navigation state corruption -- Expo Router has well-documented bugs with tabs-containing-stacks that must be mitigated architecturally from the start; (3) mock data that diverges from the eventual .NET API contract, making the backend swap painful; and (4) fonts or i18n that break under Serbian Cyrillic, since many fonts lack Serbian-specific glyphs and locale switching can cause full-tree re-renders. All four risks have clear prevention strategies detailed below.

## Key Findings

### Recommended Stack

The stack centers on Expo SDK 54 (React Native 0.81, React 19.1) running in Expo Go. All selected libraries are verified pure-JS or bundled in Expo Go -- no native module dependencies. The critical version constraint is NativeWind v4.2.2 requiring Tailwind CSS v3.4.17 specifically (Tailwind v4 has breaking API changes). Reanimated v4 is bundled with SDK 54 and its babel plugin is auto-configured -- do NOT manually add the plugin to babel.config.js.

**Core technologies:**
- **Expo SDK 54 + Expo Router 4**: App framework and file-based navigation -- the standard for new Expo projects, handles deep linking and typed routes
- **TypeScript 5.9**: Type safety -- essential for a domain-heavy app where type errors cause data integrity bugs
- **Zustand 5**: Client state -- lightweight, no providers, selective subscriptions prevent unnecessary re-renders on list-heavy screens
- **NativeWind 4.2 + Tailwind CSS 3.4**: Styling -- utility-first classes with build-time processing, consistent cross-platform
- **react-hook-form + Zod 4**: Forms and validation -- minimal re-renders, TypeScript-first schema validation critical for legal data integrity
- **i18next + react-i18next**: Internationalization -- supports namespaced translations, three locales (sr-Latn, sr-Cyrl, en)
- **react-native-calendars**: Calendar UI -- pure JS, Expo Go compatible, provides month/agenda views
- **@shopify/flash-list**: High-performance lists -- bundled in Expo Go, required for case/client lists at scale
- **date-fns 4**: Date manipulation -- tree-shakeable, functional API, pairs with Intl API for locale-aware formatting
- **expo-notifications**: Local deadline reminders -- Expo Go compatible for local notifications only

**Critical version constraints:**
- tailwindcss must be 3.4.17 (NOT v4.x)
- Do not add reanimated/plugin to babel.config.js (SDK 54 handles it)
- expo-file-system: use new API, not legacy import path
- SafeAreaView: use react-native-safe-area-context, not RN core (deprecated in SDK 54)

### Expected Features

**Must have (table stakes -- 22 features):**
- Client CRUD with individual/corporate profiles, search/filter, tap-to-call/email
- Case CRUD with Serbian legal taxonomy (Civil/Criminal/Family/Corporate + subtypes), status workflow, document and event links
- Per-case document list, PDF/image preview, camera scan (photo capture), file upload
- Calendar with monthly/weekly/agenda views, event creation for hearings/meetings/deadlines, color-coded event types
- Global search across clients, cases, events
- In-app notification center with deadline reminders (7d/3d/1d/day-of escalation)
- Home dashboard aggregating today's events, deadlines, recent cases
- Bottom tab navigation (5 tabs), settings with language switcher, golden/navy theme
- Mocked data layer with realistic Serbian legal data

**Should have (differentiators):**
- Serbian legal taxonomy baked in (no competitor serves this market)
- Dual-script support (Cyrillic + Latin toggle) -- unique for Serbia
- Smart home dashboard with "day at a glance" urgency indicators
- Quick case lookup (spotlight-style search)
- Color-coded calendar events by urgency
- Contextual quick actions (call client from case, navigate to court)

**Defer (v2+):**
- Remote push notifications (requires backend infrastructure)
- Offline data sync with conflict resolution
- Time tracking, billing, invoicing (web-first features)
- Document OCR, e-signatures, real-time multi-user sync
- Client portal, biometric auth, voice notes

**Anti-features (explicitly avoid):**
- Full billing/invoicing on mobile -- terrible UX on phones, billing errors costly
- Real-time chat -- WhatsApp/Viber already solve this, massive infrastructure cost
- Full document editing -- no good RN library, lawyers would hate it
- Multi-user real-time sync -- requires websockets and conflict resolution for mocked backend

### Architecture Approach

The architecture follows a strict layered pattern with clear boundaries: thin route files (app/) import screen components (screens/), which consume custom hooks (hooks/), which orchestrate Zustand stores (stores/) and service calls (services/). Services abstract the data layer behind typed interfaces, currently backed by mock handlers (mocks/) that will be swapped for real .NET API calls. Components never call services directly. Stores hold only simple state (search queries, filters); all business logic lives in hooks. The theme is static tokens (not Context), and i18n uses namespaced JSON files split by feature domain.

**Major components:**
1. **Expo Router (app/)** -- file-based routing with 5 bottom tabs, each containing a nested stack navigator
2. **Screen Components (screens/)** -- feature-grouped full-page UI that compose hooks and shared components
3. **Custom Hooks (hooks/)** -- business logic layer that composes Zustand stores with service calls; the single boundary components consume
4. **Service Layer (services/)** -- typed async interface abstracting data access; the ONLY layer that knows about mocks
5. **Mock Layer (mocks/)** -- realistic Serbian data with simulated delays; mirrors future .NET API response shapes
6. **Design System (components/ui/ + theme/)** -- golden/navy tokens, reusable primitives (Button, Card, Badge, Input)
7. **i18n (i18n/)** -- i18next with namespaced translations per feature domain, three locales

### Critical Pitfalls

1. **Expo Go boundary violations** -- Many obvious library choices (react-native-pdf, document-scanner-plugin, MMKV) require native modules and crash in Expo Go. Prevention: maintain a vetted library allowlist, check React Native Directory before every dependency addition, run `npx expo-doctor` in CI.

2. **Nested navigation state corruption** -- Expo Router has documented bugs with tabs + nested stacks (issues #910, #797, #530). Users get stuck on screens after tab switching, deep links break. Prevention: place shared screens outside tabs at root stack level, add popToTop() on tab re-selection, build a navigation test harness early.

3. **Mock/API contract divergence** -- Mock data shaped for UI convenience will break every screen when the real .NET backend connects. Prevention: define TypeScript interfaces for ALL API contracts first, build services as typed interfaces with mock implementations, include error states, pagination, and simulated delays.

4. **i18n causing full re-renders on locale switch** -- Context-based locale state re-renders the entire tree, causing flicker and form state loss. Serbian users switch scripts frequently. Prevention: use Zustand for locale preference, namespace-split translations, centralized date/number formatters.

5. **Custom fonts missing Serbian Cyrillic glyphs** -- Many fonts lack Serbian-specific characters (Lj, Nj, Dj, Dz). Prevention: verify all Serbian Cyrillic glyphs before font selection, download full character sets, test with the string "Lj Nj Cj Dj Dz Zh Sh Ch Ts" in both scripts.

6. **SDK 54 is the last Old Architecture SDK** -- SDK 55 will only support New Architecture. Prevention: enable New Architecture from day one, avoid all deprecated APIs (expo-av, legacy file-system, core SafeAreaView).

## Implications for Roadmap

Based on combined research, the project naturally decomposes into 7 phases following the architecture's build order and feature dependency graph.

### Phase 1: Foundation and Design System
**Rationale:** Every other phase depends on types, theme, i18n, and the mock service layer being in place. Four of six critical pitfalls (Expo Go boundaries, mock/API divergence, i18n re-renders, Cyrillic font gaps) must be addressed here. This is the highest-leverage phase.
**Delivers:** TypeScript interfaces for all entities, golden/navy design tokens, i18n infrastructure with 3 locales, mock data layer with realistic Serbian data, reusable UI component library (Button, Card, Badge, Input, etc.), centralized date/number formatters.
**Features from FEATURES.md:** Golden/navy design theme, mocked data layer, language switcher foundation, loading/empty state components.
**Avoids:** Pitfalls 1 (Expo Go boundaries -- vetted library list), 3 (i18n re-renders -- correct architecture), 4 (mock divergence -- typed interfaces first), 5 (Cyrillic fonts -- verified during design system), 6 (SDK 54 cliff -- New Architecture enabled).

### Phase 2: Navigation Shell and App Structure
**Rationale:** Navigation is the structural skeleton; all feature screens plug into it. Pitfall 2 (navigation state corruption) is the second-highest-risk issue and must be resolved before screen development, when it is cheap to restructure. Expo Router's tabs+stacks bugs must be mitigated architecturally.
**Delivers:** 5-tab bottom navigator, nested stack navigators per tab, root layout with providers, placeholder screens for all routes, deep linking configuration, typed routes.
**Features from FEATURES.md:** Bottom tab navigation (5 tabs).
**Avoids:** Pitfall 2 (navigation corruption -- test harness, popToTop on tab re-select, shared screens outside tabs).

### Phase 3: Client Management
**Rationale:** Clients are the foundational entity -- cases reference clients, so clients must exist first. Client CRUD is the simplest entity to build and validates the full data flow pattern (route > screen > hook > service > mock) before tackling the more complex case entity.
**Delivers:** Client list with search/filter, client profiles (individual + corporate), add/edit client forms, tap-to-call/email actions.
**Features from FEATURES.md:** Client list with search/filter, client profile view (individual), client profile view (corporate), add/edit client.
**Uses:** FlashList for lists, react-hook-form + Zod for forms, i18n for all strings, design system components.

### Phase 4: Case Management
**Rationale:** Cases are the central entity and the most complex -- they reference clients, contain the Serbian legal taxonomy, have a status workflow, and link to documents and events. Building cases after clients means the client-picker in the case form can use the already-working client infrastructure. The Serbian taxonomy (Civil > 6 subtypes, Criminal > 4, Family > 4, Corporate > 4) is a structural concern that must be implemented correctly.
**Delivers:** Case list with search/filter, case detail view, create/edit case with taxonomy picker, case status workflow, client-to-cases link, case-to-documents link (empty initially), case-to-events link (empty initially).
**Features from FEATURES.md:** Case list with search/filter, case detail view, create new case, edit case, case type taxonomy (Serbian), case status workflow, case-to-documents link, case-to-events link, client-to-cases link.

### Phase 5: Document Handling
**Rationale:** Documents depend on cases (they are organized per-case). Document handling also involves the Expo Go boundary pitfall most directly -- PDF preview and camera scanning have compatibility constraints that must be navigated carefully.
**Delivers:** Per-case document list, PDF/image preview (WebView-based), camera photo capture, file upload from device, document metadata display.
**Features from FEATURES.md:** Per-case document list, document preview (PDF + images), camera scan (basic photo capture), file upload from device, document metadata display.
**Uses:** expo-image-picker, expo-document-picker, expo-file-system, react-native-webview (for PDF).

### Phase 6: Calendar and Events
**Rationale:** Calendar is the highest-complexity UI feature (three view modes, time-based layouts, event creation forms). It depends on cases being in place for case-linked events. Building it after cases means the case-picker in event forms works, and case detail views can display their linked events.
**Delivers:** Monthly view with event dots, weekly view with time blocks, agenda/list view, event creation (hearings, meetings, deadlines), color-coded event types, case-linked events.
**Features from FEATURES.md:** Calendar (3 views), event creation (case-linked), color-coded event types, event types (hearings, meetings, deadlines), case-linked events.
**Uses:** react-native-calendars (or flash-calendar as fallback), date-fns for date manipulation.

### Phase 7: Search, Notifications, Dashboard, and Polish
**Rationale:** These are aggregation features that pull from all entity types. Global search requires clients, cases, and events to exist. The home dashboard requires calendar events, cases, and notifications. Notifications require calendar events for deadline-based reminders. Building these last means they can aggregate real data from all preceding phases.
**Delivers:** Global search across all entities, in-app notification center with deadline reminders (local), home dashboard ("day at a glance"), settings screen, final polish (pull-to-refresh, empty/error states, accessibility pass).
**Features from FEATURES.md:** Global search, in-app notification list, deadline reminder notifications, notification badge count, home dashboard, settings screen, pull-to-refresh, loading/empty states.
**Uses:** expo-notifications (local), debounced search, FlashList for search results.

### Phase Ordering Rationale

- **Foundation first** is mandated by the architecture's build order: types > mocks > services > stores > hooks > components > screens. Skipping this causes cascading rework.
- **Navigation before features** prevents the expensive restructuring required to fix navigation bugs after 20+ screens are built.
- **Clients before cases** follows the data dependency graph: cases reference clients via a client-picker.
- **Cases before documents and calendar** follows the same dependency logic: documents and events belong to cases.
- **Aggregation features last** (search, dashboard, notifications) because they consume data from all entity types -- building them before the entities exist forces fake placeholder integrations.
- **i18n from day one** prevents the "extract all hardcoded strings" disaster that costs 2-3 days per 10 screens to fix retroactively.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Foundation):** NativeWind v4 setup with Expo SDK 54 has specific configuration steps and known gotchas. Font selection for Serbian Cyrillic needs hands-on validation. Mock data design requires careful .NET API contract anticipation.
- **Phase 2 (Navigation):** Expo Router tabs+stacks has documented bugs. Research specific workarounds for the project's 5-tab structure. Deep linking configuration needs testing.
- **Phase 5 (Documents):** PDF preview via WebView has limitations (no native controls, memory constraints on large files). Camera capture workflow on both platforms needs Expo Go validation.
- **Phase 6 (Calendar):** react-native-calendars Expo Go compatibility had one contradicting source. Flash-calendar is the fallback but has fewer customization options. Week view implementation is complex.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 3 (Clients):** Standard CRUD with list/detail/form pattern. Well-documented React Native patterns.
- **Phase 4 (Cases):** Same CRUD pattern as clients, just more fields and the taxonomy picker. The Serbian taxonomy is defined in the spec.
- **Phase 7 (Search, Notifications, Dashboard):** Aggregation UIs following standard mobile patterns. Local notifications via expo-notifications are well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified from Expo SDK 54 changelog. Library Expo Go compatibility confirmed via React Native Directory and official docs. NativeWind + Tailwind v3 constraint verified in NativeWind installation docs. |
| Features | MEDIUM-HIGH | Feature expectations well-established across Clio, Smokeball, MyCase competitors. No direct Serbian competitor for localized validation. Anti-features clearly identified. |
| Architecture | HIGH | Follows Expo's official recommended patterns (thin routes, file-based routing). Layered architecture is standard for apps with mock-to-real API transitions. Sources are official Expo docs and established community starters. |
| Pitfalls | HIGH | Critical pitfalls verified with official documentation and confirmed GitHub issues. Expo Go limitations well-documented. Navigation bugs have open issue numbers. SDK 54 being last Old Architecture SDK confirmed in changelog. |

**Overall confidence:** HIGH

### Gaps to Address

- **Calendar library Expo Go compatibility:** One source contradicted react-native-calendars Expo Go support. Validate by running a minimal calendar in Expo Go early in Phase 6 (or during Phase 1 as a spike).
- **react-native-toast-message SDK 54 compatibility:** Confirmed JS-only but latest version not explicitly tested with SDK 54. Low risk but validate in Phase 1.
- **PDF preview quality via WebView:** WebView + PDF.js works but has no native PDF controls and memory constraints on large files. Acceptable for v1 but may need dev-build migration for v1.x if lawyers regularly view large documents.
- **.NET API contract shape:** Mock data is designed to anticipate the .NET backend, but without a finalized API spec, some divergence is inevitable. Mitigate by using standard REST conventions (paginated responses, error envelopes, ISO 8601 dates) and PascalCase DTOs.
- **Offline behavior:** The v1 has no offline strategy. Research confirms courthouses have poor connectivity. Offline case/calendar caching is a v1.x differentiator but needs its own research phase when prioritized.
- **Bottom sheet (gorhom) SDK 54 stability:** v5.2.6 confirmed working but "some SDK 54 issues reported." Test early; if unstable, fall back to modal-based UI patterns.

## Sources

### Primary (HIGH confidence)
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54) -- core versions, breaking changes, deprecation timeline
- [Expo SDK 54 Upgrade Guide](https://expo.dev/blog/expo-sdk-upgrade-guide) -- migration details, version requirements
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/) -- routing, nesting, layouts, typed routes
- [Expo Blog: Folder Structure Best Practices](https://expo.dev/blog/expo-app-folder-structure-best-practices) -- project organization
- [Expo Documentation: Localization](https://docs.expo.dev/guides/localization/) -- i18n approach
- [Expo Documentation: Tailwind CSS Guide](https://docs.expo.dev/guides/tailwind/) -- NativeWind setup
- [NativeWind Installation Docs](https://www.nativewind.dev/docs/getting-started/installation) -- Tailwind v3 requirement
- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/) -- local vs push
- [Expo Camera/ImagePicker Docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) -- Expo Go compatibility
- [Clio Mobile App Features](https://www.clio.com/features/mobile-app/) -- competitor feature benchmark
- [Globalex: Legal Research in Serbia](https://www.nyulawglobal.org/globalex/Serbia1.html) -- Serbian legal system reference

### Secondary (MEDIUM confidence)
- [TanStack Query RN Docs](https://tanstack.com/query/v5/docs/react/react-native) -- React Native patterns
- [Obytes Expo Starter](https://starter.obytes.com/) -- project structure, form/i18n patterns
- [Flash Calendar Expo Blog](https://expo.dev/blog/build-fast-flexible-calendars-in-react-native-with-flash-calendar) -- calendar performance
- [React Native Directory](https://reactnative.directory/?expoGo=true) -- Expo Go compatibility tags
- Expo Router GitHub Issues (#910, #797, #530, #818) -- confirmed navigation bugs
- CaseStatus, Legal Soft, Centerbase -- legal software feature surveys

### Tertiary (LOW confidence)
- Galaxies.dev React Native Tech Stack 2025 -- ecosystem survey (community blog)
- Medium/DEV.to articles on SDK 54 migration -- individually low, corroborated to medium
- State management comparison articles -- community opinions on Zustand vs Redux vs Context

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
