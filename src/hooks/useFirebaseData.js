/**
 * useFirebaseData.js
 * Reads from Firebase Realtime Database path: /sensorData
 *
 * Each push-key entry looks like:
 * {
 *   MQ3: 1801, MQ5: 1700, MQ7: 415,
 *   accelerometer: { x, y, z },
 *   distance: 0,
 *   gyroscope: { x, y, z },
 *   humidity: 0,
 *   imuTemperature: 127.9977,
 *   nodeID: "Node-A",
 *   soilMoisture: 91,
 *   soilRaw: 358,
 *   temperature: 0,
 *   timestamp: 46470,
 *   vibration: 1
 * }
 *
 * New entries are pushed to the bottom (push key = chronological order).
 * → Latest entry = current live sensor values (for Node Cards)
 * → All entries = history (for charts)
 *
 * nodeID mapping:
 *   "Node-A" → node-1 (Hill Sector)
 *   "Node-B" → node-2 (River Bank)
 */

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { db, isFirebaseConfigured } from "../firebase";
import { initialNodes } from "../data/mockNodes";
import { initialApiData } from "../data/mockApiData";
import { generateHistoryData } from "../data/mockHistory";

// ----- Field Mapping Helpers -----

/**
 * Map a raw Firebase sensorData record to the node-1 sensor shape
 * (Hill Sector: soilMoisture, rainfall-equivalent, temperature, humidity)
 */
const extractNum = (v) => {
    if (typeof v === 'number') return v;
    if (v && typeof v === 'object') {
        const potentialKeys = ['value', 'ppm', 'raw', 'mq3', 'MQ3', 'mq5', 'MQ5'];
        for (const k of potentialKeys) {
            if (v[k] !== undefined) return Number(v[k]);
        }
        // If it's an object with one key, grab its value
        const keys = Object.keys(v);
        if (keys.length === 1) return Number(v[keys[0]]);
        return 0;
    }
    return Number(v) || 0;
};

const mapNode1Sensors = (rec = {}, defaultNode) => {
    const source = rec.nodeA || rec;
    const soilMoisture = extractNum(source.soilMoisture ?? defaultNode.sensors.soilMoisture.value);
    const humidity = extractNum(source.humidity ?? defaultNode.sensors.humidity.value);
    const temperature = (extractNum(source.imuTemperature) && extractNum(source.imuTemperature) < 100) ? parseFloat(extractNum(source.imuTemperature).toFixed(1)) : extractNum(source.temperature ?? defaultNode.sensors.temperature.value);
    const mq3 = extractNum(source.MQ3);
    return {
        temperature: { ...defaultNode.sensors.temperature, value: temperature, status: getStatus(temperature, 10, 35) },
        humidity:    { ...defaultNode.sensors.humidity,    value: humidity,     status: getStatus(humidity, 30, 80) },
        soilMoisture: { ...defaultNode.sensors.soilMoisture, value: soilMoisture, status: soilMoisture >= 80 ? 'critical' : soilMoisture >= 70 ? 'warning' : 'normal' },
        rainfall: { ...defaultNode.sensors.rainfall, value: mq3, unit: 'ppm', status: mq3 > 1500 ? 'critical' : mq3 > 800 ? 'warning' : 'normal' },

    };
};
const mapNode2Sensors = (rec = {}, defaultNode) => {
    const humidity     = extractNum(rec.humidity ?? defaultNode.sensors.humidity.value);
    const temperature  = (extractNum(rec.imuTemperature) && extractNum(rec.imuTemperature) < 100)
        ? parseFloat(extractNum(rec.imuTemperature).toFixed(1))
        : extractNum(rec.temperature ?? defaultNode.sensors.temperature.value);
    const mq5 = extractNum(rec.MQ5);   // gas sensor → proxy for PM2.5
    const distance = extractNum(rec.nodeB?.waterLevel1 ?? rec.distance ?? defaultNode.sensors.waterLevel.value);
    const soilMoisture = extractNum(rec.soilMoisture);

    return {
        temperature: { ...defaultNode.sensors.temperature, value: temperature, status: getStatus(temperature, 10, 35) },
        humidity:    { ...defaultNode.sensors.humidity,    value: humidity,     status: getStatus(humidity, 30, 80) },
        soilMoisture: {
            value: soilMoisture,
            unit: "%",
            // >=80 → critical, >=70 → warning (matches user-defined thresholds)
            status: soilMoisture >= 80 ? "critical" : soilMoisture >= 70 ? "warning" : "normal",
        },
        pm25: {
            ...defaultNode.sensors.pm25,
            value: mq5,
            unit: "ppm",
            status: mq5 > 1500 ? "critical" : mq5 > 800 ? "warning" : "normal",
        },
        waterLevel: {
            ...defaultNode.sensors.waterLevel,
            value: typeof distance === "number" ? parseFloat(distance.toFixed(2)) : defaultNode.sensors.waterLevel.value,
            unit: "m",
            // >=2m → critical, >=1m → warning
            status: distance >= 2 ? "critical" : distance >= 1 ? "warning" : "normal",
        },
    };
};

