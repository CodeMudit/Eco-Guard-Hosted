import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { AlertPanel } from "../components/alerts/AlertPanel";
import { AlertDetailModal } from "../components/alerts/AlertDetailModal";
import { EventsPanel } from "../components/alerts/EventsPanel";
import { AdvisoriesPanel } from "../components/alerts/AdvisoriesPanel";
import { ReportedSections } from "../components/hazards/ReportedSections";
import { HazardZones } from "../components/hazards/HazardZones";
import { MapPanel } from "../components/map/MapPanel";
import { Terrain3DViewer } from "../components/map/Terrain3DViewer";
import { NodeCard } from "../components/nodes/NodeCard";
import { NodeDetailModal } from "../components/nodes/NodeDetailModal";
import { NodeHistoryModal } from "../components/nodes/NodeHistoryModal";
import { ApiOverviewCard } from "../components/api/ApiOverviewCard";
import { MLPredictionCenter } from "../components/ml/MLPredictionCenter";
import { MLHistoryChart } from "../components/ml/MLHistoryChart";
import { SensorHistoryChart } from "../components/charts/SensorHistoryChart";
import { Modal } from "../components/common/Modal";
import { FilePlus, ShieldAlert, Radio, CloudSun, Activity } from "lucide-react";

export const HomeDashboard = () => {
  const {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    addReportedSection,
    setActivePage,
    alerts,
    computedRisk,
    apiData,
  } = useApp();

  const [selectedAlertForModal, setSelectedAlertForModal] = useState(null);
  const [selectedNodeForModal, setSelectedNodeForModal] = useState(null);
  const [selectedNodeHistoryForModal, setSelectedNodeHistoryForModal] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("2D");
  const [terrainTarget, setTerrainTarget] = useState(null);

  const [reportForm, setReportForm] = useState({
    title: "",
    location: "Hill Sector NH-13",
    severity: "HIGH",
    reportedBy: "Operator Station",
    description: "",
  });

  const node1 = nodes.find((n) => n.id === "node-1") || nodes[0];
  const node2 = nodes.find((n) => n.id === "node-2") || nodes[1];

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportForm.title || !reportForm.description) return;
    addReportedSection(reportForm);
    setIsReportModalOpen(false);
    setReportForm({
      title: "",
      location: "Hill Sector NH-13",
      severity: "HIGH",
      reportedBy: "Operator Station",
      description: "",
    });
  };


  return (
    <div className="space-y-6 pb-12">
      {/* COMPACT OPERATIONAL STATUS STRIP */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-xl text-[11px] font-medium text-slate-300 shadow-sm">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded border border-slate-800">
          <span className="text-slate-400">Regional Risk:</span>
          <span className={`font-bold ${computedRisk.overallLevel === 'HIGH' || computedRisk.overallLevel === 'EXTREME' ? 'text-red-400' : 'text-amber-400'}`}>
            {computedRisk.overallLevel}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded border border-slate-800">
          <span className="text-slate-400">Active Alerts:</span>
          <span className="font-bold text-amber-400">
            {alerts.filter(a => a.status === 'Active').length} ZONES
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded border border-slate-800">
          <span className="text-slate-400">Sensors:</span>
          <span className="font-bold text-emerald-400">100% ONLINE</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded border border-slate-800">
          <span className="text-slate-400">Weather:</span>
          <span className="font-bold text-blue-400">LIVE (Open-Meteo)</span>
        </div>
      </div>

      {/* SECTION 1: Map Panel (75%) & Response Priorities / Alerts (25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[700px]">
        <div className="lg:col-span-3 flex flex-col relative h-full">
          {viewMode === "2D" ? (
            <MapPanel
              onSelectNode={(id) => setSelectedNodeId(id)}
              onCreateReport={(lat, lng) => {
                  setReportForm({
                      ...reportForm,
                      location: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`
                  });
                  setIsReportModalOpen(true);
              }}
              onOpen3D={(lat, lng) => {
                  setTerrainTarget({ lat, lng });
                  setViewMode("3D");
              }}
            />
          ) : (
            <Terrain3DViewer 
              centerLat={terrainTarget?.lat} 
              centerLng={terrainTarget?.lng}
              onClose={() => setViewMode("2D")}
            />
          )}
        </div>

        <div className="lg:col-span-1 flex flex-col space-y-4 overflow-y-auto">
          {/* Response Priorities Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col shadow-sm">
             <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <h3 className="text-[12px] font-bold text-white uppercase tracking-wider">Response Priorities</h3>
             </div>
             
             <div className="space-y-2">
                <div className="p-2 bg-slate-950 border-l-2 border-red-500 rounded text-xs space-y-1 cursor-pointer hover:bg-slate-800">
                   <div className="flex justify-between items-center font-bold text-white">
                      <span>North Ridge</span>
                      <span className="text-red-400 text-[10px]">HIGH</span>
                   </div>
                   <div className="text-slate-400 text-[10px]">Heavy rainfall, road exposure, nearby settlement</div>
                </div>

                <div className="p-2 bg-slate-950 border-l-2 border-red-500 rounded text-xs space-y-1 cursor-pointer hover:bg-slate-800">
                   <div className="flex justify-between items-center font-bold text-white">
                      <span>Hill Cut Area</span>
                      <span className="text-red-400 text-[10px]">HIGH</span>
                   </div>
                   <div className="text-slate-400 text-[10px]">Slope instability, recent field report</div>
                </div>

                <div className="p-2 bg-slate-950 border-l-2 border-amber-500 rounded text-xs space-y-1 cursor-pointer hover:bg-slate-800">
                   <div className="flex justify-between items-center font-bold text-white">
                      <span>River Basin</span>
                      <span className="text-amber-400 text-[10px]">MEDIUM</span>
                   </div>
                   <div className="text-slate-400 text-[10px]">Elevated water risk</div>
                </div>
             </div>
          </div>
          
          <div className="flex-1 min-h-0">
             <AlertPanel onSelectAlert={(a) => setSelectedAlertForModal(a)} />
          </div>
        </div>
      </div>

      {/* SECTION 1.5: Events & Advisories Command Center (50/50 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch h-[400px]">
        <EventsPanel />
        <AdvisoriesPanel />
      </div>

      {/* SECTION 2: Live IoT Node Hardware Cards (50/50 Grid - 6 Cols Each) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <NodeCard
          node={node1}
          isSelected={selectedNodeId === "node-1"}
          onViewDetails={(n) => setSelectedNodeForModal(n)}
          onViewHistory={(n) => setSelectedNodeHistoryForModal(n)}
        />
        <NodeCard
          node={node2}
          isSelected={selectedNodeId === "node-2"}
          onViewDetails={(n) => setSelectedNodeForModal(n)}
          onViewHistory={(n) => setSelectedNodeHistoryForModal(n)}
        />
      </div>

      {/* SECTION 3: ML Prediction Command Center (Full Width 12 Cols) */}
      <MLPredictionCenter
        onViewAlertModal={() => {
          const activeAlert = alerts[0];
          if (activeAlert) setSelectedAlertForModal(activeAlert);
          else setActivePage("alerts");
        }}
        onCreateReportModal={() => setIsReportModalOpen(true)}
      />

      {/* SECTION 4: Reported Incident Sections & Critical Hazard Zones (Side-by-Side 50/50 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <ReportedSections />
        <HazardZones />
      </div>

      {/* SECTION 5: ML Risk Prediction Trajectory History Chart (Full Width) */}
      <MLHistoryChart />

      {/* SECTION 5: Environmental Sensor Histories (Full Width 3-Column Grid) */}
      <div id="sensor-history-section" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-base font-bold text-white tracking-tight">
            Environmental Sensor Histories
          </h3>
          <span className="text-xs text-slate-400 font-mono">Live Telemetry Streams</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <SensorHistoryChart title="Node 1 — Hill Sector" type="node1" />
          <SensorHistoryChart title="Node 2 — River Bank" type="node2" />
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlertForModal && (
        <AlertDetailModal
          isOpen={!!selectedAlertForModal}
          onClose={() => setSelectedAlertForModal(null)}
          alert={selectedAlertForModal}
        />
      )}

      {/* Node Hardware Detail Modal */}
      {selectedNodeForModal && (
        <NodeDetailModal
          isOpen={!!selectedNodeForModal}
          onClose={() => setSelectedNodeForModal(null)}
          node={selectedNodeForModal}
        />
      )}

      {/* Node Sensor History Modal */}
      {selectedNodeHistoryForModal && (
        <NodeHistoryModal
          isOpen={!!selectedNodeHistoryForModal}
          onClose={() => setSelectedNodeHistoryForModal(null)}
          node={selectedNodeHistoryForModal}
        />
      )}

      {/* Create Incident Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Log Incident Report — Field Patrol"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Incident Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Landslide Debris, Water Surge, Rockfall"
              value={reportForm.title}
              onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Location / Sector</label>
              <input
                type="text"
                value={reportForm.location}
                onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Severity</label>
              <select
                value={reportForm.severity}
                onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Description & Field Notes</label>
            <textarea
              rows={3}
              required
              placeholder="Describe observations, affected road lanes, or structural stress..."
              value={reportForm.description}
              onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <FilePlus className="w-4 h-4" />
              Submit Incident Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
