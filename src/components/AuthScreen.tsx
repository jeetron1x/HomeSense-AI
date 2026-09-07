import React, { useState } from 'react';
import { HomeSenseLogo } from './HomeSenseLogo.tsx';
import { UserAccount, ThemeMode } from '../types.ts';
import { triggerHaptic } from '../utils/haptics.ts';
import { openGitHubRepo } from '../utils/github.ts';

interface AuthScreenProps {
  onLogin: (user: UserAccount) => void;
  onShowToast: (msg: string) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onShowToast,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [apartmentUnit, setApartmentUnit] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isLight = theme === 'light';

  const inputClass = isLight
    ? 'w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 transition-all'
    : 'w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0a0d14] border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all';

  const inputWithRightBtnClass = isLight
    ? 'w-full pl-11 pr-11 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 transition-all'
    : 'w-full pl-11 pr-11 py-3 rounded-2xl bg-[#0a0d14] border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all';

  const textareaClass = isLight
    ? 'w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 transition-all resize-none'
    : 'w-full pl-11 pr-4 py-2.5 rounded-2xl bg-[#0a0d14] border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none';

  const labelClass = isLight
    ? 'block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-code-spec'
    : 'block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-code-spec';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('tap');

    if (!email.trim() || !email.includes('@')) {
      triggerHaptic('error');
      onShowToast('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      triggerHaptic('error');
      onShowToast('Password must be at least 6 characters');
      return;
    }

    if (isRegister) {
      if (!fullName.trim()) {
        triggerHaptic('error');
        onShowToast('Please enter your full name');
        return;
      }
      if (!address.trim()) {
        triggerHaptic('error');
        onShowToast('Please enter your complete residential address');
        return;
      }
      if (password !== confirmPassword) {
        triggerHaptic('error');
        onShowToast('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const calculatedName = isRegister ? fullName.trim() : email.split('@')[0].replace(/[._-]/g, ' ');
      const words = calculatedName.split(' ').filter(Boolean);
      const initials = words.length > 1
        ? (words[0][0] + words[1][0]).toUpperCase()
        : calculatedName.slice(0, 2).toUpperCase();

      const user: UserAccount = {
        id: email.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        email: email.trim().toLowerCase(),
        displayName: calculatedName,
        address: isRegister ? address.trim() : 'Primary Residence',
        propertyName: isRegister && apartmentUnit.trim() ? apartmentUnit.trim() : 'Smart Living Residence',
        propertyUnit: isRegister && apartmentUnit.trim() ? apartmentUnit.trim() : 'Unit 101',
        meshNodeId: `Node-${Math.floor(100 + Math.random() * 900)}`,
        tier: 'Pro Sense',
        avatarInitials: initials || 'HS',
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      };

      triggerHaptic('success');
      onLogin(user);
      onShowToast(isRegister ? `Welcome, ${user.displayName}! Vault activated.` : `Welcome back, ${user.displayName}!`);
    }, 450);
  };

  const handleQuickDemoAccess = () => {
    triggerHaptic('tap');
    const demoUser: UserAccount = {
      id: 'user-demo-smart-living',
      email: 'technojeet105520@gmail.com',
      displayName: 'Jeet (Team Invincibles)',
      address: 'Skyline Luxury Residences, Sector 45',
      propertyName: 'Skyline Residences',
      propertyUnit: 'Tower B - 402',
      meshNodeId: 'Node-402',
      tier: 'Pro Sense',
      avatarInitials: 'TJ',
      joinedDate: 'Sep 2026',
    };
    triggerHaptic('success');
    onLogin(demoUser);
    onShowToast('✓ Authenticated as Developer Demo Account');
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300 relative ${
        isLight
          ? 'bg-[#f8fafc] text-slate-900'
          : 'bg-[#080b11] text-slate-100'
      }`}
    >
      {/* Top Floating Theme Switcher */}
      {onToggleTheme && (
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onToggleTheme();
            }}
            title={isLight ? 'Switch to AMOLED Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Theme"
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 shadow-sm ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-cyan-400">
              {isLight ? 'dark_mode' : 'light_mode'}
            </span>
            <span>{isLight ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      )}

      {/* Refined Ambient Glow */}
      {!isLight && (
        <>
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-72 bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none" />
          <div className="fixed bottom-0 right-0 w-80 h-80 bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
        </>
      )}

      <div className="w-full max-w-md flex flex-col gap-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              openGitHubRepo();
              onShowToast('Opening HomeSense AI GitHub Repository…');
            }}
            title="HomeSense AI • Team Invincibles (Click to view GitHub)"
            aria-label="HomeSense AI GitHub"
            className={`p-3.5 rounded-3xl border flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
              isLight
                ? 'bg-white border-slate-200 shadow-lg shadow-slate-200/80 hover:border-cyan-500/40'
                : 'bg-slate-950 border-slate-800 shadow-[0_0_30px_rgba(0,242,254,0.15)] hover:border-cyan-500/40'
            }`}
          >
            <HomeSenseLogo variant="icon" size={44} />
          </button>
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold font-code-spec tracking-wider mb-2 border ${
              isLight
                ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              PRIVACY-FIRST AMBIENT AUDITOR
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              HomeSense AI
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-xs mx-auto ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Acoustic Anomaly Detection • Visual BEE Star Scanner • Smart Living Power Analytics
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div
          className={`w-full rounded-3xl p-6 sm:p-7 border shadow-2xl transition-all duration-300 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-xl'
              : 'bg-[#0f141f] border-slate-800/90 text-slate-100 shadow-[0_24px_64px_rgba(0,0,0,0.95)]'
          }`}
        >
          {/* Toggle Tab between Login and Register */}
          <div className={`grid grid-cols-2 p-1 rounded-2xl border mb-6 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setIsRegister(false);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                !isRegister
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md font-extrabold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setIsRegister(true);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                isRegister
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md font-extrabold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <>
                {/* Full Name */}
                <div>
                  <label className={labelClass}>
                    Full Name <span className="text-cyan-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                      person
                    </span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jeet Sharma"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Residential Address */}
                <div>
                  <label className={labelClass}>
                    Full Home Address <span className="text-cyan-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[18px]">
                      home_pin
                    </span>
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Flat 402, Skyline Residency, Sector 45, Gurugram"
                      className={textareaClass}
                    />
                  </div>
                </div>

