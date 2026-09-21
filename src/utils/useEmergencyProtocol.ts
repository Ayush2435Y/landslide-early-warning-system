import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  DisasterAlertLevel, 
  DisasterLevelDefinition, 
  DISASTER_PROTOCOL_LEVELS, 
  SOPChecklistItem, 
  DEFAULT_PROTOCOL_SOPS, 
  ProtocolUserRole, 
  EvacuationBroadcastPayload 
} from '../types/protocol';
import { 
  computeGeotechnicalPhysics, 
  SCANNER_LOCATIONS, 
  ScannerSiteGeotechnicalData 
} from './physicsFormulas';
import { playAlertChime } from './audioAlert';
import { SensorData } from '../types';

const STORAGE_KEY_COMPLETED_TASKS = 'disaster_protocol_sop_completed_ids';
const STORAGE_KEY_ACTIVE_EVACUATION = 'disaster_protocol_active_evacuation';
const STORAGE_KEY_SIREN_MUTED = 'disaster_protocol_siren_muted';

export interface UseEmergencyProtocolOptions {
  sensors?: SensorData[];
  scannerSiteId?: string;
  autoPlayAudio?: boolean;
  sirenIntervalMs?: number;
  initialRole?: ProtocolUserRole;
}

export interface GeotechnicalThreatMetrics {
  factorOfSafety: number;
  factorOfSafetyLabel: string;
  porePressureKPa: number;
  soilMoisturePct: number;
  displacementMm: number;
  displacementRateMmH: number;
  rainfall24hMm: number;
  rainfallRateMmH: number;
  criticalConditionsDetected: string[];
}

export interface UseEmergencyProtocolResult {
  // Threat & Level Status
  alertLevel: DisasterAlertLevel;
  alertLevelInfo: DisasterLevelDefinition;
  isEvacuationLevel: boolean;
  highestThreatSector: string;
  metrics: GeotechnicalThreatMetrics;

  // Siren & Audio Alert Controls
  isSirenActive: boolean;
  isSirenMuted: boolean;
  toggleSirenMute: () => void;
  triggerManualSiren: () => void;
  silenceSiren: () => void;

  // SOP Checklist State & Management
  completedTaskIds: string[];
  toggleTask: (taskId: string) => void;
  isTaskCompleted: (taskId: string) => boolean;
  getTasksForRole: (role: ProtocolUserRole, levelFilter?: DisasterAlertLevel) => SOPChecklistItem[];
  getChecklistProgress: (role?: ProtocolUserRole) => {
    completed: number;
    total: number;
    percent: number;
    mandatoryCompleted: boolean;
  };
  resetChecklist: () => void;

  // Evacuation Order Lifecycle
  activeEvacuation: EvacuationBroadcastPayload | null;
  executeEvacuation: (customPayload?: Partial<EvacuationBroadcastPayload>) => EvacuationBroadcastPayload;
  cancelEvacuation: () => void;
}

