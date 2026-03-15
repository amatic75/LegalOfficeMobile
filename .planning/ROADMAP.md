# Roadmap: Legal Office Mobile

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-13)
- 🚧 **v1.1 Enhanced Features** — Phases 5-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-03-13</summary>

- [x] Phase 1: Foundation and App Shell (3/3 plans) — completed 2026-03-11
- [x] Phase 2: Client and Case Management (2/2 plans) — completed 2026-03-11
- [x] Phase 3: Documents and Calendar (2/2 plans) — completed 2026-03-12
- [x] Phase 4: Dashboard, Search, and Notifications (2/2 plans) — completed 2026-03-12

</details>

### 🚧 v1.1 Enhanced Features (In Progress)

**Milestone Goal:** Deepen existing v1.0 screens with case notes, time/expense tracking, document folders, advanced search, notification preferences, client intake, calendar enhancements, billing, voice notes, and reporting dashboards.

- [x] **Phase 5: Enhanced Case Management and Voice Notes** (2/2 plans) — completed 2026-03-14
- [x] **Phase 6: Enhanced Documents, Clients, Calendar, and Mobile** (2/2 plans) — completed 2026-03-14
- [x] **Phase 7: Advanced Search and Notifications** (2/2 plans) — completed 2026-03-14
- [x] **Phase 8: Billing and Invoicing** (2/2 plans) — completed 2026-03-15
- [ ] **Phase 9: Reporting and Analytics** - Financial overview, case management, performance dashboards, visual charts

## Phase Details

### Phase 5: Enhanced Case Management and Voice Notes
**Goal**: Lawyers can capture rich case information including notes, court details, time/expenses, and voice recordings directly from their phone
**Depends on**: Phase 4 (v1.0 case screens exist)
**Requirements**: CASE-01, CASE-02, CASE-03, CASE-04, CASE-05, CASE-06, CASE-07, CASE-08, VOICE-01, VOICE-02, VOICE-03
**Success Criteria** (what must be TRUE):
  1. User can create, edit, and delete text notes on any case, and record/play back voice notes attached to that case
  2. User can view and edit opposing party, court information, and tags on case detail, and select full 3-level case type subtypes
  3. User can log time entries and expenses on a case with all required fields (hours/amount, description, date/category)
  4. User can link related cases and navigate between them from case detail
  5. User can dictate case notes using speech-to-text instead of typing
**Plans:** 2 plans

Plans:
- [x] 05-01-PLAN.md — Types, mock data, i18n, notes CRUD, expanded fields, tags, tree picker
- [x] 05-02-PLAN.md — Billing section, related cases linking, voice recording/playback, dictation

### Phase 6: Enhanced Documents, Clients, Calendar, and Mobile
**Goal**: Lawyers can organize documents into folders, onboard clients through a structured intake workflow, manage recurring calendar events with conflict warnings, and use mobile-optimized scanning and quick actions
**Depends on**: Phase 5 (enhanced case data available for client/document context)
**Requirements**: DOC-01, DOC-02, DOC-03, CLNT-01, CLNT-02, CLNT-03, CLNT-04, CAL-01, CAL-02, CAL-03, MOB-01, MOB-02
**Success Criteria** (what must be TRUE):
  1. User can organize case documents into categorized folders and view document version history and metadata
  2. User can create a new client through a multi-step intake workflow (contact, conflict check, consultation, onboarding) and manage corporate contacts
  3. User can view communication history on a client and manage client-level documents (ID, powers of attorney)
  4. User is warned about scheduling conflicts when creating events, can edit existing events, and can create recurring events
  5. User can scan documents with auto-crop enhancement and use quick-action buttons (call client, navigate to court) from detail screens
**Plans:** 2 plans

Plans:
- [x] 06-01-PLAN.md — Types, mock data, i18n, document folders, metadata, version history, scanning confirmation
- [x] 06-02-PLAN.md — Client intake workflow, communication history, client docs, calendar enhancements, mobile quick actions

### Phase 7: Advanced Search and Notifications
**Goal**: Lawyers can find anything instantly through saved searches and smart filters, and stay on top of deadlines with configurable, actionable notifications
**Depends on**: Phase 6 (all enhanced entities available for searching; notification data enriched)
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05
**Success Criteria** (what must be TRUE):
  1. User can save a search query and re-execute it later from a saved searches list
  2. User can apply quick filters (My Cases, Urgent, New This Week) and combine multiple filter dimensions (date range + type + status + lawyer)
  3. User can view and re-execute recent search history
  4. User can configure notification preferences (quiet hours, per-event type), snooze notifications, and take quick actions (mark complete, reschedule) from the notification screen
  5. User can see escalation urgency indicators on deadline notifications and browse full notification history with read/unread state
**Plans:** 2 plans

Plans:
- [x] 07-01-PLAN.md — Advanced search with saved searches, quick filters, history, and multi-dimensional filtering
- [x] 07-02-PLAN.md — Enhanced notifications with preferences, snooze, quick actions, escalation, and history browsing

### Phase 8: Billing and Invoicing
**Goal**: Lawyers can generate invoices from tracked time and expenses, record payments, and monitor outstanding balances
**Depends on**: Phase 5 (time entries and expenses from CASE-06/CASE-07 provide billing data)
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04
**Success Criteria** (what must be TRUE):
  1. User can generate an invoice for a case that pulls in logged time entries and expenses
  2. User can record payments against invoices and see the remaining balance update
  3. User can view outstanding balances aggregated per client and per case
  4. User can calculate fees using different billing modes (tariff-based, hourly rate, flat fee)
**Plans:** 2 plans

Plans:
- [x] 08-01-PLAN.md — Billing types, mock data, i18n, invoice list, creation with fee calculator, and detail screens
- [x] 08-02-PLAN.md — Payment recording modal on invoice detail and outstanding balances screen

### Phase 9: Reporting and Analytics
**Goal**: Lawyers can view visual dashboards summarizing their financial performance, case workload, and productivity metrics
**Depends on**: Phase 8 (billing and invoice data feeds financial reports)
**Requirements**: RPT-01, RPT-02, RPT-03, RPT-04
**Success Criteria** (what must be TRUE):
  1. User can view a financial overview dashboard showing revenue, outstanding invoices, and top clients
  2. User can view a case management dashboard with active case counts, status breakdown, and upcoming deadlines
  3. User can view a performance dashboard with case closure rate and workload distribution
  4. User can see visual charts (bar, pie, line) for key metrics across all dashboards
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 5 > 6 > 7 > 8 > 9

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
| 9. Reporting and Analytics | v1.1 | 0/1 | Not started | - |
