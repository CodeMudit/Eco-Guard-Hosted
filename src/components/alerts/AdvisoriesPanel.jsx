import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ShieldAlert, Filter } from "lucide-react";

export const AdvisoriesPanel = () => {
  const { alerts } = useApp();
  const [filterType, setFilterType] = useState("All");

  const advisoryTypes = ["All", "Flood", "Landslide", "Lightning", "Thunderstorm", "Road Blockage"];

  // Map alert to advisory
  const advisories = alerts.map(a => {
     let type = "General";
     if (a.title.toLowerCase().includes("landslide") || a.title.toLowerCase().includes("soil")) type = "Landslide";
     else if (a.title.toLowerCase().includes("water") || a.title.toLowerCase().includes("rain") || a.title.toLowerCase().includes("flood")) type = "Flood";
     else if (a.title.toLowerCase().includes("air")) type = "Lightning";
     else if (a.title.toLowerCase().includes("block")) type = "Road Blockage";

     return { ...a, type };
  });

  const filteredAdvisories = advisories.filter(a => filterType === "All" || a.type === filterType);

  const getSeverityStyle = (severity) => {
     if (severity === "CRITICAL" || severity === "HIGH") return "bg-red-500/10 border-red-500/30";
     if (severity === "MEDIUM") return "bg-orange-500/10 border-orange-500/30";
     return "bg-yellow-500/10 border-yellow-500/30"; 
  };

  const getPillStyle = (severity) => {
     if (severity === "CRITICAL" || severity === "HIGH") return "bg-red-500 text-white";
     if (severity === "MEDIUM") return "bg-orange-500 text-white";
     return "bg-yellow-400 text-slate-900";
  };

  return (
    <div className="flex flex-col border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden h-full shadow-lg">
       <div className="bg-[#1e1b4b] p-3 border-b border-slate-800 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <ShieldAlert className="w-4 h-4 text-orange-400" />
           <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Advisories</h3>
         </div>
         <div className="flex items-center gap-2">
           <Filter className="w-3.5 h-3.5 text-slate-400" />
           <select 
             value={filterType} 
             onChange={(e) => setFilterType(e.target.value)}
             className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded px-1.5 py-0.5 outline-none"
           >
             {advisoryTypes.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
         </div>
       </div>
       <div className="overflow-y-auto flex-1 p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 max-h-96">
         {filteredAdvisories.map(adv => (
            <div key={adv.id} className={`p-3 rounded-xl border ${getSeverityStyle(adv.severity)}`}>
               <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPillStyle(adv.severity)}`}>
                     Severity: {adv.severity === "CRITICAL" || adv.severity === "HIGH" ? "Red" : adv.severity === "MEDIUM" ? "Orange" : "Yellow"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(adv.timestamp).toLocaleDateString()}</span>
               </div>
               <div className="text-xs text-slate-200 mb-1">
                  <strong className="text-white">Affected Areas:</strong> {adv.location}
               </div>
               <div className="text-xs text-slate-300 mb-2">
                  <strong className="text-white">Warning:</strong> {adv.message}
               </div>
               <div className="text-[10px] text-slate-500 italic mt-2 border-t border-slate-800/50 pt-1">
                  Issued in Public Interest — ASDMA / NESAC
               </div>
            </div>
         ))}
         {filteredAdvisories.length === 0 && (
             <div className="text-xs text-slate-500 text-center py-4">No advisories for selected category.</div>
         )}
       </div>
    </div>
  );
};
