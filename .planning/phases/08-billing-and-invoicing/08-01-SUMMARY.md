---
phase: 08-billing-and-invoicing
plan: 01
subsystem: billing
tags: [invoice, billing, tariff, hourly, flat-fee, pdv, rsd, i18n]

requires:
  - phase: 05-enhanced-case-management-and-voice-notes
    provides: TimeEntry and Expense types, time/expense services for case billing data
provides:
  - Invoice, Payment, BillingMode, InvoiceStatus types and IBillingService interface
  - Mock invoice data with 4 invoices across multiple statuses
  - Invoice list screen with status filtering
  - Invoice creation screen with billing mode calculator (tariff/hourly/flat-fee)
  - Invoice detail screen with line items, totals, payments, status actions
  - billing.json i18n translations in 3 locales (en, sr-Latn, sr-Cyrl)
affects: [08-billing-and-invoicing, 09-reporting]

tech-stack:
  added: []
  patterns: [formatRSD Serbian number formatting helper, billing mode selector card pattern]

key-files:
  created:
    - src/services/mock/data/invoices.ts
    - src/i18n/locales/en/billing.json
    - src/i18n/locales/sr-Latn/billing.json
    - src/i18n/locales/sr-Cyrl/billing.json
    - app/(tabs)/more/billing/_layout.tsx
    - app/(tabs)/more/billing/index.tsx
    - app/(tabs)/more/billing/new.tsx
    - app/(tabs)/more/billing/[id].tsx
  modified:
    - src/services/types.ts
    - src/services/mock/mock-client.ts
    - src/i18n/index.ts
    - app/(tabs)/more/index.tsx
    - app/(tabs)/more/_layout.tsx

key-decisions:
  - "formatRSD helper for Serbian number formatting (dot thousands separator, comma decimal) used across all billing screens"
  - "Payment recording deferred to Plan 02 with placeholder Alert on detail screen"
  - "Invoice number format: INV-YYYY-NNN generated on creation"

patterns-established:
  - "formatRSD: Serbian currency formatting helper for RSD amounts with dot thousands separator"
  - "Billing mode selector: 3 cards with icons for tariff/hourly/flat-fee selection"

duration: 8min
completed: 2026-03-15
---

# Phase 8 Plan 1: Billing Types, Mock Data, and Invoice Screens Summary

**Invoice management with tariff/hourly/flat-fee billing modes, auto-populated line items from case time entries and expenses, PDV calculation, and Serbian RSD formatting**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-15T00:23:58Z
- **Completed:** 2026-03-15T00:31:36Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Complete billing type system with Invoice, Payment, BillingMode, InvoiceStatus types and IBillingService interface
- Invoice creation screen with 3-step flow: case picker, billing mode selector, auto-populated line items with calculated totals including 20% PDV
- Invoice list with status filter chips (draft/sent/paid/overdue/partially-paid) and detail screen with payments, status actions
- Full i18n support with Serbian legal billing terminology across 3 locales

## Task Commits

Each task was committed atomically:

1. **Task 1: Add billing types, mock invoice data, i18n translations, and service implementation** - `4019193` (feat)
2. **Task 2: Build invoice list, creation, and detail screens with billing mode calculator** - `e66d63b` (feat)

## Files Created/Modified
- `src/services/types.ts` - Added BillingMode, InvoiceStatus, Invoice, Payment, InvoiceLineItem types, INVOICE_STATUS_COLORS, IBillingService interface
- `src/services/mock/data/invoices.ts` - Mock invoice data with 4 invoices across different statuses
- `src/services/mock/mock-client.ts` - IBillingService mock implementation with outstanding balance queries
- `src/i18n/locales/en/billing.json` - English billing translations
- `src/i18n/locales/sr-Latn/billing.json` - Serbian Latin billing translations
- `src/i18n/locales/sr-Cyrl/billing.json` - Serbian Cyrillic billing translations
- `src/i18n/index.ts` - Registered billing namespace in i18n resources
- `app/(tabs)/more/billing/_layout.tsx` - Stack layout for billing screens
- `app/(tabs)/more/billing/index.tsx` - Invoice list with status filters and FAB
- `app/(tabs)/more/billing/new.tsx` - Invoice creation with billing mode calculator
- `app/(tabs)/more/billing/[id].tsx` - Invoice detail with line items, totals, payments
- `app/(tabs)/more/index.tsx` - Added billing menu item
- `app/(tabs)/more/_layout.tsx` - Added billing Stack.Screen

## Decisions Made
- formatRSD helper for consistent Serbian number formatting across all billing screens
- Payment recording deferred to Plan 02 with placeholder Alert
- Invoice number format INV-YYYY-NNN with random suffix for uniqueness
- Case note: mock data uses real case/client IDs from existing mock data (cs1/c1, cs2/c4, cs3/c2)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed useServices import path**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** Used kebab-case `use-services` import path but actual file is camelCase `useServices`
- **Fix:** Updated all 3 billing screen imports to `useServices`
- **Files modified:** app/(tabs)/more/billing/index.tsx, new.tsx, [id].tsx
- **Verification:** TypeScript compiles without billing-related errors
- **Committed in:** e66d63b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Import path correction, no scope change.

## Issues Encountered
None beyond the import path auto-fix.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Billing types and service ready for Plan 02 (payment recording, outstanding balance views)
- Invoice data linked to existing case/client mock data for cross-referencing
- All billing screens accessible from More menu

## Self-Check: PASSED

All 13 files verified present. Both task commits (4019193, e66d63b) verified in git log.

---
*Phase: 08-billing-and-invoicing*
*Completed: 2026-03-15*
