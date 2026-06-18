import React, { useState } from 'react';
import { 
  getFallbackPortrait, 
  getFlagUrl, 
  getLeagueLogo, 
  getTrophyPhoto, 
  getManagerPhoto 
} from '../lib/images';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'player' | 'flag' | 'manager' | 'league' | 'trophy';
  fallbackName?: string;
  theme?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className,
  fallbackType = 'player',
  fallbackName = '',
  theme = 'football',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state when the source URL changes
  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const handleError = () => {
    setHasError(true);
  };

  // If there's an error loading the main URL, or if there is no URL provided,
  // we dynamically resolve a full-fledged high-quality photograph or vector URL instead of empty blocks!
  if (hasError || !src) {
    let resolvedFallbackUrl = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=300";

    if (fallbackType === 'player') {
      resolvedFallbackUrl = getFallbackPortrait(fallbackName);
    } else if (fallbackType === 'manager') {
      resolvedFallbackUrl = getManagerPhoto(fallbackName, theme);
    } else if (fallbackType === 'flag') {
      resolvedFallbackUrl = getFlagUrl(fallbackName);
    } else if (fallbackType === 'league') {
      resolvedFallbackUrl = getLeagueLogo(fallbackName, theme);
    } else if (fallbackType === 'trophy') {
      resolvedFallbackUrl = getTrophyPhoto(fallbackName, theme);
    }

    return (
      <img
        src={resolvedFallbackUrl}
        alt={fallbackName || alt}
        className={className}
        referrerPolicy="no-referrer"
        title={fallbackName}
        {...props}
      />
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
