import React, { useEffect, useState } from "react";
import { fetchLocationIntelligence } from "../../services/locationDataService";
import { X, MapPin, CloudSun, Droplets, Activity, FilePlus, Mountain } from "lucide-react";
import { calculateRiskForPoint } from "../../utils/riskCalculator";

export const MapLocationInspector = ({ lat, lng, onClose, onCreateReport, onOpen3D }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [riskInfo, setRiskInfo] = useState(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const fetchData = async () => {
            const result = await fetchLocationIntelligence(lat, lng);
            if (isMounted) {
                setData(result);
                // Compute deterministic risk fusion for this specific point
                const risk = calculateRiskForPoint(result, lat, lng);
                setRiskInfo(risk);
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [lat, lng]);

    if (!lat || !lng) return null;

    return (
        <div className="absolute right-4 top-16 bottom-4 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[1001] flex flex-col overflow-hidden pointer-events-auto transform transition-transform">
            <div className="bg-slate-950 p-3 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2 text-white">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm tracking-wide">Location Intelligence</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                {/* Coordinates & Elevation */}
                <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Coordinates</div>
                    <div className="flex justify-between items-center text-xs text-slate-200">
                        <span>Lat: <span className="font-mono">{lat.toFixed(4)}° N</span></span>
                        <span>Lng: <span className="font-mono">{lng.toFixed(4)}° E</span></span>
                    </div>
                </div>

                {loading ? (
                    <div className="py-10 flex flex-col items-center justify-center text-slate-400 space-y-2">
                        <Activity className="w-6 h-6 animate-pulse" />
                        <span className="text-xs uppercase tracking-widest font-bold">Fetching Live Data...</span>
                    </div>
                ) : data && data.weather ? (
                    <>
                        {/* Risk Fusion Engine Output */}
                        {riskInfo && (
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Fusion Engine</span>
                                    <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">DERIVED</span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <div className="text-3xl font-black text-white leading-none">{riskInfo.score}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">/ 100</div>
                                    </div>
                                    <div className={`text-sm font-bold uppercase tracking-wider ${riskInfo.level === 'HIGH' || riskInfo.level === 'EXTREME' ? 'text-red-400' : 'text-amber-400'}`}>
                                        {riskInfo.level} RISK
                                    </div>
                                </div>
                                <div className="space-y-1.5 pt-2">
                                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Why is this high risk?</span>
                                    {riskInfo.factors.map((f, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px]">
                                            <span className="text-slate-300">{f.name}</span>
                                            <span className="text-slate-400 font-mono">{f.contribution}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Weather Data */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <CloudSun className="w-3.5 h-3.5 text-amber-400" /> Weather
                                </span>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${data.status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                    {data.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-200">
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">Temp: <span className="font-bold text-white">{data.weather.temperature.value}{data.weather.temperature.unit}</span></div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">RH: <span className="font-bold text-white">{data.weather.humidity.value}{data.weather.humidity.unit}</span></div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">Wind: <span className="font-bold text-white">{data.weather.windSpeed.value} {data.weather.windSpeed.unit}</span></div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">Dir: <span className="font-bold text-white">{data.weather.windDirection.value}{data.weather.windDirection.unit}</span></div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">Gust: <span className="font-bold text-white">{data.weather.windGust.value} {data.weather.windGust.unit}</span></div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">Press: <span className="font-bold text-white">{data.weather.surfacePressure.value} {data.weather.surfacePressure.unit}</span></div>
                            </div>
                        </div>

                        {/* Hydrology & Soil */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1">
                                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hydrology & Soil</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-200">
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">Soil Moist: <span className="font-bold text-blue-300">{data.hydrology.soilMoisture.value}{data.hydrology.soilMoisture.unit}</span></div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">Rain (6h): <span className="font-bold text-blue-300">{data.hydrology.rain6h.value} mm</span></div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">Rain (24h): <span className="font-bold text-blue-300">{data.hydrology.rain24h.value} mm</span></div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">Rain (72h): <span className="font-bold text-blue-300">{data.hydrology.rain72h.value} mm</span></div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-xs text-red-400">Failed to fetch point data.</div>
                )}
            </div>

            {/* Footer Source Attribution */}
            <div className="bg-slate-950 p-3 border-t border-slate-700 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={onOpen3D}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded flex flex-col items-center justify-center gap-1 transition-colors border border-slate-600"
                    >
                        <Mountain className="w-4 h-4 text-emerald-400" />
                        3D TERRAIN
                    </button>
                    <button
                        onClick={onCreateReport}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded flex flex-col items-center justify-center gap-1 transition-colors border border-slate-600"
                    >
                        <FilePlus className="w-4 h-4 text-blue-400" />
                        REPORT
                    </button>
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                    <span>Weather Source: {data?.source || 'Open-Meteo'}</span>
                    <span>Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '--'}</span>
                </div>
            </div>
        </div>
    );
};
