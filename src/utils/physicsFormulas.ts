/**
 * Bhumi Rakshak - Physics-Based Geotechnical Formulas Engine
 * Implements the 13 Real-Time Sensor Data Physics Formulas for Landslide Risk:
 * 1. Pore-Water Pressure: u = rho_w * g * h_w
 * 2. Soil Moisture (VWC): theta_v = V_w / V_t
 * 3. Degree of Saturation: S_r = (theta_v - theta_r) / (theta_s - theta_r)
 * 4. Normal Stress on Slope: sigma_n = rho * g * z * cos^2(beta)
 * 5. Driving Shear Stress: tau = rho * g * z * sin(beta) * cos(beta)
 * 6. Effective Stress: sigma' = sigma_n - u
 * 7. Shear Strength (Mohr-Coulomb): tau_f = c' + sigma' * tan(phi')
 * 8. Factor of Safety (Infinite Slope Model): FS = tau_f / tau
 * 9. Rainfall Infiltration (Green-Ampt Model): f = K_s * (1 + psi_f * (theta_s - theta_i) / F)
 * 10. Soil Moisture Change Rate: dM/dt = (M_t - M_{t-dt}) / dt
 * 11. Pore Pressure Change Rate: du/dt = (u_t - u_{t-dt}) / dt
 * 12. Vibration from MPU6050: a = sqrt(ax^2 + ay^2 + az^2), V_RMS
 * 13. Rainfall Accumulation: P_T = sum(Ri * dt)
 */

export interface ScannerSiteGeotechnicalData {
  id: string;
  stationCode: string;
  name: string;
  area: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  lithology: string;
  riskTier: 'Critical' | 'Warning' | 'Watch' | 'Safe';
  riskScore: number;
  
  // Geotechnical Slope Parameters
  slopeAngleDeg: number; // beta (°)
  failureDepthM: number; // z (m)
  soilBulkDensityKgM3: number; // rho (kg/m³)
  effectiveCohesionKPa: number; // c' (kPa)
  effectiveFrictionAngleDeg: number; // phi' (°)
  hydraulicConductivityMmH: number; // Ks (mm/h)
  wettingFrontSuctionMm: number; // psi_f (mm)
  residualWaterContent: number; // theta_r (m3/m3)
  saturatedWaterContent: number; // theta_s (m3/m3)

  // Real-Time Sensor Measurements
  porePressureKPa: number; // u (kPa)
  soilMoisturePct: number; // M_t (%)
  rainfallRateMmH: number; // Ri (mm/h)
  rainfallAccumulation1hMm: number;
  rainfallAccumulation6hMm: number;
  rainfallAccumulation24hMm: number; // F (mm)
  rainfallAccumulation72hMm: number;
  displacementRateMmH: number; // mm/h
  displacementTotalMm: number; // mm
  
  // Previous 1-hour interval readings for change rates
  prevPorePressureKPa: number; // u_{t-dt}
  prevSoilMoisturePct: number; // M_{t-dt}

  // MPU6050 3-Axis Accelerometer (m/s²)
  accelX: number;
  accelY: number;
  accelZ: number;
  vibrationRmsMps2: number; // VRMS

  hazardSummary: string;
  lastUpdated: string;
}

