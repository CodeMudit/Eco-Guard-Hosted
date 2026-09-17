/**
 * Dynamic Risk Calculation Engine
 * Calculates overall, landslide, flood, and air quality risk scores (0-100)
 * based on live sensor readings from Node 1, Node 2, API Data, and editable thresholds.
 *
 * CRITICAL trigger conditions (any one is sufficient):
 *   • soilMoisture >= 80 %
 *   • waterLevel   >= 1 m
 *   • decreaseRate >= 2 cm/s  (waterRiseRateCm)
 * When ANY condition is met → that sub-score escalates to ≥ 85 and overall ≥ 85 (CRITICAL).
 * When ALL three conditions are met simultaneously → scores escalate to ≥ 92 (deep CRITICAL).
 */

export const calculateRisk = (nodes, apiData, thresholds, reports = []) => {
  const node1 = nodes.find((n) => n.id === "node-1") || nodes[0];
  const node2 = nodes.find((n) => n.id === "node-2") || nodes[1];

  // ── Raw sensor values ──────────────────────────────────────────────────────
  const soil      = node1?.sensors?.soilMoisture?.value ?? 70;
  const rain1     = node1?.sensors?.rainfall?.value     ?? 30;
  const waterLevel= node2?.sensors?.waterLevel?.value   ?? 0;
  const pm25      = node2?.sensors?.pm25?.value         ?? 60;
  const apiRain   = apiData?.sensors?.rainfall?.value   ?? 3.4;
  const apiAqi    = apiData?.sensors?.aqi?.value        ?? 75;

  // ── Hardware telemetry from Node 2 ────────────────────────────────────────
  const sw420               = node2?.telemetry?.sw420                ?? 0;
  const ultrasonicDistanceCm= node2?.telemetry?.ultrasonicDistanceCm;
  const ultrasonicDistanceCm2= node2?.telemetry?.ultrasonicDistanceCm2;
  const waterRiseRateCm     = node2?.telemetry?.waterRiseRateCm      ?? 0;

  // ── User-defined thresholds ───────────────────────────────────────────────
  const soilThresh  = thresholds?.soilMoisture || 70;
  const rainThresh  = thresholds?.rainfall     || 40;
  const waterThresh = thresholds?.waterLevel   || 2.0;
  const pm25Thresh  = thresholds?.pm25         || 60;

  // ── CRITICAL hardware trigger flags (per spec) ────────────────────────────
  const critSoil      = soil >= 80;                   // soilMoisture ≥ 80 %
  const critWater     = waterLevel >= 1;              // waterLevel ≥ 1 m
  const critDecRate   = waterRiseRateCm >= 2;         // decreaseRate ≥ 2 cm/s
  const anyCritical   = critSoil || critWater || critDecRate;
  const allCritical   = critSoil && critWater && critDecRate;

  // ── Base score formulas ───────────────────────────────────────────────────
  const soilRatio     = Math.min(1.3, soil / soilThresh);
  const rainRatio     = Math.min(1.3, rain1 / rainThresh);
  const baseLandslide = Math.min(99, Math.round((soilRatio * 55 + rainRatio * 45) * 0.75));

  const waterRatio    = Math.min(1.3, waterLevel / waterThresh);
  const apiRainRatio  = Math.min(1.3, apiRain / 20);
  const baseFlood     = Math.min(99, Math.round((waterRatio * 65 + apiRainRatio * 35) * 0.7));

  const pm25Ratio     = Math.min(1.3, pm25 / pm25Thresh);
  const aqiRatio      = Math.min(1.3, apiAqi / 100);
  const baseAirQuality= Math.min(99, Math.round((pm25Ratio * 60 + aqiRatio * 40) * 0.65));

  // ── Event flags ──────────────────────────────────────────────────────────
  const events = {
    // Full compound landslide event (soil + vibration + water + rate)
    landslide: {
      active: (node2?.sensors?.soilMoisture?.value ?? 0) >= 70
               && sw420 === 1
               && waterRiseRateCm >= 2
               && typeof ultrasonicDistanceCm === "number"
               && ultrasonicDistanceCm <= 35,
      title: "Landslide Event",
      details: `Soil ${node2?.sensors?.soilMoisture?.value ?? "--"}% | SW-420 ${sw420} | Decrease rate ${waterRiseRateCm} cm/s | Ultrasonic ${ultrasonicDistanceCm ?? "--"} cm`,
    },
    // Flood: water level ≥ 1 m OR ultrasonic distance ≤ 35 cm
    flood: {
      active: critWater || (typeof ultrasonicDistanceCm === "number" && ultrasonicDistanceCm <= 35),
      title: "Flood Alert",
      details: `Water level ${waterLevel} m | Distance (sensor1): ${ultrasonicDistanceCm ?? "--"} cm | Decrease rate ${waterRiseRateCm} cm/s`,
    },
    airQuality: {
      active: pm25 >= 20 && pm25 <= 25,
      title: "Air Quality Event",
      details: `Air quality value ${pm25} (target range 20–25)`,
    },
    // Soil moisture ≥ 80 % → critical soil event
    highSoilMoisture: {
      active: critSoil,
      title: "Critical Soil Moisture",
      details: `Soil moisture ${soil}% ≥ 80% threshold`,
    },
    // Decrease rate ≥ 2 cm/s → rain / water-rise alert
    rainAlert: {
      active: critDecRate,
      title: "Rain / Water-Rise Alert",
      details: `Ultrasonic decrease rate: ${waterRiseRateCm} cm/s ≥ 2 cm/s threshold`,
    },
  };

  // ── Score escalation ──────────────────────────────────────────────────────
  // Each critical trigger independently floors the relevant sub-score at 85.
  // All three combined floors at 92.
  const critFloor = allCritical ? 92 : 85;

  let landslideScore = baseLandslide;
  if (events.landslide.active)        landslideScore = Math.max(92, landslideScore);
  else if (critSoil && critDecRate)   landslideScore = Math.max(critFloor, landslideScore);
  else if (critSoil)                  landslideScore = Math.max(85, landslideScore);

  let floodScore = baseFlood;
  if (events.flood.active)            floodScore = Math.max(critFloor, floodScore);
  else if (critDecRate)               floodScore = Math.max(85, floodScore);

  let airQualityScore = events.airQuality.active
    ? Math.max(60, baseAirQuality)
    : baseAirQuality;

  // ── Overall score ─────────────────────────────────────────────────────────
  let overallScore = Math.round(landslideScore * 0.45 + floodScore * 0.35 + airQualityScore * 0.2);

  // Any active critical hardware condition forces overall ≥ 85 (CRITICAL band)
  if (anyCritical || events.landslide.active || events.flood.active) {
    overallScore = Math.max(overallScore, landslideScore, floodScore, airQualityScore);
    overallScore = Math.max(overallScore, critFloor);
  }

  // ── Field Report Modifier ────────────────────────────────────────────────
  // Bump risk based on verified field reports
  const recentCriticalReports = reports.filter(r => r.status === 'Resolved' && (r.severity === 'HIGH' || r.severity === 'CRITICAL')).length;
  if (recentCriticalReports > 0) {
     const reportRiskBump = Math.min(15, recentCriticalReports * 5);
     overallScore += reportRiskBump;
     landslideScore += reportRiskBump;
  }

  overallScore = Math.min(99, overallScore);
  landslideScore = Math.min(99, landslideScore);
  floodScore = Math.min(99, floodScore);
  airQualityScore = Math.min(99, airQualityScore);

  return {
    overallScore,
    landslideScore,
    floodScore,
    airQualityScore,
    overallLevel:    getRiskLevel(overallScore),
    landslideLevel:  getRiskLevel(landslideScore),
    floodLevel:      getRiskLevel(floodScore),
    airQualityLevel: getRiskLevel(airQualityScore),
    // expose trigger flags so MLPredictionCenter can compute live confidence
    critSoil,
    critWater,
    critDecRate,
    anyCritical,
    allCritical,
    events,
  };
};

export const getRiskLevel = (score) => {
  if (score >= 79) return "CRITICAL";
  if (score >= 65) return "HIGH";
  if (score >= 45) return "MODERATE";
  return "LOW";
};

export const getRiskColor = (level) => {
  switch (level) {
    case "CRITICAL":
      return { bg: "bg-red-500/20", border: "border-red-500/50", text: "text-red-400", badge: "bg-red-500 text-white" };
    case "HIGH":
      return { bg: "bg-orange-500/20", border: "border-orange-500/50", text: "text-orange-400", badge: "bg-orange-500 text-white" };
    case "MODERATE":
      return { bg: "bg-amber-500/20", border: "border-amber-500/50", text: "text-amber-400", badge: "bg-amber-500 text-slate-950 font-bold" };
    case "LOW":
    default:
      return { bg: "bg-emerald-500/20", border: "border-emerald-500/50", text: "text-emerald-400", badge: "bg-emerald-500 text-white" };
  }
};
