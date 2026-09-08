import React, { useState } from 'react';
import { 
  Radio, 
  AlertTriangle, 
  ShieldCheck, 
  MapPin, 
  CloudRain, 
  FileText, 
  Sparkles, 
  PhoneCall, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink,
  ShieldAlert,
  Info,
  Clock,
  Compass,
  Lock,
  ChevronRight,
  HelpCircle,
  Activity,
  HeartPulse,
  Eye
} from 'lucide-react';
import { AlertItem, IncidentReport, AuthenticatedUser } from '../types';
import { BhumiRakshakLogo } from './BhumiRakshakLogo';

interface CitizenDashboardViewProps {
  currentUser: AuthenticatedUser | null;
  alerts: AlertItem[];
  reports: IncidentReport[];
  onOpenNewIncident: () => void;
  onOpenCitizenGuide: () => void;
  onOpenAuthModal?: (mode?: 'user' | 'admin') => void;
  onShowToast: (msg: string) => void;
  onSwitchToAdminLogin: () => void;
}

export const CitizenDashboardView: React.FC<CitizenDashboardViewProps> = ({
  currentUser,
  alerts,
  reports,
  onOpenNewIncident,
  onOpenCitizenGuide,
  onOpenAuthModal,
  onShowToast,
  onSwitchToAdminLogin,
}) => {
  const [selectedCorridor, setSelectedCorridor] = useState<string>('all');

  // Corridors data for public safety
  const civicCorridors = [
    {
      id: 'ghy',
      name: 'Guwahati Hills (Kamrup)',
      state: 'Assam',
      status: 'Warning',
      color: 'text-amber-700 bg-amber-50 border-amber-300',
      badge: 'Level 2: Warning',
      rain: '48 mm / 24h',
      advice: 'Avoid cut-slope footpaths near Kharghuli & Narakasur Hills. Check retaining wall weep holes.',
      travelStatus: 'Caution Advised',
    },
    {
      id: 'nh29',
      name: 'Paglapahar Corridor (NH-29)',
      state: 'Nagaland',
      status: 'Critical',
      color: 'text-rose-700 bg-rose-50 border-rose-300',
      badge: 'Level 3: Danger',
      rain: '78 mm / 24h',
      advice: 'Active debris slide risk on valley bends. Non-essential travel prohibited by district administration.',
      travelStatus: 'Restricted / High Risk',
    },
    {
      id: 'haflong',
      name: 'Haflong Valley & Jatinga',
      state: 'Assam',
      status: 'Watch',
      color: 'text-yellow-700 bg-yellow-50 border-yellow-300',
      badge: 'Level 1: Watch',
      rain: '26 mm / 24h',
      advice: 'Moderate waterlogging near railway culverts. Ground movement nominal at present.',
      travelStatus: 'Normal with Watch',
    },
    {
      id: 'shillong',
      name: 'Shillong Bypass & Ridge',
      state: 'Meghalaya',
      status: 'Safe',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
      badge: 'Level 0: Safe',
      rain: '14 mm / 24h',
      advice: 'Bedrock stable, road drainage flowing clear. Routine vigilance during rain showers.',
      travelStatus: 'Clear',
    },
  ];

  const filteredCorridors = selectedCorridor === 'all' 
    ? civicCorridors 
    : civicCorridors.filter(c => c.id === selectedCorridor);

  // Active public emergency alerts
  const activeCriticalAlerts = alerts.filter(a => a.severity === 'critical');

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
      {/* 1. Citizen Welcome & Civic Status Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shrink-0 shadow-md">
            <BhumiRakshakLogo className="w-10 h-10" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                Civilian Account • Designated Citizen Dashboard
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                NER Community Protection Portal
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome, {currentUser?.name || 'Citizen'}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Official public landslide warning bulletins, regional road safety advisories, and neighborhood hazard reporting for the North-Eastern Region of India.
            </p>
          </div>
        </div>

        {/* Quick Citizen Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenNewIncident}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Report Ground Crack / Slide</span>
          </button>

          <button
            onClick={onOpenCitizenGuide}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Citizen Safety Guide</span>
          </button>
        </div>
      </div>

      {/* 2. Admin Feature Restriction Banner */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-amber-950 block">
              Civilian Role Active — Administrator Features Restricted
            </span>
            <span className="text-amber-800 text-[11px]">
              Admin Dashboard, Sensor Data Telemetry, System Engineering Logs, and Configuration tools require Administrator authentication.
            </span>
          </div>
        </div>

        <button
          onClick={onSwitchToAdminLogin}
          className="self-start md:self-auto px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Administrator Sign In</span>
        </button>
      </div>

      {/* 3. Overall Community Hazard Status & Emergency Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Hazard Outlook & Sector Safety */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Civic Risk Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Regional Landslide Early Warning
                </span>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Current Civic Safety Status:</span>
                  <span className="text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-lg text-sm font-bold border border-amber-200">
                    Level 2: Warning
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Updated: Just now</span>
              </div>
            </div>

            {/* Plain-Language Explanation */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>What This Means For Your Community:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Prolonged monsoon rain over the past 48 hours has waterlogged hillside topsoil across parts of Kamrup, Dima Hasao, and Kohima corridors. Hillside soils are heavy with soaked moisture, weakening their grip on bedrock slopes. Citizens should avoid building excavations and report new soil cracks immediately.
              </p>
            </div>

            {/* 4 Citizen Safety Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Monsoon Rain</span>
                <span className="text-base font-bold text-slate-900 block mt-0.5">Heavy (48mm)</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded mt-1 inline-block">Elevated</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Soil Water Soak</span>
                <span className="text-base font-bold text-slate-900 block mt-0.5">82% Soaked</span>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded mt-1 inline-block">High Saturation</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Slope Movement</span>
                <span className="text-base font-bold text-slate-900 block mt-0.5">Minor Creep</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded mt-1 inline-block">Watch Slopes</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Road Transit</span>
                <span className="text-base font-bold text-slate-900 block mt-0.5">Caution Active</span>
                <span className="text-[10px] font-bold text-yellow-800 bg-yellow-100 px-1.5 py-0.2 rounded mt-1 inline-block">Drive Alert</span>
              </div>
            </div>
          </div>

          {/* Regional Sector Safety Board */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Regional Highway & Neighborhood Safety Status
                </h3>
                <p className="text-xs text-slate-500">
                  Live safety advisories across key transit corridors and residential hills
                </p>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setSelectedCorridor('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${selectedCorridor === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  All Sectors
                </button>
                <button
                  onClick={() => setSelectedCorridor('ghy')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${selectedCorridor === 'ghy' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Guwahati
                </button>
                <button
                  onClick={() => setSelectedCorridor('nh29')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${selectedCorridor === 'nh29' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  NH-29
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredCorridors.map((c) => (
                <div 
                  key={c.id} 
                  className={`p-4 rounded-2xl border ${c.color} transition-all space-y-2`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">{c.state}</span>
                      <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 border shadow-2xs">
                      {c.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-snug">
                    {c.advice}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">Rainfall: {c.rain}</span>
                    <span className="font-bold text-slate-800">{c.travelStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Problem Reports Noticeboard */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Community Hazard Reports (Resident Submissions)
                </h3>
                <p className="text-xs text-slate-500">
                  Recent observations reported by citizens and local observers
                </p>
              </div>

              <button
                onClick={onOpenNewIncident}
                className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Submit New Report</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {reports.slice(0, 3).map((rpt) => (
                <div 
                  key={rpt.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{rpt.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rpt.severity === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rpt.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-1 text-[11px]">
                      {rpt.description || 'Observed ground settlement and hillside surface cracks.'}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {rpt.locationName}
                      </span>
                      <span>&bull;</span>
                      <span>Submitted by: {rpt.submittedBy}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                      {rpt.status === 'dispatched' ? 'Team Dispatched' : 'Logged with HQ'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Helplines, Citizen Guide, & Admin Access */}
        <div className="lg:col-span-4 space-y-6">
          {/* Emergency Helpline Directory Card */}
          <div className="bg-gradient-to-br from-[#0c1836] to-[#080f24] text-white rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Emergency Public Helplines</h3>
                <p className="text-[11px] text-slate-400">24x7 North-East Disaster Response</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px]">State Disaster Response (SDRF)</span>
                  <span className="font-bold text-white text-sm">1070</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  Toll Free
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px]">National Emergency Response</span>
                  <span className="font-bold text-white text-sm">112</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  Police & Fire
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px]">Medical Ambulance</span>
                  <span className="font-bold text-white text-sm">108</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  Medical
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px]">Highway SOS Assistance</span>
                  <span className="font-bold text-white text-sm">1033</span>
                </div>
                <span className="text-[11px] font-semibold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30">
                  NHAI SOS
                </span>
              </div>
            </div>
          </div>

          {/* Citizen Landslide Signs Guide Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Early Warning Signs Checklist
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              If you notice any of these signs on your property or road, move to higher, stable ground and report immediately:
            </p>

            <ul className="text-xs text-slate-700 space-y-2.5">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Doors or windows sticking or jamming for the first time.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>New cracks appearing in plaster, tile, brick, or foundations.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Telephone poles, fences, or trees tilting uphill or downhill.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Water suddenly bursting through the ground in new locations.</span>
              </li>
            </ul>

            <button
              onClick={onOpenCitizenGuide}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-emerald-200 flex items-center justify-center gap-1.5"
            >
              <span>Open Detailed Citizen Guide</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Administrator Login & Clearance Boundary Box */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-4 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">GSI Administrator Access</h3>
                <p className="text-[11px] text-slate-400">Official Directorate Terminal</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you an authorized Geological Survey of India (GSI) officer, field geologist, or system administrator? Sign in to unlock:
            </p>

            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Admin Dashboard & User Session Audits</li>
              <li>Real-Time Sensor Telemetry & Inclinometer Data</li>
              <li>Raw System Diagnostics & Edge Logs</li>
              <li>GIS Projection & Threshold Configuration</li>
            </ul>

            <button
              onClick={onSwitchToAdminLogin}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Authenticate as Administrator</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
