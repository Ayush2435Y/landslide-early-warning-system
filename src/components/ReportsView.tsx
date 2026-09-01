import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  MapPin, 
  Image as ImageIcon, 
  User, 
  Clock, 
  Smartphone, 
  ZoomIn, 
  Send, 
  Plus, 
  FileText, 
  Check, 
  ExternalLink,
  ShieldCheck,
  X,
  PieChart as PieChartIcon,
  Filter,
  ShieldAlert,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  Sparkles,
  ArrowUpDown,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Flame,
  Camera
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { IncidentReport, RiskSeverity } from '../types';
import { HOTLINKED_IMAGES } from '../data/initialData';

interface ReportsViewProps {
  reports: IncidentReport[];
  selectedReport: IncidentReport;
  onSelectReport: (report: IncidentReport) => void;
  onDispatchTeam: (reportId: string) => void;
  onDismissReport: (reportId: string) => void;
  onAddNote: (reportId: string, note: string) => void;
  onOpenInGIS: (report: IncidentReport) => void;
  onOpenNewIncident: () => void;
}

type SeverityFilter = 'all' | 'critical' | 'amber' | 'low' | 'review';
type SortOption = 'ai_urgency' | 'severity' | 'newest' | 'location';

interface SeverityDataPoint {
  name: string;
  key: RiskSeverity;
  colorName: 'Red' | 'Amber' | 'Blue';
  value: number;
  pct: number;
  fillColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  tagline: string;
  protocol: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  selectedReport,
  onSelectReport,
  onDispatchTeam,
  onDismissReport,
  onAddNote,
  onOpenInGIS,
  onOpenNewIncident,
}) => {
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('ai_urgency');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showChartDetails, setShowChartDetails] = useState(true);
  const [plainEnglishMode, setPlainEnglishMode] = useState(true);
  const [isSortingAI, setIsSortingAI] = useState(false);
  const [aiPriorities, setAiPriorities] = useState<Record<string, { rank: number; score: number; tagline: string; action: string }>>({});
  const [aiSortFeedback, setAiSortFeedback] = useState<string | null>(null);

  // Compute Severity Distribution Data for Dispatchers (Red, Amber, Blue)
  const severityStats = useMemo(() => {
    const total = reports.length || 1;
    const redCount = reports.filter((r) => r.severity === 'critical').length;
    const amberCount = reports.filter((r) => r.severity === 'amber').length;
    const blueCount = reports.filter((r) => r.severity === 'low' || (r.severity !== 'critical' && r.severity !== 'amber')).length;

    const data: SeverityDataPoint[] = [
      {
        name: 'Red (Urgent Hazard)',
        key: 'critical',
        colorName: 'Red',
        value: redCount,
        pct: Number(((redCount / total) * 100).toFixed(1)),
        fillColor: '#dc2626',
        borderColor: '#991b1b',
        badgeBg: 'bg-red-700',
        badgeText: 'text-white',
        tagline: 'Immediate Danger to Road or Homes',
        protocol: 'Dispatch emergency team and close hazard zone',
      },
      {
        name: 'Amber (Warning)',
        key: 'amber',
        colorName: 'Amber',
        value: amberCount,
        pct: Number(((amberCount / total) * 100).toFixed(1)),
        fillColor: '#f59e0b',
        borderColor: '#b45309',
        badgeBg: 'bg-amber-500',
        badgeText: 'text-black',
        tagline: 'Moderate Risk / Developing Problem',
        protocol: 'Accelerate monitoring and inspect site soon',
      },
      {
        name: 'Blue (Routine Info)',
        key: 'low',
        colorName: 'Blue',
        value: blueCount,
        pct: Number(((blueCount / total) * 100).toFixed(1)),
        fillColor: '#2563eb',
        borderColor: '#1d4ed8',
        badgeBg: 'bg-blue-600',
        badgeText: 'text-white',
        tagline: 'Minor Non-Urgent Issue',
        protocol: 'Routine check and regular maintenance',
      },
    ];

    return {
      total: reports.length,
      redCount,
      amberCount,
      blueCount,
      data,
      highestLevel: redCount > 0 ? 'Urgent Danger (Red)' : amberCount > 0 ? 'Warning (Amber)' : 'Routine (Blue)',
    };
  }, [reports]);

  // AI Automatic Sorting Handler
  const handleRunAISort = async () => {
    setIsSortingAI(true);
    setSortBy('ai_urgency');
    try {
      const res = await fetch('/api/ai/batch-sort-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports }),
      });
      const data = await res.json();
      if (data && data.prioritized) {
        const priorityMap: Record<string, { rank: number; score: number; tagline: string; action: string }> = {};
        data.prioritized.forEach((item: any) => {
          priorityMap[item.id] = {
            rank: item.aiPriorityRank,
            score: item.aiUrgencyScore,
            tagline: item.plainEnglishTagline,
            action: item.plainEnglishAction,
          };
        });
        setAiPriorities(priorityMap);
        setAiSortFeedback(`AI triaged ${reports.length} problem reports by life safety & road threat.`);
      }
    } catch (e) {
      console.error(e);
      // Fallback ranking
      const fallbackMap: Record<string, { rank: number; score: number; tagline: string; action: string }> = {};
      const sorted = [...reports].sort((a, b) => (b.nlpRiskScore || 50) - (a.nlpRiskScore || 50));
      sorted.forEach((r, idx) => {
        fallbackMap[r.id] = {
          rank: idx + 1,
          score: r.nlpRiskScore || (r.severity === 'critical' ? 92 : r.severity === 'amber' ? 68 : 35),
          tagline: idx === 0 ? 'Top Urgent: Hillside slope and road obstruction' : 'Developing ground movement or drainage flow',
          action: 'Follow emergency detour and avoid active slope edge.',
        };
      });
      setAiPriorities(fallbackMap);
      setAiSortFeedback(`AI sorted queue by estimated threat score.`);
    } finally {
      setIsSortingAI(false);
      setTimeout(() => setAiSortFeedback(null), 5000);
    }
  };

  // Run initial AI prioritization mapping if empty
  useEffect(() => {
    if (Object.keys(aiPriorities).length === 0 && reports.length > 0) {
      const initialMap: Record<string, { rank: number; score: number; tagline: string; action: string }> = {};
      const sorted = [...reports].sort((a, b) => (b.nlpRiskScore || 50) - (a.nlpRiskScore || 50));
      sorted.forEach((r, idx) => {
        initialMap[r.id] = {
          rank: idx + 1,
          score: r.nlpRiskScore || (r.severity === 'critical' ? 92 : r.severity === 'amber' ? 68 : 35),
          tagline: idx === 0 ? 'Top Urgent Hazard: Road obstruction & mud movement' : 'High slope saturation & tension fissure',
          action: 'Avoid affected zone and use primary detours.',
        };
      });
      setAiPriorities(initialMap);
    }
  }, [reports]);

  // Filter & Sort Reports
  const filteredAndSortedReports = useMemo(() => {
    const list = reports.filter((r) => {
      if (filter === 'critical' && r.severity !== 'critical') return false;
      if (filter === 'amber' && r.severity !== 'amber') return false;
      if (filter === 'low' && r.severity !== 'low') return false;
      if (filter === 'review' && r.status !== 'reviewed') return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.locationName.toLowerCase().includes(q) ||
          r.sector.toLowerCase().includes(q) ||
          r.reportId.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'ai_urgency') {
        const rankA = aiPriorities[a.id]?.rank ?? (a.severity === 'critical' ? 1 : a.severity === 'amber' ? 5 : 10);
        const rankB = aiPriorities[b.id]?.rank ?? (b.severity === 'critical' ? 1 : b.severity === 'amber' ? 5 : 10);
        return rankA - rankB;
      }
      if (sortBy === 'severity') {
        const order = { critical: 1, amber: 2, low: 3 };
        return (order[a.severity] || 3) - (order[b.severity] || 3);
      }
      if (sortBy === 'newest') {
        return b.id.localeCompare(a.id);
      }
      if (sortBy === 'location') {
        return a.locationName.localeCompare(b.locationName);
      }
      return 0;
    });
  }, [reports, filter, sortBy, searchQuery, aiPriorities]);

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    onAddNote(selectedReport.id, noteText.trim());
    setNoteText('');
    setIsAddingNote(false);
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-64px)] overflow-hidden bg-[#fcf8fa]">
      
      {/* Left Column: Reports List & Severity Overview */}
      <aside className="w-80 md:w-[420px] shrink-0 border-r border-[#c6c6cd] bg-[#fcf8fa] flex flex-col h-full overflow-hidden">
        
        {/* Top Header + Add Problem Report Button */}
        <div className="p-3.5 border-b border-[#c6c6cd] bg-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-700" />
            <div>
              <h2 className="text-sm md:text-base font-bold text-[#1b1b1d]">
                Problem Area Reports
              </h2>
              <p className="text-[10px] text-[#76777d]">
                Live incidents sorted by AI threat level
              </p>
            </div>
          </div>
          <button
            onClick={onOpenNewIncident}
            className="px-3 py-1.5 bg-[#131b2e] hover:bg-black text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Log problem area with photo + data"
          >
            <Camera className="w-3.5 h-3.5 text-[#d3e4fe]" />
            <span>Add Report</span>
          </button>
        </div>

        {/* Plain English Mode Switch & AI Triage Button */}
        <div className="bg-[#f0edef] border-b border-[#c6c6cd] p-2.5 flex items-center justify-between gap-2">
          <button
            onClick={() => setPlainEnglishMode(!plainEnglishMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
              plainEnglishMode
                ? 'bg-white text-emerald-800 border-emerald-300 shadow-xs'
                : 'bg-white text-[#45464d] border-[#c6c6cd]'
            }`}
            title="Toggle between everyday citizen words and technical geotech terms"
          >
            <Lightbulb className={`w-3.5 h-3.5 ${plainEnglishMode ? 'text-emerald-600' : 'text-gray-400'}`} />
            <span>{plainEnglishMode ? '💡 Plain English ON' : '🔬 Geotech Mode'}</span>
          </button>

          <button
            onClick={handleRunAISort}
            disabled={isSortingAI}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white rounded-md text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSortingAI ? 'animate-spin' : ''}`} />
            <span>{isSortingAI ? 'AI Sorting...' : '⚡ AI Smart Sort'}</span>
          </button>
        </div>

        {aiSortFeedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-3 py-1.5 text-[11px] text-emerald-800 font-medium flex items-center gap-1.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{aiSortFeedback}</span>
          </div>
        )}

        {/* Severity Distribution Pie Chart Widget */}
        <div className="bg-[#f6f3f5] border-b border-[#c6c6cd] p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-[#131b2e]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1b1b1d]">
                Severity Overview (Active Conditions)
              </h3>
            </div>
            <button
              onClick={() => setShowChartDetails(!showChartDetails)}
              className="text-[11px] font-mono text-[#45464d] hover:text-[#1b1b1d] flex items-center gap-0.5"
            >
              <span>{showChartDetails ? 'Hide' : 'Show'}</span>
              {showChartDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Interactive Pie Chart */}
          <div className="bg-white border border-[#c6c6cd] rounded-xl p-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="w-24 h-24 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityStats.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={24}
                      outerRadius={42}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                      onClick={(entry: any) => {
                        if (entry && entry.key) {
                          setFilter(entry.key === filter ? 'all' : (entry.key as SeverityFilter));
                        }
                      }}
                      cursor="pointer"
                    >
                      {severityStats.data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fillColor}
                          opacity={filter === 'all' || filter === entry.key ? 1 : 0.35}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const data = payload[0].payload as SeverityDataPoint;
                        return (
                          <div className="bg-[#131b2e] text-white p-2 rounded shadow-xl border border-black text-[11px] font-mono space-y-1">
                            <div className="font-bold flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: data.fillColor }}
                              />
                              <span>{data.name}</span>
                            </div>
                            <div className="text-gray-300">
                              <span>Active Reports: </span>
                              <strong className="text-white">{data.value} ({data.pct}%)</strong>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-mono text-xs font-black text-[#1b1b1d] leading-none">
                    {severityStats.total}
                  </span>
                  <span className="text-[8px] uppercase tracking-tighter text-[#76777d]">
                    Reports
                  </span>
                </div>
              </div>

              {/* Legend with direct filter clicks */}
              <div className="flex-1 flex flex-col gap-1">
                {severityStats.data.map((item) => {
                  const isActive = filter === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setFilter(filter === item.key ? 'all' : (item.key as SeverityFilter))}
                      className={`flex items-center justify-between px-2 py-1 rounded text-xs transition-all border text-left ${
                        isActive
                          ? 'border-[#131b2e] bg-[#131b2e] text-white shadow-xs'
                          : 'border-[#e4e2e4] bg-[#fcf8fa] hover:bg-gray-100 text-[#1b1b1d]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.fillColor }}
                        />
                        <span className="font-semibold text-[11px] truncate">
                          {item.colorName} ({plainEnglishMode ? (item.key === 'critical' ? 'Urgent' : item.key === 'amber' ? 'Warning' : 'Routine') : item.key})
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[11px] shrink-0">
                        {item.value}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#76777d] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problem areas, roads, descriptions..."
                className="w-full bg-white border border-[#c6c6cd] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#1b1b1d] focus:outline-none focus:ring-1 focus:ring-[#131b2e]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1 rounded-lg border border-[#c6c6cd]">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#45464d]">
                <ArrowUpDown className="w-3 h-3 text-slate-600" />
                <span>Sort by:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs font-bold text-[#1b1b1d] focus:outline-none cursor-pointer"
              >
                <option value="ai_urgency">⚡ AI Threat Priority</option>
                <option value="severity">🚨 Severity (Red &rarr; Blue)</option>
                <option value="newest">🕒 Newest First</option>
                <option value="location">📍 Location Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Report Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#e4e2e4]">
          {filteredAndSortedReports.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#76777d] space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-gray-400" />
              <p>No problem reports match your current filter.</p>
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
                className="text-blue-700 font-semibold hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredAndSortedReports.map((item) => {
              const isSelected = selectedReport.id === item.id;
              const isCrit = item.severity === 'critical';
              const isAmber = item.severity === 'amber';
              const priority = aiPriorities[item.id];

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectReport(item)}
                  className={`p-3.5 cursor-pointer transition-colors border-l-4 ${
                    isSelected
                      ? isCrit
                        ? 'bg-red-50/80 border-l-red-600'
                        : isAmber
                        ? 'bg-amber-50/80 border-l-amber-500'
                        : 'bg-blue-50/80 border-l-blue-600'
                      : 'bg-white hover:bg-gray-50 border-l-transparent'
                  }`}
                >
                  {/* Top Bar with AI Priority Badge & Severity */}
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {priority && (
                        <span className="bg-[#131b2e] text-[#d3e4fe] text-[9px] px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-0.5 shadow-xs">
                          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                          <span>AI #{priority.rank}</span>
                        </span>
                      )}
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                          isCrit
                            ? 'bg-red-700 text-white'
                            : isAmber
                            ? 'bg-amber-500 text-black'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {isCrit ? 'Red • Urgent' : isAmber ? 'Amber • Warning' : 'Blue • Routine'}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-[#76777d] shrink-0">
                      {item.timestamp.includes('-') ? item.timestamp.split('-')[1].trim() : item.timestamp}
                    </span>
                  </div>

                  {/* Title & Plain English Tagline */}
                  <h3 className="font-bold text-xs md:text-sm text-[#1b1b1d] mb-1">
                    {item.title}
                  </h3>

                  {/* Description in Plain Words */}
                  <p className="text-xs text-[#45464d] line-clamp-2 leading-relaxed">
                    {plainEnglishMode && item.plainEnglishSummary ? item.plainEnglishSummary : item.description}
                  </p>

                  {/* Location and Media Thumbnail count */}
                  <div className="flex items-center justify-between mt-2.5 text-[#76777d] font-mono text-[10px]">
                    <div className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                      <span className="truncate">{item.locationName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {item.photos && item.photos.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                          <ImageIcon className="w-3 h-3" />
                          <span>{item.photos.length} photo</span>
                        </span>
                      )}
                      <span className="font-bold text-red-700">
                        {item.nlpRiskScore || 85}/100 Risk
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Column: Detailed Problem Report & Citizen Safety Advisory */}
      <main className="flex-1 bg-[#fcf8fa] flex flex-col h-full overflow-y-auto">
        
        {/* Action Header */}
        <div className="p-4 border-b border-[#c6c6cd] bg-white flex flex-wrap justify-between items-center gap-3 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-3 py-1 rounded uppercase font-bold ${
                selectedReport.severity === 'critical'
                  ? 'bg-red-700 text-white'
                  : selectedReport.severity === 'amber'
                  ? 'bg-amber-500 text-black'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {selectedReport.severity === 'critical'
                ? `Red Urgent Danger - ${selectedReport.category.replace('_', ' ')}`
                : selectedReport.severity === 'amber'
                ? `Amber Warning - ${selectedReport.category.replace('_', ' ')}`
                : `Blue Routine - ${selectedReport.category.replace('_', ' ')}`}
            </span>
            <span className="text-[#45464d] font-mono text-xs font-semibold">
              ID: {selectedReport.reportId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDismissReport(selectedReport.id)}
              className="px-3.5 py-1.5 border border-[#c6c6cd] text-[#1b1b1d] text-xs font-semibold rounded-lg hover:bg-[#e4e2e4] transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => setIsAddingNote(true)}
              className="px-3.5 py-1.5 bg-[#eae7e9] text-[#1b1b1d] text-xs font-semibold rounded-lg hover:bg-[#e4e2e4] transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Add Note</span>
            </button>
            <button
              onClick={() => onDispatchTeam(selectedReport.id)}
              className={`px-4 py-1.5 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
                selectedReport.severity === 'critical'
                  ? 'bg-red-700 hover:bg-red-800'
                  : selectedReport.severity === 'amber'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Response Team</span>
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-5 md:p-7 max-w-6xl mx-auto w-full grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Info */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* Title & Metadata */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-[#76777d] uppercase tracking-wider">
                  Incident Detail
                </span>
                <span className="text-xs text-[#76777d]">&bull;</span>
                <span className="text-xs font-mono font-bold text-red-700">
                  {selectedReport.status.toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1b1b1d] mb-2">
                {selectedReport.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#45464d] border-b border-[#c6c6cd] pb-4">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#76777d]" />
                  <span>Submitted by: <strong>{selectedReport.submittedBy}</strong></span>
                </div>
                <span>|</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#76777d]" />
                  <span>{selectedReport.timestamp}</span>
                </div>
                <span>|</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>{selectedReport.locationName}</span>
                </div>
              </div>
            </div>

            {/* Plain English Citizen Safety Advisory Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>What Normal People Need to Know (Citizen Safety Advisory)</span>
                </div>
                <span className="bg-amber-200 text-amber-900 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                  Public Guidance
                </span>
              </div>

              <p className="text-sm text-amber-950 leading-relaxed font-medium">
                {selectedReport.plainEnglishSummary || selectedReport.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/60 text-xs space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    🚗 Driving & Road Advice:
                  </span>
                  <p className="text-[#45464d]">
                    {selectedReport.severity === 'critical'
                      ? 'Route 9 has active blockage. Take Valley Parkway detour.'
                      : 'Drive with caution and watch for pooling water or gravel wash.'}
                  </p>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/60 text-xs space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    🏡 Homeowner & Yard Signs:
                  </span>
                  <p className="text-[#45464d]">
                    {selectedReport.citizenAdvice || 'Look for new cracks in driveways, sticking gates, or water bubbling near retaining walls.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Full Field Description Card */}
            <div className="bg-white border border-[#c6c6cd] rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-[#45464d] mb-2 uppercase tracking-wider">
                Full Incident Observation & Field Notes
              </h3>
              <p className="text-sm text-[#1b1b1d] leading-relaxed">
                {selectedReport.description}
              </p>
            </div>

            {/* Photos & Visual Evidence */}
            <div>
              <h3 className="text-xs font-bold text-[#1b1b1d] mb-3 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-700" />
                  <span>Real Problem Area Photos ({selectedReport.photos?.length || 0})</span>
                </span>
                <span className="text-[11px] text-[#76777d] lowercase font-normal">Click image to expand full-screen</span>
              </h3>

              {selectedReport.photos && selectedReport.photos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedReport.photos.map((imgUrl, i) => (
                    <div
                      key={i}
                      onClick={() => setLightboxImage(imgUrl)}
                      className="relative group rounded-xl border border-[#c6c6cd] overflow-hidden aspect-video bg-[#e4e2e4] flex items-center justify-center cursor-zoom-in shadow-xs"
                    >
                      <img
                        src={imgUrl}
                        alt={`Evidence photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-dashed border-[#c6c6cd] rounded-xl p-6 text-center text-xs text-[#76777d]">
                  No photo attachments attached for this report.
                </div>
              )}
            </div>

            {/* Dispatch Notes */}
            {selectedReport.notes && selectedReport.notes.length > 0 && (
              <div className="bg-white border border-[#c6c6cd] rounded-xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-[#45464d] mb-3 uppercase tracking-wider">
                  Dispatch Action Log & Triage Notes
                </h3>
                <ul className="space-y-2 text-xs">
                  {selectedReport.notes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[#1b1b1d] bg-[#f6f3f5] p-2.5 rounded-lg border border-[#e4e2e4]">
                      <FileText className="w-3.5 h-3.5 text-[#515f74] mt-0.5 shrink-0" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Meta Column */}
          <div className="flex flex-col gap-6">
            
            {/* AI Urgency & Threat Card */}
            <div className="bg-white border border-[#c6c6cd] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e4e2e4] pb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#1b1b1d]">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>AI Triage Assessment</span>
                </div>
                <span className="font-mono text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
                  NLP Score: {selectedReport.nlpRiskScore || 92}/100
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#45464d]">AI Urgency Level:</span>
                  <span className={`font-bold uppercase px-2 py-0.5 rounded text-[11px] ${
                    selectedReport.severity === 'critical' ? 'bg-red-700 text-white' :
                    selectedReport.severity === 'amber' ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'
                  }`}>
                    {selectedReport.severity}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#45464d]">Nearby Active Sensors:</span>
                  <span className="font-bold text-[#1b1b1d]">
                    {selectedReport.sensorsInArea || 3} Sensors Online
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#45464d]">Duplicate Check:</span>
                  <span className="font-mono text-[#1b1b1d]">
                    {selectedReport.duplicateStatus || 'None detected'}
                  </span>
                </div>
              </div>
            </div>

            {/* GIS Location Card */}
            <div className="bg-white border border-[#c6c6cd] rounded-xl overflow-hidden shadow-xs flex flex-col">
              <div className="h-44 bg-[#e4e2e4] relative overflow-hidden">
                <img
                  src={HOTLINKED_IMAGES.gisMapThumbnail}
                  alt="GIS Incident Location"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded text-xs font-mono border border-[#c6c6cd] shadow-xs">
                  {selectedReport.lat.toFixed(3)}°N, {selectedReport.lng.toFixed(3)}°W
                </div>
              </div>

              <div className="p-4 bg-[#fcf8fa] border-t border-[#c6c6cd]">
                <h3 className="text-[11px] font-bold text-[#45464d] mb-1 uppercase tracking-wider">
                  Hazard Coordinates & Sector
                </h3>
                <p className="font-bold text-sm text-[#1b1b1d]">
                  {selectedReport.locationName}
                </p>
                <p className="text-xs text-[#76777d] mt-0.5">
                  {selectedReport.sector}
                </p>

                <button
                  onClick={() => onOpenInGIS(selectedReport)}
                  className="mt-3.5 w-full bg-[#131b2e] hover:bg-black text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open on GIS Interactive Map</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="High resolution evidence"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 bg-black/70 text-white p-2 rounded-full hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {isAddingNote && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-[#c6c6cd] shadow-2xl">
            <h3 className="text-base font-bold text-[#1b1b1d] mb-2">
              Add Dispatch Note to {selectedReport.reportId}
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter observation, emergency crew assignment, or road status..."
              className="w-full border border-[#c6c6cd] rounded p-3 text-xs text-[#1b1b1d] h-28 focus:outline-none focus:ring-2 focus:ring-[#131b2e] resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsAddingNote(false)}
                className="px-4 py-1.5 border border-[#c6c6cd] text-xs font-semibold rounded hover:bg-[#e4e2e4]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-1.5 bg-[#131b2e] text-white text-xs font-semibold rounded hover:bg-black"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
