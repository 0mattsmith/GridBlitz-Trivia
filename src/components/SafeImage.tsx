import React, { useState, useEffect } from 'react';
import { 
  getFallbackPortrait, 
  getFlagUrl, 
  getLeagueLogo, 
  getTrophyPhoto, 
  getManagerPhoto,
  getClubLogo
} from '../lib/images';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'player' | 'flag' | 'manager' | 'league' | 'trophy' | 'club';
  fallbackName?: string;
  theme?: string;
}

// Global cache to avoid double calling for the same entity
const sportsDbCache: { [key: string]: string } = {};

const isPlaceholderImage = (url: string | undefined): boolean => {
  if (!url) return true;
  return (
    url.includes("photo-1508098682722") || 
    url.includes("photo-1578269174936") || 
    url.includes("photo-1459865264687")
  );
};

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
  const [sportsDbUrl, setSportsDbUrl] = useState<string | null>(null);

  // Reset states when source URL changes
  useEffect(() => {
    setHasError(false);
    setSportsDbUrl(null);
  }, [src]);

  const handleError = () => {
    setHasError(true);
  };

  // Asynchronously query TheSportsDB if we hit an error or are showing a generic unsplash placeholder
  useEffect(() => {
    if (!fallbackName || theme === 'music' || theme === 'movies') {
      return;
    }

    const needsSportsDb = hasError || !src || isPlaceholderImage(src);
    if (!needsSportsDb) {
      return;
    }

    const cacheKey = `${fallbackType}:${fallbackName.toLowerCase().trim()}`;
    if (sportsDbCache[cacheKey]) {
      setSportsDbUrl(sportsDbCache[cacheKey]);
      return;
    }

    const fetchSportsDb = async () => {
      try {
        const cleanName = fallbackName.trim();
        if (fallbackType === 'player' || fallbackType === 'manager') {
          const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(cleanName)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.player && data.player.length > 0) {
              for (const p of data.player) {
                const img = p.strCutout || p.strThumb;
                if (img) {
                  sportsDbCache[cacheKey] = img;
                  setSportsDbUrl(img);
                  return;
                }
              }
            }
          }
        } else if (fallbackType === 'club') {
          const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(cleanName)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.teams && data.teams.length > 0) {
              const img = data.teams[0].strTeamBadge;
              if (img) {
                sportsDbCache[cacheKey] = img;
                setSportsDbUrl(img);
                return;
              }
            }
          }
        } else if (fallbackType === 'league') {
          const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchleagues.php?l=${encodeURIComponent(cleanName)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.leagues && data.leagues.length > 0) {
              const l = data.leagues[0];
              const img = l.strBadge || l.strLogo || l.strPoster;
              if (img) {
                sportsDbCache[cacheKey] = img;
                setSportsDbUrl(img);
                return;
              }
            }
          }
        }
      } catch (err) {
        console.warn("SportsDB lookup failed for:", fallbackName, err);
      }
    };

    fetchSportsDb();
  }, [src, hasError, fallbackType, fallbackName, theme]);

  // Determine standard fallback URL
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
  } else if (fallbackType === 'club') {
    resolvedFallbackUrl = getClubLogo(fallbackName, theme);
  }

  // Priority of URLs to show:
  // 1. Beautiful SportsDB URL if found
  // 2. Original src URL if it hasn't errored and is not a placeholder
  // 3. Clean standard local fallback
  const finalSrc = sportsDbUrl || ((!hasError && src && !isPlaceholderImage(src)) ? src : resolvedFallbackUrl);

  return (
    <img
      src={finalSrc}
      alt={fallbackName || alt}
      className={className}
      onError={handleError}
      referrerPolicy="no-referrer"
      title={fallbackName || alt}
      {...props}
    />
  );
};
