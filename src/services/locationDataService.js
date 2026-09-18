// src/services/locationDataService.js
// Adapter pattern for fetching location-specific intelligence.
// Abstracts Open-Meteo and internal Risk Fusion Engine.

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache
const locationCache = new Map();

/**
 * Fetches comprehensive environmental data for a given lat/lng.
 */
export const fetchLocationIntelligence = async (lat, lng) => {
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    
    if (locationCache.has(cacheKey)) {
        const cached = locationCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_DURATION_MS) {
            return { ...cached.data, status: 'CACHED', cacheTime: cached.timestamp };
        }
    }

    try {
        // Fetch from Open-Meteo
        const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,visibility&hourly=precipitation,soil_moisture_3_to_9cm&forecast_days=3&past_days=3`;
        
        const response = await fetch(meteoUrl);
        const data = await response.json();

        if (!data || !data.current) throw new Error("Invalid Meteo response");

        // Parse current data
        const current = data.current;
        const hourly = data.hourly;
        
        // Find current index in hourly array
        const now = new Date();
        const currentHourIso = now.toISOString().substring(0, 14) + "00";
        const hIndex = hourly.time.findIndex(t => t.startsWith(currentHourIso)) || hourly.time.length - 72;
        const validIndex = hIndex >= 0 ? hIndex : hourly.time.length - 72;

        // Calculate accumulations (safe fallback if index missing)
        const rain6h = hourly.precipitation.slice(Math.max(0, validIndex - 6), validIndex).reduce((a, b) => a + (b || 0), 0);
        const rain24h = hourly.precipitation.slice(Math.max(0, validIndex - 24), validIndex).reduce((a, b) => a + (b || 0), 0);
        const rain72h = hourly.precipitation.slice(Math.max(0, validIndex - 72), validIndex).reduce((a, b) => a + (b || 0), 0);

        const currentSoilMoisture = hourly.soil_moisture_3_to_9cm[validIndex] || 0.3; // fallback if missing

        const intelligenceData = {
            weather: {
                temperature: { value: current.temperature_2m, unit: '°C' },
                humidity: { value: current.relative_humidity_2m, unit: '%' },
                precipitation: { value: current.precipitation, unit: 'mm' },
                windSpeed: { value: current.wind_speed_10m, unit: 'km/h' },
                windDirection: { value: current.wind_direction_10m, unit: '°' },
                windGust: { value: current.wind_gusts_10m, unit: 'km/h' },
                surfacePressure: { value: current.surface_pressure, unit: 'hPa' },
                visibility: { value: current.visibility, unit: 'm' }
            },
            hydrology: {
                soilMoisture: { value: (currentSoilMoisture * 100).toFixed(1), unit: '%' },
                rain6h: { value: rain6h.toFixed(1), unit: 'mm' },
                rain24h: { value: rain24h.toFixed(1), unit: 'mm' },
                rain72h: { value: rain72h.toFixed(1), unit: 'mm' }
            },
            status: 'LIVE',
            source: 'Open-Meteo',
            timestamp: Date.now()
        };

        // Cache the result
        locationCache.set(cacheKey, { timestamp: Date.now(), data: intelligenceData });
        
        return intelligenceData;
    } catch (error) {
        console.warn("Failed to fetch location data:", error);
        // If API fails, check for stale cache to serve as fallback
        if (locationCache.has(cacheKey)) {
            return { ...locationCache.get(cacheKey).data, status: 'STALE CACHE' };
        }
        // Total failure fallback (mock structure so UI doesn't crash)
        return {
            weather: null,
            hydrology: null,
            status: 'ERROR',
            source: 'Open-Meteo',
            timestamp: Date.now()
        };
    }
};
