# Legal Office Application - Finalized Specification

**Project:** Law Office Management Application for Serbia
**Version:** 1.0 (Finalized)
**Stack:** .NET 10/C# + PostgreSQL + React + React Native (Expo)
**Architecture:** Modular Monolith
**Hosting:** Azure (Production) + Free/Low-Cost Option (Development)

---

## PROJECT CONTEXT

| Parameter | Decision |
|-----------|----------|
| Budget | Minimal |
| Timeline | Flexible, quality-driven |
| Team | 4 developers + AI assistants |
| Target Market | Serbia initially, expansion later. Small offices and enterprise. |
| Competition | No known direct competition |
| USP | Fast search & case data on mobile, AI document processing |
| Pricing Model | Subscription (other models TBD) |
| Support | Required (model TBD) |
| Customization | TBD |
| Bar Association | TBD |

---

## 1. USER ROLES & AUTHENTICATION

### User Hierarchy

- **Superadmin** - Managed by software vendor. Created during initial setup with highest privileges.
- **Admin** - Full system access within their law office
- **Lawyer** - Manage own cases, clients, billing
- **Trainee / Junior Lawyer** - Limited case access, no billing
- **Paralegal** - Research, no court appearances
- **Accountant/Billing Specialist** - Financial modules only
- **Administrative Staff** - Scheduling, basic data entry

**Architecture:** Single-tenant per installation. Each law office is an independent installation.

### [LATER] Permission Matrix

Each role needs explicit Create/Read/Update/Delete mapping per feature:

```
| Feature              | Admin | Lawyer | Trainee | Accountant | Client |
|---------------------|-------|--------|---------|------------|--------|
| Create case         | yes   | yes    | no      | no         | no     |
| View all finances   | yes   | no     | no      | yes        | no     |
| Close case          | yes   | yes    | no      | no         | no     |
| Delete documents    | yes   | yes    | no      | no         | no     |
| Generate invoices   | yes   | yes    | no      | yes        | no     |
...full matrix to be defined
```

### Authentication Requirements

- Password policies (complexity, rotation)
- Failed login attempt handling (5 attempts = 15 min lockout)
- Password recovery process
- Two-factor authentication (mandatory for all users)
- Single Sign-On requirements TBD

---

## 2. INPUT METHODS

### Document Upload Specifications

```
- Maximum single file size: 100 MB
- Supported formats:
  * Documents: PDF, DOC, DOCX, ODT, RTF, TXT
  * Images: JPG, PNG, TIFF (for scanned documents)
  * Archives: ZIP (for bundled documents)
- Storage quota per office: Tiered (50GB/100GB/500GB/Unlimited)
- Large file handling: Compress PDFs automatically if >10MB
```

### Email-to-Case Integration

```
- Each case gets unique email address (case-12345@lawoffice.com)
- Forward emails to case automatically
- Parse email attachments and add to case documents
- Track email threads in communication log
```

### Drag-and-Drop Interface

- Browser-based drag-and-drop for documents
- Desktop folder monitoring (optional) - auto-upload from watched folder

### Case Entry

- New and existing cases via web interface
- Text parsing from scanned documents (OCR)
- Text parsing from PDF and Word files
- Handwritten document recognition (P3 - low accuracy 60-80%, requires human verification)

### Voice Notes (P3)

- Store voice notes as audio recordings first, transcription second
- Train/fine-tune models on Serbian legal vocabulary
- Always store original audio for reference

---

## 3. OUTPUT & DOCUMENT GENERATION

### Document Templates

- Document generation from templates based on case data
- Document templates with variables - auto-populate client/case data

### [LATER] Template System Details

```
Template Structure:
- Template Library with categories (Contracts, Court Filings, Letters, etc.)
- Role-based template access
- Template inheritance (base template + case-type specific)
- Preview before generation
- Variable syntax: {{entity.field}} with fallback values
- Conditional blocks: {{#if case.type == "criminal"}}...{{/if}}
- Serbian date format: DD.MM.YYYY (default)
- Number formatting: 1.234,56 (Serbian locale)
```

