import type {
  ServiceRegistry,
  IUserService,
  IClientService,
  ICaseService,
  ICourtService,
  IDocumentService,
  ICalendarEventService,
  User,
  Client,
  CaseSummary,
  CaseStatus,
  Court,
  Document,
  CalendarEvent,
} from '../types';
import { delay } from '../../utils/delay';
import { mockUsers } from './data/users';
import { mockClients } from './data/clients';
import { mockCases } from './data/cases';
import { mockCourts } from './data/courts';
import { mockDocuments } from './data/documents';
import { mockCalendarEvents } from './data/calendar-events';

// Mutable copies so mutations persist within a session
let clients = [...mockClients];
let cases = [...mockCases];
let documents = [...mockDocuments];
let calendarEvents = [...mockCalendarEvents];

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
};

const mockCalendarEventService: ICalendarEventService = {
  async getEvents(): Promise<CalendarEvent[]> {
    await delay(400);
    return calendarEvents;
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

export const mockServices: ServiceRegistry = {
  users: mockUserService,
  clients: mockClientService,
  cases: mockCaseService,
  courts: mockCourtService,
  documents: mockDocumentService,
  calendarEvents: mockCalendarEventService,
};
