// src/components/Session/TriggerManagerDialog.tsx
import React, { useState } from 'react';
import { useFilterStore, TriggerRule } from '@/store/filterStore';
import { X, Plus, Trash2, Volume2, Bell, Sparkles, Hash, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TriggerManagerDialogProps {
  onClose: () => void;
}

const PRESET_COLORS = [
  '#f43f5e', // Neon Rose
  '#a855f7', // Neon Purple
  '#3b82f6', // Neon Blue
  '#06b6d4', // Neon Cyan
  '#10b981', // Neon Emerald
  '#eab308', // Neon Gold
  '#f97316', // Neon Orange
];

export const TriggerManagerDialog: React.FC<TriggerManagerDialogProps> = ({ onClose }) => {
  const { triggerRules, addTriggerRule, removeTriggerRule, toggleTriggerRule } = useFilterStore();
  
  // Rule creation states
  const [pattern, setPattern] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [notify, setNotify] = useState(true);
  const [sound, setSound] = useState(true);
  const [highlight, setHighlight] = useState(true);
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern.trim()) return;

    addTriggerRule({
      pattern: pattern.trim(),
      isRegex,
      notify,
      sound,
      highlight,
      color,
      active: true
    });

    // Reset fields
    setPattern('');
    setIsRegex(false);
  };

  const playTestChime = () => {
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
      console.error('AudioContext test failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-2xl bg-[#0a0a14]/90 border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.15)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.04] flex justify-between items-center bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h2 className="text-sm uppercase font-bold tracking-widest text-slate-100">
              Smart Log Triggers & Alerts cockpit
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* Create Rule Form */}
          <form onSubmit={handleCreateRule} className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl flex flex-col gap-4">
            <h3 className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
              Create New Custom Alert Trigger
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="e.g. NullPointerException, API_ERROR, Failed to load"
                  className="w-full h-10 pl-3 pr-16 bg-[#121224]/50 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setIsRegex(!isRegex)}
                  className={`absolute right-2 top-2 h-6 px-2 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                    isRegex ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  REGEX
                </button>
              </div>
              <button
                type="submit"
                className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] cursor-pointer flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Alert Trigger
              </button>
            </div>

            {/* Actions and Highlight Color Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/[0.04] pt-4">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Alert Actions
                </label>
                <div className="flex flex-wrap gap-4 text-xs">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notify}
                      onChange={(e) => setNotify(e.target.checked)}
                      className="rounded border-white/20 text-indigo-600 focus:ring-0 bg-[#121224]/50 cursor-pointer"
                    />
                    <Bell className="w-3.5 h-3.5 text-indigo-400" />
                    Push Notification
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sound}
                      onChange={(e) => setSound(e.target.checked)}
                      className="rounded border-white/20 text-indigo-600 focus:ring-0 bg-[#121224]/50 cursor-pointer"
                    />
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    Chime Sound
                    <button
                      type="button"
                      onClick={playTestChime}
                      className="ml-1 px-1 bg-white/5 hover:bg-white/10 text-[9px] font-bold rounded text-slate-400 hover:text-white cursor-pointer"
                    >
                      TEST
                    </button>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Neon Row Highlight Glow
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={highlight}
                      onChange={(e) => setHighlight(e.target.checked)}
                      className="rounded border-white/20 text-indigo-600 focus:ring-0 bg-[#121224]/50 cursor-pointer"
                    />
                    Enabled
                  </label>
                </div>
                {highlight && (
                  <div className="flex items-center gap-2">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setColor(preset)}
                        className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                          color === preset ? 'border-white scale-110' : 'border-transparent scale-90 hover:scale-100'
                        }`}
                        style={{
                          backgroundColor: preset,
                          boxShadow: color === preset ? `0 0 10px ${preset}` : 'none'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Active Rules List */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-slate-500" />
              Active Trigger Rules ({triggerRules.length})
            </h3>
            
            {triggerRules.length === 0 ? (
              <div className="text-center py-8 bg-white/[0.01] border border-dashed border-white/[0.04] rounded-xl text-xs text-slate-500">
                No active smart alert triggers. Add one above to protect your stream!
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {triggerRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between p-3.5 bg-white/[0.02] border rounded-xl transition-all ${
                      rule.active ? 'border-white/[0.05]' : 'border-white/[0.02] opacity-55'
                    }`}
                    style={{
                      boxShadow: rule.active && rule.highlight ? `inset 4px 0 0 ${rule.color}` : 'none'
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={rule.active}
                        onChange={() => toggleTriggerRule(rule.id)}
                        className="rounded border-white/20 text-indigo-600 focus:ring-0 bg-[#121224]/50 cursor-pointer"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-mono font-bold text-white truncate flex items-center gap-2">
                          {rule.pattern}
                          {rule.isRegex && (
                            <span className="px-1 bg-indigo-500/20 text-indigo-300 text-[8px] font-bold rounded">
                              REGEX
                            </span>
                          )}
                        </span>
                        
                        {/* Config indicators */}
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          {rule.notify && (
                            <span className="flex items-center gap-0.5 text-indigo-400/80">
                              <Bell className="w-2.5 h-2.5" />
                              Notify
                            </span>
                          )}
                          {rule.sound && (
                            <span className="flex items-center gap-0.5 text-emerald-400/80">
                              <Volume2 className="w-2.5 h-2.5" />
                              Chime
                            </span>
                          )}
                          {rule.highlight && (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rule.color }} />
                              Glow
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeTriggerRule(rule.id)}
                      className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.04] bg-white/[0.01] flex justify-between items-center">
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Rules are evaluated in real-time as logs arrive.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
};
