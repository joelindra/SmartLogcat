// src/components/LogTable/LogTimeline.tsx
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useLogStore } from '@/store/logStore';
import { useFilterStore } from '@/store/filterStore';
import { X, Clock, RefreshCw } from 'lucide-react';

export const LogTimeline: React.FC = () => {
  const logs = useLogStore((state) => state.logs);
  const { timeRangeFilter, setTimeRangeFilter } = useFilterStore();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dragging/Scrubbing state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPercent, setDragStartPercent] = useState<number | null>(null);
  const [dragEndPercent, setDragEndPercent] = useState<number | null>(null);

  // Helper: parse timestamp MM-DD HH:MM:SS.mmm to Unix epoch ms
  const parseTimestamp = (timestampStr: string): number => {
    try {
      if (timestampStr.includes('T')) return Date.parse(timestampStr);
      const currentYear = new Date().getFullYear();
      const parsed = Date.parse(`${currentYear}-${timestampStr}`);
      return isNaN(parsed) ? Date.now() : parsed;
    } catch {
      return Date.now();
    }
  };

  // Compute logs bounds and bin counts
  const timelineData = useMemo(() => {
    if (logs.length < 5) return null;

    let minTime = Infinity;
    let maxTime = -Infinity;
    
    // Scan logs to find true min and max timestamps
    const logTimes = logs.map((log) => {
      const ms = parseTimestamp(log.timestamp);
      if (ms < minTime) minTime = ms;
      if (ms > maxTime) maxTime = ms;
      return { level: log.level, time: ms };
    });

    // If time span is too small, default
    if (maxTime - minTime < 1000) {
      maxTime = minTime + 1000;
    }

    const totalBins = 40;
    const binWidth = (maxTime - minTime) / totalBins;

    // Initialize bins
    const bins = Array.from({ length: totalBins }, (_, i) => ({
      index: i,
      start: minTime + i * binWidth,
      end: minTime + (i + 1) * binWidth,
      E: 0, // Errors (E + F)
      W: 0, // Warnings
      I: 0, // Info
      D: 0, // Debug
      V: 0, // Verbose
      total: 0
    }));

    // Populate bins
    logTimes.forEach((log) => {
      let binIdx = Math.floor((log.time - minTime) / binWidth);
      if (binIdx >= totalBins) binIdx = totalBins - 1;
      if (binIdx < 0) binIdx = 0;

      const bin = bins[binIdx];
      if (log.level === 'E' || log.level === 'F') bin.E++;
      else if (log.level === 'W') bin.W++;
      else if (log.level === 'I') bin.I++;
      else if (log.level === 'D') bin.D++;
      else bin.V++;
      bin.total++;
    });

    // Find max height of a bin for scaling
    const maxBinCount = Math.max(...bins.map((b) => b.total), 1);

    return {
      bins,
      minTime,
      maxTime,
      maxBinCount,
      totalBins
    };
  }, [logs]);

  // Sync brush selection from store
  useEffect(() => {
    if (!timeRangeFilter || !timelineData) {
      setDragStartPercent(null);
      setDragEndPercent(null);
      return;
    }

    const { minTime, maxTime } = timelineData;
    const range = maxTime - minTime;
    const startP = ((timeRangeFilter.start - minTime) / range) * 100;
    const endP = ((timeRangeFilter.end - minTime) / range) * 100;

    setDragStartPercent(Math.max(0, Math.min(100, startP)));
    setDragEndPercent(Math.max(0, Math.min(100, endP)));
  }, [timeRangeFilter, timelineData]);

  if (!timelineData) {
    return (
      <div className="mx-6 my-2 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center gap-2 text-xs text-slate-400 select-none">
        <Clock className="w-4 h-4 animate-pulse text-indigo-400" />
        Waiting for stream logs to generate timeline chart...
      </div>
    );
  }

  const { bins, minTime, maxTime, maxBinCount, totalBins } = timelineData;

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setIsDragging(true);
    setDragStartPercent(percent);
    setDragEndPercent(percent);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || dragStartPercent === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setDragEndPercent(percent);
  };

  const handleMouseUp = () => {
    if (!isDragging || dragStartPercent === null || dragEndPercent === null) return;
    setIsDragging(false);

    // Apply filter
    const left = Math.min(dragStartPercent, dragEndPercent);
    const right = Math.max(dragStartPercent, dragEndPercent);

    // If selection is extremely small (almost a click), reset filter
    if (right - left < 1.5) {
      setTimeRangeFilter(null);
    } else {
      const range = maxTime - minTime;
      const startMs = minTime + (left / 100) * range;
      const endMs = minTime + (right / 100) * range;
      setTimeRangeFilter({ start: startMs, end: endMs });
    }
  };

  const resetScrubber = () => {
    setTimeRangeFilter(null);
  };

  // Formatting helper for timestamps in the timeline label
  const formatTimeLabel = (ms: number) => {
    const d = new Date(ms);
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const msStr = String(d.getMilliseconds()).padStart(3, '0');
    return `${m}:${s}.${msStr}`;
  };

  // Render variables for SVG brush overlay
  const showBrush = dragStartPercent !== null && dragEndPercent !== null;
  const brushLeft = showBrush ? Math.min(dragStartPercent!, dragEndPercent!) : 0;
  const brushWidth = showBrush ? Math.abs(dragStartPercent! - dragEndPercent!) : 0;

  return (
    <div className="mx-6 my-2 flex flex-col gap-1.5 select-none">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          Interactive Density Timeline & Time-Scrubber
        </span>
        {timeRangeFilter && (
          <button
            onClick={resetScrubber}
            className="flex items-center gap-1 py-0.5 px-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-bold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
            Reset Time Range
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className="h-16 relative bg-[#0d0d15]/80 border border-white/[0.04] rounded-xl overflow-hidden backdrop-blur-md shadow-2xl transition-all"
      >
        <svg
          className="w-full h-full cursor-col-resize"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Horizontal Density Track Background */}
          <rect
            x="0"
            y="16"
            width="100%"
            height="16"
            fill="rgba(255,255,255,0.01)"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
            rx="4"
          />

          {/* Horizontal Density Heatmap Segments */}
          {bins.map((bin, i) => {
            const xPercent = (i / totalBins) * 100;
            const barWidthPercent = 100 / totalBins;

            // Determine dominant level color
            let fill = 'transparent';
            let glowClass = '';
            if (bin.E > 0) {
              fill = '#f43f5e'; // Rose
              glowClass = 'filter drop-shadow-[0_0_2px_rgba(244,63,94,0.6)]';
            } else if (bin.W > 0) {
              fill = '#f59e0b'; // Amber
            } else if (bin.I > 0) {
              fill = '#10b981'; // Emerald
            } else if (bin.D > 0) {
              fill = '#3b82f6'; // Blue
            } else if (bin.V > 0) {
              fill = '#64748b'; // Slate
            }

            // Calculate density opacity (0.15 to 1.0)
            const opacity = bin.total > 0 ? 0.2 + (bin.total / maxBinCount) * 0.8 : 0;

            if (bin.total === 0) return null;

            return (
              <rect
                key={bin.index}
                x={`${xPercent}%`}
                y="16"
                width={`${barWidthPercent}%`}
                height="16"
                fill={fill}
                opacity={opacity}
                className={`transition-all duration-300 hover:opacity-100 ${glowClass}`}
              />
            );
          })}

          {/* Time Labels on Grid */}
          <line x1="0%" y1="42" x2="100%" y2="42" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <text x="2%" y="53" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">
            {formatTimeLabel(minTime)}
          </text>
          <text x="50%" y="53" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace">
            Scrub or Drag timeline interval
          </text>
          <text x="98%" y="53" textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">
            {formatTimeLabel(maxTime)}
          </text>

          {/* Selection Brush Overlay */}
          {showBrush && (
            <g>
              {/* Highlight Area */}
              <rect
                x={`${brushLeft}%`}
                y="8"
                width={`${brushWidth}%`}
                height="32"
                fill="rgba(99, 102, 241, 0.12)"
                stroke="rgba(99, 102, 241, 0.5)"
                strokeWidth="1.5"
                rx="4"
                className="filter drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]"
              />
              {/* Left Handle Line */}
              <line
                x1={`${brushLeft}%`}
                y1="8"
                x2={`${brushLeft}%`}
                y2="40"
                stroke="#818cf8"
                strokeWidth="2"
              />
              {/* Right Handle Line */}
              <line
                x1={`${brushLeft + brushWidth}%`}
                y1="8"
                x2={`${brushLeft + brushWidth}%`}
                y2="40"
                stroke="#818cf8"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>

      {/* active interval indicator details */}
      {timeRangeFilter && (
        <div className="flex gap-2 items-center text-[9px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md w-fit">
          <span>Active filter range:</span>
          <span className="font-bold text-white">{formatTimeLabel(timeRangeFilter.start)}</span>
          <span className="opacity-40">➔</span>
          <span className="font-bold text-white">{formatTimeLabel(timeRangeFilter.end)}</span>
          <span className="opacity-40">|</span>
          <span>Span: {((timeRangeFilter.end - timeRangeFilter.start) / 1000).toFixed(2)}s</span>
        </div>
      )}
    </div>
  );
};
