import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM reports ORDER BY timestamp DESC');
        const reports = stmt.all();
        res.json({ success: true, data: reports });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', (req, res) => {
    try {
        const { id, title, location, severity, reportedBy, description, lat, lng } = req.body;
        
        // Use provided ID or generate one
        const reportId = id || `rep-${Date.now()}`;
        
        const stmt = db.prepare(`
            INSERT INTO reports (id, title, location, severity, reportedBy, description, status, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?, 'New', ?, ?)
        `);
        
        stmt.run(reportId, title, location, severity, reportedBy, description, lat, lng);
        res.json({ success: true, data: { id: reportId } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch('/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['New', 'Under Review', 'Verified', 'Resolved'].includes(status)) {
            return res.status(400).json({ success: false, error: "Invalid status" });
        }
        
        const stmt = db.prepare('UPDATE reports SET status = ? WHERE id = ?');
        const info = stmt.run(status, id);
        
        if (info.changes === 0) {
            return res.status(404).json({ success: false, error: "Report not found" });
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
