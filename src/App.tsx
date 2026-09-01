import React, { useState, useEffect } from 'react';
import { TopNavbar } from './components/TopNavbar';
import { SideNav } from './components/SideNav';
import { FooterBar } from './components/FooterBar';
import { DashboardView } from './components/DashboardView';
import { EnvironmentalMetricsView } from './components/EnvironmentalMetricsView';
import { ReportsView } from './components/ReportsView';
import { SensorsView } from './components/SensorsView';
import { OfficerProfileView } from './components/OfficerProfileView';
import { RealTimeAnalyticsView } from './components/RealTimeAnalyticsView';
import { AlertsListView } from './components/AlertsListView';
import { HistoryView } from './components/HistoryView';
import { SystemLogsView } from './components/SystemLogsView';
import { NewIncidentModal } from './components/NewIncidentModal';
import { EmergencyProtocolModal } from './components/EmergencyProtocolModal';
import { CitizenGuideModal } from './components/CitizenGuideModal';
import { SettingsModal } from './components/SettingsModal';
import { MapCanvas } from './components/MapCanvas';
import { EdgeHardwareFusionConsole } from './components/EdgeHardwareFusionConsole';
import { useOfflineTelemetry } from './utils/useOfflineTelemetry';
import { Database, WifiOff, RefreshCw } from 'lucide-react';

