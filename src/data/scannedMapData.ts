// Scanned Topographic & Geological Data for North Eastern Region (NER)
// Modeled after Geological Survey of India (GSI) & Survey of India (SOI) Topographic Sheets

export interface TopoContourLine {
  id: string;
  elevationMeters: number;
  isIndex: boolean; // Index contours are bolder with numerical labels
  pathD: string;
  label?: string;
  labelPosition?: { x: number; y: number };
  color?: string;
}

export interface GeologicFaultLine {
  id: string;
  name: string;
  type: 'Thrust Fault' | 'Strike-Slip Fault' | 'Normal Fault' | 'Transform Fault';
  activityStatus: 'Active Holocene Fault' | 'Seismogenic Shear Zone' | 'Inactive Bedrock Contact';
  pathD: string;
  labelPos: { x: number; y: number };
  description: string;
}

export interface RiverDrainageSystem {
  id: string;
  name: string;
  basin: string;
  strokeWidth: number;
  pathD: string;
  labelPos: { x: number; y: number };
}

export interface ScannedElevationZone {
  id: string;
  name: string;
  elevationRange: string;
  fillColor: string;
  fillOpacity: number;
  pathD: string;
}

export interface NERScannedSheetMeta {
  sheetNumber: string;
  edition: string;
  projection: string;
  datum: string;
  scale: string;
  contourInterval: string;
  surveyAuthority: string;
  publishYear: string;
}

// Regional NER Scanned Topographic Features
export const REGIONAL_NER_TOPO_SHEET: NERScannedSheetMeta = {
  sheetNumber: 'NER-GSI-SERIES-78/83',
  edition: '4th Edition (Digital Georeferenced Scan)',
  projection: 'Universal Transverse Mercator (UTM Zone 46N)',
  datum: 'WGS-84 / Everest 1956 Ellipsoid',
  scale: '1:250,000 Regional Topographic & Landslide Hazard Scan',
  contourInterval: '100 Metres (AMSL)',
  surveyAuthority: 'Geological Survey of India (GSI) & Survey of India (SOI)',
  publishYear: '2024-2025 Comprehensive Hill Stability Revision',
};

// Regional Elevation Tint Hypsometric Zones
export const REGIONAL_HYPSOMETRIC_ZONES: ScannedElevationZone[] = [
  // Lowland Alluvial Plain (Brahmaputra & Barak Valley - 50 to 150m)
  {
    id: 'hypso-brahmaputra-plain',
    name: 'Brahmaputra Alluvial Basin (50-120m AMSL)',
    elevationRange: '50 - 150m',
    fillColor: '#95b88f', // Soft khaki-viridian lowland tint
    fillOpacity: 0.45,
    pathD: 'M 15,28 Q 30,26 50,30 T 85,32 L 88,48 Q 65,46 45,45 T 15,46 Z',
  },
  // Meghalaya Shillong Plateau (600 to 1800m)
  {
    id: 'hypso-shillong-plateau',
    name: 'Shillong-Mikir Precambrian Crystalline Plateau (800-1960m AMSL)',
    elevationRange: '800 - 1960m',
    fillColor: '#d6a858', // Warm ochre highland tint
    fillOpacity: 0.5,
    pathD: 'M 22,48 Q 36,46 48,49 Q 47,60 38,62 Q 22,62 22,48 Z',
  },
  // Karbi Anglong / Mikir Hills
  {
    id: 'hypso-karbi-hills',
    name: 'Karbi Anglong Highland Massif (400-1360m AMSL)',
    elevationRange: '400 - 1360m',
    fillColor: '#cfa261',
    fillOpacity: 0.45,
    pathD: 'M 48,42 Q 58,38 64,44 Q 60,54 50,52 Z',
  },
  // Barail & Patkai Mountain Ranges (1000 to 2800m)
  {
    id: 'hypso-barail-patkai-range',
    name: 'Barail-Patkai Fold Belt & Disang Flysch (1200-2800m AMSL)',
    elevationRange: '1200 - 2800m',
    fillColor: '#b87547', // Sienna-terracotta mountain tint
    fillOpacity: 0.55,
    pathD: 'M 54,48 Q 68,36 84,24 L 90,30 Q 72,48 58,62 Q 52,58 54,48 Z',
  },
  // Arunachal Eastern Himalayan Front (1500 to 4500m+)
  {
    id: 'hypso-arunachal-himalayas',
    name: 'Eastern Himalayan Greater & Lesser Ridges (2000-4500m+ AMSL)',
    elevationRange: '2000 - 4500m+',
    fillColor: '#8a687b', // High alpine slate-purple tint
    fillOpacity: 0.5,
    pathD: 'M 20,12 Q 50,14 85,15 L 88,26 Q 50,24 20,22 Z',
  },
  // Mizoram / Tripura Fold Belt (Lushai Hills)
  {
    id: 'hypso-mizoram-lushai',
    name: 'Lushai Hills N-S Anticlinal Ridges (600-2150m AMSL)',
    elevationRange: '600 - 2150m',
    fillColor: '#c98e57',
    fillOpacity: 0.45,
    pathD: 'M 40,64 Q 50,62 55,75 Q 48,90 42,90 Q 38,76 40,64 Z',
  },
];

