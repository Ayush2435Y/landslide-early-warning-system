import React, { useState } from 'react';
import { 
  X, 
  BellRing, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Sliders, 
  Check, 
  Info,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { CustomAlertRule, MetricType, SensorData } from '../types';

interface CustomAlertRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRule: (rule: Partial<CustomAlertRule>) => void;
  existingRule?: CustomAlertRule | null;
  sensors: SensorData[];
}

export const CustomAlertRuleModal: React.FC<CustomAlertRuleModalProps> = ({
  isOpen,
  onClose,
  onSaveRule,
  existingRule,
  sensors,
}) => {
  const [name, setName] = useState(existingRule?.name || '');
  const [sensorId, setSensorId] = useState(existingRule?.sensorId || 'all');
  const [metric, setMetric] = useState<MetricType>(existingRule?.metric || 'porePressure');
  const [operator, setOperator] = useState<'>' | '<' | '>=' | '<='>(existingRule?.operator || '>=');
  const [thresholdValue, setThresholdValue] = useState<number>(existingRule?.thresholdValue ?? 42.0);
  const [severity, setSeverity] = useState<'critical' | 'warning' | 'info'>(existingRule?.severity || 'critical');
  const [audioAlert, setAudioAlert] = useState(existingRule?.audioAlert ?? true);
  const [enabled, setEnabled] = useState(existingRule?.enabled ?? true);

  if (!isOpen) return null;

  // Metric definitions and standard units
  const metricOptions: { id: MetricType; label: string; unit: string; defaultThreshold: number; step: number; min: number; max: number }[] = [
    { id: 'porePressure', label: 'Pore Water Pressure (Piezometer)', unit: 'kPa', defaultThreshold: 42.0, step: 0.5, min: 10, max: 80 },
    { id: 'displacement', label: 'Displacement Rate (Inclinometer)', unit: 'mm', defaultThreshold: 2.2, step: 0.1, min: 0.1, max: 10 },
    { id: 'soilMoisture', label: 'Soil Moisture / Saturation', unit: '%', defaultThreshold: 80.0, step: 1, min: 20, max: 100 },
    { id: 'rainfallRate', label: 'Precipitation Rate (Gauge)', unit: 'mm/h', defaultThreshold: 35.0, step: 1, min: 0, max: 100 },
    { id: 'seismic', label: 'Micro-Seismic Vibration', unit: 'mm/s', defaultThreshold: 0.8, step: 0.05, min: 0.01, max: 5 },
  ];

  const currentMetricConfig = metricOptions.find(m => m.id === metric) || metricOptions[0];

  // Auto-switch unit and suggested default when metric changes
  const handleMetricChange = (newMetric: MetricType) => {
    setMetric(newMetric);
    const cfg = metricOptions.find(m => m.id === newMetric);
    if (cfg && !existingRule) {
      setThresholdValue(cfg.defaultThreshold);
      if (!name || name.startsWith('Custom Alert')) {
        setName(`${cfg.label} Threshold`);
      }
    }
  };

  // Find currently selected sensor live value
  const selectedSensorObj = sensors.find(s => s.id === sensorId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || `${currentMetricConfig.label} Rule (${operator} ${thresholdValue}${currentMetricConfig.unit})`;
    onSaveRule({
      id: existingRule?.id,
      name: finalName,
      sensorId,
      metric,
      operator,
      thresholdValue: Number(thresholdValue),
      unit: currentMetricConfig.unit,
      severity,
      audioAlert,
      enabled,
      triggerCount: existingRule?.triggerCount || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#c6c6cd] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e4e2e4] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#131b2e] text-white flex items-center justify-center shadow-xs">
              <BellRing className="w-5 h-5 text-[#d3e4fe]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1b1b1d]">
                {existingRule ? 'Edit Custom Alert Rule' : 'Configure Custom Alert Rule'}
              </h2>
              <p className="text-xs text-[#45464d]">
                Automated threshold condition & instant acoustic dispatcher
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-[#76777d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Rule Title */}
          <div>
            <label className="block font-label-caps text-[#45464d] uppercase mb-1 font-semibold">
              Rule Name / Description
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sector Alpha High Pore Pressure Breach"
              className="w-full bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg p-2.5 font-medium text-[#1b1b1d] focus:outline-none focus:border-black"
            />
          </div>

          {/* Metric & Target Sensor Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-label-caps text-[#45464d] uppercase mb-1 font-semibold">
                Telemetry Metric
              </label>
              <select
                value={metric}
                onChange={(e) => handleMetricChange(e.target.value as MetricType)}
                className="w-full bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg p-2.5 font-medium text-[#1b1b1d] focus:outline-none"
              >
                {metricOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} ({opt.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-label-caps text-[#45464d] uppercase mb-1 font-semibold">
                Target Sensor Scope
              </label>
              <select
                value={sensorId}
                onChange={(e) => setSensorId(e.target.value)}
                className="w-full bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg p-2.5 font-medium text-[#1b1b1d] focus:outline-none"
              >
                <option value="all">All Monitoring Nodes ({metric})</option>
                {sensors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} &bull; {s.name} ({s.sector})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Operator & Threshold Value */}
          <div className="bg-[#fcf8fa] border border-[#c6c6cd] rounded-xl p-3.5 space-y-3">
            <label className="block font-label-caps text-[#45464d] uppercase font-semibold">
              Threshold Trigger Condition
            </label>

            <div className="flex items-center gap-3">
              <div className="w-28 shrink-0">
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as any)}
                  className="w-full bg-white border border-[#c6c6cd] rounded-lg p-2 font-mono font-bold text-center text-[#1b1b1d] focus:outline-none"
                >
                  <option value=">">&gt; (Greater)</option>
                  <option value=">=">&gt;= (Greater or Eq)</option>
                  <option value="<">&lt; (Less)</option>
                  <option value="<=">&lt;= (Less or Eq)</option>
                </select>
              </div>

              <div className="flex-1 relative">
                <input
                  type="number"
                  step={currentMetricConfig.step}
                  min={currentMetricConfig.min}
                  max={currentMetricConfig.max}
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-[#c6c6cd] rounded-lg p-2 pr-12 font-mono text-sm font-bold text-[#1b1b1d] focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 font-mono text-xs text-[#76777d]">
                  {currentMetricConfig.unit}
                </span>
              </div>
            </div>

            {/* Quick Slider Adjustment */}
            <div className="pt-1">
              <input
                type="range"
                min={currentMetricConfig.min}
                max={currentMetricConfig.max}
                step={currentMetricConfig.step}
                value={thresholdValue}
                onChange={(e) => setThresholdValue(parseFloat(e.target.value))}
                className="w-full accent-[#131b2e] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#76777d]">
                <span>Min: {currentMetricConfig.min} {currentMetricConfig.unit}</span>
                <span>Default: {currentMetricConfig.defaultThreshold} {currentMetricConfig.unit}</span>
                <span>Max: {currentMetricConfig.max} {currentMetricConfig.unit}</span>
              </div>
            </div>

            {/* Live Reading Comparison Preview */}
            {selectedSensorObj && (
              <div className="text-[11px] bg-white border border-[#e4e2e4] rounded-lg p-2 flex items-center justify-between text-[#45464d]">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>Current {selectedSensorObj.id} Live Value:</span>
                </span>
                <span className="font-mono font-bold text-[#1b1b1d]">
                  {selectedSensorObj.value} {selectedSensorObj.unit}
                </span>
              </div>
            )}
          </div>

          {/* Severity & Notification Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-label-caps text-[#45464d] uppercase mb-1 font-semibold">
                Alert Severity Level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'critical', label: 'Critical', bg: 'bg-red-700 text-white' },
                  { id: 'warning', label: 'Warning', bg: 'bg-amber-600 text-white' },
                  { id: 'info', label: 'Info', bg: 'bg-[#131b2e] text-white' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeverity(s.id as any)}
                    className={`py-2 rounded text-[11px] font-bold transition-all border ${
                      severity === s.id
                        ? `${s.bg} border-transparent shadow-xs`
                        : 'bg-[#f6f3f5] text-[#45464d] border-[#c6c6cd]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-label-caps text-[#45464d] uppercase mb-1 font-semibold">
                Audio & Status
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAudioAlert(!audioAlert)}
                  className={`flex-1 py-2 px-2.5 rounded flex items-center justify-center gap-1.5 border text-[11px] font-semibold transition-colors ${
                    audioAlert
                      ? 'bg-white text-emerald-800 border-emerald-300 shadow-xs'
                      : 'bg-[#f6f3f5] text-[#76777d] border-[#c6c6cd]'
                  }`}
                >
                  {audioAlert ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{audioAlert ? 'Chime ON' : 'Muted'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEnabled(!enabled)}
                  className={`flex-1 py-2 px-2.5 rounded flex items-center justify-center gap-1.5 border text-[11px] font-semibold transition-colors ${
                    enabled
                      ? 'bg-white text-[#131b2e] border-black shadow-xs'
                      : 'bg-[#f6f3f5] text-[#76777d] border-[#c6c6cd]'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 ${enabled ? 'text-black' : 'text-transparent'}`} />
                  <span>{enabled ? 'Active' : 'Disabled'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-2 border-t border-[#e4e2e4]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#c6c6cd] rounded-lg font-semibold text-[#45464d] hover:bg-[#e4e2e4] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] py-2.5 bg-[#131b2e] hover:bg-black text-white font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <BellRing className="w-4 h-4 text-[#d3e4fe]" />
              <span>{existingRule ? 'Update Alert Rule' : 'Arm Custom Alert'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
