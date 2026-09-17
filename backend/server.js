import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import weatherRoutes from './routes/weather.js';
import reportsRoutes from './routes/reports.js';
import alertsRoutes from './routes/alerts.js';
import riskRoutes from './routes/risk.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/weather', weatherRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/risk', riskRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date() });
});

// JSON 404 catch-all for unhandled API routes
app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: 'API route not found' });
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
