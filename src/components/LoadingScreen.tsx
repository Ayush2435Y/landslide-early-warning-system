import React, { useState, useEffect } from 'react';
import { BhumiRakshakLogo } from './BhumiRakshakLogo';
import { 
  Mountain, 
  Activity, 
  Wifi, 
  ShieldCheck, 
  Globe, 
  Database, 
  Radio, 
  Layers, 
  ChevronRight,
  CheckCircle2,
  Cpu
} from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
  minDisplayTimeMs?: number;
}

interface BootStep {
  id: string;
  code: string;
  label: string;
  detail: string;
  targetProgress: number;
}

const BOOT_STEPS: BootStep[] = [
  {
    id: 'handshake',
    code: 'INIT_GEONET',
    label: 'Connecting to GSI Geospatial Telemetry Network',
    detail: 'Ministry of Mines & NER Disaster Management Grid',
    targetProgress: 18,
  },
  {
    id: 'stations',
    code: 'SYNC_STATIONS',
    label: 'Polling 12 Regional Edge Stations across 8 States',
    detail: 'Pasighat, Itanagar, Shillong, Cherrapunji, Haflong, Kohima...',
    targetProgress: 38,
  },
  {
    id: 'geotech',
    code: 'CALIB_SENSORS',
    label: 'Calibrating Piezometers, InSAR & Inclinometer Feeds',
    detail: 'Pore-water pressure thresholds & 48h cumulative rainfall',
    targetProgress: 62,
  },
  {
    id: 'gis',
    code: 'LOAD_GIS_DEM',
    label: 'Mounting GIS Risk Layers & High-Res DEM Tiles',
    detail: 'Google Maps Satellite Hybrid & Geological Survey Scans',
    targetProgress: 82,
  },
  {
    id: 'cache',
    code: 'INDEXED_DB',
    label: 'Synchronizing IndexedDB Offline Telemetry Cache',
    detail: 'Local fallback resilience ready for remote field operations',
    targetProgress: 94,
  },
  {
    id: 'ready',
    code: 'DISPATCH_ONLINE',
    label: 'AI Slope Instability Inference Engine Operational',
    detail: 'Multi-hazard prediction matrix initialized successfully',
    targetProgress: 100,
  },
];

