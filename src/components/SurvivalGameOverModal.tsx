import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Trophy, RotateCcw, X, Heart, Sparkles, Film } from 'lucide-react';
import { crazyGamesSDK } from '../utils/crazyGamesSDK';
import { useTranslation } from '../utils/i18n';

interface SurvivalGameOverModalProps {
  isOpen: boolean;
  streak: number;
  score: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onReviveWithAd: () => void;
  onExit: () => void;
  canRevive: boolean;
}

export default function SurvivalGameOverModal({
  isOpen,
  streak,
  score,
  isNewBest,
  onPlayAgain,
  onReviveWithAd,
  onExit,
  canRevive,
}: SurvivalGameOverModalProps) {
  const { t } = useTranslation();
  const [isAdLoading, setIsAdLoading] = useState(false);
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      mountTimeRef.current = Date.now();
    }
  }, [isOpen]);

  const handleSafeAction = (action: () => void) => {
    if (Date.now() - mountTimeRef.current < 450) return;
    action();
  };

  if (!isOpen) return null;

  const handleWatchAdToRevive = () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    crazyGamesSDK.requestRewardedAd(
      () => {
        setIsAdLoading(false);
        onReviveWithAd();
      },
      () => {
        setIsAdLoading(false);
      }
    );
  };

  return (
    <AnimatePresence>
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 25 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-gradient-to-b from-rose-950 via-slate-900 to-black border-[3.5px] sm:border-[4.5px] border-black rounded-[28px] p-5 sm:p-7 shadow-[0_14px_0_0_#000] relative text-white text-center"
        >
          {/* Close Button */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleSafeAction(onExit);
            }}
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-white shadow-xs z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Flame Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-rose-500/40 rounded-full blur-xl animate-pulse" />
            <div className="w-full h-full rounded-[22px] bg-gradient-to-tr from-rose-600 to-amber-500 border-[3px] border-black shadow-[0_4px_0_0_#000] flex items-center justify-center text-white relative z-10">
              <Flame className="w-9 h-9 sm:w-11 sm:h-11 fill-white" />
            </div>
          </div>

          {/* Headline */}
          {isNewBest && (
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400 text-black border border-black font-black text-[10px] uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('result.newRecord', 'NEW PERSONAL RECORD!')}</span>
            </div>
          )}

          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white mb-0.5">
            {t('survival.runEnded', 'RUN ENDED!')}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-bold uppercase tracking-wider mb-4">
            {t('survival.challengeComplete', 'Survival Challenge Complete')}
          </p>

          {/* Big Streak Card */}
          <div className="bg-black/60 border-[2.5px] border-black rounded-[22px] p-4 mb-4 flex flex-col items-center justify-center shadow-inner">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">
              {t('survival.finalGoalsStreak', 'Final Goals Streak')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-white">
                {streak}
              </span>
              <span className="text-base sm:text-lg font-black text-slate-300 uppercase">
                {t('common.goals', 'GOALS')}
              </span>
            </div>
          </div>

          {/* Stats Breakdown */}
          <div className="bg-slate-800/80 border-[2px] border-black rounded-[18px] p-3 mb-5 flex items-center justify-around text-xs">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{t('result.totalScore', 'Total Score')}</span>
              <span className="font-black text-amber-400 text-sm">{score.toLocaleString()} {t('common.pts', 'PTS')}</span>
            </div>
            <div className="w-[1px] h-8 bg-slate-700" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{t('survival.challengeMode', 'Challenge Mode')}</span>
              <span className="font-black text-rose-400 text-sm">{t('survival.streak', 'SURVIVAL')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            {canRevive && (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98, y: 2 }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSafeAction(handleWatchAdToRevive);
                }}
                disabled={isAdLoading}
                className="w-full py-3.5 px-5 rounded-[18px] font-black text-sm sm:text-base uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-300 hover:to-green-300 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Film className="w-5 h-5" />
                <span>{isAdLoading ? t('ads.loading', 'LOADING AD...') : t('survival.reviveExtraLife', 'REVIVE (+1 EXTRA LIFE)')}</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 2 }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleSafeAction(onPlayAgain);
              }}
              className="w-full py-3 px-5 rounded-[18px] font-black text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black border-[2.5px] border-black shadow-[0_4px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('hud.rematch', 'PLAY AGAIN')}</span>
            </motion.button>

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleSafeAction(onExit);
              }}
              className="w-full py-2 text-xs font-black text-slate-400 hover:text-white uppercase tracking-wider cursor-pointer"
            >
              {t('btn.returnMenu', 'EXIT TO MAIN MENU')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
