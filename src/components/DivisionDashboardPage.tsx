import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  Play,
  Coins,
  History,
  Search,
  Users,
  X,
  Shuffle,
  Check,
  Calendar,
} from 'lucide-react';
import { COUNTRIES_DATA, Country, getFlagUrl } from '../data/countries';
import {
  DivisionState,
  getTierInfo,
  startNewSeason,
  getRandomOpponentForDivision,
} from '../data/divisionData';
import { useTranslation } from '../utils/i18n';
import LazyFlagImage from './LazyFlagImage';

interface DivisionDashboardPageProps {
  divisionState: DivisionState;
  userCountry: Country;
  coins: number;
  playerName: string;
  onBack: () => void;
  onPlayNextMatch: (opponent: Country) => void;
  onClaimSeasonReward?: (updatedState: DivisionState, coinsEarned: number) => void;
}

export default function DivisionDashboardPage({
  divisionState,
  userCountry,
  coins,
  playerName,
  onBack,
  onPlayNextMatch,
  onClaimSeasonReward,
}: DivisionDashboardPageProps) {
  const { t } = useTranslation();
  const [showRewardModal, setShowRewardModal] = useState(Boolean(divisionState.pendingSeasonReward));
  const [showOpponentModal, setShowOpponentModal] = useState(false);
  const [opponentSearch, setOpponentSearch] = useState('');
  const [historyTab, setHistoryTab] = useState<'season' | 'all'>('season');

  // Selected Next Opponent (defaults to nextOpponent, but user can change to anyone they want)
  const [selectedOpponent, setSelectedOpponent] = useState<Country>(() => {
    return divisionState.nextOpponent || getRandomOpponentForDivision(userCountry);
  });

  const tier = getTierInfo(divisionState.currentDivision);
  const {
    currentDivision,
    currentPoints,
    matchesRemaining,
    matchesPlayedThisSeason,
    seasonMatches = [],
    allTimeHistory = [],
    stats,
    pendingSeasonReward,
  } = divisionState;

  // Calculate Progress percentage to Transfer / Promotion
  const targetTransferPoints = tier.pointsToTransfer;
  const transferProgressPercent = Math.min(100, Math.max(0, (currentPoints / targetTransferPoints) * 100));
  const pointsNeededToTransfer = Math.max(0, targetTransferPoints - currentPoints);

  // Available opponents pool (excluding user country)
  const availableOpponents = useMemo(() => {
    return COUNTRIES_DATA.filter(
      (c) => c.id !== userCountry.id && c.code !== userCountry.code
    );
  }, [userCountry]);

  // Filtered opponents for search
  const filteredOpponents = useMemo(() => {
    const q = opponentSearch.trim().toLowerCase();
    if (!q) return availableOpponents;
    return availableOpponents.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [availableOpponents, opponentSearch]);

  const handlePickRandomOpponent = () => {
    const random = getRandomOpponentForDivision(userCountry);
    setSelectedOpponent(random);
  };

  const handleSelectOpponent = (country: Country) => {
    setSelectedOpponent(country);
    setShowOpponentModal(false);
    setOpponentSearch('');
  };

  const handleClaimReward = () => {
    if (!pendingSeasonReward) return;
    const newDiv = pendingSeasonReward.newDivision;
    const coinsWon = pendingSeasonReward.coins;
    const updated = startNewSeason(divisionState, newDiv, userCountry);
    setShowRewardModal(false);
    if (onClaimSeasonReward) {
      onClaimSeasonReward(updated, coinsWon);
    }
  };

  const displayedHistory = historyTab === 'season' ? seasonMatches : allTimeHistory;

  return (
    <div
      id="division-hub-root"
      className="fixed inset-0 w-full h-full min-h-0 bg-gradient-to-b from-sky-400 via-blue-600 to-indigo-800 text-slate-900 flex flex-col font-sans overflow-hidden"
    >
      {/* Top Header Bar */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b-[3px] sm:border-b-[3.5px] border-black shadow-[0_3px_0_0_#000] px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between z-30 shrink-0">
        {/* Back Button and Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 hover:bg-slate-200 border-[2px] sm:border-[2.5px] border-black rounded-[12px] sm:rounded-[14px] flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#000]"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-black stroke-[3]" />
          </motion.button>

          <div className="flex items-center gap-2">
            <span className="text-base sm:text-xl font-black uppercase tracking-wider text-black">
              {t('divisions.title', 'DIVISIONS')}
            </span>
            <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full border-[1.5px] border-black bg-amber-400 text-black shadow-xs">
              {tier.shortName}
            </span>
          </div>
        </div>

        {/* User Coin Display */}
        <div className="bg-white border-[2px] sm:border-[2.5px] border-black shadow-[0_2.5px_0_0_#000] rounded-full px-2.5 sm:px-3.5 py-1 flex items-center gap-1.5">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-yellow-100 border border-black flex items-center justify-center shrink-0">
            <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-900" />
          </div>
          <span className="text-xs sm:text-sm font-black text-black">
            {coins.toLocaleString()}
          </span>
        </div>
      </header>

      {/* Main Content Area: Scrollable and responsive */}
      <div className="flex-1 min-h-0 w-full max-w-2xl mx-auto p-3 sm:p-4 overflow-y-auto flex flex-col gap-3 pb-12 overscroll-contain">
        {/* 1. DIVISION PROGRESS CARD */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white border-[3px] border-black shadow-[0_4px_0_0_#000] rounded-[20px] p-3.5 sm:p-4.5 flex flex-col gap-2.5"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] border-[2px] border-black bg-amber-400 flex flex-col items-center justify-center shadow-[0_2px_0_0_#000] shrink-0">
                <span className="text-[7.5px] font-black uppercase text-amber-950 leading-none">{t('divisions.rank', 'RANK')}</span>
                <span className="text-xs sm:text-sm font-black text-black leading-none mt-0.5 text-center px-1 truncate w-full">
                  {tier.shortName}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-black uppercase text-black">
                  {tier.name}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500">
                  {tier.description} • {t('divisions.match', 'Match')} {matchesPlayedThisSeason + 1} {t('divisions.of', 'of')} {tier.totalMatches}
                </span>
              </div>
            </div>

            {/* Current Stats Pills */}
            <div className="flex items-center gap-1.5">
              <div className="bg-amber-100 border-[1.5px] border-black rounded-[10px] px-2 py-1 text-center">
                <span className="text-[9px] font-bold uppercase text-amber-900 block leading-tight">{t('divisions.pts', 'PTS')}</span>
                <span className="text-xs sm:text-sm font-black text-black leading-tight">{currentPoints}</span>
              </div>
              <div className="bg-emerald-100 border-[1.5px] border-black rounded-[10px] px-2 py-1 text-center">
                <span className="text-[9px] font-bold uppercase text-emerald-900 block leading-tight">W-D-L</span>
                <span className="text-xs sm:text-sm font-black text-black leading-tight">
                  {stats?.wins || 0}-{stats?.draws || 0}-{stats?.losses || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Promotion Progress Bar */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center justify-between text-[11px] font-black uppercase">
              <span className="text-slate-700 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                {currentDivision > 1 ? `${t('divisions.next', 'Next')}: ${getTierInfo(currentDivision - 1).name}` : t('divisions.titleTarget', 'Title Target')}
              </span>
              <span className="text-emerald-700">
                {currentDivision === 1
                  ? currentPoints >= tier.pointsForTitle
                    ? t('divisions.titleClaimed', 'TITLE CLAIMED!')
                    : `${Math.max(0, tier.pointsForTitle - currentPoints)} ${t('divisions.ptsForTrophy', 'PTS for Trophy')}`
                  : pointsNeededToTransfer === 0
                  ? t('divisions.promotionAchieved', 'PROMOTION ACHIEVED!')
                  : `${pointsNeededToTransfer} ${t('divisions.ptsNeeded', 'PTS needed')}`}
              </span>
            </div>

            <div className="relative w-full h-5 sm:h-6 bg-slate-100 border-[2px] border-black rounded-full overflow-hidden flex items-center p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${transferProgressPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-emerald-400 border-r border-black"
              />
              <div className="absolute inset-0 flex items-center justify-between px-2.5 text-[9px] sm:text-[10px] font-black uppercase pointer-events-none text-black">
                <span>0 {t('divisions.pts', 'PTS')}</span>
                <span>{currentPoints} / {targetTransferPoints} {t('divisions.pts', 'PTS')}</span>
                <span>{currentDivision > 1 ? getTierInfo(currentDivision - 1).shortName : t('divisions.titleUpper', 'TITLE')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. NEXT OPPONENT / MATCH SELECTION CARD */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="w-full bg-white border-[3px] border-black shadow-[0_4px_0_0_#000] rounded-[20px] p-3.5 sm:p-4.5 flex flex-col gap-3"
        >
          {/* Card Header with Opponent Selector */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black uppercase text-black">
                {t('divisions.nextMatchChooseOpponent', 'NEXT MATCH • CHOOSE OPPONENT')}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              {matchesRemaining} {t('divisions.matchesLeft', 'Matches Left')}
            </span>
          </div>

          {/* Interactive Matchup Display */}
          <div className="flex items-center justify-around gap-2 bg-slate-50 rounded-[16px] border-[2px] border-black p-3">
            {/* User Team */}
            <div className="flex flex-col items-center gap-1 flex-1 text-center">
              <LazyFlagImage
                src={getFlagUrl(userCountry.code)}
                alt={userCountry.name}
                className="w-13 h-9 sm:w-15 sm:h-10 rounded-[6px] border border-black shadow-xs object-cover"
              />
              <span className="font-black text-xs sm:text-sm text-black uppercase truncate max-w-[110px]">
                {userCountry.name}
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase">{t('divisions.you', 'YOU')}</span>
            </div>

            {/* VS Badge */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-amber-400 border-[2px] border-black rounded-full flex items-center justify-center shadow-xs">
                <span className="text-xs font-black text-black">VS</span>
              </div>
            </div>

            {/* Selected Opponent Team (Clickable to change) */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowOpponentModal(true)}
              className="flex flex-col items-center gap-1 flex-1 text-center bg-white hover:bg-amber-50 p-1.5 rounded-[12px] border-[2px] border-dashed border-amber-500 hover:border-black transition-colors cursor-pointer group"
              title="Click to change next opponent"
            >
              <LazyFlagImage
                src={getFlagUrl(selectedOpponent.code)}
                alt={selectedOpponent.name}
                className="w-13 h-9 sm:w-15 sm:h-10 rounded-[6px] border border-black shadow-xs object-cover"
              />
              <span className="font-black text-xs sm:text-sm text-black uppercase truncate max-w-[110px] group-hover:text-amber-800">
                {selectedOpponent.name}
              </span>
              <span className="text-[8px] sm:text-[9px] font-black text-amber-700 uppercase bg-amber-200 border border-black px-1.5 py-0.2 rounded-full">
                {t('divisions.change', 'CHANGE ▾')}
              </span>
            </motion.button>
          </div>

          {/* Quick Selection Buttons */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowOpponentModal(true)}
              className="flex-1 py-2 px-3 rounded-[12px] font-black text-xs uppercase bg-slate-100 hover:bg-slate-200 text-slate-900 border-[2px] border-black shadow-[0_2px_0_0_#000] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-black" />
              <span>{t('divisions.chooseOpponent', 'CHOOSE OPPONENT')} ({selectedOpponent.name})</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePickRandomOpponent}
              className="p-2 rounded-[12px] bg-amber-300 hover:bg-amber-400 text-black border-[2px] border-black shadow-[0_2px_0_0_#000] cursor-pointer flex items-center justify-center shrink-0"
              title="Random Opponent"
            >
              <Shuffle className="w-4 h-4 text-black" />
            </motion.button>
          </div>

          {/* Rewards & Points Rule Pill */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs font-black">
            <div className="bg-emerald-50 border-[1.5px] border-black rounded-[10px] p-1.5 flex flex-col items-center justify-center">
              <span className="text-emerald-900 text-[10px] uppercase font-black">{t('divisions.win', 'WIN')}</span>
              <span className="text-black font-black text-xs">+3 {t('divisions.pts', 'PTS')} • +10 COINS</span>
            </div>
            <div className="bg-amber-50 border-[1.5px] border-black rounded-[10px] p-1.5 flex flex-col items-center justify-center">
              <span className="text-amber-900 text-[10px] uppercase font-black">{t('divisions.draw', 'DRAW')}</span>
              <span className="text-black font-black text-xs">+1 {t('divisions.pt', 'PT')} • 0 COINS</span>
            </div>
            <div className="bg-rose-50 border-[1.5px] border-black rounded-[10px] p-1.5 flex flex-col items-center justify-center">
              <span className="text-rose-900 text-[10px] uppercase font-black">{t('divisions.loss', 'LOSS')}</span>
              <span className="text-black font-black text-xs">
                {tier.pointsLostOnDefeat > 0 ? `-${tier.pointsLostOnDefeat} ${t('divisions.pts', 'PTS')}` : `0 ${t('divisions.pts', 'PTS')}`} • 0 COINS
              </span>
            </div>
          </div>

          {/* PLAY MATCH BUTTON */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPlayNextMatch(selectedOpponent)}
            className="w-full py-3.5 px-4 rounded-[16px] font-black text-sm sm:text-base uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-black border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer flex items-center justify-center gap-2 outline-none mt-0.5"
          >
            <Play className="w-5 h-5 fill-black text-black" />
            <span>{t('divisions.playMatchVs', 'PLAY MATCH VS')} {selectedOpponent.name}</span>
          </motion.button>
        </motion.div>

        {/* 3. MATCHES HISTORY SECTION (Replaced Standings Table) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full bg-white border-[3px] border-black shadow-[0_4px_0_0_#000] rounded-[20px] p-3.5 sm:p-4.5 flex flex-col gap-3"
        >
          {/* History Header & Tabs */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-black" />
              <span className="text-xs font-black uppercase text-black">
                {t('divisions.matchesHistory', 'MATCHES HISTORY')}
              </span>
            </div>

            {/* Tabs: This Season vs All-Time */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-[10px] border border-black">
              <button
                onClick={() => setHistoryTab('season')}
                className={`text-[10px] font-black px-2 py-0.5 rounded-[8px] transition-all cursor-pointer ${
                  historyTab === 'season'
                    ? 'bg-amber-400 text-black shadow-xs'
                    : 'text-slate-600 hover:text-black'
                }`}
              >
                {t('divisions.thisSeason', 'THIS SEASON')} ({seasonMatches.length})
              </button>
              <button
                onClick={() => setHistoryTab('all')}
                className={`text-[10px] font-black px-2 py-0.5 rounded-[8px] transition-all cursor-pointer ${
                  historyTab === 'all'
                    ? 'bg-amber-400 text-black shadow-xs'
                    : 'text-slate-600 hover:text-black'
                }`}
              >
                {t('divisions.allTime', 'ALL TIME')} ({allTimeHistory.length})
              </button>
            </div>
          </div>

          {/* Matches List */}
          {displayedHistory.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
              {displayedHistory.map((match, idx) => {
                const isWin = match.result === 'win';
                const isDraw = match.result === 'draw';

                return (
                  <div
                    key={match.id || `match-${idx}`}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-[14px] border-[2px] border-black shadow-[0_2px_0_0_#000] transition-colors ${
                      isWin
                        ? 'bg-emerald-50/80 border-black'
                        : isDraw
                        ? 'bg-amber-50/80 border-black'
                        : 'bg-rose-50/80 border-black'
                    }`}
                  >
                    {/* Left: Match Number & Teams */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      {/* Match Index Badge */}
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[10px] bg-white border border-black flex items-center justify-center font-black text-xs text-black shadow-xs shrink-0">
                        #{match.matchNumberInSeason || displayedHistory.length - idx}
                      </div>

                      {/* Opponent Info */}
                      <div className="flex items-center gap-2 min-w-0">
                        <LazyFlagImage
                          src={getFlagUrl(match.opponentCountry.code)}
                          alt={match.opponentCountry.name}
                          className="w-7 h-5 sm:w-8 sm:h-5.5 rounded-[3px] border border-black shadow-xs object-cover shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-xs sm:text-sm text-black truncate uppercase">
                            vs {match.opponentCountry.name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 text-slate-400" />
                            {match.date || 'Recent'} • Div {match.divisionNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Score and Result Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Score Display */}
                      <div className="bg-white border-[1.5px] border-black rounded-[8px] px-2 py-1 font-mono font-black text-xs sm:text-sm text-black shadow-xs">
                        {match.userScore} - {match.opponentScore}
                      </div>

                      {/* Result Pill */}
                      <div
                        className={`px-2 py-1 rounded-[8px] border-[1.5px] border-black font-black text-[10px] sm:text-xs uppercase shadow-xs flex flex-col items-center min-w-[54px] ${
                          isWin
                            ? 'bg-emerald-400 text-black'
                            : isDraw
                            ? 'bg-amber-300 text-black'
                            : 'bg-rose-400 text-black'
                        }`}
                      >
                        <span>{match.result.toUpperCase()}</span>
                        <span className="text-[8px] leading-none opacity-90 font-mono">
                          {match.pointsEarned > 0
                            ? `+${match.pointsEarned} PTS`
                            : match.pointsEarned < 0
                            ? `${match.pointsEarned} PTS`
                            : '0 PTS'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-[14px] border-[2px] border-dashed border-slate-300 gap-1.5">
              <div className="w-10 h-10 rounded-full bg-slate-200 border border-black flex items-center justify-center">
                <History className="w-5 h-5 text-slate-600" />
              </div>
              <span className="font-black text-xs uppercase text-slate-800">
                {t('divisions.noMatchesYet', 'NO MATCHES PLAYED YET')}
              </span>
              <p className="text-[10px] text-slate-500 max-w-xs">
                {t('divisions.noMatchesSub', 'Select your next opponent above and play your first match in Division to start your history!')}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* OPPONENT PICKER MODAL */}
      <AnimatePresence>
        {showOpponentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-lg bg-white border-[3.5px] border-black rounded-[24px] shadow-[0_8px_0_0_#000] text-black flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-3.5 sm:p-4 border-b-[2.5px] border-black flex items-center justify-between bg-amber-400 shrink-0">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-black" />
                  <h3 className="text-sm sm:text-base font-black uppercase text-black">
                    {t('divisions.whoDoYouWantToPlay', 'WHO DO YOU WANT TO PLAY NEXT?')}
                  </h3>
                </div>
                <button
                  onClick={() => setShowOpponentModal(false)}
                  className="w-8 h-8 rounded-[10px] bg-white border-[2px] border-black flex items-center justify-center cursor-pointer hover:bg-slate-100 shadow-xs"
                >
                  <X className="w-4 h-4 text-black stroke-[3]" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-slate-200 bg-slate-50 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={opponentSearch}
                    onChange={(e) => setOpponentSearch(e.target.value)}
                    placeholder={t('divisions.searchNationalTeam', 'Search national team (e.g. Brazil, France, England)...')}
                    className="w-full pl-9 pr-8 py-2 bg-white border-[2px] border-black rounded-[12px] text-xs font-bold text-black placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-400"
                    autoFocus
                  />
                  {opponentSearch && (
                    <button
                      onClick={() => setOpponentSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Country Cards Grid */}
              <div className="p-3 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 overscroll-contain">
                {filteredOpponents.map((country) => {
                  const isSelected = selectedOpponent.id === country.id;

                  return (
                    <motion.button
                      key={country.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectOpponent(country)}
                      className={`p-2 rounded-[14px] border-[2px] flex items-center gap-2 text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-300 border-black shadow-[0_3px_0_0_#000] ring-2 ring-amber-500'
                          : 'bg-white hover:bg-slate-100 border-black shadow-[0_2px_0_0_#000]'
                      }`}
                    >
                      <LazyFlagImage
                        src={getFlagUrl(country.code)}
                        alt={country.name}
                        className="w-8 h-5.5 rounded-[3px] border border-black shadow-xs object-cover shrink-0"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-black text-xs uppercase text-black truncate">
                          {country.name}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500">
                          {country.code}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-amber-300 stroke-[3]" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t-[2px] border-black bg-slate-50 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-bold text-slate-600">
                  {filteredOpponents.length} {t('divisions.teamsAvailable', 'teams available')}
                </span>
                <button
                  onClick={() => setShowOpponentModal(false)}
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 border-[2px] border-black rounded-[10px] font-black text-xs uppercase text-black shadow-xs cursor-pointer"
                >
                  {t('common.done', 'DONE')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REWARD MODAL */}
      <AnimatePresence>
        {showRewardModal && pendingSeasonReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 30, opacity: 0 }}
              className="w-full max-w-sm bg-white border-[3.5px] border-black rounded-[24px] p-5 shadow-[0_8px_0_0_#000] text-center text-black flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 bg-amber-400 border-[2.5px] border-black rounded-[16px] flex items-center justify-center shadow-[0_3px_0_0_#000]">
                <Trophy className="w-8 h-8 text-black" />
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-amber-700">{t('divisions.seasonFinished', 'SEASON FINISHED')}</span>
                <h3 className="text-xl font-black uppercase text-black">{pendingSeasonReward.title}</h3>
              </div>

              <div className="w-full bg-amber-50 border-[2px] border-black rounded-[14px] p-2.5 flex items-center justify-center gap-2">
                <Coins className="w-4 h-4 text-amber-900" />
                <span className="text-sm font-black text-black">+{pendingSeasonReward.coins} {t('common.coinsUpper', 'COINS')}</span>
              </div>

              <button
                onClick={handleClaimReward}
                className="w-full py-3 rounded-[14px] font-black text-sm uppercase bg-emerald-400 hover:bg-emerald-300 text-black border-[2.5px] border-black shadow-[0_3px_0_0_#000] cursor-pointer"
              >
                {t('divisions.continueTo', 'CONTINUE TO')} {getTierInfo(pendingSeasonReward.newDivision).name.toUpperCase()}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
