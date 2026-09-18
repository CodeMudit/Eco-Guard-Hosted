import React, { useState, useEffect } from "react";
import localforage from "localforage";
import imageCompression from "browser-image-compression";
import { useApp } from "../context/AppContext";
import { exportToCsv } from "../utils/formatters";
import { FileText, Download, Printer, MapPin, Camera, UploadCloud, WifiOff, RefreshCw } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { createNodeIcon } from "../utils/leafletIcons";

const LocationMarker = ({ setForm }) => {
  const [position, setPosition] = useState(null);
  
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setForm(f => ({ ...f, coordinates: [e.latlng.lat, e.latlng.lng], location: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}` }));
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={createNodeIcon("Selected Location", true)}></Marker>
  );
};

export const ReportsPage = () => {
  const { reports, addReportedSection, updateReportStatus, addToast, alerts } = useApp();

  const [form, setForm] = useState({
    title: "Slope Movement",
    category: "Slope Movement",
    location: "",
    coordinates: null,
    severity: "HIGH",
    reportedBy: "",
    submitterType: "Field Official",
    description: "",
    photo: null
  });

  const [isLocating, setIsLocating] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load queue
    localforage.getItem('offlineReportsQueue').then(queue => {
       if (queue) setOfflineQueue(queue);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineQueue = async () => {
      if (offlineQueue.length === 0) return;
      
      for (const rep of offlineQueue) {
         addReportedSection(rep);
      }
      
      await localforage.setItem('offlineReportsQueue', []);
      setOfflineQueue([]);
      addToast("Offline Sync Complete", `Successfully synced ${offlineQueue.length} reports.`, "success");
  };

  useEffect(() => {
      if (isOnline && offlineQueue.length > 0) {
          syncOfflineQueue();
      }
  }, [isOnline]);

  const handleExportCsv = () => {
    const reportData = alerts.map((a) => ({
      ID: a.id,
      Title: a.title,
      Source: a.source,
      Severity: a.severity,
      Status: a.status,
      Timestamp: a.timestamp,
      SensorValue: a.sensorValue,
      MLRiskScore: a.mlRiskScore,
      Message: a.message,
    }));
    exportToCsv("ecowatch-environmental-report.csv", reportData);
    addToast("Report Generated", "Exported environmental incident summary CSV file.", "success");
  };

  const handleCaptureGPS = () => {
     setIsLocating(true);
     if ("geolocation" in navigator) {
         navigator.geolocation.getCurrentPosition((pos) => {
             setForm(f => ({ ...f, coordinates: [pos.coords.latitude, pos.coords.longitude], location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` }));
             setIsLocating(false);
             addToast("GPS Captured", "Device location captured successfully.", "success");
         }, () => {
             setIsLocating(false);
             addToast("GPS Failed", "Could not capture device location. Please enter manually.", "error");
         });
     } else {
         setIsLocating(false);
     }
  };

  const handlePhotoUpload = async (e) => {
      const file = e.target.files[0];
      if (file) {
          try {
              let compressedFile = file;
              // Only compress if it's an image
              if (file.type.startsWith('image/')) {
                  const options = {
                      maxSizeMB: 1,
                      maxWidthOrHeight: 1280,
                      useWebWorker: true
                  };
                  compressedFile = await imageCompression(file, options);
              }
              
              const reader = new FileReader();
              reader.onloadend = () => {
                  setForm(f => ({ ...f, photo: reader.result }));
              };
              reader.readAsDataURL(compressedFile);
          } catch (error) {
              console.error("Compression error:", error);
              addToast("Upload Failed", "Failed to compress media file.", "error");
          }
      }
  };

  const handleSubmit = async (e) => {
     e.preventDefault();
     const reportPayload = {
        title: form.title,
        category: form.category,
        location: form.location,
        coordinates: form.coordinates,
        severity: form.severity,
        reportedBy: form.reportedBy || form.submitterType,
        description: form.description,
        photo: form.photo,
        id: Date.now().toString()
     };

     if (!isOnline) {
         const newQueue = [...offlineQueue, reportPayload];
         await localforage.setItem('offlineReportsQueue', newQueue);
         setOfflineQueue(newQueue);
         addToast("Saved Offline", "You are offline. Report queued for sync.", "warning");
     } else {
         addReportedSection(reportPayload);
         addToast("Report Submitted", "Your field report was successfully submitted.", "success");
     }

     // Reset
     setForm({ title: "Slope Movement", category: "Slope Movement", location: "", coordinates: null, severity: "HIGH", reportedBy: "", submitterType: "Field Official", description: "", photo: null });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Field Incident Reporting & Review Queue
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Submit geo-tagged field reports and manage verification status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isOnline && (
            <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2">
              <WifiOff className="w-4 h-4" /> Offline Mode ({offlineQueue.length} queued)
            </div>
          )}
          <button onClick={handleExportCsv} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-colors">
            <Download className="w-4 h-4" /> Export CSV Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Form Section */}
         <div className="lg:col-span-5 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl h-fit">
            <h3 className="text-base font-bold text-white mb-4">Submit Field Report</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="text-xs font-semibold text-slate-300 block mb-1">Category / Title</label>
                 <select required value={form.category} onChange={e => setForm({...form, category: e.target.value, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none">
                    <option>Slope Movement</option>
                    <option>Soil Cracks</option>
                    <option>Blocked Road</option>
                    <option>Fallen Trees</option>
                    <option>Water Surge</option>
                    <option>Other</option>
                 </select>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-xs font-semibold text-slate-300 block mb-1">Submitter Type</label>
                     <select value={form.submitterType} onChange={e => setForm({...form, submitterType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none">
                        <option>Field Official</option>
                        <option>Citizen</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-xs font-semibold text-slate-300 block mb-1">Severity</label>
                     <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-xs font-semibold text-slate-300 block mb-1">Name (Opt)</label>
                     <input type="text" value={form.reportedBy} onChange={e => setForm({...form, reportedBy: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none" />
                   </div>
               </div>

               <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Location / GPS</label>
                  <div className="flex gap-2 mb-2">
                     <input type="text" required placeholder="Description or coords..." value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none" />
                     <button type="button" onClick={handleCaptureGPS} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300 flex items-center gap-1 shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {isLocating ? 'Locating...' : 'GPS'}
                     </button>
                  </div>
                  <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-800 relative z-0">
                     <MapContainer center={[25.268, 91.738]} zoom={11} scrollWheelZoom={false} className="h-full w-full">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                        <LocationMarker setForm={setForm} />
                     </MapContainer>
                     <div className="absolute top-1 left-1 z-[1000] bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-[10px] text-slate-300 pointer-events-none">Click map to drop pin</div>
                  </div>
               </div>

               <div>
                 <label className="text-xs font-semibold text-slate-300 block mb-1">Photo / Video Evidence</label>
                 <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-800 border-dashed rounded-xl cursor-pointer bg-slate-950 hover:bg-slate-900/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-6 h-6 text-slate-500 mb-2" />
                            <p className="text-[10px] text-slate-400">Click to upload file</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handlePhotoUpload} />
                    </label>
                 </div>
                 {form.photo && <div className="mt-2 text-[10px] text-emerald-400 font-bold">File attached.</div>}
               </div>

               <div>
                 <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Notes</label>
                 <textarea required rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"></textarea>
               </div>
               
               <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50">
                  Submit Field Report
               </button>
            </form>
         </div>

         {/* Queue Section */}
         <div className="lg:col-span-7 flex flex-col space-y-4">
            <h3 className="text-base font-bold text-white px-2">Admin Review Queue</h3>
            <div className="space-y-3">
               {reports.map((rep) => (
                  <div key={rep.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row justify-between gap-4 shadow-lg">
                     <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                           <h4 className="font-bold text-white text-sm">{rep.title}</h4>
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rep.status === 'New' ? 'bg-blue-500/20 text-blue-400' : rep.status === 'Under Review' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {rep.status}
                           </span>
                           {rep.photo && <Camera className="w-3.5 h-3.5 text-slate-400" title="Photo attached" />}
                        </div>
                        <p className="text-slate-400 text-[11px] font-mono">{rep.location} • By: {rep.reportedBy}</p>
                        <p className="text-slate-300 text-xs mt-2 bg-slate-950 p-2 rounded-lg border border-slate-800/50">{rep.description}</p>
                     </div>
                     <div className="flex flex-col gap-2 shrink-0">
                        {rep.status === 'New' && (
                           <button onClick={() => updateReportStatus(rep.id, 'Under Review')} className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-semibold hover:bg-amber-500/30">
                              Mark Under Review
                           </button>
                        )}
                        {(rep.status === 'New' || rep.status === 'Under Review') && (
                           <button onClick={() => updateReportStatus(rep.id, 'Resolved')} className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 border border-emerald-500/30">
                              Verify & Resolve
                           </button>
                        )}
                     </div>
                  </div>
               ))}
               {reports.length === 0 && <div className="text-center text-slate-500 py-10">No reports found.</div>}
            </div>
         </div>
      </div>
    </div>
  );
};
