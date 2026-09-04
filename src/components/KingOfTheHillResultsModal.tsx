import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crown,
  Trophy,
  Swords,
  RotateCcw,
  Home,
  Sparkles,
  Flame,
  Target,
  Award,
  ArrowLeft,
  Skull,
  Medal,
} from 'lucide-react';
import { KingOfTheHillMatchState } from '../types';
import { useTranslation } from '../utils/i18n';
import { crazyGamesSDK } from '../utils/crazyGamesSDK';
import LazyFlagImage from './LazyFlagImage';
import CoinIcon from './CoinIcon';
import { getCountryAbbr } from '../data/countries';
import { getStickerAvatarUrl } from '../data/botProfiles';

interface KingOfTheHillResultsModalProps {
  isOpen: boolean;
  matchState: KingOfTheHillMatchState;
  onRematch: () => void;
  onReturnToMenu: () => void;
  isOnline?: boolean;
}

export default function KingOfTheHillResultsModal({
  isOpen,
  matchState,
  onRematch,
  onReturnToMenu,
  isOnline = false,
}: KingOfTheHillResultsModalProps) {
  const { t } = useTranslation();

  // Ensure CrazyGames native invite button overlay is hidden while viewing results, and celebrate victory
  React.useEffect(() => {
    if (isOpen) {
      crazyGamesSDK.hideInviteButton();
      const localContender = matchState.contenders.find((c) => c.isLocalPlayer);
      const isWinner = localContender && !localContender.isEliminated;
      if (isWinner) {
        crazyGamesSDK.happytime();
      }
    }
  }, [isOpen, matchState.contenders]);

  if (!isOpen) return null;

  // Rank contenders: Non-eliminated first (champion), then by eliminated round descending, then by total score descending
  const sortedContenders = [...matchState.contenders].sort((a, b) => {
    if (!a.isEliminated && b.isEliminated) return -1;
    if (a.isEliminated && !b.isEliminated) return 1;
    if (a.eliminatedInRound !== b.eliminatedInRound) {
      return (b.eliminatedInRound || 0) - (a.eliminatedInRound || 0);
    }
    return b.totalScore - a.totalScore;
  });

  const champion = sortedContenders[0];
  const runnerUp = sortedContenders[1];
  const thirdPlace = sortedContenders[2];
  const fourthPlace = sortedContenders[3];

  const localPlayer = matchState.contenders.find((c) => c.isLocalPlayer) || sortedContenders[0];
  const isLocalWinner = localPlayer.id === champion?.id && !localPlayer.isEliminated;
  const localRank = sortedContenders.findIndex((c) => c.id === localPlayer.id) + 1;

  // Highest scorer across tournament
  const topScorer = [...matchState.contenders].sort((a, b) => b.totalScore - a.totalScore)[0];
  // Most goals across tournament
  const topGoalGetter = [...matchState.contenders].sort((a, b) => b.totalGoals - a.totalGoals)[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 w-full h-full overflow-y-auto overflow-x-hidden bg-slate-950 text-slate-900 select-none font-sans touch-pan-y overscroll-contain"
      >
        {/* Dynamic Championship Stadium Backdrop & Atmosphere */}
        <div
          className="fixed inset-0 pointer-events-none bg-gradient-to-b from-amber-950/70 via-slate-950 to-black"
          aria-hidden="true"
        />
        <div
          className="fixed inset-0 opacity-[0.14] pointer-events-none bg-[radial-gradient(#f59e0b_1.5px,transparent_1.5px)] [background-size:24px_24px]"
          aria-hidden="true"
        />
        <div
          className="fixed top-0 left-1/3 -translate-x-1/2 w-[550px] h-[550px] bg-amber-500/18 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="fixed top-24 right-1/4 translate-x-1/2 w-[550px] h-[550px] bg-purple-600/18 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="w-full max-w-4xl mx-auto p-3 sm:p-6 md:p-8 pb-36 flex flex-col relative min-h-full">
          {/* Top Navigation & Status Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-5 pb-4 border-b-[3px] border-white/20"
          >
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ y: 3, scale: 0.97 }}
              onClick={onReturnToMenu}
              className="px-4 py-2.5 rounded-[18px] font-black uppercase tracking-wider bg-white text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center gap-2 text-xs sm:text-sm outline-none shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              <span>{t('common.mainMenu', 'MAIN MENU')}</span>
            </motion.button>

            {/* Title Card */}
            <div className="bg-white border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[22px] px-4 sm:px-6 py-2.5 sm:py-3 text-left sm:text-right flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[16px] bg-gradient-to-tr from-amber-400 to-yellow-300 border-[2.5px] border-black flex items-center justify-center text-black shrink-0 shadow-xs">
                <Crown className="w-6 h-6 sm:w-7 sm:h-7 fill-black text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-black">
                    KING OF THE HILL
                  </h1>
                  <span
                    className={`font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border-[1.5px] border-black uppercase shadow-2xs ${
                      isLocalWinner
                        ? 'bg-amber-400 text-black animate-pulse'
                        : 'bg-slate-900 text-amber-300'
                    }`}
                  >
                    {isLocalWinner ? 'CROWNED KING' : `RANK #${localRank}`}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-700 font-extrabold uppercase tracking-wider">
                  FINAL TOURNAMENT RESULTS & PODIUM
                </p>
              </div>
            </div>
          </motion.div>

          {/* Hero Outcome & Crown Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`w-full rounded-[26px] border-[3.5px] border-black p-5 sm:p-7 shadow-[0_8px_0_0_#000] mb-6 relative overflow-hidden text-center ${
              isLocalWinner
                ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500'
                : 'bg-gradient-to-b from-slate-900 via-purple-950 to-black text-white'
            }`}
          >
            {/* Crown / Trophy Graphics */}
            <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32 mb-3 flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full blur-2xl ${
                  isLocalWinner ? 'bg-amber-200/60' : 'bg-amber-500/20'
                }`}
              />
              {isLocalWinner ? (
                <div className="relative z-10 flex flex-col items-center">
                  <Crown className="w-20 h-20 sm:w-28 sm:h-28 text-yellow-950 fill-amber-300 drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)] animate-bounce" />
                  <Sparkles className="w-8 h-8 text-amber-900 absolute -top-1 -right-3 animate-spin" />
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center">
                  <Trophy className="w-18 h-18 sm:w-24 sm:h-24 text-amber-400 fill-amber-400/80 drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]" />
                </div>
              )}
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 rounded-full border-[2px] border-black shadow-[0_2px_0_0_#000] font-black text-xs sm:text-sm uppercase tracking-wider mb-2.5 ${
                isLocalWinner
                  ? 'bg-black text-amber-300'
                  : 'bg-amber-400 text-black'
              }`}
            >
              <Crown className="w-4 h-4 fill-current" />
              <span>
                {isLocalWinner
                  ? 'YOU CONQUERED THE HILL!'
                  : `${champion?.name.toUpperCase()} IS KING OF THE HILL`}
              </span>
            </div>

            <h2
              className={`text-2xl sm:text-4xl font-black uppercase tracking-wider mb-1.5 ${
                isLocalWinner ? 'text-black' : 'text-white'
              }`}
            >
              {isLocalWinner
                ? t('koth.victoryTitle', 'CHAMPION OF THE HILL!')
                : localPlayer.isEliminated
                ? `ELIMINATED IN ROUND ${localPlayer.eliminatedInRound || '4'}`
                : `RUNNER-UP • RANK #${localRank}`}
            </h2>

            <p
              className={`text-xs sm:text-sm font-bold uppercase tracking-wider max-w-lg mx-auto ${
                isLocalWinner ? 'text-amber-950' : 'text-slate-300'
              }`}
            >
              {isLocalWinner
                ? `You outscored all 3 contenders across 4 sudden-death rounds to claim the championship crown!`
                : `King of the Hill was ${champion?.name} (${champion?.countryName}) with ${champion?.totalGoals} total goals.`}
            </p>

            {/* Prize Pot Banner for Champion or Participant */}
            <div
              className={`mt-4 max-w-xl mx-auto rounded-[20px] border-[2.5px] border-black p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-around gap-3 shadow-[0_4px_0_0_#000] ${
                isLocalWinner
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white backdrop-blur-xs border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-amber-400 border-[2px] border-black flex items-center justify-center shrink-0 shadow-xs">
                  <CoinIcon className="w-6 h-6" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-80">
                    {isLocalWinner ? 'PRIZE POT EARNED' : 'TOURNAMENT PRIZE POT'}
                  </span>
                  <span className="text-xl sm:text-2xl font-black">
                    +{matchState.prizePot.toLocaleString()} COINS
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 border-t sm:border-t-0 sm:border-l border-black/20 pt-2 sm:pt-0 sm:pl-6">
                <div className="flex flex-col text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase opacity-80">YOUR GOALS</span>
                  <span className="text-lg sm:text-xl font-black">
                    {localPlayer.totalGoals}
                  </span>
                </div>
                <div className="flex flex-col text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase opacity-80">YOUR POINTS</span>
                  <span className="text-lg sm:text-xl font-black">
                    {localPlayer.totalScore.toLocaleString()} PTS
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3-Tier Hill Podium Architecture (Ranks 1, 2, 3, 4) */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-white text-xs font-black uppercase tracking-wider mb-3 px-1">
              <span className="flex items-center gap-1.5">
                <Medal className="w-4 h-4 text-amber-400" />
                <span>THE HILL PODIUM STANDINGS</span>
              </span>
              <span className="text-slate-400 text-[11px]">SUDDEN DEATH ELIMINATION</span>
            </div>

            {/* Hill Pedestals Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end max-w-2xl mx-auto mb-4 pt-8">
              {/* 2nd Place (Silver - Left) */}
              {runnerUp && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-2 flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[16px] bg-slate-200 border-[2.5px] border-black overflow-hidden shadow-xs relative">
                      <img
                        src={runnerUp.avatarUrl || getStickerAvatarUrl(runnerUp.name, 1)}
                        alt={runnerUp.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(runnerUp.name, 1);
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-3.5 sm:w-6 sm:h-4 rounded-[2px] overflow-hidden border border-black shadow-2xs">
                      <LazyFlagImage countryCode={runnerUp.countryCode} alt={runnerUp.countryName} className="w-full h-full object-cover" />
                    </div>
                    <span className="mt-1 font-black text-[10px] sm:text-xs text-white uppercase truncate max-w-[90px] sm:max-w-[120px] text-center">
                      {runnerUp.name}
                    </span>
                  </div>

                  {/* Pedestal Block */}
                  <div className="w-full bg-slate-300 border-[3px] border-black rounded-t-[18px] p-2 sm:p-3 text-center flex flex-col items-center justify-between h-28 sm:h-36 shadow-[0_5px_0_0_#000]">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 border-[2px] border-black flex items-center justify-center font-black text-xs sm:text-sm text-black">
                      2
                    </div>
                    <div className="flex flex-col items-center my-auto">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-700">RUNNER-UP</span>
                      <span className="text-xs sm:text-sm font-black text-black">{runnerUp.totalScore} PTS</span>
                      <span className="text-[10px] sm:text-xs font-extrabold text-slate-800">{runnerUp.totalGoals} Goals</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 1st Place (Gold - Center & Highest) */}
              {champion && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="flex flex-col items-center relative -top-3"
                >
                  <div className="relative mb-2 flex flex-col items-center">
                    <Crown className="w-7 h-7 sm:w-9 sm:h-9 text-amber-400 fill-amber-400 drop-shadow-md animate-bounce" />
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[18px] bg-amber-400 border-[3px] border-black overflow-hidden shadow-md relative mt-0.5">
                      <img
                        src={champion.avatarUrl || getStickerAvatarUrl(champion.name, 0)}
                        alt={champion.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(champion.name, 0);
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-4 sm:w-7 sm:h-5 rounded-[2px] overflow-hidden border border-black shadow-2xs">
                      <LazyFlagImage countryCode={champion.countryCode} alt={champion.countryName} className="w-full h-full object-cover" />
                    </div>
                    <span className="mt-1 font-black text-xs sm:text-sm text-amber-300 uppercase truncate max-w-[100px] sm:max-w-[140px] text-center">
                      {champion.name}
                    </span>
                  </div>

                  {/* Pedestal Block */}
                  <div className="w-full bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-400 border-[3.5px] border-black rounded-t-[20px] p-2 sm:p-3 text-center flex flex-col items-center justify-between h-36 sm:h-44 shadow-[0_6px_0_0_#000]">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black text-amber-300 border-[2px] border-black flex items-center justify-center font-black text-sm sm:text-base">
                      <Crown className="w-5 h-5 fill-amber-300 text-amber-300" />
                    </div>
                    <div className="flex flex-col items-center my-auto">
                      <span className="text-[10px] sm:text-xs font-black uppercase text-amber-950">KING</span>
                      <span className="text-sm sm:text-base font-black text-black">{champion.totalScore} PTS</span>
                      <span className="text-xs sm:text-sm font-black text-black">{champion.totalGoals} Goals</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3rd Place (Bronze - Right) */}
              {thirdPlace && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-2 flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[16px] bg-amber-700 border-[2.5px] border-black overflow-hidden shadow-xs relative">
                      <img
                        src={thirdPlace.avatarUrl || getStickerAvatarUrl(thirdPlace.name, 2)}
                        alt={thirdPlace.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(thirdPlace.name, 2);
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-3.5 sm:w-6 sm:h-4 rounded-[2px] overflow-hidden border border-black shadow-2xs">
                      <LazyFlagImage countryCode={thirdPlace.countryCode} alt={thirdPlace.countryName} className="w-full h-full object-cover" />
                    </div>
                    <span className="mt-1 font-black text-[10px] sm:text-xs text-white uppercase truncate max-w-[90px] sm:max-w-[120px] text-center">
                      {thirdPlace.name}
                    </span>
                  </div>

                  {/* Pedestal Block */}
                  <div className="w-full bg-amber-600/90 border-[3px] border-black rounded-t-[18px] p-2 sm:p-3 text-center flex flex-col items-center justify-between h-24 sm:h-32 shadow-[0_5px_0_0_#000]">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-800 text-white border-[2px] border-black flex items-center justify-center font-black text-xs sm:text-sm">
                      3
                    </div>
                    <div className="flex flex-col items-center my-auto">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-100">BRONZE</span>
                      <span className="text-xs sm:text-sm font-black text-white">{thirdPlace.totalScore} PTS</span>
                      <span className="text-[10px] sm:text-xs font-bold text-amber-100">{thirdPlace.totalGoals} Goals</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Full Standings Breakdown Table */}
          <div className="bg-white border-[3.5px] border-black rounded-[24px] p-3.5 sm:p-5 shadow-[0_6px_0_0_#000] mb-6">
            <div className="flex items-center justify-between mb-3 pb-2 border-b-[2px] border-black/10">
              <span className="text-xs sm:text-sm font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-500" />
                <span>TOURNAMENT ROSTER & ELIMINATION RECORD</span>
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase">
                4 CONTENDERS
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {sortedContenders.map((contender, index) => {
                const rank = index + 1;
                const isWinner = rank === 1;

                return (
                  <div
                    key={contender.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 sm:p-3 rounded-[18px] border-[2.5px] border-black gap-2 sm:gap-3 transition-all ${
                      contender.isLocalPlayer
                        ? 'bg-amber-100 shadow-[0_3px_0_0_#000]'
                        : isWinner
                        ? 'bg-yellow-50 shadow-[0_3px_0_0_#000]'
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Rank badge */}
                      <span
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[10px] flex items-center justify-center font-black text-xs sm:text-sm border-[2px] border-black shrink-0 ${
                          rank === 1
                            ? 'bg-amber-400 text-black'
                            : rank === 2
                            ? 'bg-slate-300 text-black'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {rank === 1 ? <Crown className="w-3.5 h-3.5 fill-current" /> : `#${rank}`}
                      </span>

                      {/* Avatar with flag */}
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-[12px] overflow-hidden border-[2px] border-black bg-white shrink-0">
                          <img
                            src={contender.avatarUrl || getStickerAvatarUrl(contender.name, index)}
                            alt={contender.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(contender.name, index);
                            }}
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4.5 h-3.5 rounded-[2px] overflow-hidden border border-black">
                          <LazyFlagImage countryCode={contender.countryCode} alt={contender.countryName} className="w-full h-full object-cover" />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-black text-black uppercase truncate">
                            {contender.name}
                          </span>
                          {contender.isLocalPlayer && (
                            <span className="bg-black text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-black">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-700 uppercase">
                          <span>{contender.countryName}</span>
                          <span>•</span>
                          <span className="font-mono font-black text-black">
                            {getCountryAbbr(contender.countryCode)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats & Elimination Outcome Tag */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto border-t sm:border-t-0 border-black/10 pt-2 sm:pt-0">
                      {/* Elimination Badge */}
                      <div className="shrink-0">
                        {isWinner ? (
                          <span className="bg-emerald-400 text-black text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-[10px] border-[1.5px] border-black shadow-2xs flex items-center gap-1">
                            <Crown className="w-3.5 h-3.5 fill-black" />
                            <span>UNDISPUTED KING</span>
                          </span>
                        ) : contender.isEliminated ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded-[10px] border border-rose-300">
                            ROUND {contender.eliminatedInRound} OUT
                          </span>
                        ) : (
                          <span className="bg-slate-200 text-slate-800 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-[10px] border border-slate-300">
                            FINALIST
                          </span>
                        )}
                      </div>

                      {/* Score metrics */}
                      <div className="flex items-center gap-3 text-right shrink-0">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-slate-500 uppercase">GOALS</span>
                          <span className="text-xs sm:text-sm font-black text-black">
                            {contender.totalGoals}
                          </span>
                        </div>
                        <div className="flex flex-col items-end min-w-[70px]">
                          <span className="text-[9px] font-black text-slate-500 uppercase">SCORE</span>
                          <span className="text-xs sm:text-sm font-black text-amber-950 font-mono">
                            {contender.totalScore.toLocaleString()} PTS
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tournament Highlights & Awards */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-6">
            <div className="bg-white/95 border-[3px] border-black rounded-[20px] p-3 sm:p-4 shadow-[0_4px_0_0_#000] flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-amber-400 border-[2px] border-black flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 fill-orange-500" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-600">
                  GOLDEN BOOT OF THE HILL
                </span>
                <span className="text-xs sm:text-sm font-black text-black truncate uppercase">
                  {topGoalGetter?.name} ({topGoalGetter?.totalGoals} Goals)
                </span>
              </div>
            </div>

            <div className="bg-white/95 border-[3px] border-black rounded-[20px] p-3 sm:p-4 shadow-[0_4px_0_0_#000] flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-amber-300 border-[2px] border-black flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-900" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-600">
                  HIGHEST TOTAL SCORE
                </span>
                <span className="text-xs sm:text-sm font-black text-black truncate uppercase">
                  {topScorer?.name} ({topScorer?.totalScore.toLocaleString()} PTS)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-black/95 backdrop-blur-md border-t-[3.5px] border-black z-40 flex items-center justify-center">
          <div className="w-full max-w-2xl flex items-center justify-between gap-2.5 sm:gap-4">
            {/* Play Again Primary Button (Offline Only) */}
            {!isOnline && (
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ y: 3, scale: 0.97 }}
                onClick={onRematch}
                className="flex-1 py-3 sm:py-3.5 px-4 rounded-[18px] font-black text-sm sm:text-base uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-center gap-2 outline-none"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span>{t('koth.playAgain', 'PLAY AGAIN')}</span>
              </motion.button>
            )}

            {/* Return to Menu */}
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ y: 3, scale: 0.97 }}
              onClick={onReturnToMenu}
              className={`${
                isOnline
                  ? 'flex-1 py-3.5 sm:py-4 bg-amber-400 hover:bg-amber-300 text-black text-sm sm:text-base border-[3px] shadow-[0_5px_0_0_#000]'
                  : 'py-3 sm:py-3.5 px-4 sm:px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs sm:text-sm border-[2.5px] shadow-[0_4px_0_0_#000]'
              } rounded-[18px] font-black uppercase tracking-wider border-black cursor-pointer flex items-center justify-center gap-2 outline-none`}
              title="Return to Main Menu"
            >
              <Home className={`w-4 h-4 sm:w-5 sm:h-5 ${isOnline ? 'text-black stroke-[2.5]' : 'text-slate-800'}`} />
              <span>{t('common.mainMenu', 'MAIN MENU')}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