export interface ComputedPhysicsResults {
  // 1. Pore-Water Pressure
  poreWaterPressure: {
    uKPa: number; // u in kPa
    uPa: number; // u in Pa
    headHwM: number; // h_w in m
    status: 'critical' | 'warning' | 'watch' | 'safe';
  };
  // 2. Soil Moisture
  soilMoisture: {
    vwcFraction: number; // theta_v in m3/m3
    vwcPct: number;
    status: 'critical' | 'warning' | 'watch' | 'safe';
  };
  // 3. Degree of Saturation
  degreeOfSaturation: {
    sr: number; // 0 to 1
    srPct: number; // 0 to 100%
    thetaR: number;
    thetaS: number;
    status: 'critical' | 'warning' | 'watch' | 'safe';
  };
  // 4. Normal Stress on Slope
  normalStress: {
    sigmaNKPa: number;
    rho: number;
    g: number;
    z: number;
    betaDeg: number;
  };
  // 5. Driving Shear Stress
  drivingShearStress: {
    tauKPa: number;
    rho: number;
    g: number;
    z: number;
    betaDeg: number;
  };
  // 6. Effective Stress
  effectiveStress: {
    sigmaPrimeKPa: number;
    sigmaNKPa: number;
    uKPa: number;
    status: 'critical' | 'warning' | 'watch' | 'safe';
  };
  // 7. Shear Strength (Mohr-Coulomb)
  shearStrength: {
    tauFKPa: number;
    cPrimeKPa: number;
    phiPrimeDeg: number;
    sigmaPrimeKPa: number;
  };
  // 8. Factor of Safety (Infinite Slope Model)
  factorOfSafety: {
    fs: number;
    status: 'critical' | 'warning' | 'watch' | 'safe';
    label: string;
    tauFKPa: number;
    tauKPa: number;
  };
  // 9. Rainfall Infiltration (Green-Ampt Model)
  rainfallInfiltration: {
    fMmH: number;
    ksMmH: number;
    psiFMm: number;
    thetaS: number;
    thetaI: number;
    fMm: number;
    currentRainRateMmH: number;
    runoffGenerated: boolean;
  };
  // 10. Soil Moisture Change Rate
  soilMoistureChangeRate: {
    dMdtPctH: number;
    mt: number;
    mtPrev: number;
    dtH: number;
    trend: 'rapid_increase' | 'slow_increase' | 'steady' | 'decreasing';
  };
  // 11. Pore Pressure Change Rate
  porePressureChangeRate: {
    dudtKPaH: number;
    ut: number;
    utPrev: number;
    dtH: number;
    surgeDetected: boolean;
  };
  // 12. Vibration from MPU6050
  vibration: {
    totalAccelA: number; // m/s2
    vRmsMps2: number;
    ax: number;
    ay: number;
    az: number;
    tremorLevel: 'critical' | 'warning' | 'nominal';
  };
  // 13. Rainfall Accumulation
  rainfallAccumulation: {
    p1h: number;
    p6h: number;
    p24h: number;
    p72h: number;
    riskTier: 'critical' | 'warning' | 'watch' | 'safe';
  };
}

