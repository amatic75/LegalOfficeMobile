# Architecture Research

**Domain:** React Native Expo mobile app for law office management (Serbia)
**Researched:** 2026-03-10
**Confidence:** HIGH

## System Overview

```
+-----------------------------------------------------------------------+
|                        Presentation Layer                              |
|  +----------+  +----------+  +----------+  +----------+  +----------+ |
|  |   Home   |  | Clients  |  |  Cases   |  | Calendar |  |   More   | |
|  |   Tab    |  |   Tab    |  |   Tab    |  |   Tab    |  |   Tab    | |
|  +----+-----+  +----+-----+  +----+-----+  +----+-----+  +----+-----+ |
|       |             |             |             |             |        |
|  +----+-----+  +----+-----+  +----+-----+  +----+-----+  +----+-----+ |
|  |  Stack   |  |  Stack   |  |  Stack   |  |  Stack   |  |  Stack   | |
|  |Navigator |  |Navigator |  |Navigator |  |Navigator |  |Navigator | |
|  +----------+  +----------+  +----------+  +----------+  +----------+ |
+----------------------------------+------------------------------------+
                                   |
+----------------------------------v------------------------------------+
|                      Screen Components                                 |
|  Import from src/screens/*, render UI, consume custom hooks            |
+----------------------------------+------------------------------------+
                                   |
+----------------------------------v------------------------------------+
|                     Custom Hooks Layer                                  |
|  src/hooks/ -- orchestrate stores + services, contain business logic   |
+----------+-----------+-----------+-----------+------------------------+
           |           |           |           |
+----------v--+  +-----v-----+  +-v---------+ +v-----------+
| Zustand     |  | i18n      |  | Theme     | | Navigation |
| Stores      |  | (i18next) |  | Context   | | (router)   |
| src/stores/ |  | src/i18n/ |  | src/theme/| | expo-router|
+------+------+  +-----------+  +----------+ +------------+
       |
+------v--------------------------------------------------------------+
|                       Service Layer                                   |
|  src/services/ -- abstract API interface, returns typed data          |
+------+--------------------------------------------------------------+
       |
+------v--------------------------------------------------------------+
|                       Mock Data Layer                                  |
|  src/mocks/ -- Serbian realistic data, simulated delays               |
|  (Replace with real HTTP client when .NET backend is ready)           |
+---------------------------------------------------------------------+
```

## Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Expo Router (app/) | File-based routing, layout definitions, tab/stack structure | `_layout.tsx` files with `Tabs` and `Stack` from expo-router |
| Screen Components (screens/) | Full page UI, compose smaller components, consume hooks | One file or folder per screen, imported by route files |
| Shared Components (components/) | Reusable UI primitives and composed widgets | Design system atoms (Button, Card, Badge) + domain widgets (CaseCard, ClientRow) |
| Custom Hooks (hooks/) | Business logic orchestration, connect stores to services | `useClients()`, `useCases()`, `useSearch()` -- each composes store + service calls |
| Zustand Stores (stores/) | Client-side state containers, simple getters/setters | One store per domain: `clientStore`, `caseStore`, `calendarStore`, `notificationStore` |
| Service Layer (services/) | Data access abstraction, typed API interface | `clientService.ts`, `caseService.ts` etc. -- async functions returning typed data |
| Mock Layer (mocks/) | Fake data and simulated API responses | JSON fixtures + delay simulation, mirrors future .NET API shape |
| Theme (theme/) | Design tokens, color palette, typography, spacing | `colors.ts`, `typography.ts`, `spacing.ts`, exported as a single theme object |
| i18n (i18n/) | Translation strings, locale detection, language switching | i18next + expo-localization, JSON translation files per locale |

## Recommended Project Structure

