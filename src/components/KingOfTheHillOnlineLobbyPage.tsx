import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Crown,
  Copy,
  Check,
  Link as LinkIcon,
  Users,
  Play,
  Bot,
  User,
  Globe,
  Lock,
  UserX,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shuffle,
  ChevronDown,
} from 'lucide-react';
import { Country, COUNTRIES_DATA } from '../data/countries';
import { KingOfTheHillContender, OnlinePlayer, OnlineMatchRoom, KingOfTheHillMatchState } from '../types';
import { createKingOfTheHillMatch, generateKingOfTheHillContenders } from '../data/kingOfTheHillData';
import { onlineMatchManager } from '../utils/onlineMatchManager';
import { crazyGamesSDK } from '../utils/crazyGamesSDK';
import LazyFlagImage from './LazyFlagImage';
import { useTranslation } from '../utils/i18n';

interface KingOfTheHillOnlineLobbyPageProps {
  room: OnlineMatchRoom;
  userCountry: Country;
  playerName: string;
  userProfilePicture?: string | null;
  onLeaveRoom: () => void;
  onStartOnlineMatch: (matchState: KingOfTheHillMatchState) => void;
  onSelectCountry: (country: Country) => void;
}

export default function KingOfTheHillOnlineLobbyPage({
  room,
  userCountry,
  playerName,
  userProfilePicture,
  onLeaveRoom,
  onStartOnlineMatch,
  onSelectCountry,
}: KingOfTheHillOnlineLobbyPageProps) {
  const { t } = useTranslation();
  const [currentRoom, setCurrentRoom] = useState<OnlineMatchRoom>(room);
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [isReady, setIsReady] = useState(true);
  const [countrySearch, setCountrySearch] = useState('');

  // Match existence and host transfer states
  const [isRoomClosed, setIsRoomClosed] = useState(false);
  const [closedReason, setClosedReason] = useState('');
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const localPlayerId = onlineMatchManager.localPlayerId;
  const isHost = currentRoom.host?.id === localPlayerId || currentRoom.host?.isLocal;

  // Active players in room
  const activePlayers: OnlinePlayer[] = Array.isArray(currentRoom.players) && currentRoom.players.length > 0
    ? currentRoom.players
    : currentRoom.guest
    ? [currentRoom.host, currentRoom.guest]
    : [currentRoom.host];

  // Refs for unmount / beforeunload teardown safety
  const matchStartedRef = useRef(false);
  const isHostRef = useRef(isHost);
  const activePlayersRef = useRef(activePlayers);
  const localPlayerIdRef = useRef(localPlayerId);

  useEffect(() => {
    isHostRef.current = isHost;
    activePlayersRef.current = activePlayers;
    localPlayerIdRef.current = localPlayerId;
  }, [isHost, activePlayers, localPlayerId]);

  // 1. Check on mount whether this match/room still exists in Firestore
  useEffect(() => {
    let isMounted = true;
    if (!room.roomId) return;

    onlineMatchManager.checkRoomExists(room.roomId).then((res) => {
      if (isMounted && !res.exists) {
        setIsRoomClosed(true);
        setClosedReason(t('online.roomNoLongerExists', 'This King of the Hill match or room no longer exists.'));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [room.roomId, t]);

  // 2. Auto countdown and redirect if match/room no longer exists
  useEffect(() => {
    if (!isRoomClosed) return;
    setCountdownSeconds(5);
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          crazyGamesSDK.hideInviteButton();
          onLeaveRoom();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRoomClosed, onLeaveRoom]);

  // 3. Sync room updates, host transfers, and cancellations from manager
  useEffect(() => {
    setCurrentRoom(onlineMatchManager.currentRoom || room);

    const unsubRoom = onlineMatchManager.on('room_updated', (payload) => {
      if (payload.room) {
        setCurrentRoom({ ...payload.room });
      }
    });

    const unsubLobby = onlineMatchManager.on('koth_lobby_updated', (payload) => {
      if (payload.players) {
        setCurrentRoom((prev) => ({
          ...prev,
          players: payload.players,
        }));
      }
    });

    const unsubPlayerJoined = onlineMatchManager.on('player_joined', (payload) => {
      if (payload.room) {
        setCurrentRoom({ ...payload.room });
      }
    });

    const unsubPlayerLeft = onlineMatchManager.on('player_left', () => {
      if (onlineMatchManager.currentRoom) {
        setCurrentRoom({ ...onlineMatchManager.currentRoom });
      }
    });

    // Detect if match room was closed or no longer exists
    const unsubNotFound = onlineMatchManager.on('room_not_found', (payload) => {
      setIsRoomClosed(true);
      setClosedReason(payload?.message || t('online.roomNoLongerExists', 'This match no longer exists or was closed.'));
    });

    const unsubCancelled = onlineMatchManager.on('room_cancelled', () => {
      setIsRoomClosed(true);
      setClosedReason(t('online.roomCancelledByHost', 'The host has closed the room or the match no longer exists.'));
    });

    const unsubOpponentDisconnected = onlineMatchManager.on('opponent_disconnected', (payload) => {
      if (payload?.message?.includes('closed') || payload?.message?.includes('exist') || payload?.message?.includes('cancelled')) {
        setIsRoomClosed(true);
        setClosedReason(payload.message);
      }
    });

    // Detect host leadership transfer
    const unsubHostTransferred = onlineMatchManager.on('host_transferred', (payload) => {
      if (payload?.newHost) {
        const isMe = payload.newHost.id === localPlayerId;
        setCurrentRoom((prev) => ({
          ...prev,
          host: {
            ...payload.newHost,
            isLocal: isMe,
          },
          players: payload.players || prev.players,
        }));

        if (isMe) {
          setBannerNotice({
            type: 'success',
            text: '👑 YOU ARE NOW THE ROOM LEADER! You have host controls to start the match.',
          });
        } else {
          setBannerNotice({
            type: 'info',
            text: `👑 Room leader transferred to ${payload.newHost.name || 'new player'}.`,
          });
        }
      }
    });

    const unsubStarted = onlineMatchManager.on('koth_match_started', (payload) => {
      if (payload.kothState) {
        matchStartedRef.current = true;
        crazyGamesSDK.hideInviteButton();
        onStartOnlineMatch(payload.kothState);
      }
    });

    const unsubKicked = onlineMatchManager.on('player_kicked_from_room', () => {
      crazyGamesSDK.hideInviteButton();
      onLeaveRoom();
    });

    return () => {
      unsubRoom();
      unsubLobby();
      unsubPlayerJoined();
      unsubPlayerLeft();
      unsubNotFound();
      unsubCancelled();
      unsubOpponentDisconnected();
      unsubHostTransferred();
      unsubStarted();
      unsubKicked();
      crazyGamesSDK.hideInviteButton();
    };
  }, [room, onStartOnlineMatch, localPlayerId, t]);

  // 4. Fallback & Watchdog: if the room host is missing or players disconnect/leave, update slots and leadership
  useEffect(() => {
    if (!currentRoom.roomId || isRoomClosed || matchStartedRef.current) return;
    if (!activePlayers || activePlayers.length === 0) return;

    const hostStillPresent = activePlayers.some((p) => p.id === currentRoom.host?.id);
    if (!hostStillPresent) {
      if (activePlayers[0]?.id === localPlayerId) {
        onlineMatchManager.claimHostLeadership();
      }
    }

    // Presence watchdog: every 4 seconds, check if any peer disconnected without firing unload
    const staleInterval = setInterval(() => {
      const now = Date.now();
      const currentPlayers = activePlayersRef.current;
      if (!currentPlayers || currentPlayers.length === 0) return;

      const stalePlayers = currentPlayers.filter(
        (p) => p.id !== localPlayerIdRef.current && p.lastSeen && now - p.lastSeen > 15000
      );

      if (stalePlayers.length > 0) {
        const remaining = currentPlayers.filter(
          (p) => !stalePlayers.some((s) => s.id === p.id)
        );

        const hostIsStale = stalePlayers.some((s) => s.id === currentRoom.host?.id);
        if (hostIsStale) {
          if (remaining[0]?.id === localPlayerIdRef.current) {
            onlineMatchManager.claimHostLeadership();
          }
        } else if (isHostRef.current) {
          // Room leader prunes inactive disconnected player to free the slot
          onlineMatchManager.updateKothLobbyPlayers(remaining);
        }
      }
    }, 4000);

    return () => clearInterval(staleInterval);
  }, [activePlayers, currentRoom.host?.id, isHost, localPlayerId, currentRoom.roomId, isRoomClosed]);

  // 5. Clean teardown & host transfer when leaving or navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!matchStartedRef.current && currentRoom.roomId) {
        if (isHostRef.current) {
          const remaining = activePlayersRef.current.filter((p) => p.id !== localPlayerIdRef.current);
          if (remaining.length > 0) {
            onlineMatchManager.transferHostAndLeave(remaining[0].id);
            return;
          }
        }
        onlineMatchManager.leaveRoom();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      if (!matchStartedRef.current && currentRoom.roomId) {
        if (isHostRef.current) {
          const remaining = activePlayersRef.current.filter((p) => p.id !== localPlayerIdRef.current);
          if (remaining.length > 0) {
            onlineMatchManager.transferHostAndLeave(remaining[0].id);
            return;
          }
        }
        onlineMatchManager.leaveRoom();
      }
    };
  }, [currentRoom.roomId]);

  // Show CrazyGames native invite button overlay
  useEffect(() => {
    if (currentRoom.roomId && !isRoomClosed) {
      crazyGamesSDK.showInviteButton({ roomId: currentRoom.roomId });
    }
    return () => {
      crazyGamesSDK.hideInviteButton();
    };
  }, [currentRoom.roomId, isRoomClosed]);

  const handleCopyCode = () => {
    if (!currentRoom.roomId) return;
    navigator.clipboard?.writeText(currentRoom.roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyInviteLink = async () => {
    if (!currentRoom.roomId) return;
    const link = await crazyGamesSDK.inviteLink({ roomId: currentRoom.roomId });
    if (link) {
      navigator.clipboard?.writeText(link);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    }
  };

  const handleLeaveRoom = () => {
    crazyGamesSDK.hideInviteButton();
    if (isHost) {
      const remaining = activePlayers.filter((p) => p.id !== localPlayerId);
      if (remaining.length > 0) {
        onlineMatchManager.transferHostAndLeave(remaining[0].id);
        onLeaveRoom();
        return;
      }
    }
    onlineMatchManager.leaveRoom();
    onLeaveRoom();
  };

  const handleToggleReady = () => {
    const nextReady = !isReady;
    setIsReady(nextReady);
    // Update local player ready state in room
    const updated = activePlayers.map((p) => (p.id === localPlayerId ? { ...p, isReady: nextReady } : p));
    onlineMatchManager.updateKothLobbyPlayers(updated);
  };

  const handlePickCountry = (country: Country) => {
    onSelectCountry(country);
    setIsCountryPickerOpen(false);
    // Sync country to room
    const updated = activePlayers.map((p) =>
      p.id === localPlayerId ? { ...p, countryCode: country.code } : p
    );
    onlineMatchManager.updateKothLobbyPlayers(updated);
    onlineMatchManager.selectCountry(country.code);
  };

  /**
   * Host starts the King of the Hill match:
   * Generates 4 contenders (using connected online players + filling remaining slots with AI bots)
   */
  const handleHostStart = (fillBots: boolean = true) => {
    if (!isHost) return;

    // Build 4 contenders starting with the room leader
    const contenders: KingOfTheHillContender[] = [];

    // Room leader MUST be the first player (index 0) in the match
    const hostPlayer = activePlayers.find(
      (p) => p.id === currentRoom.host?.id || p.role === 'host'
    ) || activePlayers[0];
    const nonHostPlayers = activePlayers.filter((p) => p.id !== hostPlayer?.id);
    const orderedPlayers = hostPlayer ? [hostPlayer, ...nonHostPlayers] : activePlayers;

    // 1. Add connected human players with host first
    orderedPlayers.slice(0, 4).forEach((p, idx) => {
      const pCountry = COUNTRIES_DATA.find(
        (c) => c.code.toLowerCase() === (p.countryCode || '').toLowerCase()
      ) || COUNTRIES_DATA[idx % COUNTRIES_DATA.length];

      contenders.push({
        id: p.id,
        name: p.name || (p.id === hostPlayer?.id ? 'Room Leader' : `Player ${idx + 1}`),
        countryCode: pCountry.code,
        countryName: pCountry.name,
        avatarUrl: p.profilePictureUrl || null,
        isLocalPlayer: p.id === localPlayerId,
        isBot: false,
        totalScore: 0,
        totalGoals: 0,
        roundScores: [],
        roundGoals: [],
        roundOutcomes: [],
        currentRoundScore: 0,
        currentRoundGoals: 0,
        currentRoundShots: [],
        currentRoundOutcome: 'waiting',
        isEliminated: false,
      });
    });

    // 2. Fill remaining slots up to 4 with realistic AI bots if requested
    if (fillBots && contenders.length < 4) {
      const needed = 4 - contenders.length;
      const botPool = generateKingOfTheHillContenders('BotMaster', userCountry, null, 4).filter(
        (b) => !b.isLocalPlayer
      );
      for (let i = 0; i < needed; i++) {
        const botTemplate = botPool[i % botPool.length];
        contenders.push({
          ...botTemplate,
          id: `bot_${i + 1}_${Date.now()}`,
          isLocalPlayer: false,
          isBot: true,
        });
      }
    }

    // Build initial King of the Hill match state
    const firstContender = contenders[0];
    const initialMatch = createKingOfTheHillMatch(
      firstContender?.name || playerName,
      userCountry,
      userProfilePicture || undefined,
      4,
      'free',
      contenders
    );

    matchStartedRef.current = true;
    // Broadcast match start to all peers
    onlineMatchManager.startKothMatch(initialMatch);
    crazyGamesSDK.hideInviteButton();
    onStartOnlineMatch(initialMatch);
  };

  const filteredCountries = COUNTRIES_DATA.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 text-slate-900 select-none font-sans z-20 touch-pan-y overscroll-contain"
    >
      {/* Background turf pattern */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      {/* Match No Longer Exists / Room Closed Modal */}
      <AnimatePresence>
        {isRoomClosed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-white border-[4px] border-black rounded-[24px] p-6 shadow-[0_10px_0_0_#000] text-center text-black flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-full bg-rose-100 border-[3px] border-black flex items-center justify-center text-rose-600 mb-3 shadow-xs">
                <AlertCircle className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-100 px-3 py-0.5 rounded-full border border-rose-300 mb-2">
                MATCH STATUS
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-black mb-2">
                MATCH NO LONGER EXISTS
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-600 mb-5 leading-relaxed">
                {closedReason || 'The match room was closed or no longer exists. Returning to the main menu...'}
              </p>
              <button
                onClick={() => {
                  crazyGamesSDK.hideInviteButton();
                  onLeaveRoom();
                }}
                className="w-full py-3.5 px-6 rounded-[16px] font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-black border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer text-sm"
              >
                RETURN TO MENU {countdownSeconds !== null && `(${countdownSeconds}s)`}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-4xl mx-auto p-3.5 sm:p-6 md:p-8 pb-36 flex flex-col relative min-h-full">
        {/* Banner Notice (e.g. Leadership Transferred) */}
        <AnimatePresence>
          {bannerNotice && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`w-full mb-4 p-3.5 rounded-[18px] border-[3.5px] border-black shadow-[0_5px_0_0_#000] flex items-center justify-between gap-3 text-xs sm:text-sm font-black uppercase ${
                bannerNotice.type === 'success'
                  ? 'bg-emerald-300 text-emerald-950'
                  : 'bg-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 shrink-0 fill-current" />
                <span>{bannerNotice.text}</span>
              </div>
              <button
                onClick={() => setBannerNotice(null)}
                className="text-black/60 hover:text-black font-black text-xs px-2 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 pb-3.5 border-b-[3px] border-white/30">
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ y: 3, scale: 0.97 }}
            onClick={handleLeaveRoom}
            className="px-4 py-2.5 rounded-[18px] font-black uppercase tracking-wider bg-white text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center gap-2 text-xs sm:text-sm outline-none shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            <span>{t('common.leaveRoom', 'LEAVE ROOM')}</span>
          </motion.button>

          {/* Lobby Title Card */}
          <div className="bg-white border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[22px] px-4 sm:px-6 py-2.5 sm:py-3 text-left sm:text-right flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[16px] bg-gradient-to-tr from-amber-400 to-yellow-300 border-[2.5px] border-black flex items-center justify-center text-black shrink-0 shadow-xs">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 fill-black text-black" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                {t('koth.onlineTitle', 'ONLINE KING OF THE HILL')}
              </span>
              <h1 className="text-lg sm:text-2xl font-black text-black tracking-wider uppercase leading-tight">
                {t('online.tournamentLobby', 'TOURNAMENT LOBBY')}
              </h1>
            </div>
          </div>
        </div>

        {/* Room Code & CrazyGames Invite Link Banner */}
        <div className="w-full bg-white border-[3.5px] sm:border-[4px] border-black rounded-[24px] p-4 sm:p-5 shadow-[0_8px_0_0_#000] mb-5 text-black">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Code info */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 mb-0.5">
                {t('online.roomCodePrompt', 'ROOM CODE • SHARE WITH FRIENDS')}
              </span>
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                <span className="font-mono font-black text-3xl sm:text-4xl tracking-[0.2em] text-black">
                  #{currentRoom.roomId}
                </span>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase">
                  {activePlayers.length}/4 {t('common.players', 'PLAYERS')}
                </span>

                {/* Public / Private Room Status / Toggle */}
                {isHost ? (
                  <button
                    onClick={async () => {
                      const nextVal = currentRoom.isPublic === false ? true : false;
                      setCurrentRoom((prev) => ({ ...prev, isPublic: nextVal }));
                      await onlineMatchManager.setRoomPublic(nextVal);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-black cursor-pointer transition-all shadow-2xs ${
                      currentRoom.isPublic !== false
                        ? 'bg-emerald-300 hover:bg-emerald-200 text-black'
                        : 'bg-amber-200 hover:bg-amber-100 text-amber-950'
                    }`}
                    title={currentRoom.isPublic !== false ? 'Click to make Private' : 'Click to make Public'}
                  >
                    {currentRoom.isPublic !== false ? (
                      <>
                        <Globe className="w-3.5 h-3.5 text-emerald-950 stroke-[2.5]" />
                        <span>PUBLIC ROOM</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-950 stroke-[2.5]" />
                        <span>PRIVATE ROOM</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                    currentRoom.isPublic !== false
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {currentRoom.isPublic !== false ? (
                      <>
                        <Globe className="w-3 h-3 text-emerald-700" />
                        <span>PUBLIC</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-amber-700" />
                        <span>PRIVATE</span>
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Copy Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ y: 2, scale: 0.98 }}
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[16px] font-black text-xs uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-black border-[2.5px] border-black shadow-[0_3px_0_0_#000] cursor-pointer"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-900" /> : <Copy className="w-4 h-4 text-black" />}
                <span>{isCopied ? t('online.codeCopied', 'COPIED!') : t('online.copyCode', 'COPY CODE')}</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ y: 2, scale: 0.98 }}
                onClick={handleCopyInviteLink}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[16px] font-black text-xs uppercase tracking-wider bg-sky-400 hover:bg-sky-300 text-black border-[2.5px] border-black shadow-[0_3px_0_0_#000] cursor-pointer"
              >
                {isLinkCopied ? <Check className="w-4 h-4 text-emerald-900" /> : <LinkIcon className="w-4 h-4 text-black" />}
                <span>{isLinkCopied ? t('online.linkCopied', 'LINK COPIED!') : t('online.inviteLink', 'CRAZYGAMES LINK')}</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* 4 Contender Slots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mb-5">
          {[0, 1, 2, 3].map((slotIdx) => {
            const player = activePlayers[slotIdx];
            const isSlotHost = player ? (player.role === 'host' || player.id === currentRoom.host?.id) : false;
            const isLocalInSlot = player?.id === localPlayerId;

            if (player) {
              const country = COUNTRIES_DATA.find(
                (c) => c.code.toLowerCase() === (player.countryCode || '').toLowerCase()
              ) || COUNTRIES_DATA[slotIdx % COUNTRIES_DATA.length];

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white border-[3.5px] border-black rounded-[22px] p-4 shadow-[0_6px_0_0_#000] flex items-center justify-between gap-3 relative ${
                    isLocalInSlot ? 'ring-4 ring-amber-400 ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Flag avatar */}
                    <div className="w-14 h-11 rounded-[14px] border-[2.5px] border-black overflow-hidden shadow-xs shrink-0 relative">
                      <LazyFlagImage countryCode={country.code} className="w-full h-full object-cover" />
                      {isSlotHost && (
                        <div className="absolute top-0.5 right-0.5 bg-amber-400 border border-black rounded-full p-0.5">
                          <Crown className="w-3 h-3 fill-black text-black" />
                        </div>
                      )}
                    </div>

                    {/* Name & Country */}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-sm sm:text-base text-black truncate">
                          {player.name || `Player ${slotIdx + 1}`}
                        </span>
                        {isLocalInSlot && (
                          <span className="text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-300 px-1.5 py-0.2 rounded uppercase">
                            YOU
                          </span>
                        )}
                        {isSlotHost && (
                          <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded uppercase">
                            HOST
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-600 truncate">
                        {country.name}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {/* Host Kick Button (only visible to host for non-host players) */}
                    {isHost && !isSlotHost && player.id !== localPlayerId && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          onlineMatchManager.kickPlayer(player.id);
                        }}
                        className="px-2.5 py-1 rounded-[10px] text-[10px] font-black uppercase tracking-wider bg-rose-500 hover:bg-rose-600 text-white border-2 border-black flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                        title={`Kick ${player.name || 'player'} from room`}
                      >
                        <UserX className="w-3 h-3 stroke-[2.5]" />
                        <span>KICK</span>
                      </motion.button>
                    )}

                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-[10px] uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {t('common.ready', 'READY')}
                    </span>
                  </div>
                </motion.div>
              );
            }

            // Empty slot waiting for player
            return (
              <div
                key={`empty_${slotIdx}`}
                className="bg-white/60 border-[3px] border-dashed border-black/40 rounded-[22px] p-4 flex items-center justify-between gap-3 text-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-11 rounded-[14px] border-[2px] border-dashed border-black/30 flex items-center justify-center bg-black/5 text-slate-400">
                    <User className="w-6 h-6 opacity-40" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-xs sm:text-sm text-slate-600 uppercase tracking-wider">
                      {t('online.waitingPlayer', 'SLOT')} #{slotIdx + 1} • {t('common.open', 'OPEN')}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {isHost ? t('online.willBeBot', 'Can be filled with AI bot') : t('online.waitingToJoin', 'Waiting for challenger...')}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-1 rounded-[10px] uppercase">
                  EMPTY
                </span>
              </div>
            );
          })}
        </div>

        {/* Change Country Dropdown/Button for Local Player */}
        <div className="w-full bg-white border-[3.5px] border-black rounded-[22px] p-4 shadow-[0_6px_0_0_#000] mb-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-9 rounded-[10px] border-2 border-black overflow-hidden shadow-xs">
                <LazyFlagImage countryCode={userCountry.code} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase">{t('koth.yourTeam', 'YOUR TEAM')}</span>
                <span className="text-base font-black text-black uppercase">{userCountry.name}</span>
              </div>
            </div>

            <button
              onClick={() => setIsCountryPickerOpen(!isCountryPickerOpen)}
              className="w-full sm:w-auto px-4 py-2 rounded-[14px] bg-slate-100 hover:bg-slate-200 border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
            >
              <span>{t('koth.changeCountry', 'CHANGE COUNTRY')}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isCountryPickerOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Collapsible Country Selector */}
          <AnimatePresence>
            {isCountryPickerOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t-2 border-slate-200 overflow-hidden"
              >
                <input
                  type="text"
                  placeholder={t('common.searchCountry', 'Search country...')}
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full mb-3 px-3 py-2 text-xs font-bold bg-slate-100 border-2 border-black rounded-[12px] outline-none"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredCountries.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => handlePickCountry(c)}
                      className={`p-2 rounded-[12px] border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        userCountry.code === c.code
                          ? 'border-amber-500 bg-amber-50 shadow-xs scale-105'
                          : 'border-black/20 hover:border-black bg-white'
                      }`}
                    >
                      <div className="w-8 h-6 rounded-[4px] border border-black/40 overflow-hidden">
                        <LazyFlagImage countryCode={c.code} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-black truncate w-full text-center">{c.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Bottom Bar */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-end gap-3 mt-auto pt-2">
          {isHost ? (
            <>
              {/* Host Start with Bots (if fewer than 4 human players) */}
              {activePlayers.length < 4 && (
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ y: 3, scale: 0.98 }}
                  onClick={() => handleHostStart(true)}
                  className="w-full sm:w-auto py-4 px-6 rounded-[20px] font-black text-sm uppercase tracking-wider bg-gradient-to-r from-sky-400 to-blue-500 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-center gap-2.5 outline-none"
                >
                  <Bot className="w-5 h-5 text-black" />
                  <span>{t('online.startWithBots', 'START WITH AI BOTS (4P)')}</span>
                </motion.button>
              )}

              {/* Host Start with connected players only (if 4 are ready) */}
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ y: 3, scale: 0.98 }}
                onClick={() => handleHostStart(activePlayers.length < 4)}
                className="w-full sm:w-auto py-4 px-8 rounded-[20px] font-black text-base uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-black border-[3px] border-black shadow-[0_6px_0_0_#000] cursor-pointer flex items-center justify-center gap-3 outline-none"
              >
                <Play className="w-6 h-6 fill-black text-black" />
                <span>{t('online.startTournament', 'START TOURNAMENT')}</span>
              </motion.button>
            </>
          ) : (
            /* Guest Waiting Status */
            <div className="w-full bg-white border-[3px] border-black rounded-[20px] p-4 flex items-center justify-between gap-3 shadow-[0_4px_0_0_#000]">
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                <span className="font-black text-xs sm:text-sm uppercase text-slate-800">
                  {t('online.waitingForHost', 'Waiting for Host to start tournament...')}
                </span>
              </div>
              <button
                onClick={handleToggleReady}
                className={`px-4 py-2 rounded-[14px] font-black text-xs uppercase border-2 border-black cursor-pointer shadow-xs ${
                  isReady ? 'bg-emerald-400 text-black' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {isReady ? 'I AM READY' : 'NOT READY'}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
