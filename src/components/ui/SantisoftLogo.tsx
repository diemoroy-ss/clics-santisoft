import React from 'react';
import LogoMark, { LogoMode } from './LogoMark';

export type LogoLayout = 'horizontal' | 'vertical' | 'wordmark-only' | 'icon-only';

interface SantisoftLogoProps {
  layout?: LogoLayout;
  mode?: LogoMode;
  className?: string;
  size?: number; // Size of the isotype in pixels
  animated?: boolean;
  badgeText?: string;
}

export default function SantisoftLogo({
  layout = 'horizontal',
  mode = 'light',
  className = '',
  size = 48,
  animated = true,
  badgeText = 'CLICS',
}: SantisoftLogoProps) {
  
  let textColor = 'text-[#081B33]'; // dark navy for light mode
  let subTextColor = 'text-[#2563EB]';
  
  if (mode === 'dark') {
    textColor = 'text-white';
    subTextColor = 'text-[#22D3EE]';
  } else if (mode === 'monochrome') {
    textColor = 'text-current';
    subTextColor = 'text-current opacity-80';
  }

  // Helper to render the wordmark
  const renderWordmark = (isVertical: boolean) => (
    <div className={`flex flex-col justify-center ${isVertical ? 'items-center' : 'items-start'}`}>
      <div className="flex items-center gap-2">
        <div 
          className={`font-bold leading-none tracking-tight ${textColor}`}
          style={{ fontSize: size * 0.55 }} // Proporcional al icono
        >
          SANTISOFT
        </div>
        {badgeText && (
          <span 
            className={`px-2 py-0.5 rounded-md text-[0.42em] font-bold tracking-wider leading-none uppercase border ${
              mode === 'dark' 
                ? 'border-[#22D3EE]/30 bg-[#22D3EE]/10 text-[#22D3EE]' 
                : 'border-[#2563EB]/30 bg-[#2563EB]/10 text-[#2563EB]'
            }`}
            style={{ transform: 'translateY(-1px)' }}
          >
            {badgeText}
          </span>
        )}
      </div>
      <div 
        className={`font-semibold uppercase tracking-widest mt-[0.1em] ${subTextColor}`}
        style={{ fontSize: size * 0.16 }}
      >
        AI Automation &amp; Software
      </div>
    </div>
  );

  if (layout === 'icon-only') {
    return <LogoMark mode={mode} size={size} animated={animated} className={className} />;
  }

  if (layout === 'wordmark-only') {
    return <div className={className}>{renderWordmark(false)}</div>;
  }

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <LogoMark mode={mode} size={size} animated={animated} />
        {renderWordmark(true)}
      </div>
    );
  }

  // horizontal
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <LogoMark mode={mode} size={size} animated={animated} />
      {renderWordmark(false)}
    </div>
  );
}
