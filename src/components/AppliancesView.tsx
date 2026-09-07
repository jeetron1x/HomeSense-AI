import React, { useState } from 'react';
import { Appliance, ThemeMode } from '../types.ts';
import { triggerHaptic } from '../utils/haptics.ts';

interface AppliancesViewProps {
  appliances: Appliance[];
  onToggleEco: (id: string) => void;
  onDeleteAppliance?: (id: string) => void;
  onOpenDiagnostics: (appliance: Appliance) => void;
  onNavigateToScan: () => void;
  onOpenSerialModal: () => void;
  onShowToast: (msg: string) => void;
  theme?: ThemeMode;
}

type FilterCategory = 'all' | 'hvac' | 'refrig' | 'laundry' | 'other';

export const AppliancesView: React.FC<AppliancesViewProps> = ({
  appliances = [],
  onToggleEco,
  onDeleteAppliance,
  onOpenDiagnostics,
  onNavigateToScan,
  onOpenSerialModal,
  onShowToast,
  theme = 'dark',
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isLight = theme === 'light';

  const filteredAppliances = appliances.filter((app) => {
    const matchesFilter = selectedFilter === 'all' || app.category === selectedFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalWatts = appliances.reduce((sum, app) => sum + (app.powerDrawWatts || 0), 0);
  const ecoCount = appliances.filter((app) => app.isEcoMode).length;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 pb-28 pt-20 px-4">
      {/* Top Header Fleet Telemetry */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="inline-flex w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            <span className="absolute inline-flex w-3.5 h-3.5 rounded-full bg-cyan-400/30 animate-ping" />
          </div>
          <span className="text-[10px] font-bold text-cyan-500 tracking-wider uppercase font-code-spec">
            Fleet Telemetry Active
          </span>
        </div>

        <div className="text-[10px] font-bold text-slate-400 font-code-spec">
          {appliances.length} Units Connected
        </div>
      </div>

      {/* Summary Stat Overview Card (AMOLED Obsidian) */}
      <div
        className={`rounded-3xl p-5 border shadow-2xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-xl text-slate-900'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.95)]'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 font-code-spec">
              Connected Infrastructure
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight mt-0.5">
              {appliances.length} Active Unit{appliances.length === 1 ? '' : 's'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              onNavigateToScan();
            }}
            className="py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Unit</span>
          </button>
        </div>

        <div className={`grid grid-cols-2 gap-2.5 pt-2 border-t ${
          isLight ? 'border-slate-100' : 'border-slate-800/80'
        }`}>
          <div className={`p-3 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0d14] border-slate-800/80'
          }`}>
            <span className="text-[9px] uppercase font-code-spec text-slate-400 block">Fleet Power Draw</span>
            <span className={`text-sm font-bold font-code-spec mt-0.5 block ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              {totalWatts} Watts
            </span>
          </div>
          <div className={`p-3 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0d14] border-slate-800/80'
          }`}>
            <span className="text-[9px] uppercase font-code-spec text-slate-400 block">Eco Mode Active</span>
            <span className="text-sm font-bold font-code-spec text-cyan-500 mt-0.5 block">
              {ecoCount} of {appliances.length} Units
            </span>
          </div>
        </div>
      </div>

      {/* Search and Category Filter Strip */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search appliance, brand, location..."
            className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-cyan-500 transition-all ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm'
                : 'bg-[#0a0d14] border-slate-800 text-slate-100 placeholder:text-slate-500'
            }`}
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'hvac', label: 'HVAC / AC' },
              { id: 'refrig', label: 'Refrigerators' },
              { id: 'laundry', label: 'Washers' },
              { id: 'other', label: 'Fans & Other' },
            ] as const
          ).map((cat) => {
            const isActive = selectedFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedFilter(cat.id);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                    : isLight
                    ? 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-sm'
                    : 'bg-[#0a0d14] hover:bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Appliances List or Luxury AMOLED Empty State */}
      {filteredAppliances.length === 0 ? (
        <div
          className={`rounded-3xl p-8 border shadow-2xl flex flex-col items-center text-center gap-4 transition-all ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
              : 'bg-[#0f141f] border-slate-800/90 text-slate-100'
          }`}
        >
          <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center shadow-inner ${
            isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'bg-[#0a0d14] border-slate-800 text-cyan-400'
          }`}>
            <span className="material-symbols-outlined text-[32px]">kitchen</span>
          </div>

          <div>
            <h3 className="text-base font-extrabold tracking-tight">
              {searchQuery ? 'No Matching Appliances' : 'No Appliances Connected'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              {searchQuery
                ? 'Try adjusting your search query or switching category filters.'
                : 'Your smart living vault is clean. Scan official BEE Star rating labels to measure wattage, calculate annual savings, and detect acoustic motor drift.'}
            </p>
          </div>

          <div className="flex gap-2 w-full pt-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onNavigateToScan();
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              <span>Scan First BEE Label</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onOpenSerialModal();
              }}
              className={`py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
                  : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">pin</span>
              <span>Enter Serial</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredAppliances.map((appliance) => {
            return (
              <div
                key={appliance.id}
                className={`rounded-3xl p-4 border shadow-xl flex flex-col gap-3 transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
                    : 'bg-[#0f141f] border-slate-800/90 text-slate-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
                      isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'bg-[#0a0d14] border-slate-800 text-cyan-400'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {appliance.category === 'hvac'
                          ? 'ac_unit'
                          : appliance.category === 'refrig'
                          ? 'kitchen'
                          : appliance.category === 'laundry'
                          ? 'local_laundry_service'
                          : 'mode_fan'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{appliance.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {appliance.model} • {appliance.location}
                      </p>
                    </div>
                  </div>

                  {/* BEE Star Rating Badge */}
                  <div className="flex items-center gap-0.5 px-2 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold font-code-spec shrink-0">
                    <span
                      className="material-symbols-outlined text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span>{appliance.starRating}★</span>
                  </div>
                </div>

                {/* Energy & Vibration Specs */}
                <div className={`grid grid-cols-3 gap-2 p-2.5 rounded-2xl border text-[10px] font-code-spec ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0d14] border-slate-800/80'
                }`}>
                  <div>
                    <span className="text-slate-400 block uppercase">Power Draw</span>
                    <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{appliance.powerDrawWatts} W</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase">Efficiency</span>
                    <span className="font-bold text-cyan-500 truncate block">
                      {appliance.efficiencyValue || '5.2 ISEER'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase">Vibration</span>
                    <span className={`font-bold truncate block ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {appliance.acousticVibration || '0.01G'}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('tick');
                        onToggleEco(appliance.id);
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        appliance.isEcoMode
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : isLight
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-[#0a0d14] text-slate-400 border border-slate-800'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">eco</span>
                      <span>{appliance.isEcoMode ? 'Eco Active' : 'Normal'}</span>
                    </button>

                    {onDeleteAppliance && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('warning');
                          onDeleteAppliance(appliance.id);
                          onShowToast(`Removed ${appliance.name}`);
                        }}
                        className={`p-1.5 rounded-xl border transition-colors ${
                          isLight
                            ? 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200'
                            : 'bg-[#0a0d14] hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border-slate-800'
                        }`}
                        title="Delete Appliance"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap');
                      onOpenDiagnostics(appliance);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-500 hover:underline transition-colors font-code-spec"
                  >
                    <span>Diagnostics</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions Footer */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('tap');
            onNavigateToScan();
          }}
          className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
          <span>Scan New BEE Device</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('tap');
            onOpenSerialModal();
          }}
          className={`py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
            isLight
              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
              : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">pin</span>
          <span>Enter Serial</span>
        </button>
      </div>
    </div>
  );
};
