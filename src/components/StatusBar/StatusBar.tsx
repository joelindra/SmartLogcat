// src/components/StatusBar/StatusBar.tsx
import React from 'react';
import { useLogStore } from '@/store/logStore';
import { useFilter } from '@/hooks/useFilter';
import { useDeviceStore } from '@/store/deviceStore';
import { Activity, Database, Smartphone } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const allLogs = useLogStore((state) => state.logs);
  const filteredLogs = useFilter();
  const { devices, selectedDeviceId } = useDeviceStore();
  
  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  return (
    <div className="h-8 flex items-center justify-between px-4 bg-[#0f172a] border-t border-white/5 text-[10px] text-slate-500 font-medium select-none uppercase tracking-wider">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-blue-500" />
          <span>Stream: {allLogs.length.toLocaleString()} events</span>
        </div>
        <div className="flex items-center gap-2">
          <Database className="w-3 h-3 text-emerald-500" />
          <span>Filtered: {filteredLogs.length.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {selectedDevice && (
          <div className="flex items-center gap-2">
            <Smartphone className="w-3 h-3 text-blue-400" />
            <span className="text-blue-200">{selectedDevice.name}</span>
            <span className="opacity-50">[{selectedDevice.status}]</span>
          </div>
        )}
        <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
          RAM Guard: 50K
        </div>
      </div>
    </div>
  );
};
