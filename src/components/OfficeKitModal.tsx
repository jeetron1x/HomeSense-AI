import React, { useState } from 'react';
import { ThemeMode } from '../types.ts';
import { triggerHaptic } from '../utils/haptics.ts';

interface OfficeKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  theme?: ThemeMode;
}

export const OfficeKitModal: React.FC<OfficeKitModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  theme = 'dark',
}) => {
  const [isCopying, setIsCopying] = useState(false);
  const [activeTab, setActiveTab] = useState<'clipboard' | 'telemetry' | 'mirror'>('clipboard');

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const sampleAuditJson = {
    app: 'HomeSense AI - Ambient Living Auditor',
    team: 'Invincibles',
    version: '5.2.0-invincibles-core',
    timestamp: new Date().toISOString(),
    node: 'Skyline Node #042',
    network: {
      type: 'Invincibles Workstation Direct Bus',
      ip: '192.168.1.42',
      peer: 'Workstation Host (Low Latency Mesh)',
      jitterMs: 3.8,
      security: 'TLS 1.3 Local Direct (Zero Cloud Egress)',
    },
    metrics: {
      currentCycle: 'Billing Cycle 2026',
      totalProjectedMonthlyCostInr: 420,
      baselineVarianceInr: -68,
      aggregateEnergyKwh: 142.5,
      systemEfficiencyScore: 0.84,
      beeMatrixSyncConfidence: 0.984,
    },
  };

  const handleCopyClipboard = async () => {
    triggerHaptic('success');
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(JSON.stringify(sampleAuditJson, null, 2));
      onShowToast('✓ Pushed to Invincibles Workstation Unified Clipboard');
    } catch {
      onShowToast('✓ Simulated clip push to Workstation Link buffer');
    }
    setTimeout(() => setIsCopying(false), 1200);
  };

  const handleDownloadJson = () => {
    triggerHaptic('tap');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sampleAuditJson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `homesense_invincibles_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('✓ Exported Invincibles Energy Audit JSON');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors duration-300 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-[0_24px_64px_rgba(0,0,0,0.15)]'
            : 'bg-[#0a0a0c] border-zinc-800 text-zinc-100 shadow-[0_24px_64px_rgba(0,0,0,0.95)]'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f141f] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${
              isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              <span className="material-symbols-outlined text-[22px]">laptop_chromebook</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Invincibles Workstation Link
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-code-spec ${
                  isLight ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}>
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Low-Latency Workstation &amp; Desktop Direct Bus
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tick');
              onClose();
            }}
            aria-label="Close modal"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div
          className={`flex items-center gap-2 p-1.5 mx-4 mt-3 rounded-2xl border text-xs ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0a0d14] border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('clipboard');
            }}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'clipboard'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Shared Clipboard
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('telemetry');
            }}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'telemetry'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Raw Ledger JSON
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('mirror');
            }}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'mirror'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Screen Bridge
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {activeTab === 'clipboard' && (
            <div className="space-y-3">
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0d14] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">content_paste</span>
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      Bidirectional Cross-Device Clipboard
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Copy on mobile, paste instantly into Workstation audit suite
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border text-xs font-mono space-y-2 ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-black border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                  <span>PAYLOAD READY TO PUSH</span>
                  <span className="text-cyan-400 font-bold">1.2 KB</span>
                </div>
                <pre className={`text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed ${
                  isLight ? 'text-slate-800' : 'text-slate-300'
                }`}>
                  {`[HomeSense Audit Summary]
Node: Skyline Node #042
Team: Invincibles
Acoustic Vibration: 0.01G (Nominal)
BEE Status: 100% Certified On-Device`}
                </pre>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isCopying ? 'check' : 'copy_all'}
                  </span>
                  <span>{isCopying ? 'Pushed to Workstation!' : 'Push to Unified Clipboard'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase font-code-spec">
                  Structured Mesh Snapshot
                </span>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="text-xs text-cyan-500 font-bold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Download .json</span>
                </button>
              </div>

              <div
                className={`p-3 rounded-2xl border text-[11px] font-mono max-h-56 overflow-y-auto ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-black border-slate-800 text-cyan-400'
                }`}
              >
                <pre>{JSON.stringify(sampleAuditJson, null, 2)}</pre>
              </div>
            </div>
          )}

          {activeTab === 'mirror' && (
            <div className="space-y-3 text-center py-4">
              <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-inner ${
                isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                <span className="material-symbols-outlined text-[32px]">cast_connected</span>
              </div>
              <div>
                <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Ultra Low-Latency Workstation Bridge
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Transmit raw 48kHz acoustic spectrograms directly to desktop analytics suites over local Wi-Fi.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('success');
                    onShowToast('✓ Workstation Mirroring broadcast active');
                  }}
                  className="py-2.5 px-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md active:scale-95"
                >
                  Start Workstation Stream
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-3.5 border-t flex items-center justify-between text-[11px] ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#0a0d14] border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-1.5 font-code-spec">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>P2P Direct Bus: 3.8ms Latency</span>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tick');
              onClose();
            }}
            className="font-bold text-cyan-500 hover:underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
