import React from 'react';
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
  Users, 
  Terminal,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

interface SideNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const SideNav: React.FC<SideNavProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'telemetry', label: 'Live Monitoring', icon: Activity },
    { id: 'map', label: 'Risk Map', icon: Map },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'sensors', label: 'Sensor Data', icon: Cpu },
    { id: 'metrics', label: 'AI Analytics', icon: Sparkles },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'history', label: 'Historical Data', icon: History },
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'logs', label: 'System Logs', icon: Terminal },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs" 
        />
      )}

      <aside className={`
        fixed top-16 left-0 bottom-12 w-60 bg-[#080e22] border-r border-slate-800/90 text-slate-300 z-40 flex flex-col justify-between select-none transition-transform duration-200 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Navigation Menu List */}
        <nav className="p-3.5 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
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
          <div className="bg-[#0f1a38] border border-slate-700/60 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white tracking-tight">System Health</span>
            </div>
            
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                All Systems Operational
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="text-[10px] text-slate-400 font-mono">
              Last Check: 2 min ago
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
