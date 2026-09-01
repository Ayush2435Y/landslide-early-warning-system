import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  Crosshair, 
  Layers, 
  AlertTriangle, 
  Radio, 
  Eye, 
  Navigation,
  Info,
  Maximize2,
  X,
  ExternalLink,
  CloudRain,
  History,
  Mountain,
  Wind,
  Droplets,
  Calendar,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Zap,
  Activity,
  Shield,
  Clock,
  Compass,
  Grid,
  Globe,
  Building2,
  ArrowRight,
  Filter,
  RefreshCw,
  PhoneCall,
  Sliders,
  SlidersHorizontal,
  EyeOff,
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';
import { SensorData, IncidentReport, HistoricalLandslideEvent, RiskTierLevel, RISK_TIERS } from '../types';
import { HOTLINKED_IMAGES, INITIAL_HISTORICAL_EVENTS } from '../data/initialData';
import { 
  NER_STATES_DATA, 
  NERStateInfo, 
  NERDistrictInfo, 
  HIERARCHICAL_SENSOR_PINS, 
  HierarchicalSensorPin 
} from '../data/hierarchicalData';
import { NERScannedMapLayer } from './NERScannedMapLayer';

export type MapHierarchyLevel = 'regional' | 'state' | 'district';

export interface SensorCluster {
  id: string;
  isCluster: true;
  x: number;
  y: number;
  sensors: SensorData[];
  count: number;
  worstStatus: 'critical' | 'warning' | 'nominal';
  criticalCount: number;
  warningCount: number;
  nominalCount: number;
  sectorSummary: string;
}

export type SensorOrCluster = 
  | { isCluster: false; sensor: SensorData; x: number; y: number }
  | SensorCluster;

// Geographic to Canvas coordinate conversion (normalized % coordinates across NER bounding box)
export const getCanvasCoordsFromGeo = (lat: number, lng: number): { x: number; y: number } => {
  const minLat = 22.0, maxLat = 28.6;
  const minLng = 90.0, maxLng = 96.0;
  const x = Math.max(10, Math.min(90, ((lng - minLng) / (maxLng - minLng)) * 76 + 12));
  const y = Math.max(12, Math.min(88, 100 - (((lat - minLat) / (maxLat - minLat)) * 74 + 14)));
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
};

export const getSensorCoordinates = (s: SensorData): { x: number; y: number } => {
  if (s.id === 'NER-NODE-01') return { x: 38, y: 38 }; // Guwahati Hills
  if (s.id === 'NER-INC-02') return { x: 65, y: 44 };  // NH-29 Paglapahar Nagaland
  if (s.id === 'NER-PZ-03') return { x: 34, y: 52 };   // Sohra Meghalaya
  if (s.id === 'NER-INC-04') return { x: 50, y: 52 };  // Dima Hasao Assam
  if (s.id === 'NER-SEIS-05') return { x: 58, y: 58 }; // Tupul Noney Manipur
  if (s.id === 'NER-RAIN-06') return { x: 36, y: 24 }; // Tawang Arunachal
  if (s.id === 'NER-SM-07') return { x: 46, y: 70 };   // Aizawl Mizoram
  if (s.id === 'NER-PZ-08') return { x: 40, y: 68 };   // Jampui Tripura

  if (s.lat && s.lng) {
    return getCanvasCoordsFromGeo(s.lat, s.lng);
  }
  return { x: 50, y: 50 };
};

export function clusterSensors(
  sensorList: SensorData[], 
  zoom: number, 
  enabled: boolean
): SensorOrCluster[] {
  if (!enabled || sensorList.length <= 1) {
    return sensorList.map(s => {
      const pos = getSensorCoordinates(s);
      return { isCluster: false, sensor: s, x: pos.x, y: pos.y };
    });
  }

  // At high zoom, unpack into individual sensors
  if (zoom >= 1.8) {
    return sensorList.map(s => {
      const pos = getSensorCoordinates(s);
      return { isCluster: false, sensor: s, x: pos.x, y: pos.y };
    });
  }

  // Distance threshold scaled by zoom level
  const threshold = Math.max(6, (1.8 - zoom) * 16);

  const unassigned = sensorList.map(s => ({
    sensor: s,
    pos: getSensorCoordinates(s),
    used: false,
  }));

  const results: SensorOrCluster[] = [];

  for (let i = 0; i < unassigned.length; i++) {
    if (unassigned[i].used) continue;

    const group = [unassigned[i]];
    unassigned[i].used = true;

    for (let j = i + 1; j < unassigned.length; j++) {
      if (unassigned[j].used) continue;

      const dx = unassigned[i].pos.x - unassigned[j].pos.x;
      const dy = unassigned[i].pos.y - unassigned[j].pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= threshold) {
        group.push(unassigned[j]);
        unassigned[j].used = true;
      }
    }

    if (group.length === 1) {
      results.push({
        isCluster: false,
        sensor: group[0].sensor,
        x: group[0].pos.x,
        y: group[0].pos.y,
      });
    } else {
      const sensorsInGroup = group.map(g => g.sensor);
      const avgX = group.reduce((sum, g) => sum + g.pos.x, 0) / group.length;
      const avgY = group.reduce((sum, g) => sum + g.pos.y, 0) / group.length;
      
      const criticalCount = sensorsInGroup.filter(s => s.status === 'critical').length;
      const warningCount = sensorsInGroup.filter(s => s.status === 'warning').length;
      const nominalCount = sensorsInGroup.filter(s => s.status === 'nominal').length;

      const worstStatus = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'nominal';
      const sectors = Array.from(new Set(sensorsInGroup.map(s => s.sector)));
      const sectorSummary = sectors.length === 1 ? sectors[0] : `${sectors.length} Sectors (${sectors.join(', ')})`;

      results.push({
        id: `cluster-${i}-${group.length}`,
        isCluster: true,
        x: Math.round(avgX * 10) / 10,
        y: Math.round(avgY * 10) / 10,
        sensors: sensorsInGroup,
        count: group.length,
        worstStatus,
        criticalCount,
        warningCount,
        nominalCount,
        sectorSummary,
      });
    }
  }

  return results;
}

