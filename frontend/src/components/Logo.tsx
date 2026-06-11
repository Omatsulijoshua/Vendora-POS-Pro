import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * A beautiful, custom SVG representation of the brand network nodes logo.
 * Automatically aligns with the Provided Image logo geometry.
 */
export function Logo({ className = "", size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
    >
      {/* Connections (Blue Branch) */}
      <line x1="25" y1="28" x2="52" y2="18" stroke="#0A429C" strokeWidth="6.5" strokeLinecap="round" />
      <line x1="25" y1="28" x2="46" y2="48" stroke="#0A429C" strokeWidth="6.5" strokeLinecap="round" />
      <line x1="52" y1="18" x2="46" y2="48" stroke="#0A429C" strokeWidth="6.5" strokeLinecap="round" />
      <line x1="46" y1="48" x2="58" y2="78" stroke="#0A429C" strokeWidth="6.5" strokeLinecap="round" />

      {/* Cross Connection (Green linking to blue network) */}
      <line x1="52" y1="18" x2="78" y2="24" stroke="#0E9F6E" strokeWidth="6.5" strokeLinecap="round" />
      
      {/* Right Branch (Green thick rounded bar) */}
      <path d="M56 72 L72 38" stroke="#0E9F6E" strokeWidth="12" strokeLinecap="round" />
      
      {/* Line connecting right branch to top-right green node */}
      <line x1="72" y1="38" x2="78" y2="24" stroke="#0E9F6E" strokeWidth="6.5" strokeLinecap="round" />

      {/* Nodes (Blue) with dynamic background outline stroke */}
      <circle cx="25" cy="28" r="7.5" fill="#0A429C" stroke="var(--background)" strokeWidth="2.5" />
      <circle cx="52" cy="18" r="7.5" fill="#0A429C" stroke="var(--background)" strokeWidth="2.5" />
      <circle cx="46" cy="48" r="7.5" fill="#0A429C" stroke="var(--background)" strokeWidth="2.5" />
      <circle cx="58" cy="78" r="7.5" fill="#0A429C" stroke="var(--background)" strokeWidth="2.5" />

      {/* Nodes (Green) with dynamic background outline stroke */}
      <circle cx="78" cy="24" r="7.5" fill="#0E9F6E" stroke="var(--background)" strokeWidth="2.5" />
    </svg>
  );
}

/**
 * Full brand logo with text and tagline alignment.
 */
export function LogoWithText({ className = "", size = 38, showTagline = true }: LogoProps & { showTagline?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo size={size} />
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight text-foreground flex items-center leading-none">
          <span className="text-slate-900 dark:text-white font-black">Vendora</span>
          <span className="text-[#0E9F6E] font-medium ml-1">POS Pro</span>
        </span>
        {showTagline && (
          <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-1">
            One Platform. Unlimited Stores.
          </span>
        )}
      </div>
    </div>
  );
}
