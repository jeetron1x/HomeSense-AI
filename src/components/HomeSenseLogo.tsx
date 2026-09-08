import React from 'react';

interface HomeSenseLogoProps {
  variant?: 'full' | 'navbar' | 'icon' | 'badge';
  className?: string;
  size?: number;
  animated?: boolean;
  onClick?: () => void;
  title?: string;
}

export const HomeSenseLogo: React.FC<HomeSenseLogoProps> = ({
  variant = 'navbar',
  className = '',
  size = 28,
  animated = false,
  onClick,
  title,
}) => {
  // SVG Icon matching HomeSense AI Logo (House + Phone + Wi-Fi + NPU Chip + Eco Leaf)
  const renderIcon = (iconSize: number = 28) => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-all duration-300 ${animated ? 'drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]' : ''}`}
    >
      <defs>
        {/* Blue Gradient for House Shell */}
        <linearGradient id="houseGlowGrad" x1="20" y1="14" x2="100" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="40%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        {/* Phone Frame Border */}
        <linearGradient id="phoneFrameGrad" x1="40" y1="32" x2="80" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>

        {/* Wi-Fi Waves Gradient */}
        <linearGradient id="wifiWavesGrad" x1="45" y1="44" x2="75" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        {/* NPU Chip Gradient */}
        <linearGradient id="npuChipGrad" x1="48" y1="64" x2="72" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>

        {/* Leaf Gradient */}
        <linearGradient id="leafGrad" x1="76" y1="56" x2="102" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Soft Glow */}
        <filter id="houseFilter" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Chimney on roof right */}
      <path
        d="M80 26V36H88V30.5L80 26Z"
        fill="url(#houseGlowGrad)"
      />

      {/* House Frame Contour */}
      <path
        d="M60 12L20 45V84C20 89.5 24.5 94 30 94H42V88H30C27.8 88 26 86.2 26 84V47.5L60 19.5L94 47.5V64H100V45L60 12Z"
        fill="url(#houseGlowGrad)"
        filter="url(#houseFilter)"
      />

      {/* Smartphone Frame in Center */}
      <rect
        x="41"
        y="32"
        width="38"
        height="58"
        rx="8"
        fill="#0a0d14"
        stroke="url(#phoneFrameGrad)"
        strokeWidth="3.2"
      />

      {/* Speaker Bar at Top of Phone */}
      <line x1="55" y1="37" x2="65" y2="37" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

      {/* Wi-Fi Waves */}
      <path
        d="M48 50C52.5 45.5 67.5 45.5 72 50"
        stroke="url(#wifiWavesGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M52 55C55 52.5 65 52.5 68 55"
        stroke="url(#wifiWavesGrad)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M56 60C58 58.5 62 58.5 64 60"
        stroke="url(#wifiWavesGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* NPU Processor Chip */}
      {/* Pins Top */}
      <line x1="54" y1="67" x2="54" y2="69" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="60" y1="67" x2="60" y2="69" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="66" y1="67" x2="66" y2="69" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
      {/* Pins Bottom */}
      <line x1="54" y1="81" x2="54" y2="83" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="60" y1="81" x2="60" y2="83" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="66" y1="81" x2="66" y2="83" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
      {/* Pins Left */}
      <line x1="47" y1="72" x2="49" y2="72" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="47" y1="78" x2="49" y2="78" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
      {/* Pins Right */}
      <line x1="71" y1="72" x2="73" y2="72" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="71" y1="78" x2="73" y2="78" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />

      {/* Chip Body */}
      <rect
        x="49"
        y="69"
        width="22"
        height="12"
        rx="2.5"
        fill="url(#npuChipGrad)"
        stroke="#e9d5ff"
        strokeWidth="0.8"
      />
      <rect
        x="53"
        y="72"
        width="14"
        height="6"
        rx="1.5"
        fill="#2e1065"
      />

      {/* Eco Leaf on Bottom-Right */}
      <path
        d="M78 92C78 92 76 68 98 55C108 77 96 92 78 92Z"
        fill="url(#leafGrad)"
        filter="url(#houseFilter)"
      />
      <path
        d="M80 89C86 82 92 72 98 55"
        stroke="#a7f3d0"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );

  const wrapClickable = (content: React.ReactNode) => {
    if (!onClick) return content;
    return (
      <button
        type="button"
        onClick={onClick}
        title={title || 'View GitHub Repository'}
        aria-label={title || 'View GitHub Repository'}
        className="cursor-pointer hover:opacity-95 active:scale-95 transition-all text-left group focus:outline-none"
      >
        {content}
      </button>
    );
  };

  if (variant === 'icon') {
    return wrapClickable(
      <div className={`inline-flex items-center justify-center ${className}`}>{renderIcon(size)}</div>
    );
  }

  if (variant === 'navbar') {
    return wrapClickable(
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative flex items-center justify-center">
          {renderIcon(size)}
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
        </div>
        <div className="flex flex-col select-none leading-none">
          <div className="flex items-baseline gap-0.5">
            <span className="font-bold text-[13px] tracking-tight text-white font-headline-sm">HomeSense</span>
            <span className="font-extrabold text-[13px] bg-gradient-to-r from-[#00f2fe] via-[#38bdf8] to-[#6366f1] bg-clip-text text-transparent">AI</span>
          </div>
          <span className="text-[8px] font-semibold text-slate-400 tracking-[0.16em] uppercase mt-0.5 font-code-spec">LOCALLY.</span>
        </div>
      </div>
    );
  }

  if (variant === 'badge') {
    return wrapClickable(
      <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[#0b0e14]/90 backdrop-blur-xl border border-white/10 shadow-lg ${className}`}>
        {renderIcon(size)}
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-baseline gap-0.5">
            <span className="font-bold text-[14px] tracking-tight text-white">HomeSense</span>
            <span className="font-extrabold text-[14px] bg-gradient-to-r from-[#00f2fe] via-[#38bdf8] to-[#6366f1] bg-clip-text text-transparent">AI</span>
          </div>
          <span className="text-[8px] font-semibold text-cyan-400/90 tracking-widest uppercase mt-0.5">ON-DEVICE NPU</span>
        </div>
      </div>
    );
  }

  // Full Brand Display (Logo + HomeSense AI + Subtext "SMARTER HOMES. LOCALLY.")
  return wrapClickable(
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      <div className="relative p-2 rounded-3xl bg-[#0a0d14]/80 backdrop-blur-xl border border-white/10 shadow-[0_0_32px_rgba(56,189,248,0.2)] mb-3">
        {renderIcon(size || 72)}
      </div>
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">HomeSense</span>
        <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#38bdf8] via-[#60a5fa] to-[#818cf8] bg-clip-text text-transparent">AI</span>
      </div>
      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 tracking-[0.25em] uppercase mt-1.5">
        SMARTER HOMES. LOCALLY.
      </span>
    </div>
  );
};
