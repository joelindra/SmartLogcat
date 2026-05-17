// src/components/ErrorDashboard/ErrorPanel.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useLogStore } from '@/store/logStore';
import { useDeviceStore } from '@/store/deviceStore';
import { useFilterStore } from '@/store/filterStore';
import { X, AlertTriangle, Bug, Zap, Activity, Cpu, HardDrive, Battery } from 'lucide-react';
import { BarChart, Bar, Tooltip as RechartsTooltip } from 'recharts';

interface ErrorPanelProps {
  onClose: () => void;
}

interface PerfPoint {
  cpu: number;
  mem: number; // MB
  native: number; // MB
  dalvik: number; // MB
  timestamp: number;
}

export const ErrorPanel: React.FC<ErrorPanelProps> = ({ onClose }) => {
  const logs = useLogStore((state) => state.logs);
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId);
  const packageName = useFilterStore((state) => state.packageName);

  // Tabs: 'issues' | 'perf'
  const [activeTab, setActiveTab] = useState<'issues' | 'perf'>('issues');
  
  // Real-time performance points
  const [perfHistory, setPerfHistory] = useState<PerfPoint[]>([]);
  const [batteryLevel, setBatteryLevel] = useState<string>('N/A');

  // Tab 1: Issues Data
  const errors = useMemo(() => {
    return logs.filter(l => l.level === 'E' || l.level === 'F' || l.smartCategory).slice(-50).reverse();
  }, [logs]);

  // Tab 1: Chart Data
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.slice(-1000).forEach(l => {
      if (l.level === 'E' || l.level === 'F') {
        const time = l.timestamp.split(' ')[1]?.split('.')[0] || '00:00:00';
        counts[time] = (counts[time] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([time, count]) => ({ time, count })).slice(-20);
  }, [logs]);

  // Tab 2: Performance polling effect
  useEffect(() => {
    if (activeTab !== 'perf' || !selectedDeviceId || !packageName.trim()) {
      setPerfHistory([]);
      return;
    }

    const pollStats = async () => {
      try {
        const res = await window.electronAPI.getPerformanceStats(selectedDeviceId, packageName.trim());
        if (res && res.success) {
          const totalMemMb = (res.totalPss / 1024); // PSS is in KB, convert to MB
          const nativeMb = (res.nativeHeap / 1024);
          const dalvikMb = (res.dalvikHeap / 1024);
          const newPoint: PerfPoint = {
            cpu: parseFloat(res.cpuUsage.toFixed(1)),
            mem: parseFloat(totalMemMb.toFixed(1)),
            native: parseFloat(nativeMb.toFixed(1)),
            dalvik: parseFloat(dalvikMb.toFixed(1)),
            timestamp: res.timestamp
          };
          setPerfHistory(prev => [...prev, newPoint].slice(-25));
        }

        // Poll battery as well
        const devInfo = await window.electronAPI.getDeviceInfo(selectedDeviceId);
        if (devInfo && devInfo.success && devInfo.data) {
          setBatteryLevel(devInfo.data.battery || 'N/A');
        }
      } catch (err) {
        console.error('Performance polling failed:', err);
      }
    };

    // Run immediately then poll every 2 seconds
    pollStats();
    const interval = setInterval(pollStats, 2000);
    return () => clearInterval(interval);
  }, [activeTab, selectedDeviceId, packageName]);

  // SVG Line Chart Helpers
  const renderSvgLineChart = (
    data: PerfPoint[],
    dataKey: 'cpu' | 'mem',
    color: string,
    yMax: number,
    suffix: string
  ) => {
    if (data.length < 2) {
      return (
        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-medium">
          Gathering profiler stats...
        </div>
      );
    }

    const width = 250;
    const height = 75;
    const padding = { top: 6, right: 6, bottom: 6, left: 6 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Generate SVG points
    const points = data.map((pt, i) => {
      const val = pt[dataKey];
      const x = padding.left + (i / (data.length - 1)) * chartW;
      const y = padding.top + chartH - (val / yMax) * chartH;
      return `${x},${y}`;
    }).join(' ');

    const areaPoints = `${padding.left},${padding.top + chartH} ${points} ${width - padding.right},${padding.top + chartH}`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid lines */}
        <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="rgba(255,255,255,0.03)" strokeDasharray="2,2" />
        <line x1={padding.left} y1={padding.top + chartH / 2} x2={width - padding.right} y2={padding.top + chartH / 2} stroke="rgba(255,255,255,0.03)" strokeDasharray="2,2" />
        <line x1={padding.left} y1={padding.top + chartH} x2={width - padding.right} y2={padding.top + chartH} stroke="rgba(255,255,255,0.06)" />

        {/* Shaded Area */}
        <polygon points={areaPoints} fill={`${color}10`} />

        {/* Sparkline Line */}
        <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} className="filter drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]" />

        {/* Value Label */}
        <text
          x={width - padding.right}
          y={padding.top + 10}
          textAnchor="end"
          fill={color}
          fontSize="9"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {data[data.length - 1][dataKey]}{suffix}
        </text>
      </svg>
    );
  };

  const currentCpu = perfHistory.length > 0 ? perfHistory[perfHistory.length - 1].cpu : 0;
  const currentMem = perfHistory.length > 0 ? perfHistory[perfHistory.length - 1].mem : 0;
  const currentNative = perfHistory.length > 0 ? perfHistory[perfHistory.length - 1].native : 0;
  const currentDalvik = perfHistory.length > 0 ? perfHistory[perfHistory.length - 1].dalvik : 0;

  const maxMemFound = useMemo(() => {
    const vals = perfHistory.map(p => p.mem);
    return Math.max(...vals, 128); // Default grid top at 128MB
  }, [perfHistory]);

  return (
    <div className="flex flex-col h-full animate-fade-in select-none bg-[#080810]/40 backdrop-blur-lg">
      
      {/* Header with Title & Close */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">Device Analysis</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex px-4 border-b border-white/5 bg-white/[0.01]">
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 cursor-pointer ${
            activeTab === 'issues'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Issues List
        </button>
        <button
          onClick={() => setActiveTab('perf')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 cursor-pointer ${
            activeTab === 'perf'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Performance Profiler
        </button>
      </div>

      {/* Scrollable Panel Area */}
      <div className="flex-1 overflow-y-auto p-4">
        
        {/* TAB 1: ISSUES LIST */}
        {activeTab === 'issues' && (
          <div className="flex flex-col gap-4">
            {/* Real-time Heatmap */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 flex flex-col gap-2 h-32">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Error Density
                </span>
              </div>
              <div className="flex-1 flex justify-center items-center">
                {chartData.length > 0 ? (
                  <BarChart data={chartData} width={256} height={80}>
                    <Bar dataKey="count" fill="#f43f5e" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                    <RechartsTooltip 
                      contentStyle={{ background: '#0f172a', border: 'none', fontSize: '10px', borderRadius: '4px' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                  </BarChart>
                ) : (
                  <span className="text-[10px] text-slate-600 font-medium">Gathering issue timestamps...</span>
                )}
              </div>
            </div>

            {/* Recent Crashes */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                Recent Issues
              </span>
              
              <div className="flex flex-col gap-2">
                {errors.length === 0 ? (
                  <div className="text-[11px] text-slate-600 text-center py-8">No issues detected</div>
                ) : (
                  errors.map((err) => (
                    <div key={err.id} className="bg-white/[0.01] border border-white/[0.03] hover:border-white/[0.08] rounded-xl p-3 flex flex-col gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${err.level === 'F' ? 'bg-red-600 text-white' : 'bg-rose-500/20 text-rose-400 border border-rose-500/20'}`}>
                          {err.level === 'F' ? 'FATAL' : 'ERROR'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{err.timestamp.split(' ')[1] || err.timestamp}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-300 truncate">{err.tag}</span>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{err.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PERFORMANCE PROFILER */}
        {activeTab === 'perf' && (
          <div className="flex flex-col gap-4">
            {!selectedDeviceId || !packageName.trim() ? (
              <div className="text-center py-12 px-4 border border-dashed border-white/[0.05] bg-white/[0.01] rounded-xl flex flex-col items-center justify-center gap-3">
                <Cpu className="w-8 h-8 text-indigo-500/40 animate-bounce" />
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Profiler Idle
                </span>
                <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
                  Please select an active device and filter a package scope in the left sidebar to start streaming performance diagnostics.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                
                {/* Battery and Status Block */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-emerald-400" />
                      Battery Level
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-200">{batteryLevel}</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      Status
                    </span>
                    <span className="text-xs font-bold text-emerald-400">Profiling Live</span>
                  </div>
                </div>

                {/* CPU Usage Graph */}
                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      CPU Utilization
                    </span>
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded">
                      {currentCpu}%
                    </span>
                  </div>
                  <div className="h-20 flex justify-center items-center">
                    {renderSvgLineChart(perfHistory, 'cpu', '#06b6d4', 100, '%')}
                  </div>
                </div>

                {/* Memory PSS Graph */}
                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                      Memory PSS Allocation
                    </span>
                    <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded">
                      {currentMem} MB
                    </span>
                  </div>
                  <div className="h-20 flex justify-center items-center">
                    {renderSvgLineChart(perfHistory, 'mem', '#a855f7', maxMemFound, 'MB')}
                  </div>
                </div>

                {/* Memory Details List */}
                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl flex flex-col gap-2 text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Memory Allocation breakdown</span>
                  <div className="flex flex-col gap-1.5 font-mono">
                    <div className="flex justify-between py-1 border-b border-white/[0.03]">
                      <span className="text-slate-500">Native Heap:</span>
                      <span className="font-bold text-slate-300">{currentNative} MB</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.03]">
                      <span className="text-slate-500">Dalvik Heap:</span>
                      <span className="font-bold text-slate-300">{currentDalvik} MB</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Total PSS:</span>
                      <span className="font-bold text-purple-400">{currentMem} MB</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
