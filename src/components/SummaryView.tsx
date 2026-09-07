import React from 'react';
import { AnomalyItem, Appliance, ThemeMode } from '../types.ts';
import { triggerHaptic } from '../utils/haptics.ts';

interface SummaryViewProps {
  appliances: Appliance[];
  anomalies: AnomalyItem[];
  onNavigateToMonitor: () => void;
  onNavigateToScan?: () => void;
  onOpenOfficeKit: () => void;
  onShowToast: (msg: string) => void;
  theme?: ThemeMode;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  appliances = [],
  anomalies = [],
  onNavigateToMonitor,
  onNavigateToScan,
  onOpenOfficeKit,
  onShowToast,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // Dynamic calculations from real connected appliances
  const totalWatts = appliances.reduce((sum, app) => sum + (app.powerDrawWatts || 0), 0);

  // Approximate monthly kWh based on appliance operating profiles
  const projectedMonthlyKwh = appliances.reduce((sum, app) => {
    const dailyHours =
      app.category === 'refrig' ? 24 : app.category === 'hvac' ? 8 : app.category === 'laundry' ? 1.5 : 6;
    const dailyKwh = (app.powerDrawWatts * dailyHours) / 1000;
    return sum + dailyKwh * 30.5;
  }, 0);

  const tariffRate = 8.5; // ₹8.5/kWh national average
  const anomalyPenaltyInr = anomalies.reduce((sum, a) => sum + (a.costImpactInr || 0), 0);
  const projectedMonthlySpendInr = Math.round(projectedMonthlyKwh * tariffRate + anomalyPenaltyInr);