```
src/
+-- app/                          # Expo Router file-based routing
|   +-- _layout.tsx               # Root layout (providers, fonts, splash)
|   +-- (tabs)/                   # Tab group
|   |   +-- _layout.tsx           # Bottom tab navigator (5 tabs)
|   |   +-- index.tsx             # Home tab (thin: imports HomeScreen)
|   |   +-- clients/              # Clients tab with nested stack
|   |   |   +-- _layout.tsx       # Stack navigator for clients
|   |   |   +-- index.tsx         # Client list
|   |   |   +-- [id].tsx          # Client detail (dynamic route)
|   |   |   +-- new.tsx           # New client form
|   |   +-- cases/                # Cases tab with nested stack
|   |   |   +-- _layout.tsx       # Stack navigator for cases
|   |   |   +-- index.tsx         # Case list
|   |   |   +-- [id].tsx          # Case detail
|   |   |   +-- new.tsx           # New case form
|   |   |   +-- [id]/
|   |   |       +-- documents.tsx # Case documents sub-screen
|   |   |       +-- notes.tsx     # Case notes sub-screen
|   |   +-- calendar/             # Calendar tab with nested stack
|   |   |   +-- _layout.tsx       # Stack navigator for calendar
|   |   |   +-- index.tsx         # Calendar view
|   |   |   +-- new-event.tsx     # New event form
|   |   |   +-- [eventId].tsx     # Event detail
|   |   +-- more/                 # More tab with nested stack
|   |       +-- _layout.tsx       # Stack navigator for more
|   |       +-- index.tsx         # More menu
|   |       +-- settings.tsx      # Settings screen
|   |       +-- notifications.tsx # Notifications screen
|   |       +-- search.tsx        # Global search screen
|   |       +-- profile.tsx       # User profile screen
+-- screens/                      # Screen components (actual UI)
|   +-- home/
|   |   +-- HomeScreen.tsx
|   |   +-- components/           # Home-specific widgets
|   |       +-- StatCard.tsx
|   |       +-- RecentCasesList.tsx
|   |       +-- DeadlinesList.tsx
|   |       +-- QuickActions.tsx
|   +-- clients/
|   |   +-- ClientListScreen.tsx
|   |   +-- ClientDetailScreen.tsx
|   |   +-- ClientFormScreen.tsx
|   |   +-- components/
|   |       +-- ClientCard.tsx
|   |       +-- ClientSearchBar.tsx
|   +-- cases/
|   |   +-- CaseListScreen.tsx
|   |   +-- CaseDetailScreen.tsx
|   |   +-- CaseFormScreen.tsx
|   |   +-- CaseDocumentsScreen.tsx
|   |   +-- CaseNotesScreen.tsx
|   |   +-- components/
|   |       +-- CaseCard.tsx
|   |       +-- CaseStatusBadge.tsx
|   |       +-- CaseTimeline.tsx
|   |       +-- CaseTypeSelector.tsx
|   +-- calendar/
|   |   +-- CalendarScreen.tsx
|   |   +-- EventDetailScreen.tsx
|   |   +-- EventFormScreen.tsx
|   |   +-- components/
|   |       +-- MonthView.tsx
|   |       +-- WeekView.tsx
|   |       +-- AgendaView.tsx
|   |       +-- EventCard.tsx
|   +-- more/
|   |   +-- MoreMenuScreen.tsx
|   |   +-- SettingsScreen.tsx
|   |   +-- NotificationsScreen.tsx
|   |   +-- SearchScreen.tsx
|   |   +-- ProfileScreen.tsx
+-- components/                   # Shared/reusable UI components
|   +-- ui/                       # Design system primitives
|   |   +-- Button.tsx
|   |   +-- Card.tsx
|   |   +-- Badge.tsx
|   |   +-- Input.tsx
|   |   +-- SearchBar.tsx
|   |   +-- Avatar.tsx
|   |   +-- Icon.tsx
|   |   +-- Divider.tsx
|   |   +-- EmptyState.tsx
|   |   +-- LoadingSpinner.tsx
|   |   +-- FloatingActionButton.tsx
|   |   +-- ScreenContainer.tsx
|   +-- forms/                    # Shared form components
|   |   +-- FormField.tsx
|   |   +-- DatePicker.tsx
|   |   +-- DropdownSelect.tsx
|   |   +-- PhoneInput.tsx
|   +-- layout/                   # Layout components
|       +-- TabIcon.tsx
|       +-- HeaderBar.tsx
|       +-- SectionHeader.tsx
+-- hooks/                        # Custom hooks (business logic)
|   +-- useClients.ts
|   +-- useCases.ts
|   +-- useCalendar.ts
|   +-- useNotifications.ts
|   +-- useSearch.ts
|   +-- useDocuments.ts
|   +-- useDebounce.ts
+-- stores/                       # Zustand state stores
|   +-- clientStore.ts
|   +-- caseStore.ts
|   +-- calendarStore.ts
|   +-- notificationStore.ts
|   +-- searchStore.ts
|   +-- settingsStore.ts          # Language, theme preferences
+-- services/                     # API service layer (abstraction)
|   +-- api.ts                    # Base API client (config, interceptors)
|   +-- clientService.ts
|   +-- caseService.ts
|   +-- calendarService.ts
|   +-- documentService.ts
|   +-- notificationService.ts
|   +-- searchService.ts
+-- mocks/                        # Mock data and fake API implementation
|   +-- data/                     # Static fixture data
|   |   +-- clients.ts
|   |   +-- cases.ts
|   |   +-- events.ts
|   |   +-- documents.ts
|   |   +-- notifications.ts
|   +-- handlers/                 # Mock response handlers
|   |   +-- clientHandlers.ts
|   |   +-- caseHandlers.ts
|   |   +-- calendarHandlers.ts
|   |   +-- documentHandlers.ts
|   +-- delay.ts                  # Simulated network delay utility
+-- types/                        # TypeScript type definitions
|   +-- client.ts
|   +-- case.ts
|   +-- document.ts
|   +-- calendar.ts
|   +-- notification.ts
|   +-- navigation.ts
+-- i18n/                         # Internationalization
|   +-- index.ts                  # i18next config
|   +-- locales/
|       +-- sr-Latn/              # Serbian Latin
|       |   +-- common.json
|       |   +-- clients.json
|       |   +-- cases.json
|       |   +-- calendar.json
|       |   +-- settings.json
|       +-- sr-Cyrl/              # Serbian Cyrillic
|       |   +-- common.json
|       |   +-- clients.json
|       |   +-- cases.json
|       |   +-- calendar.json
|       |   +-- settings.json
|       +-- en/                   # English
|           +-- common.json
|           +-- clients.json
|           +-- cases.json
|           +-- calendar.json
|           +-- settings.json
+-- theme/                        # Design system tokens
|   +-- colors.ts                 # Golden/navy/white palette
|   +-- typography.ts             # Font sizes, weights, families
|   +-- spacing.ts                # Consistent spacing scale
|   +-- shadows.ts                # Elevation/shadow presets
|   +-- index.ts                  # Unified theme export
+-- utils/                        # Pure utility functions
|   +-- formatDate.ts             # Serbian date formatting (DD.MM.YYYY)
|   +-- formatNumber.ts           # Serbian number formatting (1.234,56)
|   +-- formatCurrency.ts         # RSD currency formatting
|   +-- validators.ts             # Form validation helpers
+-- constants/                    # App-wide constants
    +-- caseTypes.ts              # Case type taxonomy
    +-- caseStatuses.ts           # Status workflow definitions
    +-- routes.ts                 # Route name constants
```

