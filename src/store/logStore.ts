// src/store/logStore.ts
import { create } from 'zustand';
import { LogEntry } from '@/types';

interface LogState {
  logs: LogEntry[];
  isPaused: boolean;
  maxLogs: number;
  zoomLevel: number; // 1 to 4, default 2
  addLog: (entry: LogEntry) => void;
  addLogs: (entries: LogEntry[]) => void;
  clearLogs: () => void;
  setPaused: (paused: boolean) => void;
  setMaxLogs: (max: number) => void;
  setZoomLevel: (level: number) => void;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  isPaused: false,
  maxLogs: 50000,
  zoomLevel: 2,

  addLog: (entry) => set((state) => {
    if (state.isPaused) return state;
    
    const newLogs = [...state.logs, entry];
    if (newLogs.length > state.maxLogs) {
      return { logs: newLogs.slice(newLogs.length - state.maxLogs) };
    }
    return { logs: newLogs };
  }),

  addLogs: (entries) => set((state) => {
    if (state.isPaused || entries.length === 0) return state;
    
    const newLogs = [...state.logs, ...entries];
    if (newLogs.length > state.maxLogs) {
      return { logs: newLogs.slice(newLogs.length - state.maxLogs) };
    }
    return { logs: newLogs };
  }),

  clearLogs: () => set({ logs: [] }),
  setPaused: (paused) => set({ isPaused: paused }),
  setMaxLogs: (max) => set({ maxLogs: max }),
  setZoomLevel: (level) => set({ zoomLevel: Math.max(1, Math.min(4, level)) }),
}));
