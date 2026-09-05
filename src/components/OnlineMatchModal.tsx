import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Zap,
  Plus,
  LogIn,
  Copy,
  Check,
  Radio,
  Loader2,
  Crown,
  AlertCircle,
  Link as LinkIcon,
  Users,
  RefreshCw,
  ArrowLeft,
  Flame,
  Trophy,
  Lock,
  Wifi,
} from 'lucide-react';
import { Country, COUNTRIES_DATA } from '../data/countries';
import { onlineMatchManager } from '../utils/onlineMatchManager';
import { OnlineMatchRoom } from '../types';
import { crazyGamesSDK } from '../utils/crazyGamesSDK';
import { useTranslation } from '../utils/i18n';
import LazyFlagImage from './LazyFlagImage';

interface OnlineMatchModalProps {
  isOpen: boolean;
  selectedCountry?: Country | null;
  gameMode?: 'match' | 'penalty_training' | 'survival' | 'king_of_the_hill';
  wagerTier?: 'rookie' | 'pro' | 'champion' | 'legend';
  entryFee?: number;
  prizePot?: number;
  title?: string;
  subtitle?: string;
  initialStep?: 'menu' | 'create' | 'join' | 'public_rooms';
  onClose: () => void;
  onRoomConnected: (room: OnlineMatchRoom) => void;
}

type OnlineStep = 'menu' | 'create' | 'join' | 'public_rooms' | 'matchmaking';

