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
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  LogOut,
  KeyRound,
  Users,
  Settings,
  Sparkles
} from 'lucide-react';
import { AuthenticatedUser } from '../types';
import { BhumiRakshakLogo } from './BhumiRakshakLogo';

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
  onRebootDiagnostics?: () => void;
  currentUser?: AuthenticatedUser | null;
  onOpenAuthModal?: (mode?: 'user' | 'admin') => void;
  onLogout?: () => void;
  onSwitchToCivilian?: () => void;
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
  onRebootDiagnostics,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onSwitchToCivilian,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const isUserAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

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
          {/* Bhumi Rakshak Shield Logo */}
          <div className="relative w-10 h-10 shrink-0 transition-transform duration-200 group-hover:scale-105">
            <BhumiRakshakLogo className="w-10 h-10 drop-shadow-md" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a1128] animate-pulse" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white leading-snug flex items-center gap-2">
              <span>Bhumi Rakshak</span>
              <span className="hidden sm:inline-block text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                भूमि रक्षक
              </span>
            </h1>
            <p className="text-[11px] md:text-xs text-slate-400 font-normal tracking-normal">
              Landslide Early Warning System &bull; NER India
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

        {/* Direct Portal Quick-Nav Buttons */}
        <div className="hidden md:flex items-center gap-1.5 border-l border-slate-800 pl-2">
          {/* Designated Citizen Dashboard button - always visible */}
          <button
            onClick={() => onSelectTab('citizen_dashboard')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentTab === 'citizen_dashboard'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800/80 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30'
            }`}
            title="Open Designated Citizen Safety Dashboard"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Citizen Dashboard</span>
          </button>

          {/* Admin features: Only show Admin Console if user is authenticated as admin; otherwise show Admin Login */}
          {isUserAdmin ? (
            <button
              onClick={() => onSelectTab('admin_portal')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentTab === 'admin_portal' || currentTab === 'users'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-blue-400 border border-blue-500/30'
              }`}
              title="Open Administrator Dashboard & User Audits"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuthModal?.('admin')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/40"
              title="Administrator Authentication Required to access Admin features"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Login</span>
            </button>
          )}
        </div>

        {/* User Profile / Admin Badge */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
              isUserAdmin ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isUserAdmin ? <ShieldCheck className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">
                {currentUser?.name || 'Guest / Citizen'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isUserAdmin ? 'Administrator (Full Clearance)' : 'Civilian (Citizen Dashboard Access)'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {/* User Profile Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0d1630] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 text-slate-200 text-xs py-1 animate-in fade-in slide-in-from-top-2">
              <div className="px-3.5 py-2.5 border-b border-slate-700/80 bg-[#080f24]">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white">{currentUser?.name || 'Guest Citizen'}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                    isUserAdmin ? 'bg-blue-900/60 text-blue-300' : 'bg-emerald-900/60 text-emerald-300'
                  }`}>
                    {isUserAdmin ? 'HQ ADMIN' : 'CIVILIAN ROLE'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser?.email || 'paulayush907@gmail.com'}</p>
                {currentUser?.phone && (
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{currentUser.phone}</p>
                )}
              </div>

              {/* Navigation Sections */}
              {isUserAdmin ? (
                <>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onSelectTab('admin_portal');
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-800 text-blue-400 transition-colors flex items-center gap-2.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Admin Dashboard & User Logins</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onSelectTab('citizen_dashboard');
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-800 text-emerald-400 transition-colors flex items-center gap-2.5"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Citizen Dashboard (Public View)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenProfile();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-800 transition-colors flex items-center gap-2.5"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Officer Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenSettings?.();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-800 transition-colors flex items-center gap-2.5"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>System Configuration</span>
                  </button>

                  {onSwitchToCivilian && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onSwitchToCivilian();
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-800 text-emerald-400 transition-colors flex items-center gap-2.5 border-t border-slate-800"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Switch to Civilian View</span>
                    </button>
                  )}

                  {onRebootDiagnostics && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onRebootDiagnostics();
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-800 text-cyan-400 transition-colors flex items-center gap-2.5 border-t border-slate-800"
                      title="Reload default system initialization & telemetry diagnostics screen"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Boot Diagnostics Screen</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenEmergency();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-rose-950/50 text-rose-400 transition-colors flex items-center gap-2.5 border-t border-slate-800"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <span>Emergency Broadcast</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onSelectTab('citizen_dashboard');
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-800 text-emerald-400 transition-colors flex items-center gap-2.5"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Designated Citizen Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onSelectTab('user_login');
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-800 transition-colors flex items-center gap-2.5"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Citizen OTP Account & Phone</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenCitizenGuide?.();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-800 transition-colors flex items-center gap-2.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Citizen Safety Guide</span>
                  </button>

                  {/* Administrative Authentication Gate */}
                  <div className="border-t border-slate-800 my-1 pt-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenAuthModal?.('admin');
                      }}
                      className="w-full px-3.5 py-2.5 text-left bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 transition-colors flex items-center gap-2.5 font-semibold"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                      <span>Authenticate as Administrator</span>
                    </button>
                  </div>
                </>
              )}

              {onLogout && (
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2.5 border-t border-slate-800"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Session</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
