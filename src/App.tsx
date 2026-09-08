import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { LoadingScreen } from './components/LoadingScreen';
import { AuthModal } from './components/AuthModal';
import { AdminUsersView } from './components/AdminUsersView';
import { UserLoginView } from './components/UserLoginView';
import { CitizenDashboardView } from './components/CitizenDashboardView';
import { AdminAccessGuard } from './components/AdminAccessGuard';
import { useOfflineTelemetry } from './utils/useOfflineTelemetry';
import { Database, WifiOff, RefreshCw } from 'lucide-react';

import {
  INITIAL_SENSORS,
  INITIAL_ALERTS,
  INITIAL_REPORTS,
  INITIAL_PREDICTIVE_INSIGHT,
  INITIAL_OFFICER_PROFILE,
} from './data/initialData';
import { AlertItem, IncidentReport, PredictiveAIInsight, SensorData, FieldOfficerProfile, AuthenticatedUser } from './types';

// Default civilian user profile (Standard Public Access Role)
const DEFAULT_CIVILIAN_USER: AuthenticatedUser = {
  id: 'citizen-907',
  name: 'Ayush Paul (Civilian)',
  email: 'paulayush907@gmail.com',
  phone: '+91 98765 43210',
  role: 'citizen',
  department: 'Public Civilian Access',
  jurisdiction: 'Kamrup / Guwahati Citizen Portal',
  isConfidentialCleared: false,
  token: 'citizen_session_token',
  loginTime: new Date().toISOString(),
  isAuthenticated: true,
};

