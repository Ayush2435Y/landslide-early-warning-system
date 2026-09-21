import React from 'react';
import { 
  REGIONAL_NER_TOPO_SHEET,
  REGIONAL_HYPSOMETRIC_ZONES,
  REGIONAL_CONTOURS,
  REGIONAL_GEOLOGIC_FAULTS,
  REGIONAL_RIVER_SYSTEMS,
  STATE_TOPO_DETAILS,
  DISTRICT_MICRO_CATCHMENTS,
} from '../data/scannedMapData';
import { NERStateInfo, NERDistrictInfo } from '../data/hierarchicalData';
import { MapHierarchyLevel } from './MapCanvas';
import { Compass, Layers, Activity, AlertTriangle, Mountain, Droplets, MapPin, Eye, FileText, CheckCircle2 } from 'lucide-react';

interface NERScannedMapLayerProps {
  hierarchyLevel: MapHierarchyLevel;
  activeState: NERStateInfo | null;
  activeDistrict: NERDistrictInfo | null;
  showContours?: boolean;
  showFaults?: boolean;
  showRivers?: boolean;
  showGrid?: boolean;
  showHypsometric?: boolean;
  onSelectFault?: (fault: any) => void;
  onSelectTerrainFeature?: (feature: any) => void;
  onDrillDownToState?: (state: NERStateInfo) => void;
  onDrillDownToDistrict?: (district: NERDistrictInfo, state: NERStateInfo) => void;
}

