// Source: Google Maps Platform Code Assist & Real-Time GIS Telemetry
import React, { useState, useMemo, useEffect } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { RealGoogleMap, GoogleMapLayerType } from './RealGoogleMap';
import { 
  Maximize2, 
  Minimize2,
  ExternalLink, 
  MapPin, 
  ChevronDown,
  Globe,
  Layers,
  RotateCcw
} from 'lucide-react';

const GOOGLE_MAPS_LIBRARIES: ('marker' | 'places')[] = ['marker', 'places'];

// Real Geographic Stations across the North-Eastern Region (NER) of India
export interface NERMapStation {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  risk: 'critical' | 'warning' | 'nominal';
  score: number;
  pore: string;
  rain: string;
  displacement: string;
  hazardNote: string;
}

export const NER_MAP_STATIONS: NERMapStation[] = [
  {
    id: 'S-07',
    name: 'Pasighat Hill Slope',
    district: 'East Siang',
    state: 'Arunachal Pradesh',
    lat: 28.0660,
    lng: 95.3260,
    risk: 'critical',
    score: 0.89,
    pore: '58.4 kPa',
    rain: '72.4 mm/hr',
    displacement: '4.8 mm/hr',
    hazardNote: 'Active debris-flow trigger threshold exceeded; immediate slope evacuation zone.',
  },
  {
    id: 'S-01',
    name: 'Itanagar Capital Slope',
    district: 'Papum Pare',
    state: 'Arunachal Pradesh',
    lat: 27.0844,
    lng: 93.6053,
    risk: 'warning',
    score: 0.67,
    pore: '46.1 kPa',
    rain: '48.0 mm/hr',
    displacement: '2.9 mm/hr',
    hazardNote: 'High pore saturation along NH-415 road cutting; heavy seepage noted.',
  },
  {
    id: 'S-09',
    name: 'Shillong Peak Escarpment',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.5412,
    lng: 91.8622,
    risk: 'warning',
    score: 0.61,
    pore: '44.8 kPa',
    rain: '55.2 mm/hr',
    displacement: '2.1 mm/hr',
    hazardNote: 'Upper plateau sandstone contact fracture under sustained saturation.',
  },
  {
    id: 'S-08',
    name: 'Cherrapunji (Sohra) Ridge',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.2986,
    lng: 91.7322,
    risk: 'warning',
    score: 0.58,
    pore: '42.0 kPa',
    rain: '88.0 mm/hr',
    displacement: '1.9 mm/hr',
    hazardNote: 'Extreme precipitation corridor; limestone karst conduits active.',
  },
  {
    id: 'S-02',
    name: 'Ziro Valley Ridge',
    district: 'Lower Subansiri',
    state: 'Arunachal Pradesh',
    lat: 27.5950,
    lng: 93.8385,
    risk: 'nominal',
    score: 0.38,
    pore: '32.1 kPa',
    rain: '28.5 mm/hr',
    displacement: '1.1 mm/hr',
    hazardNote: 'Metamorphic schists; nominal pore dissipation through terraces.',
  },
  {
    id: 'S-03',
    name: 'Aalo Gorge Sector',
    district: 'West Siang',
    state: 'Arunachal Pradesh',
    lat: 28.1700,
    lng: 94.8000,
    risk: 'nominal',
    score: 0.29,
    pore: '24.6 kPa',
    rain: '18.2 mm/hr',
    displacement: '0.7 mm/hr',
    hazardNote: 'Yomgo river gorge stable; drainage culverts fully functional.',
  },
  {
    id: 'S-06',
    name: 'Haflong Hill Cut',
    district: 'Dima Hasao',
    state: 'Assam',
    lat: 25.1800,
    lng: 93.0200,
    risk: 'warning',
    score: 0.64,
    pore: '45.0 kPa',
    rain: '51.0 mm/hr',
    displacement: '2.4 mm/hr',
    hazardNote: 'Railway hill section; shale-sandstone transition under creep stress.',
  },
  {
    id: 'S-10',
    name: 'Kohima Bypass Escarpment',
    district: 'Kohima',
    state: 'Nagaland',
    lat: 25.6751,
    lng: 94.1086,
    risk: 'warning',
    score: 0.62,
    pore: '43.2 kPa',
    rain: '44.5 mm/hr',
    displacement: '2.2 mm/hr',
    hazardNote: 'Disang flysch formation; active downhill creeping on road shoulder.',
  },
  {
    id: 'S-11',
    name: 'Imphal Valley Approach',
    district: 'Imphal West',
    state: 'Manipur',
    lat: 24.8170,
    lng: 93.9368,
    risk: 'nominal',
    score: 0.35,
    pore: '29.0 kPa',
    rain: '24.0 mm/hr',
    displacement: '0.9 mm/hr',
    hazardNote: 'Intermontane basin perimeter; stable baseline inclinometer readings.',
  },
  {
    id: 'S-12',
    name: 'Aizawl Cliff Corridor',
    district: 'Aizawl',
    state: 'Mizoram',
    lat: 23.7271,
    lng: 92.7176,
    risk: 'warning',
    score: 0.65,
    pore: '47.5 kPa',
    rain: '58.0 mm/hr',
    displacement: '2.7 mm/hr',
    hazardNote: 'Steep anticlinal ridge slopes; urban surface runoff loading detected.',
  },
  {
    id: 'S-04',
    name: 'Guwahati Brahmaputra Sector',
    district: 'Kamrup Metro',
    state: 'Assam',
    lat: 26.1445,
    lng: 91.7362,
    risk: 'nominal',
    score: 0.25,
    pore: '22.0 kPa',
    rain: '15.0 mm/hr',
    displacement: '0.6 mm/hr',
    hazardNote: 'Stable piedmont alluvial terrace; drainage channels clear.',
  },
  {
    id: 'S-05',
    name: 'Roing Siang Basin',
    district: 'Lower Dibang Valley',
    state: 'Arunachal Pradesh',
    lat: 28.1408,
    lng: 95.8360,
    risk: 'nominal',
    score: 0.32,
    pore: '28.0 kPa',
    rain: '22.0 mm/hr',
    displacement: '0.8 mm/hr',
    hazardNote: 'Dibang river alluvial plain; minimal slope inclination.',
  },
];

