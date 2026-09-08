import React, { useState, useMemo } from 'react';
import { 
  Brain, 
  MapPin, 
  Radio, 
  AlertTriangle, 
  ShieldCheck, 
  AlertCircle,
  CloudRain,
  Droplets,
  Mountain,
  Activity,
  CheckCircle2,
  ShieldAlert,
  Info,
  ArrowRight
} from 'lucide-react';
import { SensorData } from '../types';
import { 
  SCANNER_LOCATIONS, 
  ScannerSiteGeotechnicalData, 
  computeGeotechnicalPhysics 
} from '../utils/physicsFormulas';

interface AIRiskAssessmentSectionProps {
  sensors?: SensorData[];
  onSelectScanner?: (site: ScannerSiteGeotechnicalData) => void;
  className?: string;
}

export const AIRiskAssessmentSection: React.FC<AIRiskAssessmentSectionProps> = ({
  sensors,
  onSelectScanner,
  className = '',
}) => {
  // Extract distinct Areas from Scanner Sites
  const distinctAreas = useMemo(() => {
    const areas = new Set<string>();
    SCANNER_LOCATIONS.forEach(s => areas.add(s.area));
    return Array.from(areas).sort();
  }, []);

  // Selected Area filter ('all' or specific area name)
  const [selectedArea, setSelectedArea] = useState<string>('East Siang Escarpment');

  // Filtered scanners based on chosen Area
  const availableScanners = useMemo(() => {
    if (selectedArea === 'all') {
      return SCANNER_LOCATIONS;
    }
    return SCANNER_LOCATIONS.filter(s => s.area === selectedArea);
  }, [selectedArea]);

  // Currently Selected Scanner ID (defaults to S-07 Pasighat)
  const [selectedScannerId, setSelectedScannerId] = useState<string>('scanner-s07-pasighat');

  // Selected Scanner Object (with fallback)
  const currentSite = useMemo(() => {
    const found = SCANNER_LOCATIONS.find(s => s.id === selectedScannerId);
    if (found) return found;
    return availableScanners[0] || SCANNER_LOCATIONS[0];
  }, [selectedScannerId, availableScanners]);

  // Handle Area Dropdown Change
  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    if (area !== 'all') {
      const firstInArea = SCANNER_LOCATIONS.find(s => s.area === area);
      if (firstInArea) {
        setSelectedScannerId(firstInArea.id);
        if (onSelectScanner) onSelectScanner(firstInArea);
      }
    }
  };

  // Handle Scanner Dropdown Change
  const handleScannerChange = (scannerId: string) => {
    setSelectedScannerId(scannerId);
    const site = SCANNER_LOCATIONS.find(s => s.id === scannerId);
    if (site) {
      setSelectedArea(site.area);
      if (onSelectScanner) onSelectScanner(site);
    }
  };

  // =========================================================================
  // EXCLUSIVE INTERNAL PHYSICS FORMULA ENGINE CALCULATION
  // Evaluated internally; translated into plain-language risk levels and simple
  // graphical indicators for public safety understanding.
  // =========================================================================
  const publicSafety = useMemo(() => {
    const physics = computeGeotechnicalPhysics(currentSite);

    // 1. Factor of Safety Risk Component (Formula 8)
    const fs = physics.factorOfSafety.fs;
    const fsRisk = Math.max(0.05, Math.min(1.0, (1.8 - fs) / (1.8 - 0.7)));

    // 2. Pore Pressure Hydraulic Ratio Component (Formula 1 & 6)
    const normalStress = Math.max(1, physics.normalStress.sigmaNKPa);
    const porePressure = currentSite.porePressureKPa;
    const poreRatio = Math.max(0.05, Math.min(1.0, porePressure / normalStress));

    // 3. Hydrological Infiltration & Rainfall Index (Formula 9 & 13)
    const infiltrationCapacity = Math.max(1, physics.rainfallInfiltration.fMmH);
    const rainIntensityRatio = Math.min(1.0, currentSite.rainfallRateMmH / (infiltrationCapacity * 1.4));
    const rainAccumRatio = Math.min(1.0, currentSite.rainfallAccumulation24hMm / 220);
    const rainRisk = Math.max(0.05, Math.min(1.0, 0.55 * rainIntensityRatio + 0.45 * rainAccumRatio));

    // 4. Kinematic Shear Displacement Index (Formula 5 & 7)
    const shearDriving = physics.drivingShearStress.tauKPa;
    const shearResisting = Math.max(1, physics.shearStrength.tauFKPa);
    const shearStressRatio = Math.max(0.05, Math.min(1.0, shearDriving / shearResisting));

    // 5. Topographic Terrain Steepness Index (Formula 4 & 5)
    const terrainRisk = Math.max(0.05, Math.min(1.0, (currentSite.slopeAngleDeg / 60) * 0.7 + (currentSite.failureDepthM / 5) * 0.3));

    // 6. Dynamic Vibration Tremor (Formula 12)
    const vibrationRisk = Math.max(0.02, Math.min(1.0, physics.vibration.vRmsMps2 / 0.8));

    // Unified Landslide Risk Score
    const weightedScore = (
      0.30 * rainRisk +
      0.30 * poreRatio +
      0.25 * shearStressRatio +
      0.10 * terrainRisk +
      0.05 * vibrationRisk
    );

    const riskScore = Math.min(0.98, Math.max(0.05, Number(weightedScore.toFixed(2))));
    const riskPercentage = Math.round(riskScore * 100);

    // Plain-Language Public Safety Classification
    let riskTier: 'CRITICAL DANGER' | 'HIGH RISK' | 'MODERATE WATCH' | 'SAFE & STABLE' = 'SAFE & STABLE';
    let riskShort: 'DANGER' | 'WARNING' | 'WATCH' | 'SAFE' = 'SAFE';
    let plainExplanation = 'The hillside is stable and firm. Normal daily activity is safe.';
    let actionRecommendation = [
      'Normal travel and hillside movement permitted.',
      'Check local weather forecasts if traveling to steep areas.',
      'Report any unexpected ground cracks to local panchayat/ward.'
    ];
    let badgeBg = 'bg-[#d63031] text-white';
    let meterColor = 'bg-rose-500';
    let cardAccent = 'border-rose-300 bg-rose-50/70 text-rose-900';

    if (fs < 1.0 || riskScore >= 0.75) {
      riskTier = 'CRITICAL DANGER';
      riskShort = 'DANGER';
      plainExplanation = 'Ground is heavily waterlogged and actively shifting. High danger of mud and rock slide.';
      actionRecommendation = [
        'Stay off mountain roads and avoid steep cliff cuttings.',
        'Keep away from valley drainage channels and riverbanks.',
        'Listen for local evacuation sirens and follow emergency guidance.'
      ];
      badgeBg = 'bg-[#d63031] text-white';
      meterColor = 'bg-rose-500';
      cardAccent = 'border-rose-300 bg-rose-50/70 text-rose-900';
    } else if (fs < 1.3 || riskScore >= 0.50) {
      riskTier = 'HIGH RISK';
      riskShort = 'WARNING';
      plainExplanation = 'Intense rainfall has weakened hillside soil. Landslide risk is elevated.';
      actionRecommendation = [
        'Avoid unnecessary travel on winding mountain roads.',
        'Inspect your property perimeter for new cracks in retaining walls.',
        'Keep emergency essentials and flashlights readily accessible.'
      ];
      badgeBg = 'bg-[#e67e22] text-white';
      meterColor = 'bg-amber-500';
      cardAccent = 'border-amber-300 bg-amber-50/70 text-amber-900';
    } else if (fs < 1.5 || riskScore >= 0.30) {
      riskTier = 'MODERATE WATCH';
      riskShort = 'WATCH';
      plainExplanation = 'Recent rainfall has soaked the ground. Conditions are being watched closely.';
      actionRecommendation = [
        'Drive cautiously around curves where rocks may roll down.',
        'Clear clogged road gullies and drainage paths around homes.',
        'Stay alert for district weather and landslide advisories.'
      ];
      badgeBg = 'bg-[#f39c12] text-slate-900';
      meterColor = 'bg-yellow-500';
      cardAccent = 'border-yellow-300 bg-yellow-50/70 text-yellow-900';
    } else {
      riskTier = 'SAFE & STABLE';
      riskShort = 'SAFE';
      plainExplanation = 'The hillside is stable and firm. Safe for normal daily activity.';
      actionRecommendation = [
        'Normal travel and hillside movement permitted.',
        'Check local weather forecasts if traveling to steep areas.',
        'Report any unexpected ground cracks to local panchayat/ward.'
      ];
      badgeBg = 'bg-[#27ae60] text-white';
      meterColor = 'bg-emerald-500';
      cardAccent = 'border-emerald-300 bg-emerald-50/70 text-emerald-900';
    }

    // 4 Plain-Language Safety Pillars (translating physics factors into simple public metrics)
    // Pillar 1: Rain Hazard
    const rainMmH = currentSite.rainfallRateMmH;
    const rainStatus = rainMmH >= 35 
      ? { label: 'Severe Torrential Storm', subtext: 'Intense rain soaking topsoil quickly', tier: 'Severe', color: 'bg-rose-100 text-rose-800 border-rose-200', barWidth: '92%', barColor: 'bg-rose-500' }
      : rainMmH >= 15
      ? { label: 'Heavy Continuous Rain', subtext: 'Rainfall increasing ground moisture', tier: 'High', color: 'bg-amber-100 text-amber-800 border-amber-200', barWidth: '68%', barColor: 'bg-amber-500' }
      : rainMmH >= 5
      ? { label: 'Moderate Showers', subtext: 'Steady rain monitored', tier: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', barWidth: '38%', barColor: 'bg-yellow-500' }
      : { label: 'Light or Dry Weather', subtext: 'Safe rainfall levels', tier: 'Safe', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', barWidth: '15%', barColor: 'bg-emerald-500' };

    // Pillar 2: Ground Water Soak
    const soilMoisture = currentSite.soilMoisturePct;
    const porePressureVal = currentSite.porePressureKPa;
    const soilStatus = (soilMoisture >= 78 || porePressureVal >= 45)
      ? { label: 'Heavily Waterlogged', subtext: 'Deep soil saturated and losing grip', tier: 'Critical', color: 'bg-rose-100 text-rose-800 border-rose-200', barWidth: '94%', barColor: 'bg-rose-500' }
      : (soilMoisture >= 60 || porePressureVal >= 25)
      ? { label: 'Damp & Soft Ground', subtext: 'Soil holding moderate water', tier: 'Elevated', color: 'bg-amber-100 text-amber-800 border-amber-200', barWidth: '60%', barColor: 'bg-amber-500' }
      : { label: 'Firm & Well-Drained', subtext: 'Soil dry and holding together', tier: 'Safe', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', barWidth: '20%', barColor: 'bg-emerald-500' };

    // Pillar 3: Ground Movement & Tremor
    const isMoving = physics.vibration.vRmsMps2 > 0.3 || shearStressRatio > 0.85;
    const moveStatus = isMoving
      ? { label: 'Active Ground Shifting', subtext: 'Subsurface sensors detect creeping soil', tier: 'Unstable', color: 'bg-rose-100 text-rose-800 border-rose-200', barWidth: '85%', barColor: 'bg-rose-500' }
      : shearStressRatio > 0.6
      ? { label: 'Minor Hillside Stress', subtext: 'Slight tension on retaining boundary', tier: 'Watch', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', barWidth: '45%', barColor: 'bg-yellow-500' }
      : { label: 'Rock Solid & Still', subtext: 'No ground shifting detected', tier: 'Safe', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', barWidth: '10%', barColor: 'bg-emerald-500' };

    // Pillar 4: Hillside Steepness
    const slopeDeg = currentSite.slopeAngleDeg;
    const slopeStatus = slopeDeg >= 42
      ? { label: `Very Steep Cliff (${slopeDeg}°)`, subtext: 'High natural slope vulnerability', tier: 'High Exposure', color: 'bg-amber-100 text-amber-800 border-amber-200', barWidth: '80%', barColor: 'bg-amber-500' }
      : slopeDeg >= 28
      ? { label: `Moderate Slope (${slopeDeg}°)`, subtext: 'Standard hill gradient', tier: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', barWidth: '50%', barColor: 'bg-yellow-500' }
      : { label: `Gentle Incline (${slopeDeg}°)`, subtext: 'Low exposure to slide hazards', tier: 'Low Exposure', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', barWidth: '22%', barColor: 'bg-emerald-500' };

    return {
      riskScore,
      riskPercentage,
      riskTier,
      riskShort,
      plainExplanation,
      actionRecommendation,
      badgeBg,
      meterColor,
      cardAccent,
      pillars: {
        rain: rainStatus,
        soil: soilStatus,
        movement: moveStatus,
        slope: slopeStatus,
      }
    };
  }, [currentSite]);

  return (
    <div id="ai-risk-assessment-container" className={`bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col ${className}`}>
      {/* ========================================================================= */}
      {/* CARD HEADER: DARK NAVY WITH AREA & SCANNER SELECTION OPTIONS               */}
      {/* ========================================================================= */}
      <div className="bg-[#0a1128] text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">A.I. Analysis</h2>
            <p className="text-[10px] text-slate-400">Community Safety & Landslide Risk Status</p>
          </div>
        </div>

        {/* Coordinated Drop-down Menus for Area and Scanner */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Option 1: Area Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1 shadow-xs">
            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-medium">Area:</span>
            <select
              id="ai-risk-assessment-area-select"
              value={selectedArea}
              onChange={(e) => handleAreaChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Areas ({distinctAreas.length})</option>
              {distinctAreas.map((area) => (
                <option key={area} value={area} className="bg-slate-900 text-white">
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Option 2: Scanner Location Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1 shadow-xs">
            <Radio className="w-3 h-3 text-emerald-400 shrink-0 animate-pulse" />
            <span className="text-[11px] text-slate-400 font-medium">Scanner:</span>
            <select
              id="ai-risk-assessment-scanner-select"
              value={currentSite.id}
              onChange={(e) => handleScannerChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-200 focus:outline-none cursor-pointer max-w-[170px] truncate"
            >
              {availableScanners.map((scanner) => (
                <option key={scanner.id} value={scanner.id} className="bg-slate-900 text-white">
                  [{scanner.stationCode}] {scanner.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DIGESTIBLE PUBLIC SAFETY INTERFACE (NO COMPLEX CHARTS OR DATA OVERLAYS)   */}
      {/* ========================================================================= */}
      <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
        
        {/* SECTION 1: PROMINENT SAFETY STATUS BANNER & PLAIN-LANGUAGE SUMMARY */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          {/* Main Risk Badge Box */}
          <div className={`${publicSafety.badgeBg} rounded-xl p-4 sm:w-44 shrink-0 flex flex-col justify-between shadow-xs transition-colors`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Live Status</span>
                <span className="text-[10px] font-mono opacity-80">{currentSite.stationCode}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {publicSafety.riskShort === 'SAFE' && <ShieldCheck className="w-6 h-6 text-white shrink-0" />}
                {publicSafety.riskShort === 'WATCH' && <AlertCircle className="w-6 h-6 text-slate-900 shrink-0" />}
                {publicSafety.riskShort === 'WARNING' && <AlertTriangle className="w-6 h-6 text-white shrink-0" />}
                {publicSafety.riskShort === 'DANGER' && <ShieldAlert className="w-6 h-6 text-white shrink-0" />}
                <p className="text-xl font-black tracking-wider uppercase leading-none">
                  {publicSafety.riskShort}
                </p>
              </div>
              <p className="text-[11px] font-medium opacity-90 mt-1.5 leading-snug">
                {publicSafety.riskTier}
              </p>
            </div>
            
            <div className="mt-4 pt-2.5 border-t border-white/20">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-semibold opacity-90">Risk Likelihood</span>
                <span className="text-lg font-black font-mono">{publicSafety.riskPercentage}%</span>
              </div>
              <p className="text-[9px] opacity-80 mt-0.5">
                {publicSafety.riskPercentage < 30 ? 'Normal Conditions' : publicSafety.riskPercentage < 50 ? 'Advisory Level' : publicSafety.riskPercentage < 75 ? 'Elevated Alert' : 'Evacuation Warning'}
              </p>
            </div>
          </div>

          {/* Plain-Language Explanation & Monitored Location Info */}
          <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
                  <span>{currentSite.name}</span>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Monitored
                </span>
              </div>
              
              <p className="text-xs text-slate-600 leading-relaxed font-medium mt-1">
                {publicSafety.plainExplanation}
              </p>
            </div>

            {/* Simple Graphical Indicator 1: The 4-Zone Public Safety Risk Meter */}
            <div className="mt-3 pt-2.5 border-t border-slate-200">
              <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 mb-1.5">
                <span>Public Safety Meter:</span>
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${publicSafety.meterColor} inline-block`} />
                  {publicSafety.riskTier} ({publicSafety.riskPercentage}%)
                </span>
              </div>
              
              {/* Segmented Risk Gauge */}
              <div className="grid grid-cols-4 gap-1.5 h-2.5 rounded-full overflow-hidden bg-slate-200/80 p-0.5">
                {/* Safe (0-30%) */}
                <div className={`rounded-full transition-all ${publicSafety.riskShort === 'SAFE' ? 'bg-emerald-500 shadow-xs ring-1 ring-emerald-600' : 'bg-emerald-200/60'}`} />
                {/* Watch (30-50%) */}
                <div className={`rounded-full transition-all ${publicSafety.riskShort === 'WATCH' ? 'bg-yellow-400 shadow-xs ring-1 ring-yellow-500' : 'bg-yellow-200/50'}`} />
                {/* Warning (50-75%) */}
                <div className={`rounded-full transition-all ${publicSafety.riskShort === 'WARNING' ? 'bg-amber-500 shadow-xs ring-1 ring-amber-600' : 'bg-amber-200/50'}`} />
                {/* Danger (75-100%) */}
                <div className={`rounded-full transition-all ${publicSafety.riskShort === 'DANGER' ? 'bg-rose-500 shadow-xs ring-1 ring-rose-600' : 'bg-rose-200/50'}`} />
              </div>

              {/* Meter Labels */}
              <div className="grid grid-cols-4 gap-1.5 text-center text-[9px] font-semibold text-slate-400 mt-1">
                <span className={publicSafety.riskShort === 'SAFE' ? 'text-emerald-700 font-bold' : ''}>Safe</span>
                <span className={publicSafety.riskShort === 'WATCH' ? 'text-yellow-700 font-bold' : ''}>Watch</span>
                <span className={publicSafety.riskShort === 'WARNING' ? 'text-amber-700 font-bold' : ''}>Warning</span>
                <span className={publicSafety.riskShort === 'DANGER' ? 'text-rose-700 font-bold' : ''}>Danger</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: 4 DIGESTIBLE SAFETY PILLARS (SIMPLE GRAPHICAL INDICATORS) */}
        <div>
          <p className="text-xs font-bold text-slate-700 mb-2">
            Safety Indicators at this Location
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Pillar 1: Rain Condition */}
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <CloudRain className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Rain Hazard</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${publicSafety.pillars.rain.color}`}>
                  {publicSafety.pillars.rain.tier}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-700">{publicSafety.pillars.rain.label}</p>
              <p className="text-[10px] text-slate-400">{publicSafety.pillars.rain.subtext}</p>
              {/* Graphical Progress Indicator */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${publicSafety.pillars.rain.barColor}`} style={{ width: publicSafety.pillars.rain.barWidth }} />
              </div>
            </div>

            {/* Pillar 2: Ground Water Soak */}
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Droplets className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Soil Water Soak</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${publicSafety.pillars.soil.color}`}>
                  {publicSafety.pillars.soil.tier}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-700">{publicSafety.pillars.soil.label}</p>
              <p className="text-[10px] text-slate-400">{publicSafety.pillars.soil.subtext}</p>
              {/* Graphical Progress Indicator */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${publicSafety.pillars.soil.barColor}`} style={{ width: publicSafety.pillars.soil.barWidth }} />
              </div>
            </div>

            {/* Pillar 3: Ground Movement & Tremor */}
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Ground Stability</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${publicSafety.pillars.movement.color}`}>
                  {publicSafety.pillars.movement.tier}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-700">{publicSafety.pillars.movement.label}</p>
              <p className="text-[10px] text-slate-400">{publicSafety.pillars.movement.subtext}</p>
              {/* Graphical Progress Indicator */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${publicSafety.pillars.movement.barColor}`} style={{ width: publicSafety.pillars.movement.barWidth }} />
              </div>
            </div>

            {/* Pillar 4: Hillside Steepness */}
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Mountain className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Hillside Gradient</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${publicSafety.pillars.slope.color}`}>
                  {publicSafety.pillars.slope.tier}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-700">{publicSafety.pillars.slope.label}</p>
              <p className="text-[10px] text-slate-400">{publicSafety.pillars.slope.subtext}</p>
              {/* Graphical Progress Indicator */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${publicSafety.pillars.slope.barColor}`} style={{ width: publicSafety.pillars.slope.barWidth }} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: COMMUNITY SAFETY ACTION ADVISORY (WHAT CITIZENS SHOULD DO) */}
        <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">Community Safety Guidance</span>
            <span className="text-[10px] text-slate-500 ml-auto">Updated {currentSite.lastUpdated}</span>
          </div>

          <ul className="space-y-1 text-xs text-slate-600">
            {publicSafety.actionRecommendation.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
};
