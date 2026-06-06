"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook for real-time data synchronization via polling.
 * Automatically refreshes data at a configurable interval.
 * 
 * @param fetchFn - The function to call for refreshing data
 * @param intervalMs - Polling interval in milliseconds (default: 15000 = 15 seconds)
 * @param enabled - Whether polling is active (default: true)
 */
export function useRealtimeSync(
  fetchFn: () => Promise<void> | void,
  intervalMs: number = 15000,
  enabled: boolean = true
) {
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const fetchRef = useRef(fetchFn);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep fetchFn ref up to date
  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  const manualSync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetchRef.current();
      setLastSynced(new Date());
    } catch (err) {
      console.error("Realtime sync error:", err);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial sync
    manualSync();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      manualSync();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, manualSync]);

  return {
    lastSynced,
    syncing,
    manualSync,
    /** Format the last synced time as a readable string */
    lastSyncedText: lastSynced
      ? lastSynced.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : null,
  };
}
