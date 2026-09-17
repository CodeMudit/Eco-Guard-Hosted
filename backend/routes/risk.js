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

// Simulated True ML Predictor Endpoint
router.post('/predict', (req, res) => {
    try {
        const { lat, lng, district } = req.body;
        
        // Mock ML Inference
        const isHighRiskZone = (lat > 25.26 && lat < 25.30 && lng > 91.70 && lng < 91.75);
        const baseScore = isHighRiskZone ? 75 : 30;
        
        // Add some jitter for realism
        const finalScore = Math.min(100, Math.max(0, baseScore + (Math.random() * 15 - 5)));
        
        let category = "LOW";
        if (finalScore > 80) category = "EXTREME";
        else if (finalScore > 65) category = "HIGH";
        else if (finalScore > 45) category = "MODERATE";
        
        const confidence = (85 + Math.random() * 10).toFixed(1);
        
        const factors = [
            { factor: "Rainfall Intensity", weight: isHighRiskZone ? 0.45 : 0.20 },
            { factor: "Soil Saturation", weight: isHighRiskZone ? 0.30 : 0.15 },
            { factor: "Slope Gradient", weight: 0.15 },
            { factor: "Historical Frequency", weight: 0.10 }
        ].sort((a, b) => b.weight - a.weight);

        res.json({
            success: true,
            data: {
                location: district || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                score: Math.round(finalScore),
                category,
                confidence: `${confidence}%`,
                model: "NESAC-RF-Ensemble-v2",
                timestamp: new Date().toISOString(),
                contributingFactors: factors
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
