// src/components/Sidebar/DeviceSelector.tsx
import React from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { useLogStore } from '@/store/logStore';
import { Smartphone, Wifi, AlertCircle } from 'lucide-react';

export const DeviceSelector: React.FC = () => {
  const { devices, selectedDeviceId, setSelectedDevice } = useDeviceStore();
  const clearLogs = useLogStore((state) => state.clearLogs);

  const handleSelect = (id: string) => {
    if (selectedDeviceId === id) {
      window.electronAPI.stopLogcat(id);
      setSelectedDevice(null);
    } else {
      if (selectedDeviceId) window.electronAPI.stopLogcat(selectedDeviceId);
      clearLogs();
      setSelectedDevice(id);
      window.electronAPI.startLogcat(id);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {devices.length === 0 ? (
        <div className="flex items-center gap-2 p-3 text-sm text-slate-500 bg-white/5 rounded-lg border border-dashed border-white/10">
          <AlertCircle className="w-4 h-4" />
          <span>No devices found</span>
        </div>
      ) : (
        devices.map((device) => (
          <button
            key={device.id}
            onClick={() => handleSelect(device.id)}
            className={`flex items-center gap-3 p-3 text-left rounded-lg transition-all border ${
              selectedDeviceId === device.id
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-400'
            }`}
          >
            {device.isWifi ? (
              <Wifi className={`w-4 h-4 ${selectedDeviceId === device.id ? 'text-blue-400' : 'text-slate-500'}`} />
            ) : (
              <Smartphone className={`w-4 h-4 ${selectedDeviceId === device.id ? 'text-blue-400' : 'text-slate-500'}`} />
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{device.name}</span>
              <span className="text-[10px] opacity-60 font-mono truncate">{device.id}</span>
            </div>
            {selectedDeviceId === device.id && (
              <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
          </button>
        ))
      )}
    </div>
  );
};
