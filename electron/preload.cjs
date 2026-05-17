// electron/preload.cjs
'use strict';
const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  setZoomFactor: (factor) => {
    try {
      webFrame.setZoomFactor(factor);
    } catch (e) {
      console.error('Failed to set zoom factor:', e);
    }
  },
  onWindowResized: (cb) => {
    ipcRenderer.on('window:resized', (_, size) => cb(size));
    return () => ipcRenderer.removeAllListeners('window:resized');
  },
  getWindowSize: () => ipcRenderer.invoke('window:size'),

  // Logcat stream
  startLogcat: (deviceId, sessionLabel) => ipcRenderer.send('logcat:start', { deviceId, sessionLabel }),
  stopLogcat: (deviceId) => ipcRenderer.send('logcat:stop', deviceId),
  onLogEntry: (cb) => {
    const handleEntry = (_, data) => cb(data);
    const handleEntries = (_, data) => cb(data);
    ipcRenderer.on('log:entry', handleEntry);
    ipcRenderer.on('log:entries', handleEntries);
    return () => {
      ipcRenderer.removeListener('log:entry', handleEntry);
      ipcRenderer.removeListener('log:entries', handleEntries);
    };
  },
  onLogcatExited: (cb) => {
    ipcRenderer.on('logcat:exited', (_, data) => cb(data));
    return () => ipcRenderer.removeAllListeners('logcat:exited');
  },

  // Devices
  onDeviceList: (cb) => {
    ipcRenderer.on('device:list', (_, devices) => cb(devices));
    return () => ipcRenderer.removeAllListeners('device:list');
  },
  getDeviceInfo: (deviceId) => ipcRenderer.invoke('device:info', deviceId),
  getInstalledPackages: (deviceId) => ipcRenderer.invoke('device:packages', deviceId),
  takeScreenshot: (deviceId) => ipcRenderer.invoke('device:screenshot', deviceId),

  // ADB console
  execAdb: (command) => ipcRenderer.invoke('adb:exec', command),

  // WiFi pairing
  pairWifi: (ip, port, code) => ipcRenderer.invoke('adb:pair', { ip, port, code }),
  connectWifi: (ip, port) => ipcRenderer.invoke('adb:connect', { ip, port }),

  // Sessions
  listSessions: () => ipcRenderer.invoke('session:list'),
  saveSession: (name, deviceId, logs) => ipcRenderer.invoke('session:save', { name, deviceId, logs }),
  loadSession: (sessionId) => ipcRenderer.invoke('session:load', sessionId),
  deleteSession: (sessionId) => ipcRenderer.invoke('session:delete', sessionId),

  // Export
  exportLogs: (logs, format) => ipcRenderer.invoke('logs:export', { logs, format }),

  // Plugin rules
  getRules: () => ipcRenderer.invoke('rules:list'),
  saveRules: (rules) => ipcRenderer.invoke('rules:save', rules),

  // Performance
  getMemInfo: (deviceId, packageName) => ipcRenderer.invoke('perf:meminfo', { deviceId, packageName }),
  getPerformanceStats: (deviceId, packageName) => ipcRenderer.invoke('perf:stats', { deviceId, packageName }),
});
