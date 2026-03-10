# Stack Research

**Domain:** Legal Office Management Mobile App (React Native / Expo)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo SDK | ~54.0.0 | App framework | Specified requirement. SDK 54 ships React Native 0.81, React 19.1. Last SDK supporting Old Architecture (though Expo Go runs New Architecture). Stable, well-documented. |
| React Native | 0.81 | Cross-platform UI | Bundled with Expo SDK 54. |
| React | 19.1 | UI library | Bundled with Expo SDK 54. Concurrent features, use() hook available. |
| Expo Router | ~4.0.0 | File-based navigation | Ships with SDK 54. File-based routing mirrors Next.js App Router patterns. Handles deep linking, typed routes, layouts, nested navigation out of the box. The standard for new Expo projects. |
| TypeScript | ~5.9.2 | Type safety | Recommended by Expo SDK 54 changelog. Essential for a domain-heavy app like legal case management where type safety prevents data integrity bugs. |

**Confidence:** HIGH -- versions verified from Expo SDK 54 changelog and official upgrade guide.

### State Management

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zustand | ^5.0.0 | Client state management | Lightweight (1.2kb), zero boilerplate, no providers needed, TypeScript-first. Perfect for a mid-complexity app. Supports persist middleware with AsyncStorage for offline state. The 2025 community consensus pick over Redux for apps that don't need Redux DevTools or massive normalized stores. |
| @tanstack/react-query | ^5.0.0 | Server state / API cache | De facto standard for data fetching, caching, background sync. Handles loading/error states, retry logic, cache invalidation. Critical for the mocked API layer -- when you swap mocks for real .NET backend, TanStack Query stays the same. |

**Confidence:** HIGH -- both are pure JS, widely used with Expo Go, verified across multiple sources.

### Styling

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| NativeWind | ^4.2.2 | Utility-first styling (Tailwind for RN) | Brings Tailwind CSS utility classes to React Native. Processes styles at build time with minimal runtime. Excellent DX, consistent cross-platform styling, dark mode support. Works with Expo Go. |
| tailwindcss | 3.4.17 | CSS engine for NativeWind | NativeWind v4 requires Tailwind CSS v3.x specifically -- do NOT use Tailwind v4.x which has breaking API changes incompatible with NativeWind v4. |

**Confidence:** HIGH -- NativeWind v4.2.2 verified on npm, Tailwind v3 requirement confirmed in multiple sources and NativeWind installation docs.

### Forms & Validation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-hook-form | ^7.71.0 | Form state management | Minimal re-renders, uncontrolled component pattern, excellent React Native support. The standard choice for RN forms in 2025. |
| zod | ^4.3.0 | Schema validation | TypeScript-first schema validation. Infers TypeScript types from schemas -- define once, validate and type-check everywhere. Pairs with react-hook-form via @hookform/resolvers. Critical for legal data integrity. |
| @hookform/resolvers | ^5.0.0 | RHF + Zod bridge | Connects Zod schemas to react-hook-form. Standard integration. |

**Confidence:** HIGH -- pure JS libraries, widely used pattern, verified versions on npm.

### Navigation & UI Components

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-native-reanimated | ~4.1.0 | Animations | Bundled with Expo SDK 54, included in Expo Go. Powers smooth transitions, gestures, shared element transitions. Required by bottom-sheet and other gesture-heavy components. |
| react-native-gesture-handler | ~2.28.0 | Touch gestures | Bundled with Expo SDK 54, included in Expo Go. Required dependency for Expo Router and bottom-sheet. |
| @gorhom/bottom-sheet | ^5.2.0 | Bottom sheet modals | The standard bottom sheet for React Native. Uses Reanimated + Gesture Handler (both in Expo Go). Used for filters, quick actions, detail previews. Some SDK 54 issues reported but v5.2.6 confirmed working. |
| react-native-safe-area-context | (bundled) | Safe area insets | Included in Expo Go. SafeAreaView from RN core is deprecated in SDK 54 -- use this instead. |

**Confidence:** HIGH -- all included in Expo Go, versions from SDK 54 changelog.

### Calendar

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-native-calendars | ^1.1314.0 | Calendar UI (monthly, agenda) | Pure JavaScript, Expo Go compatible (confirmed on React Native Directory). Provides Calendar, CalendarList, and Agenda components covering monthly view and agenda view needs. Most mature calendar library for RN with extensive customization. |
| @marceloterreiro/flash-calendar | ^1.0.0 | Alternative/supplementary calendar | Extremely performant (uses FlashList internally). Built-in localization, dark mode, Expo compatible. Consider for infinite-scroll monthly views if react-native-calendars performance is insufficient. FlashList is included in Expo Go. |