export const SCANNER_LOCATIONS: ScannerSiteGeotechnicalData[] = [
  {
    id: 'scanner-s07-pasighat',
    stationCode: 'S-07',
    name: 'Pasighat Hill Slope Scanner',
    area: 'East Siang Escarpment',
    district: 'East Siang',
    state: 'Arunachal Pradesh',
    lat: 28.0660,
    lng: 95.3260,
    lithology: 'Siang River weathered tertiary sandstone & siltstone flysch',
    riskTier: 'Critical',
    riskScore: 0.89,
    slopeAngleDeg: 42.5,
    failureDepthM: 3.8,
    soilBulkDensityKgM3: 1940,
    effectiveCohesionKPa: 12.0,
    effectiveFrictionAngleDeg: 29.5,
    hydraulicConductivityMmH: 15.2,
    wettingFrontSuctionMm: 125,
    residualWaterContent: 0.07,
    saturatedWaterContent: 0.49,
    porePressureKPa: 58.4,
    soilMoisturePct: 89.5,
    rainfallRateMmH: 72.4,
    rainfallAccumulation1hMm: 68.0,
    rainfallAccumulation6hMm: 112.5,
    rainfallAccumulation24hMm: 184.2,
    rainfallAccumulation72hMm: 312.0,
    displacementRateMmH: 4.8,
    displacementTotalMm: 18.6,
    prevPorePressureKPa: 54.8,
    prevSoilMoisturePct: 84.0,
    accelX: 0.52,
    accelY: 0.68,
    accelZ: 9.98,
    vibrationRmsMps2: 0.64,
    hazardSummary: 'High pore saturation along unstable road cut; active sliding plane detected.',
    lastUpdated: 'Live • 12s ago',
  },
  {
    id: 'scanner-s08-sohra',
    stationCode: 'S-08',
    name: 'Cherrapunji (Sohra) Ridge Scanner',
    area: 'East Khasi Hills Escarpment',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.2986,
    lng: 91.7322,
    lithology: 'Upper Shillong quartzite & limestone karst fractures',
    riskTier: 'Critical',
    riskScore: 0.84,
    slopeAngleDeg: 46.0,
    failureDepthM: 4.2,
    soilBulkDensityKgM3: 2020,
    effectiveCohesionKPa: 15.5,
    effectiveFrictionAngleDeg: 32.0,
    hydraulicConductivityMmH: 22.0,
    wettingFrontSuctionMm: 95,
    residualWaterContent: 0.05,
    saturatedWaterContent: 0.46,
    porePressureKPa: 54.2,
    soilMoisturePct: 93.0,
    rainfallRateMmH: 88.0,
    rainfallAccumulation1hMm: 82.0,
    rainfallAccumulation6hMm: 145.0,
    rainfallAccumulation24hMm: 248.6,
    rainfallAccumulation72hMm: 412.0,
    displacementRateMmH: 3.9,
    displacementTotalMm: 14.2,
    prevPorePressureKPa: 51.0,
    prevSoilMoisturePct: 88.5,
    accelX: 0.45,
    accelY: 0.58,
    accelZ: 9.92,
    vibrationRmsMps2: 0.52,
    hazardSummary: 'Extreme monsoon precipitation corridor; subterranean conduit hydrostatic surcharge.',
    lastUpdated: 'Live • 18s ago',
  },
  {
    id: 'scanner-s09-shillong',
    stationCode: 'S-09',
    name: 'Shillong Peak Escarpment Scanner',
    area: 'Shillong Plateau Corridor',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.5412,
    lng: 91.8622,
    lithology: 'Proterozoic Shillong Group phyllite, schist and hard quartzite',
    riskTier: 'Warning',
    riskScore: 0.68,
    slopeAngleDeg: 36.5,
    failureDepthM: 3.2,
    soilBulkDensityKgM3: 1910,
    effectiveCohesionKPa: 14.0,
    effectiveFrictionAngleDeg: 31.0,
    hydraulicConductivityMmH: 18.0,
    wettingFrontSuctionMm: 110,
    residualWaterContent: 0.06,
    saturatedWaterContent: 0.48,
    porePressureKPa: 44.8,
    soilMoisturePct: 78.0,
    rainfallRateMmH: 55.2,
    rainfallAccumulation1hMm: 48.0,
    rainfallAccumulation6hMm: 86.4,
    rainfallAccumulation24hMm: 142.0,
    rainfallAccumulation72hMm: 220.0,
    displacementRateMmH: 2.1,
    displacementTotalMm: 8.4,
    prevPorePressureKPa: 42.6,
    prevSoilMoisturePct: 74.8,
    accelX: 0.28,
    accelY: 0.32,
    accelZ: 9.87,
    vibrationRmsMps2: 0.34,
    hazardSummary: 'Upper plateau sandstone contact fracture under sustained rainfall seepage.',
    lastUpdated: 'Live • 25s ago',
  },
  {
    id: 'scanner-s01-itanagar',
    stationCode: 'S-01',
    name: 'Itanagar Capital Slope Scanner',
    area: 'Papum Pare Foothills',
    district: 'Papum Pare',
    state: 'Arunachal Pradesh',
    lat: 27.0844,
    lng: 93.6053,
    lithology: 'Siwalik Group sandstone and unconsolidated pebble beds',
    riskTier: 'Warning',
    riskScore: 0.67,
    slopeAngleDeg: 34.0,
    failureDepthM: 2.8,
    soilBulkDensityKgM3: 1880,
    effectiveCohesionKPa: 11.5,
    effectiveFrictionAngleDeg: 28.5,
    hydraulicConductivityMmH: 24.5,
    wettingFrontSuctionMm: 100,
    residualWaterContent: 0.08,
    saturatedWaterContent: 0.50,
    porePressureKPa: 46.1,
    soilMoisturePct: 76.5,
    rainfallRateMmH: 48.0,
    rainfallAccumulation1hMm: 42.0,
    rainfallAccumulation6hMm: 74.0,
    rainfallAccumulation24hMm: 128.0,
    rainfallAccumulation72hMm: 194.0,
    displacementRateMmH: 2.9,
    displacementTotalMm: 9.8,
    prevPorePressureKPa: 43.8,
    prevSoilMoisturePct: 73.0,
    accelX: 0.26,
    accelY: 0.35,
    accelZ: 9.86,
    vibrationRmsMps2: 0.38,
    hazardSummary: 'Road cut along NH-415; high seepage and progressive tension cracks.',
    lastUpdated: 'Live • 40s ago',
  },
  {
    id: 'scanner-s06-haflong',
    stationCode: 'S-06',
    name: 'Haflong Hill Cut Scanner',
    area: 'Dima Hasao Railway Section',
    district: 'Dima Hasao',
    state: 'Assam',
    lat: 25.1800,
    lng: 93.0200,
    lithology: 'Barail and Surma shale-sandstone alternation sequence',
    riskTier: 'Warning',
    riskScore: 0.64,
    slopeAngleDeg: 38.0,
    failureDepthM: 3.5,
    soilBulkDensityKgM3: 1950,
    effectiveCohesionKPa: 13.0,
    effectiveFrictionAngleDeg: 30.0,
    hydraulicConductivityMmH: 14.0,
    wettingFrontSuctionMm: 130,
    residualWaterContent: 0.07,
    saturatedWaterContent: 0.47,
    porePressureKPa: 45.0,
    soilMoisturePct: 79.2,
    rainfallRateMmH: 51.0,
    rainfallAccumulation1hMm: 45.0,
    rainfallAccumulation6hMm: 80.0,
    rainfallAccumulation24hMm: 136.0,
    rainfallAccumulation72hMm: 215.0,
    displacementRateMmH: 2.4,
    displacementTotalMm: 7.6,
    prevPorePressureKPa: 42.9,
    prevSoilMoisturePct: 76.0,
    accelX: 0.31,
    accelY: 0.29,
    accelZ: 9.89,
    vibrationRmsMps2: 0.36,
    hazardSummary: 'Lumding-Badarpur rail hill cutting; saturated shale creep destabilizing toe wall.',
    lastUpdated: 'Live • 55s ago',
  },
  {
    id: 'scanner-s10-kohima',
    stationCode: 'S-10',
    name: 'Kohima Bypass Escarpment Scanner',
    area: 'NH-29 Kohima Corridor',
    district: 'Kohima',
    state: 'Nagaland',
    lat: 25.6751,
    lng: 94.1086,
    lithology: 'Disang Group dark splintery shales with thin sandstone bands',
    riskTier: 'Warning',
    riskScore: 0.62,
    slopeAngleDeg: 35.0,
    failureDepthM: 3.6,
    soilBulkDensityKgM3: 1930,
    effectiveCohesionKPa: 12.5,
    effectiveFrictionAngleDeg: 29.0,
    hydraulicConductivityMmH: 12.8,
    wettingFrontSuctionMm: 140,
    residualWaterContent: 0.08,
    saturatedWaterContent: 0.49,
    porePressureKPa: 43.2,
    soilMoisturePct: 81.0,
    rainfallRateMmH: 44.5,
    rainfallAccumulation1hMm: 38.0,
    rainfallAccumulation6hMm: 68.0,
    rainfallAccumulation24hMm: 118.0,
    rainfallAccumulation72hMm: 186.0,
    displacementRateMmH: 2.2,
    displacementTotalMm: 8.1,
    prevPorePressureKPa: 41.5,
    prevSoilMoisturePct: 78.2,
    accelX: 0.25,
    accelY: 0.30,
    accelZ: 9.86,
    vibrationRmsMps2: 0.32,
    hazardSummary: 'Disang flysch formation; active downhill creeping on road shoulder.',
    lastUpdated: 'Live • 1m ago',
  },
  {
    id: 'scanner-s12-aizawl',
    stationCode: 'S-12',
    name: 'Aizawl Cliff Corridor Scanner',
    area: 'Aizawl Ridge Anticlinal Flank',
    district: 'Aizawl',
    state: 'Mizoram',
    lat: 23.7271,
    lng: 92.7176,
    lithology: 'Bhuban Formation siltstone, mudstone and fine-grained sandstone',
    riskTier: 'Warning',
    riskScore: 0.65,
    slopeAngleDeg: 41.0,
    failureDepthM: 3.4,
    soilBulkDensityKgM3: 1970,
    effectiveCohesionKPa: 13.5,
    effectiveFrictionAngleDeg: 30.5,
    hydraulicConductivityMmH: 16.5,
    wettingFrontSuctionMm: 115,
    residualWaterContent: 0.06,
    saturatedWaterContent: 0.46,
    porePressureKPa: 47.5,
    soilMoisturePct: 82.5,
    rainfallRateMmH: 58.0,
    rainfallAccumulation1hMm: 50.0,
    rainfallAccumulation6hMm: 92.0,
    rainfallAccumulation24hMm: 154.0,
    rainfallAccumulation72hMm: 240.0,
    displacementRateMmH: 2.7,
    displacementTotalMm: 10.4,
    prevPorePressureKPa: 45.0,
    prevSoilMoisturePct: 79.5,
    accelX: 0.33,
    accelY: 0.38,
    accelZ: 9.90,
    vibrationRmsMps2: 0.41,
    hazardSummary: 'Steep anticlinal ridge slopes; urban surface runoff surcharge loading.',
    lastUpdated: 'Live • 1m ago',
  },
  {
    id: 'scanner-node01-guwahati',
    stationCode: 'NER-NODE-01',
    name: 'Guwahati Narakasur Hill Scanner',
    area: 'Guwahati Urban Hills',
    district: 'Kamrup Metro',
    state: 'Assam',
    lat: 26.1445,
    lng: 91.7362,
    lithology: 'Precambrian granitic gneiss basement with thick red soil cover',
    riskTier: 'Warning',
    riskScore: 0.74,
    slopeAngleDeg: 39.0,
    failureDepthM: 3.1,
    soilBulkDensityKgM3: 1890,
    effectiveCohesionKPa: 11.0,
    effectiveFrictionAngleDeg: 28.0,
    hydraulicConductivityMmH: 20.0,
    wettingFrontSuctionMm: 105,
    residualWaterContent: 0.07,
    saturatedWaterContent: 0.48,
    porePressureKPa: 42.8,
    soilMoisturePct: 78.5,
    rainfallRateMmH: 28.5,
    rainfallAccumulation1hMm: 26.0,
    rainfallAccumulation6hMm: 54.0,
    rainfallAccumulation24hMm: 98.0,
    rainfallAccumulation72hMm: 160.0,
    displacementRateMmH: 1.9,
    displacementTotalMm: 6.2,
    prevPorePressureKPa: 40.5,
    prevSoilMoisturePct: 75.0,
    accelX: 0.22,
    accelY: 0.26,
    accelZ: 9.85,
    vibrationRmsMps2: 0.28,
    hazardSummary: 'Colluvial slope above dense residential ward; rapid saturation on cut slopes.',
    lastUpdated: 'Live • 2m ago',
  },
  {
    id: 'scanner-s02-ziro',
    stationCode: 'S-02',
    name: 'Ziro Valley Ridge Scanner',
    area: 'Lower Subansiri Uplands',
    district: 'Lower Subansiri',
    state: 'Arunachal Pradesh',
    lat: 27.5950,
    lng: 93.8385,
    lithology: 'Khetabari Formation mica schists and high-grade gneisses',
    riskTier: 'Safe',
    riskScore: 0.38,
    slopeAngleDeg: 24.0,
    failureDepthM: 2.2,
    soilBulkDensityKgM3: 1850,
    effectiveCohesionKPa: 16.0,
    effectiveFrictionAngleDeg: 33.0,
    hydraulicConductivityMmH: 28.0,
    wettingFrontSuctionMm: 90,
    residualWaterContent: 0.05,
    saturatedWaterContent: 0.45,
    porePressureKPa: 32.1,
    soilMoisturePct: 58.0,
    rainfallRateMmH: 28.5,
    rainfallAccumulation1hMm: 22.0,
    rainfallAccumulation6hMm: 42.0,
    rainfallAccumulation24hMm: 68.0,
    rainfallAccumulation72hMm: 110.0,
    displacementRateMmH: 1.1,
    displacementTotalMm: 3.2,
    prevPorePressureKPa: 31.8,
    prevSoilMoisturePct: 57.5,
    accelX: 0.12,
    accelY: 0.14,
    accelZ: 9.82,
    vibrationRmsMps2: 0.15,
    hazardSummary: 'Metamorphic schists; nominal pore dissipation through wide agrarian terraces.',
    lastUpdated: 'Live • 3m ago',
  },
  {
    id: 'scanner-s03-aalo',
    stationCode: 'S-03',
    name: 'Aalo Gorge Sector Scanner',
    area: 'West Siang Valley',
    district: 'West Siang',
    state: 'Arunachal Pradesh',
    lat: 28.1700,
    lng: 94.8000,
    lithology: 'Gondwana Sequence quartzite and indurated carbonaceous shales',
    riskTier: 'Safe',
    riskScore: 0.29,
    slopeAngleDeg: 22.0,
    failureDepthM: 2.0,
    soilBulkDensityKgM3: 1860,
    effectiveCohesionKPa: 18.0,
    effectiveFrictionAngleDeg: 34.0,
    hydraulicConductivityMmH: 30.0,
    wettingFrontSuctionMm: 85,
    residualWaterContent: 0.05,
    saturatedWaterContent: 0.44,
    porePressureKPa: 24.6,
    soilMoisturePct: 51.0,
    rainfallRateMmH: 18.2,
    rainfallAccumulation1hMm: 15.0,
    rainfallAccumulation6hMm: 32.0,
    rainfallAccumulation24hMm: 52.0,
    rainfallAccumulation72hMm: 84.0,
    displacementRateMmH: 0.7,
    displacementTotalMm: 2.1,
    prevPorePressureKPa: 24.5,
    prevSoilMoisturePct: 50.8,
    accelX: 0.09,
    accelY: 0.11,
    accelZ: 9.81,
    vibrationRmsMps2: 0.11,
    hazardSummary: 'Yomgo river gorge stable; slope drainage culverts fully functional.',
    lastUpdated: 'Live • 4m ago',
  },
  {
    id: 'scanner-s04-guwahati-brahma',
    stationCode: 'S-04',
    name: 'Guwahati Brahmaputra Sector Scanner',
    area: 'Brahmaputra South Bank',
    district: 'Kamrup Metro',
    state: 'Assam',
    lat: 26.1445,
    lng: 91.7362,
    lithology: 'Alluvial terrace deposits over granite pegmatite',
    riskTier: 'Safe',
    riskScore: 0.25,
    slopeAngleDeg: 18.0,
    failureDepthM: 1.8,
    soilBulkDensityKgM3: 1840,
    effectiveCohesionKPa: 17.5,
    effectiveFrictionAngleDeg: 32.5,
    hydraulicConductivityMmH: 32.0,
    wettingFrontSuctionMm: 80,
    residualWaterContent: 0.05,
    saturatedWaterContent: 0.45,
    porePressureKPa: 22.0,
    soilMoisturePct: 48.0,
    rainfallRateMmH: 15.0,
    rainfallAccumulation1hMm: 12.0,
    rainfallAccumulation6hMm: 26.0,
    rainfallAccumulation24hMm: 44.0,
    rainfallAccumulation72hMm: 72.0,
    displacementRateMmH: 0.6,
    displacementTotalMm: 1.8,
    prevPorePressureKPa: 22.0,
    prevSoilMoisturePct: 47.9,
    accelX: 0.08,
    accelY: 0.09,
    accelZ: 9.81,
    vibrationRmsMps2: 0.10,
    hazardSummary: 'Stable piedmont alluvial terrace; drainage channels clear.',
    lastUpdated: 'Live • 5m ago',
  },
  {
    id: 'scanner-s05-roing',
    stationCode: 'S-05',
    name: 'Roing Siang Basin Scanner',
    area: 'Lower Dibang Valley Basin',
    district: 'Lower Dibang Valley',
    state: 'Arunachal Pradesh',
    lat: 28.1408,
    lng: 95.8360,
    lithology: 'Quaternary boulder gravel and fluvial sand terraces',
    riskTier: 'Safe',
    riskScore: 0.32,
    slopeAngleDeg: 20.0,
    failureDepthM: 2.1,
    soilBulkDensityKgM3: 1870,
    effectiveCohesionKPa: 16.5,
    effectiveFrictionAngleDeg: 33.0,
    hydraulicConductivityMmH: 35.0,
    wettingFrontSuctionMm: 75,
    residualWaterContent: 0.04,
    saturatedWaterContent: 0.43,
    porePressureKPa: 28.0,
    soilMoisturePct: 52.0,
    rainfallRateMmH: 22.0,
    rainfallAccumulation1hMm: 18.0,
    rainfallAccumulation6hMm: 38.0,
    rainfallAccumulation24hMm: 62.0,
    rainfallAccumulation72hMm: 96.0,
    displacementRateMmH: 0.8,
    displacementTotalMm: 2.4,
    prevPorePressureKPa: 27.8,
    prevSoilMoisturePct: 51.7,
    accelX: 0.10,
    accelY: 0.12,
    accelZ: 9.82,
    vibrationRmsMps2: 0.13,
    hazardSummary: 'Dibang river alluvial plain; minimal slope inclination and rapid drainage.',
    lastUpdated: 'Live • 6m ago',
  },
  {
    id: 'scanner-s11-imphal',
    stationCode: 'S-11',
    name: 'Imphal Valley Approach Scanner',
    area: 'Imphal Basin Perimeter',
    district: 'Imphal West',
    state: 'Manipur',
    lat: 24.8170,
    lng: 93.9368,
    lithology: 'Lacustrine clays, silt and shale margin deposits',
    riskTier: 'Safe',
    riskScore: 0.35,
    slopeAngleDeg: 21.0,
    failureDepthM: 2.3,
    soilBulkDensityKgM3: 1860,
    effectiveCohesionKPa: 15.0,
    effectiveFrictionAngleDeg: 31.0,
    hydraulicConductivityMmH: 21.0,
    wettingFrontSuctionMm: 95,
    residualWaterContent: 0.06,
    saturatedWaterContent: 0.47,
    porePressureKPa: 29.0,
    soilMoisturePct: 56.0,
    rainfallRateMmH: 24.0,
    rainfallAccumulation1hMm: 20.0,
    rainfallAccumulation6hMm: 42.0,
    rainfallAccumulation24hMm: 70.0,
    rainfallAccumulation72hMm: 108.0,
    displacementRateMmH: 0.9,
    displacementTotalMm: 2.6,
    prevPorePressureKPa: 28.8,
    prevSoilMoisturePct: 55.7,
    accelX: 0.11,
    accelY: 0.13,
    accelZ: 9.82,
    vibrationRmsMps2: 0.14,
    hazardSummary: 'Intermontane basin perimeter; stable baseline inclinometer readings.',
    lastUpdated: 'Live • 6m ago',
  }
];

