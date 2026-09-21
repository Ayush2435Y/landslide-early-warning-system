/**
 * Lithos Geotechnical Landslide Monitoring System - Database Schema
 * Production-ready relational schema with TypeScript type definitions,
 * foreign key relationships, validation rules, and indexing strategies.
 */

// ============================================================================
// 1. ENUMS & DOMAIN TYPES
// ============================================================================

export type UserRole = 'admin' | 'field_officer' | 'geologist_analyst' | 'citizen';
export type SensorType = 'piezometer' | 'inclinometer' | 'seismometer' | 'moisture' | 'rain_gauge' | 'tiltmeter';
export type SensorStatus = 'nominal' | 'warning' | 'critical' | 'offline' | 'calibrating';
export type SeverityLevel = 'info' | 'warning' | 'critical';
export type IncidentCategory = 'sensor_failure' | 'ground_movement' | 'water_level' | 'vandalism' | 'landslide' | 'flood' | 'infrastructure' | 'other';
export type IncidentStatus = 'pending' | 'critical' | 'reviewed' | 'dispatched' | 'dismissed' | 'resolved';
export type IncidentSource = 'mobile' | 'citizen' | 'field_officer' | 'sensor_auto';
export type MetricType = 'porePressure' | 'displacement' | 'soilMoisture' | 'rainfallRate' | 'seismic' | 'battery';
export type ComparisonOperator = '>' | '<' | '>=' | '<=';
export type DisasterOutcomeType = 'stable' | 'minor_slip' | 'critical' | 'pending';

// ============================================================================
// 2. TABLE INTERFACES & SCHEMAS
// ============================================================================

/**
 * 1. Users & Authentication
 */
