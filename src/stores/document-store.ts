import { create } from 'zustand';

type DocumentFilterType = 'all' | 'pdf' | 'image' | 'word' | 'text';

interface DocumentStoreState {
  filterType: DocumentFilterType;
  setFilterType: (type: DocumentFilterType) => void;
}

export const useDocumentStore = create<DocumentStoreState>()((set) => ({
  filterType: 'all',
  setFilterType: (type: DocumentFilterType) => set({ filterType: type }),
}));