export default function OnlineMatchModal({
  isOpen,
  selectedCountry,
  gameMode = 'match',
  wagerTier,
  entryFee,
  prizePot,
  title,
  subtitle,
  initialStep = 'menu',
  onClose,
  onRoomConnected,
}: OnlineMatchModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<OnlineStep>(initialStep);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [kickedMessage, setKickedMessage] = useState<string | null>(null);
  const [matchmakingSeconds, setMatchmakingSeconds] = useState<number>(0);
  const [isSearchingMatch, setIsSearchingMatch] = useState<boolean>(false);

  // Public Rooms State
  const [publicRooms, setPublicRooms] = useState<OnlineMatchRoom[]>([]);
  const [isLoadingPublicRooms, setIsLoadingPublicRooms] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  // Quick play mode does not need public rooms; only King of the Hill does
  const showPublicRooms = gameMode === 'king_of_the_hill';

  // Listen for kicked event while modal is mounted
  useEffect(() => {
    const unsubKicked = onlineMatchManager.on('player_kicked_from_room', (payload) => {
      setStep('menu');
      setKickedMessage(payload?.reason || 'You were kicked from room');
      const timer = setTimeout(() => {
        setKickedMessage(null);
      }, 6000);
      return () => clearTimeout(timer);
    });

    return () => {
      unsubKicked();
    };
  }, []);

  // Matchmaking elapsed timer
  useEffect(() => {
    if (!isOpen || !isSearchingMatch) return;
    const timer = setInterval(() => {
      setMatchmakingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isSearchingMatch]);

  // Clean up any pending matchmaking if modal closes
  useEffect(() => {
    if (!isOpen) {
      if (isSearchingMatch) {
        onlineMatchManager.cancelMatchmaking().catch(() => {});
        setIsSearchingMatch(false);
      }
      setMatchmakingSeconds(0);
    }
  }, [isOpen, isSearchingMatch]);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep || 'menu');
      setRoomCodeInput('');
      setErrorMessage(null);
      setIsCopied(false);
      setIsLinkCopied(false);
      setIsCreatingRoom(false);
      setIsSearchingMatch(false);
      setMatchmakingSeconds(0);
    } else {
      setIsCreatingRoom(false);
      setIsSearchingMatch(false);
      crazyGamesSDK.hideInviteButton();
    }
  }, [isOpen, initialStep, gameMode]);

  // Subscribe to public rooms whenever modal is open and public rooms are active (King of the Hill only)
  useEffect(() => {
    if (!isOpen || !showPublicRooms) return;
    setIsLoadingPublicRooms(true);

    const unsub = onlineMatchManager.subscribePublicRooms((rooms) => {
      setPublicRooms(rooms);
      setIsLoadingPublicRooms(false);
    });

    return () => {
      unsub();
    };
  }, [isOpen, showPublicRooms]);

  // Handle CrazyGames multiplayer invite button overlay
  useEffect(() => {
    if (isOpen && step === 'create' && createdRoomCode) {
      crazyGamesSDK.showInviteButton({ roomId: createdRoomCode });
    } else {
      crazyGamesSDK.hideInviteButton();
    }
    return () => {
      crazyGamesSDK.hideInviteButton();
    };
  }, [isOpen, step, createdRoomCode]);

  // Listen to networking events
  useEffect(() => {
    if (!isOpen) return;

    const unsubCreated = onlineMatchManager.on('room_created', (payload) => {
      setCreatedRoomCode(payload.roomId);
      setErrorMessage(null);
      crazyGamesSDK.showInviteButton({ roomId: payload.roomId });
    });

    const unsubJoined = onlineMatchManager.on('room_joined', (payload) => {
      setErrorMessage(null);
      if (payload.room) {
        crazyGamesSDK.hideInviteButton();
        onClose();
        onRoomConnected(payload.room);
      }
    });

    const unsubPlayerJoined = onlineMatchManager.on('player_joined', (payload) => {
      // When opponent joins host's room, immediately redirect both to Country Selection!
      if (payload.room || onlineMatchManager.currentRoom) {
        const room = payload.room || onlineMatchManager.currentRoom;
        crazyGamesSDK.hideInviteButton();
        onClose();
        onRoomConnected(room);
      }
    });

    const unsubError = onlineMatchManager.on('error', (payload) => {
      setIsCreatingRoom(false);
      setIsSearchingMatch(false);
      setErrorMessage(payload.message || 'Connection error. Please try again.');
    });

    const unsubRoomFull = onlineMatchManager.on('room_full', (payload) => {
      setIsCreatingRoom(false);
      setIsSearchingMatch(false);
      setErrorMessage(payload.message || 'This room is currently full (maximum players reached).');
    });

    return () => {
      unsubCreated();
      unsubJoined();
      unsubPlayerJoined();
      unsubError();
      unsubRoomFull();
      crazyGamesSDK.hideInviteButton();
    };
  }, [isOpen, onClose, onRoomConnected]);

  const handleStartMatchmaking = async () => {
    setErrorMessage(null);
    setStep('matchmaking');
    setIsSearchingMatch(true);
    setMatchmakingSeconds(0);

    try {
      const success = await onlineMatchManager.findMatch(gameMode, wagerTier, entryFee, prizePot);
      if (success && onlineMatchManager.currentRoom?.guest) {
        crazyGamesSDK.hideInviteButton();
        onClose();
        onRoomConnected(onlineMatchManager.currentRoom);
      }
    } catch (err: any) {
      setIsSearchingMatch(false);
      setStep('menu');
      setErrorMessage(err?.message || 'Matchmaking error. Please try again.');
    }
  };

  const handleCancelMatchmaking = async () => {
    setIsSearchingMatch(false);
    setStep('menu');
    setMatchmakingSeconds(0);
    await onlineMatchManager.cancelMatchmaking().catch(() => {});
  };

  const handleStartCreateRoom = async () => {
    setErrorMessage(null);
    setIsCreatingRoom(true);

    // Only King of the Hill is public; all other modes are strictly private
    const resolvedIsPublic = (gameMode === 'king_of_the_hill');

    try {
      if (gameMode === 'king_of_the_hill') {
        const countryCode = selectedCountry?.code || 'br';
        await onlineMatchManager.createRoom(
          gameMode,
          undefined,
          false,
          undefined,
          countryCode,
          wagerTier,
          entryFee,
          prizePot,
          resolvedIsPublic
        );
        setIsCreatingRoom(false);
        if (onlineMatchManager.currentRoom) {
          crazyGamesSDK.hideInviteButton();
          onClose();
          onRoomConnected(onlineMatchManager.currentRoom);
        }
        return;
      }
      setStep('create');
      const code = await onlineMatchManager.createRoom(
        gameMode,
        undefined,
        false,
        undefined,
        null,
        wagerTier,
        entryFee,
        prizePot,
        resolvedIsPublic
      );
      setIsCreatingRoom(false);
      setCreatedRoomCode(code);
    } catch (err: any) {
      setIsCreatingRoom(false);
      setErrorMessage(err?.message || 'Failed to create room. Please try again.');
    }
  };

  const handleStartJoinRoom = () => {
    setErrorMessage(null);
    setRoomCodeInput('');
    setStep('join');
  };

  const handleConfirmJoinRoom = async () => {
    const cleaned = roomCodeInput.trim().toUpperCase();
    if (!cleaned || cleaned.length < 4) {
      setErrorMessage('Please enter a 5-digit room code.');
      return;
    }
    setErrorMessage(null);
    setIsJoiningRoom(true);
    try {
      const success = await onlineMatchManager.joinRoom(cleaned, gameMode, wagerTier);
      if (success && onlineMatchManager.currentRoom) {
        onClose();
        onRoomConnected(onlineMatchManager.currentRoom);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to join room. Please check the code.');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleCancelAndBack = () => {
    crazyGamesSDK.hideInviteButton();
    onlineMatchManager.leaveRoom();
    setErrorMessage(null);
    setStep('menu');
  };

  const handleCopyCode = () => {
    if (!createdRoomCode) return;
    navigator.clipboard?.writeText(createdRoomCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyInviteLink = async () => {
    if (!createdRoomCode) return;
    const link = await crazyGamesSDK.inviteLink({ roomId: createdRoomCode });
    if (link) {
      navigator.clipboard?.writeText(link);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 20 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          className="w-full max-w-md bg-white border-[4px] border-black rounded-[28px] p-6 sm:p-7 shadow-[0_12px_0_0_#000] relative text-black select-none"
        >
          {/* Close Button */}
          <button
            onClick={() => {
              if (step === 'matchmaking' || isSearchingMatch) {
                onlineMatchManager.cancelMatchmaking().catch(() => {});
              }
              crazyGamesSDK.hideInviteButton();
              onlineMatchManager.leaveRoom();
              onClose();
            }}
            className="absolute top-4 right-4 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-slate-100 shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Kicked from room notification banner */}
          <AnimatePresence>
            {kickedMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="w-full p-3 mb-4 bg-rose-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-[16px] border-[3px] border-black flex items-center justify-between shadow-[0_4px_0_0_#000]"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 text-white" />
                  <span>{kickedMessage}</span>
                </div>
                <button
                  onClick={() => setKickedMessage(null)}
                  className="w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white cursor-pointer shrink-0 transition-colors ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============================================================ */}
          {/* STEP 1: INITIAL MENU (Quick Play: Create & Join / King of the Hill: Public & Private) */}
          {/* ============================================================ */}
          {step === 'menu' && (
            <div>
              {/* Game Mode Space Indicator */}
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black text-white border border-black flex items-center gap-1.5 shadow-2xs">
                  {gameMode === 'survival' ? (
                    <>
                      <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                      <span>SURVIVAL 1V1 SPACE</span>
                    </>
                  ) : gameMode === 'king_of_the_hill' ? (
                    <>
                      <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>KING OF THE HILL SPACE</span>
                    </>
                  ) : wagerTier ? (
                    <>
                      <Trophy className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span>{wagerTier.toUpperCase()} ARENA SPACE</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                      <span>QUICK MATCH SPACE</span>
                    </>
                  )}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black mb-1">
                {title || (gameMode === 'survival'
                  ? t('survival.onlineDuel', 'ONLINE SURVIVAL 1V1')
                  : gameMode === 'king_of_the_hill'
                  ? t('koth.onlineTitle', 'ONLINE KING OF THE HILL')
                  : t('online.title', 'ONLINE MATCH'))}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mb-6 font-bold uppercase tracking-wider">
                {subtitle || (gameMode === 'survival'
                  ? t('survival.duelSub', '3 Lives • Live 1v1 Survival Duel • Endless Streak Challenge')
                  : gameMode === 'king_of_the_hill'
                  ? t('koth.onlineSub', 'Sudden Death Knockout • Challenge live players or invite friends')
                  : t('online.connectSub', 'Connect and pick your country together in real-time:'))}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {showPublicRooms ? (
                  <>
                    {/* King of the Hill: 1. Public Rooms Browser */}
                    <motion.button
                      whileHover={{ y: -2, scale: 1.015 }}
                      whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      onClick={() => setStep('public_rooms')}
                      className="w-full py-3.5 px-5 rounded-[18px] font-black text-base uppercase tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-between outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <Radio className="w-5 h-5 text-black animate-pulse" />
                        <span>{t('online.publicRooms', 'PUBLIC ROOMS')}</span>
                      </div>
                      <span className="text-[11px] font-black bg-black text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {publicRooms.length > 0 ? `${publicRooms.length} OPEN` : 'BROWSE'}
                      </span>
                    </motion.button>

                    {/* King of the Hill: 2. Create Room */}
                    <motion.button
                      whileHover={{ y: -2, scale: 1.015 }}
                      whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      onClick={handleStartCreateRoom}
                      disabled={isCreatingRoom}
                      className="w-full py-3.5 px-5 rounded-[18px] font-black text-base uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-center outline-none transition-all disabled:opacity-80 disabled:cursor-wait"
                    >
                      <div className="flex items-center gap-3">
                        {isCreatingRoom ? (
                          <Loader2 className="w-5 h-5 text-black animate-spin" />
                        ) : (
                          <Crown className="w-5 h-5 text-black" />
                        )}
                        <span>
                          {isCreatingRoom
                            ? t('online.creatingRoom', 'CREATING ROOM...')
                            : t('online.createRoom', 'CREATE ROOM')}
                        </span>
                      </div>
                    </motion.button>

                    {/* King of the Hill: 3. Join with Code */}
                    <motion.button
                      whileHover={{ y: -2, scale: 1.015 }}
                      whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      onClick={handleStartJoinRoom}
                      className="w-full py-3.5 px-5 rounded-[18px] font-black text-base uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-black border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer flex items-center justify-center outline-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogIn className="w-5 h-5 text-black" />
                        <span>{t('online.joinRoom', 'JOIN ROOM')}</span>
                      </div>
                    </motion.button>
                  </>
                ) : (
                  <>
                    {/* All Other Modes (Quick Play, Survival, etc.): Strictly Quick Matchmaking, Create Room, Join Room */}
                    {/* 1. Quick Matchmaking */}
                    <motion.button
                      whileHover={{ y: -2, scale: 1.015 }}
                      whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      disabled={isCreatingRoom}
                      onClick={handleStartMatchmaking}
                      className="w-full py-4 px-5 rounded-[18px] font-black text-base uppercase tracking-wider border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-center outline-none transition-all bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-black"
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-black animate-pulse" />
                        <span>{t('online.findMatch', 'QUICK MATCHMAKING')}</span>
                      </div>
                    </motion.button>

                    {/* 2. Create Room */}
                    <motion.button
                      whileHover={{ y: -2, scale: 1.015 }}
                      whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      onClick={handleStartCreateRoom}
                      disabled={isCreatingRoom}
                      className="w-full py-4 px-5 rounded-[18px] font-black text-base uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-center outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        {isCreatingRoom ? (
                          <Loader2 className="w-5 h-5 text-black animate-spin" />
                        ) : (
                          <Users className="w-5 h-5 text-black" />
                        )}
                        <span>
                          {isCreatingRoom
                            ? t('online.creatingRoom', 'CREATING ROOM...')
                            : t('online.createRoom', 'CREATE ROOM')}
                        </span>
                      </div>
                    </motion.button>

                    {/* 3. Join Room */}
                    <motion.button
                      whileHover={{ y: -2, scale: 1.015 }}
                      whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      onClick={handleStartJoinRoom}
                      className="w-full py-4 px-5 rounded-[18px] font-black text-base uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-black border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer flex items-center justify-center outline-none transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <LogIn className="w-5 h-5 text-black" />
                        <span>{t('online.joinRoom', 'JOIN ROOM')}</span>
                      </div>
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP: MATCHMAKING MODAL (Dedicated Search with Turning Network Icon) */}
          {/* ============================================================ */}
          {step === 'matchmaking' && (
            <div className="flex flex-col items-center text-center">
              {/* Back to Menu Button */}
              <button
                onClick={handleCancelMatchmaking}
                className="self-start flex items-center gap-1.5 text-xs font-black uppercase text-slate-500 hover:text-black mb-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('common.back', 'BACK')}</span>
              </button>

              {/* Dedicated Mode Space Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-black mb-2 shadow-2xs bg-amber-300 text-black">
                {gameMode === 'survival' ? (
                  <>
                    <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
                    <span>SURVIVAL 1V1 SPACE</span>
                  </>
                ) : gameMode === 'king_of_the_hill' ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-700 fill-amber-500" />
                    <span>KING OF THE HILL SPACE</span>
                  </>
                ) : wagerTier ? (
                  <>
                    <Trophy className="w-3.5 h-3.5 text-yellow-700 fill-yellow-500" />
                    <span>{wagerTier.toUpperCase()} ARENA SPACE</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-emerald-700 fill-emerald-500" />
                    <span>QUICK MATCH SPACE</span>
                  </>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black mb-1">
                {t('online.searchingOpponents', 'SEARCHING FOR OPPONENTS')}
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                {t('online.matchingWorldwide', 'Connecting to global matchmaking pool...')}
              </p>

              {/* Turning Network Icon Visualizer with Pulse Rings */}
              <div className="relative w-36 h-36 flex items-center justify-center my-3">
                {/* Expanding pulse rings */}
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping opacity-60 pointer-events-none" />
                <div className="absolute inset-2 rounded-full border-2 border-dashed border-emerald-400/40 pointer-events-none" />
                <div className="absolute inset-6 rounded-full border border-emerald-500/30 pointer-events-none" />

                {/* Turning / Rotating Network Icon */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                  className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-300 border-[3px] border-black flex items-center justify-center shadow-[0_4px_0_0_#000] z-10"
                >
                  <Wifi className="w-10 h-10 text-black stroke-[2.5]" />
                </motion.div>
              </div>

              {/* Countdown / Search Timer */}
              <div className="flex flex-col items-center gap-1.5 mb-5">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full border-2 border-black font-mono font-black text-sm text-black shadow-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {Math.floor(matchmakingSeconds / 60)}:{(matchmakingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">
                  {t('online.lookingForPlayers', 'LOOKING FOR AN AVAILABLE OPPONENT...')}
                </span>
              </div>

              {/* Cancel Search Button */}
              <motion.button
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ y: 2, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                onClick={handleCancelMatchmaking}
                className="w-full py-3.5 px-5 rounded-[18px] font-black text-sm uppercase tracking-wider bg-rose-500 hover:bg-rose-600 text-white border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer flex items-center justify-center outline-none transition-all"
              >
                <span>{t('online.cancelSearch', 'CANCEL SEARCH')}</span>
              </motion.button>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: CREATE ROOM MODAL (Displays Room Code + Waiting) */}
          {/* ============================================================ */}
          {step === 'create' && (
            <div className="flex flex-col items-center text-center">
              {/* Dedicated Mode Space Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-black mb-3 shadow-2xs bg-amber-300 text-black">
                {gameMode === 'survival' ? (
                  <>
                    <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
                    <span>SURVIVAL 1V1 SPACE</span>
                  </>
                ) : gameMode === 'king_of_the_hill' ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-700 fill-amber-500" />
                    <span>KING OF THE HILL SPACE</span>
                  </>
                ) : wagerTier ? (
                  <>
                    <Trophy className="w-3.5 h-3.5 text-yellow-700 fill-yellow-500" />
                    <span>{wagerTier.toUpperCase()} ARENA SPACE</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-emerald-700 fill-emerald-500" />
                    <span>QUICK MATCH SPACE</span>
                  </>
                )}
              </div>

              <div className="w-12 h-12 rounded-full bg-sky-100 border-[2.5px] border-black flex items-center justify-center mb-2">
                <Crown className="w-6 h-6 text-sky-600" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black mb-1">
                {t('online.roomCreated', 'ROOM CREATED')}
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">
                {gameMode === 'survival'
                  ? 'Opponent must join through Survival to enter this room'
                  : gameMode === 'king_of_the_hill'
                  ? 'Opponents must join through King of the Hill to enter this room'
                  : wagerTier
                  ? `Opponent must join through ${wagerTier.toUpperCase()} Arena to enter this room`
                  : 'Opponent must join through Quick Match to enter this room'}
              </p>

              {/* 5-Digit Code Card */}
              <div className="w-full bg-slate-100 border-[3px] border-black rounded-[20px] p-4 flex flex-col items-center gap-3 mb-5 shadow-inner">
                <span className="font-mono font-black text-4xl sm:text-5xl text-black tracking-[0.25em] pl-2">
                  {createdRoomCode || '.....'}
                </span>

                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-black rounded-[12px] border-[2px] border-black font-black text-xs uppercase cursor-pointer shadow-xs transition-all"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-900" /> : <Copy className="w-4 h-4 text-black" />}
                    <span>{isCopied ? t('online.codeCopied', 'CODE COPIED!') : t('online.copyCode', 'COPY CODE')}</span>
                  </button>

                  <button
                    onClick={handleCopyInviteLink}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-400 hover:bg-sky-300 active:scale-95 text-black rounded-[12px] border-[2px] border-black font-black text-xs uppercase cursor-pointer shadow-xs transition-all"
                  >
                    {isLinkCopied ? <Check className="w-4 h-4 text-emerald-900" /> : <LinkIcon className="w-4 h-4 text-black" />}
                    <span>{isLinkCopied ? t('online.linkCopied', 'LINK COPIED!') : t('online.inviteLink', 'INVITE LINK')}</span>
                  </button>
                </div>
              </div>

              {/* King of the Hill Fast-Track to Lobby */}
              {gameMode === 'king_of_the_hill' && (
                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 2, scale: 0.98 }}
                  onClick={() => {
                    if (onlineMatchManager.currentRoom) {
                      crazyGamesSDK.hideInviteButton();
                      onClose();
                      onRoomConnected(onlineMatchManager.currentRoom);
                    }
                  }}
                  className="w-full mb-4 py-3 rounded-[16px] font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-300 text-black border-[2.5px] border-black shadow-[0_3px_0_0_#000] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4 text-black" />
                  <span>{t('online.enterLobby', 'OPEN TOURNAMENT LOBBY NOW')}</span>
                </motion.button>
              )}

              {/* Waiting for player status */}
              <div className="flex items-center gap-2 mb-6">
                <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
                <span className="font-black text-xs uppercase text-slate-700 tracking-wider">
                  {gameMode === 'king_of_the_hill'
                    ? t('online.waitingKothPlayers', 'Waiting for contenders to enter code...')
                    : t('online.waitingOpponentCode', 'Waiting for opponent to enter code...')}
                </span>
              </div>

              {/* Cancel Button */}
              <motion.button
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ y: 4, scale: 0.98 }}
                onClick={handleCancelAndBack}
                className="w-full py-3.5 rounded-[18px] font-black text-sm uppercase tracking-wider bg-rose-500 text-white border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer"
              >
                {t('online.cancelRoom', 'CANCEL ROOM')}
              </motion.button>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: PUBLIC ROOMS BROWSER */}
          {/* ============================================================ */}
          {step === 'public_rooms' && (
            <div className="flex flex-col text-left">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStep('menu')}
                    className="p-1.5 rounded-full hover:bg-slate-100 border border-black transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-black" />
                  </button>
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-black flex items-center gap-2">
                    <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <span>{t('online.publicRooms', 'PUBLIC ROOMS')}</span>
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={async () => {
                      setIsLoadingPublicRooms(true);
                      const rooms = await onlineMatchManager.getPublicRooms();
                      setPublicRooms(rooms);
                      setIsLoadingPublicRooms(false);
                    }}
                    className="p-1.5 rounded-[10px] bg-slate-100 hover:bg-slate-200 border-2 border-black text-black transition-all cursor-pointer"
                    title="Refresh Public Rooms"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPublicRooms ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* King of the Hill Public Indicator */}
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex items-center gap-1.5 pb-1">
                  <span className="px-3 py-1 rounded-[10px] text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black border-2 border-black flex items-center gap-1.5 shadow-xs">
                    <Crown className="w-3.5 h-3.5 fill-black text-black" />
                    <span>PUBLIC KING OF THE HILL ROOMS (4 PLAYERS)</span>
                  </span>
                </div>
              </div>

              {/* Error Toast */}
              {errorMessage && (
                <div className="w-full p-2 mb-2 bg-rose-100 border-[2px] border-rose-500 rounded-[12px] text-rose-700 text-xs font-black flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Rooms List */}
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 mb-3">
                {isLoadingPublicRooms ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">Loading active public rooms...</span>
                  </div>
                ) : (() => {
                  const filtered = publicRooms.filter((r) => r.gameMode === 'king_of_the_hill');

                  if (filtered.length === 0) {
                    return (
                      <div className="py-6 px-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-[18px] text-center flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-400" />
                        <span className="text-xs font-black uppercase text-slate-600">
                          {t('online.noRoomsFound', 'No active public rooms right now')}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Be the first to host! Create a tournament room and challenge players worldwide.
                        </span>
                        <button
                          onClick={handleStartCreateRoom}
                          disabled={isCreatingRoom}
                          className="mt-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black rounded-[12px] font-black text-xs uppercase cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-wait"
                        >
                          {isCreatingRoom ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>{isCreatingRoom ? t('online.creatingRoom', 'CREATING ROOM...') : t('online.createRoom', 'CREATE A ROOM')}</span>
                        </button>
                      </div>
                    );
                  }

                  return filtered.map((r) => {
                    const isKoth = r.gameMode === 'king_of_the_hill';
                    const hostCountry = COUNTRIES_DATA.find(
                      (c) => c.code.toLowerCase() === (r.host?.countryCode || '').toLowerCase()
                    );
                    const playerCount = Array.isArray(r.players)
                      ? r.players.length
                      : r.guest
                      ? 2
                      : 1;
                    const maxCount = r.maxPlayers || (isKoth ? 4 : 2);

                    return (
                      <div
                        key={r.roomId}
                        className="p-3 bg-slate-50 hover:bg-slate-100 border-[2.5px] border-black rounded-[16px] shadow-2xs flex items-center justify-between gap-3 transition-colors"
                      >
                        {/* Host & Mode info */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-7 rounded-[8px] border-2 border-black overflow-hidden shadow-2xs shrink-0">
                            {hostCountry ? (
                              <LazyFlagImage countryCode={hostCountry.code} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-200 flex items-center justify-center font-black text-[9px]">
                                {r.host?.name?.slice(0, 2) || '??'}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-xs sm:text-sm text-black">
                                #{r.roomId}
                              </span>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                                  isKoth
                                    ? 'bg-amber-200 text-amber-900 border border-amber-400'
                                    : 'bg-sky-200 text-sky-900 border border-sky-400'
                                }`}
                              >
                                {isKoth ? '👑 KOTH' : '1V1'}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-600 truncate">
                              Host: {r.host?.name || 'Player'}
                            </span>
                          </div>
                        </div>

                        {/* Occupancy and Join Button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              playerCount >= maxCount
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-white text-slate-600 border-slate-300'
                            }`}
                          >
                            {playerCount}/{maxCount}
                          </span>

                          <motion.button
                            whileHover={playerCount < maxCount && !joiningRoomId ? { scale: 1.05 } : {}}
                            whileTap={playerCount < maxCount && !joiningRoomId ? { scale: 0.95 } : {}}
                            disabled={playerCount >= maxCount || !!joiningRoomId}
                            onClick={async () => {
                              if (playerCount >= maxCount) {
                                setErrorMessage(`Room #${r.roomId} is full (${maxCount}/${maxCount} players max).`);
                                return;
                              }
                              setErrorMessage(null);
                              setJoiningRoomId(r.roomId);
                              try {
                                const success = await onlineMatchManager.joinRoom(r.roomId, 'king_of_the_hill');
                                if (success && onlineMatchManager.currentRoom) {
                                  onClose();
                                  onRoomConnected(onlineMatchManager.currentRoom);
                                }
                              } catch (err: any) {
                                setErrorMessage(err?.message || `Failed to join room #${r.roomId}.`);
                              } finally {
                                setJoiningRoomId(null);
                              }
                            }}
                            className={`px-3.5 py-1.5 border-[2px] rounded-[12px] font-black text-xs uppercase shadow-xs transition-colors flex items-center justify-center gap-1.5 min-w-[62px] ${
                              playerCount >= maxCount
                                ? 'bg-slate-200 border-slate-400 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-400 hover:bg-emerald-300 text-black border-black cursor-pointer'
                            }`}
                          >
                            {joiningRoomId === r.roomId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                            ) : playerCount >= maxCount ? (
                              'FULL'
                            ) : (
                              'JOIN'
                            )}
                          </motion.button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Bottom Quick Create Action */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  onClick={() => setStep('menu')}
                  className="px-3 py-2 text-xs font-black uppercase text-slate-600 hover:text-black cursor-pointer"
                >
                  {t('common.back', 'BACK')}
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartCreateRoom}
                  disabled={isCreatingRoom}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black rounded-[14px] font-black text-xs uppercase cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-75 disabled:cursor-wait"
                >
                  {isCreatingRoom ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isCreatingRoom ? t('online.creatingRoom', 'CREATING...') : t('online.createRoom', 'CREATE ROOM')}</span>
                </motion.button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: JOIN ROOM MODAL (Input + Join + Cancel) */}
          {/* ============================================================ */}
          {step === 'join' && (
            <div className="flex flex-col items-center text-center">
              {/* Dedicated Mode Space Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-black mb-3 shadow-2xs bg-emerald-300 text-black">
                {gameMode === 'survival' ? (
                  <>
                    <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
                    <span>SURVIVAL 1V1 SPACE</span>
                  </>
                ) : gameMode === 'king_of_the_hill' ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-700 fill-amber-500" />
                    <span>KING OF THE HILL SPACE</span>
                  </>
                ) : wagerTier ? (
                  <>
                    <Trophy className="w-3.5 h-3.5 text-yellow-700 fill-yellow-500" />
                    <span>{wagerTier.toUpperCase()} ARENA SPACE</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-emerald-700 fill-emerald-500" />
                    <span>QUICK MATCH SPACE</span>
                  </>
                )}
              </div>

              <div className="w-12 h-12 rounded-full bg-emerald-100 border-[2.5px] border-black flex items-center justify-center mb-2">
                <LogIn className="w-6 h-6 text-emerald-600" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black mb-1">
                {gameMode === 'survival'
                  ? 'JOIN SURVIVAL ROOM'
                  : gameMode === 'king_of_the_hill'
                  ? 'JOIN KING OF THE HILL'
                  : wagerTier
                  ? `JOIN ${wagerTier.toUpperCase()} ARENA`
                  : t('online.joinRoomTitle', 'JOIN QUICK MATCH')}
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
                {gameMode === 'survival'
                  ? 'Enter the 5-digit room code created in Survival:'
                  : gameMode === 'king_of_the_hill'
                  ? 'Enter the 5-digit room code created in King of the Hill:'
                  : wagerTier
                  ? `Enter the 5-digit room code created in ${wagerTier.toUpperCase()} Arena:`
                  : 'Enter the 5-digit room code created in Quick Match:'}
              </p>

              {/* Mode Isolation Notice */}
              <div className="w-full text-[11px] font-bold text-slate-600 mb-4 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-[12px] border border-slate-300">
                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>
                  {gameMode === 'survival'
                    ? 'Only rooms created in Survival can be joined here.'
                    : gameMode === 'king_of_the_hill'
                    ? 'Only rooms created in King of the Hill can be joined here.'
                    : wagerTier
                    ? `Only rooms created in ${wagerTier.toUpperCase()} Arena can be joined here.`
                    : 'Only rooms created in Quick Match can be joined here.'}
                </span>
              </div>

              {/* Error Toast */}
              {errorMessage && (
                <div className="w-full p-2.5 mb-3 bg-rose-100 border-[2px] border-rose-500 rounded-[12px] text-rose-700 text-xs font-black flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Input Field */}
              <div className="w-full mb-5">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  placeholder="58291"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  disabled={isJoiningRoom}
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isJoiningRoom) {
                      e.preventDefault();
                      handleConfirmJoinRoom();
                    }
                  }}
                  className="w-full bg-slate-100 text-black font-mono font-black text-3xl sm:text-4xl text-center py-3.5 rounded-[18px] border-[3px] border-black focus:border-emerald-500 outline-none tracking-[0.25em] placeholder:text-slate-400 select-text disabled:opacity-60"
                />
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-2.5">
                <motion.button
                  whileHover={!isJoiningRoom ? { y: -2, scale: 1.015 } : {}}
                  whileTap={!isJoiningRoom ? { y: 4, scale: 0.98 } : {}}
                  disabled={isJoiningRoom}
                  onClick={handleConfirmJoinRoom}
                  className="w-full py-3.5 rounded-[18px] font-black text-base uppercase tracking-wider bg-emerald-400 text-black border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-wait"
                >
                  {isJoiningRoom ? (
                    <>
                      <Loader2 className="w-5 h-5 text-black animate-spin" />
                      <span>{t('online.connecting', 'JOINING ROOM...')}</span>
                    </>
                  ) : (
                    <span>{t('online.joinRoom', 'JOIN ROOM')}</span>
                  )}
                </motion.button>

                <button
                  onClick={handleCancelAndBack}
                  disabled={isJoiningRoom}
                  className="w-full py-2.5 text-xs font-black uppercase text-slate-500 hover:text-black cursor-pointer disabled:opacity-50"
                >
                  {t('common.cancel', 'CANCEL')}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
