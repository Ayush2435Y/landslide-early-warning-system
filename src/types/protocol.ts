/**
 * Disaster Protocol - Type Definitions & Standard Operating Procedures (SOP)
 * Multi-Level Geotechnical Landslide Early Warning System
 */

export enum DisasterAlertLevel {
  LEVEL_0_NORMAL = 0,
  LEVEL_1_ADVISORY = 1,
  LEVEL_2_STANDBY = 2,
  LEVEL_3_EVACUATION = 3,
}

export type AlertLevelCode = 'Level 0' | 'Level 1' | 'Level 2' | 'Level 3';
export type AlertLevelName = 'Normal' | 'Advisory' | 'Standby' | 'Evacuation';
export type ProtocolSeverity = 'normal' | 'advisory' | 'standby' | 'evacuation';
export type ProtocolUserRole = 'admin' | 'field_officer' | 'citizen';
export type SOPTaskCategory = 
  | 'surveillance' 
  | 'civil_defense' 
  | 'communication' 
  | 'field_operation' 
  | 'medical_evac' 
  | 'infrastructure';

export interface SOPChecklistItem {
  id: string;
  role: ProtocolUserRole;
  title: string;
  description: string;
  requiredForLevel: DisasterAlertLevel;
  category: SOPTaskCategory;
  priority: 'critical' | 'high' | 'medium' | 'standard';
  mandatoryForEvacuation?: boolean;
}

export interface DisasterLevelDefinition {
  level: DisasterAlertLevel;
  code: AlertLevelCode;
  name: AlertLevelName;
  severity: ProtocolSeverity;
  label: string;
  badgeText: string;
  hexColor: string;
  bgTailwind: string;
  borderTailwind: string;
  textTailwind: string;
  indicatorGlow: string;
  description: string;
  recommendedAction: string;
  sirenRequired: boolean;
  
  // Geotechnical & Physical Activation Criteria
  criteria: {
    factorOfSafetyMax: number;
    soilSaturationMinPct: number;
    porePressureMinKpa: number;
    displacementRateMinMmH: number;
    rainfall24hMinMm: number;
  };
}

export interface EvacuationBroadcastPayload {
  alertLevel: DisasterAlertLevel;
  levelCode: AlertLevelCode;
  targetSector: string;
  evacRadius: string;
  timestamp: string;
  initiatedBy: string;
  userRole: ProtocolUserRole;
  checklistCompletedCount: number;
  totalChecklistCount: number;
  dispatchAgencies: {
    notifyDOT: boolean;
    notifyEmergencyRescue: boolean;
    notifyNDRF: boolean;
    activateSirens: boolean;
    dispatchSMS: boolean;
  };
  geotechnicalSnapshot?: {
    factorOfSafety: number;
    porePressureKPa: number;
    soilMoisturePct: number;
    displacementMm: number;
    rainfall24hMm: number;
  };
}

export interface ProtocolStateRecord {
  activeLevel: DisasterAlertLevel;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  evacuationInitiated: boolean;
  evacuationTimestamp?: string;
  completedTaskIds: string[];
  lastUpdated: string;
}

/**
 * Standard Operating Procedure (SOP) Master Registry
 * Pre-configured checklists specifically tailored for Admin, Field Officer, and Citizen roles.
 */