### Structure Rationale

- **app/ (thin routes):** Route files in `app/` are thin wrappers that import from `screens/`. This follows Expo's official recommendation: keeping routing separate from UI logic makes screens reusable across routes and easier to test. Each route file is typically 5-15 lines.

- **screens/ (feature-grouped):** Screens are grouped by feature domain (clients, cases, calendar) rather than by technical layer. Each domain folder contains its screen components plus a `components/` subfolder for widgets only used within that domain. This keeps related code colocated.

- **components/ui/ (design system):** Shared primitives live here -- Button, Card, Badge, Input. These are domain-agnostic and used across all screens. They implement the golden/navy design tokens from `theme/`.

- **hooks/ (business logic):** Custom hooks are the "brains" of the app. They orchestrate Zustand stores and service calls. Components never call services directly -- they always go through a hook. This creates a clear testable boundary.

- **stores/ (client state):** Zustand stores are deliberately simple -- getters, setters, and computed selectors. No business logic in stores. One store per domain entity keeps state organized and prevents cross-domain coupling.

- **services/ (API abstraction):** Each service file exposes async functions that return typed data. The services call into `mocks/` now but the interface is designed so `mocks/` can be swapped for real HTTP calls to the .NET backend with zero changes to any code above the service layer.

- **mocks/ (data + handlers):** Separated into static `data/` fixtures and `handlers/` that simulate API behavior (delays, filtering, pagination). When the .NET backend is ready, this entire folder becomes dead code -- nothing else imports from it except `services/`.

