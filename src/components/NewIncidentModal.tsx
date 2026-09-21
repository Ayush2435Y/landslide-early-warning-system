import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Camera, 
  Sparkles, 
  UploadCloud, 
  Check, 
  AlertCircle,
  Radio,
  Image as ImageIcon,
  HelpCircle,
  CheckCircle2,
  Trash2,
  SlidersHorizontal,
  Compass,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { IncidentReport, RiskSeverity } from '../types';
import { HOTLINKED_IMAGES } from '../data/initialData';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: Partial<IncidentReport>) => void;
}

// Preset real problem hazard areas in the region
const REAL_PROBLEM_ZONES = [
  { name: 'Route 9 Northbound (Mile Marker 14)', sector: 'Sector 4 - Northern Highlands', lat: 34.052, lng: -118.240, defaultCat: 'landslide' },
  { name: 'Retaining Wall B Escarpment', sector: 'Sector 4 - Zone Alpha', lat: 34.058, lng: -118.232, defaultCat: 'ground_movement' },
  { name: 'Oak Creek Culvert & Crossing', sector: 'Sector Beta', lat: 34.061, lng: -118.250, defaultCat: 'flood' },
  { name: 'Lower Hillside Access Road Toe', sector: 'Sector 7G', lat: 34.049, lng: -118.245, defaultCat: 'water_level' },
  { name: 'Substation West Ridge Slope', sector: 'Sector 7G', lat: 34.045, lng: -118.260, defaultCat: 'infrastructure' },
];

