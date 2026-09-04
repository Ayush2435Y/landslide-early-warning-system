import React, { useState } from 'react';
import { 
  Radio, 
  AlertTriangle, 
  Brain, 
  Download, 
  CloudRain, 
  Droplets, 
  MoveUpRight, 
  Maximize2, 
  Plus, 
  Minus, 
  Crosshair, 
  ChevronDown,
  Sparkles,
  Layers,
  MapPin,
  TrendingUp,
  Activity
} from 'lucide-react';
import { AlertItem, SensorData, IncidentReport } from '../types';
import { DashboardRiskMap, NER_MAP_STATIONS } from './DashboardRiskMap';

interface DashboardViewProps {
  sensors: SensorData[];
  alerts: AlertItem[];
  reports: IncidentReport[];
  activeLayer?: string;
  onSelectLayer?: (layer: string) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
  onSelectSensor?: (sensor: SensorData) => void;
  onSelectReport?: (report: IncidentReport) => void;
  onNavigateToMetrics?: () => void;
  onNavigateToTelemetry?: () => void;
  onExportReport?: () => void;
  onViewAllAlerts?: () => void;
  onNavigateToMap?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sensors,
  alerts,
  reports,
  onSelectSensor,
  onSelectReport,
  onNavigateToMetrics,
  onNavigateToTelemetry,
  onExportReport,
  onViewAllAlerts,
  onNavigateToMap,
}) => {
  // Bar chart historical data points for the 3 live metrics
  const rainfallBars = [35, 42, 68, 55, 78, 62, 70, 85, 74, 60, 68, 72.4];
  const porePressureBars = [28, 30, 34, 38, 42, 45, 48, 50, 51, 52, 52.4, 52.6];
  const displacementBars = [1.2, 1.4, 1.8, 2.3, 3.1, 3.8, 4.4, 5.0, 5.5, 6.1, 6.5, 6.8];

  const handleExport = () => {
    if (onExportReport) {
      onExportReport();
    } else {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
        JSON.stringify({
          generatedAt: new Date().toISOString(),
          systemMetrics: {
            monitoringStations: 12,
            currentAlerts: 2,
            highRiskLocations: 3,
            systemAccuracy: '92.4%',
          },
          liveTelemetry: {
            rainfall: { current: '72.4 mm/hr', total24h: '136.8 mm', total3d: '278.4 mm' },
            porePressure: { current: '52.6 kPa', rate: '+2.3 kPa/hr' },
            displacement: { current: '6.8 mm', velocity: '1.2 mm/hr' }
          },
          aiRiskAssessment: {
            overallLevel: 'CRITICAL',
            riskScore: 0.87,
            confidence: '92.3%',
            factors: { rainfall: 0.28, porePressure: 0.26, displacement: 0.22, terrain: 0.08, other: 0.03 }
          },
          mapStations: NER_MAP_STATIONS,
        }, null, 2)
      );
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `landslide_early_warning_report_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  return (
    <div className="flex-1 bg-[#edf2f7] p-4 md:p-6 overflow-y-auto space-y-5">
      {/* ========================================================================= */}
      {/* TOP ROW: 4 STAT CARDS + EXPORT REPORT BUTTON                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* 4 Key Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
          {/* Card 1: Monitoring Stations */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Monitoring Stations</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">12</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-slate-500">Active Stations</span>
                </div>
              </div>
            </div>
            {/* Mini Green Sparkline */}
            <div className="w-16 h-8 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 24">
                <path
                  d="M0 18 Q 15 20, 25 10 T 45 14 T 60 4"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 2: Current Alerts */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-amber-100/70 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Current Alerts</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">2</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-slate-500">Warning</span>
                </div>
              </div>
            </div>
            {/* Mini Orange Sparkline */}
            <div className="w-16 h-8 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 24">
                <path
                  d="M0 16 Q 15 12, 30 18 T 50 8 T 60 6"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 3: High Risk Locations */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-rose-100/70 text-rose-500 flex items-center justify-center shrink-0">
                <div className="relative">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">High Risk Locations</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">3</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-slate-500">Critical</span>
                </div>
              </div>
            </div>
            {/* Mini Red Sparkline */}
            <div className="w-16 h-8 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 24">
                <path
                  d="M0 20 Q 20 18, 35 12 T 50 16 T 60 2"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 4: System Accuracy */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-blue-100/70 text-blue-500 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">System Accuracy</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">92.4%</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-slate-500">AI Model</span>
                </div>
              </div>
            </div>
            {/* Mini Blue Sparkline */}
            <div className="w-16 h-8 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 60 24">
                <path
                  d="M0 16 Q 15 20, 30 10 T 50 14 T 60 6"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Top Right Action: Export Report Button */}
        <div className="shrink-0 flex items-center">
          <button
            onClick={handleExport}
            className="w-full sm:w-auto bg-[#00b894] hover:bg-[#00a383] text-white font-semibold px-4 py-2.5 rounded-lg text-xs md:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: LIVE MONITORING METRICS (LEFT) & RISK MAP (RIGHT)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Live Monitoring Card (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          {/* Card Header (Dark Navy) */}
          <div className="bg-[#0a1128] text-white px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wide">Live Monitoring</h2>
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live</span>
            </div>
          </div>

          {/* Card Body: 3 Metric Columns */}
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            {/* Metric 1: Rainfall Intensity */}
            <div className="flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 flex items-center justify-center">
                    <CloudRain className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Rainfall Intensity</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-emerald-600 tracking-tight">72.4</span>
                  <span className="text-xs text-slate-500 font-medium">mm/hr</span>
                </div>
                <span className="inline-block text-[11px] font-medium text-slate-500 mb-3">Heavy Rain</span>

                <div className="space-y-1 text-xs text-slate-600 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">24h Total</span>
                    <span className="font-semibold text-slate-800">136.8 mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">3d Total</span>
                    <span className="font-semibold text-slate-800">278.4 mm</span>
                  </div>
                </div>
              </div>

              {/* Rainfall Bar Chart */}
              <div className="mt-3 pt-2">
                <div className="h-16 flex items-end justify-between gap-1">
                  {rainfallBars.map((val, idx) => {
                    const heightPct = Math.min(100, Math.max(15, (val / 90) * 100));
                    return (
                      <div key={idx} className="flex-1 bg-blue-100 rounded-t-xs hover:bg-blue-300 transition-colors relative group">
                        <div 
                          className="w-full bg-[#3b82f6] rounded-t-xs" 
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                  <span>-24h</span>
                  <span>-18h</span>
                  <span>-12h</span>
                  <span>-6h</span>
                  <span>Now</span>
                </div>
              </div>
            </div>

            {/* Metric 2: Pore Pressure */}
            <div className="flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Pore Pressure</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-amber-500 tracking-tight">52.6</span>
                  <span className="text-xs text-slate-500 font-medium">kPa</span>
                </div>
                <span className="inline-block text-[11px] font-medium text-slate-500 mb-3">High</span>

                <div className="space-y-1 text-xs text-slate-600 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Trend</span>
                    <span className="font-semibold text-rose-600 flex items-center gap-0.5">Rising ↗</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Rate</span>
                    <span className="font-semibold text-slate-800">+2.3 kPa/hr</span>
                  </div>
                </div>
              </div>

              {/* Pore Pressure Bar Chart */}
              <div className="mt-3 pt-2">
                <div className="h-16 flex items-end justify-between gap-1">
                  {porePressureBars.map((val, idx) => {
                    const heightPct = Math.min(100, Math.max(15, (val / 60) * 100));
                    return (
                      <div key={idx} className="flex-1 bg-amber-100 rounded-t-xs hover:bg-amber-300 transition-colors relative group">
                        <div 
                          className="w-full bg-[#f59e0b] rounded-t-xs" 
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                  <span>-24h</span>
                  <span>-18h</span>
                  <span>-12h</span>
                  <span>-6h</span>
                  <span>Now</span>
                </div>
              </div>
            </div>

            {/* Metric 3: Ground Displacement */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                    <MoveUpRight className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Ground Displacement</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-rose-500 tracking-tight">6.8</span>
                  <span className="text-xs text-slate-500 font-medium">mm</span>
                </div>
                <span className="inline-block text-[11px] font-medium text-slate-500 mb-3">Movement Detected</span>

                <div className="space-y-1 text-xs text-slate-600 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Trend</span>
                    <span className="font-semibold text-rose-600 flex items-center gap-0.5">Accelerating ↗</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Velocity</span>
                    <span className="font-semibold text-slate-800">1.2 mm/hr</span>
                  </div>
                </div>
              </div>

              {/* Ground Displacement Bar Chart */}
              <div className="mt-3 pt-2">
                <div className="h-16 flex items-end justify-between gap-1">
                  {displacementBars.map((val, idx) => {
                    const heightPct = Math.min(100, Math.max(15, (val / 8) * 100));
                    return (
                      <div key={idx} className="flex-1 bg-purple-100 rounded-t-xs hover:bg-purple-300 transition-colors relative group">
                        <div 
                          className="w-full bg-[#8b5cf6] rounded-t-xs" 
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                  <span>-24h</span>
                  <span>-18h</span>
                  <span>-12h</span>
                  <span>-6h</span>
                  <span>Now</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real North East Region Google Risk Map Card (6 cols) */}
        <DashboardRiskMap 
          onNavigateToFullMap={onNavigateToMap} 
          className="lg:col-span-6" 
        />
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: AI RISK ASSESSMENT (LEFT) & RECENT ALERTS (RIGHT)                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: AI Risk Assessment Card (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          {/* Card Header (Dark Navy) */}
          <div className="bg-[#0a1128] text-white px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wide">AI Risk Assessment</h2>
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live</span>
            </div>
          </div>

          {/* Card Body: 2 Sub-panels (Overall Risk Level & Risk Factors Contribution) */}
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* Left Sub-panel: Overall Risk Level */}
            <div className="flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-4">
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2.5">Overall Risk Level</p>
                
                {/* Big Red Critical Banner */}
                <div className="bg-[#d63031] text-white rounded-lg p-3.5 text-center shadow-xs mb-4">
                  <p className="text-xl font-black tracking-wider uppercase">CRITICAL</p>
                  <p className="text-xs font-normal text-white/95 mt-0.5">Landslide probability is very high</p>
                </div>

                {/* Metric Summary Rows */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Risk Score</span>
                    <span className="font-bold text-slate-900 font-mono">0.87 / 1.00</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Confidence</span>
                    <span className="font-bold text-slate-900 font-mono">92.3%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-medium">Last Updated</span>
                    <span className="font-medium text-slate-600 font-mono">2 min ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sub-panel: Risk Factors Contribution */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Risk Factors Contribution</p>
                
                <div className="flex items-center gap-4">
                  {/* Circular Donut Chart */}
                  <div className="relative w-28 h-28 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      {/* Background Ring */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
                      {/* Rainfall: 30% -> Blue */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="26.4 100" strokeDashoffset="0" />
                      {/* Pore Pressure: 30% -> Orange */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="26.4 100" strokeDashoffset="-26.4" />
                      {/* Displacement: 25% -> Purple */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#8b5cf6" strokeWidth="4.5" strokeDasharray="22 100" strokeDashoffset="-52.8" />
                      {/* Terrain: 10% -> Teal */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4.5" strokeDasharray="8.8 100" strokeDashoffset="-74.8" />
                      {/* Other: 5% -> Gray */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#94a3b8" strokeWidth="4.5" strokeDasharray="4.4 100" strokeDashoffset="-83.6" />
                    </svg>
                    {/* Donut Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-base font-bold text-slate-900 font-mono leading-none">0.87</span>
                      <span className="text-[9px] text-slate-400 font-medium">Risk Score</span>
                    </div>
                  </div>

                  {/* Factor Breakdown Legend with Values */}
                  <div className="space-y-1 text-[11px] flex-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                        <span className="text-slate-600">Rainfall (30%)</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800">0.28</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                        <span className="text-slate-600">Pore Pressure (30%)</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800">0.26</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                        <span className="text-slate-600">Displacement (25%)</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800">0.22</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                        <span className="text-slate-600">Terrain (10%)</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800">0.08</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#94a3b8]" />
                        <span className="text-slate-600">Other Factors (5%)</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800">0.03</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Recent Alerts Card (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          {/* Card Header (Dark Navy) */}
          <div className="bg-[#0a1128] text-white px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wide">Recent Alerts</h2>
            <button
              onClick={onViewAllAlerts}
              className="text-xs text-slate-300 hover:text-white transition-colors"
            >
              View All
            </button>
          </div>

          {/* Card Body: 2 Key Alert Rows */}
          <div className="p-4 divide-y divide-slate-100 flex flex-col justify-between flex-1 gap-3">
            {/* Alert Item 1: Critical */}
            <div className="flex items-start gap-3.5 pt-1 pb-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 fill-rose-600 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-bold text-rose-600">Critical Risk Alert</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">2 min ago</span>
                    <span className="bg-rose-100 text-rose-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md">
                      CRITICAL
                    </span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Station: S-07 | East Siang District, Arunachal Pradesh
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  High probability of landslide in the next 2-6 hours.
                </p>
              </div>
            </div>

            {/* Alert Item 2: Warning */}
            <div className="flex items-start gap-3.5 pt-3 pb-1">
              <div className="w-9 h-9 rounded-lg bg-amber-100/80 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 fill-amber-500 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-bold text-amber-600">Warning Alert</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">15 min ago</span>
                    <span className="bg-amber-100 text-amber-800 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md">
                      WARNING
                    </span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Station: S-03 | West Jaintia Hills, Meghalaya
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Increased landslide probability due to heavy rainfall.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
