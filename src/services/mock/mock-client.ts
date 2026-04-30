import type {
  ServiceRegistry,
  IUserService,
  IClientService,
  ICaseService,
  IDirectoryService,
  IDocumentService,
  ICalendarEventService,
  INotificationService,
  ICaseNoteService,
  ITimeEntryService,
  IExpenseService,
  ICaseLinkService,
  ICommunicationService,
  IClientDocumentService,
  ISearchService,
  IBillingService,
  IReportService,
  IClientAggregationService,
  IDocumentTemplateService,
  DocumentTemplate,
  ClientActivity,
  ClientExpenseItem,
  ClientOutstandingSummary,
  User,
  Client,
  CaseSummary,
  CaseStatus,
  CaseType,
  BillingMode,
  Court,
  Lawyer,
  Judge,
  Document,
  DocumentFolder,
  DocumentVersion,
  CalendarEvent,
  AppNotification,
  CaseNote,
  TimeEntry,
  Expense,
  CaseLink,
  CaseLinkType,
  CommunicationEntry,
  ClientDocument,
  SavedSearch,
  SearchHistoryEntry,
  NotificationPreferences,
  SnoozeOption,
  Invoice,
  InvoiceStatus,
  Payment,
  FinancialSummary,
  MonthlyRevenue,
  RevenueByMode,
  TopClient,
  CaseStatusBreakdown,
  CaseTypeBreakdown,
  UpcomingDeadline,
  PerformanceMetrics,
} from '../types';
import { DOCUMENT_FOLDER_CATEGORIES, FOLDER_ICONS, ACTIVITY_TYPE_ICONS, DEFAULT_CURRENCY } from '../types';
import type { Currency } from '../types';
import { delay } from '../../utils/delay';
import { resolveMockUri } from './mock-asset-materializer';
import { mockUsers } from './data/users';
import { mockClients } from './data/clients';
import { mockCases } from './data/cases';
import { mockCourts } from './data/courts';
import { mockLawyers } from './data/lawyers';
import { mockJudges } from './data/judges';
import { mockDocuments } from './data/documents';
import { mockCalendarEvents } from './data/calendar-events';
import { mockNotifications } from './data/notifications';
import { mockCaseNotes } from './data/case-notes';
import { mockTimeEntries } from './data/time-entries';
import { mockExpenses } from './data/expenses';
import { mockCaseLinks } from './data/case-links';
import { mockCommunicationHistory } from './data/communication-history';
import { mockClientDocuments } from './data/client-documents';
import { mockSavedSearches } from './data/saved-searches';
import { mockSearchHistory } from './data/search-history';
import { mockInvoices } from './data/invoices';
import { mockDocumentTemplates } from './data/document-templates';

// Mutable copies so mutations persist within a session
let clients = [...mockClients];
let cases = [...mockCases];
let documents = [...mockDocuments];
let calendarEvents = [...mockCalendarEvents];
let notifications = [...mockNotifications];
let caseNotes = [...mockCaseNotes];
let timeEntries = [...mockTimeEntries];
let expenses = [...mockExpenses];
let caseLinks = [...mockCaseLinks];
let communicationHistory = [...mockCommunicationHistory];
let clientDocuments = [...mockClientDocuments];
let savedSearches = [...mockSavedSearches];
let searchHistory = [...mockSearchHistory];
let invoices = mockInvoices.map(inv => ({ ...inv, payments: [...inv.payments], lineItems: [...inv.lineItems] }));
let documentTemplates = [...mockDocumentTemplates];
let lawyers = [...mockLawyers];
let judges = [...mockJudges];
let courts = [...mockCourts];

let notificationPreferences: NotificationPreferences = {
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  deadlineReminders: true,
  caseUpdates: true,
};

const mockUserService: IUserService = {
  async getCurrentUser(): Promise<User> {
    await delay(300);
    return mockUsers[0];
  },
};