export interface UserTable {
  id: string; // UUID v4
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  unit?: string | null;
  assigned_sector?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 2. Sectors & Geographic Zones
 */
export interface SectorTable {
  id: string; // e.g., 'sector-alpha'
  name: string; // 'Sector Alpha'
  geographic_area: string; // 'North Ridge Escarpment'
  region_state: string; // 'California'
  center_lat: number;
  center_lng: number;
  boundary_geojson?: string | null; // GeoJSON Polygon
  slope_angle_deg: number;
  soil_type: string; // 'Colluvium / Weathered Sandstone'
  drainage_capacity_m3s: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  evacuation_zone_id?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 3. Geotechnical Sensors
 */
export interface SensorTable {
  id: string; // e.g., 'PZ-109'
  name: string;
  type: SensorType;
  sector_id: string; // FK -> sectors.id
  lat: number;
  lng: number;
  elevation_m: number;
  depth_m: number;
  unit: string; // 'kPa', 'mm', '%', 'mm/h', 'mm/s', '°'
  warning_threshold: number;
  critical_threshold: number;
  status: SensorStatus;
  battery_level_pct: number;
  signal_dbm: number;
  firmware_version: string;
  last_calibrated_at?: string | null;
  last_reading_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 4. High-Frequency Sensor Telemetry Readings (Time-Series)
 */
export interface SensorReadingTable {
  id: string; // UUID v4 or BigInt
  sensor_id: string; // FK -> sensors.id
  recorded_at: string; // ISO 8601 Timestamp
  epoch_ms: number; // Fast indexing timestamp
  primary_value: number; // Main measurement
  secondary_value?: number | null; // Temperature, tilt X/Y
  soil_moisture?: number | null; // Associated %
  pore_pressure_kpa?: number | null;
  displacement_mm?: number | null;
  battery_v?: number | null;
  temperature_c?: number | null;
  is_anomaly: boolean;
  raw_payload?: string | null; // Raw JSON packet
}

/**
 * 5. Telemetry Snapshots (Aggregated Area Time-Frames)
 */
export interface TelemetrySnapshotTable {
  id: string; // UUID
  recorded_at: string;
  epoch_ms: number;
  sector_id: string; // FK -> sectors.id or 'all'
  avg_pore_pressure_kpa: number;
  max_displacement_mm: number;
  avg_soil_moisture_pct: number;
  max_rainfall_rate_mmh: number;
  max_seismic_vibration_mms: number;
  composite_risk_score: number; // 0-100
  critical_sensors_count: number;
  warning_sensors_count: number;
  anomaly_detected: boolean;
}

/**
 * 6. Incident & Citizen Hazard Reports
 */
export interface IncidentReportTable {
  id: string; // UUID v4
  report_code: string; // e.g., 'INC-2026-084'
  title: string;
  category: IncidentCategory;
  severity: SeverityLevel;
  description: string;
  submitted_by_user_id?: string | null; // FK -> users.id (nullable for anonymous)
  submitter_name: string;
  source: IncidentSource;
  lat: number;
  lng: number;
  location_name: string;
  sector_id: string; // FK -> sectors.id
  status: IncidentStatus;
  photos_json: string; // JSON array of photo URLs or base64 storage refs
  nlp_risk_score: number; // 0-100 computed by Gemini/NLP
  sensors_in_area_count: number;
  duplicate_of_report_id?: string | null; // FK -> incident_reports.id
  ai_priority_rank?: number | null;
  ai_urgency_score?: number | null;
  plain_english_summary?: string | null;
  citizen_advice?: string | null;
  ai_hazard_category?: string | null;
  dispatched_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 7. Incident Activity & Triage Notes
 */
export interface IncidentNoteTable {
  id: string; // UUID
  incident_id: string; // FK -> incident_reports.id
  author_id?: string | null; // FK -> users.id
  author_name: string;
  note_text: string;
  is_internal_only: boolean;
  created_at: string;
}

/**
 * 8. Early Warning Alert Rules
 */
export interface AlertRuleTable {
  id: string; // UUID or rule-slug
  name: string;
  sensor_id: string; // FK -> sensors.id or 'all'
  metric: MetricType;
  operator: ComparisonOperator;
  threshold_value: number;
  unit: string;
  severity: SeverityLevel;
  is_enabled: boolean;
  audio_alert: boolean;
  trigger_count: number;
  last_triggered_at?: string | null;
  created_by_user_id?: string | null; // FK -> users.id
  created_at: string;
  updated_at: string;
}

/**
 * 9. Alert Trigger & Dispatch Audit Logs
 */
export interface AlertAuditLogTable {
  id: string; // UUID
  rule_id: string; // FK -> alert_rules.id
  sensor_id: string; // FK -> sensors.id
  triggered_at: string;
  epoch_ms: number;
  metric: MetricType;
  measured_value: number;
  threshold_value: number;
  operator: ComparisonOperator;
  unit: string;
  severity: SeverityLevel;
  alert_message: string;
  is_acknowledged: boolean;
  acknowledged_by_user_id?: string | null; // FK -> users.id
  acknowledged_at?: string | null;
  resolution_notes?: string | null;
}

/**
 * 10. AI Predictive Risk Assessments (Gemini Geotechnical Model)
 */
export interface AiRiskPredictionTable {
  id: string; // UUID
  sector_id: string; // FK -> sectors.id
  recorded_at: string;
  probability: number; // 0-100
  hazard_type: string;
  risk_factor: string;
  time_to_critical: string;
  confidence_pct: number;
  technical_summary: string;
  recommendations_json: string; // JSON array of strings
  model_version: string; // e.g. 'gemini-3.7-flash'
  input_telemetry_snapshot_id?: string | null; // FK -> telemetry_snapshots.id
  created_at: string;
}

/**
 * 11. Historical Disaster Analogues
 */
export interface HistoricalDisasterAnalogueTable {
  id: string; // UUID
  event_code: string; // e.g., 'EV-2022-CA-01'
  event_name: string; // 'Route 9 North Escarpment Debris Flow'
  event_date: string;
  location_name: string;
  sector_id?: string | null; // FK -> sectors.id
  peak_rainfall_mm: number;
  soil_saturation_prior_pct: number;
  max_pore_pressure_kpa: number;
  outcome_description: string;
  outcome_type: DisasterOutcomeType;
  damage_estimate_usd?: number | null;
  lessons_learned?: string | null;
  created_at: string;
}

/**
 * 12. System & Security Audit Trail
 */
export interface SystemAuditLogTable {
  id: string; // UUID
  user_id?: string | null; // FK -> users.id
  user_email?: string | null;
  action_type: string; // 'AUTH_LOGIN', 'RULE_UPDATE', 'ALERT_ACKNOWLEDGE', 'INCIDENT_DISPATCH', 'CONFIG_CHANGE'
  resource_type: string; // 'alert_rule', 'incident_report', 'sensor', 'system'
  resource_id?: string | null;
  ip_address: string;
  user_agent: string;
  details_json?: string | null;
  created_at: string;
}

// ============================================================================
// 3. DATABASE SCHEMA METADATA DEFINITIONS
// ============================================================================

export interface TableDefinition {
  tableName: string;
  description: string;
  primaryKey: string;
  foreignKeys: Array<{ column: string; referencesTable: string; referencesColumn: string; onDelete: string }>;
  indexes: Array<{ name: string; columns: string[]; type: 'btree' | 'brin' | 'gist' | 'gin'; unique?: boolean }>;
}

export const DATABASE_TABLE_REGISTRY: Record<string, TableDefinition> = {
  users: {
    tableName: 'users',
    description: 'System operators, field units, geologists, and registered citizens',
    primaryKey: 'id',
    foreignKeys: [],
    indexes: [
      { name: 'idx_users_email', columns: ['email'], type: 'btree', unique: true },
      { name: 'idx_users_role', columns: ['role'], type: 'btree' },
    ],
  },
  sectors: {
    tableName: 'sectors',
    description: 'Geographic slope sectors with geological properties and boundary polygons',
    primaryKey: 'id',
    foreignKeys: [],
    indexes: [
      { name: 'idx_sectors_risk_level', columns: ['risk_level'], type: 'btree' },
      { name: 'idx_sectors_region', columns: ['region_state', 'geographic_area'], type: 'btree' },
    ],
  },
  sensors: {
    tableName: 'sensors',
    description: 'Hardware telemetry sensors (Piezometers, Inclinometers, Rain Gauges, Seismographs)',
    primaryKey: 'id',
    foreignKeys: [
      { column: 'sector_id', referencesTable: 'sectors', referencesColumn: 'id', onDelete: 'CASCADE' },
    ],
    indexes: [
      { name: 'idx_sensors_sector_id', columns: ['sector_id'], type: 'btree' },
      { name: 'idx_sensors_status', columns: ['status'], type: 'btree' },
      { name: 'idx_sensors_type', columns: ['type'], type: 'btree' },
      { name: 'idx_sensors_coordinates', columns: ['lat', 'lng'], type: 'btree' },
    ],
  },
  sensor_readings: {
    tableName: 'sensor_readings',
    description: 'High-frequency time-series measurement records for slope sensors',
    primaryKey: 'id',
    foreignKeys: [
      { column: 'sensor_id', referencesTable: 'sensors', referencesColumn: 'id', onDelete: 'CASCADE' },
    ],
    indexes: [
      { name: 'idx_readings_sensor_epoch', columns: ['sensor_id', 'epoch_ms'], type: 'btree' },
      { name: 'idx_readings_epoch_brin', columns: ['epoch_ms'], type: 'brin' },
      { name: 'idx_readings_anomalies', columns: ['is_anomaly'], type: 'btree' },
    ],
  },
  telemetry_snapshots: {
    tableName: 'telemetry_snapshots',
    description: 'Aggregated regional snapshot frames for trend sparklines and risk computation',
    primaryKey: 'id',
    foreignKeys: [
      { column: 'sector_id', referencesTable: 'sectors', referencesColumn: 'id', onDelete: 'CASCADE' },
    ],
    indexes: [
      { name: 'idx_snapshots_epoch', columns: ['epoch_ms'], type: 'btree' },
      { name: 'idx_snapshots_sector_epoch', columns: ['sector_id', 'epoch_ms'], type: 'btree' },
    ],
  },
  incident_reports: {
    tableName: 'incident_reports',
    description: 'Hazard reports from citizens, field observers, and automatic sensor triggers',
    primaryKey: 'id',
    foreignKeys: [
      { column: 'sector_id', referencesTable: 'sectors', referencesColumn: 'id', onDelete: 'RESTRICT' },
      { column: 'submitted_by_user_id', referencesTable: 'users', referencesColumn: 'id', onDelete: 'SET NULL' },
      { column: 'duplicate_of_report_id', referencesTable: 'incident_reports', referencesColumn: 'id', onDelete: 'SET NULL' },
    ],
    indexes: [
      { name: 'idx_incidents_status', columns: ['status'], type: 'btree' },
      { name: 'idx_incidents_severity', columns: ['severity'], type: 'btree' },
      { name: 'idx_incidents_sector', columns: ['sector_id'], type: 'btree' },
      { name: 'idx_incidents_created_at', columns: ['created_at'], type: 'btree' },
      { name: 'idx_incidents_nlp_score', columns: ['nlp_risk_score'], type: 'btree' },
    ],
  },
  incident_notes: {
    tableName: 'incident_notes',
    description: 'Dispatcher logs, engineering assessments, and triage field notes',
    primaryKey: 'id',
    foreignKeys: [
      { column: 'incident_id', referencesTable: 'incident_reports', referencesColumn: 'id', onDelete: 'CASCADE' },
      { column: 'author_id', referencesTable: 'users', referencesColumn: 'id', onDelete: 'SET NULL' },
    ],
    indexes: [
      { name: 'idx_notes_incident_id', columns: ['incident_id'], type: 'btree' },
    ],
  },
  alert_rules: {
    tableName: 'alert_rules',
    description: 'Custom threshold monitoring rules with multi-channel and audio dispatch triggers',
    primaryKey: 'id',
    foreignKeys: [
      { column: 'created_by_user_id', referencesTable: 'users', referencesColumn: 'id', onDelete: 'SET NULL' },
    ],
    indexes: [
      { name: 'idx_rules_sensor_id', columns: ['sensor_id'], type: 'btree' },
      { name: 'idx_rules_enabled', columns: ['is_enabled'], type: 'btree' },
    ],
  },
  alert_audit_logs: {
    tableName: 'alert_audit_logs',
    description: 'Immutable historical audit logs of all sensor threshold breaches and operator acknowledgements',
    primaryKey: 'id',
    foreignKeys: [
      { column: 'rule_id', referencesTable: 'alert_rules', referencesColumn: 'id', onDelete: 'CASCADE' },
      { column: 'sensor_id', referencesTable: 'sensors', referencesColumn: 'id', onDelete: 'CASCADE' },
      { column: 'acknowledged_by_user_id', referencesTable: 'users', referencesColumn: 'id', onDelete: 'SET NULL' },
    ],
    indexes: [
      { name: 'idx_alert_logs_triggered_at', columns: ['triggered_at'], type: 'btree' },
      { name: 'idx_alert_logs_sensor', columns: ['sensor_id', 'triggered_at'], type: 'btree' },
      { name: 'idx_alert_logs_ack', columns: ['is_acknowledged'], type: 'btree' },
    ],
  },
  ai_risk_predictions: {
    tableName: 'ai_risk_predictions',
    description: 'Gemini AI geotechnical assessments, failure probability, and tactical mitigation plans',
    primaryKey: 'id',
    foreignKeys: [
      { column: 'sector_id', referencesTable: 'sectors', referencesColumn: 'id', onDelete: 'CASCADE' },
    ],
    indexes: [
      { name: 'idx_ai_predictions_sector', columns: ['sector_id', 'created_at'], type: 'btree' },
      { name: 'idx_ai_predictions_prob', columns: ['probability'], type: 'btree' },
    ],
  },
  historical_disaster_analogues: {
    tableName: 'historical_disaster_analogues',
    description: 'Archived landslide disasters for AI historical pattern matching and model calibration',
    primaryKey: 'id',
    foreignKeys: [],
    indexes: [
      { name: 'idx_analogues_event_date', columns: ['event_date'], type: 'btree' },
      { name: 'idx_analogues_rainfall', columns: ['peak_rainfall_mm'], type: 'btree' },
    ],
  },
  system_audit_logs: {
    tableName: 'system_audit_logs',
    description: 'Security and administrative audit trail for compliance, role actions, and system mutations',
    primaryKey: 'id',
    foreignKeys: [
      { column: 'user_id', referencesTable: 'users', referencesColumn: 'id', onDelete: 'SET NULL' },
    ],
    indexes: [
      { name: 'idx_sys_audit_created_at', columns: ['created_at'], type: 'btree' },
      { name: 'idx_sys_audit_action', columns: ['action_type'], type: 'btree' },
      { name: 'idx_sys_audit_user', columns: ['user_id'], type: 'btree' },
    ],
  },
};