- **types/ (shared types):** TypeScript interfaces and types shared across layers. These will eventually be generated from or aligned with the .NET API contracts.

- **i18n/ (namespaced translations):** Translation files are split by feature domain (clients.json, cases.json) rather than one giant file per locale. This keeps translation files manageable and allows feature teams to work independently. i18next supports namespace loading natively.

## Architectural Patterns

### Pattern 1: Thin Routes, Thick Screens

**What:** Route files in `app/` do almost nothing -- they import a screen component and re-export it. All UI logic, data fetching, and state management lives in `screens/` and `hooks/`.

**When to use:** Always. This is the standard pattern for Expo Router apps.

**Trade-offs:** Slight indirection (one extra file per screen), but prevents route files from becoming 500-line monsters and enables rendering the same screen from multiple routes.

**Example:**
```typescript
// src/app/(tabs)/clients/index.tsx  (THIN -- 3 lines)
import { ClientListScreen } from '@/screens/clients/ClientListScreen';
export default ClientListScreen;

// src/screens/clients/ClientListScreen.tsx  (THICK -- all the UI)
import { useClients } from '@/hooks/useClients';
import { ClientCard } from './components/ClientCard';

export function ClientListScreen() {
  const { clients, isLoading, search, setSearch } = useClients();
  // ... full screen implementation
}
```

### Pattern 2: Service Abstraction with Mock Swap

**What:** Services define an async interface for data access. The implementation currently delegates to mock handlers, but the interface matches what the real .NET API will provide. When the backend is ready, only the service internals change.

**When to use:** Any project that starts with mocked data and will later connect to a real API.

**Trade-offs:** Requires upfront interface design (you must guess the API shape), but the payoff is that zero UI code changes when the backend arrives.

**Example:**
```typescript
// src/services/clientService.ts
import type { Client, ClientListParams, ClientListResponse } from '@/types/client';
import { mockClientHandlers } from '@/mocks/handlers/clientHandlers';

// This interface stays the same when switching to real API
export const clientService = {
  getAll: async (params: ClientListParams): Promise<ClientListResponse> => {
    // MOCK: Replace this body with fetch('/api/clients', ...) later
    return mockClientHandlers.getAll(params);
  },

  getById: async (id: string): Promise<Client> => {
    return mockClientHandlers.getById(id);
  },

  create: async (data: Omit<Client, 'id'>): Promise<Client> => {
    return mockClientHandlers.create(data);
  },

  update: async (id: string, data: Partial<Client>): Promise<Client> => {
    return mockClientHandlers.update(id, data);
  },
};
```

### Pattern 3: Hooks as Business Logic Layer

**What:** Custom hooks sit between UI components and the data layer. They compose Zustand stores (for UI state like filters, selections) with service calls (for data fetching). Components consume hooks -- never stores or services directly.