// Preset real evidence images for fast demo testing
const SAMPLE_EVIDENCE_PHOTOS = [
  { label: 'Mudslide on Road', url: HOTLINKED_IMAGES.mudslide1 },
  { label: 'Hillside Scarp Crack', url: HOTLINKED_IMAGES.mudslide2 },
  { label: 'GIS Aerial Reference', url: HOTLINKED_IMAGES.gisMapThumbnail },
];

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [mode, setMode] = useState<'plain' | 'technical'>('plain');
  const [selectedZone, setSelectedZone] = useState<string>(REAL_PROBLEM_ZONES[0].name);
  const [category, setCategory] = useState<string>('landslide');
  const [severity, setSeverity] = useState<RiskSeverity>('critical');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState(REAL_PROBLEM_ZONES[0].name);
  const [sector, setSector] = useState(REAL_PROBLEM_ZONES[0].sector);
  const [lat, setLat] = useState<number>(REAL_PROBLEM_ZONES[0].lat);
  const [lng, setLng] = useState<number>(REAL_PROBLEM_ZONES[0].lng);
  const [photos, setPhotos] = useState<string[]>([HOTLINKED_IMAGES.mudslide1]);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiResult, setAiResult] = useState<{
    nlpRiskScore: number;
    hazardCategory: string;
    urgency: RiskSeverity;
    plainEnglishSummary: string;
    citizenAdvice: string;
    insights: string;
    recommendedAction: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSelectZone = (zoneName: string) => {
    setSelectedZone(zoneName);
    const found = REAL_PROBLEM_ZONES.find(z => z.name === zoneName);
    if (found) {
      setLocationName(found.name);
      setSector(found.sector);
      setLat(found.lat);
      setLng(found.lng);
      setCategory(found.defaultCat);
    }
  };

  const handleGetDeviceLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          const locStr = `GPS Pin: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°W`;
          setLocationName(locStr);
          setSelectedZone('custom');
        },
        () => {
          setLat(34.0528);
          setLng(-118.2437);
          setLocationName('GPS Pin: 34.0528°N, 118.2437°W');
          setSelectedZone('custom');
        }
      );
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (!description.trim() && !title.trim()) return;
    setIsAnalyzingAI(true);
    try {
      const res = await fetch('/api/ai/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || `${category.replace('_', ' ')} observation at ${locationName}`,
          description: description || `Observed danger at ${locationName}`,
          category,
          locationName,
          photoBase64: photos.length > 0 ? photos[0] : undefined
        }),
      });
      const data = await res.json();
      if (data && data.nlpRiskScore !== undefined) {
        setAiResult(data);
        const mappedUrgency: RiskSeverity = data.urgency === 'critical' ? 'critical' : data.urgency === 'amber' ? 'amber' : 'low';
        setSeverity(mappedUrgency);
      }
    } catch (e) {
      console.error(e);
      // Fallback
      setAiResult({
        nlpRiskScore: 88,
        hazardCategory: 'Slope Movement & Obstruction',
        urgency: 'critical',
        plainEnglishSummary: 'Significant dirt and rock sliding detected. Potential obstruction to road and property.',
        citizenAdvice: 'Stay clear of the slope perimeter and follow detour signs.',
        insights: 'Immediate geotechnical triage recommended.',
        recommendedAction: 'Dispatch Rapid Response Crew.'
      });
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setPhotos(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDesc = description.trim() || `Hazard report logged for ${locationName}.`;

    onSubmit({
      title: title.trim() || `${category.replace('_', ' ').toUpperCase()} at ${locationName}`,
      category: category as any,
      severity,
      description: finalDesc,
      locationName,
      sector,
      lat,
      lng,
      photos,
      nlpRiskScore: aiResult ? aiResult.nlpRiskScore : (severity === 'critical' ? 92 : severity === 'amber' ? 68 : 35),
      submittedBy: mode === 'plain' ? 'Resident Citizen Report' : 'Field Geotechnical Observer',
      source: mode === 'plain' ? 'citizen' : 'field_officer',
      plainEnglishSummary: aiResult?.plainEnglishSummary || `Field report: ${finalDesc.slice(0, 100)}...`,
      citizenAdvice: aiResult?.citizenAdvice || (severity === 'critical' ? 'Keep clear of the hill slope and use main detour roads.' : 'Monitor area for changes.'),
      aiHazardCategory: aiResult?.hazardCategory,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 md:p-7 border border-[#c6c6cd] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#c6c6cd] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#131b2e] text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5 text-[#d3e4fe]" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#1b1b1d]">
                Report a Real Problem Area
              </h2>
              <p className="text-xs text-[#45464d]">
                Add photos and location data to alert dispatchers and local residents
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

        {/* Plain English vs Technical Tab Switcher */}
        <div className="flex items-center justify-between bg-[#f0edef] p-1.5 rounded-xl border border-[#c6c6cd] mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#45464d] px-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            <span>Form Style:</span>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setMode('plain')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                mode === 'plain'
                  ? 'bg-white text-[#131b2e] shadow-xs border border-[#c6c6cd]'
                  : 'text-[#45464d] hover:text-black'
              }`}
            >
              💡 Easy / Plain English
            </button>
            <button
              type="button"
              onClick={() => setMode('technical')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                mode === 'technical'
                  ? 'bg-white text-[#131b2e] shadow-xs border border-[#c6c6cd]'
                  : 'text-[#45464d] hover:text-black'
              }`}
            >
              🔬 Geotechnical Pro
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Quick Problem Area Preset Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1b1b1d] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>1. Choose Problem Area / Location</span>
              <button
                type="button"
                onClick={handleGetDeviceLocation}
                className="text-[11px] text-blue-700 font-bold lowercase flex items-center gap-1 hover:underline tracking-normal"
              >
                <MapPin className="w-3 h-3" />
                <span>Use Current GPS</span>
              </button>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              {REAL_PROBLEM_ZONES.map((zone) => (
                <button
                  key={zone.name}
                  type="button"
                  onClick={() => handleSelectZone(zone.name)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                    selectedZone === zone.name
                      ? 'border-[#131b2e] bg-[#131b2e] text-white shadow-xs font-bold'
                      : 'border-[#c6c6cd] bg-[#fcf8fa] hover:bg-gray-100 text-[#1b1b1d]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${selectedZone === zone.name ? 'text-[#d3e4fe]' : 'text-red-600'}`} />
                    <span className="truncate">{zone.name}</span>
                  </div>
                  <div className={`text-[10px] mt-0.5 font-mono ${selectedZone === zone.name ? 'text-gray-300' : 'text-[#76777d]'}`}>
                    {zone.sector}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Location Name Input */}
            <input
              type="text"
              value={locationName}
              onChange={(e) => {
                setLocationName(e.target.value);
                setSelectedZone('custom');
              }}
              placeholder="Or type custom street / landmark name..."
              className="w-full bg-white border border-[#c6c6cd] rounded-lg p-2.5 text-xs text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-[#131b2e]"
            />
          </div>

          {/* Problem Photo Attachments with Real Preview & Demo Preset */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#1b1b1d] uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-700" />
                <span>2. Attach Real Evidence Photo ({photos.length})</span>
              </label>
              <span className="text-[11px] text-[#76777d]">Upload photo or pick sample below</span>
            </div>

            {/* Photo Preview Strip */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-[#f6f3f5] rounded-xl border border-[#c6c6cd]">
              {photos.map((p, idx) => (
                <div key={idx} className="w-20 h-20 rounded-lg border border-[#c6c6cd] overflow-hidden relative group shrink-0 bg-white">
                  <img src={p} alt={`Evidence photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Upload Button */}
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-[#c6c6cd] hover:border-black flex flex-col items-center justify-center cursor-pointer text-[#45464d] hover:text-black transition-all bg-white shrink-0">
                <Camera className="w-5 h-5 text-slate-600" />
                <span className="text-[10px] font-bold mt-1">Upload</span>
                <span className="text-[8px] text-[#76777d]">PNG/JPG</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Sample Photo Presets for Easy Demo Testing */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-[#76777d] uppercase font-bold">Try Sample Photo:</span>
              {SAMPLE_EVIDENCE_PHOTOS.map((sample, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => setPhotos([...photos, sample.url])}
                  className="text-[10px] bg-white border border-[#c6c6cd] px-2 py-0.5 rounded-md hover:bg-gray-100 text-[#1b1b1d] font-semibold transition-colors"
                >
                  + {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description / What did you see? */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#1b1b1d] uppercase tracking-wider">
                {mode === 'plain' ? '3. What did you see? (Plain Words)' : '3. Geotechnical Observations & Telemetry Drift'}
              </label>
              <button
                type="button"
                onClick={handleAnalyzeWithAI}
                disabled={!description.trim() || isAnalyzingAI}
                className="text-[11px] text-red-700 font-bold flex items-center gap-1 hover:underline disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5 text-red-600 animate-spin" style={{ animationDuration: isAnalyzingAI ? '1s' : '0s' }} />
                <span>{isAnalyzingAI ? 'AI Analyzing...' : 'Auto-Triage with AI'}</span>
              </button>
            </div>
            
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                mode === 'plain'
                  ? 'e.g., A large chunk of wet mud and gravel slid onto Route 9. Trees are leaning downhill and cars cannot get through...'
                  : 'e.g., Tension crack widening at slope scarp. Observed 8cm shear displacement near retaining wall footing with hydraulic seepage...'
              }
              className="w-full bg-white border border-[#c6c6cd] rounded-lg p-3 text-xs text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-[#131b2e] resize-none"
              required
            />
          </div>

          {/* AI Auto-Triage & Plain English Insights Box */}
          {aiResult && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-red-200 pb-2">
                <div className="flex items-center gap-1.5 text-red-900 font-bold">
                  <Sparkles className="w-4 h-4 text-red-600" />
                  <span>AI Risk Classification: {aiResult.hazardCategory}</span>
                </div>
                <span className="bg-red-700 text-white px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                  NLP Risk Score: {aiResult.nlpRiskScore}/100
                </span>
              </div>

              <div className="text-red-950 font-medium">
                <span className="font-bold">What this means: </span>
                {aiResult.plainEnglishSummary}
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-red-100 text-red-900 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[11px] block text-[#1b1b1d]">Citizen Safety Tip:</span>
                  <span className="text-[11px] text-[#45464d]">{aiResult.citizenAdvice}</span>
                </div>
              </div>
            </div>
          )}

          {/* Severity & Threat Level Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1b1b1d] uppercase tracking-wider mb-1.5">
              4. Danger / Urgency Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('low')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border text-center ${
                  severity === 'low'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-[#f6f3f5] text-[#45464d] border-[#c6c6cd] hover:bg-blue-50'
                }`}
              >
                <div>Blue • Routine</div>
                <div className="text-[10px] font-normal opacity-85">Minor debris / check later</div>
              </button>
              <button
                type="button"
                onClick={() => setSeverity('amber')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border text-center ${
                  severity === 'amber'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-[#f6f3f5] text-[#45464d] border-[#c6c6cd] hover:bg-amber-50'
                }`}
              >
                <div>Amber • Warning</div>
                <div className="text-[10px] font-normal opacity-85">Active creep / drive with care</div>
              </button>
              <button
                type="button"
                onClick={() => setSeverity('critical')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border text-center ${
                  severity === 'critical'
                    ? 'bg-red-700 text-white border-red-700 shadow-xs'
                    : 'bg-[#f6f3f5] text-[#45464d] border-[#c6c6cd] hover:bg-red-50'
                }`}
              >
                <div>Red • Urgent Danger</div>
                <div className="text-[10px] font-normal opacity-85">Road blocked / immediate threat</div>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#131b2e] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Submit Problem Report & Alert Dispatch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
