import { create } from 'zustand';
import type { User } from '../services/types';

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  currentUser: null,
  isLoading: true,
  loadUser: async () => {
    try {
      // Lazy import to avoid circular dependency
      const { services } = await import('../services/api-client');
      const user = await services.users.getCurrentUser();
      set({ currentUser: user, isLoading: false });
    } catch {
      set({ currentUser: null, isLoading: false });
    }
  },
}));
