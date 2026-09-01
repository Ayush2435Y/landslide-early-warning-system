import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  Brush
} from 'recharts';
import {
  Activity,
  Radio,
  Clock,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  BellRing,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  ShieldAlert,
  AlertTriangle,
  Layers,
  ChevronDown,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Sparkles,
  Info,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Maximize2
} from 'lucide-react';
import { 
  SensorData, 
  CustomAlertRule, 
  TelemetryPoint, 
  TriggeredAlert, 
  MetricType 
} from '../types';
import { CustomAlertRuleModal } from './CustomAlertRuleModal';
import { playAlertChime } from '../utils/audioAlert';

interface RealTimeAnalyticsViewProps {
  sensors: SensorData[];
  onSelectSensor?: (sensor: SensorData) => void;
  onSimulateSpike: () => void;
  isSpikeActive: boolean;
  onTriggerAlertNotification?: (alert: TriggeredAlert) => void;
}

export const RealTimeAnalyticsView: React.FC<RealTimeAnalyticsViewProps> = ({
  sensors,
  onSelectSensor,
  onSimulateSpike,
  isSpikeActive,
  onTriggerAlertNotification,
}) => {
  // Streaming & Data States
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [telemetryData, setTelemetryData] = useState<TelemetryPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [streamIntervalMs, setStreamIntervalMs] = useState<number>(3000);
  const [lastFetchTime, setLastFetchTime] = useState<string>('Just now');
  const [streamStats, setStreamStats] = useState({ latency: 38, ptsReceived: 42 });

  // Filtering & View Configuration
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('porePressure');
  const [chartMode, setChartMode] = useState<'single' | 'correlation' | 'multisensor'>('single');
  const [secondaryMetric, setSecondaryMetric] = useState<MetricType>('rainfallRate');
  const [chartStyle, setChartStyle] = useState<'area' | 'line' | 'bar'>('area');
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState<boolean>(false);
  const [showThresholdLines, setShowThresholdLines] = useState<boolean>(true);

  // Inspection & Interaction
  const [inspectedPoint, setInspectedPoint] = useState<TelemetryPoint | null>(null);
  const [brushRange, setBrushRange] = useState<{ startIndex?: number; endIndex?: number }>({});

  // Custom Alert Rules
  const [customRules, setCustomRules] = useState<CustomAlertRule[]>([]);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<CustomAlertRule | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [activeBreachAlerts, setActiveBreachAlerts] = useState<TriggeredAlert[]>([]);

  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Metric metadata catalog
  const metricCatalog: Record<MetricType, { name: string; unit: string; color: string; threshold: number; stroke: string }> = {
    porePressure: { name: 'Pore Pressure (PZ-109)', unit: 'kPa', color: '#ba1a1a', threshold: 42.0, stroke: '#991b1b' },
    displacement: { name: 'Displacement (INC-44)', unit: 'mm', color: '#b45309', threshold: 2.2, stroke: '#d97706' },
    soilMoisture: { name: 'Soil Saturation (SM-02)', unit: '%', color: '#1e40af', threshold: 80.0, stroke: '#2563eb' },
    rainfallRate: { name: 'Precipitation Rate (RG-01)', unit: 'mm/h', color: '#0f766e', threshold: 35.0, stroke: '#0d9488' },
    seismic: { name: 'Micro-Seismic Vibration', unit: 'mm/s', color: '#6b21a8', threshold: 0.8, stroke: '#9333ea' },
    battery: { name: 'Node Battery Level', unit: '%', color: '#059669', threshold: 20.0, stroke: '#10b981' },
  };

  // 1. Initial Load of Custom Rules & Timeseries
  useEffect(() => {
    fetchCustomRules();
    fetchTimeseriesData(timeRange, selectedSector);
  }, [timeRange, selectedSector]);

  // 2. Real-time Auto-Update Stream Loop
  useEffect(() => {
    if (!isLiveStreaming) {
      if (fetchTimerRef.current) clearInterval(fetchTimerRef.current);
      return;
    }

    fetchTimerRef.current = setInterval(async () => {
      await pollLiveStream();
    }, streamIntervalMs);

    return () => {
      if (fetchTimerRef.current) clearInterval(fetchTimerRef.current);
    };
  }, [isLiveStreaming, streamIntervalMs, isSpikeActive, customRules, selectedMetric]);

  // Fetch full timeseries from backend
  const fetchTimeseriesData = async (range: string, sector: string) => {
    setIsLoading(true);
    const startT = performance.now();
    try {
      const res = await fetch(`/api/telemetry/timeseries?range=${range}&sector=${sector}`);
      const json = await res.json();
      if (json && json.data) {
        setTelemetryData(json.data);
        setStreamStats({
          latency: Math.round(performance.now() - startT),
          ptsReceived: json.data.length,
        });
        setLastFetchTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to fetch timeseries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll latest instantaneous telemetry & evaluate alert rules
  const pollLiveStream = async () => {
    const startT = performance.now();
    try {
      const res = await fetch('/api/telemetry/live');
      const liveSnapshot = await res.json();
      if (liveSnapshot && liveSnapshot.readings) {
        const pzVal = liveSnapshot.readings['PZ-109']?.value || 42.8;
        const incVal = liveSnapshot.readings['INC-44']?.value || 2.4;
        const smVal = liveSnapshot.readings['SM-02']?.value || 84.0;
        const rgVal = liveSnapshot.readings['RG-01']?.value || 45;
        const seisVal = liveSnapshot.readings['SEIS-01']?.value || 0.45;
        const pz104Val = liveSnapshot.readings['PZ-104']?.value || 29.1;
        const inc209Val = liveSnapshot.readings['INC-209']?.value || 0.8;

        const newPoint: TelemetryPoint = {
          epoch: liveSnapshot.epoch || Date.now(),
          timestamp: liveSnapshot.timestamp || new Date().toISOString(),
          timeLabel: liveSnapshot.timeLabel || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          porePressure: pzVal,
          displacement: incVal,
          soilMoisture: smVal,
          rainfallRate: rgVal,
          seismicVibration: seisVal,
          sectorAlphaRisk: Math.min(100, Math.round(40 + smVal * 0.35 + pzVal * 0.5)),
          pz109: pzVal,
          pz104: pz104Val,
          inc44: incVal,
          inc209: inc209Val,
          seis01: seisVal,
          sm02: smVal,
          rg01: rgVal,
          isAnomaly: (pzVal >= 42.0 || incVal >= 2.2 || rgVal >= 40.0),
        };

        // Append to rolling data window (keeping max 60 points)
        setTelemetryData((prev) => {
          const updated = [...prev.slice(1), newPoint];
          return updated;
        });

        setStreamStats({
          latency: Math.round(performance.now() - startT),
          ptsReceived: 1,
        });
        setLastFetchTime(newPoint.timeLabel);

        // Evaluate custom alert rules on incoming live snapshot
        evaluateCustomRules(liveSnapshot.readings);
      }
    } catch (err) {
      console.warn('Live stream poll warning:', err);
    }
  };

  // Fetch Custom Alert Rules
  const fetchCustomRules = async () => {
    try {
      const res = await fetch('/api/alerts/custom-rules');
      const json = await res.json();
      if (json && json.rules) {
        setCustomRules(json.rules);
      }
    } catch (err) {
      console.error('Failed to load custom rules:', err);
    }
  };

  // Evaluate Custom Rules against current readings
  const evaluateCustomRules = async (readings: any) => {
    try {
      const res = await fetch('/api/alerts/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentReadings: readings }),
      });
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      if (data && data.breaches && data.breaches.length > 0) {
        setActiveBreachAlerts(data.breaches);

        // Check if any breach has audioAlert enabled
        const hasAudio = data.breaches.some((b: any) => b.audioAlert);
        if (hasAudio && audioEnabled) {
          const worstSeverity = data.breaches.some((b: any) => b.severity === 'critical') ? 'critical' : 'warning';
          playAlertChime(worstSeverity);
        }

        // Notify parent if handler provided
        if (onTriggerAlertNotification && data.breaches[0]) {
          onTriggerAlertNotification(data.breaches[0]);
        }
      }
    } catch (err) {
      console.warn('Custom rules evaluation status:', err);
    }
  };

  // Save new or edited custom alert rule
  const handleSaveRule = async (ruleData: Partial<CustomAlertRule>) => {
    try {
      const res = await fetch('/api/alerts/custom-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });
      const json = await res.json();
      if (json && json.rules) {
        setCustomRules(json.rules);
        playAlertChime('success');
      }
    } catch (err) {
      console.error('Failed to save custom rule:', err);
    }
  };

  // Toggle enable/disable rule
  const handleToggleRule = async (rule: CustomAlertRule) => {
    const updated = { ...rule, enabled: !rule.enabled };
    await handleSaveRule(updated);
  };

  // Delete Rule
  const handleDeleteRule = async (ruleId: string) => {
    try {
      const res = await fetch(`/api/alerts/custom-rules/${ruleId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json && json.rules) {
        setCustomRules(json.rules);
      }
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  // Test Fire Alert Chime & Notification
  const handleTestAlertChime = (severity: 'critical' | 'warning' | 'info') => {
    playAlertChime(severity);
    const mockBreach: TriggeredAlert = {
      ruleId: `test-${Date.now()}`,
      ruleName: `Test Drill Alert (${severity.toUpperCase()})`,
      sensorId: 'PZ-109',
      sensorName: 'Piezometer Alpha 1',
      sector: 'Sector Alpha',
      metric: 'porePressure',
      currentValue: 43.6,
      thresholdValue: 42.0,
      operator: '>=',
      unit: 'kPa',
      severity,
      audioAlert: true,
      timestamp: new Date().toLocaleTimeString(),
      message: `TEST DRILL: Sensor PZ-109 threshold breached (${severity.toUpperCase()})`,
    };
    setActiveBreachAlerts([mockBreach, ...activeBreachAlerts.slice(0, 4)]);
  };

  // Dismiss a breach banner
  const handleDismissBreach = (idx: number) => {
    setActiveBreachAlerts((prev) => prev.filter((_, i) => i !== idx));
  };

  // Export current chart dataset as CSV
  const handleExportCSV = () => {
    if (!telemetryData.length) return;
    const headers = ['Timestamp', 'TimeLabel', 'PorePressure_kPa', 'Displacement_mm', 'SoilMoisture_pct', 'RainfallRate_mmh', 'MicroSeismic_mms', 'SectorAlphaRisk_pct'];
    const rows = telemetryData.map((d) => [
      d.timestamp,
      d.timeLabel,
      d.porePressure,
      d.displacement,
      d.soilMoisture,
      d.rainfallRate,
      d.seismicVibration,
      d.sectorAlphaRisk,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lithos_telemetry_${selectedMetric}_${timeRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Filtered dataset for rendering
  const displayData = useMemo(() => {
    if (showAnomaliesOnly) {
      return telemetryData.filter(d => d.isAnomaly);
    }
    return telemetryData;
  }, [telemetryData, showAnomaliesOnly]);

  // Current metric config
  const currentMetricMeta = metricCatalog[selectedMetric] || metricCatalog.porePressure;
  const secondaryMetricMeta = metricCatalog[secondaryMetric] || metricCatalog.rainfallRate;

  // Active custom rules for the currently selected metric to render as reference lines
  const metricRules = customRules.filter(r => r.enabled && r.metric === selectedMetric);

  return (
    <div className="flex-1 bg-[#fcf8fa] overflow-y-auto p-4 md:p-8 min-h-screen pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header & Real-Time Status Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#c6c6cd] pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-[#1b1b1d] tracking-tight">
                Real-Time Telemetry & Data Visualizer
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                isLiveStreaming 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isLiveStreaming ? 'bg-emerald-600 animate-ping' : 'bg-amber-600'}`} />
                {isLiveStreaming ? 'LIVE STREAMING' : 'STREAM PAUSED'}
              </span>
            </div>
            <p className="text-xs text-[#45464d] mt-1 flex items-center gap-3">
              <span>Auto-ingest: <strong>{streamIntervalMs / 1000}s</strong></span>
              <span>&bull;</span>
              <span>Buffer: <strong>{telemetryData.length} samples</strong></span>
              <span>&bull;</span>
              <span>Latency: <strong>{streamStats.latency}ms</strong></span>
              <span>&bull;</span>
              <span>Last packet: <strong>{lastFetchTime}</strong></span>
            </p>
          </div>

          {/* Real-time streaming controls & action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Stream toggle button */}
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`px-3 py-2 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors border ${
                isLiveStreaming
                  ? 'bg-white text-[#1b1b1d] border-[#c6c6cd] hover:bg-[#e4e2e4]'
                  : 'bg-[#131b2e] text-white border-[#131b2e] hover:bg-black'
              }`}
            >
              {isLiveStreaming ? <Pause className="w-3.5 h-3.5 text-amber-700" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isLiveStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
            </button>

            {/* Refresh / Fetch Now */}
            <button
              onClick={() => pollLiveStream()}
              className="p-2 bg-white hover:bg-[#e4e2e4] text-[#1b1b1d] border border-[#c6c6cd] rounded transition-colors"
              title="Fetch instantaneous snapshot from backend"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                const next = !audioEnabled;
                setAudioEnabled(next);
                if (next) playAlertChime('info');
              }}
              className={`p-2 rounded border transition-colors ${
                audioEnabled ? 'bg-white text-emerald-700 border-emerald-300' : 'bg-[#f0edef] text-[#76777d] border-[#c6c6cd]'
              }`}
              title={audioEnabled ? 'Alert chimes enabled' : 'Alert chimes muted'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Anomaly Simulation Spike Toggle */}
            <button
              onClick={onSimulateSpike}
              className={`px-3 py-2 rounded text-xs font-mono font-bold uppercase transition-colors border ${
                isSpikeActive
                  ? 'bg-red-700 text-white border-red-700 shadow-xs'
                  : 'bg-white text-[#1b1b1d] border-[#c6c6cd] hover:bg-[#e4e2e4]'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 inline mr-1.5 ${isSpikeActive ? 'animate-bounce' : ''}`} />
              <span>{isSpikeActive ? 'Anomaly Active' : 'Inject Anomaly'}</span>
            </button>

            {/* Configure Custom Alert Rules Modal */}
            <button
              onClick={() => {
                setEditingRule(null);
                setIsRuleModalOpen(true);
              }}
              className="px-3.5 py-2 bg-[#131b2e] hover:bg-black text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <BellRing className="w-3.5 h-3.5 text-[#d3e4fe]" />
              <span>Set Custom Alert</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="p-2 bg-white hover:bg-[#e4e2e4] text-[#1b1b1d] border border-[#c6c6cd] rounded transition-colors"
              title="Export Current Timeseries to CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Threshold Alert Breaches Banner Queue */}
        {activeBreachAlerts.length > 0 && (
          <div className="space-y-2">
            {activeBreachAlerts.slice(0, 3).map((breach, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
                  breach.severity === 'critical'
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : breach.severity === 'warning'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-blue-50 border-blue-300 text-blue-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shrink-0 ${
                    breach.severity === 'critical' ? 'bg-red-700 animate-pulse' : 'bg-amber-600'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wide">
                        {breach.severity.toUpperCase()} ALERT: {breach.ruleName}
                      </span>
                      <span className="font-mono text-[10px] bg-white/80 px-1.5 py-0.5 rounded border border-current">
                        {breach.timestamp}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 font-medium leading-tight">
                      {breach.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedMetric(breach.metric as MetricType);
                      handleDismissBreach(idx);
                    }}
                    className="px-2.5 py-1 text-xs bg-white border border-current rounded font-semibold hover:bg-black/5"
                  >
                    View Chart
                  </button>
                  <button
                    onClick={() => handleDismissBreach(idx)}
                    className="px-2 py-1 text-xs text-[#76777d] hover:text-black"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Instantaneous Sensor Telemetry Cards Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'PZ-109', name: 'Piezometer Alpha', metric: 'porePressure', val: telemetryData[telemetryData.length - 1]?.porePressure ?? 42.8, unit: 'kPa', threshold: 40.0 },
            { id: 'INC-44', name: 'Inclinometer RT-9', metric: 'displacement', val: telemetryData[telemetryData.length - 1]?.displacement ?? 2.4, unit: 'mm', threshold: 1.5 },
            { id: 'SM-02', name: 'Soil Saturation', metric: 'soilMoisture', val: telemetryData[telemetryData.length - 1]?.soilMoisture ?? 84.0, unit: '%', threshold: 75.0 },
            { id: 'RG-01', name: 'Precipitation Rate', metric: 'rainfallRate', val: telemetryData[telemetryData.length - 1]?.rainfallRate ?? 45, unit: 'mm/h', threshold: 35.0 },
            { id: 'SEIS-01', name: 'Micro-Seismic', metric: 'seismic', val: telemetryData[telemetryData.length - 1]?.seismicVibration ?? 0.45, unit: 'mm/s', threshold: 0.8 },
            { id: 'RISK-01', name: 'Failure Probability', metric: 'sectorAlphaRisk', val: telemetryData[telemetryData.length - 1]?.sectorAlphaRisk ?? 72, unit: '%', threshold: 65.0 },
          ].map((item) => {
            const isBreached = item.val >= item.threshold;
            const isSelected = selectedMetric === item.metric;
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.metric in metricCatalog) {
                    setSelectedMetric(item.metric as MetricType);
                  }
                }}
                className={`bg-white border rounded-xl p-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-black ring-2 ring-black/10 shadow-md'
                    : isBreached
                    ? 'border-red-400 bg-red-50/20 hover:border-red-600'
                    : 'border-[#c6c6cd] hover:border-[#45464d]'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-[11px] font-bold text-[#45464d]">{item.id}</span>
                  <span className={`w-2 h-2 rounded-full ${isBreached ? 'bg-red-600 animate-ping' : 'bg-emerald-500'}`} />
                </div>
                <div className="font-mono text-lg font-black text-[#1b1b1d]">
                  {item.val} <span className="text-[10px] font-normal text-[#76777d]">{item.unit}</span>
                </div>
                <div className="text-[10px] text-[#76777d] truncate font-medium mt-0.5">{item.name}</div>
                <div className="mt-2 text-[9px] font-mono text-[#76777d] flex justify-between border-t border-[#e4e2e4] pt-1">
                  <span>Limit: {item.threshold}{item.unit}</span>
                  <span className={isBreached ? 'text-red-700 font-bold' : 'text-emerald-700'}>
                    {isBreached ? 'CRITICAL' : 'NOMINAL'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Filter & Zoom Toolbar */}
        <div className="bg-white border border-[#c6c6cd] rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Metric Mode & Primary Metric Dropdown */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#45464d]">Metric:</span>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
                  className="bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg px-3 py-1.5 text-xs font-bold text-[#1b1b1d] focus:outline-none focus:border-black"
                >
                  <option value="porePressure">Pore Water Pressure (kPa)</option>
                  <option value="displacement">Inclinometer Displacement (mm)</option>
                  <option value="soilMoisture">Soil Moisture / Saturation (%)</option>
                  <option value="rainfallRate">Precipitation Rate (mm/h)</option>
                  <option value="seismic">Micro-Seismic Vibration (mm/s)</option>
                </select>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-[#f0edef] p-1 rounded-lg border border-[#c6c6cd]">
                <button
                  onClick={() => setChartMode('single')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    chartMode === 'single' ? 'bg-white text-[#1b1b1d] shadow-xs' : 'text-[#45464d] hover:text-black'
                  }`}
                >
                  Single Series
                </button>
                <button
                  onClick={() => setChartMode('correlation')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    chartMode === 'correlation' ? 'bg-white text-[#1b1b1d] shadow-xs' : 'text-[#45464d] hover:text-black'
                  }`}
                >
                  Dual Correlation
                </button>
                <button
                  onClick={() => setChartMode('multisensor')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    chartMode === 'multisensor' ? 'bg-white text-[#1b1b1d] shadow-xs' : 'text-[#45464d] hover:text-black'
                  }`}
                >
                  Sensor Breakdown
                </button>
              </div>

              {/* Secondary Metric (If Correlation Mode) */}
              {chartMode === 'correlation' && (
                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#45464d]">Compare With:</span>
                  <select
                    value={secondaryMetric}
                    onChange={(e) => setSecondaryMetric(e.target.value as MetricType)}
                    className="bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg px-3 py-1.5 text-xs font-bold text-[#1b1b1d] focus:outline-none"
                  >
                    <option value="rainfallRate">Rainfall Rate (mm/h)</option>
                    <option value="soilMoisture">Soil Saturation (%)</option>
                    <option value="displacement">Displacement (mm)</option>
                    <option value="porePressure">Pore Pressure (kPa)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Time Range Quick Zoom Buttons */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-[#45464d] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Time Range:</span>
              </span>
              <div className="flex bg-[#f0edef] p-1 rounded-lg border border-[#c6c6cd]">
                {['15m', '1h', '6h', '24h', '7d'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                      timeRange === r
                        ? 'bg-[#131b2e] text-white shadow-xs'
                        : 'text-[#45464d] hover:text-[#1b1b1d]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Reset Zoom Brush */}
              <button
                onClick={() => setBrushRange({})}
                className="p-1.5 bg-white hover:bg-[#e4e2e4] text-[#45464d] border border-[#c6c6cd] rounded text-xs"
                title="Reset zoom brush slider"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Secondary Sub-filters: Sector & Visual Style */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e4e2e4] text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#45464d]">Sector Filter:</span>
              <div className="flex gap-1">
                {[
                  { id: 'all', label: 'All Sectors' },
                  { id: 'alpha', label: 'Sector Alpha' },
                  { id: 'rt9', label: 'Sector 4 (RT-9)' },
                  { id: 'beta', label: 'Sector Beta' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSector(s.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedSector === s.id
                        ? 'bg-[#131b2e] text-white font-bold'
                        : 'bg-[#f6f3f5] text-[#45464d] hover:bg-[#e4e2e4]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle Threshold Reference Lines */}
              <label className="flex items-center gap-1.5 cursor-pointer text-[#45464d]">
                <input
                  type="checkbox"
                  checked={showThresholdLines}
                  onChange={(e) => setShowThresholdLines(e.target.checked)}
                  className="rounded text-red-600 w-3.5 h-3.5"
                />
                <span>Show Threshold Reference Lines</span>
              </label>

              {/* Chart Style Switcher */}
              <div className="flex bg-[#f6f3f5] p-0.5 rounded border border-[#c6c6cd]">
                {(['area', 'line', 'bar'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setChartStyle(style)}
                    className={`px-2 py-0.5 text-[11px] font-semibold uppercase rounded capitalize transition-colors ${
                      chartStyle === style ? 'bg-white text-black font-bold shadow-xs' : 'text-[#76777d]'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Interactive Chart Canvas */}
        <div className="bg-white border border-[#c6c6cd] rounded-xl p-5 shadow-xs relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-[#1b1b1d] flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-700" />
                <span>
                  {chartMode === 'single'
                    ? currentMetricMeta.name
                    : chartMode === 'correlation'
                    ? `${currentMetricMeta.name} vs. ${secondaryMetricMeta.name}`
                    : `Multi-Sensor Node Comparison (${currentMetricMeta.unit})`}
                </span>
              </h2>
              <p className="text-xs text-[#76777d]">
                Drag the interactive timeline brush at the bottom to zoom into specific time ranges &bull; Click data point to inspect
              </p>
            </div>

            {/* Threshold Legend pill */}
            {showThresholdLines && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="flex items-center gap-1 text-red-700">
                  <span className="w-3 h-0.5 bg-red-600 inline-block border-t border-dashed" />
                  <span>Critical Threshold ({currentMetricMeta.threshold} {currentMetricMeta.unit})</span>
                </span>
              </div>
            )}
          </div>

          {/* Recharts Responsive Container */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'correlation' ? (
                <ComposedChart
                  data={displayData}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      setInspectedPoint(e.activePayload[0].payload as TelemetryPoint);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e4" vertical={false} />
                  <XAxis
                    dataKey="timeLabel"
                    tick={{ fill: '#76777d', fontSize: 11, fontFamily: 'monospace' }}
                    stroke="#c6c6cd"
                  />
                  {/* Left YAxis for Primary Metric */}
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    stroke={currentMetricMeta.color}
                    tick={{ fill: '#45464d', fontSize: 11, fontFamily: 'monospace' }}
                    unit={` ${currentMetricMeta.unit}`}
                  />
                  {/* Right YAxis for Secondary Metric */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke={secondaryMetricMeta.color}
                    tick={{ fill: '#45464d', fontSize: 11, fontFamily: 'monospace' }}
                    unit={` ${secondaryMetricMeta.unit}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

                  {/* Primary Area / Line */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey={selectedMetric}
                    name={`${currentMetricMeta.name} (${currentMetricMeta.unit})`}
                    fill={`${currentMetricMeta.color}15`}
                    stroke={currentMetricMeta.stroke}
                    strokeWidth={2.5}
                  />

                  {/* Secondary Line */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey={secondaryMetric}
                    name={`${secondaryMetricMeta.name} (${secondaryMetricMeta.unit})`}
                    stroke={secondaryMetricMeta.stroke}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2 }}
                  />

                  {/* Threshold Line */}
                  {showThresholdLines && (
                    <ReferenceLine
                      yAxisId="left"
                      y={currentMetricMeta.threshold}
                      label={{ value: `Limit: ${currentMetricMeta.threshold}${currentMetricMeta.unit}`, fill: '#dc2626', fontSize: 10, position: 'top' }}
                      stroke="#dc2626"
                      strokeDasharray="4 4"
                    />
                  )}

                  {/* Interactive Range Zoom Brush */}
                  <Brush
                    dataKey="timeLabel"
                    height={28}
                    stroke="#131b2e"
                    fill="#f6f3f5"
                    startIndex={brushRange.startIndex}
                    endIndex={brushRange.endIndex}
                    onChange={(range) => setBrushRange(range)}
                  />
                </ComposedChart>
              ) : chartMode === 'multisensor' ? (
                <LineChart
                  data={displayData}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      setInspectedPoint(e.activePayload[0].payload as TelemetryPoint);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e4" vertical={false} />
                  <XAxis
                    dataKey="timeLabel"
                    tick={{ fill: '#76777d', fontSize: 11, fontFamily: 'monospace' }}
                    stroke="#c6c6cd"
                  />
                  <YAxis
                    stroke="#45464d"
                    tick={{ fill: '#45464d', fontSize: 11, fontFamily: 'monospace' }}
                    unit={` ${currentMetricMeta.unit}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

                  {selectedMetric === 'porePressure' ? (
                    <>
                      <Line type="monotone" dataKey="pz109" name="PZ-109 (Alpha Scarp)" stroke="#ba1a1a" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="pz104" name="PZ-104 (North Bedrock)" stroke="#0284c7" strokeWidth={2} dot={false} />
                    </>
                  ) : selectedMetric === 'displacement' ? (
                    <>
                      <Line type="monotone" dataKey="inc44" name="INC-44 (RT-9 Highway Slope)" stroke="#ba1a1a" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="inc209" name="INC-209 (Lower Escarpment)" stroke="#059669" strokeWidth={2} dot={false} />
                    </>
                  ) : (
                    <Line type="monotone" dataKey={selectedMetric} name={currentMetricMeta.name} stroke={currentMetricMeta.stroke} strokeWidth={2.5} />
                  )}

                  {/* Dynamic Custom Alert Rule Reference Lines */}
                  {showThresholdLines && metricRules.map((rule) => (
                    <ReferenceLine
                      key={rule.id}
                      y={rule.thresholdValue}
                      label={{ value: `${rule.name}: ${rule.thresholdValue}${rule.unit}`, fill: '#dc2626', fontSize: 10 }}
                      stroke={rule.severity === 'critical' ? '#dc2626' : '#d97706'}
                      strokeDasharray="4 4"
                    />
                  ))}

                  <Brush
                    dataKey="timeLabel"
                    height={28}
                    stroke="#131b2e"
                    fill="#f6f3f5"
                    startIndex={brushRange.startIndex}
                    endIndex={brushRange.endIndex}
                    onChange={(range) => setBrushRange(range)}
                  />
                </LineChart>
              ) : chartStyle === 'bar' ? (
                <BarChart
                  data={displayData}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      setInspectedPoint(e.activePayload[0].payload as TelemetryPoint);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e4" vertical={false} />
                  <XAxis
                    dataKey="timeLabel"
                    tick={{ fill: '#76777d', fontSize: 11, fontFamily: 'monospace' }}
                    stroke="#c6c6cd"
                  />
                  <YAxis
                    stroke="#45464d"
                    tick={{ fill: '#45464d', fontSize: 11, fontFamily: 'monospace' }}
                    unit={` ${currentMetricMeta.unit}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey={selectedMetric}
                    name={`${currentMetricMeta.name} (${currentMetricMeta.unit})`}
                    fill={currentMetricMeta.color}
                    radius={[4, 4, 0, 0]}
                  />
                  <Brush
                    dataKey="timeLabel"
                    height={28}
                    stroke="#131b2e"
                    fill="#f6f3f5"
                    startIndex={brushRange.startIndex}
                    endIndex={brushRange.endIndex}
                    onChange={(range) => setBrushRange(range)}
                  />
                </BarChart>
              ) : chartStyle === 'line' ? (
                <LineChart
                  data={displayData}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      setInspectedPoint(e.activePayload[0].payload as TelemetryPoint);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e4" vertical={false} />
                  <XAxis
                    dataKey="timeLabel"
                    tick={{ fill: '#76777d', fontSize: 11, fontFamily: 'monospace' }}
                    stroke="#c6c6cd"
                  />
                  <YAxis
                    stroke="#45464d"
                    tick={{ fill: '#45464d', fontSize: 11, fontFamily: 'monospace' }}
                    unit={` ${currentMetricMeta.unit}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    name={`${currentMetricMeta.name} (${currentMetricMeta.unit})`}
                    stroke={currentMetricMeta.stroke}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: currentMetricMeta.stroke }}
                    activeDot={{ r: 6 }}
                  />

                  {showThresholdLines && (
                    <ReferenceLine
                      y={currentMetricMeta.threshold}
                      label={{ value: `Critical Threshold: ${currentMetricMeta.threshold}${currentMetricMeta.unit}`, fill: '#dc2626', fontSize: 10 }}
                      stroke="#dc2626"
                      strokeDasharray="4 4"
                    />
                  )}

                  <Brush
                    dataKey="timeLabel"
                    height={28}
                    stroke="#131b2e"
                    fill="#f6f3f5"
                    startIndex={brushRange.startIndex}
                    endIndex={brushRange.endIndex}
                    onChange={(range) => setBrushRange(range)}
                  />
                </LineChart>
              ) : (
                <AreaChart
                  data={displayData}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      setInspectedPoint(e.activePayload[0].payload as TelemetryPoint);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentMetricMeta.color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={currentMetricMeta.color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e4" vertical={false} />
                  <XAxis
                    dataKey="timeLabel"
                    tick={{ fill: '#76777d', fontSize: 11, fontFamily: 'monospace' }}
                    stroke="#c6c6cd"
                  />
                  <YAxis
                    stroke="#45464d"
                    tick={{ fill: '#45464d', fontSize: 11, fontFamily: 'monospace' }}
                    unit={` ${currentMetricMeta.unit}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    name={`${currentMetricMeta.name} (${currentMetricMeta.unit})`}
                    stroke={currentMetricMeta.stroke}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#metricGradient)"
                  />

                  {showThresholdLines && (
                    <ReferenceLine
                      y={currentMetricMeta.threshold}
                      label={{ value: `Critical Threshold: ${currentMetricMeta.threshold}${currentMetricMeta.unit}`, fill: '#dc2626', fontSize: 10 }}
                      stroke="#dc2626"
                      strokeDasharray="4 4"
                    />
                  )}

                  <Brush
                    dataKey="timeLabel"
                    height={28}
                    stroke="#131b2e"
                    fill="#f6f3f5"
                    startIndex={brushRange.startIndex}
                    endIndex={brushRange.endIndex}
                    onChange={(range) => setBrushRange(range)}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Inspected Point Telemetry Detail Drawer / Overlay */}
          {inspectedPoint && (
            <div className="mt-4 p-3.5 bg-[#f6f3f5] border border-[#c6c6cd] rounded-xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#131b2e] text-white flex items-center justify-center font-mono font-bold text-xs">
                  LOG
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#1b1b1d]">Data Point Sampled</span>
                    <span className="font-mono text-[11px] text-[#76777d]">{inspectedPoint.timeLabel} ({new Date(inspectedPoint.timestamp).toLocaleTimeString()})</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-mono text-[#1b1b1d] mt-0.5">
                    <span>Pore Pressure: <strong>{inspectedPoint.porePressure} kPa</strong></span>
                    <span>Displacement: <strong>{inspectedPoint.displacement} mm</strong></span>
                    <span>Soil Moisture: <strong>{inspectedPoint.soilMoisture}%</strong></span>
                    <span>Rainfall: <strong>{inspectedPoint.rainfallRate} mm/h</strong></span>
                    <span>Seismic: <strong>{inspectedPoint.seismicVibration} mm/s</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInspectedPoint(null)}
                className="px-3 py-1 bg-white border border-[#c6c6cd] rounded text-xs font-semibold hover:bg-[#e4e2e4]"
              >
                Close Sample
              </button>
            </div>
          )}
        </div>

        {/* Bottom Section: Custom Alert Rules Management & Interactive Rule Studio */}
        <div className="bg-white border border-[#c6c6cd] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#c6c6cd] bg-[#fcf8fa] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-[#1b1b1d] flex items-center gap-2">
                <BellRing className="w-4 h-4 text-red-700" />
                <span>Custom Alert Conditions & Threshold Triggers</span>
              </h3>
              <p className="text-xs text-[#76777d]">
                Define automatic acoustic and visual dispatch alerts when telemetry exceeds safety parameters
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTestAlertChime('warning')}
                className="px-3 py-1.5 bg-white border border-[#c6c6cd] hover:bg-[#e4e2e4] text-[#1b1b1d] rounded text-xs font-semibold flex items-center gap-1.5"
                title="Test acoustic siren & in-app dispatch alert"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Test Alert Tone</span>
              </button>

              <button
                onClick={() => {
                  setEditingRule(null);
                  setIsRuleModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-[#131b2e] hover:bg-black text-white rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#d3e4fe]" />
                <span>Create Rule</span>
              </button>
            </div>
          </div>

          {/* Rules Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f3f5] border-b border-[#c6c6cd] text-[#45464d] font-label-caps uppercase">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Rule Name</th>
                  <th className="py-3 px-4">Sensor / Scope</th>
                  <th className="py-3 px-4">Condition Threshold</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Audio Chime</th>
                  <th className="py-3 px-4">Triggers</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e2e4] font-mono">
                {customRules.map((rule) => {
                  const isCrit = rule.severity === 'critical';
                  const isWarn = rule.severity === 'warning';
                  return (
                    <tr key={rule.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleRule(rule)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            rule.enabled
                              ? 'bg-[#131b2e] border-[#131b2e] text-white'
                              : 'bg-white border-[#c6c6cd]'
                          }`}
                        >
                          {rule.enabled && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-[#1b1b1d]">
                        {rule.name}
                        {rule.createdBy && (
                          <span className="block text-[10px] font-normal text-[#76777d]">
                            by {rule.createdBy}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#45464d]">
                        {rule.sensorId === 'all' ? 'All Applicable Nodes' : rule.sensorId}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1b1b1d]">
                        {rule.metric} {rule.operator} {rule.thresholdValue} {rule.unit}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-sans text-[10px] font-bold uppercase ${
                          isCrit ? 'bg-red-100 text-red-800' : isWarn ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {rule.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {rule.audioAlert ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-sans text-[11px]">
                            <Volume2 className="w-3.5 h-3.5" /> Chime ON
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[#76777d] font-sans text-[11px]">
                            <VolumeX className="w-3.5 h-3.5" /> Muted
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#76777d]">
                        {rule.triggerCount} breaches
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingRule(rule);
                              setIsRuleModalOpen(true);
                            }}
                            className="p-1 hover:bg-[#e4e2e4] rounded text-[#45464d]"
                            title="Edit rule"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1 hover:bg-red-100 text-red-600 rounded"
                            title="Delete rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Custom Alert Rule Configuration Modal */}
      <CustomAlertRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSaveRule={handleSaveRule}
        existingRule={editingRule}
        sensors={sensors}
      />
    </div>
  );
};

// Custom Chart Tooltip for Geotechnical Analysis
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#131b2e] text-white p-3 rounded-lg shadow-xl border border-white/20 text-xs font-mono space-y-1 z-50">
        <div className="font-sans font-bold text-white border-b border-white/20 pb-1 flex items-center justify-between gap-4">
          <span>{label}</span>
          <span className="text-[10px] text-[#d3e4fe]">Sample Point</span>
        </div>
        {payload.map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-center gap-4">
            <span className="flex items-center gap-1.5" style={{ color: item.color || '#d3e4fe' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color || '#d3e4fe' }} />
              <span>{item.name}:</span>
            </span>
            <span className="font-bold text-white">
              {item.value} {item.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}