### [ON HOLD] E-Signature Integration (Serbia)

```
Supported providers:
1. Halcom CA (most common in Serbia)
2. PostSignum
3. mSign (mobile certificates)

Features:
- Sign single document
- Batch signing queue
- Signature validation and timestamp
- Store signed PDF + original separately
- Remote signing via SMS OTP (qualified e-signature)
- Compliance with Serbian Law on Electronic Document and Regulation (EU) No 910/2014 (eIDAS)
```

### [LATER] Document Assembly

```
- Merge documents into single PDF
- Add bookmarks automatically
- Generate table of contents
- Watermark options: DRAFT, CONFIDENTIAL, INTERNAL
- Redaction tools for sensitive information
```

---

## 4. CASE TYPE DEFINITIONS

### Expanded Case Type Taxonomy

```
Civil:
+-- Litigation
|   +-- Contract disputes
|   +-- Property disputes
|   +-- Inheritance disputes
|   +-- Labor disputes
|   +-- Tort/Personal injury
+-- Non-litigation
|   +-- Contract drafting
|   +-- Legal opinions
|   +-- Mediation/Arbitration
+-- Bankruptcy
|   +-- Personal bankruptcy
|   +-- Corporate bankruptcy
+-- Enforcement
|   +-- Debt collection
|   +-- Foreclosure
+-- Misdemeanor
+-- Administrative
    +-- Tax disputes
    +-- Building permits
    +-- License applications

Criminal:
+-- Investigations
+-- Indictments
+-- Appeals
+-- Post-conviction (probation, parole)

Family Law:
+-- Divorce
+-- Child custody
+-- Alimony
+-- Adoption

Corporate/Commercial:
+-- Company formation
+-- M&A
+-- Commercial contracts
+-- Intellectual property
```

### Case Type Templates

```
Each case type should have:
- Default workflow stages
- Required documents checklist
- Custom fields (e.g., Criminal case = Charges, Bail amount)
- Standard deadlines
- Suggested fee structure
- Template documents pre-loaded

Example - Divorce Case Template:
Stages: Consultation > Filing > Discovery > Settlement Negotiations > Trial > Decree
Required docs: Marriage certificate, Financial statements, Property list
Custom fields: Marriage date, Spouse info, Children (Y/N), Contested (Y/N)
Deadlines: 30-day response period, 90-day discovery
```

---

## 5. CASE MANAGEMENT

### Case Status Workflow

New > Active > Pending > Closed > Archived

### Customizable Workflows

```
- Allow custom stages per case type
- Drag-and-drop workflow designer (Admin only)
- Automated stage transitions (e.g., when invoice paid -> move to Active)
- Stage-specific required fields
- Stage-based permissions (Junior can't move to Closed)
```

### Case Core Fields

- Case number (auto-generated)
- Title and description
- Case type and subtype
- Client information
- Opposing party information and their legal representation
- Court information (court name, case number, judge)
- Primary lawyer assignment
- Financial details (estimated value, billing type, rates)
- Tags and custom fields

### Conflict of Interest Checking

- Automatic flagging when new cases involve parties from existing cases

### Case Linking

- Related cases should be linkable (appeals, related disputes)

### Time Tracking

- Billable hours per lawyer per case

### Expense Tracking

- Court fees, travel, expert witnesses

### Search & Filtering

```
Global Search:
- Search across: Case numbers, Client names, Opposing parties, Document content
- Filters: Case type, Status, Date range, Assigned lawyer, Court, Tag
- Saved searches (My Active Cases, Overdue Deadlines, etc.)
- Boolean operators (AND, OR, NOT)
- Full-text search in documents (requires OCR for scanned docs)
- Search history

Quick Filters (one-click):
- My Cases
- Team Cases
- Urgent (deadlines within 7 days)
- Awaiting Payment
- New This Week
```

### [LATER] Advanced Task Management

```
- Create tasks within cases
- Assign to specific user(s) or role
- Task priority (Critical/High/Medium/Low)
- Due dates with reminders
- Task dependencies (Task B can't start until Task A done)
- Subtasks/checklists
- Task templates for case types
- Recurring tasks (monthly status report)
- Task comments thread
- Time logging per task
```

