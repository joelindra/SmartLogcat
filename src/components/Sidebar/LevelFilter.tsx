// src/components/Sidebar/LevelFilter.tsx
import React from 'react';
import { useFilterStore } from '@/store/filterStore';
import { LogLevel } from '@/types';

const LEVELS: { key: LogLevel; label: string; color: string }[] = [
  { key: 'V', label: 'Verbose', color: 'bg-slate-500' },
  { key: 'D', label: 'Debug', color: 'bg-blue-500' },
  { key: 'I', label: 'Info', color: 'bg-emerald-500' },
  { key: 'W', label: 'Warning', color: 'bg-amber-500' },
  { key: 'E', label: 'Error', color: 'bg-rose-500' },
  { key: 'F', label: 'Fatal', color: 'bg-red-600' },
];

export const LevelFilter: React.FC = () => {
  const { levels, toggleLevel } = useFilterStore();

  return (
    <div className="grid grid-cols-2 gap-2">
      {LEVELS.map((lvl) => {
        const isActive = levels.has(lvl.key);
        return (
          <button
            key={lvl.key}
            onClick={() => toggleLevel(lvl.key)}
            className={`flex items-center gap-2 p-2 text-xs font-medium rounded-md border transition-all ${
              isActive
                ? `${lvl.color} border-transparent text-white shadow-lg`
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : lvl.color}`} />
            {lvl.label}
          </button>
        );
      })}
    </div>
  );
};
