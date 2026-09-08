import React from 'react';
import { BhumiRakshakLogo } from './BhumiRakshakLogo';
import { 
  LayoutDashboard, 
  Activity, 
  Map, 
  AlertTriangle, 
  Cpu, 
  Sparkles, 
  FileText, 
  History, 
  Settings, 
  Terminal,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Smartphone,
  Radio,
  UserCheck,
  KeyRound
} from 'lucide-react';
import { AuthenticatedUser } from '../types';

interface SideNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isAdmin?: boolean;
  currentUser?: AuthenticatedUser | null;
  onOpenAdminLogin?: () => void;
  onSwitchToCivilian?: () => void;
}

export const SideNav: React.FC<SideNavProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
  isAdmin = false,
  currentUser,
  onOpenAdminLogin,
  onSwitchToCivilian,
}) => {
  // Master navigation item list with role restrictions
  // Restricted items hidden for citizens: Admin Dashboard, Sensor Data, System Logs, Configuration
  // All other features and pages remain fully visible and operational for citizens and administrators alike.
  const allNavItems = [
    { id: 'admin_portal', label: 'Admin Dashboard', icon: ShieldCheck, restricted: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, restricted: false },
    { id: 'citizen_dashboard', label: 'Citizen Dashboard', icon: Radio, restricted: false },
    { id: 'telemetry', label: 'Live Regional Monitoring', icon: Activity, restricted: false },
    { id: 'map', label: 'Risk Map', icon: Map, restricted: false },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, restricted: false },
    { id: 'sensors', label: 'Sensor Data', icon: Cpu, restricted: true },
    { id: 'metrics', label: 'AI Analytics', icon: Sparkles, restricted: false },
    { id: 'reports', label: 'Reports', icon: FileText, restricted: false },
    { id: 'history', label: 'Historical Data', icon: History, restricted: false },
    { id: 'configuration', label: 'Configuration', icon: Settings, restricted: true },
    { id: 'logs', label: 'System Logs', icon: Terminal, restricted: true },
    { id: 'user_login', label: 'Citizen Account (OTP)', icon: Smartphone, restricted: false },
  ];

  // When a citizen logs in, ONLY the 4 restricted options are hidden.
  // Upon proper administrator authentication, all options become visible and accessible.
  const navItems = isAdmin 
    ? allNavItems 
    : allNavItems.filter((item) => !item.restricted);

  return (
    <>
      {/* Mobile Drawer Backdrop & Menu */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
          />
          <aside className="relative z-50 w-64 max-w-[80vw] h-full bg-[#080e22] border-r border-slate-800 text-slate-300 flex flex-col justify-between select-none shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Mobile Drawer Brand Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <BhumiRakshakLogo 
                showText 
                className="w-8 h-8"
                textClassName="text-sm font-bold text-white"
                subtextClassName="text-[10px] text-slate-400"
                onClick={() => {
                  onSelectTab('dashboard');
                  onCloseMobile?.();
                }}
              />
            </div>

            {/* Top Navigation Menu List */}
            <nav className="p-3.5 space-y-1 overflow-y-auto flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile?.();
                    }}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#00b894] text-white font-semibold shadow-md shadow-emerald-950/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Mobile Bottom Status */}
            <div className="p-3.5 border-t border-slate-800/80 bg-[#070c1d]">
              {isAdmin ? (
                <div className="bg-[#0f1a38] border border-slate-700/60 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs font-bold text-white">Administrator</span>
                    </div>
                    <span className="text-[9px] font-semibold bg-blue-950 text-blue-300 border border-blue-800/60 px-1.5 py-0.5 rounded">
                      HQ Access
                    </span>
                  </div>
                  {onSwitchToCivilian && (
                    <button
                      onClick={() => {
                        onSwitchToCivilian();
                        onCloseMobile?.();
                      }}
                      className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Radio className="w-3 h-3 text-emerald-400" />
                      <span>Switch to Civilian View</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-[#0f1a38] border border-slate-700/60 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-bold text-white">Civilian Mode</span>
                    </div>
                    <span className="text-[9px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/60 px-1.5 py-0.5 rounded">
                      Restricted
                    </span>
                  </div>
                  {onOpenAdminLogin && (
                    <button
                      onClick={() => {
                        onOpenAdminLogin();
                        onCloseMobile?.();
                      }}
                      className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Admin Login</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Persistent Sidebar (In-flow Flex Column) */}
      <aside className="hidden lg:flex w-60 shrink-0 h-full bg-[#080e22] border-r border-slate-800/90 text-slate-300 flex-col justify-between select-none">
        {/* Top Navigation Menu List */}
        <nav className="p-3.5 space-y-1 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#00b894] hover:bg-[#00a383] text-white font-semibold shadow-md shadow-emerald-950/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom System Health Status Widget */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#070c1d]">
          {isAdmin ? (
            <div className="bg-[#0f1a38] border border-slate-700/60 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-white">Administrator</span>
                </div>
                <span className="text-[9px] font-semibold bg-blue-950 text-blue-300 border border-blue-800/60 px-1.5 py-0.5 rounded">
                  Full Clearance
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight truncate">
                {currentUser?.name || 'Dr. A. Sharma'}
              </p>
              {onSwitchToCivilian && (
                <button
                  onClick={onSwitchToCivilian}
                  className="w-full mt-0.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  title="Switch to civilian user view to preview citizen dashboard"
                >
                  <Radio className="w-3 h-3 text-emerald-400" />
                  <span>View as Civilian</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#0f1a38] border border-slate-700/60 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-white">Civilian Account</span>
                </div>
                <span className="text-[9px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/60 px-1.5 py-0.5 rounded">
                  Restricted
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Admin features (Sensors, Logs, Config, Admin Console) restricted.
              </p>
              {onOpenAdminLogin && (
                <button
                  onClick={onOpenAdminLogin}
                  className="w-full mt-0.5 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Admin Login</span>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
