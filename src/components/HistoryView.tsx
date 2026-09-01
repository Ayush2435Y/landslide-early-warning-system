import React, { useState } from 'react';
import { 
  History, 
  Calendar, 
  Download, 
  TrendingUp, 
  Search, 
  Layers, 
  ChevronRight,
  Database
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');

  const historicalEvents = [
    {
      id: 'HE-2024-08',
      date: 'Aug 24, 2024',
      location: 'Pasighat, East Siang (Arunachal Pradesh)',
      severity: 'Critical Slide',
      rainfall: '312 mm / 48h',
      displacement: '18.4 mm',
      status: 'Stabilized',
      evacuated: '140 residents',
    },
    {
      id: 'HE-2024-07',
      date: 'Jul 12, 2024',
      location: 'Paglapahar NH-29 (Nagaland)',
      severity: 'Debris Flow',
      rainfall: '240 mm / 24h',
      displacement: '12.1 mm',
      status: 'Road Cleared',
      evacuated: 'Highway Closed',
    },
    {
      id: 'HE-2024-06',
      date: 'Jun 19, 2024',
      location: 'Mawkdok Bridge, Sohra (Meghalaya)',
      severity: 'Slope Creep',
      rainfall: '480 mm / 72h',
      displacement: '8.2 mm',
      status: 'Reinforced',
      evacuated: 'N/A',
    },
    {
      id: 'HE-2024-05',
      date: 'May 28, 2024',
      location: 'Kurung Kumey Sector (Arunachal Pradesh)',
      severity: 'Flash Mudflow',
      rainfall: '190 mm / 24h',
      displacement: '14.0 mm',
      status: 'Restored',
      evacuated: '35 families',
    },
  ];

  return (
    <div className="flex-1 bg-[#edf2f7] p-4 md:p-6 overflow-y-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Historical Landslide Records & Telemetry Archive</h2>
          <p className="text-xs text-slate-500">Long-term geotechnical rupture database across the 8 North-Eastern states</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-700 font-medium cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last Quarter</option>
            <option value="1y">Last Year</option>
            <option value="all">Full Record (2020-2024)</option>
          </select>
          <button className="bg-[#00b894] hover:bg-[#00a383] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>Export Archive</span>
          </button>
        </div>
      </div>

      {/* Historical Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Recorded Rupture Events & Field Interventions</h3>
          <span className="text-xs text-slate-500 font-mono">4 Major Events Logged</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="p-3.5">Record ID</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">24h/48h Rainfall</th>
                <th className="p-3.5">Displacement</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Impact / Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {historicalEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-900">{ev.id}</td>
                  <td className="p-3.5 whitespace-nowrap">{ev.date}</td>
                  <td className="p-3.5 font-medium text-slate-900">{ev.location}</td>
                  <td className="p-3.5">
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase">
                      {ev.severity}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono">{ev.rainfall}</td>
                  <td className="p-3.5 font-mono font-bold text-rose-600">{ev.displacement}</td>
                  <td className="p-3.5">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-medium text-[10px]">
                      {ev.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500">{ev.evacuated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
