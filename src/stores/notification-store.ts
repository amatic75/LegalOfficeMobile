import { create } from 'zustand';
import type { AppNotification } from '../services/types';
import { mockNotifications } from '../services/mock/data/notifications';

interface NotificationStoreState {
  notifications: AppNotification[];
  setNotifications: (notifications: AppNotification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationStoreState>()((set) => ({
  notifications: [...mockNotifications],
  setNotifications: (notifications: AppNotification[]) => set({ notifications }),
  markAsRead: (id: string) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    })),
}));
