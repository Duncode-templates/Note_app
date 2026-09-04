import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Crosshair,
  Timer,
  Users,
  Search,
  CheckCircle2,
  Copy,
  Flame,
  ShieldCheck,
  Sparkles,
  WifiOff,
  User,
  UserX,
  Crown,
  Zap,
} from 'lucide-react';
import { COUNTRIES_DATA, Country, getFlagUrl } from '../data/countries';
import LazyFlagImage from './LazyFlagImage';
import { onlineMatchManager } from '../utils/onlineMatchManager';
import { crazyGamesSDK } from '../utils/crazyGamesSDK';
import { OnlineMatchRoom } from '../types';
import { playKickSound } from '../utils/mediaPreloader';
import { getBotInstinctCountry, getBotProfileById, getBotProfileByUsername, getRandomBotProfile } from '../data/botProfiles';
import { useTranslation } from '../utils/i18n';

interface OnlineCountrySelectionPageProps {
  room: OnlineMatchRoom;
  onBack: () => void;
  onMatchStart: (myCountry: Country, opponentCountry: Country, room: OnlineMatchRoom) => void;
}

export default function OnlineCountrySelectionPage({
  room: initialRoom,
  onBack,
  onMatchStart,
}: OnlineCountrySelectionPageProps) {
  const { t } = useTranslation();
  const [room, setRoom] = useState<OnlineMatchRoom>(initialRoom || onlineMatchManager.currentRoom);
  const roomRef = useRef<OnlineMatchRoom>(initialRoom || onlineMatchManager.currentRoom);
  if (room) {
    roomRef.current = room;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState(false);
  const [disconnectCountdown, setDisconnectCountdown] = useState(5);

  const isHost = Boolean(room?.host?.isLocal ?? true);
  const hasLaunchedRef = useRef(false);
  const countdownTimerRef = useRef<any>(null);
  const countdownStartTimeRef = useRef<number | null>(null);

  // Handle auto-return when opponent disconnects
  useEffect(() => {
    let timer: any;
    if (isOpponentDisconnected && !hasLaunchedRef.current) {
      timer = setInterval(() => {
        setDisconnectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onlineMatchManager.leaveRoom();
            onBack();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpponentDisconnected, onBack]);

  // Window unload / close listener
  useEffect(() => {
    const handleUnload = () => {
      onlineMatchManager.leaveRoom();
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);

  // Resolve country codes
  const myCountryCode = isHost ? room?.host?.countryCode : room?.guest?.countryCode;
  const oppCountryCode = isHost ? room?.guest?.countryCode : room?.host?.countryCode;

  const myCountry = useMemo(() => {
    if (!myCountryCode) return null;
    return COUNTRIES_DATA.find((c) => c.code.toUpperCase() === myCountryCode.toUpperCase()) || null;
  }, [myCountryCode]);

  const opponentCountry = useMemo(() => {
    if (!oppCountryCode) return null;
    return COUNTRIES_DATA.find((c) => c.code.toUpperCase() === oppCountryCode.toUpperCase()) || null;
  }, [oppCountryCode]);

  const myPlayerName = isHost
    ? room?.host?.name || onlineMatchManager.localPlayerName || 'You (Host)'
    : room?.guest?.name || onlineMatchManager.localPlayerName || 'You (Guest)';

  const oppPlayerName = isHost
    ? room?.guest?.name || 'Online Opponent'
    : room?.host?.name || 'Room Host';

  const myProfilePicture = isHost
    ? room?.host?.profilePictureUrl || onlineMatchManager.localPlayerProfilePictureUrl
    : room?.guest?.profilePictureUrl || onlineMatchManager.localPlayerProfilePictureUrl;

  const oppProfilePicture = isHost
    ? room?.guest?.profilePictureUrl
    : room?.host?.profilePictureUrl;

  // Final match launch function
  const launchMatch = useCallback(() => {
    if (hasLaunchedRef.current || isOpponentDisconnected) return;
    hasLaunchedRef.current = true;

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    const currentR = roomRef.current || room || onlineMatchManager.currentRoom;
    if (!currentR || !currentR.host) return;
    const isCurrentHost = currentR.host.isLocal;

    const hostCode = currentR.host.countryCode || 'br';
    const guestCode = currentR.guest?.countryCode || 'ar';

    const hostC = COUNTRIES_DATA.find((c) => c.code.toLowerCase() === hostCode.toLowerCase() || c.abbr.toLowerCase() === hostCode.toLowerCase()) || COUNTRIES_DATA[0];
    const guestC = COUNTRIES_DATA.find((c) => c.code.toLowerCase() === guestCode.toLowerCase() || c.abbr.toLowerCase() === guestCode.toLowerCase()) || COUNTRIES_DATA[1];

    const finalMyTeam = isCurrentHost ? hostC : guestC;
    const finalOppTeam = isCurrentHost ? guestC : hostC;

    // Play kick sound effect
    try { playKickSound(); } catch {}

    if (isCurrentHost) {
      onlineMatchManager.startMatch();
    }

    onMatchStart(finalMyTeam, finalOppTeam, currentR);
  }, [isOpponentDisconnected, onMatchStart, room]);

  // Real-time network sync listeners (Attached once on mount)
  useEffect(() => {
    const handleDisconnect = () => {
      if (!hasLaunchedRef.current) {
        setIsOpponentDisconnected(true);
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setCountdownSeconds(null);
      }
    };

    const unsubUpdate = onlineMatchManager.on('room_updated', (payload) => {
      if (payload?.room) {
        setRoom({ ...payload.room });
        if (
          payload.room.status === 'opponent_left' ||
          payload.room.status === 'cancelled' ||
          payload.room.isOpponentDisconnected
        ) {
          handleDisconnect();
        }
      }
    });

    // Hide native invite overlay during country selection
    crazyGamesSDK.hideInviteButton();

    const unsubCountry = onlineMatchManager.on('country_selection_updated', (payload) => {
      if (payload?.room) {
        setRoom({ ...payload.room });
      }
    });

    const unsubCountdown = onlineMatchManager.on('countdown_started', (payload) => {
      if (payload?.room) {
        setRoom({ ...payload.room });
      }
      countdownStartTimeRef.current = payload?.countdownStartTime || Date.now();
    });

    const unsubMatch = onlineMatchManager.on('match_start', () => {
      crazyGamesSDK.hideInviteButton();
      launchMatch();
    });

    const unsubOppLeft = onlineMatchManager.on('opponent_left', handleDisconnect);
    const unsubOppDisc = onlineMatchManager.on('opponent_disconnected', handleDisconnect);
    const unsubPlayerLeft = onlineMatchManager.on('player_left', handleDisconnect);
    const unsubKicked = onlineMatchManager.on('player_kicked_from_room', () => {
      crazyGamesSDK.hideInviteButton();
      onBack();
    });

    return () => {
      unsubUpdate();
      unsubCountry();
      unsubCountdown();
      unsubMatch();
      unsubOppLeft();
      unsubOppDisc();
      unsubPlayerLeft();
      unsubKicked();
      crazyGamesSDK.hideInviteButton();
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [launchMatch]);

  // Robust Timestamp-Based Countdown
  useEffect(() => {
    const hostSelected = Boolean(room?.host?.countryCode);
    const guestSelected = Boolean(room?.guest?.countryCode);
    const bothSelected = hostSelected && guestSelected;

    if (!bothSelected) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      countdownStartTimeRef.current = null;
      setCountdownSeconds(null);
      return;
    }

    if (!countdownStartTimeRef.current) {
      countdownStartTimeRef.current = room?.countdownStartTime || Date.now();
    }

    if (countdownTimerRef.current) return;

    // Start 3-second countdown loop
    const DURATION = 3000;
    const startTs = countdownStartTimeRef.current;

    countdownTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTs;
      const remainingMs = Math.max(0, DURATION - elapsed);
      const remainingSec = Math.ceil(remainingMs / 1000);

      setCountdownSeconds(remainingSec);

      if (remainingMs <= 0) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setCountdownSeconds(0);
        launchMatch();
      }
    }, 100);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [room?.host?.countryCode, room?.guest?.countryCode, room?.countdownStartTime, launchMatch]);

  // Automated bot country selection when paired with a bot in 1v1
  useEffect(() => {
    if (!room) return;
    const isGuestBot = Boolean(
      room.guest &&
      (room.guest.id?.toLowerCase().startsWith('bot_') || (!room.guest.isLocal && !room.guest.id?.startsWith('P_')))
    );
    const isHostBot = Boolean(
      room.host &&
      (room.host.id?.toLowerCase().startsWith('bot_') || (!room.host.isLocal && !room.host.id?.startsWith('P_')))
    );

    if (isGuestBot && !room.guest?.countryCode) {
      const botTimer = setTimeout(() => {
        const botProfile = getBotProfileById(room.guest?.id || '') || getBotProfileByUsername(room.guest?.name || '') || getRandomBotProfile();
        const preferredCountry = getBotInstinctCountry(botProfile, COUNTRIES_DATA, myCountry);
        onlineMatchManager.botSelectCountry(preferredCountry.code);
      }, 1000 + Math.random() * 600);
      return () => clearTimeout(botTimer);
    } else if (isHostBot && !room.host?.countryCode) {
      const botTimer = setTimeout(() => {
        const botProfile = getBotProfileById(room.host?.id || '') || getBotProfileByUsername(room.host?.name || '') || getRandomBotProfile();
        const preferredCountry = getBotInstinctCountry(botProfile, COUNTRIES_DATA, myCountry);
        onlineMatchManager.botSelectCountry(preferredCountry.code);
      }, 1000 + Math.random() * 600);
      return () => clearTimeout(botTimer);
    }
  }, [room?.guest?.id, room?.guest?.countryCode, room?.host?.id, room?.host?.countryCode, myCountry]);

  const handleSelectCountry = (country: Country) => {
    onlineMatchManager.selectCountry(country.code);
  };

  const handleCopyCode = () => {
    const rId = room?.roomId || initialRoom?.roomId || onlineMatchManager.currentRoom?.roomId;
    if (!rId) return;
    navigator.clipboard?.writeText(rId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Filter countries by search text only
  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) return COUNTRIES_DATA;
    const q = searchTerm.trim().toLowerCase();
    return COUNTRIES_DATA.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.abbr.toLowerCase().includes(q)
      );
    });
  }, [searchTerm]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 text-slate-900 select-none font-sans z-20 touch-pan-y overscroll-contain"
    >
      <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 md:p-8 pb-36 flex flex-col relative min-h-full">
        {/* ============================================================ */}
        {/* TOP HEADER: BACK BUTTON + TITLE + LIVE ROOM & COUNTDOWN */}
        {/* ============================================================ */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 mb-4 pb-3 border-b-2 border-black/20">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ y: 4, scale: 0.97 }}
              onClick={() => {
                onlineMatchManager.leaveRoom();
                onBack();
              }}
              className="px-3.5 py-2.5 rounded-[16px] font-black uppercase tracking-wider bg-white text-black border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer flex items-center gap-2 text-xs sm:text-sm outline-none"
            >
              <ArrowLeft className="w-4 h-4 text-black" />
              <span>{t('online.leaveRoom', 'LEAVE ROOM')}</span>
            </motion.button>

            <div className="flex items-center gap-2 bg-white/90 border-[2.5px] border-black px-3 py-1.5 rounded-full shadow-[0_3px_0_0_#000]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black tracking-wider uppercase text-black">
                {t('online.room', 'ROOM')}: <span className="font-mono text-emerald-700 font-black">{room?.roomId || initialRoom?.roomId || onlineMatchManager.currentRoom?.roomId || 'ONLINE'}</span>
              </span>
              <button
                onClick={handleCopyCode}
                title="Copy Room Code"
                className="p-1 hover:bg-slate-200 rounded-md transition-colors cursor-pointer text-slate-700"
              >
                {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* TOP RIGHT COUNTDOWN BADGE */}
          {countdownSeconds !== null && (
            <motion.div
              initial={{ scale: 0.9, y: -5 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-amber-400 border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[22px] px-5 py-2 flex items-center gap-3 self-end md:self-auto"
            >
              <Timer className="w-6 h-6 text-black animate-spin" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-black/80 block">
                  {t('online.matchStartingIn', 'MATCH STARTING IN')}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-black tracking-wider font-mono">
                  {countdownSeconds > 0 ? `${countdownSeconds}s` : t('online.kickoff', 'KICK-OFF!')}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* ============================================================ */}
        {/* MINIMAL DUAL PLAYER CARDS (YOU VS OPPONENT WITH AVATARS) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-5">
          {/* LEFT CARD: YOU */}
          <div
            className={`p-3.5 sm:p-4 rounded-[22px] border-[3px] border-black shadow-[0_5px_0_0_#000] transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
              myCountry
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 ring-2 ring-emerald-500'
                : 'bg-white/95'
            }`}
          >
            {/* User Profile Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Profile Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 border-2 border-black flex items-center justify-center text-white shadow-inner overflow-hidden">
                    {myProfilePicture ? (
                      <img
                        src={myProfilePicture}
                        alt={myPlayerName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
                </div>

                {/* Name and Role */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm sm:text-base font-black uppercase tracking-wide text-black truncate">
                      {myPlayerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-600">
                    {isHost ? (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <Crown className="w-3 h-3 stroke-[2.5]" /> {t('online.host', 'Host')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sky-600">
                        <Zap className="w-3 h-3 stroke-[2.5]" /> {t('online.guest', 'Guest')}
                      </span>
                    )}
                    <span>•</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {isHost ? t('online.firstTurn', '1st Turn') : t('online.secondTurn', '2nd Turn')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              {myCountry ? (
                <span className="bg-emerald-500 text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-full border-2 border-black flex items-center gap-1 shadow-xs shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" /> {t('online.lockedIn', 'LOCKED IN')}
                </span>
              ) : (
                <span className="bg-amber-400 text-black font-black text-[10px] uppercase px-2.5 py-1 rounded-full border-2 border-black animate-pulse shrink-0">
                  {t('online.selecting', 'SELECTING')}
                </span>
              )}
            </div>

            {/* Selected Team Content */}
            {myCountry ? (
              <div className="flex items-center justify-between gap-3 p-2 rounded-[14px] bg-white/90 border-2 border-black shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-7 rounded-[8px] border-[1.5px] border-black overflow-hidden shrink-0 bg-slate-800 shadow-2xs">
                    <LazyFlagImage
                      countryCode={myCountry.code}
                      src={getFlagUrl(myCountry.code)}
                      className="w-full h-full object-cover"
                      alt={myCountry.name}
                    />
                  </div>
                  <span className="text-sm sm:text-base font-black uppercase tracking-wider text-black truncate">
                    {myCountry.name}
                  </span>
                </div>
                <span className="bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-[8px] border border-black font-mono font-black text-xs shrink-0">
                  {myCountry.rankPoints} OVR
                </span>
              </div>
            ) : (
              <div className="p-2 rounded-[14px] border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('online.selectTeamBelow', 'Select your team below')}</span>
              </div>
            )}
          </div>

          {/* RIGHT CARD: OPPONENT */}
          <div
            className={`p-3.5 sm:p-4 rounded-[22px] border-[3px] border-black shadow-[0_5px_0_0_#000] transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
              opponentCountry
                ? 'bg-gradient-to-br from-rose-50 to-orange-50 ring-2 ring-rose-500'
                : 'bg-white/95'
            }`}
          >
            {/* Opponent Profile Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Profile Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-gradient-to-tr from-purple-600 via-rose-600 to-amber-500 border-2 border-black flex items-center justify-center text-white shadow-inner overflow-hidden">
                    {oppProfilePicture ? (
                      <img
                        src={oppProfilePicture}
                        alt={oppPlayerName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
                </div>

                {/* Name and Role */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm sm:text-base font-black uppercase tracking-wide text-black truncate">
                      {oppPlayerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-600">
                    {!isHost ? (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <Crown className="w-3 h-3 stroke-[2.5]" /> {t('online.host', 'Host')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sky-600">
                        <Zap className="w-3 h-3 stroke-[2.5]" /> {t('online.guest', 'Guest')}
                      </span>
                    )}
                    <span>•</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {!isHost ? t('online.firstTurn', '1st Turn') : t('online.secondTurn', '2nd Turn')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge & Host Kick Button */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isHost && room?.guest && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (room.guest?.id) {
                        onlineMatchManager.kickPlayer(room.guest.id);
                      }
                    }}
                    className="px-2.5 py-1 rounded-[10px] text-[10px] font-black uppercase tracking-wider bg-rose-500 hover:bg-rose-600 text-white border-2 border-black flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                    title="Kick opponent from room"
                  >
                    <UserX className="w-3 h-3 stroke-[2.5]" />
                    <span>KICK</span>
                  </motion.button>
                )}

                {opponentCountry ? (
                  <span className="bg-rose-500 text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-full border-2 border-black flex items-center gap-1 shadow-xs shrink-0">
                    <ShieldCheck className="w-3 h-3 stroke-[3]" /> {t('online.ready', 'READY')}
                  </span>
                ) : (
                  <span className="bg-sky-400 text-black font-black text-[10px] uppercase px-2.5 py-1 rounded-full border-2 border-black animate-pulse shrink-0">
                    {t('online.choosing', 'CHOOSING')}
                  </span>
                )}
              </div>
            </div>

            {/* Selected Team Content */}
            {opponentCountry ? (
              <div className="flex items-center justify-between gap-3 p-2 rounded-[14px] bg-white/90 border-2 border-black shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-7 rounded-[8px] border-[1.5px] border-black overflow-hidden shrink-0 bg-slate-800 shadow-2xs">
                    <LazyFlagImage
                      countryCode={opponentCountry.code}
                      src={getFlagUrl(opponentCountry.code)}
                      className="w-full h-full object-cover"
                      alt={opponentCountry.name}
                    />
                  </div>
                  <span className="text-sm sm:text-base font-black uppercase tracking-wider text-black truncate">
                    {opponentCountry.name}
                  </span>
                </div>
                <span className="bg-rose-100 text-rose-950 px-2 py-0.5 rounded-[8px] border border-black font-mono font-black text-xs shrink-0">
                  {opponentCountry.rankPoints} OVR
                </span>
              </div>
            ) : (
              <div className="p-2 rounded-[14px] border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                <span>{t('online.waitingOpponent', 'Waiting for opponent...')}</span>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* SEARCH BAR */}
        {/* ============================================================ */}
        <div className="mb-4 bg-white/90 p-3 rounded-[20px] border-[3px] border-black shadow-[0_4px_0_0_#000] flex items-center justify-between gap-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('teamSelect.searchPlaceholder', 'Search Country (e.g. Brazil, Spain, France, Argentina)...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-[14px] border-2 border-black font-black text-xs uppercase placeholder:normal-case placeholder:font-medium placeholder:text-slate-400 outline-none focus:border-sky-500"
            />
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs font-black text-black whitespace-nowrap px-3 py-1 bg-amber-300 rounded-[12px] border-2 border-black">
            <span>{filteredCountries.length} {t('teamSelect.teams', 'TEAMS')}</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* GRID OF COUNTRIES */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredCountries.map((country) => {
            const isMyCountry = myCountry?.code === country.code;
            const isOppCountry = opponentCountry?.code === country.code;

            return (
              <motion.button
                key={country.id}
                whileHover={{ y: -3, scale: 1.03 }}
                whileTap={{ y: 4, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                onClick={() => handleSelectCountry(country)}
                className={`flex flex-col p-3 rounded-[22px] text-left cursor-pointer relative overflow-hidden transition-all outline-none ${
                  isMyCountry && isOppCountry
                    ? 'bg-gradient-to-br from-emerald-100 via-amber-100 to-rose-100 text-black border-[4px] border-amber-500 shadow-[0_6px_0_0_#d97706] ring-4 ring-amber-300'
                    : isMyCountry
                    ? 'bg-emerald-100 text-black border-[4px] border-emerald-500 shadow-[0_6px_0_0_#059669] ring-4 ring-emerald-300'
                    : isOppCountry
                    ? 'bg-rose-100 text-black border-[4px] border-rose-500 shadow-[0_6px_0_0_#e11d48] ring-4 ring-rose-300'
                    : 'bg-white text-black border-[3px] border-black shadow-[0_5px_0_0_#000]'
                }`}
              >
                {/* TOP BADGE: MY COUNTRY / OPPONENT COUNTRY */}
                {isMyCountry && isOppCountry && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-black font-black text-[9px] uppercase px-2 py-0.5 rounded-bl-[12px] border-b-2 border-l-2 border-black flex items-center gap-1 shadow-xs z-10">
                    <Flame className="w-3 h-3 stroke-[3]" /> {t('online.bothSelected', 'BOTH SELECTED')}
                  </div>
                )}
                {isMyCountry && !isOppCountry && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-bl-[12px] border-b-2 border-l-2 border-black flex items-center gap-1 shadow-xs z-10">
                    <Check className="w-3 h-3 stroke-[3]" /> {t('online.yourCountry', 'YOUR COUNTRY')}
                  </div>
                )}
                {!isMyCountry && isOppCountry && (
                  <div className="absolute top-0 right-0 bg-rose-500 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-bl-[12px] border-b-2 border-l-2 border-black flex items-center gap-1 shadow-xs z-10">
                    <Crosshair className="w-3 h-3 stroke-[3]" /> {t('online.oppCountry', "OPPONENT'S COUNTRY")}
                  </div>
                )}

                {/* OVR Rating Badge */}
                <div className="flex items-center justify-start w-full mb-2 min-h-[22px]">
                  <span
                    className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full border-2 border-black ${
                      isMyCountry
                        ? 'bg-emerald-400 text-black'
                        : isOppCountry
                        ? 'bg-rose-400 text-black'
                        : 'bg-amber-400 text-black'
                    }`}
                  >
                    {country.rankPoints} OVR
                  </span>
                </div>

                {/* Flag image */}
                <div className="w-full h-16 sm:h-20 rounded-[14px] overflow-hidden border-[2.5px] border-black mb-2 shadow-inner bg-slate-800">
                  <LazyFlagImage
                    countryCode={country.code}
                    src={getFlagUrl(country.code)}
                    className="w-full h-full object-cover"
                    alt={country.name}
                  />
                </div>

                {/* Team Name */}
                <div className="w-full">
                  <div className="font-black text-xs sm:text-sm uppercase tracking-wider truncate text-black">
                    {country.name}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mt-1">
                    <span>{t('teamSelect.att', 'ATT')} {country.att}</span>
                    <span>{t('teamSelect.def', 'DEF')} {country.def}</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* OPPONENT DISCONNECTED MODAL OVERLAY */}
        {/* ============================================================ */}
        <AnimatePresence>
          {isOpponentDisconnected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.85, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 20 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                className="w-full max-w-sm bg-white border-[4px] border-black rounded-[28px] p-6 text-center shadow-[0_12px_0_0_#000] text-black select-none"
              >
                <div className="w-16 h-16 rounded-full bg-rose-100 border-[3px] border-black mx-auto flex items-center justify-center mb-3 text-rose-600 shadow-inner">
                  <WifiOff className="w-8 h-8 stroke-[2.5]" />
                </div>

                <span className="bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-2">
                  {t('online.sessionDisconnected', 'SESSION DISCONNECTED')}
                </span>

                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black mb-1">
                  {t('online.opponentLeft', 'OPPONENT LEFT')}
                </h2>

                <p className="text-slate-600 text-xs sm:text-sm font-bold uppercase tracking-wider mb-5">
                  {t('online.opponentLeftSub', 'The other player disconnected or left the room during team selection.')}
                </p>

                <div className="bg-slate-100 border-[2px] border-black rounded-[16px] p-3 mb-5 text-xs font-black text-slate-700">
                  {t('online.returningToMenu', 'Returning to menu in')} <span className="font-mono text-rose-600 text-sm">{disconnectCountdown}s</span>
                </div>

                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ y: 4, scale: 0.97 }}
                  onClick={() => {
                    onlineMatchManager.leaveRoom();
                    onBack();
                  }}
                  className="w-full py-3.5 rounded-[18px] font-black text-sm uppercase tracking-wider bg-rose-500 hover:bg-rose-600 text-white border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('online.returnToMenu', 'RETURN TO MENU')}</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