const mockClientService: IClientService = {
  async getClients(): Promise<Client[]> {
    await delay(400);
    return clients;
  },

  async getClientCount(): Promise<number> {
    await delay(200);
    return clients.length;
  },

  async getClientById(id: string): Promise<Client | null> {
    await delay(300);
    return clients.find((c) => c.id === id) ?? null;
  },

  async createClient(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    await delay(300);
    const newClient: Client = {
      ...data,
      id: 'c' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    clients.push(newClient);
    return newClient;
  },

  async updateClient(id: string, data: Partial<Client>): Promise<Client | null> {
    await delay(300);
    const index = clients.findIndex((c) => c.id === id);
    if (index === -1) return null;
    clients[index] = { ...clients[index], ...data };
    return clients[index];
  },

  async searchClients(query: string, type?: 'individual' | 'corporate'): Promise<Client[]> {
    await delay(300);
    const q = query.toLowerCase();
    return clients.filter((c) => {
      if (type && c.type !== type) return false;
      const name =
        c.type === 'individual'
          ? `${c.firstName ?? ''} ${c.lastName ?? ''}`
          : c.companyName ?? '';
      return name.toLowerCase().includes(q);
    });
  },
};

const mockCaseService: ICaseService = {
  async getRecentCases(limit: number): Promise<CaseSummary[]> {
    await delay(400);
    const sorted = [...cases].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return sorted.slice(0, limit);
  },

  async getCaseCount(): Promise<number> {
    await delay(200);
    return cases.length;
  },

  async getCaseById(id: string): Promise<CaseSummary | null> {
    await delay(300);
    return cases.find((c) => c.id === id) ?? null;
  },

  async getCasesByClientId(clientId: string): Promise<CaseSummary[]> {
    await delay(400);
    return cases.filter((c) => c.clientId === clientId);
  },

  async getCases(): Promise<CaseSummary[]> {
    await delay(400);
    return cases;
  },

  async createCase(data: Omit<CaseSummary, 'id' | 'createdAt'>): Promise<CaseSummary> {
    await delay(300);
    const newCase: CaseSummary = {
      ...data,
      id: 'cs' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    cases.push(newCase);
    return newCase;
  },

  async updateCase(id: string, data: Partial<CaseSummary>): Promise<CaseSummary | null> {
    await delay(300);
    const index = cases.findIndex((c) => c.id === id);
    if (index === -1) return null;
    cases[index] = { ...cases[index], ...data };
    return cases[index];
  },

  async updateCaseStatus(id: string, status: CaseStatus): Promise<CaseSummary | null> {
    await delay(300);
    const index = cases.findIndex((c) => c.id === id);
    if (index === -1) return null;
    cases[index] = { ...cases[index], status, updatedAt: new Date().toISOString() };
    return cases[index];
  },
};

const mockDirectoryService: IDirectoryService = {
  // Lawyers
  async getLawyers(): Promise<Lawyer[]> {
    await delay(300);
    return [...lawyers].sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
  async getLawyerById(id: string): Promise<Lawyer | null> {
    await delay(200);
    return lawyers.find((l) => l.id === id) ?? null;
  },
  async createLawyer(data: Omit<Lawyer, 'id' | 'createdAt'>): Promise<Lawyer> {
    await delay(300);
    const newLawyer: Lawyer = {
      ...data,
      id: 'law' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    lawyers.push(newLawyer);
    return newLawyer;
  },
  async updateLawyer(id: string, data: Partial<Lawyer>): Promise<Lawyer | null> {
    await delay(300);
    const index = lawyers.findIndex((l) => l.id === id);
    if (index === -1) return null;
    lawyers[index] = { ...lawyers[index], ...data };
    return lawyers[index];
  },
  async deleteLawyer(id: string): Promise<boolean> {
    await delay(300);
    const index = lawyers.findIndex((l) => l.id === id);
    if (index === -1) return false;
    lawyers.splice(index, 1);
    return true;
  },
  // Judges
  async getJudges(): Promise<Judge[]> {
    await delay(300);
    return [...judges].sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
  async getJudgeById(id: string): Promise<Judge | null> {
    await delay(200);
    return judges.find((j) => j.id === id) ?? null;
  },
  async createJudge(data: Omit<Judge, 'id' | 'createdAt'>): Promise<Judge> {
    await delay(300);
    const newJudge: Judge = {
      ...data,
      id: 'jud' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    judges.push(newJudge);
    return newJudge;
  },
  async updateJudge(id: string, data: Partial<Judge>): Promise<Judge | null> {
    await delay(300);
    const index = judges.findIndex((j) => j.id === id);
    if (index === -1) return null;
    judges[index] = { ...judges[index], ...data };
    return judges[index];
  },
  async deleteJudge(id: string): Promise<boolean> {
    await delay(300);
    const index = judges.findIndex((j) => j.id === id);
    if (index === -1) return false;
    judges.splice(index, 1);
    return true;
  },
  // Courts
  async getCourts(): Promise<Court[]> {
    await delay(200);
    return [...courts].sort((a, b) => a.name.localeCompare(b.name));
  },
  async getCourtById(id: string): Promise<Court | null> {
    await delay(200);
    return courts.find((c) => c.id === id) ?? null;
  },
  async createCourt(data: Omit<Court, 'id' | 'createdAt'>): Promise<Court> {
    await delay(300);
    const newCourt: Court = {
      ...data,
      id: 'ct' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    courts.push(newCourt);
    return newCourt;
  },
  async updateCourt(id: string, data: Partial<Court>): Promise<Court | null> {
    await delay(300);
    const index = courts.findIndex((c) => c.id === id);
    if (index === -1) return null;
    courts[index] = { ...courts[index], ...data };
    return courts[index];
  },
  async deleteCourt(id: string): Promise<boolean> {
    await delay(300);
    const index = courts.findIndex((c) => c.id === id);
    if (index === -1) return false;
    courts.splice(index, 1);
    return true;
  },
};

const FOLDER_NAMES: Record<string, string> = {
  pleadings: 'Podnesci',
  evidence: 'Dokazi',
  correspondence: 'Prepiska',
  contracts: 'Ugovori',
  'court-decisions': 'Sudske odluke',
  other: 'Ostalo',
};

// Replace placeholder `file:///mock/...` URIs with real cached files so the doc
// is actually openable. Real URIs (added via upload/capture) pass through.
// The hint (folderId + name) drives the PDF template choice so e.g. a doc in
// the "pleadings" folder gets the Tuzba template, not generic mock content.
async function materializeDoc(doc: Document): Promise<Document> {
  const hint = `${doc.folderId ?? ''} ${doc.name}`;
  const realUri = await resolveMockUri(doc.uri, doc.type, hint);
  return realUri === doc.uri ? doc : { ...doc, uri: realUri };
}

const mockDocumentService: IDocumentService = {
  async getDocumentsByCaseId(caseId: string): Promise<Document[]> {
    await delay(300);
    const filtered = documents.filter((d) => d.caseId === caseId);
    return Promise.all(filtered.map(materializeDoc));
  },

  async getDocumentById(id: string): Promise<Document | null> {
    await delay(300);
    const doc = documents.find((d) => d.id === id);
    if (!doc) return null;
    return materializeDoc(doc);
  },

  async addDocument(data: Omit<Document, 'id' | 'createdAt'>): Promise<Document> {
    await delay(300);
    const newDoc: Document = {
      ...data,
      id: 'doc' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    documents.push(newDoc);
    return newDoc;
  },

  async deleteDocument(id: string): Promise<boolean> {
    await delay(300);
    const index = documents.findIndex((d) => d.id === id);
    if (index === -1) return false;
    documents.splice(index, 1);
    return true;
  },

  async getDocumentFolders(caseId: string): Promise<DocumentFolder[]> {
    await delay(200);
    return DOCUMENT_FOLDER_CATEGORIES.map((category, index) => ({
      id: `fldr-${caseId}-${category}`,
      caseId,
      name: FOLDER_NAMES[category] || category,
      icon: FOLDER_ICONS[category],
      order: index,
    }));
  },

  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    await delay(200);
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return [];
    const currentVersion = doc.version ?? 1;
    const versions: DocumentVersion[] = [];
    for (let v = currentVersion; v >= 1; v--) {
      const createdDate = new Date(doc.createdAt);
      createdDate.setDate(createdDate.getDate() - (currentVersion - v) * 7);
      versions.push({
        id: `ver-${documentId}-${v}`,
        documentId,
        version: v,
        size: Math.round(doc.size * (0.8 + v * 0.1)),
        modifiedBy: v === currentVersion ? 'Marko Petrovic' : 'Ana Jovanovic',
        createdAt: createdDate.toISOString(),
        changes: v === currentVersion
          ? 'Azurirana finalna verzija'
          : v === 1
            ? 'Inicijalna verzija dokumenta'
            : 'Ispravke i dopune teksta',
      });
    }
    return versions;
  },

  async updateDocument(id: string, data: Partial<Document>): Promise<Document | null> {
    await delay(300);
    const index = documents.findIndex((d) => d.id === id);
    if (index === -1) return null;
    documents[index] = { ...documents[index], ...data };
    return documents[index];
  },
};

const mockCalendarEventService: ICalendarEventService = {
  async getEvents(): Promise<CalendarEvent[]> {
    await delay(400);
    return [...calendarEvents];
  },

  async getEventsByDate(date: string): Promise<CalendarEvent[]> {
    await delay(300);
    return calendarEvents.filter((e) => e.date === date);
  },

  async getEventsByCaseId(caseId: string): Promise<CalendarEvent[]> {
    await delay(300);
    return calendarEvents.filter((e) => e.caseId === caseId);
  },

  async getEventById(id: string): Promise<CalendarEvent | null> {
    await delay(300);
    return calendarEvents.find((e) => e.id === id) ?? null;
  },

  async createEvent(data: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<CalendarEvent> {
    await delay(300);
    const newEvent: CalendarEvent = {
      ...data,
      id: 'evt' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    calendarEvents.push(newEvent);
    return newEvent;
  },

  async updateEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    await delay(300);
    const index = calendarEvents.findIndex((e) => e.id === id);
    if (index === -1) return null;
    calendarEvents[index] = { ...calendarEvents[index], ...data };
    return calendarEvents[index];
  },

  async deleteEvent(id: string): Promise<boolean> {
    await delay(300);
    const index = calendarEvents.findIndex((e) => e.id === id);
    if (index === -1) return false;
    calendarEvents.splice(index, 1);
    return true;
  },

  async getConflictingEvents(date: string, startTime?: string, endTime?: string, excludeId?: string): Promise<CalendarEvent[]> {
    await delay(200);
    return calendarEvents.filter((e) => {
      if (e.id === excludeId) return false;
      if (e.date !== date) return false;
      // If no time provided, any event on same date is a conflict
      if (!startTime || !endTime) return true;
      // All-day events (no start/end) always conflict
      if (!e.startTime || !e.endTime) return true;
      // Check time overlap
      return e.startTime < endTime && e.endTime > startTime;
    });
  },
};

function computeSnoozeUntil(option: SnoozeOption): string {
  const now = new Date();
  switch (option) {
    case '1h':
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case '3h':
      return new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
    case 'tomorrow': {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.toISOString();
    }
    case 'next-week': {
      const nextMonday = new Date(now);
      const dayOfWeek = nextMonday.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 0, 0, 0);
      return nextMonday.toISOString();
    }
  }
}

const mockNotificationService: INotificationService = {
  async getNotifications(): Promise<AppNotification[]> {
    await delay(300);
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async getUnreadCount(): Promise<number> {
    await delay(200);
    return notifications.filter((n) => !n.isRead).length;
  },

  async getPreferences(): Promise<NotificationPreferences> {
    await delay(200);
    return { ...notificationPreferences };
  },

  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    await delay(300);
    Object.assign(notificationPreferences, prefs);
    return { ...notificationPreferences };
  },

  async snoozeNotification(id: string, option: SnoozeOption): Promise<void> {
    await delay(300);
    const index = notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifications[index] = {
        ...notifications[index],
        snoozedUntil: computeSnoozeUntil(option),
        isRead: true,
      };
    }
  },

  async markComplete(id: string): Promise<void> {
    await delay(300);
    const index = notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifications[index] = {
        ...notifications[index],
        isRead: true,
        completed: true,
      };
    }
  },
};

const mockCaseNoteService: ICaseNoteService = {
  async getNotesByCaseId(caseId: string): Promise<CaseNote[]> {
    await delay(300);
    return caseNotes
      .filter((n) => n.caseId === caseId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createNote(data: Omit<CaseNote, 'id' | 'createdAt'>): Promise<CaseNote> {
    await delay(300);
    const newNote: CaseNote = {
      ...data,
      id: 'cn' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    caseNotes.push(newNote);
    return newNote;
  },

  async updateNote(id: string, content: string): Promise<CaseNote | null> {
    await delay(300);
    const index = caseNotes.findIndex((n) => n.id === id);
    if (index === -1) return null;
    caseNotes[index] = { ...caseNotes[index], content, updatedAt: new Date().toISOString() };
    return caseNotes[index];
  },

  async deleteNote(id: string): Promise<boolean> {
    await delay(300);
    const index = caseNotes.findIndex((n) => n.id === id);
    if (index === -1) return false;
    caseNotes.splice(index, 1);
    return true;
  },
};

const mockTimeEntryService: ITimeEntryService = {
  async getTimeEntriesByCaseId(caseId: string): Promise<TimeEntry[]> {
    await delay(300);
    return timeEntries.filter((t) => t.caseId === caseId);
  },

  async createTimeEntry(data: Omit<TimeEntry, 'id' | 'createdAt'>): Promise<TimeEntry> {
    await delay(300);
    const newEntry: TimeEntry = {
      ...data,
      id: 'te' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    timeEntries.push(newEntry);
    return newEntry;
  },

  async updateTimeEntry(id: string, data: Partial<Pick<TimeEntry, 'hours' | 'description' | 'date' | 'billable' | 'amount' | 'currency' | 'paid' | 'paidAt'>>): Promise<TimeEntry | null> {
    await delay(200);
    const index = timeEntries.findIndex((t) => t.id === id);
    if (index === -1) return null;
    timeEntries[index] = { ...timeEntries[index], ...data };
    return timeEntries[index];
  },

  async deleteTimeEntry(id: string): Promise<boolean> {
    await delay(300);
    const index = timeEntries.findIndex((t) => t.id === id);
    if (index === -1) return false;
    timeEntries.splice(index, 1);
    return true;
  },
};

const mockExpenseService: IExpenseService = {
  async getExpensesByCaseId(caseId: string): Promise<Expense[]> {
    await delay(300);
    return expenses.filter((e) => e.caseId === caseId);
  },

  async createExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    await delay(300);
    const newExpense: Expense = {
      ...data,
      id: 'exp' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    expenses.push(newExpense);
    return newExpense;
  },

  async updateExpense(id: string, data: Partial<Pick<Expense, 'amount' | 'currency' | 'category' | 'description' | 'date' | 'paid' | 'paidAt'>>): Promise<Expense | null> {
    await delay(200);
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) return null;
    expenses[index] = { ...expenses[index], ...data };
    return expenses[index];
  },

  async deleteExpense(id: string): Promise<boolean> {
    await delay(300);
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) return false;
    expenses.splice(index, 1);
    return true;
  },
};

const mockCaseLinkService: ICaseLinkService = {
  async getLinksByCaseId(caseId: string): Promise<Array<CaseLink & { linkedCase: CaseSummary }>> {
    await delay(300);
    const links = caseLinks.filter((l) => l.caseIdA === caseId || l.caseIdB === caseId);
    return links
      .map((link) => {
        const otherCaseId = link.caseIdA === caseId ? link.caseIdB : link.caseIdA;
        const linkedCase = cases.find((c) => c.id === otherCaseId);
        if (!linkedCase) return null;
        return { ...link, linkedCase };
      })
      .filter((item): item is CaseLink & { linkedCase: CaseSummary } => item !== null);
  },

  async createLink(caseIdA: string, caseIdB: string, linkType: CaseLinkType): Promise<CaseLink> {
    await delay(300);
    const newLink: CaseLink = {
      id: 'cl' + Date.now(),
      caseIdA,
      caseIdB,
      linkType,
      createdAt: new Date().toISOString(),
    };
    caseLinks.push(newLink);
    return newLink;
  },

  async deleteLink(id: string): Promise<boolean> {
    await delay(300);
    const index = caseLinks.findIndex((l) => l.id === id);
    if (index === -1) return false;
    caseLinks.splice(index, 1);
    return true;
  },
};

const mockCommunicationService: ICommunicationService = {
  async getByClientId(clientId: string): Promise<CommunicationEntry[]> {
    await delay(300);
    return communicationHistory
      .filter((c) => c.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async create(data: Omit<CommunicationEntry, 'id' | 'createdAt'>): Promise<CommunicationEntry> {
    await delay(300);
    const newEntry: CommunicationEntry = {
      ...data,
      id: 'comm' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    communicationHistory.push(newEntry);
    return newEntry;
  },
};

// Client documents have only the URI to materialize; their `type` is a domain
// label (id-card, passport, …) so we infer the binary kind from the file ext.
// The hint passes both the doc's domain type and its name so a doc named
// "Punomocje - …" or typed "power-of-attorney" lands on the Punomocje template.
async function materializeClientDoc(doc: ClientDocument): Promise<ClientDocument> {
  const ext = doc.uri.toLowerCase().split('.').pop() ?? '';
  const kind: 'pdf' | 'image' | 'word' | 'text' | 'other' =
    ext === 'pdf' ? 'pdf'
    : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'heif'].includes(ext) ? 'image'
    : ext === 'doc' || ext === 'docx' ? 'word'
    : ext === 'txt' || ext === 'rtf' ? 'text'
    : 'pdf';
  const hint = `${doc.type} ${doc.name}`;
  const realUri = await resolveMockUri(doc.uri, kind, hint);
  return realUri === doc.uri ? doc : { ...doc, uri: realUri };
}

const mockClientDocumentService: IClientDocumentService = {
  async getByClientId(clientId: string): Promise<ClientDocument[]> {
    await delay(300);
    const filtered = clientDocuments.filter((d) => d.clientId === clientId);
    return Promise.all(filtered.map(materializeClientDoc));
  },

  async create(data: Omit<ClientDocument, 'id' | 'createdAt'>): Promise<ClientDocument> {
    await delay(300);
    const newDoc: ClientDocument = {
      ...data,
      id: 'cdoc' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    clientDocuments.push(newDoc);
    return newDoc;
  },

  async delete(id: string): Promise<boolean> {
    await delay(300);
    const index = clientDocuments.findIndex((d) => d.id === id);
    if (index === -1) return false;
    clientDocuments.splice(index, 1);
    return true;
  },
};

const mockSearchService: ISearchService = {
  async getSavedSearches(): Promise<SavedSearch[]> {
    await delay(300);
    return [...savedSearches];
  },

  async saveSearch(search: Omit<SavedSearch, 'id' | 'createdAt'>): Promise<SavedSearch> {
    await delay(300);
    const newSearch: SavedSearch = {
      ...search,
      id: 'ss' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    savedSearches.push(newSearch);
    return newSearch;
  },

  async deleteSavedSearch(id: string): Promise<void> {
    await delay(300);
    const index = savedSearches.findIndex((s) => s.id === id);
    if (index !== -1) {
      savedSearches.splice(index, 1);
    }
  },

  async getSearchHistory(): Promise<SearchHistoryEntry[]> {
    await delay(300);
    return [...searchHistory].sort(
      (a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime(),
    );
  },

  async addToHistory(entry: Omit<SearchHistoryEntry, 'id'>): Promise<SearchHistoryEntry> {
    await delay(200);
    const newEntry: SearchHistoryEntry = {
      ...entry,
      id: 'sh' + Date.now(),
    };
    searchHistory.push(newEntry);
    return newEntry;
  },

  async clearHistory(): Promise<void> {
    await delay(200);
    searchHistory = [];
  },
};

const mockBillingService: IBillingService = {
  async getInvoices(): Promise<Invoice[]> {
    await delay(400);
    return [...invoices];
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    await delay(300);
    return invoices.find((inv) => inv.id === id) ?? null;
  },

  async getInvoicesByCaseId(caseId: string): Promise<Invoice[]> {
    await delay(300);
    return invoices.filter((inv) => inv.caseId === caseId);
  },

  async getInvoicesByClientId(clientId: string): Promise<Invoice[]> {
    await delay(300);
    return invoices.filter((inv) => inv.clientId === clientId);
  },

  async createInvoice(data: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
    await delay(300);
    const newInvoice: Invoice = {
      ...data,
      id: 'inv' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    invoices.push(newInvoice);
    return newInvoice;
  },

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice | null> {
    await delay(300);
    const index = invoices.findIndex((inv) => inv.id === id);
    if (index === -1) return null;
    invoices[index] = { ...invoices[index], status };
    return invoices[index];
  },

  async addPayment(invoiceId: string, data: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    await delay(300);
    const newPayment: Payment = {
      ...data,
      id: 'pay' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    const index = invoices.findIndex((inv) => inv.id === invoiceId);
    if (index !== -1) {
      invoices[index].payments.push(newPayment);
      invoices[index].paidAmount += newPayment.amount;
      if (invoices[index].paidAmount >= invoices[index].total) {
        invoices[index].status = 'paid';
      } else if (invoices[index].paidAmount > 0) {
        invoices[index].status = 'partially-paid';
      }
    }
    return newPayment;
  },

  async getOutstandingByClient(): Promise<Array<{ clientId: string; clientName: string; outstandingByCurrency: Partial<Record<Currency, number>>; totalOutstanding: number; invoiceCount: number }>> {
    await delay(300);

    // Items already on some invoice — won't be double-counted as unbilled work.
    const billed = new Set<string>();
    for (const inv of invoices) {
      for (const li of inv.lineItems) {
        if (li.type === 'time-entry' || li.type === 'expense') billed.add(li.referenceId);
      }
    }

    type Row = { clientId: string; clientName: string; outstandingByCurrency: Partial<Record<Currency, number>>; totalOutstanding: number; invoiceCount: number };
    const map = new Map<string, Row>();
    const ensure = (clientId: string, clientName: string): Row => {
      let entry = map.get(clientId);
      if (!entry) {
        entry = { clientId, clientName, outstandingByCurrency: {}, totalOutstanding: 0, invoiceCount: 0 };
        map.set(clientId, entry);
      }
      return entry;
    };
    const addAmount = (row: Row, currency: Currency, amount: number) => {
      row.outstandingByCurrency[currency] = (row.outstandingByCurrency[currency] ?? 0) + amount;
    };

    // 1) Outstanding from invoices (every non-paid invoice). Invoices are
    //    stored in RSD on this app — foreign-currency line items get
    //    converted to RSD at create time using the user-entered rates.
    for (const inv of invoices) {
      if (inv.status === 'paid') continue;
      const outstanding = inv.total - inv.paidAmount;
      if (outstanding <= 0) continue;
      const e = ensure(inv.clientId, inv.clientName);
      addAmount(e, DEFAULT_CURRENCY, outstanding);
      e.invoiceCount += 1;
    }

    // 2) Unbilled billable work — kept in its native currency (RSD / EUR / USD /
    //    CHF). We never sum across currencies; the UI renders one line per
    //    bucket. Falling back to RSD when a row has no explicit currency.
    for (const cs of cases) {
      const buckets: Partial<Record<Currency, number>> = {};
      for (const te of timeEntries) {
        if (te.caseId !== cs.id) continue;
        if (!te.billable || !te.amount || te.amount <= 0) continue;
        if (billed.has(te.id)) continue;
        const cur = te.currency ?? DEFAULT_CURRENCY;
        buckets[cur] = (buckets[cur] ?? 0) + te.amount;
      }
      for (const ex of expenses) {
        if (ex.caseId !== cs.id) continue;
        if (billed.has(ex.id)) continue;
        const cur = ex.currency ?? DEFAULT_CURRENCY;
        buckets[cur] = (buckets[cur] ?? 0) + ex.amount;
      }
      const hasAny = Object.values(buckets).some((v) => (v ?? 0) > 0);
      if (!hasAny) continue;
      const e = ensure(cs.clientId, cs.clientName);
      for (const [cur, amt] of Object.entries(buckets) as [Currency, number][]) {
        if (amt > 0) addAmount(e, cur, amt);
      }
    }

    // `totalOutstanding` is a fallback for callers that just need a number;
    // it intentionally exposes only the RSD bucket so we never mix currencies.
    for (const row of map.values()) {
      row.totalOutstanding = row.outstandingByCurrency[DEFAULT_CURRENCY] ?? 0;
    }

    return Array.from(map.values());
  },

  async getOutstandingByCase(): Promise<Array<{ caseId: string; caseName: string; caseNumber: string; clientName: string; outstandingByCurrency: Partial<Record<Currency, number>>; totalOutstanding: number; invoiceCount: number }>> {
    await delay(300);

    const billed = new Set<string>();
    for (const inv of invoices) {
      for (const li of inv.lineItems) {
        if (li.type === 'time-entry' || li.type === 'expense') billed.add(li.referenceId);
      }
    }

    type Row = { caseId: string; caseName: string; caseNumber: string; clientName: string; outstandingByCurrency: Partial<Record<Currency, number>>; totalOutstanding: number; invoiceCount: number };
    const map = new Map<string, Row>();
    const ensure = (caseId: string, caseName: string, caseNumber: string, clientName: string): Row => {
      let entry = map.get(caseId);
      if (!entry) {
        entry = { caseId, caseName, caseNumber, clientName, outstandingByCurrency: {}, totalOutstanding: 0, invoiceCount: 0 };
        map.set(caseId, entry);
      }
      return entry;
    };
    const addAmount = (row: Row, currency: Currency, amount: number) => {
      row.outstandingByCurrency[currency] = (row.outstandingByCurrency[currency] ?? 0) + amount;
    };

    for (const inv of invoices) {
      if (inv.status === 'paid') continue;
      const outstanding = inv.total - inv.paidAmount;
      if (outstanding <= 0) continue;
      const caseData = cases.find((c) => c.id === inv.caseId);
      const caseNumber = caseData?.caseNumber ?? '';
      const e = ensure(inv.caseId, inv.caseName, caseNumber, inv.clientName);
      addAmount(e, DEFAULT_CURRENCY, outstanding);
      e.invoiceCount += 1;
    }

    for (const cs of cases) {
      const buckets: Partial<Record<Currency, number>> = {};
      for (const te of timeEntries) {
        if (te.caseId !== cs.id) continue;
        if (!te.billable || !te.amount || te.amount <= 0) continue;
        if (billed.has(te.id)) continue;
        const cur = te.currency ?? DEFAULT_CURRENCY;
        buckets[cur] = (buckets[cur] ?? 0) + te.amount;
      }
      for (const ex of expenses) {
        if (ex.caseId !== cs.id) continue;
        if (billed.has(ex.id)) continue;
        const cur = ex.currency ?? DEFAULT_CURRENCY;
        buckets[cur] = (buckets[cur] ?? 0) + ex.amount;
      }
      const hasAny = Object.values(buckets).some((v) => (v ?? 0) > 0);
      if (!hasAny) continue;
      const e = ensure(cs.id, cs.title, cs.caseNumber, cs.clientName);
      for (const [cur, amt] of Object.entries(buckets) as [Currency, number][]) {
        if (amt > 0) addAmount(e, cur, amt);
      }
    }

    for (const row of map.values()) {
      row.totalOutstanding = row.outstandingByCurrency[DEFAULT_CURRENCY] ?? 0;
    }

    return Array.from(map.values());
  },
};

const mockReportService: IReportService = {
  async getFinancialSummary(): Promise<FinancialSummary> {
    await delay(300);
    let totalRevenue = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let invoiceCount = 0;
    let overdueCount = 0;

    for (const inv of invoices) {
      totalRevenue += inv.total;
      totalCollected += inv.paidAmount;
      if (inv.status !== 'draft') {
        totalOutstanding += inv.total - inv.paidAmount;
      }
      invoiceCount += 1;
      if (inv.status === 'overdue') {
        overdueCount += 1;
      }
    }

    return { totalRevenue, totalCollected, totalOutstanding, invoiceCount, overdueCount };
  },

  async getMonthlyRevenue(months: number = 6): Promise<MonthlyRevenue[]> {
    await delay(300);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result: MonthlyRevenue[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = monthNames[d.getMonth()];
      let revenue = 0;

      for (const inv of invoices) {
        const issuedMonth = inv.issuedDate.substring(0, 7);
        if (issuedMonth === monthKey) {
          revenue += inv.total;
        }
      }

      result.push({ month: monthKey, label, revenue });
    }

    return result;
  },

  async getRevenueByMode(): Promise<RevenueByMode[]> {
    await delay(300);
    const map = new Map<BillingMode, { total: number; count: number }>();

    for (const inv of invoices) {
      const existing = map.get(inv.billingMode);
      if (existing) {
        existing.total += inv.total;
        existing.count += 1;
      } else {
        map.set(inv.billingMode, { total: inv.total, count: 1 });
      }
    }

    return Array.from(map.entries()).map(([mode, data]) => ({
      mode,
      total: data.total,
      count: data.count,
    }));
  },

  async getTopClients(limit: number = 5): Promise<TopClient[]> {
    await delay(300);
    const map = new Map<string, TopClient>();

    for (const inv of invoices) {
      const existing = map.get(inv.clientId);
      if (existing) {
        existing.totalBilled += inv.total;
        existing.invoiceCount += 1;
      } else {
        map.set(inv.clientId, {
          clientId: inv.clientId,
          clientName: inv.clientName,
          totalBilled: inv.total,
          invoiceCount: 1,
        });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.totalBilled - a.totalBilled)
      .slice(0, limit);
  },

  async getCaseStatusBreakdown(): Promise<CaseStatusBreakdown[]> {
    await delay(300);
    const map = new Map<CaseStatus, number>();

    for (const c of cases) {
      map.set(c.status, (map.get(c.status) ?? 0) + 1);
    }

    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  },

  async getCaseTypeBreakdown(): Promise<CaseTypeBreakdown[]> {
    await delay(300);
    const map = new Map<CaseType, number>();

    for (const c of cases) {
      map.set(c.caseType, (map.get(c.caseType) ?? 0) + 1);
    }

    return Array.from(map.entries()).map(([caseType, count]) => ({ caseType, count }));
  },

  async getUpcomingDeadlines(days: number = 30): Promise<UpcomingDeadline[]> {
    await delay(300);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    return calendarEvents
      .filter((e) => {
        if (e.type !== 'deadline') return false;
        const eventDate = new Date(e.date);
        return eventDate >= today && eventDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((e) => ({
        eventId: e.id,
        title: e.title,
        date: e.date,
        caseId: e.caseId,
        caseName: e.caseName,
      }));
  },

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    await delay(300);
    const totalCases = cases.length;
    const activeCases = cases.filter((c) => c.status === 'active').length;
    const closedCases = cases.filter((c) => c.status === 'closed' || c.status === 'archived').length;
    const closureRate = totalCases > 0 ? (closedCases / totalCases) * 100 : 0;

    // Average case duration (days) for closed/archived cases
    let totalDuration = 0;
    let closedCount = 0;
    for (const c of cases) {
      if (c.status === 'closed' || c.status === 'archived') {
        const created = new Date(c.createdAt);
        const updated = c.updatedAt ? new Date(c.updatedAt) : new Date();
        const durationDays = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        totalDuration += durationDays;
        closedCount += 1;
      }
    }
    const averageCaseDuration = closedCount > 0 ? Math.round(totalDuration / closedCount) : 0;

    // Cases by lawyer
    const lawyerMap = new Map<string, { lawyerId: string; lawyerName: string; caseCount: number }>();
    for (const c of cases) {
      if (c.lawyerId && c.lawyerName) {
        const existing = lawyerMap.get(c.lawyerId);
        if (existing) {
          existing.caseCount += 1;
        } else {
          lawyerMap.set(c.lawyerId, {
            lawyerId: c.lawyerId,
            lawyerName: c.lawyerName,
            caseCount: 1,
          });
        }
      }
    }

    return {
      totalCases,
      activeCases,
      closedCases,
      closureRate,
      averageCaseDuration,
      casesByLawyer: Array.from(lawyerMap.values()),
    };
  },
};

const mockClientAggregationService: IClientAggregationService = {
  async getRecentActivity(clientId: string, limit: number = 20): Promise<ClientActivity[]> {
    await delay(300);
    const clientCases = cases.filter((c) => c.clientId === clientId);
    const activities: ClientActivity[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const cs of clientCases) {
      // Case notes
      const notes = caseNotes.filter((n) => n.caseId === cs.id);
      for (const note of notes) {
        activities.push({
          id: `act-note-${note.id}`,
          type: 'note',
          title: note.type === 'voice' ? 'Voice Note' : (note.content?.substring(0, 50) ?? 'Note'),
          description: note.content?.substring(0, 100),
          date: note.createdAt,
          caseId: cs.id,
          caseName: cs.title,
          caseNumber: cs.caseNumber,
          icon: ACTIVITY_TYPE_ICONS['note'],
        });
      }

      // Past calendar events (date < today)
      const pastEvents = calendarEvents.filter((e) => e.caseId === cs.id && e.date < today);
      for (const evt of pastEvents) {
        activities.push({
          id: `act-event-${evt.id}`,
          type: 'event',
          title: evt.title,
          description: evt.notes,
          date: evt.date,
          caseId: cs.id,
          caseName: cs.title,
          caseNumber: cs.caseNumber,
          icon: ACTIVITY_TYPE_ICONS['event'],
        });
      }

      // Documents
      const docs = documents.filter((d) => d.caseId === cs.id);
      for (const doc of docs) {
        activities.push({
          id: `act-doc-${doc.id}`,
          type: 'document',
          title: doc.name,
          date: doc.createdAt,
          caseId: cs.id,
          caseName: cs.title,
          caseNumber: cs.caseNumber,
          icon: ACTIVITY_TYPE_ICONS['document'],
        });
      }

      // Time entries
      const entries = timeEntries.filter((t) => t.caseId === cs.id);
      for (const te of entries) {
        activities.push({
          id: `act-te-${te.id}`,
          type: 'time-entry',
          title: te.description,
          date: te.date,
          caseId: cs.id,
          caseName: cs.title,
          caseNumber: cs.caseNumber,
          icon: ACTIVITY_TYPE_ICONS['time-entry'],
          metadata: { hours: te.hours },
        });
      }

      // Payments from invoices
      const caseInvoices = invoices.filter((inv) => inv.caseId === cs.id);
      for (const inv of caseInvoices) {
        for (const pay of inv.payments) {
          activities.push({
            id: `act-pay-${pay.id}`,
            type: 'payment',
            title: `Payment - ${inv.invoiceNumber}`,
            date: pay.date,
            caseId: cs.id,
            caseName: cs.title,
            caseNumber: cs.caseNumber,
            icon: ACTIVITY_TYPE_ICONS['payment'],
            metadata: { amount: pay.amount },
          });
        }
      }
    }

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return activities.slice(0, limit);
  },

  async getUpcomingActivity(clientId: string, limit: number = 20): Promise<ClientActivity[]> {
    await delay(300);
    const clientCases = cases.filter((c) => c.clientId === clientId);
    const activities: ClientActivity[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const cs of clientCases) {
      const upcomingEvents = calendarEvents.filter((e) => e.caseId === cs.id && e.date >= today);
      for (const evt of upcomingEvents) {
        activities.push({
          id: `act-upcoming-${evt.id}`,
          type: 'event',
          title: evt.title,
          description: evt.notes,
          date: evt.date,
          caseId: cs.id,
          caseName: cs.title,
          caseNumber: cs.caseNumber,
          icon: ACTIVITY_TYPE_ICONS['event'],
          eventId: evt.id,
        });
      }
    }

    // Sort by date ascending
    activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return activities.slice(0, limit);
  },

  async getExpenses(clientId: string): Promise<ClientExpenseItem[]> {
    await delay(300);
    const clientCases = cases.filter((c) => c.clientId === clientId);
    const items: ClientExpenseItem[] = [];

    for (const cs of clientCases) {
      // Time entries
      const entries = timeEntries.filter((t) => t.caseId === cs.id);
      for (const te of entries) {
        items.push({
          id: `cexp-te-${te.id}`,
          type: 'time-entry',
          description: te.description,
          amount: te.amount ?? te.hours * 100, // placeholder rate
          currency: te.currency,
          date: te.date,
          caseId: cs.id,
          caseName: cs.title,
          caseNumber: cs.caseNumber,
          hours: te.hours,
          paid: te.paid ?? false,
        });
      }

      // Expenses
      const caseExpenses = expenses.filter((e) => e.caseId === cs.id);
      for (const exp of caseExpenses) {
        items.push({
          id: `cexp-exp-${exp.id}`,
          type: 'expense',
          description: exp.description,
          amount: exp.amount,
          currency: exp.currency,
          date: exp.date,
          caseId: cs.id,
          caseName: cs.title,
          caseNumber: cs.caseNumber,
          category: exp.category,
          paid: exp.paid ?? false,
        });
      }
    }

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  },

  async getOutstandingSummary(clientId: string): Promise<ClientOutstandingSummary> {
    await delay(300);
    const clientInvoices = invoices.filter((inv) => inv.clientId === clientId);
    let totalOutstanding = 0;
    const outstandingInvoices: ClientOutstandingSummary['invoices'] = [];

    for (const inv of clientInvoices) {
      const outstanding = inv.total - inv.paidAmount;
      if (outstanding > 0 && inv.status !== 'draft') {
        totalOutstanding += outstanding;
        const cs = cases.find((c) => c.id === inv.caseId);
        outstandingInvoices.push({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          caseId: inv.caseId,
          caseName: inv.caseName,
          total: inv.total,
          paidAmount: inv.paidAmount,
          outstanding,
          status: inv.status,
          issuedDate: inv.issuedDate,
          dueDate: inv.dueDate,
        });
      }
    }

    return { totalOutstanding, invoices: outstandingInvoices };
  },
};

// Document templates — firm-wide reusable skeletons. Materialize the URI so
// templates open the right kind of file (RTF/text) when tapped.
async function materializeTemplate(tpl: DocumentTemplate): Promise<DocumentTemplate> {
  const kind = tpl.type === 'word' ? 'word' : 'text';
  const realUri = await resolveMockUri(tpl.uri, kind, `${tpl.category} ${tpl.name}`);
  return realUri === tpl.uri ? tpl : { ...tpl, uri: realUri };
}

const mockDocumentTemplateService: IDocumentTemplateService = {
  async getAll(): Promise<DocumentTemplate[]> {
    await delay(300);
    return Promise.all(documentTemplates.map(materializeTemplate));
  },
  async create(data: Omit<DocumentTemplate, 'id' | 'createdAt'>): Promise<DocumentTemplate> {
    await delay(300);
    const newTpl: DocumentTemplate = {
      ...data,
      id: 'tpl' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    documentTemplates.push(newTpl);
    return newTpl;
  },
  async delete(id: string): Promise<boolean> {
    await delay(200);
    const i = documentTemplates.findIndex((t) => t.id === id);
    if (i === -1) return false;
    documentTemplates.splice(i, 1);
    return true;
  },
};

export const mockServices: ServiceRegistry = {
  users: mockUserService,
  clients: mockClientService,
  cases: mockCaseService,
  directory: mockDirectoryService,
  documents: mockDocumentService,
  calendarEvents: mockCalendarEventService,
  notifications: mockNotificationService,
  caseNotes: mockCaseNoteService,
  timeEntries: mockTimeEntryService,
  expenses: mockExpenseService,
  caseLinks: mockCaseLinkService,
  communications: mockCommunicationService,
  clientDocuments: mockClientDocumentService,
  search: mockSearchService,
  billing: mockBillingService,
  reports: mockReportService,
  clientAggregation: mockClientAggregationService,
  documentTemplates: mockDocumentTemplateService,
};
