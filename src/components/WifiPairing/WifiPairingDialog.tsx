// src/components/WifiPairing/WifiPairingDialog.tsx
import React, { useState } from 'react';
import { Wifi, X, Link as LinkIcon, Loader2 } from 'lucide-react';

interface WifiPairingDialogProps {
  onClose: () => void;
}

export const WifiPairingDialog: React.FC<WifiPairingDialogProps> = ({ onClose }) => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('5555');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean, msg: string } | null>(null);

  const handlePair = async () => {
    setLoading(true);
    setResult(null);
    const res = await window.electronAPI.pairWifi(ip, port, code);
    setResult({ success: res.success, msg: res.output });
    setLoading(false);
  };

  const handleConnect = async () => {
    setLoading(true);
    setResult(null);
    const res = await window.electronAPI.connectWifi(ip, port);
    setResult({ success: res.success, msg: res.output });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
      <div className="w-full max-w-md glass rounded-2xl shadow-2xl overflow-hidden border border-white/10">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">WiFi ADB Pairing</h2>
              <p className="text-[10px] text-slate-500">Connect to device over network</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">IP Address</label>
              <input 
                type="text" value={ip} onChange={(e) => setIp(e.target.value)}
                placeholder="192.168.1.x"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Port</label>
              <input 
                type="text" value={port} onChange={(e) => setPort(e.target.value)}
                placeholder="5555"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Pairing Code (Optional)</label>
            <input 
              type="text" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button 
              onClick={handlePair}
              disabled={loading || !ip}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
              Pair
            </button>
            <button 
              onClick={handleConnect}
              disabled={loading || !ip}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
              Connect
            </button>
          </div>

          {result && (
            <div className={`p-4 rounded-xl text-xs font-mono whitespace-pre-wrap ${result.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {result.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
