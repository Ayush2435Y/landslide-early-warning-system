import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  NER_STATES_DATA, 
  HIERARCHICAL_SENSOR_PINS, 
  NERStateInfo, 
  NERDistrictInfo, 
  HierarchicalSensorPin 
} from '../data/hierarchicalData';
import { 
  Compass, 
  Layers, 
  Eye, 
  MapPin, 
  AlertTriangle, 
  Shield, 
  Info, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  CheckCircle2,
  Activity,
  Flame,
  ArrowRight,
  Droplets,
  Mountain,
  Globe2,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  X,
  Gauge
} from 'lucide-react';

export type SectionColorMode = 'reference_state' | 'district_spectrum' | 'hazard_tier';

interface NERStateSectionMapProps {
  onSelectState?: (state: NERStateInfo) => void;
  onSelectDistrict?: (district: NERDistrictInfo, state: NERStateInfo) => void;
  onSelectPin?: (pin: HierarchicalSensorPin) => void;
  selectedStateId?: string | null;
  selectedDistrictId?: string | null;
  className?: string;
}

export interface StateSectionGeometry {
  id: string;
  name: string;
  stateId: string;
  stateName: string;
  pathD: string;
  referenceColor: string;
  spectrumColor: string;
  center: { x: number; y: number };
  pinLocation?: { x: number; y: number; label: string };
  riskTier: 0 | 1 | 2 | 3;
  hazardSummary: string;
  monitoringNodes: number;
}

