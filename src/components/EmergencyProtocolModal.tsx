import React, { useState } from 'react';
import { 
  AlertTriangle, 
  X, 
  Radio, 
  Volume2, 
  ShieldAlert, 
  Check, 
  Send, 
  Megaphone,
  Truck,
  Users
} from 'lucide-react';

interface EmergencyProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastAlert: (protocolDetails: any) => void;
}

export const EmergencyProtocolModal: React.FC<EmergencyProtocolModalProps> = ({
  isOpen,
  onClose,
  onBroadcastAlert,
}) => {
  const [targetSector, setTargetSector] = useState('Sector Alpha & Sector 4 (RT-9)');
  const [evacRadius, setEvacRadius] = useState('500m');
  const [notifyDOT, setNotifyDOT] = useState(true);
  const [notifyEmergencyRescue, setNotifyEmergencyRescue] = useState(true);
  const [activateSirens, setActivateSirens] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  if (!isOpen) return null;

  const handleExecute = () => {
    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      setBroadcastDone(true);
      onBroadcastAlert({
        targetSector,
        evacRadius,
        notifyDOT,
        notifyEmergencyRescue,
        activateSirens,
        timestamp: new Date().toLocaleTimeString(),
      });
      setTimeout(() => {
        setBroadcastDone(false);
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border-2 border-red-600 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-200 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-700 text-white flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-700">Emergency Protocol</h2>
              <p className="text-xs text-[#45464d]">
                National Geologic Safety Agency &bull; Level 2 Red Action
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-[#76777d]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {broadcastDone ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#1b1b1d]">Emergency Protocol Broadcasted</h3>
            <p className="text-xs text-[#45464d] max-w-xs mx-auto">
              All field officers, DOT emergency units, and regional civil protection agencies have been notified.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-900">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-700" />
                <span>Immediate Action Required</span>
              </p>
              <p className="leading-relaxed">
                Elevated soil saturation (84%) and pore pressure spike in Sector Alpha indicates imminent slope failure near RT-9.
              </p>
            </div>

            {/* Target Sector */}
            <div>
              <label className="block font-label-caps text-[#45464d] uppercase mb-1">
                Affected Zone & Sector
              </label>
              <input
                type="text"
                value={targetSector}
                onChange={(e) => setTargetSector(e.target.value)}
                className="w-full bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg p-2.5 font-mono text-[#1b1b1d]"
              />
            </div>

            {/* Precautionary Evacuation Radius */}
            <div>
              <label className="block font-label-caps text-[#45464d] uppercase mb-1">
                Precautionary Exclusion Zone
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['250m', '500m', '1.2km'].map((rad) => (
                  <button
                    key={rad}
                    type="button"
                    onClick={() => setEvacRadius(rad)}
                    className={`py-2 rounded-lg font-mono font-bold border transition-colors ${
                      evacRadius === rad
                        ? 'bg-[#131b2e] text-white border-[#131b2e]'
                        : 'bg-[#f6f3f5] text-[#45464d] border-[#c6c6cd]'
                    }`}
                  >
                    {rad}
                  </button>
                ))}
              </div>
            </div>

            {/* Inter-agency checklists */}
            <div className="space-y-2 pt-2 border-t border-[#e4e2e4]">
              <label className="block font-label-caps text-[#45464d] uppercase mb-1">
                Agency Dispatch & Alarms
              </label>

              <label className="flex items-center gap-3 p-2.5 bg-[#f6f3f5] rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyDOT}
                  onChange={(e) => setNotifyDOT(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#515f74]" />
                  <span className="font-semibold text-[#1b1b1d]">State DOT Highway Closure (RT-9 Detour)</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 bg-[#f6f3f5] rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmergencyRescue}
                  onChange={(e) => setNotifyEmergencyRescue(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#515f74]" />
                  <span className="font-semibold text-[#1b1b1d]">Fire & Geotechnical Search-Rescue Units</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 bg-[#f6f3f5] rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={activateSirens}
                  onChange={(e) => setActivateSirens(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-[#1b1b1d]">Activate Acoustic Hazard Sirens (Zone Alpha)</span>
                </div>
              </label>
            </div>

            {/* Action buttons */}
            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-[#c6c6cd] rounded-lg font-semibold text-[#45464d] hover:bg-[#e4e2e4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={isBroadcasting}
                className="flex-[2] py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Megaphone className={`w-4 h-4 ${isBroadcasting ? 'animate-bounce' : ''}`} />
                <span>{isBroadcasting ? 'Broadcasting...' : 'Execute Emergency Order'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