const NER_STATES = [
  { name: 'Arunachal Pradesh', code: 'AR', stations: 4 },
  { name: 'Assam', code: 'AS', stations: 2 },
  { name: 'Meghalaya', code: 'ML', stations: 2 },
  { name: 'Nagaland', code: 'NL', stations: 1 },
  { name: 'Manipur', code: 'MN', stations: 1 },
  { name: 'Mizoram', code: 'MZ', stations: 1 },
  { name: 'Tripura', code: 'TR', stations: 1 },
  { name: 'Sikkim', code: 'SK', stations: 1 },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onComplete,
  minDisplayTimeMs = 2400
}) => {
  const [progress, setProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 35; // ms per tick

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min(100, Math.round((elapsed / minDisplayTimeMs) * 100));

      setProgress(calculatedProgress);

      // Determine which step we're at
      const stepIdx = BOOT_STEPS.findIndex((step) => calculatedProgress < step.targetProgress);
      if (stepIdx === -1) {
        setActiveStepIndex(BOOT_STEPS.length - 1);
      } else {
        setActiveStepIndex(stepIdx);
      }

      if (calculatedProgress >= 100) {
        clearInterval(timer);
        // Small pause at 100% then fade out
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete();
          }, 350);
        }, 300);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [minDisplayTimeMs, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 250);
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-[#060b18] text-white flex flex-col justify-between overflow-hidden select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Topographic Contour & Radar Pulse Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="loadingGlow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#065986" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#060b18" stopOpacity="0" />
            </radialGradient>
            <pattern id="gridDots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#38bdf8" fillOpacity="0.15" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loadingGlow)" />
          <rect width="100%" height="100%" fill="url(#gridDots)" />
          
          {/* Subtle Topo Lines */}
          <circle cx="50%" cy="40%" r="180" fill="none" stroke="#0ea5e9" strokeOpacity="0.12" strokeDasharray="6 6" />
          <circle cx="50%" cy="40%" r="280" fill="none" stroke="#0284c7" strokeOpacity="0.08" />
          <circle cx="50%" cy="40%" r="380" fill="none" stroke="#0369a1" strokeOpacity="0.05" />
        </svg>
      </div>

      {/* Top Protocol Bar */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-[#080e22]/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-800/60 text-[11px] font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>NER-TELEMETRY // BOOT SEQUENCE</span>
          </div>
          <span className="hidden sm:inline text-xs text-slate-400 font-mono">
            CRS: EPSG:4326 &bull; WGS84
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GSI-SECURE</span>
          </div>
          
          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1 rounded-md border border-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            <span>Launch Command Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Center Branding & Progress Console */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 max-w-3xl mx-auto w-full my-auto">
        
        {/* Animated Gyro Radar Emblem */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Outer Pulse Ring */}
          <div className="absolute w-28 h-28 rounded-full border border-cyan-500/20 animate-ping" />
          
          {/* Rotating Gyro Ring */}
          <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-cyan-400/40 animate-spin" style={{ animationDuration: '8s' }} />
          
          {/* Inner Glow Center with Bhumi Rakshak Logo */}
          <div className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-xl">
            <BhumiRakshakLogo className="w-20 h-20" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#060b18] flex items-center justify-center shadow-sm">
              <Activity className="w-3 h-3 text-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-semibold tracking-wider uppercase mb-2 shadow-xs">
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
            <span>Landslide Early Warning Telemetry Grid</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-2 flex items-center justify-center gap-3">
            <span>BHUMI RAKSHAK</span>
            <span className="text-lg sm:text-2xl text-emerald-400 font-semibold px-2.5 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
              भूमि रक्षक
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-medium">
            AI-Powered Multi-Sensor Landslide Monitoring System &bull; NER India
          </p>
        </div>

        {/* Progress Bar with Percentage Counter */}
        <div className="w-full bg-[#0c152e] border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-slate-200">
                SYSTEM INITIALIZATION
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold font-mono text-cyan-300">
                {progress}%
              </span>
              <span className="text-[10px] font-mono text-slate-400">COMPLETE</span>
            </div>
          </div>

          {/* Glowing Track */}
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/70 relative">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-100 ease-out relative shadow-sm"
              style={{ width: `${progress}%` }}
            >
              {/* Leading Glow pip */}
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_8px_#38bdf8]" />
            </div>
          </div>

          {/* Current Active Step Highlight */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>[{BOOT_STEPS[activeStepIndex]?.code || 'INITIALIZING'}]</span>
                <span className="truncate text-slate-200">
                  {BOOT_STEPS[activeStepIndex]?.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate pl-3.5">
                {BOOT_STEPS[activeStepIndex]?.detail}
              </p>
            </div>
            <div className="shrink-0 text-[10px] font-mono text-slate-500 self-center">
              Step {activeStepIndex + 1} of {BOOT_STEPS.length}
            </div>
          </div>
        </div>

        {/* Live Diagnostics Log List (Compact) */}
        <div className="w-full bg-[#080e20]/80 rounded-xl border border-slate-800/90 p-3 font-mono text-[11px] space-y-1.5 max-h-36 overflow-hidden">
          {BOOT_STEPS.map((step, idx) => {
            const isCompleted = progress >= step.targetProgress;
            const isCurrent = idx === activeStepIndex && !isCompleted;

            return (
              <div 
                key={step.id} 
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded transition-colors ${
                  isCurrent 
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-900/60' 
                    : isCompleted 
                    ? 'text-slate-400' 
                    : 'text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    </span>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span className="truncate">{step.label}</span>
                </div>
                <span className="shrink-0 text-[10px] text-slate-500 font-mono">
                  {isCompleted ? 'OK' : isCurrent ? 'SYNCING' : 'PENDING'}
                </span>
              </div>
            );
          })}
        </div>

      </main>

      {/* Bottom Telemetry Status Pill Grid */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-slate-800/80 bg-[#080e22]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* NER States Connection Status */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400 mr-1">NER NODES:</span>
            {NER_STATES.map((state) => (
              <span 
                key={state.code}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                title={`${state.name}: ${state.stations} Station(s)`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{state.code}</span>
              </span>
            ))}
          </div>

          {/* Telemetry Spec Flags */}
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>12 Stations Online</span>
            </div>
            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>100 Hz InSAR/IoT</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};
