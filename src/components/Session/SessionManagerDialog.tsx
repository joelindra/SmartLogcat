// src/components/Session/SessionManagerDialog.tsx
import React, { useState, useEffect } from 'react';
import { History, X, Play, Trash2, Calendar, Smartphone } from 'lucide-react';
import { LogSession } from '@/types';
import { useLogStore } from '@/store/logStore';

interface SessionManagerDialogProps {
  onClose: () => void;
}

export const SessionManagerDialog: React.FC<SessionManagerDialogProps> = ({ onClose }) => {
  const [sessions, setSessions] = useState<LogSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { clearLogs, addLog, setPaused } = useLogStore();

  const fetchSessions = async () => {
    const data = await window.electronAPI.listSessions();
    setSessions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleLoad = async (id: string) => {
    const session = await window.electronAPI.loadSession(id);
    if (session && session.logs) {
      clearLogs();
      setPaused(true);
      session.logs.forEach((log: any) => addLog(log));
      onClose();
    }
  };

  const handleDelete = async (id: string) => {
    await window.electronAPI.deleteSession(id);
    fetchSessions();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
      <div className="w-full max-w-2xl glass rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Session History</h2>
              <p className="text-[10px] text-slate-500">Restore or manage previous log sessions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-3">
          {sessions.length === 0 && !loading && (
            <div className="text-slate-600 text-center py-20 flex flex-col items-center gap-4">
              <History className="w-12 h-12 opacity-10" />
              <span>No saved sessions yet</span>
            </div>
          )}

          {sessions.map((session) => (
            <div key={session.id} className="glass-card rounded-xl p-4 flex items-center justify-between border border-white/5 hover:border-emerald-500/30">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-white">{session.name}</h3>
                <div className="flex items-center gap-4 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(session.startedAt).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    {session.deviceId}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleLoad(session.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Load
                </button>
                <button 
                  onClick={() => handleDelete(session.id)}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
