// electron/utils/PlatformTools.cjs
'use strict';

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { app } = require('electron');

const execAsync = promisify(exec);

const PLATFORM_TOOLS_URLS = {
  win32: 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip',
  darwin: 'https://dl.google.com/android/repository/platform-tools-latest-darwin.zip',
  linux: 'https://dl.google.com/android/repository/platform-tools-latest-linux.zip',
};

async function ensureAdb() {
  try {
    await execAsync('adb version');
    console.log('[PlatformTools] ADB found in PATH');
    return 'adb';
  } catch (_) {
    console.log('[PlatformTools] ADB not found, checking local copy...');
    const localPath = getLocalAdbPath();
    if (fs.existsSync(localPath)) {
      console.log('[PlatformTools] Using local ADB:', localPath);
      return localPath;
    }
    // Don't auto-download without user consent — just log warning
    console.warn('[PlatformTools] ADB not found. Please install Android SDK platform-tools.');
    return 'adb';
  }
}

function getLocalAdbPath() {
  const userData = app.getPath('userData');
  const ext = process.platform === 'win32' ? '.exe' : '';
  return path.join(userData, 'platform-tools', `adb${ext}`);
}

module.exports = { ensureAdb, getLocalAdbPath };