**Confidence:** MEDIUM -- react-native-calendars is JS-only and listed as Expo Go compatible on React Native Directory, but one source contradicted this. Flash Calendar depends on @shopify/flash-list which IS included in Expo Go. Recommend validating both in Expo Go early in development.

### Lists

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @shopify/flash-list | (bundled) | High-performance lists | Included in Expo Go with SDK 54. Drop-in FlatList replacement that recycles components. Use for case lists, client lists, search results -- any list with 50+ items. |

**Confidence:** HIGH -- confirmed included in Expo Go from Expo documentation.

### Internationalization (i18n)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| expo-localization | (bundled) | Device locale detection | Included in Expo Go. Detects user's device language, region, calendar preferences. Use getLocales() synchronously. |
| i18next | ^25.0.0 | i18n framework | Most popular i18n framework (i18next ecosystem). Supports namespaces, interpolation, pluralization, context-based translations. Well-documented React Native integration. |
| react-i18next | ^16.0.0 | React bindings for i18next | Provides useTranslation() hook, Trans component. 2.1M weekly downloads. Stable, well-maintained. Works with Expo Go (pure JS). |

**Confidence:** HIGH -- expo-localization is the official Expo recommendation, react-i18next is recommended in Expo docs and is the community standard. All pure JS.

**Note on Serbian:** i18next supports any locale. You will define three translation files: `sr-Latn` (Serbian Latin), `sr-Cyrl` (Serbian Cyrillic), `en` (English). The Intl API handles date/number formatting per locale automatically.

### Document Handling

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| expo-document-picker | (bundled) | File selection UI | Included in Expo Go. Opens system file picker for selecting documents (PDF, DOCX, etc.). |
| expo-image-picker | (bundled) | Camera photo capture | Included in Expo Go. Provides camera capture and gallery selection. Use for "scan document" feature by taking a photo. |
| expo-file-system | (bundled) | File read/write/download | Included in Expo Go. SDK 54 introduces new object-oriented API (import from `expo-file-system`, legacy at `expo-file-system/legacy`). Handles file downloads, local storage, base64 encoding. |
| react-native-webview | (bundled) | PDF preview | Included in Expo Go. Render PDFs via WebView + PDF.js approach. The only Expo Go-compatible approach for PDF viewing -- native PDF renderers require dev builds. |

**Confidence:** HIGH for document-picker, image-picker, file-system (all Expo SDK packages). MEDIUM for WebView PDF approach -- works but has limitations (no native PDF controls, relies on PDF.js rendering).

**Note on document scanning:** True edge-detection document scanning (like CamScanner) requires native modules (react-native-document-scanner-plugin, Scanbot SDK) that are NOT Expo Go compatible. For Expo Go, the approach is: camera capture via expo-image-picker, then optional client-side image processing. If edge detection is critical, it requires a dev build.

### Local Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @react-native-async-storage/async-storage | (bundled) | Key-value persistence | Included in Expo Go. Asynchronous, unencrypted, persistent storage. Use for Zustand persist middleware, caching, app preferences. The standard Expo Go-compatible storage. |
| expo-secure-store | (bundled) | Encrypted storage | Included in Expo Go. Use for sensitive data (API tokens, user credentials when auth is added later). |

**Confidence:** HIGH -- both are Expo SDK packages confirmed in Expo Go.

**Note:** react-native-mmkv (30x faster than AsyncStorage) is NOT compatible with Expo Go. Use AsyncStorage for Expo Go; consider MMKV if migrating to dev builds later.

### Notifications

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| expo-notifications | (bundled) | Local notifications | Included in Expo Go for LOCAL notifications. Schedule deadline reminders, hearing date alerts, task due dates. Remote push notifications require a dev build. |

**Confidence:** HIGH -- local notification support in Expo Go confirmed in Expo documentation.

### Date Handling

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| date-fns | ^4.0.0 | Date manipulation | Tree-shakeable, functional approach (import only what you use). Better for bundle size than importing all of dayjs. Works well with react-native-calendars. Use alongside Intl API for locale-aware formatting. |

**Confidence:** HIGH -- pure JS, widely used, tree-shaking verified.

**Alternative considered:** dayjs (670kb total vs date-fns 22MB total, but date-fns tree-shakes to smaller actual bundle). date-fns chosen for functional API consistency with the rest of the stack and better tree-shaking.

### Toast / Feedback

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-native-toast-message | ^2.0.0 | Toast notifications | Pure JS, Expo Go compatible, customizable toast UI. No native dependencies. Use for success/error/info feedback throughout the app. |

