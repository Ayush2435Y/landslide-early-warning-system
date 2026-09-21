import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  Filter, 
  Search, 
  Eye, 
  ChevronRight 
} from 'lucide-react';
import { AlertItem } from '../types';

interface AlertsListViewProps {
  alerts: AlertItem[];
  onAcknowledgeAlert: (id: string) => void;
  onOpenEmergency: () => void;
}

export const AlertsListView: React.FC<AlertsListViewProps> = ({
  alerts,
  onAcknowledgeAlert,
  onOpenEmergency,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'nominal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = alerts.filter((a) => {
    const matchSev = filterSeverity === 'all' || a.severity === filterSeverity;
    const matchSearch = (a.title + a.message + a.area).toLowerCase().includes(searchQuery.toLowerCase());
    return matchSev && matchSearch;
  });

  return (
    <div className="flex-1 bg-[#edf2f7] p-4 md:p-6 overflow-y-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Active Geotechnical & Weather Alerts</h2>
          <p className="text-xs text-slate-500">Real-time alert dispatch queue for North-Eastern Region monitoring stations</p>
        </div>
        <button
          onClick={onOpenEmergency}
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-xs transition-colors"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Broadcast Protocol</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search alerts by station, district, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['all', 'critical', 'warning', 'nominal'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterSeverity === sev
                  ? 'bg-[#0a1128] text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          const isCritical = alert.severity === 'critical';
          const isWarning = alert.severity === 'warning';

          return (
            <div 
              key={alert.id} 
              className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                alert.acknowledged ? 'opacity-70 border-slate-200' : isCritical ? 'border-rose-300 ring-1 ring-rose-200' : 'border-amber-300'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isCritical ? 'bg-rose-100 text-rose-600' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                      isCritical ? 'bg-rose-100 text-rose-700' : isWarning ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.severity}
                    </span>
                    {alert.acknowledged && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-md">
                        ACKNOWLEDGED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{alert.message}</p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 font-sans text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {alert.area}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {alert.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {!alert.acknowledged && (
                  <button
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="px-3.5 py-1.5 bg-[#00b894] hover:bg-[#00a383] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Acknowledge</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
