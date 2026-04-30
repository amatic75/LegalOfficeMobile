// Data Types

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'lawyer' | 'trainee' | 'paralegal' | 'accountant' | 'staff';
  avatarUrl?: string;
}

export interface Representative {
  name: string;
  role: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
}

export interface Client {
  id: string;
  type: 'individual' | 'corporate';
  firstName?: string;
  lastName?: string;
  companyName?: string;
  jmbg?: string;
  pib?: string;
  mb?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  representatives?: Representative[];
  createdAt: string;
}

export type CaseStatus = 'new' | 'active' | 'pending' | 'closed' | 'archived';

export type CaseType = 'civil' | 'criminal' | 'family' | 'corporate';

export type CaseSubtype =
  | 'litigation' | 'non-litigation' | 'bankruptcy' | 'enforcement' | 'misdemeanor' | 'administrative'
  | 'investigations' | 'indictments' | 'appeals' | 'post-conviction'
  | 'divorce' | 'child-custody' | 'alimony' | 'adoption'
  | 'company-formation' | 'mergers-acquisitions' | 'commercial-contracts' | 'intellectual-property';

export const CASE_TYPE_SUBTYPES: Record<CaseType, CaseSubtype[]> = {
  civil: ['litigation', 'non-litigation', 'bankruptcy', 'enforcement', 'misdemeanor', 'administrative'],
  criminal: ['investigations', 'indictments', 'appeals', 'post-conviction'],
  family: ['divorce', 'child-custody', 'alimony', 'adoption'],
  corporate: ['company-formation', 'mergers-acquisitions', 'commercial-contracts', 'intellectual-property'],
};

export const STATUS_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  new: ['active'],
  active: ['pending', 'closed'],
  pending: ['active', 'closed'],
  closed: ['archived'],
  archived: [],
};

export const STATUS_COLORS: Record<CaseStatus, { bg: string; text: string }> = {
  new: { bg: '#E3F2FD', text: '#1565C0' },
  active: { bg: '#E8F5E9', text: '#2E7D32' },
  pending: { bg: '#FFF3E0', text: '#E65100' },
  closed: { bg: '#F3E5F5', text: '#6A1B9A' },
  archived: { bg: '#ECEFF1', text: '#546E7A' },
};

