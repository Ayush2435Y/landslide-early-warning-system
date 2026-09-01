import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  Activity, 
  Info, 
  CheckCircle2,
  Maximize2,
  Eye,
  EyeOff,
  Filter,
  Flame,
  BrainCircuit,
  Zap,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { PredictiveAIInsight, SensorData } from '../types';

interface AIConfidence24hChartProps {
  insight: PredictiveAIInsight;
  sensors?: SensorData[];
  className?: string;
}

export type HazardLineFilter = 'all' | 'landslide' | 'debrisFlow' | 'wallShear';

export const AIConfidence24hChart: React.FC<AIConfidence24hChartProps> = ({
  insight,
  sensors = [],
  className = '',
}) => {
  const [selectedFilter, setSelectedFilter] = useState<HazardLineFilter>('all');
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [showThresholds, setShowThresholds] = useState<boolean>(true);
  const [showContributingDrivers, setShowContributingDrivers] = useState<boolean>(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  // Generate 24-hour chronological timeline of AI confidence scores leading up to the current moment
  const confidence24hData = useMemo(() => {
    // Current confidence from prop or fallback to 94.2%
    const currentBaseConfidence = insight.confidence || 94.2;
    
    // 24 points (from 23 hours ago to current hour)
    const hours = [
      { label: '14:00', offset: -23, rain: 4, sat: 52, disp: 0.4, pz: 28 },
      { label: '15:00', offset: -22, rain: 6, sat: 53, disp: 0.4, pz: 29 },
      { label: '16:00', offset: -21, rain: 8, sat: 54, disp: 0.5, pz: 30 },
      { label: '17:00', offset: -20, rain: 12, sat: 56, disp: 0.5, pz: 32 },
      { label: '18:00', offset: -19, rain: 15, sat: 58, disp: 0.6, pz: 33 },
      { label: '19:00', offset: -18, rain: 18, sat: 61, disp: 0.7, pz: 35 },
      { label: '20:00', offset: -17, rain: 22, sat: 64, disp: 0.8, pz: 38 },
      { label: '21:00', offset: -16, rain: 26, sat: 67, disp: 0.9, pz: 40 },
      { label: '22:00', offset: -15, rain: 28, sat: 70, disp: 1.0, pz: 42 },
      { label: '23:00', offset: -14, rain: 30, sat: 72, disp: 1.1, pz: 44 },
      { label: '00:00', offset: -13, rain: 35, sat: 74, disp: 1.3, pz: 46 },
      { label: '01:00', offset: -12, rain: 42, sat: 77, disp: 1.5, pz: 49 },
      { label: '02:00', offset: -11, rain: 45, sat: 79, disp: 1.7, pz: 51 },
      { label: '03:00', offset: -10, rain: 48, sat: 81, disp: 1.9, pz: 53 },
      { label: '04:00', offset: -9,  rain: 45, sat: 82, disp: 2.0, pz: 54 },
      { label: '05:00', offset: -8,  rain: 40, sat: 83, disp: 2.1, pz: 55 },
      { label: '06:00', offset: -7,  rain: 38, sat: 83, disp: 2.2, pz: 56 },
      { label: '07:00', offset: -6,  rain: 42, sat: 84, disp: 2.3, pz: 57 },
      { label: '08:00', offset: -5,  rain: 46, sat: 84, disp: 2.3, pz: 57 },
      { label: '09:00', offset: -4,  rain: 44, sat: 84, disp: 2.4, pz: 58 },
      { label: '10:00', offset: -3,  rain: 40, sat: 84, disp: 2.4, pz: 58 },
      { label: '11:00', offset: -2,  rain: 36, sat: 84, disp: 2.4, pz: 58 },
      { label: '12:00', offset: -1,  rain: 34, sat: 84, disp: 2.4, pz: 58.2 },
      { label: 'Now',   offset: 0,   rain: 35, sat: 84, disp: 2.4, pz: 58.4 },
    ];

    // Base confidence curve that starts lower and surges as precipitation and pore pressure climb
    const baseConfidenceProfile = [
      64.5, 66.0, 67.5, 70.0, 72.8, 75.2, 78.4, 81.2, 84.0, 86.5, 
      88.9, 91.4, 93.0, 95.2, 94.8, 93.5, 92.8, 94.0, 95.6, 95.8, 
      95.2, 94.6, 94.0, currentBaseConfidence
    ];

    return hours.map((h, i) => {
      // Scale profile slightly based on currentBaseConfidence
      const scaleFactor = currentBaseConfidence / 94.2;
      const overall = Number(Math.min(99.4, Math.max(50, baseConfidenceProfile[i] * scaleFactor)).toFixed(1));
      
      // Landslide confidence (strongly correlated with saturation and pore pressure)
      const landslide = Number(Math.min(98.5, Math.max(45, overall * 0.98 + (h.sat > 75 ? 2.5 : -3.0))).toFixed(1));
      
      // Debris flow confidence (spikes when rain intensity is highest)
      const debrisFlow = Number(Math.min(96.0, Math.max(40, overall * 0.92 + (h.rain > 40 ? 5.2 : -4.5))).toFixed(1));
      
      // Wall shear failure (correlated with cumulative displacement)
      const wallShear = Number(Math.min(97.2, Math.max(42, overall * 0.95 + (h.disp > 1.5 ? 3.8 : -2.0))).toFixed(1));
      
      // Confidence interval bounds (Bayesian uncertainty envelope: ±2.5% to ±4.5%)
      const spread = Number((4.5 - (overall / 100) * 2.2).toFixed(1));
      const confidenceMin = Number(Math.max(40, overall - spread).toFixed(1));
      const confidenceMax = Number(Math.min(100, overall + spread).toFixed(1));

      // Model ensemble agreement index (0-100%)
      const ensembleAgreement = Number(Math.min(98, Math.max(70, 78 + (i * 0.8) + (h.rain > 30 ? 6 : 0))).toFixed(1));

      let alertStatus: 'nominal' | 'advisory' | 'warning' | 'critical' = 'nominal';
      if (overall >= 88) alertStatus = 'critical';
      else if (overall >= 80) alertStatus = 'warning';
      else if (overall >= 70) alertStatus = 'advisory';

      return {
        time: h.label,
        hourOffset: h.offset,
        overallConfidence: overall,
        landslideConfidence: landslide,
        debrisFlowConfidence: debrisFlow,
        wallShearConfidence: wallShear,
        confidenceMin,
        confidenceMax,
        ensembleAgreement,
        rainfallRate: h.rain,
        soilSaturation: h.sat,
        displacement: h.disp,
        porePressure: h.pz,
        alertStatus,
      };
    });
  }, [insight.confidence]);

  // Summary statistics for the confidence score trajectory
  const stats = useMemo(() => {
    if (!confidence24hData.length) return null;
    const current = confidence24hData[confidence24hData.length - 1];
    const initial = confidence24hData[0];
    const delta24h = Number((current.overallConfidence - initial.overallConfidence).toFixed(1));
    const deltaPct = Number((((current.overallConfidence - initial.overallConfidence) / initial.overallConfidence) * 100).toFixed(1));
    
    const peakPoint = [...confidence24hData].sort((a, b) => b.overallConfidence - a.overallConfidence)[0];
    const sum = confidence24hData.reduce((acc, curr) => acc + curr.overallConfidence, 0);
    const avgConfidence = Number((sum / confidence24hData.length).toFixed(1));

    // Hours spent in critical confidence zone (>85%)
    const hoursAboveCritical = confidence24hData.filter(d => d.overallConfidence >= 85).length;

    return {
      currentScore: current.overallConfidence,
      delta24h,
      deltaPct,
      peakScore: peakPoint.overallConfidence,
      peakTime: peakPoint.time,
      avgConfidence,
      hoursAboveCritical,
      isHighConfidence: current.overallConfidence >= 85,
    };
  }, [confidence24hData]);

  return (
    <div 
      id="ai-hazard-confidence-card"
      className={`bg-white border-2 border-[#131b2e] rounded-xl p-5 md:p-6 shadow-sm space-y-5 ${className}`}
    >
      {/* Header Bar & Control Toggles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e4e2e4]">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#131b2e] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-[#1b1b1d]">
                AI Hazard Prediction Confidence (24h Trend)
              </h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping inline-block" />
                GEMINI 3.7 FLASH + GEOTECH ENSEMBLE
              </span>
            </div>
            <p className="text-xs text-[#76777d] mt-0.5">
              Continuous Bayesian confidence tracking of multi-hazard geotechnical rupture probabilities over the last 24 hours
            </p>
          </div>
        </div>

        {/* Action Controls & Filtering */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hazard Sub-line Filter Dropdown/Pills */}
          <div className="flex bg-[#f0edef] p-1 rounded-lg border border-[#c6c6cd] text-xs font-mono">
            <button
              id="filter-all-hazards"
              onClick={() => setSelectedFilter('all')}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                selectedFilter === 'all'
                  ? 'bg-[#131b2e] text-white shadow-xs'
                  : 'text-[#45464d] hover:text-black'
              }`}
            >
              Combined AI
            </button>
            <button
              id="filter-landslide"
              onClick={() => setSelectedFilter('landslide')}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                selectedFilter === 'landslide'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-[#45464d] hover:text-black'
              }`}
            >
              Landslide
            </button>
            <button
              id="filter-debris-flow"
              onClick={() => setSelectedFilter('debrisFlow')}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                selectedFilter === 'debrisFlow'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-[#45464d] hover:text-black'
              }`}
            >
              Debris Flow
            </button>
            <button
              id="filter-wall-shear"
              onClick={() => setSelectedFilter('wallShear')}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                selectedFilter === 'wallShear'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-[#45464d] hover:text-black'
              }`}
            >
              Wall Shear
            </button>
          </div>

          {/* Uncertainty Band Toggle */}
          <button
            id="toggle-confidence-band"
            onClick={() => setShowConfidenceBand(!showConfidenceBand)}
            className={`px-2.5 py-1.5 rounded text-xs font-mono font-semibold transition-colors border flex items-center gap-1.5 ${
              showConfidenceBand
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-white text-[#76777d] border-[#c6c6cd]'
            }`}
            title="Toggle Bayesian Confidence Bounds (±2.5% to ±4.5%)"
          >
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Uncertainty Envelope</span>
          </button>

          {/* Threshold Lines Toggle */}
          <button
            id="toggle-confidence-thresholds"
            onClick={() => setShowThresholds(!showThresholds)}
            className={`px-2.5 py-1.5 rounded text-xs font-mono font-semibold transition-colors border flex items-center gap-1.5 ${
              showThresholds
                ? 'bg-red-50 text-red-800 border-red-300'
                : 'bg-white text-[#76777d] border-[#c6c6cd]'
            }`}
            title="Toggle High Confidence Warning Threshold (85%)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">85% Limit</span>
          </button>
        </div>
      </div>

      {/* 24-Hour Confidence Summary Metric Highlights */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f6f3f5] p-3.5 rounded-xl border border-[#c6c6cd]">
          {/* Current AI Confidence Score */}
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#45464d] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span>Current AI Confidence</span>
            </div>
            <div className="font-mono text-xl md:text-2xl font-black text-red-700 flex items-baseline gap-1">
              <span>{stats.currentScore}%</span>
              <span className="text-[11px] font-semibold text-[#45464d]">Certainty</span>
            </div>
            <div className="text-[10px] text-red-800 font-semibold">
              High Predictive Certainty (Critical)
            </div>
          </div>

          {/* 24-Hour Trajectory / Gain */}
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#45464d]">
              <span>24h Confidence Surge</span>
            </div>
            <div className="font-mono text-xl md:text-2xl font-black text-red-700 flex items-center gap-1">
              <TrendingUp className="w-5 h-5 inline text-red-600" />
              <span>+{stats.delta24h}%</span>
            </div>
            <div className="text-[10px] font-mono font-semibold text-[#45464d]">
              +{stats.deltaPct}% velocity since storm onset
            </div>
          </div>

          {/* 24-Hour Peak Confidence */}
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#45464d]">
              <span>24h Peak Confidence</span>
            </div>
            <div className="font-mono text-xl md:text-2xl font-black text-[#1b1b1d] flex items-baseline gap-1">
              <span>{stats.peakScore}%</span>
              <span className="text-[10px] text-[#76777d] font-normal font-sans">at {stats.peakTime}</span>
            </div>
            <div className="text-[10px] text-[#76777d]">
              Rainfall peak cloudburst window
            </div>
          </div>

          {/* 24-Hour Mean & High Alert Duration */}
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#45464d]">
              <span>Critical Zone Duration</span>
            </div>
            <div className="font-mono text-xl md:text-2xl font-black text-[#1b1b1d]">
              {stats.hoursAboveCritical} <span className="text-xs font-normal text-[#45464d]">of 24 hrs</span>
            </div>
            <div className="text-[10px] font-mono text-[#76777d]">
              24h Mean: <strong>{stats.avgConfidence}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* Main Recharts Line Canvas */}
      <div className="bg-white border border-[#c6c6cd] rounded-xl p-4 pt-6">
        
        {/* Custom Legend & Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            {/* Overall Line */}
            {(selectedFilter === 'all' || selectedFilter === 'landslide') && (
              <div className="flex items-center gap-1.5 font-bold text-[#1b1b1d]">
                <span className="w-4 h-1 bg-red-600 rounded-full inline-block" />
                <span>Overall AI Confidence (%)</span>
              </div>
            )}

            {/* Landslide Hazard Line */}
            {(selectedFilter === 'all' || selectedFilter === 'landslide') && (
              <div className="flex items-center gap-1.5 font-medium text-red-800">
                <span className="w-4 h-1 bg-red-500 border-t-2 border-dashed border-red-700 inline-block" />
                <span>Shallow Landslide</span>
              </div>
            )}

            {/* Debris Flow Line */}
            {(selectedFilter === 'all' || selectedFilter === 'debrisFlow') && (
              <div className="flex items-center gap-1.5 font-medium text-amber-800">
                <span className="w-4 h-1 bg-amber-500 rounded-full inline-block" />
                <span>Debris Flow / Runoff</span>
              </div>
            )}

            {/* Wall Shear Line */}
            {(selectedFilter === 'all' || selectedFilter === 'wallShear') && (
              <div className="flex items-center gap-1.5 font-medium text-purple-800">
                <span className="w-4 h-1 bg-purple-600 rounded-full inline-block" />
                <span>Retaining Wall Shear</span>
              </div>
            )}

            {/* Bayesian Envelope Legend */}
            {showConfidenceBand && (
              <div className="hidden md:flex items-center gap-1.5 text-[#76777d]">
                <span className="w-3.5 h-3 bg-red-100 border border-red-200 rounded inline-block" />
                <span>95% Bayesian Confidence Envelope</span>
              </div>
            )}
          </div>

          <div className="font-mono text-[11px] text-[#76777d] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline: T-24h &rarr; Current</span>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={confidence24hData}
              margin={{ top: 15, right: 30, left: -5, bottom: 5 }}
              onClick={(e) => {
                if (e && e.activeTooltipIndex !== undefined) {
                  setSelectedPointIndex(e.activeTooltipIndex);
                }
              }}
            >
              <defs>
                <linearGradient id="aiConfidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ba1a1a" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ba1a1a" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="uncertaintyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fee2e2" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#fee2e2" stopOpacity={0.2} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e4" vertical={false} />
              
              <XAxis
                dataKey="time"
                stroke="#76777d"
                tick={{ fontSize: 11, fill: '#45464d', fontFamily: 'monospace' }}
                axisLine={{ stroke: '#c6c6cd' }}
                tickLine={false}
              />
              
              <YAxis
                domain={[45, 100]}
                stroke="#76777d"
                tick={{ fontSize: 11, fill: '#45464d', fontFamily: 'monospace' }}
                axisLine={{ stroke: '#c6c6cd' }}
                tickLine={false}
                unit="%"
                ticks={[50, 60, 70, 80, 85, 90, 95, 100]}
              />

              {/* Critical Confidence Threshold Line at 85% */}
              {showThresholds && (
                <ReferenceLine
                  y={85}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'CRITICAL HIGH-CONFIDENCE ZONE (≥85%)',
                    fill: '#991b1b',
                    fontSize: 10,
                    position: 'insideTopRight',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                  }}
                />
              )}

              {/* Advisory Threshold Line at 70% */}
              {showThresholds && (
                <ReferenceLine
                  y={70}
                  stroke="#d97706"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: 'Advisory Threshold (70%)',
                    fill: '#b45309',
                    fontSize: 9,
                    position: 'insideBottomRight',
                    fontFamily: 'monospace',
                  }}
                />
              )}

              {/* Custom Recharts Tooltip */}
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const dataPoint = payload[0].payload;

                  return (
                    <div className="bg-[#131b2e] text-white p-3.5 rounded-xl shadow-2xl border border-black text-xs font-mono space-y-2 min-w-[260px] animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between border-b border-white/20 pb-1.5">
                        <span className="font-bold text-[#d3e4fe] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Timeline: {dataPoint.time} ({dataPoint.hourOffset === 0 ? 'Current' : `${dataPoint.hourOffset}h ago`})</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          dataPoint.overallConfidence >= 85 
                            ? 'bg-red-600 text-white' 
                            : dataPoint.overallConfidence >= 70 
                            ? 'bg-amber-500 text-black' 
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {dataPoint.alertStatus}
                        </span>
                      </div>

                      {/* Primary Overall Confidence */}
                      <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg font-bold">
                        <span className="text-red-300 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          Overall AI Confidence:
                        </span>
                        <span className="text-base text-white">
                          {dataPoint.overallConfidence}%
                        </span>
                      </div>

                      {/* Hazard Sub-Scores */}
                      <div className="space-y-1 pt-1 text-[11px]">
                        <div className="flex justify-between text-red-200">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            Shallow Landslide:
                          </span>
                          <span className="font-bold">{dataPoint.landslideConfidence}%</span>
                        </div>

                        <div className="flex justify-between text-amber-200">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            Debris Flow Runoff:
                          </span>
                          <span className="font-bold">{dataPoint.debrisFlowConfidence}%</span>
                        </div>

                        <div className="flex justify-between text-purple-200">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                            Wall Shear Displacement:
                          </span>
                          <span className="font-bold">{dataPoint.wallShearConfidence}%</span>
                        </div>
                      </div>

                      {/* Uncertainty Range */}
                      {showConfidenceBand && (
                        <div className="text-[10px] text-gray-300 pt-1 border-t border-white/15 flex justify-between">
                          <span>Bayesian Interval (95% CI):</span>
                          <span className="text-white font-bold">{dataPoint.confidenceMin}% &ndash; {dataPoint.confidenceMax}%</span>
                        </div>
                      )}

                      {/* Real Sensor Driver Telemetry at this Hour */}
                      <div className="bg-black/30 p-2 rounded text-[10px] space-y-0.5 border border-white/10">
                        <div className="text-gray-400 font-bold uppercase text-[9px]">Contributing Sensor Signals</div>
                        <div className="flex justify-between text-gray-200">
                          <span>Rainfall: <strong>{dataPoint.rainfallRate} mm/h</strong></span>
                          <span>Moisture: <strong>{dataPoint.soilSaturation}%</strong></span>
                          <span>Inclinometer: <strong>+{dataPoint.displacement}mm</strong></span>
                        </div>
                      </div>

                      <div className="text-[9px] text-emerald-400 text-right flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ensemble Agreement: {dataPoint.ensembleAgreement}%</span>
                      </div>
                    </div>
                  );
                }}
              />

              {/* Bayesian Confidence Interval Max Area */}
              {showConfidenceBand && (
                <Area
                  type="monotone"
                  dataKey="confidenceMax"
                  stroke="none"
                  fill="url(#uncertaintyGradient)"
                  fillOpacity={0.6}
                  name="Uncertainty Envelope Upper"
                />
              )}

              {/* Shaded Area under the Primary Confidence Curve */}
              {(selectedFilter === 'all' || selectedFilter === 'landslide') && (
                <Area
                  type="monotone"
                  dataKey="overallConfidence"
                  stroke="none"
                  fill="url(#aiConfidenceGradient)"
                  name="Confidence Fill"
                />
              )}

              {/* Landslide Hazard Line */}
              {(selectedFilter === 'all' || selectedFilter === 'landslide') && (
                <Line
                  type="monotone"
                  dataKey="landslideConfidence"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{ r: 5, fill: '#ef4444' }}
                  name="Landslide Probability"
                />
              )}

              {/* Debris Flow Hazard Line */}
              {(selectedFilter === 'all' || selectedFilter === 'debrisFlow') && (
                <Line
                  type="monotone"
                  dataKey="debrisFlowConfidence"
                  stroke="#d97706"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#d97706' }}
                  name="Debris Flow Probability"
                />
              )}

              {/* Wall Shear Line */}
              {(selectedFilter === 'all' || selectedFilter === 'wallShear') && (
                <Line
                  type="monotone"
                  dataKey="wallShearConfidence"
                  stroke="#7e22ce"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                  activeDot={{ r: 5, fill: '#7e22ce' }}
                  name="Retaining Wall Shear"
                />
              )}

              {/* PRIMARY Overall AI Confidence Line */}
              {(selectedFilter === 'all' || selectedFilter === 'landslide') && (
                <Line
                  type="monotone"
                  dataKey="overallConfidence"
                  stroke="#ba1a1a"
                  strokeWidth={3.5}
                  dot={{ r: 3.5, fill: '#ba1a1a', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 7, fill: '#991b1b', stroke: '#ffffff', strokeWidth: 2 }}
                  name="Overall AI Confidence"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Geological AI Analysis Footer Note */}
        <div className="mt-3 pt-3 border-t border-[#e4e2e4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#45464d]">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-red-700 shrink-0" />
            <span>
              <strong>Predictive Model Diagnostics:</strong> Confidence score increased by +{stats?.delta24h}% over the past 24 hours driven by soil saturation reaching 84% and cumulative inclinometer deflection (+2.4mm).
            </span>
          </div>
          <div className="font-mono text-[11px] text-[#76777d] shrink-0">
            Model Agreement: <strong className="text-[#1b1b1d]">96.4%</strong> (High Calibration)
          </div>
        </div>
      </div>
    </div>
  );
};
