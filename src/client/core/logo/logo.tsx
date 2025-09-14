const Logo = () => (
  <div className="flex items-center gap-3">
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Black filled circle background */}
      <circle
        cx="16"
        cy="16"
        r="15"
        fill="#000000"
      />
      
      {/* Clipping mask for grid */}
      <defs>
        <clipPath id="circleClip">
          <circle cx="16" cy="16" r="15" />
        </clipPath>
      </defs>
      
      {/* Isometric grid lines - clipped to circle */}
      <g clipPath="url(#circleClip)">
        {/* Diagonal lines going up-right */}
        <path d="M4 8 L28 32" stroke="#ffffff" strokeWidth="0.9" opacity="0.25" />
        <path d="M4 12 L28 36" stroke="#ffffff" strokeWidth="0.9" opacity="0.25" />
        <path d="M4 4 L28 28" stroke="#ffffff" strokeWidth="0.9" opacity="0.25" />
        <path d="M0 12 L24 36" stroke="#ffffff" strokeWidth="0.9" opacity="0.25" />
        <path d="M8 0 L32 24" stroke="#ffffff" strokeWidth="0.9" opacity="0.25" />
        
        {/* Diagonal lines going up-left */}
        <path d="M28 8 L4 32" stroke="#ffffff" strokeWidth="0.9" opacity="0.25" />
        <path d="M28 12 L4 36" stroke="#ffffff" strokeWidth="0.9" opacity="0.25" />
        <path d="M28 4 L4 28" stroke="#ffffff" strokeWidth="0.9" opacity="0.25" />
        <path d="M32 12 L8 36" stroke="#ffffff" strokeWidth="0.9" opacity="0.25" />
        <path d="M24 0 L0 24" stroke="#ffffff" strokeWidth="0.9" opacity="0.25" />
        
        {/* Horizontal lines */}
        <path d="M0 12 L32 12" stroke="#ffffff" strokeWidth="0.9" opacity="0.18" />
        <path d="M0 16 L32 16" stroke="#ffffff" strokeWidth="0.9" opacity="0.18" />
        <path d="M0 20 L32 20" stroke="#ffffff" strokeWidth="0.9" opacity="0.18" />
        <path d="M0 8 L32 8" stroke="#ffffff" strokeWidth="0.9" opacity="0.18" />
        <path d="M0 24 L32 24" stroke="#ffffff" strokeWidth="0.9" opacity="0.18" />
      </g>
      
      {/* White "Bs" text in center - on top of grid */}
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="12"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
      >
        Bs
      </text>
    </svg>
    
    <div className="flex flex-col">
      <span className="text-lg font-bold text-foreground leading-tight">Bananashop</span>
    </div>
  </div>
);

export default Logo;