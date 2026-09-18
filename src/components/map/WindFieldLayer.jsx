import React, { useEffect, useRef, useState } from 'react';
import { useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Utility to compute U and V components from speed and direction
const getUV = (speed, direction) => {
    // Math.PI / 180 to convert deg to rad
    // Meteorological wind direction: angle FROM which wind originates
    // So flow direction is direction + 180
    const flowDir = (direction + 180) % 360;
    const rad = flowDir * (Math.PI / 180);
    const u = speed * Math.sin(rad);
    const v = speed * Math.cos(rad);
    return { u, v };
};

export const WindFieldLayer = ({ active = false }) => {
    const map = useMap();
    const canvasRef = useRef(null);
    const [windGrid, setWindGrid] = useState(null);
    const [bounds, setBounds] = useState(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);

    // Fetch wind grid from Open-Meteo based on current bounds
    const fetchWindGrid = async (currentBounds) => {
        if (!active) return;
        
        try {
            const south = currentBounds.getSouth();
            const north = currentBounds.getNorth();
            const west = currentBounds.getWest();
            const east = currentBounds.getEast();
            
            // Create a 5x5 grid of coordinates within bounds
            const latStep = (north - south) / 4;
            const lngStep = (east - west) / 4;
            
            let lats = [];
            let lngs = [];
            for(let i=0; i<5; i++){
                lats.push((south + (latStep * i)).toFixed(4));
                lngs.push((west + (lngStep * i)).toFixed(4));
            }
            
            // Open-Meteo accepts comma separated arrays for multiple points
            const latStr = lats.join(',');
            const lngStr = lngs.join(',');
            
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${latStr}&longitude=${lngStr}&current=wind_speed_10m,wind_direction_10m`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (Array.isArray(data)) {
                // Map back to our grid
                let grid = [];
                let idx = 0;
                for(let i=0; i<5; i++) {
                    for(let j=0; j<5; j++) {
                        // OpenMeteo returns array of responses matching the inputs sequentially
                        // Wait, Open-Meteo multi-coordinate needs same length arrays for lat and lng
                        // The above produces 5 lats and 5 lngs -> 5 points total, not a 25 point grid.
                        // Let's generate a flat list of 25 pairs.
                    }
                }
            }
        } catch (e) {
            console.error("Wind fetch failed", e);
        }
    };

    // Correct grid fetching logic
    const fetchWindGridCorrected = async (currentBounds) => {
        if (!active) return;
        
        try {
            const south = currentBounds.getSouth();
            const north = currentBounds.getNorth();
            const west = currentBounds.getWest();
            const east = currentBounds.getEast();
            
            const lats = [];
            const lngs = [];
            
            // 4x4 grid = 16 points (Open-Meteo limit is usually high enough, but let's keep it safe)
            for(let i=0; i<4; i++){
                for(let j=0; j<4; j++){
                    lats.push((south + ((north - south) * (i / 3))).toFixed(4));
                    lngs.push((west + ((east - west) * (j / 3))).toFixed(4));
                }
            }
            
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lats.join(',')}&longitude=${lngs.join(',')}&current=wind_speed_10m,wind_direction_10m`);
            const data = await res.json();
            
            if (Array.isArray(data)) {
                const grid = data.map((d, idx) => {
                    const speed = d.current.wind_speed_10m;
                    const dir = d.current.wind_direction_10m;
                    const {u, v} = getUV(speed, dir);
                    return {
                        lat: parseFloat(lats[idx]),
                        lng: parseFloat(lngs[idx]),
                        u, v, speed, dir
                    };
                });
                setWindGrid(grid);
                setBounds(currentBounds);
            }
        } catch (e) {
            console.error("Wind grid fetch failed", e);
        }
    };

    useMapEvents({
        moveend: (e) => {
            fetchWindGridCorrected(e.target.getBounds());
        },
        zoomend: (e) => {
            fetchWindGridCorrected(e.target.getBounds());
        }
    });

    useEffect(() => {
        if (active) {
            fetchWindGridCorrected(map.getBounds());
        } else {
            setWindGrid(null);
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    }, [active, map]);

    // Particle Animation Loop
    useEffect(() => {
        if (!active || !windGrid || !canvasRef.current || !bounds) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const size = map.getSize();
        
        // Sync canvas size
        canvas.width = size.x;
        canvas.height = size.y;

        // Initialize particles
        const numParticles = window.innerWidth > 768 ? 250 : 100;
        particlesRef.current = Array.from({ length: numParticles }, () => createParticle(canvas.width, canvas.height));

        const render = () => {
            // Fade previous frame slightly for trail effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Dark blend
            ctx.globalCompositeOperation = 'destination-in';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';

            const particles = particlesRef.current;

            particles.forEach(p => {
                if (p.age > p.maxAge) {
                    Object.assign(p, createParticle(canvas.width, canvas.height));
                }

                // Map pixel to lat/lng
                const containerPoint = L.point(p.x, p.y);
                const latlng = map.containerPointToLatLng(containerPoint);

                // Find nearest grid vector (inverse distance weighting would be better, but nearest neighbor is faster for prototype)
                let nearest = windGrid[0];
                let minDist = Infinity;
                for (let cell of windGrid) {
                    const dist = Math.pow(cell.lat - latlng.lat, 2) + Math.pow(cell.lng - latlng.lng, 2);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = cell;
                    }
                }

                // Vector scale
                const scale = 0.5; // pixels per frame per km/h
                
                // Canvas Y is inverted relative to Lat
                const dx = nearest.u * scale;
                const dy = -nearest.v * scale; // Map north is top (-y in canvas)

                const nextX = p.x + dx;
                const nextY = p.y + dy;

                // Color based on speed
                let color = "rgba(56, 189, 248, 0.8)"; // sky-400
                if (nearest.speed > 40) color = "rgba(239, 68, 68, 0.8)"; // red-500
                else if (nearest.speed > 20) color = "rgba(245, 158, 11, 0.8)"; // amber-500

                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(nextX, nextY);
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                p.x = nextX;
                p.y = nextY;
                p.age++;

                // Reset if out of bounds
                if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
                    Object.assign(p, createParticle(canvas.width, canvas.height));
                }
            });

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [windGrid, active, map, bounds]);

    // Position canvas exactly over the map container
    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-[400] transition-opacity duration-500"
            style={{ opacity: active ? 1 : 0 }}
        />
    );
};

const createParticle = (w, h) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    age: 0,
    maxAge: Math.random() * 50 + 20
});
