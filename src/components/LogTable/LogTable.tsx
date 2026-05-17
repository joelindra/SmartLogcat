// src/components/LogTable/LogTable.tsx
import React, { useRef, useEffect, useState } from 'react';
import { List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { LogRow } from './LogRow';
import { useFilter } from '@/hooks/useFilter';
import { useLogStore } from '@/store/logStore';
import { 
  ZoomIn, ZoomOut, RotateCcw, X, Copy, 
  Terminal, ShieldAlert, Calendar, Hash, Tag
} from 'lucide-react';
import { LogEntry } from '@/types';

export const LogTable: React.FC = () => {
  const filteredLogs = useFilter();
  const listRef = useRef<any>(null);
  const isPaused = useLogStore((state) => state.isPaused);
  const { zoomLevel, setZoomLevel } = useLogStore();

  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Auto-scroll to bottom when new logs arrive, unless paused
  useEffect(() => {
    if (!isPaused && listRef.current && filteredLogs.length > 0) {
      listRef.current.scrollToRow({ index: filteredLogs.length - 1, align: 'end' });
    }
  }, [filteredLogs.length, isPaused]);

  // Dynamic row height based on zoom
  const rowHeight = 
    zoomLevel === 1 ? 20 :
    zoomLevel === 2 ? 24 :
    zoomLevel === 3 ? 28 : 32;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Log message copied to clipboard!');
  };

  const getZoomPercentage = () => {
    if (zoomLevel === 1) return '85%';
    if (zoomLevel === 2) return '100%';
    if (zoomLevel === 3) return '120%';
    return '140%';
  };

  const LEVEL_BADGES = {
    V: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    D: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    I: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    W: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    E: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    F: 'bg-red-500/30 text-red-200 border-red-500/40 font-bold animate-pulse',
  };

  return (
    <div className="w-full h-full bg-[#0a0a0f] font-mono text-[13px] relative overflow-hidden">
      {/* Premium Floating Zoom Controls */}
      <div className="absolute top-4 right-6 flex items-center gap-1.5 p-1 rounded-xl bg-[#0f172a]/90 backdrop-blur-md border border-white/5 shadow-2xl z-40 select-none">
        <button
          onClick={() => setZoomLevel(zoomLevel - 1)}
          disabled={zoomLevel === 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-bold text-slate-400 min-w-[36px] text-center font-sans tracking-tight">
          {getZoomPercentage()}
        </span>
        <button
          onClick={() => setZoomLevel(zoomLevel + 1)}
          disabled={zoomLevel === 4}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3.5 bg-white/5 mx-0.5" />
        <button
          onClick={() => setZoomLevel(2)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <AutoSizer
        renderProp={({ height, width }: { height: number | undefined; width: number | undefined }) => {
          if (height === undefined || width === undefined) return null;
          return (
            <List
              listRef={listRef}
              rowCount={filteredLogs.length}
              rowHeight={rowHeight}
              rowComponent={LogRow as any}
              rowProps={{ 
                data: filteredLogs, 
                zoomLevel,
                onRowClick: setSelectedLog 
              } as any}
              style={{ height, width }}
              className="scrollbar-hide"
            />
          );
        }}
      />

      {/* Premium Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/5 relative">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border rounded ${LEVEL_BADGES[selectedLog.level] || ''}`}>
                  {selectedLog.level}
                </span>
                <span className="font-semibold text-slate-200 truncate max-w-[320px]">
                  {selectedLog.tag}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                  <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Timestamp</div>
                    <div className="text-xs font-mono text-slate-300 truncate">{selectedLog.timestamp}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                  <Hash className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PID (Process ID)</div>
                    <div className="text-xs font-mono text-slate-300">{selectedLog.pid}</div>
                  </div>
                </div>
              </div>

              {/* Smart Category Alert */}
              {selectedLog.smartCategory && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                      Smart Classification: {selectedLog.smartCategory.name}
                    </div>
                    <div className="text-[11px] text-rose-200/70 mt-0.5 leading-relaxed">
                      AI identified this log entry as a classified issue. Pay close attention to the stack trace or exceptions printed in the payload.
                    </div>
                  </div>
                </div>
              )}

              {/* Message Codebox */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  Payload Message
                </div>
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 overflow-auto max-h-[35vh] font-mono text-xs text-slate-300 whitespace-pre-wrap select-text leading-relaxed scrollbar-thin">
                  {selectedLog.message}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-white/[0.02] border-t border-white/5">
              <button
                onClick={() => handleCopy(selectedLog.message)}
                className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Payload
              </button>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs active:scale-95 transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
