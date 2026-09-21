import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lightbulb, 
  Car, 
  Home, 
  AlertTriangle, 
  Phone, 
  ShieldCheck, 
  HelpCircle, 
  Sparkles, 
  RefreshCw,
  Compass,
  CheckCircle2,
  Droplets,
  Mountain,
  Activity
} from 'lucide-react';
import { CitizenSafetySummary, SensorData } from '../types';

interface CitizenGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensors: SensorData[];
  onOpenReportModal: () => void;
}

export const CitizenGuideModal: React.FC<CitizenGuideModalProps> = ({
  isOpen,
  onClose,
  sensors,
  onOpenReportModal,
}) => {
  const [summary, setSummary] = useState<CitizenSafetySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'homeowners' | 'glossary'>('status');

  const fetchPlainSummary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/plain-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensors,
          activeAlertsCount: 2,
          reportsCount: 6,
        }),
      });
      const data = await res.json();
      if (data && data.headline) {
        setSummary(data);
      }
    } catch (e) {
      console.error(e);
      setSummary({
        statusLevel: 'warning',
        headline: 'Heavy Rain Advisory: Hillside Ground is Saturated & Moving Slowly',
        simpleExplanation: 'The ground on the hillside has soaked up as much rainwater as it can hold (like an overfilled sponge). High water pressure underground is causing small mud movements and cracks along Route 9 and Retaining Wall B.',
        travelAdvice: 'Route 9 Northbound at Mile 14 has lane closures due to mud debris. Please use Valley Parkway as your primary detour.',
        homeownerAdvice: 'If you live near hillsides, check your yard for sticking gates, leaning fence posts, or new cracks in concrete patios.',
        generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !summary) {
      fetchPlainSummary();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 md:p-7 border border-[#c6c6cd] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#c6c6cd] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center shadow-xs">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#1b1b1d]">
                Citizen Safety & Plain English Guide
              </h2>
              <p className="text-xs text-[#45464d]">
                Easy-to-understand explanations of what sensor data means for you
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#e4e2e4] text-[#76777d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-[#f0edef] p-1 rounded-xl border border-[#c6c6cd] mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'status'
                ? 'bg-white text-[#131b2e] shadow-xs'
                : 'text-[#45464d] hover:text-black'
            }`}
          >
            📢 Current Situation
          </button>
          <button
            onClick={() => setActiveTab('homeowners')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'homeowners'
                ? 'bg-white text-[#131b2e] shadow-xs'
                : 'text-[#45464d] hover:text-black'
            }`}
          >
            🏡 Homeowner Checklist
          </button>
          <button
            onClick={() => setActiveTab('glossary')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'glossary'
                ? 'bg-white text-[#131b2e] shadow-xs'
                : 'text-[#45464d] hover:text-black'
            }`}
          >
            📖 Jargon Dictionary
          </button>
        </div>

        {/* Tab 1: Current Situation in Plain English */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            {/* Status Headline Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono">
                  Current Threat: Elevated Warning (Amber)
                </span>
                <button
                  onClick={fetchPlainSummary}
                  disabled={isLoading}
                  className="text-[11px] text-[#45464d] hover:text-black flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Update</span>
                </button>
              </div>

              <h3 className="text-base md:text-lg font-bold text-amber-950">
                {summary?.headline || 'Heavy Rain Advisory: Hillside Ground is Saturated & Moving'}
              </h3>

              <p className="text-xs md:text-sm text-amber-900 leading-relaxed">
                {summary?.simpleExplanation || 'The ground on the hillside has soaked up as much rainwater as it can hold. High water pressure underground is causing minor mud movement along Route 9 and Retaining Wall B.'}
              </p>
            </div>

            {/* Travel & Driving Advisory */}
            <div className="bg-white border border-[#c6c6cd] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <Car className="w-4 h-4 text-blue-600" />
                <span>Travel & Commuter Guidance</span>
              </div>
              <p className="text-xs text-[#1b1b1d] leading-relaxed">
                {summary?.travelAdvice || 'Route 9 Northbound is experiencing mudslide blockages near Mile Marker 14. Take Valley Parkway as your primary detour.'}
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="bg-[#f6f3f5] p-4 rounded-xl border border-[#c6c6cd] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs text-[#1b1b1d]">Spot a problem in your neighborhood?</h4>
                <p className="text-[11px] text-[#76777d]">Take a photo and upload it directly to help dispatch emergency crews.</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenReportModal();
                }}
                className="px-4 py-2 bg-[#131b2e] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow-xs"
              >
                📸 Report Problem Area
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Homeowner Safety Checklist */}
        {activeTab === 'homeowners' && (
          <div className="space-y-3">
            <p className="text-xs text-[#45464d]">
              If you live on or near a hillside, look for these simple signs that ground is moving:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-[#c6c6cd] space-y-1">
                <div className="font-bold text-[#1b1b1d] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Sticking Doors & Windows</span>
                </div>
                <p className="text-[#45464d] text-[11px]">
                  Doors or windows that suddenly won&apos;t close smoothly can mean the foundation shifted slightly.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#c6c6cd] space-y-1">
                <div className="font-bold text-[#1b1b1d] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>New Concrete Cracks</span>
                </div>
                <p className="text-[#45464d] text-[11px]">
                  Fresh widening cracks in driveways, walkways, or retaining walls greater than 1/4 inch.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#c6c6cd] space-y-1">
                <div className="font-bold text-[#1b1b1d] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Leaning Fences & Trees</span>
                </div>
                <p className="text-[#45464d] text-[11px]">
                  Telephone poles, trees, or fence posts tilting downhill indicate surface soil creep.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#c6c6cd] space-y-1">
                <div className="font-bold text-[#1b1b1d] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Bubbling Mud & Springs</span>
                </div>
                <p className="text-[#45464d] text-[11px]">
                  Water suddenly surfacing in unusual places at the bottom of a slope or behind walls.
                </p>
              </div>
            </div>

            {/* Emergency Numbers */}
            <div className="mt-3 bg-red-50 border border-red-200 p-3.5 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-700" />
                <span className="font-bold text-red-900">Emergency Geotechnical Dispatch: 1-800-GEO-RISK (436-7475)</span>
              </div>
              <span className="bg-red-700 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">24/7 Hotline</span>
            </div>
          </div>
        )}

        {/* Tab 3: Plain English Jargon Dictionary */}
        {activeTab === 'glossary' && (
          <div className="space-y-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-[#c6c6cd] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#1b1b1d]">
                <Droplets className="w-4 h-4 text-blue-600" />
                <span>Piezometer / Pore Pressure (kPa)</span>
              </div>
              <p className="text-[#45464d] leading-relaxed">
                <strong>Plain translation:</strong> Underground water pressure gauge. Think of it like water filling up a water balloon inside the dirt—if there&apos;s too much pressure, it pushes the hillside apart.
              </p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#c6c6cd] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#1b1b1d]">
                <Mountain className="w-4 h-4 text-emerald-700" />
                <span>Inclinometer / Borehole Displacement (mm)</span>
              </div>
              <p className="text-[#45464d] leading-relaxed">
                <strong>Plain translation:</strong> Hillside shift detector. Measures whether the underground soil layers are sliding or tilting downhill.
              </p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#c6c6cd] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#1b1b1d]">
                <Activity className="w-4 h-4 text-purple-700" />
                <span>Soil Moisture Saturation (%)</span>
              </div>
              <p className="text-[#45464d] leading-relaxed">
                <strong>Plain translation:</strong> How soaked the dirt is. 100% means the ground is like a completely soaked sponge and cannot hold any more rain—leading to runoff and mudslides.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
