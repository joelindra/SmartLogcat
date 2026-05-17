// src/store/filterStore.ts
import { create } from 'zustand';
import { LogLevel } from '@/types';

export interface TriggerRule {
  id: string;
  pattern: string;
  isRegex: boolean;
  notify: boolean;
  sound: boolean;
  highlight: boolean;
  color: string;
  active: boolean;
}

interface FilterState {
  levels: Set<LogLevel>;
  searchQuery: string;
  isRegex: boolean;
  packageName: string;
  packagePids: number[];
  timeRangeFilter: { start: number; end: number } | null;
  triggerRules: TriggerRule[];
  toggleLevel: (level: LogLevel) => void;
  setSearchQuery: (query: string) => void;
  setRegex: (isRegex: boolean) => void;
  setPackageName: (name: string) => void;
  setPackagePids: (pids: number[]) => void;
  setTimeRangeFilter: (filter: { start: number; end: number } | null) => void;
  addTriggerRule: (rule: Omit<TriggerRule, 'id'>) => void;
  removeTriggerRule: (id: string) => void;
  toggleTriggerRule: (id: string) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  levels: new Set(['V', 'D', 'I', 'W', 'E', 'F']),
  searchQuery: '',
  isRegex: false,
  packageName: '',
  packagePids: [],
  timeRangeFilter: null,
  triggerRules: [
    {
      id: 'rule-1',
      pattern: 'Fatal',
      isRegex: false,
      notify: true,
      sound: true,
      highlight: true,
      color: '#f43f5e', // Neon Rose
      active: true
    },
    {
      id: 'rule-2',
      pattern: 'NullPointerException',
      isRegex: false,
      notify: true,
      sound: true,
      highlight: true,
      color: '#a855f7', // Neon Purple
      active: true
    }
  ],

  toggleLevel: (level) => set((state) => {
    const next = new Set(state.levels);
    if (next.has(level)) next.delete(level);
    else next.add(level);
    return { levels: next };
  }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setRegex: (isRegex) => set({ isRegex: isRegex }),
  setPackageName: (name) => set({ packageName: name }),
  setPackagePids: (pids) => set({ packagePids: pids }),
  setTimeRangeFilter: (filter) => set({ timeRangeFilter: filter }),
  
  addTriggerRule: (rule) => set((state) => ({
    triggerRules: [...state.triggerRules, { ...rule, id: `rule-${Date.now()}` }]
  })),
  
  removeTriggerRule: (id) => set((state) => ({
    triggerRules: state.triggerRules.filter(r => r.id !== id)
  })),
  
  toggleTriggerRule: (id) => set((state) => ({
    triggerRules: state.triggerRules.map(r => r.id === id ? { ...r, active: !r.active } : r)
  })),
}));
