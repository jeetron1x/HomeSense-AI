import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from './components/Header.tsx';
import { NavigationBar } from './components/NavigationBar.tsx';
import { ScanView } from './components/ScanView.tsx';
import { SummaryView } from './components/SummaryView.tsx';
import { MonitorView } from './components/MonitorView.tsx';
import { AppliancesView } from './components/AppliancesView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { SplashScreen } from './components/SplashScreen.tsx';
import { AuthScreen } from './components/AuthScreen.tsx';
import { OfficeKitModal } from './components/OfficeKitModal.tsx';
import { SerialEntryModal } from './components/SerialEntryModal.tsx';
import { DiagnosticsModal } from './components/DiagnosticsModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Toast } from './components/Toast.tsx';
import { triggerHaptic } from './utils/haptics.ts';
import {
  TabType,
  Appliance,
  AnomalyItem,
  AcousticTelemetry,
  UserAccount,
  ThemeMode,
} from './types.ts';

// Clean initial state: ZERO pre-uploaded data per user mandate
const initialAppliances: Appliance[] = [];
const initialAnomalies: AnomalyItem[] = [];

const initialTelemetry: AcousticTelemetry = {
  sampleRate: '48.0 kHz',
  bitDepth: '24-bit',
  snrDb: 98.4,
  noiseFloorDbfs: -72,
  fftSize: 2048,
  peakFrequencyHz: 842,
  vibrationIndexG: 0.01,
  spectralFluxDeltaS: 1.12,
  status: 'active',
  sensitivity: 'High',
  isMuted: false,
};

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('scan');

  // Theme Management (AMOLED Dark / Minimalist Light)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('homesense_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  // User Authentication Gate - defaults to NULL so no data or views are accessible before login
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('homesense_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // User-scoped Appliances (empty by default)
  const [appliances, setAppliances] = useState<Appliance[]>(() => {
    try {
      const savedUser = localStorage.getItem('homesense_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const saved = localStorage.getItem(`homesense_appliances_${u.id}`);
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return initialAppliances;
  });

  // User-scoped Anomalies (empty by default)
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>(() => {
    try {
      const savedUser = localStorage.getItem('homesense_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const saved = localStorage.getItem(`homesense_anomalies_${u.id}`);
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return initialAnomalies;
  });

  const [telemetry, setTelemetry] = useState<AcousticTelemetry>(initialTelemetry);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isOfficeKitOpen, setIsOfficeKitOpen] = useState(false);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [diagnosticsAppliance, setDiagnosticsAppliance] = useState<Appliance | null>(null);

  // Sync Theme to HTML and LocalStorage
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    if (document.body) {
      document.body.classList.remove('dark', 'light');
      document.body.classList.add(theme);
    }
    try {
      localStorage.setItem('homesense_theme', theme);
    } catch {}
  }, [theme]);

  // Sync Appliances to LocalStorage per user
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(`homesense_appliances_${user.id}`, JSON.stringify(appliances));
    } catch {}
  }, [appliances, user]);

  // Sync Anomalies to LocalStorage per user
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(`homesense_anomalies_${user.id}`, JSON.stringify(anomalies));
    } catch {}
  }, [anomalies, user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleLogin = (newUser: UserAccount) => {
    setUser(newUser);
    triggerHaptic('success');
    try {
      localStorage.setItem('homesense_user', JSON.stringify(newUser));
      const savedApps = localStorage.getItem(`homesense_appliances_${newUser.id}`);
      if (savedApps) {
        setAppliances(JSON.parse(savedApps));
      } else {
        setAppliances([]);
      }
      const savedAnoms = localStorage.getItem(`homesense_anomalies_${newUser.id}`);
      if (savedAnoms) {
        setAnomalies(JSON.parse(savedAnoms));
      } else {
        setAnomalies([]);
      }
    } catch {}
  };

  const handleLogout = () => {
    triggerHaptic('warning');
    setUser(null);
    setAppliances([]);
    setAnomalies([]);
    try {
      localStorage.removeItem('homesense_user');
    } catch {}
    showToast('Signed out of Smart Living Vault');
  };

  const handleToggleTorch = () => {
    triggerHaptic('tap');
    setIsTorchOn((prev) => !prev);
    showToast(!isTorchOn ? 'Torch Active' : 'Torch Standby');
  };

  const handleToggleEcoMode = (id: string) => {
    triggerHaptic('selection');
    setAppliances((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          const next = !app.isEcoMode;
          showToast(`${app.name}: Smart Eco Mode ${next ? 'Enabled' : 'Disabled'}`);
          return { ...app, isEcoMode: next };
        }
        return app;
      })
    );
  };

  const handleDeleteAppliance = (id: string) => {
    triggerHaptic('warning');
    setAppliances((prev) => prev.filter((app) => app.id !== id));
    showToast('Appliance removed from inventory');
  };

  const handleSaveAppliance = (appPartial: Partial<Appliance>) => {
    triggerHaptic('success');
    const newApp: Appliance = {
      id: appPartial.id || `app-${Date.now()}`,
      name: appPartial.name || 'Verified BEE Appliance',
      category: appPartial.category || 'hvac',
      location: appPartial.location || 'Living Hub',
      model: appPartial.model || 'BEE-2026-CERT',
      starRating: appPartial.starRating || 5,
      certTitle: appPartial.certTitle || '5-Star BEE Certified',
      efficiencyMetric: appPartial.efficiencyMetric || 'ISEER',
      efficiencyValue: appPartial.efficiencyValue || '5.2 Ratio',
      powerDrawWatts: appPartial.powerDrawWatts || 750,
      acousticVibration: appPartial.acousticVibration || '0.01G Nom',
      loadIndex: appPartial.loadIndex || 'Active Load',
      status: appPartial.status || 'Active Eco',
      isEcoMode: appPartial.isEcoMode ?? true,
    };

    setAppliances((prev) => {
      const existsIndex = prev.findIndex((item) => item.model === newApp.model);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = { ...updated[existsIndex], ...newApp };
        return updated;
      }
      return [newApp, ...prev];
    });

    showToast(`✓ Saved ${newApp.name} to persistent inventory!`);
  };

  const handleAddSerialAppliance = (serial: string) => {
    triggerHaptic('success');
    const isAc = serial.includes('CS') || serial.includes('DI');
    const isFridge = serial.includes('REF');
    const isWasher = serial.includes('WM');

    const newApp: Appliance = {
      id: `app-${Date.now()}`,
      name: isAc
        ? 'Panasonic Inverter AC 1.5T'
        : isFridge
        ? 'Samsung Frost-Free 253L'
        : isWasher
        ? 'LG Vivace Front Load 8kg'
        : `BEE Appliance (${serial})`,
      category: isFridge ? 'refrig' : isWasher ? 'laundry' : 'hvac',
      location: isFridge ? 'Kitchen Hub' : isWasher ? 'Utility Area' : 'Master Bedroom',
      model: serial,
      starRating: 5,
      certTitle: '5-Star BEE Certified',
      efficiencyMetric: isFridge ? 'Consumption' : 'ISEER',
      efficiencyValue: isFridge ? '180 kWh/yr' : '5.10 Ratio',
      powerDrawWatts: isFridge ? 140 : isWasher ? 360 : 780,
      acousticVibration: '0.01G Nom',
      loadIndex: '48% Cap',
      status: 'Active Eco',
      isEcoMode: true,
    };

    setAppliances((prev) => [newApp, ...prev]);
    showToast(`✓ Verified & Saved ${newApp.name} to Home Inventory`);
  };

  const handleUpdateTelemetry = (updated: Partial<AcousticTelemetry>) => {
    setTelemetry((prev) => ({ ...prev, ...updated }));
  };

  const handleTriggerAnomalyAlert = (name: string) => {
    triggerHaptic('warning');
    const newAnom: AnomalyItem = {
      id: `anom-${Date.now()}`,
      title: name,
      description: `Acoustic harmonic deviation detected at ${telemetry.peakFrequencyHz} Hz`,
      severity: 'high',
      category: 'acoustic',
      timeWindow: 'Just Now',
      costImpactInr: 45,
      icon: 'warning',
    };
    setAnomalies((prev) => [newAnom, ...prev]);
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'scan':
        return 'BEE Star Scanner';
      case 'summary':
        return 'Energy Hub';
      case 'monitor':
        return 'Acoustic Sense 48kHz';
      case 'appliances':
        return 'Connected Fleet';
      case 'settings':
        return 'Smart Vault & Settings';
      default:
        return 'HomeSense AI';
    }
  };

  const getHeaderSubtitle = () => {
    switch (activeTab) {
      case 'scan':
        return 'Optical Sensor Verification';
      case 'summary':
        return user?.propertyName || 'Energy Audit Ledger';
      case 'monitor':
        return 'Live Sensor Telemetry';
      case 'appliances':
        return `${appliances.length} Managed Appliance${appliances.length === 1 ? '' : 's'}`;
      case 'settings':
        return user?.address || 'On-Device Encrypted Vault';
      default:
        return 'Smart Living Auditor';
    }
  };

  const isLight = theme === 'light';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden transition-colors duration-300 ${
        isLight
          ? 'bg-[#f8fafc] text-slate-900 selection:bg-cyan-500 selection:text-white'
          : 'bg-[#080b11] text-slate-100 selection:bg-cyan-400 selection:text-black'
      }`}
    >
      {/* Animated Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            theme={theme}
            onFinish={() => setShowSplash(false)}
          />
        )}
      </AnimatePresence>

      {/* Mandatory Authentication Gate: if user is not logged in/registered, show AuthScreen */}
      {!user && (
        <AuthScreen
          onLogin={handleLogin}
          onShowToast={showToast}
          theme={theme}
          onToggleTheme={() => {
            const next = theme === 'dark' ? 'light' : 'dark';
            setTheme(next);
            showToast(next === 'dark' ? 'Switched to AMOLED Dark' : 'Switched to Light Theme');
          }}
        />
      )}

      {/* Authenticated Dashboard */}
      {user && (
        <>
          {/* Subtle Ambient Glow (Cyan to Royal Blue logo theme) */}
          <div
            className={`fixed -top-32 -left-32 w-80 h-80 rounded-full blur-[140px] pointer-events-none transition-opacity duration-300 ${
              isLight ? 'bg-cyan-500/10' : 'bg-cyan-500/5'
            }`}
          />
          <div
            className={`fixed -bottom-32 -right-32 w-80 h-80 rounded-full blur-[140px] pointer-events-none transition-opacity duration-300 ${
              isLight ? 'bg-blue-300/30' : 'bg-blue-900/10'
            }`}
          />

          {/* Top Sticky Header */}
          <Header
            title={getHeaderTitle()}
            subtitle={getHeaderSubtitle()}
            isTorchOn={isTorchOn}
            onTorchToggle={handleToggleTorch}
            onOpenProfile={() => {
              triggerHaptic('tap');
              setActiveTab('settings');
            }}
            onOpenNotifications={() => {
              triggerHaptic('tap');
              setActiveTab('summary');
            }}
            unreadCount={anomalies.length}
            theme={theme}
            onToggleTheme={() => {
              const next = theme === 'dark' ? 'light' : 'dark';
              setTheme(next);
              showToast(next === 'dark' ? 'Switched to AMOLED Dark' : 'Switched to Light Theme');
            }}
          />

          {/* Toast Notification */}
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

          {/* Main View Transition Frame */}
          <main className="flex-1 w-full max-w-lg mx-auto flex flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full"
              >
                {activeTab === 'scan' && (
                  <ScanView
                    onShowToast={showToast}
                    onOpenSerialModal={() => {
                      triggerHaptic('tap');
                      setIsSerialModalOpen(true);
                    }}
                    isTorchOn={isTorchOn}
                    onTorchToggle={handleToggleTorch}
                    onSaveAppliance={handleSaveAppliance}
                    onNavigateToAppliances={() => {
                      triggerHaptic('selection');
                      setActiveTab('appliances');
                    }}
                    theme={theme}
                  />
                )}

                {activeTab === 'summary' && (
                  <SummaryView
                    appliances={appliances}
                    anomalies={anomalies}
                    onNavigateToMonitor={() => {
                      triggerHaptic('selection');
                      setActiveTab('monitor');
                    }}
                    onOpenOfficeKit={() => {
                      triggerHaptic('tap');
                      setIsOfficeKitOpen(true);
                    }}
                    onShowToast={showToast}
                    theme={theme}
                  />
                )}

                {activeTab === 'monitor' && (
                  <MonitorView
                    onShowToast={showToast}
                    telemetry={telemetry}
                    onUpdateTelemetry={handleUpdateTelemetry}
                    onTriggerAnomalyAlert={handleTriggerAnomalyAlert}
                    theme={theme}
                  />
                )}

                {activeTab === 'appliances' && (
                  <AppliancesView
                    appliances={appliances}
                    onToggleEco={handleToggleEcoMode}
                    onOpenDiagnostics={(app) => {
                      triggerHaptic('tap');
                      setDiagnosticsAppliance(app);
                    }}
                    onNavigateToScan={() => {
                      triggerHaptic('selection');
                      setActiveTab('scan');
                    }}
                    onOpenSerialModal={() => {
                      triggerHaptic('tap');
                      setIsSerialModalOpen(true);
                    }}
                    onShowToast={showToast}
                    onDeleteAppliance={handleDeleteAppliance}
                    theme={theme}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsView
                    user={user}
                    onOpenAuth={() => {
                      triggerHaptic('tap');
                      setIsAuthOpen(true);
                    }}
                    onLogout={handleLogout}
                    theme={theme}
                    onChangeTheme={setTheme}
                    onShowToast={showToast}
                    onOpenOfficeKit={() => {
                      triggerHaptic('tap');
                      setIsOfficeKitOpen(true);
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Mobile-first Bottom Navigation Bar (Animated into view AFTER splash screen) */}
          <AnimatePresence>
            {!showSplash && (
              <NavigationBar
                key="bottom-navigation-bar"
                currentTab={activeTab}
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onChangeTab={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                anomaliesCount={anomalies.length}
                unreadAnomaliesCount={anomalies.length}
                theme={theme}
                onOpenBrandInfo={() => {
                  showToast('HomeSense AI • Developed by Team Invincibles');
                }}
              />
            )}
          </AnimatePresence>

          {/* Interactive Modals */}
          <OfficeKitModal
            isOpen={isOfficeKitOpen}
            onClose={() => setIsOfficeKitOpen(false)}
            onShowToast={showToast}
            theme={theme}
          />

          <SerialEntryModal
            isOpen={isSerialModalOpen}
            onClose={() => setIsSerialModalOpen(false)}
            onSubmitSerial={handleAddSerialAppliance}
            theme={theme}
          />

          <DiagnosticsModal
            appliance={diagnosticsAppliance}
            isOpen={!!diagnosticsAppliance}
            onClose={() => setDiagnosticsAppliance(null)}
            onShowToast={showToast}
            theme={theme}
          />

          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onLogin={handleLogin}
            currentUser={user}
            onShowToast={showToast}
            theme={theme}
          />
        </>
      )}
    </div>
  );
};

export default App;