// Vector Contour Lines across the North Eastern Region
export const REGIONAL_CONTOURS: TopoContourLine[] = [
  // 100m Contour (Base of Brahmaputra Valley)
  {
    id: 'c-100m',
    elevationMeters: 100,
    isIndex: true,
    label: '100m AMSL',
    labelPosition: { x: 32, y: 34 },
    pathD: 'M 14,32 Q 28,30 48,34 T 84,36 M 86,44 Q 60,42 42,42 T 14,44',
  },
  // 250m Contour (Foothills Siwaliks)
  {
    id: 'c-250m',
    elevationMeters: 250,
    isIndex: false,
    pathD: 'M 16,28 Q 32,26 52,30 T 86,32 M 88,48 Q 62,46 44,46 T 16,48',
  },
  // 500m Contour (Lower Plateau & Valley Transition)
  {
    id: 'c-500m',
    elevationMeters: 500,
    isIndex: true,
    label: '500m AMSL',
    labelPosition: { x: 26, y: 46 },
    pathD: 'M 20,46 Q 34,44 48,47 M 50,42 Q 62,38 72,40 M 42,66 Q 48,64 52,78',
  },
  // 1000m Contour (Shillong Plateau / Patkai Foothills)
  {
    id: 'c-1000m',
    elevationMeters: 1000,
    isIndex: true,
    label: '1,000m AMSL',
    labelPosition: { x: 34, y: 52 },
    pathD: 'M 24,50 Q 35,48 44,51 Q 42,58 32,60 Q 24,58 24,50 M 56,46 Q 66,38 78,30',
  },
  // 1500m Contour (Sohra Crest & Barail Escarpment)
  {
    id: 'c-1500m',
    elevationMeters: 1500,
    isIndex: true,
    label: '1,500m (Sohra Crest)',
    labelPosition: { x: 30, y: 56 },
    pathD: 'M 28,52 Q 36,50 40,53 Q 38,58 30,58 Z M 60,44 Q 70,36 80,26',
  },
  // 2000m Contour (Naga Hills Crest & Tawang Range)
  {
    id: 'c-2000m',
    elevationMeters: 2000,
    isIndex: true,
    label: '2,000m AMSL',
    labelPosition: { x: 68, y: 38 },
    pathD: 'M 64,40 Q 72,32 82,24 M 25,16 Q 50,18 80,18',
  },
  // 3000m+ High Himalayan Ridge
  {
    id: 'c-3000m',
    elevationMeters: 3000,
    isIndex: true,
    label: '3,000m+ Sela Pass',
    labelPosition: { x: 36, y: 15 },
    pathD: 'M 28,14 Q 52,15 76,16',
  },
];