### [LATER] Case Collaboration

```
- Primary lawyer + secondary lawyers
- Case team with defined roles
- Internal notes (team-only) vs External notes (client-visible)
- @mentions for team communication
- Activity feed per case (who did what, when)
- Case handover workflow (when lawyer leaves)
```

### [LATER] Case Relationships

```
- Link related cases (parent/child for appeals)
- Link similar cases (precedent reference)
- Conflict check on linked parties
- Visual relationship map
```

### [LATER] Case Templates & Cloning

```
- Save case as template
- Create new case from template (pre-fills structure, tasks, documents)
- Clone existing case for similar matter
```

---

## 6. DOCUMENT MANAGEMENT

### Document Input

- Import in electronic format
- Import in scanned format

### Document Organization

```
Default folder structure per case:
  Case #12345
  +-- Pleadings & Motions
  +-- Evidence
  +-- Correspondence (Client, Court, Opposing)
  +-- Research & Notes
  +-- Contracts & Agreements
  +-- Court Orders & Decisions
  +-- Invoices & Billing
  +-- Working Drafts

- Allow custom folders
- Documents can be in multiple folders (tags, not physical copies)
```

### Document Metadata & Tagging

```
- Document type (automatic categorization)
- Date received/created
- Author (external) vs Uploaded by (internal user)
- Tags (multi-select: Urgent, Confidential, For-Review, etc.)
- Custom metadata fields per case type
- Document description field
```

### Version Control

```
- Automatic versioning on every edit/upload
- Version comparison (visual diff for Word/PDF)
- Revert to previous version
- Version notes (what changed)
- Major vs minor versions (1.0, 1.1, 2.0)
- Lock document while editing (check-out/check-in)
```

### Document Lifecycle

```
Active > Archived > Destroyed

Retention policy:
- Active cases: No limit
- Closed cases: 10 years (default, configurable)
- After retention period: Move to "Destruction Queue"
- Admin approval required for actual deletion
- Audit log of all deletions (GDPR compliance)
```

### Document Intelligence

```
- Automatic deadline extraction from court documents
- Party name extraction
- Amount/value extraction from invoices, contracts
- Flag missing signatures
- Duplicate document detection
```

### Court Filing Receipts

- Store proof of submission

### Access

- From desktop and mobile devices

---

## 7. CASE NOTES

- Voice-controlled note creation
- Keyboard-based note creation

---

## 8. NOTIFICATIONS & REMINDERS

### Notification Types

- Hearings / Trials
- Preclusive legal deadlines (non-extendable): Lawsuits, Appeals, Initial enforcement motions, Enforcement acts, Bankruptcy acts
- Client meetings
- Statute of limitations warnings
- Payment reminders (outstanding client invoices)
- Court schedule changes
- Document expiration (powers of attorney, contracts)
- Recurring tasks (annual filings, license renewals)
- Automated email notifications to clients

### Notification Delivery Matrix

```
| Event Type              | In-App | Email | SMS | Push (Mobile) |
|------------------------|--------|-------|-----|---------------|
| Deadline (7 days)      | yes    | yes   | no  | yes           |
| Deadline (24 hours)    | yes    | yes   | yes | yes           |
| Deadline (1 hour)      | yes    | yes   | yes | yes           |
| New case assigned      | yes    | yes   | no  | yes           |
| Document uploaded      | yes    | no*   | no  | no            |
| Task assigned          | yes    | yes   | no  | yes           |
| Payment received       | yes    | yes   | no  | no            |
| Court date change      | yes    | yes   | yes | yes           |

*Daily digest option for low-priority events
```

### Escalation System

```
Deadline escalation:
- 7 days before: Notify assigned lawyer
- 3 days before: Notify lawyer + send email
- 1 day before: Notify lawyer + supervisor + SMS
- Day of: Urgent alert + mark case at risk

Missed deadline:
- Automatic flag on case
- Admin notification
- Require explanation in system (audit trail)
```

### User Notification Preferences

