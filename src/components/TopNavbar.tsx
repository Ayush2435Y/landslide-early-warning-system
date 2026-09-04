import React, { useState } from 'react';
import { 
  Bell, 
  CloudRain, 
  Menu, 
  User, 
  ChevronDown, 
  ShieldAlert, 
  Mountain,
  Activity,
  CheckCircle2
} from 'lucide-react';

interface TopNavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenEmergency: () => void;
  onOpenProfile: () => void;
  criticalAlertCount: number;
  isOfficerMode: boolean;
  onToggleOfficerMode: () => void;
  isAdmin?: boolean;
  onToggleAdmin?: (isAdmin: boolean) => void;
  onOpenCitizenGuide?: () => void;
  onOpenNewIncident?: () => void;
  onOpenSettings?: () => void;
  isOnline?: boolean;
  isSimulatedOffline?: boolean;
  onToggleSimulatedOffline?: () => void;
  lastCachedTime?: string | null;
  isServingFromCache?: boolean;
  onToggleSidebar?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenEmergency,
  onOpenProfile,
  criticalAlertCount = 3,
  isOfficerMode,
  onToggleOfficerMode,
  isAdmin = true,
  onToggleAdmin,
  onOpenCitizenGuide,
  onOpenNewIncident,
  onOpenSettings,
  isOnline = true,
  isSimulatedOffline = false,
  onToggleSimulatedOffline,
  onToggleSidebar,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="w-full h-16 shrink-0 z-30 flex justify-between items-center px-4 md:px-6 bg-[#0a1128] border-b border-slate-800 text-white select-none shadow-md">
      {/* Left: Hamburger + Brand Logo & Title */}
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors lg:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={() => onSelectTab('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          {/* Custom Mountain / Seismograph Logo Icon */}
          <div className="relative w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm group-hover:border-emerald-400 transition-all">
            <Mountain className="w-5 h-5 text-emerald-400" />
            <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white leading-snug flex items-center gap-2">
              Landslide Early Warning System
            </h1>
            <p className="text-[11px] md:text-xs text-slate-400 font-normal tracking-normal">
              AI-Based Monitoring for North-Eastern Region of India
            </p>
          </div>
        </div>
      </div>

      {/* Right: Status Indicators, Weather Widget, Notifications & Profile */}
      <div className="flex items-center gap-2.5 md:gap-4">
        {/* System Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#121c38] rounded-lg border border-slate-700/60 text-xs">
          <span className="text-slate-400 text-[11px]">System Status</span>
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </div>
        </div>

        {/* Live Weather Widget */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#121c38] rounded-lg border border-slate-700/60 text-xs">
          <CloudRain className="w-4 h-4 text-blue-400" />
          <div className="flex items-center gap-1.5 font-medium text-slate-200">
            <span className="font-bold text-white">23°C</span>
            <span className="text-slate-400 text-[11px]">Light Rain</span>
          </div>
        </div>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="System Alerts & Warnings"
          >
            <Bell className="w-5 h-5" />
            {criticalAlertCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0a1128]">
                {criticalAlertCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0d1630] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 text-slate-200 text-xs animate-in fade-in slide-in-from-top-2">
              <div className="p-3 bg-[#091024] border-b border-slate-700 flex justify-between items-center font-bold text-white">
                <span>Recent System Alerts (3)</span>
                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    onSelectTab('alerts');
                  }}
                  className="text-emerald-400 hover:text-emerald-300 text-[11px]"
                >
                  View All
                </button>
              </div>
              <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
                <div 
                  onClick={() => {
                    setShowNotifications(false);
                    onSelectTab('alerts');
                  }}
                  className="p-3 hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-rose-400">CRITICAL RISK ALERT</span>
                    <span className="text-[10px] text-slate-400">2 min ago</span>
                  </div>
                  <p className="text-slate-300">Station S-07 | East Siang District: High landslide probability (next 2-6 hrs)</p>
                </div>
                <div 
                  onClick={() => {
                    setShowNotifications(false);
                    onSelectTab('alerts');
                  }}
                  className="p-3 hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amber-400">WARNING ALERT</span>
                    <span className="text-[10px] text-slate-400">15 min ago</span>
                  </div>
                  <p className="text-slate-300">Station S-03 | West Jaintia Hills: Increased pore pressure</p>
                </div>
                <div 
                  onClick={() => {
                    setShowNotifications(false);
                    onSelectTab('alerts');
                  }}
                  className="p-3 hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-blue-400">AI MODEL UPDATE</span>
                    <span className="text-[10px] text-slate-400">1 hr ago</span>
                  </div>
                  <p className="text-slate-300">Geotechnical risk models calibrated with radar rain forecast</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Admin Badge */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-900 flex items-center justify-center font-bold text-xs shadow-xs">
              <User className="w-4 h-4 text-slate-700" />
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">Admin</span>
              <span className="text-[10px] text-slate-400">Administrator</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {/* User Profile Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-[#0d1630] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 text-slate-200 text-xs py-1">
              <div className="px-3 py-2 border-b border-slate-700/80">
                <p className="font-bold text-white">Administrator</p>
                <p className="text-[11px] text-slate-400">HQ North-Eastern Command</p>
              </div>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  onOpenProfile();
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Officer Profile</span>
              </button>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  onOpenSettings?.();
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <span>System Configuration</span>
              </button>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  onOpenEmergency();
                }}
                className="w-full px-3 py-2 text-left hover:bg-rose-950/50 text-rose-400 transition-colors flex items-center gap-2 border-t border-slate-800"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>Emergency Broadcast</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
