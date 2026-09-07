import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Download,
  Droplets,
  ExternalLink,
  Eye,
  Filter,
  Gauge,
  Layers,
  MapPin,
  Maximize2,
  Mountain,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
  Wifi,
  Wind,
  X,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { SensorData, TriggeredAlert } from '../types';

export interface MonitoredArea {
  id: string;
  name: string; // Area Name (prominently displayed)
  state: string; // NER State
  district: string;
  sector: string; // Regional corridor / mountain range
  riskLevel: 'critical' | 'warning' | 'moderate' | 'safe';
  riskTier: 3 | 2 | 1 | 0;
  riskScore: number; // 0 - 100%
  hazardType: string;
  factorOfSafety: number; // e.g. 0.81 (critical < 1.0)
  porePressure: number; // in kPa
  porePressureThreshold: number; // in kPa
  rainfallRate: number; // in mm/h
  rainfall24h: number; // in mm
  soilMoisture: number; // in % VWC
  displacement: number; // in mm/hr
  displacementThreshold: number; // in mm/hr
  elevation: number; // in meters
  lat: number;
  lng: number;
  geology: string;
  populationAtRisk: string;
  evacuationStatus: string;
  recommendedAction: string;
  sparkline: number[]; // live 8-point telemetry trend
  lastUpdatedSeconds: number; // seconds ago
  isSurging?: boolean;
}