```
Per user settings:
- Email digest: Real-time / Hourly / Daily / Weekly
- SMS: Critical only / All / None
- Quiet hours: No notifications between 22:00-08:00
- Weekend notifications: On/Off
- Per-event customization
```

### Intelligent Reminders

```
- Recurring reminders (nag every day until dismissed)
- Snooze option (remind me in X hours/days)
- Quick actions from notification (Mark complete, Reschedule)
- Notification history (see past alerts)
```

---

## 9. SMART DOCUMENT PROCESSING

- Search
- Extraction of key information
- Intelligent data processing and recommendations
- Task assignment

---

## 10. CLIENT MANAGEMENT

### Client Intake Workflow

```
1. Initial Contact (form submission or manual entry)
2. Conflict of Interest Check (automatic)
3. Consultation Scheduling
4. Client Onboarding
   - Collect ID documents
   - KYC/AML check (if required by bar association)
   - Engagement letter generation and signature
   - Power of attorney (if needed)
   - Fee agreement
5. Case Creation
```

### Client Profiles

- Contact history
- Communication log (calls, emails, meetings)
- Client documents (ID, contracts, powers of attorney)
- Automated client updates via email/SMS

### Client Relationships

```
Client types:
- Individual
- Couple (joint clients)
- Family
- Business/Corporate (with multiple contacts)

For corporate clients:
- Primary contact + alternate contacts
- Company details (from APR integration)
- Parent/subsidiary relationships
```

### [LATER] Client Portal Features

```
Client can:
- View case status and timeline
- See upcoming hearings/deadlines
- Upload documents securely
- View and pay invoices
- Send secure messages to lawyer
- Download documents (lawyer-approved only)
- E-sign documents
- View billing history

Client cannot:
- See internal notes
- See working drafts
- Edit anything
- See other clients' cases (data isolation)
```

### [LATER] Client Communication Hub

```
All client interactions in one place:
- Email threads
- Phone call logs (manual entry or integration)
- Meeting notes
- Portal messages
- SMS history (if sent)
- Letters sent/received

Communication templates:
- Status update email
- Payment reminder
- Appointment confirmation
- Case outcome notification
```

---

## 11. EXTENSION TO OTHER LEGAL ENTITIES

- Insurance companies
- Banks

---

## 12. LEGAL FEE CALCULATION

### Fee Calculator

- Based on performed actions
- Cost statement generation
- Integration with the Bar Association for tariff retrieval
- Criminal cases may be billed outside the standard tariff

### Billing Modes

- Tariff-based (bar association)
- Hourly rate
- Flat fee
- Contingency (where legal)
- Hybrid

---

## 13. FINANCIAL MODULE

- Invoice generation and tracking
- Payment recording
- Outstanding balance reports
- Trust account management (client funds)
- Integration with accounting software
- Tax reporting (PDV/VAT)
- Expense reimbursement tracking

---

## 14. REPORTING & ANALYTICS

### Standard Reports

```
Financial:
- Revenue by period (day/week/month/year)
- Revenue by lawyer
- Revenue by case type
- Outstanding receivables (aging report)
- Trust account balance
- Expense report
- Profit & loss

Operational:
- Case load by lawyer
- Case duration (average time to close)
- Deadline compliance rate (% met on time)
- Document count by case
- New cases vs closed cases trend

Performance:
- Win/loss rate (overall and by lawyer)
- Case outcome by type
- Client acquisition source
- Client retention rate
- Average case value
```

### Report Features

```
- Date range selector
- Filter by lawyer, case type, status
- Drill-down (click to see details)
- Export: PDF, Excel, CSV
- Schedule reports (email monthly to Admin)
- Dashboard with key metrics (real-time)
- Visual charts (bar, pie, line graphs)
```

### Custom Report Builder

```
Admin/Advanced users can:
- Select data fields (case number, client, revenue, etc.)
- Apply filters
- Group by (case type, lawyer, etc.)
- Sort and aggregate (sum, average, count)
- Save custom reports
- Share reports with team
```

### Analytics Dashboards

