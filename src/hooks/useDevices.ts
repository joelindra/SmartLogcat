// src/hooks/useDevices.ts
import { useEffect } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Device } from '@/types';

export const useDevices = () => {
  const setDevices = useDeviceStore((state) => state.setDevices);

  useEffect(() => {
    if (!window.electronAPI) {
      console.warn("Electron API not available");
      return;
    }

    const cleanup = window.electronAPI.onDeviceList((devices: Device[]) => {
      setDevices(devices);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [setDevices]);
};
