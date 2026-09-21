import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, 
  X, 
  Radio, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Check, 
  Megaphone,
  Truck,
  Users,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  HelpCircle,
  Flame,
  ArrowRight,
  Compass,
  FileCheck2,
  BellRing
} from 'lucide-react';
import { 
  DisasterAlertLevel, 
  DISASTER_PROTOCOL_LEVELS, 
  ProtocolUserRole, 
  SOPChecklistItem, 
  EvacuationBroadcastPayload 
} from '../types/protocol';
import { useEmergencyProtocol } from '../utils/useEmergencyProtocol';
import { SensorData } from '../types';

interface EmergencyProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastAlert?: (payload: any) => void;
  sensors?: SensorData[];
  currentRole?: ProtocolUserRole;
  initialAlertLevel?: DisasterAlertLevel;
}

export const EmergencyProtocolModal: React.FC<EmergencyProtocolModalProps> = ({
  isOpen,
  onClose,
  onBroadcastAlert,
  sensors = [],
  currentRole = 'admin',
  initialAlertLevel,
}) => {
  // Integrate the automated emergency protocol hook
  const {
    alertLevel: liveAlertLevel,
    alertLevelInfo: liveLevelInfo,
    highestThreatSector,
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
  } = useEmergencyProtocol({
    sensors,
    autoPlayAudio: true,
  });

  // Effective alert level (allow manual simulation or override if requested)
  const [selectedLevelOverride, setSelectedLevelOverride] = useState<DisasterAlertLevel | null>(null);
  const activeLevel = selectedLevelOverride ?? initialAlertLevel ?? liveAlertLevel;
  const levelInfo = DISASTER_PROTOCOL_LEVELS[activeLevel];

  // Role tab for viewing relevant SOP checklists
  const [activeRoleTab, setActiveRoleTab] = useState<ProtocolUserRole>(currentRole);
  
  // Evacuation configuration parameters
  const [targetSector, setTargetSector] = useState<string>(highestThreatSector || 'Sector Alpha (RT-9 Highway Cut)');
  const [evacRadius, setEvacRadius] = useState<string>('1.2km');
  const [notifyDOT, setNotifyDOT] = useState<boolean>(true);
  const [notifyEmergencyRescue, setNotifyEmergencyRescue] = useState<boolean>(true);
  const [notifyNDRF, setNotifyNDRF] = useState<boolean>(true);
  const [activateSirens, setActivateSirens] = useState<boolean>(true);
  const [dispatchSMS, setDispatchSMS] = useState<boolean>(true);

  // High-contrast double-confirmation state machine for Level 3
  // Step 0: Idle -> Step 1: Confirmation Armed -> Step 2: Broadcasting -> Step 3: Success
  const [evacConfirmationArmed, setEvacConfirmationArmed] = useState<boolean>(false);
  const [operatorConfirmationChecked, setOperatorConfirmationChecked] = useState<boolean>(false);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastDone, setBroadcastDone] = useState<boolean>(false);
  const [broadcastSummary, setBroadcastSummary] = useState<EvacuationBroadcastPayload | null>(null);

  // Sync default target sector if highest threat sector updates
  useEffect(() => {
    if (highestThreatSector && targetSector.includes('Sector Alpha')) {
      setTargetSector(highestThreatSector);
    }
  }, [highestThreatSector]);

  // Reset confirmation state when modal closes or level changes
  useEffect(() => {
    if (!isOpen) {
      setEvacConfirmationArmed(false);
      setOperatorConfirmationChecked(false);
      setIsBroadcasting(false);
      setBroadcastDone(false);
    }
  }, [isOpen]);

  const tasksForCurrentRole = useMemo(() => {
    return getTasksForRole(activeRoleTab);
  }, [getTasksForRole, activeRoleTab]);

  const roleProgress = useMemo(() => {
    return getChecklistProgress(activeRoleTab);
  }, [getChecklistProgress, activeRoleTab]);

  if (!isOpen) return null;

  // Armed double confirmation trigger handler
  const handleArmConfirmation = () => {
    setEvacConfirmationArmed(true);
    setOperatorConfirmationChecked(false);
  };

  const handleCancelConfirmation = () => {
    setEvacConfirmationArmed(false);
    setOperatorConfirmationChecked(false);
  };

  const handleExecuteEvacuation = () => {
    setIsBroadcasting(true);

    const payload = executeEvacuation({
      targetSector,
      evacRadius,
      userRole: activeRoleTab,
      dispatchAgencies: {
        notifyDOT,
        notifyEmergencyRescue,
        notifyNDRF,
        activateSirens,
        dispatchSMS,
      },
    });

    setTimeout(() => {
      setIsBroadcasting(false);
      setBroadcastDone(true);
      setBroadcastSummary(payload);

      if (onBroadcastAlert) {
        onBroadcastAlert({
          ...payload,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* ─── 1. MODAL HEADER & THREAT LEVEL BADGE ───────────────────────── */}
        <div className={`p-5 sm:p-6 border-b transition-colors ${
          activeLevel === DisasterAlertLevel.LEVEL_3_EVACUATION
            ? 'bg-red-600 text-white border-red-700'
            : activeLevel === DisasterAlertLevel.LEVEL_2_STANDBY
            ? 'bg-orange-600 text-white border-orange-700'
            : activeLevel === DisasterAlertLevel.LEVEL_1_ADVISORY
            ? 'bg-amber-500 text-slate-950 border-amber-600'
            : 'bg-slate-900 text-white border-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                activeLevel === DisasterAlertLevel.LEVEL_3_EVACUATION
                  ? 'bg-white text-red-700 animate-pulse'
                  : activeLevel === DisasterAlertLevel.LEVEL_2_STANDBY
                  ? 'bg-white text-orange-700'
                  : activeLevel === DisasterAlertLevel.LEVEL_1_ADVISORY
                  ? 'bg-slate-950 text-amber-400'
                  : 'bg-emerald-500 text-slate-950'
              }`}>
                <ShieldAlert className="w-7 h-7" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest font-black opacity-90">
                    Disaster Protocol Command
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    activeLevel === DisasterAlertLevel.LEVEL_3_EVACUATION
                      ? 'bg-black/30 text-white border border-white/40 animate-pulse'
                      : 'bg-black/20 text-current border border-current/30'
                  }`}>
                    {levelInfo.code} &bull; {levelInfo.name}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                  {levelInfo.label}
                </h2>
              </div>
            </div>

            {/* Quick Siren Mute & Close Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleSirenMute}
                title={isSirenMuted ? 'Unmute Audio Siren' : 'Mute Audio Siren'}
                className={`p-2 rounded-xl transition-all ${
                  isSirenMuted
                    ? 'bg-black/20 hover:bg-black/30 text-current'
                    : 'bg-white/20 hover:bg-white/30 text-white animate-bounce'
                }`}
              >
                {isSirenMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-black/20 hover:bg-black/30 text-current transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Level description banner */}
          <p className="text-xs sm:text-sm mt-3 opacity-95 leading-relaxed font-medium">
            {levelInfo.description}
          </p>
        </div>

        {/* ─── 2. BROADCAST SUCCESS SCREEN ────────────────────────────────── */}
        {broadcastDone && broadcastSummary ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                Official Geotechnical Directive Dispatched
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                Emergency Evacuation Protocol Activated
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                All civil defense agencies, local SDRF/NDRF search-and-rescue battalions, and cellular tower emergency broadcasts have received the order.
              </p>
            </div>

            {/* Broadcast Metrics Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2 font-mono">
                <span className="text-slate-500">Sector Excluded:</span>
                <span className="font-bold text-slate-900 dark:text-white">{broadcastSummary.targetSector}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2 font-mono">
                <span className="text-slate-500">Exclusion Radius:</span>
                <span className="font-bold text-red-600">{broadcastSummary.evacRadius}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2 font-mono">
                <span className="text-slate-500">Dispatch Time:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{broadcastSummary.timestamp}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Factor of Safety (FS):</span>
                <span className="font-bold text-red-600">{metrics.factorOfSafety.toFixed(2)} (Shear Failure)</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  cancelEvacuation();
                  setBroadcastDone(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
              >
                Revoke / Stand Down Order
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors shadow-md"
              >
                Dismiss Window & Monitor Live Feeds
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">

            {/* ─── 3. GEOTECHNICAL SENSOR PHYSICS TELEMETRY BAR ───────────── */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-500" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Live Geotechnical Physics Diagnostics
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Sector: {highestThreatSector}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className={`p-2.5 rounded-xl border ${
                  metrics.factorOfSafety < 1.0 
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 text-red-700 dark:text-red-300' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-900 dark:text-white'
                }`}>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Factor of Safety</span>
                  <span className="text-base font-black tracking-tight mt-0.5 block">
                    FS {metrics.factorOfSafety.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500 block">
                    {metrics.factorOfSafety < 1.0 ? 'Failure Active' : metrics.factorOfSafety < 1.3 ? 'Critical Limit' : 'Stable'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border ${
                  metrics.porePressureKPa >= 50 
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 text-red-700 dark:text-red-300' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-900 dark:text-white'
                }`}>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Pore Pressure (u)</span>
                  <span className="text-base font-black tracking-tight mt-0.5 block">
                    {metrics.porePressureKPa} kPa
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500 block">
                    Limit: 45 kPa
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border ${
                  metrics.soilMoisturePct >= 85 
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 text-red-700 dark:text-red-300' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-900 dark:text-white'
                }`}>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Soil Moisture (VWC)</span>
                  <span className="text-base font-black tracking-tight mt-0.5 block">
                    {metrics.soilMoisturePct}%
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500 block">
                    Saturation Soak
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border ${
                  metrics.displacementRateMmH >= 3.0 
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 text-red-700 dark:text-red-300' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-900 dark:text-white'
                }`}>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Displacement Rate</span>
                  <span className="text-base font-black tracking-tight mt-0.5 block">
                    {metrics.displacementRateMmH} mm/h
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500 block">
                    Total: {metrics.displacementMm} mm
                  </span>
                </div>
              </div>

              {/* Threshold breaches pills */}
              {metrics.criticalConditionsDetected.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {metrics.criticalConditionsDetected.map((condition, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      {condition}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ─── 4. LEVEL 3 DOUBLE-CONFIRMATION EVACUATION ACTION BOX ─────── */}
            {activeLevel === DisasterAlertLevel.LEVEL_3_EVACUATION && (
              <div className="bg-red-500/10 dark:bg-red-950/30 border-2 border-red-600 rounded-3xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
                    </span>
                    <h3 className="text-base font-black text-red-700 dark:text-red-400 uppercase tracking-tight">
                      Level 3 Evacuation Protocol Active
                    </h3>
                  </div>

                  <span className="text-[10px] font-mono font-bold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">
                    Mandatory Confirmation
                  </span>
                </div>

                <p className="text-xs text-red-900 dark:text-red-200 leading-relaxed font-medium">
                  Authoritative Factor of Safety threshold is violated. Executing this emergency order triggers regional acoustic hazard sirens, issues cell-broadcast evacuation SMS alerts, and closes arterial highway transit routes.
                </p>

                {/* Exclude Sector & Radius Customizer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 font-bold mb-1">
                      Affected Zone & Slope Axis
                    </label>
                    <input
                      type="text"
                      value={targetSector}
                      onChange={(e) => setTargetSector(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 font-bold mb-1">
                      Exclusion Safety Radius
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['500m', '1.2km', '2.5km'].map((radius) => (
                        <button
                          key={radius}
                          type="button"
                          onClick={() => setEvacRadius(radius)}
                          className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                            evacRadius === radius
                              ? 'bg-red-700 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {radius}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dispatch Agency Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <label className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-red-200 dark:border-red-900/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activateSirens}
                      onChange={(e) => setActivateSirens(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Acoustic Hazard Sirens (All Towers)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-red-200 dark:border-red-900/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dispatchSMS}
                      onChange={(e) => setDispatchSMS(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Cell Broadcast SMS to All Citizens
                    </span>
                  </label>

                  <label className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-red-200 dark:border-red-900/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyDOT}
                      onChange={(e) => setNotifyDOT(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      State Highway Patrol Roadblock
                    </span>
                  </label>

                  <label className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-red-200 dark:border-red-900/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyNDRF}
                      onChange={(e) => setNotifyNDRF(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      NDRF / SDRF Heavy Search Teams
                    </span>
                  </label>
                </div>

                {/* DOUBLE CONFIRMATION SAFETY MECHANISM */}
                {!evacConfirmationArmed ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleArmConfirmation}
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer border-2 border-red-500"
                    >
                      <AlertTriangle className="w-5 h-5 animate-bounce" />
                      <span>Initiate Emergency Evacuation Protocol</span>
                    </button>
                    <p className="text-center text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                      First step: Arm confirmation safety interlock
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-600 text-white rounded-2xl p-4.5 space-y-3.5 border-2 border-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="flex items-start gap-2.5">
                      <Flame className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-black text-sm uppercase tracking-wide text-yellow-300">
                          Double Confirmation Required &bull; Red Action Order
                        </h4>
                        <p className="text-xs opacity-90 mt-0.5 leading-snug">
                          Please verify authorization before broadcasting. This emergency action will disrupt regional transit and alert thousands of downstream residents.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 bg-black/30 p-3 rounded-xl cursor-pointer border border-white/30">
                      <input
                        type="checkbox"
                        checked={operatorConfirmationChecked}
                        onChange={(e) => setOperatorConfirmationChecked(e.target.checked)}
                        className="w-5 h-5 text-red-600 bg-white rounded accent-yellow-400"
                      />
                      <span className="text-xs font-bold text-white">
                        I confirm geotechnical slope failure criteria are met and authorize immediate evacuation of {targetSector}.
                      </span>
                    </label>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelConfirmation}
                        className="sm:w-1/3 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                      >
                        Abort Order
                      </button>

                      <button
                        type="button"
                        onClick={handleExecuteEvacuation}
                        disabled={!operatorConfirmationChecked || isBroadcasting}
                        className={`sm:w-2/3 py-3 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xl ${
                          operatorConfirmationChecked && !isBroadcasting
                            ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 cursor-pointer animate-pulse'
                            : 'bg-white/20 text-white/50 cursor-not-allowed'
                        }`}
                      >
                        <Megaphone className={`w-4 h-4 ${isBroadcasting ? 'animate-spin' : ''}`} />
                        <span>{isBroadcasting ? 'Broadcasting Order...' : 'CONFIRM & EXECUTE EVACUATION NOW'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── 5. ACTIONABLE SOP CHECKLIST WITH LOCAL PERSISTENCE ─────── */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>Standard Operating Procedure (SOP) Action Checklist</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Role-specific protocols automatically saved to local station memory.
                  </p>
                </div>

                {/* Role Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {(['admin', 'field_officer', 'citizen'] as ProtocolUserRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setActiveRoleTab(role)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                        activeRoleTab === role
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {role.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Indicator Bar */}
              <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-3 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-700 dark:text-slate-300 capitalize">
                      {activeRoleTab.replace('_', ' ')} Readiness SOPs
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {roleProgress.completed} of {roleProgress.total} ({roleProgress.percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        roleProgress.percent === 100
                          ? 'bg-emerald-500'
                          : roleProgress.percent >= 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${roleProgress.percent}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetChecklist}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors shrink-0"
                  title="Reset all tasks in local storage"
                >
                  Reset Checklist
                </button>
              </div>

              {/* Checklist Task Items */}
              <div className="space-y-2">
                {tasksForCurrentRole.map((task) => {
                  const completed = isTaskCompleted(task.id);
                  const isRequiredForActiveLevel = task.requiredForLevel <= activeLevel;

                  return (
                    <label
                      key={task.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                        completed
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : isRequiredForActiveLevel
                          ? 'bg-white dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 hover:border-slate-400'
                          : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-4 h-4 mt-0.5 text-emerald-600 rounded focus:ring-emerald-500 shrink-0 cursor-pointer"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h4 className={`text-xs font-bold ${
                            completed 
                              ? 'line-through text-slate-500 dark:text-slate-400' 
                              : 'text-slate-900 dark:text-white'
                          }`}>
                            {task.title}
                          </h4>

                          {task.mandatoryForEvacuation && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300">
                              Evacuation Mandatory
                            </span>
                          )}

                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                            task.requiredForLevel === DisasterAlertLevel.LEVEL_3_EVACUATION
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : task.requiredForLevel === DisasterAlertLevel.LEVEL_2_STANDBY
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            Level {task.requiredForLevel}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ─── 6. FOOTER ACTIONS ──────────────────────────────────────── */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>Station Auto-Sync: Active</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
