import React from 'react';

interface BhumiRakshakLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textClassName?: string;
  subtextClassName?: string;
  variant?: 'full' | 'icon' | 'badge';
  onClick?: () => void;
}

export const BhumiRakshakLogo: React.FC<BhumiRakshakLogoProps> = ({
  className = 'w-9 h-9',
  size,
  showText = false,
  textClassName = 'text-base font-bold text-white',
  subtextClassName = 'text-xs text-slate-400',
  variant = 'icon',
  onClick,
}) => {
  const inlineStyle = size ? { width: size, height: size } : undefined;

  const svgIcon = (
    <svg
      viewBox="0 0 600 600"
      className={`${className} shrink-0 select-none`}
      style={inlineStyle}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Bhumi Rakshak Logo"
    >
      <defs>
        <clipPath id="innerShieldBoundary">
          <path d="M 300,92 C 400,92 475,114 490,138 C 510,240 472,380 300,522 C 128,380 90,240 110,138 C 125,114 200,92 300,92 Z" />
        </clipPath>
        <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67b8ff" />
          <stop offset="100%" stopColor="#3d97f2" />
        </linearGradient>
      </defs>

      {/* Outer Dark Navy-Teal Shield Body */}
      <path
        d="M 300,65 C 415,65 506,88 526,118 C 550,242 505,408 300,562 C 95,408 50,242 74,118 C 94,88 185,65 300,65 Z"
        fill="#071b22"
        stroke="#041014"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Inner Crisp White Shield Contour */}
      <path
        d="M 300,92 C 400,92 475,114 490,138 C 510,240 472,380 300,522 C 128,380 90,240 110,138 C 125,114 200,92 300,92 Z"
        fill="#091f27"
        stroke="#ffffff"
        strokeWidth="16"
        strokeLinejoin="round"
      />

      {/* Clipped Inside Shield Area */}
      <g clipPath="url(#innerShieldBoundary)">
        {/* Mountain Base White Outline Shadow */}
        <path
          d="M 132,315 L 202,224 L 235,255 L 300,140 L 365,255 L 398,224 L 468,315 L 390,325 L 300,325 L 210,325 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="20"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Left Mountain Peak (Green + Dark Shadow Facets) */}
        <polygon
          points="202,224 135,315 240,315"
          fill="#63a83a"
          stroke="#ffffff"
          strokeWidth="12"
          strokeLinejoin="round"
        />
        <polygon points="202,224 240,315 260,265" fill="#3b6e22" />
        <polygon points="175,275 210,315 240,315" fill="#1e3d11" />

        {/* Right Mountain Peak (Green + Dark Shadow Facets) */}
        <polygon
          points="398,224 465,315 360,315"
          fill="#63a83a"
          stroke="#ffffff"
          strokeWidth="12"
          strokeLinejoin="round"
        />
        <polygon points="398,224 360,315 340,265" fill="#36661e" />
        <polygon points="425,275 390,315 360,315" fill="#1a350e" />

        {/* Center Main High Peak */}
        <polygon
          points="300,140 228,256 270,325 330,325 372,256"
          fill="#63a83a"
          stroke="#ffffff"
          strokeWidth="14"
          strokeLinejoin="round"
        />

        {/* Deep Crevice and Facet Shadows on Center Peak */}
        <path
          d="M 300,148 L 322,238 L 308,272 L 324,325 L 276,325 L 262,260 L 272,238 Z"
          fill="#407727"
        />
        <path
          d="M 308,238 L 372,325 L 322,325 L 308,272 Z"
          fill="#132c0c"
        />
        <path
          d="M 262,258 L 276,325 L 232,325 Z"
          fill="#1d4012"
        />

        {/* Dynamic Flowing S-Curve River (Light/Cyan Azure Blue) */}
        <path
          d="M 374,325 
             C 338,332 310,334 278,342
             C 236,354 204,380 208,418
             C 212,456 256,472 284,482
             C 324,496 350,510 336,536
             C 328,552 300,568 274,574
             L 374,574
             C 402,558 412,530 396,498
             C 376,464 322,452 296,440
             C 270,428 262,414 266,396
             C 272,374 304,358 350,348
             C 376,342 386,332 374,325 Z"
          fill="url(#riverGrad)"
        />

        {/* River Water Surface Glint / Highlights */}
        <path
          d="M 226,410 C 232,392 262,378 288,370"
          fill="none"
          stroke="#aee0ff"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M 284,458 C 314,468 344,482 354,502"
          fill="none"
          stroke="#aee0ff"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.9"
        />
      </g>
    </svg>
  );

  if (!showText) {
    return svgIcon;
  }

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 ${onClick ? 'cursor-pointer group' : ''}`}
    >
      {/* Badge container */}
      <div className="relative shrink-0 flex items-center justify-center filter drop-shadow-sm transition-transform duration-200 group-hover:scale-105">
        {svgIcon}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={textClassName}>Bhumi Rakshak</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            भूमि रक्षक
          </span>
        </div>
        <p className={subtextClassName}>
          Landslide Early Warning System &bull; NER India
        </p>
      </div>
    </div>
  );
};
