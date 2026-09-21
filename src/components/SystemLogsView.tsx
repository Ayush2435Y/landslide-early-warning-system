import React, { useState, useEffect } from 'react';
import { Terminal, RefreshCw, Download, Filter, Trash2, CheckCircle } from 'lucide-react';

export const SystemLogsView: React.FC = () => {
  const [logs, setLogs] = useState<Array<{ id: string; time: string; level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'; node: string; message: string }>>([
    { id: '1', time: '12:02:14 UTC', level: 'SUCCESS', node: 'HQ-GATEWAY', message: 'Model calibration synchronized across 12 monitoring stations (RMSE = 0.042).' },
    { id: '2', time: '12:01:45 UTC', level: 'WARN', node: 'NODE-S07', message: 'Pore pressure exceeded threshold (68.2 kPa > 48.0 kPa) in East Siang District.' },
    { id: '3', time: '12:00:30 UTC', level: 'INFO', node: 'ESP32-MESH-4', message: 'Heartbeat received from Ziro Hill Station (RSSI: -64 dBm, Battery: 94%).' },
    { id: '4', time: '11:58:12 UTC', level: 'ERROR', node: 'SAT-RADAR', message: 'Doppler feed jitter compensated via edge inertial Kalman filter.' },
    { id: '5', time: '11:55:00 UTC', level: 'INFO', node: 'DISPATCH-AI', message: 'Automated SMS & Siren pre-alert armed for Pasighat sector.' },
  ]);

  const [filter, setFilter] = useState<string>('ALL');

  return (
    <div className="flex-1 bg-[#edf2f7] p-4 md:p-6 overflow-y-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">System Logs & Telemetry Stream</h2>
            <p className="text-xs text-slate-500">Real-time edge hardware, AI inference, and MQTT broker transaction records</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const newLog = {
                id: Date.now().toString(),
                time: `${new Date().toLocaleTimeString()} UTC`,
                level: 'INFO' as const,
                node: 'EDGE-HEARTBEAT',
                message: 'Live mesh heartbeat poll succeeded for all active nodes.',
              };
              setLogs((prev) => [newLog, ...prev]);
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll Telemetry</span>
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-[#080e22] text-slate-200 rounded-xl border border-slate-800 shadow-lg overflow-hidden font-mono text-xs">
        <div className="p-3 bg-[#060a19] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-[11px] text-slate-400">console://lews-ner-cluster.local:8080</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold animate-pulse">● LIVE STREAMING</span>
        </div>

        <div className="p-4 space-y-2.5 max-h-[500px] overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 hover:bg-slate-800/40 p-1 rounded transition-colors">
              <span className="text-slate-500 shrink-0 text-[11px]">{log.time}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                log.level === 'ERROR' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                log.level === 'WARN' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                log.level === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                'bg-blue-950 text-blue-400 border border-blue-800'
              }`}>
                {log.level}
              </span>
              <span className="text-slate-400 shrink-0">[{log.node}]</span>
              <span className="text-slate-300 flex-1 break-all">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
