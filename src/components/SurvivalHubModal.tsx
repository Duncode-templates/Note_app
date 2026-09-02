import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Heart, Trophy, ArrowRight, Globe, HelpCircle, ArrowLeft, Shield } from 'lucide-react';
import { crazyGamesSDK } from '../utils/crazyGamesSDK';
import { useTranslation } from '../utils/i18n';

interface SurvivalHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'Offline' | 'Online') => void;
  onStartSurvival?: () => void;
  bestStreak: number;
}

export default function SurvivalHubModal({
  isOpen,
  onClose,
  onSelectMode,
  onStartSurvival,
  bestStreak,
}: SurvivalHubModalProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<'rules' | 'mode_selection'>(() => {
    try {
      const seen = crazyGamesSDK.getItemSync('fkl_survival_guide_seen_v1');
      return seen === 'true' ? 'mode_selection' : 'rules';
    } catch {
      return 'rules';
    }
  });

  // When modal opens, only show rules if not previously seen (otherwise go straight to mode selection)
  useEffect(() => {
    if (isOpen) {
      try {
        const seen = crazyGamesSDK.getItemSync('fkl_survival_guide_seen_v1');
        if (seen === 'true') {
          setView('mode_selection');
        } else {
          setView('rules');
        }
      } catch {
        setView('rules');
      }
    }
  }, [isOpen]);

  const handleContinueFromRules = () => {
    try {
      crazyGamesSDK.setItem('fkl_survival_guide_seen_v1', 'true');
    } catch {}
    setView('mode_selection');
  };

  if (!isOpen) return null;

  const handleChoose = (mode: 'Offline' | 'Online') => {
    if (onSelectMode) {
      onSelectMode(mode);
    } else if (onStartSurvival) {
      onStartSurvival();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/75 backdrop-blur-sm select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', stiffness: 450, damping: 26 }}
          className="w-full max-w-lg bg-white border-[3.5px] sm:border-[4px] border-black rounded-[26px] p-5 sm:p-6 shadow-[0_12px_0_0_#000] relative text-black"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-slate-100 shadow-2xs z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* ========================================================================= */}
          {/* STEP 1: STEP-BY-STEP RULES & GUIDE (Normal, clean, non-flashy appearance) */}
          {/* ========================================================================= */}
          {view === 'rules' && (
            <div>
              {/* Header */}
              <div className="mb-4 pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-amber-300 text-black px-2 py-0.5 rounded-md border border-black">
                    {t('survival.guideBadge', 'SURVIVAL GUIDE')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t('survival.howItWorks', 'How it works')}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black">
                  {t('survival.rulesTitle', 'SURVIVAL MODE RULES')}
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm font-medium mt-0.5">
                  {t('survival.rulesSubtitle', 'Follow these 2 core mechanics to maximize your goal streak:')}
                </p>
              </div>

              {/* Step-by-Step Rules List */}
              <div className="flex flex-col gap-2.5 mb-6">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 rounded-[16px] bg-slate-50 border-2 border-slate-300">
                  <div className="w-7 h-7 rounded-full bg-rose-500 text-white font-black text-xs flex items-center justify-center shrink-0 border border-black shadow-xs mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-black uppercase tracking-wide">{t('survival.rule1Title', '3 Lives System')}</span>
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    </div>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                      {t('survival.rule1Desc', 'Both you and your opponent start with 3 hearts. A missed shot or goalkeeper save deducts 1 life. First player to lose all 3 lives loses the match!')}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 rounded-[16px] bg-slate-50 border-2 border-slate-300">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-black font-black text-xs flex items-center justify-center shrink-0 border border-black shadow-xs mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-black uppercase tracking-wide">{t('survival.rule2Title', 'Turn-Based Duel & 100s Timer')}</span>
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    </div>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                      {t('survival.rule2Desc', 'Alternate free kicks under a 100-second countdown timer. Score goals to extend your streak, outlast your rival, and claim victory!')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <motion.button
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ y: 3, scale: 0.98 }}
                onClick={handleContinueFromRules}
                className="w-full py-3.5 px-5 rounded-[18px] font-black text-sm sm:text-base uppercase tracking-wider bg-black hover:bg-slate-800 text-white border-[2.5px] border-black shadow-[0_4px_0_0_#475569] flex items-center justify-center gap-2 cursor-pointer outline-none"
              >
                <span>{t('common.continue', 'CONTINUE')}</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </motion.button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: MODE SELECTION MODAL (Online vs Offline with Rules Trigger Button) */}
          {/* ========================================================================= */}
          {view === 'mode_selection' && (
            <div>
              {/* Header with trigger button for rules */}
              <div className="flex items-start justify-between gap-2 mb-4 pr-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black">
                    {t('survival.arenaTitle', 'SURVIVAL ARENA')}
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm font-bold uppercase tracking-wider mt-0.5">
                    {t('survival.selectGameMode', 'Select your game mode:')}
                  </p>
                </div>

                {/* Little Button triggering the first modal explaining the rules */}
                <button
                  onClick={() => setView('rules')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border-2 border-black text-[11px] font-black text-black cursor-pointer shadow-2xs transition-colors shrink-0"
                  title="View step-by-step rules"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-700" />
                  <span>{t('survival.rulesBtn', 'Rules')}</span>
                </button>
              </div>

              {/* Personal Best Record */}
              <div className="bg-slate-100 border-[2.5px] border-black rounded-[18px] p-3 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 border border-black flex items-center justify-center shadow-xs">
                    <Trophy className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase block">{t('survival.personalRecord', 'Personal Record')}</span>
                    <span className="text-base font-black text-black uppercase">
                      {bestStreak} {bestStreak === 1 ? t('survival.goalStreak', 'GOAL STREAK') : t('survival.goalsStreak', 'GOALS STREAK')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                </div>
              </div>

              {/* Mode Selection Buttons */}
              <div className="flex flex-col gap-3">
                {/* 1. Online 1v1 Survival */}
                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 3, scale: 0.98 }}
                  onClick={() => handleChoose('Online')}
                  className="w-full py-4 px-4 sm:px-5 rounded-[20px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-300 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] flex items-center justify-between cursor-pointer group outline-none text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center border border-black/20 shrink-0">
                      <Globe className="w-5 h-5 text-black stroke-[2.5]" />
                    </div>
                    <span className="text-base sm:text-lg font-black text-black">{t('survival.onlineDuelBtn', 'ONLINE 1V1 SURVIVAL')}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-black stroke-[3] group-hover:translate-x-1 transition-transform shrink-0" />
                </motion.button>

                {/* 2. Offline Survival */}
                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 3, scale: 0.98 }}
                  onClick={() => handleChoose('Offline')}
                  className="w-full py-4 px-4 sm:px-5 rounded-[20px] font-black uppercase tracking-wider bg-gradient-to-r from-rose-500 to-pink-500 text-white border-[3px] border-black shadow-[0_5px_0_0_#000] flex items-center justify-between cursor-pointer group outline-none text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center border border-black/30 shrink-0">
                      <Flame className="w-5 h-5 fill-white text-white stroke-[2.5]" />
                    </div>
                    <span className="text-base sm:text-lg font-black text-white">{t('survival.offlineSurvivalBtn', 'OFFLINE SURVIVAL')}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white stroke-[3] group-hover:translate-x-1 transition-transform shrink-0" />
                </motion.button>
              </div>

              {/* Back to Rules Link at the bottom */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-center">
                <button
                  onClick={() => setView('rules')}
                  className="text-xs font-bold text-slate-600 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('survival.backToRules', 'Back to Rules & Guide')}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
