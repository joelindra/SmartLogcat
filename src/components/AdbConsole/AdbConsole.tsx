// src/components/AdbConsole/AdbConsole.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, ChevronRight, X } from 'lucide-react';

interface AdbConsoleProps {
  onClose: () => void;
}

export const AdbConsole: React.FC<AdbConsoleProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ type: 'cmd' | 'res', text: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleRun = async () => {
    if (!input.trim()) return;
    
    const cmd = input.trim();
    setHistory(prev => [...prev, { type: 'cmd', text: cmd }]);
    setInput('');

    const result = await window.electronAPI.execAdb(cmd);
    setHistory(prev => [...prev, { type: 'res', text: result.output }]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="absolute bottom-12 right-4 w-[500px] h-80 glass rounded-xl shadow-2xl flex flex-col overflow-hidden border border-blue-500/30 z-50 animate-fade-in">
      <div className="h-10 bg-blue-500/20 px-4 flex items-center justify-between border-b border-blue-500/20">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">ADB Console</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
          <X className="w-4 h-4 text-blue-300" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto font-mono text-[11px] flex flex-col gap-2 bg-black/40">
        {history.map((item, i) => (
          <div key={i} className={item.type === 'cmd' ? 'text-blue-300' : 'text-slate-400 whitespace-pre-wrap pl-4'}>
            {item.type === 'cmd' && <span className="text-blue-500 mr-2">$ adb</span>}
            {item.text}
          </div>
        ))}
        {history.length === 0 && (
          <div className="text-slate-600 text-center mt-10">Run commands like "shell dumpsys battery"</div>
        )}
      </div>

      <div className="p-2 bg-[#0f172a] border-t border-white/5 flex gap-2">
        <div className="flex-1 relative">
          <ChevronRight className="absolute left-2 top-2.5 w-3 h-3 text-blue-500" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            placeholder="shell getprop..."
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-xs text-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button 
          onClick={handleRun}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
