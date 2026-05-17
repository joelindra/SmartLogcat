// electron/adb/DeviceWatcher.cjs
'use strict';

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

let adbPath = 'adb';
function setAdbPath(p) { adbPath = p; }

class DeviceWatcher {
  constructor() {
    this._timeout = null;
    this._lastList = '';
    this._isPolling = false;
  }

  start(onChange) {
    if (this._isPolling) return;
    this._isPolling = true;

    const poll = async () => {
      if (!this._isPolling) return;
      
      try {
        const { stdout } = await execAsync(`"${adbPath}" devices -l`);
        const trimmedStdout = stdout.trim();
        
        if (trimmedStdout !== this._lastList) {
          this._lastList = trimmedStdout;
          const devices = this._parse(stdout);
          onChange(devices);
        }
      } catch (err) {
        console.error(`[DeviceWatcher] Poll error: ${err.message}`);
        // If it fails, maybe adb server is down. We still keep polling.
      }

      if (this._isPolling) {
        this._timeout = setTimeout(poll, 2000);
      }
    };

    poll();
  }

  stop() {
    this._isPolling = false;
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
  }

  _parse(raw) {
    const devices = [];
    const lines = raw.split(/\r?\n/);
    let foundHeader = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!foundHeader) {
        if (trimmedLine.startsWith('List of devices attached')) {
          foundHeader = true;
        }
        continue;
      }

      if (!trimmedLine) continue;

      const parts = trimmedLine.split(/\s+/);
      if (parts.length < 2) continue;

      const id = parts[0];
      const statusStr = parts[1];
      
      // Basic validation for ID (shouldn't be empty or start with *)
      // Also filter out offline devices as requested
      if (!id || id.startsWith('*') || statusStr === 'offline' || statusStr === 'off') continue;

      const modelMatch = trimmedLine.match(/model:(\S+)/);
      const productMatch = trimmedLine.match(/product:(\S+)/);
      const name = modelMatch ? modelMatch[1].replace(/_/g, ' ') : (productMatch ? productMatch[1] : id);

      let status = 'offline';
      if (statusStr === 'device') status = 'online';
      else if (statusStr === 'unauthorized') status = 'unauthorized';
      else if (statusStr === 'offline') status = 'offline';

      const isWifi = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(id);
      devices.push({ id, name, status, isWifi });
    }
    
    return devices;
  }
}

module.exports = { DeviceWatcher, setAdbPath };
