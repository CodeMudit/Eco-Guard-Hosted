import React from 'react';
import { useApp } from "../../context/AppContext";
import { Route, CloudRain, ShieldAlert, Users, TrendingUp } from "lucide-react";

export const RoadConnectivity = () => {
   const roads = [
     { name: "NH-40 (Shillong-Guwahati)", status: "Open", risk: "Low" },
     { name: "SH-12 (Mawsynram)", status: "Partially Blocked", risk: "Medium" },
     { name: "NH-27 (Silchar)", status: "Blocked", risk: "High" },
     { name: "NH-10 (Sikkim)", status: "Open", risk: "Low" },
   ];

   return (
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg h-full">
         <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Route className="w-4 h-4 text-amber-400" /> Road Connectivity Status
         </h3>
         <div className="space-y-2">
            {roads.map(r => (
               <div key={r.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/50">
                  <span className="text-xs text-slate-300 font-semibold">{r.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                     r.status === 'Open' ? 'bg-emerald-500/20 text-emerald-400' :
                     r.status === 'Partially Blocked' ? 'bg-amber-500/20 text-amber-400' :
                     'bg-red-500/20 text-red-400'
                  }`}>
                     {r.status}
                  </span>
               </div>
            ))}
         </div>
      </div>
   );
};

export const WeatherForecastPanel = () => {
   const { apiData } = useApp();
   const rainRisk = apiData?.sensors?.rainfall?.value > 20 ? 'High' : apiData?.sensors?.rainfall?.value > 5 ? 'Moderate' : 'Low';
   
   return (
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg h-full">
         <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <CloudRain className="w-4 h-4 text-cyan-400" /> 24-72h Weather Risk
         </h3>
         <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
               <span className="text-slate-400">Rainfall Forecast:</span>
               <span className="text-white font-bold">{apiData?.sensors?.rainfall?.value || 0} mm/h</span>
            </div>
            <div className="flex justify-between items-center text-xs">
               <span className="text-slate-400">Soil Saturation Trend:</span>
               <span className="text-amber-400 font-bold flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Rising</span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-800/50">
               <div className="text-[10px] text-slate-400">Projected Slide Risk:</div>
               <div className={`text-xs font-bold ${rainRisk === 'High' ? 'text-red-400' : rainRisk === 'Moderate' ? 'text-orange-400' : 'text-emerald-400'}`}>
                  {rainRisk} ({rainRisk === 'High' ? '>80%' : rainRisk === 'Moderate' ? '50-80%' : '<50%'} probability)
               </div>
            </div>
         </div>
      </div>
   );
};

export const PriorityList = () => {
   const { hazards } = useApp();
   // ensure we sort by vulnerabilityScore descending
   const sortedHazards = [...hazards].sort((a,b) => b.vulnerabilityScore - a.vulnerabilityScore);

   return (
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg col-span-1 lg:col-span-2">
         <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-red-400" /> Emergency Response Prioritization
         </h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
               <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                     <th className="py-2 px-3 font-semibold">Priority</th>
                     <th className="py-2 px-3 font-semibold">Zone Name</th>
                     <th className="py-2 px-3 font-semibold">Vulnerability Score</th>
                     <th className="py-2 px-3 font-semibold">Exposure</th>
                     <th className="py-2 px-3 font-semibold">Accessibility</th>
                  </tr>
               </thead>
               <tbody>
                  {sortedHazards.map((hz, idx) => (
                     <tr key={hz.id} className="border-b border-slate-800/50 hover:bg-slate-950/50 transition-colors">
                        <td className="py-2 px-3">
                           <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${idx === 0 ? 'bg-red-500 text-white' : idx === 1 ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                              P{idx + 1}
                           </span>
                        </td>
                        <td className="py-2 px-3 text-slate-200 font-medium">{hz.name}</td>
                        <td className="py-2 px-3 text-red-400 font-mono font-bold">{hz.vulnerabilityScore}/100</td>
                        <td className="py-2 px-3 text-slate-400"><Users className="w-3 h-3 inline mr-1 text-slate-500" />{Math.floor(Math.random() * 5000) + 500} ppl</td>
                        <td className="py-2 px-3 text-amber-400 font-semibold">{idx === 0 ? 'Compromised' : 'Clear'}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
};