// Master list of all monitored geographical landslide areas across the 7 NER States
const BASE_MONITORED_AREAS: MonitoredArea[] = [
  {
    id: 'area-sohra-ridge',
    name: 'East Khasi Hills Escarpment (Sohra Ridge)',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    sector: 'Shillong Peak & Sohra Corridor',
    riskLevel: 'critical',
    riskTier: 3,
    riskScore: 96,
    hazardType: 'Torrential Pluvial Saturated Debris Flow & Karst Collapse',
    factorOfSafety: 0.81,
    porePressure: 58.4,
    porePressureThreshold: 45.0,
    rainfallRate: 72.4,
    rainfall24h: 148.0,
    soilMoisture: 94.0,
    displacement: 4.8,
    displacementThreshold: 2.0,
    elevation: 1420,
    lat: 25.2702,
    lng: 91.7323,
    geology: 'Shillong Plateau Quartzite & Weathered Karst Sandstone',
    populationAtRisk: '~4,200 residents in valley basin & NH-6 commuters',
    evacuationStatus: 'Red Evacuation Advisory In Effect',
    recommendedAction: 'Immediate evacuation advisory for valley villages and NH-6 traffic hold.',
    sparkline: [42, 45, 48, 51, 53, 56, 57.5, 58.4],
    lastUpdatedSeconds: 2,
  },
  {
    id: 'area-paglapahar-nh29',
    name: 'Paglapahar Sinking Zone (NH-29 Corridor)',
    state: 'Nagaland',
    district: 'Dimapur-Kohima',
    sector: 'Kohima-Dimapur NH-29 Corridor',
    riskLevel: 'critical',
    riskTier: 3,
    riskScore: 93,
    hazardType: 'Highway Embankment Sinking & Disang Shale Shear Slip',
    factorOfSafety: 0.86,
    porePressure: 52.6,
    porePressureThreshold: 42.0,
    rainfallRate: 54.0,
    rainfall24h: 96.0,
    soilMoisture: 91.5,
    displacement: 3.9,
    displacementThreshold: 1.5,
    elevation: 780,
    lat: 25.6751,
    lng: 94.1086,
    geology: 'Weathered Disang Shale with Montmorillonite Active Clay',
    populationAtRisk: '~2,500 daily highway commuters & transit vehicles',
    evacuationStatus: 'Red Alert: Road Slip Traffic Blockade',
    recommendedAction: 'Close outer two lanes of NH-29; position emergency recovery dozers.',
    sparkline: [1.2, 1.6, 2.1, 2.5, 2.9, 3.3, 3.7, 3.9],
    lastUpdatedSeconds: 3,
  },
  {
    id: 'area-pasighat-slope',
    name: 'Pasighat Hill Slope (Siang Foothills)',
    state: 'Arunachal Pradesh',
    district: 'East Siang',
    sector: 'Siang River Basin & Foothills',
    riskLevel: 'critical',
    riskTier: 3,
    riskScore: 89,
    hazardType: 'Active Debris-Flow Runoff & Saturated Colluvial Failure',
    factorOfSafety: 0.89,
    porePressure: 58.4,
    porePressureThreshold: 46.0,
    rainfallRate: 68.0,
    rainfall24h: 112.5,
    soilMoisture: 89.0,
    displacement: 3.6,
    displacementThreshold: 1.8,
    elevation: 155,
    lat: 28.0660,
    lng: 95.3260,
    geology: 'Sub-Himalayan Siwalik Sandstone & Unconsolidated Boulder Beds',
    populationAtRisk: '~3,100 settlement inhabitants near downstream fan',
    evacuationStatus: 'Red Evacuation Zone Active',
    recommendedAction: 'Immediate slope evacuation zone activated; SDRF units notified.',
    sparkline: [38, 41, 46, 49, 52, 55, 57, 58.4],
    lastUpdatedSeconds: 5,
  },
  {
    id: 'area-ijai-basin',
    name: 'Ijai River Basin (Tupul Noney Corridor)',
    state: 'Manipur',
    district: 'Noney',
    sector: 'Tupul Noney Valley Corridor',
    riskLevel: 'critical',
    riskTier: 3,
    riskScore: 88,
    hazardType: 'Colluvial Mass Liquefaction & Micro-Tremor Induced Sliding',
    factorOfSafety: 0.92,
    porePressure: 48.5,
    porePressureThreshold: 40.0,
    rainfallRate: 42.0,
    rainfall24h: 78.0,
    soilMoisture: 86.0,
    displacement: 3.1,
    displacementThreshold: 2.0,
    elevation: 620,
    lat: 24.8170,
    lng: 93.6820,
    geology: 'Ijai River Basin Clay-rich Mudstone and Loose Colluvium',
    populationAtRisk: '~1,400 construction personnel & riverside hamlets',
    evacuationStatus: 'High Alert: Damming Risk',
    recommendedAction: 'Dispatch patrol teams; monitor river impoundment and debris damming.',
    sparkline: [2.1, 2.3, 2.5, 2.7, 2.9, 3.0, 3.05, 3.1],
    lastUpdatedSeconds: 7,
  },
  {
    id: 'area-narakasur-hill',
    name: 'Narakasur Hill Escarpment (Guwahati)',
    state: 'Assam',
    district: 'Kamrup Metropolitan',
    sector: 'Guwahati Hills Urban Corridor',
    riskLevel: 'warning',
    riskTier: 2,
    riskScore: 74,
    hazardType: 'Urban Hill Cutting Gully Erosion & Pore Water Pressure Surge',
    factorOfSafety: 1.05,
    porePressure: 42.8,
    porePressureThreshold: 40.0,
    rainfallRate: 28.5,
    rainfall24h: 58.4,
    soilMoisture: 78.5,
    displacement: 1.8,
    displacementThreshold: 1.5,
    elevation: 210,
    lat: 26.1445,
    lng: 91.7362,
    geology: 'Precambrian Gneissic Inliers & Thick Weathered Red Colluvium',
    populationAtRisk: '~5,800 hillside urban residents & foothill settlements',
    evacuationStatus: 'Orange Advisory: High Risk Alert',
    recommendedAction: 'Clear natural drainage pathways and restrict uphill excavation.',
    sparkline: [34, 36, 37, 39, 40, 41, 42.1, 42.8],
    lastUpdatedSeconds: 4,
  },
  {
    id: 'area-haflong-rail',
    name: 'Lumding-Badarpur Rail Hill Cut (Haflong)',
    state: 'Assam',
    district: 'Dima Hasao',
    sector: 'Dima Hasao Rail & Highway Corridor',
    riskLevel: 'warning',
    riskTier: 2,
    riskScore: 68,
    hazardType: 'Railway Hill Cut Subsurface Creep & Toe Erosion',
    factorOfSafety: 1.10,
    porePressure: 41.2,
    porePressureThreshold: 38.0,
    rainfallRate: 32.0,
    rainfall24h: 64.0,
    soilMoisture: 76.0,
    displacement: 1.6,
    displacementThreshold: 1.5,
    elevation: 680,
    lat: 25.1741,
    lng: 93.0182,
    geology: 'Disang-Barail Sandstone / Siltstone Flysch formation',
    populationAtRisk: 'Railway passenger services & 8 maintenance camps',
    evacuationStatus: 'Orange Advisory: Rail Speed Limits',
    recommendedAction: 'Speed restriction (20 km/h) for hill section freight & passenger trains.',
    sparkline: [0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.55, 1.6],
    lastUpdatedSeconds: 8,
  },
  {
    id: 'area-aizawl-hunthar',
    name: 'Aizawl Cliff Corridor (Hunthar Slopes)',
    state: 'Mizoram',
    district: 'Aizawl',
    sector: 'Aizawl Hunthar Slopes',
    riskLevel: 'warning',
    riskTier: 2,
    riskScore: 65,
    hazardType: 'Deep Translational Slope Slip & Surface Runoff Loading',
    factorOfSafety: 1.12,
    porePressure: 43.5,
    porePressureThreshold: 40.0,
    rainfallRate: 34.0,
    rainfall24h: 60.0,
    soilMoisture: 74.0,
    displacement: 1.5,
    displacementThreshold: 1.5,
    elevation: 1130,
    lat: 23.7271,
    lng: 92.7176,
    geology: 'Surma Group Siltstone / Thinly Bedded Sandstone',
    populationAtRisk: '~3,400 hillside residences & main city ring road',
    evacuationStatus: 'Orange Watch: Slope Stabilization',
    recommendedAction: 'Deploy soil anchor monitoring; divert stormwater drains away from crest.',
    sparkline: [35, 37, 38, 40, 41, 42, 42.9, 43.5],
    lastUpdatedSeconds: 6,
  },
  {
    id: 'area-kohima-bypass',
    name: 'Kohima Bypass Escarpment',
    state: 'Nagaland',
    district: 'Kohima',
    sector: 'Nagaland Central Ridge',
    riskLevel: 'warning',
    riskTier: 2,
    riskScore: 62,
    hazardType: 'Downhill Creep on Road Shoulder & Colluvial Slumping',
    factorOfSafety: 1.18,
    porePressure: 39.8,
    porePressureThreshold: 38.0,
    rainfallRate: 26.0,
    rainfall24h: 52.0,
    soilMoisture: 71.0,
    displacement: 1.3,
    displacementThreshold: 1.5,
    elevation: 1440,
    lat: 25.6751,
    lng: 94.1086,
    geology: 'Disang Flysch series with intense structural folding',
    populationAtRisk: 'Inter-district transport routes and local villages',
    evacuationStatus: 'Yellow Watch: Active Monitoring',
    recommendedAction: 'Inspect retaining wall weep holes; maintain continuous watch.',
    sparkline: [32, 33, 35, 36, 37, 38, 39.2, 39.8],
    lastUpdatedSeconds: 11,
  },
  {
    id: 'area-shillong-peak',
    name: 'Shillong Peak Escarpment',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    sector: 'Shillong Plateau Contact Zone',
    riskLevel: 'warning',
    riskTier: 2,
    riskScore: 61,
    hazardType: 'Upper Plateau Sandstone Contact Fracture under Saturation',
    factorOfSafety: 1.20,
    porePressure: 38.5,
    porePressureThreshold: 36.0,
    rainfallRate: 29.0,
    rainfall24h: 54.0,
    soilMoisture: 69.5,
    displacement: 1.2,
    displacementThreshold: 1.5,
    elevation: 1965,
    lat: 25.5412,
    lng: 91.8622,
    geology: 'Shillong Group Quartzite capping Archaean Gneissic Basement',
    populationAtRisk: 'Defence communications perimeter & tourist transit road',
    evacuationStatus: 'Yellow Watch: Contact Fracture',
    recommendedAction: 'Inspect fracture dilation markers at weekly intervals.',
    sparkline: [31, 32, 34, 35, 36, 37, 38.1, 38.5],
    lastUpdatedSeconds: 9,
  },
  {
    id: 'area-itanagar-nh415',
    name: 'Itanagar Capital Slope (NH-415)',
    state: 'Arunachal Pradesh',
    district: 'Papum Pare',
    sector: 'Papum Pare Foothills',
    riskLevel: 'warning',
    riskTier: 2,
    riskScore: 58,
    hazardType: 'Pore Saturation along Road Cutting & Loose Overburden Wash',
    factorOfSafety: 1.24,
    porePressure: 36.2,
    porePressureThreshold: 35.0,
    rainfallRate: 24.0,
    rainfall24h: 46.0,
    soilMoisture: 67.0,
    displacement: 1.1,
    displacementThreshold: 1.5,
    elevation: 320,
    lat: 27.0844,
    lng: 93.6053,
    geology: 'Lower Siwalik Sandstone with weathered micaceous siltstone',
    populationAtRisk: 'Capital highway traffic & slope residences',
    evacuationStatus: 'Yellow Watch: Road Sump Drainage',
    recommendedAction: 'Clean road drainage culverts; monitor slope toe seepage.',
    sparkline: [29, 31, 32, 33, 34, 35, 35.8, 36.2],
    lastUpdatedSeconds: 14,
  },
  {
    id: 'area-sela-range',
    name: 'Sela Range Footing (Tawang Pass)',
    state: 'Arunachal Pradesh',
    district: 'West Kameng',
    sector: 'Tawang-Bhalukpong Corridor',
    riskLevel: 'moderate',
    riskTier: 1,
    riskScore: 52,
    hazardType: 'Alpine Snowmelt & Periglacial Colluvial Wash',
    factorOfSafety: 1.35,
    porePressure: 32.0,
    porePressureThreshold: 38.0,
    rainfallRate: 18.0,
    rainfall24h: 38.0,
    soilMoisture: 63.0,
    displacement: 0.8,
    displacementThreshold: 1.5,
    elevation: 2750,
    lat: 27.5861,
    lng: 91.8594,
    geology: 'High Himalayan Gneiss & Steep Glacial Moraine Debris',
    populationAtRisk: 'Strategic military transit corridor & alpine settlements',
    evacuationStatus: 'Advisory: Nominal Transit',
    recommendedAction: 'Monitor culverts for glacial debris damming.',
    sparkline: [26, 27, 28, 29, 30, 31, 31.5, 32.0],
    lastUpdatedSeconds: 15,
  },
  {
    id: 'area-ziro-valley',
    name: 'Ziro Valley Ridge',
    state: 'Arunachal Pradesh',
    district: 'Lower Subansiri',
    sector: 'Apatani Plateau Basin',
    riskLevel: 'moderate',
    riskTier: 1,
    riskScore: 38,
    hazardType: 'Terraced Paddy Water Infiltration on Gentle Ridge',
    factorOfSafety: 1.48,
    porePressure: 28.5,
    porePressureThreshold: 36.0,
    rainfallRate: 14.0,
    rainfall24h: 28.0,
    soilMoisture: 58.0,
    displacement: 0.5,
    displacementThreshold: 1.5,
    elevation: 1570,
    lat: 27.5950,
    lng: 93.8385,
    geology: 'Metamorphic Biotite Schist with lacustrine terrace silt',
    populationAtRisk: 'Agricultural communities & local hamlets',
    evacuationStatus: 'Stable: Continuous Surveillance',
    recommendedAction: 'Routine soil water dissipation tracking.',
    sparkline: [24, 25, 26, 26.5, 27, 27.5, 28, 28.5],
    lastUpdatedSeconds: 22,
  },
  {
    id: 'area-imphal-valley',
    name: 'Imphal Valley Approach',
    state: 'Manipur',
    district: 'Imphal West',
    sector: 'Manipur Central Valley Perimeter',
    riskLevel: 'safe',
    riskTier: 0,
    riskScore: 28,
    hazardType: 'Nominal Intermontane Basin Slope Saturation',
    factorOfSafety: 1.62,
    porePressure: 24.0,
    porePressureThreshold: 35.0,
    rainfallRate: 11.0,
    rainfall24h: 22.0,
    soilMoisture: 51.0,
    displacement: 0.3,
    displacementThreshold: 1.5,
    elevation: 785,
    lat: 24.8170,
    lng: 93.9368,
    geology: 'Alluvial Clay & Silt Intermontane Deposits',
    populationAtRisk: 'Urban expansion fringe',
    evacuationStatus: 'Green: Normal Safety',
    recommendedAction: 'Normal continuous telemetry logging.',
    sparkline: [22, 22.5, 23, 23.2, 23.5, 23.8, 23.9, 24.0],
    lastUpdatedSeconds: 28,
  },
  {
    id: 'area-aalo-gorge',
    name: 'Aalo Gorge Sector',
    state: 'Arunachal Pradesh',
    district: 'West Siang',
    sector: 'Yomgo River Gorge',
    riskLevel: 'safe',
    riskTier: 0,
    riskScore: 22,
    hazardType: 'Stable River Cut Rock Face with Deep Cleated Drainage',
    factorOfSafety: 1.75,
    porePressure: 21.0,
    porePressureThreshold: 35.0,
    rainfallRate: 8.5,
    rainfall24h: 18.0,
    soilMoisture: 46.0,
    displacement: 0.2,
    displacementThreshold: 1.5,
    elevation: 300,
    lat: 28.1700,
    lng: 94.8000,
    geology: 'Massively Bedded Quartzite & Hard Dolomitic Limestone',
    populationAtRisk: 'Gorge crossing infrastructure',
    evacuationStatus: 'Green: Highly Stable',
    recommendedAction: 'Routine quarterly geotechnical inspection.',
    sparkline: [20, 20.2, 20.5, 20.7, 20.8, 20.9, 21.0, 21.0],
    lastUpdatedSeconds: 35,
  },
  {
    id: 'area-jampui-vanghmun',
    name: 'Vanghmun Watershed (Jampui Hills)',
    state: 'Tripura',
    district: 'North Tripura',
    sector: 'Jampui Anticlinal Ridge (NH-8)',
    riskLevel: 'safe',
    riskTier: 0,
    riskScore: 14,
    hazardType: 'Tipam Bedrock Hydrological Equilibrium & Dense Canopy',
    factorOfSafety: 1.92,
    porePressure: 18.5,
    porePressureThreshold: 35.0,
    rainfallRate: 5.0,
    rainfall24h: 12.0,
    soilMoisture: 42.0,
    displacement: 0.1,
    displacementThreshold: 1.5,
    elevation: 930,
    lat: 23.8315,
    lng: 92.2758,
    geology: 'Tipam Sandstone with Dense Deep-Rooted Rainforest Watershed',
    populationAtRisk: 'Ridge horticulture settlements',
    evacuationStatus: 'Green: Nominal Stability',
    recommendedAction: 'Routine baseline environmental recording.',
    sparkline: [18, 18.1, 18.2, 18.3, 18.3, 18.4, 18.4, 18.5],
    lastUpdatedSeconds: 40,
  },
];