// Major Geological Fault Structures in NER
export const REGIONAL_GEOLOGIC_FAULTS: GeologicFaultLine[] = [
  {
    id: 'fault-dauki',
    name: 'Dauki Fault Line (Southern Meghalaya Boundary)',
    type: 'Strike-Slip Fault',
    activityStatus: 'Active Holocene Fault',
    pathD: 'M 18,61 Q 32,62 48,61 Q 54,62 60,63',
    labelPos: { x: 36, y: 63.5 },
    description: 'Major E-W trending dextral strike-slip crustal fault separating the Shillong Plateau from the Bengal Basin. High historical seismicity.',
  },
  {
    id: 'fault-kopili',
    name: 'Kopili Fault Zone (Assam-Meghalaya Transform)',
    type: 'Transform Fault',
    activityStatus: 'Seismogenic Shear Zone',
    pathD: 'M 38,62 Q 48,50 56,36 Q 60,26 62,18',
    labelPos: { x: 50, y: 44 },
    description: 'NW-SE trending active transverse shear fault traversing between the Mikir Hills and Shillong Plateau. Focal source of multiple M5.0+ earthquakes.',
  },
  {
    id: 'fault-naga-thrust',
    name: 'Naga Thrust Belt (Belt of Schuppen)',
    type: 'Thrust Fault',
    activityStatus: 'Active Holocene Fault',
    pathD: 'M 54,48 Q 66,38 84,24 L 92,18',
    labelPos: { x: 74, y: 28 },
    description: 'Imbricate thrust fault series accommodating convergence between the Indian Plate and the Indo-Burma Ranges. Unstable Disang shale colluvium.',
  },
  {
    id: 'fault-mft',
    name: 'Main Frontal Thrust (MFT - Arunachal Foothills)',
    type: 'Thrust Fault',
    activityStatus: 'Active Holocene Fault',
    pathD: 'M 18,24 Q 48,22 86,24',
    labelPos: { x: 52, y: 22 },
    description: 'Active southernmost boundary fault of the Eastern Himalayas, placing Siwalik sedimentary rocks over alluvial sediments.',
  },
];

// Major Hydrological Drainage Networks (Rivers)
export const REGIONAL_RIVER_SYSTEMS: RiverDrainageSystem[] = [
  {
    id: 'riv-brahmaputra',
    name: 'Brahmaputra River (Mighty Tsangpo-Siang Basin)',
    basin: 'Brahmaputra Mainstem Basin',
    strokeWidth: 4.5,
    pathD: 'M 88,24 Q 78,28 66,32 T 48,34 T 30,36 T 12,42',
    labelPos: { x: 44, y: 32.5 },
  },
  {
    id: 'riv-subansiri',
    name: 'Subansiri River',
    basin: 'Northern Himalayan Tributary',
    strokeWidth: 2,
    pathD: 'M 60,16 Q 62,22 66,32',
    labelPos: { x: 63, y: 23 },
  },
  {
    id: 'riv-manas',
    name: 'Manas River',
    basin: 'Western Bhutan-Assam Tributary',
    strokeWidth: 2,
    pathD: 'M 24,18 Q 26,26 28,36',
    labelPos: { x: 26, y: 26 },
  },
  {
    id: 'riv-kopili',
    name: 'Kopili River',
    basin: 'Southern Tributary & Hydroelectric Catchment',
    strokeWidth: 2,
    pathD: 'M 48,56 Q 47,46 45,34',
    labelPos: { x: 49, y: 46 },
  },
  {
    id: 'riv-barak',
    name: 'Barak River (Surma-Kushiyara Basin)',
    basin: 'Southern NER River Network',
    strokeWidth: 3,
    pathD: 'M 66,54 Q 56,60 48,64 T 36,66 T 22,68',
    labelPos: { x: 46, y: 66.5 },
  },
];

// State Specific Topo Sheet Information for Level 2 (State View)
export interface StateTopoDetail {
  stateId: string;
  topoSheetCode: string;
  geologicalEpoch: string;
  primaryRockTypes: string;
  majorDrainageBasins: string[];
  landslideMechanism: string;
  highestPeak: string;
  stateContours: TopoContourLine[];
}

