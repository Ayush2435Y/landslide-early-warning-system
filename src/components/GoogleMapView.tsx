// Source: Google Maps Platform Code Assist
import React, { useState, useMemo, useEffect } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { RealGoogleMap } from './RealGoogleMap';

const GOOGLE_MAPS_LIBRARIES: ('marker' | 'places')[] = ['marker', 'places'];
import { 
  Radio, 
  Activity, 
  Droplets, 
  Mountain, 
  CloudRain, 
  Shield, 
  AlertTriangle, 
  Layers, 
  Crosshair, 
  ExternalLink, 
  Maximize2, 
  Compass, 
  Info,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Zap,
  Globe,
  Satellite,
  Building2,
  PhoneCall,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  ArrowLeft,
  Flame,
  X
} from 'lucide-react';
import { SensorData, IncidentReport, RISK_TIERS, RiskTierLevel } from '../types';
import { 
  NER_STATES_DATA, 
  NERStateInfo, 
  NERDistrictInfo, 
  HIERARCHICAL_SENSOR_PINS, 
  HierarchicalSensorPin 
} from '../data/hierarchicalData';

interface GoogleMapViewProps {
  sensors?: SensorData[];
  reports?: IncidentReport[];
  selectedSensor?: SensorData | null;
  onSelectSensor?: (sensor: SensorData) => void;
  className?: string;
  height?: string | number;
  showControls?: boolean;
  isAdmin?: boolean;
}

// NER Regional Center: Covering all 8 states (Sikkim to Arunachal / Mizoram)
const NER_REGIONAL_CENTER = { lat: 26.1500, lng: 92.5000 };
const NER_REGIONAL_ZOOM = 7.0;

// Google Maps Camera Controller helper component
const MapCameraController: React.FC<{
  center: google.maps.LatLngLiteral;
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    map.setZoom(zoom);
  }, [map, center.lat, center.lng, zoom]);

  return null;
};

