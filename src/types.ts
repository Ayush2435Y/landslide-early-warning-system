export type RiskSeverity = 'low' | 'amber' | 'critical';
export type UserRole = 'admin' | 'user';

// 4-Tier Graduated Warning System for NER Landslide Early Warning
export type RiskTierLevel = 0 | 1 | 2 | 3;
export type RiskTierCode = 'Level 0' | 'Level 1' | 'Level 2' | 'Level 3';
export type RiskTierName = 'Safe' | 'Watch' | 'Warning' | 'Critical';

export interface RiskTierInfo {
  level: RiskTierLevel;
  code: RiskTierCode;
  name: RiskTierName;
  color: string; // e.g. '#16a34a', '#ca8a04', '#ea580c', '#dc2626'
  bgColor: string;
  borderColor: string;
  textColor: string;
  condition: string;
  action: string;
}

export const RISK_TIERS: Record<RiskTierLevel, RiskTierInfo> = {
  0: {
    level: 0,
    code: 'Level 0',
    name: 'Safe',
    color: '#16a34a',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    condition: 'Normal rainfall, stable pore pressure.',
    action: 'Routine monitoring',
  },
  1: {
    level: 1,
    code: 'Level 1',
    name: 'Watch',
    color: '#eab308',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-800 dark:text-yellow-300',
    condition: 'Rainfall increasing, moderate pore pressure change.',
    action: 'Increase monitoring',
  },
  2: {
    level: 2,
    code: 'Level 2',
    name: 'Warning',
    color: '#f97316',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-800 dark:text-orange-300',
    condition: 'Threshold exceeded, detectable ground movement.',
    action: 'Notify authorities',
  },
  3: {
    level: 3,
    code: 'Level 3',
    name: 'Critical',
    color: '#dc2626',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-600',
    textColor: 'text-red-700 dark:text-red-300',
    condition: 'Extreme rainfall, rapidly increasing pressure, accelerating displacement.',
    action: 'Immediate evacuation',
  },
};

// ESP32 Hardware Telemetry Payload (Wi-Fi / LoRa / Cellular)
export interface ESP32TelemetryPayload {
  deviceId: string; // e.g. "NER-NODE-01"
  rainfall_mm: number;
  pore_pressure_kpa: number;
  displacement_mm: number;
  battery_pct: number;
  timestamp?: string;
  receivedAt?: string;
  source?: string;
  riskTier?: number;
  sectorId?: string;
  sectorName?: string;
  state?: string;
  lat?: number;
  lng?: number;
}

// Hourly Rainfall Forecast Point for 24h simulation
export interface HourlyRainfallForecast {
  hourOffset: number; // 1 to 24
  hourLabel: string; // e.g. "+1h", "+2h", "+3h", ..., "+24h"
  timeString: string; // e.g. "14:00"
  intensity_mm_h: number; // rainfall intensity in mm/h
  cumulative_mm: number; // cumulative rainfall since t=0
  probability_pct: number; // precipitation probability 0-100%
  alertLevel: 'normal' | 'moderate' | 'heavy' | 'cloudburst';
}

// Regional Satellite DEM & IMD Weather Forecast Structure
export interface SatelliteWeatherData {
  lat: number;
  lng: number;
  region: string;
  state: string;
  elevation_m: number;
  slope_angle_deg: number;
  soil_saturation_index: number; // 0-100%
  lithology: string; // e.g. "Disang Shale & Sandstone complex"
  drainage_density_km_km2: number;
  imd_rainfall_24h_mm: number;
  imd_monsoon_status: 'Normal' | 'Active Monsoon' | 'Heavy Rain Warning (Orange)' | 'Extremely Heavy Cloudburst (Red)';
  doppler_radar_reflectivity_dbz: number;
  forecast_next_12h_mm: number;
  forecast_total_24h_mm: number;
  peak_intensity_mm_h: number;
  peak_intensity_hour: string;
  peak_window: string;
  rainfall_forecast_24h: HourlyRainfallForecast[];
  source: string;
  demModel: string;
  updatedAt: string;
}

