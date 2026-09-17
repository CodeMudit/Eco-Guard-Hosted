import React from 'react';
import { Mountain, Signal, AlertTriangle } from 'lucide-react';

export const Terrain3DViewer = ({ hazardZone }) => {
  return (
    <div className="w-full h-full min-h-[300px] bg-slate-950 rounded-3xl border border-slate-800 p-6 flex flex-col relative overflow-hidden shadow-2xl">
      <div className="z-10 relative">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Mountain className="w-5 h-5 text-emerald-400" />
          3D Terrain Profile Analysis
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {hazardZone ? `Focus: ${hazardZone.name}` : "Regional Elevation Model"}
        </p>
      </div>

      {/* Isometric 3D Container */}
      <div className="flex-1 relative flex items-center justify-center mt-4 [perspective:1000px]">
        
        {/* CSS Isometric Grid representing terrain */}
        <div 
          className="relative w-64 h-64 border border-slate-700 bg-slate-900/50 rounded-xl"
          style={{
            transform: 'rotateX(60deg) rotateZ(-45deg)',
            transformStyle: 'preserve-3d',
            boxShadow: '-20px 20px 50px rgba(0,0,0,0.5)',
            backgroundImage: 'linear-gradient(rgba(51, 65, 85, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(51, 65, 85, 0.5) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {/* Base Layer */}
          <div className="absolute inset-0 bg-emerald-500/10" style={{ transform: 'translateZ(-1px)' }}></div>

          {/* Elevation Block 1 (Hill) */}
          <div 
            className="absolute top-10 left-10 w-20 h-20 bg-emerald-600/40 border border-emerald-500/50 backdrop-blur-sm transition-all duration-1000"
            style={{ transform: 'translateZ(40px)', boxShadow: '-10px 10px 20px rgba(0,0,0,0.3)' }}
          >
            <div className="absolute -top-6 -left-6 transform rotateX(-90deg) rotateY(0deg) origin-bottom" style={{ transformStyle: 'preserve-3d' }}>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-slate-900/80 px-1 rounded border border-slate-700 inline-block transform rotateZ(45deg)">+850m</span>
            </div>
            {/* Sensor Node Indicator on Hill */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
               <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                  <Signal className="w-2 h-2 text-white transform rotateZ(45deg)" />
               </div>
            </div>
          </div>

          {/* Elevation Block 2 (Risk Zone) */}
          <div 
            className="absolute bottom-10 right-10 w-24 h-16 bg-red-500/30 border border-red-500/50 backdrop-blur-sm transition-all duration-1000"
            style={{ transform: 'translateZ(20px)', boxShadow: '-5px 5px 15px rgba(0,0,0,0.4)' }}
          >
             <div className="absolute -top-6 -right-10 transform rotateX(-90deg) rotateY(0deg) origin-bottom" style={{ transformStyle: 'preserve-3d' }}>
              <span className="text-[10px] font-mono text-red-400 font-bold bg-slate-900/80 px-1 rounded border border-slate-700 flex items-center gap-1 transform rotateZ(45deg)">
                 <AlertTriangle className="w-2.5 h-2.5" /> High Risk
              </span>
            </div>
          </div>

          {/* River Basin */}
          <div 
            className="absolute bottom-5 left-5 w-40 h-8 bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-sm"
            style={{ transform: 'translateZ(5px)' }}
          >
          </div>
        </div>

      </div>

      <div className="z-10 mt-4 border-t border-slate-800 pt-3">
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
           <span>Model: NESAC-DEM-v3</span>
           <span>Res: 10m/px</span>
           <span className="text-emerald-400">Sync: Live</span>
        </div>
      </div>
    </div>
  );
};
