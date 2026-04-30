import { create } from 'zustand';
import type { CaseStatus, CaseType } from '../services/types';

interface CaseStoreState {
  searchQuery: string;
  statusFilter: CaseStatus | 'all';
  typeFilter: CaseType | 'all';
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: CaseStatus | 'all') => void;
  setTypeFilter: (filter: CaseType | 'all') => void;
  resetFilters: () => void;
}

export const useCaseStore = create<CaseStoreState>()((set) => ({
  searchQuery: '',
  statusFilter: 'all',
  typeFilter: 'all',
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setStatusFilter: (filter: CaseStatus | 'all') => set({ statusFilter: filter }),
  setTypeFilter: (filter: CaseType | 'all') => set({ typeFilter: filter }),
  resetFilters: () => set({ searchQuery: '', statusFilter: 'all', typeFilter: 'all' }),
}));
