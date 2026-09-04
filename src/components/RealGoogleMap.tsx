import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Building2, 
  MapPin, 
  AlertTriangle, 
  ExternalLink, 
  ShieldAlert, 
  Activity, 
  Droplets, 
  CloudRain, 
  Maximize2, 
  Minimize2, 
  Layers, 
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import { NER_STATES_DATA, HierarchicalSensorPin } from '../data/hierarchicalData';
import { NERMapStation, NER_MAP_STATIONS } from './DashboardRiskMap';

export type GoogleMapLayerType = 'hybrid' | 'terrain' | 'roadmap' | 'satellite';

interface RealGoogleMapProps {
  center?: [number, number];
  zoom?: number;
  stations?: (NERMapStation | HierarchicalSensorPin)[];
  selectedStationId?: string | null;
  onSelectStation?: (station: any) => void;
  showHazardBuffers?: boolean;
  mapType?: GoogleMapLayerType;
  className?: string;
  height?: string | number;
  interactive?: boolean;
  showLayerControls?: boolean;
  showLegend?: boolean;
  onNavigateToFullMap?: () => void;
}

// Google Maps Tile URL Generator
const getGoogleTileUrl = (type: GoogleMapLayerType) => {
  switch (type) {
    case 'hybrid':
      // Satellite imagery with roads and labels
      return 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    case 'terrain':
      // Topographic terrain with elevation and contours
      return 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
    case 'roadmap':
      // Standard Google Maps vector cartography
      return 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    case 'satellite':
      // Raw satellite imagery without labels
      return 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
    default:
      return 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
  }
};

