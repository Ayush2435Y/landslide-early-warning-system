import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Activity, 
  Clock, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown,
  RefreshCw, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Droplets,
  CloudRain,
  Compass,
  Gauge,
  Zap,
  Sliders,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { PredictiveAIInsight, SensorData } from '../types';
import { AIConfidence24hChart } from './AIConfidence24hChart';
import { TrendProjectionChart } from './TrendProjectionChart';

interface EnvironmentalMetricsViewProps {
  insight: PredictiveAIInsight;
  sensors: SensorData[];
  onRefreshAI: () => void;
  isLoadingAI: boolean;
}

type ComparisonMetric = 'soilMoisture' | 'precipitation' | 'displacement' | 'porePressure' | 'seismic';
type TimeframeOption = '24h' | '7d' | '30d' | '12m';

export const EnvironmentalMetricsView: React.FC<EnvironmentalMetricsViewProps> = ({
  insight,
  sensors,
  onRefreshAI,
  isLoadingAI,
}) => {
  const [selectedHistoricalEvent, setSelectedHistoricalEvent] = useState<string | null>(null);
  
  // Historical Comparison Chart state
  const [activeMetric, setActiveMetric] = useState<ComparisonMetric>('soilMoisture');
  const [activeTimeframe, setActiveTimeframe] = useState<TimeframeOption>('7d');
  const [selectedSector, setSelectedSector] = useState<string>('Sector 4 (Zone Alpha)');
  const [showThreshold, setShowThreshold] = useState<boolean>(true);
  const [showMinMaxBand, setShowMinMaxBand] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'area' | 'line'>('area');

  // Precipitation histogram data points
  const precipitationData = [
    { time: '00:00', value: 12, isPeak: false },
    { time: '04:00', value: 24, isPeak: false },
    { time: '08:00', value: 16, isPeak: false },
    { time: '12:00', value: 45, isPeak: true }, // Peak rainfall in red
    { time: '16:00', value: 30, isPeak: false },
    { time: '20:00', value: 22, isPeak: false },
  ];

  // Inclinometer 24h displacement bars
  const inclinometerBars = [
    { height: 18, isHigh: false },
    { height: 22, isHigh: false },
    { height: 35, isHigh: false },
    { height: 50, isHigh: false },
    { height: 85, isHigh: true },
    { height: 100, isHigh: true },
  ];

  // Metadata for the metrics being compared
  const metricConfigs: Record<ComparisonMetric, {
    label: string;
    unit: string;
    icon: React.ReactNode;
    threshold: number;
    thresholdLabel: string;
    description: string;
    currentSensorId: string;
    historicalEventName: string;
  }> = {
    soilMoisture: {
      label: 'Soil Saturation (VWC)',
      unit: '%',
      icon: <Droplets className="w-4 h-4 text-cyan-600" />,
      threshold: 75,
      thresholdLabel: 'Liquefaction Threshold (75%)',
      description: 'Volumetric Water Content compared to prior monsoon moisture penetration.',
      currentSensorId: 'SM-02 (Sector 4)',
      historicalEventName: 'Aug 2025 Pre-Slip Cycle',
    },
    precipitation: {
      label: 'Precipitation Intensity',
      unit: 'mm/h',
      icon: <CloudRain className="w-4 h-4 text-blue-600" />,
      threshold: 35,
      thresholdLabel: 'High Intensity Trigger (35 mm/h)',
      description: 'Pluviometer telemetry vs historical cloudburst storm cells.',
      currentSensorId: 'RG-01 (Sector 4 Ridge)',
      historicalEventName: 'Aug 2025 Typhoon Outflow',
    },
    displacement: {
      label: 'Borehole Displacement',
      unit: 'mm',
      icon: <Activity className="w-4 h-4 text-amber-600" />,
      threshold: 1.5,
      thresholdLabel: 'Critical Shear Failure Limit (1.5mm)',
      description: 'Inclinometer cumulative lateral shear deflection at 15m depth.',
      currentSensorId: 'IC-44 (Retaining Wall B)',
      historicalEventName: 'Aug 2025 Toe Slump',
    },
    porePressure: {
      label: 'Pore Water Pressure',
      unit: 'kPa',
      icon: <Gauge className="w-4 h-4 text-red-600" />,
      threshold: 50,
      thresholdLabel: 'Hydraulic Rupture Limit (50 kPa)',
      description: 'Vibrating wire piezometer hydrostatic head build-up.',
      currentSensorId: 'PZ-109 (Slope Footing)',
      historicalEventName: 'Aug 2025 Aquifer Surge',
    },
    seismic: {
      label: 'Micro-Seismic Vibration',
      unit: 'mm/s',
      icon: <Zap className="w-4 h-4 text-purple-600" />,
      threshold: 2.0,
      thresholdLabel: 'Acoustic Emission Burst (2.0 mm/s)',
      description: 'Sub-surface acoustic geophone micro-fracture resonance.',
      currentSensorId: 'SEIS-01 (Bedrock Interface)',
      historicalEventName: 'Aug 2025 Micro-Seismic Swarm',
    },
  };

  // Generate Year-Over-Year (YoY) comparison datasets for each timeframe & metric
  const comparisonData = useMemo(() => {
    if (activeTimeframe === '24h') {
      // 24-Hour granular comparison (Today vs Same Day Last Year)
      const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      
      return hours.map((hour, idx) => {
        switch (activeMetric) {
          case 'soilMoisture': {
            const hist = [48, 49, 50, 52, 54, 56, 58, 62, 65, 63, 60, 58][idx];
            const curr = [55, 57, 60, 64, 69, 73, 78, 82, 84, 83, 81, 80][idx];
            return {
              label: hour,
              timeTooltip: `Today ${hour} vs Aug 26, 2025 ${hour}`,
              current: curr,
              historical: hist,
              histMin: Math.max(30, hist - 6),
              histMax: hist + 8,
              delta: Number((curr - hist).toFixed(1)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
          case 'precipitation': {
            const hist = [4, 6, 12, 18, 22, 28, 32, 24, 16, 10, 6, 2][idx];
            const curr = [8, 12, 24, 30, 38, 45, 48, 42, 30, 22, 16, 10][idx];
            return {
              label: hour,
              timeTooltip: `Today ${hour} vs Aug 26, 2025 ${hour}`,
              current: curr,
              historical: hist,
              histMin: Math.max(0, hist - 5),
              histMax: hist + 9,
              delta: Number((curr - hist).toFixed(1)),
              deltaPct: Number((((curr - hist) / (hist || 1)) * 100).toFixed(1)),
            };
          }
          case 'displacement': {
            const hist = [0.4, 0.45, 0.5, 0.55, 0.6, 0.68, 0.75, 0.82, 0.9, 0.95, 1.0, 1.05][idx];
            const curr = [0.8, 0.9, 1.05, 1.25, 1.45, 1.7, 1.95, 2.15, 2.3, 2.38, 2.42, 2.45][idx];
            return {
              label: hour,
              timeTooltip: `Today ${hour} vs Aug 26, 2025 ${hour}`,
              current: curr,
              historical: hist,
              histMin: Number(Math.max(0.1, hist - 0.2).toFixed(2)),
              histMax: Number((hist + 0.25).toFixed(2)),
              delta: Number((curr - hist).toFixed(2)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
          case 'porePressure': {
            const hist = [28, 29, 31, 33, 35, 38, 41, 40, 38, 36, 34, 32][idx];
            const curr = [34, 37, 41, 45, 49, 53, 58, 57, 55, 52, 50, 48][idx];
            return {
              label: hour,
              timeTooltip: `Today ${hour} vs Aug 26, 2025 ${hour}`,
              current: curr,
              historical: hist,
              histMin: Math.max(20, hist - 5),
              histMax: hist + 6,
              delta: Number((curr - hist).toFixed(1)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
          case 'seismic': {
            const hist = [0.3, 0.4, 0.4, 0.6, 0.7, 0.9, 1.1, 0.8, 0.6, 0.5, 0.4, 0.3][idx];
            const curr = [0.5, 0.8, 1.2, 1.6, 2.1, 2.8, 3.8, 3.4, 2.7, 2.1, 1.5, 1.1][idx];
            return {
              label: hour,
              timeTooltip: `Today ${hour} vs Aug 26, 2025 ${hour}`,
              current: curr,
              historical: hist,
              histMin: Number(Math.max(0.1, hist - 0.2).toFixed(1)),
              histMax: Number((hist + 0.4).toFixed(1)),
              delta: Number((curr - hist).toFixed(1)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
        }
      });
    }

    if (activeTimeframe === '7d') {
      // 7-Day Comparison (Current Week vs Same Calendar Week Last Year)
      const days = [
        { label: 'Day -6', full: 'Aug 20' },
        { label: 'Day -5', full: 'Aug 21' },
        { label: 'Day -4', full: 'Aug 22' },
        { label: 'Day -3', full: 'Aug 23' },
        { label: 'Day -2', full: 'Aug 24' },
        { label: 'Yesterday', full: 'Aug 25' },
        { label: 'Today', full: 'Aug 26' },
      ];

      return days.map((day, idx) => {
        switch (activeMetric) {
          case 'soilMoisture': {
            const hist = [44, 46, 50, 55, 61, 64, 62][idx];
            const curr = [52, 58, 65, 72, 79, 83, 84][idx];
            return {
              label: day.label,
              dateStr: day.full,
              timeTooltip: `${day.full}, 2026 vs ${day.full}, 2025`,
              current: curr,
              historical: hist,
              histMin: hist - 7,
              histMax: hist + 8,
              delta: Number((curr - hist).toFixed(1)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
          case 'precipitation': {
            const hist = [10, 15, 28, 35, 22, 14, 8][idx];
            const curr = [18, 25, 42, 58, 64, 48, 35][idx];
            return {
              label: day.label,
              dateStr: day.full,
              timeTooltip: `${day.full}, 2026 vs ${day.full}, 2025`,
              current: curr,
              historical: hist,
              histMin: Math.max(0, hist - 8),
              histMax: hist + 12,
              delta: Number((curr - hist).toFixed(1)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
          case 'displacement': {
            const hist = [0.3, 0.4, 0.55, 0.7, 0.85, 0.95, 1.05][idx];
            const curr = [0.5, 0.7, 1.0, 1.35, 1.75, 2.1, 2.4][idx];
            return {
              label: day.label,
              dateStr: day.full,
              timeTooltip: `${day.full}, 2026 vs ${day.full}, 2025`,
              current: curr,
              historical: hist,
              histMin: Number(Math.max(0.1, hist - 0.2).toFixed(2)),
              histMax: Number((hist + 0.3).toFixed(2)),
              delta: Number((curr - hist).toFixed(2)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
          case 'porePressure': {
            const hist = [26, 28, 32, 37, 41, 39, 36][idx];
            const curr = [32, 36, 42, 48, 54, 57, 58.4][idx];
            return {
              label: day.label,
              dateStr: day.full,
              timeTooltip: `${day.full}, 2026 vs ${day.full}, 2025`,
              current: curr,
              historical: hist,
              histMin: hist - 6,
              histMax: hist + 7,
              delta: Number((curr - hist).toFixed(1)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
          case 'seismic': {
            const hist = [0.2, 0.3, 0.5, 0.8, 1.0, 0.7, 0.4][idx];
            const curr = [0.4, 0.6, 1.1, 1.8, 2.9, 3.5, 3.8][idx];
            return {
              label: day.label,
              dateStr: day.full,
              timeTooltip: `${day.full}, 2026 vs ${day.full}, 2025`,
              current: curr,
              historical: hist,
              histMin: Number(Math.max(0.1, hist - 0.2).toFixed(1)),
              histMax: Number((hist + 0.5).toFixed(1)),
              delta: Number((curr - hist).toFixed(1)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
        }
      });
    }

    if (activeTimeframe === '30d') {
      // 30-Day Comparison (Past 30 Days vs Past 30 Days Last Year)
      const weeks = ['W-4 (Late Jul)', 'W-3 (Early Aug)', 'W-2 (Mid Aug)', 'W-1 (Prior Wk)', 'Current Week'];
      return weeks.map((w, idx) => {
        switch (activeMetric) {
          case 'soilMoisture': {
            const hist = [38, 42, 49, 58, 62][idx];
            const curr = [45, 53, 66, 78, 84][idx];
            return {
              label: w,
              timeTooltip: `${w} (2026 vs 2025)`,
              current: curr,
              historical: hist,
              histMin: hist - 8,
              histMax: hist + 9,
              delta: Number((curr - hist).toFixed(1)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
          case 'precipitation': {
            const hist = [45, 78, 120, 185, 140][idx];
            const curr = [60, 110, 195, 280, 245][idx];
            return {
              label: w,
              timeTooltip: `${w} Weekly Accumulation (2026 vs 2025)`,
              current: curr,
              historical: hist,
              histMin: hist - 25,
              histMax: hist + 30,
              delta: Number((curr - hist).toFixed(1)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
          case 'displacement': {
            const hist = [0.15, 0.3, 0.55, 0.8, 1.05][idx];
            const curr = [0.2, 0.5, 0.95, 1.6, 2.4][idx];
            return {
              label: w,
              timeTooltip: `${w} (2026 vs 2025)`,
              current: curr,
              historical: hist,
              histMin: Number(Math.max(0.05, hist - 0.15).toFixed(2)),
              histMax: Number((hist + 0.25).toFixed(2)),
              delta: Number((curr - hist).toFixed(2)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
          case 'porePressure': {
            const hist = [22, 26, 31, 38, 36][idx];
            const curr = [28, 34, 43, 52, 58.4][idx];
            return {
              label: w,
              timeTooltip: `${w} (2026 vs 2025)`,
              current: curr,
              historical: hist,
              histMin: hist - 6,
              histMax: hist + 7,
              delta: Number((curr - hist).toFixed(1)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
          case 'seismic': {
            const hist = [0.1, 0.2, 0.4, 0.7, 0.4][idx];
            const curr = [0.2, 0.5, 1.2, 2.4, 3.8][idx];
            return {
              label: w,
              timeTooltip: `${w} (2026 vs 2025)`,
              current: curr,
              historical: hist,
              histMin: Number(Math.max(0.05, hist - 0.1).toFixed(1)),
              histMax: Number((hist + 0.3).toFixed(1)),
              delta: Number((curr - hist).toFixed(1)),
              deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
            };
          }
        }
      });
    }

    // 12 Months Seasonality
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug (Now)', 'Sep (Proj)', 'Oct', 'Nov', 'Dec'];
    return months.map((m, idx) => {
      switch (activeMetric) {
        case 'soilMoisture': {
          const hist = [32, 34, 38, 45, 48, 55, 60, 62, 58, 46, 38, 33][idx];
          const curr = [35, 38, 42, 50, 56, 68, 76, 84, 79, 54, 42, 36][idx];
          return {
            label: m,
            timeTooltip: `${m} YoY Comparison`,
            current: curr,
            historical: hist,
            histMin: hist - 8,
            histMax: hist + 8,
            delta: Number((curr - hist).toFixed(1)),
            deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
          };
        }
        case 'precipitation': {
          const hist = [40, 55, 80, 110, 145, 210, 280, 310, 260, 150, 80, 50][idx];
          const curr = [50, 65, 95, 130, 175, 260, 350, 420, 330, 180, 95, 60][idx];
          return {
            label: m,
            timeTooltip: `${m} Monthly Rainfall (mm)`,
            current: curr,
            historical: hist,
            histMin: hist - 30,
            histMax: hist + 40,
            delta: Number((curr - hist).toFixed(1)),
            deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
          };
        }
        case 'displacement': {
          const hist = [0.1, 0.15, 0.2, 0.35, 0.5, 0.75, 0.95, 1.05, 1.15, 1.2, 1.25, 1.28][idx];
          const curr = [0.12, 0.18, 0.28, 0.5, 0.8, 1.3, 1.9, 2.4, 2.8, 3.1, 3.25, 3.3][idx];
          return {
            label: m,
            timeTooltip: `${m} Cumulative Deflection (mm)`,
            current: curr,
            historical: hist,
            histMin: Number(Math.max(0.05, hist - 0.15).toFixed(2)),
            histMax: Number((hist + 0.2).toFixed(2)),
            delta: Number((curr - hist).toFixed(2)),
            deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
          };
        }
        case 'porePressure': {
          const hist = [18, 20, 22, 26, 29, 34, 38, 36, 33, 27, 21, 19][idx];
          const curr = [20, 22, 26, 31, 36, 44, 52, 58.4, 51, 34, 24, 21][idx];
          return {
            label: m,
            timeTooltip: `${m} Pore Pressure (kPa)`,
            current: curr,
            historical: hist,
            histMin: hist - 5,
            histMax: hist + 6,
            delta: Number((curr - hist).toFixed(1)),
            deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
          };
        }
        case 'seismic': {
          const hist = [0.1, 0.1, 0.2, 0.3, 0.4, 0.6, 0.8, 0.4, 0.3, 0.2, 0.1, 0.1][idx];
          const curr = [0.1, 0.2, 0.3, 0.4, 0.7, 1.4, 2.5, 3.8, 2.9, 1.1, 0.4, 0.2][idx];
          return {
            label: m,
            timeTooltip: `${m} Seismic Energy (mm/s)`,
            current: curr,
            historical: hist,
            histMin: Number(Math.max(0.05, hist - 0.1).toFixed(1)),
            histMax: Number((hist + 0.25).toFixed(1)),
            delta: Number((curr - hist).toFixed(1)),
            deltaPct: Number((((curr - hist) / hist) * 100).toFixed(1)),
          };
        }
      }
    });
  }, [activeTimeframe, activeMetric]);

  // Key summary statistics for the comparison header
  const summaryStats = useMemo(() => {
    if (!comparisonData || comparisonData.length === 0) return null;
    const latest = comparisonData[comparisonData.length - 1];
    const maxCurrent = Math.max(...comparisonData.map((d) => d.current));
    const maxHistorical = Math.max(...comparisonData.map((d) => d.historical));
    const peakDeltaPct = (((maxCurrent - maxHistorical) / maxHistorical) * 100).toFixed(1);
    const isExceedingThreshold = maxCurrent >= metricConfigs[activeMetric].threshold;

    return {
      latestCurrent: latest.current,
      latestHistorical: latest.historical,
      latestDelta: latest.delta,
      latestDeltaPct: latest.deltaPct,
      maxCurrent,
      maxHistorical,
      peakDeltaPct,
      isExceedingThreshold,
    };
  }, [comparisonData, activeMetric]);

  return (
    <div className="flex-1 bg-[#fcf8fa] overflow-y-auto p-4 md:p-8 min-h-screen pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c6c6cd] pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1b1b1d] tracking-tight flex items-center gap-3">
              <span>Environmental Metrics & Historical YoY Analysis</span>
              <span className="hidden sm:inline-block text-xs font-mono font-bold px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded">
                LIVE OVERLAY
              </span>
            </h1>
            <p className="text-sm text-[#45464d] mt-1">
              Multi-temporal geotechnical comparison of current sensor signals against 2025 baseline telemetry
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefreshAI}
              disabled={isLoadingAI}
              className="px-3.5 py-2 bg-white border border-[#c6c6cd] rounded font-semibold text-xs text-[#1b1b1d] hover:bg-[#e4e2e4] transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAI ? 'animate-spin text-red-600' : ''}`} />
              <span>{isLoadingAI ? 'Analyzing Telemetry...' : 'Run Gemini Geotech AI'}</span>
            </button>

            <span className="bg-red-700 text-white font-label-caps text-xs px-3.5 py-2 rounded font-bold uppercase tracking-wider shadow-xs">
              Elevated Risk Status
            </span>
          </div>
        </div>

        {/* 6-Hour Predicted Soil Moisture & Rainfall Trend Projection Chart (Recharts) */}
        <TrendProjectionChart 
          insight={insight} 
          sensors={sensors} 
          onRefreshAI={onRefreshAI} 
          isLoadingAI={isLoadingAI} 
        />

        {/* AI-Powered Hazard Prediction Confidence (24h Trend) Recharts Line Chart */}
        <AIConfidence24hChart insight={insight} sensors={sensors} />

        {/* PRIMARY FEATURE: Historical YoY Sensor Comparison & Trend Overlay Module */}
        <div className="bg-white border-2 border-[#131b2e] rounded-xl p-5 md:p-6 shadow-sm space-y-5">
          {/* Card Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e4e2e4]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#131b2e] text-white flex items-center justify-center font-bold shadow-xs">
                  <TrendingUp className="w-4 h-4 text-[#d3e4fe]" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-[#1b1b1d] flex items-center gap-2">
                    <span>Year-Over-Year Telemetry Overlay</span>
                    <span className="text-xs bg-slate-100 text-slate-800 font-mono font-bold px-2 py-0.5 rounded border border-slate-300">
                      2026 vs 2025
                    </span>
                  </h2>
                  <p className="text-xs text-[#76777d]">
                    Overlaying real-time {metricConfigs[activeMetric].label} against historical data from the identical calendar interval last year
                  </p>
                </div>
              </div>
            </div>

            {/* Timeframe & Display Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Timeframe Selector */}
              <div className="flex bg-[#f0edef] p-1 rounded-lg border border-[#c6c6cd]">
                {(['24h', '7d', '30d', '12m'] as TimeframeOption[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeframe(tf)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-all ${
                      activeTimeframe === tf
                        ? 'bg-[#131b2e] text-white shadow-xs'
                        : 'text-[#45464d] hover:text-[#1b1b1d]'
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Threshold Toggle */}
              <button
                onClick={() => setShowThreshold(!showThreshold)}
                className={`px-2.5 py-1.5 rounded text-xs font-mono font-semibold transition-colors border flex items-center gap-1 ${
                  showThreshold
                    ? 'bg-red-50 text-red-800 border-red-300'
                    : 'bg-white text-[#76777d] border-[#c6c6cd]'
                }`}
                title="Toggle Safety Threshold Line"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline">Safety Limit</span>
              </button>

              {/* Historical Min-Max Band Toggle */}
              <button
                onClick={() => setShowMinMaxBand(!showMinMaxBand)}
                className={`px-2.5 py-1.5 rounded text-xs font-mono font-semibold transition-colors border flex items-center gap-1 ${
                  showMinMaxBand
                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                    : 'bg-white text-[#76777d] border-[#c6c6cd]'
                }`}
                title="Toggle Historical Variance Range (Min-Max Band)"
              >
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">2025 Normal Band</span>
              </button>
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(Object.keys(metricConfigs) as ComparisonMetric[]).map((key) => {
              const config = metricConfigs[key];
              const isSelected = activeMetric === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveMetric(key)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-[#131b2e] text-white border-black shadow-xs ring-2 ring-[#131b2e]/20'
                      : 'bg-[#fcf8fa] text-[#1b1b1d] border-[#c6c6cd] hover:border-black hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={isSelected ? 'text-white' : ''}>{config.icon}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#e4e2e4] text-[#45464d]'
                      }`}
                    >
                      {config.unit}
                    </span>
                  </div>
                  <div className="text-xs font-bold truncate">{config.label}</div>
                  <div className={`text-[10px] font-mono mt-0.5 truncate ${isSelected ? 'text-[#d3e4fe]' : 'text-[#76777d]'}`}>
                    {config.currentSensorId.split(' ')[0]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* YoY Statistical Summary Metrics Banner */}
          {summaryStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f6f3f5] p-3.5 rounded-xl border border-[#c6c6cd]">
              {/* Current Telemetry Reading */}
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#45464d] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                  <span>Current 2026 Reading</span>
                </div>
                <div className="font-mono text-xl md:text-2xl font-black text-red-700">
                  {summaryStats.latestCurrent}{' '}
                  <span className="text-xs font-normal text-[#45464d]">{metricConfigs[activeMetric].unit}</span>
                </div>
                <div className="text-[10px] text-[#76777d]">Sensor: {metricConfigs[activeMetric].currentSensorId}</div>
              </div>

              {/* Historical 2025 Baseline Reading */}
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#45464d] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
                  <span>2025 Same Timeframe</span>
                </div>
                <div className="font-mono text-xl md:text-2xl font-black text-[#1b1b1d]">
                  {summaryStats.latestHistorical}{' '}
                  <span className="text-xs font-normal text-[#45464d]">{metricConfigs[activeMetric].unit}</span>
                </div>
                <div className="text-[10px] text-[#76777d]">Ref: {metricConfigs[activeMetric].historicalEventName}</div>
              </div>

              {/* YoY Delta Divergence */}
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#45464d]">
                  <span>YoY Variance (Delta)</span>
                </div>
                <div className={`font-mono text-xl md:text-2xl font-black flex items-center gap-1 ${
                  summaryStats.latestDelta >= 0 ? 'text-red-700' : 'text-emerald-700'
                }`}>
                  {summaryStats.latestDelta >= 0 ? (
                    <ArrowUpRight className="w-5 h-5 inline" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 inline" />
                  )}
                  <span>
                    {summaryStats.latestDelta >= 0 ? '+' : ''}
                    {summaryStats.latestDelta} {metricConfigs[activeMetric].unit}
                  </span>
                </div>
                <div className="text-[10px] font-mono font-bold text-red-700">
                  {summaryStats.latestDeltaPct >= 0 ? `+${summaryStats.latestDeltaPct}%` : `${summaryStats.latestDeltaPct}%`} vs prior year
                </div>
              </div>

              {/* Threshold & Risk Evaluation */}
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#45464d]">
                  <span>Safety Status</span>
                </div>
                <div className="font-mono text-base md:text-lg font-bold">
                  {summaryStats.isExceedingThreshold ? (
                    <span className="text-red-700 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 animate-bounce" />
                      <span>THRESHOLD BREACH</span>
                    </span>
                  ) : (
                    <span className="text-amber-700 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>ELEVATED YOY</span>
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-[#76777d]">
                  Limit: {metricConfigs[activeMetric].threshold} {metricConfigs[activeMetric].unit}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Recharts Comparison Canvas */}
          <div className="bg-white border border-[#c6c6cd] rounded-xl p-4 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 font-medium text-[#1b1b1d]">
                  <span className="w-3.5 h-1 bg-red-600 rounded-full inline-block" />
                  <span className="font-bold">2026 Current Trend</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-[#45464d]">
                  <span className="w-3.5 h-1 border-t-2 border-dashed border-slate-500 inline-block" />
                  <span>2025 Historical Baseline</span>
                </div>
                {showMinMaxBand && (
                  <div className="flex items-center gap-1.5 text-[#76777d] hidden sm:flex">
                    <span className="w-3 h-3 bg-slate-200 rounded border border-slate-300 inline-block" />
                    <span>2025 Normal Min-Max Envelope</span>
                  </div>
                )}
              </div>

              <div className="font-mono text-[11px] text-[#76777d]">
                Unit: {metricConfigs[activeMetric].unit} &bull; Interval: {activeTimeframe.toUpperCase()}
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={comparisonData}
                  margin={{ top: 15, right: 25, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#76777d"
                    tick={{ fontSize: 11, fill: '#45464d', fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#c6c6cd' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#76777d"
                    tick={{ fontSize: 11, fill: '#45464d', fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#c6c6cd' }}
                    tickLine={false}
                    unit={` ${metricConfigs[activeMetric].unit}`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const dataPoint = payload[0].payload;
                      const diff = dataPoint.current - dataPoint.historical;
                      const diffSign = diff >= 0 ? '+' : '';

                      return (
                        <div className="bg-[#131b2e] text-white p-3 rounded-lg shadow-xl border border-black text-xs font-mono space-y-1.5 min-w-[220px]">
                          <div className="font-bold border-b border-white/20 pb-1 text-[#d3e4fe] flex justify-between">
                            <span>{dataPoint.label}</span>
                            <span className="text-[10px] text-gray-400">{activeTimeframe.toUpperCase()}</span>
                          </div>
                          {dataPoint.timeTooltip && (
                            <div className="text-[10px] text-gray-300 font-sans">{dataPoint.timeTooltip}</div>
                          )}
                          
                          <div className="flex justify-between items-center pt-1 text-red-300 font-bold">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              2026 Current:
                            </span>
                            <span>
                              {dataPoint.current} {metricConfigs[activeMetric].unit}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-300">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              2025 Historical:
                            </span>
                            <span>
                              {dataPoint.historical} {metricConfigs[activeMetric].unit}
                            </span>
                          </div>

                          {showMinMaxBand && (
                            <div className="flex justify-between items-center text-[10px] text-gray-400">
                              <span>2025 Normal Range:</span>
                              <span>
                                {dataPoint.histMin} - {dataPoint.histMax} {metricConfigs[activeMetric].unit}
                              </span>
                            </div>
                          )}

                          <div className="border-t border-white/20 pt-1.5 flex justify-between font-bold">
                            <span className="text-amber-300">YoY Variance:</span>
                            <span className={diff >= 0 ? 'text-red-400' : 'text-emerald-400'}>
                              {diffSign}{diff.toFixed(2)} {metricConfigs[activeMetric].unit} ({diffSign}{dataPoint.deltaPct}%)
                            </span>
                          </div>

                          {dataPoint.current >= metricConfigs[activeMetric].threshold && (
                            <div className="mt-1 bg-red-900/80 text-red-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-center border border-red-600">
                              SAFETY THRESHOLD BREACHED
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />

                  {/* Historical Min-Max Variance Envelope */}
                  {showMinMaxBand && (
                    <Area
                      type="monotone"
                      dataKey="histMax"
                      stroke="none"
                      fill="#e2e8f0"
                      fillOpacity={0.45}
                      name="2025 Normal Upper"
                    />
                  )}

                  {/* Historical 2025 Trend Line (Dashed Slate) */}
                  <Line
                    type="monotone"
                    dataKey="historical"
                    stroke="#64748b"
                    strokeWidth={2.5}
                    strokeDasharray="5 4"
                    dot={{ r: 3, fill: '#64748b', strokeWidth: 1, stroke: '#ffffff' }}
                    activeDot={{ r: 5, fill: '#334155' }}
                    name="2025 Historical Data"
                  />

                  {/* Current 2026 Trend Line with Vibrant Red Accent */}
                  <Area
                    type="monotone"
                    dataKey="current"
                    stroke="#ba1a1a"
                    strokeWidth={3}
                    fill="url(#currentGradient)"
                    dot={{ r: 4, fill: '#ba1a1a', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 7, fill: '#991b1b', stroke: '#ffffff', strokeWidth: 2 }}
                    name="2026 Current Data"
                  />

                  {/* Safety Threshold Reference Line */}
                  {showThreshold && (
                    <ReferenceLine
                      y={metricConfigs[activeMetric].threshold}
                      stroke="#dc2626"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: metricConfigs[activeMetric].thresholdLabel,
                        fill: '#991b1b',
                        fontSize: 10,
                        position: 'top',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                      }}
                    />
                  )}

                  <defs>
                    <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ba1a1a" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#ba1a1a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Explanatory Geological Note */}
            <div className="mt-3 pt-3 border-t border-[#e4e2e4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#45464d]">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#76777d] shrink-0" />
                <span>
                  <strong>Geotechnical Analysis:</strong> {metricConfigs[activeMetric].description}
                </span>
              </div>
              <div className="font-mono text-[11px] text-[#76777d]">
                Historical match confidence: <strong className="text-[#1b1b1d]">91.8%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Top Grid: AI Insights & Inclinometer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Predictive AI Insights Card */}
          <div className="lg:col-span-2 bg-white border border-red-200 rounded-xl p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-700">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <h2 className="text-lg font-bold">Predictive AI Insights</h2>
              </div>
              <span className="text-[11px] font-mono text-[#76777d]">
                Engine: Gemini 3.7 Flash
              </span>
            </div>

            <p className="text-sm text-[#1b1b1d] leading-relaxed mb-6">
              Correlation between current saturation levels (<strong>84%</strong>) and predicted rainfall (<strong>45mm/h</strong>) indicates a <strong className="text-red-700 font-bold underline">72% probability of shallow landslides</strong> in Sector 4 within the next 12 hours. Recommend immediate structural assessment of retaining wall B.
            </p>

            {/* Sub-Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#fcf8fa] border border-[#c6c6cd] rounded-lg p-3.5">
                <span className="text-[11px] font-label-caps text-[#45464d] block uppercase mb-1">
                  Risk Factor
                </span>
                <span className="font-mono text-sm font-bold text-red-700">
                  {insight.riskFactor || 'Soil Saturation'}
                </span>
              </div>

              <div className="bg-[#fcf8fa] border border-[#c6c6cd] rounded-lg p-3.5">
                <span className="text-[11px] font-label-caps text-[#45464d] block uppercase mb-1">
                  Time to Critical
                </span>
                <span className="font-mono text-sm font-bold text-[#1b1b1d]">
                  {insight.timeToCritical || '~4.5 Hours'}
                </span>
              </div>

              <div className="bg-[#fcf8fa] border border-[#c6c6cd] rounded-lg p-3.5">
                <span className="text-[11px] font-label-caps text-[#45464d] block uppercase mb-1">
                  Confidence
                </span>
                <span className="font-mono text-sm font-bold text-[#1b1b1d]">
                  {insight.confidence || 94.2}%
                </span>
              </div>
            </div>

            {/* Recommendations Accordion */}
            {insight.recommendations && insight.recommendations.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#e4e2e4]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#45464d] mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
                  <span>Mitigation Action Checklist</span>
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-[#1b1b1d]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Inclinometer Data Card */}
          <div className="bg-white border border-[#c6c6cd] rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-[#1b1b1d]">Inclinometer Data</h3>
              <Activity className="w-5 h-5 text-[#76777d]" />
            </div>

            <div className="text-center my-auto py-4">
              <div className="font-mono text-2xl font-black text-[#1b1b1d]">
                +2.4<span className="text-sm font-normal text-[#45464d]">mm</span>
              </div>
              <span className="text-xs text-[#45464d] block mt-0.5">
                Displacement (24h)
              </span>
            </div>

            {/* Displacement Bars */}
            <div className="flex items-end justify-between h-20 gap-2 px-2 pt-2 border-t border-[#e4e2e4]">
              {inclinometerBars.map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t transition-all duration-500 ${
                      bar.isHigh ? 'bg-[#991b1b]' : 'bg-[#d5e3fd]'
                    }`}
                    style={{ height: `${bar.height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Charts Grid: Precipitation Rate & Soil Moisture */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Precipitation Rate */}
          <div className="bg-white border border-[#c6c6cd] rounded-xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-[#1b1b1d]">Precipitation Rate</h3>
              <span className="bg-[#f0edef] border border-[#c6c6cd] font-mono text-xs text-[#45464d] px-2 py-0.5 rounded">
                mm/h
              </span>
            </div>

            <div className="h-44 flex items-end justify-between gap-3 px-4 pb-2 border-b border-[#c6c6cd]">
              {precipitationData.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="font-mono text-[11px] text-[#45464d] opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.value}
                  </span>
                  <div
                    className={`w-full max-w-[42px] rounded-t transition-all duration-300 ${
                      item.isPeak ? 'bg-[#ba1a1a]' : 'bg-[#38485d]'
                    }`}
                    style={{ height: `${(item.value / 50) * 100}%` }}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between px-4 pt-3 text-xs font-mono text-[#76777d]">
              {precipitationData.map((d, i) => (
                <span key={i}>{d.time}</span>
              ))}
            </div>
          </div>

          {/* Soil Moisture Levels */}
          <div className="bg-white border border-[#c6c6cd] rounded-xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-[#1b1b1d]">Soil Moisture Levels</h3>
              <span className="bg-[#f0edef] border border-[#c6c6cd] font-mono text-xs text-[#45464d] px-2 py-0.5 rounded">
                VWC %
              </span>
            </div>

            <div className="relative h-44 w-full flex items-center border-b border-[#c6c6cd]">
              {/* Critical Threshold Line */}
              <div className="absolute top-[35%] left-0 right-0 border-b border-dashed border-red-600 z-10 flex justify-end pr-2">
                <span className="font-mono text-[10px] text-red-700 bg-white/90 px-1 font-bold">
                  Critical (75%)
                </span>
              </div>

              {/* SVG Trend Line */}
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 160">
                <path
                  d="M 20,130 Q 120,120 220,105 T 420,60 T 580,45 T 680,35"
                  fill="none"
                  stroke="#1b1b1d"
                  strokeWidth="2.5"
                />
                <circle cx="20" cy="130" r="3.5" fill="#1b1b1d" />
                <circle cx="220" cy="105" r="3.5" fill="#1b1b1d" />
                <circle cx="420" cy="60" r="3.5" fill="#1b1b1d" />
                <circle cx="580" cy="45" r="4.5" fill="#dc2626" />
                <circle cx="680" cy="35" r="5" fill="#dc2626" className="animate-ping" />
              </svg>
            </div>

            <div className="flex justify-between px-2 pt-3 text-xs font-mono text-[#76777d]">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Bottom Historical Analogue Comparison Table */}
        <div className="bg-white border border-[#c6c6cd] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#c6c6cd] bg-[#fcf8fa] flex justify-between items-center">
            <h3 className="text-base font-bold text-[#1b1b1d]">
              Historical Analogue Incident Log
            </h3>
            <button className="p-1.5 hover:bg-[#e4e2e4] rounded text-[#45464d]">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f3f5] border-b border-[#c6c6cd] text-[#45464d] font-label-caps uppercase">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Peak Rainfall</th>
                  <th className="py-3 px-4">Soil Sat. Prior</th>
                  <th className="py-3 px-4">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e2e4] font-mono">
                {insight.historicalAnalogues?.map((row, idx) => {
                  const isCurrent = row.eventId === 'CURRENT';
                  return (
                    <tr
                      key={idx}
                      className={isCurrent ? 'bg-red-50/60 font-bold' : 'hover:bg-gray-50'}
                    >
                      <td className="py-3.5 px-4 text-[#1b1b1d]">{row.eventId}</td>
                      <td className="py-3.5 px-4 text-[#45464d] font-sans">{row.date}</td>
                      <td className={`py-3.5 px-4 ${isCurrent ? 'text-red-700 font-bold' : 'text-[#1b1b1d]'}`}>
                        {row.peakRainfall}
                      </td>
                      <td className={`py-3.5 px-4 ${isCurrent ? 'text-red-700 font-bold' : 'text-[#1b1b1d]'}`}>
                        {row.soilSatPrior}
                      </td>
                      <td className="py-3.5 px-4">
                        {row.outcomeType === 'stable' && (
                          <span className="bg-[#e4e2e4] text-[#1b1b1d] px-2.5 py-1 rounded font-sans text-[11px] font-semibold">
                            {row.outcome}
                          </span>
                        )}
                        {row.outcomeType === 'minor_slip' && (
                          <span className="bg-[#ffdad6] text-[#ba1a1a] px-2.5 py-1 rounded font-sans text-[11px] font-semibold">
                            {row.outcome}
                          </span>
                        )}
                        {row.outcomeType === 'pending' && (
                          <span className="bg-red-700 text-white px-2.5 py-1 rounded font-sans text-[11px] font-bold uppercase tracking-wider">
                            {row.outcome}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agency Footer */}
        <footer className="pt-6 border-t border-[#c6c6cd] flex flex-col md:flex-row items-center justify-between text-xs text-[#76777d] gap-4">
          <div className="font-semibold uppercase tracking-wider">
            © 2024 NATIONAL GEOLOGIC SAFETY AGENCY. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-black transition-colors">Contact Support</a>
            <span className="text-red-700 font-bold">Emergency Hotline: 1-800-GEO-RISK</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
