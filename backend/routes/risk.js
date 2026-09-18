import express from 'express';
import { calculateRisk } from '../../src/utils/riskCalculator.js';

const router = express.Router();

router.post('/score', (req, res) => {
    try {
        const { nodes, apiData, thresholds, reports } = req.body;
        
        if (!nodes || !apiData || !thresholds) {
            return res.status(400).json({ success: false, error: "Missing required payload data" });
        }
        
        const computedRisk = calculateRisk(nodes, apiData, thresholds, reports || []);
        res.json({ success: true, data: computedRisk });
    } catch (err) {
        console.error("Risk score calc failed server-side:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ML Interface for Risk Fusion Engine (Sprint 4)
// Ready to be swapped with XGBoost/RandomForest in future
router.post('/predict', (req, res) => {
    try {
        const { 
            latitude, longitude, 
            rainfall, rainfall24h, rainfall72h, 
            soilMoisture, elevation, 
            terrainRisk, historicalFrequency, 
            roadExposure, sensorRisk 
        } = req.body;
        
        // Normalize Rainfall (0-100) - Cap at 150mm for max risk
        const rainScore = Math.min(100, ((rainfall24h || 0) / 150) * 100);
        
        // Normalize Soil Moisture (0-100) - Cap at 80% for max risk
        const soilScore = Math.min(100, ((soilMoisture || 30) / 80) * 100);

        // Calculate scores from provided metrics or defaults
        const tScore = terrainRisk || 50;
        const hScore = historicalFrequency || 30;
        const iScore = roadExposure || 50;

        // Apply Sprint 4 Fusion Weights
        // Rainfall 35%, Soil Moisture 25%, Terrain/Slope 20%, Historical 12%, Infrastructure 8%
        const finalScore = Math.round(
            (rainScore * 0.35) +
            (soilScore * 0.25) +
            (tScore * 0.20) +
            (hScore * 0.12) +
            (iScore * 0.08)
        );
        
        let category = "LOW";
        if (finalScore >= 75) category = "EXTREME";
        else if (finalScore >= 60) category = "HIGH";
        else if (finalScore >= 40) category = "MEDIUM";
        
        const factors = [
            { factor: "Rainfall Intensity", contribution: `${Math.round(rainScore * 0.35)} pts` },
            { factor: "Soil Saturation", contribution: `${Math.round(soilScore * 0.25)} pts` },
            { factor: "Terrain Susceptibility", contribution: `${Math.round(tScore * 0.20)} pts` },
            { factor: "Historical Frequency", contribution: `${Math.round(hScore * 0.12)} pts` },
            { factor: "Infrastructure Exposure", contribution: `${Math.round(iScore * 0.08)} pts` }
        ];

        res.json({
            success: true,
            data: {
                score: finalScore,
                level: category,
                factors: factors,
                model: "EcoWatch Risk Fusion Engine (Deterministic)",
                modelStatus: "DERIVED PROTOTYPE",
                timestamp: new Date().toISOString()
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
