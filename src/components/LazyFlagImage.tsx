import React, { useState, useEffect } from 'react';
import { getFlagUrl } from '../data/countries';

interface LazyFlagImageProps {
  src?: string;
  countryCode?: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
}

// In-memory cache of resolved flag image URLs to prevent reload flashes
const loadedFlagCache = new Set<string>();

export const LazyFlagImage: React.FC<LazyFlagImageProps> = React.memo(({
  src,
  countryCode,
  alt = 'Country Flag',
  className = '',
  imageClassName = '',
}) => {
  const resolvedSrc = src || (countryCode ? getFlagUrl(countryCode) : '');
  const isAlreadyLoaded = Boolean(resolvedSrc && loadedFlagCache.has(resolvedSrc));
  const [isLoaded, setIsLoaded] = useState<boolean>(isAlreadyLoaded);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!resolvedSrc) {
      setIsLoaded(false);
      setHasError(true);
      return;
    }

    if (loadedFlagCache.has(resolvedSrc)) {
      setIsLoaded(true);
      setHasError(false);
      return;
    }

    setIsLoaded(false);
    setHasError(false);
  }, [resolvedSrc]);

  const handleLoad = () => {
    if (resolvedSrc) {
      loadedFlagCache.add(resolvedSrc);
    }
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden bg-slate-800 flex items-center justify-center ${className}`}>
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-700/80 animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-slate-500 border-t-amber-400 rounded-full animate-spin" />
        </div>
      )}

      {/* Main Flag Image */}
      {resolvedSrc && !hasError ? (
        <img
          src={resolvedSrc}
          alt={alt}
          loading="eager"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-150 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${imageClassName}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-sky-800 text-white font-black text-xs uppercase tracking-wider select-none">
          {countryCode?.toUpperCase() || alt || '🏳️'}
        </div>
      )}
    </div>
  );
});

export default LazyFlagImage;
