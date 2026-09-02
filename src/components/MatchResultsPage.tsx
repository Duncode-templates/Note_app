import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, RotateCcw, Users, User, Search, Check, X, AlertTriangle, Loader2, Heart, Flame } from 'lucide-react';
import { Country, getFlagUrl, getCountryAbbr, COUNTRIES_DATA } from '../data/countries';
import { CompletedRoundData } from '../data/tournamentData';
import { OnlineMatchRoom } from '../types';
import { onlineMatchManager } from '../utils/onlineMatchManager';
import LazyFlagImage from './LazyFlagImage';
import TrophyImage from './TrophyImage';
import { getStickerAvatarUrl } from '../data/botProfiles';
import { useTranslation } from '../utils/i18n';

export interface MatchStats {
  playerShots: number;
  aiShots: number;
  playerGoals: number;
  aiGoals: number;
  playerWoodwork: number;
  aiWoodwork: number;
}

interface MatchResultsPageProps {
  country: Country;
  opponentCountry?: Country;
  homeScore: number;
  awayScore: number;
  homePenalties?: number;
  awayPenalties?: number;
  matchStats: MatchStats;
  titleMode: string;
  roundData?: CompletedRoundData;
  onlineMatchRoom?: OnlineMatchRoom | null;
  isOpponentDisconnected?: boolean;
  localPlayerName?: string;
  localPlayerProfilePicture?: string | null;
  oppPlayerName?: string;
  oppPlayerProfilePicture?: string | null;
  onPlayAgain?: () => void;
  onReselectTeam?: () => void;
  onOpponentCountryChange?: (newCountry: Country) => void;
  onLocalCountryChange?: (newCountry: Country) => void;
  onReturnToMenu: () => void;
  onReturnToTournament?: () => void;
  onReturnToDivisions?: () => void;
}

