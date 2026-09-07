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
  // SVG Icon representing House + Phone + NPU Chip + Wifi + Eco Leaf
  const renderIcon = (iconSize: number = 28) => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-all duration-300 ${animated ? 'drop-shadow-[0_0_16px_rgba(0,242,254,0.4)]' : ''}`}
    >
      <defs>
        {/* Glow & Gradients */}
        <linearGradient id="roofGrad" x1="15" y1="15" x2="105" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        <linearGradient id="phoneBorder" x1="38" y1="36" x2="82" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        <linearGradient id="wifiGrad" x1="45" y1="46" x2="75" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f2fe" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id="chipGrad" x1="48" y1="68" x2="72" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>

        <linearGradient id="leafGrad" x1="82" y1="70" x2="108" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* House Outline with Chimney */}
      {/* Chimney */}
      <path
        d="M82 26V40H92V36L82 26Z"
        fill="url(#roofGrad)"
        opacity="0.9"
      />
      {/* Roof & Walls Contour */}
      <path
        d="M60 12L20 44V88C20 92.4 23.6 96 28 96H44V88H30V48L60 22L90 48V62H98V44L60 12Z"
        fill="url(#roofGrad)"
        filter="url(#logoGlow)"
      />

      {/* Smartphone Frame Inside House */}
      <rect
        x="42"
        y="36"
        width="36"
        height="56"
        rx="7"
        fill="#0b0e14"
        stroke="url(#phoneBorder)"
        strokeWidth="3"
      />
      {/* Speaker Bar on top of phone */}
      <line x1="56" y1="41" x2="64" y2="41" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />

      {/* Wi-Fi Radiation Waves */}
      <path
        d="M49 53C52.5 49.5 67.5 49.5 71 53"
        stroke="url(#wifiGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M53 58C56 55.5 64 55.5 67 58"
        stroke="url(#wifiGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="60" cy="62" r="1.5" fill="#00f2fe" />

      {/* NPU Processor Chip with pins */}
      {/* Pins */}
      <line x1="53" y1="70" x2="53" y2="67" stroke="#a855f7" strokeWidth="1.2" />
      <line x1="60" y1="70" x2="60" y2="67" stroke="#a855f7" strokeWidth="1.2" />
      <line x1="67" y1="70" x2="67" y2="67" stroke="#a855f7" strokeWidth="1.2" />
      <line x1="53" y1="84" x2="53" y2="87" stroke="#a855f7" strokeWidth="1.2" />
      <line x1="60" y1="84" x2="60" y2="87" stroke="#a855f7" strokeWidth="1.2" />
      <line x1="67" y1="84" x2="67" y2="87" stroke="#a855f7" strokeWidth="1.2" />
      <line x1="47" y1="74" x2="50" y2="74" stroke="#a855f7" strokeWidth="1.2" />
      <line x1="47" y1="80" x2="50" y2="80" stroke="#a855f7" strokeWidth="1.2" />
      <line x1="70" y1="74" x2="73" y2="74" stroke="#a855f7" strokeWidth="1.2" />
      <line x1="70" y1="80" x2="73" y2="80" stroke="#a855f7" strokeWidth="1.2" />

      {/* Chip Core */}
      <rect
        x="50"
        y="70"
        width="20"
        height="14"
        rx="2.5"
        fill="url(#chipGrad)"
        stroke="#e9d5ff"
        strokeWidth="0.75"
      />
      {/* Inner Chip Core Pattern */}
      <rect x="54" y="73" width="12" height="8" rx="1.5" fill="#3b0764" />

      {/* Eco Leaf Graphic on right */}
      <path
        d="M84 94C84 94 81 74 98 64C108 82 98 94 84 94Z"
        fill="url(#leafGrad)"
        filter="url(#logoGlow)"
      />
      <path
        d="M86 91C91 85 96 76 98 64"
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
            <span className="font-bold text-[13px] tracking-tight font-headline-sm">HomeSense</span>
            <span className="font-extrabold text-[13px] bg-gradient-to-r from-[#00f2fe] to-[#38bdf8] bg-clip-text text-transparent">AI</span>
          </div>
          <span className="text-[8px] font-semibold text-slate-400 tracking-[0.14em] uppercase mt-0.5 font-code-spec">LOCALLY.</span>
        </div>
      </div>
    );
  }

  if (variant === 'badge') {
    return wrapClickable(
      <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[#1d2028]/80 backdrop-blur-xl border border-white/10 shadow-lg ${className}`}>
        {renderIcon(size)}
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-baseline gap-0.5">
            <span className="font-bold text-[14px] tracking-tight text-white">HomeSense</span>
            <span className="font-extrabold text-[14px] bg-gradient-to-r from-[#00f2fe] to-[#38bdf8] bg-clip-text text-transparent">AI</span>
          </div>
          <span className="text-[8px] font-semibold text-cyan-400/90 tracking-widest uppercase mt-0.5">ON-DEVICE NPU</span>
        </div>
      </div>
    );
  }

  // Full Brand Display
  return wrapClickable(
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      <div className="relative p-2 rounded-3xl bg-surface-container-lowest/5 backdrop-blur-xl border border-white/10 shadow-[0_0_32px_rgba(0,242,254,0.15)] mb-2">
        {renderIcon(size || 64)}
      </div>
      <div className="flex items-center justify-center gap-1">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight">HomeSense</span>
        <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#00f2fe] via-[#38bdf8] to-[#2563eb] bg-clip-text text-transparent">AI</span>
      </div>
      <span className="text-[11px] font-medium text-slate-400 tracking-[0.2em] uppercase mt-1">
        SMARTER HOMES. LOCALLY.
      </span>
    </div>
  );
};
