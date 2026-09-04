import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Check, Sparkles, Clock, Flame, Calendar, Zap } from 'lucide-react';
import CoinIcon from './CoinIcon';
import { useTranslation } from '../utils/i18n';
import { dailyRewardManager, DailyRewardStatus, DAILY_REWARD_COINS } from '../utils/dailyRewardManager';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: (coins: number) => void;
}

export default function DailyRewardModal({ isOpen, onClose, onClaim }: DailyRewardModalProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<DailyRewardStatus>(() => dailyRewardManager.getStatus());
  const [isClaiming, setIsClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [countdown, setCountdown] = useState(status.timeUntilReset.formatted);

  useEffect(() => {
    const unsub = dailyRewardManager.subscribe((newStatus) => {
      setStatus(newStatus);
      setCountdown(newStatus.timeUntilReset.formatted);
    });
    return unsub;
  }, []);

  // Update countdown clock every second when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const current = dailyRewardManager.getStatus();
      setStatus(current);
      setCountdown(current.timeUntilReset.formatted);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleClaim = () => {
    if (!status.isAvailable || isClaiming) return;
    setIsClaiming(true);

    const result = dailyRewardManager.claimReward();
    if (result && result.success) {
      setJustClaimed(true);
      onClaim(result.coinsEarned);

      setTimeout(() => {
        setIsClaiming(false);
      }, 600);
    } else {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  // Compute active target day index in 7-day cycle (1 to 7)
  const currentStreakDay = status.isAvailable
    ? (status.streak % 7) + 1
    : status.streak === 0 ? 1 : ((status.streak - 1) % 7) + 1;

  const daysList = [1, 2, 3, 4, 5, 6, 7];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 25 }}
          transition={{ type: 'spring', stiffness: 450, damping: 26 }}
          className="relative w-full max-w-xl bg-white border-[4px] sm:border-[4.5px] border-black rounded-[28px] sm:rounded-[32px] p-4 sm:p-6 md:p-7 shadow-[0_14px_0_0_#000] text-black z-10 flex flex-col items-center overflow-hidden"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-500 hover:text-white border-[2.5px] border-black flex items-center justify-center transition-colors cursor-pointer z-20"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Top Header Badge & Gift Visual */}
          <div className="flex flex-col items-center text-center mt-1 mb-3">
            <div className="relative mb-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-[3.5px] border-black flex items-center justify-center shadow-[0_5px_0_0_#000] rotate-[-2deg]">
                <Gift className="w-9 h-9 sm:w-11 sm:h-11 text-black stroke-[2.5]" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full border-[1.5px] border-black shadow-xs uppercase tracking-wider">
                +10 {t('common.coins', 'COINS')}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black">
              {t('daily.title', 'DAILY LOGIN REWARD')}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider mt-0.5 max-w-md">
              {t('daily.subtitle', 'Log in every day to claim your free 10 coins reward!')}
            </p>
          </div>

          {/* Streak Status Pill */}
          <div className="flex items-center gap-2 bg-slate-100 border-[2px] border-black rounded-full px-3.5 py-1 mb-4 shadow-xs">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {t('daily.streak', 'Current Streak')}: <strong className="text-amber-600">{status.streak} {status.streak === 1 ? t('daily.day', 'Day') : t('daily.days', 'Days')}</strong>
            </span>
          </div>

          {/* 7-Day Cycle Cards Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-2.5 w-full mb-5">
            {daysList.map((dayNum) => {
              const isPastClaimed = !status.isAvailable
                ? dayNum <= currentStreakDay
                : dayNum < currentStreakDay;
              
              const isTodayTarget = status.isAvailable && dayNum === currentStreakDay;
              const isFuture = dayNum > currentStreakDay;

              return (
                <div
                  key={dayNum}
                  className={`relative flex flex-col items-center justify-between p-2 rounded-[16px] border-[2.5px] border-black transition-all ${
                    isTodayTarget
                      ? 'bg-gradient-to-b from-amber-300 via-yellow-200 to-amber-400 shadow-[0_4px_0_0_#000] ring-2 ring-amber-400 scale-105 z-10'
                      : isPastClaimed
                      ? 'bg-emerald-50 border-emerald-800 shadow-xs'
                      : 'bg-slate-100 opacity-80'
                  }`}
                >
                  {/* Day Label */}
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    isTodayTarget ? 'text-black' : isPastClaimed ? 'text-emerald-800' : 'text-slate-500'
                  }`}>
                    {t('daily.dayShort', 'DAY')} {dayNum}
                  </span>

                  {/* Coin Icon / Graphic */}
                  <div className="my-1 sm:my-1.5 flex items-center justify-center">
                    {isPastClaimed ? (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border border-black shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <CoinIcon className={`w-6 h-6 sm:w-7 sm:h-7 ${isTodayTarget ? 'animate-bounce' : ''}`} />
                    )}
                  </div>

                  {/* Reward Amount / Status */}
                  <span className={`text-[10px] font-black uppercase tracking-tight ${
                    isTodayTarget ? 'text-black' : isPastClaimed ? 'text-emerald-700' : 'text-slate-600'
                  }`}>
                    {isPastClaimed ? t('daily.claimed', 'DONE') : `+${DAILY_REWARD_COINS}`}
                  </span>

                  {/* Highlight indicator for today */}
                  {isTodayTarget && (
                    <span className="absolute -bottom-2 bg-black text-amber-300 font-black text-[8px] px-1.5 py-0.2 rounded-full uppercase tracking-widest border border-black shadow-2xs">
                      {t('common.today', 'TODAY')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Claim or Countdown Area */}
          <div className="w-full flex flex-col items-center gap-2.5">
            {status.isAvailable ? (
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97, y: 2 }}
                onClick={handleClaim}
                disabled={isClaiming}
                className="w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 text-black border-[3.5px] border-black shadow-[0_6px_0_0_#000] py-3.5 sm:py-4 px-6 rounded-[22px] font-black text-base sm:text-lg uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 outline-none transition-all"
              >
                <Sparkles className="w-5 h-5 text-black" />
                <span>{t('daily.claimButton', 'CLAIM +10 COINS')}</span>
              </motion.button>
            ) : (
              <div className="w-full bg-slate-100 border-[3px] border-black rounded-[20px] p-3.5 sm:p-4 text-center flex flex-col items-center justify-center shadow-inner">
                <div className="flex items-center gap-2 text-emerald-700 font-black text-sm uppercase tracking-wider mb-1">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{t('daily.alreadyClaimedToday', "TODAY'S REWARD CLAIMED!")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('daily.nextRewardIn', 'Next daily reward in')}: <strong className="text-black font-mono font-black">{countdown}</strong></span>
                </div>
              </div>
            )}

            {/* Claimed Toast Confirmation */}
            {justClaimed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-xs font-black text-emerald-700 uppercase tracking-wider"
              >
                <Zap className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                <span>+10 {t('common.coinsAdded', 'COINS ADDED TO YOUR BALANCE!')}</span>
              </motion.div>
            )}
          </div>

          {/* Footer Helper Note */}
          <div className="mt-3.5 text-center text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {t('daily.resetNote', 'Resets every 24 hours at 00:00 midnight local time.')}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
