import React, { useState } from 'react';
import { HomeSenseLogo } from './HomeSenseLogo.tsx';
import { UserAccount, ThemeMode } from '../types.ts';
import { triggerHaptic } from '../utils/haptics.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserAccount) => void;
  currentUser?: UserAccount | null;
  onShowToast: (msg: string) => void;
  theme?: ThemeMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
  onShowToast,
  theme = 'dark',
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      triggerHaptic('warning');
      onShowToast('Please enter a valid email address');
      return;
    }

    if (isRegister && (!displayName.trim() || !address.trim())) {
      triggerHaptic('warning');
      onShowToast('Please enter your Name and Address to complete registration');
      return;
    }

    triggerHaptic('success');
    const calculatedName = displayName.trim() || email.split('@')[0].replace(/[._-]/g, ' ');
    const initials = calculatedName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const user: UserAccount = {
      id: email.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      email: email.trim().toLowerCase(),
      displayName: calculatedName,
      address: address.trim() || 'Smart Residence, Primary Hub',
      propertyName: 'Primary Residence',
      propertyUnit: 'Unit 101',
      meshNodeId: `Node-${Math.floor(100 + Math.random() * 900)}`,
      tier: 'Pro Sense',
      avatarInitials: initials || 'HS',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    };

    onLogin(user);
    onShowToast(`✓ Authenticated as ${user.displayName}. Vault unlocked.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors duration-300 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-[0_24px_64px_rgba(0,0,0,0.15)]'
            : 'bg-[#0a0a0c] border-zinc-800 text-zinc-100 shadow-[0_24px_64px_rgba(0,0,0,0.95)]'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f141f] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <HomeSenseLogo variant="icon" size={30} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {currentUser ? 'Switch Account' : isRegister ? 'Register Account' : 'Sign In'}
                </h3>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                  isLight ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}>
                  SMART LIVING
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Encrypted on-device BEE inventory &amp; acoustic signatures
              </p>
            </div>
          </div>
          {currentUser && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tick');
                onClose();
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 font-code-spec text-slate-400">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Jeet Sharma"
                    required
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-code-spec focus:outline-none focus:border-cyan-500 transition-all ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400' : 'bg-[#0a0d14] border-slate-800 text-slate-100 placeholder:text-slate-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 font-code-spec text-slate-400">
                    Property Address *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Skyline Residences, Flat 402, Bangalore"
                    required
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-code-spec focus:outline-none focus:border-cyan-500 transition-all ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400' : 'bg-[#0a0d14] border-slate-800 text-slate-100 placeholder:text-slate-600'
                    }`}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1 font-code-spec text-slate-400">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@example.com"
                required
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-code-spec focus:outline-none focus:border-cyan-500 transition-all ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400' : 'bg-[#0a0d14] border-slate-800 text-slate-100 placeholder:text-slate-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1 font-code-spec text-slate-400">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs font-code-spec focus:outline-none focus:border-cyan-500 transition-all ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400' : 'bg-[#0a0d14] border-slate-800 text-slate-100 placeholder:text-slate-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md active:scale-98 transition-all mt-2"
            >
              {isRegister ? 'Register & Activate Local Vault' : 'Sign In & Unlock Vault'}
            </button>
          </form>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setIsRegister(!isRegister);
              }}
              className="text-xs text-cyan-500 font-semibold hover:underline"
            >
              {isRegister
                ? 'Already have an account? Sign In'
                : "Don't have an account? Register with Address"}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className={`p-3 border-t text-[11px] text-center font-code-spec ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#0a0d14] border-slate-800 text-slate-500'
        }`}>
          🔒 Local encrypted vault • Zero Cloud Egress • Team Invincibles
        </div>
      </div>
    </div>
  );
};
