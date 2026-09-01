import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Globe, 
  Bell, 
  Sliders, 
  Layers, 
  HardDrive, 
  Radio, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Check, 
  RotateCcw,
  Zap,
  Database,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
  CheckCircle2
} from 'lucide-react';
import { OfflineStorageStats } from '../utils/offlineStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings?: (settings: any) => void;
  isAdmin: boolean;
  onToggleAdmin: (isAdmin: boolean) => void;
  cacheStats?: OfflineStorageStats;
  lastCachedAt?: string | null;
  isSimulatedOffline?: boolean;
  onToggleSimulatedOffline?: () => void;
  onForceCache?: () => void;
  onClearCache?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSaveSettings,
  isAdmin,
  onToggleAdmin,
  cacheStats,
  lastCachedAt,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  onForceCache,
  onClearCache,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'gis' | 'telemetry' | 'alerts' | 'storage'>('general');
  const [cacheActionMsg, setCacheActionMsg] = useState<string | null>(null);

  
  // Settings state
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [crs, setCrs] = useState<string>('EPSG:4326');
  const [pollingRate, setPollingRate] = useState<number>(10);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoEvacWarning, setAutoEvacWarning] = useState<boolean>(true);
  const [demResolution, setDemResolution] = useState<'high' | 'medium' | 'low'>('high');
  const [highRiskThreshold, setHighRiskThreshold] = useState<number>(75);
  const [offlineCacheEnabled, setOfflineCacheEnabled] = useState<boolean>(true);
  const [satelliteProvider, setSatelliteProvider] = useState<'google' | 'usgs' | 'sentinel'>('google');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSavedSuccess(true);
    if (onSaveSettings) {
      onSaveSettings({
        units,
        crs,
        pollingRate,
        soundEnabled,
        autoEvacWarning,
        demResolution,
        highRiskThreshold,
        offlineCacheEnabled,
        satelliteProvider,
      });
    }
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetDefaults = () => {
    setUnits('metric');
    setCrs('EPSG:4326');
    setPollingRate(10);
    setSoundEnabled(true);
    setAutoEvacWarning(true);
    setDemResolution('high');
    setHighRiskThreshold(75);
    setOfflineCacheEnabled(true);
    setSatelliteProvider('google');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fcf8fa] w-full max-w-2xl rounded-2xl border border-[#c6c6cd] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#c6c6cd] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#131b2e] flex items-center justify-center text-white shadow-xs">
              <Settings className="w-5 h-5 text-[#d3e4fe]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1b1b1d]">System & GIS Settings</h2>
              <p className="text-xs text-[#57657b]">Configure coordinate systems, units, alert thresholds & telemetry</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-[#76777d] hover:bg-[#e4e2e4] hover:text-[#1b1b1d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Tab Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Settings Tabs Sidebar */}
          <div className="w-48 bg-[#f0edef] border-r border-[#c6c6cd] p-3 flex flex-col gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'general'
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-[#45464d] hover:bg-white/60'
              }`}
            >
              <Sliders className="w-4 h-4 text-[#131b2e]" />
              <span>General</span>
            </button>

            <button
              onClick={() => setActiveTab('gis')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'gis'
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-[#45464d] hover:bg-white/60'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-700" />
              <span>GIS & Geodetic</span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'telemetry'
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-[#45464d] hover:bg-white/60'
              }`}
            >
              <Radio className="w-4 h-4 text-blue-700" />
              <span>Telemetry & LoRa</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'alerts'
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-[#45464d] hover:bg-white/60'
              }`}
            >
              <Bell className="w-4 h-4 text-red-600" />
              <span>Alert Thresholds</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'storage'
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-[#45464d] hover:bg-white/60'
              }`}
            >
              <HardDrive className="w-4 h-4 text-purple-700" />
              <span>Cache & Offline</span>
            </button>

            {/* Quick Admin Toggle Box inside Settings */}
            <div className="mt-auto pt-3 border-t border-[#c6c6cd]">
              <div className="bg-white p-2.5 rounded-xl border border-[#c6c6cd] shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-gray-800">Admin Mode</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                    {isAdmin ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
                <button
                  onClick={() => onToggleAdmin(!isAdmin)}
                  className={`w-full py-1 text-[11px] rounded font-semibold transition-colors ${
                    isAdmin ? 'bg-[#131b2e] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isAdmin ? 'Switch to User View' : 'Enable Admin Mode'}
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#fcf8fa]">
            
            {/* 1. GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#45464d] mb-2">
                    Measurement System
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setUnits('metric')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        units === 'metric'
                          ? 'border-blue-700 bg-blue-50 text-blue-950 font-bold shadow-xs'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-bold">Metric (SI)</div>
                      <div className="text-xs text-gray-500 mt-0.5">mm, kPa, °C, m/s, m³</div>
                    </button>
                    <button
                      onClick={() => setUnits('imperial')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        units === 'imperial'
                          ? 'border-blue-700 bg-blue-50 text-blue-950 font-bold shadow-xs'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-bold">Imperial (US)</div>
                      <div className="text-xs text-gray-500 mt-0.5">inches, psi, °F, mph, yd³</div>
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#45464d] mb-2">
                    Audible Alarm Notifications
                  </label>
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl">
                    <div className="flex items-center gap-3">
                      {soundEnabled ? (
                        <Volume2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <div className="text-sm font-bold text-gray-900">Sound Audio Klaxon</div>
                        <div className="text-xs text-gray-500">Play alert tone when critical sensor pore spike occurs</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        soundEnabled ? 'bg-blue-900' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        soundEnabled ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#45464d] mb-2">
                    Default Satellite Tile Provider
                  </label>
                  <select
                    value={satelliteProvider}
                    onChange={(e) => setSatelliteProvider(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="google">Google Maps Platform High-Res Satellite</option>
                    <option value="usgs">USGS National 3D Elevation Program (3DEP)</option>
                    <option value="sentinel">Copernicus Sentinel-2 Multispectral Infrared</option>
                  </select>
                </div>
              </div>
            )}

            {/* 2. GIS & GEODETIC TAB */}
            {activeTab === 'gis' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#45464d] mb-2">
                    Coordinate Reference System (CRS / Datum)
                  </label>
                  <div className="space-y-2">
                    {[
                      { code: 'EPSG:4326', name: 'WGS 84 (GPS Geographic Lat/Lng)', desc: 'Standard satellite GPS ellipsoidal coordinates' },
                      { code: 'EPSG:3857', name: 'WGS 84 / Pseudo-Mercator', desc: 'Standard web mapping projection' },
                      { code: 'EPSG:32611', name: 'UTM Zone 11N (Universal Transverse Mercator)', desc: 'Meter-accurate metric conformal grid for Western US' },
                      { code: 'EPSG:2229', name: 'NAD83 / California zone 5 (US Feet)', desc: 'High-precision state plane survey datum' },
                    ].map((item) => (
                      <div
                        key={item.code}
                        onClick={() => setCrs(item.code)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          crs === item.code
                            ? 'border-emerald-600 bg-emerald-50 shadow-xs'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-gray-900">{item.name}</span>
                          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {item.code}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#45464d] mb-2">
                    LiDAR Digital Elevation Model (DEM) Resolution
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'high', label: '1m Airborne LiDAR', sub: 'High Detail' },
                      { id: 'medium', label: '10m USGS DEM', sub: 'Balanced' },
                      { id: 'low', label: '30m SRTM', sub: 'Low Bandwidth' },
                    ].map((dem) => (
                      <button
                        key={dem.id}
                        onClick={() => setDemResolution(dem.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          demResolution === dem.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-xs font-bold">{dem.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{dem.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. TELEMETRY & LORA TAB */}
            {activeTab === 'telemetry' && (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#45464d]">
                      Live Sensor Sampling Interval
                    </label>
                    <span className="text-xs font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                      Every {pollingRate} seconds
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="60"
                    step="1"
                    value={pollingRate}
                    onChange={(e) => setPollingRate(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-900"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
                    <span>3s (Aggressive Storm Mode)</span>
                    <span>15s (Standard)</span>
                    <span>60s (Battery Saver)</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#45464d] mb-2">
                    Active Gateway Links
                  </label>
                  <div className="space-y-2">
                    <div className="p-3 bg-white border border-gray-300 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <div>
                          <div className="text-xs font-bold text-gray-900">LoRaWAN Mesh (915 MHz US ISM)</div>
                          <div className="text-[10px] text-gray-500">Gateway Hub GW-ALPHA • 12 Active Nodes</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ONLINE (99.8%)
                      </span>
                    </div>

                    <div className="p-3 bg-white border border-gray-300 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <div>
                          <div className="text-xs font-bold text-gray-900">Iridium SBD Satellite Relay</div>
                          <div className="text-[10px] text-gray-500">Borehole Deep Piezometer Array Fallback</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        STANDBY
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ALERTS TAB */}
            {activeTab === 'alerts' && (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#45464d]">
                      Critical Landslide Hazard Probability Threshold
                    </label>
                    <span className="text-xs font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                      &gt; {highRiskThreshold}% Risk
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={highRiskThreshold}
                    onChange={(e) => setHighRiskThreshold(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
                    <span>50% (High Precaution)</span>
                    <span>75% (Standard Geotechnical)</span>
                    <span>90% (Immediate Rupture)</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#45464d] mb-2">
                    Automated Action Policies
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl">
                      <div>
                        <div className="text-xs font-bold text-gray-900">Auto-Generate Evacuation Protocols</div>
                        <div className="text-[10px] text-gray-500">Automatically stage reverse-911 orders when 3 sensors exceed threshold</div>
                      </div>
                      <button
                        onClick={() => setAutoEvacWarning(!autoEvacWarning)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          autoEvacWarning ? 'bg-red-700' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          autoEvacWarning ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. STORAGE & OFFLINE TAB */}
            {activeTab === 'storage' && (
              <div className="space-y-5">
                {/* Service Worker Status Card */}
                <div className="p-3.5 bg-white border border-emerald-300 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Service Worker (PWA Shell)</div>
                      <div className="text-[10px] text-gray-500">Assets & App Shell Cached for Offline Operation</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ACTIVE
                  </span>
                </div>

                {/* Simulated Offline Mode Switch */}
                {onToggleSimulatedOffline && (
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl">
                    <div className="flex items-center gap-3">
                      {isSimulatedOffline ? (
                        <WifiOff className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Wifi className="w-5 h-5 text-emerald-600" />
                      )}
                      <div>
                        <div className="text-sm font-bold text-gray-900">Simulate Offline Mode</div>
                        <div className="text-xs text-gray-500">Test viewing cached sensor data without disconnecting network</div>
                      </div>
                    </div>
                    <button
                      onClick={onToggleSimulatedOffline}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        isSimulatedOffline ? 'bg-amber-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        isSimulatedOffline ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                )}

                {/* Live IndexedDB Telemetry Cache Breakdown */}
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-purple-950">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Database className="w-4 h-4 text-purple-700" />
                      IndexedDB Telemetry Store
                    </span>
                    <span className="font-mono font-bold text-purple-900">
                      ~{cacheStats?.estimatedSizeKB ?? 24} KB Used
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-white rounded-lg border border-purple-200 text-center">
                      <div className="text-sm font-extrabold font-mono text-purple-950">
                        {cacheStats?.sensorCount ?? 8}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase font-semibold">Sensors Cached</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-purple-200 text-center">
                      <div className="text-sm font-extrabold font-mono text-purple-950">
                        {cacheStats?.snapshotCount ?? 45}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase font-semibold">Snapshots</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-purple-200 text-center">
                      <div className="text-sm font-extrabold font-mono text-purple-950">
                        {cacheStats?.reportCount ?? 6}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase font-semibold">Reports</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-purple-900 flex justify-between items-center border-t border-purple-200 pt-2">
                    <span>Last Saved Telemetry State:</span>
                    <span className="font-mono font-bold">{lastCachedAt || 'Just now'}</span>
                  </div>
                </div>

                {/* Action feedback message */}
                {cacheActionMsg && (
                  <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>{cacheActionMsg}</span>
                  </div>
                )}

                {/* Cache Action Buttons */}
                <div className="flex gap-2.5 pt-1">
                  {onForceCache && (
                    <button
                      onClick={() => {
                        onForceCache();
                        setCacheActionMsg('Telemetry state successfully saved to IndexedDB!');
                        setTimeout(() => setCacheActionMsg(null), 3000);
                      }}
                      className="flex-1 py-2 px-3 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Save Snapshot Now</span>
                    </button>
                  )}

                  {onClearCache && (
                    <button
                      onClick={() => {
                        onClearCache();
                        setCacheActionMsg('Offline IndexedDB cache cleared and rebuilt.');
                        setTimeout(() => setCacheActionMsg(null), 3000);
                      }}
                      className="py-2 px-3 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Cache</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-gray-500">
                  When disconnected from network or cell towers, Lithos GIS automatically switches to offline mode and renders this last-known cached telemetry state on all GIS maps, sensor feeds, and analytical graphs.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#c6c6cd] bg-white flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#131b2e] hover:bg-black text-white text-xs font-bold rounded-lg transition-all shadow-xs"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