// Sophisticated GIS Cartographic Sections for all 8 North Eastern States (Muted harmonious tints)
export const NER_STATE_SECTIONS: StateSectionGeometry[] = [
  // ==========================================
  // 1. SIKKIM (Refined Rose Quartz & Jasper)
  // ==========================================
  {
    id: 'sikkim_north',
    name: 'North Sikkim (Mangan)',
    stateId: 'sikkim',
    stateName: 'Sikkim',
    pathD: 'M 135,160 L 155,145 L 175,150 L 180,175 L 165,195 L 145,190 L 132,175 Z',
    referenceColor: '#fb7185', // Muted rose
    spectrumColor: '#f43f5e',
    center: { x: 155, y: 168 },
    pinLocation: { x: 155, y: 168, label: 'Chungthang Dam Sector' },
    riskTier: 3,
    hazardSummary: 'GLOF risk along Teesta river gorge & Chungthang dam left bank slope.',
    monitoringNodes: 2,
  },
  {
    id: 'sikkim_south_west',
    name: 'South & West Sikkim (Namchi/Gyalshing)',
    stateId: 'sikkim',
    stateName: 'Sikkim',
    pathD: 'M 132,175 L 145,190 L 165,195 L 160,225 L 140,230 L 128,210 Z',
    referenceColor: '#fda4af', // Soft blush rose
    spectrumColor: '#f472b6',
    center: { x: 145, y: 205 },
    pinLocation: { x: 145, y: 205, label: 'Jorethang Ridge' },
    riskTier: 1,
    hazardSummary: 'Rangit River valley colluvial slips and Jorethang corridor.',
    monitoringNodes: 1,
  },
  {
    id: 'sikkim_east',
    name: 'East Sikkim (Gangtok)',
    stateId: 'sikkim',
    stateName: 'Sikkim',
    pathD: 'M 165,195 L 180,175 L 195,190 L 190,220 L 160,225 Z',
    referenceColor: '#f43f5e', // Ruby rose
    spectrumColor: '#e11d48',
    center: { x: 178, y: 205 },
    pinLocation: { x: 178, y: 205, label: 'Gangtok JN Road Mile 9' },
    riskTier: 2,
    hazardSummary: 'JN Road Nathu La highway sinking corridor & urban cut slopes.',
    monitoringNodes: 1,
  },

  // ==========================================
  // 2. ARUNACHAL PRADESH (Sage Olive & Highland Pine)
  // ==========================================
  {
    id: 'arunachal_west',
    name: 'Tawang & West Kameng',
    stateId: 'arunachal',
    stateName: 'Arunachal Pradesh',
    pathD: 'M 380,240 L 400,200 L 435,170 L 460,195 L 430,250 L 380,240 Z',
    referenceColor: '#84cc16', // Olive sage
    spectrumColor: '#65a30d',
    center: { x: 415, y: 215 },
    pinLocation: { x: 415, y: 215, label: 'Sela Range Corridor' },
    riskTier: 2,
    hazardSummary: 'High Himalayan Sela range snowmelt surge & Bhalukpong highway talus slips.',
    monitoringNodes: 2,
  },
  {
    id: 'arunachal_upper_subansiri',
    name: 'Upper Subansiri (Daporijo)',
    stateId: 'arunachal',
    stateName: 'Arunachal Pradesh',
    pathD: 'M 435,170 L 470,120 L 525,100 L 565,135 L 530,175 L 460,195 Z',
    referenceColor: '#a3e635', // Light olive
    spectrumColor: '#84cc16',
    center: { x: 495, y: 140 },
    pinLocation: { x: 495, y: 140, label: 'Daporijo Gorge Scarp' },
    riskTier: 2,
    hazardSummary: 'Subansiri gorge crystalline joint dilated slides & Nacho border route.',
    monitoringNodes: 1,
  },
  {
    id: 'arunachal_papum_kameng',
    name: 'Papum Pare & East Kameng (Itanagar)',
    stateId: 'arunachal',
    stateName: 'Arunachal Pradesh',
    pathD: 'M 460,195 L 530,175 L 560,210 L 510,245 L 430,250 Z',
    referenceColor: '#65a30d', // Deep olive
    spectrumColor: '#4d7c0f',
    center: { x: 500, y: 215 },
    riskTier: 1,
    hazardSummary: 'Itanagar capital slopes & Dikrong river colluvial terraces.',
    monitoringNodes: 1,
  },
  {
    id: 'arunachal_siang_dibang',
    name: 'Upper & Lower Siang / Dibang Valley',
    stateId: 'arunachal',
    stateName: 'Arunachal Pradesh',
    pathD: 'M 525,100 L 610,65 L 685,50 L 760,85 L 755,140 L 670,145 L 565,135 Z',
    referenceColor: '#84cc16',
    spectrumColor: '#4ade80',
    center: { x: 645, y: 95 },
    pinLocation: { x: 645, y: 95, label: 'Siang River Canyon' },
    riskTier: 2,
    hazardSummary: 'Great Himalayan gorges, rock avalanches & landslide dammed lakes.',
    monitoringNodes: 2,
  },
  {
    id: 'arunachal_east_anjaw',
    name: 'Lohit, Anjaw & Dibang Frontier',
    stateId: 'arunachal',
    stateName: 'Arunachal Pradesh',
    pathD: 'M 760,85 L 860,115 L 850,185 L 780,210 L 755,140 Z',
    referenceColor: '#65a30d',
    spectrumColor: '#15803d',
    center: { x: 805, y: 145 },
    riskTier: 2,
    hazardSummary: 'Mishmi Hills seismogenic thrust zone along easternmost international frontier.',
    monitoringNodes: 1,
  },
  {
    id: 'arunachal_patkai',
    name: 'Changlang & Tirap (Patkai Range)',
    stateId: 'arunachal',
    stateName: 'Arunachal Pradesh',
    pathD: 'M 780,210 L 850,185 L 870,240 L 805,270 L 750,240 Z',
    referenceColor: '#4d7c0f',
    spectrumColor: '#166534',
    center: { x: 810, y: 235 },
    riskTier: 1,
    hazardSummary: 'Tertiary flysch slopes along Indo-Myanmar Patkai mountain crest.',
    monitoringNodes: 1,
  },

  // ==========================================
  // 3. ASSAM (Golden Ochre & Alluvial Sand)
  // ==========================================
  {
    id: 'assam_lower',
    name: 'Lower Assam & Kamrup Metro (Guwahati)',
    stateId: 'assam',
    stateName: 'Assam',
    pathD: 'M 250,300 L 380,290 L 400,320 L 460,335 L 430,370 L 370,380 L 250,380 Z',
    referenceColor: '#eab308', // Warm ochre gold
    spectrumColor: '#facc15',
    center: { x: 340, y: 340 },
    pinLocation: { x: 340, y: 340, label: 'Guwahati 14 Hills' },
    riskTier: 2,
    hazardSummary: 'Guwahati 14 hills escarpments (Narakasur, Nilachal, Khanapara).',
    monitoringNodes: 3,
  },
  {
    id: 'assam_central',
    name: 'Central Assam & North Bank (Sonitpur/Nagaon)',
    stateId: 'assam',
    stateName: 'Assam',
    pathD: 'M 380,290 L 510,245 L 560,210 L 615,250 L 575,300 L 460,335 L 400,320 Z',
    referenceColor: '#fde047', // Soft pale ochre
    spectrumColor: '#eab308',
    center: { x: 485, y: 280 },
    riskTier: 1,
    hazardSummary: 'Brahmaputra alluvial plain interface & sub-Himalayan foothills.',
    monitoringNodes: 1,
  },
  {
    id: 'assam_karbi_hills',
    name: 'Karbi Anglong Highland Massif',
    stateId: 'assam',
    stateName: 'Assam',
    pathD: 'M 460,335 L 575,300 L 615,335 L 550,390 L 470,380 Z',
    referenceColor: '#ca8a04', // Rich gold amber
    spectrumColor: '#ca8a04',
    center: { x: 530, y: 345 },
    riskTier: 2,
    hazardSummary: 'Precambrian crystalline plateau scarp slips and highway cut shear.',
    monitoringNodes: 2,
  },
  {
    id: 'assam_upper',
    name: 'Upper Assam (Dibrugarh, Jorhat, Tinsukia)',
    stateId: 'assam',
    stateName: 'Assam',
    pathD: 'M 615,250 L 750,240 L 740,290 L 685,310 L 615,335 L 575,300 Z',
    referenceColor: '#eab308',
    spectrumColor: '#fbbf24',
    center: { x: 675, y: 275 },
    riskTier: 1,
    hazardSummary: 'Riverbank erosion and piedmont colluvial deposits.',
    monitoringNodes: 1,
  },
  {
    id: 'assam_dima_hasao',
    name: 'Dima Hasao (North Cachar Hills)',
    stateId: 'assam',
    stateName: 'Assam',
    pathD: 'M 470,380 L 550,390 L 540,460 L 485,465 L 450,420 Z',
    referenceColor: '#ca8a04',
    spectrumColor: '#d97706',
    center: { x: 505, y: 425 },
    pinLocation: { x: 505, y: 425, label: 'Lumding-Badarpur Rail Scarp' },
    riskTier: 3,
    hazardSummary: 'Lumding-Badarpur hill railway lifeline corridor & Haflong town slopes.',
    monitoringNodes: 2,
  },
  {
    id: 'assam_barak_valley',
    name: 'Barak Valley (Cachar, Hailakandi, Karimganj)',
    stateId: 'assam',
    stateName: 'Assam',
    pathD: 'M 450,420 L 485,465 L 480,520 L 420,530 L 440,470 Z',
    referenceColor: '#facc15',
    spectrumColor: '#b45309',
    center: { x: 455, y: 485 },
    riskTier: 1,
    hazardSummary: 'Barak river valley alluvial colluvium interface subject to monsoon saturation.',
    monitoringNodes: 1,
  },

  // ==========================================
  // 4. MEGHALAYA (Emerald & Forest Green)
  // ==========================================
  {
    id: 'meghalaya_garo_west',
    name: 'West & North Garo Hills (Tura)',
    stateId: 'meghalaya',
    stateName: 'Meghalaya',
    pathD: 'M 250,380 L 330,380 L 340,440 L 255,445 Z',
    referenceColor: '#22c55e', // Emerald green
    spectrumColor: '#16a34a',
    center: { x: 295, y: 410 },
    riskTier: 1,
    hazardSummary: 'Tura peak escarpment and western plateau colluvial debris flows.',
    monitoringNodes: 1,
  },
  {
    id: 'meghalaya_south_garo_hills',
    name: 'South Garo Hills (Baghmara)',
    stateId: 'meghalaya',
    stateName: 'Meghalaya',
    pathD: 'M 255,445 L 340,440 L 375,475 L 350,500 L 260,490 Z',
    referenceColor: '#16a34a', // Deeper green
    spectrumColor: '#22c55e',
    center: { x: 310, y: 470 },
    pinLocation: { x: 310, y: 470, label: 'Baghmara Simsang Toe' },
    riskTier: 2,
    hazardSummary: 'Simsang river gorge corridor and steep Tertiary sedimentary escarpments.',
    monitoringNodes: 1,
  },
  {
    id: 'meghalaya_khasi_hills',
    name: 'East & West Khasi Hills (Shillong / Sohra)',
    stateId: 'meghalaya',
    stateName: 'Meghalaya',
    pathD: 'M 330,380 L 415,380 L 425,440 L 380,480 L 340,440 Z',
    referenceColor: '#15803d', // Rich forest green
    spectrumColor: '#4ade80',
    center: { x: 375, y: 425 },
    pinLocation: { x: 375, y: 425, label: 'Sohra Cherrapunji Scarp' },
    riskTier: 3,
    hazardSummary: 'Sohra (Cherrapunji) high precipitation escarpment & Shillong peak ridge.',
    monitoringNodes: 2,
  },
  {
    id: 'meghalaya_jaintia_hills',
    name: 'West & East Jaintia Hills (Jowai / Sonapur)',
    stateId: 'meghalaya',
    stateName: 'Meghalaya',
    pathD: 'M 415,380 L 460,380 L 475,440 L 425,440 Z',
    referenceColor: '#166534',
    spectrumColor: '#15803d',
    center: { x: 440, y: 410 },
    pinLocation: { x: 440, y: 410, label: 'Sonapur NH-6 Tunnel Portal' },
    riskTier: 2,
    hazardSummary: 'NH-6 arterial highway lifeline corridor at Sonapur tunnel approach.',
    monitoringNodes: 1,
  },

  // ==========================================
  // 5. NAGALAND (Slate Cerulean & Sky Blue)
  // ==========================================
  {
    id: 'nagaland_mon',
    name: 'Mon District (Patkai Range)',
    stateId: 'nagaland',
    stateName: 'Nagaland',
    pathD: 'M 685,310 L 740,290 L 750,240 L 805,270 L 730,355 L 685,340 Z',
    referenceColor: '#38bdf8', // Cerulean
    spectrumColor: '#0284c7',
    center: { x: 740, y: 310 },
    pinLocation: { x: 740, y: 310, label: 'Mon Town Bypass Scarp' },
    riskTier: 2,
    hazardSummary: 'Patkai Range colluvial mudslides & Naginimora road cuts.',
    monitoringNodes: 1,
  },
  {
    id: 'nagaland_central',
    name: 'Mokokchung, Zunheboto & Wokha',
    stateId: 'nagaland',
    stateName: 'Nagaland',
    pathD: 'M 615,335 L 685,310 L 685,340 L 710,390 L 640,400 Z',
    referenceColor: '#60a5fa', // Soft cornflower blue
    spectrumColor: '#60a5fa',
    center: { x: 660, y: 360 },
    riskTier: 1,
    hazardSummary: 'Central anticlinal ridge zones and tea highway cuts.',
    monitoringNodes: 1,
  },
  {
    id: 'nagaland_kohima_dimapur',
    name: 'Kohima, Dimapur & Phek',
    stateId: 'nagaland',
    stateName: 'Nagaland',
    pathD: 'M 585,370 L 640,400 L 710,390 L 690,460 L 600,450 Z',
    referenceColor: '#0284c7', // Deep slate blue
    spectrumColor: '#0369a1',
    center: { x: 645, y: 420 },
    pinLocation: { x: 645, y: 420, label: 'NH-29 Paglapahar Sinking Sector' },
    riskTier: 3,
    hazardSummary: 'NH-29 Paglapahar chronic sinking corridor in weathered Disang shale.',
    monitoringNodes: 2,
  },

  // ==========================================
  // 6. MANIPUR (Amethyst & Heather Purple)
  // ==========================================
  {
    id: 'manipur_tamenglong',
    name: 'Tamenglong & Noney',
    stateId: 'manipur',
    stateName: 'Manipur',
    pathD: 'M 545,460 L 600,450 L 590,520 L 540,515 Z',
    referenceColor: '#c084fc', // Soft amethyst
    spectrumColor: '#d946ef',
    center: { x: 570, y: 485 },
    pinLocation: { x: 570, y: 485, label: 'Tamenglong-Khongsang Km 24' },
    riskTier: 3,
    hazardSummary: 'Barail shale sequence saturated debris flow & Tupul-Ijai river railway scarp.',
    monitoringNodes: 2,
  },
  {
    id: 'manipur_imphal_valley',
    name: 'Imphal Valley (East & West) & Bishnupur',
    stateId: 'manipur',
    stateName: 'Manipur',
    pathD: 'M 600,450 L 650,455 L 640,530 L 590,520 Z',
    referenceColor: '#d8b4fe', // Pale orchid
    spectrumColor: '#a855f7',
    center: { x: 620, y: 490 },
    riskTier: 1,
    hazardSummary: 'Langol foothills surrounding Imphal valley basin.',
    monitoringNodes: 1,
  },
  {
    id: 'manipur_ukhrul_chandel',
    name: 'Ukhrul, Kamjong, Chandel & Churachandpur',
    stateId: 'manipur',
    stateName: 'Manipur',
    pathD: 'M 650,455 L 690,460 L 675,590 L 580,595 L 540,515 L 590,520 L 640,530 Z',
    referenceColor: '#a855f7', // Medium purple
    spectrumColor: '#c026d3',
    center: { x: 620, y: 550 },
    riskTier: 2,
    hazardSummary: 'Eastern border highlands and Indo-Burma range steep slopes.',
    monitoringNodes: 1,
  },

  // ==========================================
  // 7. MIZORAM (Terracotta & Warm Ochre)
  // ==========================================
  {
    id: 'mizoram_north_aizawl',
    name: 'Aizawl & Kolasib',
    stateId: 'mizoram',
    stateName: 'Mizoram',
    pathD: 'M 480,520 L 540,515 L 550,600 L 490,605 Z',
    referenceColor: '#fb923c', // Warm terracotta
    spectrumColor: '#f97316',
    center: { x: 515, y: 560 },
    pinLocation: { x: 515, y: 560, label: 'Hunthar Sinking Hill Section' },
    riskTier: 2,
    hazardSummary: 'Hunthar sinking hill section on NH-54 & Aizawl municipal steep slopes.',
    monitoringNodes: 1,
  },
  {
    id: 'mizoram_central_lunglei',
    name: 'Lunglei, Champhai & Serchhip',
    stateId: 'mizoram',
    stateName: 'Mizoram',
    pathD: 'M 490,605 L 550,600 L 565,680 L 495,685 Z',
    referenceColor: '#fdba74', // Soft peach terracotta
    spectrumColor: '#fb923c',
    center: { x: 525, y: 640 },
    riskTier: 1,
    hazardSummary: 'Surma group siltstone and shale dipping parallel to steep slope gradients.',
    monitoringNodes: 1,
  },
  {
    id: 'mizoram_south_saiha',
    name: 'Saiha & Lawngtlai (Mara Region)',
    stateId: 'mizoram',
    stateName: 'Mizoram',
    pathD: 'M 495,685 L 565,680 L 540,770 L 485,765 Z',
    referenceColor: '#ea580c', // Deep terracotta
    spectrumColor: '#ea580c',
    center: { x: 520, y: 725 },
    pinLocation: { x: 520, y: 725, label: 'Saiha Town Hill Ridge' },
    riskTier: 2,
    hazardSummary: 'Southern Mara autonomous region mountain crest & Phura valley scarp.',
    monitoringNodes: 1,
  },

  // ==========================================
  // 8. TRIPURA (Aquamarine & Seafoam Slate)
  // ==========================================
  {
    id: 'tripura_dhalai',
    name: 'Dhalai District (Ambassa / Manu)',
    stateId: 'tripura',
    stateName: 'Tripura',
    pathD: 'M 420,530 L 480,520 L 470,610 L 420,615 Z',
    referenceColor: '#2dd4bf', // Seafoam aquamarine
    spectrumColor: '#0d9488',
    center: { x: 445, y: 570 },
    pinLocation: { x: 445, y: 570, label: 'Ambassa Longtharai Tunnel Ridge' },
    riskTier: 1,
    hazardSummary: 'Longtharai ridge anticlinal slope creep & railway tunnel crown.',
    monitoringNodes: 1,
  },
  {
    id: 'tripura_west_south',
    name: 'North, West & South Tripura (Agartala/Jampui)',
    stateId: 'tripura',
    stateName: 'Tripura',
    pathD: 'M 420,615 L 470,610 L 460,685 L 395,680 L 400,600 Z',
    referenceColor: '#5eead4', // Pale aquamarine
    spectrumColor: '#14b8a6',
    center: { x: 430, y: 645 },
    riskTier: 0,
    hazardSummary: 'Jampui hills stable forested anticlinal ridge baseline.',
    monitoringNodes: 1,
  },
];

