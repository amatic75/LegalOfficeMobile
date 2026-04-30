# Pitfalls Research

**Domain:** Law Office Management Mobile App (React Native Expo SDK 54, Expo Go)
**Researched:** 2026-03-10
**Confidence:** HIGH (verified with official Expo docs, GitHub issues, and multiple community sources)

## Critical Pitfalls

### Pitfall 1: Expo Go Boundary Violations -- Using Libraries That Require Native Modules

**What goes wrong:**
Developers select a library (document scanner, PDF viewer, push notifications, maps) that requires native code not bundled in Expo Go. The app crashes or the feature silently fails at runtime. This is especially dangerous for this project because document handling (camera scanning, PDF preview) and push notifications are core features listed in the spec.

**Why it happens:**
npm packages do not clearly label Expo Go compatibility. A library may say "supports Expo" meaning it works with Expo's build system (EAS Build / dev clients), not Expo Go specifically. Developers install it, see no build errors (because JS imports succeed), then hit a runtime crash when the native module is missing.

Specific to this project:
- `react-native-document-scanner-plugin` does NOT work in Expo Go (requires dev build)
- `react-native-pdf` does NOT work in Expo Go (needs native linking)
- Remote push notifications are NOT available in Expo Go
- Any library requiring custom native code is excluded

