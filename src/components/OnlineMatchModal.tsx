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
  Link as LinkIcon,
} from 'lucide-react';
import { Country, COUNTRIES_DATA } from '../data/countries';
import { onlineMatchManager } from '../utils/onlineMatchManager';
import { OnlineMatchRoom } from '../types';
import { crazyGamesSDK } from '../utils/crazyGamesSDK';

interface OnlineMatchModalProps {
  isOpen: boolean;
  selectedCountry?: Country | null;
  gameMode?: 'match' | 'penalty_training' | 'survival';
  wagerTier?: 'rookie' | 'pro' | 'champion' | 'legend';
  entryFee?: number;
  prizePot?: number;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onRoomConnected: (room: OnlineMatchRoom) => void;
}

type OnlineStep = 'menu' | 'create' | 'join' | 'searching';

export default function OnlineMatchModal({
  isOpen,
  selectedCountry,
  gameMode = 'match',
  wagerTier,
  entryFee,
  prizePot,
  title,
  subtitle,
  onClose,
  onRoomConnected,
}: OnlineMatchModalProps) {
  const [step, setStep] = useState<OnlineStep>('menu');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTimer, setSearchTimer] = useState(0);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setStep('menu');
      setRoomCodeInput('');
      setErrorMessage(null);
      setIsCopied(false);
      setIsLinkCopied(false);
    } else {
      crazyGamesSDK.hideInviteButton();
    }
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

    return () => {
      unsubCreated();
      unsubJoined();
      unsubPlayerJoined();
      unsubError();
      crazyGamesSDK.hideInviteButton();
    };
  }, [isOpen, onClose, onRoomConnected]);

  // Search Timer
  useEffect(() => {
    let interval: any;
    if (step === 'searching') {
      setSearchTimer(0);
      interval = setInterval(() => {
        setSearchTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleStartCreateRoom = async () => {
    setErrorMessage(null);
    setStep('create');
    const code = await onlineMatchManager.createRoom(
      gameMode,
      undefined,
      false,
      undefined,
      null,
      wagerTier,
      entryFee,
      prizePot
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

  const handleStartFindMatch = async () => {
    setErrorMessage(null);
    setStep('searching');
    const success = await onlineMatchManager.findMatch(gameMode, wagerTier, entryFee, prizePot);
    if (!success && !onlineMatchManager.isSearchingMatchmaking) {
      // If immediate failure and not searching
      if (!errorMessage) {
        setErrorMessage('Could not connect to matchmaking pool. Please try again.');
      }
    }
  };

  const handleCancelAndBack = () => {
    crazyGamesSDK.hideInviteButton();
    if (step === 'searching') {
      onlineMatchManager.cancelMatchmaking();
    } else {
      onlineMatchManager.leaveRoom();
    }
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
              if (step === 'searching') {
                onlineMatchManager.cancelMatchmaking();
              } else {
                onlineMatchManager.leaveRoom();
              }
              onClose();
            }}
            className="absolute top-4 right-4 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-slate-100 shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ============================================================ */}
          {/* STEP 1: INITIAL 3-BUTTON MODAL (Find Match, Create, Join) */}
          {/* ============================================================ */}
          {step === 'menu' && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black mb-1">
                {title || (gameMode === 'survival' ? 'ONLINE SURVIVAL 1V1' : 'ONLINE MATCH')}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mb-6 font-bold uppercase tracking-wider">
                {subtitle || (gameMode === 'survival'
                  ? '3 Lives • Live 1v1 Survival Duel • Endless Streak Challenge'
                  : 'Connect and pick your country together in real-time:')}
              </p>

              {/* 3 Main Action Buttons */}
              <div className="flex flex-col gap-3.5">
                {/* 1. Find a Match */}
                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  onClick={handleStartFindMatch}
                  className="w-full py-4 px-5 rounded-[18px] font-black text-base uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-300 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-center outline-none"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 fill-black text-black" />
                    <span>FIND A MATCH</span>
                  </div>
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
                    <span>CREATE A ROOM</span>
                  </div>
                </motion.button>

                {/* 3. Join a Room */}
                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  onClick={handleStartJoinRoom}
                  className="w-full py-4 px-5 rounded-[18px] font-black text-base uppercase tracking-wider bg-emerald-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-center outline-none"
                >
                  <div className="flex items-center gap-3">
                    <LogIn className="w-5 h-5 text-black" />
                    <span>JOIN ROOM</span>
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
                ROOM CREATED
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">
                Share this 5-digit code with your opponent
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
                    <span>{isCopied ? 'CODE COPIED!' : 'COPY CODE'}</span>
                  </button>

                  <button
                    onClick={handleCopyInviteLink}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-400 hover:bg-sky-300 active:scale-95 text-black rounded-[12px] border-[2px] border-black font-black text-xs uppercase cursor-pointer shadow-xs transition-all"
                  >
                    {isLinkCopied ? <Check className="w-4 h-4 text-emerald-900" /> : <LinkIcon className="w-4 h-4 text-black" />}
                    <span>{isLinkCopied ? 'LINK COPIED!' : 'INVITE LINK'}</span>
                  </button>
                </div>
              </div>

              {/* Waiting for player status */}
              <div className="flex items-center gap-2 mb-6">
                <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
                <span className="font-black text-xs uppercase text-slate-700 tracking-wider">
                  Waiting for opponent to enter code...
                </span>
              </div>

              {/* Cancel Button */}
              <motion.button
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ y: 4, scale: 0.98 }}
                onClick={handleCancelAndBack}
                className="w-full py-3.5 rounded-[18px] font-black text-sm uppercase tracking-wider bg-rose-500 text-white border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer"
              >
                CANCEL ROOM
              </motion.button>
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
                JOIN A ROOM
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">
                Enter the 5-digit room code:
              </p>

              {/* Error Toast */}
              {errorMessage && (
                <div className="w-full p-2.5 mb-3 bg-rose-100 border-[2px] border-rose-500 rounded-[12px] text-rose-700 text-xs font-black">
                  ⚠️ {errorMessage}
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
                  JOIN ROOM
                </motion.button>

                <button
                  onClick={handleCancelAndBack}
                  className="w-full py-2.5 text-xs font-black uppercase text-slate-500 hover:text-black cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: SEARCHING FOR OPPONENT MODAL */}
          {/* ============================================================ */}
          {step === 'searching' && (
            <div className="flex flex-col items-center text-center py-2">
              {errorMessage && (
                <div className="w-full p-2.5 mb-3 bg-rose-100 border-[2px] border-rose-500 rounded-[12px] text-rose-700 text-xs font-black">
                  ⚠️ {errorMessage}
                </div>
              )}

              <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/50 animate-ping"></div>
                <div className="absolute inset-2 rounded-full border-2 border-amber-400/70 animate-pulse"></div>
                <div className="w-14 h-14 rounded-full bg-amber-400/20 border-[2.5px] border-black flex items-center justify-center shadow-inner">
                  <Radio className="w-7 h-7 text-black animate-spin" />
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black mb-1">
                SEARCHING FOR MATCH
              </h2>
              <p className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">
                Looking for an online opponent... ({searchTimer}s)
              </p>
              <p className="text-[11px] text-slate-400 mb-5">
                {searchTimer >= 15
                  ? 'Still searching... You can also create a private room to share with a friend!'
                  : 'Pairing automatically with anyone searching worldwide'}
              </p>

              <div className="w-full flex flex-col gap-2.5">
                {errorMessage && (
                  <motion.button
                    whileHover={{ y: -2, scale: 1.015 }}
                    whileTap={{ y: 4, scale: 0.98 }}
                    onClick={handleStartFindMatch}
                    className="w-full py-3 rounded-[16px] font-black text-sm uppercase tracking-wider bg-amber-400 text-black border-[3px] border-black shadow-[0_3px_0_0_#000] cursor-pointer"
                  >
                    RETRY SEARCH
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98 }}
                  onClick={handleCancelAndBack}
                  className="w-full py-3.5 rounded-[18px] font-black text-sm uppercase tracking-wider bg-rose-500 text-white border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer"
                >
                  CANCEL SEARCH
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
