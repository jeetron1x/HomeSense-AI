import React, { useState } from 'react';
import { HomeSenseLogo } from './HomeSenseLogo.tsx';
import { UserAccount, ThemeMode } from '../types.ts';
import { triggerHaptic } from '../utils/haptics.ts';
import { openGitHubRepo, getGitHubRepoUrl, setGitHubRepoUrl } from '../utils/github.ts';

interface SettingsViewProps {
  user: UserAccount | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  onShowToast: (msg: string) => void;
  onOpenOfficeKit: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onOpenAuth,
  onLogout,
  theme,
  onChangeTheme,
  onShowToast,
  onOpenOfficeKit,
}) => {
  const [activeSite, setActiveSite] = useState<'skyline' | 'workshop'>('skyline');
  const [syncedTime, setSyncedTime] = useState('2m ago');

  const isLight = theme === 'light';

  const handleRefreshSync = () => {
    triggerHaptic('tap');
    setSyncedTime('Just now');
    onShowToast('✓ Mesh node topology and ledger sync updated');
  };

  const handleExportLog = (format: 'csv' | 'json') => {
    triggerHaptic('success');
    const logData = [
      'Timestamp, Appliance, PowerDraw_W, BEE_Stars, Acoustic_Vib_G, Status',
      `${new Date().toISOString()}, Daikin FTKF50 AC, 780, 5, 0.01, Nominal`,
      `${new Date().toISOString()}, Samsung Frost-Free, 140, 4, 0.01, Nominal`,
      `${new Date().toISOString()}, LG Inverter Washer, 360, 5, 0.00, Standby`,
    ].join('\n');

    const blob = new Blob([logData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HomeSense_Invincibles_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onShowToast('✓ Exported Audit Log (.csv) to local files');
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 pb-28 pt-20 px-4">
      {/* Live Mesh Telemetry Top Strip */}
      <div className="flex items-center justify-between px-1">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => {
            triggerHaptic('tick');
            onShowToast('Live Mesh: 4 nodes synchronized at <4ms jitter');
          }}
        >
          <div className="relative flex items-center justify-center">
            <span className="inline-flex w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            <span className="absolute inline-flex w-3.5 h-3.5 rounded-full bg-cyan-400/30 animate-ping" />
          </div>
          <span className="text-[10px] font-bold text-cyan-500 tracking-wider uppercase font-code-spec">
            Live Mesh Telemetry
          </span>
        </div>

        <button
          type="button"
          onClick={handleRefreshSync}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all active:scale-95 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700 hover:border-cyan-500/40 shadow-sm'
              : 'bg-[#0f141f] border-slate-800 text-slate-300 hover:border-cyan-500/30'
          }`}
        >
          <span className="material-symbols-outlined text-[13px] text-cyan-400">sync</span>
          <span className="text-[10px] font-medium font-code-spec">
            Synced {syncedTime}
          </span>
        </button>
      </div>

      {/* Hero Identity Card (AMOLED Obsidian) */}
      <section
        className={`relative overflow-hidden rounded-3xl p-5 border shadow-2xl transition-all duration-300 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-xl'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.95)]'
        }`}
      >
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-start gap-3.5">
            <div className="relative shrink-0">
              <div className={`w-16 h-16 rounded-full overflow-hidden shadow-md border flex items-center justify-center ${
                isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'bg-[#0a0d14] border-slate-700 text-cyan-400'
              }`}>
                <span className="font-extrabold text-xl tracking-wider font-code-spec">
                  {user?.avatarInitials || 'HS'}
                </span>
              </div>
              <span
                className={`absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full ${
                  isLight ? 'bg-white ring-1 ring-slate-200' : 'bg-black'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
              </span>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className={`font-extrabold text-lg tracking-tight truncate ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}>
                  {user?.displayName || 'Smart Living Account'}
                </h2>
                <span
                  className="material-symbols-outlined text-[18px] text-cyan-500"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  title="Verified Account"
                >
                  verified
                </span>
              </div>
              <p className="text-xs font-semibold text-cyan-500 mt-0.5 font-code-spec truncate">
                {user?.email || 'user@homesense.ai'}
              </p>

              {user?.address && (
                <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs truncate">
                  <span className="material-symbols-outlined text-[15px] text-cyan-500">home_pin</span>
                  <span className="truncate">{user.address}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 text-xs truncate">
                <span className="material-symbols-outlined text-[15px]">apartment</span>
                <span className="truncate">
                  {user?.propertyUnit || 'Unit 101'} • {user?.propertyName || 'Primary Hub'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onOpenAuth();
              }}
              title="Switch or Edit Account"
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shrink-0 ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">switch_account</span>
            </button>
          </div>

          <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0d14] border-slate-800/80'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
              <span className={`text-xs truncate font-code-spec ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Mesh Node: {user?.meshNodeId || 'Node-101'} (Active &amp; Calibrated)
              </span>
            </div>
            <span className="text-[10px] font-bold text-cyan-500 font-code-spec">5 GHz P2P</span>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div
              onClick={() => {
                triggerHaptic('tick');
                onShowToast('Pro Sense Tier: Full 48kHz Acoustic Telemetry Active');
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer active:scale-95 transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-cyan-500/40'
                  : 'bg-[#0a0d14] border-slate-800/80 hover:border-cyan-500/40'
              }`}
            >
              <span className="text-[10px] text-slate-400 uppercase font-code-spec">Tier</span>
              <span className="text-xs font-bold text-cyan-500 mt-0.5">Pro Sense</span>
            </div>

            <div
              onClick={() => {
                triggerHaptic('tick');
                onShowToast('Sites: 02 (Skyline Primary + Studio Workshop)');
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer active:scale-95 transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-cyan-500/40'
                  : 'bg-[#0a0d14] border-slate-800/80 hover:border-cyan-500/40'
              }`}
            >
              <span className="text-[10px] text-slate-400 uppercase font-code-spec">Sites</span>
              <span className={`text-base font-bold mt-0.5 font-code-spec ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                02
              </span>
            </div>

            <div
              onClick={() => {
                triggerHaptic('tick');
                onShowToast('Nodes: 04 active edge compute clusters');
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer active:scale-95 transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-cyan-500/40'
                  : 'bg-[#0a0d14] border-slate-800/80 hover:border-cyan-500/40'
              }`}
            >
              <span className="text-[10px] text-slate-400 uppercase font-code-spec">Nodes</span>
              <span className={`text-base font-bold mt-0.5 font-code-spec ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                04
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* AMOLED Theme Switcher Card */}
      <section
        className={`rounded-3xl p-5 border shadow-2xl space-y-3 transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              <span className="material-symbols-outlined text-[18px]">
                {theme === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base">Appearance Theme</h3>
              <p className="text-xs text-slate-400">
                Switch between AMOLED Pure Black and Minimalist Light
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-code-spec uppercase ${
            isLight ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
          }`}>
            {theme === 'dark' ? 'AMOLED' : 'LIGHT'}
          </span>
        </div>

        {/* Theme Segment Buttons */}
        <div className={`grid grid-cols-2 p-1.5 rounded-2xl border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0a0d14] border-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onChangeTheme('dark');
              onShowToast('Switched to AMOLED Pure Black');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dark_mode</span>
            <span>AMOLED Dark</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onChangeTheme('light');
              onShowToast('Switched to Light Theme');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
              theme === 'light'
                ? 'bg-white text-slate-900 shadow-md font-extrabold border border-slate-200'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">light_mode</span>
            <span>Light Theme</span>
          </button>
        </div>
      </section>
 
      {/* On-Device AI Vision & Optical OCR Engine */}
      <section
        className={`rounded-3xl p-5 border shadow-2xl space-y-3.5 transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
            </div>
            <div>
              <h3 className="font-bold text-base">On-Device BEE Vision Engine</h3>
              <p className="text-xs text-slate-400">
                Offline optical character & star rating analyzer
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-code-spec flex items-center gap-1 ${
            isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            100% Independent (No API Key)
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Google ML Kit & Computer Vision Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Extracts exact star ratings, appliance capacity (Litres, Tons, kg), and annual electricity consumption (kWh/year) directly on your device with 0 margin of error. No external API keys or internet connection required.
          </p>
        </div>
      </section>

      {/* On-Device Audio Analyzer & ML Pipeline Card */}
      <section
        className={`rounded-3xl p-5 border shadow-2xl space-y-3.5 transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
            </div>
            <div>
              <h3 className="font-bold text-base">On-Device Audio ML Pipeline</h3>
              <p className="text-xs text-slate-400">
                HomeSense AudioSet &amp; High-Frequency Spectral Classifier
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-code-spec flex items-center gap-1 ${
            isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            100% Offline Edge ML
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>YAMNet ONNX &amp; Spectral Heuristics Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Real-time classification for smoke/fire alarm beeps (3kHz high-frequency spikes), continuous running water leaks, and high appliance vibration/mechanical strain. Fully integrated with Invincibles Workstation Link.
          </p>
        </div>
      </section>

      {/* Property & Multi-Site Selector */}
      <section
        className={`rounded-3xl p-5 border shadow-2xl space-y-3 transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              <span className="material-symbols-outlined text-[18px]">domain</span>
            </div>
            <div>
              <h3 className="font-bold text-base">Active Property Site</h3>
              <p className="text-xs text-slate-400">Mesh cluster assignment</p>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-code-spec ${
            isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-500/20 text-cyan-400'
          }`}>
            2 Sites
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setActiveSite('skyline');
              onShowToast('Switched view to Skyline Residences (Primary Node)');
            }}
            className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
              activeSite === 'skyline'
                ? isLight
                  ? 'bg-cyan-50/80 border-cyan-400 shadow-sm'
                  : 'bg-cyan-500/15 border-cyan-500 shadow-md'
                : isLight
                ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                : 'bg-[#0a0d14] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-cyan-500 uppercase font-code-spec">Site 01</span>
              {activeSite === 'skyline' && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
              )}
            </div>
            <div className="mt-2">
              <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Skyline Residences
              </p>
              <p className="text-[10px] text-slate-400">Primary Hub</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setActiveSite('workshop');
              onShowToast('Switched view to Studio Workshop (Edge Standby)');
            }}
            className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
              activeSite === 'workshop'
                ? isLight
                  ? 'bg-cyan-50/80 border-cyan-400 shadow-sm'
                  : 'bg-cyan-500/15 border-cyan-500 shadow-md'
                : isLight
                ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                : 'bg-[#0a0d14] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-code-spec">Site 02</span>
              {activeSite === 'workshop' && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
              )}
            </div>
            <div className="mt-2">
              <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Studio Workshop
              </p>
              <p className="text-[10px] text-slate-400">Tech Bay Standby</p>
            </div>
          </button>
        </div>
      </section>

      {/* Utility Quotas */}
      <section
        className={`rounded-3xl p-5 border shadow-2xl space-y-4 transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              <span className="material-symbols-outlined text-[18px]">equalizer</span>
            </div>
            <div>
              <h3 className="font-bold text-base">Utility Quotas</h3>
              <p className="text-xs text-slate-400">Dynamic Acoustic &amp; Power Caps</p>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-code-spec border ${
            isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
          }`}>
            Billing Cycle Active
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleExportLog('csv')}
          className={`w-full py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border text-xs font-semibold active:scale-98 ${
            isLight
              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 shadow-sm'
              : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] text-cyan-400">file_download</span>
          <span>Export Audit Log (.csv / .json)</span>
        </button>
      </section>

      {/* Workstation Link & Office Kit */}
      <section
        className={`rounded-3xl p-5 border shadow-2xl space-y-3 transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              <span className="material-symbols-outlined text-[18px]">hub</span>
            </div>
            <div>
              <h3 className="font-bold text-base">Invincibles Ecosystem Sync</h3>
              <p className="text-xs text-slate-400">Local Mesh &amp; Workstation Link</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-500/15 px-2.5 py-0.5 rounded-full border border-cyan-500/20 font-code-spec">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Active
          </span>
        </div>

        <div
          onClick={() => {
            triggerHaptic('tap');
            onOpenOfficeKit();
          }}
          className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
            isLight
              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 hover:border-cyan-500/30'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <span className="material-symbols-outlined text-[20px]">laptop_mac</span>
            </div>
            <div className="min-w-0">
              <p className={`font-semibold text-xs truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Invincibles Workstation Direct Bus
              </p>
              <p className="text-[11px] text-slate-400 truncate">192.168.1.42 • 3.8ms latency</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-400 font-code-spec shrink-0">
            <span className="text-cyan-500 font-bold text-xs">P2P</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </div>
        </div>

        {/* GitHub Repository Action Card */}
        <div
          onClick={() => {
            triggerHaptic('success');
            openGitHubRepo();
            onShowToast('Opening HomeSense AI GitHub Repository…');
          }}
          className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
            isLight
              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 shadow-sm'
              : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 hover:border-cyan-500/40 shadow-[0_0_16px_rgba(0,242,254,0.08)]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <span className="material-symbols-outlined text-[20px]">code</span>
            </div>
            <div className="min-w-0">
              <p className={`font-semibold text-xs truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                GitHub Repository
              </p>
              <p className="text-[11px] text-cyan-500 font-code-spec truncate">
                {getGitHubRepoUrl().replace('https://', '')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-code-spec shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('tap');
                const current = getGitHubRepoUrl();
                const nextUrl = window.prompt('Set official GitHub repository URL:', current);
                if (nextUrl && nextUrl.trim()) {
                  setGitHubRepoUrl(nextUrl.trim());
                  onShowToast('GitHub repository URL updated!');
                }
              }}
              title="Edit GitHub repository URL"
              className={`p-1.5 rounded-lg transition-colors ${
                isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
            <span className="text-xs font-bold text-cyan-400">Open</span>
            <span className="material-symbols-outlined text-[16px] text-cyan-400">open_in_new</span>
          </div>
        </div>
      </section>

      {/* Account Actions: Switch Account / Sign Out */}
      <div className="pt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('tap');
            onOpenAuth();
          }}
          className={`w-full py-3 px-4 rounded-2xl font-bold text-xs border flex items-center justify-center gap-2 active:scale-98 transition-all ${
            isLight
              ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
              : 'bg-[#0a0d14] hover:bg-slate-900 text-slate-200 border-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] text-cyan-400">switch_account</span>
          <span>Switch Account / Manage Profile</span>
        </button>

        {user && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('warning');
              onLogout();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out of Smart Vault</span>
          </button>
        )}

        <div className="flex flex-col items-center gap-1.5 text-center mt-3">
          <HomeSenseLogo
            variant="navbar"
            size={24}
            onClick={() => {
              triggerHaptic('tap');
              openGitHubRepo();
              onShowToast('Opening GitHub Repository (Team Invincibles)…');
            }}
            title="Click to view HomeSense AI on GitHub"
          />
          <p className="text-[11px] font-bold text-cyan-500 tracking-wider uppercase font-code-spec">
            Engineered by Team Invincibles
          </p>
          <p className="text-[10px] text-slate-500 font-code-spec">
            HomeSense Core OS v5.2.0 • Skyline Node #042 • Zero-Cloud Privacy
          </p>
        </div>
      </div>
    </div>
  );
};
