import React from 'react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed top-20 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="pointer-events-auto max-w-sm px-4 py-2.5 rounded-full bg-[#181c24]/90 backdrop-blur-2xl border border-cyan-400/40 text-cyan-300 shadow-[0_8px_24px_rgba(0,0,0,0.6),0_0_16px_rgba(0,242,254,0.3)] flex items-center gap-2.5 text-xs font-semibold">
        <span className="material-symbols-outlined text-[18px] text-cyan-400 shrink-0">
          check_circle
        </span>
        <span className="truncate">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-1 text-slate-400 hover:text-white"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>
    </div>
  );
};