                {/* Apartment / Property Label */}
                <div>
                  <label className={labelClass}>
                    Apartment / Villa Number (Optional)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                      apartment
                    </span>
                    <input
                      type="text"
                      value={apartmentUnit}
                      onChange={(e) => setApartmentUnit(e.target.value)}
                      placeholder="e.g. Flat 402"
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className={labelClass}>
                Email Address <span className="text-cyan-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={labelClass}>
                Password <span className="text-cyan-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className={inputWithRightBtnClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tick');
                    setShowPassword(!showPassword);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label className={labelClass}>
                  Confirm Password <span className="text-cyan-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    lock_reset
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 mt-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Securing Vault...</span>
                </>
              ) : isRegister ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Register &amp; Activate Clean Vault</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Sign In to Smart Living</span>
                </>
              )}
            </button>
          </form>

          {/* Developer / Demo Quick Access */}
          <div className={`mt-5 pt-5 border-t flex flex-col gap-2.5 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-code-spec">
                Developer Fast Access
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-code-spec font-bold ${
                isLight ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-800 text-cyan-400'
              }`}>
                TEAM INVINCIBLES
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoAccess}
              className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border transition-all active:scale-[0.98] ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-cyan-400">badge</span>
              <span>Continue with Developer Account (Jeet)</span>
            </button>
          </div>
        </div>

        {/* Security & Privacy Badge */}
        <div className="flex items-center justify-center gap-2 text-slate-400 text-[11px] text-center">
          <span className="material-symbols-outlined text-[15px] text-cyan-400">shield</span>
          <span>Zero-Cloud Leakage • On-Device Cryptographic Vault</span>
        </div>
      </div>
    </div>
  );
};
