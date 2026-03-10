// Data Types

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'lawyer' | 'trainee' | 'paralegal' | 'accountant' | 'staff';
  avatarUrl?: string;
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
  createdAt: string;
}

export type CaseStatus = 'new' | 'active' | 'pending' | 'closed' | 'archived';

export type CaseType = 'civil' | 'criminal' | 'family' | 'corporate';

export interface CaseSummary {
  id: string;
  caseNumber: string;
  title: string;
  clientName: string;
  clientId: string;
  status: CaseStatus;
  caseType: CaseType;
  court?: string;
  nextHearing?: string;
  createdAt: string;
}

export interface Court {
  id: string;
  name: string;
  address: string;
  city: string;
}

// Service Interfaces

export interface IUserService {
  getCurrentUser(): Promise<User>;
}

export interface IClientService {
  getClients(): Promise<Client[]>;
  getClientCount(): Promise<number>;
  getClientById(id: string): Promise<Client | null>;
}

export interface ICaseService {
  getRecentCases(limit: number): Promise<CaseSummary[]>;
  getCaseCount(): Promise<number>;
  getCaseById(id: string): Promise<CaseSummary | null>;
  getCasesByClientId(clientId: string): Promise<CaseSummary[]>;
}

export interface ICourtService {
  getCourts(): Promise<Court[]>;
}

export interface ServiceRegistry {
  users: IUserService;
  clients: IClientService;
  cases: ICaseService;
  courts: ICourtService;
}