**When to use:** Always. This is the critical boundary that keeps components testable and reusable.

**Trade-offs:** One more layer of indirection. Worth it because hooks are trivially testable (mock the store and service) and components become pure presentation.

**Example:**
```typescript
// src/hooks/useClients.ts
import { useClientStore } from '@/stores/clientStore';
import { clientService } from '@/services/clientService';
import { useCallback, useEffect, useState } from 'react';
import type { Client } from '@/types/client';

export function useClients() {
  const { searchQuery, setSearchQuery, selectedFilter, setSelectedFilter } = useClientStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await clientService.getAll({
        search: searchQuery,
        type: selectedFilter,
      });
      setClients(response.data);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    refresh: fetchClients,
  };
}
```

### Pattern 4: Theme as Static Tokens (Not Context)

**What:** The design system is a set of exported constant objects (colors, typography, spacing) rather than a React Context. Components import tokens directly. This app has a single theme (golden/navy) with no dark mode toggle, so Context-based theming adds unnecessary overhead.

**When to use:** When you have a fixed brand theme without runtime theme switching.

**Trade-offs:** Cannot dynamically switch themes at runtime. If dark mode is added later, refactor to a ThemeContext. For this showcase app with a defined golden/navy brand, static tokens are simpler and faster.

**Example:**
```typescript
// src/theme/colors.ts
export const colors = {
  // Primary - golden/amber from GoldenHomeDesignIdea.png
  primary: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#D4A017',   // Main golden
    600: '#B8860B',
    700: '#996515',
    800: '#7A5012',
    900: '#5C3D0F',
  },
  // Secondary - navy blue
  navy: {
    50: '#E8EAF6',
    100: '#C5CAE9',
    200: '#9FA8DA',
    300: '#7986CB',
    400: '#5C6BC0',
    500: '#1B2A4A',   // Main navy
    600: '#162240',
    700: '#111A33',
    800: '#0D1326',
    900: '#080D1A',
  },
  // Neutrals
  white: '#FFFFFF',
  background: '#FAF8F5',   // Warm off-white/cream from design
  surface: '#FFFFFF',
  border: '#E8E0D4',       // Warm gray border
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  // Status colors
  success: '#16A34A',
  warning: '#EAB308',
  error: '#DC2626',
  info: '#2563EB',
} as const;

// src/theme/typography.ts
export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18 },
} as const;

// src/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
```

### Pattern 5: Namespaced i18n with Feature-Split JSON

**What:** Translation strings are organized by feature domain in separate JSON files (common.json, clients.json, cases.json). i18next loads them as namespaces. This prevents a single 2000-line translation file and allows parallel work on translations.

**When to use:** Any app with more than ~50 translation keys or multiple feature domains.

**Trade-offs:** More files to manage, but each file is small and focused. i18next namespace loading handles the complexity.

**Example:**
```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import srLatnCommon from './locales/sr-Latn/common.json';
import srLatnClients from './locales/sr-Latn/clients.json';
import srLatnCases from './locales/sr-Latn/cases.json';
// ... more imports

const deviceLanguage = getLocales()[0]?.languageTag ?? 'sr-Latn';

i18n.use(initReactI18next).init({
  resources: {
    'sr-Latn': {
      common: srLatnCommon,
      clients: srLatnClients,
      cases: srLatnCases,
    },
    'sr-Cyrl': { /* ... */ },
    'en': { /* ... */ },
  },
  lng: deviceLanguage.startsWith('sr') ? 'sr-Latn' : 'en',
  fallbackLng: 'sr-Latn',
  ns: ['common', 'clients', 'cases', 'calendar', 'settings'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;

// Usage in component:
// const { t } = useTranslation('clients');
// t('list.title')  -->  "Klijenti"
```

## Data Flow

### Screen Load Flow