// AI Fused Prediction Result from Gemini + Edge Telemetry + Satellite
export interface EdgePhysicsCheckResult {
  isCritical: boolean;
  isWarning: boolean;
  riskTier: RiskTierLevel;
  riskTierCode: RiskTierCode;
  riskTierName: RiskTierName;
  localSirenTriggered: boolean;
  localSmsDispatched: boolean;
  relayCommand: string; // e.g. "GPIO_HIGH_RELAY_SIREN_ON"
  triggerReason: string;
  edgeLatencyMs: number; // e.g. 6.4 ms
  smsRecipients: string[];
  physicsMetrics: {
    displacementLimitBreached: boolean;
    porePressureLimitBreached: boolean;
    rateOfChangePorePressure_kpa_min: number;
    instantFactorOfSafety: number;
  };
  timestamp: string;
}

export interface SolarPowerTelemetry {
  solarGenerationWatts: number; // e.g. 14.5 W
  solarPanelRatedWatts: number; // e.g. 20 W or 50 W
  mpptEfficiencyPct: number; // e.g. 98.4%
  mpptState: 'BULK_CHARGING' | 'ABSORPTION' | 'FLOAT' | 'STANDBY_NIGHT';
  batteryVoltageV: number; // e.g. 13.2 V (4S LiFePO4)
  batterySoCPct: number; // e.g. 92%
  batteryChemistry: 'LiFePO4 (Lithium Iron Phosphate)';
  cycleLifeCount: number; // e.g. 2640 cycles
  deepSleepCurrentMicroAmps: number; // e.g. 15 uA
  estimatedStandbyDays: number; // e.g. 8.5 days without sunlight
}

export interface FusedPredictionResult {
  riskLevel: RiskTierCode;
  riskLevelNumber: RiskTierLevel;
  riskTierName: RiskTierName;
  riskProbability: number; // 0-100%
  hazardType: string;
  riskFactor: string;
  timeToCritical: string;
  confidence: number;
  actionProtocol: string;
  summary: string;
  recommendations: string[];
  forecastImpact?: string; // Geotechnical impact of 24h rain curve
  pluvialThresholdBreachWindow?: string; // Estimated breach window e.g. "+4 to +6 Hours"
  cumulativeRainfallRisk?: string; // Pluvial saturation load assessment
  geotechnicalAnalysis: {
    factorOfSafety: number;
    porePressureRatio: number;
    shearStrainRate: string;
    hydrologicalSaturation: string;
  };
  telemetrySummary: {
    deviceId: string;
    rainfall_mm: number;
    pore_pressure_kpa: number;
    displacement_mm: number;
    battery_pct: number;
  };
  satelliteSummary: {
    slope_angle_deg: number;
    imd_rainfall_24h_mm: number;
    soil_saturation_index: number;
    lithology: string;
  };
  sector: string;
  analyzedAt: string;
}

export interface SensorData {
  id: string;
  name: string;
  type: 'piezometer' | 'inclinometer' | 'seismometer' | 'moisture' | 'rain_gauge' | 'tiltmeter' | 'esp32_node';
  value: number;
  unit: string;
  status: 'nominal' | 'warning' | 'critical';
  riskTier?: RiskTierLevel; // 0 (Safe), 1 (Watch), 2 (Warning), 3 (Critical)
  sector: string;
  area?: string; // Geographic Area (e.g. Guwahati Hills, Dima Hasao, Shillong Peak)
  state?: string; // Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura
  lat: number;
  lng: number;
  depth?: string;
  threshold: number;
  sparkline: number[];
  displacement?: number; // for inclinometers in mm
  porePressure?: number; // in kPa
  soilMoisture?: number; // % VWC saturation (e.g. 84.0)
  rainfallMm?: number; // 24h total rainfall fallen (e.g. 68.5 mm)
  rainfallRate?: number; // live rain rate in mm/h (e.g. 45.0 mm/h)
  riskChance?: number; // Hazard risk probability % (e.g. 88%)
  riskLevel?: 'low' | 'moderate' | 'high' | 'critical';
  hazardType?: string; // e.g. 'Deep Rotational Slide', 'Debris Flow', 'Retaining Wall Shear'
  batteryLevel: number;
  signalDbm: number;
  lastUpdated: string;
}

