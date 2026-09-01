-- ============================================================================
-- LITHOS GEOTECHNICAL LANDSLIDE MONITORING SYSTEM
-- Production Relational Database Schema (PostgreSQL 14+ / TimescaleDB / PostGIS)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM DOMAINS & ENUM TYPES
CREATE TYPE user_role AS ENUM ('admin', 'field_officer', 'geologist_analyst', 'citizen');
CREATE TYPE sensor_type AS ENUM ('piezometer', 'inclinometer', 'seismometer', 'moisture', 'rain_gauge', 'tiltmeter');
CREATE TYPE sensor_status AS ENUM ('nominal', 'warning', 'critical', 'offline', 'calibrating');
CREATE TYPE severity_level AS ENUM ('info', 'warning', 'critical');
CREATE TYPE incident_category AS ENUM ('sensor_failure', 'ground_movement', 'water_level', 'vandalism', 'landslide', 'flood', 'infrastructure', 'other');
CREATE TYPE incident_status AS ENUM ('pending', 'critical', 'reviewed', 'dispatched', 'dismissed', 'resolved');
CREATE TYPE incident_source AS ENUM ('mobile', 'citizen', 'field_officer', 'sensor_auto');
CREATE TYPE metric_type AS ENUM ('porePressure', 'displacement', 'soilMoisture', 'rainfallRate', 'seismic', 'battery');
CREATE TYPE comparison_operator AS ENUM ('>', '<', '>=', '<=');
CREATE TYPE disaster_outcome_type AS ENUM ('stable', 'minor_slip', 'critical', 'pending');
CREATE TYPE slope_risk_level AS ENUM ('low', 'moderate', 'high', 'critical');

-- ============================================================================
-- 3. TABLES DEFINITIONS
-- ============================================================================

-- 3.1 USERS & PERSONNEL
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'citizen',
    unit VARCHAR(100),
    assigned_sector VARCHAR(100),
    phone_number VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 SECTORS & GEOGRAPHIC MONITORING ZONES
