// src/components/Sidebar/SearchBar.tsx
import React from 'react';
import { useFilterStore } from '@/store/filterStore';
import { Search, Braces } from 'lucide-react';

export const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, isRegex, setRegex } = useFilterStore();

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="text"
          placeholder="Search message, tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
      </div>
      
      <button
        onClick={() => setRegex(!isRegex)}
        className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-all ${
          isRegex
            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
            : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-400'
        }`}
      >
        <Braces className="w-3 h-3" />
        Regular Expression
      </button>
    </div>
  );
};