export function App() {
  // Authenticated User State (Loaded from localStorage or initialized with civilian role)
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser>(() => {
    try {
      const saved = localStorage.getItem('lithos_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          isAuthenticated: parsed.isAuthenticated ?? true,
          loginTime: parsed.loginTime || new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('Failed to parse saved auth user:', e);
    }
    return DEFAULT_CIVILIAN_USER;
  });

  // Strict RBAC: Admin privilege is strictly derived from user's authenticated role
  const isAdmin = Boolean(
    currentUser &&
    currentUser.isAuthenticated &&
    (currentUser.role === 'admin' || currentUser.role === 'super_admin')
  );

  // Default tab: Civilians start on their designated Citizen Dashboard; Admins on Admin Dashboard
  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('lithos_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.role === 'admin' || parsed?.role === 'super_admin') {
          return 'admin_portal';
        }
      }
    } catch (e) {}
    return 'citizen_dashboard';
  });

  const [isOfficerMode, setIsOfficerMode] = useState<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<string>('risk_zones');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'user' | 'admin'>('user');

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
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [spikeActive, setSpikeActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show Toast notification helper with cleanup to prevent memory leaks and stale overwrites
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleSensorsLoadedFromCache = useCallback((cachedSensors: SensorData[]) => {
    setSensors(cachedSensors);
    showToast(`Loaded ${cachedSensors.length} cached sensors from IndexedDB (Offline mode)`);
  }, [showToast]);

  const handleReportsLoadedFromCache = useCallback((cachedReports: IncidentReport[]) => {
    setReports(cachedReports);
  }, []);

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
    handleSensorsLoadedFromCache,
    handleReportsLoadedFromCache
  );

  // Real-time sensor stream simulation
  useEffect(() => {
    if (!effectiveOnline) return;

    const interval = setInterval(() => {
      setSensors((prevSensors) =>
        prevSensors.map((sensor) => {
          let delta = (Math.random() - 0.48) * 0.3;
          if (spikeActive && (sensor.id.includes('PZ') || sensor.id.includes('NODE') || sensor.id === 'PZ-109')) {
            delta += 0.8;
          }
          if (spikeActive && (sensor.id.includes('INC') || sensor.id === 'INC-44')) {
            delta += 0.05;
          }
          const newValue = Math.max(0, +(sensor.value + delta).toFixed(1));
          const newSparkline = [...sensor.sparkline.slice(1), newValue];
          
          const baseSoil = sensor.soilMoisture ?? 65;
          const soilDelta = (Math.random() - 0.48) * 0.2;
          const newSoilMoisture = Math.min(99, Math.max(15, +(baseSoil + soilDelta).toFixed(1)));
          
          const updatedPorePressure = sensor.type === 'piezometer' ? newValue : (sensor.porePressure ? +(sensor.porePressure + delta * 0.5).toFixed(1) : undefined);
          const updatedDisplacement = sensor.type === 'inclinometer' ? newValue : (sensor.displacement ? +(sensor.displacement + (delta > 0 ? delta * 0.1 : 0)).toFixed(1) : undefined);
          const updatedRainfallRate = sensor.type === 'rain_gauge' ? newValue : sensor.rainfallRate;

          return {
            ...sensor,
            value: newValue,
            porePressure: updatedPorePressure,
            displacement: updatedDisplacement,
            rainfallRate: updatedRainfallRate,
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
    let targetLocation = 'site';
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          targetLocation = r.locationName;
          return {
            ...r,
            status: 'dispatched',
            notes: [...(r.notes || []), `Rapid Geotech Team 4 dispatched at ${new Date().toLocaleTimeString()}`],
          };
        }
        return r;
      })
    );
    showToast(`Emergency Geotechnical Unit dispatched to ${targetLocation}.`);
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
      showToast('Bhumi Rakshak Field Unit fully synchronized with HQ Command Server.');
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

  const handleToggleAdmin = useCallback((enableAdmin: boolean) => {
    if (enableAdmin) {
      const adminUser: AuthenticatedUser = {
        id: 'admin-super-01',
        name: 'Dr. A. Sharma (Director)',
        email: 'admin@gsi.gov.in',
        phone: '+91 361 223 4567',
        role: 'super_admin',
        department: 'Geological Survey of India (NER Directorate)',
        jurisdiction: 'NER Directorate & Border Monitoring',
        isConfidentialCleared: true,
        token: 'admin_sess_token',
        loginTime: new Date().toISOString(),
        isAuthenticated: true,
      };
      setCurrentUser(adminUser);
      try {
        localStorage.setItem('lithos_auth_user', JSON.stringify(adminUser));
      } catch (e) {}
      showToast('Admin clearance granted: Authenticated as Dr. Sharma (GSI Director)');
    } else {
      handleSwitchToCivilian();
    }
  }, [showToast]);

  const handleSwitchToCivilian = useCallback(() => {
    setCurrentUser(DEFAULT_CIVILIAN_USER);
    try {
      localStorage.setItem('lithos_auth_user', JSON.stringify(DEFAULT_CIVILIAN_USER));
    } catch (e) {}
    setCurrentTab('citizen_dashboard');
    showToast('Switched to Civilian Role. Admin features are strictly restricted.');
  }, [showToast]);

  const handleLoginSuccess = useCallback((user: AuthenticatedUser) => {
    const verifiedUserSession: AuthenticatedUser = {
      ...user,
      loginTime: user.loginTime || new Date().toISOString(),
      isAuthenticated: true,
    };
    setCurrentUser(verifiedUserSession);
    try {
      localStorage.setItem('lithos_auth_user', JSON.stringify(verifiedUserSession));
    } catch (e) {
      console.warn('Could not save user to localStorage:', e);
    }
    const isNowAdmin = verifiedUserSession.role === 'admin' || verifiedUserSession.role === 'super_admin';
    if (isNowAdmin) {
      setCurrentTab('admin_portal');
      showToast(`Administrator authenticated: ${verifiedUserSession.name}`);
    } else {
      setCurrentTab('citizen_dashboard');
      showToast(`Citizen authenticated: ${verifiedUserSession.name}`);
    }
  }, [showToast]);

  const handleLogout = useCallback(() => {
    setCurrentUser(DEFAULT_CIVILIAN_USER);
    try {
      localStorage.setItem('lithos_auth_user', JSON.stringify(DEFAULT_CIVILIAN_USER));
    } catch (e) {}
    setCurrentTab('citizen_dashboard');
    showToast('Session ended. Switched to Civilian Role.');
  }, [showToast]);

  return (
    <div className="h-screen w-full max-w-full bg-[#edf2f7] text-slate-900 flex flex-col font-sans overflow-hidden selection:bg-emerald-200">
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
        criticalAlertCount={criticalAlertsCount}
        isOfficerMode={isOfficerMode}
        onToggleOfficerMode={() => setIsOfficerMode(!isOfficerMode)}
        isAdmin={isAdmin}
        onToggleAdmin={handleToggleAdmin}
        onSwitchToCivilian={handleSwitchToCivilian}
        onOpenCitizenGuide={() => setIsCitizenGuideOpen(true)}
        onOpenNewIncident={() => setIsNewIncidentModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onRebootDiagnostics={() => setIsAppLoading(true)}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={toggleSimulatedOffline}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        currentUser={currentUser}
        onOpenAuthModal={(mode) => {
          setAuthInitialMode(mode || 'user');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Offline Banner */}
      {!effectiveOnline && (
        <div className="shrink-0 bg-amber-500 text-amber-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md border-b border-amber-600 z-30">
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
              className="px-2.5 py-1 bg-amber-900 hover:bg-black text-white rounded text-[11px] font-mono transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Database className="w-3 h-3" />
              <span>Snapshot State</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Layout Body (Sidebar + Content Area) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left SideNav */}
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
          isAdmin={isAdmin}
          currentUser={currentUser}
          onOpenAdminLogin={() => {
            setAuthInitialMode('admin');
            setIsAuthModalOpen(true);
          }}
          onSwitchToCivilian={handleSwitchToCivilian}
        />

        {/* Content Area */}
        <main className={`flex-1 flex flex-col min-w-0 min-h-0 ${currentTab === 'map' ? 'overflow-hidden' : 'overflow-y-auto'} bg-[#edf2f7]`}>
          
          {/* Designated Citizen Dashboard */}
          {currentTab === 'citizen_dashboard' && (
            <CitizenDashboardView
              currentUser={currentUser}
              alerts={alerts}
              reports={reports}
              onOpenNewIncident={() => setIsNewIncidentModalOpen(true)}
              onOpenCitizenGuide={() => setIsCitizenGuideOpen(true)}
              onOpenAuthModal={(mode) => {
                setAuthInitialMode(mode || 'admin');
                setIsAuthModalOpen(true);
              }}
              onShowToast={showToast}
              onSwitchToAdminLogin={() => {
                setAuthInitialMode('admin');
                setIsAuthModalOpen(true);
              }}
            />
          )}

          {/* Main Dashboard (Operational for all users) */}
          {currentTab === 'dashboard' && (
            <DashboardView
              sensors={sensors}
              alerts={alerts}
              reports={reports}
              activeLayer={activeLayer}
              onSelectLayer={(layer) => setActiveLayer(layer)}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onSelectSensor={(sensor) => {
                if (isAdmin) {
                  setSelectedSensor(sensor);
                  setCurrentTab('sensors');
                } else {
                  showToast('Sensor data calibration and telemetry view are restricted to administrators.');
                }
              }}
              onSelectReport={(report) => {
                setSelectedReport(report);
                setCurrentTab('reports');
              }}
              onNavigateToMetrics={() => setCurrentTab('metrics')}
              onNavigateToTelemetry={() => setCurrentTab('telemetry')}
              onExportReport={handleExportData}
              onViewAllAlerts={() => setCurrentTab('alerts')}
              onNavigateToMap={() => setCurrentTab('map')}
            />
          )}

          {/* Real-Time Telemetry & Regional Monitoring (Fully visible and operational) */}
          {currentTab === 'telemetry' && (
            <RealTimeAnalyticsView
              sensors={sensors}
              onNavigateToMap={() => setCurrentTab('map')}
              onNavigateToAlerts={() => setCurrentTab('alerts')}
              onSelectSensor={(sensor) => {
                if (isAdmin) {
                  setSelectedSensor(sensor);
                  setCurrentTab('sensors');
                } else {
                  showToast('Sensor data calibration is restricted to administrators.');
                }
              }}
              onSimulateSpike={() => {
                if (isAdmin) {
                  handleToggleSimulatedSpike();
                } else {
                  showToast('Simulating sensor anomaly spikes requires administrator authentication.');
                  setAuthInitialMode('admin');
                  setIsAuthModalOpen(true);
                }
              }}
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
                  if (isAdmin) {
                    setSelectedSensor(sensor);
                    setCurrentTab('sensors');
                  } else {
                    showToast('Direct sensor telemetry view requires administrative clearance.');
                  }
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

          {/* Sensor Data (Restricted from civilians) */}
          {currentTab === 'sensors' && (
            isAdmin ? (
              <SensorsView
                sensors={sensors}
                onSelectSensor={setSelectedSensor}
                onExportSensors={handleExportData}
                onSimulateSpike={handleToggleSimulatedSpike}
                isSpikeActive={spikeActive}
                onOpenVisualizer={() => setCurrentTab('telemetry')}
                isAdmin={isAdmin}
                onToggleAdmin={handleToggleAdmin}
              />
            ) : (
              <AdminAccessGuard
                featureName="Sensor Data"
                featureDescription="Raw borehole piezometer telemetry, subsurface shear inclinometers, and calibration spike controls are strictly restricted from the civilian user role."
                onAuthenticateSuccess={(admin) => {
                  handleLoginSuccess(admin);
                  setCurrentTab('sensors');
                }}
                onReturnToCitizenDashboard={() => setCurrentTab('citizen_dashboard')}
                onShowToast={showToast}
              />
            )
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
                setCurrentTab(isAdmin ? 'dashboard' : 'citizen_dashboard');
              }}
              onOpenNewIncident={() => setIsNewIncidentModalOpen(true)}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView />
          )}

          {currentTab === 'user_login' && (
            <UserLoginView
              currentUser={currentUser}
              onLoginSuccess={handleLoginSuccess}
              onLogout={handleLogout}
              onNavigateToTab={(tab) => setCurrentTab(tab)}
              onShowToast={showToast}
            />
          )}

          {/* Admin Dashboard / Users Portal (Restricted from civilians) */}
          {(currentTab === 'users' || currentTab === 'admin_portal') && (
            isAdmin ? (
              <AdminUsersView
                currentUser={currentUser}
                onLoginSuccess={handleLoginSuccess}
                onOpenAuthModal={(mode) => {
                  setAuthInitialMode(mode || 'user');
                  setIsAuthModalOpen(true);
                }}
                onShowToast={showToast}
              />
            ) : (
              <AdminAccessGuard
                featureName="Admin Dashboard"
                featureDescription="Administrative user oversight, role authorizations, access tokens, and agency dispatch logs are strictly restricted from the civilian user role."
                onAuthenticateSuccess={(admin) => {
                  handleLoginSuccess(admin);
                  setCurrentTab('admin_portal');
                }}
                onReturnToCitizenDashboard={() => setCurrentTab('citizen_dashboard')}
                onShowToast={showToast}
              />
            )
          )}

          {/* System Logs (Restricted from civilians) */}
          {currentTab === 'logs' && (
            isAdmin ? (
              <SystemLogsView />
            ) : (
              <AdminAccessGuard
                featureName="System Logs"
                featureDescription="Raw sensor packet streams, edge gateway daemon kernels, and administrative audit trails are strictly restricted from the civilian user role."
                onAuthenticateSuccess={(admin) => {
                  handleLoginSuccess(admin);
                  setCurrentTab('logs');
                }}
                onReturnToCitizenDashboard={() => setCurrentTab('citizen_dashboard')}
                onShowToast={showToast}
              />
            )
          )}

          {/* Configuration Tools (Restricted from civilians) */}
          {currentTab === 'configuration' && (
            isAdmin ? (
              <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-900 mx-auto">
                  <Database className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">System & GIS Configuration</h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Spatial projections, sensor polling intervals, alert thresholds, and offline storage.
                  </p>
                </div>
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="px-5 py-2.5 bg-[#131b2e] hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Launch Configuration Window
                </button>
              </div>
            ) : (
              <AdminAccessGuard
                featureName="Configuration Tools"
                featureDescription="GIS datum configuration, polling intervals, edge data cache rules, and sensor alert thresholds are strictly restricted from the civilian user role."
                onAuthenticateSuccess={(admin) => {
                  handleLoginSuccess(admin);
                  setIsSettingsModalOpen(true);
                }}
                onReturnToCitizenDashboard={() => setCurrentTab('citizen_dashboard')}
                onShowToast={showToast}
              />
            )
          )}
        </main>
      </div>

      {/* Footer Status Bar matching mockup */}
      <FooterBar />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authInitialMode}
      />

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
        onToggleAdmin={handleToggleAdmin}
        onAdminAuthenticated={handleLoginSuccess}
        cacheStats={cacheStats}
        lastCachedAt={lastCachedAt}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={toggleSimulatedOffline}
        onForceCache={() => forceSaveCache(sensors, reports)}
        onClearCache={clearCache}
        onRebootDiagnostics={() => setIsAppLoading(true)}
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

      {/* Default System Loading / Boot Telemetry Screen */}
      {isAppLoading && (
        <LoadingScreen 
          onComplete={() => setIsAppLoading(false)} 
          minDisplayTimeMs={2200} 
        />
      )}
    </div>
  );
}

export default App;
