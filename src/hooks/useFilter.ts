// src/hooks/useFilter.ts
import { useMemo } from 'react';
import { useLogStore } from '@/store/logStore';
import { useFilterStore } from '@/store/filterStore';

export const useFilter = () => {
  const logs = useLogStore((state) => state.logs);
  const { levels, searchQuery, isRegex, packageName, packagePids, timeRangeFilter } = useFilterStore();

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      // Level filter
      if (!levels.has(entry.level)) return false;

      // Package Name / PID filter
      if (packageName.trim() !== '') {
        if (packagePids.length > 0) {
          if (!packagePids.includes(entry.pid)) return false;
        } else {
          // If a package name is active but no PIDs have been active/resolved yet,
          // exclude the logs to keep the stream isolated to the application only.
          return false;
        }
      }

      // Time range filter (Visual scrubbing)
      if (timeRangeFilter) {
        try {
          let timeMs = 0;
          if (entry.timestamp.includes('T')) {
            timeMs = Date.parse(entry.timestamp);
          } else {
            const currentYear = new Date().getFullYear();
            timeMs = Date.parse(`${currentYear}-${entry.timestamp}`);
          }
          if (!isNaN(timeMs)) {
            if (timeMs < timeRangeFilter.start || timeMs > timeRangeFilter.end) {
              return false;
            }
          }
        } catch (e) {
          // Fallback
        }
      }

      // Search query filter
      if (searchQuery.trim() !== '') {
        if (isRegex) {
          try {
            const regex = new RegExp(searchQuery, 'i');
            return regex.test(entry.message) || regex.test(entry.tag);
          } catch (e) {
            return true; // Invalid regex, don't filter out everything
          }
        } else {
          const query = searchQuery.toLowerCase();
          return (
            entry.message.toLowerCase().includes(query) ||
            entry.tag.toLowerCase().includes(query)
          );
        }
      }

      return true;
    });
  }, [logs, levels, searchQuery, isRegex, packageName, packagePids, timeRangeFilter]);

  return filteredLogs;
};
