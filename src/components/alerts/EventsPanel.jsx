import React from "react";
import { useApp } from "../../context/AppContext";
import { Activity } from "lucide-react";

export const EventsPanel = () => {
  const { alerts } = useApp();

  return (
    <div className="flex flex-col border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden h-full shadow-lg">
      <div className="bg-[#1e1b4b] p-3 border-b border-slate-800 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Activity className="w-4 h-4 text-emerald-400" />
           <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Events Bulletin</h3>
         </div>
         <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[10px] text-red-400 font-bold tracking-widest uppercase">Live</span>
         </div>
      </div>
      <div className="overflow-y-auto flex-1 p-0 scrollbar-thin scrollbar-thumb-slate-700 max-h-96">
        {alerts.map((item, idx) => {
          const isReviewed = item.status !== "Active";
          return (
            <div key={item.id} className={`p-2.5 text-[11px] font-mono border-b border-slate-800/50 ${idx % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-950'} hover:bg-slate-800/80 transition-colors`}>
               <div className="text-slate-300 leading-relaxed">
                 <span className={isReviewed ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {isReviewed ? "Reviewed" : "Provisional"}
                 </span> ***
                 <span className="text-slate-400"> Type:</span> <span className="text-white">{item.title}</span>,
                 <span className="text-slate-400"> Value:</span> <span className="text-white">{item.sensorValue}</span>,
                 <span className="text-slate-400"> Place:</span> <span className="text-white">{item.location}</span>,
                 <span className="text-slate-400"> Date&Time:</span> <span className="text-white">{new Date(item.timestamp).toLocaleString()}</span>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
