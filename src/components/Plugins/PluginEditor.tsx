// src/components/Plugins/PluginEditor.tsx
import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { CustomRule } from '@/types';
import { nanoid } from 'nanoid';

interface PluginEditorProps {
  onClose: () => void;
}

export const PluginEditor: React.FC<PluginEditorProps> = ({ onClose }) => {
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        if (window.electronAPI && window.electronAPI.getRules) {
          const data = await window.electronAPI.getRules();
          setRules(data || []);
        } else {
          // Browser preview fallback
          const localData = localStorage.getItem('mock_plugin_rules');
          if (localData) {
            setRules(JSON.parse(localData));
          } else {
            setRules([
              {
                id: 'rule_1',
                name: 'Retrofit Error',
                pattern: 'Retrofit',
                isRegex: false,
                highlightColor: '#ff6b6b',
                notify: false,
                enabled: true
              },
              {
                id: 'rule_2',
                name: 'OkHttp Failure',
                pattern: 'OkHttp',
                isRegex: false,
                highlightColor: '#feca57',
                notify: false,
                enabled: true
              }
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to get rules:', err);
        setRules([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  const addRule = () => {
    const newRule: CustomRule = {
      id: nanoid(),
      name: 'New Rule',
      pattern: '',
      isRegex: false,
      highlightColor: '#3b82f6',
      notify: false,
      enabled: true
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<CustomRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    try {
      if (window.electronAPI && window.electronAPI.saveRules) {
        await window.electronAPI.saveRules(rules);
      } else {
        localStorage.setItem('mock_plugin_rules', JSON.stringify(rules));
      }
    } catch (err) {
      console.error('Failed to save rules:', err);
    }
    onClose();
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
      <div className="w-full max-w-2xl glass rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Highlight Rules</h2>
              <p className="text-[10px] text-slate-500">Customize log appearance and notifications</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
          {rules.map((rule) => (
            <div key={rule.id} className="glass-card rounded-xl p-4 flex flex-col gap-4 border border-white/5">
              <div className="flex items-center justify-between">
                <input 
                  type="text" value={rule.name} onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                  className="bg-transparent border-none text-sm font-bold text-white focus:outline-none focus:ring-0 w-1/2"
                />
                <div className="flex items-center gap-3">
                  <button onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}>
                    {rule.enabled ? <ToggleRight className="text-blue-500" /> : <ToggleLeft className="text-slate-600" />}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="text-rose-500 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pattern</label>
                  <input 
                    type="text" value={rule.pattern} onChange={(e) => updateRule(rule.id, { pattern: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Highlight Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" value={rule.highlightColor} onChange={(e) => updateRule(rule.id, { highlightColor: e.target.value })}
                      className="w-8 h-8 rounded bg-transparent border-none p-0 cursor-pointer"
                    />
                    <input 
                      type="text" value={rule.highlightColor} onChange={(e) => updateRule(rule.id, { highlightColor: e.target.value })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <button 
            onClick={addRule}
            className="w-full py-4 rounded-xl border border-dashed border-white/10 text-slate-500 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Rule
          </button>
        </div>

        <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
