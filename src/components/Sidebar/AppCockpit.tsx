// src/components/Sidebar/AppCockpit.tsx
import React, { useState } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { useFilterStore } from '@/store/filterStore';
import { Play, Power, Trash2, Battery, X, Download, ShieldAlert, Sparkles } from 'lucide-react';

export const AppCockpit: React.FC = () => {
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId);
  const packageName = useFilterStore((state) => state.packageName);

  // Local state
  const [loading, setLoading] = useState(false);
  const [batteryMock, setBatteryMock] = useState(100);

  const handleLaunch = async () => {
    if (!selectedDeviceId || !packageName.trim()) return;
    setLoading(true);
    try {
      // Launch application using standard Android launcher monkey command
      await window.electronAPI.execAdb(`-s ${selectedDeviceId} shell monkey -p ${packageName.trim()} -c android.intent.category.LAUNCHER 1`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleForceStop = async () => {
    if (!selectedDeviceId || !packageName.trim()) return;
    setLoading(true);
    try {
      await window.electronAPI.execAdb(`-s ${selectedDeviceId} shell am force-stop ${packageName.trim()}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!selectedDeviceId || !packageName.trim()) return;
    if (!confirm(`Are you sure you want to clear all data and cache for: ${packageName}?`)) return;
    setLoading(true);
    try {
      await window.electronAPI.execAdb(`-s ${selectedDeviceId} shell pm clear ${packageName.trim()}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBatteryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setBatteryMock(val);
  };

  const handleApplyBatteryMock = async () => {
    if (!selectedDeviceId) return;
    setLoading(true);
    try {
      await window.electronAPI.execAdb(`-s ${selectedDeviceId} shell dumpsys battery set level ${batteryMock}`);
      await window.electronAPI.execAdb(`-s ${selectedDeviceId} shell dumpsys battery set status 2`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetBatteryMock = async () => {
    if (!selectedDeviceId) return;
    setLoading(true);
    try {
      await window.electronAPI.execAdb(`-s ${selectedDeviceId} shell dumpsys battery reset`);
      setBatteryMock(100);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };



  if (!selectedDeviceId) return null;

  return (
    <div className="flex flex-col gap-4 p-4 border-t border-white/[0.04] bg-white/[0.01]">
      <div className="flex items-center gap-1.5 px-0.5">
        <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
          Device Control Cockpit
        </span>
      </div>

      {!packageName.trim() ? (
        <div className="text-[10px] text-slate-500 leading-relaxed bg-[#0d0d15]/50 border border-white/[0.04] p-3 rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          Filter a package name in the sidebar to enable full app controls (Launch, Stop, Clear).
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          
          {/* App Life Cycle Controls */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={handleLaunch}
              disabled={loading}
              className="py-2 bg-indigo-600/20 hover:bg-indigo-600/30 active:bg-indigo-600/40 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-indigo-300 transition-all cursor-pointer disabled:opacity-50"
              title="Launch Application"
            >
              <Play className="w-4 h-4 fill-indigo-300/20" />
              Launch
            </button>
            
            <button
              onClick={handleForceStop}
              disabled={loading}
              className="py-2 bg-rose-600/20 hover:bg-rose-600/30 active:bg-rose-600/40 border border-rose-500/20 hover:border-rose-500/40 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-rose-300 transition-all cursor-pointer disabled:opacity-50"
              title="Force Stop Application"
            >
              <Power className="w-4 h-4" />
              Stop
            </button>

            <button
              onClick={handleClearData}
              disabled={loading}
              className="py-2 bg-slate-600/10 hover:bg-slate-600/20 active:bg-slate-600/30 border border-white/5 hover:border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-slate-300 transition-all cursor-pointer disabled:opacity-50"
              title="Clear Data & Cache"
            >
              <Trash2 className="w-4 h-4 text-slate-400" />
              Clear
            </button>
          </div>

          <div className="w-full h-px bg-white/[0.04]" />
        </div>
      )}

      {/* Battery Mock Slider */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center px-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            Mock Battery: {batteryMock}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={batteryMock}
            onChange={handleBatteryChange}
            className="flex-1 accent-emerald-500 h-1 rounded-lg bg-white/10 appearance-none cursor-pointer"
          />
          <button
            onClick={handleApplyBatteryMock}
            disabled={loading}
            className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-[9px] font-bold text-emerald-300 hover:bg-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
          >
            Apply
          </button>
          <button
            onClick={handleResetBatteryMock}
            disabled={loading}
            className="px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded text-[9px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

    </div>
  );
};
