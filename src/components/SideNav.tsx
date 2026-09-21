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
  Radio,
  UserCheck,
  KeyRound,
  LogIn,
  LogOut,
  User,
  Smartphone
} from 'lucide-react';
import { AuthenticatedUser, isGuestUser } from '../types';

interface SideNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isAdmin?: boolean;
  currentUser?: AuthenticatedUser | null;
  onOpenAdminLogin?: () => void;
  onOpenUserLogin?: () => void;
  onSwitchToCivilian?: () => void;
  onLogout?: () => void;
}

export const SideNav: React.FC<SideNavProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
  isAdmin = false,
  currentUser,
  onOpenAdminLogin,
  onOpenUserLogin,
  onSwitchToCivilian,
  onLogout,
}) => {
  const isGuest = isGuestUser(currentUser);
  const isAuthenticated = !isGuest;
  const isUserAdmin = Boolean(isAuthenticated && (currentUser?.role === 'admin' || currentUser?.role === 'super_admin'));
  // Master navigation item list with role restrictions
  // Restricted items hidden for citizens: Admin Dashboard, Sensor Data, System Logs, Configuration
  // All other features and pages remain fully visible and operational for citizens and administrators alike.
  const allNavItems = [
    { id: 'admin_portal', label: 'Admin Dashboard', icon: ShieldCheck, restricted: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, restricted: false },
    { id: 'telemetry', label: 'Live Regional Monitoring', icon: Activity, restricted: false },
    { id: 'map', label: 'Risk Map', icon: Map, restricted: false },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, restricted: false },
    { id: 'sensors', label: 'Sensor Data', icon: Cpu, restricted: true },
    { id: 'metrics', label: 'AI Analytics', icon: Sparkles, restricted: false },
    { id: 'reports', label: 'Reports', icon: FileText, restricted: false },
    { id: 'history', label: 'Historical Data', icon: History, restricted: false },
    { id: 'configuration', label: 'Configuration', icon: Settings, restricted: true },
    { id: 'logs', label: 'System Logs', icon: Terminal, restricted: true },
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
              {isUserAdmin ? (
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
                  <p className="text-[10px] text-slate-300 truncate">{currentUser?.name}</p>
                  <div className="flex flex-col gap-1 mt-1">
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
                    {onLogout && (
                      <button
                        onClick={() => {
                          onLogout();
                          onCloseMobile?.();
                        }}
                        className="w-full py-1 px-2 hover:bg-rose-950/40 text-rose-300 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer border border-rose-900/30"
                      >
                        <LogOut className="w-3 h-3 text-rose-400" />
                        <span>Sign Out (Guest)</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : isAuthenticated ? (
                <div className="bg-[#0f1a38] border border-slate-700/60 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Citizen Account</span>
                    </div>
                    <span className="text-[9px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate">{currentUser?.name}</p>
                  <div className="flex flex-col gap-1 mt-1">
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
                    {onLogout && (
                      <button
                        onClick={() => {
                          onLogout();
                          onCloseMobile?.();
                        }}
                        className="w-full py-1 px-2 hover:bg-rose-950/40 text-rose-300 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer border border-rose-900/30"
                      >
                        <LogOut className="w-3 h-3 text-rose-400" />
                        <span>Sign Out (Guest)</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#0c142b] border border-slate-700/60 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-200">Guest Mode</span>
                    </div>
                    <span className="text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded">
                      Public
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Sign in to report hazards & receive emergency SMS.
                  </p>
                  <div className="flex flex-col gap-1.5 mt-1">
                    <button
                      onClick={() => {
                        onOpenUserLogin?.();
                        onCloseMobile?.();
                      }}
                      className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>Citizen Sign In</span>
                    </button>
                    {onOpenAdminLogin && (
                      <button
                        onClick={() => {
                          onOpenAdminLogin();
                          onCloseMobile?.();
                        }}
                        className="w-full py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                      >
                        <KeyRound className="w-3 h-3 text-blue-400" />
                        <span>Admin Login</span>
                      </button>
                    )}
                  </div>
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

        {/* Bottom System Health & Auth Status Widget */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#070c1d]">
          {isUserAdmin ? (
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
              <p className="text-[10px] text-slate-300 leading-tight truncate font-medium">
                {currentUser?.name || 'Dr. A. Sharma'}
              </p>
              <div className="flex flex-col gap-1 mt-1">
                {onSwitchToCivilian && (
                  <button
                    onClick={onSwitchToCivilian}
                    className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                    title="Switch to civilian user view"
                  >
                    <Radio className="w-3 h-3 text-emerald-400" />
                    <span>View as Civilian</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full py-1 px-2 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer border border-rose-900/30"
                    title="Sign out to guest account"
                  >
                    <LogOut className="w-3 h-3 text-rose-400" />
                    <span>Sign Out (Guest)</span>
                  </button>
                )}
              </div>
            </div>
          ) : isAuthenticated ? (
            <div className="bg-[#0f1a38] border border-slate-700/60 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Citizen Account</span>
                </div>
                <span className="text-[9px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  OTP Verified
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight truncate font-medium">
                {currentUser?.name || 'Ayush Paul'}
              </p>
              <div className="flex flex-col gap-1 mt-1">
                {onOpenAdminLogin && (
                  <button
                    onClick={onOpenAdminLogin}
                    className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Admin Clearance Login</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full py-1 px-2 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer border border-rose-900/30"
                    title="Sign out to guest account"
                  >
                    <LogOut className="w-3 h-3 text-rose-400" />
                    <span>Sign Out (Guest)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Guest Observer Card */
            <div className="bg-[#0c142b] border border-slate-700/60 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-200">Guest Mode</span>
                </div>
                <span className="text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded">
                  Public Mode
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Public bulletin viewer. Sign in to submit hazard reports.
              </p>
              <div className="flex flex-col gap-1.5 mt-1">
                <button
                  onClick={onOpenUserLogin}
                  className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Citizen Sign In</span>
                </button>
                {onOpenAdminLogin && (
                  <button
                    onClick={onOpenAdminLogin}
                    className="w-full py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  >
                    <KeyRound className="w-3 h-3 text-blue-400" />
                    <span>Admin Login</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
