import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import {
  LayoutDashboard,
  Radio,
  BrainCircuit,
  LineChart,
  FileText,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Trees,
  Bell,
  CloudSun,
} from "lucide-react";

export const Sidebar = () => {
  const { activePage, setActivePage, lastRefreshedAt, computedRisk } = useApp();
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: "home", label: t("Command Center", "Command Center"), icon: LayoutDashboard },
    { id: "nodes", label: t("Field Sensors", "Field Sensors"), icon: Radio },
    { id: "ml-predictions", label: t("Risk Analysis", "Risk Analysis"), icon: BrainCircuit },
    { id: "api-data", label: t("Environmental Data", "Environmental Data"), icon: CloudSun },
    { id: "analytics", label: t("Trends & History", "Trends & History"), icon: LineChart },
    { id: "alerts", label: t("Alerts & Advisories", "Alerts & Advisories"), icon: Bell },
    { id: "reports", label: t("Field Reports", "Field Reports"), icon: FileText },
    { id: "hazards", label: t("Hazard & Terrain", "Hazard & Terrain"), icon: ShieldAlert },
    { id: "settings", label: t("System Settings", "System Settings"), icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between bg-slate-900 border-r border-slate-800 transition-all duration-300 z-30 ${
        collapsed ? "w-20" : "w-64"
      } hidden md:flex min-h-screen shrink-0`}
    >
      {/* Sidebar Header */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50 shrink-0">
              <Trees className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="font-bold text-lg text-white leading-tight tracking-tight">{t("EcoWatch NER")}</h1>
                <p className="text-[10px] text-blue-400 font-medium tracking-wide uppercase truncate">
                  {t("Disaster Risk Decision Support")}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600/90 to-blue-700/90 text-white shadow-md shadow-blue-900/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
                title={collapsed ? item.label : ""}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"}`} />
                {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer — Status Indicator */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                <span className="text-xs font-semibold text-indigo-400">{t("System Online", "System Online")}</span>
              </div>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Last Sync:</span>
                <span className="text-slate-200 font-mono">{lastRefreshedAt}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Env Status:</span>
                <span
                  className={`font-semibold ${
                    computedRisk.overallLevel === "CRITICAL" || computedRisk.overallLevel === "HIGH"
                      ? "text-red-400"
                      : computedRisk.overallLevel === "MODERATE"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {t(computedRisk.overallLevel)} RISK
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded px-2 py-1 mt-2">
                <span className="text-[10px] text-slate-400 font-bold">LANG</span>
                <select 
                    value={i18n.language} 
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    className="bg-transparent text-[10px] text-white font-bold outline-none cursor-pointer"
                >
                    <option value="en" className="bg-slate-900">EN</option>
                    <option value="hi" className="bg-slate-900">HI</option>
                    <option value="as" className="bg-slate-900">AS</option>
                </select>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2" title="System Online">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
};