export const NERScannedMapLayer: React.FC<NERScannedMapLayerProps> = ({
  hierarchyLevel,
  activeState,
  activeDistrict,
  showContours = true,
  showFaults = true,
  showRivers = true,
  showGrid = true,
  showHypsometric = true,
  onSelectFault,
  onSelectTerrainFeature,
  onDrillDownToState,
  onDrillDownToDistrict,
}) => {
  const stateTopo = activeState ? STATE_TOPO_DETAILS[activeState.id] : null;
  const districtCatchment = activeDistrict ? DISTRICT_MICRO_CATCHMENTS[activeDistrict.id] : null;

  return (
    <div className="absolute inset-0 pointer-events-auto overflow-hidden select-none">
      
      {/* ================= VINTAGE / CARTOGRAPHIC SCANNED TOPO SHEET TEXTURE & BACKGROUND ================= */}
      <div 
        className="absolute inset-0 bg-[#e8e2cf] bg-blend-multiply opacity-100"
        style={{
          backgroundImage: `
            radial-gradient(#b8ad8a 1px, transparent 1px),
            linear-gradient(to right, rgba(160, 145, 110, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(160, 145, 110, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px, 48px 48px, 48px 48px',
        }}
      />

      {/* Subtle Hillshade / Vignette Mask */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.4) 0%, rgba(130,115,80,0.4) 75%, rgba(70,60,40,0.6) 100%)'
        }}
      />

      {/* ================= HYPSOMETRIC ELEVATION TINTS (SHADED RELIEF) ================= */}
      {showHypsometric && hierarchyLevel === 'regional' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <filter id="scanned-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.8" />
            </filter>
          </defs>
          <g filter="url(#scanned-blur)">
            {REGIONAL_HYPSOMETRIC_ZONES.map((zone) => (
              <path
                key={zone.id}
                d={zone.pathD}
                fill={zone.fillColor}
                fillOpacity={zone.fillOpacity}
                stroke={zone.fillColor}
                strokeWidth="0.8"
                style={{ mixBlendMode: 'multiply' }}
              />
            ))}
          </g>
        </svg>
      )}

      {/* ================= GSI / SURVEY OF INDIA QUADRANGLE LAT/LNG GRID ================= */}
      {showGrid && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-[#8a7f65] stroke-opacity-40" fill="none">
          {/* Latitude Lines */}
          <line x1="0%" y1="18%" x2="100%" y2="18%" strokeWidth="0.75" strokeDasharray="3,3" />
          <line x1="0%" y1="36%" x2="100%" y2="36%" strokeWidth="0.75" strokeDasharray="3,3" />
          <line x1="0%" y1="54%" x2="100%" y2="54%" strokeWidth="0.75" strokeDasharray="3,3" />
          <line x1="0%" y1="72%" x2="100%" y2="72%" strokeWidth="0.75" strokeDasharray="3,3" />

          {/* Longitude Lines */}
          <line x1="20%" y1="0%" x2="20%" y2="100%" strokeWidth="0.75" strokeDasharray="3,3" />
          <line x1="40%" y1="0%" x2="40%" y2="100%" strokeWidth="0.75" strokeDasharray="3,3" />
          <line x1="60%" y1="0%" x2="60%" y2="100%" strokeWidth="0.75" strokeDasharray="3,3" />
          <line x1="80%" y1="0%" x2="80%" y2="100%" strokeWidth="0.75" strokeDasharray="3,3" />

          {/* Grid Intersections Crosses */}
          {['20%', '40%', '60%', '80%'].map((x) =>
            ['18%', '36%', '54%', '72%'].map((y) => (
              <g key={`cross-${x}-${y}`} className="stroke-[#5c523d] stroke-opacity-70" strokeWidth="1.2">
                <line x1={`calc(${x} - 4px)`} y1={y} x2={`calc(${x} + 4px)`} y2={y} />
                <line x1={x} y1={`calc(${y} - 4px)`} x2={x} y2={`calc(${y} + 4px)`} />
              </g>
            ))
          )}
        </svg>
      )}

      {/* Grid Coordinates Stamps along edges */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none text-[9px] font-mono font-bold text-[#635740] select-none">
          <span className="absolute top-2 left-[20%] -translate-x-1/2">91°00'E</span>
          <span className="absolute top-2 left-[40%] -translate-x-1/2">92°30'E</span>
          <span className="absolute top-2 left-[60%] -translate-x-1/2">94°00'E</span>
          <span className="absolute top-2 left-[80%] -translate-x-1/2">95°30'E</span>

          <span className="absolute top-[18%] left-2 -translate-y-1/2">27°30'N</span>
          <span className="absolute top-[36%] left-2 -translate-y-1/2">26°15'N</span>
          <span className="absolute top-[54%] left-2 -translate-y-1/2">25°00'N</span>
          <span className="absolute top-[72%] left-2 -translate-y-1/2">23°45'N</span>
        </div>
      )}

      {/* ================= HYDROLOGY / RIVER DRAINAGE NETWORK (BRAHMAPUTRA & TRIBUTARIES) ================= */}
      {showRivers && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* River Braided Channels */}
          {REGIONAL_RIVER_SYSTEMS.map((riv) => (
            <g key={riv.id}>
              {/* Soft Water Glow */}
              <path
                d={riv.pathD}
                fill="none"
                stroke="#689fc7"
                strokeWidth={riv.strokeWidth + 1.2}
                strokeOpacity="0.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Primary River Channel */}
              <path
                d={riv.pathD}
                fill="none"
                stroke="#2a668c"
                strokeWidth={riv.strokeWidth}
                strokeOpacity="0.85"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </svg>
      )}

      {/* River Basin Text Annotations */}
      {showRivers && (
        <div className="absolute inset-0 pointer-events-none text-[10px] font-serif italic text-[#1d4f6d] font-bold select-none">
          {REGIONAL_RIVER_SYSTEMS.map((riv) => (
            <div
              key={`label-${riv.id}`}
              style={{ top: `${riv.labelPos.y}%`, left: `${riv.labelPos.x}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 bg-[#e8e2cf]/70 backdrop-blur-2xs px-1.5 py-0.2 rounded border border-[#689fc7]/40 shadow-2xs rotate-[-3deg]"
            >
              {riv.name}
            </div>
          ))}
        </div>
      )}

      {/* ================= TOPOGRAPHIC CONTOUR LINES WITH ELEVATION LABELS ================= */}
      {showContours && hierarchyLevel === 'regional' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {REGIONAL_CONTOURS.map((c) => (
            <path
              key={c.id}
              d={c.pathD}
              fill="none"
              stroke="#735c3c"
              strokeWidth={c.isIndex ? 1.4 : 0.75}
              strokeOpacity={c.isIndex ? 0.75 : 0.45}
              strokeDasharray={c.isIndex ? undefined : '2,2'}
            />
          ))}
        </svg>
      )}

      {/* Regional Contour Elevation Labels */}
      {showContours && hierarchyLevel === 'regional' && (
        <div className="absolute inset-0 pointer-events-none text-[8.5px] font-mono text-[#544026] font-bold select-none">
          {REGIONAL_CONTOURS.filter((c) => c.label && c.labelPosition).map((c) => (
            <div
              key={`clabel-${c.id}`}
              style={{ top: `${c.labelPosition!.y}%`, left: `${c.labelPosition!.x}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 bg-[#dfd6be] px-1 py-0.2 rounded border border-[#8a7251]/60 shadow-2xs"
            >
              {c.label}
            </div>
          ))}
        </div>
      )}

      {/* ================= GEOLOGICAL FAULT LINES (Dauki, Kopili, Naga Thrust) ================= */}
      {showFaults && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {REGIONAL_GEOLOGIC_FAULTS.map((fault) => (
            <g key={fault.id}>
              {/* Danger Zone Line Accent */}
              <path
                d={fault.pathD}
                fill="none"
                stroke="#c92a2a"
                strokeWidth="2.2"
                strokeDasharray="4,2"
                strokeOpacity="0.85"
              />
              <path
                d={fault.pathD}
                fill="none"
                stroke="#690000"
                strokeWidth="0.8"
                strokeOpacity="0.9"
              />
            </g>
          ))}
        </svg>
      )}

      {/* Fault Labels on the Scanned Map */}
      {showFaults && (
        <div className="absolute inset-0 pointer-events-auto text-[9px] font-mono font-bold text-[#8a1414] select-none">
          {REGIONAL_GEOLOGIC_FAULTS.map((fault) => (
            <button
              key={`flabel-${fault.id}`}
              style={{ top: `${fault.labelPos.y}%`, left: `${fault.labelPos.x}%` }}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectFault) onSelectFault(fault);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 bg-amber-50/95 border border-red-700/60 text-red-900 px-2 py-0.5 rounded shadow-sm hover:scale-105 hover:bg-red-50 transition-all flex items-center gap-1 cursor-pointer pointer-events-auto"
            >
              <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
              <span>{fault.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ================= LEVEL 2: STATE-SPECIFIC DETAILED CONTOURS & FORMATION (STATE VIEW) ================= */}
      {hierarchyLevel === 'state' && stateTopo && (
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {stateTopo.stateContours.map((sc) => (
              <path
                key={sc.id}
                d={sc.pathD}
                fill="none"
                stroke="#5c4526"
                strokeWidth={sc.isIndex ? 1.6 : 0.9}
                strokeOpacity="0.75"
              />
            ))}
          </svg>

          {/* Elevation badges */}
          <div className="absolute inset-0 text-[9px] font-mono text-[#4a3418] font-bold">
            {stateTopo.stateContours.filter((sc) => sc.label && sc.labelPosition).map((sc) => (
              <div
                key={`sc-label-${sc.id}`}
                style={{ top: `${sc.labelPosition!.y}%`, left: `${sc.labelPosition!.x}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 bg-[#ded4bb] px-1.5 py-0.5 rounded border border-[#785b34] shadow-xs"
              >
                {sc.label}
              </div>
            ))}
          </div>

          {/* Geological Formation Seal for Active State */}
          <div className="absolute bottom-16 left-20 bg-[#f4ebd0]/95 backdrop-blur-xs p-3 rounded-lg border-2 border-[#7a6442] shadow-lg max-w-xs pointer-events-auto">
            <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#42321c] border-b border-[#a8936f] pb-1">
              <Mountain className="w-3.5 h-3.5 text-[#85531d]" />
              <span>{stateTopo.topoSheetCode}</span>
            </div>
            <div className="mt-1.5 space-y-1 text-[10px] font-mono text-[#574428]">
              <div>
                <span className="font-bold text-[#382b18]">Geology: </span>
                {stateTopo.geologicalEpoch}
              </div>
              <div>
                <span className="font-bold text-[#382b18]">Rock Type: </span>
                {stateTopo.primaryRockTypes}
              </div>
              <div>
                <span className="font-bold text-[#8c2514]">Mechanism: </span>
                {stateTopo.landslideMechanism}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= LEVEL 3: DISTRICT MICRO-CATCHMENT CADASTRAL OVERLAY (DISTRICT VIEW) ================= */}
      {hierarchyLevel === 'district' && districtCatchment && (
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {districtCatchment.microContours.map((mc, idx) => (
              <path
                key={`mc-${idx}`}
                d={mc.pathD}
                fill="none"
                stroke="#543c1f"
                strokeWidth={mc.isIndex ? 1.8 : 1.0}
                strokeOpacity="0.8"
                strokeDasharray={mc.isIndex ? undefined : '3,2'}
              />
            ))}
          </svg>

          {/* Cadastral Engineering Strip Seal */}
          <div className="absolute bottom-16 left-20 bg-[#f7f0dc]/95 backdrop-blur-xs p-3.5 rounded-xl border-2 border-[#80633b] shadow-xl max-w-sm pointer-events-auto">
            <div className="flex items-center justify-between border-b border-[#a68c65] pb-1 mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#382914]">
                <Activity className="w-3.5 h-3.5 text-red-700" />
                <span>{districtCatchment.cadastralScale}</span>
              </div>
              <span className="bg-red-800 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">
                FS: {districtCatchment.criticalFactorOfSafety}
              </span>
            </div>

            <div className="space-y-1 text-[10px] font-mono text-[#574428]">
              <div className="font-bold text-[#2d210f]">{districtCatchment.catchmentName}</div>
              <div className="flex justify-between">
                <span>Slope Aspect:</span>
                <span className="font-bold">{districtCatchment.slopeAspect}</span>
              </div>
              <div className="flex justify-between">
                <span>Hydraulic Cond:</span>
                <span className="font-bold">{districtCatchment.hydraulicConductivity}</span>
              </div>
            </div>

            {/* Micro Hazard Zones */}
            <div className="mt-2 pt-1.5 border-t border-[#bfa884] space-y-1">
              <div className="text-[9px] font-bold uppercase text-[#732214]">Mapped Shear & Tension Zones:</div>
              {districtCatchment.hazardZones.map((hz, idx) => (
                <div key={idx} className="bg-red-100/60 p-1 rounded border border-red-300 text-[9px] flex justify-between items-center text-red-950">
                  <span className="font-semibold">{hz.name}</span>
                  <span className="font-bold bg-red-700 text-white px-1 py-0.2 rounded text-[8px]">{hz.risk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= AUTHENTIC GSI / SOI VINTAGE MAP BANNER & QUADRANGLE STAMP (BOTTOM LEFT) ================= */}
      <div className="absolute top-20 right-4 pointer-events-auto bg-[#f5eedb]/95 backdrop-blur-md p-2.5 rounded-lg border border-[#8a7251] shadow-md max-w-xs select-none">
        <div className="flex items-center justify-between border-b border-[#a8906f] pb-1 mb-1">
          <div className="flex items-center gap-1 text-[10px] font-serif font-extrabold text-[#3d2f1c]">
            <Compass className="w-3.5 h-3.5 text-[#735122]" />
            <span>GEOLOGICAL SURVEY OF INDIA</span>
          </div>
          <span className="text-[8px] font-mono bg-[#ded0b6] px-1 py-0.2 rounded border border-[#9c8465] text-[#4d3c26]">
            TOPO-78/83
          </span>
        </div>
        <div className="text-[9px] font-mono text-[#574428] leading-tight space-y-0.5">
          <div className="font-bold text-[#2d210f]">
            {hierarchyLevel === 'regional' 
              ? 'NER Regional Topographic Scan (1:250,000)' 
              : hierarchyLevel === 'state' && stateTopo 
              ? `${stateTopo.stateId.toUpperCase()} State Survey Sheet (1:50,000)` 
              : districtCatchment 
              ? `${districtCatchment.catchmentName} (1:10,000)`
              : 'NER High-Precision Topographic Scan'}
          </div>
          <div className="text-[8px] text-[#705837]">Datum: WGS-84 / UTM-46N • Contours: 100m / 20m</div>
        </div>
      </div>

    </div>
  );
};
