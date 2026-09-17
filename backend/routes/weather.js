import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Simple in-memory cache
let weatherCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

router.get('/current', async (req, res) => {
    const now = Date.now();
    
    // Serve from cache if valid
    if (weatherCache && (now - lastFetchTime < CACHE_TTL)) {
        return res.json({ success: true, data: weatherCache });
    }

    try {
        // Fetch weather for Northern Manipur (Senapati area roughly) coordinates: 25.267, 94.022
        // Using Open-Meteo (no API key required)
        const weatherRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=25.267&longitude=94.022&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,surface_pressure,visibility&timezone=auto');
        const weatherJson = await weatherRes.json();
        
        const aqRes = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=25.267&longitude=94.022&current=pm2_5,uv_index,us_aqi&timezone=auto');
        const aqJson = await aqRes.json();

        if (weatherJson.current && aqJson.current) {
            const compiledData = {
                provider: "Open-Meteo (Northern Manipur)",
                latency: "live",
                dataFreshness: "100%",
                sensors: {
                    temperature: { value: weatherJson.current.temperature_2m, unit: '°C' },
                    humidity:    { value: weatherJson.current.relative_humidity_2m, unit: '%' },
                    aqi:         { value: aqJson.current.us_aqi, unit: 'AQI' },
                    pm25:        { value: aqJson.current.pm2_5, unit: 'µg/m³' },
                    rainfall:    { value: weatherJson.current.precipitation, unit: 'mm/h' },
                    windSpeed:   { value: weatherJson.current.wind_speed_10m, unit: 'km/h' },
                    windDirection: weatherJson.current.wind_direction_10m, // numeric for frontend logic
                    pressure:    { value: weatherJson.current.surface_pressure, unit: 'hPa' },
                    visibility:  { value: parseFloat((weatherJson.current.visibility / 1000).toFixed(1)), unit: 'km' },
                    uvIndex:     { value: aqJson.current.uv_index, unit: 'Index' },
                }
            };
            
            weatherCache = compiledData;
            lastFetchTime = now;
            
            return res.json({ success: true, data: compiledData });
        }
        
        throw new Error("Invalid response structure from Open-Meteo");
    } catch (err) {
        console.error("Weather proxy failed:", err.message);
        // If cache exists but is stale, serve it as fallback rather than failing
        if (weatherCache) {
            return res.json({ success: true, data: weatherCache, warning: "Served from stale cache" });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

// Endpoint for wind layer (queries specific lat/lng)
router.get('/wind', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ success: false, error: "Missing lat/lng" });

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m&timezone=auto`);
        const weatherJson = await weatherRes.json();
        
        if (weatherJson.current) {
            return res.json({
                success: true,
                data: {
                    windSpeed: weatherJson.current.wind_speed_10m,
                    windDirection: weatherJson.current.wind_direction_10m
                }
            });
        } else {
            console.error("Open-Meteo API Error:", weatherJson);
            throw new Error("Failed to fetch wind data");
        }
    } catch (err) {
        console.error("Wind fetch failed:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