export const STATE_TOPO_DETAILS: Record<string, StateTopoDetail> = {
  assam: {
    stateId: 'assam',
    topoSheetCode: 'GSI QUADRANGLE 78-N / 83-B (ASSAM VALLEY & KARBI HILLS)',
    geologicalEpoch: 'Precambrian Gneiss Basement & Quaternary Alluvium',
    primaryRockTypes: 'Biotite Gneiss, Granite Plutons, Semi-consolidated Sandstones',
    majorDrainageBasins: ['Brahmaputra Braided Channel', 'Barak River Basin', 'Kopili Hydro Basin'],
    landslideMechanism: 'Monsoon Pluvial Gully Infiltration & Colluvial Soil Mantle Shear',
    highestPeak: 'Laike Peak (Barail Range) - 1,959 m AMSL',
    stateContours: [
      { id: 'as-c1', elevationMeters: 80, isIndex: true, label: '80m Alluvial Plain', pathD: 'M 20,35 Q 50,33 80,38', labelPosition: { x: 50, y: 34 } },
      { id: 'as-c2', elevationMeters: 250, isIndex: false, pathD: 'M 25,30 Q 55,28 85,32' },
      { id: 'as-c3', elevationMeters: 650, isIndex: true, label: '650m (Kamrup Hills)', pathD: 'M 35,45 Q 45,43 55,48', labelPosition: { x: 45, y: 44 } },
      { id: 'as-c4', elevationMeters: 1400, isIndex: true, label: '1,400m (Barail Haflong)', pathD: 'M 58,54 Q 68,50 78,56', labelPosition: { x: 68, y: 51 } },
    ],
  },
  meghalaya: {
    stateId: 'meghalaya',
    topoSheetCode: 'GSI QUADRANGLE 78-O (SHILLONG PLATEAU & SOHRA ESCARPMENT)',
    geologicalEpoch: 'Proterozoic Shillong Group & Cretaceous-Tertiary Carbonates',
    primaryRockTypes: 'Quartzite, Phyllite, Karstified Sylhet Limestone, Sandstone',
    majorDrainageBasins: ['Umiam Hydro Basin', 'Wah Umngot River', 'Kynshi River'],
    landslideMechanism: 'Torrential Pluvial Saturated Debris Flow & Escarpment Planar Failure',
    highestPeak: 'Shillong Peak - 1,965 m AMSL',
    stateContours: [
      { id: 'ml-c1', elevationMeters: 500, isIndex: false, pathD: 'M 20,44 Q 50,42 80,45' },
      { id: 'ml-c2', elevationMeters: 1000, isIndex: true, label: '1,000m Plateau Margin', pathD: 'M 25,48 Q 50,46 75,50', labelPosition: { x: 50, y: 47 } },
      { id: 'ml-c3', elevationMeters: 1420, isIndex: true, label: '1,420m (Sohra Highland)', pathD: 'M 35,52 Q 50,50 65,54', labelPosition: { x: 50, y: 51 } },
      { id: 'ml-c4', elevationMeters: 1965, isIndex: true, label: '1,965m (Shillong Peak)', pathD: 'M 45,53 Q 50,51 55,54', labelPosition: { x: 50, y: 52 } },
    ],
  },
  nagaland: {
    stateId: 'nagaland',
    topoSheetCode: 'GSI QUADRANGLE 83-J / 83-K (NAGALAND DISANG FLYSCH BELT)',
    geologicalEpoch: 'Upper Cretaceous to Eocene Disang-Barail Series',
    primaryRockTypes: 'Splintery Shales, Siltstones, Turbiditic Sandstones',
    majorDrainageBasins: ['Dhansiri River Basin', 'Doyang Hydroelectric Basin', 'Tizu River'],
    landslideMechanism: 'Progressive Translational Bedding Plane Shear & Highway Cut Sinking',
    highestPeak: 'Mount Saramati - 3,841 m AMSL',
    stateContours: [
      { id: 'nl-c1', elevationMeters: 800, isIndex: false, pathD: 'M 40,40 Q 60,35 80,38' },
      { id: 'nl-c2', elevationMeters: 1450, isIndex: true, label: '1,450m (Kohima Saddle)', pathD: 'M 45,45 Q 65,40 85,44', labelPosition: { x: 65, y: 41 } },
      { id: 'nl-c3', elevationMeters: 2200, isIndex: true, label: '2,200m (Japfu Ridge)', pathD: 'M 50,50 Q 70,45 88,48', labelPosition: { x: 70, y: 46 } },
    ],
  },
  manipur: {
    stateId: 'manipur',
    topoSheetCode: 'GSI QUADRANGLE 83-H / 83-L (IMPHAL INTERMONTANE BASIN & NONEY)',
    geologicalEpoch: 'Tertiary Indo-Burma Flysch Belt & Ophiolite Suite',
    primaryRockTypes: 'Laminated Shales, Mudstones, Serpentinites, Greywacke',
    majorDrainageBasins: ['Ijai River Basin', 'Barak Headwaters', 'Manipur-Loktak Basin'],
    landslideMechanism: 'Deep-seated Colluvial Liquefaction & Mudflow Damming',
    highestPeak: 'Mount Iso (Tenipu) - 2,994 m AMSL',
    stateContours: [
      { id: 'mn-c1', elevationMeters: 780, isIndex: true, label: '780m (Imphal Basin)', pathD: 'M 35,55 Q 50,54 65,58', labelPosition: { x: 50, y: 55 } },
      { id: 'mn-c2', elevationMeters: 1300, isIndex: true, label: '1,300m (Noney Rail Cut)', pathD: 'M 30,58 Q 50,56 70,62', labelPosition: { x: 50, y: 57 } },
      { id: 'mn-c3', elevationMeters: 2100, isIndex: false, pathD: 'M 25,62 Q 50,60 75,66' },
    ],
  },
  arunachal: {
    stateId: 'arunachal',
    topoSheetCode: 'GSI QUADRANGLE 78-M / 82-P / 83-A (EASTERN HIMALAYAS & TAWANG)',
    geologicalEpoch: 'Higher Himalayan Crystallines & Siwalik Foreland',
    primaryRockTypes: 'Gneiss, Schist, Dolomite, Tourmaline Granite',
    majorDrainageBasins: ['Kameng River', 'Subansiri Basin', 'Siang-Tsangpo Chasm', 'Lohit River'],
    landslideMechanism: 'Freeze-Thaw Frost Shatter, Glacial Debris Flow & Active Fault Rupture',
    highestPeak: 'Kangto - 7,060 m AMSL',
    stateContours: [
      { id: 'ar-c1', elevationMeters: 500, isIndex: false, pathD: 'M 20,24 Q 50,22 80,25' },
      { id: 'ar-c2', elevationMeters: 1800, isIndex: true, label: '1,800m (Bomdila Pass)', pathD: 'M 20,18 Q 50,16 80,19', labelPosition: { x: 50, y: 17 } },
      { id: 'ar-c3', elevationMeters: 3048, isIndex: true, label: '3,048m (Tawang Valley)', pathD: 'M 20,14 Q 50,12 80,15', labelPosition: { x: 50, y: 13 } },
      { id: 'ar-c4', elevationMeters: 4170, isIndex: true, label: '4,170m (Sela Pass)', pathD: 'M 20,10 Q 50,8 80,11', labelPosition: { x: 50, y: 9 } },
    ],
  },
  mizoram: {
    stateId: 'mizoram',
    topoSheetCode: 'GSI QUADRANGLE 83-D / 84-A (LUSHAI HILLS N-S ANTICLINES)',
    geologicalEpoch: 'Neogene Surma & Tipam Sandstone Series',
    primaryRockTypes: 'Massive Siltstone, Fine Sandstone, Mudstone Interbeds',
    majorDrainageBasins: ['Tlawng River Basin', 'Tuirial Hydro Catchment', 'Kolodyne River'],
    landslideMechanism: 'Translational Dip-Slope Failure & Urban Colluvium Creep',
    highestPeak: 'Phawngpui (Blue Mountain) - 2,157 m AMSL',
    stateContours: [
      { id: 'mz-c1', elevationMeters: 400, isIndex: false, pathD: 'M 35,68 Q 45,66 55,70' },
      { id: 'mz-c2', elevationMeters: 1132, isIndex: true, label: '1,132m (Aizawl Ridge)', pathD: 'M 38,72 Q 46,70 54,74', labelPosition: { x: 46, y: 71 } },
      { id: 'mz-c3', elevationMeters: 1800, isIndex: false, pathD: 'M 40,78 Q 48,76 56,80' },
    ],
  },
  tripura: {
    stateId: 'tripura',
    topoSheetCode: 'GSI QUADRANGLE 78-P / 79-M (JAMPUI HILLS & AGARTALA PLAIN)',
    geologicalEpoch: 'Tipam & Dupitila Sandstone Formations',
    primaryRockTypes: 'Unconsolidated Ferruginous Sandstone, Mottled Clay',
    majorDrainageBasins: ['Howrah River', 'Gumti Hydro Basin', 'Manu River'],
    landslideMechanism: 'Stream Bank Undercutting & Anticlinal Dip Shear',
    highestPeak: 'Betlingchhip (Jampui Hills) - 930 m AMSL',
    stateContours: [
      { id: 'tr-c1', elevationMeters: 50, isIndex: true, label: '50m (Agartala Valley)', pathD: 'M 30,62 Q 40,60 50,64', labelPosition: { x: 40, y: 61 } },
      { id: 'tr-c2', elevationMeters: 400, isIndex: false, pathD: 'M 34,66 Q 42,64 50,68' },
      { id: 'tr-c3', elevationMeters: 930, isIndex: true, label: '930m (Jampui Ridge)', pathD: 'M 38,68 Q 44,66 50,70', labelPosition: { x: 44, y: 67 } },
    ],
  },
};

