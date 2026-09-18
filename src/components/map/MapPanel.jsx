import React, { useState, useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, useMapEvents, GeoJSON, LayerGroup, Rectangle } from "react-leaflet";
import { useApp } from "../../context/AppContext";
import { createNodeIcon } from "../../utils/leafletIcons";
import { WindFieldLayer } from "./WindFieldLayer";
import { MapLayerPanel } from "./MapLayerPanel";
import { MapLegend } from "./MapLegend";
import { HeatmapLayer } from "./HeatmapLayer";
import { MapLocationInspector } from "./MapLocationInspector";
import { nerStateBoundaries, nerRoadNetwork, nerRiskHeatmapPoints, nerVillages } from "../../data/mockGeoData";
import { historicalLandslides } from "../../data/mockHistoricalLandslides";
import {
  Maximize2,
  Minimize2,
  Radio,
  CloudSun,
  ShieldAlert,
  Battery,
  Wifi,
} from "lucide-react";

// Map Re-centering & Resize Controller
const MapController = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (target && target.lat && target.lng) {
      map.flyTo([target.lat, target.lng], target.zoom || 14, {
        duration: 1.5,
      });
    }
  }, [target, map]);
  return null;
};

// Click Event Listener
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

export const MapPanel = ({ onSelectNode, onSelectHazard, onCreateReport, onOpen3D }) => {
  const { nodes, apiData, hazards, selectedNodeId, mapTarget, setSelectedNodeId, setSelectedHazardId, riskScore, reports } = useApp();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [inspectorLocation, setInspectorLocation] = useState(null);

  const [activeLayers, setActiveLayers] = useState({
    satellite: true,
    terrain: false,
    dark: false,
    wind: false,
    ndvi: false,
    moisture: false,
    hazards: true,
    historical: false,
    reports: true,
    roads: true,
    villages: true,
    sensors: true
  });

  const toggleLayer = (id, isRadio = false) => {
    setActiveLayers(prev => {
        const next = { ...prev };
        if (isRadio) {
            if (id === 'satellite' || id === 'terrain' || id === 'dark') {
                next.satellite = false;
                next.terrain = false;
                next.dark = false;
            }
        }
        next[id] = !prev[id];
        return next;
    });
  };

  const defaultCenter = [25.268, 91.738];
  const defaultZoom = 13;

  const node1 = nodes.find((n) => n.id === "node-1") || nodes[0];
  const node2 = nodes.find((n) => n.id === "node-2") || nodes[1];

  const adminStyle = {
    color: "#cbd5e1",
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.1,
    dashArray: "5, 5"
  };

  const roadStyle = (feature) => {
    return {
      color: feature.properties.status === "Open" ? "#10b981" : feature.properties.status === "Partially Blocked" ? "#f59e0b" : "#ef4444",
      weight: 3,
      opacity: 0.8
    };
  };

  const villageIcon = L.divIcon({
    className: "bg-transparent",
    html: `<div class="w-2.5 h-2.5 bg-blue-500 border border-white rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl transition-all duration-300 ${
        isFullscreen ? "fixed inset-4 z-50 h-[calc(100vh-2rem)]" : "h-full min-h-[520px] lg:min-h-[640px]"
      }`}
    >
      {/* Map Header Controls Bar */}
      <div className="absolute top-3 right-12 z-[1000] flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-2xl">
        <button
          type="button"
          onClick={() => setShowComparison(!showComparison)}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
            showComparison ? "bg-amber-600 text-white shadow-md" : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
          }`}
        >
          {showComparison ? "Exit Comparison" : "Satellite Comparison"}
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0 font-sans"
      >
        <MapController target={mapTarget} />
        <MapClickHandler onMapClick={(lat, lng) => setInspectorLocation({ lat, lng })} />

        {/* Custom Layer Manager Panel */}
        <MapLayerPanel activeLayers={activeLayers} toggleLayer={toggleLayer} />

        {/* Base Layers */}
        {activeLayers.satellite && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Sentinel-2/ISRO Bhuvan Proxy"
          />
        )}
        {activeLayers.terrain && (
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenTopoMap contributors"
          />
        )}
        {activeLayers.dark && (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; <a href='https://carto.com/'>CARTO</a>"
          />
        )}

        {/* Environment Layers */}
        <WindFieldLayer active={activeLayers.wind} />

        {activeLayers.ndvi && (
          <Rectangle bounds={[[24.5, 89.5], [29.5, 97.5]]} pathOptions={{ color: '#16a34a', weight: 0, fillColor: '#16a34a', fillOpacity: 0.15, className: 'mix-blend-multiply' }} />
        )}
        {activeLayers.moisture && (
          <Rectangle bounds={[[24.5, 89.5], [29.5, 97.5]]} pathOptions={{ color: '#0284c7', weight: 0, fillColor: '#0284c7', fillOpacity: 0.15, className: 'mix-blend-multiply' }} />
        )}

        {/* Overlays always on for context */}
        <GeoJSON data={nerStateBoundaries} style={adminStyle} />

        {/* Infrastructure Layers */}
        {activeLayers.roads && (
          <GeoJSON 
            data={nerRoadNetwork} 
            style={roadStyle} 
            onEachFeature={(feature, layer) => {
              layer.on({
                click: (e) => {
                  L.DomEvent.stopPropagation(e); // Stop map click so location inspector doesn't open
                  const popupContent = `
                    <div class="p-2 text-xs font-sans">
                       <div class="font-bold text-white mb-1 border-b border-slate-700 pb-1">ROAD INTELLIGENCE</div>
                       <div>Status: <span class="font-bold ${feature.properties.status === 'Open' ? 'text-emerald-400' : 'text-red-400'}">${feature.properties.status}</span></div>
                       <div class="text-slate-300 mt-1">Hazard Risk: HIGH</div>
                       <div class="text-slate-400 text-[10px] mt-1">Proximity: 2.1km to nearest slope failure</div>
                    </div>
                  `;
                  layer.bindPopup(popupContent).openPopup();
                }
              });
            }}
          />
        )}

        {activeLayers.hazards && (
          <HeatmapLayer points={nerRiskHeatmapPoints} />
        )}

        {activeLayers.villages && (
          <LayerGroup>
               {nerVillages.features.map((v, i) => (
                  <Marker key={i} position={[v.geometry.coordinates[1], v.geometry.coordinates[0]]} icon={villageIcon}>
                     <Popup>
                        <div className="p-2 text-xs">
                           <div className="font-bold text-slate-800">{v.properties.name}</div>
                           <div className="text-slate-600">Population: {v.properties.population}</div>
                           <div className={`font-bold mt-1 ${v.properties.risk === 'High' || v.properties.risk === 'Extreme' ? 'text-red-500' : 'text-amber-500'}`}>
                              Risk: {v.properties.risk}
                           </div>
                        </div>
                     </Popup>
                  </Marker>
               ))}
            </LayerGroup>
        )}

        {activeLayers.hazards && (
          <LayerGroup>
            {hazards.map((hz) => hz.coordinates && (
                <Polygon
                  key={hz.id}
                  positions={hz.coordinates}
                  pathOptions={{
                    color: hz.color,
                    fillColor: hz.color,
                    fillOpacity: 0.25,
                    weight: 2,
                    dashArray: "4, 6",
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedHazardId(hz.id);
                      if (onSelectHazard) onSelectHazard(hz);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-2 space-y-1.5 text-xs text-slate-200 font-sans">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                        <span className="font-bold text-white flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                          {hz.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                          {hz.riskLevel}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{hz.description}</p>
                      <p className="text-[10px] text-slate-400">Vulnerability: {hz.vulnerabilityScore}</p>
                    </div>
                  </Popup>
                </Polygon>
              ))}
            </LayerGroup>
        )}

        {activeLayers.reports && (
          <LayerGroup>
            {reports?.map((rep) => rep.coordinates && (
                <Marker key={rep.id} position={rep.coordinates} icon={createNodeIcon(rep.title, false)}>
                  <Popup>
                     <div className="p-2 space-y-1 text-xs font-sans text-slate-200">
                        <div className="font-bold text-white mb-1 border-b border-slate-700 pb-1">{rep.title}</div>
                        <div className="text-[10px] text-amber-400 font-bold uppercase">{rep.status}</div>
                        <div>{rep.description}</div>
                        <div className="text-[10px] text-slate-400 mt-2">By: {rep.reportedBy}</div>
                     </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
        )}

        {activeLayers.historical && (
          <LayerGroup>
            {historicalLandslides.map((hist) => (
                <Marker key={hist.id} position={hist.coordinates} icon={createNodeIcon('Historical', false)}>
                  <Popup>
                    <div className="p-2 space-y-1 text-xs font-sans text-slate-200">
                      <div className="font-bold text-amber-400 mb-1 border-b border-slate-700 pb-1">{hist.name}</div>
                      <div className="text-[10px] text-slate-300 font-bold uppercase">Date: {hist.date}</div>
                      <div>{hist.description}</div>
                      <div className="text-[10px] text-slate-400 mt-2">Severity: {hist.severity}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
        )}

        {activeLayers.sensors && (
          <LayerGroup>
            {/* Node 1 Marker */}
              {node1 && (
                <Marker
                  position={[node1.lat, node1.lng]}
                  icon={createNodeIcon("Node 1 — Hill Sector", selectedNodeId === "node-1")}
                  eventHandlers={{
                    click: () => {
                      setSelectedNodeId("node-1");
                      if (onSelectNode) onSelectNode("node-1");
                    },
                  }}
                >
                  <Popup>
                    <div className="p-2.5 space-y-2 text-xs text-slate-100 min-w-[200px] font-mono">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 font-sans">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Radio className="w-4 h-4 text-emerald-400" />
                          Node 1 — Hill Sector
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          Online
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                        <div>Comm: <span className="font-semibold text-teal-400">LoRa</span></div>
                        <div>Battery: <span className="font-semibold text-white">{node1.battery}%</span></div>
                        <div>Temp: <span className="font-semibold text-white">{node1.sensors.temperature.value} °C</span></div>
                        <div>Hum: <span className="font-semibold text-white">{node1.sensors.humidity.value} %</span></div>
                        <div>Soil: <span className="font-semibold text-amber-400">{node1.sensors.soilMoisture.value} %</span></div>
                        <div>Rain: <span className="font-semibold text-red-400">{node1.sensors.rainfall.value} mm/h</span></div>
                      </div>

                      <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1 flex justify-between font-sans">
                        <span>Updated: {node1.lastUpdate}</span>
                        <span className="text-emerald-400 font-semibold cursor-pointer" onClick={() => onSelectNode && onSelectNode("node-1")}>
                          View Card ↓
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Node 2 Marker */}
              {node2 && (
                <Marker
                  position={[node2.lat, node2.lng]}
                  icon={createNodeIcon("Node 2 — River Bank", selectedNodeId === "node-2")}
                  eventHandlers={{
                    click: () => {
                      setSelectedNodeId("node-2");
                      if (onSelectNode) onSelectNode("node-2");
                    },
                  }}
                >
                  <Popup>
                    <div className="p-2.5 space-y-2 text-xs text-slate-100 min-w-[200px] font-mono">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 font-sans">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Radio className="w-4 h-4 text-cyan-400" />
                          Node 2 — River Bank
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          Online
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                        <div>Comm: <span className="font-semibold text-cyan-400">GSM</span></div>
                        <div>Battery: <span className="font-semibold text-white">{node2.battery}%</span></div>
                        <div>Temp: <span className="font-semibold text-white">{node2.sensors.temperature.value} °C</span></div>
                        <div>PM2.5: <span className="font-semibold text-amber-400">{node2.sensors.pm25.value} µg/m³</span></div>
                        <div>Water: <span className="font-semibold text-amber-400">{node2.sensors.waterLevel.value} m</span></div>
                        <div>Hum: <span className="font-semibold text-white">{node2.sensors.humidity.value} %</span></div>
                      </div>

                      <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1 flex justify-between font-sans">
                        <span>Updated: {node2.lastUpdate}</span>
                        <span className="text-cyan-400 font-semibold cursor-pointer" onClick={() => onSelectNode && onSelectNode("node-2")}>
                          View Card ↓
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Overall Area API Marker */}
              {apiData && (
                <Marker
                  position={[apiData.lat, apiData.lng]}
                  icon={createNodeIcon("Overall API Area", false)}
                >
                  <Popup>
                    <div className="p-2.5 space-y-2 text-xs text-slate-100 min-w-[210px] font-mono">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 font-sans">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <CloudSun className="w-4 h-4 text-purple-400" />
                          Overall Area — API Data
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px]">
                          API Connected
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                        <div>Temp: <span className="font-semibold text-white">{apiData.sensors.temperature.value} °C</span></div>
                        <div>AQI: <span className="font-semibold text-amber-400">{apiData.sensors.aqi.value}</span></div>
                        <div>PM2.5: <span className="font-semibold text-white">{apiData.sensors.pm25.value} µg/m³</span></div>
                        <div>Rain: <span className="font-semibold text-white">{apiData.sensors.rainfall.value} mm/h</span></div>
                        <div>Wind: <span className="font-semibold text-white">{apiData.sensors.windSpeed.value} km/h</span></div>
                        <div>Press: <span className="font-semibold text-white">{apiData.sensors.pressure.value} hPa</span></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </LayerGroup>
        )}

        {/* Selected Location Marker (drawn on top) */}
        {inspectorLocation && (
          <Marker position={[inspectorLocation.lat, inspectorLocation.lng]} icon={createNodeIcon('Selected', false)}>
            <Popup>Selected Location for Analysis</Popup>
          </Marker>
        )}

        {/* Side-by-side comparison simulated using a secondary TileLayer in a rectangle if active */}
        {/* We use a crude but effective visual comparison without external plugins for the demo */}
        {showComparison && (
          <LayerGroup>
             <Rectangle bounds={[[25.2, 91.7], [25.3, 91.8]]} pathOptions={{ color: '#ef4444', weight: 2, fillOpacity: 0 }} />
             <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              bounds={[[25.2, 91.7], [25.3, 91.8]]}
              opacity={0.8}
            />
          </LayerGroup>
        )}
      </MapContainer>

      {/* Overlay Legend */}
      <MapLegend />

      {/* Location Inspector Panel */}
      {inspectorLocation && (
        <MapLocationInspector 
          lat={inspectorLocation.lat} 
          lng={inspectorLocation.lng} 
          onClose={() => setInspectorLocation(null)}
          onCreateReport={() => onCreateReport && onCreateReport(inspectorLocation.lat, inspectorLocation.lng)}
          onOpen3D={() => onOpen3D && onOpen3D(inspectorLocation.lat, inspectorLocation.lng)}
        />
      )}
    </div>
  );
};
