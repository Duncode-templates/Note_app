import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, RotateCcw, ArrowRight, X, Check } from 'lucide-react';
import { TargetSmashStage } from '../types';
import CoinIcon from './CoinIcon';

interface TargetSmashResultsModalProps {
  isOpen: boolean;
  stage: TargetSmashStage;
  score: number;
  stars: number;
  isPassed: boolean;
  coinsEarned: number;
  onNextStage: () => void;
  onRetry: () => void;
  onClose: () => void;
  hasNextStage: boolean;
}

export default function TargetSmashResultsModal({
  isOpen,
  stage,
  score,
  stars,
  isPassed,
  coinsEarned,
  onNextStage,
  onRetry,
  onClose,
  hasNextStage,
}: TargetSmashResultsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 25 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          className="w-full max-w-md bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-[3.5px] sm:border-[4.5px] border-black rounded-[28px] p-5 sm:p-7 shadow-[0_14px_0_0_#000] relative text-white text-center"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-white shadow-xs z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Result Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 flex items-center justify-center relative">
            <div className={`absolute inset-0 rounded-full blur-xl animate-pulse ${isPassed ? 'bg-amber-400/40' : 'bg-rose-500/30'}`} />
            <div className={`w-full h-full rounded-[22px] border-[3px] border-black shadow-[0_4px_0_0_#000] flex items-center justify-center relative z-10 ${
              isPassed ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-black' : 'bg-rose-500 text-white'
            }`}>
              {isPassed ? <Trophy className="w-9 h-9 sm:w-11 sm:h-11 fill-current" /> : <RotateCcw className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.5]" />}
            </div>
          </div>

          {/* Status Headline */}
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white mb-0.5">
            {isPassed ? 'STAGE CLEARED!' : 'STAGE FAILED'}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-bold uppercase tracking-wider mb-4">
            Stage {stage.stageNumber}: {stage.name}
          </p>

          {/* Stars Rating */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-8 h-8 sm:w-10 sm:h-10 transition-all ${
                  s <= stars
                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)] scale-110'
                    : 'text-slate-700 fill-slate-800'
                }`}
              />
            ))}
          </div>

          {/* Score breakdown card */}
          <div className="bg-slate-800/90 border-[2.5px] border-black rounded-[20px] p-3.5 sm:p-4 mb-5 flex flex-col gap-2 shadow-inner text-left">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-slate-300 uppercase">Final Score:</span>
              <span className="font-black text-amber-400 text-base sm:text-lg">{score.toLocaleString()} PTS</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm border-t border-slate-700/80 pt-2">
              <span className="font-bold text-slate-300 uppercase">Target Required:</span>
              <span className="font-black text-slate-200">{stage.targetScore.toLocaleString()} PTS</span>
            </div>
            {coinsEarned > 0 && (
              <div className="flex items-center justify-between text-xs sm:text-sm border-t border-slate-700/80 pt-2 text-emerald-400">
                <span className="font-bold uppercase">Coins Reward:</span>
                <div className="flex items-center gap-1.5 font-black text-sm sm:text-base">
                  <CoinIcon className="w-5 h-5" />
                  <span>+{coinsEarned}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            {isPassed && hasNextStage && (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98, y: 2 }}
                onClick={onNextStage}
                className="w-full py-3.5 px-5 rounded-[18px] font-black text-sm sm:text-base uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>NEXT STAGE</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 2 }}
              onClick={onRetry}
              className={`w-full py-3 px-5 rounded-[18px] font-black text-xs sm:text-sm uppercase tracking-wider border-[2.5px] border-black shadow-[0_4px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer ${
                isPassed ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-amber-400 hover:bg-amber-300 text-black'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>RETRY STAGE</span>
            </motion.button>

            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-black text-slate-400 hover:text-white uppercase tracking-wider cursor-pointer"
            >
              EXIT TO STAGE SELECT
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
