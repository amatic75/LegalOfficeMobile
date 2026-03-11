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

export interface ICourtService {
  getCourts(): Promise<Court[]>;
}

export interface Document {
  id: string;
  caseId: string;
  name: string;
  type: 'pdf' | 'image' | 'other';
  mimeType: string;
  size: number;
  uri: string;
  createdAt: string;
}

export interface IDocumentService {
  getDocumentsByCaseId(caseId: string): Promise<Document[]>;
  getDocumentById(id: string): Promise<Document | null>;
  addDocument(data: Omit<Document, 'id' | 'createdAt'>): Promise<Document>;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export const DOC_TYPE_ICONS: Record<Document['type'], { icon: string; color: string }> = {
  pdf: { icon: 'document-text-outline', color: '#E53935' },
  image: { icon: 'image-outline', color: '#43A047' },
  other: { icon: 'document-outline', color: '#757575' },
};

export interface ServiceRegistry {
  users: IUserService;
  clients: IClientService;
  cases: ICaseService;
  courts: ICourtService;
  documents: IDocumentService;
}