```
Dashboard 1: Financial Overview
- Today's revenue
- Month-to-date revenue vs goal
- Outstanding invoices
- Top 5 clients by revenue

Dashboard 2: Case Management
- Active cases count
- Cases by status (pie chart)
- Upcoming deadlines (next 7 days)
- Overdue tasks

Dashboard 3: Performance
- Case closure rate
- Win rate trend
- Average time to close
- Workload distribution (cases per lawyer)
```

---

## 15. CALENDAR & SCHEDULING

- Court hearing calendar
- Meeting scheduling
- Room/resource booking
- Calendar sync (Google, Outlook, iCal)
- Multi-lawyer availability view
- Conflict detection (double-booking prevention)

### [LATER] Scheduling Features

```
- Appointment booking link (for client self-scheduling)
- Buffer time between appointments (15 min)
- Availability presets (Working hours, Consultation hours)
- Out-of-office status (auto-decline meetings, auto-responder)
- Meeting types: In-person, Phone, Video call
- Video call integration (Zoom, Teams, Google Meet)
```

---

## 16. MOBILE ACCESS

### Strategy: React Native with Expo (iOS + Android)

**Key Focus:** Fast input and fast search - this is the application's USP.

### Offline Capabilities

```
When offline, user can:
- View recently accessed cases (cached)
- View downloaded documents
- Record voice notes (sync when online)
- Take photos of documents
- Create case notes (sync when online)
- View calendar (read-only)

When offline, user cannot:
- Create new cases
- Edit case data
- Upload documents
- Send messages
```

### Mobile-Specific Features

```
- Document scanning with phone camera (auto crop, enhance)
- Barcode/QR code scanning (for court filing receipts)
- Voice recording (integrated with voice notes)
- GPS location tagging (confirm attendance at court)
- Dictation for case notes
- Quick actions (call client, navigate to court)
- Push notifications for deadlines
- Quick case lookup
```

---

## 17. EXTERNAL INTEGRATIONS

### Priority 1 - High Value

**APR (Business Registers Agency)**
- Has official API available
- Company/entity lookup

**Courts**
- Case lookup
- eSud integration possibilities

### Priority 2 - Medium Value

**eSud Integration**

```
eSud (Electronic Court System):
- Check case status
- Receive notifications of court decisions
- Electronic filing (if supported)
- Download court documents
- Automatic deadline extraction from court decisions

Technical:
- Requires authentication (qualified e-certificate)
- SOAP or REST API (research current implementation)
- Polling frequency: Daily or webhook-based?
```

**Official Gazette**
- Check for electronic integration
- Law change notifications

**Cadastre**
- Property case support

### Priority 3 - Lower Value

**Parliament**
- Legislative tracking (nice to have)

**Legal databases (license-based)**
- Lex Paragraf
- Engineering / regulatory databases

### Email Integration

```
- Connect Office 365 / Gmail account
- Send emails from within application
- Log all case-related emails automatically
- Email templates
- Track email open/read (if GDPR-compliant)
```

### [LATER] Communication Tools

```
- VoIP integration (Viber Business, WhatsApp Business API)
- Call logging (automatic or manual)
- SMS gateway (for client notifications)
- Click-to-call from client profile
```

### Web Scraping Policy

- Prioritize official APIs over scraping
- Scraping as fallback only, may violate terms of service

---

## 18. DATA SECURITY & COMPLIANCE

### Core Requirements

- GDPR compliance (Serbian Law on Personal Data Protection)
- Attorney-client privilege protection
- Audit logging - all actions tracked
- Data retention policies
- Backup and disaster recovery plan
- Encryption (at rest and in transit)
- Two-factor authentication
- Role-based access control (RBAC)
- Session management and timeout policies

### Encryption Standards

```
Data at rest:
- AES-256 encryption for database
- Encrypted file storage
- Key management: Hardware Security Module (HSM) or managed service

Data in transit:
- TLS 1.3 minimum
- HTTPS enforced (HSTS headers)
- Certificate pinning on mobile

Application level:
- Sensitive fields (ID numbers, bank accounts) encrypted separately
- Encryption key rotation policy (annually)
```

