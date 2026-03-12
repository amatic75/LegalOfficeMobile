import { create } from 'zustand';

type CalendarViewMode = 'month' | 'week' | 'agenda';

interface CalendarStoreState {
  viewMode: CalendarViewMode;
  selectedDate: string;
  setViewMode: (mode: CalendarViewMode) => void;
  setSelectedDate: (date: string) => void;
}

export const useCalendarStore = create<CalendarStoreState>()((set) => ({
  viewMode: 'month',
  selectedDate: new Date().toISOString().split('T')[0],
  setViewMode: (mode: CalendarViewMode) => set({ viewMode: mode }),
  setSelectedDate: (date: string) => set({ selectedDate: date }),
}));
