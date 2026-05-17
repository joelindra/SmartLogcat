// electron/main.cjs  — CommonJS (Electron main process)
'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { AdbManager, setAdbPath: setAdbPathManager } = require('./adb/AdbManager.cjs');
const { DeviceWatcher, setAdbPath: setAdbPathWatcher } = require('./adb/DeviceWatcher.cjs');
const { SessionManager } = require('./session/SessionManager.cjs');
const { PluginManager } = require('./plugins/PluginManager.cjs');
const { NotificationService } = require('./utils/NotificationService.cjs');
const { ensureAdb } = require('./utils/PlatformTools.cjs');
const fs = require('fs');

let mainWindow = null;
const adbManager = new AdbManager();
const deviceWatcher = new DeviceWatcher();
const sessionManager = new SessionManager();
const pluginManager = new PluginManager();
const notifService = new NotificationService();

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools(); // Removed automatic inspect element opening
    
    // Log renderer process messages to terminal for debugging
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      const levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR'];
      console.log(`[Renderer ${levels[level] || 'LOG'}] ${message} (${sourceId}:${line})`);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });

  const sendWindowSize = () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize();
      mainWindow.webContents.send('window:resized', { width, height });
    }
  };
  mainWindow.on('resize', sendWindowSize);
  mainWindow.on('maximize', sendWindowSize);
  mainWindow.on('unmaximize', sendWindowSize);
}

app.whenReady().then(async () => {
  const adbPath = await ensureAdb();
  setAdbPathManager(adbPath);
  setAdbPathWatcher(adbPath);
  
  createWindow();

  // Start device watcher
  deviceWatcher.start((devices) => {
    mainWindow?.webContents.send('device:list', devices);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  adbManager.stopAll();
  deviceWatcher.stop();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  adbManager.stopAll();
  deviceWatcher.stop();
});

// ── Window Controls ──────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.handle('window:size', () => {
  if (mainWindow) {
    const [width, height] = mainWindow.getSize();
    return { width, height };
  }
  return { width: 1400, height: 900 };
});

// ── ADB / Logcat ─────────────────────────────────────────────
// Buffer and batch log entries to avoid single-thread Electron IPC channel saturation
const logBuffers = new Map();
const batchTimeouts = new Map();

function flushLogBuffer(deviceId) {
  const buffer = logBuffers.get(deviceId);
  if (buffer && buffer.length > 0) {
    mainWindow?.webContents.send('log:entries', { deviceId, entries: buffer });
    logBuffers.set(deviceId, []);
  }
  batchTimeouts.delete(deviceId);
}

ipcMain.on('logcat:start', (_, { deviceId, sessionLabel }) => {
  // Clear any existing stream buffers/timeouts
  const oldTimeout = batchTimeouts.get(deviceId);
  if (oldTimeout) clearTimeout(oldTimeout);
  batchTimeouts.delete(deviceId);
  logBuffers.set(deviceId, []);

  adbManager.startLogcat(
    deviceId, 
    (entry) => {
      // Check plugin rules for notifications (handled instantly in main process)
      const matched = pluginManager.matchRules(entry);
      if (matched) notifService.notify(matched.name, entry.message);
      // Fatal notifications
      if (entry.level === 'F') {
        notifService.notify('💥 FATAL CRASH', `[${entry.tag}] ${entry.message.slice(0, 80)}`);
      }

      // Add entry to per-device batch buffer
      const buffer = logBuffers.get(deviceId) || [];
      buffer.push(entry);
      logBuffers.set(deviceId, buffer);

      // Batch throttle: flush immediately if buffer grows large, otherwise flush every 40ms
      if (buffer.length >= 120) {
        const timeout = batchTimeouts.get(deviceId);
        if (timeout) {
          clearTimeout(timeout);
          batchTimeouts.delete(deviceId);
        }
        flushLogBuffer(deviceId);
      } else if (!batchTimeouts.has(deviceId)) {
        const timeout = setTimeout(() => flushLogBuffer(deviceId), 40);
        batchTimeouts.set(deviceId, timeout);
      }
    },
    (code) => {
      // Cleanup on stream exit
      const timeout = batchTimeouts.get(deviceId);
      if (timeout) clearTimeout(timeout);
      batchTimeouts.delete(deviceId);
      logBuffers.delete(deviceId);

      mainWindow?.webContents.send('logcat:exited', { deviceId, code });
    }
  );
});

ipcMain.on('logcat:stop', (_, deviceId) => {
  adbManager.stopLogcat(deviceId);
  const timeout = batchTimeouts.get(deviceId);
  if (timeout) clearTimeout(timeout);
  batchTimeouts.delete(deviceId);
  logBuffers.delete(deviceId);
});

// ── ADB Command Console ───────────────────────────────────────
ipcMain.handle('adb:exec', async (_, command) => {
  return adbManager.execCommand(command);
});

// ── WiFi Pairing ──────────────────────────────────────────────
ipcMain.handle('adb:pair', async (_, { ip, port, code }) => {
  return adbManager.pairWifi(ip, port, code);
});

ipcMain.handle('adb:connect', async (_, { ip, port }) => {
  return adbManager.connectWifi(ip, port);
});

// ── Device Info ───────────────────────────────────────────────
ipcMain.handle('device:info', async (_, deviceId) => {
  return adbManager.getDeviceInfo(deviceId);
});

ipcMain.handle('device:packages', async (_, deviceId) => {
  return adbManager.getInstalledPackages(deviceId);
});

ipcMain.handle('device:screenshot', async (_, deviceId) => {
  return adbManager.takeScreenshot(deviceId);
});

// ── Session Management ────────────────────────────────────────
ipcMain.handle('session:list', () => sessionManager.listSessions());
ipcMain.handle('session:save', (_, { name, deviceId, logs }) => {
  return sessionManager.saveSession(name, deviceId, logs);
});
ipcMain.handle('session:load', (_, sessionId) => sessionManager.loadSession(sessionId));
ipcMain.handle('session:delete', (_, sessionId) => sessionManager.deleteSession(sessionId));

// ── Export ────────────────────────────────────────────────────
ipcMain.handle('logs:export', async (_, { logs, format }) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Logs',
    defaultPath: `logcat-export-${Date.now()}.${format}`,
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: 'Text', extensions: ['txt'] },
    ],
  });
  if (!filePath) return { success: false };
  const content = format === 'json' ? JSON.stringify(logs, null, 2) : logs.map(l => l.raw).join('\n');
  fs.writeFileSync(filePath, content, 'utf8');
  shell.showItemInFolder(filePath);
  return { success: true, filePath };
});

// ── Plugin Rules ──────────────────────────────────────────────
ipcMain.handle('rules:list', () => pluginManager.getRules());
ipcMain.handle('rules:save', (_, rules) => pluginManager.saveRules(rules));

// ── Performance: meminfo ──────────────────────────────────────
ipcMain.handle('perf:meminfo', async (_, { deviceId, packageName }) => {
  return adbManager.getMemInfo(deviceId, packageName);
});
ipcMain.handle('perf:stats', async (_, { deviceId, packageName }) => {
  return adbManager.getPerformanceStats(deviceId, packageName);
});