// District Micro-Catchment Topo Detail for Level 3 (District View)
export interface DistrictMicroCatchmentDetail {
  districtId: string;
  catchmentName: string;
  cadastralScale: string;
  slopeAspect: string;
  hydraulicConductivity: string;
  criticalFactorOfSafety: number;
  microContours: { elevation: number; pathD: string; isIndex?: boolean }[];
  hazardZones: { name: string; risk: 'Tier 3' | 'Tier 2' | 'Tier 1'; bounds: string }[];
}

export const DISTRICT_MICRO_CATCHMENTS: Record<string, DistrictMicroCatchmentDetail> = {
  kamrup_metro: {
    districtId: 'kamrup_metro',
    catchmentName: 'Guwahati Urban Watershed & 14 Critical Hill Slopes',
    cadastralScale: '1:10,000 Micro-Catchment Cadastral Survey',
    slopeAspect: 'North-West (38° - 54° Escarpment Angles)',
    hydraulicConductivity: '3.4 × 10⁻⁵ m/s (High Porosity Colluvium)',
    criticalFactorOfSafety: 1.18,
    microContours: [
      { elevation: 120, pathD: 'M 20,40 Q 50,38 80,42', isIndex: true },
      { elevation: 180, pathD: 'M 25,44 Q 50,42 75,46' },
      { elevation: 260, pathD: 'M 30,48 Q 50,46 70,50', isIndex: true },
      { elevation: 340, pathD: 'M 35,52 Q 50,50 65,54' },
      { elevation: 420, pathD: 'M 40,56 Q 50,54 60,58', isIndex: true },
    ],
    hazardZones: [
      { name: 'Narakasur Hill Escarpment Tension Crack Zone', risk: 'Tier 2', bounds: 'Sector 4 / GSI Reference Point A' },
      { name: 'Nilachal Hill North Cut Toe Surcharge Area', risk: 'Tier 1', bounds: 'Brahmaputra River Bank Sector' },
    ],
  },
  dima_hasao: {
    districtId: 'dima_hasao',
    catchmentName: 'Haflong - Jatinga Valley & Lumding Railway Corridor',
    cadastralScale: '1:10,000 Engineering Geotechnical Strip Map',
    slopeAspect: 'South-East (45° - 62° Bedrock Cut Slopes)',
    hydraulicConductivity: '1.2 × 10⁻⁴ m/s (Fractured Disang Shale)',
    criticalFactorOfSafety: 0.94,
    microContours: [
      { elevation: 500, pathD: 'M 20,42 Q 50,40 80,44', isIndex: true },
      { elevation: 750, pathD: 'M 25,46 Q 50,44 75,48' },
      { elevation: 980, pathD: 'M 30,50 Q 50,48 70,52', isIndex: true },
      { elevation: 1200, pathD: 'M 35,54 Q 50,52 65,56' },
    ],
    hazardZones: [
      { name: 'Lumding-Badarpur Track km 52 Washout Plane', risk: 'Tier 3', bounds: 'Active Shear Fissure Zone' },
      { name: 'Jatinga River Mudslide Toe Deposition Area', risk: 'Tier 2', bounds: 'Lower Valley Floor' },
    ],
  },
  east_khasi_hills: {
    districtId: 'east_khasi_hills',
    catchmentName: 'Sohra-Cherrapunji Highland Plateau & Deep Canyon Rims',
    cadastralScale: '1:10,000 Extreme Pluvial Runoff & Escarpment Survey',
    slopeAspect: 'South toward Bangladesh Plains (70° - 85° Vertical Cliffs)',
    hydraulicConductivity: '8.8 × 10⁻⁴ m/s (Karstified Sandstone Joints)',
    criticalFactorOfSafety: 0.88,
    microContours: [
      { elevation: 600, pathD: 'M 20,58 Q 50,56 80,60', isIndex: true },
      { elevation: 900, pathD: 'M 25,54 Q 50,52 75,56' },
      { elevation: 1200, pathD: 'M 30,50 Q 50,48 70,52', isIndex: true },
      { elevation: 1420, pathD: 'M 35,46 Q 50,44 65,48', isIndex: true },
    ],
    hazardZones: [
      { name: 'Nohkalikai Canyon Rim Pluvial Slump', risk: 'Tier 3', bounds: 'High Runoff Catchment 12,000mm/yr' },
      { name: 'Sohra Town Western Colluvial Terrace', risk: 'Tier 2', bounds: 'Piezometer Line PZ-03' },
    ],
  },
  kohima: {
    districtId: 'kohima',
    catchmentName: 'Paglapahar NH-29 Lifeline Sinking & Disang Shale Slopes',
    cadastralScale: '1:10,000 Highway Stabilization Corridor Map',
    slopeAspect: 'North-East (35° - 48° Continuous Creep Slopes)',
    hydraulicConductivity: '4.5 × 10⁻⁶ m/s (Impermeable Splintery Clay)',
    criticalFactorOfSafety: 0.92,
    microContours: [
      { elevation: 900, pathD: 'M 20,44 Q 50,42 80,46', isIndex: true },
      { elevation: 1150, pathD: 'M 25,48 Q 50,46 75,50' },
      { elevation: 1450, pathD: 'M 30,52 Q 50,50 70,54', isIndex: true },
    ],
    hazardZones: [
      { name: 'NH-29 Paglapahar Subsidence & Sinking Zone', risk: 'Tier 3', bounds: 'Main Highway Arterial' },
    ],
  },
  noney: {
    districtId: 'noney',
    catchmentName: 'Tupul Station Yard & Ijai River Valley Basin',
    cadastralScale: '1:10,000 Post-Disaster Geomorphological Monitoring Map',
    slopeAspect: 'West toward Ijai River (42° - 58° Colluvial Slope)',
    hydraulicConductivity: '6.2 × 10⁻⁵ m/s (Colluvial Liquefaction Silt)',
    criticalFactorOfSafety: 0.85,
    microContours: [
      { elevation: 650, pathD: 'M 20,54 Q 50,52 80,56', isIndex: true },
      { elevation: 850, pathD: 'M 25,50 Q 50,48 75,52' },
      { elevation: 1100, pathD: 'M 30,46 Q 50,44 70,48', isIndex: true },
    ],
    hazardZones: [
      { name: 'Tupul Yard 2022 Slide Scar & Liquefaction Surcharge', risk: 'Tier 3', bounds: 'Ijai River Basin Toe' },
    ],
  },
  tawang: {
    districtId: 'tawang',
    catchmentName: 'Sela Range Defense Corridor & Glacial Talus Slopes',
    cadastralScale: '1:10,000 High Altitude Permafrost & Talus Survey',
    slopeAspect: 'South-West (48° - 65° Frost Shatter Slopes)',
    hydraulicConductivity: '1.5 × 10⁻³ m/s (Coarse Glacial Talus)',
    criticalFactorOfSafety: 1.22,
    microContours: [
      { elevation: 2400, pathD: 'M 20,22 Q 50,20 80,24', isIndex: true },
      { elevation: 2800, pathD: 'M 25,18 Q 50,16 75,20' },
      { elevation: 3200, pathD: 'M 30,14 Q 50,12 70,16', isIndex: true },
      { elevation: 4170, pathD: 'M 35,10 Q 50,8 65,12', isIndex: true },
    ],
    hazardZones: [
      { name: 'Sela Pass High-Altitude Talus Rockfall Zone', risk: 'Tier 2', bounds: 'Strategic Border Lifeline' },
    ],
  },
};
