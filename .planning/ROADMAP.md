# Roadmap: Legal Office Mobile

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-13) · [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Enhanced Features** — Phases 5-9 (shipped 2026-03-15) · [archive](milestones/v1.1-ROADMAP.md)
- 🚧 **v1.2 Client Depth & Directory** — Phases 10-? (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-03-13</summary>

- [x] Phase 1: Foundation and App Shell (3/3 plans) — completed 2026-03-11
- [x] Phase 2: Client and Case Management (2/2 plans) — completed 2026-03-11
- [x] Phase 3: Documents and Calendar (2/2 plans) — completed 2026-03-12
- [x] Phase 4: Dashboard, Search, and Notifications (2/2 plans) — completed 2026-03-12

See `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

<details>
<summary>✅ v1.1 Enhanced Features (Phases 5-9) — SHIPPED 2026-03-15</summary>

- [x] Phase 5: Enhanced Case Management and Voice Notes (2/2 plans) — completed 2026-03-14
- [x] Phase 6: Enhanced Documents, Clients, Calendar, and Mobile (2/2 plans) — completed 2026-03-14
- [x] Phase 7: Advanced Search and Notifications (2/2 plans) — completed 2026-03-14
- [x] Phase 8: Billing and Invoicing (2/2 plans) — completed 2026-03-15
- [x] Phase 9: Reporting and Analytics (2/2 plans) — completed 2026-03-15

See `.planning/milestones/v1.1-ROADMAP.md` for full details.

</details>

### 🚧 v1.2 Client Depth & Directory (In Progress)

**Milestone Goal:** Deepen the client detail page with file uploads, aggregated activity timelines across all cases, and expense/outstanding rollups — plus introduce a unified directory for lawyers, judges, and courts under the More tab.

- [x] Phase 10: Client Detail Depth (2/2 plans) — completed 2026-04-11
- [x] Phase 11: Directory Management (2/2 plans) — completed 2026-04-11

## Phase Details

### Phase 10: Client Detail Depth

**Goal**: Lawyers get a true client-centric view on the client detail page — uploading client-level documents, browsing recent and upcoming activity aggregated across every case linked to that client, and seeing all expenses plus outstanding balances rolled up in one place
**Depends on**: Phase 9 (v1.1 shipped — reuses SECTION_CARD, EditableInfoRow, formatRSD, mockBillingService.getOutstandingByClient, case/document/event/time-entry services)
**Requirements**: CLNT-05, CLNT-06, CLNT-07, CLNT-08, CLNT-09
**Success Criteria** (what must be TRUE):
  1. User can upload client-level documents (ID, power of attorney, engagement letter) from the client detail page via file picker or camera, with parity to the case-level document upload flow
  2. User can view a "Recent activity" list on the client detail page that chronologically merges notes, events, documents, time entries, payments, and status changes from every case linked to the client, newest first, with a "See all" link
  3. User can view an "Upcoming activity" list on the client detail page that chronologically merges future hearings, deadlines, meetings, and events from every case linked to the client, soonest first, with a "See all" link
  4. User can view an "Expenses" section on the client detail page that lists every time entry and expense from every linked case, showing case name, date, and formatted RSD amount
  5. User can view an "Unpaid / Outstanding" summary card on the client detail page that rolls up outstanding invoice balance across all the client's cases and drills down into per-invoice detail
**Plans:** 2 plans

Plans:
- [x] 10-01: Service aggregation + i18n + document upload upgrade (file picker + camera capture) — completed 2026-04-11
- [x] 10-02: Recent/Upcoming Activity sections with See All, Expenses grouped by case, Outstanding rollup with drill-down — completed 2026-04-11

### Phase 11: Directory Management

**Goal**: Lawyers have a single unified directory under the More tab for the external and internal people and institutions the office interacts with — lawyers (including opposing counsel), judges, and courts — with full CRUD and search on each
**Depends on**: Phase 10 (v1.2 cohesion; independent feature slice — safe to run after Phase 10)
**Requirements**: DIR-01, DIR-02, DIR-03, DIR-04
**Success Criteria** (what must be TRUE):
  1. User can open a single "Directory" entry under the More tab and switch between Lawyers, Judges, and Courts using a 3-tab top-tab navigator consistent with other More screens
  2. User can browse, search, add, edit, and delete lawyers with fields for display name, firm, bar number, phone, email, specialty, notes, and an internal-vs-external flag
  3. User can browse, search, add, edit, and delete judges with fields for display name, court, chamber, phone, and notes
  4. User can browse, search, add, edit, and delete courts with fields for name, address, city, jurisdiction, phone, website, and notes
**Plans:** 2 plans

Plans:
- [x] 11-01: Types, mock services, i18n, Directory route under More with 3-tab navigator, list + search views for Lawyers/Judges/Courts — completed 2026-04-11
- [x] 11-02: Add/edit/delete CRUD forms for Lawyers/Judges/Courts and wiring into the More tab — completed 2026-04-11

## Progress

**Execution Order:**
Phases execute in numeric order. v1.2 phases continue from 10.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation and App Shell | v1.0 | 3/3 | Complete | 2026-03-11 |
| 2. Client and Case Management | v1.0 | 2/2 | Complete | 2026-03-11 |
| 3. Documents and Calendar | v1.0 | 2/2 | Complete | 2026-03-12 |
| 4. Dashboard, Search, and Notifications | v1.0 | 2/2 | Complete | 2026-03-12 |
| 5. Enhanced Case Management and Voice Notes | v1.1 | 2/2 | Complete | 2026-03-14 |
| 6. Enhanced Documents, Clients, Calendar, and Mobile | v1.1 | 2/2 | Complete | 2026-03-14 |
| 7. Advanced Search and Notifications | v1.1 | 2/2 | Complete | 2026-03-14 |
| 8. Billing and Invoicing | v1.1 | 2/2 | Complete | 2026-03-15 |
| 9. Reporting and Analytics | v1.1 | 2/2 | Complete | 2026-03-15 |
| 10. Client Detail Depth | v1.2 | 2/2 | Complete | 2026-04-11 |
| 11. Directory Management | v1.2 | 2/2 | Complete | 2026-04-11 |
