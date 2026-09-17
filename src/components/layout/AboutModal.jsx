import React from 'react';
import { X, Info, Map, ShieldAlert, BrainCircuit, Activity } from 'lucide-react';

export const AboutModal = ({ isOpen, onClose }) => {
   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
         <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
               <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                     <Info className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-white">About EcoWatch (SIH Prototype)</h2>
               </div>
               <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
               <div className="space-y-2">
                  <h3 className="text-white font-bold text-base">Project Context: NER-DRR Portal Extension</h3>
                  <p>
                     EcoWatch is a prototype developed for the Smart India Hackathon (SIH) targeting disaster management in the North Eastern Region (NER). 
                     It is designed to be a modern, predictive extension to NESAC's existing NER-DRR (North Eastern Space Applications Centre - Disaster Risk Reduction) geoportal.
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                     <Map className="w-5 h-5 text-blue-400" />
                     <h4 className="text-white font-bold">Government-Grade GIS</h4>
                     <p className="text-xs">Integrated with Bhuvan/ISRO satellite imagery layers and Leaflet to provide real-time situational awareness. <br/><br/><strong className="text-emerald-400">Note:</strong> The Live Wind visualization overlay is interpolated from fixed point observations via Open-Meteo, not a raw satellite or model grid.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                     <BrainCircuit className="w-5 h-5 text-purple-400" />
                     <h4 className="text-white font-bold">Predictive AI Engine</h4>
                     <p className="text-xs">Fuses live field sensor data (IoT) with Open-Meteo forecasts to compute compound risk indices for landslides and floods, exposing explainable AI triggers.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                     <Activity className="w-5 h-5 text-indigo-400" />
                     <h4 className="text-white font-bold">Hardware Integration</h4>
                     <p className="text-xs">Designed to ingest telemetry from custom IoT nodes (ESP32/LoRa) monitoring soil moisture, rainfall, vibration (SW-420), and ultrasonic river water levels.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                     <ShieldAlert className="w-5 h-5 text-amber-400" />
                     <h4 className="text-white font-bold">NOC Dashboard UI</h4>
                     <p className="text-xs">Built with a dark-mode "Network Operations Center" aesthetic, utilizing tabular fonts, dense data visualization (Recharts), and offline PWA capabilities for field officials.</p>
                  </div>
               </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 text-right">
               <button onClick={onClose} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-colors">
                  Continue to Dashboard
               </button>
            </div>
         </div>
      </div>
   );
};
