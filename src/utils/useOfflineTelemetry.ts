import { useState, useEffect, useCallback, useRef } from 'react';
import { SensorData, IncidentReport } from '../types';
import {
  saveSensorsToIndexedDB,
  loadSensorsFromIndexedDB,
  saveTelemetrySnapshot,
  saveReportsToIndexedDB,
  loadReportsFromIndexedDB,
  getOfflineCacheStats,
  clearOfflineTelemetryCache,
  OfflineStorageStats,
} from './offlineStorage';

export interface UseOfflineTelemetryReturn {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  effectiveOnline: boolean;
  isServingFromCache: boolean;
  lastCachedAt: string | null;
  cacheStats: OfflineStorageStats;
  toggleSimulatedOffline: () => void;
  forceSaveCache: (sensors: SensorData[], reports?: IncidentReport[]) => Promise<void>;
  clearCache: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export function useOfflineTelemetry(
  currentSensors: SensorData[],
  currentReports: IncidentReport[],
  onSensorsLoadedFromCache?: (cached: SensorData[]) => void,
  onReportsLoadedFromCache?: (cached: IncidentReport[]) => void
): UseOfflineTelemetryReturn {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [isServingFromCache, setIsServingFromCache] = useState<boolean>(false);
  const [lastCachedAt, setLastCachedAt] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<OfflineStorageStats>({
    sensorCount: 0,
    snapshotCount: 0,
    reportCount: 0,
    lastCachedTimestamp: null,
    lastOnlineTimestamp: null,
    estimatedSizeKB: 0,
    isAvailable: typeof window !== 'undefined' && !!window.indexedDB,
  });

  const effectiveOnline = isOnline && !isSimulatedOffline;
  const initialLoadDone = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh IndexedDB statistics
  const refreshStats = useCallback(async () => {
    const stats = await getOfflineCacheStats();
    setCacheStats(stats);
    if (stats.lastCachedTimestamp) {
      setLastCachedAt(new Date(stats.lastCachedTimestamp).toLocaleTimeString());
    }
  }, []);

  // 1. Initial boot: check if offline, restore cached state if available
  useEffect(() => {
    async function bootCache() {
      await refreshStats();

      // If browser starts offline or user has previous cache
      if (!navigator.onLine) {
        const cachedSensors = await loadSensorsFromIndexedDB();
        if (cachedSensors && cachedSensors.length > 0) {
          setIsServingFromCache(true);
          if (onSensorsLoadedFromCache) {
            onSensorsLoadedFromCache(cachedSensors);
          }
        }
        const cachedReports = await loadReportsFromIndexedDB();
        if (cachedReports && cachedReports.length > 0 && onReportsLoadedFromCache) {
          onReportsLoadedFromCache(cachedReports);
        }
      } else {
        // Initial cache save of baseline data if cache is empty
        if (currentSensors && currentSensors.length > 0) {
          await saveSensorsToIndexedDB(currentSensors);
          if (currentReports && currentReports.length > 0) {
            await saveReportsToIndexedDB(currentReports);
          }
          await refreshStats();
        }
      }
      initialLoadDone.current = true;
    }

    bootCache();
  }, []);

  // 2. Listen to browser online / offline network events
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setIsServingFromCache(false);
      await refreshStats();
    };

    const handleOffline = async () => {
      setIsOnline(false);
      setIsServingFromCache(true);
      // Attempt to load latest cache
      const cached = await loadSensorsFromIndexedDB();
      if (cached && cached.length > 0 && onSensorsLoadedFromCache) {
        onSensorsLoadedFromCache(cached);
      }
      await refreshStats();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onSensorsLoadedFromCache]);

  // 3. Auto-cache live telemetry to IndexedDB when online (debounced)
  useEffect(() => {
    if (!effectiveOnline || !currentSensors || currentSensors.length === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await saveSensorsToIndexedDB(currentSensors);
      await saveTelemetrySnapshot(currentSensors);
      setLastCachedAt(new Date().toLocaleTimeString());
      await refreshStats();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentSensors, effectiveOnline, refreshStats]);

  // 4. Auto-cache reports on change
  useEffect(() => {
    if (currentReports && currentReports.length > 0) {
      saveReportsToIndexedDB(currentReports).then(refreshStats);
    }
  }, [currentReports, refreshStats]);

  // Toggle simulated offline mode
  const toggleSimulatedOffline = useCallback(() => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      setIsServingFromCache(next);
      return next;
    });
  }, []);

  // Explicitly force save current data to IndexedDB
  const forceSaveCache = useCallback(
    async (sensors: SensorData[], reports?: IncidentReport[]) => {
      await saveSensorsToIndexedDB(sensors);
      await saveTelemetrySnapshot(sensors);
      if (reports) {
        await saveReportsToIndexedDB(reports);
      }
      setLastCachedAt(new Date().toLocaleTimeString());
      await refreshStats();
    },
    [refreshStats]
  );

  // Clear all IndexedDB cache
  const clearCache = useCallback(async () => {
    await clearOfflineTelemetryCache();
    setLastCachedAt(null);
    await refreshStats();
  }, [refreshStats]);

  return {
    isOnline,
    isSimulatedOffline,
    effectiveOnline,
    isServingFromCache,
    lastCachedAt,
    cacheStats,
    toggleSimulatedOffline,
    forceSaveCache,
    clearCache,
    refreshStats,
  };
}