/**
 * Executes all 13 Geotechnical Physics Formulas for a chosen scanner site
 */
export function computeGeotechnicalPhysics(site: ScannerSiteGeotechnicalData): ComputedPhysicsResults {
  const g = 9.81; // m/s²
  const rhoW = 1000; // density of water (kg/m³)
  const betaRad = (site.slopeAngleDeg * Math.PI) / 180;
  const phiRad = (site.effectiveFrictionAngleDeg * Math.PI) / 180;
  const cosBeta = Math.cos(betaRad);
  const sinBeta = Math.sin(betaRad);

  // 1. Pore-Water Pressure: u = rho_w * g * h_w
  // h_w = u / (rho_w * g)
  const uPa = site.porePressureKPa * 1000;
  const headHwM = Number((uPa / (rhoW * g)).toFixed(2));
  const uStatus: 'critical' | 'warning' | 'watch' | 'safe' = 
    headHwM >= 5.0 ? 'critical' : headHwM >= 3.8 ? 'warning' : headHwM >= 2.5 ? 'watch' : 'safe';

  // 2. Soil Moisture (Volumetric Water Content): theta_v = V_w / V_t
  const vwcFraction = Number((site.soilMoisturePct / 100).toFixed(3));
  const vwcStatus: 'critical' | 'warning' | 'watch' | 'safe' =
    site.soilMoisturePct >= 88 ? 'critical' : site.soilMoisturePct >= 75 ? 'warning' : site.soilMoisturePct >= 60 ? 'watch' : 'safe';

  // 3. Degree of Saturation: S_r = (theta_v - theta_r) / (theta_s - theta_r)
  // Scaling sensor moisture to effective saturation range
  const thetaActual = site.residualWaterContent + vwcFraction * (site.saturatedWaterContent - site.residualWaterContent);
  const rawSr = (thetaActual - site.residualWaterContent) / (site.saturatedWaterContent - site.residualWaterContent);
  const sr = Number(Math.max(0, Math.min(1.0, rawSr)).toFixed(3));
  const srPct = Number((sr * 100).toFixed(1));
  const srStatus: 'critical' | 'warning' | 'watch' | 'safe' =
    srPct >= 85 ? 'critical' : srPct >= 70 ? 'warning' : srPct >= 50 ? 'watch' : 'safe';

  // 4. Normal Stress on Slope: sigma_n = rho * g * z * cos^2(beta) [in kPa]
  const sigmaNPa = site.soilBulkDensityKgM3 * g * site.failureDepthM * (cosBeta * cosBeta);
  const sigmaNKPa = Number((sigmaNPa / 1000).toFixed(2));

  // 5. Driving Shear Stress: tau = rho * g * z * sin(beta) * cos(beta) [in kPa]
  const tauPa = site.soilBulkDensityKgM3 * g * site.failureDepthM * sinBeta * cosBeta;
  const tauKPa = Number((tauPa / 1000).toFixed(2));

  // 6. Effective Stress: sigma' = sigma_n - u [in kPa]
  const sigmaPrimeKPa = Number((sigmaNKPa - site.porePressureKPa).toFixed(2));
  const sigmaPrimeStatus: 'critical' | 'warning' | 'watch' | 'safe' =
    sigmaPrimeKPa <= 5.0 ? 'critical' : sigmaPrimeKPa <= 12.0 ? 'warning' : sigmaPrimeKPa <= 20.0 ? 'watch' : 'safe';

  // 7. Shear Strength (Mohr-Coulomb): tau_f = c' + sigma' * tan(phi') [in kPa]
  const tanPhi = Math.tan(phiRad);
  const effectiveFrictionComponent = Math.max(0, sigmaPrimeKPa) * tanPhi;
  const tauFKPa = Number((site.effectiveCohesionKPa + effectiveFrictionComponent).toFixed(2));

  // 8. Factor of Safety (Infinite Slope Model): FS = tau_f / tau
  const rawFs = tauFKPa / Math.max(0.1, tauKPa);
  const fs = Number(rawFs.toFixed(2));
  const fsStatus: 'critical' | 'warning' | 'watch' | 'safe' =
    fs < 1.0 ? 'critical' : fs < 1.3 ? 'warning' : fs < 1.5 ? 'watch' : 'safe';
  const fsLabel = 
    fs < 1.0 ? 'CRITICAL (Slope Failure Active)' :
    fs < 1.3 ? 'HIGH RISK (Threshold Breached)' :
    fs < 1.5 ? 'MODERATE (Heightened Watch)' : 'STABLE (Slope Equilibrium Safe)';

  // 9. Rainfall Infiltration (Green-Ampt Model): f = K_s * (1 + psi_f * (theta_s - theta_i) / F)
  const cumulativeInfiltrationF = Math.max(10.0, site.rainfallAccumulation24hMm);
  const moistureDeficit = Math.max(0.01, site.saturatedWaterContent - (site.residualWaterContent + vwcFraction * (site.saturatedWaterContent - site.residualWaterContent)));
  const fMmH = Number((site.hydraulicConductivityMmH * (1 + (site.wettingFrontSuctionMm * moistureDeficit) / cumulativeInfiltrationF)).toFixed(2));
  const runoffGenerated = site.rainfallRateMmH > fMmH;

  // 10. Soil Moisture Change Rate: dM/dt = (M_t - M_{t-dt}) / dt
  const dtH = 1.0;
  const dMdtPctH = Number(((site.soilMoisturePct - site.prevSoilMoisturePct) / dtH).toFixed(2));
  const moistureTrend: 'rapid_increase' | 'slow_increase' | 'steady' | 'decreasing' =
    dMdtPctH >= 3.0 ? 'rapid_increase' : dMdtPctH >= 1.0 ? 'slow_increase' : dMdtPctH >= -0.5 ? 'steady' : 'decreasing';

  // 11. Pore Pressure Change Rate: du/dt = (u_t - u_{t-dt}) / dt
  const dudtKPaH = Number(((site.porePressureKPa - site.prevPorePressureKPa) / dtH).toFixed(2));
  const surgeDetected = dudtKPaH >= 2.0;

  // 12. Vibration from MPU6050: a = sqrt(ax^2 + ay^2 + az^2), V_RMS
  const rawA = Math.sqrt(site.accelX * site.accelX + site.accelY * site.accelY + site.accelZ * site.accelZ);
  const totalAccelA = Number(rawA.toFixed(2));
  const tremorLevel: 'critical' | 'warning' | 'nominal' =
    site.vibrationRmsMps2 >= 0.5 ? 'critical' : site.vibrationRmsMps2 >= 0.3 ? 'warning' : 'nominal';

  // 13. Rainfall Accumulation: P_T = sum(Ri * dt)
  const rainRiskTier: 'critical' | 'warning' | 'watch' | 'safe' =
    site.rainfallAccumulation24hMm >= 180 ? 'critical' :
    site.rainfallAccumulation24hMm >= 120 ? 'warning' :
    site.rainfallAccumulation24hMm >= 70 ? 'watch' : 'safe';

  return {
    poreWaterPressure: {
      uKPa: site.porePressureKPa,
      uPa,
      headHwM,
      status: uStatus,
    },
    soilMoisture: {
      vwcFraction,
      vwcPct: site.soilMoisturePct,
      status: vwcStatus,
    },
    degreeOfSaturation: {
      sr,
      srPct,
      thetaR: site.residualWaterContent,
      thetaS: site.saturatedWaterContent,
      status: srStatus,
    },
    normalStress: {
      sigmaNKPa,
      rho: site.soilBulkDensityKgM3,
      g,
      z: site.failureDepthM,
      betaDeg: site.slopeAngleDeg,
    },
    drivingShearStress: {
      tauKPa,
      rho: site.soilBulkDensityKgM3,
      g,
      z: site.failureDepthM,
      betaDeg: site.slopeAngleDeg,
    },
    effectiveStress: {
      sigmaPrimeKPa,
      sigmaNKPa,
      uKPa: site.porePressureKPa,
      status: sigmaPrimeStatus,
    },
    shearStrength: {
      tauFKPa,
      cPrimeKPa: site.effectiveCohesionKPa,
      phiPrimeDeg: site.effectiveFrictionAngleDeg,
      sigmaPrimeKPa,
    },
    factorOfSafety: {
      fs,
      status: fsStatus,
      label: fsLabel,
      tauFKPa,
      tauKPa,
    },
    rainfallInfiltration: {
      fMmH,
      ksMmH: site.hydraulicConductivityMmH,
      psiFMm: site.wettingFrontSuctionMm,
      thetaS: site.saturatedWaterContent,
      thetaI: Number(vwcFraction.toFixed(2)),
      fMm: cumulativeInfiltrationF,
      currentRainRateMmH: site.rainfallRateMmH,
      runoffGenerated,
    },
    soilMoistureChangeRate: {
      dMdtPctH,
      mt: site.soilMoisturePct,
      mtPrev: site.prevSoilMoisturePct,
      dtH,
      trend: moistureTrend,
    },
    porePressureChangeRate: {
      dudtKPaH,
      ut: site.porePressureKPa,
      utPrev: site.prevPorePressureKPa,
      dtH,
      surgeDetected,
    },
    vibration: {
      totalAccelA,
      vRmsMps2: site.vibrationRmsMps2,
      ax: site.accelX,
      ay: site.accelY,
      az: site.accelZ,
      tremorLevel,
    },
    rainfallAccumulation: {
      p1h: site.rainfallAccumulation1hMm,
      p6h: site.rainfallAccumulation6hMm,
      p24h: site.rainfallAccumulation24hMm,
      p72h: site.rainfallAccumulation72hMm,
      riskTier: rainRiskTier,
    },
  };
}