### Backup & Disaster Recovery

```
Backup strategy:
- Database backup: Every 6 hours
- Document storage: Real-time replication
- Retention: 30 daily, 12 monthly, 7 yearly backups
- Geographic redundancy: Primary (Serbia) + Secondary (EU region)
- Encryption: All backups encrypted

Recovery:
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 6 hours max data loss
- Quarterly DR test (restore from backup to test environment)
```

### Incident Response

```
Data breach procedure:
1. Detect and contain (isolate affected systems)
2. Assess scope (what data? how many clients?)
3. Notify SBPD (Serbian data protection authority) within 72h
4. Notify affected clients
5. Remediate vulnerability
6. Post-incident review

Incident response team:
- Security lead
- Legal counsel
- System administrator
- Communications officer

Annual tabletop exercises
```

### Access Control

```
- Principle of least privilege
- Role-based access control (RBAC)
- Mandatory 2FA for all users (SMS or authenticator app)
- IP whitelisting option (for office networks)
- Failed login lockout (5 attempts = 15 min lockout)
- Session management:
  - Session timeout: 30 min inactivity
  - Absolute session timeout: 8 hours
  - Force re-authentication for sensitive actions (delete case, export data)
```

### Audit Logging

```
Log all:
- User authentication (login/logout, failed attempts)
- Case access (who viewed what, when)
- Document downloads
- Data modifications (who changed what, before/after values)
- Permission changes
- Exports/reports generated
- Configuration changes

Log retention: 7 years (legal requirement)
Log integrity: Append-only, tamper-evident
Log review: Admin dashboard for suspicious activity
```

### [LATER] Compliance Requirements

```
Serbian specific:
- Law on Personal Data Protection (compliance with GDPR)
- Bar Association ethical rules for data handling
- Law on Electronic Document (for e-signatures)
- eRacun compliance (B2B e-invoicing)
- Data residency: Prefer Serbian/EU data centers

Certifications to pursue:
- ISO 27001 (Information Security Management)
- ISO 27017 (Cloud Security)
- SOC 2 Type II (if offering SaaS)

Regular audits:
- Annual penetration testing
- Quarterly vulnerability scans
- Annual compliance audit
```

---

## 19. DATA MIGRATION

### Data Migration Strategy

```
Import from:
- Excel spreadsheets (common for small offices)
- Existing law office software (if any)
- Email archives (PST, MBOX files)
- File system (PDF/Word documents)

Migration wizard:
1. Data mapping (map old fields to new fields)
2. Data validation (check for errors, duplicates)
3. Dry run (preview import)
4. Actual import
5. Verification (confirm data integrity)
6. Rollback option (if import fails)

Migration services:
- Self-service import (for small offices)
- Assisted migration (vendor support for large offices)
- Custom migration (for complex data sources)
```

---

## 20. INTERNATIONALIZATION

### Localization Support

```
Initial: Serbian only
- Serbian Cyrillic and Latin scripts
- Serbian legal terminology
- Serbian date/number formats

Future: Regional expansion
- Bosnian/Croatian (similar legal systems)
- English (for international clients)

Technical:
- i18n framework
- Translatable strings (no hardcoded text)
- Currency conversion
- Time zone support
```

---

## 21. API & EXTENSIBILITY

### Public API

```
RESTful API for:
- Creating/updating cases
- Uploading documents
- Querying case status
- Webhooks (notify external systems of events)

Use cases:
- Custom integrations (law office's existing tools)
- Third-party app marketplace
- Mobile app development (external developers)

API access:
- API keys with rate limiting
- OAuth 2.0 for user-level access
- Comprehensive API documentation
- Sandbox environment for testing
```

---

## 22. PERFORMANCE REQUIREMENTS

```
Response times:
- Page load: < 2 seconds (desktop), < 3 seconds (mobile)
- Search: < 1 second for up to 10,000 cases
- Document upload: 10 MB/second minimum
- Report generation: < 5 seconds for standard reports

Availability:
- Uptime SLA: 99.9% (allows ~43 min downtime/month)
- Planned maintenance: Monthly, outside business hours

Scalability:
- Support up to 100,000 cases per law office
- Support up to 500 concurrent users (large office)
- Document storage: Unlimited (with tiered pricing)
```