// Official State Center Typography Label Positions
export const NER_STATE_LABELS = [
  { id: 'sikkim', name: 'SIKKIM', x: 160, y: 245, sub: '3 Districts' },
  { id: 'arunachal', name: 'ARUNACHAL PRADESH', x: 670, y: 160, sub: '6 Sectors' },
  { id: 'assam', name: 'ASSAM', x: 515, y: 315, sub: '6 Sectors' },
  { id: 'meghalaya', name: 'MEGHALAYA', x: 380, y: 460, sub: '4 Sectors' },
  { id: 'nagaland', name: 'NAGALAND', x: 660, y: 395, sub: '3 Sectors' },
  { id: 'manipur', name: 'MANIPUR', x: 615, y: 540, sub: '3 Sectors' },
  { id: 'mizoram', name: 'MIZORAM', x: 550, y: 670, sub: '3 Sectors' },
  { id: 'tripura', name: 'TRIPURA', x: 400, y: 665, sub: '2 Sectors' },
];

export const NERStateSectionMap: React.FC<NERStateSectionMapProps> = ({
  onSelectState,
  onSelectDistrict,
  onSelectPin,
  selectedStateId,
  selectedDistrictId,
  className = '',
}) => {
  const [colorMode, setColorMode] = useState<SectionColorMode>('reference_state');
  const [hoveredSection, setHoveredSection] = useState<StateSectionGeometry | null>(null);
  const [selectedSection, setSelectedSection] = useState<StateSectionGeometry | null>(null);
  const [showSectionBorders, setShowSectionBorders] = useState(true);
  const [showSensorPins, setShowSensorPins] = useState(true);
  const [showGraticule, setShowGraticule] = useState(true);
  const [filterStateId, setFilterStateId] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Handle section click - sets selectedSection permanently so inspector card stays open
  const handleSectionClick = (section: StateSectionGeometry) => {
    setSelectedSection(section);
    const matchedState = NER_STATES_DATA.find((st) => st.id === section.stateId);
    if (matchedState && onSelectState) {
      onSelectState(matchedState);
    }
    if (matchedState && onSelectDistrict) {
      const matchedDistrict = matchedState.monitoredDistricts.find(
        (d) => d.id === section.id || d.name.toLowerCase().includes(section.name.toLowerCase()) || section.name.toLowerCase().includes(d.name.toLowerCase())
      ) || matchedState.monitoredDistricts[0];
      if (matchedDistrict) {
        onSelectDistrict(matchedDistrict, matchedState);
      }
    }
  };

  const handlePinClick = (section: StateSectionGeometry) => {
    handleSectionClick(section);
    const matchedPin = HIERARCHICAL_SENSOR_PINS.find(
      (p) => p.districtId.toLowerCase().includes(section.id.toLowerCase()) ||
             p.stateId === section.stateId
    );
    if (matchedPin && onSelectPin) {
      onSelectPin(matchedPin);
    }
  };

  const getSectionFill = (section: StateSectionGeometry) => {
    if (colorMode === 'reference_state') {
      return section.referenceColor;
    }
    if (colorMode === 'district_spectrum') {
      return section.spectrumColor;
    }
    if (colorMode === 'hazard_tier') {
      if (section.riskTier === 3) return '#ef4444'; // Level 3 Critical Red
      if (section.riskTier === 2) return '#f59e0b'; // Level 2 Warning Amber
      if (section.riskTier === 1) return '#eab308'; // Level 1 Watch Yellow
      return '#10b981'; // Level 0 Safe Emerald
    }
    return section.referenceColor;
  };

  // Matched detailed pin info for inspected section
  const activeInspectSection = selectedSection || hoveredSection;
  const activePinDetail = useMemo(() => {
    if (!activeInspectSection) return null;
    return HIERARCHICAL_SENSOR_PINS.find(
      (p) => p.districtId.toLowerCase().includes(activeInspectSection.id.toLowerCase()) ||
             p.stateId === activeInspectSection.stateId
    ) || HIERARCHICAL_SENSOR_PINS[0];
  }, [activeInspectSection]);

  const filteredSections = useMemo(() => {
    if (filterStateId === 'all') return NER_STATE_SECTIONS;
    return NER_STATE_SECTIONS.filter((s) => s.stateId === filterStateId);
  }, [filterStateId]);

  return (
    <div className={`relative w-full h-full bg-[#f8faf9] text-stone-900 overflow-hidden select-none flex flex-col ${className}`}>
      {/* ================= TOP GIS SURVEYOR TOOLBAR ================= */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Official GSI / Survey Style Badging & Palette Switcher */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-stone-200">
          <div className="flex items-center gap-2 pr-3 border-r border-stone-200">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <div>
              <div className="text-xs font-black tracking-tight text-stone-900 font-mono flex items-center gap-1.5">
                <span>NER GEOTECHNICAL ATLAS</span>
                <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-sans font-semibold">GSI / NDMA</span>
              </div>
              <p className="text-[10px] text-stone-500 font-sans">8 North Eastern States &bull; 21 Geological Sectors</p>
            </div>
          </div>

          {/* Palette Mode Buttons */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setColorMode('reference_state')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                colorMode === 'reference_state'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Official Survey Color Palette"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>State Tints</span>
            </button>
            <button
              onClick={() => setColorMode('district_spectrum')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                colorMode === 'district_spectrum'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Individual District Subdivisions"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>District Spectrum</span>
            </button>
            <button
              onClick={() => setColorMode('hazard_tier')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                colorMode === 'hazard_tier'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Live Geotechnical Hazard Risk Level"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Hazard Heatmap</span>
            </button>
          </div>

          {/* State Filter Dropdown */}
          <select
            value={filterStateId}
            onChange={(e) => setFilterStateId(e.target.value)}
            className="text-xs font-semibold bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-stone-400 text-stone-800 cursor-pointer"
          >
            <option value="all">All 8 States (Regional View)</option>
            {NER_STATES_DATA.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.monitoredDistricts.length} Districts)
              </option>
            ))}
          </select>
        </div>

        {/* Right: Map Layer Toggles & Zoom Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Layer toggles */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-stone-200 text-xs">
            <button
              onClick={() => setShowGraticule((p) => !p)}
              className={`px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                showGraticule ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title="Toggle Lat/Lng Graticule Grid"
            >
              Grid
            </button>
            <button
              onClick={() => setShowSensorPins((p) => !p)}
              className={`px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                showSensorPins ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title="Toggle Geotechnical Sensor Pins"
            >
              Sensors
            </button>
            <button
              onClick={() => setShowSectionBorders((p) => !p)}
              className={`px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                showSectionBorders ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title="Toggle District Division Lines"
            >
              Districts
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-stone-200">
            <button
              onClick={() => setZoomLevel((z) => Math.min(+(z + 0.2).toFixed(2), 2.2))}
              className="w-7 h-7 rounded-lg hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(+(z - 0.2).toFixed(2), 0.8))}
              className="w-7 h-7 rounded-lg hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1.0);
                setPanOffset({ x: 0, y: 0 });
                setSelectedSection(null);
                setFilterStateId('all');
              }}
              className="w-7 h-7 rounded-lg hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MAIN SVG VECTOR MAP CANVAS ================= */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center cursor-default">
        <svg
          viewBox="0 0 1000 800"
          className="w-full h-full max-h-full transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: '50% 50%',
          }}
        >
          <defs>
            {/* Subtle relief drop shadow for state boundaries */}
            <filter id="soi-relief" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.18" />
            </filter>
            <filter id="pin-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3" />
            </filter>
            {/* High-end Survey of India fine topographic paper pattern */}
            <pattern id="survey-paper" width="50" height="50" patternUnits="userSpaceOnUse">
              <rect width="50" height="50" fill="#f8faf9" />
              <path d="M 0,25 L 50,25 M 25,0 L 25,50" stroke="#f1f5f3" strokeWidth="0.8" />
              <circle cx="25" cy="25" r="0.5" fill="#cbd5e1" />
            </pattern>
          </defs>

          {/* Background Map Canvas Fill */}
          <rect width="1000" height="800" fill="url(#survey-paper)" />

          {/* Graticule Grid Lines & Degrees Annotation */}
          {showGraticule && (
            <g id="graticule-grid" stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="4,4" className="pointer-events-none">
              <line x1="160" y1="0" x2="160" y2="800" />
              <line x1="340" y1="0" x2="340" y2="800" />
              <line x1="520" y1="0" x2="520" y2="800" />
              <line x1="700" y1="0" x2="700" y2="800" />
              <line x1="880" y1="0" x2="880" y2="800" />
              <line x1="0" y1="120" x2="1000" y2="120" />
              <line x1="0" y1="260" x2="1000" y2="260" />
              <line x1="0" y1="400" x2="1000" y2="400" />
              <line x1="0" y1="540" x2="1000" y2="540" />
              <line x1="0" y1="680" x2="1000" y2="680" />

              {/* Coordinates Labels */}
              <text x="165" y="20" fontSize="9" fontWeight="700" fill="#94a3b8" fontFamily="monospace">88°E</text>
              <text x="345" y="20" fontSize="9" fontWeight="700" fill="#94a3b8" fontFamily="monospace">90°E</text>
              <text x="525" y="20" fontSize="9" fontWeight="700" fill="#94a3b8" fontFamily="monospace">92°E</text>
              <text x="705" y="20" fontSize="9" fontWeight="700" fill="#94a3b8" fontFamily="monospace">94°E</text>
              <text x="885" y="20" fontSize="9" fontWeight="700" fill="#94a3b8" fontFamily="monospace">96°E</text>

              <text x="10" y="125" fontSize="9" fontWeight="700" fill="#94a3b8" fontFamily="monospace">28°N</text>
              <text x="10" y="265" fontSize="9" fontWeight="700" fill="#94a3b8" fontFamily="monospace">27°N</text>
              <text x="10" y="405" fontSize="9" fontWeight="700" fill="#94a3b8" fontFamily="monospace">26°N</text>
              <text x="10" y="545" fontSize="9" fontWeight="700" fill="#94a3b8" fontFamily="monospace">25°N</text>
              <text x="10" y="685" fontSize="9" fontWeight="700" fill="#94a3b8" fontFamily="monospace">24°N</text>
            </g>
          )}

          {/* Brahmaputra & Teesta Main Drainage Vector Ribbons */}
          <g id="drainage-channels" opacity="0.85" className="pointer-events-none">
            {/* Brahmaputra River Channel */}
            <path
              d="M 850,170 Q 760,220 680,240 T 560,260 T 430,310 T 320,330 T 240,360"
              fill="none"
              stroke="#bfdbfe"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 850,170 Q 760,220 680,240 T 560,260 T 430,310 T 320,330 T 240,360"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <text x="460" y="300" fontSize="9" fontWeight="700" fill="#2563eb" fontFamily="sans-serif" letterSpacing="1px" opacity="0.7">
              BRAHMAPUTRA RIVER
            </text>

            {/* Teesta River Channel in Sikkim */}
            <path
              d="M 160,150 L 165,190 L 175,230"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>

          {/* ================= 1. STATE SECTIONS (POLYGONS WITH SOPHISTICATED GIS TINTS) ================= */}
          <g id="state-sections-layer" filter="url(#soi-relief)">
            {filteredSections.map((section) => {
              const isHovered = hoveredSection?.id === section.id;
              const isSelected = selectedSection?.id === section.id || selectedDistrictId === section.id;
              const fill = getSectionFill(section);

              return (
                <g
                  key={section.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredSection(section)}
                  onMouseLeave={() => setHoveredSection(null)}
                  onClick={() => handleSectionClick(section)}
                >
                  {/* Section Base Polygon */}
                  <path
                    d={section.pathD}
                    fill={fill}
                    stroke={isSelected ? '#0f172a' : isHovered ? '#1e293b' : '#334155'}
                    strokeWidth={isSelected ? '3' : isHovered ? '2.2' : '1.2'}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{
                      opacity: isHovered ? 1.0 : 0.92,
                      filter: isHovered ? 'brightness(1.05) saturate(1.1)' : undefined,
                      transition: 'all 0.15s ease',
                    }}
                  />

                  {/* Internal District Dashed Linework */}
                  {showSectionBorders && (
                    <path
                      d={section.pathD}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="0.8"
                      strokeDasharray="2,2"
                      opacity="0.7"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* ================= 2. STATE CAPITAL & REGION TYPOGRAPHY ================= */}
          <g id="state-labels-layer" className="pointer-events-none select-none">
            {NER_STATE_LABELS.map((lbl) => {
              if (filterStateId !== 'all' && filterStateId !== lbl.id) return null;
              return (
                <g key={lbl.id}>
                  {/* Outer Crisp White Halo */}
                  <text
                    x={lbl.x}
                    y={lbl.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={lbl.id === 'arunachal' || lbl.id === 'assam' ? '15' : '13'}
                    fontWeight="800"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    letterSpacing="1.2px"
                    opacity="0.95"
                  >
                    {lbl.name}
                  </text>
                  {/* Crisp Foreground Typography */}
                  <text
                    x={lbl.x}
                    y={lbl.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={lbl.id === 'arunachal' || lbl.id === 'assam' ? '15' : '13'}
                    fontWeight="800"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fill="#1e293b"
                    letterSpacing="1.2px"
                  >
                    {lbl.name}
                  </text>
                  <text
                    x={lbl.x}
                    y={lbl.y + 13}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#475569"
                    fontFamily="sans-serif"
                  >
                    {lbl.sub}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ================= 3. ELEGANT REFINED GIS SENSOR PINS ================= */}
          {showSensorPins && (
            <g id="refined-sensor-pins-layer">
              {filteredSections.map((sec) => {
                if (!sec.pinLocation) return null;
                const loc = sec.pinLocation;
                const isHovered = hoveredSection?.id === sec.id;
                const isSelected = selectedSection?.id === sec.id;
                const isCrit = sec.riskTier === 3;
                const isWarn = sec.riskTier === 2;

                return (
                  <g
                    key={`pin-${sec.id}`}
                    className="cursor-pointer"
                    onClick={() => handlePinClick(sec)}
                    onMouseEnter={() => setHoveredSection(sec)}
                    onMouseLeave={() => setHoveredSection(null)}
                    filter="url(#pin-shadow)"
                  >
                    {/* Pulsing indicator ring only for Critical nodes */}
                    {isCrit && (
                      <circle
                        cx={loc.x}
                        cy={loc.y}
                        r="14"
                        fill="#ef4444"
                        opacity="0.3"
                        className="animate-ping"
                      />
                    )}

                    {/* Pin Outer Ring */}
                    <circle
                      cx={loc.x}
                      cy={loc.y}
                      r={isSelected ? '9' : '7.5'}
                      fill="#ffffff"
                      stroke={isCrit ? '#dc2626' : isWarn ? '#d97706' : '#2563eb'}
                      strokeWidth="2.5"
                    />

                    {/* Pin Center Core */}
                    <circle
                      cx={loc.x}
                      cy={loc.y}
                      r={isSelected ? '4.5' : '3.5'}
                      fill={isCrit ? '#dc2626' : isWarn ? '#d97706' : '#2563eb'}
                    />

                    {/* Elegant Minimalist Pill Tag below pin */}
                    {(isHovered || isSelected || zoomLevel > 1.2) && (
                      <g transform={`translate(${loc.x}, ${loc.y + 14})`}>
                        <rect
                          x={-loc.label.length * 3.3 - 8}
                          y="-8"
                          width={loc.label.length * 6.6 + 16}
                          height="16"
                          rx="8"
                          fill="#0f172a"
                          opacity="0.92"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="700"
                          fill="#ffffff"
                          fontFamily="sans-serif"
                        >
                          {loc.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* ================= 4. AUTHENTIC SURVEYOR COMPASS ROSE (TOP-RIGHT) ================= */}
          <g id="surveyor-compass" transform="translate(940, 65)" className="select-none pointer-events-none">
            <circle cx="0" cy="0" r="30" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" opacity="0.95" />
            <circle cx="0" cy="0" r="26" fill="none" stroke="#cbd5e1" strokeWidth="0.7" strokeDasharray="2,2" />

            {/* North-South Needle */}
            <polygon points="0,0 -5,-6 0,-24" fill="#0f172a" />
            <polygon points="0,0 5,-6 0,-24" fill="#94a3b8" />
            <polygon points="0,0 5,6 0,24" fill="#0f172a" />
            <polygon points="0,0 -5,6 0,24" fill="#94a3b8" />

            {/* East-West Needle */}
            <polygon points="0,0 6,-5 24,0" fill="#0f172a" />
            <polygon points="0,0 6,5 24,0" fill="#94a3b8" />
            <polygon points="0,0 -6,5 -24,0" fill="#0f172a" />
            <polygon points="0,0 -6,-5 -24,0" fill="#94a3b8" />

            <circle cx="0" cy="0" r="3" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
            <text x="0" y="-32" textAnchor="middle" fontSize="11" fontWeight="900" fill="#0f172a" fontFamily="sans-serif">
              N
            </text>
          </g>

          {/* ================= 5. AUTHENTIC SURVEY METRIC SCALE BAR (BOTTOM-LEFT) ================= */}
          <g id="soi-scale-bar" transform="translate(40, 755)" className="select-none pointer-events-none">
            <rect x="-8" y="-20" width="380" height="34" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" opacity="0.95" />

            <g transform="translate(10, 0)">
              {/* Black / White alternating scale blocks */}
              <rect x="0" y="0" width="50" height="5" fill="#0f172a" />
              <rect x="50" y="0" width="50" height="5" fill="#ffffff" stroke="#0f172a" strokeWidth="0.8" />
              <rect x="100" y="0" width="100" height="5" fill="#0f172a" />
              <rect x="200" y="0" width="100" height="5" fill="#ffffff" stroke="#0f172a" strokeWidth="0.8" />

              <text x="0" y="-6" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f172a">0</text>
              <text x="50" y="-6" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f172a">50</text>
              <text x="100" y="-6" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f172a">100</text>
              <text x="200" y="-6" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f172a">200</text>
              <text x="300" y="-6" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f172a">300 km</text>

              <text x="315" y="5" fontSize="9" fontWeight="700" fill="#64748b">Scale 1:2,500,000</text>
            </g>
          </g>
        </svg>
      </div>

      {/* ================= PROFESSIONAL GIS INSPECTION DRAWER / FLOATING CARD ================= */}
      <AnimatePresence>
        {activeInspectSection && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute bottom-4 right-4 z-40 w-[400px] max-w-[calc(100vw-32px)] bg-white/98 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-stone-300"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2 pb-2.5 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                  style={{ backgroundColor: getSectionFill(activeInspectSection) }}
                />
                <div>
                  <h4 className="font-bold text-stone-900 text-sm leading-tight">
                    {activeInspectSection.name}
                  </h4>
                  <p className="text-[11px] font-medium text-stone-500">
                    State: <span className="font-semibold text-stone-700">{activeInspectSection.stateName}</span> &bull; {activeInspectSection.monitoringNodes} Telemetry Nodes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Status Badge */}
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono ${
                    activeInspectSection.riskTier === 3
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : activeInspectSection.riskTier === 2
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : activeInspectSection.riskTier === 1
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {activeInspectSection.riskTier === 3 ? 'Level 3 Critical' : activeInspectSection.riskTier === 2 ? 'Level 2 Warning' : activeInspectSection.riskTier === 1 ? 'Level 1 Watch' : 'Level 0 Safe'}
                </span>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setSelectedSection(null);
                    setHoveredSection(null);
                  }}
                  className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                  title="Close Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Geological Hazard Summary */}
            <p className="text-xs text-stone-600 leading-relaxed mb-3">
              {activeInspectSection.hazardSummary}
            </p>

            {/* Telemetry Metrics Snippet */}
            {activePinDetail && (
              <div className="grid grid-cols-3 gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono mb-3">
                <div>
                  <span className="text-[10px] text-stone-400 block uppercase">Pore Head</span>
                  <span className="font-bold text-stone-800">{activePinDetail.poreWaterPressure_kPa} kPa</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block uppercase">Displacement</span>
                  <span className="font-bold text-amber-700">{activePinDetail.slopeDisplacement_mm} mm</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block uppercase">24h Rain</span>
                  <span className="font-bold text-blue-700">{activePinDetail.rainfall24h_mm} mm</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-100">
              <span className="text-[11px] font-mono text-stone-500">
                GPS: {activePinDetail?.lat.toFixed(2)}° N, {activePinDetail?.lng.toFixed(2)}° E
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePinClick(activeInspectSection)}
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Inspect Live Geotechnical Telemetry"
                >
                  <Activity className="w-3.5 h-3.5 text-blue-300" />
                  <span>Inspect Telemetry</span>
                </button>
                <button
                  onClick={() => handleSectionClick(activeInspectSection)}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Drill down district directory and hazard parameters"
                >
                  <span>Drill Down</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
