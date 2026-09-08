import React from 'react';
import { HomeSenseLogo } from './HomeSenseLogo.tsx';
import { ThemeMode } from '../types.ts';
import { triggerHaptic } from '../utils/haptics.ts';
import { openGitHubRepo } from '../utils/github.ts';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onTorchToggle?: () => void;
  isTorchOn?: boolean;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onTorchToggle,
  isTorchOn = false,
  onOpenProfile,
  onOpenNotifications,
  unreadCount = 0,
  theme = 'dark',
  onToggleTheme,
}) => {
  const isLight = theme === 'light';

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 pt-safe backdrop-blur-2xl border-b transition-colors duration-300 ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#080b11]/95 border-slate-800/80 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.8)]'
      }`}
    >
      {/* Main Header Bar */}
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        {/* Left: Brand or Screen Title with Clickable GitHub Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              openGitHubRepo();
            }}
            title="HomeSense AI by Team Invincibles (Click to view GitHub)"
            aria-label="HomeSense AI GitHub"
            className="flex items-center justify-center p-1 -m-1 rounded-2xl hover:bg-cyan-500/10 active:scale-95 transition-transform cursor-pointer focus:outline-none shrink-0"
          >
            <HomeSenseLogo variant="icon" size={28} />
          </button>
          <div className="flex flex-col min-w-0">
            {subtitle && (
              <span className={`text-[10px] font-bold uppercase tracking-wider font-code-spec truncate ${
                isLight ? 'text-cyan-600' : 'text-cyan-400'
              }`}>
                {subtitle}
              </span>
            )}
            <h1
              className={`font-bold text-base tracking-tight truncate ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              {title || 'HomeSense AI'}
            </h1>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Theme Switcher */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onToggleTheme();
              }}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label="Toggle Theme"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isLight
                  ? 'bg-slate-100 text-slate-700 hover:text-cyan-600 hover:bg-slate-200 border border-slate-200'
                  : 'bg-slate-900 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isLight ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
          )}

          {onTorchToggle && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tick');
                onTorchToggle();
              }}
              aria-label="Toggle Flashlight"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isTorchOn
                  ? 'bg-amber-400 text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isTorchOn ? 'flashlight_on' : 'flash_on'}
              </span>
            </button>
          )}

          {onOpenNotifications && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onOpenNotifications();
              }}
              aria-label="Alerts & Notifications"
              className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isLight
                  ? 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-black animate-pulse" />
              )}
            </button>
          )}

          {onOpenProfile && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onOpenProfile();
              }}
              aria-label="User Profile"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isLight
                  ? 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">account_circle</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