interface RealTimeAnalyticsViewProps {
  sensors?: SensorData[];
  onSelectSensor?: (sensor: SensorData) => void;
  onNavigateToMap?: () => void;
  onNavigateToAlerts?: () => void;
  onSimulateSpike?: () => void;
  isSpikeActive?: boolean;
  onTriggerAlertNotification?: (alert: TriggeredAlert) => void;
}

export const RealTimeAnalyticsView: React.FC<RealTimeAnalyticsViewProps> = ({
  onNavigateToMap,
  onNavigateToAlerts,
  onSimulateSpike,
  isSpikeActive = false,
  onTriggerAlertNotification,
}) => {
  // Live Areas State
  const [areas, setAreas] = useState<MonitoredArea[]>(BASE_MONITORED_AREAS);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [streamIntervalMs, setStreamIntervalMs] = useState<number>(3000);
  const [lastLivePing, setLastLivePing] = useState<Date>(new Date());
  const [packetsReceived, setPacketsReceived] = useState<number>(142);

  // Sorting & Filtering State
  // STRICT REQUIREMENT: Default sorting is High Risk to Low Risk!
  const [sortOption, setSortOption] = useState<'high_to_low' | 'low_to_high' | 'rainfall' | 'displacement' | 'name'>('high_to_low');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');

  // Selected Area for Detailed Inspection Modal
  const [selectedArea, setSelectedArea] = useState<MonitoredArea | null>(null);

  // Live Telemetry Streaming Simulation Engine
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setAreas((prevAreas) => {
        return prevAreas.map((area) => {
          // Small realistic organic flutter
          const pressureDelta = (Math.random() - 0.48) * 0.4;
          const rainDelta = (Math.random() - 0.48) * 0.6;
          const dispDelta = area.riskLevel === 'critical' ? (Math.random() * 0.05) : (Math.random() * 0.01);

          const newPressure = Math.max(10, Math.min(80, +(area.porePressure + pressureDelta).toFixed(1)));
          const newRainRate = Math.max(0, Math.min(120, +(area.rainfallRate + rainDelta).toFixed(1)));
          const newDisp = Math.max(0.05, +(area.displacement + dispDelta).toFixed(2));
          
          // Recompute FoS slightly based on pressure
          let newFos = area.factorOfSafety;
          if (newPressure > area.porePressureThreshold) {
            newFos = Math.max(0.70, +(area.factorOfSafety - 0.002).toFixed(2));
          }

          // Update sparkline
          const newSparkline = [...area.sparkline.slice(1), newPressure];

          return {
            ...area,
            porePressure: newPressure,
            rainfallRate: newRainRate,
            displacement: newDisp,
            factorOfSafety: newFos,
            sparkline: newSparkline,
            lastUpdatedSeconds: Math.floor(Math.random() * 3) + 1,
          };
        });
      });

      setPacketsReceived((prev) => prev + 1);
      setLastLivePing(new Date());
    }, streamIntervalMs);

    return () => clearInterval(interval);
  }, [isLiveStreaming, streamIntervalMs]);

  // Handle Simulated Spike across high-risk areas
  useEffect(() => {
    if (isSpikeActive) {
      setAreas((prevAreas) =>
        prevAreas.map((area) => {
          if (area.riskLevel === 'critical' || area.riskLevel === 'warning') {
            return {
              ...area,
              porePressure: +(area.porePressure + 4.5).toFixed(1),
              rainfallRate: +(area.rainfallRate + 18.0).toFixed(1),
              displacement: +(area.displacement + 0.8).toFixed(2),
              factorOfSafety: Math.max(0.65, +(area.factorOfSafety - 0.08).toFixed(2)),
              riskScore: Math.min(99, area.riskScore + 4),
              isSurging: true,
              lastUpdatedSeconds: 1,
            };
          }
          return area;
        })
      );

      if (onTriggerAlertNotification) {
        onTriggerAlertNotification({
          id: `surge-sim-${Date.now()}`,
          ruleId: 'sim-cloudburst',
          ruleName: 'Simulated Regional Cloudburst Surge',
          sensorId: 'all-critical-areas',
          metric: 'porePressure',
          currentValue: 62.9,
          thresholdValue: 45.0,
          triggeredAt: new Date().toLocaleTimeString(),
          message: 'Extreme precipitation cloudburst simulated across East Khasi Hills & Paglapahar.',
          severity: 'critical',
        });
      }
    } else {
      setAreas(BASE_MONITORED_AREAS);
    }
  }, [isSpikeActive, onTriggerAlertNotification]);

  // Filter and Sort Monitored Areas
  const sortedAndFilteredAreas = useMemo(() => {
    let result = [...areas];

    // 1. Text Search Filter (Matches Area Name, State, District, Sector)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.state.toLowerCase().includes(q) ||
          a.district.toLowerCase().includes(q) ||
          a.sector.toLowerCase().includes(q) ||
          a.hazardType.toLowerCase().includes(q)
      );
    }

    // 2. State Filter
    if (filterState !== 'all') {
      result = result.filter((a) => a.state.toLowerCase() === filterState.toLowerCase());
    }

    // 3. Risk Tier Filter
    if (filterRisk !== 'all') {
      result = result.filter((a) => a.riskLevel === filterRisk);
    }

    // 4. Sorting (STRICT: Default is high risk to low risk)
    result.sort((a, b) => {
      if (sortOption === 'high_to_low') {
        return b.riskScore - a.riskScore;
      }
      if (sortOption === 'low_to_high') {
        return a.riskScore - b.riskScore;
      }
      if (sortOption === 'rainfall') {
        return b.rainfallRate - a.rainfallRate;
      }
      if (sortOption === 'displacement') {
        return b.displacement - a.displacement;
      }
      if (sortOption === 'name') {
        return a.name.localeCompare(b.name);
      }
      return b.riskScore - a.riskScore;
    });

    return result;
  }, [areas, searchQuery, filterState, filterRisk, sortOption]);

  // Overall Statistics Counters
  const totalAreas = areas.length;
  const criticalCount = areas.filter((a) => a.riskLevel === 'critical').length;
  const warningCount = areas.filter((a) => a.riskLevel === 'warning').length;
  const moderateCount = areas.filter((a) => a.riskLevel === 'moderate').length;
  const safeCount = areas.filter((a) => a.riskLevel === 'safe').length;
  const highestRiskArea = [...areas].sort((a, b) => b.riskScore - a.riskScore)[0];

  // Export Area Monitoring CSV
  const handleExportCsv = () => {
    const headers = ['Area Name', 'State', 'District', 'Sector', 'Risk Level', 'Risk Score (%)', 'Pore Pressure (kPa)', 'Rainfall Rate (mm/h)', '24h Rainfall (mm)', 'Displacement (mm/hr)', 'Factor of Safety', 'Recommended Action'];
    const rows = sortedAndFilteredAreas.map((a) => [
      `"${a.name}"`,
      `"${a.state}"`,
      `"${a.district}"`,
      `"${a.sector}"`,
      `"${a.riskLevel.toUpperCase()}"`,
      a.riskScore,
      a.porePressure,
      a.rainfallRate,
      a.rainfall24h,
      a.displacement,
      a.factorOfSafety,
      `"${a.recommendedAction}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lithos_ner_monitored_areas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper styling for Risk Badges
  const getRiskBadge = (level: MonitoredArea['riskLevel'], score: number) => {
    switch (level) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Critical ({score}% Risk)
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            High / Warning ({score}%)
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
            Moderate / Watch ({score}%)
          </span>
        );
      case 'safe':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Safe ({score}%)
          </span>
        );
    }
  };

  // Helper card border styling
  const getCardBorder = (level: MonitoredArea['riskLevel']) => {
    switch (level) {
      case 'critical':
        return 'border-rose-300 dark:border-rose-900/70 hover:border-rose-500 dark:hover:border-rose-500 bg-linear-to-b from-rose-500/5 to-transparent';
      case 'warning':
        return 'border-amber-300 dark:border-amber-900/60 hover:border-amber-500 dark:hover:border-amber-500 bg-linear-to-b from-amber-500/5 to-transparent';
      case 'moderate':
        return 'border-yellow-200 dark:border-yellow-900/50 hover:border-yellow-400 dark:hover:border-yellow-400 bg-linear-to-b from-yellow-500/5 to-transparent';
      case 'safe':
      default:
        return 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-linear-to-b from-emerald-500/5 to-transparent';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-[#060a17] text-slate-900 dark:text-slate-100 overflow-y-auto">
      {/* Top Banner: Real-Time Live Monitoring Command Center */}
      <div className="bg-white dark:bg-[#0b1227] border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                {isLiveStreaming && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLiveStreaming ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Live Regional Area Monitoring
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                Sorted High to Low Risk
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Continuous live geotechnical & hydrometeorological landslide surveillance for all <strong>monitored geographical hazard areas</strong> across North-Eastern Region (NER) states.
            </p>
          </div>

          {/* Live Stream Controls & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Stream Status / Interval */}
            <div className="flex items-center bg-slate-100 dark:bg-[#070d1e] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Radio className={`w-3.5 h-3.5 mr-1.5 ${isLiveStreaming ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
              <span className="font-mono font-medium">
                {isLiveStreaming ? `Live: ${streamIntervalMs / 1000}s` : 'Paused'}
              </span>
              <button
                onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                className="ml-2 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title={isLiveStreaming ? 'Pause Live Stream' : 'Resume Live Stream'}
              >
                {isLiveStreaming ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-500" />}
              </button>
            </div>

            {/* Simulated Regional Spike Button */}
            {onSimulateSpike && (
              <button
                onClick={onSimulateSpike}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  isSpikeActive
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 hover:border-rose-400 border border-slate-300 dark:border-slate-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isSpikeActive ? 'Active Surge Simulation' : 'Simulate Surge'}</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Export all areas live monitoring report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Ribbon */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4">
          <div className="p-2.5 bg-slate-50 dark:bg-[#070c1d] rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Monitored Areas</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">{totalAreas} Areas</span>
          </div>

          <div className="p-2.5 bg-rose-50/70 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/50">
            <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Critical Risk
            </span>
            <span className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-0.5 block">{criticalCount} Areas</span>
          </div>

          <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              High / Warning
            </span>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-0.5 block">{warningCount} Areas</span>
          </div>

          <div className="p-2.5 bg-yellow-50/70 dark:bg-yellow-950/20 rounded-xl border border-yellow-200 dark:border-yellow-900/50">
            <span className="text-[10px] text-yellow-600 dark:text-yellow-400 uppercase font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
              Moderate Watch
            </span>
            <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400 mt-0.5 block">{moderateCount} Areas</span>
          </div>

          <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Safe / Stable
            </span>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block">{safeCount} Areas</span>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-[#070c1d] rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Highest Risk Sector</span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 truncate block" title={highestRiskArea.name}>
              {highestRiskArea.name.split('(')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Filter, Search, and Sort Controls Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 space-y-3">
        <div className="bg-white dark:bg-[#0c1329] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Area Name (e.g. Sohra, Paglapahar, Narakasur, Haflong)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#070c1d] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Controls: Sorting + State Filter + Risk Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Options (DEFAULT: High to Low Risk) */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#070c1d] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-[11px] text-slate-500 font-medium">Sort:</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="high_to_low" className="dark:bg-[#070c1d]">High Risk to Low Risk (Default)</option>
                <option value="low_to_high" className="dark:bg-[#070c1d]">Low Risk to High Risk</option>
                <option value="rainfall" className="dark:bg-[#070c1d]">Highest Rainfall Intensity</option>
                <option value="displacement" className="dark:bg-[#070c1d]">Highest Ground Movement</option>
                <option value="name" className="dark:bg-[#070c1d]">Area Name (A-Z)</option>
              </select>
            </div>

            {/* State Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#070c1d] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="all" className="dark:bg-[#070c1d]">All NER States</option>
                <option value="meghalaya" className="dark:bg-[#070c1d]">Meghalaya</option>
                <option value="nagaland" className="dark:bg-[#070c1d]">Nagaland</option>
                <option value="arunachal pradesh" className="dark:bg-[#070c1d]">Arunachal Pradesh</option>
                <option value="assam" className="dark:bg-[#070c1d]">Assam</option>
                <option value="manipur" className="dark:bg-[#070c1d]">Manipur</option>
                <option value="mizoram" className="dark:bg-[#070c1d]">Mizoram</option>
                <option value="tripura" className="dark:bg-[#070c1d]">Tripura</option>
              </select>
            </div>

            {/* Risk Tier Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#070c1d] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="all" className="dark:bg-[#070c1d]">All Risk Tiers</option>
                <option value="critical" className="dark:bg-[#070c1d]">Critical (Level 3)</option>
                <option value="warning" className="dark:bg-[#070c1d]">High / Warning (Level 2)</option>
                <option value="moderate" className="dark:bg-[#070c1d]">Moderate / Watch (Level 1)</option>
                <option value="safe" className="dark:bg-[#070c1d]">Safe (Level 0)</option>
              </select>
            </div>

            {/* View Mode Toggle: Cards vs Table */}
            <div className="flex items-center bg-slate-100 dark:bg-[#070c1d] p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewLayout('cards')}
                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  viewLayout === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Area Cards View"
              >
                Cards
              </button>
              <button
                onClick={() => setViewLayout('table')}
                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  viewLayout === 'table'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Telemetry Table View"
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Showing count indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>
            Displaying <strong>{sortedAndFilteredAreas.length}</strong> of <strong>{totalAreas}</strong> monitored areas &bull; Sorted from <strong>Highest Risk to Lowest Risk</strong>
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3" />
            <span>Telemetry refreshed automatically every {streamIntervalMs / 1000}s</span>
          </span>
        </div>

        {/* VIEW 1: DETAILED AREA CARDS (HIGH RISK TO LOW RISK) */}
        {viewLayout === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedAndFilteredAreas.map((area, index) => {
              const isCritical = area.riskLevel === 'critical';
              const isWarning = area.riskLevel === 'warning';

              return (
                <div
                  key={area.id}
                  className={`rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0d1630] shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${getCardBorder(
                    area.riskLevel
                  )}`}
                >
                  {/* Top Area Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{area.district}, {area.state}</span>
                          <span>&bull;</span>
                          <span className="truncate">{area.elevation}m alt</span>
                        </div>
                        {/* Area Name (Prominent, NOT sensor ID) */}
                        <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                          {area.name}
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {area.sector}
                        </p>
                      </div>

                      {/* Risk Badge with Score */}
                      <div className="shrink-0 text-right">
                        {getRiskBadge(area.riskLevel, area.riskScore)}
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                          Rank #{index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Threat / Hazard Summary */}
                    <div className="mt-3 p-2 rounded-lg bg-slate-50 dark:bg-[#070c1d] border border-slate-200/70 dark:border-slate-800 text-[11px] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mountain className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                          {area.hazardType}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        area.factorOfSafety < 1.0
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                          : area.factorOfSafety < 1.25
                          ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        FoS: {area.factorOfSafety}
                      </span>
                    </div>
                  </div>

                  {/* Core 4-Grid Live Telemetry Indicators */}
                  <div className="p-4 grid grid-cols-2 gap-2.5 bg-slate-50/50 dark:bg-[#091024]">
                    {/* 1. Pore Water Pressure */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#0d1630] border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-blue-500" />
                          Pore Press.
                        </span>
                        <span className="text-[10px] font-mono">Thresh: {area.porePressureThreshold}</span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                          {area.porePressure} <span className="text-xs font-normal text-slate-500">kPa</span>
                        </span>
                        {area.porePressure > area.porePressureThreshold ? (
                          <span className="text-[10px] text-rose-500 font-bold flex items-center">
                            <ArrowUp className="w-2.5 h-2.5" /> Over
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-bold flex items-center">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Normal
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 2. Rainfall & Rate */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#0d1630] border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-cyan-500" />
                          Rain Rate
                        </span>
                        <span className="text-[10px] font-mono">24h: {area.rainfall24h}mm</span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                          {area.rainfallRate} <span className="text-xs font-normal text-slate-500">mm/h</span>
                        </span>
                        {area.rainfallRate > 40 ? (
                          <span className="text-[10px] text-rose-500 font-bold">Torrential</span>
                        ) : area.rainfallRate > 20 ? (
                          <span className="text-[10px] text-amber-500 font-bold">Heavy</span>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-bold">Moderate</span>
                        )}
                      </div>
                    </div>

                    {/* 3. Soil Moisture Saturation */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#0d1630] border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Waves className="w-3 h-3 text-indigo-500" />
                          Soil Saturation
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                          {area.soilMoisture} <span className="text-xs font-normal text-slate-500">%</span>
                        </span>
                        <div className="w-12 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              area.soilMoisture > 85 ? 'bg-rose-500' : area.soilMoisture > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, area.soilMoisture)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4. Ground Displacement Velocity */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#0d1630] border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-emerald-500" />
                          Displacement
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                          {area.displacement} <span className="text-xs font-normal text-slate-500">mm/hr</span>
                        </span>
                        {area.displacement > area.displacementThreshold ? (
                          <span className="text-[10px] text-rose-500 font-bold animate-pulse">Accelerating</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Stable Creep</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Mini Sparkline & Footer Action */}
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    {/* Sparkline Visual */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>Pore Pressure Trend (Live)</span>
                        <span className="font-mono text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Updated {area.lastUpdatedSeconds}s ago
                        </span>
                      </div>
                      <div className="h-8 flex items-end gap-1 bg-slate-50 dark:bg-[#070c1d] p-1 rounded-md border border-slate-200/50 dark:border-slate-800">
                        {area.sparkline.map((val, idx) => {
                          const maxVal = 70;
                          const heightPct = Math.min(100, Math.max(15, (val / maxVal) * 100));
                          return (
                            <div
                              key={idx}
                              className={`flex-1 rounded-xs transition-all duration-300 ${
                                isCritical ? 'bg-rose-500/80' : isWarning ? 'bg-amber-500/80' : 'bg-emerald-500/80'
                              }`}
                              style={{ height: `${heightPct}%` }}
                              title={`${val} kPa`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Recommended Emergency Protocol */}
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-[#070c1d] text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-tight">
                        <strong>Protocol:</strong> {area.recommendedAction}
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setSelectedArea(area)}
                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Area Details</span>
                      </button>

                      {onNavigateToMap && (
                        <button
                          onClick={onNavigateToMap}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                          title="View on GIS Risk Map"
                        >
                          <Compass className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: HIGH-DENSITY REAL-TIME DATA TABLE */}
        {viewLayout === 'table' && (
          <div className="bg-white dark:bg-[#0d1630] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 dark:bg-[#070c1d] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Risk Rank</th>
                    <th className="py-3 px-4">Area Name & Sector</th>
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4">Risk Tier & Score</th>
                    <th className="py-3 px-4">Factor of Safety</th>
                    <th className="py-3 px-4">Pore Pressure</th>
                    <th className="py-3 px-4">Rainfall Rate</th>
                    <th className="py-3 px-4">Displacement</th>
                    <th className="py-3 px-4">Soil Moisture</th>
                    <th className="py-3 px-4">Last Update</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                  {sortedAndFilteredAreas.map((area, idx) => (
                    <tr
                      key={area.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedArea(area)}
                    >
                      <td className="py-3 px-4 text-slate-400 font-bold">#{idx + 1}</td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-bold text-slate-900 dark:text-white">{area.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{area.sector}</div>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300">
                        {area.state}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        {getRiskBadge(area.riskLevel, area.riskScore)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${
                          area.factorOfSafety < 1.0 ? 'text-rose-500' : area.factorOfSafety < 1.25 ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          {area.factorOfSafety} FoS
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-900 dark:text-white">
                        {area.porePressure} kPa
                      </td>
                      <td className="py-3 px-4 text-slate-900 dark:text-white">
                        {area.rainfallRate} mm/h
                      </td>
                      <td className="py-3 px-4 text-slate-900 dark:text-white">
                        {area.displacement} mm/hr
                      </td>
                      <td className="py-3 px-4 text-slate-900 dark:text-white">
                        {area.soilMoisture}%
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">
                        {area.lastUpdatedSeconds}s ago
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedArea(area);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED AREA GEOTECHNICAL INSPECTION MODAL */}
      {selectedArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0b1227] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#070c1d] text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Mountain className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedArea.name}</h3>
                    {getRiskBadge(selectedArea.riskLevel, selectedArea.riskScore)}
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedArea.district}, {selectedArea.state} &bull; {selectedArea.sector} ({selectedArea.elevation}m elevation)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedArea(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
              {/* 4 Core Metrics Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080e22] border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Pore Water Pressure</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                    {selectedArea.porePressure} <span className="text-xs font-normal">kPa</span>
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Threshold: {selectedArea.porePressureThreshold} kPa</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080e22] border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Live Rainfall Rate</span>
                  <span className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">
                    {selectedArea.rainfallRate} <span className="text-xs font-normal">mm/h</span>
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">24h Total: {selectedArea.rainfall24h} mm</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080e22] border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Displacement Velocity</span>
                  <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                    {selectedArea.displacement} <span className="text-xs font-normal">mm/hr</span>
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Safe Limit: {selectedArea.displacementThreshold} mm</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080e22] border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Factor of Safety (FoS)</span>
                  <span className={`text-xl font-bold font-mono mt-1 block ${
                    selectedArea.factorOfSafety < 1.0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {selectedArea.factorOfSafety}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {selectedArea.factorOfSafety < 1.0 ? 'Unstable (< 1.0)' : 'Stable (> 1.25)'}
                  </span>
                </div>
              </div>

              {/* Live Waveform Trend Chart */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080e22] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Live Pore Water Pressure Curve ({selectedArea.name})
                  </h4>
                  <span className="text-[11px] font-mono text-emerald-500">Live Telemetry Pulse</span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={selectedArea.sparkline.map((val, i) => ({
                        time: `-${(8 - i) * 3}s`,
                        pressure: val,
                        threshold: selectedArea.porePressureThreshold,
                      }))}
                    >
                      <defs>
                        <linearGradient id="areaPressureGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="pressure"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#areaPressureGrad)"
                        name="Pore Pressure (kPa)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Geotechnical & Demographics Profile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080e22] border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Geological Lithology & Terrain
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300">{selectedArea.geology}</p>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                    <span className="text-slate-500">Coordinates:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedArea.lat.toFixed(4)}°N, {selectedArea.lng.toFixed(4)}°E
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Soil Moisture:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedArea.soilMoisture}% VWC Saturation
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080e22] border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Community Exposure & Evacuation Protocol
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300">{selectedArea.populationAtRisk}</p>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 block mb-1">Status:</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {selectedArea.evacuationStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Emergency Advisory Box */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">Standard Operating Procedure for Area {selectedArea.name}</h5>
                  <p className="mt-1 leading-relaxed">{selectedArea.recommendedAction}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#070c1d] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Geological Survey of India &bull; Regional Landslide Warning Node
              </div>
              <div className="flex items-center gap-2">
                {onNavigateToMap && (
                  <button
                    onClick={() => {
                      setSelectedArea(null);
                      onNavigateToMap();
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Compass className="w-4 h-4" />
                    <span>View Area on GIS Risk Map</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedArea(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