const getStatus = (val, low, high) => {
    if (val < low || val > high) return "warning";
    return "normal";
};

// Build a history point for Node-1 chart from a raw Firebase record
const toNode1HistoryPoint = (rec, label) => {
    const source = rec.nodeA || rec;
    return {
        time: label,
        temperature: (extractNum(source.imuTemperature) && extractNum(source.imuTemperature) < 100) ? parseFloat(extractNum(source.imuTemperature).toFixed(1)) : extractNum(source.temperature),
        humidity: extractNum(source.humidity),
        soilMoisture: extractNum(source.soilMoisture),
        rainfall: extractNum(source.MQ3),
    };
};
const toNode2HistoryPoint = (rec, label) => ({
    time: label,
    temperature: (extractNum(rec.imuTemperature) && extractNum(rec.imuTemperature) < 100)
        ? parseFloat(extractNum(rec.imuTemperature).toFixed(1))
        : extractNum(rec.temperature),
    humidity:     extractNum(rec.humidity),
    pm25:         extractNum(rec.MQ5),
    waterLevel:   extractNum(rec.nodeB?.waterLevel1 ?? rec.distance),
});

// Build a history point for API/ML risk chart — derived from sensor data
const toApiHistoryPoint = (rec, label) => ({
    time: label,
    temperature: (extractNum(rec.imuTemperature) && extractNum(rec.imuTemperature) < 100)
        ? parseFloat(extractNum(rec.imuTemperature).toFixed(1))
        : extractNum(rec.temperature),
    aqi:      Math.min(500, Math.round(extractNum(rec.MQ3) / 5)),
    pm25:     Math.min(300, Math.round(extractNum(rec.MQ5) / 6)),
    rainfall: Math.min(100, Math.round(extractNum(rec.MQ7) / 10)),
    windSpeed: extractNum(rec.vibration),
    pressure:  1013,
});

// Build an ML risk history point derived from sensor readings
const toMlHistoryPoint = (rec, label) => {
    const soil   = extractNum(rec.soilMoisture) || 50;
    const mq3    = extractNum(rec.MQ3);
    const mq5    = extractNum(rec.MQ5);
    const dist   = extractNum(rec.distance);

    const landslideRisk   = Math.min(99, Math.round(soil * 0.6 + (mq3 / 30)));
    const floodRisk       = Math.min(99, Math.round(dist * 20 + (mq3 / 50)));
    const airQualityRisk  = Math.min(99, Math.round((mq5 / 30) + (mq3 / 60)));
    const overallRisk     = Math.min(99, Math.round(landslideRisk * 0.45 + floodRisk * 0.35 + airQualityRisk * 0.2));

    return { time: label, overallRisk, landslideRisk, floodRisk, airQualityRisk };
};

