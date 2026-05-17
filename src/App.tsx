// src/App.tsx
import React, { useState, useEffect } from 'react';
import { useLogStream } from '@/hooks/useLogStream';
import { useDevices } from '@/hooks/useDevices';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { LogTable } from '@/components/LogTable/LogTable';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { StatusBar } from '@/components/StatusBar/StatusBar';
import { ErrorPanel } from '@/components/ErrorDashboard/ErrorPanel';
import { TitleBar } from '@/components/TitleBar';
import { AdbConsole } from '@/components/AdbConsole/AdbConsole';
import { WifiPairingDialog } from '@/components/WifiPairing/WifiPairingDialog';
import { PluginEditor } from '@/components/Plugins/PluginEditor';
import { SessionManagerDialog } from '@/components/Session/SessionManagerDialog';
import { LogTimeline } from '@/components/LogTable/LogTimeline';
import { TriggerManagerDialog } from '@/components/Session/TriggerManagerDialog';

const App: React.FC = () => {
  useLogStream();
  useDevices();

  const [showErrorPanel, setShowErrorPanel] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeDialog, setActiveDialog] = useState<'console' | 'wifi' | 'plugins' | 'sessions' | 'triggers' | null>(null);

  // Dynamic application-wide scaling based on physical window size
  useEffect(() => {
    const handleResize = (physicalWidth: number) => {
      const baseWidth = 1400; // Original designed width
      const scaleFactor = physicalWidth / baseWidth;
      
      // Calculate zoom factor (clamped between 0.8 and 1.5 for comfortable viewing)
      const zoomFactor = Math.max(0.8, Math.min(1.5, scaleFactor));
      
      // Apply native Electron webFrame zoom factor
      if (window.electronAPI && window.electronAPI.setZoomFactor) {
        window.electronAPI.setZoomFactor(zoomFactor);
      }
    };

    // Get initial physical window size and apply scaling
    if (window.electronAPI && window.electronAPI.getWindowSize) {
      window.electronAPI.getWindowSize().then((size: { width: number }) => {
        if (size && size.width) {
          handleResize(size.width);
        }
      }).catch(console.error);
    }

    // Subscribe to true physical window resizing events from the main process
    let unsubscribe: (() => void) | undefined;
    if (window.electronAPI && window.electronAPI.onWindowResized) {
      unsubscribe = window.electronAPI.onWindowResized((size: { width: number }) => {
        if (size && size.width) {
          handleResize(size.width);
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (window.electronAPI && window.electronAPI.setZoomFactor) {
        window.electronAPI.setZoomFactor(1);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0f] text-slate-200">
      <TitleBar />
      
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar />}
        
        <main className="flex-1 flex flex-col min-w-0 border-l border-white/5 relative">
          <Toolbar 
            showSidebar={showSidebar}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            onToggleError={() => setShowErrorPanel(!showErrorPanel)} 
            onOpenConsole={() => setActiveDialog(activeDialog === 'console' ? null : 'console')}
            onOpenWifi={() => setActiveDialog('wifi')}
            onOpenPlugins={() => setActiveDialog('plugins')}
            onOpenSessions={() => setActiveDialog('sessions')}
            onOpenTriggers={() => setActiveDialog('triggers')}
          />
          
          <LogTimeline />
          
          <div className="flex-1 overflow-hidden">
            <LogTable />
          </div>
          
          {activeDialog === 'console' && <AdbConsole onClose={() => setActiveDialog(null)} />}
          
          <StatusBar />
        </main>

        {showErrorPanel && (
          <div className="w-80 border-l border-white/5 bg-[#0f172a]/50">
            <ErrorPanel onClose={() => setShowErrorPanel(false)} />
          </div>
        )}
      </div>

      {activeDialog === 'wifi' && <WifiPairingDialog onClose={() => setActiveDialog(null)} />}
      {activeDialog === 'plugins' && <PluginEditor onClose={() => setActiveDialog(null)} />}
      {activeDialog === 'sessions' && <SessionManagerDialog onClose={() => setActiveDialog(null)} />}
      {activeDialog === 'triggers' && <TriggerManagerDialog onClose={() => setActiveDialog(null)} />}
    </div>
  );
};

export default App;
