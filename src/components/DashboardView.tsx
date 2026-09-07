import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  AlertTriangle, 
  Brain, 
  Download, 
  CloudRain, 
  Droplets, 
  MoveUpRight, 
  Maximize2, 
  Plus, 
  Minus, 
  Crosshair, 
  ChevronDown,
  Sparkles,
  Layers,
  MapPin,
  TrendingUp,
  Activity,
  Gauge,
  Search,
  Filter,
  X,
  ShieldAlert,
  Battery
} from 'lucide-react';
import { AlertItem, SensorData, IncidentReport } from '../types';
import { DashboardRiskMap, NER_MAP_STATIONS } from './DashboardRiskMap';

interface DashboardViewProps {
  sensors: SensorData[];
  alerts: AlertItem[];
  reports: IncidentReport[];
  activeLayer?: string;
  onSelectLayer?: (layer: string) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
  onSelectSensor?: (sensor: SensorData) => void;
  onSelectReport?: (report: IncidentReport) => void;
  onNavigateToMetrics?: () => void;
  onNavigateToTelemetry?: () => void;
  onExportReport?: () => void;
  onViewAllAlerts?: () => void;
  onNavigateToMap?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sensors,
  alerts,
  reports,
  onSelectSensor,
  onSelectReport,
  onNavigateToMetrics,
  onNavigateToTelemetry,
  onExportReport,
  onViewAllAlerts,
  onNavigateToMap,
}) => {
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'critical' | 'warning' | 'watch' | 'safe'>('all');

  // Dynamically derived live geotechnical metrics
  const activeStationsCount = sensors.filter(s => s.status !== 'offline').length || 12;
  const activeAlertsCount = alerts.filter(a => !a.acknowledged).length;
  const criticalSensorsCount = sensors.filter(s => s.status === 'critical').length;
  const criticalReportsCount = reports.filter(r => r.severity === 'critical' && r.status !== 'dismissed').length;
  const highRiskLocationsCount = Math.max(criticalSensorsCount + criticalReportsCount, 1);

  const currentPore = sensors.find(s => s.type === 'piezometer')?.value ?? 52.6;
  const currentDisp = sensors.find(s => s.type === 'inclinometer')?.value ?? 2.5;
  const currentRain = sensors.find(s => s.type === 'rain_gauge')?.value ?? 72.4;

  // Group sensors by geographic Area and strictly order by risk level from highest to lowest
  const monitoredAreas = useMemo(() => {
    const areaMap = new Map<string, SensorData[]>();
    
    sensors.forEach((sensor) => {
      const areaKey = sensor.area || sensor.sector || 'Regional Monitored Area';
      const list = areaMap.get(areaKey) || [];
      list.push(sensor);
      areaMap.set(areaKey, list);
    });

    const items: {
      areaName: string;
      state: string;
      sector: string;
      hazardType?: string;
      sensors: SensorData[];
      primarySensor: SensorData;
      riskTier: number; // 3 = Critical, 2 = Warning, 1 = Watch, 0 = Safe
      riskLevel: 'Critical' | 'Warning' | 'Watch' | 'Safe';
      riskScore: number;
      porePressure?: number;
      displacement?: number;
      rainfallRate?: number;
      rainfallMm?: number;
      soilMoisture?: number;
      lastUpdated: string;
    }[] = [];

    areaMap.forEach((areaSensors, areaName) => {
      let maxRiskTier = 0;
      let maxRiskScore = 0;
      let primarySensor = areaSensors[0];

      areaSensors.forEach((s) => {
        let tier = 0;
        if (typeof s.riskTier === 'number') {
          tier = s.riskTier;
        } else if (s.riskLevel === 'critical' || s.status === 'critical') {
          tier = 3;
        } else if (s.riskLevel === 'high' || s.status === 'warning') {
          tier = 2;
        } else if (s.riskLevel === 'moderate') {
          tier = 1;
        }
        const score = s.riskChance ?? (tier === 3 ? 90 : tier === 2 ? 70 : tier === 1 ? 40 : 15);
        if (tier > maxRiskTier || (tier === maxRiskTier && score > maxRiskScore)) {
          maxRiskTier = tier;
          maxRiskScore = score;
          primarySensor = s;
        }
      });

      const riskLevel: 'Critical' | 'Warning' | 'Watch' | 'Safe' = 
        maxRiskTier === 3 ? 'Critical' :
        maxRiskTier === 2 ? 'Warning' :
        maxRiskTier === 1 ? 'Watch' : 'Safe';

      // Derived telemetry values from area sensors
      const porePressure = areaSensors.find(s => s.porePressure !== undefined)?.porePressure 
        ?? areaSensors.find(s => s.type === 'piezometer')?.value;
      
      const displacement = areaSensors.find(s => s.displacement !== undefined)?.displacement 
        ?? areaSensors.find(s => s.type === 'inclinometer')?.value;

      const rainfallRate = areaSensors.find(s => s.rainfallRate !== undefined)?.rainfallRate 
        ?? areaSensors.find(s => s.type === 'rain_gauge')?.value;

      const rainfallMm = areaSensors.find(s => s.rainfallMm !== undefined)?.rainfallMm;

      const soilMoisture = areaSensors.find(s => s.soilMoisture !== undefined)?.soilMoisture 
        ?? areaSensors.find(s => s.type === 'moisture')?.value;

      items.push({
        areaName,
        state: primarySensor.state || 'NER India',
        sector: primarySensor.sector || areaName,
        hazardType: primarySensor.hazardType,
        sensors: areaSensors,
        primarySensor,
        riskTier: maxRiskTier,
        riskLevel,
        riskScore: maxRiskScore,
        porePressure,
        displacement,
        rainfallRate,
        rainfallMm,
        soilMoisture,
        lastUpdated: primarySensor.lastUpdated || 'Live • Just now',
      });
    });

    // ORDER AREAS STRICTLY BY RISK LEVEL FROM HIGHEST TO LOWEST (3: Critical -> 2: Warning -> 1: Watch -> 0: Safe)
    items.sort((a, b) => {
      if (b.riskTier !== a.riskTier) {
        return b.riskTier - a.riskTier;
      }
      return b.riskScore - a.riskScore;
    });

    return items;
  }, [sensors]);

  // Risk Distribution Counts
  const riskCounts = useMemo(() => {
    return {
      critical: monitoredAreas.filter(a => a.riskTier === 3).length,
      warning: monitoredAreas.filter(a => a.riskTier === 2).length,
      watch: monitoredAreas.filter(a => a.riskTier === 1).length,
      safe: monitoredAreas.filter(a => a.riskTier === 0).length,
    };
  }, [monitoredAreas]);

  // Filtered list based on risk tier tabs and search query
  const filteredMonitoredAreas = useMemo(() => {
    return monitoredAreas.filter(item => {
      if (selectedRiskFilter !== 'all') {
        if (selectedRiskFilter === 'critical' && item.riskTier !== 3) return false;
        if (selectedRiskFilter === 'warning' && item.riskTier !== 2) return false;
        if (selectedRiskFilter === 'watch' && item.riskTier !== 1) return false;
        if (selectedRiskFilter === 'safe' && item.riskTier !== 0) return false;
      }
      if (areaSearchQuery.trim()) {
        const query = areaSearchQuery.toLowerCase();
        const matchName = item.areaName.toLowerCase().includes(query);
        const matchState = item.state.toLowerCase().includes(query);
        const matchSector = item.sector.toLowerCase().includes(query);
        const matchSensor = item.primarySensor.name.toLowerCase().includes(query);
        return matchName || matchState || matchSector || matchSensor;
      }
      return true;
    });
  }, [monitoredAreas, selectedRiskFilter, areaSearchQuery]);

  // Helper for sensor type display
  const getSensorTypeMeta = (type: string) => {
    switch (type) {
      case 'piezometer':
        return { label: 'Piezometer Array', icon: Droplets, color: 'text-blue-600 bg-blue-50' };
      case 'inclinometer':
        return { label: 'Subsurface Inclinometer', icon: MoveUpRight, color: 'text-purple-600 bg-purple-50' };
      case 'seismometer':
        return { label: 'Seismic Station', icon: Activity, color: 'text-rose-600 bg-rose-50' };
      case 'rain_gauge':
        return { label: 'Optical Rain Gauge', icon: CloudRain, color: 'text-cyan-600 bg-cyan-50' };
      case 'moisture':
        return { label: 'Soil Saturation Probe', icon: Droplets, color: 'text-emerald-600 bg-emerald-50' };
      case 'esp32_node':
        return { label: 'Edge Telemetry Node', icon: Radio, color: 'text-amber-600 bg-amber-50' };
      default:
        return { label: 'Geotechnical Sensor', icon: Gauge, color: 'text-slate-600 bg-slate-100' };
    }
  };

  // Sparkline renderer for mini live trend
  const renderSparkline = (data: number[], strokeColor: string) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 68;
    const height = 22;
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const handleExport = () => {
    if (onExportReport) {
      onExportReport();
    } else {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
        JSON.stringify({
          generatedAt: new Date().toISOString(),
          systemMetrics: {
            monitoringStations: 12,
            currentAlerts: 2,
            highRiskLocations: 3,
            systemAccuracy: '92.4%',
          },
          liveTelemetry: {
            rainfall: { current: '72.4 mm/hr', total24h: '136.8 mm', total3d: '278.4 mm' },
            porePressure: { current: '52.6 kPa', rate: '+2.3 kPa/hr' },
            displacement: { current: '6.8 mm', velocity: '1.2 mm/hr' }
          },
          aiRiskAssessment: {
            overallLevel: 'CRITICAL',
            riskScore: 0.87,
            confidence: '92.3%',
            factors: { rainfall: 0.28, porePressure: 0.26, displacement: 0.22, terrain: 0.08, other: 0.03 }
          },
          mapStations: NER_MAP_STATIONS,
        }, null, 2)
      );
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `landslide_early_warning_report_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  return (
    <div className="flex-1 bg-[#edf2f7] p-4 md:p-6 overflow-y-auto space-y-5">
      {/* ========================================================================= */}
      {/* TOP ROW: 4 STAT CARDS + EXPORT REPORT BUTTON                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* 4 Key Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
          {/* Card 1: Monitoring Stations */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Monitoring Stations</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">{activeStationsCount}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-slate-500">Active Stations</span>
                </div>
              </div>
            </div>
            {/* Mini Green Sparkline */}
            <div className="w-16 h-8 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 24">
                <path
                  d="M0 18 Q 15 20, 25 10 T 45 14 T 60 4"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 2: Current Alerts */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-amber-100/70 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Current Alerts</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">{activeAlertsCount}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-slate-500">Warning</span>
                </div>
              </div>
            </div>
            {/* Mini Orange Sparkline */}
            <div className="w-16 h-8 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 24">
                <path
                  d="M0 16 Q 15 12, 30 18 T 50 8 T 60 6"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 3: High Risk Locations */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-rose-100/70 text-rose-500 flex items-center justify-center shrink-0">
                <div className="relative">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">High Risk Locations</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">{highRiskLocationsCount}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-slate-500">Critical</span>
                </div>
              </div>
            </div>
            {/* Mini Red Sparkline */}
            <div className="w-16 h-8 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 24">
                <path
                  d="M0 20 Q 20 18, 35 12 T 50 16 T 60 2"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 4: System Accuracy */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-blue-100/70 text-blue-500 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">System Accuracy</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">92.4%</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-slate-500">AI Model</span>
                </div>
              </div>
            </div>
            {/* Mini Blue Sparkline */}
            <div className="w-16 h-8 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 24">
                <path
                  d="M0 16 Q 15 20, 30 10 T 50 14 T 60 6"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Top Right Action: Export Report Button */}
        <div className="shrink-0 flex items-center">
          <button
            onClick={handleExport}
            className="w-full sm:w-auto bg-[#00b894] hover:bg-[#00a383] text-white font-semibold px-4 py-2.5 rounded-lg text-xs md:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: LIVE MONITORING METRICS (LEFT) & RISK MAP (RIGHT)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Live Monitoring Card (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-[540px]">
          {/* Card Header (Dark Navy Heading #0a1128) */}
          <div className="bg-[#0a1128] text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white tracking-wide">Live Regional Area Monitoring</h2>
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                Highest → Lowest Risk
              </span>
              {onNavigateToTelemetry && (
                <button
                  onClick={onNavigateToTelemetry}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold ml-1 hover:underline cursor-pointer"
                  title="Open full Live Regional Area Monitoring view"
                >
                  <span>View All Areas</span>
                  <MoveUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Telemetry</span>
            </div>
          </div>

          {/* Quick Risk Filter & Search Bar on White Theme */}
          <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
            {/* Risk Tier Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <button
                onClick={() => setSelectedRiskFilter('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                  selectedRiskFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                All ({monitoredAreas.length})
              </button>
              <button
                onClick={() => setSelectedRiskFilter('critical')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                  selectedRiskFilter === 'critical'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-red-700 bg-red-50/80 border border-red-200/80 hover:bg-red-100/80'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Critical ({riskCounts.critical})
              </button>
              <button
                onClick={() => setSelectedRiskFilter('warning')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                  selectedRiskFilter === 'warning'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-orange-700 bg-orange-50/80 border border-orange-200/80 hover:bg-orange-100/80'
                }`}
              >
                Warning ({riskCounts.warning})
              </button>
              <button
                onClick={() => setSelectedRiskFilter('watch')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                  selectedRiskFilter === 'watch'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-800 bg-amber-50/80 border border-amber-200/80 hover:bg-amber-100/80'
                }`}
              >
                Watch ({riskCounts.watch})
              </button>
              <button
                onClick={() => setSelectedRiskFilter('safe')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                  selectedRiskFilter === 'safe'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 hover:bg-emerald-100/80'
                }`}
              >
                Safe ({riskCounts.safe})
              </button>
            </div>

            {/* Quick Search Input */}
            <div className="relative sm:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                value={areaSearchQuery}
                onChange={(e) => setAreaSearchQuery(e.target.value)}
                placeholder="Search area or state..."
                className="w-full pl-8 pr-7 py-1 text-xs rounded-md bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 shadow-2xs"
              />
              {areaSearchQuery && (
                <button
                  onClick={() => setAreaSearchQuery('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Card Body: Pure White Background with Clean High-Contrast Cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white scrollbar-thin">
            {filteredMonitoredAreas.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <ShieldAlert className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-700">No regional areas match your filter</p>
                <button
                  onClick={() => {
                    setSelectedRiskFilter('all');
                    setAreaSearchQuery('');
                  }}
                  className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              filteredMonitoredAreas.map((area) => {
                const isCritical = area.riskTier === 3;
                const isWarning = area.riskTier === 2;
                const isWatch = area.riskTier === 1;

                // Color accent according to risk tier on pure white background
                const cardAccentBorder = isCritical
                  ? 'border-l-red-600 bg-white'
                  : isWarning
                  ? 'border-l-orange-500 bg-white'
                  : isWatch
                  ? 'border-l-amber-500 bg-white'
                  : 'border-l-emerald-500 bg-white';

                const riskBadgeClass = isCritical
                  ? 'bg-red-50 text-red-700 border-red-200 font-bold'
                  : isWarning
                  ? 'bg-orange-50 text-orange-700 border-orange-200 font-bold'
                  : isWatch
                  ? 'bg-amber-50 text-amber-800 border-amber-200 font-medium'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium';

                const sensorTypeMeta = getSensorTypeMeta(area.primarySensor.type);
                const SensorIcon = sensorTypeMeta.icon;

                return (
                  <div
                    key={area.areaName}
                    onClick={() => onSelectSensor?.(area.primarySensor)}
                    className={`rounded-xl border border-slate-200/90 border-l-4 ${cardAccentBorder} p-3.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group`}
                    title={`View live telemetry for ${area.areaName}`}
                  >
                    {/* AREA HEADER: Area Name, State, Risk Level Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                            {area.areaName}
                          </h3>
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                            {area.state}
                          </span>
                        </div>
                        {area.hazardType && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {area.hazardType}
                          </p>
                        )}
                      </div>

                      {/* RISK LEVEL BADGE (Highest to Lowest) */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 shadow-2xs ${riskBadgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-500 animate-ping' : isWarning ? 'bg-orange-500' : isWatch ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span>
                            {area.riskLevel === 'Critical' ? 'Level 3 • Critical' :
                             area.riskLevel === 'Warning' ? 'Level 2 • Warning' :
                             area.riskLevel === 'Watch' ? 'Level 1 • Watch' : 'Level 0 • Safe'}
                          </span>
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                          {area.riskScore}% Hazard Risk
                        </span>
                      </div>
                    </div>

                    {/* SENSOR DATA SECTION (WITHOUT SENSOR ID) ON WHITE */}
                    <div className="bg-white rounded-lg p-3 border border-slate-200/80 shadow-2xs space-y-2.5">
                      {/* Sensor identification (Sensor Name and Type ONLY - no sensor ID) */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${sensorTypeMeta.color}`}>
                            <SensorIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate block">
                              {area.primarySensor.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {sensorTypeMeta.label}
                            </span>
                          </div>
                        </div>

                        {/* Real-time Primary Reading */}
                        <div className="text-right shrink-0">
                          <div className="flex items-baseline justify-end gap-1">
                            <span className={`text-lg font-extrabold font-mono tracking-tight ${
                              isCritical ? 'text-red-600' :
                              isWarning ? 'text-orange-600' :
                              isWatch ? 'text-amber-600' :
                              'text-emerald-600'
                            }`}>
                              {area.primarySensor.value.toFixed(1)}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              {area.primarySensor.unit}
                            </span>
                          </div>
                          <span className={`text-[9px] font-semibold uppercase tracking-wider block ${
                            isCritical ? 'text-red-600' :
                            isWarning ? 'text-orange-600' :
                            isWatch ? 'text-amber-600' :
                            'text-emerald-600'
                          }`}>
                            {isCritical ? 'Limit Breached' : isWarning ? 'Warning Level' : isWatch ? 'Elevated' : 'Nominal'}
                          </span>
                        </div>
                      </div>

                      {/* Real-Time Telemetry Metrics Grid on White */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {/* 1. Pore Pressure */}
                        <div className="bg-white p-2 rounded-md border border-slate-200/80 shadow-2xs">
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>Pore Pressure</span>
                          </div>
                          <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                            {area.porePressure !== undefined ? `${area.porePressure.toFixed(1)} kPa` : '38.5 kPa'}
                          </div>
                        </div>

                        {/* 2. Displacement */}
                        <div className="bg-white p-2 rounded-md border border-slate-200/80 shadow-2xs">
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MoveUpRight className="w-3 h-3 text-purple-500 shrink-0" />
                            <span>Displacement</span>
                          </div>
                          <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                            {area.displacement !== undefined ? `${area.displacement.toFixed(1)} mm` : '< 0.5 mm'}
                          </div>
                        </div>

                        {/* 3. Rain Rate */}
                        <div className="bg-white p-2 rounded-md border border-slate-200/80 shadow-2xs">
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <CloudRain className="w-3 h-3 text-cyan-500 shrink-0" />
                            <span>Rain Rate</span>
                          </div>
                          <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                            {area.rainfallRate !== undefined ? `${area.rainfallRate.toFixed(1)} mm/h` : '18.0 mm/h'}
                          </div>
                        </div>

                        {/* 4. Soil Moisture */}
                        <div className="bg-white p-2 rounded-md border border-slate-200/80 shadow-2xs">
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Activity className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>Soil Moisture</span>
                          </div>
                          <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                            {area.soilMoisture !== undefined ? `${area.soilMoisture.toFixed(1)}%` : '68.5%'}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Live Status, Battery, Threshold & Mini Trend Sparkline */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{area.lastUpdated}</span>
                          </span>
                          {area.primarySensor.batteryLevel !== undefined && (
                            <span className="flex items-center gap-1">
                              <Battery className="w-3 h-3 text-slate-400" />
                              <span>{area.primarySensor.batteryLevel}%</span>
                            </span>
                          )}
                          {area.primarySensor.threshold !== undefined && (
                            <span className="hidden sm:inline-block">
                              Threshold: {area.primarySensor.threshold} {area.primarySensor.unit}
                            </span>
                          )}
                        </div>

                        {/* Mini Sparkline Chart */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] text-slate-400 font-mono hidden xs:inline">Trend</span>
                          {renderSparkline(
                            area.primarySensor.sparkline,
                            isCritical ? '#dc2626' : isWarning ? '#ea580c' : isWatch ? '#d97706' : '#16a34a'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Real North East Region Google Risk Map Card (6 cols) */}
        <DashboardRiskMap 
          onNavigateToFullMap={onNavigateToMap} 
          className="lg:col-span-6" 
        />
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: AI RISK ASSESSMENT (LEFT) & RECENT ALERTS (RIGHT)                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: AI Risk Assessment Card (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          {/* Card Header (Dark Navy) */}
          <div className="bg-[#0a1128] text-white px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wide">AI Risk Assessment</h2>
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live</span>
            </div>
          </div>

          {/* Card Body: 2 Sub-panels (Overall Risk Level & Risk Factors Contribution) */}
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* Left Sub-panel: Overall Risk Level */}
            <div className="flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-4">
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2.5">Overall Risk Level</p>
                
                {/* Big Red Critical Banner */}
                <div className="bg-[#d63031] text-white rounded-lg p-3.5 text-center shadow-xs mb-4">
                  <p className="text-xl font-black tracking-wider uppercase">CRITICAL</p>
                  <p className="text-xs font-normal text-white/95 mt-0.5">Landslide probability is very high</p>
                </div>

                {/* Metric Summary Rows */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Risk Score</span>
                    <span className="font-bold text-slate-900 font-mono">0.87 / 1.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Confidence</span>
                    <span className="font-bold text-slate-900 font-mono">92.3%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-medium">Last Updated</span>
                    <span className="font-medium text-slate-600 font-mono">2 min ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sub-panel: Risk Factors Contribution */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Risk Factors Contribution</p>
                
                <div className="flex items-center gap-4">
                  {/* Circular Donut Chart */}
                  <div className="relative w-28 h-28 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      {/* Background Ring */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
                      {/* Rainfall: 30% -> Blue */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="26.4 100" strokeDashoffset="0" />
                      {/* Pore Pressure: 30% -> Orange */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="26.4 100" strokeDashoffset="-26.4" />
                      {/* Displacement: 25% -> Purple */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#8b5cf6" strokeWidth="4.5" strokeDasharray="22 100" strokeDashoffset="-52.8" />
                      {/* Terrain: 10% -> Teal */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4.5" strokeDasharray="8.8 100" strokeDashoffset="-74.8" />
                      {/* Other: 5% -> Gray */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#94a3b8" strokeWidth="4.5" strokeDasharray="4.4 100" strokeDashoffset="-83.6" />
                    </svg>
                    {/* Donut Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-base font-bold text-slate-900 font-mono leading-none">0.87</span>
                      <span className="text-[9px] text-slate-400 font-medium">Risk Score</span>
                    </div>
                  </div>

                  {/* Factor Breakdown Legend with Values */}
                  <div className="space-y-1 text-[11px] flex-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                        <span className="text-slate-600">Rainfall (30%)</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800">0.28</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                        <span className="text-slate-600">Pore Pressure (30%)</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800">0.26</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                        <span className="text-slate-600">Displacement (25%)</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800">0.22</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                        <span className="text-slate-600">Terrain (10%)</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800">0.08</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#94a3b8]" />
                        <span className="text-slate-600">Other Factors (5%)</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800">0.03</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Recent Alerts Card (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          {/* Card Header (Dark Navy) */}
          <div className="bg-[#0a1128] text-white px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wide">Recent Alerts</h2>
            <button
              onClick={onViewAllAlerts}
              className="text-xs text-slate-300 hover:text-white transition-colors"
            >
              View All
            </button>
          </div>

          {/* Card Body: 2 Key Alert Rows */}
          <div className="p-4 divide-y divide-slate-100 flex flex-col justify-between flex-1 gap-3">
            {/* Alert Item 1: Critical */}
            <div className="flex items-start gap-3.5 pt-1 pb-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 fill-rose-600 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-bold text-rose-600">Critical Risk Alert</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">2 min ago</span>
                    <span className="bg-rose-100 text-rose-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md">
                      CRITICAL
                    </span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Station: S-07 | East Siang District, Arunachal Pradesh
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  High probability of landslide in the next 2-6 hours.
                </p>
              </div>
            </div>

            {/* Alert Item 2: Warning */}
            <div className="flex items-start gap-3.5 pt-3 pb-1">
              <div className="w-9 h-9 rounded-lg bg-amber-100/80 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 fill-amber-500 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-bold text-amber-600">Warning Alert</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">15 min ago</span>
                    <span className="bg-amber-100 text-amber-800 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md">
                      WARNING
                    </span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Station: S-03 | West Jaintia Hills, Meghalaya
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Increased landslide probability due to heavy rainfall.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
