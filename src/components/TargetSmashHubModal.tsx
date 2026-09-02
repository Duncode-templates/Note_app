import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Trophy, Star, Shield, ArrowRight, Play, Flame } from 'lucide-react';
import { TARGET_SMASH_STAGES } from '../data/targetSmashData';
import { TargetSmashStage } from '../types';
import { useTranslation } from '../utils/i18n';
import CoinIcon from './CoinIcon';

interface TargetSmashHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStage: (stage: TargetSmashStage) => void;
  unlockedStageNumber: number;
  stageHighScores: Record<number, number>;
  stageStars: Record<number, number>;
}

export default function TargetSmashHubModal({
  isOpen,
  onClose,
  onSelectStage,
  unlockedStageNumber,
  stageHighScores,
  stageStars,
}: TargetSmashHubModalProps) {
  const { t } = useTranslation();
  const [selectedStageNumber, setSelectedStageNumber] = useState<number>(() => Math.min(unlockedStageNumber, TARGET_SMASH_STAGES.length));

  if (!isOpen) return null;

  const currentStage = TARGET_SMASH_STAGES.find((s) => s.stageNumber === selectedStageNumber) || TARGET_SMASH_STAGES[0];
  const isCurrentUnlocked = currentStage.stageNumber <= unlockedStageNumber;
  const currentBest = stageHighScores[currentStage.stageNumber] || 0;
  const currentStars = stageStars[currentStage.stageNumber] || 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 25 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-[3.5px] sm:border-[4.5px] border-black rounded-[28px] p-4 sm:p-7 shadow-[0_12px_0_0_#000] relative text-white max-h-[92vh] flex flex-col justify-between"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-white shadow-xs z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Banner */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-gradient-to-tr from-amber-400 to-yellow-300 border-[3px] border-black shadow-[0_3px_0_0_#000] flex items-center justify-center text-black shrink-0">
              <Target className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-full border border-black">
                  {t('targetSmash.arcadeBadge', 'NEW ARCADE MODE')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider">
                  {t('targetSmash.trickshotSubtitle', 'Trickshot & Targets')}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-white">
                {t('targetSmash.title', 'TARGET SMASH')}
              </h2>
            </div>
          </div>

          {/* Stage Selector Grid */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                {t('targetSmash.selectStage', 'Select Stage (1 - 10)')}
              </span>
              <span className="text-xs font-black text-amber-400">
                {t('targetSmash.unlocked', 'Unlocked')}: {unlockedStageNumber} / 10
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
              {TARGET_SMASH_STAGES.map((stg) => {
                const isUnlocked = stg.stageNumber <= unlockedStageNumber;
                const isSelected = stg.stageNumber === selectedStageNumber;
                const stars = stageStars[stg.stageNumber] || 0;

                return (
                  <button
                    key={stg.stageNumber}
                    onClick={() => setSelectedStageNumber(stg.stageNumber)}
                    className={`relative p-2 sm:p-2.5 rounded-[16px] border-[2.5px] sm:border-[3px] transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-amber-400 text-black border-white shadow-[0_4px_0_0_#fff] scale-105 z-10'
                        : isUnlocked
                        ? 'bg-slate-800/90 text-white border-black hover:bg-slate-700 shadow-[0_3px_0_0_#000]'
                        : 'bg-slate-900/60 text-slate-500 border-slate-800 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-black">
                      #{stg.stageNumber}
                    </span>

                    {/* Star Icons */}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                            s <= stars
                              ? isSelected
                                ? 'fill-black text-black'
                                : 'fill-amber-400 text-amber-400'
                              : isSelected
                              ? 'text-black/30'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>

                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[14px]">
                        <span className="text-xs">🔒</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Stage Card Details */}
          <div className="bg-slate-800/90 border-[3px] border-black rounded-[22px] p-3.5 sm:p-5 mb-5 shadow-inner">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                  {t('targetSmash.stage', 'Stage')} {currentStage.stageNumber} • {t('targetSmash.objective', 'Objective')}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                  {currentStage.name}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('targetSmash.highScore', 'High Score')}</span>
                <span className="text-sm sm:text-base font-black text-emerald-400">
                  {currentBest.toLocaleString()} {t('targetSmash.pts', 'PTS')}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mb-3">
              {currentStage.description}
            </p>

            {/* Stage Specs Badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-black">
              <div className="bg-white/95 rounded-[12px] p-1.5 sm:p-2 border-2 border-black">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase block">{t('targetSmash.distance', 'Distance')}</span>
                <span className="text-xs sm:text-sm font-black uppercase text-black">{currentStage.distance}m</span>
              </div>
              <div className="bg-white/95 rounded-[12px] p-1.5 sm:p-2 border-2 border-black">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase block">{t('targetSmash.defendersWall', 'Defenders Wall')}</span>
                <span className="text-xs sm:text-sm font-black uppercase text-black">{currentStage.wallSize} {t('targetSmash.players', 'Players')}</span>
              </div>
              <div className="bg-white/95 rounded-[12px] p-1.5 sm:p-2 border-2 border-black">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase block">{t('targetSmash.targetScore', 'Target Score')}</span>
                <span className="text-xs sm:text-sm font-black uppercase text-amber-600">{currentStage.targetScore} {t('targetSmash.pts', 'PTS')}</span>
              </div>
            </div>
          </div>

          {/* Action Launch Button */}
          <motion.button
            whileHover={{ scale: isCurrentUnlocked ? 1.02 : 1, y: isCurrentUnlocked ? -2 : 0 }}
            whileTap={{ scale: isCurrentUnlocked ? 0.98 : 1, y: isCurrentUnlocked ? 2 : 0 }}
            onClick={() => {
              if (isCurrentUnlocked) {
                onSelectStage(currentStage);
              }
            }}
            disabled={!isCurrentUnlocked}
            className={`w-full py-3.5 sm:py-4 px-6 rounded-[20px] font-black text-base sm:text-lg uppercase tracking-wider border-[3.5px] border-black shadow-[0_6px_0_0_#000] flex items-center justify-center gap-3 cursor-pointer ${
              isCurrentUnlocked
                ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-black hover:from-amber-300 hover:to-yellow-200'
                : 'bg-slate-700 text-slate-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-black text-black" />
            <span>{isCurrentUnlocked ? `${t('targetSmash.playStage', 'PLAY STAGE')} #${currentStage.stageNumber}` : t('targetSmash.stageLocked', 'STAGE LOCKED')}</span>
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
