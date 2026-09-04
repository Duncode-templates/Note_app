import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Users, HelpCircle, Check, Share2, ArrowLeft } from 'lucide-react';
import { KING_WAGER_TIERS } from '../data/kingOfTheHillData';
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
  const playerCount: 4 = 4;
  const [selectedTierId, setSelectedTierId] = useState<'free' | 'rookie' | 'pro' | 'champion'>('free');
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (!isOpen) return null;

  const selectedTier = KING_WAGER_TIERS.find((t) => t.id === selectedTierId) || KING_WAGER_TIERS[0];
  const prizePot = selectedTier.prizePot;
  const canAfford = userCoins >= selectedTier.entryFee;

  const handleStart = () => {
    if (!canAfford) return;
    onStartMatch(4, selectedTierId);
  };

  const handleCopyInvite = async () => {
    try {
      const inviteUrl = await crazyGamesSDK.inviteLink({
        mode: 'king_of_the_hill',
        players: '4',
        tier: selectedTierId,
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
                {t('koth.subtitleClean', 'Parallel Shootout • 4 Contenders')}
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

          {/* Format Badge: 4 Contenders Standard */}
          <div className="mb-4 bg-slate-100 border-2 border-black rounded-[16px] p-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400 border border-black flex items-center justify-center text-black font-black text-xs shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-black text-xs uppercase tracking-wide text-black flex items-center gap-1.5">
                  4 CONTENDERS SHOOTOUT
                </span>
                <span className="text-[10px] font-bold text-slate-600">
                  4 Elimination Rounds • 1 Eliminated Per Round • 1 Champion
                </span>
              </div>
            </div>
            <span className="text-[9px] font-black bg-black text-amber-300 px-2 py-1 rounded uppercase tracking-wider shrink-0">
              4 PLAYERS
            </span>
          </div>

          {/* Stakes / Wager Tiers */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                {t('koth.selectStakes', 'SELECT ARENA STAKES & PRIZE POT')}
              </label>
              <div className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                <CoinIcon className="w-3.5 h-3.5" />
                <span>{userCoins.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {KING_WAGER_TIERS.map((tier) => {
                const isSelected = selectedTierId === tier.id;
                const pot = tier.prizePot;
                const affordable = userCoins >= tier.entryFee;

                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTierId(tier.id)}
                    className={`p-2.5 rounded-[16px] border-2 transition-all cursor-pointer flex flex-col items-center text-center ${
                      isSelected
                        ? 'bg-gradient-to-b from-yellow-300 to-amber-400 border-black shadow-[0_4px_0_0_#000]'
                        : affordable
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-300'
                        : 'bg-slate-100 border-slate-200 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase text-black mb-1">
                      {tier.name}
                    </span>
                    <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                      {tier.entryFee === 0 ? (
                        <span className="text-emerald-700 font-extrabold">FREE</span>
                      ) : (
                        <>
                          <CoinIcon className="w-3 h-3" />
                          {tier.entryFee}
                        </>
                      )}
                    </span>
                    <div className="mt-1.5 pt-1.5 border-t border-black/15 w-full flex flex-col items-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">WIN POT</span>
                      <span className="text-xs font-black text-amber-900 flex items-center gap-0.5">
                        <CoinIcon className="w-3 h-3" />
                        {pot}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Start Knockout Match */}
            <motion.button
              whileHover={{ y: -2, scale: 1.015 }}
              whileTap={{ y: 4, scale: 0.98 }}
              disabled={!canAfford}
              onClick={handleStart}
              className={`flex-1 py-3.5 sm:py-4 px-4 rounded-[18px] font-black text-base uppercase tracking-wider border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-center gap-2 outline-none ${
                canAfford
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-black'
                  : 'bg-slate-300 text-slate-600 cursor-not-allowed'
              }`}
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
