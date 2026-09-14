/**
 * Dynamic Risk Calculation Engine
 * Calculates overall, landslide, flood, and air quality risk scores (0-100)
 * based on live sensor readings from Node 1, Node 2, API Data, and editable thresholds.
 */

export const calculateRisk = (nodes, apiData, thresholds) => {
  const node1 = nodes.find((n) => n.id === "node-1") || nodes[0];
  const node2 = nodes.find((n) => n.id === "node-2") || nodes[1];

  const soil = node1?.sensors?.soilMoisture?.value ?? 70;
  const rain1 = node1?.sensors?.rainfall?.value ?? 30;
  const waterLevel = node2?.sensors?.waterLevel?.value ?? 1.5;
  const pm25 = node2?.sensors?.pm25?.value ?? 60;
  const apiRain = apiData?.sensors?.rainfall?.value ?? 3.4;
  const apiAqi = apiData?.sensors?.aqi?.value ?? 75;

  const sw420 = node2?.telemetry?.sw420 ?? 0;
  const ultrasonicDistanceCm = node2?.telemetry?.ultrasonicDistanceCm;
  const ultrasonicDistanceCm2 = node2?.telemetry?.ultrasonicDistanceCm2;
  const waterRiseRateCm = node2?.telemetry?.waterRiseRateCm ?? 0;
  const ultrasonicRising = waterRiseRateCm > 0;

  // Retrieve threshold settings
  const soilThresh = thresholds?.soilMoisture || 70;
  const rainThresh = thresholds?.rainfall || 40;
  const waterThresh = thresholds?.waterLevel || 2.0;
  const pm25Thresh = thresholds?.pm25 || 60;

  // Calculate component scores
  // Landslide Risk formula: weighted combination of Soil Moisture & Rainfall
  const soilRatio = Math.min(1.3, soil / soilThresh);
  const rainRatio = Math.min(1.3, rain1 / rainThresh);
  const baseLandslideScore = Math.min(99, Math.round((soilRatio * 55 + rainRatio * 45) * 0.75));

  // Flood Risk formula: River Water level ratio & regional API rainfall
  const waterRatio = Math.min(1.3, waterLevel / waterThresh);
  const apiRainRatio = Math.min(1.3, apiRain / 20);
  const baseFloodScore = Math.min(99, Math.round((waterRatio * 65 + apiRainRatio * 35) * 0.7));

  // Air Quality Risk formula: PM2.5 ratio & regional AQI
  const pm25Ratio = Math.min(1.3, pm25 / pm25Thresh);
  const aqiRatio = Math.min(1.3, apiAqi / 100);
  const baseAirQualityScore = Math.min(99, Math.round((pm25Ratio * 60 + aqiRatio * 40) * 0.65));

  const events = {
    landslide: {
      active: (node2?.sensors?.soilMoisture?.value ?? 0) >= 70 && sw420 === 1 && waterRiseRateCm >= 2 && ultrasonicDistanceCm <= 35,
      title: "Landslide Event",
      details: `Soil ${node2?.sensors?.soilMoisture?.value ?? "--"}% | SW-420 ${sw420} | Water rise ${waterRiseRateCm} cm/s | Ultrasonic ${ultrasonicDistanceCm ?? "--"} cm`,
    },
    flood: {
      active: typeof ultrasonicDistanceCm === "number" && ultrasonicDistanceCm <= 35,
      title: "Flood Alert",
      details: `Distance (waterlevel1): ${ultrasonicDistanceCm ?? "--"} cm`,
    },
    airQuality: {
      active: pm25 >= 20 && pm25 <= 25,
      title: "Air Quality Event",
      details: `Air quality value ${pm25} (target range 20-25)`,
    },
    highSoilMoisture: {
      active: (node2?.sensors?.soilMoisture?.value ?? 0) > 70,
      title: "Critical Soil Moisture",
      details: `Soil moisture reached critical level: ${node2?.sensors?.soilMoisture?.value ?? "--"}%`,
    },
    rainAlert: {
      active: waterRiseRateCm >= 2,
      title: "Rain Alert",
      details: `Ultrasonic sensor (2) decrease rate: ${waterRiseRateCm} cm/s`,
    },
  };

  const landslideScore = events.landslide.active 
    ? Math.max(90, baseLandslideScore) 
    : events.highSoilMoisture.active 
      ? Math.max(85, baseLandslideScore) 
      : baseLandslideScore;
      
  const floodScore = events.flood.active 
    ? Math.max(85, baseFloodScore) 
    : events.rainAlert.active
      ? Math.max(79, baseFloodScore)
      : baseFloodScore;

  const airQualityScore = events.airQuality.active ? Math.max(60, baseAirQualityScore) : baseAirQualityScore;

  // Combined Overall Risk score (base average)
  let overallScore = Math.round(landslideScore * 0.45 + floodScore * 0.35 + airQualityScore * 0.2);

  // If any physical event is actively triggered, the overall score should escalate to match
  if (events.landslide.active || events.flood.active || events.airQuality.active || events.highSoilMoisture.active || events.rainAlert.active) {
    overallScore = Math.max(overallScore, landslideScore, floodScore, airQualityScore);
  }

  overallScore = Math.min(99, overallScore);

  return {
    overallScore,
    landslideScore,
    floodScore,
    airQualityScore,
    overallLevel: getRiskLevel(overallScore),
    landslideLevel: getRiskLevel(landslideScore),
    floodLevel: getRiskLevel(floodScore),
    airQualityLevel: getRiskLevel(airQualityScore),
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
