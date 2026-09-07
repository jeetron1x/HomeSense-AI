import React from 'react';
import { motion } from 'motion/react';
import { HomeSenseLogo } from './HomeSenseLogo.tsx';
import { TabType, ThemeMode } from '../types.ts';
import { triggerHaptic } from '../utils/haptics.ts';
import { openGitHubRepo } from '../utils/github.ts';

export type NavTabId = TabType;

interface NavigationBarProps {
  currentTab?: NavTabId;
  activeTab?: NavTabId;
  onSelectTab?: (tab: NavTabId) => void;
  onChangeTab?: (tab: NavTabId) => void;
  anomaliesCount?: number;
  unreadAnomaliesCount?: number;
  isAudioMonitoring?: boolean;
  onOpenBrandInfo?: () => void;
  theme?: ThemeMode;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  currentTab,
  activeTab,
  onSelectTab,
  onChangeTab,
  anomaliesCount = 0,
  unreadAnomaliesCount = 0,
  isAudioMonitoring = true,
  onOpenBrandInfo,
  theme = 'dark',
}) => {
  const effectiveTab: NavTabId = currentTab || activeTab || 'scan';

  const handleSelect = (tab: NavTabId) => {
    triggerHaptic('tap');
    if (onSelectTab) onSelectTab(tab);
    if (onChangeTab) onChangeTab(tab);
  };

  const count = anomaliesCount ?? unreadAnomaliesCount ?? 0;

  const tabs: Array<{
    id: NavTabId;
    label: string;
    icon: string;
    badge: string | null;
    badgeColor?: string;
  }> = [
    {
      id: 'scan',
      label: 'Scan',
      icon: 'qr_code_scanner',
      badge: null,
    },
    {
      id: 'summary',
      label: 'Summary',
      icon: 'space_dashboard',
      badge: count > 0 ? `${count}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'monitor',
      label: 'Monitor',
      icon: 'sensors',
      badge: isAudioMonitoring ? 'LIVE' : null,
      badgeColor: 'bg-cyan-400 text-slate-950 font-extrabold shadow-sm',
    },
    {
      id: 'appliances',
      label: 'Appliances',
      icon: 'kitchen',
      badge: null,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'tune',
      badge: null,
    },
  ];

  const isLight = theme === 'light';

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe pointer-events-none" aria-label="Bottom Navigation">
      <div className="max-w-md mx-auto px-3 pb-3 pt-1 pointer-events-auto">
        <div
          className={`h-16 rounded-full px-2 flex items-center justify-between gap-1 shadow-2xl transition-colors duration-300 ${
            isLight
              ? 'bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] text-slate-800'
              : 'bg-[#080b11]/95 backdrop-blur-2xl border border-slate-800/90 shadow-[0_20px_48px_-8px_rgba(0,0,0,0.95),0_0_20px_rgba(0,242,254,0.12)] text-slate-100'
          }`}
        >
          {/* Integrated HomeSense Brand Info Button & GitHub Redirect */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              openGitHubRepo();
              if (onOpenBrandInfo) onOpenBrandInfo();
            }}
            title="HomeSense AI • Team Invincibles (Click to view GitHub)"
            aria-label="HomeSense AI Team Invincibles"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all border shrink-0 active:scale-95 cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-800'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-100'
            }`}
          >
            <HomeSenseLogo variant="icon" size={22} />
            <div className="hidden xs:flex flex-col text-left leading-none pr-1">
              <span className={`text-[10px] font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                HomeSense
              </span>
              <span className={`text-[7px] font-extrabold tracking-wider ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`}>
                INVINCIBLES
              </span>
            </div>
          </button>

          {/* Navigation Tab Buttons */}
          <div className="flex items-center justify-between flex-1 gap-1">
            {tabs.map((tab) => {
              const isActive = effectiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelect(tab.id)}
                  aria-label={tab.label}
                  className={`relative flex-1 flex flex-col items-center justify-center py-1.5 rounded-full transition-all active:scale-95 ${
                    isActive
                      ? isLight
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                        : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white font-extrabold shadow-[0_0_16px_rgba(0,242,254,0.35)]'
                      : isLight
                      ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] leading-none">
                    {tab.icon}
                  </span>
                  <span className="text-[10px] tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                    {tab.label}
                  </span>

                  {tab.badge && (
                    <span
                      className={`absolute -top-1 -right-0.5 text-[8px] px-1.5 py-0.2 rounded-full font-code-spec shadow-sm ${
                        tab.badgeColor || 'bg-rose-500 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