export const RealGoogleMap: React.FC<RealGoogleMapProps> = ({
  center = [26.2006, 92.9376], // Center of North-Eastern Region (NER) India
  zoom = 7,
  stations = NER_MAP_STATIONS,
  selectedStationId = null,
  onSelectStation,
  showHazardBuffers = true,
  mapType: initialMapType = 'hybrid',
  className = '',
  height = '100%',
  interactive = true,
  showLayerControls = true,
  showLegend = true,
  onNavigateToFullMap,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const buffersLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeMapType, setActiveMapType] = useState<GoogleMapLayerType>(initialMapType);
  const [activeHazardBuffers, setActiveHazardBuffers] = useState<boolean>(showHazardBuffers);
  const [hoveredStation, setHoveredStation] = useState<any | null>(null);

  // Sync prop changes for initialMapType and showHazardBuffers
  useEffect(() => {
    setActiveMapType(initialMapType);
  }, [initialMapType]);

  useEffect(() => {
    setActiveHazardBuffers(showHazardBuffers);
  }, [showHazardBuffers]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [center[0], center[1]] as L.LatLngTuple,
      zoom: zoom,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false, // We render clean custom styled controls
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Add Real Google Maps Tile Layer
    const tileLayer = L.tileLayer(getGoogleTileUrl(activeMapType), {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 19,
      attribution: '&copy; Google Maps',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Add Layers Groups
    const buffersGroup = L.layerGroup().addTo(map);
    buffersLayerRef.current = buffersGroup;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Handle container resize cleanly (fixes scaling / rendering in iframes and responsive cards)
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Update Tile Layer when mapType changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(getGoogleTileUrl(activeMapType), {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 19,
      attribution: '&copy; Google Maps',
    }).addTo(mapInstanceRef.current);

    // Ensure tile layer stays beneath markers
    newTileLayer.bringToBack();
    tileLayerRef.current = newTileLayer;
  }, [activeMapType]);

  // Update Center and Zoom smoothly when props change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const currentCenter = mapInstanceRef.current.getCenter();
    const currentZoom = mapInstanceRef.current.getZoom();

    const latDiff = Math.abs(currentCenter.lat - center[0]);
    const lngDiff = Math.abs(currentCenter.lng - center[1]);
    const zoomDiff = Math.abs(currentZoom - zoom);

    if (latDiff > 0.001 || lngDiff > 0.001 || zoomDiff > 0.5) {
      mapInstanceRef.current.flyTo(center, zoom, {
        duration: 0.8,
        easeLinearity: 0.25,
      });
    }
  }, [center[0], center[1], zoom]);

  // Render Markers and Hazard Buffers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !buffersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    buffersLayerRef.current.clearLayers();

    stations.forEach((st: any) => {
      const lat = st.lat;
      const lng = st.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      const riskLevel = st.risk || (st.riskTier >= 3 ? 'critical' : st.riskTier === 2 ? 'warning' : 'nominal');
      const isCritical = riskLevel === 'critical';
      const isWarning = riskLevel === 'warning';
      const isSelected = selectedStationId === (st.id || st.pinId);

      const name = st.name || st.areaName || 'Sector';
      const district = st.district || st.districtName || 'NER';
      const state = st.state || st.stateName || 'India';
      const pore = st.pore || (st.poreWaterPressure_kPa ? `${st.poreWaterPressure_kPa} kPa` : '42 kPa');
      const rain = st.rain || '45 mm/hr';
      const displacement = st.displacement || (st.slopeDisplacement_mm ? `${st.slopeDisplacement_mm} mm` : '2.4 mm');
      const hazardNote = st.hazardNote || st.geotechnicalAssessment || 'Active slope stability monitoring in progress.';

      // 1. Hazard Buffer Circle (500m - 1500m radius depending on risk)
      if (activeHazardBuffers) {
        const radius = isCritical ? 1500 : isWarning ? 1000 : 500;
        const color = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

        const circle = L.circle([lat, lng], {
          radius: radius,
          color: color,
          weight: isCritical ? 2 : 1,
          opacity: 0.7,
          fillColor: color,
          fillOpacity: isCritical ? 0.25 : 0.15,
          dashArray: isCritical ? undefined : '4, 4',
        });
        buffersLayerRef.current.addLayer(circle);
      }

      // 2. Custom Marker Pin
      const markerHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -100%);">
          ${isCritical ? '<span class="absolute -inset-2 rounded-full bg-rose-500/50 animate-ping"></span>' : ''}
          ${isWarning ? '<span class="absolute -inset-1.5 rounded-full bg-amber-400/40 animate-pulse"></span>' : ''}
          <div class="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 border-white shadow-2xl text-[11px] font-bold text-white transition-all transform hover:scale-115 ${
            isCritical
              ? 'bg-rose-600 ring-2 ring-rose-400'
              : isWarning
              ? 'bg-amber-500 ring-2 ring-amber-300'
              : 'bg-emerald-600 ring-2 ring-emerald-300'
          } ${isSelected ? 'scale-120 ring-4 ring-white shadow-2xl' : ''}">
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span class="whitespace-nowrap">${name.split(' ')[0]}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-google-map-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Interactive Popup
      const popupHtml = `
        <div class="p-1 font-sans text-xs space-y-2 min-w-[220px] max-w-[280px]">
          <div class="border-b border-stone-200 pb-1.5 flex items-center justify-between">
            <span class="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded text-white ${
              isCritical ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-600'
            }">
              ${riskLevel.toUpperCase()} RISK
            </span>
            <span class="text-[10px] text-stone-500 font-mono">
              ${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E
            </span>
          </div>

          <div>
            <h4 class="font-bold text-sm text-stone-900 leading-tight">${name}</h4>
            <div class="text-[11px] text-blue-900 font-semibold mt-0.5">
              ${district}, ${state}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-1.5 bg-stone-50 p-2 rounded text-[11px] font-mono border border-stone-100">
            <div>
              <span class="text-[10px] text-stone-500 block">Pore Water</span>
              <strong class="text-stone-900">${pore}</strong>
            </div>
            <div>
              <span class="text-[10px] text-stone-500 block">Rainfall</span>
              <strong class="text-stone-900">${rain}</strong>
            </div>
            <div class="col-span-2 pt-1 border-t border-stone-200/60">
              <span class="text-[10px] text-stone-500 block">Slope Creep / Velocity</span>
              <strong class="${isCritical ? 'text-rose-600' : 'text-amber-600'}">${displacement}</strong>
            </div>
          </div>

          <div class="text-[11px] text-stone-700 bg-amber-50/80 p-2 rounded border border-amber-200/80">
            <strong class="block text-[10px] text-stone-600 uppercase tracking-wider mb-0.5">Geotech Advisory:</strong>
            ${hazardNote}
          </div>

          <div class="pt-1 flex flex-col gap-1">
            <a 
              href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" 
              target="_blank" 
              rel="noreferrer"
              class="w-full text-center py-1.5 bg-slate-900 hover:bg-black text-white rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
            >
              <span>Inspect on Google Maps</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 320,
        className: 'custom-google-map-popup',
      });

      marker.on('click', () => {
        if (onSelectStation) {
          onSelectStation(st);
        }
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [stations, selectedStationId, activeHazardBuffers]);

  // Handle Zoom In / Out controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(center, zoom, { duration: 0.8 });
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[300px] overflow-hidden select-none ${className}`}>
      {/* Real Google Maps Leaflet Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0 bg-[#0a1128]"
        style={{ minHeight: '100%', height: typeof height === 'number' ? `${height}px` : height }}
      />

      {/* Floating Google Maps Style Selector Pill (Top-Right) */}
      {showLayerControls && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-[#0a1128]/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl text-white text-xs">
          <button
            onClick={() => setActiveMapType('hybrid')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeMapType === 'hybrid'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Google Satellite imagery with roads and labels"
          >
            Hybrid
          </button>
          <button
            onClick={() => setActiveMapType('terrain')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeMapType === 'terrain'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Google Topographic terrain & elevation relief"
          >
            Terrain
          </button>
          <button
            onClick={() => setActiveMapType('roadmap')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeMapType === 'roadmap'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Google Roadmap vector map"
          >
            Roadmap
          </button>

          <div className="w-px h-4 bg-slate-700 mx-0.5" />

          {/* Hazard Buffer Toggle */}
          <button
            onClick={() => setActiveHazardBuffers(!activeHazardBuffers)}
            className={`px-2 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all ${
              activeHazardBuffers
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Landslide Hazard Buffer Zones"
          >
            {activeHazardBuffers ? 'Buffers ON' : 'Buffers OFF'}
          </button>
        </div>
      )}

      {/* Floating Zoom & Recenter Controls (Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
        <div className="bg-[#0a1128]/90 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-xl overflow-hidden flex flex-col">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom in"
          >
            <span className="text-lg font-bold leading-none">+</span>
          </button>
          <div className="w-full h-px bg-slate-700" />
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom out"
          >
            <span className="text-lg font-bold leading-none">&minus;</span>
          </button>
        </div>

        <button
          onClick={handleRecenter}
          className="p-2 bg-[#0a1128]/90 hover:bg-slate-800 text-cyan-400 rounded-xl border border-slate-700/80 shadow-xl transition-colors flex items-center justify-center"
          title="Recenter to North-East Region"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {onNavigateToFullMap && (
          <button
            onClick={onNavigateToFullMap}
            className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-xl transition-colors flex items-center justify-center"
            title="Open Full Risk Map View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Official Google Maps Watermark & Coordinates Indicator (Bottom-Left) */}
      <div className="absolute bottom-2 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="bg-[#0a1128]/85 backdrop-blur-xs px-2 py-1 rounded-md border border-slate-700/60 text-[10px] font-mono text-slate-300 flex items-center gap-2">
          <span className="font-bold text-white tracking-wide">Google Maps</span>
          <span>&bull;</span>
          <span>NER India (22°N-29°N, 88°E-97°E)</span>
        </div>
      </div>
    </div>
  );
};
