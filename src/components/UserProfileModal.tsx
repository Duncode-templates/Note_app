import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Trash2, Bookmark, Flame, User, Check, Video, AlertCircle } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol } from '@fortawesome/free-solid-svg-icons';
import { SavedReplay } from '../types';
import { savedReplayManager } from '../utils/savedReplayManager';
import { getFlagUrl } from '../data/countries';
import { useTranslation } from '../utils/i18n';
import LazyFlagImage from './LazyFlagImage';
import CoinIcon from './CoinIcon';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  userProfilePicture: string | null;
  coins: number;
  bestSurvivalStreak: number;
  onPlayReplay: (replay: SavedReplay) => void;
  onPracticeMatch?: () => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  playerName,
  userProfilePicture,
  coins,
  bestSurvivalStreak,
  onPlayReplay,
  onPracticeMatch,
}: UserProfileModalProps) {
  const { t } = useTranslation();
  const [replays, setReplays] = useState<SavedReplay[]>(() => savedReplayManager.getReplays());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = savedReplayManager.subscribe((updated) => {
      setReplays(updated);
    });
    return unsubscribe;
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    await savedReplayManager.deleteReplay(id);
    setDeletingId(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-xl bg-slate-900 border-[3.5px] border-black rounded-[24px] shadow-[0_8px_0_0_#000] overflow-hidden flex flex-col max-h-[90vh] z-10 text-white"
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 p-4 sm:p-5 border-b-[3.5px] border-black flex items-center justify-between text-black">
            <div className="flex items-center gap-3">
              <div className="relative">
                {userProfilePicture ? (
                  <img
                    src={userProfilePicture}
                    alt={playerName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-[14px] border-[2.5px] border-black object-cover shadow-inner bg-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-[14px] bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 border-[2.5px] border-black flex items-center justify-center text-white shadow-inner">
                    <User className="w-6 h-6 stroke-[2.5]" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[2px] border-black rounded-full shadow-xs" />
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-900/80">
                  {t('profile.title', 'PLAYER PROFILE')}
                </span>
                <span className="text-base sm:text-lg md:text-xl font-black uppercase tracking-wider text-black">
                  {playerName}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-slate-100 active:scale-95 text-black border-[2.5px] border-black shadow-[0_3px_0_0_#000] flex items-center justify-center cursor-pointer transition-all shrink-0"
              title={t('common.close', 'Close')}
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-950/60 border-b-[2.5px] border-black/80">
            {/* Coins */}
            <div className="bg-slate-800/90 border-[2px] border-black rounded-[14px] p-2 sm:p-2.5 flex flex-col items-center justify-center shadow-xs">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <CoinIcon size="w-3.5 h-3.5" />
                <span>{t('common.coins', 'COINS')}</span>
              </span>
              <span className="text-sm sm:text-base font-black text-amber-400 font-mono mt-0.5">
                {coins.toLocaleString()}
              </span>
            </div>

            {/* Survival Streak */}
            <div className="bg-slate-800/90 border-[2px] border-black rounded-[14px] p-2 sm:p-2.5 flex flex-col items-center justify-center shadow-xs">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>{t('survival.bestStreak', 'BEST STREAK')}</span>
              </span>
              <span className="text-sm sm:text-base font-black text-rose-400 font-mono mt-0.5">
                {bestSurvivalStreak} {t('survival.kicks', 'Kicks')}
              </span>
            </div>

            {/* Saved Replays Count */}
            <div className="bg-slate-800/90 border-[2px] border-black rounded-[14px] p-2 sm:p-2.5 flex flex-col items-center justify-center shadow-xs">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('replays.savedReplays', 'SAVED REPLAYS')}</span>
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-400 font-mono mt-0.5">
                {replays.length}
              </span>
            </div>
          </div>

          {/* Play Practice Match Bar */}
          {onPracticeMatch && (
            <div className="p-3 sm:p-3.5 bg-amber-400/95 border-b-[2.5px] border-black flex items-center justify-between gap-3 text-black">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-[10px] bg-white border-[2px] border-black flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faFutbol} className="text-base text-black" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-black truncate">
                    {t('menu.practice', 'PRACTICE MATCH')}
                  </span>
                  <span className="text-[10px] text-slate-800 font-bold truncate">
                    {t('practice.bannerDesc', 'Hone free kicks & penalty drills')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onPracticeMatch();
                }}
                className="px-3.5 py-1.5 rounded-[12px] bg-white hover:bg-slate-100 active:scale-95 text-black font-black text-xs uppercase tracking-wider border-[2px] border-black shadow-[0_2px_0_0_#000] cursor-pointer flex items-center gap-1.5 shrink-0 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>{t('practice.playPractice', 'PLAY')}</span>
              </button>
            </div>
          )}

          {/* Replays Section Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar">
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                  {t('replays.savedHighlights', 'SAVED MATCH HIGHLIGHTS')}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">
                {replays.length} / 25 {t('replays.clips', 'Clips')}
              </span>
            </div>

            {replays.length === 0 ? (
              /* Empty State */
              <div className="py-10 sm:py-14 px-4 text-center flex flex-col items-center justify-center bg-slate-950/40 rounded-[20px] border-[2px] border-dashed border-slate-700/80">
                <div className="w-14 h-14 rounded-full bg-slate-800 border-[2.5px] border-black flex items-center justify-center text-slate-400 mb-3 shadow-[0_3px_0_0_#000]">
                  <Bookmark className="w-6 h-6 stroke-[2]" />
                </div>
                <h4 className="text-sm sm:text-base font-black uppercase text-white tracking-wider mb-1">
                  {t('replays.noSavedReplays', 'NO SAVED REPLAYS YET')}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xs leading-relaxed">
                  {t('replays.emptyInstructions', 'Score a goal and tap SAVE in the top right during replay mode to save your best strikes here!')}
                </p>
              </div>
            ) : (
              /* Replays List */
              <div className="space-y-2.5">
                {replays.map((replay) => (
                  <motion.div
                    key={replay.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-800/90 hover:bg-slate-800 border-[2.5px] border-black rounded-[18px] p-3 sm:p-3.5 shadow-[0_3px_0_0_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                  >
                    {/* Left Details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Flag matchup */}
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        <LazyFlagImage
                          src={getFlagUrl(replay.kickerCountryCode)}
                          alt={replay.kickerCountryName}
                          className="w-7 h-5 sm:w-8 sm:h-5.5 rounded-[4px] border border-black object-cover shadow-2xs z-10"
                        />
                        <LazyFlagImage
                          src={getFlagUrl(replay.opponentCountryCode)}
                          alt={replay.opponentCountryName}
                          className="w-7 h-5 sm:w-8 sm:h-5.5 rounded-[4px] border border-black object-cover shadow-2xs"
                        />
                      </div>

                      {/* Text info */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs sm:text-sm text-white uppercase truncate">
                            {replay.kickerCountryName} vs {replay.opponentCountryName}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-black text-[9px] sm:text-[10px] uppercase border ${
                              replay.isGoal
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                            }`}
                          >
                            {replay.outcomeText || (replay.isGoal ? t('common.goal', 'GOAL') : t('common.saved', 'SAVED'))}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs text-slate-400 font-bold">
                          <span className="text-amber-400 font-mono font-black">
                            {replay.distance.toFixed(1)}m
                          </span>
                          <span>•</span>
                          <span>{replay.gameMode || 'Free Kick'}</span>
                          <span>•</span>
                          <span>{replay.formattedDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/60">
                      <button
                        onClick={() => {
                          onPlayReplay(replay);
                          onClose();
                        }}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-95 text-black font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-[12px] border-[2px] border-black shadow-[0_2.5px_0_0_#000] cursor-pointer transition-all"
                        title={t('replays.watchReplay', 'Watch Replay')}
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>{t('replays.watchReplay', 'WATCH REPLAY')}</span>
                      </button>

                      <button
                        onClick={(e) => handleDelete(replay.id, e)}
                        disabled={deletingId === replay.id}
                        className="w-8 h-8 rounded-[12px] bg-rose-500/20 hover:bg-rose-500/40 active:scale-95 text-rose-400 hover:text-rose-200 border-[2px] border-rose-500/40 flex items-center justify-center cursor-pointer transition-all shrink-0"
                        title={t('replays.deleteReplay', 'Delete Replay')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 sm:p-3.5 bg-slate-950 border-t-[2.5px] border-black/80 flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('profile.cloudStorageNotice', 'SAVED VIA CRAZYGAMES CLOUD & LOCAL STORAGE')}</span>
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-black font-black uppercase tracking-wider cursor-pointer"
            >
              {t('common.close', 'CLOSE')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
