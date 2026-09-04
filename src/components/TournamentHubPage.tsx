import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, Check } from 'lucide-react';
import { Country, getFlagUrl, getCountryAbbr } from '../data/countries';
import {
  GroupLetter,
  GROUP_LETTERS,
  GroupTeamStanding,
  TournamentMatch,
  KnockoutMatch,
  TournamentState,
  sortGroupStandings,
  simulateEntireRemainingKnockout,
} from '../data/tournamentData';
import LazyFlagImage from './LazyFlagImage';
import TrophyImage from './TrophyImage';
import KnockoutBracketView from './KnockoutBracketView';
import { useTranslation } from '../utils/i18n';
import { crazyGamesSDK } from '../utils/crazyGamesSDK';

interface TournamentHubPageProps {
  tournamentState: TournamentState;
  onBackToMenu: () => void;
  onPlayMatch: (match: TournamentMatch | KnockoutMatch) => void;
  onUpdateTournament: (updatedState: TournamentState) => void;
  onCancelTournament: () => void;
}

export default function TournamentHubPage({
  tournamentState,
  onBackToMenu,
  onPlayMatch,
  onUpdateTournament,
  onCancelTournament,
}: TournamentHubPageProps) {
  const { t } = useTranslation();
  const {
    userCountry,
    userGroup,
    currentMatchday,
    groups,
    groupMatches,
    knockoutMatches,
    currentStage,
    isUserEliminated,
    isUserChampion,
  } = tournamentState;

  // Only show progress modal when entering a new stage (Knockouts, Semi, Finals, etc.), never after every group stage match
  const [showProgressModal, setShowProgressModal] = useState<boolean>(() => {
    if (currentStage === 'group') {
      // In group stage, suppress modal after matches
      return false;
    }
    try {
      const storageKey = `wc26_stage_notified_${userCountry.id}_${currentStage}_${isUserChampion ? 'champ' : isUserEliminated ? 'elim' : 'active'}`;
      const hasSeen = sessionStorage.getItem(storageKey);
      if (!hasSeen) {
        sessionStorage.setItem(storageKey, 'true');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<'ALL' | GroupLetter>('ALL');
  const [activeTab, setActiveTab] = useState<'bracket' | 'tables' | 'fixtures'>(() => {
    return currentStage === 'group' ? 'tables' : 'bracket';
  });

  // Trigger celebratory CrazyGames happytime when player wins the World Cup
  React.useEffect(() => {
    if (isUserChampion) {
      crazyGamesSDK.happytime();
    }
  }, [isUserChampion]);

  // User standing in their group
  const userGroupStandings = groups[userGroup] || [];
  const userRankIndex = userGroupStandings.findIndex(
    (s) => s.country.id === userCountry.id || s.country.code === userCountry.code
  );
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : 1;
  const userStanding = userRankIndex !== -1 ? userGroupStandings[userRankIndex] : null;

  // Next user match in group stage
  const upcomingGroupMatch = groupMatches.find(
    (m) => m.isUserMatch && !m.isCompleted && m.matchday === currentMatchday
  ) || groupMatches.find((m) => m.isUserMatch && !m.isCompleted);

  // Next user match in knockout stage
  const upcomingKnockoutMatch = knockoutMatches.find(
    (m) => m.isUserMatch && !m.isCompleted && m.homeTeam && m.awayTeam
  );

  const isGroupStage = currentStage === 'group';
  const visibleGroups = selectedGroupFilter === 'ALL' ? GROUP_LETTERS : [selectedGroupFilter];

  const handleSimulateAllToFinal = () => {
    const fullySimulated = simulateEntireRemainingKnockout(
      tournamentState.knockoutMatches,
      tournamentState.userCountry
    );
    const updatedState: TournamentState = {
      ...tournamentState,
      knockoutMatches: fullySimulated,
      isUserEliminated: true,
      currentStage: 'eliminated',
    };
    onUpdateTournament(updatedState);
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 text-slate-900 select-none font-sans z-20 touch-pan-y overscroll-contain">
      <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 md:p-8 pb-40 flex flex-col relative min-h-full">
        {/* Top Header Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-black/20"
        >
        <div className="flex items-center gap-3 flex-wrap">
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ y: 4, scale: 0.97, boxShadow: '0px 1px 0px 0px #000' }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            onClick={onBackToMenu}
            className="px-4 py-2.5 rounded-[18px] font-black uppercase tracking-wider bg-white text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center gap-2 text-xs sm:text-sm outline-none focus:outline-none"
          >
            <span>← Main Menu</span>
          </motion.button>

          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ y: 4, scale: 0.97, boxShadow: '0px 1px 0px 0px #000' }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            onClick={onCancelTournament}
            className="px-4 py-2.5 rounded-[18px] font-black uppercase tracking-wider bg-rose-500 hover:bg-rose-400 active:scale-95 text-white border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center gap-2 text-xs sm:text-sm outline-none focus:outline-none"
            title="Cancel current tournament and return to main menu"
          >
            <X className="w-4 h-4 shrink-0" />
            <span>Cancel Tournament</span>
          </motion.button>
        </div>

        {/* Title Box */}
        <div className="bg-white border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[22px] px-5 py-2.5 flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
            <TrophyImage className="w-full h-full" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-black">
              FIFA WORLD CUP 2026
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-700 font-bold uppercase tracking-widest">
              {isGroupStage
                ? `Group Stage • Matchday ${currentMatchday} of 3`
                : isUserChampion
                ? 'World Cup Champions'
                : `Knockout Stage • ${currentStage.replace('_', ' ').toUpperCase()}`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* World Champion Celebration Banner if Won */}
      {isUserChampion && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-amber-300 border-[4px] border-black rounded-[28px] p-6 sm:p-8 shadow-[0_10px_0_0_#000] mb-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row items-center gap-5 z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
              <TrophyImage className="w-full h-full animate-bounce" />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <span className="font-black text-xs uppercase bg-black text-amber-300 px-3 py-1 rounded-full">
                  WORLD CUP WINNERS 2026
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black uppercase text-black">
                {userCountry.name} ARE CHAMPIONS OF THE WORLD!
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mt-1">
                You led {userCountry.name} through every group and knockout round to lift the coveted World Cup trophy!
              </p>
            </div>
          </div>

          <button
            onClick={onCancelTournament}
            className="px-6 py-3.5 bg-black hover:bg-slate-800 text-amber-300 font-black text-sm uppercase tracking-wider rounded-[20px] border-2 border-black shadow-[0_4px_0_0_#000] cursor-pointer flex items-center gap-2 shrink-0 z-10"
          >
            <span>↻ PLAY NEW TOURNAMENT</span>
          </button>
        </motion.div>
      )}

      {/* User Team Banner & Quick Match Center */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="bg-white border-[3.5px] border-black rounded-[26px] p-4 sm:p-6 shadow-[0_8px_0_0_#000] mb-6 relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          
          {/* Left: Your Team Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-10 sm:w-18 sm:h-12 rounded-[12px] border-[2.5px] border-black overflow-hidden shadow-[0_3px_0_0_#000] bg-slate-100 shrink-0">
                <LazyFlagImage
                  src={getFlagUrl(userCountry.code)}
                  alt={userCountry.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-2 -right-1 bg-amber-400 text-black font-black text-[9px] px-1.5 py-0.2 rounded border border-black shadow-xs">
                YOU
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                  {userCountry.name}
                </span>
                <span className="text-xs font-black bg-emerald-400 text-black px-2 py-0.5 rounded-full border border-black">
                  {userCountry.rankPoints} OVR
                </span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mt-0.5">
                {isGroupStage ? (
                  <>
                    Group {userGroup} • Standing: <strong className="text-black font-black">{userRank}{userRank === 1 ? 'st' : userRank === 2 ? 'nd' : userRank === 3 ? 'rd' : 'th'} Place</strong> ({userStanding?.pts || 0} pts, {userStanding?.gd ? (userStanding.gd > 0 ? `+${userStanding.gd}` : userStanding.gd) : 0} GD)
                  </>
                ) : isUserChampion ? (
                  <span className="text-amber-700 font-black">WORLD CUP TOURNAMENT CHAMPION</span>
                ) : isUserEliminated ? (
                  <span className="text-rose-600 font-black">Eliminated in {currentStage.replace('_', ' ').toUpperCase()}</span>
                ) : (
                  <span className="text-emerald-700 font-black">Active in {currentStage.replace('_', ' ').toUpperCase()} Knockouts</span>
                )}
              </span>
            </div>
          </div>

          {/* Right: Upcoming Match Action Card */}
          {isGroupStage && upcomingGroupMatch ? (
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-amber-50 border-2 border-black rounded-[20px] p-3 sm:p-3.5 shadow-sm">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-5 rounded border border-black overflow-hidden bg-slate-200">
                    <LazyFlagImage src={getFlagUrl(upcomingGroupMatch.homeTeam.code)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-black text-xs uppercase text-black">{upcomingGroupMatch.homeTeam.abbr}</span>
                </div>

                <span className="font-black text-xs text-slate-400 px-1">VS</span>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-5 rounded border border-black overflow-hidden bg-slate-200">
                    <LazyFlagImage src={getFlagUrl(upcomingGroupMatch.awayTeam.code)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-black text-xs uppercase text-black">{upcomingGroupMatch.awayTeam.abbr}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onPlayMatch(upcomingGroupMatch)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-[16px] bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-black font-black text-xs sm:text-sm uppercase tracking-wider border-[2.5px] border-black shadow-[0_4px_0_0_#000] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>PLAY MATCHDAY {upcomingGroupMatch.matchday}</span>
                </motion.button>
              </div>
            </div>
          ) : !isGroupStage && upcomingKnockoutMatch ? (
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-amber-50 border-2 border-black rounded-[20px] p-3 sm:p-3.5 shadow-sm">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-5 rounded border border-black overflow-hidden bg-slate-200">
                    <LazyFlagImage src={getFlagUrl(upcomingKnockoutMatch.homeTeam?.code || '')} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-black text-xs uppercase text-black">{upcomingKnockoutMatch.homeTeam?.abbr || 'TBD'}</span>
                </div>

                <span className="font-black text-xs text-slate-400 px-1">VS</span>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-5 rounded border border-black overflow-hidden bg-slate-200">
                    <LazyFlagImage src={getFlagUrl(upcomingKnockoutMatch.awayTeam?.code || '')} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-black text-xs uppercase text-black">{upcomingKnockoutMatch.awayTeam?.abbr || 'TBD'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onPlayMatch(upcomingKnockoutMatch)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-[16px] bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-black font-black text-xs sm:text-sm uppercase tracking-wider border-[2.5px] border-black shadow-[0_4px_0_0_#000] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>PLAY {upcomingKnockoutMatch.stageName.toUpperCase()}</span>
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="bg-emerald-100 border-2 border-emerald-600 rounded-[18px] px-4 py-2.5 flex items-center gap-2 text-emerald-900 font-black text-xs sm:text-sm uppercase">
                <Check className="w-4 h-4 shrink-0" />
                <span>
                  {isUserChampion
                    ? 'Tournament Complete • Champions!'
                    : isUserEliminated
                    ? 'Eliminated • All Matches Simulated to Final'
                    : 'Stage Matches Completed!'}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('bracket')}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-black text-xs uppercase tracking-wider rounded-[16px] border-2 border-black shadow-[0_3px_0_0_#000] cursor-pointer flex items-center gap-1.5"
              >
                <span>VIEW 2-SIDED BRACKET</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Navigation Switcher (Bracket / Groups / Fixtures) */}
      <div className="flex flex-col gap-3.5 mb-6 w-full max-w-4xl">
        <div className="w-full bg-white p-1.5 rounded-[20px] sm:rounded-[22px] border-[3px] sm:border-[3.5px] border-black shadow-[0_5px_0_0_#000]">
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {/* Segment 1: Knockout Bracket */}
            <button
              onClick={() => setActiveTab('bracket')}
              className={`relative py-2.5 sm:py-3 px-1.5 sm:px-4 rounded-[14px] sm:rounded-[16px] font-black text-[11px] sm:text-xs md:text-sm uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
                activeTab === 'bracket'
                  ? 'bg-amber-400 text-black border-2 border-black shadow-[0_2px_0_0_#000]'
                  : 'text-slate-700 hover:text-black hover:bg-slate-100 border-2 border-transparent'
              }`}
            >
              <span className="truncate">
                <span className="sm:hidden">BRACKET</span>
                <span className="hidden sm:inline">KNOCKOUT BRACKET</span>
              </span>
            </button>

            {/* Segment 2: Group Tables */}
            <button
              onClick={() => setActiveTab('tables')}
              className={`relative py-2.5 sm:py-3 px-1.5 sm:px-4 rounded-[14px] sm:rounded-[16px] font-black text-[11px] sm:text-xs md:text-sm uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
                activeTab === 'tables'
                  ? 'bg-amber-400 text-black border-2 border-black shadow-[0_2px_0_0_#000]'
                  : 'text-slate-700 hover:text-black hover:bg-slate-100 border-2 border-transparent'
              }`}
            >
              <span className="truncate">
                <span className="sm:hidden">GROUPS</span>
                <span className="hidden sm:inline">GROUP TABLES (A–J)</span>
              </span>
            </button>

            {/* Segment 3: Fixtures & Results */}
            <button
              onClick={() => setActiveTab('fixtures')}
              className={`relative py-2.5 sm:py-3 px-1.5 sm:px-4 rounded-[14px] sm:rounded-[16px] font-black text-[11px] sm:text-xs md:text-sm uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
                activeTab === 'fixtures'
                  ? 'bg-amber-400 text-black border-2 border-black shadow-[0_2px_0_0_#000]'
                  : 'text-slate-700 hover:text-black hover:bg-slate-100 border-2 border-transparent'
              }`}
            >
              <span className="truncate">
                <span className="sm:hidden">FIXTURES</span>
                <span className="hidden sm:inline">FIXTURES &amp; RESULTS</span>
              </span>
            </button>
          </div>
        </div>

        {/* Secondary Group Segment Rail (Visible when in Group Tables mode) */}
        {activeTab === 'tables' && (
          <div className="w-full bg-transparent p-1 overflow-x-auto scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent">
            <div className="flex items-center gap-2 min-w-max pb-1">
              <button
                onClick={() => setSelectedGroupFilter('ALL')}
                className={`h-9 px-4 shrink-0 rounded-[12px] font-black text-xs uppercase tracking-wider transition-all cursor-pointer border-2 border-black flex items-center justify-center ${
                  selectedGroupFilter === 'ALL'
                    ? 'bg-black text-amber-300 shadow-[0_3px_0_0_#000]'
                    : 'bg-white text-slate-900 hover:bg-slate-100 shadow-[0_2px_0_0_#000]'
                }`}
              >
                ALL GROUPS
              </button>
              {GROUP_LETTERS.map((grp) => {
                const isSelected = selectedGroupFilter === grp;
                const isUserGrp = grp === userGroup;
                return (
                  <button
                    key={grp}
                    onClick={() => setSelectedGroupFilter(grp)}
                    className={`h-9 px-3.5 shrink-0 rounded-[12px] font-black text-xs uppercase tracking-wider transition-all cursor-pointer border-2 border-black flex items-center gap-1.5 justify-center whitespace-nowrap ${
                      isSelected
                        ? 'bg-amber-400 text-black shadow-[0_3px_0_0_#000]'
                        : isUserGrp
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-700 hover:bg-emerald-200 shadow-[0_2px_0_0_#000]'
                        : 'bg-white text-slate-800 hover:bg-slate-100 shadow-[0_2px_0_0_#000]'
                    }`}
                  >
                    <span>Group {grp}</span>
                    {isUserGrp && (
                      <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded-full border border-black">
                        YOU
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'bracket' ? (
        <KnockoutBracketView
          knockoutMatches={knockoutMatches}
          userCountry={userCountry}
          onPlayMatch={(match) => onPlayMatch(match)}
          isUserEliminated={isUserEliminated}
          isUserChampion={isUserChampion}
          onSimulateAllRemaining={handleSimulateAllToFinal}
        />
      ) : activeTab === 'tables' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {visibleGroups.map((grp) => {
            const standings = groups[grp] || [];
            const isUserInThisGroup = grp === userGroup;

            return (
              <motion.div
                key={grp}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`bg-white border-[3.5px] rounded-[24px] p-4 sm:p-5 shadow-[0_6px_0_0_#000] relative overflow-hidden ${
                  isUserInThisGroup ? 'border-emerald-600 ring-4 ring-emerald-300/80 shadow-[0_8px_0_0_#059669]' : 'border-black'
                }`}
              >
                {/* Group Card Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black/10">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-black text-amber-300 rounded-lg font-black text-xs sm:text-sm uppercase tracking-wider">
                      GROUP {grp}
                    </span>
                    {isUserInThisGroup && (
                      <span className="bg-emerald-400 text-black font-black text-[10px] px-2.5 py-0.5 rounded-full border border-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        YOUR GROUP
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Top 2 Advance
                  </span>
                </div>

                {/* Standings Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                        <th className="py-2 px-1 text-center w-6">#</th>
                        <th className="py-2 px-2">TEAM</th>
                        <th className="py-2 px-1.5 text-center font-bold" title="Matches Played">MP</th>
                        <th className="py-2 px-1 text-center font-bold" title="Won">W</th>
                        <th className="py-2 px-1 text-center font-bold" title="Drawn">D</th>
                        <th className="py-2 px-1 text-center font-bold" title="Lost">L</th>
                        <th className="py-2 px-1.5 text-center font-bold" title="Goals For">GF</th>
                        <th className="py-2 px-1.5 text-center font-bold" title="Goals Against">GA</th>
                        <th className="py-2 px-1.5 text-center font-black" title="Goal Difference">GD</th>
                        <th className="py-2 px-2 text-center font-black text-black text-xs" title="Points">PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((team, idx) => {
                        const isUserTeam = team.country.id === userCountry.id || team.country.code === userCountry.code;
                        const isQualifying = idx < 2;

                        return (
                          <tr
                            key={team.country.id}
                            className={`border-b border-slate-100 transition-colors ${
                              isUserTeam
                                ? 'bg-emerald-100/90 font-black text-black border-emerald-300'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <td className="py-2.5 px-1 text-center">
                              <span
                                className={`w-5 h-5 rounded-full inline-flex items-center justify-center font-black text-[10px] ${
                                  isQualifying
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {idx + 1}
                              </span>
                            </td>

                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-3.5 rounded border border-black/60 overflow-hidden bg-slate-100 shrink-0">
                                  <LazyFlagImage
                                    src={getFlagUrl(team.country.code)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="font-black truncate max-w-[100px] sm:max-w-[130px]" title={team.country.name}>
                                  {team.country.name}
                                </span>
                                {isUserTeam && (
                                  <span className="text-[8px] bg-black text-white px-1.5 py-0.2 rounded font-black uppercase">
                                    YOU
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-2.5 px-1.5 text-center font-bold text-slate-600">{team.mp}</td>
                            <td className="py-2.5 px-1 text-center font-bold text-slate-700">{team.w}</td>
                            <td className="py-2.5 px-1 text-center font-bold text-slate-500">{team.d}</td>
                            <td className="py-2.5 px-1 text-center font-bold text-slate-500">{team.l}</td>
                            <td className="py-2.5 px-1.5 text-center font-bold text-slate-600">{team.gf}</td>
                            <td className="py-2.5 px-1.5 text-center font-bold text-slate-600">{team.ga}</td>
                            <td className={`py-2.5 px-1.5 text-center font-black ${team.gd > 0 ? 'text-emerald-600' : team.gd < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                              {team.gd > 0 ? `+${team.gd}` : team.gd}
                            </td>
                            <td className="py-2.5 px-2 text-center font-black text-black text-sm bg-black/5 rounded-r">
                              {team.pts}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Fixtures & Results Tab - Displays ONLY current day's fixtures across all groups */
        <div className="flex flex-col gap-5">
          {/* Active Round Info Header */}
          <div className="bg-white border-[3px] border-black rounded-[20px] p-3.5 sm:p-4 shadow-[0_5px_0_0_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-amber-300 font-black text-base flex items-center justify-center border-2 border-black shrink-0">
                {isGroupStage ? currentMatchday : <Trophy className="w-5 h-5 text-amber-300" />}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase text-black">
                  {isGroupStage
                    ? `MATCHDAY ${currentMatchday} FIXTURES (ALL GROUPS A–J)`
                    : currentStage === 'round_of_16'
                    ? 'ROUND OF 16 FIXTURES'
                    : currentStage === 'quarter_final'
                    ? 'QUARTER-FINAL FIXTURES'
                    : currentStage === 'semi_final'
                    ? 'SEMI-FINAL FIXTURES'
                    : 'WORLD CUP FINAL'}
                </h2>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isGroupStage
                    ? `Matchday ${currentMatchday} of 3 • 20 Matches across Groups A through J`
                    : 'Knockout Stage • Single-Elimination Matches'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 bg-amber-400 text-black font-black text-xs uppercase rounded-full border border-black shadow-xs">
                {isGroupStage ? `DAY ${currentMatchday} ACTIVE` : 'ACTIVE ROUND'}
              </span>
            </div>
          </div>

          {/* Grid of matches for ONLY the current matchday */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Group Stage Matches: Strictly currentMatchday only */}
            {isGroupStage &&
              groupMatches
                .filter((m) => m.matchday === currentMatchday)
                .sort((a, b) => {
                  if (a.isUserMatch && !b.isUserMatch) return -1;
                  if (!a.isUserMatch && b.isUserMatch) return 1;
                  return a.group.localeCompare(b.group);
                })
                .map((match) => {
                  const isUserPlayable = match.isUserMatch && !match.isCompleted;
                  const homeWon = match.isCompleted && match.homeScore > match.awayScore;
                  const awayWon = match.isCompleted && match.awayScore > match.homeScore;

                  return (
                    <div
                      key={match.id}
                      className={`bg-white border-[3px] rounded-[22px] p-4 shadow-[0_4px_0_0_#000] relative flex flex-col justify-between transition-all ${
                        match.isUserMatch
                          ? 'border-emerald-600 ring-2 ring-emerald-300 shadow-[0_6px_0_0_#059669]'
                          : 'border-black'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500 mb-2.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300 font-black text-slate-700">
                          {match.stageName}
                        </span>
                        {match.isCompleted ? (
                          <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-400 font-black flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>FULL TIME</span>
                          </span>
                        ) : match.isUserMatch ? (
                          <span className="text-amber-900 bg-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500 font-black flex items-center gap-1 animate-pulse">
                            <span>YOUR FIXTURE</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            SCHEDULED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 my-2.5">
                        {/* Home Team */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-7 h-5 rounded-[4px] border border-black overflow-hidden shrink-0 shadow-xs">
                            <LazyFlagImage
                              src={getFlagUrl(match.homeTeam.code)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span
                            className={`text-xs uppercase font-mono font-black truncate ${
                              homeWon ? 'text-emerald-700 font-sans' : 'text-black'
                            }`}
                            title={match.homeTeam.name}
                          >
                            {getCountryAbbr(match.homeTeam)}
                          </span>
                        </div>

                        {/* Score or VS */}
                        <div
                          className={`px-3 py-1.5 border-2 border-black rounded-xl font-black text-xs min-w-[50px] text-center shrink-0 ${
                            match.isCompleted
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {match.isCompleted ? `${match.homeScore} - ${match.awayScore}` : 'VS'}
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                          <span
                            className={`text-xs uppercase font-mono font-black truncate text-right ${
                              awayWon ? 'text-emerald-700 font-sans' : 'text-black'
                            }`}
                            title={match.awayTeam.name}
                          >
                            {getCountryAbbr(match.awayTeam)}
                          </span>
                          <div className="w-7 h-5 rounded-[4px] border border-black overflow-hidden shrink-0 shadow-xs">
                            <LazyFlagImage
                              src={getFlagUrl(match.awayTeam.code)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action for User Match */}
                      {isUserPlayable && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => onPlayMatch(match)}
                          className="mt-3 w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-black font-black text-xs uppercase tracking-wider rounded-[14px] border-2 border-black shadow-[0_3px_0_0_#000] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>PLAY MATCH NOW</span>
                        </motion.button>
                      )}
                    </div>
                  );
                })}

            {/* Knockout Stage Matches: Strictly currentStage only */}
            {!isGroupStage &&
              knockoutMatches
                .filter((m) => m.stage === currentStage)
                .sort((a, b) => {
                  if (a.isUserMatch && !b.isUserMatch) return -1;
                  if (!a.isUserMatch && b.isUserMatch) return 1;
                  return a.id.localeCompare(b.id);
                })
                .map((match) => {
                  const isPlayable = match.isUserMatch && !match.isCompleted && match.homeTeam && match.awayTeam;

                  return (
                    <div
                      key={match.id}
                      className={`bg-white border-[3px] rounded-[22px] p-4 shadow-[0_4px_0_0_#000] relative flex flex-col justify-between ${
                        match.isUserMatch
                          ? 'border-emerald-600 ring-2 ring-emerald-300 shadow-[0_6px_0_0_#059669]'
                          : 'border-black'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500 mb-2">
                        <span className="bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 font-black text-amber-900">
                          {match.stageName}
                        </span>
                        {match.isCompleted ? (
                          <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-400 font-black">
                            FULL TIME
                          </span>
                        ) : match.isUserMatch ? (
                          <span className="text-amber-900 bg-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500 font-black">
                            YOUR FIXTURE
                          </span>
                        ) : (
                          <span className="text-slate-400">UPCOMING</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 my-2.5">
                        {/* Home */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-7 h-5 rounded border border-black overflow-hidden shrink-0 bg-slate-100">
                            {match.homeTeam && (
                              <LazyFlagImage
                                src={getFlagUrl(match.homeTeam.code)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <span
                            className="font-mono font-black text-xs uppercase truncate text-black"
                            title={match.homeTeam?.name}
                          >
                            {match.homeTeam ? getCountryAbbr(match.homeTeam) : 'TBD'}
                          </span>
                        </div>

                        {/* Score */}
                        <div className="px-2.5 py-1 bg-slate-900 text-white border-2 border-black rounded-xl font-black text-xs min-w-[50px] text-center">
                          {match.isCompleted
                            ? `${match.homeScore} - ${match.awayScore}`
                            : 'VS'}
                        </div>

                        {/* Away */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span
                            className="font-mono font-black text-xs uppercase truncate text-black text-right"
                            title={match.awayTeam?.name}
                          >
                            {match.awayTeam ? getCountryAbbr(match.awayTeam) : 'TBD'}
                          </span>
                          <div className="w-7 h-5 rounded border border-black overflow-hidden shrink-0 bg-slate-100">
                            {match.awayTeam && (
                              <LazyFlagImage
                                src={getFlagUrl(match.awayTeam.code)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Penalties indicator if penalty shootout took place */}
                      {match.isCompleted && match.homePenalties !== undefined && match.awayPenalties !== undefined && (
                        <div className="text-[10px] font-black text-center text-amber-700 bg-amber-50 rounded py-0.5 border border-amber-300 mt-1">
                          PENALTIES: {match.homePenalties} - {match.awayPenalties}
                        </div>
                      )}

                      {isPlayable && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => onPlayMatch(match)}
                          className="mt-3 w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-black font-black text-xs uppercase tracking-wider rounded-[14px] border-2 border-black shadow-[0_3px_0_0_#000] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>PLAY MATCH NOW</span>
                        </motion.button>
                      )}
                    </div>
                  );
                })}
          </div>
        </div>
      )}
      {/* Tournament Stage Notification Modal (Text-Only) */}
      <AnimatePresence>
        {showProgressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white border-[4px] border-black rounded-[24px] p-6 sm:p-8 max-w-xl w-full shadow-[0_10px_0_0_#000] relative my-auto text-black flex flex-col gap-4"
            >
              {/* Header Tag */}
              <div className="flex items-center justify-between border-b-2 border-black/15 pb-3">
                <span className="text-[11px] font-black uppercase tracking-widest bg-black text-amber-300 px-3 py-1 rounded-full">
                  {isUserChampion
                    ? 'TOURNAMENT COMPLETED'
                    : isUserEliminated
                    ? 'ELIMINATION NOTICE'
                    : 'STAGE NOTIFICATION'}
                </span>
              </div>

              {/* Stage Title & Status Text */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mb-1">
                  {isUserChampion
                    ? 'WORLD CUP WINNER'
                    : isUserEliminated
                    ? 'TOURNAMENT JOURNEY OVER'
                    : currentStage === 'group'
                    ? `GROUP STAGE • MATCHDAY ${currentMatchday}`
                    : currentStage === 'round_of_16'
                    ? 'ROUND OF 16'
                    : currentStage === 'quarter_final'
                    ? 'QUARTER-FINALS'
                    : currentStage === 'semi_final'
                    ? 'SEMI-FINALS'
                    : 'THE GRAND FINAL'}
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide leading-relaxed">
                  {isUserChampion
                    ? `Congratulations! ${userCountry.name} has won the World Cup!`
                    : isUserEliminated
                    ? `${userCountry.name} has been eliminated from the competition.`
                    : isGroupStage
                    ? `${userCountry.name} is currently ranked #${userRank} in Group ${userGroup} with ${userStanding?.pts || 0} points. Top 2 teams advance to the Round of 16.`
                    : `${userCountry.name} has advanced to the ${currentStage.replace('_', ' ').toUpperCase()}. Single elimination rules apply with penalty shootout on draw.`}
                </p>
              </div>

              {/* Match Details (Text-Only) */}
              {(() => {
                const nextMatch = isGroupStage ? upcomingGroupMatch : upcomingKnockoutMatch;
                if (!nextMatch || isUserEliminated || isUserChampion) return null;

                const homeName = nextMatch.homeTeam ? nextMatch.homeTeam.name : 'TBD';
                const awayName = nextMatch.awayTeam ? nextMatch.awayTeam.name : 'TBD';

                return (
                  <div className="bg-slate-100 border-2 border-black rounded-[16px] p-4 flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      CURRENT FIXTURE
                    </span>
                    <p className="text-base sm:text-lg font-black uppercase text-black">
                      {homeName} vs {awayName}
                    </p>
                    <p className="text-xs font-bold text-slate-600 uppercase">
                      {isGroupStage
                        ? `Group ${userGroup} • Matchday ${currentMatchday}`
                        : `${currentStage.replace('_', ' ').toUpperCase()} • Single-elimination match`}
                    </p>
                  </div>
                );
              })()}

              {/* Action Buttons (Text-Only) */}
              <div className="flex items-center pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowProgressModal(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-black font-black text-xs sm:text-sm uppercase tracking-wider rounded-[16px] border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer text-center"
                >
                  Dismiss
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
