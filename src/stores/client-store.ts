import { create } from 'zustand';

interface ClientStoreState {
  searchQuery: string;
  typeFilter: 'all' | 'individual' | 'corporate';
  setSearchQuery: (query: string) => void;
  setTypeFilter: (filter: 'all' | 'individual' | 'corporate') => void;
  resetFilters: () => void;
}

export const useClientStore = create<ClientStoreState>()((set) => ({
  searchQuery: '',
  typeFilter: 'all',
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setTypeFilter: (filter: 'all' | 'individual' | 'corporate') => set({ typeFilter: filter }),
  resetFilters: () => set({ searchQuery: '', typeFilter: 'all' }),
}));