**Confidence:** MEDIUM -- confirmed JS-only and used in Expo projects, but verify latest version compatibility with SDK 54 in early development.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| expo-dev-client | Development builds | Not for Expo Go phase, but include for future migration to dev builds when native modules are needed. |
| @tanstack/react-query-devtools | Query debugging | Expo plugin available for on-device query inspection. |
| babel-preset-expo | Babel configuration | Bundled with Expo. Handles Reanimated v4 plugin automatically in SDK 54 -- do NOT add reanimated/plugin to babel.config.js manually. |
| eslint + prettier | Code quality | Standard tooling. Use Expo's default ESLint config. |

## Installation

```bash
# Create Expo SDK 54 project
npx create-expo-app@latest LegalOfficeMobile --template blank-typescript

# Core navigation (already included with expo-router template, but for blank):
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# State management
npm install zustand @tanstack/react-query

# Styling
npm install nativewind@^4.2.2
npm install -D tailwindcss@3.4.17

# Forms & validation
npm install react-hook-form zod @hookform/resolvers

# i18n
npm install i18next react-i18next
npx expo install expo-localization

# Calendar
npm install react-native-calendars

# UI components
npm install @gorhom/bottom-sheet react-native-toast-message

# Date utilities
npm install date-fns

# Document handling (expo packages)
npx expo install expo-document-picker expo-image-picker expo-file-system react-native-webview

# Storage
npx expo install @react-native-async-storage/async-storage expo-secure-store

# Notifications
npx expo install expo-notifications

# Animations (should already be installed with Expo)
npx expo install react-native-reanimated react-native-gesture-handler
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Zustand | Redux Toolkit | When you need Redux DevTools time-travel debugging, or when team has strong Redux expertise. RTK is overkill for this app's complexity. |
| Zustand | Jotai | When you prefer atomic state model. Similar size/philosophy to Zustand but less ecosystem adoption for persistence patterns. |
| NativeWind | StyleSheet.create | When you want zero styling dependencies. NativeWind adds build complexity but dramatically improves DX and consistency. |
| NativeWind | Tamagui / Unistyles | Tamagui for full design system with compiler optimizations. Unistyles for StyleSheet-like API with themes. Both are heavier. NativeWind better for Tailwind-familiar teams. |
| react-i18next | Lingui | When you need ICU MessageFormat or extraction-based workflow. Lingui is excellent but smaller ecosystem than i18next. |
| react-i18next | i18n-js | Simpler API but less features (no namespaces, weaker TypeScript support). Fine for 2-3 languages with simple strings. i18next better for three scripts (Latin, Cyrillic, English) with complex legal terminology. |
| date-fns | dayjs | When you use many date operations and prefer chaining API. dayjs is smaller upfront but doesn't tree-shake as well. |
| react-native-calendars | @marceloterreiro/flash-calendar | When performance on calendar views is critical (infinite scroll). Flash Calendar is faster but younger library with less customization options for agenda views. |
| AsyncStorage | react-native-mmkv | When you migrate to dev builds. MMKV is 30x faster, synchronous. Not Expo Go compatible. |
| react-native-webview (PDF) | react-native-pdf | When you migrate to dev builds. Native PDF rendering is smoother. Not Expo Go compatible. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Redux (plain) | Excessive boilerplate for this app's scope. No time-travel debugging need. | Zustand |
| MobX | Decorator-heavy, class-based patterns conflict with React hooks / functional paradigm. Smaller community in RN. | Zustand |
| Tailwind CSS v4 | Breaking changes incompatible with NativeWind v4. NativeWind v4 requires Tailwind v3.x. Using v4 causes build failures. | tailwindcss@3.4.17 |
| NativeWind v2/v3 | Deprecated. v4 is the current supported version with React 19 and Expo SDK 54 compatibility. | nativewind@^4.2.2 |
| moment.js | Deprecated, massive bundle size (330kb), mutable API. | date-fns |
| expo-av | Scheduled for removal in SDK 55. Use expo-video and expo-audio instead if media playback needed. | expo-video / expo-audio |
| SafeAreaView (from react-native) | Deprecated in SDK 54. | react-native-safe-area-context |
| react-native-document-scanner-plugin | Requires native code, NOT Expo Go compatible. | expo-image-picker (camera) |
| react-native-mmkv | Not in Expo Go. Contains native C++ code. | AsyncStorage |
| Formik | Less performant than react-hook-form (re-renders entire form on change). Larger bundle. Less maintained. | react-hook-form |
| react-native-pdf | Requires native code, NOT Expo Go compatible. | WebView + PDF.js |
| burnt (toast) | Requires native code (iOS UIKit toasts), NOT Expo Go compatible. | react-native-toast-message |
| Reanimated babel plugin (manual) | In SDK 54 with Reanimated v4, the worklets plugin is bundled internally. Adding `react-native-reanimated/plugin` to babel.config.js causes "Duplicate plugin/preset detected" error. | Let babel-preset-expo handle it automatically |

## Stack Patterns by Variant

**If staying in Expo Go (current requirement):**
- Use AsyncStorage for persistence
- Use WebView for PDF viewing
- Use expo-image-picker for document "scanning" (camera capture only)
- Use local notifications only (no remote push)
- Use react-native-calendars or flash-calendar for calendar UI

**If migrating to dev builds later:**
- Swap AsyncStorage for react-native-mmkv (30x faster)
- Swap WebView PDF for react-native-pdf (native rendering)
- Add react-native-document-scanner-plugin for real document scanning
- Enable remote push notifications
- Consider @shopify/flash-list v2 directly for all lists

## Version Compatibility Matrix

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| expo@~54.0.0 | react-native@0.81, react@19.1 | Fixed pairing. Use `npx expo install --fix` to resolve. |
| nativewind@^4.2.2 | tailwindcss@3.4.17 | Do NOT use Tailwind v4.x. |
| react-native-reanimated@~4.1.0 | New Architecture only | Expo Go uses New Architecture by default in SDK 54. Reanimated v3 available if Legacy Architecture needed in dev builds. |
| @gorhom/bottom-sheet@^5 | reanimated@3-4, gesture-handler@2 | v5.2.6 confirmed working with Expo SDK 54. |
| react-native-calendars@^1.1314.0 | Pure JS, no native deps | Works with any RN version. |
| @marceloterreiro/flash-calendar | @shopify/flash-list (peer dep) | FlashList included in Expo Go. |
| zustand@^5.0.0 | react@18+, react@19 | Pure JS, no platform dependencies. |
| @tanstack/react-query@^5 | react@18+, react@19 | Pure JS, no platform dependencies. |
| zod@^4.3.0 | TypeScript 5.x | Pure JS validation. No React dependency. |

## Sources

- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54) -- core versions, breaking changes, package updates (HIGH confidence)
- [Expo SDK 54 Upgrade Guide](https://expo.dev/blog/expo-sdk-upgrade-guide) -- migration details, version requirements (HIGH confidence)
- [Expo Localization Guide](https://docs.expo.dev/guides/localization/) -- i18n recommendations (HIGH confidence)
- [Expo Tailwind CSS Guide](https://docs.expo.dev/guides/tailwind/) -- NativeWind setup (HIGH confidence)
- [Expo Documentation - Flash List](https://docs.expo.dev/versions/latest/sdk/flash-list/) -- Expo Go inclusion confirmed (HIGH confidence)
- [Expo Documentation - Reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/) -- Expo Go inclusion confirmed (HIGH confidence)
- [Expo Documentation - AsyncStorage](https://docs.expo.dev/versions/latest/sdk/async-storage/) -- Expo Go inclusion confirmed (HIGH confidence)
- [Expo Documentation - Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) -- local vs push capabilities (HIGH confidence)
- [Expo File System Blog](https://expo.dev/blog/expo-file-system) -- new API in SDK 54 (HIGH confidence)
- [React Native Directory](https://reactnative.directory/?expoGo=true&search=calendar) -- Expo Go compatibility tags (HIGH confidence)
- [NativeWind Installation Docs](https://www.nativewind.dev/docs/getting-started/installation) -- Tailwind v3 requirement (HIGH confidence)
- [Flash Calendar Expo Blog](https://expo.dev/blog/build-fast-flexible-calendars-in-react-native-with-flash-calendar) -- performance, Expo compatibility (MEDIUM confidence)
- [Zustand GitHub](https://github.com/pmndrs/zustand) -- v5 release (MEDIUM confidence)
- [TanStack Query RN Docs](https://tanstack.com/query/v5/docs/react/react-native) -- React Native integration patterns (HIGH confidence)
- [Galaxies.dev React Native Tech Stack 2025](https://galaxies.dev/article/react-native-tech-stack-2025) -- ecosystem survey (LOW confidence -- community blog)
- [Obytes Expo Starter](https://starter.obytes.com/) -- form and i18n patterns (MEDIUM confidence)
- Multiple Medium/DEV.to articles on SDK 54 migration -- version compatibility issues (LOW confidence individually, MEDIUM when corroborated)

---
*Stack research for: Legal Office Management Mobile App (Serbia)*
*Researched: 2026-03-10*
