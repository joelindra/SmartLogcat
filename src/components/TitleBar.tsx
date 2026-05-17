// src/components/TitleBar.tsx
import React from 'react';
import { Minus, Square, X, Terminal } from 'lucide-react';

export const TitleBar: React.FC = () => {
  const { electronAPI } = window;

  return (
    <div className="h-10 flex items-center justify-between px-4 bg-[#0f172a] border-b border-white/5 drag">
      <div className="flex items-center gap-2 no-drag">
        <Terminal className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Smart Logcat Viewer
        </span>
      </div>

      <div className="flex items-center h-full no-drag">
        <button
          onClick={() => electronAPI.minimize()}
          className="p-2 hover:bg-white/10 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => electronAPI.maximize()}
          className="p-2 hover:bg-white/10 transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={() => electronAPI.close()}
          className="p-2 hover:bg-red-500/80 transition-colors group"
        >
          <X className="w-4 h-4 group-hover:scale-110" />
        </button>
      </div>
      
      <style>{`
        .drag { -webkit-app-region: drag; }
        .no-drag { -webkit-app-region: no-drag; }
      `}</style>
    </div>
  );
};
