import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Target, Clock, Trophy, Swords, ArrowRight, ShieldCheck, Crosshair } from 'lucide-react';
import { useTranslation } from '../utils/i18n';

interface KingOfTheHillRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export default function KingOfTheHillRulesModal({
  isOpen,
  onClose,
  onContinue,
}: KingOfTheHillRulesModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3.5 sm:p-5 bg-black/60 backdrop-blur-sm select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className="w-full max-w-lg bg-white border-[3.5px] sm:border-[4px] border-black rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-[0_12px_0_0_#000] relative text-black overflow-hidden"
        >
          {/* Subtle Clean Decorative Ambient Accent */}
          <div
            className="absolute -top-16 -right-16 w-44 h-44 bg-amber-200/40 rounded-full blur-2xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-slate-100 shadow-2xs z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>

          {/* Header Banner */}
          <div className="flex items-center gap-3 mb-4 pr-8">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] bg-gradient-to-tr from-amber-400 to-yellow-300 border-[2.5px] border-black flex items-center justify-center text-black shadow-xs shrink-0">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 fill-black text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                  {t('koth.rulesTitle', 'HOW TO PLAY')}
                </h2>
                <span className="bg-amber-400 text-black font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border border-black uppercase tracking-wider">
                  RULES
                </span>
              </div>
              <p className="text-amber-700 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                {t('koth.rulesSubtitle', 'KING OF THE HILL TOURNAMENT')}
              </p>
            </div>
          </div>

          {/* Rules Cards List - Simple & Concise */}
          <div className="flex flex-col gap-2.5 mb-5">
            {/* 1. Free Kick Shootout */}
            <div className="bg-slate-50 border-[2px] border-black rounded-[16px] p-3 flex items-center gap-3 shadow-[0_3px_0_0_#000]">
              <div className="w-9 h-9 rounded-[12px] bg-amber-400 border border-black flex items-center justify-center text-black shrink-0 shadow-2xs">
                <Target className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-black">
                  5 Free Kicks Per Round
                </span>
                <p className="text-[11px] sm:text-xs font-bold text-slate-600 leading-tight mt-0.5">
                  Aim and power 5 shots from designated pitch spots with a 10-second timer.
                </p>
              </div>
            </div>

            {/* 2. Precision Scoring */}
            <div className="bg-slate-50 border-[2px] border-black rounded-[16px] p-3 flex items-center gap-3 shadow-[0_3px_0_0_#000]">
              <div className="w-9 h-9 rounded-[12px] bg-emerald-400 border border-black flex items-center justify-center text-black shrink-0 shadow-2xs">
                <Trophy className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-black">
                  Score to Climb
                </span>
                <p className="text-[11px] sm:text-xs font-bold text-slate-600 leading-tight mt-0.5">
                  Goals count first. Top corners and clean strikes award bonus precision points.
                </p>
              </div>
            </div>

            {/* 3. 3-Round Knockout Elimination */}
            <div className="bg-slate-50 border-[2px] border-black rounded-[16px] p-3 flex items-center gap-3 shadow-[0_3px_0_0_#000]">
              <div className="w-9 h-9 rounded-[12px] bg-purple-400 border border-black flex items-center justify-center text-black shrink-0 shadow-2xs">
                <Swords className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-black">
                  3-Round Knockout
                </span>
                <p className="text-[11px] sm:text-xs font-bold text-slate-600 leading-tight mt-0.5">
                  Round 1 (4 players), Round 2 (3 players), and Round 3 (1v1 Final). Lowest scorer is eliminated after each round!
                </p>
              </div>
            </div>

            {/* 4. Champion Reward */}
            <div className="bg-amber-50/80 border-[2px] border-amber-400 rounded-[16px] p-3 flex items-center gap-3 shadow-[0_3px_0_0_#000]">
              <div className="w-9 h-9 rounded-[12px] bg-amber-400 border border-black flex items-center justify-center text-black shrink-0 shadow-2xs">
                <Crown className="w-5 h-5 fill-black text-black" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-amber-950">
                  Free Entry • 30 Coins Champion Reward
                </span>
                <p className="text-[11px] sm:text-xs font-bold text-amber-800 leading-tight mt-0.5">
                  No entry fee or staking. The champion who conquers the 3rd round wins the tournament crown and 30 coins!
                </p>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <motion.button
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ y: 2, scale: 0.985 }}
            onClick={onContinue}
            className="w-full py-3.5 sm:py-4 px-5 rounded-[18px] sm:rounded-[20px] font-black text-xs sm:text-sm uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer outline-none transition-all"
          >
            <span>{t('common.continue', 'CONTINUE')}</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
