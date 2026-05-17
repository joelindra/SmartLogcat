// electron/adb/AdbManager.cjs
'use strict';

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const { parseLine } = require('./LogParser.cjs');
const path = require('path');
const fs = require('fs');
const os = require('os');

const execAsync = promisify(exec);

let adbPath = 'adb'; // overridden by PlatformTools if needed

function setAdbPath(p) { adbPath = p; }

class AdbManager {
  constructor() {
    this._processes = new Map(); // deviceId -> child_process
  }

  startLogcat(deviceId, onEntry, onClose) {
    if (this._processes.has(deviceId)) {
      this.stopLogcat(deviceId);
    }

    const args = ['-s', deviceId, 'logcat', '-v', 'threadtime', '-b', 'main,system,crash'];
    const proc = spawn(adbPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let buffer = '';
    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const entry = parseLine(line.trim());
        if (entry) onEntry(entry);
      }
    });

    proc.stderr.on('data', () => {}); // suppress adb stderr
    proc.on('close', (code) => {
      this._processes.delete(deviceId);
      console.log(`[AdbManager] logcat process for ${deviceId} exited (${code})`);
      if (onClose) onClose(code);
    });

    proc.on('error', (err) => {
      console.error(`[AdbManager] spawn error: ${err.message}`);
    });

    this._processes.set(deviceId, proc);
  }

  stopLogcat(deviceId) {
    const proc = this._processes.get(deviceId);
    if (proc) {
      proc.kill('SIGTERM');
      this._processes.delete(deviceId);
    }
  }

  stopAll() {
    for (const [id] of this._processes) this.stopLogcat(id);
  }

  async execCommand(command) {
    try {
      const { stdout, stderr } = await execAsync(`"${adbPath}" ${command}`);
      return { success: true, output: stdout || stderr };
    } catch (e) {
      return { success: false, output: e.message };
    }
  }

  async pairWifi(ip, port, code) {
    return this.execCommand(`pair ${ip}:${port} ${code}`);
  }

  async connectWifi(ip, port) {
    return this.execCommand(`connect ${ip}:${port}`);
  }

  async getDeviceInfo(deviceId) {
    try {
      const props = [
        'ro.product.model', 'ro.product.manufacturer', 'ro.build.version.release',
        'ro.build.version.sdk', 'ro.product.device'
      ];
      const results = {};
      for (const prop of props) {
        const { stdout } = await execAsync(`"${adbPath}" -s ${deviceId} shell getprop ${prop}`);
        results[prop] = stdout.trim();
      }
      const batRes = await execAsync(`"${adbPath}" -s ${deviceId} shell dumpsys battery | grep level`);
      results.battery = batRes.stdout.trim().replace('level: ', '') + '%';
      return { success: true, data: results };
    } catch (e) {
      return { success: false, data: {} };
    }
  }

  async takeScreenshot(deviceId) {
    try {
      const tmpPath = path.join(os.tmpdir(), `screenshot_${deviceId}_${Date.now()}.png`);
      await execAsync(`"${adbPath}" -s ${deviceId} exec-out screencap -p > "${tmpPath}"`);
      const data = fs.readFileSync(tmpPath);
      fs.unlinkSync(tmpPath);
      return { success: true, base64: data.toString('base64') };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async getMemInfo(deviceId, packageName) {
    try {
      const { stdout } = await execAsync(`"${adbPath}" -s ${deviceId} shell dumpsys meminfo ${packageName}`);
      const totalMatch = stdout.match(/TOTAL PSS:\s*(\d+)/);
      const nativeMatch = stdout.match(/Native Heap.*?(\d+)/);
      const dalvikMatch = stdout.match(/Dalvik Heap.*?(\d+)/);
      return {
        success: true,
        totalPss: totalMatch ? parseInt(totalMatch[1]) : 0,
        nativeHeap: nativeMatch ? parseInt(nativeMatch[1]) : 0,
        dalvikHeap: dalvikMatch ? parseInt(dalvikMatch[1]) : 0,
        timestamp: Date.now(),
      };
    } catch (e) {
      return { success: false, totalPss: 0, nativeHeap: 0, dalvikHeap: 0, timestamp: Date.now() };
    }
  }

  async getPerformanceStats(deviceId, packageName) {
    try {
      const memRes = await this.getMemInfo(deviceId, packageName);
      
      let cpuUsage = 0;
      try {
        const { stdout } = await execAsync(`"${adbPath}" -s ${deviceId} shell top -n 1 -b | grep "${packageName}"`);
        if (stdout.trim()) {
          const parts = stdout.trim().split(/\s+/);
          const decimalNumbers = parts.filter(p => /^\d+\.?\d*$/.test(p) && p.includes('.'));
          if (decimalNumbers.length > 0) {
            cpuUsage = parseFloat(decimalNumbers[0]);
          } else {
            const numbers = parts.map(parseFloat).filter(n => !isNaN(n));
            if (numbers.length >= 2) {
              cpuUsage = numbers[numbers.length - 2] || 0;
            }
          }
        }
      } catch (e) {
        // Suppress CPU fetch errors
      }

      return {
        success: true,
        totalPss: memRes.totalPss || 0,
        nativeHeap: memRes.nativeHeap || 0,
        dalvikHeap: memRes.dalvikHeap || 0,
        cpuUsage: Math.min(100, Math.max(0, cpuUsage)),
        timestamp: Date.now()
      };
    } catch (e) {
      return { success: false, totalPss: 0, nativeHeap: 0, dalvikHeap: 0, cpuUsage: 0, timestamp: Date.now() };
    }
  }

  async getInstalledPackages(deviceId) {
    try {
      const { stdout } = await execAsync(`"${adbPath}" -s ${deviceId} shell pm list packages -3`);
      const packages = stdout
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('package:'))
        .map(line => line.replace('package:', ''))
        .filter(Boolean);
      return { success: true, packages };
    } catch (e) {
      try {
        const { stdout } = await execAsync(`"${adbPath}" -s ${deviceId} shell pm list packages`);
        const packages = stdout
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('package:'))
          .map(line => line.replace('package:', ''))
          .filter(Boolean);
        return { success: true, packages };
      } catch (err) {
        return { success: false, packages: [] };
      }
    }
  }
}

module.exports = { AdbManager, setAdbPath };
