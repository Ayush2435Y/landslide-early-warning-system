import { SensorData, IncidentReport, AlertItem } from '../types';

const DB_NAME = 'Lithos_Geotech_Telemetry_DB';
const DB_VERSION = 1;

export interface TelemetrySnapshot {
  id?: number;
  timestamp: string;
  epoch: number;
  sensors: SensorData[];
  criticalCount: number;
  warningCount: number;
  averageSoilMoisture: number;
  maxPorePressure: number;
}

export interface OfflineStorageStats {
  sensorCount: number;
  snapshotCount: number;
  reportCount: number;
  lastCachedTimestamp: string | null;
  lastOnlineTimestamp: string | null;
  estimatedSizeKB: number;
  isAvailable: boolean;
}

/**
 * Open or create the IndexedDB instance for telemetry caching
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this browser/environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Store for latest state of each sensor by ID
      if (!db.objectStoreNames.contains('sensors')) {
        db.createObjectStore('sensors', { keyPath: 'id' });
      }

      // 2. Store for time-series telemetry snapshots
      if (!db.objectStoreNames.contains('snapshots')) {
        const snapshotStore = db.createObjectStore('snapshots', { keyPath: 'id', autoIncrement: true });
        snapshotStore.createIndex('epoch', 'epoch', { unique: false });
      }

      // 3. Store for incident reports
      if (!db.objectStoreNames.contains('reports')) {
        db.createObjectStore('reports', { keyPath: 'id' });
      }

      // 4. Store for key-value offline metadata
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Save current sensors array to IndexedDB
 */
export async function saveSensorsToIndexedDB(sensors: SensorData[]): Promise<void> {
  if (!sensors || sensors.length === 0) return;
  try {
    const db = await openDB();
    const tx = db.transaction(['sensors', 'metadata'], 'readwrite');
    const sensorStore = tx.objectStore('sensors');
    const metaStore = tx.objectStore('metadata');

    for (const sensor of sensors) {
      sensorStore.put({
        ...sensor,
        _cachedAt: new Date().toISOString(),
      });
    }

    metaStore.put({
      key: 'last_sensor_cache',
      timestamp: new Date().toISOString(),
      count: sensors.length,
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to cache sensors to IndexedDB:', err);
  }
}

/**
 * Load latest cached sensors from IndexedDB
 */
export async function loadSensorsFromIndexedDB(): Promise<SensorData[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction('sensors', 'readonly');
    const store = tx.objectStore('sensors');
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const results = request.result;
        if (results && results.length > 0) {
          resolve(results as SensorData[]);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed to read sensors from IndexedDB:', err);
    return null;
  }
}

/**
 * Save a telemetry snapshot frame into time-series cache
 */
export async function saveTelemetrySnapshot(sensors: SensorData[]): Promise<void> {
  if (!sensors || sensors.length === 0) return;
  try {
    const db = await openDB();
    const tx = db.transaction('snapshots', 'readwrite');
    const store = tx.objectStore('snapshots');

    const criticalCount = sensors.filter(s => s.status === 'critical').length;
    const warningCount = sensors.filter(s => s.status === 'warning').length;
    const soilMoistures = sensors.map(s => s.soilMoisture ?? 65).filter(n => typeof n === 'number');
    const avgSoil = soilMoistures.length ? +(soilMoistures.reduce((a, b) => a + b, 0) / soilMoistures.length).toFixed(1) : 65;
    const maxPore = Math.max(...sensors.filter(s => s.type === 'piezometer').map(s => s.value), 35);

    const snapshot: TelemetrySnapshot = {
      timestamp: new Date().toISOString(),
      epoch: Date.now(),
      sensors,
      criticalCount,
      warningCount,
      averageSoilMoisture: avgSoil,
      maxPorePressure: maxPore,
    };

    store.add(snapshot);

    // Keep only the most recent 120 snapshots to preserve storage
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result > 120) {
        const cursorReq = store.openCursor();
        let deleted = 0;
        const toDelete = countReq.result - 100;
        cursorReq.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result;
          if (cursor && deleted < toDelete) {
            cursor.delete();
            deleted++;
            cursor.continue();
          }
        };
      }
    };
  } catch (err) {
    console.warn('Failed to save telemetry snapshot to IndexedDB:', err);
  }
}

/**
 * Save incident reports to IndexedDB
 */
export async function saveReportsToIndexedDB(reports: IncidentReport[]): Promise<void> {
  if (!reports || reports.length === 0) return;
  try {
    const db = await openDB();
    const tx = db.transaction('reports', 'readwrite');
    const store = tx.objectStore('reports');

    for (const report of reports) {
      store.put(report);
    }
  } catch (err) {
    console.warn('Failed to save reports to IndexedDB:', err);
  }
}

/**
 * Load incident reports from IndexedDB
 */
export async function loadReportsFromIndexedDB(): Promise<IncidentReport[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction('reports', 'readonly');
    const store = tx.objectStore('reports');
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const results = request.result;
        if (results && results.length > 0) {
          resolve(results as IncidentReport[]);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed to read reports from IndexedDB:', err);
    return null;
  }
}

/**
 * Fetch stats about the IndexedDB telemetry cache
 */
export async function getOfflineCacheStats(): Promise<OfflineStorageStats> {
  const defaultStats: OfflineStorageStats = {
    sensorCount: 0,
    snapshotCount: 0,
    reportCount: 0,
    lastCachedTimestamp: null,
    lastOnlineTimestamp: null,
    estimatedSizeKB: 0,
    isAvailable: typeof window !== 'undefined' && !!window.indexedDB,
  };

  try {
    const db = await openDB();
    const tx = db.transaction(['sensors', 'snapshots', 'reports', 'metadata'], 'readonly');

    const sensorsReq = tx.objectStore('sensors').count();
    const snapshotsReq = tx.objectStore('snapshots').count();
    const reportsReq = tx.objectStore('reports').count();
    const metaReq = tx.objectStore('metadata').get('last_sensor_cache');

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        const sensorCount = sensorsReq.result || 0;
        const snapshotCount = snapshotsReq.result || 0;
        const reportCount = reportsReq.result || 0;
        const meta = metaReq.result;

        // Roughly estimate payload size
        const estKB = Math.round((sensorCount * 1.2) + (snapshotCount * 3.5) + (reportCount * 4.0));

        resolve({
          sensorCount,
          snapshotCount,
          reportCount,
          lastCachedTimestamp: meta?.timestamp || (sensorCount > 0 ? new Date().toISOString() : null),
          lastOnlineTimestamp: meta?.timestamp || null,
          estimatedSizeKB: Math.max(estKB, sensorCount > 0 ? 12 : 0),
          isAvailable: true,
        });
      };

      tx.onerror = () => resolve(defaultStats);
    });
  } catch (err) {
    return defaultStats;
  }
}

/**
 * Clear all cached data in IndexedDB
 */
export async function clearOfflineTelemetryCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(['sensors', 'snapshots', 'reports', 'metadata'], 'readwrite');
    tx.objectStore('sensors').clear();
    tx.objectStore('snapshots').clear();
    tx.objectStore('reports').clear();
    tx.objectStore('metadata').clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to clear IndexedDB cache:', err);
  }
}
