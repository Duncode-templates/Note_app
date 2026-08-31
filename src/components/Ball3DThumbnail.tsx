import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { BallTextureItem } from '../data/storeItems';
import { captureBall3DThumbnailAsync, getCachedBall3DThumbnail } from '../utils/ball3DCapture';

interface Ball3DThumbnailProps {
  ball: BallTextureItem;
  className?: string;
  isEquipped?: boolean;
}

export default function Ball3DThumbnail({
  ball,
  className = '',
  isEquipped = false,
}: Ball3DThumbnailProps) {
  const [imageUrl, setImageUrl] = useState<string>(() => getCachedBall3DThumbnail(ball.id) || '');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy loading observer: Only start 3D capture when component scrolls into viewport
  useEffect(() => {
    // If already in memory cache, no need to observe
    if (imageUrl) return;

    const currentEl = containerRef.current;
    if (!currentEl) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px', threshold: 0.05 }
    );

    observer.observe(currentEl);

    return () => {
      observer.disconnect();
    };
  }, [ball.id, imageUrl]);

  // When visible and not yet loaded, asynchronously request 3D capture
  useEffect(() => {
    if (!isVisible || imageUrl) return;

    let isMounted = true;
    captureBall3DThumbnailAsync(ball)
      .then((url) => {
        if (isMounted && url) {
          setImageUrl(url);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isVisible, ball, imageUrl]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-28 sm:h-36 rounded-[14px] sm:rounded-[18px] border-[2px] sm:border-[2.5px] border-black bg-gradient-to-b from-slate-900/20 via-slate-900/10 to-slate-900/25 flex items-center justify-center p-2 sm:p-3 mb-2.5 sm:mb-4 relative overflow-hidden group select-none ${className}`}
    >
      {/* Subtle Stadium Radial Background Glow */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none transition-opacity group-hover:opacity-40"
        style={{
          background: `radial-gradient(circle at center, ${ball.theme.panelColor} 0%, transparent 70%)`,
        }}
      />

      {imageUrl ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center"
          whileHover={{ scale: 1.1, rotate: 6, y: -2 }}
        >
          <img
            src={imageUrl}
            alt={ball.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)] select-none pointer-events-none"
            draggable={false}
          />
        </motion.div>
      ) : (
        /* Instant High-Speed 2D Vector Preview while lazy 3D capture loads */
        <div className="relative w-16 h-16 sm:w-22 sm:h-22 flex items-center justify-center transition-transform group-hover:scale-105">
          <div
            className="w-full h-full rounded-full border-[2.5px] sm:border-[3px] border-black shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.4),0_4px_0_0_rgba(0,0,0,0.25)] relative flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: ball.theme.baseColor }}
          >
            {/* Center Pentagon */}
            <div
              className="w-6 h-6 sm:w-8 sm:h-8 border-[2px] border-black transform rotate-45 flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: ball.theme.panelColor,
                borderColor: ball.theme.seamColor,
              }}
            >
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                style={{ backgroundColor: ball.theme.trimColor }}
              />
            </div>
            {/* Gloss Highlight */}
            <div className="absolute top-1 left-2 w-4 h-2 rounded-full bg-white/40 transform -rotate-45 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}
