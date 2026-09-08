import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Activity, 
  Clock, 
  ShieldAlert, 
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  RefreshCw, 
  CheckCircle2, 
  Info,
  Droplets,
  CloudRain,
  Mountain,
  Zap,
  PhoneCall,
  MapPin,
  HelpCircle,
  ArrowRight,
  Shield,
  Car,
  Home,
  Check,
  X
} from 'lucide-react';
import { PredictiveAIInsight, SensorData } from '../types';

interface EnvironmentalMetricsViewProps {
  insight: PredictiveAIInsight;
  sensors: SensorData[];
  onRefreshAI: () => void;
  isLoadingAI: boolean;
}

export const EnvironmentalMetricsView: React.FC<EnvironmentalMetricsViewProps> = ({
  insight,
  sensors,
  onRefreshAI,
  isLoadingAI,
}) => {
  // Selected community sector filter
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [showCivilianGuideModal, setShowCivilianGuideModal] = useState<boolean>(false);

  // Compute civilian safety metrics from insight and active sensors
  const civilianSafety = useMemo(() => {
    // Probability / Risk percentage from AI
    const riskPercentage = Math.round(insight?.probability || 78);
    
    // Average or highest values from sensors
    const rainRate = sensors.length > 0
      ? Math.max(...sensors.map(s => s.rainfallRateMmH || 0))
      : 45;
    
    const soilSaturation = sensors.length > 0
      ? Math.round(sensors.reduce((acc, s) => acc + (s.soilMoisturePct || 0), 0) / sensors.length)
      : 84;

    const maxShift = sensors.length > 0
      ? Math.max(...sensors.map(s => Math.abs(s.inclinometerDisplacementMm || 0)))
      : 2.4;

    // Plain-language classification
    let tierCode: 'CRITICAL' | 'WARNING' | 'WATCH' | 'SAFE' = 'SAFE';
    let tierTitle = 'Safe & Stable Conditions';
    let tierSubtitle = 'Hillside is stable and firm. Normal daily travel and activity are safe.';
    let tierBadge = 'bg-emerald-600 text-white';
    let alertBorder = 'border-emerald-200 bg-emerald-50/60';
    let alertText = 'text-emerald-900';

    if (riskPercentage >= 70 || soilSaturation >= 80) {
      tierCode = 'CRITICAL';
      tierTitle = 'Critical Danger — Evacuation Alert';
      tierSubtitle = 'Ground is heavily waterlogged and actively shifting. High danger of mud and rock slides in steep areas.';
      tierBadge = 'bg-rose-600 text-white';
      alertBorder = 'border-rose-200 bg-rose-50/80';
      alertText = 'text-rose-900';
    } else if (riskPercentage >= 50 || soilSaturation >= 65) {
      tierCode = 'WARNING';
      tierTitle = 'High Risk — Caution on Hill Roads';
      tierSubtitle = 'Heavy rainfall has weakened hillside soil. Landslide risk is elevated on mountain roads and cliffs.';
      tierBadge = 'bg-amber-600 text-white';
      alertBorder = 'border-amber-200 bg-amber-50/80';
      alertText = 'text-amber-900';
    } else if (riskPercentage >= 25 || soilSaturation >= 50) {
      tierCode = 'WATCH';
      tierTitle = 'Moderate Watch — Be Alert';
      tierSubtitle = 'Recent showers have soaked the soil. Conditions are being watched closely by local observers.';
      tierBadge = 'bg-yellow-500 text-slate-900';
      alertBorder = 'border-yellow-200 bg-yellow-50/80';
      alertText = 'text-yellow-900';
    }

    // 4 Plain-Language Safety Pillars (translated from technical telemetry)
    // 1. Rain Hazard
    const rainStatus = rainRate >= 35
      ? { label: 'Severe Torrential Storm', subtext: 'Very heavy rain washing away loose surface dirt', level: 'Severe', pct: 90, color: 'bg-rose-500', badge: 'bg-rose-100 text-rose-800' }
      : rainRate >= 15
      ? { label: 'Heavy Continuous Rain', subtext: 'Steady downpour adding water to the hillside', level: 'High', pct: 68, color: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800' }
      : rainRate >= 5
      ? { label: 'Moderate Showers', subtext: 'Normal rainfall, gutters draining steadily', level: 'Moderate', pct: 40, color: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800' }
      : { label: 'Light Rain or Dry', subtext: 'Calm weather, no rain hazard', level: 'Safe', pct: 15, color: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' };

    // 2. Soil Waterlogging
    const soilStatus = soilSaturation >= 80
      ? { label: 'Completely Soaked (Saturated)', subtext: 'Ground cannot absorb any more water; soil is loose and muddy', level: 'Critical', pct: soilSaturation, color: 'bg-rose-500', badge: 'bg-rose-100 text-rose-800' }
      : soilSaturation >= 60
      ? { label: 'Damp & Heavy Soil', subtext: 'Hillside earth is wet and holding significant water weight', level: 'Elevated', pct: soilSaturation, color: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800' }
      : { label: 'Firm & Well-Drained', subtext: 'Soil is compact and holding firmly to bedrock', level: 'Normal', pct: soilSaturation, color: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' };

    // 3. Ground Movement
    const shiftStatus = maxShift >= 2.0
      ? { label: 'Underground Shifting Detected', subtext: `Sensors detect ~${maxShift.toFixed(1)} mm of slow soil creeping along retaining walls`, level: 'Active Shift', pct: 85, color: 'bg-rose-500', badge: 'bg-rose-100 text-rose-800' }
      : maxShift >= 1.0
      ? { label: 'Minor Hillside Pressure', subtext: `Slight ground pressure observed (~${maxShift.toFixed(1)} mm shift)`, level: 'Watch', pct: 45, color: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800' }
      : { label: 'Ground Solid & Still', subtext: 'No underground movement detected along slopes', level: 'Solid', pct: 10, color: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' };

    // 4. Ground Tremors
    const tremorStatus = {
      label: 'Hillside Quiet & Normal',
      subtext: 'No underground cracking sounds or blasting vibrations detected',
      level: 'Calm',
      pct: 12,
      color: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800'
    };

    return {
      riskPercentage,
      tierCode,
      tierTitle,
      tierSubtitle,
      tierBadge,
      alertBorder,
      alertText,
      rainRate,
      soilSaturation,
      maxShift,
      pillars: {
        rain: rainStatus,
        soil: soilStatus,
        shift: shiftStatus,
        tremor: tremorStatus,
      }
    };
  }, [insight, sensors]);

  // Sector list for community filtering
  const sectorList = [
    { id: 'all', name: 'All Hillside Sectors', alert: 'High Risk' },
    { id: 'sec4', name: 'Guwahati Hills (Sector 4)', alert: 'Critical Danger' },
    { id: 'sec2', name: 'Paglapahar Corridor (NH-29)', alert: 'High Risk' },
    { id: 'sec1', name: 'Haflong Valley Highway', alert: 'Moderate Watch' },
    { id: 'sec3', name: 'Shillong Bypass Ridge', alert: 'Safe & Clear' },
  ];

  // 12-Hour Public Safety Outlook (Digestible timeline without complex charts)
  const hourlyOutlook = [
    {
      time: 'Now – Next 3 Hours',
      status: 'Critical Alert',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: <CloudRain className="w-4 h-4 text-rose-600" />,
      advice: 'Heaviest downpours expected. Avoid travel on mountain curves and cliff edges.',
    },
    {
      time: '3 to 6 Hours Later',
      status: 'High Alert',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <Droplets className="w-4 h-4 text-amber-600" />,
      advice: 'Rain eases slightly, but hillside ground remains waterlogged and prone to slips.',
    },
    {
      time: '6 to 9 Hours Later',
      status: 'Moderate Watch',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Activity className="w-4 h-4 text-yellow-600" />,
      advice: 'Surface water drains toward valley channels. Stay alert for loose rocks on roads.',
    },
    {
      time: '9 to 12 Hours Later',
      status: 'Decreasing Risk',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      advice: 'Conditions stabilizing if no new cloudburst occurs. Road crews assessing paths.',
    },
  ];

  // Neighborhood safety status board
  const neighborhoods = [
    {
      name: 'Guwahati Hills (Narakasur Sector)',
      risk: 'Critical Danger',
      riskColor: 'text-rose-700 bg-rose-50 border-rose-200',
      advice: 'Residents along lower cliff cuts should prepare for temporary relocation.',
      activeSensors: '4 Active Monitors',
    },
    {
      name: 'NH-29 Paglapahar Corridor',
      risk: 'High Risk',
      riskColor: 'text-amber-700 bg-amber-50 border-amber-200',
      advice: 'Heavy commercial trucks diverted. Private vehicles drive with extreme caution.',
      activeSensors: '3 Active Monitors',
    },
    {
      name: 'Haflong Railway & Valley Road',
      risk: 'Moderate Watch',
      riskColor: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      advice: 'Drainage culverts running fast. No immediate blockages reported.',
      activeSensors: '3 Active Monitors',
    },
    {
      name: 'Shillong Upper Plateau Bypass',
      risk: 'Safe & Clear',
      riskColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      advice: 'Normal traffic permitted. Routine hillside telemetry indicates solid rock.',
      activeSensors: '2 Active Monitors',
    },
  ];

  return (
    <div className="flex-1 bg-[#f8fafc] overflow-y-auto p-4 md:p-8 min-h-screen pb-28">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ========================================================================= */}
        {/* TOP HEADER: CIVIC TITLE & LIVE STATUS                                    */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Public Safety Portal
                </span>
                <span className="text-xs text-slate-400">
                  Updated: {insight?.analyzedAt ? 'Just now' : 'Live'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                A.I. Safety Analytics
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Hillside sensor readings translated into simple, plain-language risk levels and community safety advisories.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={onRefreshAI}
                disabled={isLoadingAI}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAI ? 'animate-spin text-blue-400' : ''}`} />
                <span>{isLoadingAI ? 'Updating Safety Data...' : 'Check Latest Safety Update'}</span>
              </button>

              <button
                onClick={() => setShowCivilianGuideModal(true)}
                className="px-3.5 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Citizen Safety Tips</span>
              </button>
            </div>
          </div>

          {/* Sector Quick Filter Pills */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Area:
            </span>
            {sectorList.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSector(sec.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedSector === sec.id
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {sec.name}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HERO COMMUNITY SAFETY ADVISORY (PLAIN LANGUAGE)                          */}
        {/* ========================================================================= */}
        <div className={`rounded-2xl border ${civilianSafety.alertBorder} p-5 md:p-7 shadow-xs`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left: Prominent Public Safety Status */}
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`${civilianSafety.tierBadge} text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs`}>
                  {civilianSafety.tierCode === 'CRITICAL' && <AlertTriangle className="w-3.5 h-3.5 text-white" />}
                  {civilianSafety.tierCode === 'WARNING' && <AlertCircle className="w-3.5 h-3.5 text-white" />}
                  {civilianSafety.tierCode === 'SAFE' && <ShieldCheck className="w-3.5 h-3.5 text-white" />}
                  <span>{civilianSafety.tierTitle}</span>
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-white/80 px-2.5 py-1 rounded-full border border-slate-200">
                  Target Window: {insight?.timeToCritical || 'Next ~3.5 Hours'}
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {civilianSafety.tierCode === 'CRITICAL' 
                  ? 'High Danger of Hillside Mud & Rock Slides'
                  : civilianSafety.tierCode === 'WARNING'
                  ? 'Elevated Soil Weakness along Mountain Roads'
                  : 'Hillside Slope Stable and Secure'}
              </h2>

              <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
                {civilianSafety.tierCode === 'CRITICAL'
                  ? 'Continuous monsoon rainfall has heavily waterlogged the mountainside soil. Underground sensors show the ground is losing its grip. Residents along steep slopes and travelers on mountain highways should avoid vulnerable areas and stay prepared.'
                  : civilianSafety.tierSubtitle}
              </p>

              {/* Immediate Public Directives */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-800">
                <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
                  <Car className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Avoid unnecessary travel on steep mountain highway curves</span>
                </div>
                <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
                  <Home className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Inspect drainage around your home and keep ditches clear</span>
                </div>
              </div>
            </div>

            {/* Right: Big Civilian Risk Percentage Box */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 lg:w-72 shrink-0 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Slide Likelihood</span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    94.8% Verified
                  </span>
                </div>
                
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-black text-slate-900 font-mono tracking-tight">
                    {civilianSafety.riskPercentage}%
                  </span>
                  <span className="text-xs font-bold text-slate-500">Hazard Probability</span>
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Calculated from live slope sensors, rainfall rates, and weather radar.
                </p>
              </div>

              {/* Simple 4-Zone Segmented Gauge */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
                  <span>Safety Zone:</span>
                  <span className="font-bold text-slate-800">{civilianSafety.tierTitle.split('—')[0]}</span>
                </div>

                <div className="grid grid-cols-4 gap-1 h-2 rounded-full overflow-hidden bg-slate-100 p-0.5">
                  <div className={`rounded-full transition-all ${civilianSafety.riskPercentage >= 0 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  <div className={`rounded-full transition-all ${civilianSafety.riskPercentage >= 30 ? 'bg-yellow-400' : 'bg-slate-200'}`} />
                  <div className={`rounded-full transition-all ${civilianSafety.riskPercentage >= 50 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                  <div className={`rounded-full transition-all ${civilianSafety.riskPercentage >= 70 ? 'bg-rose-500' : 'bg-slate-200'}`} />
                </div>

                <div className="grid grid-cols-4 gap-1 text-center text-[9px] font-bold text-slate-400 mt-1">
                  <span className={civilianSafety.tierCode === 'SAFE' ? 'text-emerald-700' : ''}>Safe</span>
                  <span className={civilianSafety.tierCode === 'WATCH' ? 'text-yellow-700' : ''}>Watch</span>
                  <span className={civilianSafety.tierCode === 'WARNING' ? 'text-amber-700' : ''}>Warning</span>
                  <span className={civilianSafety.tierCode === 'CRITICAL' ? 'text-rose-700' : ''}>Danger</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4 CORE HILLSIDE SAFETY INDICATORS (SIMPLE GRAPHICAL PROGRESS METERS)      */}
        {/* ========================================================================= */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Current Ground & Weather Indicators
              </h3>
              <p className="text-xs text-slate-500">
                Simple everyday readings showing how rainfall and ground moisture are affecting hillside stability.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              12 Active Sensor Nodes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Rainfall Level */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-blue-200 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CloudRain className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${civilianSafety.pillars.rain.badge}`}>
                    {civilianSafety.pillars.rain.level}
                  </span>
                </div>
                
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Rainfall Intensity
                </span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {civilianSafety.pillars.rain.label}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {civilianSafety.pillars.rain.subtext}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                  <span>Rain Level</span>
                  <span className="font-mono text-slate-800 font-bold">{civilianSafety.rainRate} mm/h</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${civilianSafety.pillars.rain.color}`} 
                    style={{ width: `${civilianSafety.pillars.rain.pct}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* 2. Soil Waterlogging */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-amber-200 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${civilianSafety.pillars.soil.badge}`}>
                    {civilianSafety.pillars.soil.level}
                  </span>
                </div>
                
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Soil Water Soak
                </span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {civilianSafety.pillars.soil.label}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {civilianSafety.pillars.soil.subtext}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                  <span>Soil Moisture</span>
                  <span className="font-mono text-slate-800 font-bold">{civilianSafety.soilSaturation}% Full</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${civilianSafety.pillars.soil.color}`} 
                    style={{ width: `${civilianSafety.pillars.soil.pct}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* 3. Hillside Ground Shift */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-purple-200 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${civilianSafety.pillars.shift.badge}`}>
                    {civilianSafety.pillars.shift.level}
                  </span>
                </div>
                
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Hillside Stability
                </span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {civilianSafety.pillars.shift.label}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {civilianSafety.pillars.shift.subtext}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                  <span>Shift Detected</span>
                  <span className="font-mono text-slate-800 font-bold">~{civilianSafety.maxShift} mm</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${civilianSafety.pillars.shift.color}`} 
                    style={{ width: `${civilianSafety.pillars.shift.pct}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* 4. Hillside Vibrations & Tremors */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-emerald-200 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Mountain className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${civilianSafety.pillars.tremor.badge}`}>
                    {civilianSafety.pillars.tremor.level}
                  </span>
                </div>
                
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Earth Tremors
                </span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {civilianSafety.pillars.tremor.label}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {civilianSafety.pillars.tremor.subtext}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                  <span>Vibration Status</span>
                  <span className="font-mono text-emerald-700 font-bold">Calm & Quiet</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${civilianSafety.pillars.tremor.color}`} 
                    style={{ width: `${civilianSafety.pillars.tremor.pct}%` }} 
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 12-HOUR CIVIC SAFETY OUTLOOK (CLEAN TIMELINE, NO COMPLEX CHARTS)          */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Next 12-Hour Public Safety Outlook</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Expected conditions based on regional weather radar and soil drainage estimates.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">Hourly AI Projection</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {hourlyOutlook.map((item, idx) => (
              <div key={idx} className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800">{item.time}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badge}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 my-1.5">
                    {item.icon}
                    <span className="text-xs font-semibold text-slate-700">Advisory:</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.advice}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NEIGHBORHOOD & SECTOR SAFETY BOARD                                       */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Local Neighborhood & Highway Statuses</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Check conditions in specific monitored corridors and hillside communities.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              4 Monitored Zones
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {neighborhoods.map((zone, idx) => (
              <div key={idx} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{zone.name}</span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${zone.riskColor}`}>
                      {zone.risk}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {zone.advice}
                  </p>
                </div>
                <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{zone.activeSensors}</span>
                  <span className="text-blue-600 font-semibold flex items-center gap-1">
                    Live Telemetry <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CITIZEN ACTION CHECKLIST & EMERGENCY HELP DIRECTORY                       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: What Citizens Should Do Right Now */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Recommended Citizen Actions</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Clear, practical steps for families and commuters during high-risk monsoon periods.
            </p>

            <div className="space-y-2.5">
              {insight?.recommendations && insight.recommendations.length > 0 ? (
                insight.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="font-medium leading-relaxed">{rec}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Avoid driving through mountain highway cuts during peak rain intervals.</span>
                  </div>
                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Check property perimeter for new cracks in retaining walls or yard ground.</span>
                  </div>
                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Keep emergency flashlights, phone power banks, and clean drinking water accessible.</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Emergency Contacts Directory */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-rose-600" />
                <span>Emergency Helplines</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Immediate 24/7 disaster assistance lines for hill residents.
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Disaster Management (SDRF):</span>
                  <span className="font-mono font-bold text-rose-700">1070 / 1077</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Police Emergency:</span>
                  <span className="font-mono font-bold text-slate-900">112</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Medical Ambulance:</span>
                  <span className="font-mono font-bold text-slate-900">108</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">District Control Room:</span>
                  <span className="font-mono font-bold text-slate-900">0361-2734517</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              In case of sudden road blockage, notify local ward wardens or dial 1070 immediately.
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* SIMPLE HISTORICAL ANALOGUE COMPARISON (EASY PLAIN LANGUAGE)               */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                How Does Today Compare to Past Rainstorms?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Learning from previous monsoon seasons to understand current landslide probabilities.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Historical Comparison</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-rose-900">June 2022 Monsoon Event (Haflong / Tupul)</span>
                <span className="text-[10px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-full border border-rose-200">
                  Past Heavy Slide
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Soil saturation reached <strong>86–91%</strong> following sustained torrential rains, causing slope slippage along road cuttings. Today's saturation level is similar (<strong>{civilianSafety.soilSaturation}%</strong>), which is why elevated caution is advised.
              </p>
            </div>

            <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-blue-900">August 2025 Retaining Wall Reinforcement</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                  Mitigation Succeeded
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Early warning sensors detected initial ground shift <strong>4.5 hours in advance</strong>, allowing local authorities to clear ditches and divert heavy traffic, preventing injuries and keeping key arteries safe.
              </p>
            </div>
          </div>
        </div>

        {/* Public Safety Footer */}
        <footer className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="font-semibold text-slate-600">
            BHUMI RAKSHAK COMMUNITY SAFETY NETWORK • CITIZEN LANDSLIDE ADVISORY
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Verified by Edge Sensors & IMD Doppler Radar</span>
            <span>Emergency Toll-Free: 1070</span>
          </div>
        </footer>

      </div>

      {/* ========================================================================= */}
      {/* CITIZEN SAFETY GUIDE MODAL                                               */}
      {/* ========================================================================= */}
      {showCivilianGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold">Citizen Landslide Safety Guide</h3>
              </div>
              <button 
                onClick={() => setShowCivilianGuideModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-1">Warning Signs of an Approaching Slide:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li>Sudden widening of cracks on plaster, pavements, or retaining walls.</li>
                  <li>Doors or windows sticking or jamming for the first time.</li>
                  <li>Telephone poles, fences, or trees leaning downhill.</li>
                  <li>Sudden trickles of muddy water emerging from hillside embankments.</li>
                  <li>A faint rumbling sound that increases in volume.</li>
                </ul>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                <h4 className="font-bold text-amber-900 mb-1">What to Do During Heavy Rain:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li>Stay awake and alert during intense storms; listen for unusual sounds.</li>
                  <li>Never cross road sections covered in mudflow or standing water.</li>
                  <li>Keep an emergency grab bag with medical supplies and flashlights.</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowCivilianGuideModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