export const DEFAULT_PROTOCOL_SOPS: SOPChecklistItem[] = [
  // ─── ADMIN ROLE CHECKLIST ITEMS ───────────────────────────────────────
  {
    id: 'sop-adm-01',
    role: 'admin',
    title: 'Authenticate Emergency Authority Frequency',
    description: 'Verify encrypted VHF/telecom linkage with State Emergency Operations Centre (SEOC) & NDMA.',
    requiredForLevel: DisasterAlertLevel.LEVEL_1_ADVISORY,
    category: 'communication',
    priority: 'standard',
  },
  {
    id: 'sop-adm-02',
    role: 'admin',
    title: 'Order Continuous Inclinometer Polling',
    description: 'Switch telemetry sample frequency from 15-minute intervals to 10-second rapid edge polling.',
    requiredForLevel: DisasterAlertLevel.LEVEL_1_ADVISORY,
    category: 'surveillance',
    priority: 'high',
  },
  {
    id: 'sop-adm-03',
    role: 'admin',
    title: 'Deploy BRO Highway Transit Intercept Orders',
    description: 'Issue pre-closure alert to Border Roads Organisation (BRO) for vulnerable arterial passes.',
    requiredForLevel: DisasterAlertLevel.LEVEL_2_STANDBY,
    category: 'infrastructure',
    priority: 'high',
  },
  {
    id: 'sop-adm-04',
    role: 'admin',
    title: 'Mobilize NDRF 1st & 12th Battalions to Staging Base',
    description: 'Dispatch National Disaster Response Force heavy urban search & rescue to forward regional shelters.',
    requiredForLevel: DisasterAlertLevel.LEVEL_2_STANDBY,
    category: 'civil_defense',
    priority: 'critical',
  },
  {
    id: 'sop-adm-05',
    role: 'admin',
    title: 'Authorize Red Action Evacuation Broadcast',
    description: 'Sign and electronically transmit mandatory evacuation order across all cellular broadcast towers.',
    requiredForLevel: DisasterAlertLevel.LEVEL_3_EVACUATION,
    category: 'civil_defense',
    priority: 'critical',
    mandatoryForEvacuation: true,
  },
  {
    id: 'sop-adm-06',
    role: 'admin',
    title: 'Activate Acoustic Multi-Tone Hazard Sirens',
    description: 'Trigger remote relay GPIO controllers on mountain slope early warning towers across affected sector.',
    requiredForLevel: DisasterAlertLevel.LEVEL_3_EVACUATION,
    category: 'civil_defense',
    priority: 'critical',
    mandatoryForEvacuation: true,
  },

  // ─── FIELD OFFICER ROLE CHECKLIST ITEMS ────────────────────────────────
  {
    id: 'sop-fld-01',
    role: 'field_officer',
    title: 'Physical Borehole & Inclinometer Zero-Check',
    description: 'Inspect collar stability on inclinometers and test piezometer transducer cable integrity on site.',
    requiredForLevel: DisasterAlertLevel.LEVEL_1_ADVISORY,
    category: 'surveillance',
    priority: 'standard',
  },
  {
    id: 'sop-fld-02',
    role: 'field_officer',
    title: 'Inspect Highway Toe Drains & Weep Holes',
    description: 'Clear debris blockages from retaining wall drains to facilitate hydrostatic pressure dissipation.',
    requiredForLevel: DisasterAlertLevel.LEVEL_1_ADVISORY,
    category: 'infrastructure',
    priority: 'high',
  },
  {
    id: 'sop-fld-03',
    role: 'field_officer',
    title: 'Erect Slope Failure Perimeter Warnings',
    description: 'Place retroreflective hazard warning barriers and detour markers 200m before active shear zone.',
    requiredForLevel: DisasterAlertLevel.LEVEL_2_STANDBY,
    category: 'field_operation',
    priority: 'high',
  },
  {
    id: 'sop-fld-04',
    role: 'field_officer',
    title: 'Coordinate Door-to-Door Settlement Alert',
    description: 'Establish verbal contact with headmen of downslope villages within the 500m potential debris runout fan.',
    requiredForLevel: DisasterAlertLevel.LEVEL_2_STANDBY,
    category: 'communication',
    priority: 'critical',
  },
  {
    id: 'sop-fld-05',
    role: 'field_officer',
    title: 'Enforce Immediate Zone Exclusion & Sweeps',
    description: 'Clear all transit vehicles from road cuttings and escort remaining civilian occupants past safe ridge markers.',
    requiredForLevel: DisasterAlertLevel.LEVEL_3_EVACUATION,
    category: 'field_operation',
    priority: 'critical',
    mandatoryForEvacuation: true,
  },
  {
    id: 'sop-fld-06',
    role: 'field_officer',
    title: 'Fall Back to Designated High Ground Command Post',
    description: 'Ensure field response team retreats to verified non-shearing stable bedrock staging area.',
    requiredForLevel: DisasterAlertLevel.LEVEL_3_EVACUATION,
    category: 'field_operation',
    priority: 'critical',
    mandatoryForEvacuation: true,
  },

  // ─── CITIZEN ROLE CHECKLIST ITEMS ──────────────────────────────────────
  {
    id: 'sop-ctz-01',
    role: 'citizen',
    title: 'Prepare Household Emergency "Go-Bag"',
    description: 'Pack official identity cards, non-perishable food, water purification tablets, first-aid, and flashlight.',
    requiredForLevel: DisasterAlertLevel.LEVEL_1_ADVISORY,
    category: 'civil_defense',
    priority: 'standard',
  },
  {
    id: 'sop-ctz-02',
    role: 'citizen',
    title: 'Inspect Home Perimeter & Retaining Walls',
    description: 'Check yard slopes, boundary walls, and door frames for sudden widening cracks or jammed windows.',
    requiredForLevel: DisasterAlertLevel.LEVEL_1_ADVISORY,
    category: 'surveillance',
    priority: 'high',
  },
  {
    id: 'sop-ctz-03',
    role: 'citizen',
    title: 'Fuel Vehicles & Park Facing Outward Away from Banks',
    description: 'Keep vehicles ready for immediate egress; park away from steep cut slopes or tall drainage ditches.',
    requiredForLevel: DisasterAlertLevel.LEVEL_2_STANDBY,
    category: 'civil_defense',
    priority: 'high',
  },
  {
    id: 'sop-ctz-04',
    role: 'citizen',
    title: 'Check on Elderly & Vulnerable Neighbors',
    description: 'Establish buddy system with neighboring households to ensure coordinated mobility assistance.',
    requiredForLevel: DisasterAlertLevel.LEVEL_2_STANDBY,
    category: 'communication',
    priority: 'high',
  },
  {
    id: 'sop-ctz-05',
    role: 'citizen',
    title: 'Shut Off Main Household Gas & Electrical Breakers',
    description: 'Isolate utilities to prevent secondary post-failure explosions or electrical fires.',
    requiredForLevel: DisasterAlertLevel.LEVEL_3_EVACUATION,
    category: 'civil_defense',
    priority: 'critical',
    mandatoryForEvacuation: true,
  },
  {
    id: 'sop-ctz-06',
    role: 'citizen',
    title: 'Follow Marked Ridge Route to Community Shelter',
    description: 'Move quickly uphill/laterally out of the valley floor gully towards designated GSI/NDMA evacuation shelter.',
    requiredForLevel: DisasterAlertLevel.LEVEL_3_EVACUATION,
    category: 'medical_evac',
    priority: 'critical',
    mandatoryForEvacuation: true,
  },
];

