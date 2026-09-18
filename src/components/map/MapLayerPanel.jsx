import React from "react";
import { Layers, Map, CloudSun, Mountain, ShieldAlert, Car, Database } from "lucide-react";

export const MapLayerPanel = ({ activeLayers, toggleLayer }) => {
    const groups = [
        {
            name: "BASE MAP",
            icon: <Map className="w-4 h-4" />,
            items: [
                { id: "satellite", label: "Satellite / Sentinel", type: "radio" },
                { id: "terrain", label: "Topographic DEM", type: "radio" },
                { id: "dark", label: "Dark Administrative", type: "radio" }
            ]
        },
        {
            name: "ENVIRONMENT",
            icon: <CloudSun className="w-4 h-4" />,
            items: [
                { id: "wind", label: "Wind Vector Field", badge: "LIVE" },
                { id: "ndvi", label: "NDVI Index", badge: "DEMO" },
                { id: "moisture", label: "Soil Moisture", badge: "DEMO" }
            ]
        },
        {
            name: "HAZARDS",
            icon: <ShieldAlert className="w-4 h-4" />,
            items: [
                { id: "hazards", label: "Risk Heatmap", badge: "DERIVED" },
                { id: "historical", label: "Historical Landslides", badge: "STATIC" },
                { id: "reports", label: "Field Reports", badge: "LIVE" }
            ]
        },
        {
            name: "INFRASTRUCTURE",
            icon: <Car className="w-4 h-4" />,
            items: [
                { id: "roads", label: "Road Network" },
                { id: "villages", label: "Villages" },
                { id: "sensors", label: "Sensor Nodes", badge: "LIVE" }
            ]
        }
    ];

    return (
        <div className="absolute top-3 left-12 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[1000] overflow-hidden pointer-events-auto">
            <div className="bg-slate-950 p-3 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2 text-white">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm tracking-wide">Map Layers</span>
                </div>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar space-y-3">
                {groups.map((g, i) => (
                    <div key={i} className="space-y-1">
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {g.icon} {g.name}
                        </div>
                        <div className="space-y-0.5">
                            {g.items.map(item => {
                                const isActive = activeLayers[item.id];
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleLayer(item.id, item.type === "radio")}
                                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                            isActive ? "bg-blue-500/10 text-blue-400 font-semibold" : "text-slate-300 hover:bg-slate-800"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-sm flex items-center justify-center border ${isActive ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`}>
                                                {isActive && <div className="w-1.5 h-1.5 bg-slate-950 rounded-[1px]" />}
                                            </div>
                                            <span>{item.label}</span>
                                        </div>
                                        {item.badge && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                                item.badge === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                                                item.badge === 'DEMO' ? 'bg-slate-800 text-slate-400' :
                                                item.badge === 'DERIVED' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-slate-800 text-slate-400'
                                            }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="bg-slate-950 p-2 border-t border-slate-700">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Database className="w-3 h-3" /> Data Provenance Active</span>
                </div>
            </div>
        </div>
    );
};
