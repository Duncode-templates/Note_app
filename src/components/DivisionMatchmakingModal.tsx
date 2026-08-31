import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Shield, Swords, Wifi } from 'lucide-react';
import { Country, getFlagUrl, getCountryByCode } from '../data/countries';
import { getTierInfo, getRandomCountryForDivision } from '../data/divisionData';
import { OnlineMatchRoom } from '../types';
import { onlineMatchManager } from '../utils/onlineMatchManager';
import LazyFlagImage from './LazyFlagImage';

interface DivisionMatchmakingModalProps {
  isOpen: boolean;
  divisionLevel: number;
  userCountry: Country;
  onClose: () => void;
  onStartOnlineMatch: (myCountry: Country, oppCountry: Country, room: OnlineMatchRoom | null) => void;
}

export default function DivisionMatchmakingModal({
  isOpen,
  divisionLevel,
  userCountry,
  onClose,
  onStartOnlineMatch,
}: DivisionMatchmakingModalProps) {
  const [matchState, setMatchState] = useState<'searching' | 'opponent_found'>('searching');
  const [searchSeconds, setSearchSeconds] = useState<number>(0);
  const [localDisplayCountry, setLocalDisplayCountry] = useState<Country>(userCountry);
  const [matchedOpponent, setMatchedOpponent] = useState<Country | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [matchedRoom, setMatchedRoom] = useState<OnlineMatchRoom | null>(null);

  const isCancelledRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const timerIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const tier = getTierInfo(divisionLevel);

  const clearAllTimers = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // Initialize and clean up matchmaking search on open/close
  useEffect(() => {
    isMountedRef.current = true;

    if (!isOpen) {
      isCancelledRef.current = true;
      clearAllTimers();
      setMatchState('searching');
      setSearchSeconds(0);
      setMatchedOpponent(null);
      setCountdown(3);
      setMatchedRoom(null);
      onlineMatchManager.cancelMatchmaking().catch(() => {});
      return;
    }

    isCancelledRef.current = false;
    clearAllTimers();

    // Identity Masking: Pick a random league country for the player in this division
    const initialRandomMyCountry = getRandomCountryForDivision(divisionLevel);
    setLocalDisplayCountry(initialRandomMyCountry);
    setMatchState('searching');
    setSearchSeconds(0);
    setMatchedOpponent(null);
    setCountdown(3);
    setMatchedRoom(null);

    // 1. Start live search timer
    const startTime = Date.now();
    timerIntervalRef.current = setInterval(() => {
      if (isCancelledRef.current) return;
      setSearchSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // 2. Start real online matchmaking search in Firestore
    onlineMatchManager.findDivisionMatch(divisionLevel, initialRandomMyCountry.code);

    // 3. Listen for matched real opponent events
    const unsubDivisionMatch = onlineMatchManager.on('division_match_found', (payload) => {
      if (isCancelledRef.current || !isMountedRef.current) return;
      const room: OnlineMatchRoom = payload.room;
      const isHost = payload.myRole === 'host' || room.host.id === onlineMatchManager.localPlayerId;

      const hostCode = payload.hostCountryCode || room.host.countryCode;
      const guestCode = payload.guestCountryCode || room.guest?.countryCode;

      const hostCountry = (hostCode ? getCountryByCode(hostCode) : null) || getRandomCountryForDivision(divisionLevel);
      const guestCountry = (guestCode ? getCountryByCode(guestCode) : null) || getRandomCountryForDivision(divisionLevel, hostCountry);

      const myCountry = isHost ? hostCountry : guestCountry;
      const oppCountry = isHost ? guestCountry : hostCountry;

      setLocalDisplayCountry(myCountry);
      handleOpponentFound(myCountry, oppCountry, room);
    });

    const unsubRoomJoined = onlineMatchManager.on('room_joined', (payload) => {
      if (isCancelledRef.current || !isMountedRef.current) return;
      if (payload.room?.gameMode === 'division_match' && payload.room?.guest && payload.room?.host) {
        const room: OnlineMatchRoom = payload.room;
        const isHost = payload.role === 'host' || room.host.id === onlineMatchManager.localPlayerId;
        const hostCode = room.host.countryCode;
        const guestCode = room.guest.countryCode;

        if (hostCode && guestCode) {
          const hostCountry = getCountryByCode(hostCode) || getRandomCountryForDivision(divisionLevel);
          const guestCountry = getCountryByCode(guestCode) || getRandomCountryForDivision(divisionLevel, hostCountry);
          const myCountry = isHost ? hostCountry : guestCountry;
          const oppCountry = isHost ? guestCountry : hostCountry;

          setLocalDisplayCountry(myCountry);
          handleOpponentFound(myCountry, oppCountry, room);
        }
      }
    });

    return () => {
      isMountedRef.current = false;
      clearAllTimers();
      unsubDivisionMatch();
      unsubRoomJoined();
    };
  }, [isOpen, divisionLevel]);

  const handleOpponentFound = (myCountry: Country, oppCountry: Country, room: OnlineMatchRoom | null) => {
    if (isCancelledRef.current || !isMountedRef.current) return;
    clearAllTimers();

    setLocalDisplayCountry(myCountry);
    setMatchedOpponent(oppCountry);
    setMatchedRoom(room);
    setMatchState('opponent_found');
    setCountdown(3);

    let count = 3;
    countdownIntervalRef.current = setInterval(() => {
      if (isCancelledRef.current || !isMountedRef.current) {
        clearAllTimers();
        return;
      }
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearAllTimers();
        if (!isCancelledRef.current && isMountedRef.current) {
          onStartOnlineMatch(myCountry, oppCountry, room);
        }
      }
    }, 1000);
  };

  const handleCancel = async () => {
    isCancelledRef.current = true;
    clearAllTimers();
    setMatchState('searching');
    setMatchedOpponent(null);
    setMatchedRoom(null);
    await onlineMatchManager.cancelMatchmaking().catch(() => {});
    onClose();
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800/90 rounded-3xl p-6 shadow-2xl text-white flex flex-col items-center gap-5 overflow-hidden"
        >
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

          {/* Top Bar with Badge and Close */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-full px-3.5 py-1.5 shadow-inner">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold tracking-wide uppercase text-slate-200">
                Div {divisionLevel} · {tier.name}
              </span>
            </div>

            <button
              onClick={handleCancel}
              className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 flex items-center justify-center cursor-pointer transition-colors"
              title="Cancel Matchmaking"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {matchState === 'searching' ? (
            /* SEARCHING STATE - Professional & Minimalist */
            <div className="w-full flex flex-col items-center text-center gap-5 py-2 z-10">
              {/* Minimalist Radar Visualizer */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Subtle Concentric Rings */}
                <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping opacity-60" />
                <div className="absolute inset-4 rounded-full border border-slate-700/60" />
                <div className="absolute inset-9 rounded-full border border-slate-700/40" />

                {/* Minimalist Sweep Radar Line */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
                  className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none"
                >
                  <div className="w-1/2 h-[1.5px] bg-gradient-to-r from-transparent to-emerald-400 origin-right self-center" />
                </motion.div>

                {/* Center Nation Card */}
                <div className="relative z-10 w-16 h-11 rounded-lg border border-slate-700/80 shadow-md overflow-hidden bg-slate-800">
                  <LazyFlagImage
                    src={getFlagUrl(localDisplayCountry.code)}
                    alt={localDisplayCountry.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Status & Live Counter */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    FINDING OPPONENT
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Searching active players in Division {divisionLevel}
                </h3>
                <p className="text-xs text-slate-400 font-normal">
                  Matching with online players in {tier.name}
                </p>

                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 font-mono text-xs font-medium text-slate-300">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>{formatSeconds(searchSeconds)}</span>
                </div>
              </div>

              {/* Cancel Button */}
              <div className="w-full mt-2">
                <button
                  onClick={handleCancel}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs tracking-wider uppercase border border-slate-700 cursor-pointer transition-all shadow-sm"
                >
                  CANCEL SEARCH
                </button>
              </div>
            </div>
          ) : (
            /* OPPONENT FOUND SHOWDOWN STATE */
            <div className="w-full flex flex-col items-center text-center gap-5 py-2 z-10">
              {/* Match Found Pill */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold tracking-wider uppercase"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>OPPONENT CONNECTED</span>
              </motion.div>

              {/* 1v1 Team Showdown Card */}
              <div className="w-full grid grid-cols-5 items-center gap-2 bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4">
                {/* Local User */}
                <motion.div
                  initial={{ x: -15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="col-span-2 flex flex-col items-center gap-1.5 text-center"
                >
                  <div className="w-14 h-9.5 rounded-md border border-slate-600/70 shadow-sm overflow-hidden bg-slate-700">
                    <LazyFlagImage
                      src={getFlagUrl(localDisplayCountry.code)}
                      alt={localDisplayCountry.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-semibold text-xs text-white truncate max-w-[100px]">
                    {localDisplayCountry.name}
                  </span>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300">
                    YOU
                  </span>
                </motion.div>

                {/* VS Divider */}
                <div className="col-span-1 flex justify-center">
                  <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-300">
                    VS
                  </div>
                </div>

                {/* Opponent */}
                <motion.div
                  initial={{ x: 15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="col-span-2 flex flex-col items-center gap-1.5 text-center"
                >
                  <div className="w-14 h-9.5 rounded-md border border-slate-600/70 shadow-sm overflow-hidden bg-slate-700">
                    <LazyFlagImage
                      src={getFlagUrl(matchedOpponent?.code || 'nz')}
                      alt={matchedOpponent?.name || 'Opponent'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-semibold text-xs text-white truncate max-w-[100px]">
                    {matchedOpponent?.name || 'Opponent'}
                  </span>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300">
                    OPPONENT
                  </span>
                </motion.div>
              </div>

              {/* Countdown Banner */}
              <div className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Match starting in
                </span>
                <motion.span
                  key={countdown}
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-mono font-bold text-lg text-emerald-400"
                >
                  {countdown}s
                </motion.span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
