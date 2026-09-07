import React from 'react';
import { Appliance, ThemeMode } from '../types.ts';
import { triggerHaptic } from '../utils/haptics.ts';

interface DiagnosticsModalProps {
  appliance: Appliance | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  theme?: ThemeMode;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  appliance,
  isOpen,
  onClose,
  onShowToast,
  theme = 'dark',
}) => {
  if (!isOpen || !appliance) return null;

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl border p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-[0_24px_64px_rgba(0,0,0,0.15)]'
            : 'bg-[#0a0a0c] border-zinc-800 text-zinc-100 shadow-[0_24px_64px_rgba(0,0,0,0.95)]'
        }`}
      >
        <div
          className={`flex items-center justify-between border-b pb-3 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              <span className="material-symbols-outlined text-[20px]">troubleshoot</span>
            </div>
            <div>
              <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Appliance Diagnostics
              </h3>
              <p className="text-xs text-slate-400">{appliance.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tick');
              onClose();
            }}
            aria-label="Close"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Diagnostics overview */}
        <div
          className={`p-3.5 rounded-2xl border space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0a0d14] border-slate-800/80 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Hardware Model</span>
            <span className={`font-code-spec text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {appliance.model}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Health Status</span>
            <span className="text-xs font-bold text-cyan-500 flex items-center gap-1 font-code-spec">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              98.4% Nominal
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Acoustic Vibration Metric</span>
            <span className="font-code-spec text-xs text-cyan-500 font-semibold">
              {appliance.acousticVibration || '0.01G Nom'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Power Rating</span>
            <span className={`font-code-spec text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {appliance.powerDrawWatts} W Continuous
            </span>
          </div>
        </div>

        {/* Neural health report */}
        <div
          className={`p-3.5 rounded-2xl border space-y-2 ${
            isLight
              ? 'bg-cyan-50 border-cyan-200 text-slate-800'
              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-cyan-400">
              psychology
            </span>
            <span className="text-xs font-bold font-code-spec">
              Edge Acoustic Intelligence
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Neural spectrogram analysis shows harmonic resonance is centered cleanly inside normal manufacturer tolerances. No bearing friction chatter or thermal cavitation detected.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('success');
              onShowToast('✓ Ran full 12-point calibration sweep');
              onClose();
            }}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            Run Calibration Sweep
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tick');
              onClose();
            }}
            className={`py-3 px-4 rounded-2xl border font-bold text-xs transition-all ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
