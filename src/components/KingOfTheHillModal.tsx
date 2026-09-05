import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Users, HelpCircle, Check, Share2, ArrowLeft, Target, Trophy, Swords } from 'lucide-react';
import { crazyGamesSDK } from '../utils/crazyGamesSDK';
import { useTranslation } from '../utils/i18n';
import CoinIcon from './CoinIcon';

interface KingOfTheHillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  userCoins: number;
  onStartMatch: (playerCount: 4, tierId: 'free' | 'rookie' | 'pro' | 'champion') => void;
  onOpenRules?: () => void;
}

export default function KingOfTheHillModal({
  isOpen,
  onClose,
  onBack,
  userCoins,
  onStartMatch,
  onOpenRules,
}: KingOfTheHillModalProps) {
  const { t } = useTranslation();
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (!isOpen) return null;

  const handleStart = () => {
    onStartMatch(4, 'free');
  };

  const handleCopyInvite = async () => {
    try {
      const inviteUrl = await crazyGamesSDK.inviteLink({
        mode: 'king_of_the_hill',
        players: '4',
        tier: 'free',
      });
      if (inviteUrl) {
        await navigator.clipboard.writeText(inviteUrl);
      }
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    } catch {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', stiffness: 450, damping: 26 }}
          className="w-full max-w-lg bg-white border-[3.5px] sm:border-[4px] border-black rounded-[26px] p-5 sm:p-6 shadow-[0_14px_0_0_#000] relative text-black"
        >
          {/* Back Button (if opened from mode selection) */}
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-4 left-4 text-black hover:bg-slate-200 font-black text-xl w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-slate-100 shadow-2xs z-10"
              aria-label="Back to mode selection"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-slate-100 shadow-2xs z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Header Banner */}
          <div className={`flex items-center gap-2.5 mb-4 ${onBack ? 'pl-10 pr-8' : 'pr-8'}`}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 border-2 border-black flex items-center justify-center text-white shadow-xs shrink-0">
              <Crown className="w-6 h-6 text-yellow-200 fill-yellow-200" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                {t('koth.title', 'KING OF THE HILL')}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-bold uppercase tracking-wider">
                3-Round Knockout • 4 Contenders
              </p>
            </div>
          </div>

          {/* Rules & How to Play Button */}
          {onOpenRules && (
            <button
              type="button"
              onClick={onOpenRules}
              className="w-full mb-3.5 py-2.5 px-3.5 rounded-[16px] bg-amber-50 hover:bg-amber-100 border-2 border-black text-black font-black text-xs uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
            >
              <span className="flex items-center gap-2 text-amber-950 font-black">
                <HelpCircle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                <span>{t('koth.viewRules', 'VIEW RULES & HOW TO PLAY')}</span>
              </span>
              <span className="text-[10px] font-black bg-black text-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                INFO
              </span>
            </button>
          )}

          {/* Format Badge: 4 Contenders & 3 Rounds */}
          <div className="mb-3 bg-slate-100 border-2 border-black rounded-[16px] p-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400 border border-black flex items-center justify-center text-black font-black text-xs shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-black text-xs uppercase tracking-wide text-black">
                  4 CONTENDERS • 3 ROUNDS
                </span>
                <span className="text-[10px] font-bold text-slate-600">
                  Round 1 (4P) ➔ Round 2 (3P) ➔ Round 3 (1v1 Final)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-amber-400 text-black px-2.5 py-1 rounded-full border border-black text-xs font-black">
              <CoinIcon className="w-3.5 h-3.5" />
              <span>30 REWARD</span>
            </div>
          </div>

          {/* 3-Round Tournament Progression Breakdown */}
          <div className="space-y-2 mb-4">
            <div className="bg-slate-50 border border-black/30 rounded-[14px] p-2.5 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-black text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-black">Round 1: 4 Contenders</span>
                  <span className="text-[10px] font-bold text-rose-600">1 ELIMINATED</span>
                </div>
                <span className="text-[11px] text-slate-600 font-medium">
                  5 free kicks per player. Lowest score gets eliminated.
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-black/30 rounded-[14px] p-2.5 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-black text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-black">Round 2: Semifinal (3 Players)</span>
                  <span className="text-[10px] font-bold text-rose-600">1 ELIMINATED</span>
                </div>
                <span className="text-[11px] text-slate-600 font-medium">
                  5 new pitch positions. Top 2 advance to the final.
                </span>
              </div>
            </div>

            <div className="bg-amber-50/70 border-2 border-amber-400 rounded-[14px] p-2.5 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-amber-400 text-black font-black text-xs flex items-center justify-center shrink-0 border border-black">
                3
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-950">Round 3: Grand Final (1v1)</span>
                  <span className="text-[10px] font-black text-amber-700">CHAMPION DECREED</span>
                </div>
                <span className="text-[11px] text-amber-900 font-medium">
                  Direct head-to-head. Winner claims the King Crown + 30 Coins!
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Start Knockout Match */}
            <motion.button
              whileHover={{ y: -2, scale: 1.015 }}
              whileTap={{ y: 4, scale: 0.98 }}
              onClick={handleStart}
              className="flex-1 py-3.5 sm:py-4 px-4 rounded-[18px] font-black text-base uppercase tracking-wider border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-center gap-2 outline-none bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-black"
            >
              <Crown className="w-5 h-5 fill-black text-black" />
              <span>{t('koth.playNow', 'START SHOOTOUT')}</span>
            </motion.button>

            {/* Invite Friends Button */}
            <motion.button
              whileHover={{ y: -2, scale: 1.015 }}
              whileTap={{ y: 4, scale: 0.98 }}
              onClick={handleCopyInvite}
              className="py-3.5 px-4 rounded-[18px] font-black text-sm uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-black border-[2.5px] border-black shadow-[0_4px_0_0_#000] cursor-pointer flex items-center justify-center gap-1.5 outline-none shrink-0"
              title="Invite friends with a direct multiplayer link"
            >
              {copiedInvite ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">LINK COPIED!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-black" />
                  <span>INVITE</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