// Helper to validate Google Maps Platform API key structure
const isValidGoogleMapsApiKey = (key: string | undefined | null): boolean => {
  if (!key || typeof key !== 'string') return false;
  const k = key.trim();
  if (k.length < 25) return false;
  if (
    k.includes('MY_') ||
    k.includes('YOUR_') ||
    k.includes('API_KEY') ||
    k.includes('undefined') ||
    k.includes('null') ||
    k.includes('<') ||
    k.includes('>') ||
    k.includes('DEMO')
  ) {
    return false;
  }
  return true;
};

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  sensors = [],
  reports = [],
  selectedSensor: propSelectedSensor,
  onSelectSensor,
  className = '',
  height = '100%',
  showControls = true,
  isAdmin = false,
}) => {
  const rawApiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const [mapsAuthFailed, setMapsAuthFailed] = useState<boolean>(false);

  // Global listener for Google Maps auth errors (InvalidKeyMapError / gm_authFailure)
  useEffect(() => {
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('[GoogleMapView] Google Maps authentication failed (InvalidKeyMapError). Switching seamlessly to built-in high-precision vector GIS map.');
      setMapsAuthFailed(true);
      if (typeof prevAuthFailure === 'function') {
        try {
          prevAuthFailure();
        } catch (_) {}
      }
    };
    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
    };
  }, []);

  const hasValidKey = isValidGoogleMapsApiKey(rawApiKey) && !mapsAuthFailed;
  const apiKey = hasValidKey ? rawApiKey.trim() : '';

  // Hierarchy State: Level 1 (Region: 'ner') -> Level 2 (State: stateId) -> Level 3 (District: districtId)
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<HierarchicalSensorPin | null>(null);

  // Map configuration
  const [mapType, setMapType] = useState<'hybrid' | 'terrain' | 'roadmap'>('hybrid');
  const [showHazardBuffers, setShowHazardBuffers] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected State and District objects
  const currentState = useMemo(() => {
    return NER_STATES_DATA.find((s) => s.id === selectedStateId) || null;
  }, [selectedStateId]);

  const currentDistrict = useMemo(() => {
    if (!currentState) return null;
    return currentState.monitoredDistricts.find((d) => d.id === selectedDistrictId) || null;
  }, [currentState, selectedDistrictId]);

  // Current Map Center & Zoom based on drill-down level
  const mapCoordinates = useMemo(() => {
    if (selectedPin) {
      return { center: { lat: selectedPin.lat, lng: selectedPin.lng }, zoom: 14 };
    }
    if (currentDistrict) {
      return { center: { lat: currentDistrict.lat, lng: currentDistrict.lng }, zoom: currentDistrict.zoom };
    }
    if (currentState) {
      return { center: { lat: currentState.lat, lng: currentState.lng }, zoom: currentState.zoom };
    }
    return { center: NER_REGIONAL_CENTER, zoom: NER_REGIONAL_ZOOM };
  }, [currentState, currentDistrict, selectedPin]);

  // Filter sensor pins based on drill-down level & search query
  const visiblePins = useMemo(() => {
    let pins = HIERARCHICAL_SENSOR_PINS;
    if (selectedDistrictId) {
      pins = pins.filter((p) => p.districtId === selectedDistrictId);
    } else if (selectedStateId) {
      pins = pins.filter((p) => p.stateId === selectedStateId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      pins = pins.filter(
        (p) =>
          p.areaName.toLowerCase().includes(q) ||
          p.districtName.toLowerCase().includes(q) ||
          p.stateName.toLowerCase().includes(q) ||
          p.hazardLevel.toLowerCase().includes(q)
      );
    }
    return pins;
  }, [selectedStateId, selectedDistrictId, searchQuery]);

  // Navigation Drill-Down Handlers
  const handleSelectState = (stateId: string) => {
    setSelectedStateId(stateId);
    setSelectedDistrictId(null);
    setSelectedPin(null);
  };

  const handleSelectDistrict = (districtId: string) => {
    setSelectedDistrictId(districtId);
    setSelectedPin(null);
  };

  const handleResetToRegion = () => {
    setSelectedStateId(null);
    setSelectedDistrictId(null);
    setSelectedPin(null);
  };

  const handleStepBack = () => {
    if (selectedPin) {
      setSelectedPin(null);
    } else if (selectedDistrictId) {
      setSelectedDistrictId(null);
      setSelectedPin(null);
    } else if (selectedStateId) {
      setSelectedStateId(null);
      setSelectedDistrictId(null);
      setSelectedPin(null);
    }
  };

  // Helper for pin risk styling
  const getRiskBadge = (tier: RiskTierLevel) => {
    switch (tier) {
      case 3:
        return {
          bg: 'bg-red-600',
          text: 'text-white',
          border: 'border-red-700',
          ring: 'ring-red-400',
          label: 'Level 3: Critical',
          cardBg: 'bg-red-50 text-red-950 border-red-300',
        };
      case 2:
        return {
          bg: 'bg-amber-500',
          text: 'text-white',
          border: 'border-amber-600',
          ring: 'ring-amber-300',
          label: 'Level 2: Warning',
          cardBg: 'bg-amber-50 text-amber-950 border-amber-300',
        };
      case 1:
        return {
          bg: 'bg-yellow-500',
          text: 'text-stone-900',
          border: 'border-yellow-600',
          ring: 'ring-yellow-300',
          label: 'Level 1: Watch',
          cardBg: 'bg-yellow-50 text-yellow-950 border-yellow-300',
        };
      default:
        return {
          bg: 'bg-emerald-600',
          text: 'text-white',
          border: 'border-emerald-700',
          ring: 'ring-emerald-300',
          label: 'Level 0: Safe',
          cardBg: 'bg-emerald-50 text-emerald-950 border-emerald-300',
        };
    }
  };

  // =========================================================================
  // FALLBACK INTERACTIVE GEOSPATIAL VECTOR VIEW (WHEN GOOGLE MAPS API KEY IS IN PROTOTYPE/OFFLINE MODE)
  // =========================================================================
  const renderFallbackHierarchicalMap = () => {
    // Precise coordinate bounds for all 8 NER states (Sikkim 88.5°E to Eastern Frontier 97.0°E, 22.0°N to 29.0°N)
    const getMapPercents = (lat: number, lng: number) => {
      let minLat = 22.0, maxLat = 29.0;
      let minLng = 88.0, maxLng = 97.0;

      if (currentDistrict) {
        // District focused bounding box (~0.6 deg)
        minLat = currentDistrict.lat - 0.22;
        maxLat = currentDistrict.lat + 0.22;
        minLng = currentDistrict.lng - 0.32;
        maxLng = currentDistrict.lng + 0.32;
      } else if (currentState) {
        // State focused bounding box (~2.2 deg)
        minLat = currentState.lat - 1.1;
        maxLat = currentState.lat + 1.1;
        minLng = currentState.lng - 1.4;
        maxLng = currentState.lng + 1.4;
      }

      const top = Math.max(8, Math.min(92, 100 - ((lat - minLat) / (maxLat - minLat)) * 100));
      const left = Math.max(8, Math.min(92, ((lng - minLng) / (maxLng - minLng)) * 100));
      return { top: `${top}%`, left: `${left}%` };
    };

    return (
      <div className="relative w-full h-full bg-[#0d131f] overflow-hidden select-none flex flex-col justify-between">
        {/* Topographic Contours & Terrain Layer */}
        <div className="absolute inset-0 bg-[#0b101b] transition-all duration-300">
          {/* Subtle Topo Elevation Grid */}
          <svg className="absolute inset-0 w-full h-full opacity-25 stroke-cyan-500/40 pointer-events-none" fill="none">
            <ellipse cx="50%" cy="48%" rx="480" ry="320" strokeWidth="1" strokeDasharray="4,4" />
            <ellipse cx="50%" cy="48%" rx="360" ry="240" strokeWidth="1" />
            <ellipse cx="50%" cy="48%" rx="240" ry="160" strokeWidth="1.2" stroke="#f59e0b" strokeOpacity="0.4" />
            <path d="M 60,180 Q 320,310 680,240 T 1200,380" strokeWidth="1.2" />
            <path d="M 40,260 Q 360,390 740,320 T 1240,460" strokeWidth="1.4" stroke="#ef4444" strokeOpacity="0.4" />
          </svg>

          {/* Geological Hazard Buffers */}
          {showHazardBuffers && (
            <>
              <div className="absolute top-[35%] left-[46%] w-72 h-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute top-[52%] left-[68%] w-64 h-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
              <div className="absolute top-[65%] left-[45%] w-72 h-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-2xl pointer-events-none" />
            </>
          )}

          {/* ========================================================================= */}
          {/* LEVEL 1: REGION VIEW (Showing All 8 States with Pinpoint Positioning) */}
          {/* ========================================================================= */}
          {!selectedStateId && !selectedDistrictId && (
            <div className="absolute inset-0 p-6">
              {NER_STATES_DATA.map((st) => {
                const pos = getMapPercents(st.lat, st.lng);
                const risk = getRiskBadge(st.highestRiskTier);

                return (
                  <div
                    key={st.id}
                    style={pos}
                    onClick={() => handleSelectState(st.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 transition-transform duration-200 hover:scale-105"
                  >
                    {/* Pulsing alert ring for critical states */}
                    {st.highestRiskTier >= 3 && (
                      <span className="absolute -inset-2.5 rounded-2xl bg-red-500/30 animate-ping pointer-events-none" />
                    )}

                    <div className="bg-[#151e32]/95 backdrop-blur-md text-white border border-white/20 group-hover:border-cyan-400 rounded-xl p-3 shadow-2xl flex flex-col items-center min-w-[145px] text-center transition-all">
                      <div className="flex items-center gap-1.5 justify-center mb-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="font-bold text-xs tracking-wide">{st.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-300 font-mono">
                        <span>{st.districtsCount} Districts</span>
                        <span>&bull;</span>
                        <span>{st.activeSensorsCount} Nodes</span>
                      </div>
                      <div className={`mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-wider ${risk.bg} ${risk.text}`}>
                        {risk.label}
                      </div>
                      <span className="text-[10px] text-cyan-300 font-semibold mt-1.5 group-hover:underline flex items-center gap-0.5">
                        <span>Drill Down</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* LEVEL 2: STATE VIEW (Showing Constituent Districts for Selected State) */}
          {/* ========================================================================= */}
          {selectedStateId && !selectedDistrictId && currentState && (
            <div className="absolute inset-0 p-6">
              {currentState.monitoredDistricts.map((dst) => {
                const pos = getMapPercents(dst.lat, dst.lng);
                const risk = getRiskBadge(dst.highestRiskTier);

                return (
                  <div
                    key={dst.id}
                    style={pos}
                    onClick={() => handleSelectDistrict(dst.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 transition-transform duration-200 hover:scale-105"
                  >
                    {dst.highestRiskTier >= 2 && (
                      <span className="absolute -inset-2.5 rounded-2xl bg-red-500/35 animate-ping pointer-events-none" />
                    )}

                    <div className="bg-[#151e32]/95 backdrop-blur-md text-white border border-white/30 group-hover:border-cyan-300 rounded-xl p-3.5 shadow-2xl flex flex-col items-center min-w-[175px] text-center">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white mb-0.5">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                        <span>{dst.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono">
                        {dst.activeSensorsCount} Monitored Sectors
                      </div>
                      <div className={`mt-2 px-2.5 py-0.5 rounded text-[9px] font-bold font-mono ${risk.bg} ${risk.text}`}>
                        {risk.label}
                      </div>
                      <div className="text-[10px] text-slate-300 line-clamp-1 mt-1 max-w-[160px]">
                        {dst.primaryHazard}
                      </div>
                      <span className="text-[10px] text-cyan-300 font-bold mt-1.5 flex items-center gap-1 group-hover:underline">
                        <span>View Sector Pins</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* LEVEL 3: DISTRICT VIEW (Clean Geotechnical Sensor Pins) */}
          {/* ========================================================================= */}
          {selectedDistrictId && currentDistrict && (
            <div className="absolute inset-0 p-8">
              {visiblePins.map((pin) => {
                const pos = getMapPercents(pin.lat, pin.lng);
                const isSelected = selectedPin?.pinId === pin.pinId;
                const risk = getRiskBadge(pin.riskTier);

                return (
                  <div
                    key={pin.pinId}
                    style={pos}
                    onClick={() => setSelectedPin(pin)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-30"
                  >
                    {/* Pulsing indicator for Critical */}
                    {pin.riskTier >= 3 && (
                      <span className="absolute -inset-3 rounded-full bg-red-500/50 animate-ping pointer-events-none" />
                    )}

                    {/* Sensor Marker Pill */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-2xl border text-xs font-semibold transition-all duration-200 ${
                        risk.bg
                      } ${risk.text} ${risk.border} ${
                        isSelected
                          ? 'scale-125 ring-4 ring-white shadow-[0_0_20px_rgba(255,255,255,0.8)]'
                          : 'group-hover:scale-110'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap font-medium">{pin.areaName}</span>
                    </div>

                    {/* Mini Hover Card */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 bg-[#151e32]/98 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl text-[11px] font-sans border border-white/20 z-40 pointer-events-none">
                      <div className="font-bold text-xs text-white leading-tight">
                        {pin.areaName}
                      </div>
                      <div className="text-[10px] text-cyan-300 font-medium mt-0.5">
                        {pin.districtName}, {pin.stateName}
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-1.5 text-[10px] font-mono">
                        <span className="text-slate-300">Pore Pressure:</span>
                        <span className="font-bold text-white">{pin.poreWaterPressure_kPa} kPa</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-300">Displacement:</span>
                        <span className="font-bold text-amber-400">{pin.slopeDisplacement_mm} mm</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-300">Status:</span>
                        <span className={`font-bold px-1.5 py-0.2 rounded ${risk.bg} ${risk.text}`}>
                          {risk.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Sensor Pin Official Assessment Sheet */}
        {selectedPin && (
          <div className="relative z-40 m-4 p-4 bg-white/98 backdrop-blur-md rounded-2xl border border-stone-200 shadow-2xl max-w-md self-start animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${getRiskBadge(selectedPin.riskTier).cardBg}`}>
                    {selectedPin.warningCode}: {selectedPin.hazardLevel}
                  </span>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {selectedPin.sensorCategory}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-stone-900 mt-1 leading-snug">
                  {selectedPin.areaName}
                </h3>
                <p className="text-xs font-semibold text-blue-900 mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>{selectedPin.districtName}, {selectedPin.stateName}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold transition-colors"
                title="Close Sheet"
              >
                ✕
              </button>
            </div>

            {/* Geotechnical Live Readings Grid */}
            <div className="mt-3 grid grid-cols-4 gap-1.5 text-xs font-mono">
              <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                <span className="text-[9px] text-stone-500 block uppercase">Pore Head</span>
                <span className="font-bold text-stone-900 text-xs">{selectedPin.poreWaterPressure_kPa} kPa</span>
              </div>
              <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                <span className="text-[9px] text-stone-500 block uppercase">Displace</span>
                <span className="font-bold text-amber-700 text-xs">{selectedPin.slopeDisplacement_mm} mm</span>
              </div>
              <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                <span className="text-[9px] text-stone-500 block uppercase">Moisture</span>
                <span className="font-bold text-blue-700 text-xs">{selectedPin.soilSaturation_pct}%</span>
              </div>
              <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                <span className="text-[9px] text-stone-500 block uppercase">24h Rain</span>
                <span className="font-bold text-cyan-800 text-xs">{selectedPin.rainfall24h_mm} mm</span>
              </div>
            </div>

            {/* Official Assessment & Authority Advisory */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="bg-stone-100 p-2 rounded-lg border border-stone-200">
                <span className="text-[9px] font-bold uppercase text-stone-600 block tracking-wider">
                  Geotechnical Assessment:
                </span>
                <p className="text-stone-800 mt-0.5 leading-relaxed font-sans text-[11px]">
                  {selectedPin.geotechnicalAssessment}
                </p>
              </div>

              <div className={`p-2 rounded-lg border ${getRiskBadge(selectedPin.riskTier).cardBg}`}>
                <span className="text-[9px] font-bold uppercase block tracking-wider">
                  Disaster Authority Advisory:
                </span>
                <p className="mt-0.5 leading-relaxed font-sans font-medium text-[11px]">
                  {selectedPin.authorityAdvisory}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-3 pt-2 border-t border-stone-200 flex items-center justify-between gap-2">
              <span className="text-[10px] text-stone-500 font-mono">
                Updated {selectedPin.lastUpdated}
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedPin.lat},${selectedPin.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Maps</span>
              </a>
            </div>
          </div>
        )}

        {/* Bottom Legend Bar */}
        <div className="relative z-20 px-4 py-2 bg-[#0a0e17] text-white flex flex-wrap items-center justify-between gap-2 text-xs border-t border-white/10">
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>Level 3 (Critical)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Level 2 (Warning)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Level 1 (Watch)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Level 0 (Safe)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHazardBuffers(!showHazardBuffers)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${
                showHazardBuffers ? 'bg-red-800 text-white' : 'bg-stone-800 text-stone-400'
              }`}
            >
              {showHazardBuffers ? '✓ Hazard Buffer ON' : 'Hazard Buffer OFF'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // REAL GOOGLE MAPS PLATFORM INSTANCE (WHEN GOOGLE MAPS API KEY IS PROVIDED)
  // =========================================================================
  const renderGoogleMapsSDK = () => {
    return (
      <APIProvider 
        apiKey={apiKey} 
        libraries={GOOGLE_MAPS_LIBRARIES}
        region="IN"
        language="en"
        onError={(err) => {
          console.warn('[GoogleMapView] APIProvider error encountered:', err);
          setMapsAuthFailed(true);
        }}
      >
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={mapCoordinates.center}
          defaultZoom={mapCoordinates.zoom}
          mapTypeId={mapType}
          gestureHandling="greedy"
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Active Camera Pan / Zoom Sync */}
          <MapCameraController center={mapCoordinates.center} zoom={mapCoordinates.zoom} />

          {/* LEVEL 1: Region Markers (All 8 States) */}
          {!selectedStateId && !selectedDistrictId &&
            NER_STATES_DATA.map((st) => {
              const risk = getRiskBadge(st.highestRiskTier);
              return (
                <AdvancedMarker
                  key={st.id}
                  position={{ lat: st.lat, lng: st.lng }}
                  title={`${st.name} State (${st.districtsCount} Districts)`}
                  onClick={() => handleSelectState(st.id)}
                >
                  <div className="cursor-pointer bg-[#151e32] text-white border-2 border-white rounded-xl p-2 shadow-2xl flex flex-col items-center min-w-[120px] transition-transform hover:scale-110">
                    <span className="font-bold text-xs">{st.name}</span>
                    <span className={`mt-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold ${risk.bg} ${risk.text}`}>
                      {risk.label}
                    </span>
                  </div>
                </AdvancedMarker>
              );
            })}

          {/* LEVEL 2: District Markers */}
          {selectedStateId && !selectedDistrictId && currentState &&
            currentState.monitoredDistricts.map((dst) => {
              const risk = getRiskBadge(dst.highestRiskTier);
              return (
                <AdvancedMarker
                  key={dst.id}
                  position={{ lat: dst.lat, lng: dst.lng }}
                  title={`${dst.name} District`}
                  onClick={() => handleSelectDistrict(dst.id)}
                >
                  <div className="cursor-pointer bg-[#151e32] text-white border-2 border-cyan-400 rounded-xl p-2.5 shadow-2xl flex flex-col items-center min-w-[140px] transition-transform hover:scale-110">
                    <div className="flex items-center gap-1 font-bold text-xs">
                      <Building2 className="w-3.5 h-3.5 text-cyan-300" />
                      <span>{dst.name}</span>
                    </div>
                    <span className={`mt-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold ${risk.bg} ${risk.text}`}>
                      {risk.label}
                    </span>
                  </div>
                </AdvancedMarker>
              );
            })}

          {/* LEVEL 3: Clean Sensor Pins */}
          {selectedDistrictId &&
            visiblePins.map((pin) => {
              const isSelected = selectedPin?.pinId === pin.pinId;
              const risk = getRiskBadge(pin.riskTier);

              return (
                <AdvancedMarker
                  key={pin.pinId}
                  position={{ lat: pin.lat, lng: pin.lng }}
                  title={`${pin.areaName}, ${pin.stateName}`}
                  onClick={() => setSelectedPin(pin)}
                >
                  <div
                    className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-2xl border-2 text-xs font-semibold transition-all ${
                      risk.bg
                    } ${risk.text} ${risk.border} ${
                      isSelected ? 'scale-125 ring-4 ring-white' : 'hover:scale-110'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{pin.areaName}</span>
                  </div>
                </AdvancedMarker>
              );
            })}

          {/* InfoWindow for Selected Pin */}
          {selectedPin && (
            <InfoWindow
              position={{ lat: selectedPin.lat, lng: selectedPin.lng }}
              onCloseClick={() => setSelectedPin(null)}
              pixelOffset={[0, -32]}
            >
              <div className="p-1 max-w-xs font-sans text-xs space-y-2">
                <div className="border-b pb-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${getRiskBadge(selectedPin.riskTier).cardBg}`}>
                      {selectedPin.warningCode}: {selectedPin.hazardLevel}
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      {selectedPin.sensorCategory}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-stone-900 mt-1">
                    {selectedPin.areaName}
                  </h4>
                  <div className="text-[11px] text-blue-900 font-semibold">
                    {selectedPin.districtName}, {selectedPin.stateName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 bg-stone-50 p-2 rounded text-[11px] font-mono">
                  <div>
                    <span className="text-[10px] text-stone-500 block">Pore Water Head</span>
                    <span className="font-bold text-stone-900">{selectedPin.poreWaterPressure_kPa} kPa</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block">Displacement</span>
                    <span className="font-bold text-amber-700">{selectedPin.slopeDisplacement_mm} mm</span>
                  </div>
                </div>

                <div className="bg-stone-100 p-2 rounded text-[11px] text-stone-800">
                  <strong className="block text-[10px] text-stone-600 uppercase">Assessment:</strong>
                  <span>{selectedPin.geotechnicalAssessment}</span>
                </div>

                <div className="text-[11px] text-stone-600">
                  <strong>Authority Advisory:</strong> {selectedPin.authorityAdvisory}
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedPin.lat},${selectedPin.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center py-1.5 bg-stone-900 hover:bg-black text-white rounded text-[11px] font-bold transition-colors"
                >
                  Open in Google Maps &rarr;
                </a>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    );
  };

  return (
    <div className={`relative w-full h-full flex flex-col bg-stone-100 overflow-hidden ${className}`}>
      {/* ================= OFFICIAL GOVERNMENT DISASTER MANAGEMENT HIERARCHY BAR ================= */}
      <div className="bg-white border-b border-stone-300 px-4 py-2.5 shadow-xs z-30 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Hierarchical Breadcrumbs Navigation */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Level 0 / 1: North Eastern Region */}
          <button
            onClick={handleResetToRegion}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
              !selectedStateId && !selectedDistrictId
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>North Eastern Region (NER)</span>
          </button>

          {/* Level 2: State */}
          {currentState && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <button
                onClick={() => {
                  setSelectedDistrictId(null);
                  setSelectedPin(null);
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                  selectedStateId && !selectedDistrictId
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>{currentState.name} State</span>
              </button>
            </>
          )}

          {/* Level 3: District */}
          {currentDistrict && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <div className="px-2.5 py-1 rounded-md font-bold bg-stone-900 text-white flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-cyan-300" />
                <span>{currentDistrict.name} District</span>
              </div>
            </>
          )}

          {/* Level 4: Active Pin */}
          {selectedPin && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <div className="px-2 py-1 rounded-md font-bold bg-blue-700 text-white flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span className="truncate max-w-[140px]">{selectedPin.areaName}</span>
              </div>
            </>
          )}

          {/* Step Back Button */}
          {(selectedStateId || selectedDistrictId || selectedPin) && (
            <button
              onClick={handleStepBack}
              className="ml-1 p-1 rounded-md hover:bg-stone-200 text-stone-600 transition-colors"
              title="Navigate Up One Level"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Select State & District Dropdowns + Search */}
        <div className="flex items-center gap-2">
          {/* State Dropdown Selector (8 States) */}
          <select
            value={selectedStateId || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) handleResetToRegion();
              else handleSelectState(val);
            }}
            className="text-xs font-semibold bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-800 cursor-pointer"
          >
            <option value="">All 8 States...</option>
            {NER_STATES_DATA.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.monitoredDistricts.length} Districts)
              </option>
            ))}
          </select>

          {/* District Dropdown Selector */}
          <select
            value={selectedDistrictId || ''}
            disabled={!selectedStateId}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) setSelectedDistrictId(null);
              else handleSelectDistrict(val);
            }}
            className={`text-xs font-semibold border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
              selectedStateId
                ? 'bg-stone-50 border-stone-300 text-stone-800'
                : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <option value="">
              {currentState ? `Select District in ${currentState.name}...` : 'Select District...'}
            </option>
            {currentState?.monitoredDistricts.map((dst) => (
              <option key={dst.id} value={dst.id}>
                {dst.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Area / Sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 lg:w-44 text-stone-800"
            />
          </div>

          {/* Map Layer Mode Switcher */}
          <select
            value={mapType}
            onChange={(e) => setMapType(e.target.value as any)}
            className="text-xs font-semibold bg-stone-50 border border-stone-300 rounded-lg px-2 py-1.5 focus:outline-none text-stone-800 cursor-pointer hidden md:block"
          >
            <option value="hybrid">Satellite Hybrid</option>
            <option value="terrain">Geotech Terrain</option>
            <option value="roadmap">Roadmap</option>
          </select>
        </div>
      </div>

      {/* Main Map Rendering Area */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        {apiKey ? (
          renderGoogleMapsSDK()
        ) : (
          <RealGoogleMap
            center={[mapCoordinates.center.lat, mapCoordinates.center.lng]}
            zoom={mapCoordinates.zoom}
            stations={visiblePins}
            mapType={mapType}
            showHazardBuffers={showHazardBuffers}
            selectedStationId={selectedPin?.pinId || null}
            onSelectStation={(pin) => {
              setSelectedPin(pin);
              if (onSelectSensor) onSelectSensor(pin as any);
            }}
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  );
};
