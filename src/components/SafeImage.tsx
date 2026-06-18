import React, { useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'player' | 'flag' | 'manager' | 'league' | 'trophy';
  fallbackName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className,
  fallbackType = 'player',
  fallbackName,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state when the source URL changes
  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const getInitials = (name: string): string => {
    if (!name) return "⚽";
    const parts = name.replace(/[^a-zA-Z\s]/g, "").trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "⚽";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError || !src) {
    if (fallbackType === 'player' && fallbackName) {
      const initials = getInitials(fallbackName);
      return (
        <div 
          className={`${className} flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-indigo-900 text-white font-black uppercase text-center select-none shadow-inner border border-slate-600/30`}
          title={fallbackName}
        >
          <span className="text-[40%] leading-none tracking-tight">{initials}</span>
        </div>
      );
    }

    if (fallbackType === 'flag') {
      return (
        <span 
          className="w-5 h-3.5 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center font-mono text-[8px] text-slate-400 select-none shrink-0"
          title={fallbackName || "Nationality Info"}
        >
          🏴
        </span>
      );
    }

    if (fallbackType === 'manager' && fallbackName) {
      const initials = getInitials(fallbackName);
      return (
        <div 
          className={`${className} flex items-center justify-center bg-gradient-to-br from-amber-600 to-rose-700 text-white font-black uppercase text-center select-none shadow-inner border border-amber-500/20`}
          title={fallbackName}
        >
          <span className="text-[40%] leading-none">{initials}</span>
        </div>
      );
    }

    if (fallbackType === 'league') {
      return (
        <div 
          className={`${className} flex items-center justify-center bg-slate-50 border border-slate-205 text-slate-400 select-none`}
          title={fallbackName}
        >
          ⚽
        </div>
      );
    }

    if (fallbackType === 'trophy') {
      return (
        <div 
          className={`${className} flex items-center justify-center bg-slate-50 border border-slate-205 text-amber-500 text-[10px] sm:text-[11px] select-none`}
          title={fallbackName}
        >
          🏆
        </div>
      );
    }

    return (
      <div className={`${className} flex items-center justify-center bg-slate-100 border border-slate-200 text-slate-450`}>
        ⚽
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
};