---

## 23. TESTING STRATEGY

```
Testing types:
- Unit tests (80%+ code coverage)
- Integration tests (API, database)
- End-to-end tests (user workflows)
- Security testing (OWASP Top 10)
- Performance testing (load testing)
- Usability testing (with real lawyers)
- Accessibility testing (WCAG compliance)

Testing environments:
- Development (for developers)
- Staging (mirrors production, for final testing)
- Production (live system)

Beta testing:
- Closed beta (5-10 law offices, 3 months)
- Open beta (wider release, 2 months)
- Feedback collection and iteration
```

---

## 24. [LATER] ITEMS SUMMARY

Items deferred to later phases:

| Item | Section | Notes |
|------|---------|-------|
| Permission Matrix | Users | Full CRUD mapping per role |
| Template System | Output | Variable syntax, conditional logic |
| Document Assembly | Output | PDF merging, watermarks |
| Advanced Task Management | Cases | Dependencies, subtasks, recurring |
| Case Collaboration | Cases | Team roles, @mentions, handover |
| Case Relationships | Cases | Parent/child, precedent links |
| Case Templates & Cloning | Cases | Save/clone case patterns |
| Client Portal | Clients | Self-service for clients |
| Client Communication Hub | Clients | Unified communication view |
| Scheduling Features | Calendar | Self-booking, video calls |
| Communication Tools | Integrations | VoIP, SMS gateway |
| Compliance Requirements | Security | ISO certs, audits |
| Training & Onboarding | Support | Videos, docs, webinars |
| Pricing Strategy | Business | Subscription tiers, pricing |
| Accessibility Standards | UX | WCAG 2.1 Level AA |

---

## 25. DECISIONS LOG

| # | Decision | Choice | Notes |
|---|----------|--------|-------|
| 1 | Hosting Model | Azure + Free Dev | Azure production + free/low-cost development (Docker Compose locally, Railway/Render for shared dev/staging) |
| 2 | Backend | .NET 10/C# | Modular monolith |
| 3 | Database | PostgreSQL | Open source |
| 4 | Web Frontend | React + TypeScript | Confirmed |
| 5 | Mobile | React Native (Expo) | Single codebase for iOS + Android, Expo Go for development, shared TypeScript types with web |
| 6 | eSud Priority | P2 | Complex but valuable |
| 7 | Social Network | Removed | Scope creep, no value |

---

## 26. PRIORITY MATRIX

| Priority | Feature | Reason | Effort | Value |
|----------|---------|--------|--------|-------|
| **P0** | User authentication & RBAC | Foundation | M | H |
| **P0** | Case management core | Foundation | H | H |
| **P0** | Document storage & versioning | Daily use | M | H |
| **P0** | Deadline notifications | Malpractice prevention | M | H |
| **P0** | Data security & compliance | Legal requirement | H | H |
| **P0** | Client management basic | Core workflow | M | H |
| **P0** | Search & filtering | Usability (USP) | M | H |
| **P1** | Billing/invoicing | Revenue driver | H | H |
| **P1** | Calendar & scheduling | Daily use | M | H |
| **P1** | Task management | Productivity | M | M |
| **P1** | Document templates | Time saver | M | H |
| **P1** | Email integration | Reduces manual work | M | H |
| **P1** | APR integration | Frequent use | L | H |
| **P1** | Mobile access (React Native) | USP - fast input/search | M | H |
| **P1** | Client portal | Client satisfaction | M | M |
| **P2** | Court / eSud integration | Complex but valuable | H | H |
| **P2** | Reporting & analytics | Business insights | M | M |
| **P2** | E-signature integration | Serbian legal compliance | M | H |
| **P2** | Advanced OCR (printed) | Efficiency | M | M |
| **P2** | Time tracking | Hourly billing support | L | M |
| **P2** | Trust account management | Required for some offices | M | M |
| **P3** | Voice notes | Nice to have | L | L |
| **P3** | Handwritten OCR | Low accuracy, high effort | H | L |
| **P3** | Parliament integration | Rarely needed | M | L |
| **P3** | Official Gazette | Low frequency | L | L |
| **P3** | Cadastre integration | Niche use case | M | L |