export default function MatchResultsPage({
  country: initialCountry,
  opponentCountry: initialOpponentCountry,
  homeScore,
  awayScore,
  homePenalties,
  awayPenalties,
  matchStats,
  titleMode,
  roundData,
  onlineMatchRoom,
  isOpponentDisconnected: initialOpponentDisconnected = false,
  localPlayerName: propLocalPlayerName,
  localPlayerProfilePicture: propLocalPlayerProfilePicture,
  oppPlayerName: propOppPlayerName,
  oppPlayerProfilePicture: propOppPlayerProfilePicture,
  onPlayAgain,
  onReselectTeam,
  onOpponentCountryChange,
  onLocalCountryChange,
  onReturnToMenu,
  onReturnToTournament,
  onReturnToDivisions,
}: MatchResultsPageProps) {
  const { t } = useTranslation();
  const [currentLocalCountry, setCurrentLocalCountry] = useState<Country>(initialCountry);
  const [currentOppCountry, setCurrentOppCountry] = useState<Country | undefined>(initialOpponentCountry);
  const isBotOpponent = onlineMatchManager.isCurrentRoomBotMatch() || Boolean(
    onlineMatchRoom?.guest?.id?.toLowerCase().startsWith('bot_') ||
    onlineMatchRoom?.host?.id?.toLowerCase().startsWith('bot_')
  );

  const [isOpponentOffline, setIsOpponentOffline] = useState<boolean>(
    initialOpponentDisconnected ||
    isBotOpponent ||
    Boolean(
      onlineMatchRoom?.isOpponentDisconnected ||
      onlineMatchRoom?.status === 'opponent_left' ||
      onlineMatchManager.currentRoom?.isOpponentDisconnected ||
      onlineMatchManager.currentRoom?.status === 'opponent_left'
    )
  );

  // Rematch state machine
  const [rematchStatus, setRematchStatus] = useState<'idle' | 'requesting' | 'received_invitation' | 'accepted' | 'declined'>('idle');
  const [rematchNotice, setRematchNotice] = useState<string | null>(null);

  // Change team modal state
  const [showTeamPicker, setShowTeamPicker] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [teamChangeAlert, setTeamChangeAlert] = useState<string | null>(null);

  const isOnlineMatch = Boolean(
    onlineMatchRoom ||
    titleMode.toLowerCase().includes('online') ||
    titleMode.toLowerCase().includes('1v1')
  );

  const isLocalHost = onlineMatchRoom
    ? (onlineMatchManager.currentRoom
        ? (onlineMatchManager.currentRoom.host.id === onlineMatchManager.localPlayerId || onlineMatchManager.currentRoom.host.isLocal)
        : (onlineMatchRoom.host.id === onlineMatchManager.localPlayerId || onlineMatchRoom.host.isLocal))
    : true;

  const effectiveLocalProfilePic = propLocalPlayerProfilePicture ?? (onlineMatchManager.localPlayerProfilePictureUrl || null);
  const effectiveLocalName = propLocalPlayerName || onlineMatchManager.localPlayerName || 'You';
  const finalLocalProfilePic = effectiveLocalProfilePic || getStickerAvatarUrl(effectiveLocalName || 'You', 0);

  const oppCountryCode = currentOppCountry ? currentOppCountry.code : 'fr';
  const oppCountryName = currentOppCountry ? currentOppCountry.name : 'France';

  const effectiveOppProfilePic = propOppPlayerProfilePicture ?? (
    isOnlineMatch
      ? (isLocalHost
          ? (onlineMatchManager.currentRoom?.guest?.profilePictureUrl || onlineMatchRoom?.guest?.profilePictureUrl || null)
          : (onlineMatchManager.currentRoom?.host?.profilePictureUrl || onlineMatchRoom?.host?.profilePictureUrl || null))
      : null
  );

  const effectiveOppName = propOppPlayerName || (
    isOnlineMatch
      ? (isLocalHost
          ? (onlineMatchManager.currentRoom?.guest?.name || onlineMatchRoom?.guest?.name || 'Online Opponent')
          : (onlineMatchManager.currentRoom?.host?.name || onlineMatchRoom?.host?.name || 'Room Host'))
      : oppCountryName
  );
  const finalOppProfilePic = effectiveOppProfilePic || getStickerAvatarUrl(effectiveOppName || 'Opponent', 1);

  // Keep isOpponentOffline synchronized if prop updates or online room status changes
  useEffect(() => {
    if (
      initialOpponentDisconnected ||
      Boolean(
        onlineMatchRoom?.isOpponentDisconnected ||
        onlineMatchRoom?.status === 'opponent_left' ||
        onlineMatchManager.currentRoom?.isOpponentDisconnected ||
        onlineMatchManager.currentRoom?.status === 'opponent_left'
      )
    ) {
      setIsOpponentOffline(true);
    }
  }, [initialOpponentDisconnected, onlineMatchRoom]);

  const userMatchData = roundData?.userMatch;
  const effectiveHomePen = homePenalties !== undefined ? homePenalties : userMatchData?.homePenalties;
  const effectiveAwayPen = awayPenalties !== undefined ? awayPenalties : userMatchData?.awayPenalties;
  const hasPenalties = effectiveHomePen !== undefined && effectiveAwayPen !== undefined;

  const isPlayerWinner = hasPenalties
    ? (effectiveHomePen || 0) > (effectiveAwayPen || 0)
    : homeScore > awayScore;
  const isDraw = !hasPenalties && homeScore === awayScore;
  const isSurvival = Boolean(
    titleMode.toLowerCase().includes('survival') ||
    onlineMatchRoom?.gameMode === 'survival'
  );
  const isTournament = Boolean(roundData || (onReturnToTournament && (titleMode.toLowerCase().includes('world cup') || titleMode.toLowerCase().includes('group') || titleMode.toLowerCase().includes('tournament'))));
  const isDivision = Boolean(onReturnToDivisions || titleMode.toLowerCase().includes('division'));

  const stageTitle = roundData?.stageTitle || titleMode;
  const otherMatches = roundData?.otherMatches || [];

  // Online Multiplayer Event Listeners
  useEffect(() => {
    if (!isOnlineMatch) return;

    const handleOpponentLeft = () => {
      setIsOpponentOffline(true);
      setRematchStatus('idle');
      setRematchNotice('Your opponent has left the match.');
    };

    const unsubDisconnect = onlineMatchManager.on('opponent_disconnected', handleOpponentLeft);
    const unsubOpponentLeft = onlineMatchManager.on('opponent_left', handleOpponentLeft);
    const unsubPlayerLeft = onlineMatchManager.on('player_left', handleOpponentLeft);
    const unsubRoomUpdated = onlineMatchManager.on('room_updated', (payload) => {
      if (payload.room?.isOpponentDisconnected || payload.room?.status === 'opponent_left') {
        handleOpponentLeft();
      }
    });

    const unsubRematchReq = onlineMatchManager.on('rematch_requested', (payload) => {
      const isHost = onlineMatchRoom?.host.isLocal ?? onlineMatchManager.currentRoom?.host.isLocal;
      const myRole = isHost ? 'host' : 'guest';
      if (payload.role !== myRole) {
        setRematchStatus('received_invitation');
      }
    });

    const unsubRematchAcc = onlineMatchManager.on('rematch_accepted', () => {
      setRematchStatus('accepted');
      if (onPlayAgain) {
        onPlayAgain();
      }
    });

    const unsubRematchDec = onlineMatchManager.on('rematch_declined', () => {
      setRematchStatus('declined');
      setRematchNotice('Opponent declined rematch request.');
      setTimeout(() => {
        setRematchStatus('idle');
      }, 4000);
    });

    const unsubTeamChanged = onlineMatchManager.on('team_changed', (payload) => {
      const isHost = onlineMatchRoom?.host.isLocal ?? onlineMatchManager.currentRoom?.host.isLocal;
      const myRole = isHost ? 'host' : 'guest';
      if (payload.role !== myRole && payload.countryCode) {
        const found = COUNTRIES_DATA.find((c) => c.code.toLowerCase() === payload.countryCode.toLowerCase());
        if (found) {
          setCurrentOppCountry(found);
          if (onOpponentCountryChange) onOpponentCountryChange(found);
          setTeamChangeAlert(`Opponent switched team to ${found.name}!`);
          setTimeout(() => setTeamChangeAlert(null), 3500);
        }
      }
    });

    return () => {
      unsubDisconnect();
      unsubOpponentLeft();
      unsubPlayerLeft();
      unsubRoomUpdated();
      unsubRematchReq();
      unsubRematchAcc();
      unsubRematchDec();
      unsubTeamChanged();
    };
  }, [isOnlineMatch, onlineMatchRoom, onPlayAgain, onOpponentCountryChange]);

  const handleRequestRematch = () => {
    if (isOpponentOffline) return;
    if (isOnlineMatch) {
      setRematchStatus('requesting');
      onlineMatchManager.requestRematch();
    } else if (onPlayAgain) {
      onPlayAgain();
    }
  };

  const handleAcceptRematch = () => {
    setRematchStatus('accepted');
    onlineMatchManager.acceptRematch();
  };

  const handleDeclineRematch = () => {
    setRematchStatus('idle');
    onlineMatchManager.declineRematch();
  };

  const handleSelectNewTeam = (newTeam: Country) => {
    setCurrentLocalCountry(newTeam);
    if (onLocalCountryChange) onLocalCountryChange(newTeam);
    setShowTeamPicker(false);

    if (isOnlineMatch) {
      onlineMatchManager.changeTeam(newTeam.code);
    }
  };

  const filteredCountries = COUNTRIES_DATA.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.abbr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-full bg-gradient-to-b from-sky-400 via-blue-600 to-indigo-900 text-slate-900 flex flex-col p-3 sm:p-6 md:p-8 select-none relative overflow-x-hidden pb-24 sm:pb-32 touch-pan-y">
      
      {/* Background Stadium Glow Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-emerald-400/10 rounded-full blur-3xl" />
      </div>

      {/* Header Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-10 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
            {isTournament ? (
              <TrophyImage className="w-full h-full" />
            ) : isOnlineMatch ? (
              isOpponentOffline ? (
                <div className="w-full h-full rounded-full bg-rose-500 border-2 border-black flex items-center justify-center text-white font-black text-xl shadow-[0_2px_0_0_#000]">
                  <WifiOff className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-emerald-400 border-2 border-black flex items-center justify-center text-black font-black text-xl shadow-[0_2px_0_0_#000]">
                  <Wifi className="w-5 h-5 sm:w-6 sm:h-6 text-black stroke-[3]" />
                </div>
              )
            ) : (
              <div className="w-full h-full rounded-full bg-amber-400 border-2 border-black flex items-center justify-center text-black font-black text-xl shadow-[0_2px_0_0_#000]">
                ★
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black uppercase tracking-wider text-black drop-shadow-xs">
                {isSurvival
                  ? 'ONLINE SURVIVAL 1v1 DUEL'
                  : isTournament
                  ? (stageTitle || 'WORLD CUP TOURNAMENT')
                  : isDivision
                  ? (stageTitle || 'DIVISION LEAGUE MATCH')
                  : isOnlineMatch
                  ? 'ONLINE 1v1 MATCH'
                  : 'QUICK PLAY MATCH'}
              </h2>
              {isOnlineMatch && (
                isOpponentOffline ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 border border-black text-[10px] font-black uppercase tracking-wider text-white shadow-xs flex items-center gap-1.5">
                    <WifiOff className="w-3 h-3 text-white stroke-[2.5]" />
                    OPPONENT OFFLINE
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 border border-black text-[10px] font-black uppercase tracking-wider text-black shadow-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping inline-block" />
                    ONLINE
                  </span>
                )
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-800 font-bold uppercase tracking-widest">
              {isSurvival
                ? '100s Time-Up / Survival Duel Results'
                : isTournament
                ? 'Full Time Results & Round Summary'
                : isDivision
                ? 'Full Time Division League Results'
                : isOnlineMatch
                ? (isOpponentOffline
                    ? `Opponent Left • Room #${onlineMatchRoom?.roomId || onlineMatchManager.currentRoom?.roomId || 'ONLINE'}`
                    : `P2P & Cloud Synced Match Results • Room #${onlineMatchRoom?.roomId || onlineMatchManager.currentRoom?.roomId || 'ONLINE'}`)
                : 'Full Time Match Results'}
            </p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-6xl mx-auto flex flex-col items-center gap-5 sm:gap-7 z-10 my-2">
        
        {/* Opponent Disconnected / Offline Notice Banner */}
        {isOpponentOffline && isOnlineMatch && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-rose-500 border-[3.5px] border-black rounded-[22px] p-3.5 sm:p-4 shadow-[0_6px_0_0_#000] text-white flex items-center justify-center gap-3 text-center"
          >
            <WifiOff className="w-6 h-6 shrink-0 text-white stroke-[3]" />
            <div className="flex flex-col text-left sm:text-center">
              <span className="font-black text-sm sm:text-base uppercase tracking-wider">
                OPPONENT HAS LEFT THE MATCH
              </span>
              <span className="text-xs font-bold text-rose-100">
                Your opponent disconnected or returned to the main menu. Rematch is unavailable.
              </span>
            </div>
          </motion.div>
        )}

        {/* Live Team Change Toast Notification */}
        <AnimatePresence>
          {teamChangeAlert && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-md bg-amber-300 border-[3px] border-black rounded-full px-5 py-2 shadow-[0_4px_0_0_#000] text-black font-black text-xs sm:text-sm uppercase tracking-wider text-center"
            >
              ⚡ {teamChangeAlert}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rematch Notice Alert */}
        <AnimatePresence>
          {rematchNotice && !isOpponentOffline && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="bg-slate-900 border-[3px] border-black text-amber-300 rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider shadow-[0_4px_0_0_#000]"
            >
              {rematchNotice}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outcome Banner */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className="flex flex-col items-center text-center gap-1.5"
        >
          <div
            className={`px-6 py-2 rounded-full border-[3px] border-black shadow-[0_4px_0_0_#000] font-black text-xl sm:text-3xl uppercase tracking-wider ${
              isPlayerWinner
                ? 'bg-amber-300 text-black'
                : isDraw
                ? 'bg-sky-200 text-black'
                : 'bg-rose-400 text-white'
            }`}
          >
            {hasPenalties
              ? isPlayerWinner
                ? `★ ${t('result.wonOnPenalties', 'WON ON PENALTIES')} (${effectiveHomePen}-${effectiveAwayPen})! ★`
                : `${t('result.lostOnPenalties', 'LOST ON PENALTIES')} (${effectiveHomePen}-${effectiveAwayPen})`
              : isSurvival
              ? isPlayerWinner
                ? `★ ${t('result.survivalVictory', 'SURVIVAL VICTORY!')} ★`
                : isDraw
                ? t('result.draw', 'HONOURS EVEN (TIE)')
                : t('result.survivalDefeat', 'SURVIVAL DEFEAT')
              : isPlayerWinner
              ? `★ ${t('result.victory', 'MATCH VICTORY!')} ★`
              : isDraw
              ? t('result.draw', 'HONOURS EVEN (DRAW)')
              : t('result.defeat', 'MATCH DEFEAT')}
          </div>
          {isSurvival && (
            <div className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider bg-white/90 px-4 py-1 rounded-full border-2 border-black shadow-2xs">
              {isDraw
                ? `100s • ${t('result.draw', 'Tie - Equal Lives')}: ${homeScore} - ${awayScore}`
                : isPlayerWinner
                ? `${t('result.victory', 'Won')} (${homeScore} vs ${awayScore} ${t('survival.livesRemaining', 'Lives')})`
                : `${t('result.defeat', 'Defeated')} (${homeScore} vs ${awayScore} ${t('survival.livesRemaining', 'Lives')})`}
            </div>
          )}
        </motion.div>

        {/* HERO SCOREBOARD CARD: YOUR MATCH */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-full bg-white text-black border-[4px] border-black rounded-[28px] sm:rounded-[36px] p-5 sm:p-7 shadow-[0_10px_0_0_#000] relative overflow-hidden"
        >
          {/* Top Tag */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black/10">
            <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnlineMatch
                    ? isOpponentOffline
                      ? 'bg-rose-500'
                      : 'bg-emerald-500 animate-ping'
                    : isDivision
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                } inline-block`}
              />
              {isSurvival
                ? t('survival.title', 'ONLINE 1V1 SURVIVAL DUEL • 100S')
                : isTournament
                ? t('tournament.fixture', 'WORLD CUP FIXTURE')
                : isDivision
                ? (stageTitle ? stageTitle.toUpperCase() : t('mode.division', 'DIVISION MATCH'))
                : isOnlineMatch
                ? isOpponentOffline
                  ? `${t('common.online', 'ONLINE')} • ${t('status.disconnected', 'OPPONENT DISCONNECTED')}`
                  : `${t('common.online', 'ONLINE MATCH')} • ROOM #${onlineMatchRoom?.roomId || onlineMatchManager.currentRoom?.roomId || 'LIVE'}`
                : t('mode.quickPlay', 'QUICK MATCH')}
            </span>
            {hasPenalties && (
              <span className="px-3 py-1 bg-amber-400 text-black border border-black rounded-full font-black text-[11px] uppercase tracking-wider shadow-2xs">
                {t('hud.penaltyShootout', 'PENALTY SHOOTOUT')}: {effectiveHomePen} - {effectiveAwayPen}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 sm:gap-6 md:gap-8">
            {/* Home Team (Player) */}
            <div className="flex flex-col items-center text-center flex-1 gap-2 sm:gap-3">
              <div className="w-16 h-16 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-[18px] sm:rounded-[22px] border-[3.5px] border-black overflow-hidden shadow-[0_4px_0_0_#000] shrink-0 bg-slate-100 flex items-center justify-center">
                <LazyFlagImage
                  src={getFlagUrl(currentLocalCountry.code)}
                  alt={currentLocalCountry.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-black text-base sm:text-xl md:text-2xl uppercase tracking-wider text-black font-mono truncate max-w-[120px] sm:max-w-[160px] md:max-w-[190px]">
                  {getCountryAbbr(currentLocalCountry)}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-900 bg-emerald-300 px-2.5 py-0.5 rounded-full border border-black shadow-2xs">
                    {t('common.you', 'YOU')}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Number Display */}
            <div className="flex flex-col items-center shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-5 px-4 sm:px-8 py-3 sm:py-4 bg-amber-400 border-[3.5px] border-black rounded-[22px] sm:rounded-[30px] shadow-[0_6px_0_0_#000]">
                <div className="flex items-center gap-1">
                  <span className="font-mono font-black text-3xl sm:text-6xl md:text-7xl text-black">
                    {homeScore}
                  </span>
                  {isSurvival && (
                    <Heart className="w-5 h-5 sm:w-7 sm:h-7 text-rose-600 fill-rose-600 shrink-0" />
                  )}
                </div>
                <span className="font-black text-2xl sm:text-5xl text-black">
                  -
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-black text-3xl sm:text-6xl md:text-7xl text-black">
                    {awayScore}
                  </span>
                  {isSurvival && (
                    <Heart className="w-5 h-5 sm:w-7 sm:h-7 text-rose-600 fill-rose-600 shrink-0" />
                  )}
                </div>
              </div>
              {hasPenalties ? (
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-black bg-white px-3 py-1 rounded-full border-2 border-black mt-2 shadow-2xs">
                  ({effectiveHomePen} - {effectiveAwayPen} PEN)
                </span>
              ) : isSurvival ? (
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-black mt-2 bg-amber-200 px-3 py-0.5 rounded-full border border-black shadow-2xs">
                  {t('survival.livesRemaining', 'FINAL REMAINING LIVES')}
                </span>
              ) : (
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-700 mt-2">
                  {t('result.finalScore', 'FINAL SCORE')}
                </span>
              )}
            </div>

            {/* Away Team (Opponent) */}
            <div className="flex flex-col items-center text-center flex-1 gap-2 sm:gap-3">
              <div className="w-16 h-16 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-[18px] sm:rounded-[22px] border-[3.5px] border-black overflow-hidden shadow-[0_4px_0_0_#000] shrink-0 bg-slate-100 flex items-center justify-center">
                <LazyFlagImage
                  src={getFlagUrl(oppCountryCode)}
                  alt={oppCountryName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-black text-base sm:text-xl md:text-2xl uppercase tracking-wider text-black font-mono truncate max-w-[120px] sm:max-w-[160px] md:max-w-[190px]">
                  {getCountryAbbr(currentOppCountry || oppCountryCode)}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                  <span
                    className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${
                      isOnlineMatch
                        ? isOpponentOffline
                          ? 'text-rose-950 bg-rose-200 border-rose-500'
                          : 'text-slate-800 bg-slate-200 border-slate-400'
                        : 'text-slate-700 bg-slate-200 border-slate-400'
                    }`}
                  >
                    {isOnlineMatch
                      ? isOpponentOffline
                        ? `${t('common.opponent', 'OPPONENT')} (${t('status.left', 'LEFT')})`
                        : t('common.opponent', 'OPPONENT')
                      : t('common.opponent', 'OPPONENT')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Shot Stats Summary Bar */}
          <div className="mt-6 pt-4 border-t-2 border-black/10 flex flex-wrap items-center justify-around gap-4 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-black">{t('stats.shots', 'Shots')}:</span>
              <span>{matchStats.playerShots} - {matchStats.aiShots}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-black">{t('stats.goals', 'Goals')}:</span>
              <span>{matchStats.playerGoals} - {matchStats.aiGoals}</span>
            </div>
            {isDivision && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-black rounded-full shadow-2xs">
                <span className="font-black text-black">{t('division.reward', 'Division Reward')}:</span>
                <span className="font-black text-amber-900 font-mono">
                  {isPlayerWinner ? '+3 PTS • +10 🪙' : isDraw ? '+1 PT • 0 🪙' : '0 🪙 (Ranked Loss Penalty)'}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ALL OTHER MATCH RESULTS GRID */}
        {otherMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="w-full bg-white/95 border-[3.5px] border-black rounded-[26px] p-4 sm:p-6 shadow-[0_8px_0_0_#000]"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black/10">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 font-black text-lg">★</span>
                <h3 className="font-black text-sm sm:text-base uppercase tracking-wider text-black">
                  OTHER ROUND FIXTURES &amp; RESULTS ({otherMatches.length} MATCHES)
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherMatches.map((m) => {
                const isHomeWinner = m.homeScore > m.awayScore || (m.homePenalties && m.awayPenalties && m.homePenalties > m.awayPenalties);
                const isAwayWinner = m.awayScore > m.homeScore || (m.homePenalties && m.awayPenalties && m.awayPenalties > m.homePenalties);

                return (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-50 hover:bg-white border-2 border-black rounded-[16px] shadow-xs flex flex-col gap-2 transition-all"
                  >
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                      {m.stageName}
                    </span>

                    <div className="flex items-center justify-between gap-2">
                      <div className={`flex items-center gap-2 flex-1 min-w-0 ${isHomeWinner ? 'font-black text-black' : 'text-slate-700 font-bold'}`}>
                        <div className="w-5 h-3.5 rounded border border-black overflow-hidden bg-slate-200 shrink-0">
                          <LazyFlagImage src={getFlagUrl(m.homeTeam.code)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs uppercase font-mono font-black">{getCountryAbbr(m.homeTeam)}</span>
                      </div>

                      <div className="px-2 py-0.5 bg-black text-amber-300 font-mono font-black text-xs rounded-md shrink-0">
                        {m.homeScore} : {m.awayScore}
                        {m.homePenalties !== undefined && m.awayPenalties !== undefined && (
                          <span className="text-[9px] text-amber-200 block text-center font-sans font-bold">
                            ({m.homePenalties}-{m.awayPenalties}p)
                          </span>
                        )}
                      </div>

                      <div className={`flex items-center justify-end gap-2 flex-1 min-w-0 ${isAwayWinner ? 'font-black text-black' : 'text-slate-700 font-bold'}`}>
                        <span className="text-xs uppercase font-mono font-black text-right">{getCountryAbbr(m.awayTeam)}</span>
                        <div className="w-5 h-3.5 rounded border border-black overflow-hidden bg-slate-200 shrink-0">
                          <LazyFlagImage src={getFlagUrl(m.awayTeam.code)} alt="" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* BOTTOM ACTION BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 my-2"
        >
          {isTournament && onReturnToTournament ? (
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97, y: 4 }}
              onClick={onReturnToTournament}
              className="w-full sm:w-auto min-w-[280px] py-4 px-8 rounded-[24px] bg-emerald-400 hover:bg-emerald-300 active:scale-98 text-black font-black text-base sm:text-lg uppercase tracking-wider border-[3.5px] border-black shadow-[0_7px_0_0_#000] cursor-pointer transition-all flex items-center justify-center gap-3"
            >
              <span>{t('tournament.continue', 'CONTINUE TO TOURNAMENT')} →</span>
            </motion.button>
          ) : onReturnToDivisions ? (
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97, y: 4 }}
              onClick={onReturnToDivisions}
              className="w-full sm:w-auto min-w-[280px] py-4 px-8 rounded-[24px] bg-amber-400 hover:bg-amber-300 active:scale-98 text-black font-black text-base sm:text-lg uppercase tracking-wider border-[3.5px] border-black shadow-[0_7px_0_0_#000] cursor-pointer transition-all flex items-center justify-center gap-3"
            >
              <span>{t('division.return', 'RETURN TO DIVISION HUB')} →</span>
            </motion.button>
          ) : (
            <>
              {/* Play Again Button */}
              <motion.button
                whileHover={!isOpponentOffline ? { scale: 1.03, y: -2 } : {}}
                whileTap={!isOpponentOffline ? { scale: 0.97, y: 4 } : {}}
                disabled={isOpponentOffline || rematchStatus === 'requesting'}
                onClick={handleRequestRematch}
                className={`w-full sm:w-auto min-w-[220px] py-4 px-6 rounded-[24px] font-black text-base uppercase tracking-wider border-[3.5px] border-black shadow-[0_6px_0_0_#000] transition-all flex items-center justify-center gap-2 ${
                  isOpponentOffline
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                    : rematchStatus === 'requesting'
                    ? 'bg-amber-300 text-black cursor-wait animate-pulse'
                    : 'bg-emerald-400 hover:bg-emerald-300 active:scale-98 text-black cursor-pointer'
                }`}
                title={isOpponentOffline ? 'Opponent has left the game' : 'Play rematch'}
              >
                {rematchStatus === 'requesting' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('match.waitingOpponent', 'WAITING FOR OPPONENT...')}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                    <span>{isOpponentOffline ? t('match.playAgainUnavailable', 'PLAY AGAIN UNAVAILABLE') : `↻ ${t('btn.playAgain', 'PLAY AGAIN')}`}</span>
                  </>
                )}
              </motion.button>

              {/* Change Teams Button */}
              {!isTournament && (
                <motion.button
                  whileHover={!isOpponentOffline ? { scale: 1.02, y: -1 } : {}}
                  whileTap={!isOpponentOffline ? { scale: 0.97, y: 2 } : {}}
                  disabled={isOpponentOffline}
                  onClick={() => {
                    if (isOnlineMatch) {
                      setShowTeamPicker(true);
                    } else if (onReselectTeam) {
                      onReselectTeam();
                    }
                  }}
                  className={`w-full sm:w-auto py-4 px-6 rounded-[24px] font-black text-sm uppercase tracking-wider border-[3.5px] border-black shadow-[0_6px_0_0_#000] transition-all flex items-center justify-center gap-2 ${
                    isOpponentOffline
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                      : 'bg-amber-400 hover:bg-amber-300 active:scale-98 text-black cursor-pointer'
                  }`}
                >
                  <Users className="w-4 h-4 stroke-[2.5]" />
                  <span>{t('match.changeTeams', 'CHANGE TEAMS')}</span>
                </motion.button>
              )}
            </>
          )}

          {/* Main Menu Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97, y: 2 }}
            onClick={onReturnToMenu}
            className={`w-full sm:w-auto py-4 px-6 rounded-[24px] font-black text-sm uppercase tracking-wider border-[3.5px] border-black shadow-[0_6px_0_0_#000] cursor-pointer transition-all flex items-center justify-center gap-2 ${
              isOpponentOffline
                ? 'bg-amber-400 hover:bg-amber-300 active:scale-98 text-black'
                : 'bg-white hover:bg-slate-100 active:scale-98 text-black'
            }`}
          >
            <span>← {t('btn.returnMenu', 'MAIN MENU')}</span>
          </motion.button>
        </motion.div>

      </main>

      {/* Rematch Request Modal (Received from opponent) */}
      <AnimatePresence>
        {rematchStatus === 'received_invitation' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="bg-white border-[4px] border-black rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-[0_12px_0_0_#000] text-black relative flex flex-col items-center text-center gap-5"
            >
              <div className="w-16 h-16 rounded-full bg-amber-400 border-[3.5px] border-black flex items-center justify-center text-2xl font-black shadow-sm animate-bounce">
                ★
              </div>

              <div className="flex flex-col gap-1.5">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black">
                  {t('rematch.invitationTitle', 'REMATCH INVITATION!')}
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  {t('rematch.invitationDesc', 'Your opponent wants to play another 1v1 match. Do you accept?')}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  onClick={handleDeclineRematch}
                  className="flex-1 py-3.5 px-4 rounded-[20px] bg-slate-200 hover:bg-slate-300 active:scale-95 text-black font-black text-xs sm:text-sm uppercase tracking-wider border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer transition-all"
                >
                  {t('rematch.decline', 'DECLINE')}
                </button>
                <button
                  onClick={handleAcceptRematch}
                  className="flex-1 py-3.5 px-4 rounded-[20px] bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-black font-black text-xs sm:text-sm uppercase tracking-wider border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer transition-all"
                >
                  {t('rematch.accept', 'ACCEPT REMATCH')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Team Selection Modal (Online Change Teams) */}
      <AnimatePresence>
        {showTeamPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="bg-white border-[4px] border-black rounded-[32px] p-5 sm:p-7 max-w-2xl w-full max-h-[85vh] shadow-[0_12px_0_0_#000] text-black relative flex flex-col gap-4 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                    {t('team.selectNew', 'SELECT NEW TEAM')}
                  </h3>
                  <p className="text-xs font-bold text-slate-600">
                    {t('team.selectNewDesc', 'Switch your national team for the upcoming match')}
                  </p>
                </div>
                <button
                  onClick={() => setShowTeamPicker(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-500 hover:text-white border-2 border-black flex items-center justify-center font-black transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder={t('search.countries', 'Search countries...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-2 border-black rounded-[16px] text-xs sm:text-sm font-bold uppercase tracking-wider placeholder:normal-case placeholder:text-slate-400 outline-none focus:bg-white"
                />
              </div>

              {/* Country List Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 overflow-y-auto p-1 max-h-[45vh]">
                {filteredCountries.map((c) => {
                  const isSelected = c.code === currentLocalCountry.code;

                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectNewTeam(c)}
                      className={`p-2.5 rounded-[18px] border-2 border-black flex flex-col items-center gap-2 transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-amber-300 shadow-[0_3px_0_0_#000] scale-102 font-black'
                          : 'bg-slate-50 hover:bg-slate-100 active:scale-98'
                      }`}
                    >
                      <div className="w-12 h-8 rounded border border-black overflow-hidden bg-slate-200 shrink-0">
                        <LazyFlagImage src={getFlagUrl(c.code)} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col items-center min-w-0">
                        <span className="text-xs font-black uppercase tracking-tight truncate w-full">
                          {c.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600 font-bold">
                          {c.abbr}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full text-center text-xs font-bold text-white/80 uppercase tracking-widest pt-4 pb-2 z-10">
        {isTournament
          ? 'Free Kick Legends • World Cup Tournament'
          : isDivision
          ? 'Free Kick Legends • Divisions League'
          : isOnlineMatch
          ? 'Free Kick Legends • Online 1v1 Multiplayer'
          : 'Free Kick Legends • Quick Play'}
      </footer>
    </div>
  );
}
