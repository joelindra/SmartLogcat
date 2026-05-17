// src/components/LogTable/LogRow.tsx
import React, { memo } from 'react';
import { LogEntry } from '@/types';
import { AlertCircle, Globe, ChevronRight } from 'lucide-react';
import { useFilterStore } from '@/store/filterStore';

// Custom comparison for react-window memoization
const areEqual = (prev: any, next: any) => 
  prev.style === next.style && 
  prev.data === next.data && 
  prev.index === next.index &&
  prev.zoomLevel === next.zoomLevel &&
  prev.onRowClick === next.onRowClick;

const LEVEL_STYLES = {
  V: 'text-slate-500',
  D: 'text-blue-400',
  I: 'text-emerald-400',
  W: 'text-amber-400 bg-amber-500/10',
  E: 'text-rose-400 bg-rose-500/10 font-medium',
  F: 'text-white bg-red-600/30 font-bold',
};

export const LogRow = memo(({ data, index, style, zoomLevel, onRowClick }: { 
  data: LogEntry[], 
  index: number, 
  style: React.CSSProperties,
  zoomLevel: number,
  onRowClick: (entry: LogEntry) => void
}) => {
  const entry = data[index];
  const levelStyle = LEVEL_STYLES[entry.level] || '';

  // Trigger Highlight Style
  const customStyle = { ...style };
  let highlightClass = '';
  if (entry.ruleMatched) {
    const rules = useFilterStore.getState().triggerRules;
    const rule = rules.find(r => r.id === entry.ruleMatched);
    if (rule && rule.highlight) {
      customStyle.boxShadow = `inset 4px 0 0 ${rule.color}`;
      customStyle.backgroundColor = `${rule.color}15`; // Neon glow tint
      highlightClass = 'font-semibold border-l-4';
    }
  }

  const fontSizeClass = 
    zoomLevel === 1 ? 'text-[11px]' :
    zoomLevel === 2 ? 'text-[13px]' :
    zoomLevel === 3 ? 'text-[15px]' :
    'text-[17px]';

  return (
    <div 
      style={customStyle} 
      onClick={() => onRowClick(entry)}
      className={`group flex items-center px-4 gap-4 border-b border-white/[0.02] hover:bg-white/[0.05] active:bg-white/[0.1] cursor-pointer transition-colors overflow-hidden whitespace-nowrap ${levelStyle} ${fontSizeClass} ${highlightClass}`}
    >
      <span className="w-40 flex-shrink-0 text-[0.85em] opacity-40 font-mono select-none">
        {entry.timestamp}
      </span>
      
      <span className={`w-8 flex-shrink-0 text-center text-[0.75em] font-bold select-none rounded ${levelStyle}`}>
        {entry.level}
      </span>

      <span className="w-32 flex-shrink-0 truncate text-blue-300/60 font-semibold select-none">
        {entry.tag}
      </span>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        {entry.smartCategory && (
          <span className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[0.75em] font-bold uppercase tracking-tighter">
            <AlertCircle className="w-3 h-3" />
            {entry.smartCategory.name}
          </span>
        )}

        {entry.isHttpLog && (
          <span className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[0.75em] font-bold uppercase tracking-tighter">
            <Globe className="w-3 h-3" />
            HTTP
          </span>
        )}

        {entry.isStackTrace && (
          <ChevronRight className="w-3 h-3 text-rose-500 flex-shrink-0" />
        )}

        <span className="truncate">
          {entry.message}
        </span>
      </div>

      <span className="w-12 flex-shrink-0 text-right text-[0.75em] opacity-20 select-none">
        {entry.pid}
      </span>
    </div>
  );
}, areEqual);
