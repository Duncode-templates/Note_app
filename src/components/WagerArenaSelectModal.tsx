import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Swords,
  Trophy,
  Crown,
  Flame,
  Zap,
  Lock,
  Coins,
} from 'lucide-react';
import { WAGER_TIERS, WagerTier } from '../data/wagerArenas';
import CoinIcon from './CoinIcon';
import { useTranslation } from '../utils/i18n';

interface WagerArenaSelectModalProps {
  isOpen: boolean;
  userCoins: number;
  onClose: () => void;
  onSelectTier: (tier: WagerTier) => void;
}

export default function WagerArenaSelectModal({
  isOpen,
  userCoins,
  onClose,
  onSelectTier,
}: WagerArenaSelectModalProps) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const touchStartXRef = useRef<number | null>(null);

  // Set starting arena to highest affordable tier or rookie
  useEffect(() => {
    if (isOpen) {
      const affordableIdx = WAGER_TIERS.reduce((best, tier, idx) => {
        if (userCoins >= tier.entryFee) return idx;
        return best;
      }, 0);
      setActiveIndex(affordableIdx);
    }
  }, [isOpen, userCoins]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(WAGER_TIERS.length - 1, prev + 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        const current = WAGER_TIERS[activeIndex];
        if (current && userCoins >= current.entryFee) {
          e.preventDefault();
          onSelectTier(current);
        }
      }
    },
    [isOpen, activeIndex, userCoins, onClose, onSelectTier]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const currentTier = WAGER_TIERS[activeIndex] || WAGER_TIERS[0];
  const canAffordCurrent = userCoins >= currentTier.entryFee;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < WAGER_TIERS.length - 1 ? prev + 1 : prev));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(diffX) > 40) {
      if (diffX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const renderTierIcon = (iconType: WagerTier['icon'], sizeClass = 'w-10 h-10') => {
    switch (iconType) {
      case 'bronze':
        return <Flame className={`${sizeClass} text-orange-500 fill-orange-500/30`} />;
      case 'silver':
        return <Zap className={`${sizeClass} text-sky-500 fill-sky-500/30`} />;
      case 'gold':
        return <Trophy className={`${sizeClass} text-purple-600 fill-purple-600/30`} />;
      case 'diamond':
        return <Crown className={`${sizeClass} text-amber-500 fill-amber-500/40`} />;
      default:
        return <Swords className={`${sizeClass} text-amber-500`} />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 w-full h-full bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 text-slate-900 select-none font-sans z-50 overflow-hidden flex flex-col justify-between p-3 sm:p-6 md:p-8"
      >
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between gap-3 z-20">
          {/* Back Button */}
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ y: 4, scale: 0.97, boxShadow: '0px 1px 0px 0px #000' }}
            onClick={onClose}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[18px] font-black uppercase tracking-wider bg-white text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center gap-2 text-xs sm:text-sm outline-none focus:outline-none"
          >
            <ArrowLeft className="w-5 h-5 text-black" />
            <span className="hidden xs:inline">{t('common.backToMenu', 'Back to Menu')}</span>
            <span className="xs:hidden">{t('common.back', 'Back')}</span>
          </motion.button>

          {/* User Coin Balance */}
          <div className="bg-white/95 backdrop-blur-md border-[3px] border-black shadow-[0_5px_0_0_#000] rounded-full px-3.5 sm:px-5 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-2.5">
            <CoinIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-sm sm:text-base md:text-xl font-black text-black tracking-wider">
              {userCoins.toLocaleString()} <span className="text-[10px] sm:text-xs text-slate-600">{t('common.coins', 'COINS')}</span>
            </span>
          </div>
        </div>

        {/* Page Title */}
        <div className="text-center my-1 sm:my-2 z-10">
          <motion.h1
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-amber-500 drop-shadow-[0_3px_0_#78350f] sm:drop-shadow-[0_5px_0_#78350f] [text-shadow:0_1px_0_#fef08a,0_2px_0_#f59e0b,0_3px_0_#d97706,0_4px_0_#b45309,0_5px_0_#78350f,0_6px_12px_rgba(0,0,0,0.6)]"
          >
            {t('wager.title', 'COIN WAGER ARENA')}
          </motion.h1>
          <p className="text-white text-xs sm:text-sm font-bold uppercase tracking-widest drop-shadow-md mt-0.5">
            {t('wager.subtitle', 'Pick your stakes • Winner takes all coins!')}
          </p>
        </div>

        {/* Carousel Area */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full flex-1 flex items-center justify-center overflow-hidden min-h-[300px] sm:min-h-[360px] perspective-[1200px]"
        >
          {/* Left Arrow Button */}
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            aria-label="Previous Arena"
            className={`absolute left-2 sm:left-6 md:left-12 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-2xl border-[3px] sm:border-[3.5px] border-black flex items-center justify-center cursor-pointer transition-all shadow-[0_5px_0_0_#000] active:translate-y-1 ${
              activeIndex === 0
                ? 'opacity-20 bg-white/40 text-black/40 cursor-not-allowed border-black/30 shadow-none'
                : 'bg-white hover:bg-amber-300 text-black hover:scale-105'
            }`}
          >
            <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3]" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            disabled={activeIndex === WAGER_TIERS.length - 1}
            aria-label="Next Arena"
            className={`absolute right-2 sm:right-6 md:right-12 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-2xl border-[3px] sm:border-[3.5px] border-black flex items-center justify-center cursor-pointer transition-all shadow-[0_5px_0_0_#000] active:translate-y-1 ${
              activeIndex === WAGER_TIERS.length - 1
                ? 'opacity-20 bg-white/40 text-black/40 cursor-not-allowed border-black/30 shadow-none'
                : 'bg-white hover:bg-amber-300 text-black hover:scale-105'
            }`}
          >
            <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3]" />
          </button>

          {/* Coverflow Cards */}
          <div className="relative w-full h-full flex items-center justify-center">
            {WAGER_TIERS.map((tier, index) => {
              const distance = index - activeIndex;
              const isCenter = distance === 0;
              const isAdjacent = Math.abs(distance) === 1;
              const isFar = Math.abs(distance) >= 2;
              const canAfford = userCoins >= tier.entryFee;
              const diffCoins = tier.entryFee - userCoins;

              // Responsive X offset for cover flow
              const xOffset = distance * 270;

              let scale = 1;
              let opacity = 1;
              let filter = 'blur(0px) brightness(100%)';
              let rotateY = 0;
              let zIndex = 20;

              if (isCenter) {
                scale = 1.0;
                opacity = 1;
                filter = 'blur(0px) brightness(100%)';
                rotateY = 0;
                zIndex = 20;
              } else if (isAdjacent) {
                scale = 0.82;
                opacity = 0.6;
                filter = 'blur(3px) brightness(45%)';
                rotateY = distance > 0 ? -12 : 12;
                zIndex = 10;
              } else if (isFar) {
                scale = 0.65;
                opacity = 0.15;
                filter = 'blur(6px) brightness(25%)';
                rotateY = distance > 0 ? -20 : 20;
                zIndex = 5;
              }

              return (
                <motion.div
                  key={tier.id}
                  animate={{
                    x: xOffset,
                    scale: scale,
                    opacity: opacity,
                    rotateY: rotateY,
                    zIndex: zIndex,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 30,
                    mass: 0.8,
                  }}
                  style={{
                    position: 'absolute',
                    transformStyle: 'preserve-3d',
                    filter: filter,
                  }}
                  onClick={() => {
                    if (!isCenter) {
                      setActiveIndex(index);
                    }
                  }}
                  className={`w-[270px] sm:w-[320px] md:w-[350px] bg-white border-[4px] border-black rounded-[28px] p-4 sm:p-6 flex flex-col items-center justify-between text-center select-none ${
                    isCenter
                      ? 'shadow-[0_12px_0_0_#000] cursor-default'
                      : 'shadow-[0_6px_0_0_#000] cursor-pointer hover:brightness-75'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="w-full flex items-center justify-center mb-2">
                    <span className="bg-black text-amber-300 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-black shadow-xs">
                      {tier.badge}
                    </span>
                  </div>

                  {/* Visual Arena Trophy / Icon */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border-[3px] border-black flex items-center justify-center my-2 shadow-[0_4px_0_0_#000]">
                    {renderTierIcon(tier.icon, 'w-9 h-9 sm:w-11 sm:h-11')}
                  </div>

                  {/* Arena Title */}
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black mb-3">
                    {tier.name}
                  </h3>

                  {/* Entry & Prize Pot Simple Grid */}
                  <div className="w-full grid grid-cols-2 gap-2 mb-4">
                    {/* Entry Stake */}
                    <div className="bg-slate-100 border-[2px] border-black rounded-[16px] p-2 sm:p-2.5 flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        {t('wager.entry', 'ENTRY')}
                      </span>
                      <div className="flex items-center gap-1 font-black text-sm sm:text-base text-black mt-0.5">
                        <CoinIcon size={16} />
                        <span>{tier.entryFee}</span>
                      </div>
                    </div>

                    {/* Prize Pot */}
                    <div className="bg-amber-300 border-[2px] border-black rounded-[16px] p-2 sm:p-2.5 flex flex-col items-center shadow-xs">
                      <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider">
                        {t('wager.winPot', 'WIN POT')}
                      </span>
                      <div className="flex items-center gap-1 font-black text-sm sm:text-base text-black mt-0.5">
                        <Trophy className="w-4 h-4 text-black" />
                        <span>{tier.prizePot}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Play Button on Center Card */}
                  {isCenter ? (
                    canAfford ? (
                      <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 2px 0px 0px #000' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTier(tier);
                        }}
                        className="w-full py-3 sm:py-3.5 px-4 rounded-[18px] font-black text-sm sm:text-base uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-center gap-2 outline-none"
                      >
                        <Swords className="w-5 h-5 text-black" />
                        <span>{t('wager.playWithCoins', `PLAY (${tier.entryFee} COINS)`)}</span>
                      </motion.button>
                    ) : (
                      <div className="w-full py-3 sm:py-3.5 px-3 rounded-[18px] font-black text-xs sm:text-sm uppercase tracking-wider bg-rose-100 text-rose-700 border-[2.5px] border-rose-400 flex items-center justify-center gap-1.5">
                        <Lock className="w-4 h-4 text-rose-600" />
                        <span>{t('wager.needMoreCoins', `NEED +${diffCoins} MORE COINS`)}</span>
                      </div>
                    )
                  ) : (
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider py-2">
                      {t('wager.tapToSelect', 'Tap to select')}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom Engaging Info Banner */}
        <div className="flex items-center justify-center z-20 pb-2 px-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/80 backdrop-blur-md border-[2.5px] border-black text-amber-300 px-4 sm:px-6 py-2 rounded-full shadow-[0_4px_0_0_#000] flex items-center gap-2 sm:gap-2.5 text-center text-xs sm:text-sm font-black uppercase tracking-wider"
          >
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 animate-pulse" />
            <span>{t('wager.bottomBanner', 'Swipe or click arrows to explore arenas • High stakes, double coin rewards!')}</span>
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 shrink-0 hidden sm:inline-block animate-bounce" />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
