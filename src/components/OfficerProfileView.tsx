import React, { useState } from 'react';
import { 
  User, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HardDrive, 
  Zap, 
  Shield, 
  Radio, 
  Database,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { FieldOfficerProfile } from '../types';

interface OfficerProfileViewProps {
  profile: FieldOfficerProfile;
  onForceSync: () => void;
  isSyncing: boolean;
  onTogglePolling: () => void;
}

export const OfficerProfileView: React.FC<OfficerProfileViewProps> = ({
  profile,
  onForceSync,
  isSyncing,
  onTogglePolling,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'device' | 'tasks'>('reports');
  const [cachedList, setCachedList] = useState(profile.cachedSectors);

  const toggleCacheSector = (index: number) => {
    setCachedList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, cached: !item.cached } : item))
    );
  };

  return (
    <div className="flex-1 bg-[#fcf8fa] overflow-y-auto p-4 md:p-8 min-h-screen pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Officer Card Header */}
        <div className="bg-white border border-[#c6c6cd] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-full border-2 border-[#131b2e] overflow-hidden bg-[#e4e2e4] shrink-0 shadow-md">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold text-[#1b1b1d]">{profile.name}</h1>
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-[#45464d] font-mono mt-1">
                ID: {profile.officerId} &bull; {profile.unit} &bull; {profile.sector}
              </p>
              <p className="text-xs text-[#76777d] mt-0.5">
                Lithos Mobile Unit &bull; Hardware Firmware v3.12-secure
              </p>
            </div>
          </div>

          {/* Force Sync Action */}
          <div className="flex flex-col items-center sm:items-end gap-1.5 w-full sm:w-auto">
            <button
              onClick={onForceSync}
              disabled={isSyncing}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#131b2e] hover:bg-black text-white font-label-caps text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#d3e4fe]' : ''}`} />
              <span>{isSyncing ? 'Synchronizing...' : 'Force Sync'}</span>
            </button>
            <span className="text-[11px] font-mono text-[#76777d]">
              Last Synced: {profile.lastSyncTime}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#c6c6cd] gap-2">
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 px-4 font-semibold text-xs transition-all relative ${
              activeTab === 'reports'
                ? 'text-[#1b1b1d] font-bold'
                : 'text-[#45464d] hover:text-[#1b1b1d]'
            }`}
          >
            Recently Submitted Reports
            {activeTab === 'reports' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#131b2e]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('device')}
            className={`pb-3 px-4 font-semibold text-xs transition-all relative ${
              activeTab === 'device'
                ? 'text-[#1b1b1d] font-bold'
                : 'text-[#45464d] hover:text-[#1b1b1d]'
            }`}
          >
            Device Settings & Cache
            {activeTab === 'device' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#131b2e]" />
            )}
          </button>
        </div>

        {/* Tab 1: Reports Content */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#c6c6cd] rounded-xl overflow-hidden shadow-xs divide-y divide-[#e4e2e4]">
              {/* Report 1 (Synced) */}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-[#1b1b1d]">
                    Piezometer Reading PZ-42
                  </h4>
                  <p className="text-xs text-[#76777d] font-mono mt-0.5">
                    Sector 7G &bull; Oct 24, 09:30 UTC &bull; Value: 36.4 kPa
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>SYNCED</span>
                </span>
              </div>

              {/* Report 2 (Pending) */}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-[#1b1b1d]">
                    Inclinometer Visual Check IN-12
                  </h4>
                  <p className="text-xs text-[#76777d] font-mono mt-0.5">
                    Retaining Wall South &bull; Oct 24, 08:15 UTC &bull; Observation Logged
                  </p>
                </div>
                <span className="bg-amber-100 text-amber-800 font-mono text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>PENDING SYNC</span>
                </span>
              </div>

              {/* Report 3 (Failed) */}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-[#1b1b1d]">
                    Structural Anomaly Report SA-99
                  </h4>
                  <p className="text-xs text-red-700 font-mono mt-0.5">
                    Sector Alpha &bull; Oct 23, 16:45 UTC &bull; Upload timed out
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-100 text-red-800 font-mono text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>FAILED</span>
                  </span>
                  <button
                    onClick={onForceSync}
                    className="p-1.5 hover:bg-[#e4e2e4] rounded text-[#131b2e]"
                    title="Retry Upload"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Device Settings & Cache */}
        {activeTab === 'device' && (
          <div className="space-y-6">
            {/* Offline Map Caching */}
            <div className="bg-white border border-[#c6c6cd] rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b border-[#c6c6cd] pb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#515f74]" />
                  <h3 className="font-bold text-sm text-[#1b1b1d]">Offline Map Caching</h3>
                </div>
                <span className="text-xs font-mono text-[#76777d]">Total: 1.13 GB cached</span>
              </div>

              <div className="space-y-3">
                {cachedList.map((sec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#f6f3f5] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={sec.cached}
                        onChange={() => toggleCacheSector(idx)}
                        className="w-4 h-4 text-[#131b2e] rounded border-gray-300 cursor-pointer"
                      />
                      <span className="font-semibold text-xs text-[#1b1b1d]">
                        {sec.name}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#45464d]">
                      {sec.sizeMb} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Power Management */}
            <div className="bg-white border border-[#c6c6cd] rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#1b1b1d] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>Power Management</span>
                  </h3>
                  <p className="text-xs text-[#45464d] mt-1">
                    Aggressive Polling increases sensor telemetry frequency from 60s to 5s.
                  </p>
                </div>

                <button
                  onClick={onTogglePolling}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    profile.aggressivePolling ? 'bg-[#131b2e]' : 'bg-[#c6c6cd]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      profile.aggressivePolling ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