export function useEmergencyProtocol(options: UseEmergencyProtocolOptions = {}): UseEmergencyProtocolResult {
  const {
    sensors = [],
    scannerSiteId,
    autoPlayAudio = true,
    sirenIntervalMs = 12000,
    initialRole = 'admin',
  } = options;

  // ─── 1. SOP Checklist Persistence ──────────────────────────────────────────
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPLETED_TASKS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleTask = useCallback((taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId];
      try {
        localStorage.setItem(STORAGE_KEY_COMPLETED_TASKS, JSON.stringify(next));
      } catch (err) {
        console.warn('Failed to persist protocol SOP task:', err);
      }
      return next;
    });
  }, []);

  const isTaskCompleted = useCallback((taskId: string) => {
    return completedTaskIds.includes(taskId);
  }, [completedTaskIds]);

  const resetChecklist = useCallback(() => {
    setCompletedTaskIds([]);
    try {
      localStorage.removeItem(STORAGE_KEY_COMPLETED_TASKS);
    } catch (err) {
      console.warn('Failed to clear protocol SOP checklist:', err);
    }
  }, []);

  // ─── 2. Active Evacuation Order State ──────────────────────────────────────
  const [activeEvacuation, setActiveEvacuation] = useState<EvacuationBroadcastPayload | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_EVACUATION);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // ─── 3. Audio Siren State & Mute Preference ────────────────────────────────
  const [isSirenMuted, setIsSirenMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SIREN_MUTED) === 'true';
    } catch {
      return false;
    }
  });

  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const sirenIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevAlertLevelRef = useRef<DisasterAlertLevel>(DisasterAlertLevel.LEVEL_0_NORMAL);

  const toggleSirenMute = useCallback(() => {
    setIsSirenMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_SIREN_MUTED, String(next));
      } catch {}
      return next;
    });
  }, []);

  const triggerManualSiren = useCallback(() => {
    setIsSirenActive(true);
    playAlertChime('critical');
    setTimeout(() => {
      playAlertChime('critical');
    }, 450);
  }, []);

  const silenceSiren = useCallback(() => {
    setIsSirenActive(false);
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
  }, []);

  // ─── 4. Geotechnical & Physics Computation ─────────────────────────────────
  const selectedSite: ScannerSiteGeotechnicalData = useMemo(() => {
    if (scannerSiteId) {
      const found = SCANNER_LOCATIONS.find((s) => s.id === scannerSiteId || s.stationCode === scannerSiteId);
      if (found) return found;
    }
    // Default to the first critical/highest-risk scanner site (e.g. Pasighat S-07)
    return SCANNER_LOCATIONS[0];
  }, [scannerSiteId]);

  const { calculatedLevel, metrics, threatSector } = useMemo(() => {
    // Run authoritative 13-formula geotechnical solver on the representative/selected site
    const physics = computeGeotechnicalPhysics(selectedSite);
    const criticalReasons: string[] = [];

    // Synthesize sensor real-time telemetry if available
    let maxPorePressure = selectedSite.porePressureKPa;
    let maxMoisture = selectedSite.soilMoisturePct;
    let maxDisplacement = selectedSite.displacementTotalMm;
    let maxDisplacementRate = selectedSite.displacementRateMmH;
    let maxRainRate = selectedSite.rainfallRateMmH;
    let maxRain24h = selectedSite.rainfallAccumulation24hMm;
    let detectedSector = selectedSite.area || selectedSite.name;

    if (sensors && sensors.length > 0) {
      for (const s of sensors) {
        if (s.porePressure !== undefined && s.porePressure > maxPorePressure) {
          maxPorePressure = s.porePressure;
          detectedSector = s.sector || detectedSector;
        }
        if (s.soilMoisture !== undefined && s.soilMoisture > maxMoisture) {
          maxMoisture = s.soilMoisture;
        }
        if (s.displacement !== undefined && s.displacement > maxDisplacement) {
          maxDisplacement = s.displacement;
        }
        if (s.rainfallRate !== undefined && s.rainfallRate > maxRainRate) {
          maxRainRate = s.rainfallRate;
        }
        if (s.rainfallMm !== undefined && s.rainfallMm > maxRain24h) {
          maxRain24h = s.rainfallMm;
        }
      }
    }

    const calculatedFS = physics.factorOfSafety.fs;

    // Evaluate against standardized physics thresholds
    if (calculatedFS < 1.0) {
      criticalReasons.push(`Factor of Safety breached (FS = ${calculatedFS.toFixed(2)} < 1.0)`);
    }
    if (maxPorePressure >= 55) {
      criticalReasons.push(`Extreme hydrostatic pore pressure (${maxPorePressure.toFixed(1)} kPa >= 55 kPa)`);
    }
    if (maxMoisture >= 88) {
      criticalReasons.push(`Soil saturation threshold exceeded (${maxMoisture.toFixed(1)}% >= 88%)`);
    }
    if (maxDisplacementRate >= 3.5 || maxDisplacement >= 15) {
      criticalReasons.push(`Active shear displacement rate (${maxDisplacementRate.toFixed(1)} mm/h)`);
    }
    if (maxRain24h >= 180 || maxRainRate >= 65) {
      criticalReasons.push(`Torrential pluvial surcharge (${maxRain24h.toFixed(1)} mm / 24h)`);
    }

    // Determine Multi-Level Threat Classification
    let determinedLevel: DisasterAlertLevel = DisasterAlertLevel.LEVEL_0_NORMAL;

    // If an emergency evacuation order is already active, enforce Level 3
    if (activeEvacuation) {
      determinedLevel = DisasterAlertLevel.LEVEL_3_EVACUATION;
    } else if (
      calculatedFS < 1.0 || 
      (maxPorePressure >= 55 && maxMoisture >= 85) || 
      criticalReasons.length >= 2 ||
      maxDisplacementRate >= 4.0
    ) {
      determinedLevel = DisasterAlertLevel.LEVEL_3_EVACUATION;
    } else if (
      calculatedFS < 1.3 || 
      maxPorePressure >= 45 || 
      maxMoisture >= 80 || 
      maxDisplacementRate >= 2.5 || 
      maxRain24h >= 120
    ) {
      determinedLevel = DisasterAlertLevel.LEVEL_2_STANDBY;
      if (criticalReasons.length === 0) {
        criticalReasons.push(`Pore-water pressure elevated to ${maxPorePressure.toFixed(1)} kPa`);
      }
    } else if (
      calculatedFS < 1.5 || 
      maxPorePressure >= 35 || 
      maxMoisture >= 70 || 
      maxDisplacementRate >= 1.0 || 
      maxRain24h >= 70
    ) {
      determinedLevel = DisasterAlertLevel.LEVEL_1_ADVISORY;
      if (criticalReasons.length === 0) {
        criticalReasons.push(`Heightened monsoon accumulation (${maxRain24h.toFixed(1)} mm / 24h)`);
      }
    }

    const threatMetrics: GeotechnicalThreatMetrics = {
      factorOfSafety: calculatedFS,
      factorOfSafetyLabel: physics.factorOfSafety.label,
      porePressureKPa: Number(maxPorePressure.toFixed(1)),
      soilMoisturePct: Number(maxMoisture.toFixed(1)),
      displacementMm: Number(maxDisplacement.toFixed(1)),
      displacementRateMmH: Number(maxDisplacementRate.toFixed(1)),
      rainfall24hMm: Number(maxRain24h.toFixed(1)),
      rainfallRateMmH: Number(maxRainRate.toFixed(1)),
      criticalConditionsDetected: criticalReasons,
    };

    return {
      calculatedLevel: determinedLevel,
      metrics: threatMetrics,
      threatSector: detectedSector,
    };
  }, [selectedSite, sensors, activeEvacuation]);

  const alertLevelInfo = DISASTER_PROTOCOL_LEVELS[calculatedLevel];
  const isEvacuationLevel = calculatedLevel === DisasterAlertLevel.LEVEL_3_EVACUATION;

  // ─── 5. Audio Siren Automation Cycle ───────────────────────────────────────
  useEffect(() => {
    const prevLevel = prevAlertLevelRef.current;
    prevAlertLevelRef.current = calculatedLevel;

    // Escalation transition chimes
    if (autoPlayAudio && !isSirenMuted) {
      if (calculatedLevel === DisasterAlertLevel.LEVEL_3_EVACUATION) {
        setIsSirenActive(true);
        playAlertChime('critical');
      } else if (calculatedLevel === DisasterAlertLevel.LEVEL_2_STANDBY && prevLevel < DisasterAlertLevel.LEVEL_2_STANDBY) {
        playAlertChime('warning');
      } else if (calculatedLevel === DisasterAlertLevel.LEVEL_1_ADVISORY && prevLevel < DisasterAlertLevel.LEVEL_1_ADVISORY) {
        playAlertChime('info');
      }
    }

    // Continuous siren loop during active Level 3
    if (calculatedLevel === DisasterAlertLevel.LEVEL_3_EVACUATION) {
      setIsSirenActive(true);
      if (!sirenIntervalRef.current) {
        sirenIntervalRef.current = setInterval(() => {
          if (autoPlayAudio && !isSirenMuted) {
            playAlertChime('critical');
          }
        }, sirenIntervalMs);
      }
    } else {
      setIsSirenActive(false);
      if (sirenIntervalRef.current) {
        clearInterval(sirenIntervalRef.current);
        sirenIntervalRef.current = null;
      }
    }

    return () => {
      if (sirenIntervalRef.current) {
        clearInterval(sirenIntervalRef.current);
        sirenIntervalRef.current = null;
      }
    };
  }, [calculatedLevel, autoPlayAudio, isSirenMuted, sirenIntervalMs]);

  // ─── 6. SOP Checklist Filtering & Progress Calculators ──────────────────────
  const getTasksForRole = useCallback(
    (role: ProtocolUserRole, levelFilter?: DisasterAlertLevel): SOPChecklistItem[] => {
      return DEFAULT_PROTOCOL_SOPS.filter((task) => {
        if (task.role !== role) return false;
        if (levelFilter !== undefined) {
          return task.requiredForLevel <= levelFilter;
        }
        return true;
      });
    },
    []
  );

  const getChecklistProgress = useCallback(
    (role?: ProtocolUserRole) => {
      const relevantTasks = role 
        ? DEFAULT_PROTOCOL_SOPS.filter((t) => t.role === role)
        : DEFAULT_PROTOCOL_SOPS;

      const total = relevantTasks.length;
      if (total === 0) {
        return { completed: 0, total: 0, percent: 100, mandatoryCompleted: true };
      }

      const completed = relevantTasks.filter((t) => completedTaskIds.includes(t.id)).length;
      const mandatoryTasks = relevantTasks.filter((t) => t.mandatoryForEvacuation);
      const mandatoryCompleted = mandatoryTasks.every((t) => completedTaskIds.includes(t.id));
      const percent = Math.round((completed / total) * 100);

      return {
        completed,
        total,
        percent,
        mandatoryCompleted,
      };
    },
    [completedTaskIds]
  );

  // ─── 7. Evacuation Execution Handler ───────────────────────────────────────
  const executeEvacuation = useCallback(
    (customPayload: Partial<EvacuationBroadcastPayload> = {}): EvacuationBroadcastPayload => {
      const progress = getChecklistProgress('admin');
      const payload: EvacuationBroadcastPayload = {
        alertLevel: DisasterAlertLevel.LEVEL_3_EVACUATION,
        levelCode: 'Level 3',
        targetSector: customPayload.targetSector || threatSector,
        evacRadius: customPayload.evacRadius || '1.2 km',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        initiatedBy: customPayload.initiatedBy || 'Disaster Response Command (DDMA)',
        userRole: customPayload.userRole || initialRole,
        checklistCompletedCount: progress.completed,
        totalChecklistCount: progress.total,
        dispatchAgencies: {
          notifyDOT: true,
          notifyEmergencyRescue: true,
          notifyNDRF: true,
          activateSirens: true,
          dispatchSMS: true,
          ...customPayload.dispatchAgencies,
        },
        geotechnicalSnapshot: {
          factorOfSafety: metrics.factorOfSafety,
          porePressureKPa: metrics.porePressureKPa,
          soilMoisturePct: metrics.soilMoisturePct,
          displacementMm: metrics.displacementMm,
          rainfall24hMm: metrics.rainfall24hMm,
          ...customPayload.geotechnicalSnapshot,
        },
      };

      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_EVACUATION, JSON.stringify(payload));
      } catch (e) {
        console.warn('Failed to save evacuation order to localStorage:', e);
      }

      setActiveEvacuation(payload);
      setIsSirenActive(true);

      // Play emergency critical blast immediately
      playAlertChime('critical');
      setTimeout(() => playAlertChime('critical'), 400);

      return payload;
    },
    [threatSector, initialRole, metrics, getChecklistProgress]
  );

  const cancelEvacuation = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_EVACUATION);
    } catch (e) {
      console.warn('Failed to clear evacuation from localStorage:', e);
    }
    setActiveEvacuation(null);
    silenceSiren();
    playAlertChime('info');
  }, [silenceSiren]);

  return {
    alertLevel: calculatedLevel,
    alertLevelInfo,
    isEvacuationLevel,
    highestThreatSector: threatSector,
    metrics,
    isSirenActive,
    isSirenMuted,
    toggleSirenMute,
    triggerManualSiren,
    silenceSiren,
    completedTaskIds,
    toggleTask,
    isTaskCompleted,
    getTasksForRole,
    getChecklistProgress,
    resetChecklist,
    activeEvacuation,
    executeEvacuation,
    cancelEvacuation,
  };
}