```
User taps "Clients" tab
    |
    v
app/(tabs)/clients/index.tsx
    |  (imports ClientListScreen)
    v
screens/clients/ClientListScreen.tsx
    |  (calls useClients hook)
    v
hooks/useClients.ts
    |  (reads filters from Zustand store)
    |  (calls clientService.getAll with filters)
    v
stores/clientStore.ts          services/clientService.ts
  |  searchQuery: ""             |  getAll(params)
  |  selectedFilter: "all"       |
  v                              v
                            mocks/handlers/clientHandlers.ts
                                 |  filters mock data, adds delay
                                 |  returns ClientListResponse
                                 v
                            mocks/data/clients.ts
                                 |  static Serbian client fixtures
```

### User Action Flow (Creating a New Client)

```
User fills form on ClientFormScreen
    |  (form state is local React state)
    v
User taps "Save"
    |
    v
hooks/useClients.ts --> create(formData)
    |
    v
services/clientService.ts --> create(data)
    |
    v
mocks/handlers/clientHandlers.ts
    |  (generates ID, adds to mock data, returns new Client)
    v
Hook receives new Client
    |  (updates local state or triggers refetch)
    v
Screen re-renders with updated list
    |
    v
router.back() -- navigates back to client list
```

### Navigation Data Flow

```
Root Layout (app/_layout.tsx)
  |  Providers: i18n, theme tokens (static import), fonts
  |
  +-- Tabs Layout (app/(tabs)/_layout.tsx)
       |  5 bottom tabs with icons + labels
       |
       +-- Home (index.tsx)
       |     Single screen, no stack needed
       |
       +-- Clients Stack (clients/_layout.tsx)
       |     index.tsx --> [id].tsx --> back
       |     index.tsx --> new.tsx --> back
       |
       +-- Cases Stack (cases/_layout.tsx)
       |     index.tsx --> [id].tsx --> documents.tsx
       |     index.tsx --> new.tsx --> back
       |
       +-- Calendar Stack (calendar/_layout.tsx)
       |     index.tsx --> [eventId].tsx
       |     index.tsx --> new-event.tsx --> back
       |
       +-- More Stack (more/_layout.tsx)
             index.tsx --> settings.tsx
             index.tsx --> notifications.tsx
             index.tsx --> search.tsx
             index.tsx --> profile.tsx
```

### State Management Strategy

```
+--------------------------------------------+
|  Local Component State (useState)           |
|  Form inputs, toggle states, animation      |
|  values, temporary UI state                 |
+--------------------------------------------+
               |
+--------------------------------------------+
|  Zustand Stores (global client state)       |
|  Search queries, selected filters, active   |
|  selections, language preference,           |
|  notification counts, cached lists          |
+--------------------------------------------+
               |
+--------------------------------------------+
|  Service Layer (async data)                 |
|  Fetched entities, CRUD operations          |
|  (Eventually from .NET API)                 |
+--------------------------------------------+
```

**Why Zustand over Context:** Zustand re-renders only components subscribed to changed state slices, whereas Context re-renders all consumers on any change. For an app with multiple stores (clients, cases, calendar, notifications, settings), Zustand's selective subscription prevents unnecessary renders, especially on list screens with many items. Zustand also requires zero boilerplate providers in the component tree.

**Why not React Query / TanStack Query:** For a mocked-data app, React Query's caching, stale-while-revalidate, and background refetching features provide little value -- there is no real server to stay in sync with. When the .NET backend arrives, adding React Query to the hooks layer is a natural evolution. The hook interface (return { data, isLoading, refresh }) already matches React Query's shape, making the migration straightforward.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Showcase/prototype (current) | Mock data, Zustand for state, simple service layer. No caching needed. Aim for clean separation so backend swap is easy. |
| Single office (10-50 users) | Replace mocks with real .NET API calls. Add React Query for server state caching. Add error boundaries. Add pull-to-refresh with stale detection. |
| Multi-office (100+ users) | Add offline-first with SQLite/WatermelonDB. Add push notifications via Expo Notifications. Add pagination with infinite scroll. Consider WebSocket for real-time updates. |

