import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  Activity, 
  Battery, 
  BatteryWarning, 
  BatteryCharging, 
  BatteryLow, 
  Wifi, 
  Download, 
  Search, 
  Filter, 
  TrendingUp, 
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Zap,
  MapPin,
  Globe,
  LayoutGrid,
  Columns,
  Navigation,
  ExternalLink,
  Compass,
  Layers,
  X,
  Droplets,
  Mountain,
  CloudRain,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Gauge,
  Flame,
  Info
} from 'lucide-react';
import { SensorData, UserRole } from '../types';
import { GoogleMapView } from './GoogleMapView';

interface SensorsViewProps {
  sensors: SensorData[];
  onSelectSensor: (sensor: SensorData) => void;
  onExportSensors: () => void;
  onSimulateSpike: () => void;
  isSpikeActive: boolean;
  onOpenVisualizer?: () => void;
  isAdmin?: boolean;
  onToggleAdmin?: (isAdmin: boolean) => void;
}

type SortField = 'riskChance' | 'soilMoisture' | 'rainfallMm' | 'rainfallRate' | 'porePressure' | 'displacement' | 'status' | 'area' | 'name';
type SortOrder = 'asc' | 'desc';

export const SensorsView: React.FC<SensorsViewProps> = ({
  sensors,
  onSelectSensor,
  onExportSensors,
  onSimulateSpike,
  isSpikeActive,
  onOpenVisualizer,
  isAdmin: propIsAdmin,
  onToggleAdmin,
}) => {
  // Local admin mode state (synchronized with prop if provided)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(
    propIsAdmin !== undefined ? propIsAdmin : true
  );
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'split'>('grid');
  
  // State & Area Filtering & Sorter States
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('riskChance');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [search, setSearch] = useState<string>('');
  const [onlyLowBattery, setOnlyLowBattery] = useState<boolean>(false);
  const [selectedSensorDetail, setSelectedSensorDetail] = useState<SensorData | null>(null);
  const [mapDetailSensor, setMapDetailSensor] = useState<SensorData | null>(null);

  const handleAdminToggle = (nextVal: boolean) => {
    setIsAdminMode(nextVal);
    if (onToggleAdmin) {
      onToggleAdmin(nextVal);
    }
  };

  // Extract distinct states and areas
  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    sensors.forEach((s) => {
      if (s.state) states.add(s.state);
      else states.add('California');
    });
    return Array.from(states).sort();
  }, [sensors]);

  const uniqueAreas = useMemo(() => {
    const areas = new Set<string>();
    sensors.forEach((s) => {
      const stateMatch = selectedState === 'all' || (s.state || 'California') === selectedState;
      if (stateMatch) {
        if (s.area) areas.add(s.area);
        else if (s.sector) areas.add(s.sector);
      }
    });
    return Array.from(areas).sort();
  }, [sensors, selectedState]);

  // Battery fleet analytics (for Admin Panel)
  const totalSensors = sensors.length;
  const criticalBatterySensors = sensors.filter((s) => s.batteryLevel < 20);
  const warningBatterySensors = sensors.filter((s) => s.batteryLevel >= 20 && s.batteryLevel < 50);
  const healthyBatterySensors = sensors.filter((s) => s.batteryLevel >= 50);
  const avgBattery = Math.round(sensors.reduce((acc, s) => acc + s.batteryLevel, 0) / (totalSensors || 1));

  // Multi-layer Filtering (State, Area, Type, Battery, Search)
  const filtered = useMemo(() => {
    return sensors.filter((s) => {
      const sState = s.state || 'California';
      const sArea = s.area || s.sector;

      if (selectedState !== 'all' && sState !== selectedState) return false;
      if (selectedArea !== 'all' && sArea !== selectedArea) return false;
      if (onlyLowBattery && isAdminMode && s.batteryLevel >= 20) return false;
      if (filterType !== 'all' && s.type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q) ||
          (s.area && s.area.toLowerCase().includes(q)) ||
          (s.state && s.state.toLowerCase().includes(q)) ||
          (s.hazardType && s.hazardType.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [sensors, selectedState, selectedArea, onlyLowBattery, isAdminMode, filterType, search]);

  // Multi-Field Sorting Algorithm
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'riskChance': {
          const valA = a.riskChance ?? (a.status === 'critical' ? 90 : a.status === 'warning' ? 65 : 20);
          const valB = b.riskChance ?? (b.status === 'critical' ? 90 : b.status === 'warning' ? 65 : 20);
          comparison = valA - valB;
          break;
        }
        case 'soilMoisture': {
          const valA = a.soilMoisture ?? (a.type === 'moisture' ? a.value : 50);
          const valB = b.soilMoisture ?? (b.type === 'moisture' ? b.value : 50);
          comparison = valA - valB;
          break;
        }
        case 'rainfallMm': {
          const valA = a.rainfallMm ?? (a.type === 'rain_gauge' ? a.value * 2.5 : 25);
          const valB = b.rainfallMm ?? (b.type === 'rain_gauge' ? b.value * 2.5 : 25);
          comparison = valA - valB;
          break;
        }
        case 'rainfallRate': {
          const valA = a.rainfallRate ?? (a.type === 'rain_gauge' ? a.value : 10);
          const valB = b.rainfallRate ?? (b.type === 'rain_gauge' ? b.value : 10);
          comparison = valA - valB;
          break;
        }
        case 'porePressure': {
          const valA = a.porePressure ?? (a.type === 'piezometer' ? a.value : 20);
          const valB = b.porePressure ?? (b.type === 'piezometer' ? b.value : 20);
          comparison = valA - valB;
          break;
        }
        case 'displacement': {
          const valA = a.displacement ?? (a.type === 'inclinometer' ? a.value : 0);
          const valB = b.displacement ?? (b.type === 'inclinometer' ? b.value : 0);
          comparison = valA - valB;
          break;
        }
        case 'status': {
          const rank = { critical: 3, warning: 2, nominal: 1 };
          comparison = (rank[a.status] || 0) - (rank[b.status] || 0);
          break;
        }
        case 'area': {
          const areaA = (a.area || a.sector).toLowerCase();
          const areaB = (b.area || b.sector).toLowerCase();
          comparison = areaA.localeCompare(areaB);
          break;
        }
        case 'name':
        default: {
          comparison = a.id.localeCompare(b.id);
          break;
        }
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [filtered, sortBy, sortOrder]);

  // Aggregate stats for currently filtered state and area
  const areaStats = useMemo(() => {
    if (sorted.length === 0) {
      return {
        avgSoilMoisture: 0,
        maxSoilMoisture: 0,
        totalRainfall: 0,
        maxRainfallRate: 0,
        maxRiskChance: 0,
        primaryHazard: 'None',
        criticalCount: 0,
        warningCount: 0,
        nominalCount: 0,
      };
    }

    let soilSum = 0;
    let maxSoil = 0;
    let rainSum = 0;
    let maxRainRate = 0;
    let maxRisk = 0;
    let criticalCount = 0;
    let warningCount = 0;
    let nominalCount = 0;
    let highestRiskHazard = 'Slope Nominal';

    sorted.forEach((s) => {
      const soil = s.soilMoisture ?? (s.type === 'moisture' ? s.value : 50);
      const rain = s.rainfallMm ?? (s.type === 'rain_gauge' ? s.value * 2.5 : 25);
      const rainRate = s.rainfallRate ?? (s.type === 'rain_gauge' ? s.value : 10);
      const risk = s.riskChance ?? (s.status === 'critical' ? 90 : s.status === 'warning' ? 65 : 20);

      soilSum += soil;
      if (soil > maxSoil) maxSoil = soil;
      rainSum += rain;
      if (rainRate > maxRainRate) maxRainRate = rainRate;
      if (risk > maxRisk) {
        maxRisk = risk;
        highestRiskHazard = s.hazardType || (s.status === 'critical' ? 'High Slip Hazard' : 'Slope Instability');
      }

      if (s.status === 'critical') criticalCount++;
      else if (s.status === 'warning') warningCount++;
      else nominalCount++;
    });

    return {
      avgSoilMoisture: Math.round(soilSum / sorted.length),
      maxSoilMoisture: Math.round(maxSoil),
      totalRainfall: Math.round(rainSum),
      maxRainRate: Math.round(maxRainRate),
      maxRiskChance: Math.round(maxRisk),
      primaryHazard: highestRiskHazard,
      criticalCount,
      warningCount,
      nominalCount,
    };
  }, [sorted]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  return (
    <div className="flex-1 bg-[#fcf8fa] overflow-y-auto p-4 md:p-8 min-h-screen pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Admin Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c6c6cd] pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-[#1b1b1d] tracking-tight">
                Sensor Telemetry Matrix
              </h1>
              {isAdminMode ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#131b2e] text-white border border-black shadow-xs">
                  <Shield className="w-3.5 h-3.5 text-[#d3e4fe]" />
                  <span>Admin Panel Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-[#e4e2e4] text-[#45464d] border border-[#c6c6cd]">
                  <Eye className="w-3.5 h-3.5 text-[#76777d]" />
                  <span>Standard User View</span>
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-[#45464d] mt-1">
              {isAdminMode
                ? `Admin Panel &bull; State & Area Telemetry Sorter &bull; ${criticalBatterySensors.length} Node(s) Critical Low Battery (<20%)`
                : 'State & Area Geotechnical Telemetry &bull; Real-Time Soil Moisture, Rainfall & Hazard Risk Sorter'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher: Grid Cards vs Google Map vs Split */}
            <div className="flex bg-[#f0edef] p-1 rounded-lg border border-[#c6c6cd]">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#131b2e] text-white shadow-xs'
                    : 'text-[#45464d] hover:text-[#1b1b1d]'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-2.5 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                  viewMode === 'map'
                    ? 'bg-[#131b2e] text-white shadow-xs'
                    : 'text-[#45464d] hover:text-[#1b1b1d]'
                }`}
                title="Google Map View with Sensor Locations"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Google Map</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                  viewMode === 'split'
                    ? 'bg-[#131b2e] text-white shadow-xs'
                    : 'text-[#45464d] hover:text-[#1b1b1d]'
                }`}
                title="Split Matrix & Google Map View"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>
            </div>

            {/* Admin Panel vs User Mode Toggle Button */}
            <div className="flex bg-[#f0edef] p-1 rounded-lg border border-[#c6c6cd]">
              <button
                onClick={() => handleAdminToggle(true)}
                className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                  isAdminMode
                    ? 'bg-[#131b2e] text-white shadow-xs'
                    : 'text-[#45464d] hover:text-[#1b1b1d]'
                }`}
                title="Admin Panel: Displays battery health, hardware power metrics, and low-charge warnings"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
              <button
                onClick={() => {
                  handleAdminToggle(false);
                  setOnlyLowBattery(false);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                  !isAdminMode
                    ? 'bg-white text-[#1b1b1d] shadow-xs'
                    : 'text-[#45464d] hover:text-[#1b1b1d]'
                }`}
                title="Standard User View: Hides hardware battery health and internal power telemetry"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>User View</span>
              </button>
            </div>

            {/* Real-time visualizer shortcut */}
            {onOpenVisualizer && (
              <button
                onClick={onOpenVisualizer}
                className="px-3 py-2 bg-white border border-[#c6c6cd] hover:bg-[#e4e2e4] text-[#1b1b1d] rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-red-600" />
                <span>Real-Time Charts</span>
              </button>
            )}

            {/* Anomaly spike toggle */}
            <button
              onClick={onSimulateSpike}
              className={`px-3 py-2 rounded text-xs font-bold font-mono transition-colors border ${
                isSpikeActive
                  ? 'bg-red-700 text-white border-red-700'
                  : 'bg-white text-[#1b1b1d] border-[#c6c6cd] hover:bg-[#e4e2e4]'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 inline mr-1 ${isSpikeActive ? 'animate-bounce' : ''}`} />
              {isSpikeActive ? 'ANOMALY INJECTED' : 'INJECT SENSOR SPIKE'}
            </button>

            {/* Export CSV */}
            <button
              onClick={onExportSensors}
              className="px-3 py-2 bg-[#131b2e] hover:bg-black text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* STATE & AREA SORTER AND ADVANCED ENVIRONMENTAL FILTER BAR */}
        <div className="bg-white border border-[#c6c6cd] rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#e4e2e4]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#131b2e] text-white flex items-center justify-center font-bold">
                <Sliders className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1b1b1d] flex items-center gap-2">
                  <span>State, Area & Environmental Metric Sorter</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-mono font-bold px-2 py-0.5 rounded">
                    {sorted.length} Nodes Sorted
                  </span>
                </h3>
                <p className="text-xs text-[#76777d]">
                  Sort sensors across regions by soil moisture saturation, accumulated rainfall (mm), and landslide risk chance.
                </p>
              </div>
            </div>

            {/* Sorter Direction Toggle Button */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#76777d]">Sort Order:</span>
              <button
                onClick={toggleSortOrder}
                className="px-3 py-1.5 bg-[#f0edef] hover:bg-[#e4e2e4] border border-[#c6c6cd] rounded-lg text-xs font-mono font-bold text-[#1b1b1d] flex items-center gap-1.5 transition-all shadow-2xs"
                title={`Click to switch to ${sortOrder === 'desc' ? 'Ascending (Lowest first)' : 'Descending (Highest first)'}`}
              >
                {sortOrder === 'desc' ? (
                  <>
                    <ArrowDown className="w-3.5 h-3.5 text-red-600" />
                    <span>Highest First (Desc)</span>
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lowest First (Asc)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sorter Controls Row: State Selector, Area Selector, Metric Sorter & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. STATE SELECTOR */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#45464d] flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-amber-700" />
                <span>Filter by State / Region</span>
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedArea('all'); // reset area on state change
                }}
                className="w-full bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg px-3 py-2 text-xs font-semibold text-[#1b1b1d] focus:outline-none focus:border-black transition-colors"
              >
                <option value="all">All States & Regions ({sensors.length})</option>
                {uniqueStates.map((state) => {
                  const count = sensors.filter((s) => (s.state || 'California') === state).length;
                  return (
                    <option key={state} value={state}>
                      {state} ({count} sensors)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 2. AREA SELECTOR */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#45464d] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span>Filter by Area / Basin</span>
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg px-3 py-2 text-xs font-semibold text-[#1b1b1d] focus:outline-none focus:border-black transition-colors"
              >
                <option value="all">All Areas in {selectedState === 'all' ? 'All States' : selectedState} ({uniqueAreas.length} Areas)</option>
                {uniqueAreas.map((area) => {
                  const count = sensors.filter((s) => {
                    const stateMatch = selectedState === 'all' || (s.state || 'California') === selectedState;
                    return stateMatch && (s.area === area || s.sector === area);
                  }).length;
                  return (
                    <option key={area} value={area}>
                      {area} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 3. METRIC SORTER DROPDOWN */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#45464d] flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Sort Telemetry By</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="w-full bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg px-3 py-2 text-xs font-semibold text-[#1b1b1d] focus:outline-none focus:border-black transition-colors"
              >
                <option value="riskChance">⚠️ Risk Chance % (Landslide Probability)</option>
                <option value="soilMoisture">💧 Soil Moisture Saturation (% VWC)</option>
                <option value="rainfallMm">🌧️ Rainfall Fallen (24h Total mm)</option>
                <option value="rainfallRate">🌧️ Live Rain Precipitation Rate (mm/h)</option>
                <option value="porePressure">🔬 Pore Water Pressure (kPa)</option>
                <option value="displacement">📐 Inclinometer Displacement (mm / °)</option>
                <option value="status">🚨 Sensor Status Severity (Critical First)</option>
                <option value="area">📍 Area / Sector Name (Alphabetical)</option>
                <option value="name">🏷️ Sensor ID (A-Z)</option>
              </select>
            </div>

            {/* 4. SEARCH INPUT */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#45464d] flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#76777d]" />
                <span>Search Keywords</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ID, Area, Hazard type..."
                  className="w-full bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg px-3 py-2 text-xs text-[#1b1b1d] focus:outline-none focus:border-black transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sensor Type Fast Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e4e2e4]">
            <span className="text-xs font-mono font-bold text-[#76777d] uppercase tracking-wider">
              Sensor Types:
            </span>
            {['all', 'piezometer', 'inclinometer', 'seismometer', 'rain_gauge', 'moisture'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  filterType === t
                    ? 'bg-[#131b2e] text-white shadow-2xs'
                    : 'bg-[#f0edef] text-[#45464d] hover:bg-[#e4e2e4]'
                }`}
              >
                {t === 'all' ? 'All Types' : t.replace('_', ' ')}
              </button>
            ))}

            {/* Reset Filters button if active */}
            {(selectedState !== 'all' || selectedArea !== 'all' || filterType !== 'all' || search !== '') && (
              <button
                onClick={() => {
                  setSelectedState('all');
                  setSelectedArea('all');
                  setFilterType('all');
                  setSearch('');
                  setSortBy('riskChance');
                  setSortOrder('desc');
                }}
                className="ml-auto text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* AREA & STATE ENVIRONMENTAL SUMMARY BANNER (DISPLAYED AFTER SORTING) */}
        <div className="bg-[#131b2e] text-white rounded-xl p-4 sm:p-5 shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-700">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-blue-300 font-bold">
                  Sorted Telemetry Overview: {selectedState === 'all' ? 'All States' : selectedState} &bull; {selectedArea === 'all' ? 'All Areas' : selectedArea}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                <span>Environmental Risk & Saturation Profile</span>
                <span className="text-xs font-mono font-normal text-gray-300">
                  (Sorted by {sortBy === 'riskChance' ? 'Hazard Risk Chance' : sortBy === 'soilMoisture' ? 'Soil Moisture Saturation' : sortBy === 'rainfallMm' ? 'Rainfall Fallen' : sortBy})
                </span>
              </h2>
            </div>

            {/* Area Severity Badges */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-red-600 text-white font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{areaStats.criticalCount} Critical</span>
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-500 text-black font-bold flex items-center gap-1">
                <span>{areaStats.warningCount} Warning</span>
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold">
                {areaStats.nominalCount} Nominal
              </span>
            </div>
          </div>

          {/* 4 Environmental Telemetry Metrics: Soil Moisture, Rainfall mm, Risk Chance & Primary Hazard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {/* Metric 1: Soil Moisture */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-xs text-blue-300 font-medium">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  <span>Soil Moisture</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400">Avg / Peak</span>
              </div>
              <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1.5">
                <span>{areaStats.avgSoilMoisture}%</span>
                <span className="text-xs text-amber-300 font-normal">/ {areaStats.maxSoilMoisture}% VWC</span>
              </div>
              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    areaStats.maxSoilMoisture > 80 ? 'bg-red-500' : areaStats.maxSoilMoisture > 65 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, areaStats.maxSoilMoisture)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 block truncate">
                {areaStats.maxSoilMoisture > 80 ? '⚠️ Super-Saturated Soil' : areaStats.maxSoilMoisture > 65 ? 'High Moisture Saturation' : 'Nominal Soil Moisture'}
              </span>
            </div>

            {/* Metric 2: Rainfall Fallen (mm) */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-xs text-blue-300 font-medium">
                <span className="flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rainfall Fallen</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400">Total / Rate</span>
              </div>
              <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1.5">
                <span>{areaStats.totalRainfall} mm</span>
                <span className="text-xs text-cyan-300 font-normal">/ {areaStats.maxRainRate} mm/h</span>
              </div>
              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    areaStats.totalRainfall > 200 ? 'bg-red-500' : areaStats.totalRainfall > 80 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, (areaStats.totalRainfall / 300) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 block truncate">
                Cumulative 24h Area Precipitation
              </span>
            </div>

            {/* Metric 3: Risk Chance */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-300 font-medium">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Peak Risk Chance</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400">Probability</span>
              </div>
              <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1.5">
                <span className={areaStats.maxRiskChance > 80 ? 'text-red-400 font-black' : 'text-amber-300'}>
                  {areaStats.maxRiskChance}%
                </span>
                <span className="text-xs text-gray-300 font-normal">Hazard Prob.</span>
              </div>
              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    areaStats.maxRiskChance > 80 ? 'bg-red-500' : areaStats.maxRiskChance > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${areaStats.maxRiskChance}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 block truncate">
                {areaStats.maxRiskChance > 80 ? 'CRITICAL Landslide Threat' : areaStats.maxRiskChance > 50 ? 'Elevated Slope Rupture' : 'Stable Geotechnical Area'}
              </span>
            </div>

            {/* Metric 4: Primary Hazard */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
                <span className="flex items-center gap-1">
                  <Mountain className="w-3.5 h-3.5 text-amber-400" />
                  <span>Primary Hazard</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400">Type</span>
              </div>
              <div className="text-sm font-bold text-amber-300 truncate" title={areaStats.primaryHazard}>
                {areaStats.primaryHazard}
              </div>
              <div className="text-[11px] text-gray-300 font-mono pt-1">
                {areaStats.criticalCount > 0 ? 'Urgent Action / Evacuation Advisory' : 'Standard Geotechnical Vigilance'}
              </div>
            </div>
          </div>
        </div>

        {/* ADMIN PANEL ONLY: Hardware Fleet Battery Health Diagnostic Banner */}
        {isAdminMode ? (
          <div className="bg-white border-2 border-[#131b2e] rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#e4e2e4]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#131b2e] text-white flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4 text-[#d3e4fe]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1b1b1d] flex items-center gap-2">
                    <span>Admin Panel &bull; Field Sensor Battery Health Matrix</span>
                    <span className="text-[10px] bg-red-100 text-red-800 font-mono font-bold px-2 py-0.5 rounded border border-red-300">
                      ADMIN ONLY
                    </span>
                  </h2>
                  <p className="text-xs text-[#76777d]">
                    Monitors hardware power cells, solar charging efficiency, and triggers warnings for units with &lt;20% charge
                  </p>
                </div>
              </div>

              {/* Quick Low Battery Filter */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnlyLowBattery(!onlyLowBattery)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
                    onlyLowBattery
                      ? 'bg-red-700 text-white border-red-700 shadow-xs'
                      : criticalBatterySensors.length > 0
                      ? 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                      : 'bg-[#f0edef] text-[#45464d] border-[#c6c6cd]'
                  }`}
                >
                  <AlertTriangle className={`w-3.5 h-3.5 ${criticalBatterySensors.length > 0 ? 'animate-pulse text-red-600' : ''}`} />
                  <span>Show Low Battery (&lt;20%) Only ({criticalBatterySensors.length})</span>
                </button>
              </div>
            </div>

            {/* Battery Health Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                criticalBatterySensors.length > 0
                  ? 'bg-red-50/80 border-red-300 text-red-900'
                  : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
              }`}>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                    {criticalBatterySensors.length > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>Critically Low (&lt;20%)</span>
                  </div>
                  <div className="text-2xl font-mono font-black mt-1">
                    {criticalBatterySensors.length} <span className="text-xs font-normal">nodes</span>
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono">
                  {criticalBatterySensors.length > 0 ? (
                    <span className="text-red-700 font-bold bg-white px-2 py-1 rounded border border-red-200 block">
                      ACTION REQ.
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold bg-white px-2 py-1 rounded border border-emerald-200 block">
                      ALL SAFE
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-amber-900 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                    <BatteryLow className="w-4 h-4 text-amber-600" />
                    <span>Moderate (20-50%)</span>
                  </div>
                  <div className="text-2xl font-mono font-black mt-1">
                    {warningBatterySensors.length} <span className="text-xs font-normal">nodes</span>
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-amber-800">
                  <span>Monitor Solar</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 text-emerald-900 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                    <BatteryCharging className="w-4 h-4 text-emerald-600" />
                    <span>Nominal (&gt;50%)</span>
                  </div>
                  <div className="text-2xl font-mono font-black mt-1">
                    {healthyBatterySensors.length} <span className="text-xs font-normal">nodes</span>
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-emerald-800">
                  <span>100% Online</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[#c6c6cd] bg-[#f6f3f5] text-[#1b1b1d] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#45464d]">
                    <Battery className="w-4 h-4 text-[#131b2e]" />
                    <span>Avg Fleet Charge</span>
                  </div>
                  <div className="text-2xl font-mono font-black mt-1">
                    {avgBattery}%
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-[#76777d]">
                  <span>LiFePO4 Array</span>
                </div>
              </div>
            </div>

            {criticalBatterySensors.length > 0 && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg flex items-center justify-between gap-3 text-xs text-red-900">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 animate-bounce" />
                  <div>
                    <strong className="font-bold uppercase tracking-wide">
                      URGENT BATTERY HEALTH WARNING:
                    </strong>{' '}
                    <span>
                      {criticalBatterySensors.map((s) => `${s.id} (${s.name}: ${s.batteryLevel}%)`).join(', ')}{' '}
                      require immediate field battery replacement or solar panel inspection.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setOnlyLowBattery(true)}
                  className="px-2.5 py-1 bg-red-700 text-white rounded text-[11px] font-bold uppercase tracking-wider hover:bg-red-800 shrink-0"
                >
                  Isolate Critical Nodes
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#f0edef] border border-[#c6c6cd] rounded-xl p-3.5 flex items-center justify-between text-xs text-[#45464d]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#76777d]" />
              <span>
                <strong>Standard User View:</strong> Geotechnical soil moisture, rainfall fall rates, pore pressure, and risk telemetry are visible. Internal hardware power levels and battery diagnostics are restricted to the <strong>Admin Panel</strong>.
              </span>
            </div>
            <button
              onClick={() => handleAdminToggle(true)}
              className="px-3 py-1 bg-white border border-[#c6c6cd] hover:border-black rounded text-xs font-bold text-[#1b1b1d] transition-colors"
            >
              Switch to Admin Panel &rarr;
            </button>
          </div>
        )}

        {/* PRIMARY VIEW CONTENT: Grid Mode, Google Map Mode, or Split Mode */}
        {viewMode === 'map' ? (
          <div className="space-y-4">
            <div className="bg-white border border-[#c6c6cd] rounded-xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1b1b1d] flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Geospatial Sensor Telemetry Network</span>
                  </h3>
                  <p className="text-xs text-[#45464d] mt-0.5">
                    Click any marker on the Google Map to inspect live soil moisture, rainfall fallen (mm), risk chance, and pore pressure.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-[#76777d]">
                    Showing {sorted.length} sorted nodes
                  </span>
                </div>
              </div>

              {/* The Google Map View */}
              <GoogleMapView
                sensors={sorted}
                selectedSensor={selectedSensorDetail}
                onSelectSensor={(sensor) => {
                  setSelectedSensorDetail(sensor);
                  onSelectSensor(sensor);
                }}
                height="620px"
                isAdmin={isAdminMode}
              />
            </div>

            {/* Quick-Access Node Cards Carousel */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#45464d] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                <span>Quick Focus Telemetry Nodes ({sorted.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {sorted.map((sensor) => {
                  const isSelected = selectedSensorDetail?.id === sensor.id;
                  const isCrit = sensor.status === 'critical';
                  const isWarn = sensor.status === 'warning';
                  const riskChance = sensor.riskChance ?? (isCrit ? 90 : isWarn ? 65 : 20);

                  return (
                    <button
                      key={sensor.id}
                      onClick={() => {
                        setSelectedSensorDetail(sensor);
                        onSelectSensor(sensor);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-[#131b2e] text-white border-black shadow-md scale-105'
                          : 'bg-white hover:bg-[#f0edef] border-[#c6c6cd] text-[#1b1b1d]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold">{sensor.id}</span>
                        <span className={`text-[9px] font-mono font-bold px-1 rounded ${
                          isCrit ? 'bg-red-500 text-white' : isWarn ? 'bg-amber-400 text-black' : 'bg-emerald-500 text-white'
                        }`}>
                          {riskChance}% Risk
                        </span>
                      </div>
                      <div className={`text-[11px] font-mono font-bold mt-1 truncate ${
                        isSelected ? 'text-gray-200' : 'text-[#1b1b1d]'
                      }`}>
                        {sensor.name}
                      </div>
                      <div className={`text-[9px] font-mono truncate mt-0.5 ${
                        isSelected ? 'text-gray-300' : 'text-[#76777d]'
                      }`}>
                        {sensor.area || sensor.sector}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : viewMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Google Map */}
            <div className="lg:col-span-7 space-y-3">
              <div className="bg-white border border-[#c6c6cd] rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-[#1b1b1d]">Live Google Map View</span>
                  </div>
                  <span className="text-[11px] font-mono bg-[#f0edef] px-2 py-0.5 rounded text-[#45464d]">
                    {selectedState === 'all' ? 'All Regions' : selectedState} &bull; {sorted.length} Nodes
                  </span>
                </div>
                <GoogleMapView
                  sensors={sorted}
                  selectedSensor={selectedSensorDetail}
                  onSelectSensor={(sensor) => {
                    setSelectedSensorDetail(sensor);
                    onSelectSensor(sensor);
                  }}
                  height="580px"
                  isAdmin={isAdminMode}
                />
              </div>
            </div>

            {/* Right Column: Sensor Matrix Cards List */}
            <div className="lg:col-span-5 space-y-3 max-h-[620px] overflow-y-auto pr-1">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#45464d] flex items-center justify-between pb-1 border-b border-[#c6c6cd]">
                <span>Sorted Telemetry Nodes ({sorted.length})</span>
                <span className="text-[10px] text-[#76777d]">Click node to inspect</span>
              </div>
              {sorted.map((sensor) => {
                const isSelected = selectedSensorDetail?.id === sensor.id;
                const isCrit = sensor.status === 'critical';
                const isWarn = sensor.status === 'warning';
                const soilMoisture = sensor.soilMoisture ?? (sensor.type === 'moisture' ? sensor.value : 50);
                const rainfallMm = sensor.rainfallMm ?? (sensor.type === 'rain_gauge' ? sensor.value * 2.5 : 25);
                const riskChance = sensor.riskChance ?? (isCrit ? 90 : isWarn ? 65 : 20);

                return (
                  <div
                    key={sensor.id}
                    onClick={() => {
                      setSelectedSensorDetail(sensor);
                      onSelectSensor(sensor);
                    }}
                    className={`bg-white border rounded-xl p-4 cursor-pointer transition-all shadow-2xs ${
                      isSelected
                        ? 'border-2 border-[#131b2e] ring-2 ring-[#131b2e]/20 bg-blue-50/20'
                        : isCrit
                        ? 'border-red-600'
                        : isWarn
                        ? 'border-amber-500'
                        : 'border-[#c6c6cd] hover:border-black'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#1b1b1d]">{sensor.id}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            isCrit ? 'bg-red-100 text-red-800' : isWarn ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {sensor.status}
                          </span>
                          <span className="text-[10px] font-mono text-[#76777d]">
                            {sensor.state || 'California'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#45464d] font-medium mt-0.5">{sensor.name}</p>
                      </div>
                      <div className="text-right font-mono">
                        <div className={`text-xs font-bold px-2 py-0.5 rounded ${
                          riskChance > 80 ? 'bg-red-100 text-red-800' : riskChance > 50 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {riskChance}% Risk
                        </div>
                      </div>
                    </div>

                    {/* Quick Items Row: Soil Moisture & Rain Fallen */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#e4e2e4] text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-[#45464d]">
                        <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Moisture: <strong>{soilMoisture}%</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#45464d]">
                        <CloudRain className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        <span>Rain: <strong>{rainfallMm}mm</strong></span>
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-dashed border-[#e4e2e4] flex items-center justify-between text-[10px] font-mono text-[#76777d]">
                      <span className="truncate max-w-[140px]">{sensor.area || sensor.sector}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1b1b1d]">{sensor.value} {sensor.unit}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSensorDetail(sensor);
                            setMapDetailSensor(sensor);
                          }}
                          className="px-2 py-0.5 bg-[#131b2e] hover:bg-black text-white rounded text-[9px] font-bold transition-all flex items-center gap-1"
                          title="Inspect telemetry node"
                        >
                          <Eye className="w-2.5 h-2.5 text-blue-300" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* GRID VIEW MODE: Rich Telemetry Cards Displaying Soil Moisture, Rainfall Fallen (mm), Risk Chance, and Diagnostics */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sorted.map((sensor) => {
              const isCrit = sensor.status === 'critical';
              const isWarn = sensor.status === 'warning';
              const isLowBattery = sensor.batteryLevel < 20;
              const isModerateBattery = sensor.batteryLevel >= 20 && sensor.batteryLevel < 50;

              // Telemetry values for display
              const soilMoisture = sensor.soilMoisture ?? (sensor.type === 'moisture' ? sensor.value : 50);
              const rainfallMm = sensor.rainfallMm ?? (sensor.type === 'rain_gauge' ? sensor.value * 2.5 : 25);
              const rainfallRate = sensor.rainfallRate ?? (sensor.type === 'rain_gauge' ? sensor.value : 10);
              const riskChance = sensor.riskChance ?? (isCrit ? 90 : isWarn ? 65 : 20);
              const hazardType = sensor.hazardType || (isCrit ? 'Critical Slope Instability' : isWarn ? 'Moderate Creep Risk' : 'Bedrock Nominal');
              const stateName = sensor.state || 'California';
              const areaName = sensor.area || sensor.sector;

              return (
                <div
                  key={sensor.id}
                  onClick={() => {
                    setSelectedSensorDetail(sensor);
                    onSelectSensor(sensor);
                  }}
                  className={`bg-white border rounded-xl p-5 cursor-pointer transition-all shadow-xs hover:shadow-md relative flex flex-col justify-between ${
                    isCrit
                      ? 'border-red-600 ring-1 ring-red-600/30'
                      : isWarn
                      ? 'border-amber-500'
                      : 'border-[#c6c6cd] hover:border-black'
                  }`}
                >
                  <div>
                    {/* Header: ID, Status Pill, State & Area Badge */}
                    <div className="flex justify-between items-start mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#1b1b1d]">{sensor.id}</span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                              isCrit
                                ? 'bg-red-100 text-red-800'
                                : isWarn
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {sensor.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#45464d] mt-0.5 font-medium">{sensor.name}</p>
                      </div>

                      {/* Primary Geotechnical Metric */}
                      <div className="text-right">
                        <span className="font-mono text-xl font-bold text-[#1b1b1d]">
                          {sensor.value}
                        </span>
                        <span className="text-xs font-mono text-[#76777d] ml-1">{sensor.unit}</span>
                      </div>
                    </div>

                    {/* STATE & AREA LOCATION BADGE */}
                    <div className="mb-3 flex items-center justify-between text-[11px] font-mono bg-[#f6f3f5] p-2 rounded-lg border border-[#e4e2e4]">
                      <div className="flex items-center gap-1 text-[#45464d] truncate">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="font-semibold text-[#1b1b1d]">{stateName}</span>
                        <span className="text-[#76777d]">&bull;</span>
                        <span className="truncate">{areaName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSensorDetail(sensor);
                            setMapDetailSensor(sensor);
                          }}
                          className="px-2 py-0.5 bg-[#131b2e] hover:bg-black text-white rounded text-[10px] font-bold transition-all flex items-center gap-1 shadow-2xs"
                          title="Inspect telemetry node, satellite map and parameters"
                        >
                          <Eye className="w-3 h-3 text-blue-300" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMapDetailSensor(sensor);
                          }}
                          className="px-2 py-0.5 bg-white border border-[#c6c6cd] hover:border-black hover:bg-[#131b2e] hover:text-white rounded text-[10px] font-bold transition-all flex items-center gap-1 shadow-2xs"
                          title="Open interactive Google Map View for this sensor"
                        >
                          <Globe className="w-3 h-3 text-blue-500" />
                          <span>Map</span>
                        </button>
                      </div>
                    </div>

                    {/* REQUIRED DISPLAY ITEMS: SOIL MOISTURE, RAINFALL FALLEN (MM) & RISK CHANCE */}
                    <div className="space-y-2.5 p-3 rounded-xl bg-[#fcf8fa] border border-[#e4e2e4] mb-3">
                      {/* 1. RISK CHANCE ITEM */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 font-bold text-[#1b1b1d]">
                            <Flame className={`w-3.5 h-3.5 ${riskChance > 80 ? 'text-red-600' : 'text-amber-500'}`} />
                            <span>Risk Chance</span>
                          </span>
                          <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                            riskChance > 80 ? 'bg-red-600 text-white' : riskChance > 50 ? 'bg-amber-400 text-black' : 'bg-emerald-600 text-white'
                          }`}>
                            {riskChance}% Hazard Probability
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#e4e2e4] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              riskChance > 80 ? 'bg-red-600' : riskChance > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${riskChance}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-mono text-[#76777d] truncate" title={hazardType}>
                          Hazard: {hazardType}
                        </p>
                      </div>

                      {/* 2. SOIL MOISTURE ITEM */}
                      <div className="space-y-1 pt-2 border-t border-[#e4e2e4]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 font-bold text-[#1b1b1d]">
                            <Droplets className="w-3.5 h-3.5 text-blue-600" />
                            <span>Soil Moisture</span>
                          </span>
                          <span className="font-mono text-xs font-bold text-blue-900">
                            {soilMoisture}% VWC
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#e4e2e4] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              soilMoisture > 80 ? 'bg-red-600' : soilMoisture > 65 ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, soilMoisture)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-[#76777d]">
                          <span>Threshold: 75% VWC</span>
                          <span className={soilMoisture > 80 ? 'text-red-700 font-bold' : ''}>
                            {soilMoisture > 80 ? 'Super-Saturated' : soilMoisture > 65 ? 'Elevated Moisture' : 'Nominal Moisture'}
                          </span>
                        </div>
                      </div>

                      {/* 3. RAINFALL FALLEN (MM) ITEM */}
                      <div className="space-y-1 pt-2 border-t border-[#e4e2e4]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 font-bold text-[#1b1b1d]">
                            <CloudRain className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Rainfall Fallen</span>
                          </span>
                          <span className="font-mono text-xs font-bold text-cyan-900">
                            {rainfallMm} mm (24h)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#45464d] bg-white p-1.5 rounded border border-[#e4e2e4]">
                          <span>Precipitation Rate:</span>
                          <strong className="text-[#1b1b1d]">{rainfallRate} mm/h</strong>
                        </div>
                      </div>
                    </div>

                    {/* Geotechnical Threshold Progress Bar */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-[10px] font-mono text-[#76777d]">
                        <span>Baseline: 0</span>
                        <span>Safety Limit: {sensor.threshold} {sensor.unit}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#e4e2e4] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isCrit ? 'bg-red-600' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (sensor.value / sensor.threshold) * 85)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* ADMIN PANEL ONLY: Battery Health & Low-Charge Warning Section */}
                    {isAdminMode && (
                      <div className="my-3 pt-2.5 border-t border-[#e4e2e4] bg-[#fcf8fa] -mx-5 px-5 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            {isLowBattery ? (
                              <div className="flex items-center gap-1 text-red-700">
                                <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                                <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
                                  Low Battery Warning
                                </span>
                              </div>
                            ) : isModerateBattery ? (
                              <div className="flex items-center gap-1 text-amber-700">
                                <BatteryLow className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-semibold text-[#45464d]">
                                  Battery Level
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-emerald-700">
                                <BatteryCharging className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-semibold text-[#45464d]">
                                  Battery Level
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isLowBattery && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-600 text-white uppercase animate-pulse">
                                &lt; 20% CRITICAL
                              </span>
                            )}
                            <span className={`font-mono text-xs font-bold ${
                              isLowBattery
                                ? 'text-red-700 font-black'
                                : isModerateBattery
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}>
                              {sensor.batteryLevel}%
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2 bg-[#e4e2e4] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isLowBattery
                                ? 'bg-red-600'
                                : isModerateBattery
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(4, sensor.batteryLevel)}%` }}
                          />
                        </div>

                        {isLowBattery && (
                          <div className="mt-2 p-1.5 bg-red-100 border border-red-300 rounded text-[10px] text-red-900 font-medium flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3 text-red-700 shrink-0" />
                            <span>Recharge or swap battery cell immediately (est. &lt;14 hrs remaining).</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Metadata */}
                  <div className="flex justify-between items-center pt-2.5 border-t border-[#e4e2e4] text-[11px] font-mono text-[#76777d]">
                    <span className="flex items-center gap-1">
                      <Compass className="w-3 h-3 text-[#76777d]" />
                      <span>{sensor.depth ? `Depth: ${sensor.depth}` : 'Surface'}</span>
                    </span>
                    <div className="flex items-center gap-3">
                      {isAdminMode ? (
                        <span className="flex items-center gap-1 text-[#45464d]">
                          <Wifi className="w-3.5 h-3.5" />
                          {sensor.signalDbm}dBm
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#76777d]">
                          Updated {sensor.lastUpdated}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {sorted.length === 0 && (
          <div className="text-center py-16 bg-white border border-[#c6c6cd] rounded-xl p-8 space-y-3">
            <Radio className="w-10 h-10 text-[#76777d] mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-[#1b1b1d]">No Telemetry Sensors Found</h3>
            <p className="text-xs text-[#45464d] max-w-md mx-auto">
              No sensors matched your current state ({selectedState}), area ({selectedArea}), or filter criteria. Try resetting your search filters.
            </p>
            <button
              onClick={() => {
                setSelectedState('all');
                setSelectedArea('all');
                setFilterType('all');
                setSearch('');
                setSortBy('riskChance');
              }}
              className="px-4 py-2 bg-[#131b2e] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* SENSOR GEOLOCATION & GOOGLE MAP DETAIL MODAL */}
        {mapDetailSensor && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border-2 border-[#131b2e] shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="bg-[#131b2e] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <span>{mapDetailSensor.id}: {mapDetailSensor.name}</span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        mapDetailSensor.status === 'critical' ? 'bg-red-600 text-white' : mapDetailSensor.status === 'warning' ? 'bg-amber-500 text-black' : 'bg-emerald-600 text-white'
                      }`}>
                        {mapDetailSensor.status}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-300 font-mono mt-0.5">
                      {mapDetailSensor.state || 'California'} &bull; {mapDetailSensor.area || mapDetailSensor.sector} &bull; GPS: {mapDetailSensor.lat.toFixed(5)}° N, {Math.abs(mapDetailSensor.lng).toFixed(5)}° W
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMapDetailSensor(null)}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Embedded Google Map */}
              <div className="p-4 bg-[#fcf8fa] space-y-4">
                <div className="rounded-xl overflow-hidden border border-[#c6c6cd] shadow-inner">
                  <GoogleMapView
                    sensors={[mapDetailSensor]}
                    selectedSensor={mapDetailSensor}
                    initialCenter={{ lat: mapDetailSensor.lat, lng: mapDetailSensor.lng }}
                    initialZoom={17}
                    height="300px"
                    isAdmin={isAdminMode}
                  />
                </div>

                {/* Display Items: Soil Moisture, Rainfall Fallen, Risk Chance & Telemetry */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-white rounded-lg border border-[#c6c6cd]">
                    <span className="text-[10px] text-blue-700 block uppercase font-bold flex items-center gap-1">
                      <Droplets className="w-3 h-3" /> Soil Moisture
                    </span>
                    <span className="text-base font-bold text-[#1b1b1d]">
                      {mapDetailSensor.soilMoisture ?? 78.5}% VWC
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#c6c6cd]">
                    <span className="text-[10px] text-cyan-700 block uppercase font-bold flex items-center gap-1">
                      <CloudRain className="w-3 h-3" /> Rain Fallen
                    </span>
                    <span className="text-base font-bold text-[#1b1b1d]">
                      {mapDetailSensor.rainfallMm ?? 68.4} mm
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#c6c6cd]">
                    <span className="text-[10px] text-amber-700 block uppercase font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Risk Chance
                    </span>
                    <span className={`text-base font-bold ${
                      (mapDetailSensor.riskChance ?? 75) > 80 ? 'text-red-600' : 'text-amber-700'
                    }`}>
                      {mapDetailSensor.riskChance ?? (mapDetailSensor.status === 'critical' ? 90 : 65)}%
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#c6c6cd]">
                    <span className="text-[10px] text-[#76777d] block uppercase">Live Telemetry</span>
                    <span className="text-base font-bold text-[#1b1b1d]">
                      {mapDetailSensor.value} {mapDetailSensor.unit}
                    </span>
                  </div>
                </div>

                {/* Actions & Links */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#e4e2e4]">
                  <div className="text-xs text-[#45464d] flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span>Hazard: {mapDetailSensor.hazardType || 'Geotechnical telemetry verified'}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${mapDetailSensor.lat},${mapDetailSensor.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 sm:flex-initial px-4 py-2 bg-[#131b2e] hover:bg-black text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Directions on Google Maps</span>
                    </a>
                    <button
                      onClick={() => setMapDetailSensor(null)}
                      className="px-4 py-2 bg-white border border-[#c6c6cd] hover:border-black text-xs font-bold rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
