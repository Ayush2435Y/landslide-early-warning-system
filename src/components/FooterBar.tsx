import React from 'react';
import { Clock, Brain, Radio, Bell } from 'lucide-react';
import { BhumiRakshakLogo } from './BhumiRakshakLogo';

export const FooterBar: React.FC = () => {
  return (
    <footer className="w-full h-12 shrink-0 bg-[#080e22] border-t border-slate-800 text-slate-400 text-xs px-4 md:px-6 flex items-center justify-between z-30 select-none">
      <div className="flex items-center gap-2">
        <BhumiRakshakLogo className="w-4 h-4" />
        <span className="font-medium text-slate-300">Bhumi Rakshak (भूमि रक्षक)</span>
        <span className="text-slate-500 hidden sm:inline">&bull; NER Landslide Early Warning System</span>
      </div>

      <div className="hidden md:flex items-center gap-6 lg:gap-8">
        <div className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Real-time Monitoring</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
          <Brain className="w-3.5 h-3.5 text-slate-400" />
          <span>AI Powered Prediction</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
          <Radio className="w-3.5 h-3.5 text-slate-400" />
          <span>Multi-sensor Data Fusion</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
          <Bell className="w-3.5 h-3.5 text-slate-400" />
          <span>24/7 Automated Alerts</span>
        </div>
      </div>
    </footer>
  );
};