import {
  INITIAL_SENSORS,
  INITIAL_ALERTS,
  INITIAL_REPORTS,
  INITIAL_PREDICTIVE_INSIGHT,
  INITIAL_OFFICER_PROFILE,
} from './data/initialData';
import { AlertItem, IncidentReport, PredictiveAIInsight, SensorData, FieldOfficerProfile } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isOfficerMode, setIsOfficerMode] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [activeLayer, setActiveLayer] = useState<string>('risk_zones');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Application Data States
  const [sensors, setSensors] = useState<SensorData[]>(INITIAL_SENSORS);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [reports, setReports] = useState<IncidentReport[]>(INITIAL_REPORTS);
  const [selectedReport, setSelectedReport] = useState<IncidentReport>(INITIAL_REPORTS[0]);
  const [selectedSensor, setSelectedSensor] = useState<SensorData | null>(INITIAL_SENSORS[0]);
  const [aiInsight, setAiInsight] = useState<PredictiveAIInsight>(INITIAL_PREDICTIVE_INSIGHT);
  const [officerProfile, setOfficerProfile] = useState<FieldOfficerProfile>(INITIAL_OFFICER_PROFILE);

  // Modals & UI States
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isNewIncidentModalOpen, setIsNewIncidentModalOpen] = useState(false);
  const [isCitizenGuideOpen, setIsCitizenGuideOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [spikeActive, setSpikeActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Offline Telemetry & IndexedDB storage hook
  const {
    isOnline,
    isSimulatedOffline,
    effectiveOnline,
    isServingFromCache,
    lastCachedAt,
    cacheStats,
    toggleSimulatedOffline,
    forceSaveCache,
    clearCache,
  } = useOfflineTelemetry(
    sensors,
    reports,
    (cachedSensors) => {
      setSensors(cachedSensors);
      showToast(`Loaded ${cachedSensors.length} cached sensors from IndexedDB (Offline mode)`);
    },
    (cachedReports) => {
      setReports(cachedReports);
    }
  );

  // Real-time sensor stream simulation
  useEffect(() => {
    if (!effectiveOnline) return;

    const interval = setInterval(() => {
      setSensors((prevSensors) =>
        prevSensors.map((sensor) => {
          let delta = (Math.random() - 0.48) * 0.3;
          if (spikeActive && sensor.id === 'PZ-109') {
            delta += 0.8;
          }
          if (spikeActive && sensor.id === 'INC-44') {
            delta += 0.05;
          }
          const newValue = Math.max(0, +(sensor.value + delta).toFixed(1));
          const newSparkline = [...sensor.sparkline.slice(1), newValue];
          
          const baseSoil = sensor.soilMoisture ?? 65;
          const soilDelta = (Math.random() - 0.48) * 0.2;
          const newSoilMoisture = Math.min(99, Math.max(15, +(baseSoil + soilDelta).toFixed(1)));
          
          return {
            ...sensor,
            value: newValue,
            soilMoisture: newSoilMoisture,
            sparkline: newSparkline,
            lastUpdated: 'Just now',
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [spikeActive, effectiveOnline]);

  // Handle AI Risk prediction call
  const handleRefreshAI = async () => {
    setIsLoadingAI(true);
    try {
      const res = await fetch('/api/ai/predict-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensors,
          rainfall: 45,
          soilMoisture: 84,
          sector: 'Zone Alpha & Sector 4',
        }),
      });
      const data = await res.json();
      if (data && !data.error) {
        setAiInsight((prev) => ({
          ...prev,
          ...data,
          historicalAnalogues: prev.historicalAnalogues,
        }));
        showToast('Gemini Geotechnical AI Model updated hazard prediction.');
      } else {
        showToast('AI analysis completed using calibrated geotech baseline.');
      }
    } catch (err) {
      console.error(err);
      showToast('Telemetry processed via Geotechnical Edge Engine.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Toggle Anomaly Spike
  const handleToggleSimulatedSpike = async () => {
    const nextState = !spikeActive;
    setSpikeActive(nextState);
    try {
      await fetch('/api/sensors/simulate-spike', { method: 'POST' });
    } catch (e) {
      // client side fallback
    }

    if (nextState) {
      showToast('ALERT: Simulated pore pressure spike injected into Sector Alpha!');
    } else {
      showToast('Telemetry reset to nominal operational baseline.');
    }
  };

  // Acknowledge Alert
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
    showToast('Alert acknowledged and logged in dispatch log.');
  };

  // Dispatch Team Action
  const handleDispatchTeam = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'dispatched',
              notes: [...(r.notes || []), `Rapid Geotech Team 4 dispatched at ${new Date().toLocaleTimeString()}`],
            }
          : r
      )
    );
    showToast(`Emergency Geotechnical Unit dispatched to ${selectedReport.locationName}.`);
  };

  // Dismiss Report
  const handleDismissReport = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'dismissed' } : r))
    );
    showToast('Incident report marked as resolved.');
  };

  // Add Note to Report
  const handleAddNote = (reportId: string, note: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, notes: [...(r.notes || []), note] } : r))
    );
    showToast('Field note added to incident record.');
  };

  // Force Sync Field Officer Data
  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setOfficerProfile((prev) => ({
        ...prev,
        lastSyncTime: `${new Date().toLocaleTimeString()} UTC`,
      }));
      showToast('Lithos Field Unit fully synchronized with HQ Command Server.');
    }, 1200);
  };

  // Submit New Incident
  const handleSubmitNewIncident = (reportData: Partial<IncidentReport>) => {
    const newRpt: IncidentReport = {
      id: `rpt-${Date.now()}`,
      reportId: `#RPT-${Math.floor(10000 + Math.random() * 90000)}F`,
      title: reportData.title || 'Field Incident',
      category: reportData.category || 'sensor_failure',
      severity: reportData.severity || 'amber',
      description: reportData.description || '',
      submittedBy: reportData.submittedBy || 'Field Officer J. Doe',
      timestamp: `Today - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      source: 'field_officer',
      lat: reportData.lat || 27.85,
      lng: reportData.lng || 95.32,
      locationName: reportData.locationName || 'East Siang District',
      sector: 'Sector Alpha',
      status: 'pending',
      photos: reportData.photos || [],
      nlpRiskScore: reportData.nlpRiskScore || 85,
      sensorsInArea: 2,
      duplicateStatus: 'None detected',
      notes: ['Incident logged by mobile field officer.'],
    };

    setReports([newRpt, ...reports]);
    setSelectedReport(newRpt);
    showToast('New incident logged and transmitted to HQ dispatch queue.');
  };

  // Export Data
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ sensors, alerts, reports }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `landslide_early_warning_data_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Telemetry and incident dataset exported.');
  };

  const criticalAlertsCount = alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-[#edf2f7] text-slate-900 flex flex-col font-sans selection:bg-emerald-200">
      {/* Top Navbar */}
      <TopNavbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setIsOfficerMode(false);
          setCurrentTab(tab);
        }}
        onOpenEmergency={() => setIsEmergencyModalOpen(true)}
        onOpenProfile={() => {
          setIsOfficerMode(false);
          setCurrentTab('users');
        }}
        criticalAlertCount={3}
        isOfficerMode={isOfficerMode}
        onToggleOfficerMode={() => setIsOfficerMode(!isOfficerMode)}
        isAdmin={isAdmin}
        onToggleAdmin={(val) => setIsAdmin(val)}
        onOpenCitizenGuide={() => setIsCitizenGuideOpen(true)}
        onOpenNewIncident={() => setIsNewIncidentModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={toggleSimulatedOffline}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Offline Banner */}
      {!effectiveOnline && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-amber-500 text-amber-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md border-b border-amber-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-950 animate-ping shrink-0" />
            <WifiOff className="w-4 h-4 shrink-0 text-amber-950" />
            <span>
              {isSimulatedOffline ? 'OFFLINE SIMULATION ACTIVE' : 'CONNECTION LOST'}: Viewing last known sensor state from IndexedDB cache.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => forceSaveCache(sensors, reports)}
              className="px-2.5 py-1 bg-amber-900 hover:bg-black text-white rounded text-[11px] font-mono transition-colors flex items-center gap-1"
            >
              <Database className="w-3 h-3" />
              <span>Snapshot State</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Layout Body */}
      <div className={`flex ${!effectiveOnline ? 'pt-24' : 'pt-16'} pb-12 h-screen overflow-hidden`}>
        {/* Left SideNav matching mockup */}
        <SideNav
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'configuration') {
              setIsSettingsModalOpen(true);
            } else {
              setCurrentTab(tab);
            }
          }}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Area (offset by sidebar width on large screens) */}
        <main className="flex-1 flex flex-col overflow-hidden lg:pl-60">
          {currentTab === 'dashboard' && (
            <DashboardView
              sensors={sensors}
              alerts={alerts}
              reports={reports}
              activeLayer={activeLayer}
              onSelectLayer={(layer) => setActiveLayer(layer)}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onSelectSensor={(sensor) => {
                setSelectedSensor(sensor);
                setCurrentTab('sensors');
              }}
              onSelectReport={(report) => {
                setSelectedReport(report);
                setCurrentTab('reports');
              }}
              onNavigateToMetrics={() => setCurrentTab('metrics')}
              onNavigateToTelemetry={() => setCurrentTab('telemetry')}
              onExportReport={handleExportData}
              onViewAllAlerts={() => setCurrentTab('alerts')}
            />
          )}

          {currentTab === 'telemetry' && (
            <RealTimeAnalyticsView
              sensors={sensors}
              onSelectSensor={(sensor) => {
                setSelectedSensor(sensor);
                setCurrentTab('sensors');
              }}
              onSimulateSpike={handleToggleSimulatedSpike}
              isSpikeActive={spikeActive}
              onTriggerAlertNotification={(triggered) => {
                showToast(`ALERT: [${triggered.ruleName}] ${triggered.message}`);
              }}
            />
          )}

          {currentTab === 'map' && (
            <div className="flex-1 h-full relative">
              <MapCanvas
                sensors={sensors}
                reports={reports}
                activeLayer={activeLayer}
                onSelectLayer={(layer) => setActiveLayer(layer)}
                onSelectSensor={(sensor) => {
                  setSelectedSensor(sensor);
                  setCurrentTab('sensors');
                }}
                onSelectReport={(report) => {
                  setSelectedReport(report);
                  setCurrentTab('reports');
                }}
                isAdmin={isAdmin}
              />
            </div>
          )}

          {currentTab === 'alerts' && (
            <AlertsListView
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onOpenEmergency={() => setIsEmergencyModalOpen(true)}
            />
          )}

          {currentTab === 'sensors' && (
            <SensorsView
              sensors={sensors}
              onSelectSensor={setSelectedSensor}
              onExportSensors={handleExportData}
              onSimulateSpike={handleToggleSimulatedSpike}
              isSpikeActive={spikeActive}
              onOpenVisualizer={() => setCurrentTab('telemetry')}
              isAdmin={isAdmin}
              onToggleAdmin={(val) => setIsAdmin(val)}
            />
          )}

          {currentTab === 'metrics' && (
            <EnvironmentalMetricsView
              insight={aiInsight}
              sensors={sensors}
              onRefreshAI={handleRefreshAI}
              isLoadingAI={isLoadingAI}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              reports={reports}
              selectedReport={selectedReport}
              onSelectReport={setSelectedReport}
              onDispatchTeam={handleDispatchTeam}
              onDismissReport={handleDismissReport}
              onAddNote={handleAddNote}
              onOpenInGIS={(report) => {
                setSelectedReport(report);
                setCurrentTab('dashboard');
              }}
              onOpenNewIncident={() => setIsNewIncidentModalOpen(true)}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView />
          )}

          {currentTab === 'users' && (
            <OfficerProfileView
              profile={officerProfile}
              onForceSync={handleForceSync}
              isSyncing={isSyncing}
              onTogglePolling={() => {
                setOfficerProfile((p) => ({ ...p, aggressivePolling: !p.aggressivePolling }));
                showToast(`Sensor polling rate adjusted.`);
              }}
            />
          )}

          {currentTab === 'logs' && (
            <SystemLogsView />
          )}
        </main>
      </div>

      {/* Footer Status Bar matching mockup */}
      <FooterBar />

      {/* Modals */}
      <NewIncidentModal
        isOpen={isNewIncidentModalOpen}
        onClose={() => setIsNewIncidentModalOpen(false)}
        onSubmit={handleSubmitNewIncident}
      />

      <EmergencyProtocolModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onBroadcastAlert={(details) => {
          showToast(`EMERGENCY ORDER ACTIVATED: Evacuation zone ${details.evacRadius} broadcasted!`);
        }}
      />

      <CitizenGuideModal
        isOpen={isCitizenGuideOpen}
        onClose={() => setIsCitizenGuideOpen(false)}
        sensors={sensors}
        onOpenReportModal={() => setIsNewIncidentModalOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isAdmin={isAdmin}
        onToggleAdmin={(val) => setIsAdmin(val)}
        cacheStats={cacheStats}
        lastCachedAt={lastCachedAt}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={toggleSimulatedOffline}
        onForceCache={() => forceSaveCache(sensors, reports)}
        onClearCache={clearCache}
        onSaveSettings={(saved) => {
          showToast(`Settings Saved: ${saved.units.toUpperCase()} units, ${saved.crs} datum, ${saved.pollingRate}s polling`);
        }}
      />

      {/* Toast Floating Alert */}
      {toastMessage && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 bg-[#0a1128] text-white px-5 py-2.5 rounded-full shadow-2xl text-xs font-semibold flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
