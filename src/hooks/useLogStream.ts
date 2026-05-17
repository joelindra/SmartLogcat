// src/hooks/useLogStream.ts
import { useEffect } from 'react';
import { useLogStore } from '@/store/logStore';
import { useFilterStore } from '@/store/filterStore';
import { LogEntry } from '@/types';

declare global {
  interface Window {
    electronAPI: any;
  }
}

export const useLogStream = () => {
  const addLogs = useLogStore((state) => state.addLogs);

  useEffect(() => {
    // Request notification permission early
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().catch(console.error);
      }
    }

    if (!window.electronAPI) {
      console.warn("Electron API not available");
      return;
    }

    const cleanupLog = window.electronAPI.onLogEntry((data: { deviceId: string; entries?: LogEntry[]; entry?: LogEntry }) => {
      const incoming = data.entries || (data.entry ? [data.entry] : []);
      if (incoming.length === 0) return;

      const triggerRules = useFilterStore.getState().triggerRules;

      for (const entry of incoming) {
        if (triggerRules && triggerRules.length > 0) {
          for (const rule of triggerRules) {
            if (!rule.active) continue;
            
            let matches = false;
            if (rule.isRegex) {
              try {
                const regex = new RegExp(rule.pattern, 'i');
                matches = regex.test(entry.message) || regex.test(entry.tag);
              } catch (e) {}
            } else {
              const query = rule.pattern.toLowerCase();
              matches = entry.message.toLowerCase().includes(query) || 
                        entry.tag.toLowerCase().includes(query);
            }

            if (matches) {
              // Flag entry as matched to trigger custom UI neon rendering
              entry.ruleMatched = rule.id;

              // Play clean digital notification chime natively using AudioContext
              if (rule.sound) {
                try {
                  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                  if (AudioCtx) {
                    const ctx = new AudioCtx();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.25);
                  }
                } catch (e) {
                  console.error('AudioContext chime failed:', e);
                }
              }

              // Desktop push notification
              if (rule.notify && typeof window !== 'undefined' && 'Notification' in window) {
                try {
                  if (Notification.permission === 'granted') {
                    new Notification('Smart Logcat Alert', {
                      body: `[${entry.level}] ${entry.tag}: ${entry.message.slice(0, 100)}`,
                      silent: true // We play our own high-fidelity chime
                    });
                  }
                } catch (e) {
                  console.error('Desktop push notification failed:', e);
                }
              }

              break; // Stop evaluating after first rule match
            }
          }
        }
      }

      addLogs(incoming);
    });

    const cleanupExit = window.electronAPI.onLogcatExited((data: { deviceId: string; code: number }) => {
      console.warn(`[useLogStream] Logcat process exited for device ${data.deviceId} with code ${data.code}. Attempting automatic stream recovery...`);
      // Auto-heal: restart stream if connection flickers
      window.electronAPI.startLogcat(data.deviceId);
    });

    return () => {
      if (cleanupLog) cleanupLog();
      if (cleanupExit) cleanupExit();
    };
  }, [addLogs]);
};
