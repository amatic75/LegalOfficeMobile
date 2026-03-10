import type {
  ServiceRegistry,
  IUserService,
  IClientService,
  ICaseService,
  ICourtService,
  User,
  Client,
  CaseSummary,
  Court,
} from '../types';
import { delay } from '../../utils/delay';
import { mockUsers } from './data/users';
import { mockClients } from './data/clients';
import { mockCases } from './data/cases';
import { mockCourts } from './data/courts';

const mockUserService: IUserService = {
  async getCurrentUser(): Promise<User> {
    await delay(300);
    return mockUsers[0];
  },
};

const mockClientService: IClientService = {
  async getClients(): Promise<Client[]> {
    await delay(400);
    return mockClients;
  },

  async getClientCount(): Promise<number> {
    await delay(200);
    return mockClients.length;
  },

  async getClientById(id: string): Promise<Client | null> {
    await delay(300);
    return mockClients.find((c) => c.id === id) ?? null;
  },
};

const mockCaseService: ICaseService = {
  async getRecentCases(limit: number): Promise<CaseSummary[]> {
    await delay(400);
    const sorted = [...mockCases].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return sorted.slice(0, limit);
  },

  async getCaseCount(): Promise<number> {
    await delay(200);
    return mockCases.length;
  },

  async getCaseById(id: string): Promise<CaseSummary | null> {
    await delay(300);
    return mockCases.find((c) => c.id === id) ?? null;
  },

  async getCasesByClientId(clientId: string): Promise<CaseSummary[]> {
    await delay(400);
    return mockCases.filter((c) => c.clientId === clientId);
  },
};

const mockCourtService: ICourtService = {
  async getCourts(): Promise<Court[]> {
    await delay(200);
    return mockCourts;
  },
};

export const mockServices: ServiceRegistry = {
  users: mockUserService,
  clients: mockClientService,
  cases: mockCaseService,
  courts: mockCourtService,
};
