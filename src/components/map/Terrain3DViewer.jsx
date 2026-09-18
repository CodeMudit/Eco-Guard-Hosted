import React, { useMemo, useState, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Mountain, MapPin, Wind, Droplets, ShieldAlert, X } from 'lucide-react';
import { fetchLocationIntelligence } from "../../services/locationDataService";
import { calculateRiskForPoint } from "../../utils/riskCalculator";

export const Terrain3DViewer = ({ centerLat, centerLng, onClose }) => {
  const center = [centerLat || 25.268, centerLng || 91.738]; 

  const [locationData, setLocationData] = useState(null);
  const [riskInfo, setRiskInfo] = useState(null);
  const [exaggeration, setExaggeration] = useState(1.5);

  useEffect(() => {
      let isMounted = true;
      const load = async () => {
          const data = await fetchLocationIntelligence(center[0], center[1]);
          if(isMounted) {
              setLocationData(data);
              setRiskInfo(calculateRiskForPoint(data, center[0], center[1]));
          }
      };
      load();
      return () => isMounted = false;
  }, [center[0], center[1]]);
  
  // AWS Terrarium DEM tiles for 3D elevation
  const terrainSource = useMemo(() => ({
    type: 'raster-dem',
    tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
    encoding: 'terrarium',
    tileSize: 256,
    maxzoom: 14
  }), []);

  // Standard OpenStreetMap base style
  const mapStyle = {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap'
      },
      terrainSource: terrainSource
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 19
      }
    ],
    terrain: {
      source: 'terrainSource',
      exaggeration: exaggeration
    }
  };

  return (
    <div className="w-full h-full bg-slate-900 rounded-2xl border border-slate-800 flex overflow-hidden">
      {/* 3D Map Area (Left) */}
      <div className="flex-1 relative flex flex-col">
        <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between z-10 shadow-md">
          <div className="flex items-center gap-4">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Mountain className="w-4 h-4 text-emerald-500" />
                3D Terrain Risk View
              </h3>
              <div className="flex gap-2">
                  <button onClick={() => setExaggeration(1.0)} className={`text-[10px] px-2 py-1 rounded ${exaggeration === 1.0 ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'}`}>1.0x</button>
                  <button onClick={() => setExaggeration(1.5)} className={`text-[10px] px-2 py-1 rounded ${exaggeration === 1.5 ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'}`}>1.5x</button>
                  <button onClick={() => setExaggeration(2.0)} className={`text-[10px] px-2 py-1 rounded ${exaggeration === 2.0 ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'}`}>2.0x</button>
              </div>
          </div>
          <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors">
              Return to 2D Map
          </button>
        </div>
        
        <div className="flex-1 relative">
          <Map
            initialViewState={{
              longitude: center[1],
              latitude: center[0],
              zoom: 13,
              pitch: 65,
              bearing: 30
            }}
            mapStyle={mapStyle}
            interactive={true}
          >
            <NavigationControl position="top-right" visualizePitch={true} />
            <Marker longitude={center[1]} latitude={center[0]} anchor="bottom">
                <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center animate-bounce shadow-xl">
                    <ShieldAlert className="w-3 h-3 text-white" />
                </div>
            </Marker>
          </Map>
        </div>
      </div>

      {/* Terrain Risk Explanation (Right) */}
      <div className="w-80 bg-slate-950 border-l border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto">
          <h3 className="text-white font-bold text-sm tracking-wide border-b border-slate-800 pb-2">Why this area is at risk</h3>
          
          <div className="space-y-4">
              <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Terrain & Elevation</span>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                      High susceptibility slope zone. Elevated relief creates momentum corridors for debris flows. 
                      Elevation context highlights vulnerability to saturated topsoil failure.
                  </div>
              </div>

              {locationData && (
                  <>
                      <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Meteorological Forcing</span>
                          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-xs text-slate-300 grid grid-cols-2 gap-2">
                              <div>Rain (24h): <span className="font-bold text-blue-400">{locationData.hydrology.rain24h.value} mm</span></div>
                              <div>Soil Moist: <span className="font-bold text-blue-400">{locationData.hydrology.soilMoisture.value}%</span></div>
                          </div>
                      </div>
                  </>
              )}

              {riskInfo && (
                  <div className="space-y-1 pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Risk Fusion Output</span>
                      <div className="flex items-end justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <div>
                              <div className="text-3xl font-black text-white leading-none">{riskInfo.score}</div>
                              <div className="text-[10px] text-slate-400 mt-1">/ 100</div>
                          </div>
                          <div className={`text-sm font-bold uppercase tracking-wider ${riskInfo.level === 'HIGH' || riskInfo.level === 'EXTREME' ? 'text-red-400' : 'text-amber-400'}`}>
                              {riskInfo.level} RISK
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