export interface AlertItem {
  id: string;
  code: string;
  title: string;
  description: string;
  sector: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  acknowledged: boolean;
  sensorId?: string;
  actionRequired?: string;
}

export interface IncidentReport {
  id: string;
  reportId: string;
  title: string;
  category: 'sensor_failure' | 'ground_movement' | 'water_level' | 'vandalism' | 'landslide' | 'flood' | 'infrastructure' | 'other';
  severity: RiskSeverity;
  description: string;
  submittedBy: string;
  timestamp: string;
  source: 'mobile' | 'citizen' | 'field_officer' | 'sensor_auto';
  lat: number;
  lng: number;
  locationName: string;
  sector: string;
  status: 'pending' | 'critical' | 'reviewed' | 'dispatched' | 'dismissed';
  photos: string[];
  nlpRiskScore: number;
  sensorsInArea: number;
  duplicateStatus: string;
  notes?: string[];
  aiPriorityRank?: number;
  aiUrgencyScore?: number;
  plainEnglishSummary?: string;
  citizenAdvice?: string;
  aiHazardCategory?: string;
}

export interface CitizenSafetySummary {
  statusLevel: 'safe' | 'warning' | 'danger';
  headline: string;
  simpleExplanation: string;
  travelAdvice: string;
  homeownerAdvice: string;
  generatedAt: string;
}

export interface PredictiveAIInsight {
  probability: number;
  hazardType: string;
  riskFactor: string;
  timeToCritical: string;
  confidence: number;
  summary: string;
  recommendations: string[];
  sector: string;
  analyzedAt: string;
  historicalAnalogues: Array<{
    eventId: string;
    date: string;
    peakRainfall: string;
    soilSatPrior: string;
    outcome: string;
    outcomeType: 'stable' | 'minor_slip' | 'critical' | 'pending';
  }>;
}

export interface FieldOfficerProfile {
  id: string;
  name: string;
  officerId: string;
  unit: string;
  sector: string;
  status: 'online' | 'standby' | 'dispatched';
  avatarUrl: string;
  cachedSectors: Array<{
    name: string;
    sizeMb: number;
    cached: boolean;
  }>;
  aggressivePolling: boolean;
  lastSyncTime: string;
}

export type MetricType = 'porePressure' | 'displacement' | 'soilMoisture' | 'rainfallRate' | 'seismic' | 'battery';

export interface TelemetryPoint {
  epoch: number;
  timestamp: string;
  timeLabel: string;
  porePressure: number;
  displacement: number;
  soilMoisture: number;
  rainfallRate: number;
  seismicVibration: number;
  sectorAlphaRisk: number;
  pz109?: number;
  pz104?: number;
  inc44?: number;
  inc209?: number;
  seis01?: number;
  sm02?: number;
  rg01?: number;
  isAnomaly?: boolean;
}

export interface CustomAlertRule {
  id: string;
  name: string;
  sensorId: string;
  metric: MetricType;
  operator: '>' | '<' | '>=' | '<=';
  thresholdValue: number;
  unit: string;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  audioAlert: boolean;
  lastTriggered?: string;
  triggerCount: number;
  createdBy?: string;
}

export interface TriggeredAlert {
  ruleId: string;
  ruleName: string;
  sensorId: string;
  sensorName?: string;
  sector?: string;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  operator: string;
  unit: string;
  severity: 'critical' | 'warning' | 'info';
  audioAlert: boolean;
  timestamp: string;
  message: string;
}

export interface HistoricalLandslideEvent {
  id: string;
  year: number;
  date: string;
  title: string;
  location: string;
  sector: string;
  lat: number;
  lng: number;
  xPercent: number; // For map positioning
  yPercent: number;
  category: 'debris_flow' | 'rockfall' | 'rotational_slide' | 'mudflow' | 'toe_failure';
  volumeM3: number;
  triggerRainfallMm: number;
  damageLevel: 'severe' | 'moderate' | 'minor';
  description: string;
  casualtiesOrEvac: string;
  lessonsLearned: string;
  mitigationInstalled?: string;
}