CREATE TABLE IF NOT EXISTS sectors (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'sector-alpha'
    name VARCHAR(150) NOT NULL,
    geographic_area VARCHAR(150) NOT NULL,
    region_state VARCHAR(100) NOT NULL,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    boundary_geojson JSONB,
    slope_angle_deg NUMERIC(4,1) NOT NULL DEFAULT 35.0,
    soil_type VARCHAR(150) NOT NULL DEFAULT 'Colluvium / Weathered Sandstone',
    drainage_capacity_m3s NUMERIC(6,2) NOT NULL DEFAULT 120.0,
    risk_level slope_risk_level NOT NULL DEFAULT 'moderate',
    evacuation_zone_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 GEOTECHNICAL SENSORS
CREATE TABLE IF NOT EXISTS sensors (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'PZ-109', 'INC-44'
    name VARCHAR(150) NOT NULL,
    type sensor_type NOT NULL,
    sector_id VARCHAR(100) NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    elevation_m NUMERIC(7,2) NOT NULL DEFAULT 320.0,
    depth_m NUMERIC(5,2) NOT NULL DEFAULT 15.0,
    unit VARCHAR(20) NOT NULL, -- 'kPa', 'mm', '%', 'mm/h', 'mm/s', '°'
    warning_threshold NUMERIC(8,2) NOT NULL,
    critical_threshold NUMERIC(8,2) NOT NULL,
    status sensor_status NOT NULL DEFAULT 'nominal',
    battery_level_pct INT NOT NULL DEFAULT 100 CHECK (battery_level_pct BETWEEN 0 AND 100),
    signal_dbm INT NOT NULL DEFAULT -65,
    firmware_version VARCHAR(50) NOT NULL DEFAULT 'v2.4.1',
    last_calibrated_at TIMESTAMPTZ,
    last_reading_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 SENSOR READINGS (TIME-SERIES TELEMETRY)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    sensor_id VARCHAR(50) NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    epoch_ms BIGINT NOT NULL,
    primary_value NUMERIC(10,3) NOT NULL,
    secondary_value NUMERIC(10,3),
    soil_moisture NUMERIC(5,2),
    pore_pressure_kpa NUMERIC(7,2),
    displacement_mm NUMERIC(7,3),
    battery_v NUMERIC(4,2),
    temperature_c NUMERIC(5,2),
    is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    raw_payload JSONB
);

-- 3.5 REGIONAL TELEMETRY SNAPSHOTS
CREATE TABLE IF NOT EXISTS telemetry_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    epoch_ms BIGINT NOT NULL,
    sector_id VARCHAR(100) NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
    avg_pore_pressure_kpa NUMERIC(6,2) NOT NULL DEFAULT 0,
    max_displacement_mm NUMERIC(6,3) NOT NULL DEFAULT 0,
    avg_soil_moisture_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    max_rainfall_rate_mmh NUMERIC(6,2) NOT NULL DEFAULT 0,
    max_seismic_vibration_mms NUMERIC(6,3) NOT NULL DEFAULT 0,
    composite_risk_score INT NOT NULL DEFAULT 0 CHECK (composite_risk_score BETWEEN 0 AND 100),
    critical_sensors_count INT NOT NULL DEFAULT 0,
    warning_sensors_count INT NOT NULL DEFAULT 0,
    anomaly_detected BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3.6 INCIDENT & CITIZEN HAZARD REPORTS
CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    category incident_category NOT NULL DEFAULT 'landslide',
    severity severity_level NOT NULL DEFAULT 'warning',
    description TEXT NOT NULL,
    submitted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    submitter_name VARCHAR(150) NOT NULL DEFAULT 'Field Unit / Citizen',
    source incident_source NOT NULL DEFAULT 'citizen',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    sector_id VARCHAR(100) NOT NULL REFERENCES sectors(id) ON DELETE RESTRICT,
    status incident_status NOT NULL DEFAULT 'pending',
    photos_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    nlp_risk_score INT NOT NULL DEFAULT 50 CHECK (nlp_risk_score BETWEEN 0 AND 100),
    sensors_in_area_count INT NOT NULL DEFAULT 0,
    duplicate_of_report_id UUID REFERENCES incident_reports(id) ON DELETE SET NULL,
    ai_priority_rank INT,
    ai_urgency_score INT CHECK (ai_urgency_score BETWEEN 0 AND 100),
    plain_english_summary TEXT,
    citizen_advice TEXT,
    ai_hazard_category VARCHAR(150),
    dispatched_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.7 INCIDENT NOTES & DISPATCH LOGS
CREATE TABLE IF NOT EXISTS incident_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(150) NOT NULL,
    note_text TEXT NOT NULL,
    is_internal_only BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.8 EARLY WARNING ALERT RULES
CREATE TABLE IF NOT EXISTS alert_rules (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'rule-1', 'rule-sector-alpha'
    name VARCHAR(200) NOT NULL,
    sensor_id VARCHAR(50) NOT NULL DEFAULT 'all',
    metric metric_type NOT NULL,
    operator comparison_operator NOT NULL DEFAULT '>=',
    threshold_value NUMERIC(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    severity severity_level NOT NULL DEFAULT 'critical',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    audio_alert BOOLEAN NOT NULL DEFAULT TRUE,
    trigger_count INT NOT NULL DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.9 ALERT AUDIT & TRIGGER LOGS
CREATE TABLE IF NOT EXISTS alert_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id VARCHAR(100) NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    sensor_id VARCHAR(50) NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    epoch_ms BIGINT NOT NULL,
    metric metric_type NOT NULL,
    measured_value NUMERIC(10,3) NOT NULL,
    threshold_value NUMERIC(10,3) NOT NULL,
    operator comparison_operator NOT NULL,
    unit VARCHAR(20) NOT NULL,
    severity severity_level NOT NULL,
    alert_message TEXT NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- 3.10 AI PREDICTIVE RISK ASSESSMENTS (GEMINI GEOTECHNICAL MODEL)
CREATE TABLE IF NOT EXISTS ai_risk_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_id VARCHAR(100) NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    probability INT NOT NULL CHECK (probability BETWEEN 0 AND 100),
    hazard_type VARCHAR(200) NOT NULL,
    risk_factor VARCHAR(200) NOT NULL,
    time_to_critical VARCHAR(100) NOT NULL,
    confidence_pct NUMERIC(5,2) NOT NULL CHECK (confidence_pct BETWEEN 0 AND 100),
    technical_summary TEXT NOT NULL,
    recommendations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    model_version VARCHAR(100) NOT NULL DEFAULT 'gemini-3.7-flash',
    input_telemetry_snapshot_id UUID REFERENCES telemetry_snapshots(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.11 HISTORICAL DISASTER ANALOGUES
CREATE TABLE IF NOT EXISTS historical_disaster_analogues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_code VARCHAR(50) UNIQUE NOT NULL,
    event_name VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    sector_id VARCHAR(100) REFERENCES sectors(id) ON DELETE SET NULL,
    peak_rainfall_mm NUMERIC(6,2) NOT NULL,
    soil_saturation_prior_pct NUMERIC(5,2) NOT NULL,
    max_pore_pressure_kpa NUMERIC(6,2) NOT NULL,
    outcome_description TEXT NOT NULL,
    outcome_type disaster_outcome_type NOT NULL DEFAULT 'stable',
    damage_estimate_usd NUMERIC(12,2),
    lessons_learned TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.12 SYSTEM & SECURITY AUDIT TRAIL
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    ip_address VARCHAR(50) NOT NULL,
    user_agent TEXT,
    details_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. PERFORMANCE INDEXES (B-Tree, BRIN, Spatial)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_sectors_risk_level ON sectors(risk_level);
CREATE INDEX IF NOT EXISTS idx_sensors_sector_id ON sensors(sector_id);
CREATE INDEX IF NOT EXISTS idx_sensors_status ON sensors(status);
CREATE INDEX IF NOT EXISTS idx_sensors_type ON sensors(type);
CREATE INDEX IF NOT EXISTS idx_sensors_coords ON sensors(lat, lng);

-- High-Frequency Time Series Indexing
CREATE INDEX IF NOT EXISTS idx_readings_sensor_epoch ON sensor_readings(sensor_id, epoch_ms DESC);
CREATE INDEX IF NOT EXISTS idx_readings_epoch_brin ON sensor_readings USING BRIN(epoch_ms);
CREATE INDEX IF NOT EXISTS idx_readings_anomaly ON sensor_readings(is_anomaly) WHERE is_anomaly = TRUE;

CREATE INDEX IF NOT EXISTS idx_snapshots_sector_epoch ON telemetry_snapshots(sector_id, epoch_ms DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status_severity ON incident_reports(status, severity);
CREATE INDEX IF NOT EXISTS idx_incidents_sector ON incident_reports(sector_id);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incident_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_nlp_score ON incident_reports(nlp_risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_alert_logs_triggered ON alert_audit_logs(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_logs_unacked ON alert_audit_logs(is_acknowledged) WHERE is_acknowledged = FALSE;
CREATE INDEX IF NOT EXISTS idx_ai_predictions_sector_created ON ai_risk_predictions(sector_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_audit_created ON system_audit_logs(created_at DESC);

-- ============================================================================
-- 5. TRIGGER FUNCTIONS (AUTOMATIC UPDATED_AT TIMESTAMP)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_sectors_updated_at BEFORE UPDATE ON sectors FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_sensors_updated_at BEFORE UPDATE ON sensors FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_incident_reports_updated_at BEFORE UPDATE ON incident_reports FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_alert_rules_updated_at BEFORE UPDATE ON alert_rules FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

-- ============================================================================
-- 6. ANALYTICAL VIEWS FOR REAL-TIME MONITORING
-- ============================================================================

-- 6.1 View: Live Sensor Fleet Summary
CREATE OR REPLACE VIEW view_sensor_fleet_summary AS
SELECT 
    s.sector_id,
    sec.name AS sector_name,
    sec.risk_level AS sector_risk_level,
    COUNT(s.id) AS total_sensors,
    COUNT(CASE WHEN s.status = 'critical' THEN 1 END) AS critical_sensors,
    COUNT(CASE WHEN s.status = 'warning' THEN 1 END) AS warning_sensors,
    COUNT(CASE WHEN s.status = 'nominal' THEN 1 END) AS nominal_sensors,
    ROUND(AVG(s.battery_level_pct), 1) AS avg_battery_pct,
    MAX(s.last_reading_at) AS latest_telemetry_timestamp
FROM sensors s
JOIN sectors sec ON sec.id = s.sector_id
GROUP BY s.sector_id, sec.name, sec.risk_level;

-- 6.2 View: Active Unresolved High-Priority Incidents
CREATE OR REPLACE VIEW view_unresolved_critical_incidents AS
SELECT 
    ir.id,
    ir.report_code,
    ir.title,
    ir.category,
    ir.severity,
    ir.status,
    ir.nlp_risk_score,
    ir.ai_priority_rank,
    ir.location_name,
    sec.name AS sector_name,
    ir.created_at
FROM incident_reports ir
JOIN sectors sec ON sec.id = ir.sector_id
WHERE ir.status IN ('pending', 'critical')
ORDER BY ir.nlp_risk_score DESC, ir.created_at DESC;

-- ============================================================================
-- 7. SEED DATA FOR LITHOS GEOTECHNICAL MESH
-- ============================================================================

-- Sectors
INSERT INTO sectors (id, name, geographic_area, region_state, center_lat, center_lng, slope_angle_deg, soil_type, drainage_capacity_m3s, risk_level)
VALUES 
('sector-alpha', 'Sector Alpha', 'North Ridge Escarpment', 'California', 34.0528, -118.2437, 44.5, 'Weathered Colluvium / Sandstone', 85.0, 'critical'),
('sector-beta', 'Sector Beta', 'Oak Creek Basin', 'California', 34.0585, -118.2492, 28.0, 'Alluvial Silt & Gravel', 190.0, 'moderate'),
('sector-gamma', 'Sector Gamma', 'Bedrock Lower Quarry', 'California', 34.0510, -118.2380, 52.0, 'Fractured Gneiss & Granodiorite', 65.0, 'low'),
('sector-4', 'Sector 4 (RT-9)', 'Route 9 Highway Corridor', 'California', 34.0542, -118.2415, 38.5, 'Compacted Clay / Fill Slope', 110.0, 'high')
ON CONFLICT (id) DO NOTHING;

-- Initial Sensors
INSERT INTO sensors (id, name, type, sector_id, lat, lng, elevation_m, depth_m, unit, warning_threshold, critical_threshold, status, battery_level_pct, signal_dbm)
VALUES 
('PZ-109', 'Piezometer Array Delta', 'piezometer', 'sector-alpha', 34.0528, -118.2437, 412.0, 18.5, 'kPa', 40.0, 42.0, 'warning', 94, -68),
('INC-44', 'Retaining Wall Inclinometer', 'inclinometer', 'sector-alpha', 34.0542, -118.2415, 395.0, 12.0, '°', 1.5, 2.2, 'critical', 88, -72),
('PZ-104', 'Valley Piezometer Unit', 'piezometer', 'sector-beta', 34.0585, -118.2492, 280.0, 24.0, 'kPa', 38.0, 45.0, 'nominal', 97, -62),
('IC-209', 'Slope Inclinometer Array', 'inclinometer', 'sector-4', 34.0505, -118.2460, 360.0, 16.0, '°', 1.5, 2.5, 'warning', 91, -70),
('SM-02', 'Capacitive Moisture Matrix', 'moisture', 'sector-alpha', 34.0535, -118.2428, 405.0, 1.2, '%', 75.0, 80.0, 'critical', 95, -64),
('RG-01', 'Tipping Bucket Rain Gauge', 'rain_gauge', 'sector-4', 34.0560, -118.2400, 440.0, 0.0, 'mm/h', 35.0, 40.0, 'critical', 99, -58),
('SEIS-01', 'Triaxial Geophone Array', 'seismometer', 'sector-alpha', 34.0520, -118.2450, 410.0, 3.5, 'mm/s', 0.8, 1.5, 'nominal', 92, -66)
ON CONFLICT (id) DO NOTHING;

-- Historical Disaster Analogues
INSERT INTO historical_disaster_analogues (event_code, event_name, event_date, location_name, sector_id, peak_rainfall_mm, soil_saturation_prior_pct, max_pore_pressure_kpa, outcome_description, outcome_type, damage_estimate_usd, lessons_learned)
VALUES
('EV-2022-CA-01', 'Route 9 North Escarpment Debris Flow', '2022-01-14', 'Route 9 Mile Marker 14.2', 'sector-alpha', 98.4, 88.0, 46.2, 'Deep rotational slump blocking both highway lanes for 72 hours with 4,200 tons of debris.', 'critical', 1250000.00, 'Horizontal drainage pipes required every 25m along colluvial benches.'),
('EV-2021-CA-08', 'Sector Beta Silt Slip', '2021-11-20', 'Oak Creek Culvert Junction', 'sector-beta', 44.0, 68.0, 32.0, 'Minor embankment creep into drainage swale; no highway disruption.', 'minor_slip', 45000.00, 'Culvert diameter expanded to 1.8m to prevent back-pressure surcharge.'),
('EV-2019-CA-04', 'Sector Gamma Quarry Rockfall', '2019-03-08', 'Bedrock Quarry Wall', 'sector-gamma', 62.5, 54.0, 24.5, 'Isolated 15-ton boulder detachment caught in wire mesh catchment fence.', 'stable', 18000.00, 'Rock bolting pattern reinforced with 6m grouted anchors.')
ON CONFLICT (event_code) DO NOTHING;