### Scaling Priorities

1. **First bottleneck -- API swap:** The mock-to-real transition is the first scaling event. The service layer abstraction exists specifically for this. Only service file internals change; no UI code changes.

2. **Second bottleneck -- list performance:** Serbian law offices can have thousands of cases. FlatList with proper `keyExtractor`, `getItemLayout`, and windowing is essential from day one. Do not use ScrollView for entity lists.

## Anti-Patterns

### Anti-Pattern 1: Fat Route Files

**What people do:** Put screen logic, data fetching, and 200 lines of JSX directly in `app/(tabs)/clients/index.tsx`.

**Why it is wrong:** Route files cannot be reused across routes. Testing requires mocking the entire Expo Router context. Refactoring navigation structure means rewriting screens.

**Do this instead:** Route files import from `screens/`. Screens are independent of their route location.

### Anti-Pattern 2: Components Calling Services Directly

**What people do:** Import `clientService` in a React component and call it in `useEffect`.

**Why it is wrong:** Scatters business logic across components. Makes it impossible to share data-fetching logic between screens. Creates duplicate fetch calls when multiple components need the same data.

**Do this instead:** All service calls go through custom hooks. Components consume hooks only.

### Anti-Pattern 3: Business Logic in Zustand Stores

**What people do:** Put filtering, sorting, API calls, and derived computations inside Zustand store actions.

**Why it is wrong:** Stores become massive, untestable, and tightly coupled to both the UI and the API. Changing the API shape requires changing the store.

**Do this instead:** Stores hold simple state (search query string, selected filter value). Hooks compose store state with service calls to produce derived data.

### Anti-Pattern 4: One Giant Translation File

**What people do:** Put all 500+ translation keys in a single `sr-Latn.json` file.

**Why it is wrong:** Merge conflicts when multiple developers add keys. Impossible to find keys. No logical grouping.

**Do this instead:** Split by feature domain (clients.json, cases.json, common.json). Use i18next namespaces to load them.

### Anti-Pattern 5: Inline Styles with Magic Numbers

**What people do:** Use `style={{ marginTop: 12, fontSize: 16, color: '#D4A017' }}` throughout components.

**Why it is wrong:** Color and spacing values are duplicated everywhere. Changing the brand palette requires finding every hex code in the codebase.

**Do this instead:** Import from `theme/colors`, `theme/spacing`, `theme/typography`. All visual values come from the design token system.

## Integration Points

### External Services (Future)

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| .NET Backend API | REST over HTTPS, JSON | Service layer swap: replace mock handlers with `fetch()` calls. Types already match expected API shape. |
| Expo Notifications | expo-notifications SDK | For push notification handling when backend sends them. Notification screen UI is built first with mock data. |
| Camera / File Picker | expo-image-picker, expo-document-picker | Expo Go compatible. Used for document scanning and file upload. |
| PDF Preview | expo-file-system + WebView or react-native-pdf | For document preview. Needs Expo Go compatibility check at implementation time. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Route <--> Screen | Direct import | Route imports and renders screen component. No props passed from route; screen reads its own params via `useLocalSearchParams()`. |
| Screen <--> Hook | Hook return value | Screen calls hook, destructures return value. No callbacks passed down except refresh/retry. |
| Hook <--> Store | Zustand selectors | Hook reads store state via selectors, calls store actions for state updates. |
| Hook <--> Service | Async function call | Hook calls service functions, awaits typed responses. |
| Service <--> Mock | Direct import (temporary) | Service imports mock handlers. This is the ONLY coupling to mock data -- everything above is mock-agnostic. |
| Component <--> Theme | Static import | Components import color/spacing/typography tokens directly. No context wrapping needed. |
| Component <--> i18n | `useTranslation` hook | Components get `t()` function from react-i18next. Namespace specified per component. |

## Build Order (Dependencies)

The following build order reflects component dependencies -- each layer depends on the ones above it being in place:

