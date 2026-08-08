import React from 'react';

export type LogoMode = 'light' | 'dark' | 'monochrome';

interface LogoMarkProps {
  mode?: LogoMode;
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function LogoMark({
  mode = 'light',
  className = '',
  size = 64,
  animated = true,
}: LogoMarkProps) {
  let strokeColor = '#2563EB'; // brand-blue
  if (mode === 'dark') strokeColor = '#22D3EE';  // brand-cyan
  if (mode === 'monochrome') strokeColor = 'currentColor';

  // R1.3-B: Continuous Flow (Final Master Isotype)
  const path = "M 64 8 L 32 8 L 8 32 L 56 32 L 32 56 L 0 56";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'flow-logo-anim' : ''} ${className}`}
      style={mode !== 'monochrome' ? { color: strokeColor } : undefined}
    >
      <path 
        d={path} 
        stroke="currentColor" 
        strokeWidth="16" 
        fill="none" 
        strokeLinecap="butt" 
        strokeLinejoin="bevel" 
      />
    </svg>
  );
}
