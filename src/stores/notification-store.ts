import { create } from 'zustand';
import type { AppNotification, NotificationPreferences } from '../services/types';
import { mockNotifications } from '../services/mock/data/notifications';

interface NotificationStoreState {
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  activeFilter: 'all' | 'unread' | 'read';
  setNotifications: (notifications: AppNotification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setPreferences: (prefs: NotificationPreferences) => void;
  snoozeNotification: (id: string, until: string) => void;
  markNotificationComplete: (id: string) => void;
  setActiveFilter: (filter: 'all' | 'unread' | 'read') => void;
}

export const useNotificationStore = create<NotificationStoreState>()((set) => ({
  notifications: [...mockNotifications],
  preferences: {
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    deadlineReminders: true,
    caseUpdates: true,
  },
  activeFilter: 'all',
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
  setPreferences: (prefs: NotificationPreferences) =>
    set({ preferences: prefs }),
  snoozeNotification: (id: string, until: string) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, snoozedUntil: until, isRead: true } : n,
      ),
    })),
  markNotificationComplete: (id: string) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true, completed: true } : n,
      ),
    })),
  setActiveFilter: (filter: 'all' | 'unread' | 'read') =>
    set({ activeFilter: filter }),
}));
