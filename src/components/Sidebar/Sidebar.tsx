// src/components/Sidebar/Sidebar.tsx
import React from 'react';
import { DeviceSelector } from './DeviceSelector';
import { LevelFilter } from './LevelFilter';
import { PackageFilter } from './PackageFilter';
import { SearchBar } from './SearchBar';
import { AppCockpit } from './AppCockpit';
import { Layout, Filter, Cpu, Search } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 flex flex-col bg-[#0f172a]/40 p-4 gap-6 select-none overflow-y-auto">
      <section>
        <div className="flex items-center gap-2 mb-3 text-slate-400">
          <Cpu className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-widest">Devices</h2>
        </div>
        <DeviceSelector />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3 text-slate-400">
          <Filter className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-widest">Priority Levels</h2>
        </div>
        <LevelFilter />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3 text-slate-400">
          <Layout className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-widest">Scope</h2>
        </div>
        <PackageFilter />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3 text-slate-400">
          <Search className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-widest">Query</h2>
        </div>
        <SearchBar />
      </section>

      <AppCockpit />
    </aside>
  );
};