**Effort:** L = Low (weeks), M = Medium (1-2 months), H = High (3+ months)
**Value:** L = Low, M = Medium, H = High

---

## 27. MVP SCOPE

**Goal:** Launch functional product, quality over speed

**Include (P0 features):**
- User management & authentication (with 2FA)
- Case CRUD with basic workflow (New > Active > Closed)
- Document upload, storage, versioning (no OCR yet)
- Client management basic (profile, contact info, cases)
- Deadline management and email notifications
- Basic search (case number, client name, status)
- Security: HTTPS, encryption, audit logs, RBAC
- Basic reporting (case list, deadlines)

**Exclude from MVP:**
- OCR (any kind)
- Voice notes
- Advanced analytics
- External integrations (add in v1.1)
- Mobile app (responsive web is enough for MVP)
- Client portal (add in v1.1)
- E-signatures
- Document assembly

**Post-MVP Roadmap:**
- v1.1: Billing, APR integration, email integration, client portal
- v1.2: React Native mobile app (iOS + Android via Expo), document templates
- v1.3: eSud integration, e-signatures, advanced reporting
- v2.0: AI features, advanced OCR, time tracking

---

## 28. LAUNCH PLAN

```
Phase 1: MVP
- P0 features only
- Limited beta (5 law offices)
- Collect feedback

Phase 2: Beta Release
- P0 + P1 features
- Expand to 50 law offices
- Refine based on feedback

Phase 3: General Availability
- Public launch
- Marketing campaign (Bar Association partnership, legal conferences)
- Onboarding support team

Post-launch:
- Monthly feature releases
- Quarterly major updates
- Annual roadmap review
```

---

## 29. RISK ASSESSMENT

### High Risks

1. **eSud integration complexity** - Courts may not have good API/documentation
   - Mitigation: Research early, budget extra time, have fallback (manual entry)

2. **OCR accuracy for Serbian** - Legal documents have complex formatting
   - Mitigation: Use proven Serbian OCR engines, allow manual correction

3. **Lawyer adoption** - Lawyers may resist changing workflows
   - Mitigation: Excellent UX, training, gradual rollout, collect feedback early

4. **Data migration** - Existing offices have messy data
   - Mitigation: Robust import tools, migration service offering

5. **Scope creep** - Feature requests will be endless
   - Mitigation: Strict MVP definition, roadmap transparency, version planning

### Medium Risks

6. **Performance at scale** - Large offices with 50,000+ cases
   - Mitigation: Load testing, database optimization, caching strategy

7. **Compliance changes** - GDPR, bar association rules evolve
   - Mitigation: Modular architecture, compliance reviews quarterly

8. **Third-party API changes** - APR, eSud may change APIs
   - Mitigation: Abstraction layer, monitoring, fallback options

### Low Risks

9. **Technology obsolescence** - Chosen stack becomes outdated
   - Mitigation: .NET 10 LTS, mature technologies

10. **Competitor entry** - Others may enter the market
    - Mitigation: First-mover advantage, focus on execution quality and USP

---

## 30. RESEARCH TASKS

**Mark:**
- Research OCR and image recognition
- Text extraction from images

**Shone:**
- Research available lawyer-related portals
- Research APR and similar systems
- Check availability of API or SOAP integrations

---

## REFERENCE LINKS

- https://www.pravno-informacioni-sistem.rs/slglrsNP-overview/23119
- http://www.parlament.gov.rs

---

## NEXT STEPS

1. Finalize and review this specification with stakeholders
2. Review Technical Architecture document
3. Research APR API documentation and requirements
4. Create detailed data model for core entities
5. Set up development environment and project structure
6. Begin MVP development (P0 features)

---

*Technical architecture is detailed in the separate document: Technical Architecture.md*
