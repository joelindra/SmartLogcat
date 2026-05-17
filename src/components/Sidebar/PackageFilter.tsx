// src/components/Sidebar/PackageFilter.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useFilterStore } from '@/store/filterStore';
import { useDeviceStore } from '@/store/deviceStore';
import { Hash, Loader2, AppWindow, X, Clock } from 'lucide-react';

export const PackageFilter: React.FC = () => {
  const { packageName, setPackageName, setPackagePids } = useFilterStore();
  const { selectedDeviceId } = useDeviceStore();

  const [packages, setPackages] = useState<string[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load recently used packages on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('recent_packages');
      if (cached) {
        setRecentlyUsed(JSON.parse(cached));
      }
    } catch (e) {}
  }, []);

  // Save package to recently used list
  const saveToRecent = (pkg: string) => {
    if (!pkg.trim() || pkg.includes(' ') || pkg.length < 3) return;
    const updated = [pkg, ...recentlyUsed.filter(p => p !== pkg)].slice(0, 5);
    setRecentlyUsed(updated);
    try {
      localStorage.setItem('recent_packages', JSON.stringify(updated));
    } catch (e) {}
  };

  // Hybrid Fast-Fetch installed packages from connected device
  useEffect(() => {
    if (!selectedDeviceId) {
      setPackages([]);
      return;
    }
    
    const fetchPackages = async () => {
      setLoading(true);
      try {
        // Step 1: Instantly query currently running packages via fast shell ps (~50ms)
        const psResult = await window.electronAPI.execAdb(`-s ${selectedDeviceId} shell "ps -A || ps"`);
        let activePkgs: string[] = [];
        if (psResult.success && psResult.output) {
          const lines = psResult.output.split('\n');
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const name = parts[parts.length - 1];
            // Match typical java-like android packages
            if (name && /^[a-z0-9_]+\.[a-z0-9_]+\.[a-z0-9_.]+$/.test(name) && 
                !name.startsWith('android.') && 
                !name.startsWith('/system/') &&
                name !== 'ps' && name !== 'sh') {
              activePkgs.push(name);
            }
          }
          activePkgs = Array.from(new Set(activePkgs));
          if (activePkgs.length > 0) {
            setPackages(activePkgs); // Update state instantly so list appears under 100ms!
          }
        }

        // Step 2: Load the full installed packages list in the background
        const res = await window.electronAPI.getInstalledPackages(selectedDeviceId);
        if (res.success && res.packages.length > 0) {
          // Merge both lists, preserving active packages at the top
          const merged = Array.from(new Set([...activePkgs, ...res.packages]));
          setPackages(merged);
        }
      } catch (err) {
        console.error('Failed to get device packages:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPackages();
  }, [selectedDeviceId]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic PID Poller (updates process PIDs dynamically when app restarts, crashes, or starts)
  useEffect(() => {
    if (!selectedDeviceId || packageName.trim() === '') {
      setPackagePids([]);
      return;
    }

    const pollPids = async () => {
      try {
        const result = await window.electronAPI.execAdb(`-s ${selectedDeviceId} shell pidof ${packageName}`);
        if (result.success && result.output.trim()) {
          const pids = result.output.trim().split(/\s+/).map(Number).filter((n: number) => !isNaN(n));
          setPackagePids(pids);
        } else {
          setPackagePids([]);
        }
      } catch (err) {
        setPackagePids([]);
      }
    };

    pollPids();

    const interval = setInterval(pollPids, 1500);
    return () => clearInterval(interval);
  }, [selectedDeviceId, packageName, setPackagePids]);

  const handleUpdate = (val: string) => {
    setPackageName(val);
    if (val.trim() === '' || !selectedDeviceId) {
      setPackagePids([]);
    }
  };

  const handleSelectPackage = (pkg: string) => {
    handleUpdate(pkg);
    saveToRecent(pkg);
    setShowDropdown(false);
  };

  const handleClear = () => {
    handleUpdate('');
    setShowDropdown(false);
  };

  // Real-time package filtering based on user input
  const filteredPackages = packages.filter(pkg => 
    pkg.toLowerCase().includes(packageName.toLowerCase())
  );

  // Limit rendering to top 20 items to prevent DOM/React lag
  const visiblePackages = filteredPackages.slice(0, 20);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          placeholder={selectedDeviceId ? "Search or type package..." : "Select a device first"}
          value={packageName}
          disabled={!selectedDeviceId}
          onFocus={() => setShowDropdown(true)}
          onChange={(e) => handleUpdate(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              saveToRecent(packageName);
              setShowDropdown(false);
            }
          }}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-8 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        <div className="absolute left-3 top-2.5 flex items-center justify-center">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          ) : (
            <Hash className="w-3.5 h-3.5 text-slate-500" />
          )}
        </div>

        {packageName && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 p-0.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            title="Clear Filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Auto-suggest Dropdown */}
      {showDropdown && selectedDeviceId && (filteredPackages.length > 0 || packages.length > 0 || recentlyUsed.length > 0) && (
        <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-50 p-1.5 scrollbar-thin">
          
          {/* Recently Used Section */}
          {packageName === '' && recentlyUsed.length > 0 && (
            <div className="mb-2">
              <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider px-2 py-1 select-none flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                Recently Used Packages
              </div>
              <div className="space-y-0.5 mt-0.5">
                {recentlyUsed.map((pkg) => (
                  <button
                    key={`recent-${pkg}`}
                    onClick={() => handleSelectPackage(pkg)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200 transition-colors truncate font-mono flex items-center gap-2"
                  >
                    <AppWindow className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    <span className="truncate">{pkg}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Installed Packages Section */}
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider px-2 py-1 select-none flex justify-between">
            <span>{packageName === '' ? 'Installed Device Packages' : 'Matching Installed Packages'}</span>
            {filteredPackages.length > 20 && (
              <span className="text-blue-400 normal-case font-normal text-[8px]">
                Showing 20 of {filteredPackages.length}
              </span>
            )}
          </div>
          
          <div className="mt-1 space-y-0.5">
            {visiblePackages.length > 0 ? (
              visiblePackages.map((pkg) => (
                <button
                  key={pkg}
                  onClick={() => handleSelectPackage(pkg)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-slate-300 hover:bg-blue-500/20 hover:text-blue-200 transition-colors truncate font-mono flex items-center gap-2"
                >
                  <AppWindow className="w-3 h-3 text-blue-400 flex-shrink-0" />
                  <span className="truncate">{pkg}</span>
                </button>
              ))
            ) : (
              packageName !== '' && (
                <div className="px-2.5 py-1.5 text-[10px] text-slate-600 italic select-none">
                  No matching packages found
                </div>
              )
            )}
          </div>

          {filteredPackages.length > 20 && (
            <div className="text-[8px] text-slate-600 italic px-2.5 py-1 select-none border-t border-white/[0.02] mt-1 text-center">
              Type to refine search...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