interface MapCanvasProps {
  sensors: SensorData[];
  reports: IncidentReport[];
  activeLayer: string;
  onSelectLayer?: (layerId: string) => void;
  onSelectSensor: (sensor: SensorData) => void;
  onSelectReport: (report: IncidentReport) => void;
  selectedSensor?: SensorData | null;
  selectedReport?: IncidentReport | null;
  isAdmin?: boolean;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  sensors,
  reports,
  activeLayer,
  onSelectLayer,
  onSelectSensor,
  onSelectReport,
  selectedSensor,
  selectedReport,
  isAdmin = false,
}) => {
  // ================= HIERARCHICAL ZOOM STATE MANAGER =================
  const [hierarchyLevel, setHierarchyLevel] = useState<MapHierarchyLevel>('regional');
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapStyle, setMapStyle] = useState<'scanned' | 'tactical' | 'satellite' | 'heatmap'>('scanned');
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  
  // Scanned Map Layer Sub-Toggles
  const [showScannedContours, setShowScannedContours] = useState(true);
  const [showScannedFaults, setShowScannedFaults] = useState(true);
  const [showScannedRivers, setShowScannedRivers] = useState(true);
  const [showScannedGrid, setShowScannedGrid] = useState(true);
  const [showScannedHypsometric, setShowScannedHypsometric] = useState(true);

  // ================= LAYER OPACITY & TRANSPARENCY CONTROLS =================
  const [showOpacityControls, setShowOpacityControls] = useState(false);
  const [layerOpacities, setLayerOpacities] = useState({
    weather: 85,
    riskZones: 80,
    sensors: 100,
    terrain: 75,
    scannedMap: 100,
  });

  // Track previous opacity values before mute
  const [prevOpacities, setPrevOpacities] = useState({
    weather: 85,
    riskZones: 80,
    sensors: 100,
    terrain: 75,
    scannedMap: 100,
  });

  const updateLayerOpacity = (layer: keyof typeof layerOpacities, value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setLayerOpacities((prev) => ({
      ...prev,
      [layer]: clamped,
    }));
    if (clamped > 0) {
      setPrevOpacities((prev) => ({
        ...prev,
        [layer]: clamped,
      }));
    }
  };

  const toggleLayerMute = (layer: keyof typeof layerOpacities) => {
    setLayerOpacities((prev) => {
      if (prev[layer] > 0) {
        return { ...prev, [layer]: 0 };
      } else {
        return { ...prev, [layer]: prevOpacities[layer] > 0 ? prevOpacities[layer] : 80 };
      }
    });
  };

  const applyOpacityPreset = (preset: 'balanced' | 'weather' | 'risk' | 'sensors' | 'reset') => {
    if (preset === 'balanced') {
      setLayerOpacities({ weather: 65, riskZones: 65, sensors: 100, terrain: 60, scannedMap: 80 });
    } else if (preset === 'weather') {
      setLayerOpacities({ weather: 100, riskZones: 35, sensors: 90, terrain: 40, scannedMap: 60 });
    } else if (preset === 'risk') {
      setLayerOpacities({ weather: 30, riskZones: 100, sensors: 100, terrain: 40, scannedMap: 50 });
    } else if (preset === 'sensors') {
      setLayerOpacities({ weather: 30, riskZones: 40, sensors: 100, terrain: 30, scannedMap: 70 });
    } else if (preset === 'reset') {
      setLayerOpacities({ weather: 85, riskZones: 80, sensors: 100, terrain: 75, scannedMap: 100 });
    }
  };

  const isAnyOpacityCustomized = useMemo(() => {
    return (
      layerOpacities.weather !== 85 ||
      layerOpacities.riskZones !== 80 ||
      layerOpacities.sensors !== 100 ||
      layerOpacities.terrain !== 75 ||
      layerOpacities.scannedMap !== 100
    );
  }, [layerOpacities]);
  
  const [inspectItem, setInspectItem] = useState<{ 
    type: 'sensor' | 'cluster' | 'report' | 'history' | 'terrain' | 'weather' | 'state' | 'district' | 'fault'; 
    data: any 
  } | null>(null);

  const [sensorFilter, setSensorFilter] = useState<'all' | 'piezometer' | 'inclinometer' | 'moisture' | 'rain_gauge' | 'seismometer'>('all');
  const [radarRotation, setRadarRotation] = useState(0);

  // Derive active State and District objects from hierarchical data
  const activeState = useMemo(() => {
    return NER_STATES_DATA.find((s) => s.id === selectedStateId) || null;
  }, [selectedStateId]);

  const activeDistrict = useMemo(() => {
    if (!activeState || !selectedDistrictId) return null;
    return activeState.monitoredDistricts.find((d) => d.id === selectedDistrictId) || null;
  }, [activeState, selectedDistrictId]);

  // Animate weather radar sweep
  useEffect(() => {
    if (activeLayer === 'weather') {
      const timer = setInterval(() => {
        setRadarRotation((r) => (r + 4) % 360);
      }, 50);
      return () => clearInterval(timer);
    }
  }, [activeLayer]);

  // ================= HIERARCHICAL DRILL-DOWN LOGIC =================
  const handleDrillDownToState = (state: NERStateInfo) => {
    setSelectedStateId(state.id);
    setSelectedDistrictId(null);
    setHierarchyLevel('state');
    setZoomLevel(1.5);

    // Calculate pan offset to focus on state center
    const coords = getCanvasCoordsFromGeo(state.lat, state.lng);
    const offsetX = (50 - coords.x) * 0.8;
    const offsetY = (50 - coords.y) * 0.8;
    setPanOffset({ x: offsetX, y: offsetY });
  };

  const handleDrillDownToDistrict = (district: NERDistrictInfo, state: NERStateInfo) => {
    setSelectedStateId(state.id);
    setSelectedDistrictId(district.id);
    setHierarchyLevel('district');
    setZoomLevel(2.0);

    const coords = getCanvasCoordsFromGeo(district.lat, district.lng);
    const offsetX = (50 - coords.x) * 1.4;
    const offsetY = (50 - coords.y) * 1.4;
    setPanOffset({ x: offsetX, y: offsetY });
  };

  const handleResetToRegional = () => {
    setSelectedStateId(null);
    setSelectedDistrictId(null);
    setHierarchyLevel('regional');
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setInspectItem(null);
  };

  // Zoom In / Out Handlers with Auto-Hierarchy Transition
  const handleZoomIn = () => {
    setZoomLevel((currentZoom) => {
      const nextZoom = Math.min(+(currentZoom + 0.25).toFixed(2), 2.4);
      if (nextZoom >= 1.85 && hierarchyLevel !== 'district') {
        setHierarchyLevel('district');
      } else if (nextZoom >= 1.35 && hierarchyLevel === 'regional') {
        setHierarchyLevel('state');
        if (!selectedStateId) {
          setSelectedStateId('assam');
        }
      }
      return nextZoom;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel((currentZoom) => {
      const nextZoom = Math.max(+(currentZoom - 0.25).toFixed(2), 0.8);
      if (nextZoom < 1.35 && hierarchyLevel !== 'regional') {
        setHierarchyLevel('regional');
        setSelectedStateId(null);
        setSelectedDistrictId(null);
        setPanOffset({ x: 0, y: 0 });
      } else if (nextZoom < 1.85 && hierarchyLevel === 'district') {
        setHierarchyLevel('state');
        setSelectedDistrictId(null);
      }
      return nextZoom;
    });
  };

  // ================= PIN FILTERING BASED ON CURRENT DRILL-DOWN LEVEL =================
  // 1. Regional Level: We hide raw individual pins to maintain clean visual density, displaying State Summary Hubs instead.
  // 2. State Level: We display only sensors and district clusters for the selected state.
  // 3. District Level: We display granular, high-precision individual telemetry nodes for the selected district.

  const visibleSensors = useMemo(() => {
    let result = sensors;

    if (sensorFilter !== 'all') {
      result = result.filter((s) => s.type === sensorFilter);
    }

    if (hierarchyLevel === 'regional') {
      return result.filter((s) => s.status === 'critical' || s.id === 'NER-NODE-01' || s.id === 'NER-PZ-03' || s.id === 'NER-INC-02');
    }

    if (hierarchyLevel === 'state' && selectedStateId) {
      const stateObj = NER_STATES_DATA.find((s) => s.id === selectedStateId);
      if (stateObj) {
        return result.filter((s) => {
          const sState = (s.state || '').toLowerCase();
          const targetName = stateObj.name.toLowerCase();
          return sState.includes(targetName) || targetName.includes(sState) || (s.sector && s.sector.toLowerCase().includes(targetName));
        });
      }
    }

    if (hierarchyLevel === 'district' && selectedDistrictId && activeDistrict) {
      const dName = activeDistrict.name.toLowerCase();
      return result.filter((s) => {
        const sArea = (s.area || '').toLowerCase();
        const sSector = (s.sector || '').toLowerCase();
        return sArea.includes(dName) || sSector.includes(dName) || activeDistrict.areas.some(a => sArea.includes(a.toLowerCase()) || sSector.includes(a.toLowerCase()));
      });
    }

    return result;
  }, [sensors, sensorFilter, hierarchyLevel, selectedStateId, selectedDistrictId, activeDistrict]);

  // Compute clustered sensors for active layer
  const clusteredSensors = useMemo(() => {
    return clusterSensors(visibleSensors, zoomLevel, clusteringEnabled);
  }, [visibleSensors, zoomLevel, clusteringEnabled]);

  // Active Cluster Count
  const activeClusterCount = useMemo(() => {
    return clusteredSensors.filter((item) => item.isCluster).length;
  }, [clusteredSensors]);

  // Historical events data
  const historicalEvents: HistoricalLandslideEvent[] = INITIAL_HISTORICAL_EVENTS;

  // Layer metadata
  const layerMeta: Record<string, { label: string; icon: any; color: string; desc: string }> = {
    terrain: {
      label: 'Terrain Layers',
      icon: Layers,
      color: 'bg-emerald-700 text-white',
      desc: 'Topographic Contours, Slope Gradient Angle (DEM), & Bedrock Geology',
    },
    sensors: {
      label: 'Sensor Data',
      icon: Radio,
      color: 'bg-blue-700 text-white',
      desc: 'Live Geotechnical Telemetry Mesh, Inclinometer Arrays, & Piezometers',
    },
    weather: {
      label: 'Weather Overlay',
      icon: CloudRain,
      color: 'bg-cyan-700 text-white',
      desc: 'Real-Time Doppler Precipitation Radar, Isobars, & Wind Flow Vectors',
    },
    risk_zones: {
      label: 'Risk Zones',
      icon: AlertTriangle,
      color: 'bg-red-700 text-white',
      desc: 'Geotechnical Hazard Zoning, Liquefaction Susceptibility, & Runout Vectors',
    },
    history: {
      label: 'Historical Events',
      icon: History,
      color: 'bg-purple-800 text-white',
      desc: 'Past Landslide Ruptures, Slide Scars, Volume Extents, & Engineered Mitigations',
    },
  };

  const currentLayerInfo = layerMeta[activeLayer] || layerMeta.risk_zones;
  const CurrentLayerIcon = currentLayerInfo.icon;

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#0e1626] text-stone-900 font-sans">
      
      {/* ================= TOP HIERARCHICAL BREADCRUMB & DENSITY BAR ================= */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-stone-300 shadow-md">
        
        {/* Official Breadcrumb Trail */}
        <div className="flex items-center gap-1 text-xs font-mono">
          <button
            onClick={handleResetToRegional}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-bold ${
              hierarchyLevel === 'regional'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>North Eastern Region (NER)</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />

          {/* State Level Selector / Breadcrumb */}
          <div className="relative">
            <select
              value={selectedStateId || ''}
              onChange={(e) => {
                const sId = e.target.value;
                if (!sId) {
                  handleResetToRegional();
                } else {
                  const state = NER_STATES_DATA.find((s) => s.id === sId);
                  if (state) handleDrillDownToState(state);
                }
              }}
              className={`text-xs font-bold py-1 px-2.5 rounded-md border appearance-none pr-6 cursor-pointer transition-colors ${
                hierarchyLevel === 'state'
                  ? 'bg-blue-900 text-white border-blue-950 shadow-xs'
                  : selectedStateId
                  ? 'bg-stone-100 text-stone-900 border-stone-300'
                  : 'bg-stone-50 text-stone-500 border-stone-200'
              }`}
            >
              <option value="">All States (7)</option>
              {NER_STATES_DATA.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.monitoredDistricts.length} Districts)
                </option>
              ))}
            </select>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />

          {/* District Level Selector / Breadcrumb */}
          <div className="relative">
            <select
              value={selectedDistrictId || ''}
              disabled={!selectedStateId}
              onChange={(e) => {
                const dId = e.target.value;
                if (!dId) {
                  if (activeState) handleDrillDownToState(activeState);
                } else if (activeState) {
                  const dist = activeState.monitoredDistricts.find((d) => d.id === dId);
                  if (dist) handleDrillDownToDistrict(dist, activeState);
                }
              }}
              className={`text-xs font-bold py-1 px-2.5 rounded-md border appearance-none pr-6 cursor-pointer transition-colors ${
                hierarchyLevel === 'district'
                  ? 'bg-blue-900 text-white border-blue-950 shadow-xs'
                  : selectedDistrictId
                  ? 'bg-stone-100 text-stone-900 border-stone-300'
                  : 'bg-stone-50 text-stone-400 border-stone-200 disabled:opacity-50'
              }`}
            >
              <option value="">
                {selectedStateId ? 'All Districts' : 'Select State First'}
              </option>
              {activeState?.monitoredDistricts.map((dst) => (
                <option key={dst.id} value={dst.id}>
                  {dst.name} ({dst.activeSensorsCount} Nodes)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Level Indicator Badges & Density Status */}
        <div className="flex items-center gap-2">
          {/* Visual Density Meter */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-[11px] font-mono border border-stone-200">
            <span className="font-semibold text-stone-500 uppercase text-[9px]">Map Density:</span>
            <span className="font-bold text-blue-900">
              {hierarchyLevel === 'regional' && '7 State Summary Hubs'}
              {hierarchyLevel === 'state' && `${activeState?.monitoredDistricts.length || 0} Districts • Clean Density`}
              {hierarchyLevel === 'district' && `${visibleSensors.length} Granular Telemetry Probes`}
            </span>
          </div>

          {/* Level Switcher Segmented Pills */}
          <div className="flex items-center bg-stone-200/80 p-0.5 rounded-lg border border-stone-300 text-[11px] font-mono">
            <button
              onClick={handleResetToRegional}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                hierarchyLevel === 'regional'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-black'
              }`}
            >
              L1: Regional
            </button>
            <button
              onClick={() => {
                if (activeState) {
                  handleDrillDownToState(activeState);
                } else {
                  handleDrillDownToState(NER_STATES_DATA[0]);
                }
              }}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                hierarchyLevel === 'state'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-black'
              }`}
            >
              L2: State
            </button>
            <button
              onClick={() => {
                if (activeState && activeDistrict) {
                  handleDrillDownToDistrict(activeDistrict, activeState);
                } else if (activeState && activeState.monitoredDistricts.length > 0) {
                  handleDrillDownToDistrict(activeState.monitoredDistricts[0], activeState);
                } else {
                  handleDrillDownToDistrict(NER_STATES_DATA[0].monitoredDistricts[0], NER_STATES_DATA[0]);
                }
              }}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                hierarchyLevel === 'district'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-black'
              }`}
            >
              L3: District
            </button>
          </div>
        </div>
      </div>

      {/* ================= MAP CANVAS CONTAINER (SCALABLE & PANNABLE) ================= */}
      <div 
        className={`absolute inset-0 transition-all duration-500 ease-out ${
          mapStyle === 'satellite' 
            ? 'bg-cover bg-center' 
            : mapStyle === 'scanned' 
            ? 'bg-[#e8e2cf]' 
            : 'map-grid-bg'
        }`}
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x}%, ${panOffset.y}%)`,
          backgroundImage: mapStyle === 'satellite' ? `url(${HOTLINKED_IMAGES.mapAerialBg})` : undefined,
          transformOrigin: 'center center',
        }}
      >

        {/* ================= AUTHENTIC NER SCANNED MAP LAYER (GSI / SOI TOPO SCAN) ================= */}
        {mapStyle === 'scanned' && (
          <div 
            className="absolute inset-0 transition-opacity duration-150"
            style={{ opacity: layerOpacities.scannedMap / 100 }}
          >
            <NERScannedMapLayer
              hierarchyLevel={hierarchyLevel}
              activeState={activeState}
              activeDistrict={activeDistrict}
              showContours={showScannedContours}
              showFaults={showScannedFaults}
              showRivers={showScannedRivers}
              showGrid={showScannedGrid}
              showHypsometric={showScannedHypsometric}
              onSelectFault={(fault) => setInspectItem({ type: 'fault', data: fault })}
              onDrillDownToState={handleDrillDownToState}
              onDrillDownToDistrict={handleDrillDownToDistrict}
            />
          </div>
        )}

        {/* ================= BASE TOPOGRAPHIC CONTOURS FOR TACTICAL / SATELLITE MODE ================= */}
        {mapStyle !== 'scanned' && (
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none stroke-[#8c8890] transition-opacity duration-150" 
            style={{ opacity: (layerOpacities.terrain / 100) * 0.4 }}
            fill="none"
          >
            <ellipse cx="48%" cy="40%" rx="360" ry="260" strokeWidth="1" strokeDasharray="4,4" />
            <ellipse cx="48%" cy="40%" rx="280" ry="190" strokeWidth="1.2" />
            <ellipse cx="48%" cy="40%" rx="190" ry="130" strokeWidth="1.5" />
            <ellipse cx="48%" cy="40%" rx="110" ry="75" strokeWidth="1.8" stroke="#dc2626" strokeOpacity="0.4" />
            <path d="M 60,180 Q 280,330 680,260 T 1200,430" strokeWidth="1" />
            <path d="M 40,230 Q 300,380 700,310 T 1220,480" strokeWidth="1.2" />
            <path d="M 20,310 Q 340,460 740,390 T 1260,560" strokeWidth="1" />
          </svg>
        )}

        {/* ================= LEVEL 1: REGIONAL STATE SUMMARY HUBS (CLEAN DENSITY) ================= */}
        {hierarchyLevel === 'regional' && (
          <div 
            className="absolute inset-0 z-20 pointer-events-auto transition-opacity duration-150"
            style={{ opacity: layerOpacities.sensors / 100 }}
          >
            {NER_STATES_DATA.map((st) => {
              const coords = getCanvasCoordsFromGeo(st.lat, st.lng);
              const isCritical = st.highestRiskTier === 3;
              const isWarning = st.highestRiskTier === 2;

              return (
                <div
                  key={st.id}
                  style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDrillDownToState(st);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-transform hover:scale-110"
                >
                  <div className={`p-2.5 rounded-xl border shadow-xl backdrop-blur-md transition-all min-w-[170px] ${
                    isCritical
                      ? 'bg-white/95 border-red-500 ring-2 ring-red-400/50'
                      : isWarning
                      ? 'bg-white/95 border-amber-400 ring-1 ring-amber-300/40'
                      : 'bg-white/90 border-stone-300'
                  }`}>
                    {/* Header: State Name & Warning Code */}
                    <div className="flex items-center justify-between gap-1 border-b border-stone-200 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-900" />
                        <span className="font-bold text-xs text-stone-900">{st.name}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isCritical
                          ? 'bg-red-600 text-white'
                          : isWarning
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        Level {st.highestRiskTier}
                      </span>
                    </div>

                    {/* Meta stats */}
                    <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px] font-mono text-stone-600">
                      <div>
                        <span className="text-stone-500 block text-[8px] uppercase">Districts</span>
                        <span className="font-bold text-stone-800">{st.monitoredDistricts.length} Monitored</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[8px] uppercase">Sensors</span>
                        <span className="font-bold text-blue-900">{st.activeSensorsCount} Active Nodes</span>
                      </div>
                    </div>

                    {/* Drill-down action prompt */}
                    <div className="mt-2 pt-1 border-t border-stone-100 flex items-center justify-between text-[10px] text-blue-800 font-bold group-hover:text-blue-950">
                      <span>Click to Drill-Down</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= LEVEL 2: STATE SECTORS & DISTRICT HUBS ================= */}
        {hierarchyLevel === 'state' && activeState && (
          <div 
            className="absolute inset-0 z-20 pointer-events-auto transition-opacity duration-150"
            style={{ opacity: layerOpacities.sensors / 100 }}
          >
            {/* Active State Focus Banner */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 bg-blue-950 text-white px-4 py-1.5 rounded-full border border-blue-400/40 shadow-lg font-mono text-xs flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>STATE SECTOR: {activeState.name.toUpperCase()}</span>
              <span className="text-blue-300 text-[11px]">({activeState.monitoredDistricts.length} Monitored Districts)</span>
            </div>

            {/* Render District Nodes within the selected state */}
            {activeState.monitoredDistricts.map((dist) => {
              const coords = getCanvasCoordsFromGeo(dist.lat, dist.lng);
              const isCrit = dist.highestRiskTier === 3;
              const isWarn = dist.highestRiskTier === 2;

              return (
                <div
                  key={dist.id}
                  style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDrillDownToDistrict(dist, activeState);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-transform hover:scale-110"
                >
                  <div className={`p-3 rounded-xl border shadow-xl backdrop-blur-md transition-all min-w-[200px] max-w-[240px] ${
                    isCrit
                      ? 'bg-white/95 border-red-500 ring-2 ring-red-400'
                      : isWarn
                      ? 'bg-white/95 border-amber-400 ring-1 ring-amber-300'
                      : 'bg-white/95 border-blue-300'
                  }`}>
                    <div className="flex items-center justify-between gap-1 border-b border-stone-200 pb-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        <span className="font-bold text-xs text-stone-900">{dist.name}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isCrit ? 'bg-red-600 text-white' : isWarn ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        Tier {dist.highestRiskTier}
                      </span>
                    </div>

                    <p className="text-[10px] text-stone-600 mt-1.5 leading-snug line-clamp-2">
                      {dist.primaryHazard}
                    </p>

                    <div className="mt-2 bg-stone-50 p-1.5 rounded text-[9px] font-mono text-stone-700 border border-stone-200">
                      <span className="text-stone-500 block">Active Micro-Catchments:</span>
                      <span className="font-bold text-blue-900 truncate block">
                        {dist.areas.join(', ')}
                      </span>
                    </div>

                    <div className="mt-2 pt-1 border-t border-stone-100 flex items-center justify-between text-[10px] text-blue-800 font-bold">
                      <span>Zoom to Telemetry</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= LEVEL 3: GRANULAR INDIVIDUAL TELEMETRY PINS ================= */}
        {hierarchyLevel === 'district' && (
          <div 
            className="absolute inset-0 z-20 pointer-events-auto transition-opacity duration-150"
            style={{ opacity: layerOpacities.sensors / 100 }}
          >
            {/* Active District Focus Badge */}
            {activeDistrict && (
              <div className="absolute top-[8%] left-1/2 -translate-x-1/2 bg-blue-950 text-white px-3.5 py-1.5 rounded-full border border-blue-400/40 shadow-lg font-mono text-xs flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>DISTRICT TELEMETRY: {activeDistrict.name.toUpperCase()} ({activeState?.name})</span>
              </div>
            )}

            {/* Individual Granular Telemetry Pins (NO HARDWARE DEVICE IDs IN USER-FACING LABELS) */}
            {clusteredSensors.map((item) => {
              if (item.isCluster) {
                const isCrit = item.worstStatus === 'critical';
                const isWarn = item.worstStatus === 'warning';

                return (
                  <div
                    key={item.id}
                    style={{ top: `${item.y}%`, left: `${item.x}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectItem({ type: 'cluster', data: item });
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-30 transition-transform hover:scale-115"
                  >
                    <div className={`relative flex items-center justify-center rounded-full shadow-2xl transition-all ${
                      isCrit 
                        ? 'w-11 h-11 bg-red-600 text-white ring-4 ring-red-400/60 animate-pulse' 
                        : isWarn 
                        ? 'w-10 h-10 bg-amber-500 text-white ring-4 ring-amber-300/60' 
                        : 'w-9 h-9 bg-emerald-600 text-white ring-4 ring-emerald-300/60'
                    }`}>
                      {isCrit && (
                        <div className="absolute -inset-2 rounded-full border-2 border-red-500 scale-125 animate-ping opacity-75 pointer-events-none" />
                      )}
                      <div className="flex flex-col items-center justify-center leading-none">
                        <span className="font-extrabold font-mono text-xs">{item.count}</span>
                        <span className="text-[6px] font-bold uppercase -mt-0.5">PROBES</span>
                      </div>
                    </div>

                    <div className="mt-1 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded border border-stone-300 shadow-md flex items-center gap-1">
                      <span className="font-mono text-[10px] font-bold text-stone-800">
                        {item.count} Telemetry Probes
                      </span>
                    </div>
                  </div>
                );
              }

              // Individual Sensor Marker: STRICT MANDATE - SHOW AREA NAME, NO RAW DEVICE IDs
              const s = item.sensor;
              const isCrit = s.status === 'critical';
              const isWarn = s.status === 'warning';
              const areaDisplayName = s.area || s.name;

              return (
                <div
                  key={s.id}
                  style={{ top: `${item.y}%`, left: `${item.x}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSensor(s);
                    setInspectItem({ type: 'sensor', data: s });
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-30 transition-transform hover:scale-110"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white relative ${
                    isCrit 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : isWarn 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-emerald-600 text-white'
                  }`}>
                    <Radio className="w-4 h-4" />
                    {isCrit && (
                      <div className="absolute -inset-1.5 rounded-full border-2 border-red-500 scale-125 animate-ping opacity-75 pointer-events-none" />
                    )}
                  </div>
                  
                  {/* Clean Assessment Card - Area Name & Physical Telemetry Only */}
                  <div className="mt-1 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-stone-300 shadow-md flex flex-col items-center min-w-[110px] max-w-[150px]">
                    <div className="flex items-center gap-1 font-bold text-[10px] text-stone-900 truncate w-full text-center justify-center">
                      <span className="truncate">{areaDisplayName}</span>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isCrit ? 'bg-red-600' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    </div>
                    
                    <span className="font-mono text-[10px] font-bold text-blue-900 mt-0.5">
                      {s.value} {s.unit}
                    </span>

                    <div className="flex gap-1.5 text-[8px] font-mono text-stone-600 border-t border-stone-200 mt-1 pt-0.5 w-full justify-between">
                      <span>💧 {s.soilMoisture ?? 65}%</span>
                      <span>🌧️ {s.rainfallMm ?? 25}mm</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= LAYER 1: TERRAIN LAYERS (Contour Elevation, DEM, Bedrock) ================= */}
        {activeLayer === 'terrain' && (
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-150"
            style={{ opacity: layerOpacities.terrain / 100 }}
          >
            <div 
              className="absolute top-[24%] left-[40%] w-[320px] h-[220px] rounded-[40px] bg-red-600/20 blur-[25px]"
              style={{ mixBlendMode: 'multiply' }}
            />
            <div 
              className="absolute top-[48%] left-[58%] w-[260px] h-[180px] rounded-[30px] bg-amber-500/20 blur-[20px]"
              style={{ mixBlendMode: 'multiply' }}
            />
            <div 
              className="absolute top-[16%] left-[20%] w-[280px] h-[200px] rounded-[30px] bg-emerald-500/20 blur-[25px]"
              style={{ mixBlendMode: 'multiply' }}
            />

            <svg className="absolute inset-0 w-full h-full stroke-emerald-900/70 pointer-events-auto" fill="none">
              <ellipse cx="48%" cy="38%" rx="340" ry="240" strokeWidth="1.5" strokeDasharray="3,3" />
              <ellipse cx="48%" cy="38%" rx="260" ry="180" strokeWidth="2" stroke="#059669" />
              <ellipse cx="48%" cy="38%" rx="180" ry="120" strokeWidth="2.5" stroke="#b45309" />
              <ellipse cx="48%" cy="38%" rx="100" ry="65" strokeWidth="3" stroke="#dc2626" />
              <path d="M 320,160 L 520,240 L 780,210 L 980,310" stroke="#b91c1c" strokeWidth="3.5" strokeDasharray="8,4" />
            </svg>

            <div className="absolute top-[37%] left-[47%] pointer-events-auto cursor-pointer font-mono text-[10px] font-extrabold bg-red-700 text-white px-2 py-0.5 rounded shadow"
                 onClick={() => setInspectItem({ 
                   type: 'terrain', 
                   data: { title: 'Shillong Plateau / Sohra Crest', elevation: '1,420 m', slope: '41.5° (High Pluvial Shear Risk)', geology: 'Shillong Group Quartzite & Karstified Sandstone', stability: 'Extreme rainfall pluvial saturation zone' } 
                 })}>
              +1,420m (Plateau)
            </div>
          </div>
        )}

        {/* ================= LAYER 2: SENSOR MESH RADIO LINKS ================= */}
        {activeLayer === 'sensors' && (
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-150"
            style={{ opacity: layerOpacities.sensors / 100 }}
          >
            <svg className="absolute inset-0 w-full h-full stroke-blue-500/30" strokeWidth="1.5" strokeDasharray="4,4">
              {clusteredSensors.map((item, i) => (
                <line 
                  key={`link-${i}`}
                  x1="50%" 
                  y1="45%" 
                  x2={`${item.x}%`} 
                  y2={`${item.y}%`} 
                />
              ))}
            </svg>
          </div>
        )}

        {/* ================= LAYER 3: WEATHER OVERLAY (Doppler Rain Radar, Wind) ================= */}
        {activeLayer === 'weather' && (
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-150"
            style={{ opacity: layerOpacities.weather / 100 }}
          >
            <div 
              className="absolute top-[38%] left-[48%] w-[420px] h-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/40 pointer-events-none"
              style={{
                background: `conic-gradient(from ${radarRotation}deg at 50% 50%, rgba(6, 182, 212, 0) 0deg, rgba(6, 182, 212, 0.28) 50deg, rgba(6, 182, 212, 0) 55deg)`
              }}
            />
            <div 
              className="absolute top-[22%] left-[36%] w-[380px] h-[280px] rounded-[60px] bg-purple-700/35 blur-[35px] animate-pulse"
              style={{ mixBlendMode: 'multiply' }}
            />
            <div 
              className="absolute top-[40%] left-[50%] w-[320px] h-[240px] rounded-[50px] bg-cyan-600/30 blur-[30px]"
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
        )}

        {/* ================= LAYER 4: RISK ZONES (Geotechnical Hazard Zoning) ================= */}
        {activeLayer === 'risk_zones' && (
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-150"
            style={{ opacity: layerOpacities.riskZones / 100 }}
          >
            <div 
              className="absolute top-[26%] left-[40%] w-[420px] h-[340px] rounded-full bg-red-600/30 blur-[45px] animate-pulse"
              style={{ mixBlendMode: 'multiply' }}
            />
            <div 
              className="absolute top-[50%] left-[58%] w-[320px] h-[260px] rounded-full bg-amber-500/25 blur-[35px]"
              style={{ mixBlendMode: 'multiply' }}
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-red-600" strokeWidth="3" strokeDasharray="8,4" fill="none">
              <path d="M 520,240 Q 600,320 680,380" markerEnd="url(#red-arrow)" />
              <path d="M 480,260 Q 540,360 620,440" markerEnd="url(#red-arrow)" />
              <defs>
                <marker id="red-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
                </marker>
              </defs>
            </svg>
          </div>
        )}

        {/* ================= LAYER 5: HISTORICAL EVENTS ================= */}
        {activeLayer === 'history' && (
          <div 
            className="absolute inset-0 transition-opacity duration-150"
            style={{ opacity: layerOpacities.sensors / 100 }}
          >
            {historicalEvents.map((evt) => (
              <div
                key={evt.id}
                style={{ top: `${evt.yPercent}%`, left: `${evt.xPercent}%` }}
                onClick={() => setInspectItem({ type: 'history', data: evt })}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-30 transition-transform hover:scale-115"
              >
                <div className="w-9 h-9 rounded-full bg-purple-900 text-white flex items-center justify-center shadow-xl border-2 border-purple-300 relative group-hover:bg-purple-950">
                  <History className="w-4 h-4 text-purple-200" />
                  <div className="absolute -top-1 -right-1 bg-purple-500 text-white font-mono text-[8px] font-bold px-1 rounded-full border border-white">
                    {evt.year}
                  </div>
                </div>

                <div className="mt-1 bg-purple-950 text-white px-2 py-0.5 rounded shadow border border-purple-400/60 font-mono text-[10px] whitespace-nowrap flex items-center gap-1 group-hover:bg-black">
                  <span className="font-bold">{evt.year}: {evt.title}</span>
                  <span className="text-purple-300">({(evt.volumeM3 / 1000).toFixed(1)}k m³)</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HQ Central Telemetry Gateway Beacon */}
        <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 pointer-events-auto cursor-pointer"
             onClick={() => setInspectItem({
               type: 'sensor',
               data: { id: 'GW-ALPHA', name: 'NER Central Satellite & LoRaWAN Hub', type: 'Gateway Transceiver', value: 99.8, unit: '% Mesh Sync', threshold: 95.0, sector: 'Guwahati Dispur Node', batteryLevel: 100, signalDbm: -48, lastUpdated: 'Real-time sync', status: 'nominal', porePressure: 0 }
             })}>
          <div className="w-10 h-10 rounded-full bg-blue-950 text-white flex items-center justify-center shadow-xl border-2 border-white relative animate-pulse">
            <Radio className="w-5 h-5 text-amber-400" />
            <div className="absolute -inset-2 rounded-full border border-blue-400 scale-125 animate-ping opacity-60 pointer-events-none" />
          </div>
          <div className="mt-1 bg-blue-950 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow border border-blue-400/50">
            NER-HUB: GW-ALPHA
          </div>
        </div>

      </div>


      {/* ================= FLOATING MAP CONTROLS (BOTTOM LEFT) ================= */}
      <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-2 bg-white/95 backdrop-blur-xs p-1 rounded-xl border border-stone-300 shadow-md">
        <button 
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center text-stone-900 hover:bg-stone-100 rounded transition-colors"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="w-full h-px bg-stone-200" />
        <button 
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center text-stone-900 hover:bg-stone-100 rounded transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="w-full h-px bg-stone-200" />
        <button 
          onClick={handleResetToRegional}
          className="w-8 h-8 flex items-center justify-center text-stone-900 hover:bg-stone-100 rounded transition-colors"
          title="Reset to Regional Overview"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>


      {/* ================= FLOATING MAP STYLE & CLUSTERING CONTROLS (TOP RIGHT) ================= */}
      <div className="absolute top-16 right-4 z-30 flex items-center gap-1.5">
        {clusteringEnabled && activeClusterCount > 0 && hierarchyLevel === 'district' && (
          <div className="bg-blue-950/90 text-blue-100 text-[11px] font-mono px-2.5 py-1.5 rounded-lg border border-blue-400/40 shadow-md flex items-center gap-2 backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{activeClusterCount} Cluster{activeClusterCount > 1 ? 's' : ''} Active</span>
          </div>
        )}

        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-stone-300 shadow-sm">
          <button
            onClick={() => setClusteringEnabled(!clusteringEnabled)}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors ${
              clusteringEnabled ? 'bg-blue-800 text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Clustering: {clusteringEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <div className="w-px h-4 bg-stone-200 mx-0.5" />

          <button
            onClick={() => setMapStyle('scanned')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1 ${
              mapStyle === 'scanned' ? 'bg-[#5c4a30] text-[#f7f0dc] shadow-xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>NER Topo Scan</span>
          </button>
          <button
            onClick={() => setMapStyle('tactical')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
              mapStyle === 'tactical' ? 'bg-[#131b2e] text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Tactical GIS
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
              mapStyle === 'satellite' ? 'bg-[#131b2e] text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapStyle('heatmap')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
              mapStyle === 'heatmap' ? 'bg-red-700 text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Heatmap
          </button>
        </div>

        {/* Scanned Map Sub-Layer Toggles */}
        {mapStyle === 'scanned' && (
          <div className="flex items-center gap-1 bg-[#f4ebd5]/95 backdrop-blur-xs p-1 rounded-lg border border-[#8f7956] shadow-sm text-[10px] font-mono text-[#423118]">
            <button
              onClick={() => setShowScannedContours(!showScannedContours)}
              className={`px-1.5 py-0.5 rounded transition-all ${
                showScannedContours ? 'bg-[#705632] text-white font-bold' : 'text-[#705632] opacity-60 hover:opacity-100'
              }`}
              title="Toggle Topographic Contours"
            >
              Contours
            </button>
            <button
              onClick={() => setShowScannedFaults(!showScannedFaults)}
              className={`px-1.5 py-0.5 rounded transition-all ${
                showScannedFaults ? 'bg-red-800 text-white font-bold' : 'text-red-900 opacity-60 hover:opacity-100'
              }`}
              title="Toggle Geological Fault Lines"
            >
              Faults
            </button>
            <button
              onClick={() => setShowScannedRivers(!showScannedRivers)}
              className={`px-1.5 py-0.5 rounded transition-all ${
                showScannedRivers ? 'bg-[#2a668c] text-white font-bold' : 'text-[#2a668c] opacity-60 hover:opacity-100'
              }`}
              title="Toggle River Drainage Networks"
            >
              Rivers
            </button>
            <button
              onClick={() => setShowScannedGrid(!showScannedGrid)}
              className={`px-1.5 py-0.5 rounded transition-all ${
                showScannedGrid ? 'bg-[#52442d] text-white font-bold' : 'text-[#52442d] opacity-60 hover:opacity-100'
              }`}
              title="Toggle GSI Lat/Lng Coordinate Grid"
            >
              Grid
            </button>
            <button
              onClick={() => setShowScannedHypsometric(!showScannedHypsometric)}
              className={`px-1.5 py-0.5 rounded transition-all ${
                showScannedHypsometric ? 'bg-[#876e42] text-white font-bold' : 'text-[#876e42] opacity-60 hover:opacity-100'
              }`}
              title="Toggle Hypsometric Elevation Shading"
            >
              Relief
            </button>
          </div>
        )}
      </div>


      {/* ================= FLOATING LAYER SELECTOR & OPACITY CONTROLS (TOP LEFT) ================= */}
      <div className="absolute top-16 left-4 z-30 flex flex-col gap-2 max-w-lg">
        <div className="flex items-center gap-2">
          {onSelectLayer && (
            <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-stone-300 shadow-md flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => onSelectLayer('terrain')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeLayer === 'terrain'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Terrain</span>
              </button>

              <button
                onClick={() => onSelectLayer('sensors')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeLayer === 'sensors'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Sensors</span>
              </button>

              <button
                onClick={() => onSelectLayer('weather')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeLayer === 'weather'
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>Weather</span>
              </button>

              <button
                onClick={() => onSelectLayer('risk_zones')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeLayer === 'risk_zones'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Risk Zones</span>
              </button>

              <button
                onClick={() => onSelectLayer('history')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeLayer === 'history'
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </button>
            </div>
          )}

          {/* Layer Opacity Slider Popover Trigger */}
          <button
            onClick={() => setShowOpacityControls(!showOpacityControls)}
            className={`px-3 py-2 text-xs font-bold rounded-xl border shadow-md flex items-center gap-1.5 transition-all backdrop-blur-md shrink-0 ${
              showOpacityControls
                ? 'bg-blue-900 text-white border-blue-950 ring-2 ring-blue-400/40'
                : isAnyOpacityCustomized
                ? 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100'
                : 'bg-white/95 text-stone-800 border-stone-300 hover:bg-stone-50'
            }`}
            title="Adjust Layer Transparency & Opacities"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>Layer Opacity</span>
            {isAnyOpacityCustomized && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            )}
          </button>
        </div>

        {/* ================= LAYER OPACITY & TRANSPARENCY POPUP PANEL ================= */}
        {showOpacityControls && (
          <div className="bg-white/98 backdrop-blur-md p-4 rounded-2xl border border-stone-300 shadow-2xl w-96 max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 text-stone-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-stone-900">Layer Opacity & Transparency</h4>
                  <p className="text-[10px] text-stone-500">Adjust alpha blending for multi-layer correlation</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => applyOpacityPreset('reset')}
                  className="p-1 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded text-[10px] font-mono flex items-center gap-1"
                  title="Reset all opacities to default"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={() => setShowOpacityControls(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Multi-Layer Analysis Presets */}
            <div className="mb-3.5">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                Multi-Layer Analysis Presets
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => applyOpacityPreset('balanced')}
                  className="px-2 py-1 bg-stone-100 hover:bg-blue-50 hover:border-blue-300 border border-stone-200 rounded-lg text-[10px] font-semibold text-stone-700 text-left transition-colors flex items-center justify-between"
                >
                  <span>⚖️ Balanced Composite</span>
                  <span className="text-[9px] font-mono text-stone-500">65%</span>
                </button>
                <button
                  onClick={() => applyOpacityPreset('weather')}
                  className="px-2 py-1 bg-stone-100 hover:bg-cyan-50 hover:border-cyan-300 border border-stone-200 rounded-lg text-[10px] font-semibold text-stone-700 text-left transition-colors flex items-center justify-between"
                >
                  <span>🌧️ Rain / Weather Focus</span>
                  <span className="text-[9px] font-mono text-cyan-700">100%</span>
                </button>
                <button
                  onClick={() => applyOpacityPreset('risk')}
                  className="px-2 py-1 bg-stone-100 hover:bg-red-50 hover:border-red-300 border border-stone-200 rounded-lg text-[10px] font-semibold text-stone-700 text-left transition-colors flex items-center justify-between"
                >
                  <span>⚠️ Risk Iso-Zones</span>
                  <span className="text-[9px] font-mono text-red-700">100%</span>
                </button>
                <button
                  onClick={() => applyOpacityPreset('sensors')}
                  className="px-2 py-1 bg-stone-100 hover:bg-blue-50 hover:border-blue-300 border border-stone-200 rounded-lg text-[10px] font-semibold text-stone-700 text-left transition-colors flex items-center justify-between"
                >
                  <span>📡 Sensor Telemetry</span>
                  <span className="text-[9px] font-mono text-blue-700">100%</span>
                </button>
              </div>
            </div>

            {/* Individual Layer Sliders */}
            <div className="space-y-3 pt-1 border-t border-stone-100">
              {/* 1. Weather Radar & Precipitation */}
              <div className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/90 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-cyan-600" />
                    <span className="text-xs font-bold text-stone-800">Weather & Radar</span>
                    {activeLayer === 'weather' && (
                      <span className="text-[9px] font-mono bg-cyan-100 text-cyan-800 font-bold px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleLayerMute('weather')}
                      className={`p-1 rounded transition-colors ${
                        layerOpacities.weather === 0
                          ? 'bg-stone-200 text-stone-500'
                          : 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
                      }`}
                      title={layerOpacities.weather === 0 ? 'Unmute layer' : 'Mute layer'}
                    >
                      {layerOpacities.weather === 0 ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </button>
                    <span className="font-mono text-xs font-bold text-cyan-900 w-10 text-right">
                      {layerOpacities.weather}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={layerOpacities.weather}
                    onChange={(e) => updateLayerOpacity('weather', Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                </div>

                {/* Quick Step Buttons */}
                <div className="flex justify-between text-[9px] font-mono text-stone-500 pt-0.5">
                  <button onClick={() => updateLayerOpacity('weather', 0)} className="hover:text-cyan-700">0%</button>
                  <button onClick={() => updateLayerOpacity('weather', 25)} className="hover:text-cyan-700">25%</button>
                  <button onClick={() => updateLayerOpacity('weather', 50)} className="hover:text-cyan-700">50%</button>
                  <button onClick={() => updateLayerOpacity('weather', 75)} className="hover:text-cyan-700">75%</button>
                  <button onClick={() => updateLayerOpacity('weather', 100)} className="hover:text-cyan-700 font-bold">100%</button>
                </div>
              </div>

              {/* 2. Risk Zones & Iso-Hazard Contours */}
              <div className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/90 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-xs font-bold text-stone-800">Risk & Hazard Zones</span>
                    {activeLayer === 'risk_zones' && (
                      <span className="text-[9px] font-mono bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleLayerMute('riskZones')}
                      className={`p-1 rounded transition-colors ${
                        layerOpacities.riskZones === 0
                          ? 'bg-stone-200 text-stone-500'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                      title={layerOpacities.riskZones === 0 ? 'Unmute layer' : 'Mute layer'}
                    >
                      {layerOpacities.riskZones === 0 ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </button>
                    <span className="font-mono text-xs font-bold text-red-900 w-10 text-right">
                      {layerOpacities.riskZones}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={layerOpacities.riskZones}
                    onChange={(e) => updateLayerOpacity('riskZones', Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>

                {/* Quick Step Buttons */}
                <div className="flex justify-between text-[9px] font-mono text-stone-500 pt-0.5">
                  <button onClick={() => updateLayerOpacity('riskZones', 0)} className="hover:text-red-700">0%</button>
                  <button onClick={() => updateLayerOpacity('riskZones', 25)} className="hover:text-red-700">25%</button>
                  <button onClick={() => updateLayerOpacity('riskZones', 50)} className="hover:text-red-700">50%</button>
                  <button onClick={() => updateLayerOpacity('riskZones', 75)} className="hover:text-red-700">75%</button>
                  <button onClick={() => updateLayerOpacity('riskZones', 100)} className="hover:text-red-700 font-bold">100%</button>
                </div>
              </div>

              {/* 3. Sensors & Probes Telemetry */}
              <div className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/90 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-stone-800">Sensors & Mesh Telemetry</span>
                    {activeLayer === 'sensors' && (
                      <span className="text-[9px] font-mono bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleLayerMute('sensors')}
                      className={`p-1 rounded transition-colors ${
                        layerOpacities.sensors === 0
                          ? 'bg-stone-200 text-stone-500'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                      title={layerOpacities.sensors === 0 ? 'Unmute layer' : 'Mute layer'}
                    >
                      {layerOpacities.sensors === 0 ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </button>
                    <span className="font-mono text-xs font-bold text-blue-900 w-10 text-right">
                      {layerOpacities.sensors}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={layerOpacities.sensors}
                    onChange={(e) => updateLayerOpacity('sensors', Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Quick Step Buttons */}
                <div className="flex justify-between text-[9px] font-mono text-stone-500 pt-0.5">
                  <button onClick={() => updateLayerOpacity('sensors', 0)} className="hover:text-blue-700">0%</button>
                  <button onClick={() => updateLayerOpacity('sensors', 25)} className="hover:text-blue-700">25%</button>
                  <button onClick={() => updateLayerOpacity('sensors', 50)} className="hover:text-blue-700">50%</button>
                  <button onClick={() => updateLayerOpacity('sensors', 75)} className="hover:text-blue-700">75%</button>
                  <button onClick={() => updateLayerOpacity('sensors', 100)} className="hover:text-blue-700 font-bold">100%</button>
                </div>
              </div>

              {/* 4. Terrain & Elevation Contours */}
              <div className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/90 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-stone-800">Terrain & Elevation DEM</span>
                    {activeLayer === 'terrain' && (
                      <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleLayerMute('terrain')}
                      className={`p-1 rounded transition-colors ${
                        layerOpacities.terrain === 0
                          ? 'bg-stone-200 text-stone-500'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                      title={layerOpacities.terrain === 0 ? 'Unmute layer' : 'Mute layer'}
                    >
                      {layerOpacities.terrain === 0 ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </button>
                    <span className="font-mono text-xs font-bold text-emerald-900 w-10 text-right">
                      {layerOpacities.terrain}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={layerOpacities.terrain}
                    onChange={(e) => updateLayerOpacity('terrain', Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Quick Step Buttons */}
                <div className="flex justify-between text-[9px] font-mono text-stone-500 pt-0.5">
                  <button onClick={() => updateLayerOpacity('terrain', 0)} className="hover:text-emerald-700">0%</button>
                  <button onClick={() => updateLayerOpacity('terrain', 25)} className="hover:text-emerald-700">25%</button>
                  <button onClick={() => updateLayerOpacity('terrain', 50)} className="hover:text-emerald-700">50%</button>
                  <button onClick={() => updateLayerOpacity('terrain', 75)} className="hover:text-emerald-700">75%</button>
                  <button onClick={() => updateLayerOpacity('terrain', 100)} className="hover:text-emerald-700 font-bold">100%</button>
                </div>
              </div>

              {/* 5. NER Scanned Topo Map Layer */}
              <div className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/90 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-700" />
                    <span className="text-xs font-bold text-stone-800">Scanned GSI Toposheet</span>
                    {mapStyle === 'scanned' && (
                      <span className="text-[9px] font-mono bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                        Base
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleLayerMute('scannedMap')}
                      className={`p-1 rounded transition-colors ${
                        layerOpacities.scannedMap === 0
                          ? 'bg-stone-200 text-stone-500'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      title={layerOpacities.scannedMap === 0 ? 'Unmute layer' : 'Mute layer'}
                    >
                      {layerOpacities.scannedMap === 0 ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </button>
                    <span className="font-mono text-xs font-bold text-amber-900 w-10 text-right">
                      {layerOpacities.scannedMap}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={layerOpacities.scannedMap}
                    onChange={(e) => updateLayerOpacity('scannedMap', Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                  />
                </div>

                {/* Quick Step Buttons */}
                <div className="flex justify-between text-[9px] font-mono text-stone-500 pt-0.5">
                  <button onClick={() => updateLayerOpacity('scannedMap', 0)} className="hover:text-amber-700">0%</button>
                  <button onClick={() => updateLayerOpacity('scannedMap', 25)} className="hover:text-amber-700">25%</button>
                  <button onClick={() => updateLayerOpacity('scannedMap', 50)} className="hover:text-amber-700">50%</button>
                  <button onClick={() => updateLayerOpacity('scannedMap', 75)} className="hover:text-amber-700">75%</button>
                  <button onClick={() => updateLayerOpacity('scannedMap', 100)} className="hover:text-amber-700 font-bold">100%</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* ================= DYNAMIC CONTEXTUAL LEGEND (BOTTOM RIGHT) ================= */}
      <div className="absolute bottom-6 right-6 z-30 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-stone-300 shadow-md w-64">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-stone-900 font-bold">4-Tier Warning Protocol</span>
          <span className="text-[9px] font-mono text-stone-500 font-bold">NDMA/GSI</span>
        </div>
        <div className="flex h-2.5 w-full rounded overflow-hidden mb-1.5 shadow-inner">
          <div className="bg-emerald-600 flex-1" title="Level 0: Safe" />
          <div className="bg-yellow-500 flex-1" title="Level 1: Watch" />
          <div className="bg-orange-500 flex-1" title="Level 2: Warning" />
          <div className="bg-red-600 flex-1" title="Level 3: Critical" />
        </div>
        <div className="flex justify-between text-[8px] font-mono text-stone-600 uppercase font-bold">
          <span>L0: Safe</span>
          <span>L1: Watch</span>
          <span>L2: Warning</span>
          <span>L3: Critical</span>
        </div>
      </div>


      {/* ================= INSPECTOR DRAWER ================= */}
      {inspectItem && (
        <div className="absolute top-28 right-4 z-40 bg-white/98 backdrop-blur-md border border-stone-300 rounded-xl shadow-2xl w-84 p-4 animate-in fade-in slide-in-from-right-3 duration-200 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <h4 className="font-bold text-sm text-stone-900">
                {inspectItem.type === 'cluster'
                  ? `Telemetry Cluster (${inspectItem.data.count} Probes)`
                  : inspectItem.type === 'sensor' 
                  ? inspectItem.data.area || inspectItem.data.name 
                  : inspectItem.type === 'history'
                  ? `${inspectItem.data.year}: ${inspectItem.data.title}`
                  : inspectItem.type === 'terrain'
                  ? inspectItem.data.title
                  : inspectItem.type === 'weather'
                  ? inspectItem.data.station
                  : inspectItem.data.title}
              </h4>
            </div>
            <button 
              onClick={() => setInspectItem(null)}
              className="p-1 hover:bg-stone-100 rounded text-stone-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* SENSOR INSPECTION: STRICT NO DEVICE ID */}
          {inspectItem.type === 'sensor' && (
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center bg-stone-50 p-2 rounded-lg border border-stone-200">
                <span className="text-stone-500 font-semibold">Location:</span>
                <span className="font-bold text-blue-900">
                  {inspectItem.data.sector || 'Regional Grid'} ({inspectItem.data.state || 'NER'})
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-500">Live Reading:</span>
                <span className="font-mono font-bold text-red-600 text-sm">
                  {inspectItem.data.value} {inspectItem.data.unit}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-2 rounded-lg border border-stone-200 text-[11px] font-mono">
                <div>
                  <span className="text-stone-500 block">Soil Moisture</span>
                  <span className="font-bold text-blue-800">{inspectItem.data.soilMoisture ?? 65}% VWC</span>
                </div>
                <div>
                  <span className="text-stone-500 block">24h Rainfall</span>
                  <span className="font-bold text-cyan-800">{inspectItem.data.rainfallMm ?? 25} mm</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-500">Hazard Profile:</span>
                <span className="font-medium text-stone-900">{inspectItem.data.hazardType || 'Geotechnical Shear Creep'}</span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onSelectSensor(inspectItem.data);
                    setInspectItem(null);
                  }}
                  className="w-full bg-blue-900 text-white py-2 rounded-lg font-bold text-xs hover:bg-blue-950 transition-colors"
                >
                  Open Geotechnical Telemetry
                </button>
              </div>
            </div>
          )}

          {/* CLUSTER INSPECTION */}
          {inspectItem.type === 'cluster' && (
            <div className="space-y-3 text-xs">
              <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                <span className="font-bold text-blue-900 block">Concentrated Telemetry Mesh</span>
                <span className="text-[11px] text-blue-700">{inspectItem.data.sectorSummary}</span>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {inspectItem.data.sensors.map((s: SensorData) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectSensor(s);
                      setInspectItem({ type: 'sensor', data: s });
                    }}
                    className="p-2 rounded-lg border border-stone-200 hover:border-blue-400 bg-stone-50 hover:bg-blue-50/50 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-stone-900">{s.area || s.name}</div>
                      <div className="text-[10px] text-stone-500">{s.sector}</div>
                    </div>
                    <div className="text-right font-mono font-bold text-blue-900 text-[11px]">
                      {s.value} {s.unit}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  handleZoomIn();
                  setInspectItem(null);
                }}
                className="w-full bg-blue-900 text-white py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Zoom to Expand Probes</span>
              </button>
            </div>
          )}

          {/* HISTORICAL VIEW */}
          {inspectItem.type === 'history' && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-purple-900 font-bold border-b pb-1">
                <span>Date: {inspectItem.data.date}</span>
                <span className="bg-purple-100 px-1.5 py-0.5 rounded uppercase">{inspectItem.data.category.replace('_', ' ')}</span>
              </div>
              <p className="text-stone-700 leading-relaxed">{inspectItem.data.description}</p>
              <div className="bg-stone-50 p-2 rounded border border-stone-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Debris Volume:</span>
                  <span className="font-mono font-bold text-purple-950">{inspectItem.data.volumeM3.toLocaleString()} m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Trigger Rainfall:</span>
                  <span className="font-mono font-bold text-cyan-900">{inspectItem.data.triggerRainfallMm} mm</span>
                </div>
              </div>
            </div>
          )}

          {/* TERRAIN VIEW */}
          {inspectItem.type === 'terrain' && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Elevation:</span>
                <span className="font-mono font-bold text-emerald-800">{inspectItem.data.elevation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Slope Gradient:</span>
                <span className="font-mono font-bold text-red-700">{inspectItem.data.slope}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Geology:</span>
                <span className="font-medium text-stone-800">{inspectItem.data.geology}</span>
              </div>
            </div>
          )}

          {/* GEOLOGICAL FAULT LINE VIEW */}
          {inspectItem.type === 'fault' && (
            <div className="space-y-2 text-xs">
              <div className="bg-red-50 p-2.5 rounded-lg border border-red-200">
                <div className="font-bold text-red-900 text-xs">{inspectItem.data.name}</div>
                <div className="text-[10px] font-mono text-red-700 mt-0.5">{inspectItem.data.type} • {inspectItem.data.activityStatus}</div>
              </div>
              <p className="text-stone-700 leading-relaxed text-[11px]">{inspectItem.data.description}</p>
              <div className="bg-amber-50/80 p-2 rounded border border-amber-200 text-[10px] font-mono text-amber-900">
                <span>Surveillance Status: GSI High-Priority Neotectonic Shear Horizon</span>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
