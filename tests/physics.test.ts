import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEdgePhysicsCheck,
  fuseTelemetryWithSatellite,
  calculateSolarPowerTelemetry,
  fetchSatelliteWeatherData,
} from '../server.ts';

test('calculateEdgePhysicsCheck - Safe baseline conditions (Tier 0)', () => {
  const result = calculateEdgePhysicsCheck({
    deviceId: 'TEST-NODE-01',
    rainfall_mm: 5.0,
    pore_pressure_kpa: 20.0,
    displacement_mm: 0.4,
    battery_pct: 95,
  });
  assert.equal(result.riskTier, 0);
  assert.equal(result.riskTierCode, 'Level 0');
  assert.equal(result.riskTierName, 'Safe');
  assert.equal(result.isCritical, false);
  assert.equal(result.isWarning, false);
  assert.equal(result.localSirenTriggered, false);
  assert.equal(result.localSmsDispatched, false);
  assert.equal(result.relayCommand, 'GPIO26_LOW_RELAY_STANDBY');
  assert.equal(result.physicsMetrics.displacementLimitBreached, false);
  assert.equal(result.physicsMetrics.porePressureLimitBreached, false);
  assert.ok(result.physicsMetrics.instantFactorOfSafety > 1.25);
});

test('calculateEdgePhysicsCheck - Watch tier with elevated rain/pore (Tier 1)', () => {
  const result = calculateEdgePhysicsCheck({
    deviceId: 'TEST-NODE-02',
    rainfall_mm: 20.0,
    pore_pressure_kpa: 34.0,
    displacement_mm: 1.2,
    battery_pct: 90,
  });
  assert.equal(result.riskTier, 1);
  assert.equal(result.riskTierCode, 'Level 1');
  assert.equal(result.riskTierName, 'Watch');
  assert.equal(result.isCritical, false);
  assert.equal(result.isWarning, false);
  assert.equal(result.localSirenTriggered, false);
  assert.equal(result.localSmsDispatched, false);
  assert.equal(result.relayCommand, 'GPIO24_PULSE_HEARTBEAT_FAST');
});

test('calculateEdgePhysicsCheck - Warning tier with high displacement/pore (Tier 2)', () => {
  const result = calculateEdgePhysicsCheck({
    deviceId: 'TEST-NODE-03',
    rainfall_mm: 35.0,
    pore_pressure_kpa: 42.0,
    displacement_mm: 2.2,
    battery_pct: 88,
  });
  assert.equal(result.riskTier, 2);
  assert.equal(result.riskTierCode, 'Level 2');
  assert.equal(result.riskTierName, 'Warning');
  assert.equal(result.isCritical, false);
  assert.equal(result.isWarning, true);
  assert.equal(result.localSirenTriggered, false);
  assert.equal(result.localSmsDispatched, true);
  assert.equal(result.relayCommand, 'GPIO25_HIGH_STROBE_YELLOW_ACTIVE');
});

test('calculateEdgePhysicsCheck - Critical tier triggers autonomous siren & sirens (Tier 3)', () => {
  const result = calculateEdgePhysicsCheck({
    deviceId: 'TEST-NODE-04',
    rainfall_mm: 60.0,
    pore_pressure_kpa: 52.0,
    displacement_mm: 3.8,
    battery_pct: 82,
  });
  assert.equal(result.riskTier, 3);
  assert.equal(result.riskTierCode, 'Level 3');
  assert.equal(result.riskTierName, 'Critical');
  assert.equal(result.isCritical, true);
  assert.equal(result.isWarning, true);
  assert.equal(result.localSirenTriggered, true);
  assert.equal(result.localSmsDispatched, true);
  assert.equal(result.relayCommand, 'GPIO26_HIGH_RELAY_SIREN_ON_LOCAL_ALARM');
  assert.ok(result.physicsMetrics.instantFactorOfSafety <= 1.0);
  assert.equal(result.physicsMetrics.displacementLimitBreached, true);
  assert.equal(result.physicsMetrics.porePressureLimitBreached, true);
});

test('fuseTelemetryWithSatellite - Computes combined multi-sensor Factor of Safety', () => {
  const dummyTelemetry = {
    deviceId: 'NER-TEST-NODE',
    rainfall_mm: 45,
    pore_pressure_kpa: 48,
    displacement_mm: 2.8,
    battery_pct: 92,
  };
  const satelliteData = fetchSatelliteWeatherData(26.1445, 91.7362);

  const fused = fuseTelemetryWithSatellite(dummyTelemetry, satelliteData);
  assert.ok(fused.fusionMetrics.combinedRainfall > 0);
  assert.ok(fused.fusionMetrics.poreHeadRatio > 1.0);
  assert.ok(fused.fusionMetrics.slopeStressFactor > 0);
  assert.ok(fused.fusionMetrics.factorOfSafety >= 0.65);
});

test('calculateSolarPowerTelemetry - Validates voltage and LiFePO4 battery bounds', () => {
  const telemetry = calculateSolarPowerTelemetry(85);
  assert.ok(telemetry.batteryVoltageV >= 12.4 && telemetry.batteryVoltageV <= 13.6);
  assert.equal(telemetry.batterySoCPct, 85);
  assert.equal(telemetry.mpptEfficiencyPct, 98.4);
  assert.equal(telemetry.solarPanelRatedWatts, 20.0);
});
