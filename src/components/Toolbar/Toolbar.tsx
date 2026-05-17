// src/components/Toolbar/Toolbar.tsx
import React from 'react';
import { useLogStore } from '@/store/logStore';
import { useFilter } from '@/hooks/useFilter';
import { useDeviceStore } from '@/store/deviceStore';
import { 
  Play, Pause, Trash2, Download, 
  Terminal as ConsoleIcon, Layout, 
  Wifi as WifiIcon, Settings, History, Save,
  Menu, Bell
} from 'lucide-react';

interface ToolbarProps {
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onToggleError: () => void;
  onOpenConsole: () => void;
  onOpenWifi: () => void;
  onOpenPlugins: () => void;
  onOpenSessions: () => void;
  onOpenTriggers: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  showSidebar, onToggleSidebar, onToggleError, onOpenConsole, onOpenWifi, onOpenPlugins, onOpenSessions, onOpenTriggers
}) => {
  const { isPaused, setPaused, clearLogs, logs } = useLogStore();
  const { selectedDeviceId } = useDeviceStore();
  const filteredLogs = useFilter();

  const handleExport = () => {
    window.electronAPI.exportLogs(filteredLogs, 'json');
  };

  const handleSaveSession = async () => {
    if (!selectedDeviceId || logs.length === 0) return;
    const name = `Session ${new Date().toLocaleString()}`;
    await window.electronAPI.saveSession(name, selectedDeviceId, logs.slice(-10000)); // Save last 10k logs
    alert('Session saved!');
  };

  return (
    <div className="h-14 flex items-center justify-between px-4 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg transition-all ${
            !showSidebar 
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
              : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
          title={showSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-white/5 mx-1" />

        <button
          onClick={() => setPaused(!isPaused)}
          className={`p-2 rounded-lg transition-all ${
            isPaused 
              ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' 
              : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
          title={isPaused ? "Resume Stream" : "Pause Stream"}
        >
          {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
        </button>

        <button
          onClick={clearLogs}
          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          title="Clear Logs"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-white/5 mx-2" />

        <button
          onClick={handleSaveSession}
          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
          title="Save Session to DB"
        >
          <Save className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenSessions}
          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
          title="Session History"
        >
          <History className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
          title="Export Filtered (JSON/TXT)"
        >
          <Download className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-white/5 mx-2" />

        <button
          onClick={onOpenWifi}
          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
          title="ADB WiFi Pairing"
        >
          <WifiIcon className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenConsole}
          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
          title="ADB Console"
        >
          <ConsoleIcon className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenPlugins}
          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
          title="Highlight Rules"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenTriggers}
          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all relative"
          title="Smart Triggers & Alerts"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
        </button>

        <div className="w-px h-6 bg-white/5 mx-2" />

        <button
          onClick={onToggleError}
          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
          title="Toggle Analysis Panel"
        >
          <Layout className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
