// src/store/deviceStore.ts
import { create } from 'zustand';
import { Device } from '@/types';

interface DeviceState {
  devices: Device[];
  selectedDeviceId: string | null;
  setDevices: (devices: Device[]) => void;
  setSelectedDevice: (id: string | null) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  selectedDeviceId: null,
  setDevices: (devices) => set({ devices }),
  setSelectedDevice: (id) => set({ selectedDeviceId: id }),
}));
