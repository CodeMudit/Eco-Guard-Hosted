import React, { useEffect, useState } from 'react';
import { Marker, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import { API_URL } from '../../config';

// Fixed points across NER to query wind for
const WIND_POINTS = [
    { id: 'node-1', lat: 25.268, lng: 91.738, name: 'Hill Sector' },
    { id: 'node-2', lat: 25.251, lng: 91.731, name: 'River Bank' },
    { id: 'guwahati', lat: 26.144, lng: 91.736, name: 'Guwahati' },
    { id: 'imphal', lat: 24.817, lng: 93.936, name: 'Imphal' },
    { id: 'kohima', lat: 25.670, lng: 94.107, name: 'Kohima' },
    { id: 'itanagar', lat: 27.084, lng: 93.605, name: 'Itanagar' }
];

export const LiveWindLayer = () => {
    const [windData, setWindData] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const fetchWind = async () => {
            if (!API_URL) return;
            try {
                const promises = WIND_POINTS.map(async (pt) => {
                    const res = await fetch(`${API_URL}/api/weather/wind?lat=${pt.lat}&lng=${pt.lng}`);
                    const json = await res.json();
                    if (json.success && json.data) {
                        return { ...pt, ...json.data };
                    }
                    return null;
                });
                const results = await Promise.all(promises);
                if (isMounted) {
                    setWindData(results.filter(Boolean));
                }
            } catch (err) {
                console.warn("Wind fetch failed:", err.message);
            }
        };

        fetchWind();
        const interval = setInterval(fetchWind, 15 * 60 * 1000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    if (windData.length === 0) return null;

    return (
        <>
            {windData.map(pt => {
                // Determine arrow color by speed
                const speed = pt.windSpeed || 0;
                let colorClass = "text-sky-400";
                if (speed > 40) colorClass = "text-red-500";
                else if (speed > 20) colorClass = "text-amber-500";
                
                // SVG Arrow
                const html = `
                    <div class="wind-particle" style="transform: rotate(${pt.windDirection}deg);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${colorClass} opacity-80 drop-shadow-md">
                            <line x1="12" y1="19" x2="12" y2="5"></line>
                            <polyline points="5 12 12 5 19 12"></polyline>
                        </svg>
                    </div>
                `;

                const icon = L.divIcon({
                    html,
                    className: 'bg-transparent border-0',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                return (
                    <Marker key={pt.id} position={[pt.lat, pt.lng]} icon={icon} />
                );
            })}
        </>
    );
};