```
Phase 1: Foundation (no dependencies)
  +-- types/           Define all TypeScript interfaces first
  +-- theme/           Design tokens (colors, spacing, typography)
  +-- i18n/            Translation setup + sr-Latn strings
  +-- constants/       Case types, statuses, route names

Phase 2: Data Layer (depends on types)
  +-- mocks/data/      Static fixture data matching types
  +-- mocks/handlers/  Mock response handlers
  +-- services/        Service layer consuming mock handlers

Phase 3: State + Logic (depends on services, types)
  +-- stores/          Zustand stores for each domain
  +-- hooks/           Custom hooks composing stores + services

Phase 4: Design System (depends on theme)
  +-- components/ui/   Reusable primitives (Button, Card, etc.)
  +-- components/forms/ Form components (inputs, pickers)

Phase 5: Navigation Shell (depends on nothing at runtime, but needs Expo Router)
  +-- app/_layout.tsx          Root layout with providers
  +-- app/(tabs)/_layout.tsx   Tab bar configuration

Phase 6: Screens (depends on everything above)
  +-- screens/home/     Home dashboard (stat cards, recent cases, deadlines)
  +-- screens/clients/  Client list, detail, form
  +-- screens/cases/    Case list, detail, form, documents
  +-- screens/calendar/ Calendar views, event management
  +-- screens/more/     Settings, notifications, search, profile
```

**Build order rationale:**
- Types come first because every other layer depends on them for type safety.
- Theme and i18n are foundational -- every component uses them, so they must exist before any UI work begins.
- The data layer (mocks + services) must exist before hooks, since hooks consume services.
- The design system (components/ui) is built in parallel with or just after the data layer, since it only depends on theme tokens.
- Navigation shell is a thin wiring layer -- it can be set up early with placeholder screens.
- Screens are built last because they compose everything above: hooks for data, components/ui for presentation, theme for styling, i18n for text.

## Sources

- [Expo official blog: Expo App Folder Structure Best Practices](https://expo.dev/blog/expo-app-folder-structure-best-practices) -- HIGH confidence
- [Expo Router Documentation: Introduction](https://docs.expo.dev/router/introduction/) -- HIGH confidence
- [Expo Router Documentation: Nesting Navigators](https://docs.expo.dev/router/advanced/nesting-navigators/) -- HIGH confidence
- [Expo Router Documentation: Common Navigation Patterns](https://docs.expo.dev/router/basics/common-navigation-patterns/) -- HIGH confidence
- [Expo Router Documentation: Layout Files](https://docs.expo.dev/router/basics/layout/) -- HIGH confidence
- [Expo Documentation: Navigation in Expo Apps](https://docs.expo.dev/develop/app-navigation/) -- HIGH confidence
- [Expo Documentation: Localization SDK](https://docs.expo.dev/versions/latest/sdk/localization/) -- HIGH confidence
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54) -- HIGH confidence
- [Obytes Expo Starter: Project Structure](https://starter.obytes.com/getting-started/project-structure/) -- MEDIUM confidence
- [Obytes Expo Starter: UI and Theming](https://starter.obytes.com/ui-and-theme/ui-theming/) -- MEDIUM confidence
- [Architecture Guide: Zustand + React Query](https://dev.to/neetigyachahar/architecture-guide-building-scalable-react-or-react-native-apps-with-zustand-react-query-1nn4) -- MEDIUM confidence
- [State Management in 2026: Redux vs Zustand vs Context](https://medium.com/@abdurrehman1/state-management-in-2026-redux-vs-zustand-vs-context-api-ad5760bfab0b) -- LOW confidence
- [Implementing i18n in Expo + React Native (Feb 2026)](https://medium.com/@kgkrool/implementing-internationalization-in-expo-react-native-i18next-expo-localization-8ed810ad4455) -- MEDIUM confidence

---
*Architecture research for: Legal Office Mobile (React Native Expo SDK 54)*
*Researched: 2026-03-10*
