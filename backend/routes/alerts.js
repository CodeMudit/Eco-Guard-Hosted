import express from 'express';
import db from '../db.js';

const router = express.Router();

// Mock SMS Transport (MSG91 Simulator)
const mockDispatchTransport = async (title, message, severity) => {
    if (severity === 'CRITICAL' || severity === 'HIGH') {
        console.log(`[MSG91-MOCK] Dispatched SMS Alert! Severity: ${severity}`);
        console.log(`[MSG91-MOCK] Title: ${title}`);
        console.log(`[MSG91-MOCK] Payload: ${message.substring(0, 50)}...`);
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 800));
        return { delivered: true, transport: 'SMS' };
    }
    return { delivered: false, transport: 'NONE', reason: 'Severity too low for SMS' };
};

router.get('/log', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM alerts_log ORDER BY timestamp DESC');
        const logs = stmt.all();
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/dispatch', async (req, res) => {
    try {
        const { title, message, severity } = req.body;
        
        const stmt = db.prepare(`
            INSERT INTO alerts_log (title, message, severity)
            VALUES (?, ?, ?)
        `);
        
        const info = stmt.run(title, message, severity);
        
        // Trigger mock transport
        const transportResult = await mockDispatchTransport(title, message, severity);
        
        res.json({ success: true, data: { id: info.lastInsertRowid, transport: transportResult } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