export interface CaseSummary {
  id: string;
  caseNumber: string;
  title: string;
  clientName: string;
  clientId: string;
  status: CaseStatus;
  caseType: CaseType;
  caseSubtype?: CaseSubtype;
  opposingParty?: string;
  opposingPartyRepresentative?: string;
  opposingPartyRepresentativeId?: string;
  courtCaseNumber?: string;
  judge?: string;
  judgeId?: string;
  tags?: string[];
  lawyerId?: string;
  lawyerName?: string;
  court?: string;
  courtId?: string;
  description?: string;
  nextHearing?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Court {
  id: string;
  name: string;
  address: string;
  city: string;
  jurisdiction?: string;
  phone?: string;
  website?: string;
  notes?: string;
  createdAt: string;
}

// Phase 11: Directory Management

export interface Lawyer {
  id: string;
  displayName: string;
  firm?: string;
  barNumber?: string;
  phone?: string;
  email?: string;
  specialty?: string;
  notes?: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Judge {
  id: string;
  displayName: string;
  court?: string;
  chamber?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface IDirectoryService {
  // Lawyers
  getLawyers(): Promise<Lawyer[]>;
  getLawyerById(id: string): Promise<Lawyer | null>;
  createLawyer(data: Omit<Lawyer, 'id' | 'createdAt'>): Promise<Lawyer>;
  updateLawyer(id: string, data: Partial<Lawyer>): Promise<Lawyer | null>;
  deleteLawyer(id: string): Promise<boolean>;
  // Judges
  getJudges(): Promise<Judge[]>;
  getJudgeById(id: string): Promise<Judge | null>;
  createJudge(data: Omit<Judge, 'id' | 'createdAt'>): Promise<Judge>;
  updateJudge(id: string, data: Partial<Judge>): Promise<Judge | null>;
  deleteJudge(id: string): Promise<boolean>;
  // Courts
  getCourts(): Promise<Court[]>;
  getCourtById(id: string): Promise<Court | null>;
  createCourt(data: Omit<Court, 'id' | 'createdAt'>): Promise<Court>;
  updateCourt(id: string, data: Partial<Court>): Promise<Court | null>;
  deleteCourt(id: string): Promise<boolean>;
}

// Service Interfaces

export interface IUserService {
  getCurrentUser(): Promise<User>;
}

export interface IClientService {
  getClients(): Promise<Client[]>;
  getClientCount(): Promise<number>;
  getClientById(id: string): Promise<Client | null>;
  createClient(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client>;
  updateClient(id: string, data: Partial<Client>): Promise<Client | null>;
  searchClients(query: string, type?: 'individual' | 'corporate'): Promise<Client[]>;
}

export interface ICaseService {
  getRecentCases(limit: number): Promise<CaseSummary[]>;
  getCaseCount(): Promise<number>;
  getCaseById(id: string): Promise<CaseSummary | null>;
  getCasesByClientId(clientId: string): Promise<CaseSummary[]>;
  getCases(): Promise<CaseSummary[]>;
  createCase(data: Omit<CaseSummary, 'id' | 'createdAt'>): Promise<CaseSummary>;
  updateCase(id: string, data: Partial<CaseSummary>): Promise<CaseSummary | null>;
  updateCaseStatus(id: string, status: CaseStatus): Promise<CaseSummary | null>;
}


export interface Document {
  id: string;
  caseId: string;
  name: string;
  type: 'pdf' | 'image' | 'word' | 'text' | 'other';
  mimeType: string;
  size: number;
  uri: string;
  folderId?: string;
  tags?: string[];
  description?: string;
  version?: number;
  createdAt: string;
}

export interface IDocumentService {
  getDocumentsByCaseId(caseId: string): Promise<Document[]>;
  getDocumentById(id: string): Promise<Document | null>;
  addDocument(data: Omit<Document, 'id' | 'createdAt'>): Promise<Document>;
  deleteDocument(id: string): Promise<boolean>;
  getDocumentFolders(caseId: string): Promise<DocumentFolder[]>;
  getDocumentVersions(documentId: string): Promise<DocumentVersion[]>;
  updateDocument(id: string, data: Partial<Document>): Promise<Document | null>;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export const DOC_TYPE_ICONS: Record<Document['type'], { icon: string; color: string }> = {
  pdf: { icon: 'document-text-outline', color: '#E53935' },
  image: { icon: 'image-outline', color: '#43A047' },
  word: { icon: 'document-outline', color: '#1976D2' },
  text: { icon: 'reader-outline', color: '#6D4C41' },
  other: { icon: 'document-outline', color: '#757575' },
};

// Calendar Event Types

export type EventType = 'hearing' | 'meeting' | 'deadline';

export const EVENT_TYPE_COLORS: Record<EventType, { bg: string; text: string; dot: string }> = {
  hearing:  { bg: '#FFEBEE', text: '#C62828', dot: '#EF5350' },
  meeting:  { bg: '#E3F2FD', text: '#1565C0', dot: '#42A5F5' },
  deadline: { bg: '#FFF3E0', text: '#E65100', dot: '#FFA726' },
};

export interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  caseId?: string;
  caseName?: string;
  caseNumber?: string;
  location?: string;
  notes?: string;
  recurrence?: RecurrencePattern;
  createdAt: string;
}

export interface ICalendarEventService {
  getEvents(): Promise<CalendarEvent[]>;
  getEventsByDate(date: string): Promise<CalendarEvent[]>;
  getEventsByCaseId(caseId: string): Promise<CalendarEvent[]>;
  getEventById(id: string): Promise<CalendarEvent | null>;
  createEvent(data: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<CalendarEvent>;
  updateEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent | null>;
  deleteEvent(id: string): Promise<boolean>;
  getConflictingEvents(date: string, startTime?: string, endTime?: string, excludeId?: string): Promise<CalendarEvent[]>;
}

export function eventsToMarkedDates(
  events: CalendarEvent[],
  selectedDate?: string
) {
  const marked: Record<string, { dots: Array<{ key: string; color: string }>; selected?: boolean; selectedColor?: string }> = {};

  for (const event of events) {
    if (!marked[event.date]) {
      marked[event.date] = { dots: [] };
    }
    const dotColor = EVENT_TYPE_COLORS[event.type].dot;
    if (!marked[event.date].dots.some(d => d.color === dotColor)) {
      marked[event.date].dots.push({ key: event.type, color: dotColor });
    }
  }

  if (selectedDate) {
    if (!marked[selectedDate]) {
      marked[selectedDate] = { dots: [] };
    }
    marked[selectedDate].selected = true;
    marked[selectedDate].selectedColor = '#C8A951';
  }

  return marked;
}

// Notification Types

export interface AppNotification {
  id: string;
  type: 'deadline-reminder' | 'case-update';
  title: string;
  body: string;
  relatedCaseId?: string;
  relatedEventId?: string;
  isRead: boolean;
  urgency?: 'today' | '1d' | '3d' | '7d';
  snoozedUntil?: string;
  completed?: boolean;
  createdAt: string;
}

export type UrgencyLevel = 'today' | '1d' | '3d' | '7d' | 'normal';

export const URGENCY_COLORS: Record<UrgencyLevel, { bg: string; text: string; label: string }> = {
  today:  { bg: '#FFEBEE', text: '#C62828', label: 'Danas' },
  '1d':   { bg: '#FFF3E0', text: '#E65100', label: '1 dan' },
  '3d':   { bg: '#FFF8E1', text: '#F57F17', label: '3 dana' },
  '7d':   { bg: '#FFFDE7', text: '#F9A825', label: '7 dana' },
  normal: { bg: '#E8F5E9', text: '#2E7D32', label: '' },
};

export function getDeadlineUrgency(dateStr: string): UrgencyLevel {
  const now = new Date();
  const deadline = new Date(dateStr);
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'today';
  if (diffDays <= 1) return '1d';
  if (diffDays <= 3) return '3d';
  if (diffDays <= 7) return '7d';
  return 'normal';
}

// Phase 7: Enhanced Notifications

export interface NotificationPreferences {
  quietHoursEnabled: boolean;
  quietHoursStart: string;    // "22:00" format
  quietHoursEnd: string;      // "07:00" format
  deadlineReminders: boolean; // toggle for deadline-reminder type
  caseUpdates: boolean;       // toggle for case-update type
}

export type SnoozeOption = '1h' | '3h' | 'tomorrow' | 'next-week';

export interface QuickAction {
  type: 'mark-complete' | 'reschedule';
  label: string;
}

export interface INotificationService {
  getNotifications(): Promise<AppNotification[]>;
  getUnreadCount(): Promise<number>;
  getPreferences(): Promise<NotificationPreferences>;
  updatePreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
  snoozeNotification(id: string, option: SnoozeOption): Promise<void>;
  markComplete(id: string): Promise<void>;
}

// Phase 5: Case Notes, Time/Expense, Case Linking

export interface CaseNote {
  id: string;
  caseId: string;
  type: 'text' | 'voice';
  content?: string;
  audioUri?: string;
  audioDuration?: number;
  createdAt: string;
  updatedAt?: string;
}

export type Currency = 'RSD' | 'EUR' | 'USD' | 'CHF';

export const SUPPORTED_CURRENCIES: Currency[] = ['RSD', 'EUR', 'USD', 'CHF'];

export const DEFAULT_CURRENCY: Currency = 'RSD';

export function formatMoney(amount: number, currency: Currency = DEFAULT_CURRENCY): string {
  const parts = amount.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intPart},${parts[1]} ${currency}`;
}

export interface TimeEntry {
  id: string;
  caseId: string;
  hours: number;
  description: string;
  date: string;
  billable: boolean;
  amount?: number;
  currency?: Currency;
  paid?: boolean;
  paidAt?: string;
  createdAt: string;
}

export type ExpenseCategory = 'court-fees' | 'travel' | 'expert-witnesses' | 'filing-fees' | 'postage' | 'copying' | 'custom';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'court-fees', 'travel', 'expert-witnesses', 'filing-fees', 'postage', 'copying', 'custom',
];

export interface Expense {
  id: string;
  caseId: string;
  amount: number;
  currency?: Currency;
  category: ExpenseCategory;
  description: string;
  date: string;
  paid?: boolean;
  paidAt?: string;
  createdAt: string;
}

export type CaseLinkType = 'related' | 'appeal' | 'parent' | 'predecessor';

export const CASE_LINK_TYPES: CaseLinkType[] = ['related', 'appeal', 'parent', 'predecessor'];

export interface CaseLink {
  id: string;
  caseIdA: string;
  caseIdB: string;
  linkType: CaseLinkType;
  createdAt: string;
}

export const PREDEFINED_TAGS = ['urgent', 'confidential', 'for-review', 'vip', 'pro-bono', 'high-value'] as const;

// Tree of subtype slug keys -> item slug keys. Labels are looked up via i18n
// (cases.json: `subtype.<key>` and `subtypeItem.<key>`).
export const CASE_TYPE_SUBTYPES_TREE: Record<CaseType, { subtypes: Record<string, { items: string[] }> }> = {
  civil: {
    subtypes: {
      litigation: { items: ['contract-disputes', 'property-disputes', 'employment-disputes', 'tort-claims'] },
      'non-litigation': { items: ['mediation', 'arbitration', 'notarial-matters'] },
      bankruptcy: { items: ['creditor-claims', 'debtor-restructuring', 'liquidation-proceedings'] },
      enforcement: { items: ['debt-collection', 'asset-seizure', 'wage-garnishment'] },
      misdemeanor: { items: ['traffic-violations', 'public-order-offenses', 'minor-property-damage'] },
      administrative: { items: ['permit-appeals', 'tax-disputes', 'regulatory-compliance'] },
    },
  },
  criminal: {
    subtypes: {
      investigations: { items: ['financial-crimes', 'violent-crimes', 'cybercrime'] },
      indictments: { items: ['felony-charges', 'organized-crime', 'white-collar-crime'] },
      appeals: { items: ['sentence-reduction', 'procedural-errors', 'new-evidence'] },
      'post-conviction': { items: ['parole-hearings', 'sentence-modification', 'rehabilitation'] },
    },
  },
  family: {
    subtypes: {
      divorce: { items: ['contested-divorce', 'uncontested-divorce', 'property-division'] },
      'child-custody': { items: ['sole-custody', 'joint-custody', 'visitation-rights'] },
      alimony: { items: ['spousal-support', 'child-support-modification', 'enforcement-of-support'] },
      adoption: { items: ['domestic-adoption', 'international-adoption', 'step-parent-adoption'] },
    },
  },
  corporate: {
    subtypes: {
      'company-formation': { items: ['llc-registration', 'joint-stock-company', 'branch-office-registration'] },
      'mergers-acquisitions': { items: ['due-diligence', 'share-purchase', 'asset-acquisition'] },
      'commercial-contracts': { items: ['supply-agreements', 'lease-agreements', 'service-contracts'] },
      'intellectual-property': { items: ['trademark-registration', 'patent-filing', 'copyright-protection'] },
    },
  },
};

// Phase 5 Service Interfaces

export interface ICaseNoteService {
  getNotesByCaseId(caseId: string): Promise<CaseNote[]>;
  createNote(data: Omit<CaseNote, 'id' | 'createdAt'>): Promise<CaseNote>;
  updateNote(id: string, content: string): Promise<CaseNote | null>;
  deleteNote(id: string): Promise<boolean>;
}

export interface ITimeEntryService {
  getTimeEntriesByCaseId(caseId: string): Promise<TimeEntry[]>;
  createTimeEntry(data: Omit<TimeEntry, 'id' | 'createdAt'>): Promise<TimeEntry>;
  updateTimeEntry(id: string, data: Partial<Pick<TimeEntry, 'hours' | 'description' | 'date' | 'billable' | 'amount' | 'currency' | 'paid' | 'paidAt'>>): Promise<TimeEntry | null>;
  deleteTimeEntry(id: string): Promise<boolean>;
}

export interface IExpenseService {
  getExpensesByCaseId(caseId: string): Promise<Expense[]>;
  createExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense>;
  updateExpense(id: string, data: Partial<Pick<Expense, 'amount' | 'currency' | 'category' | 'description' | 'date' | 'paid' | 'paidAt'>>): Promise<Expense | null>;
  deleteExpense(id: string): Promise<boolean>;
}

export interface ICaseLinkService {
  getLinksByCaseId(caseId: string): Promise<Array<CaseLink & { linkedCase: CaseSummary }>>;
  createLink(caseIdA: string, caseIdB: string, linkType: CaseLinkType): Promise<CaseLink>;
  deleteLink(id: string): Promise<boolean>;
}

// Phase 6: Document Folders, Versions, Communications, Client Documents

export type DocumentFolderCategory = 'pleadings' | 'evidence' | 'correspondence' | 'contracts' | 'court-decisions' | 'other';

export const DOCUMENT_FOLDER_CATEGORIES: DocumentFolderCategory[] = [
  'pleadings', 'evidence', 'correspondence', 'contracts', 'court-decisions', 'other',
];

export const FOLDER_ICONS: Record<DocumentFolderCategory, string> = {
  pleadings: 'document-text-outline',
  evidence: 'camera-outline',
  correspondence: 'mail-outline',
  contracts: 'create-outline',
  'court-decisions': 'hammer-outline',
  other: 'folder-outline',
};

export interface DocumentFolder {
  id: string;
  caseId: string;
  name: string;
  icon: string;
  order: number;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  size: number;
  modifiedBy: string;
  createdAt: string;
  changes?: string;
}

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: string;
  daysOfWeek?: number[];
}

export interface CommunicationEntry {
  id: string;
  clientId: string;
  type: 'call' | 'meeting' | 'email' | 'note';
  subject: string;
  content?: string;
  date: string;
  createdAt: string;
}

export interface ClientDocument {
  id: string;
  clientId: string;
  type: 'id-card' | 'passport' | 'power-of-attorney' | 'engagement-letter' | 'other';
  name: string;
  uri: string;
  createdAt: string;
  expiresAt?: string;
}

export const CLIENT_DOC_TYPES: ClientDocument['type'][] = [
  'id-card', 'passport', 'power-of-attorney', 'engagement-letter', 'other',
];

export type IntakeStep = 'contact' | 'conflict-check' | 'consultation' | 'onboarding';

export interface ICommunicationService {
  getByClientId(clientId: string): Promise<CommunicationEntry[]>;
  create(data: Omit<CommunicationEntry, 'id' | 'createdAt'>): Promise<CommunicationEntry>;
}

export interface IClientDocumentService {
  getByClientId(clientId: string): Promise<ClientDocument[]>;
  create(data: Omit<ClientDocument, 'id' | 'createdAt'>): Promise<ClientDocument>;
  delete(id: string): Promise<boolean>;
}

// Phase 7: Advanced Search

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter;
  createdAt: string;
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  resultCount: number;
  searchedAt: string;
}

export interface SearchFilter {
  types?: ('client' | 'case' | 'event')[];
  status?: string[];       // case statuses: 'active', 'closed', etc.
  dateFrom?: string;       // ISO date
  dateTo?: string;         // ISO date
  lawyerId?: string;       // filter by assigned lawyer
}

// Quick filter presets
export type QuickFilterId = 'my-cases' | 'urgent' | 'new-this-week';

export interface ISearchService {
  getSavedSearches(): Promise<SavedSearch[]>;
  saveSearch(search: Omit<SavedSearch, 'id' | 'createdAt'>): Promise<SavedSearch>;
  deleteSavedSearch(id: string): Promise<void>;
  getSearchHistory(): Promise<SearchHistoryEntry[]>;
  addToHistory(entry: Omit<SearchHistoryEntry, 'id'>): Promise<SearchHistoryEntry>;
  clearHistory(): Promise<void>;
}

// Phase 8: Billing and Invoicing

export type BillingMode = 'tariff' | 'hourly' | 'flat-fee';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'partially-paid';

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  draft: { bg: '#ECEFF1', text: '#546E7A' },
  sent: { bg: '#E3F2FD', text: '#1565C0' },
  paid: { bg: '#E8F5E9', text: '#2E7D32' },
  overdue: { bg: '#FFEBEE', text: '#C62828' },
  'partially-paid': { bg: '#FFF3E0', text: '#E65100' },
};

export interface InvoiceLineItem {
  id: string;
  type: 'time-entry' | 'expense';
  referenceId: string;
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: 'cash' | 'bank-transfer' | 'card';
  note?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  caseId: string;
  caseName: string;
  clientId: string;
  clientName: string;
  billingMode: BillingMode;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  payments: Payment[];
  hourlyRate?: number;
  flatFeeAmount?: number;
  tariffAmount?: number;
  notes?: string;
  issuedDate: string;
  dueDate: string;
  createdAt: string;
}

export interface IBillingService {
  getInvoices(): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  getInvoicesByCaseId(caseId: string): Promise<Invoice[]>;
  getInvoicesByClientId(clientId: string): Promise<Invoice[]>;
  createInvoice(data: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice | null>;
  addPayment(invoiceId: string, data: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment>;
  // Outstanding amounts are exposed per-currency since invoices, time entries
  // and expenses can be in RSD / EUR / USD / CHF and we don't have a stable
  // FX rate to combine them. UIs should render each non-zero currency on its
  // own line. `totalOutstanding` is kept as a single-number fallback equal to
  // the RSD bucket only (callers that just want a numeric should use it for
  // sorting / "is anything outstanding" checks, not for display totals).
  getOutstandingByClient(): Promise<Array<{ clientId: string; clientName: string; outstandingByCurrency: Partial<Record<Currency, number>>; totalOutstanding: number; invoiceCount: number }>>;
  getOutstandingByCase(): Promise<Array<{ caseId: string; caseName: string; caseNumber: string; clientName: string; outstandingByCurrency: Partial<Record<Currency, number>>; totalOutstanding: number; invoiceCount: number }>>;
}

// Phase 9: Reporting and Analytics

export interface FinancialSummary {
  totalRevenue: number;
  totalCollected: number;
  totalOutstanding: number;
  invoiceCount: number;
  overdueCount: number;
}

export interface MonthlyRevenue {
  month: string;
  label: string;
  revenue: number;
}

export interface RevenueByMode {
  mode: BillingMode;
  total: number;
  count: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  totalBilled: number;
  invoiceCount: number;
}

export interface CaseStatusBreakdown {
  status: CaseStatus;
  count: number;
}

export interface CaseTypeBreakdown {
  caseType: CaseType;
  count: number;
}

export interface UpcomingDeadline {
  eventId: string;
  title: string;
  date: string;
  caseId?: string;
  caseName?: string;
}

export interface PerformanceMetrics {
  totalCases: number;
  activeCases: number;
  closedCases: number;
  closureRate: number;
  averageCaseDuration: number;
  casesByLawyer: Array<{ lawyerId: string; lawyerName: string; caseCount: number }>;
}

export interface IReportService {
  getFinancialSummary(): Promise<FinancialSummary>;
  getMonthlyRevenue(months?: number): Promise<MonthlyRevenue[]>;
  getRevenueByMode(): Promise<RevenueByMode[]>;
  getTopClients(limit?: number): Promise<TopClient[]>;
  getCaseStatusBreakdown(): Promise<CaseStatusBreakdown[]>;
  getCaseTypeBreakdown(): Promise<CaseTypeBreakdown[]>;
  getUpcomingDeadlines(days?: number): Promise<UpcomingDeadline[]>;
  getPerformanceMetrics(): Promise<PerformanceMetrics>;
}

// Phase 10: Client Detail Depth — Cross-case Aggregation

export type ClientActivityType = 'note' | 'event' | 'document' | 'time-entry' | 'payment' | 'status-change';

export interface ClientActivity {
  id: string;
  type: ClientActivityType;
  title: string;
  description?: string;
  date: string;         // ISO date string for sorting
  caseId: string;
  caseName: string;
  caseNumber: string;
  icon: string;         // Ionicons name
  metadata?: Record<string, string | number>;
  eventId?: string;     // Set when type === 'event' so the row can deep-link to the calendar event
}

export interface ClientExpenseItem {
  id: string;
  type: 'time-entry' | 'expense';
  description: string;
  amount: number;
  currency?: Currency;
  date: string;
  caseId: string;
  caseName: string;
  caseNumber: string;
  category?: string;
  hours?: number;
  paid?: boolean;
}

export interface ClientOutstandingSummary {
  totalOutstanding: number;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    caseId: string;
    caseName: string;
    total: number;
    paidAmount: number;
    outstanding: number;
    status: string;
    issuedDate: string;
    dueDate: string;
  }>;
}

export const ACTIVITY_TYPE_ICONS: Record<ClientActivityType, string> = {
  'note': 'document-text-outline',
  'event': 'calendar-outline',
  'document': 'attach-outline',
  'time-entry': 'time-outline',
  'payment': 'card-outline',
  'status-change': 'swap-horizontal-outline',
};

export interface IClientAggregationService {
  getRecentActivity(clientId: string, limit?: number): Promise<ClientActivity[]>;
  getUpcomingActivity(clientId: string, limit?: number): Promise<ClientActivity[]>;
  getExpenses(clientId: string): Promise<ClientExpenseItem[]>;
  getOutstandingSummary(clientId: string): Promise<ClientOutstandingSummary>;
}

// Document templates (only Word / TXT files supported for now). Templates are
// firm-wide reusable skeletons (Ugovor, Zalba, …), not tied to a case or client.
export type DocumentTemplateCategory =
  | 'ugovor' | 'zalba' | 'tuzba' | 'punomocje' | 'predlog' | 'odluka' | 'odgovor' | 'other';

export const DOCUMENT_TEMPLATE_CATEGORIES: DocumentTemplateCategory[] = [
  'ugovor', 'zalba', 'tuzba', 'punomocje', 'predlog', 'odluka', 'odgovor', 'other',
];

export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'word' | 'text';
  mimeType: string;
  size: number;
  uri: string;
  category: DocumentTemplateCategory;
  description?: string;
  createdAt: string;
}

export interface IDocumentTemplateService {
  getAll(): Promise<DocumentTemplate[]>;
  create(data: Omit<DocumentTemplate, 'id' | 'createdAt'>): Promise<DocumentTemplate>;
  delete(id: string): Promise<boolean>;
}

export interface ServiceRegistry {
  users: IUserService;
  clients: IClientService;
  cases: ICaseService;
  directory: IDirectoryService;
  documents: IDocumentService;
  calendarEvents: ICalendarEventService;
  notifications: INotificationService;
  caseNotes: ICaseNoteService;
  timeEntries: ITimeEntryService;
  expenses: IExpenseService;
  caseLinks: ICaseLinkService;
  communications: ICommunicationService;
  clientDocuments: IClientDocumentService;
  search: ISearchService;
  billing: IBillingService;
  reports: IReportService;
  clientAggregation: IClientAggregationService;
  documentTemplates: IDocumentTemplateService;
}
