import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { HomeSenseLogo } from './HomeSenseLogo.tsx';
import { ThemeMode } from '../types.ts';
import { triggerHaptic } from '../utils/haptics.ts';
import { openGitHubRepo } from '../utils/github.ts';

interface SplashScreenProps {
  theme: ThemeMode;
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ theme, onFinish }) => {
  const isLight = theme === 'light';
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress micro-animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 75);

    const timer = setTimeout(() => {
      onFinish();
    }, 2100);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onFinish]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('success');
    openGitHubRepo();
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={onFinish}
      className={`fixed inset-0 z-[100] flex flex-col justify-between items-center select-none cursor-pointer transition-colors duration-300 ${
        isLight ? 'bg-white text-slate-900' : 'bg-[#080b11] text-white'
      }`}
      aria-label="HomeSense AI Splash Screen"
    >
      {/* Top Mobile Status Bar */}
      <div className="w-full max-w-sm px-7 pt-4 flex items-center justify-between font-code-spec text-xs opacity-70">
        <span className="font-semibold tracking-tight">9:41</span>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[15px]">signal_cellular_alt</span>
          <span className="material-symbols-outlined text-[15px]">wifi</span>
          <span className="material-symbols-outlined text-[15px]">battery_charging_full</span>
        </div>
      </div>

      {/* Center Brand Identity with smooth motion & micro-interaction */}
      <div className="flex flex-col items-center justify-center -mt-6 px-6">
        <div className="relative flex items-center justify-center">
          {/* Delicate Concentric Optical Waves */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0.35 }}
            animate={{
              scale: [0.95, 1.4, 1.7],
              opacity: [0.35, 0.12, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.6,
              ease: 'easeOut',
            }}
            className="absolute w-36 h-36 rounded-full border border-cyan-400/40 pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.85, opacity: 0.25 }}
            animate={{
              scale: [0.95, 1.25, 1.5],
              opacity: [0.3, 0.08, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.6,
              delay: 0.6,
              ease: 'easeOut',
            }}
            className="absolute w-36 h-36 rounded-full border border-sky-400/30 pointer-events-none"
          />

          {/* Clean Floating Logo Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative z-10"
          >
            <motion.button
              type="button"
              onClick={handleLogoClick}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              title="HomeSense AI • Team Invincibles (Click to view GitHub)"
              aria-label="Click to view GitHub"
              className={`w-28 h-28 rounded-3xl flex items-center justify-center transition-all cursor-pointer shadow-2xl relative ${
                isLight
                  ? 'bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 shadow-[0_16px_40px_rgba(0,180,216,0.18)]'
                  : 'bg-gradient-to-b from-[#131b26] to-[#0a0e16] border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(0,242,254,0.18)]'
              }`}
            >
              <HomeSenseLogo variant="icon" size={66} />
            </motion.button>
          </motion.div>
        </div>

        {/* Brand Text */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 flex flex-col items-center text-center"
        >
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-black tracking-tight font-sans">
              HomeSense
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-500 font-extrabold font-code-spec border border-cyan-500/30">
              AI
            </span>
          </div>
          <p
            className={`text-xs mt-1.5 font-medium tracking-wide ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Ambient Living &amp; Acoustic Auditor
          </p>

          {/* Micro-interaction progress bar */}
          <div className="w-36 h-1 mt-5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
          <span
            className={`text-[10px] mt-2 font-code-spec transition-opacity duration-300 ${
              isLight ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {progress < 100 ? 'Initializing mesh nodes…' : 'Ready'}
          </span>
        </motion.div>
      </div>

      {/* Bottom Footer Branding: "from Team Invincibles" */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
        className="w-full flex flex-col items-center pb-8 px-6 text-center"
      >
        <span
          className={`text-[10px] tracking-widest font-semibold uppercase font-code-spec ${
            isLight ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Engineered by
        </span>
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-1.5 mt-1 hover:opacity-80 transition-opacity cursor-pointer"
          title="Team Invincibles on GitHub"
        >
          <span className="material-symbols-outlined text-[15px] text-cyan-500">
            shield_with_heart
          </span>
          <span
            className={`text-xs font-black tracking-wider uppercase font-code-spec ${
              isLight ? 'text-slate-800' : 'text-cyan-400'
            }`}
          >
            Team Invincibles
          </span>
        </button>

        {/* Mobile bottom swipe indicator bar */}
        <div
          className={`w-32 h-1 mt-5 rounded-full ${
            isLight ? 'bg-slate-300' : 'bg-slate-700'
          }`}
        />
      </motion.div>
    </motion.div>
  );
};
