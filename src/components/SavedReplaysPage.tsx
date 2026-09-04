import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Play,
  Trash2,
  Bookmark,
  User,
  Video,
  AlertTriangle,
  Trophy,
  Zap,
  Target,
  X,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol } from '@fortawesome/free-solid-svg-icons';
import { SavedReplay } from '../types';
import { savedReplayManager } from '../utils/savedReplayManager';
import { getFlagUrl } from '../data/countries';
import LazyFlagImage from './LazyFlagImage';
import { useTranslation } from '../utils/i18n';

interface SavedReplaysPageProps {
  playerName: string;
  userProfilePicture: string | null;
  coins: number;
  bestSurvivalStreak: number;
  onBack: () => void;
  onPlayReplay: (replay: SavedReplay) => void;
  onQuickPlay: () => void;
  onPracticeFreeKick?: () => void;
  onPracticePenalty?: () => void;
}

export default function SavedReplaysPage({
  playerName,
  userProfilePicture,
  coins,
  bestSurvivalStreak,
  onBack,
  onPlayReplay,
  onQuickPlay,
  onPracticeFreeKick,
  onPracticePenalty,
}: SavedReplaysPageProps) {
  const { t } = useTranslation();
  const [replays, setReplays] = useState<SavedReplay[]>(() => savedReplayManager.getReplays());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState<boolean>(false);

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

  const handleClearAll = async () => {
    await savedReplayManager.clearAll();
    setShowClearConfirm(false);
  };

  // Derived statistics
  const stats = useMemo(() => {
    const total = replays.length;
    const goalsCount = replays.filter((r) => r.isGoal).length;
    const maxDistance = replays.reduce((max, r) => Math.max(max, r.distance || 0), 0);
    return {
      total,
      goalsCount,
      savesCount: total - goalsCount,
      maxDistance: maxDistance > 0 ? maxDistance.toFixed(1) : '0.0',
    };
  }, [replays]);

  // Sorted Replays (Newest first)
  const sortedReplays = useMemo(() => {
    return [...replays].sort((a, b) => b.createdAt - a.createdAt);
  }, [replays]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 15 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 400, damping: 24 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 text-slate-900 select-none font-sans z-20 touch-pan-y overscroll-contain"
    >
      <div className="w-full max-w-7xl mx-auto p-3 sm:p-5 md:p-8 pb-32 flex flex-col relative min-h-full">
        
        {/* Top Header Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-5 pb-4 border-b-[2.5px] border-black/20"
        >
          {/* Top Left Navigation Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ y: 4, scale: 0.97, boxShadow: '0px 1px 0px 0px #000' }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              onClick={onBack}
              className="px-4 py-2.5 rounded-[18px] font-black uppercase tracking-wider bg-white text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center gap-2 text-xs sm:text-sm outline-none focus:outline-none"
            >
              <ArrowLeft className="w-5 h-5 text-black stroke-[2.5]" />
              <span>{t('common.backToMenu', 'BACK TO MENU')}</span>
            </motion.button>

            {/* Play Practice Match Header Button */}
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ y: 4, scale: 0.97, boxShadow: '0px 1px 0px 0px #000' }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              onClick={() => setIsPracticeModalOpen(true)}
              className="px-4 py-2.5 rounded-[18px] font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center gap-2 text-xs sm:text-sm outline-none focus:outline-none shrink-0"
              title={t('menu.practice', 'Practice Free Kicks & Penalties')}
            >
              <FontAwesomeIcon icon={faFutbol} className="text-base text-black" />
              <span>{t('menu.practice', 'PRACTICE MATCH')}</span>
            </motion.button>
          </div>

          {/* Page Title Card */}
          <div className="bg-white border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[22px] px-5 py-3 text-left sm:text-right flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-amber-400 border-[2.5px] border-black flex items-center justify-center shadow-xs shrink-0">
              <Video className="w-5 h-5 text-black fill-black" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-black">
                {t('replays.title', 'SAVED MATCH HIGHLIGHTS')}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-700 font-bold uppercase tracking-widest mt-0.5">
                {t('replays.subtitle', 'RELIVE YOUR GREATEST GOALS & FREE KICKS • CLOUD SAVED')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Player Profile & Career Stats Strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mb-5"
        >
          {/* Player Card */}
          <div className="col-span-2 sm:col-span-1 bg-white/95 backdrop-blur-md border-[3px] border-black rounded-[20px] p-3 sm:p-3.5 shadow-[0_4px_0_0_#000] flex items-center gap-3">
            <div className="relative shrink-0">
              {userProfilePicture ? (
                <img
                  src={userProfilePicture}
                  alt={playerName}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-[14px] border-[2px] border-black object-cover shadow-xs bg-slate-200"
                />
              ) : (
                <div className="w-11 h-11 rounded-[14px] bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 border-[2px] border-black flex items-center justify-center text-white shadow-xs">
                  <User className="w-5 h-5 stroke-[2.5]" />
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-[2px] border-white rounded-full shadow-xs" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                {t('profile.title', 'PLAYER PROFILE')}
              </span>
              <span className="text-sm sm:text-base font-black text-black uppercase truncate">
                {playerName}
              </span>
            </div>
          </div>

          {/* Stat 1: Total Replays Saved */}
          <div className="bg-white/95 backdrop-blur-md border-[3px] border-black rounded-[20px] p-3 sm:p-3.5 shadow-[0_4px_0_0_#000] flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-emerald-400 border-[2px] border-black flex items-center justify-center text-black shadow-xs shrink-0">
              <Bookmark className="w-5 h-5 fill-black stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                {t('replays.savedClips', 'SAVED CLIPS')}
              </span>
              <span className="text-base sm:text-lg font-black text-black">
                {stats.total} <span className="text-xs text-slate-500 font-bold">/ 25</span>
              </span>
            </div>
          </div>

          {/* Stat 2: Goals Saved */}
          <div className="bg-white/95 backdrop-blur-md border-[3px] border-black rounded-[20px] p-3 sm:p-3.5 shadow-[0_4px_0_0_#000] flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-amber-400 border-[2px] border-black flex items-center justify-center text-black shadow-xs shrink-0">
              <Trophy className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                {t('replays.goalHighlights', 'GOAL HIGHLIGHTS')}
              </span>
              <span className="text-base sm:text-lg font-black text-amber-600">
                {stats.goalsCount} <span className="text-xs text-slate-500 font-bold">{t('game.goals', 'Goals')}</span>
              </span>
            </div>
          </div>

          {/* Stat 3: Furthest Strike Saved */}
          <div className="bg-white/95 backdrop-blur-md border-[3px] border-black rounded-[20px] p-3 sm:p-3.5 shadow-[0_4px_0_0_#000] flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-rose-400 border-[2px] border-black flex items-center justify-center text-black shadow-xs shrink-0">
              <Zap className="w-5 h-5 fill-black stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                {t('replays.longestStrike', 'LONGEST STRIKE')}
              </span>
              <span className="text-base sm:text-lg font-black text-rose-600 font-mono">
                {stats.maxDistance}m
              </span>
            </div>
          </div>
        </motion.div>

        {/* Practice Match Training Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="bg-white/95 backdrop-blur-md border-[3.5px] border-black rounded-[22px] p-3.5 sm:p-4 shadow-[0_6px_0_0_#000] mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-black"
        >
          <div className="flex items-center gap-3 sm:gap-3.5 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-[16px] bg-amber-400 border-[2.5px] border-black flex items-center justify-center text-black shadow-xs shrink-0">
              <FontAwesomeIcon icon={faFutbol} className="text-2xl text-black" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base md:text-lg uppercase tracking-wider text-black">
                  {t('menu.practice', 'PRACTICE MATCH')}
                </span>
                <span className="bg-black text-amber-300 font-black text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  TRAINING DRILLS
                </span>
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-700">
                {t('practice.bannerDesc', 'Hone your curling free kicks, wall defense bypasses & penalty shootout strikes')}
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ y: 2, scale: 0.97 }}
            onClick={() => setIsPracticeModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-[16px] bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-black text-xs sm:text-sm uppercase tracking-wider border-[2.5px] border-black shadow-[0_3px_0_0_#000] cursor-pointer flex items-center justify-center gap-2 shrink-0 transition-all"
          >
            <Play className="w-4 h-4 fill-black text-black" />
            <span>{t('practice.playPractice', 'PLAY PRACTICE MATCH')}</span>
          </motion.button>
        </motion.div>

        {/* Clear Confirmation Modal */}
        <AnimatePresence>
          {showClearConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white border-[3.5px] border-black rounded-[22px] p-5 max-w-sm w-full shadow-[0_8px_0_0_#000] text-center"
              >
                <div className="w-12 h-12 rounded-full bg-rose-100 border-[2.5px] border-rose-500 flex items-center justify-center mx-auto mb-3 text-rose-600">
                  <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-black uppercase text-black mb-1">
                  {t('replays.deleteAllConfirm', 'DELETE ALL SAVED REPLAYS?')}
                </h3>
                <p className="text-xs text-slate-600 font-bold mb-5 leading-relaxed">
                  {t('replays.deleteAllDesc', 'This will permanently erase all saved highlight clips from both cloud and local storage. This action cannot be undone.')}
                </p>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-2.5 rounded-[14px] bg-slate-100 hover:bg-slate-200 text-black font-black text-xs uppercase border-[2px] border-black cursor-pointer"
                  >
                    {t('common.cancel', 'CANCEL')}
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="flex-1 py-2.5 rounded-[14px] bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase border-[2px] border-black shadow-[0_3px_0_0_#000] cursor-pointer"
                  >
                    {t('replays.confirmDelete', 'CONFIRM DELETE')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Replays Content Grid or Empty State */}
        {sortedReplays.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center py-14 sm:py-20 px-6 bg-white/90 backdrop-blur-md rounded-[28px] border-[3.5px] border-black shadow-[0_8px_0_0_#000] text-center max-w-xl mx-auto my-auto"
          >
            <div className="w-20 h-20 rounded-[22px] bg-amber-400 border-[3.5px] border-black flex items-center justify-center text-black mb-4 shadow-[0_5px_0_0_#000]">
              <Video className="w-10 h-10 fill-black" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black mb-2">
              {t('replays.noHighlightsTitle', 'NO SAVED HIGHLIGHTS YET')}
            </h3>

            <p className="text-xs sm:text-sm text-slate-700 font-bold max-w-md leading-relaxed mb-6">
              {t('replays.noHighlightsDesc', 'Score a wonder goal in Free Kick Match, World Cup, Survival, or Wager Arena, and tap SAVE in the top right during replay mode to build your highlight reel!')}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <motion.button
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ y: 4, scale: 0.97, boxShadow: '0px 1px 0px 0px #000' }}
                onClick={() => setIsPracticeModalOpen(true)}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm uppercase tracking-wider px-6 py-3 rounded-[18px] border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer"
              >
                <FontAwesomeIcon icon={faFutbol} className="text-base text-black" />
                <span>{t('menu.practice', 'PLAY PRACTICE MATCH')}</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ y: 4, scale: 0.97, boxShadow: '0px 1px 0px 0px #000' }}
                onClick={onQuickPlay}
                className="flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-sm uppercase tracking-wider px-6 py-3 rounded-[18px] border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>{t('replays.playMatchNow', 'PLAY A MATCH NOW')}</span>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* Replays 3D Grid */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5"
          >
            {sortedReplays.map((replay) => (
              <motion.div
                key={replay.id}
                variants={cardVariants}
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-white/95 backdrop-blur-md hover:bg-white border-[3.5px] border-black rounded-[22px] p-4 shadow-[0_6px_0_0_#000] flex flex-col justify-between gap-3.5 transition-all"
              >
                {/* Top Row: Match Teams & Outcome Badge */}
                <div className="flex items-center justify-between gap-2 border-b-2 border-slate-200 pb-3">
                  {/* Flags & Country Names */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center -space-x-2 shrink-0">
                      <LazyFlagImage
                        src={getFlagUrl(replay.kickerCountryCode)}
                        alt={replay.kickerCountryName}
                        className="w-8 h-6 rounded-[5px] border-[1.5px] border-black object-cover shadow-xs z-10"
                      />
                      <LazyFlagImage
                        src={getFlagUrl(replay.opponentCountryCode)}
                        alt={replay.opponentCountryName}
                        className="w-8 h-6 rounded-[5px] border-[1.5px] border-black object-cover shadow-xs"
                      />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="font-black text-xs sm:text-sm text-black uppercase truncate">
                        {replay.kickerCountryName} vs {replay.opponentCountryName}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {replay.gameMode || 'Free Kick'}
                      </span>
                    </div>
                  </div>

                  {/* Goal or Saved Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-[10px] font-black text-[10px] sm:text-xs uppercase border-[2px] border-black shadow-2xs shrink-0 ${
                      replay.isGoal
                        ? 'bg-emerald-400 text-black'
                        : 'bg-rose-400 text-white'
                    }`}
                  >
                    {replay.outcomeText || (replay.isGoal ? t('game.goal', 'GOAL!') : t('game.saved', 'SAVED'))}
                  </span>
                </div>

                {/* Middle Info: Distance & Timestamp */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 rounded-[14px] p-2.5 border-[2px] border-black/60">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                      {t('replays.shotDistance', 'SHOT DISTANCE')}
                    </span>
                    <span className="text-base font-black text-black font-mono">
                      {replay.distance?.toFixed(1) ?? '25.0'}m
                    </span>
                  </div>

                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                      {t('replays.savedDate', 'SAVED DATE')}
                    </span>
                    <span className="text-xs font-bold text-slate-700 truncate">
                      {replay.formattedDate}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ y: 2, scale: 0.97 }}
                    onClick={() => onPlayReplay(replay)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-black font-black text-xs sm:text-sm uppercase tracking-wider py-2.5 rounded-[14px] border-[2.5px] border-black shadow-[0_3px_0_0_#000] cursor-pointer"
                    title="Watch 3D Highlight"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>{t('replays.watchReplay', 'WATCH REPLAY')}</span>
                  </motion.button>

                  <button
                    onClick={(e) => handleDelete(replay.id, e)}
                    disabled={deletingId === replay.id}
                    className="w-10 h-10 rounded-[14px] bg-rose-100 hover:bg-rose-200 active:scale-95 text-rose-600 border-[2px] border-rose-500 flex items-center justify-center cursor-pointer transition-all shrink-0"
                    title="Delete highlight"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Practice Drill Selection Modal */}
        <AnimatePresence>
          {isPracticeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 25 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 25 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                className="w-full max-w-md bg-white border-[4px] border-black rounded-[28px] p-6 sm:p-8 shadow-[0_12px_0_0_#000] relative text-black"
              >
                <button
                  onClick={() => setIsPracticeModalOpen(false)}
                  className="absolute top-4 right-4 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black mb-1">
                  {t('menu.practice', 'PRACTICE MATCH')}
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm mb-6 font-bold uppercase tracking-wider">
                  {t('practice.selectDrill', 'Select practice training drill:')}
                </p>

                <div className="flex flex-col gap-3.5">
                  <motion.button
                    whileHover={{ y: -2, scale: 1.015 }}
                    whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    onClick={() => {
                      setIsPracticeModalOpen(false);
                      onPracticeFreeKick?.();
                    }}
                    className="w-full py-3.5 sm:py-4 px-5 rounded-[18px] font-black text-base sm:text-lg uppercase tracking-wider bg-amber-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-between outline-none focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faFutbol} className="text-xl text-black" />
                      <div className="flex flex-col text-left">
                        <span>{t('practice.freeKick', 'FREE KICK')}</span>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-800 normal-case">
                          {t('practice.freeKickSub', 'Instant Play • Wall defense & angle drills')}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs bg-black text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                      {t('practice.instant', 'Instant')}
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -2, scale: 1.015 }}
                    whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    onClick={() => {
                      setIsPracticeModalOpen(false);
                      onPracticePenalty?.();
                    }}
                    className="w-full py-3.5 sm:py-4 px-5 rounded-[18px] font-black text-base sm:text-lg uppercase tracking-wider bg-sky-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-between outline-none focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-black" />
                      <div className="flex flex-col text-left">
                        <span>{t('practice.penalty', 'PENALTY')}</span>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-800 normal-case">
                          {t('practice.penaltySub', '12 Yards • Target bullseye & precision shots')}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs bg-black text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                      {t('practice.random', 'Targets')}
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