// Format a timestamp label for chart X-axis
const makeTimeLabel = (rec, index) => {
    if (rec.timestamp && typeof rec.timestamp === "number") {
        const d = new Date(rec.timestamp * 1000);
        // Unix epoch seconds after ~Sept 2020 — safely above any realistic Arduino millis() value
        if (rec.timestamp > 1_600_000_000) {
            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        // Otherwise treat as seconds-since-boot → show index
        return `#${index + 1}`;
    }
    return `#${index + 1}`;
};

const getLatestRecord = (records) => {
    if (records.length === 0) return null;
    // Since records are derived from Firebase push-keys which are chronologically sorted,
    // the last record in the array is always the most recent one.
    // We cannot rely on record.timestamp because it might be Arduino millis() which resets on restart.
    return records[records.length - 1];
};

const getTelemetry = (latestRecord, records) => {
    // Check for the new nodeB nested structure (from uploaded image)
    if (latestRecord?.nodeB) {
        return {
            sw420: Number(latestRecord.vibration ?? 0),
            ultrasonicDistanceCm: latestRecord.nodeB.waterLevel1,
            ultrasonicDistanceCm2: latestRecord.nodeB.waterLevel2,
            waterRiseRateCm: latestRecord.nodeB.decreaseRate ?? 0,
        };
    }

    const getDistance = (record) => {
        const value = record?.ultrasonicDistanceCm
            ?? record?.ultrasonicDistance
            ?? record?.ultrasonic
            ?? record?.distance;
        return typeof value === "number" ? value : null;
    };

    const distance = getDistance(latestRecord);
    const filteredRecords = records.filter((record) => record !== latestRecord && getDistance(record) !== null);
    const previousRecord = filteredRecords.length > 0 ? filteredRecords[filteredRecords.length - 1] : null;
    const previousDistance = getDistance(previousRecord);

    return {
        sw420: Number(latestRecord?.SW420 ?? latestRecord?.sw420 ?? latestRecord?.sw_420 ?? latestRecord?.vibration ?? 0),
        ultrasonicDistanceCm: distance,
        waterRiseRateCm: typeof previousDistance === "number" && distance !== null
            ? Number((previousDistance - distance).toFixed(2))
            : 0,
    };
};

const defaultHistory = generateHistoryData("24h");

// ---- Main Hook ----

export const useFirebaseData = () => {
    const [firebaseNodes, setFirebaseNodes] = useState(initialNodes);
    const [firebaseApiData, setFirebaseApiData] = useState(initialApiData);
    const [firebaseHistory, setFirebaseHistory] = useState(defaultHistory);
    const [isFirebaseLoading, setIsFirebaseLoading] = useState(isFirebaseConfigured);
    // Weather fetching is now handled by weatherApi.js proxying the backend.
    
    useEffect(() => {
        if (!isFirebaseConfigured || !db) {
            return;
        }

        const sensorRef = ref(db, "sensorData");

        onValue(
            sensorRef,
            (snapshot) => {
                const raw = snapshot.val();
                if (!raw) {
                    setIsFirebaseLoading(false);
                    return;
                }

                // Convert push-key object to array sorted chronologically (push keys are time-ordered)
                const allRecords = Object.keys(raw)
                    .sort()
                    .map((k) => raw[k]);

                // Keep each node's stream separate. Never use one node's readings as another node's fallback.
                const nodeARecords = allRecords.filter((r) => r.nodeID === "Node-A" || r.nodeID === "node-1");
                const nodeBRecords = allRecords.filter((r) => r.nodeID === "Node-B" || r.nodeID === "node-2");

                // ---- Current sensor values (latest record for each node) ----
                const latestA = getLatestRecord(nodeARecords);
                const latestB = getLatestRecord(nodeBRecords);

                const defaultNode1 = initialNodes.find((n) => n.id === "node-1");
                const defaultNode2 = initialNodes.find((n) => n.id === "node-2");

                const updatedNode1 = {
                    ...defaultNode1,
                    lastUpdate: "Just now",
                    telemetry: getTelemetry(latestA, nodeARecords),
                    sensors: mapNode1Sensors(latestA || {}, defaultNode1),
                };

                const updatedNode2 = {
                    ...defaultNode2,
                    lastUpdate: "Just now",
                    telemetry: getTelemetry(latestB, nodeBRecords),
                    sensors: mapNode2Sensors(latestB || {}, defaultNode2),
                };

                setFirebaseNodes([updatedNode1, updatedNode2]);

                // ---- History arrays for charts ----
                // Limit to last 24 points so charts don't get too crowded
                const limitHistory = (arr) => arr.slice(-24);

                const node1History = limitHistory(
                    nodeARecords.map((rec, i) => toNode1HistoryPoint(rec, makeTimeLabel(rec, i)))
                );

                const node2History = limitHistory(
                    nodeBRecords.map((rec, i) => toNode2HistoryPoint(rec, makeTimeLabel(rec, i)))
                );

                const apiHistory = limitHistory(
                    allRecords.map((rec, i) => toApiHistoryPoint(rec, makeTimeLabel(rec, i)))
                );

                const mlRiskHistory = limitHistory(
                    allRecords.map((rec, i) => toMlHistoryPoint(rec, makeTimeLabel(rec, i)))
                );

                setFirebaseHistory({ node1History, node2History, apiHistory, mlRiskHistory });

                // ---- Update apiData sensors from latest record ----
                setFirebaseApiData((prev) => ({
                    ...prev,
                    lastUpdate: "Just now",
                    sensors: {
                        ...prev.sensors,
                        // We rely on the OpenWeather API for Weather data, so we only pull local gas sensing here
                        aqi:         { ...prev.sensors.aqi,         value: Math.min(500, Math.round((extractNum(latestA?.MQ3) || extractNum(latestB?.MQ3) || 0) / 5)) },
                        pm25:        { ...prev.sensors.pm25,        value: Math.min(300, Math.round((extractNum(latestA?.MQ5) || extractNum(latestB?.MQ5) || 0) / 6)) },
                    },
                }));


                setIsFirebaseLoading(false);
            },
            (err) => {
                setIsFirebaseLoading(false);
            }
        );

        return () => {
            off(sensorRef);
        };
    }, []);

    // Open-Meteo logic migrated to backend proxy.


    return { firebaseNodes, firebaseApiData, firebaseHistory, isFirebaseLoading };
};