  // Total estimated annual savings from BEE star certified units
  const totalAnnualSavingsInr = appliances.reduce(
    (sum, app) => sum + (app.estimatedAnnualSavingsInr || Math.round((app.starRating * 750))),
    0
  );

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 pb-28 pt-20 px-4">
      {/* Top Status & Cycle Strip */}
      <div className="flex items-center justify-between px-1">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
              : 'bg-[#0f141f] border-slate-800 text-slate-300'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider font-code-spec">
            Billing Cycle: 30-Day Projection
          </span>
        </div>

        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
            isLight
              ? 'bg-cyan-50 border-cyan-200 text-cyan-700 font-bold'
              : 'bg-[#0f141f] border-slate-800 text-cyan-400'
          }`}
        >
          <span className="material-symbols-outlined text-[14px] text-cyan-400">sensors</span>
          <span className="text-[10px] font-bold tracking-wider font-code-spec">LIVE TELEMETRY</span>
        </div>
      </div>

      {/* Current Projection Card (AMOLED Obsidian) */}
      <div
        className={`relative rounded-3xl p-5 overflow-hidden border shadow-2xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-xl text-slate-900'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.95)]'
        }`}
      >
        <div className="flex flex-col space-y-3.5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 font-code-spec">
                Real-Time Load Projection
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                Total Cost: ₹{projectedMonthlySpendInr.toLocaleString('en-IN')}/mo
              </h2>
            </div>
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
              isLight ? 'bg-slate-50 border-slate-200 text-cyan-600' : 'bg-[#0a0d14] border-slate-800 text-cyan-400'
            }`}>
              <span className="material-symbols-outlined text-[22px]">currency_rupee</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className={`text-xs min-w-0 truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {appliances.length > 0 ? (
                <>
                  Projected monthly spend across {appliances.length} unit{appliances.length === 1 ? '' : 's'} •{' '}
                  <span className="text-emerald-500 font-bold">
                    ₹{totalAnnualSavingsInr.toLocaleString('en-IN')}/yr BEE savings
                  </span>
                </>
              ) : (
                'No appliances connected yet • Fleet baseline idle'
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className={`flex items-center gap-2.5 p-3 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0d14] border-slate-800/80'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-900 text-cyan-400'
              }`}>
                <span className="material-symbols-outlined text-[18px]">electric_meter</span>
              </div>
              <div className="min-w-0">
                <span className="text-[9px] text-slate-400 block truncate font-code-spec uppercase">
                  Aggregate Flow
                </span>
                <span className={`text-xs font-bold truncate block font-code-spec ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}>
                  {Math.round(projectedMonthlyKwh)} kWh/mo
                </span>
              </div>
            </div>

            <div className={`flex items-center gap-2.5 p-3 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0d14] border-slate-800/80'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isLight ? 'bg-amber-100 text-amber-700' : 'bg-slate-900 text-amber-400'
              }`}>
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </div>
              <div className="min-w-0">
                <span className="text-[9px] text-slate-400 block truncate font-code-spec uppercase">
                  Active Draw
                </span>
                <span className={`text-xs font-bold truncate block font-code-spec ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}>
                  {totalWatts} Watts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Anomalies & Insights Section */}
      <div
        className={`rounded-3xl p-5 border shadow-2xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                anomalies.length > 0 ? 'bg-rose-500 animate-pulse' : 'bg-cyan-400'
              }`}
            />
            <h3 className="font-extrabold text-base">Acoustic &amp; Power Anomalies</h3>
          </div>
          <span
            className={`text-xs font-bold font-code-spec px-2.5 py-0.5 rounded-full border ${
              anomalies.length > 0
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
            }`}
          >
            {anomalies.length} Flagged
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0d14] border-slate-800/80'
          }`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isLight ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-900 text-cyan-400'
            }`}>
              <span className="material-symbols-outlined text-[22px]">check_circle</span>
            </div>
            <p className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Zero Acoustic Anomalies Detected</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Continuous 48kHz acoustic FFT sensor is nominal with no bearing harmonic friction or refrigerant cavitation.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {anomalies.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  triggerHaptic('tap');
                  onNavigateToMonitor();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    : 'bg-[#0a0d14] hover:bg-slate-900/90 border-slate-800/80'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.severity === 'high'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon || 'warning'}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{item.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>
                    {item.timeWindow && (
                      <span className="inline-block mt-1 text-[10px] font-code-spec text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        Window: {item.timeWindow}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-rose-400 block font-code-spec">
                    +₹{item.costImpactInr || 45}
                  </span>
                  <span className="text-[9px] text-slate-400 block uppercase font-code-spec">penalty</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connected Load Allocation Card */}
      <div
        className={`rounded-3xl p-5 border shadow-2xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-[20px]">pie_chart</span>
            <h3 className="font-extrabold text-base">Fleet Load Allocation</h3>
          </div>
          <span className="text-xs text-slate-400 font-code-spec">
            {appliances.length} Connected Unit{appliances.length === 1 ? '' : 's'}
          </span>
        </div>

        {appliances.length === 0 ? (
          <div className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0d14] border-slate-800/80'
          }`}>
            <p className="text-xs text-slate-400">
              No appliances connected to calculate fleet load distribution.
            </p>
            {onNavigateToScan && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap');
                  onNavigateToScan();
                }}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Scan First BEE Appliance
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {appliances.map((app) => {
              const share = totalWatts > 0 ? Math.round((app.powerDrawWatts / totalWatts) * 100) : 0;
              return (
                <div key={app.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-medium truncate pr-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {app.name}
                    </span>
                    <span className="font-bold text-cyan-500 font-code-spec shrink-0">
                      {share}% • {app.powerDrawWatts}W
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-900'}`}>
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, share)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sync to Workstation via Invincibles Link */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('tap');
            onOpenOfficeKit();
          }}
          className={`w-full py-3.5 px-4 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
            isLight
              ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
              : 'bg-[#0f141f] hover:bg-slate-900 border-slate-800 text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] text-cyan-400">laptop_chromebook</span>
          <span>Sync Telemetry to Workstation via Invincibles Mesh</span>
          <span className="material-symbols-outlined text-[18px] text-slate-400">wifi_tethering</span>
        </button>
      </div>
    </div>
  );
};