// Helper to pan/zoom Google Map camera
const MapCameraController: React.FC<{
  center: { lat: number; lng: number };
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

// Check if a valid Google Maps API Key exists
const isValidGoogleMapsApiKey = (key: string | undefined | null): boolean => {
  if (!key || typeof key !== 'string') return false;
  const k = key.trim();
  if (k.length < 20) return false;
  if (
    k.includes('MY_') ||
    k.includes('YOUR_') ||
    k.includes('API_KEY') ||
    k.includes('undefined') ||
    k.includes('null') ||
    k.includes('<') ||
    k.includes('>')
  ) {
    return false;
  }
  return true;
};

interface DashboardRiskMapProps {
  onNavigateToFullMap?: () => void;
  className?: string;
}

export const DashboardRiskMap: React.FC<DashboardRiskMapProps> = ({
  onNavigateToFullMap,
  className = '',
}) => {
  const rawApiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const [mapsAuthFailed, setMapsAuthFailed] = useState<boolean>(false);

  // Global listener for Google Maps auth failure
  useEffect(() => {
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('[DashboardRiskMap] Google Maps authentication failed.');
      setMapsAuthFailed(true);
      if (typeof prevAuthFailure === 'function') {
        try { prevAuthFailure(); } catch (_) {}
      }
    };
    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
    };
  }, []);

  const hasValidKey = isValidGoogleMapsApiKey(rawApiKey) && !mapsAuthFailed;
  const apiKey = hasValidKey ? rawApiKey.trim() : '';

  const [stationFilter, setStationFilter] = useState<string>('all');
  const [mapType, setMapType] = useState<GoogleMapLayerType>('hybrid');
  const [selectedStation, setSelectedStation] = useState<NERMapStation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mapZoom, setMapZoom] = useState<number>(7);

  // Center coordinate for North-Eastern Region (NER) of India
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 26.2006,
    lng: 92.9376,
  });

  // Filter stations based on selection
  const filteredStations = useMemo(() => {
    if (stationFilter === 'critical') {
      return NER_MAP_STATIONS.filter((s) => s.risk === 'critical');
    }
    if (stationFilter === 'arunachal') {
      return NER_MAP_STATIONS.filter((s) => s.state === 'Arunachal Pradesh');
    }
    if (stationFilter === 'meghalaya') {
      return NER_MAP_STATIONS.filter((s) => s.state === 'Meghalaya');
    }
    if (stationFilter === 'assam') {
      return NER_MAP_STATIONS.filter((s) => s.state === 'Assam');
    }
    if (stationFilter === 'nagaland-manipur') {
      return NER_MAP_STATIONS.filter((s) => s.state === 'Nagaland' || s.state === 'Manipur');
    }
    return NER_MAP_STATIONS;
  }, [stationFilter]);

  // Adjust center when filter changes
  useEffect(() => {
    if (stationFilter === 'arunachal') {
      setMapCenter({ lat: 28.0660, lng: 94.8000 });
      setMapZoom(7.5);
    } else if (stationFilter === 'meghalaya') {
      setMapCenter({ lat: 25.4000, lng: 91.8000 });
      setMapZoom(8.5);
    } else if (stationFilter === 'nagaland-manipur') {
      setMapCenter({ lat: 25.2000, lng: 94.0000 });
      setMapZoom(8.0);
    } else if (stationFilter === 'assam') {
      setMapCenter({ lat: 26.1445, lng: 92.5000 });
      setMapZoom(7.5);
    } else {
      setMapCenter({ lat: 26.2006, lng: 92.9376 });
      setMapZoom(7);
    }
  }, [stationFilter]);

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col ${className} ${
      isFullscreen ? 'fixed inset-4 z-50 shadow-2xl flex flex-col' : ''
    }`}>
      {/* Card Header (Dark Navy) */}
      <div className="bg-[#0a1128] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <h2 className="text-sm font-bold text-white tracking-wide truncate">
            Risk Map &bull; North East Region, India
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Layer Selector */}
          <div className="flex items-center bg-[#121c38] p-0.5 rounded-md border border-slate-700/80 text-[11px]">
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                mapType === 'hybrid' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
              title="Google Satellite imagery with roads"
            >
              Satellite
            </button>
            <button
              onClick={() => setMapType('terrain')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                mapType === 'terrain' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
              title="Google Topographic elevation terrain"
            >
              Terrain
            </button>
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                mapType === 'roadmap' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
              title="Google Vector road map"
            >
              Roads
            </button>
          </div>

          {/* Region / Station Filter */}
          <div className="relative">
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="bg-[#121c38] border border-slate-700/80 text-slate-200 text-xs px-2.5 py-1 rounded-md pr-6 appearance-none focus:outline-hidden cursor-pointer"
            >
              <option value="all">All NER (12 Stations)</option>
              <option value="critical">Critical Risk Only</option>
              <option value="arunachal">Arunachal Pradesh</option>
              <option value="meghalaya">Meghalaya</option>
              <option value="assam">Assam</option>
              <option value="nagaland-manipur">Nagaland & Manipur</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>

          {/* Navigate to Full Risk Map */}
          {onNavigateToFullMap && (
            <button
              onClick={onNavigateToFullMap}
              className="px-2.5 py-1 rounded-md bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
              title="Open full interactive Risk Map view"
            >
              <span>Full Map</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Card Body: Interactive Google Map of North East Region of India */}
      <div className="relative flex-1 min-h-[360px] h-[380px] sm:h-[420px] bg-[#0c1322] overflow-hidden select-none">
        {hasValidKey ? (
          /* Live Google Maps Platform with vis.gl */
          <APIProvider 
            apiKey={apiKey} 
            libraries={GOOGLE_MAPS_LIBRARIES}
            region="IN"
            language="en"
            onError={(err) => {
              console.warn('[DashboardRiskMap] APIProvider error:', err);
              setMapsAuthFailed(true);
            }}
          >
            <Map
              mapId="DEMO_MAP_ID"
              defaultCenter={mapCenter}
              defaultZoom={mapZoom}
              mapTypeId={mapType}
              gestureHandling="greedy"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              <MapCameraController center={mapCenter} zoom={mapZoom} />

              {filteredStations.map((station) => {
                const isCritical = station.risk === 'critical';
                const isWarning = station.risk === 'warning';

                return (
                  <AdvancedMarker
                    key={station.id}
                    position={{ lat: station.lat, lng: station.lng }}
                    onClick={() => setSelectedStation(station)}
                    title={`${station.name} (${station.risk.toUpperCase()})`}
                  >
                    <div className="relative group cursor-pointer">
                      {isCritical && (
                        <span className="absolute -inset-2 rounded-full bg-rose-500/50 animate-ping" />
                      )}
                      {isWarning && (
                        <span className="absolute -inset-1.5 rounded-full bg-amber-400/40 animate-pulse" />
                      )}
                      <div
                        className={`relative flex items-center gap-1 px-2.5 py-1 rounded-full border-2 border-white shadow-xl text-xs font-bold text-white transition-all transform group-hover:scale-115 ${
                          isCritical
                            ? 'bg-rose-600'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-nowrap font-mono">{station.name.split(' ')[0]}</span>
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

              {selectedStation && (
                <InfoWindow
                  position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
                  onCloseClick={() => setSelectedStation(null)}
                >
                  <div className="p-1 font-sans text-xs space-y-1.5 max-w-[240px]">
                    <div className="border-b border-stone-200 pb-1 flex items-center justify-between">
                      <span className="font-bold text-stone-900">{selectedStation.name}</span>
                      <span
                        className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded text-white ${
                          selectedStation.risk === 'critical'
                            ? 'bg-rose-600'
                            : selectedStation.risk === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                      >
                        {selectedStation.risk}
                      </span>
                    </div>

                    <div className="text-stone-600 text-[11px]">
                      {selectedStation.district}, {selectedStation.state}
                    </div>

                    <div className="grid grid-cols-2 gap-1 bg-stone-50 p-1.5 rounded text-[10px] font-mono border border-stone-200">
                      <div>
                        <span className="text-stone-500 block">Pore Water:</span>
                        <strong className="text-stone-900">{selectedStation.pore}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Rainfall:</span>
                        <strong className="text-stone-900">{selectedStation.rain}</strong>
                      </div>
                    </div>

                    <div className="text-[10px] text-stone-600 italic bg-amber-50/70 p-1 rounded border border-amber-100">
                      {selectedStation.hazardNote}
                    </div>

                    {onNavigateToFullMap && (
                      <button
                        onClick={onNavigateToFullMap}
                        className="w-full mt-1 text-center py-1 bg-slate-900 hover:bg-black text-white rounded text-[10px] font-bold transition-colors"
                      >
                        Deep Geotechnical Telemetry &rarr;
                      </button>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        ) : (
          /* Real Interactive Google Maps Engine (Direct High-Resolution Tile Stream) */
          <RealGoogleMap
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={mapZoom}
            stations={filteredStations}
            mapType={mapType}
            showHazardBuffers={true}
            showLayerControls={false}
            showLegend={true}
            onNavigateToFullMap={onNavigateToFullMap}
            className="w-full h-full"
          />
        )}

        {/* Floating Bottom-Right Map Legend */}
        <div className="absolute bottom-3 right-3 bg-[#0a1128]/90 backdrop-blur-xs border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white text-[10px] shadow-lg z-30 pointer-events-none">
          <p className="font-bold text-slate-300 mb-1">Landslide Risk Level</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span className="text-slate-300 font-semibold">Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-300">Warning</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Nominal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
