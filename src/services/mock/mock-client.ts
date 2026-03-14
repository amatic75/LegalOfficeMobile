import type {
  ServiceRegistry,
  IUserService,
  IClientService,
  ICaseService,
  ICourtService,
  IDocumentService,
  ICalendarEventService,
  INotificationService,
  ICaseNoteService,
  ITimeEntryService,
  IExpenseService,
  ICaseLinkService,
  User,
  Client,
  CaseSummary,
  CaseStatus,
  Court,
  Document,
  CalendarEvent,
  AppNotification,
  CaseNote,
  TimeEntry,
  Expense,
  CaseLink,
  CaseLinkType,
} from '../types';
import { delay } from '../../utils/delay';
import { mockUsers } from './data/users';
import { mockClients } from './data/clients';
import { mockCases } from './data/cases';
import { mockCourts } from './data/courts';
import { mockDocuments } from './data/documents';
import { mockCalendarEvents } from './data/calendar-events';
import { mockNotifications } from './data/notifications';
import { mockCaseNotes } from './data/case-notes';
import { mockTimeEntries } from './data/time-entries';
import { mockExpenses } from './data/expenses';
import { mockCaseLinks } from './data/case-links';

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

const mockCourtService: ICourtService = {
  async getCourts(): Promise<Court[]> {
    await delay(200);
    return mockCourts;
  },
};

const mockDocumentService: IDocumentService = {
  async getDocumentsByCaseId(caseId: string): Promise<Document[]> {
    await delay(300);
    return documents.filter((d) => d.caseId === caseId);
  },

  async getDocumentById(id: string): Promise<Document | null> {
    await delay(300);
    return documents.find((d) => d.id === id) ?? null;
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
};

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

export const mockServices: ServiceRegistry = {
  users: mockUserService,
  clients: mockClientService,
  cases: mockCaseService,
  courts: mockCourtService,
  documents: mockDocumentService,
  calendarEvents: mockCalendarEventService,
  notifications: mockNotificationService,
  caseNotes: mockCaseNoteService,
  timeEntries: mockTimeEntryService,
  expenses: mockExpenseService,
  caseLinks: mockCaseLinkService,
};
