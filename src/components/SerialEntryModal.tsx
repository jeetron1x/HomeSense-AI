import React, { useState } from 'react';
import { ThemeMode } from '../types.ts';
import { triggerHaptic } from '../utils/haptics.ts';

interface SerialEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSerial: (serial: string) => void;
  theme?: ThemeMode;
}

export const SerialEntryModal: React.FC<SerialEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmitSerial,
  theme = 'dark',
}) => {
  const [serial, setSerial] = useState('DI-INV-2024-X');

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const presets = [
    { label: 'Daikin Dual Inverter AC', code: 'DI-INV-2024-X' },
    { label: 'Samsung Curd Maestro 253L', code: 'REF-FROST-600' },
    { label: 'LG Vivace AI Front Load', code: 'WM-ECO-INVERTER' },
    { label: 'Panasonic Smart 1.5T', code: 'CS-HU18AKY' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (serial.trim()) {
      triggerHaptic('success');
      onSubmitSerial(serial.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl border p-5 shadow-2xl space-y-4 transition-colors duration-300 ${
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
              <span className="material-symbols-outlined text-[20px]">dialpad</span>
            </div>
            <div>
              <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Enter Appliance Serial
              </h3>
              <p className="text-xs text-slate-400">Query BEE National Database On-Device</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 font-code-spec text-slate-400">
              BEE Label Serial / Model Code
            </label>
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="e.g. DI-INV-2024-X"
              required
              className={`w-full px-4 py-3 rounded-2xl border font-code-spec text-sm focus:outline-none focus:border-cyan-500 transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  : 'bg-[#0a0d14] border-slate-800 text-slate-100 placeholder:text-slate-600'
              }`}
            />
          </div>

          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider mb-2 font-code-spec text-slate-400">
              Quick Presets:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSerial(p.code);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                    serial === p.code
                      ? isLight
                        ? 'bg-cyan-50 border-cyan-400 text-cyan-700 font-bold'
                        : 'bg-cyan-500/20 border-cyan-500 text-cyan-400 font-bold'
                      : isLight
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <p className="font-semibold truncate">{p.label}</p>
                  <p className="text-[10px] text-slate-400 font-code-spec">{p.code}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              Lookup &amp; Calibrate
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tick');
                onClose();
              }}
              className={`py-3 px-4 rounded-2xl border font-bold text-xs transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
