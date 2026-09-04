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
  Search,
  Globe,
  Lock,
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

type OnlineStep = 'menu' | 'create' | 'join' | 'public_rooms';

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
  const [isRoomPublic, setIsRoomPublic] = useState<boolean>(true);
  const [kickedMessage, setKickedMessage] = useState<string | null>(null);

  // Public Rooms State
  const [publicRooms, setPublicRooms] = useState<OnlineMatchRoom[]>([]);
  const [isLoadingPublicRooms, setIsLoadingPublicRooms] = useState(false);
  const [publicRoomFilter, setPublicRoomFilter] = useState<'all' | 'king_of_the_hill' | 'match'>('all');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');

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

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep || 'menu');
      setRoomCodeInput('');
      setErrorMessage(null);
      setIsCopied(false);
      setIsLinkCopied(false);
      setIsRoomPublic(true);
      if (gameMode === 'king_of_the_hill') {
        setPublicRoomFilter('king_of_the_hill');
      } else {
        setPublicRoomFilter('all');
      }
    } else {
      crazyGamesSDK.hideInviteButton();
    }
  }, [isOpen, initialStep, gameMode]);

  // Subscribe to public rooms whenever modal is open
  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingPublicRooms(true);

    const unsub = onlineMatchManager.subscribePublicRooms((rooms) => {
      setPublicRooms(rooms);
      setIsLoadingPublicRooms(false);
    });

    return () => {
      unsub();
    };
  }, [isOpen]);

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
      setErrorMessage(payload.message || 'Connection error. Please try again.');
    });

    const unsubRoomFull = onlineMatchManager.on('room_full', (payload) => {
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

  const handleStartCreateRoom = async () => {
    setErrorMessage(null);
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
        isRoomPublic
      );
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
      isRoomPublic
    );
    setCreatedRoomCode(code);
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
    const success = await onlineMatchManager.joinRoom(cleaned);
    if (success && onlineMatchManager.currentRoom) {
      onClose();
      onRoomConnected(onlineMatchManager.currentRoom);
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
          {/* STEP 1: INITIAL 3-BUTTON MODAL (Public Rooms, Create, Join) */}
          {/* ============================================================ */}
          {step === 'menu' && (
            <div>
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

              {/* 3 Main Action Buttons */}
              <div className="flex flex-col gap-3.5">
                {/* 1. Public Rooms Browser */}
                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  onClick={() => {
                    setPublicRoomFilter(gameMode === 'king_of_the_hill' ? 'king_of_the_hill' : 'all');
                    setStep('public_rooms');
                  }}
                  className="w-full py-4 px-5 rounded-[18px] font-black text-base uppercase tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-between outline-none"
                >
                  <div className="flex items-center gap-3">
                    <Radio className="w-5 h-5 text-black animate-pulse" />
                    <span>{t('online.publicRooms', 'PUBLIC ROOMS')}</span>
                  </div>
                  <span className="text-[11px] font-black bg-black text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {publicRooms.length > 0 ? `${publicRooms.length} OPEN` : 'BROWSE'}
                  </span>
                </motion.button>

                {/* 2. Create a Room */}
                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  onClick={handleStartCreateRoom}
                  className="w-full py-4 px-5 rounded-[18px] font-black text-base uppercase tracking-wider bg-sky-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-center outline-none"
                >
                  <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5 text-black" />
                    <span>{t('online.createRoom', 'CREATE A ROOM')}</span>
                  </div>
                </motion.button>

                {/* 3. Join a Room */}
                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  onClick={handleStartJoinRoom}
                  className="w-full py-4 px-5 rounded-[18px] font-black text-base uppercase tracking-wider bg-amber-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-center outline-none"
                >
                  <div className="flex items-center gap-3">
                    <LogIn className="w-5 h-5 text-black" />
                    <span>{t('online.joinRoom', 'JOIN ROOM WITH CODE')}</span>
                  </div>
                </motion.button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: CREATE ROOM MODAL (Displays Room Code + Waiting) */}
          {/* ============================================================ */}
          {step === 'create' && (
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-sky-100 border-[2.5px] border-black flex items-center justify-center mb-3">
                <Crown className="w-6 h-6 text-sky-600" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black mb-1">
                {t('online.roomCreated', 'ROOM CREATED')}
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">
                {t('online.shareCode', 'Share this 5-digit code with your opponent')}
              </p>

              {/* 5-Digit Code Card */}
              <div className="w-full bg-slate-100 border-[3px] border-black rounded-[20px] p-4 flex flex-col items-center gap-3 mb-4 shadow-inner">
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

              {/* Public / Private Room Visibility Toggle */}
              <div className="w-full bg-slate-50 border-[2.5px] border-black rounded-[20px] p-3.5 mb-4 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-left min-w-0">
                    <div className={`w-9 h-9 rounded-[12px] border-2 border-black flex items-center justify-center shrink-0 ${
                      isRoomPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isRoomPublic ? (
                        <Globe className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <Lock className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-black">
                          {isRoomPublic ? t('online.publicRoom', 'PUBLIC ROOM') : t('online.privateRoom', 'PRIVATE ROOM')}
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase border ${
                          isRoomPublic
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {isRoomPublic ? 'OPEN' : 'HIDDEN'}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 leading-tight">
                        {isRoomPublic
                          ? t('online.publicDesc', 'Visible in Public Rooms for others to join')
                          : t('online.privateDesc', 'Hidden from Public Rooms • Code required')}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      const nextVal = !isRoomPublic;
                      setIsRoomPublic(nextVal);
                      await onlineMatchManager.setRoomPublic(nextVal);
                    }}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-[2.5px] border-black transition-colors duration-200 ease-in-out focus:outline-none ${
                      isRoomPublic ? 'bg-emerald-400' : 'bg-slate-300'
                    }`}
                    role="switch"
                    aria-checked={isRoomPublic}
                    title={isRoomPublic ? 'Switch to Private' : 'Switch to Public'}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white border-2 border-black shadow-xs ring-0 transition duration-200 ease-in-out mt-0.25 ${
                        isRoomPublic ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
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
                    : isRoomPublic
                    ? t('online.waitingPublicOpponent', 'Waiting for players in Public Rooms or code entry...')
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

              {/* Search and Filters */}
              <div className="flex flex-col gap-2 mb-3">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by code or host..."
                    value={roomSearchQuery}
                    onChange={(e) => setRoomSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-bold bg-slate-100 border-2 border-black rounded-[12px] outline-none"
                  />
                </div>

                {/* Filter tabs */}
                {gameMode === 'king_of_the_hill' ? (
                  <div className="flex items-center gap-1.5 pb-1">
                    <span className="px-3 py-1 rounded-[10px] text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black border-2 border-black flex items-center gap-1.5 shadow-xs">
                      <Crown className="w-3.5 h-3.5 fill-black text-black" />
                      <span>PUBLIC KING OF THE HILL ROOMS (4 CONTENDERS)</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {(['all', 'king_of_the_hill', 'match'] as const).map((filterType) => (
                      <button
                        key={filterType}
                        onClick={() => setPublicRoomFilter(filterType)}
                        className={`px-2.5 py-1 rounded-[10px] text-[10px] font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer shrink-0 ${
                          publicRoomFilter === filterType
                            ? 'bg-black text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {filterType === 'all'
                          ? 'ALL PUBLIC ROOMS'
                          : filterType === 'king_of_the_hill'
                          ? '👑 PUBLIC KING OF THE HILL'
                          : '⚽ 1V1 MATCH'}
                      </button>
                    ))}
                  </div>
                )}
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
                  const filtered = publicRooms.filter((r) => {
                    if (publicRoomFilter !== 'all' && r.gameMode !== publicRoomFilter) return false;
                    if (roomSearchQuery) {
                      const q = roomSearchQuery.toLowerCase();
                      const matchCode = r.roomId.toLowerCase().includes(q);
                      const matchHost = r.host?.name?.toLowerCase().includes(q);
                      if (!matchCode && !matchHost) return false;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-6 px-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-[18px] text-center flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-400" />
                        <span className="text-xs font-black uppercase text-slate-600">
                          {t('online.noRoomsFound', 'No active public rooms right now')}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Be the first to host! Create a room and challenge players worldwide.
                        </span>
                        <button
                          onClick={handleStartCreateRoom}
                          className="mt-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black rounded-[12px] font-black text-xs uppercase cursor-pointer shadow-xs"
                        >
                          {t('online.createRoom', 'CREATE A ROOM')}
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
                            whileHover={playerCount < maxCount ? { scale: 1.05 } : {}}
                            whileTap={playerCount < maxCount ? { scale: 0.95 } : {}}
                            disabled={playerCount >= maxCount}
                            onClick={async () => {
                              if (playerCount >= maxCount) {
                                setErrorMessage(`Room #${r.roomId} is full (${maxCount}/${maxCount} players max).`);
                                return;
                              }
                              setErrorMessage(null);
                              const success = await onlineMatchManager.joinRoom(r.roomId);
                              if (success && onlineMatchManager.currentRoom) {
                                onClose();
                                onRoomConnected(onlineMatchManager.currentRoom);
                              } else if (!errorMessage) {
                                setErrorMessage(`Room #${r.roomId} is full or unavailable.`);
                              }
                            }}
                            className={`px-3.5 py-1.5 border-[2px] rounded-[12px] font-black text-xs uppercase shadow-xs transition-colors ${
                              playerCount >= maxCount
                                ? 'bg-slate-200 border-slate-400 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-400 hover:bg-emerald-300 text-black border-black cursor-pointer'
                            }`}
                          >
                            {playerCount >= maxCount ? 'FULL' : 'JOIN'}
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
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black rounded-[14px] font-black text-xs uppercase cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('online.createRoom', 'CREATE ROOM')}</span>
                </motion.button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: JOIN ROOM MODAL (Input + Join + Cancel) */}
          {/* ============================================================ */}
          {step === 'join' && (
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border-[2.5px] border-black flex items-center justify-center mb-3">
                <LogIn className="w-6 h-6 text-emerald-600" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black mb-1">
                {t('online.joinRoomTitle', 'JOIN A ROOM')}
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">
                {t('online.enterCode', 'Enter the 5-digit room code:')}
              </p>

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
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmJoinRoom();
                    }
                  }}
                  className="w-full bg-slate-100 text-black font-mono font-black text-3xl sm:text-4xl text-center py-3.5 rounded-[18px] border-[3px] border-black focus:border-emerald-500 outline-none tracking-[0.25em] placeholder:text-slate-400 select-text"
                />
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-2.5">
                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98 }}
                  onClick={handleConfirmJoinRoom}
                  className="w-full py-3.5 rounded-[18px] font-black text-base uppercase tracking-wider bg-emerald-400 text-black border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer"
                >
                  {t('online.joinRoom', 'JOIN ROOM')}
                </motion.button>

                <button
                  onClick={handleCancelAndBack}
                  className="w-full py-2.5 text-xs font-black uppercase text-slate-500 hover:text-black cursor-pointer"
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