**How to avoid:**
1. Before adding ANY dependency, check the [React Native Directory](https://reactnative.directory/) for Expo Go compatibility
2. Maintain a vetted library allowlist in the project docs
3. For PDF viewing: use `pdf-viewer-expo` (WebView + PDF.js, pure JS, Expo Go compatible) instead of `react-native-pdf`
4. For document capture: use `expo-image-picker` (camera mode) + `expo-camera` instead of dedicated scanner libraries. Accept that edge detection/auto-crop is not available in Expo Go
5. For notifications: use local notifications only via `expo-notifications` (works in Expo Go). Design the mock layer to simulate push notifications locally
6. Run `npx expo-doctor` after adding any new dependency

**Warning signs:**
- Library README mentions "requires linking" or "requires pods"
- Library has a `react-native.config.js` file
- Installation instructions include `npx pod-install` or manual Android/iOS configuration
- Library provides an Expo config plugin (this means it needs a dev build, not Expo Go)

**Phase to address:**
Phase 1 (Foundation/Setup). Establish the vetted library list before any feature development begins. Every library choice in later phases must reference this list.

---

### Pitfall 2: Nested Navigation State Corruption -- Tabs + Stacks Losing Back State

**What goes wrong:**
With 5 bottom tabs each containing nested stack navigators, users navigate deep into a tab's stack, switch tabs, then return to find they are stuck on a nested screen with no back button. Or: deep links open the wrong screen within a tab. Or: shared screens (like notifications, profile) cause navigation resets when placed inside tabs.

This is a well-documented and frequently reported issue in Expo Router (GitHub issues #910, #797, #530, #818).

**Why it happens:**
Expo Router uses file-system-based routing. When tabs contain stacks, the navigation state management has known edge cases:
- Tab switching does not automatically reset nested stack state
- `unstable_settings` (used to set initial routes) can break deep linking when the app is foregrounded
- Links stop working after a tab has been navigated to at least once (issue #797)
- `withAnchor` does not respect nested stack anchors, landing users on wrong "home" screens

**How to avoid:**
1. Place shared screens (Help, Profile, Notifications, Settings) OUTSIDE the tab navigator at the root stack level -- official Expo docs recommend this
2. Add a tab press listener that resets the nested stack to its root when the tab is re-selected:
   ```typescript
   // In tab _layout.tsx
   screenListeners={{
     tabPress: (e) => {
       // Reset to root of this tab's stack
       navigation.dispatch(StackActions.popToTop());
     },
   }}
   ```
3. Test navigation flows exhaustively: tab switch after deep navigation, deep links from killed state, deep links from background state, back button after tab switching
4. Avoid `unstable_settings` if you need deep linking to work reliably
5. Use typed routes (enable in `app.json` with `experiments.typedRoutes: true`) to catch invalid navigation paths at build time

**Warning signs:**
- QA reports "I got stuck on a screen"
- Back button disappears after tab switching
- Deep links work on fresh launch but not when app is already open
- Navigation tests only cover happy paths (forward navigation)

**Phase to address:**
Phase 2 (Navigation Setup). This must be the first major feature phase. Get navigation architecture right before building any screens. Build a navigation test harness that exercises tab switching, deep stack navigation, and back navigation.

---

### Pitfall 3: i18n Architecture That Forces Full Re-renders on Locale Switch

**What goes wrong:**
The app supports 3 locales (Serbian Latin, Serbian Cyrillic, English). Switching locale triggers a full tree re-render, causing visible flicker, loss of scroll position, and dropped form state. On lower-end Android devices common in Serbia, this creates a 1-2 second freeze.

With Serbian Cyrillic and Latin being two scripts of the same language, users may switch frequently (some courts require Cyrillic, some law offices use Latin internally). This is not a "set once at install" feature -- it is a frequent user action.

**Why it happens:**
- Using React Context for i18n state causes all consuming components to re-render when locale changes (Context re-renders ALL descendants, not just those using the changed value)
- Loading all 3 locale bundles upfront increases initial bundle size
- Not memoizing translated strings means every render recalculates translations
- Date/number formatting not centralized -- scattered `Intl` calls with hardcoded locales

**How to avoid:**
1. Use `i18next` + `react-i18next` with namespace-based lazy loading. Load only the active locale's translations, fetch others on demand
2. Use Zustand (not Context) for locale preference storage -- Zustand allows selective subscriptions so only components using locale state re-render
3. Structure translation files by feature namespace (`cases.json`, `clients.json`, `calendar.json`) not one giant file per locale
4. Create centralized date/number formatters that read locale from the i18n instance:
   ```typescript
   // utils/formatters.ts
   export const formatDate = (date: Date) => {
     const locale = i18n.language;
     return new Intl.DateTimeFormat(locale === 'sr-Latn' ? 'sr-Latn-RS' : locale === 'sr-Cyrl' ? 'sr-Cyrl-RS' : 'en-US').format(date);
   };
   ```
5. Serbian date format is DD.MM.YYYY (not MM/DD/YYYY). Serbian numbers use comma as decimal separator (1.234,56). Hardcode these as locale-specific format rules, do not rely on browser defaults

**Warning signs:**
- Visible flicker when switching language
- Form data lost on locale switch
- Translation file per locale exceeds 50KB
- Date formats appear wrong (month/day swapped)
- Currency shows $ instead of RSD/din.

**Phase to address:**
Phase 1 (Foundation). i18n infrastructure must be in place before any UI strings are written. Retrofitting i18n is extremely expensive -- every hardcoded string becomes a bug.

---

### Pitfall 4: Mock Service Layer That Diverges From Real .NET API Contract

**What goes wrong:**
The mock backend is built with convenient JavaScript objects that do not match the actual .NET API response shapes. When the real backend is connected later, every screen breaks because:
- Field names differ (camelCase in mock vs PascalCase from .NET)
- Date formats differ (ISO strings in mock vs .NET DateTime serialization)
- Pagination structure differs (mock returns arrays, API returns `{ items: [], totalCount, page }`)
- Error response shapes differ (mock throws JS errors, API returns `{ status, errors: [] }`)
- Null handling differs (mock uses `undefined`, API uses `null` or omits fields)

**Why it happens:**
Without a formal API contract, mock data is shaped for UI convenience. Developers build the "happy path" mock and never test error states, empty states, or edge cases. The mock becomes coupled to the UI rather than representing a realistic API.

**How to avoid:**
1. Define TypeScript interfaces for ALL API contracts FIRST, before writing any mock data or UI code. These types are the single source of truth:
   ```typescript
   // types/api/cases.ts
   interface CaseListResponse {
     items: CaseDto[];
     totalCount: number;
     page: number;
     pageSize: number;
   }
   ```
2. Build the service layer as an interface with two implementations:
   ```typescript
   interface ICaseService {
     getCases(params: CaseQueryParams): Promise<CaseListResponse>;
     getCaseById(id: string): Promise<CaseDto>;
   }
   class MockCaseService implements ICaseService { ... }
   class ApiCaseService implements ICaseService { ... }   // future
   ```
3. Mock data must include: empty responses, error responses, null fields, large datasets (100+ items for pagination testing), and Serbian-specific data (Cyrillic names, Serbian addresses, JMBG numbers)
4. Use simulated network delays (200-800ms random) in mocks to surface loading state bugs early
5. Match .NET conventions: PascalCase in DTOs, ISO 8601 dates, standard error envelope

**Warning signs:**
- Mock responses are plain objects without TypeScript types
- No error simulation in mocks
- Mock data uses English names/addresses instead of Serbian
- Service calls return data directly instead of wrapped in API response envelopes
- No loading delay simulation -- everything appears instant

**Phase to address:**
Phase 1 (Foundation). Define API contracts and service layer interfaces as the very first coding task. All feature phases depend on this being correct.

---

### Pitfall 5: Custom Fonts Missing Cyrillic Glyphs

**What goes wrong:**
A custom font is selected for the golden/navy design system, loaded via `expo-font`, and works perfectly in English and Serbian Latin. When the user switches to Serbian Cyrillic, characters render as empty boxes or fall back to the system font, breaking the visual design.

**Why it happens:**
Many design-focused fonts (especially Google Fonts) ship Latin-only subsets by default. Developers test with Latin characters and never verify Cyrillic coverage. On iOS, the problem is compounded because iOS uses the font's internal metadata name (not the filename), and a misconfigured font name causes silent fallback to system fonts.

Serbian Cyrillic uses characters not present in Russian Cyrillic (e.g., Lj/lj, Nj/nj, Dj/dj, Dz/dz) -- even fonts that claim "Cyrillic support" may lack these Serbian-specific glyphs.

**How to avoid:**
1. Before selecting ANY custom font, verify it contains all Serbian Cyrillic glyphs by rendering a test string: "Љ Њ Ћ Ђ Џ Ж Ш Ч Ц љ њ ћ ђ џ ж ш ч ц"
2. Use a font inspection tool (FontForge, fontdrop.info) to verify glyph coverage before committing to a font family
3. Download the full font files (not Latin-only subsets) -- on Google Fonts, this means selecting "Cyrillic" and "Cyrillic Extended" subsets
4. Load fonts with `expo-font` using the config plugin approach (recommended for SDK 54) rather than runtime loading, for better performance
5. Test on both iOS and Android -- iOS font rendering behavior differs from Android
6. Have a fallback font stack that includes a known-good Cyrillic system font

**Warning signs:**
- Empty boxes (tofu) appearing in Cyrillic mode
- Inconsistent font appearance between Latin and Cyrillic modes
- Font file size suspiciously small (under 100KB -- likely missing character sets)
- Different font rendering on iOS vs Android

**Phase to address:**
Phase 1 (Design System). Font selection and verification must happen during design system setup, before any screens are built.

---

### Pitfall 6: SDK 54 is the Last Old Architecture SDK -- Future Upgrade Cliff

**What goes wrong:**
The app is built on SDK 54 with Old Architecture patterns. When SDK 55 ships (likely mid-2026), it will ONLY support New Architecture (React Native 0.83+). Libraries like Reanimated v4 and FlashList v4 already require New Architecture. The project faces a forced migration with breaking changes across the entire codebase.

**Why it happens:**
Expo SDK 54 is explicitly the last release supporting Old Architecture. Developers build the app, defer the architecture decision, and face a massive upgrade when SDK 55 arrives. Key breaking changes compound:
- Reanimated v4 requires New Architecture + `react-native-worklets`
- `expo-av` is removed in SDK 55 (must migrate to `expo-audio` / `expo-video`)
- `expo-file-system` legacy API removed in SDK 55
- Metro internal imports changed
- First-party JSC removed

**How to avoid:**
1. Enable New Architecture from day one in SDK 54 (`newArchEnabled: true` in app.json). SDK 54 supports both, so build on New Architecture now to avoid migration pain later
2. Use `npx expo-doctor` regularly to check library compatibility with New Architecture
3. Avoid deprecated APIs from the start: use `expo-file-system` new API (not `/legacy`), use `expo-audio`/`expo-video` (not `expo-av`), use `react-native-safe-area-context` (not React Native's `SafeAreaView`)
4. Pin to SDK 54 compatible library versions but write code that is New Architecture compatible
5. Budget time for SDK 55 upgrade in the project timeline (likely 1-2 sprint effort)

**Warning signs:**
- Using `expo-av` for audio/video
- Using `expo-file-system` legacy imports
- Using React Native's built-in `SafeAreaView`
- `npx expo-doctor` reports incompatible libraries
- Reanimated v3 instead of v4

**Phase to address:**
Phase 1 (Foundation). The New Architecture decision must be made at project creation. Retrofitting is significantly harder than starting with it.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded Serbian strings instead of i18n keys | Faster initial screen development | Every string must be found and wrapped later; high risk of missed strings | Never -- use i18n keys from first screen |
| Inline styles instead of design system tokens | Quick visual iteration | Inconsistent golden/navy theme, every style change requires touching many files | Only in throwaway prototypes |
| `any` type on navigation params | Avoids complex type setup | Runtime crashes from wrong params, no IDE autocomplete for routes | Never -- typed routes are available in Expo Router |
| Single giant mock data file | Quick to set up | Impossible to maintain, unrealistic data shapes, no relationship integrity | Never -- structure mocks by entity/domain |
| `AsyncStorage` for all local state | Simple key-value API | 6MB limit on Android, no query capability, synchronous-looking but async, blocks UI on large reads | Only for small preferences (<50 key-value pairs) |
| Skipping loading/error states in screens | Screens look done faster | When real API is connected, every screen shows raw errors or blank screens | Never -- mock service should simulate delays/errors |
| Platform-specific code via `Platform.OS` checks scattered in components | Quick fix for one-off differences | Unmaintainable, hard to test, differences accumulate | Only for truly minor differences; otherwise abstract into platform files |

## Integration Gotchas

Common mistakes when connecting to external services and platform features.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| expo-camera | Mounting multiple Camera components simultaneously | Only one Camera preview can be active. Unmount Camera when screen loses focus using `useFocusEffect` |
| expo-image-picker | Not handling permission denial gracefully | Check permissions first with `requestMediaLibraryPermissionsAsync()`, show explanation UI if denied, handle "never ask again" state |
| expo-document-picker | Assuming file persists at returned URI | Files are copied to cache directory by default. If you need persistence, copy to app's document directory immediately |
| expo-notifications (local) | Scheduling notifications without checking permissions | Request permission first. On iOS, permission denial is permanent until user changes settings manually |
| expo-font | Using filename as font family name on iOS | iOS uses the font's internal PostScript name from metadata, not the filename. Verify with font inspection tool |
| PDF via WebView | Loading large PDFs (>10MB) into WebView-based viewer | WebView PDF rendering is memory-constrained. Compress PDFs before display, or paginate rendering. Set `originWhitelist` properly |
| Locale switching | Calling `I18nManager.forceRTL()` without full reload | RTL changes require app reload via `expo-updates`. For Serbian (LTR), this is not needed, but the API trap exists |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rendering case lists with `ScrollView` + `.map()` instead of `FlatList` | Slow initial render, memory growth, janky scroll | Use `FlatList` or `FlashList` for ANY list over 20 items. Provide `keyExtractor` and `getItemLayout` | 50+ items |
| Unoptimized calendar month view rendering all days as individual components | Calendar month change takes 500ms+, visible blank flash | Use `react-native-calendars` (JS-only, Expo Go compatible) or `flash-calendar` (uses FlashList internally). Memoize day cells | 3+ months of events loaded |
| Re-rendering entire screen on Context state changes | Frame drops during navigation, slow form input | Use Zustand for global state with selector-based subscriptions. Keep Context for truly static data (theme, auth status) | 5+ Context consumers on one screen |
| Loading all mock data into memory at app startup | Slow cold start (3+ seconds), high memory usage | Implement pagination in mock service. Load data lazily by screen/feature. Simulate realistic API response sizes (20-50 items per page) | 500+ total mock records |
| Uncompressed images from camera/picker stored in state | Memory warnings, app crashes on older Android devices | Compress images immediately after capture (`quality: 0.7` in ImagePicker). Store file URIs, not base64 in state | 5+ images in memory |
| Deeply nested component trees without `React.memo` | Entire subtrees re-render on any parent state change | Apply `React.memo` to list item components, card components, and any component rendered inside FlatList. Use `useCallback` for functions passed as props | 10+ items in a list with interactive elements |

## Security Mistakes

Domain-specific security issues for a legal office application.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing case data in `AsyncStorage` unencrypted | Attorney-client privileged data exposed if device is compromised | Use `expo-secure-store` for sensitive tokens/credentials. For larger data caches, encrypt before storing. Note: `expo-secure-store` has size limits (2KB per item on iOS) |
| Logging case details to console in production | Legal data appears in device logs accessible via USB debugging | Strip all `console.log` in production builds. Use a logging library with environment-aware levels |
| Not clearing cached data on logout | Next user on shared device sees previous user's case data | On logout: clear AsyncStorage, clear image cache, clear navigation state, revoke tokens |
| Mock data containing real client information | Real Serbian legal data in source code violates GDPR | Generate realistic but fictional Serbian mock data. Use fake JMBG numbers (fail checksum validation), fictional addresses, generated names |
| Caching PDF documents without access control consideration | Downloaded PDFs persist in device cache indefinitely | Set cache expiry. Clear case-related cache when user loses access to a case. Implement cache cleanup on app background |

## UX Pitfalls

Common user experience mistakes in legal office mobile apps.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Forcing Cyrillic-only or Latin-only based on device locale | Serbian lawyers use both scripts depending on context (courts vs internal). Device locale is not a reliable indicator | Let user choose script independently of device language. Remember preference per-user. Support switching without app restart |
| Calendar showing only month view | Lawyers need to see daily schedule with time slots for court hearings, not just dates with dots | Provide day, week, and month views. Day view is the primary view showing time-blocked schedule. Month view for overview only |
| Search requiring exact match on case numbers | Serbian case numbers have complex formats (P 123/24, K 45/2024, Iv 678/23). Users remember fragments | Implement fuzzy search that matches partial case numbers, strips formatting, and normalizes year formats (24 = 2024) |
| Document list showing filename only | Legal documents have opaque filenames (scan_001.pdf, IMG_20240312.jpg) | Show document type, upload date, associated case, and first-page thumbnail where possible |
| Long forms without save-as-draft | Lawyers get interrupted by calls/court. Losing 10 minutes of data entry is unacceptable | Auto-save form state every 30 seconds. Restore on return. Show "draft saved" indicator |
| Notifications without deep link to relevant screen | User taps notification, lands on home screen, must manually find the case | Every notification must deep link to the specific case/document/calendar event |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Navigation:** Tested tab switching after 3+ levels of stack depth -- verify back button works correctly on all 5 tabs
- [ ] **i18n:** All 3 locales tested on every screen -- verify no hardcoded strings remain (especially in error messages, toasts, and placeholder text)
- [ ] **Date formatting:** Verified DD.MM.YYYY format in Serbian locales, not MM/DD/YYYY. Check calendar headers, form date pickers, list item dates, notification timestamps
- [ ] **Number formatting:** Serbian uses comma as decimal, period as thousands separator (1.234,56 RSD). Check currency displays, fee calculations, case values
- [ ] **Empty states:** Every list screen has a designed empty state -- not just a blank white screen when there are no cases/clients/documents
- [ ] **Error states:** Network error simulation tested on every screen that calls a service. Verify retry buttons work, error messages are translated
- [ ] **Keyboard handling:** Forms with multiple inputs tested with soft keyboard open -- verify no inputs are hidden behind keyboard, ScrollView adjusts
- [ ] **Camera/ImagePicker permissions:** Tested permission denial flow on both iOS and Android. Tested "Don't ask again" state on Android. Verified app doesn't crash
- [ ] **Offline state:** Tested what happens when device is in airplane mode. Verify graceful degradation, not crash
- [ ] **Serbian mock data:** Verify mock data uses Serbian names (Petar Petrovic, not John Smith), Serbian addresses (Belgrade streets), Serbian phone format (+381...), Serbian date formats
- [ ] **Design system:** Golden/navy colors tested for WCAG AA contrast compliance. Verify text is readable on both light and dark backgrounds. Check that golden text on white fails contrast
- [ ] **Large text / accessibility:** Tested with device font size set to maximum. Verify no text truncation that hides critical information

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Expo Go incompatible library discovered late | MEDIUM | Replace with Expo Go compatible alternative. If no alternative exists, create a feature flag to disable that feature in Expo Go and document as requiring dev build |
| Navigation state corruption in production | HIGH | Audit all navigation calls. Add `popToTop()` on tab re-selection. Move shared screens outside tabs. May require restructuring app directory |
| All strings hardcoded (i18n skipped) | VERY HIGH | Extract all strings file-by-file. Use grep/AST tools to find string literals in JSX. Budget 2-3 days per 10 screens |
| Mock data shapes don't match API | HIGH | Define TypeScript interfaces from .NET API spec. Rewrite mock generators to produce conforming data. Fix every screen's data access patterns |
| Font missing Cyrillic glyphs | LOW | Replace font files with full character set version, or switch to a different font family that supports Serbian Cyrillic. 1-2 hour fix if design tokens are centralized |
| New Architecture migration forced by SDK 55 | HIGH | Run `npx expo-doctor`, fix all flagged libraries. Test every screen. Budget 1-2 weeks if built on Old Architecture from start |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Expo Go boundary violations | Phase 1: Foundation | Run `npx expo-doctor` in CI. Maintain allowlist doc. Every PR adding a dependency must reference compatibility check |
| Navigation state corruption | Phase 2: Navigation | Navigation test harness covering: 5 tabs x 3 stack depths x tab switching = 15+ test scenarios. Manual QA checklist for deep link testing |
| i18n re-render performance | Phase 1: Foundation | Locale switch test: switch all 3 locales on a screen with a list + form. No visible flicker, no form state loss, <200ms transition |
| Mock/API contract divergence | Phase 1: Foundation | TypeScript strict mode. All mock services implement typed interfaces. Integration test suite that validates mock response shapes match contract types |
| Font Cyrillic glyph gaps | Phase 1: Design System | Visual test: render the Serbian Cyrillic test string in all font weights. Screenshot comparison across iOS and Android |
| SDK 54 architecture cliff | Phase 1: Foundation | Enable New Architecture in app.json. Run `npx expo-doctor` monthly. Track SDK 55 beta release for early testing |
| FlatList performance on case lists | Phase 3+: Feature Screens | Profile with React DevTools. FlatList/FlashList for all lists. Target: 60fps scroll with 100+ items on mid-range Android |
| Security (unencrypted cache) | Phase 1: Foundation | Use `expo-secure-store` for tokens from day one. Define data classification (public, internal, confidential) to guide storage decisions |
| Form state loss on interruption | Phase 3+: Feature Screens | Auto-save with debounce. Test: start filling form, switch to another app, return. Data must persist |
| Serbian date/number formatting | Phase 1: Foundation | Centralized formatter utilities with unit tests covering all 3 locales. No direct `Intl` calls in components |

## Sources

### Official Documentation (HIGH confidence)
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54) -- breaking changes, deprecation timeline
- [Expo Router: Nesting Navigators](https://docs.expo.dev/router/advanced/nesting-navigators/) -- official nested nav patterns
- [Expo Localization Guide](https://docs.expo.dev/guides/localization/) -- i18n approach, library recommendations
- [Expo Camera Docs](https://docs.expo.dev/versions/latest/sdk/camera/) -- compatibility, limitations, permissions
- [Expo ImagePicker Docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) -- Expo Go compatibility, permission handling
- [Expo FAQ: Expo Go Limitations](https://docs.expo.dev/faq/) -- what works and doesn't work in Expo Go
- [Expo Typed Routes](https://docs.expo.dev/router/reference/typed-routes/) -- type-safe navigation
- [Expo Fonts Guide](https://docs.expo.dev/develop/user-interface/fonts/) -- font loading, platform differences

### GitHub Issues (HIGH confidence -- confirmed bugs)
- [expo/router#910](https://github.com/expo/router/discussions/910) -- nested stacks in tabs problems
- [expo/router#797](https://github.com/expo/router/issues/797) -- links break after tab navigation
- [expo/router#530](https://github.com/expo/router/issues/530) -- stack nesting not respected in tabs
- [expo/router#818](https://github.com/expo/router/issues/818) -- unstable_settings breaks deep linking
- [expo/expo#37028](https://github.com/expo/expo/issues/37028) -- iOS deep linking broken in killed state
- [expo/expo#21544](https://github.com/expo/expo/issues/21544) -- Camera via ImagePicker crashes on Android in Expo Go
- [expo/expo#23404](https://github.com/expo/expo/issues/23404) -- Loss of static typing on Expo Router Stack

### Community Sources (MEDIUM confidence)
- [Expo Go vs Development Builds](https://expo.dev/blog/expo-go-vs-development-builds) -- when to use each
- [Best Practices for Expo Router](https://medium.com/@siddhantshelake/best-practices-for-expo-router-tabs-stacks-shared-screens-b3cacc3e8ebb) -- tabs, stacks, shared screens
- [Expo Blog: Reducing Lag](https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps) -- performance optimization
- [Expo Blog: Best List Component](https://expo.dev/blog/what-is-the-best-react-native-list-component) -- FlatList vs FlashList comparison
- [pdf-viewer-expo](https://github.com/abdelouali/pdf-viewer-expo) -- Expo Go compatible PDF viewer
- [Context API vs Zustand Performance](https://medium.com/@bloodturtle/react-state-management-why-context-api-might-be-causing-performance-issues-and-how-zustand-can-ec7718103a71) -- re-rendering analysis

---
*Pitfalls research for: Law Office Management Mobile App (React Native Expo SDK 54)*
*Researched: 2026-03-10*