/**
 * 4-Level Disaster Protocol Master Definitions
 */
export const DISASTER_PROTOCOL_LEVELS: Record<DisasterAlertLevel, DisasterLevelDefinition> = {
  [DisasterAlertLevel.LEVEL_0_NORMAL]: {
    level: DisasterAlertLevel.LEVEL_0_NORMAL,
    code: 'Level 0',
    name: 'Normal',
    severity: 'normal',
    label: 'Level 0: Normal Baseline',
    badgeText: 'Level 0: Normal',
    hexColor: '#10b981',
    bgTailwind: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    borderTailwind: 'border-emerald-500',
    textTailwind: 'text-emerald-700 dark:text-emerald-400',
    indicatorGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.35)]',
    description: 'Slope equilibrium is stable. Hydrostatic pore pressures are nominal and precipitation is within safe absorption thresholds.',
    recommendedAction: 'Standard automated telemetry logging and routine maintenance.',
    sirenRequired: false,
    criteria: {
      factorOfSafetyMax: 999, // FS >= 1.5
      soilSaturationMinPct: 0,
      porePressureMinKpa: 0,
      displacementRateMinMmH: 0,
      rainfall24hMinMm: 0,
    },
  },
  [DisasterAlertLevel.LEVEL_1_ADVISORY]: {
    level: DisasterAlertLevel.LEVEL_1_ADVISORY,
    code: 'Level 1',
    name: 'Advisory',
    severity: 'advisory',
    label: 'Level 1: Advisory Watch',
    badgeText: 'Level 1: Advisory',
    hexColor: '#eab308',
    bgTailwind: 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-500/30',
    borderTailwind: 'border-yellow-500',
    textTailwind: 'text-yellow-800 dark:text-yellow-400',
    indicatorGlow: 'shadow-[0_0_15px_rgba(234,179,8,0.35)]',
    description: 'Elevated antecedent rainfall detected. Soil moisture is rising and slight creep displacement observed along shear planes.',
    recommendedAction: 'Verify sensor calibration, increase telemetry polling rate, and prepare community advisories.',
    sirenRequired: false,
    criteria: {
      factorOfSafetyMax: 1.5,
      soilSaturationMinPct: 70,
      porePressureMinKpa: 35,
      displacementRateMinMmH: 1.0,
      rainfall24hMinMm: 70,
    },
  },
  [DisasterAlertLevel.LEVEL_2_STANDBY]: {
    level: DisasterAlertLevel.LEVEL_2_STANDBY,
    code: 'Level 2',
    name: 'Standby',
    severity: 'standby',
    label: 'Level 2: Standby Warning',
    badgeText: 'Level 2: Standby',
    hexColor: '#f97316',
    bgTailwind: 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/40',
    borderTailwind: 'border-orange-500',
    textTailwind: 'text-orange-800 dark:text-orange-400',
    indicatorGlow: 'shadow-[0_0_20px_rgba(249,115,22,0.45)]',
    description: 'Pore-water pressure exceeding critical safety margin. Inclinometers confirm active plastic shear deformation. Rainfall intensity high.',
    recommendedAction: 'Mobilize emergency response teams, deploy transit detours, and ready community shelters.',
    sirenRequired: false,
    criteria: {
      factorOfSafetyMax: 1.3,
      soilSaturationMinPct: 80,
      porePressureMinKpa: 45,
      displacementRateMinMmH: 2.5,
      rainfall24hMinMm: 120,
    },
  },
  [DisasterAlertLevel.LEVEL_3_EVACUATION]: {
    level: DisasterAlertLevel.LEVEL_3_EVACUATION,
    code: 'Level 3',
    name: 'Evacuation',
    severity: 'evacuation',
    label: 'Level 3: Emergency Evacuation',
    badgeText: 'Level 3: Evacuation',
    hexColor: '#ef4444',
    bgTailwind: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/50',
    borderTailwind: 'border-red-600',
    textTailwind: 'text-red-700 dark:text-red-400',
    indicatorGlow: 'shadow-[0_0_30px_rgba(239,68,68,0.7)]',
    description: 'Catastrophic slope failure imminent or active. Factor of Safety breached (FS < 1.0), extreme hydrostatic pore pressure, runaway ground creep.',
    recommendedAction: 'Mandatory emergency evacuation. Activate local acoustic sirens, shut roads, and dispatch rescue convoys.',
    sirenRequired: true,
    criteria: {
      factorOfSafetyMax: 1.0,
      soilSaturationMinPct: 88,
      porePressureMinKpa: 55,
      displacementRateMinMmH: 4.0,
      rainfall24hMinMm: 180,
    },
  },
};
