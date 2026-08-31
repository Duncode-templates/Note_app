import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coins,
  RotateCcw,
  Home,
  Swords,
  Crown,
  Wifi,
  WifiOff,
  Loader2,
  AlertTriangle,
  Flame,
  Shield,
} from 'lucide-react';
import { Country, getFlagUrl, getCountryAbbr } from '../data/countries';
import { OnlineMatchRoom } from '../types';
import { onlineMatchManager } from '../utils/onlineMatchManager';
import { WAGER_TIERS } from '../data/wagerArenas';
import { MatchStats } from './MatchResultsPage';
import LazyFlagImage from './LazyFlagImage';
import CoinIcon from './CoinIcon';
import { getStickerAvatarUrl } from '../data/botProfiles';

interface WagerResultsPageProps {
  country: Country;
  opponentCountry?: Country;
  homeScore: number;
  awayScore: number;
  homePenalties?: number;
  awayPenalties?: number;
  matchStats: MatchStats;
  onlineMatchRoom?: OnlineMatchRoom | null;
  localPlayerName?: string;
  localPlayerProfilePicture?: string | null;
  oppPlayerName?: string;
  oppPlayerProfilePicture?: string | null;
  isOpponentDisconnected?: boolean;
  onEarnCoins?: (amount: number) => void;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
  onReturnToWagerArena?: () => void;
}

export default function WagerResultsPage({
  country,
  opponentCountry,
  homeScore,
  awayScore,
  homePenalties,
  awayPenalties,
  onlineMatchRoom,
  localPlayerName = 'You',
  localPlayerProfilePicture,
  oppPlayerName = 'Online Rival',
  oppPlayerProfilePicture,
  isOpponentDisconnected = false,
  onEarnCoins,
  onPlayAgain,
  onReturnToMenu,
  onReturnToWagerArena,
}: WagerResultsPageProps) {
  const [rematchStatus, setRematchStatus] = useState<'idle' | 'requesting' | 'received_invitation' | 'accepted' | 'declined'>('idle');
  const [rematchNotice, setRematchNotice] = useState<string | null>(null);
  const isBotOpponent = onlineMatchManager.isCurrentRoomBotMatch() || Boolean(
    onlineMatchRoom?.guest?.id?.toLowerCase().startsWith('bot_') ||
    onlineMatchRoom?.host?.id?.toLowerCase().startsWith('bot_')
  );
  const [isOpponentOffline, setIsOpponentOffline] = useState<boolean>(
    isOpponentDisconnected ||
    isBotOpponent ||
    Boolean(
      onlineMatchRoom?.isOpponentDisconnected ||
      onlineMatchRoom?.status === 'opponent_left' ||
      onlineMatchManager.currentRoom?.isOpponentDisconnected ||
      onlineMatchManager.currentRoom?.status === 'opponent_left'
    )
  );
  const hasAwardedPrizeRef = useRef<boolean>(false);

  const hasPenalties = homePenalties !== undefined && awayPenalties !== undefined;
  const isWinner = hasPenalties
    ? (homePenalties || 0) > (awayPenalties || 0)
    : homeScore > awayScore;
  const isDraw = !hasPenalties && homeScore === awayScore;

  // Identify Wager Tier details
  const tierId = onlineMatchRoom?.wagerTier || 'rookie';
  const tierInfo = WAGER_TIERS.find((t) => t.id === tierId) || WAGER_TIERS[0];
  const entryFee = onlineMatchRoom?.entryFee || tierInfo.entryFee;
  const prizePot = onlineMatchRoom?.prizePot || tierInfo.prizePot;
  const netProfit = isWinner ? prizePot - entryFee : isDraw ? 0 : -entryFee;

  const currentOpponent = opponentCountry || {
    id: 'opp',
    code: 'fr',
    abbr: 'FRA',
    name: 'France',
    rankPoints: 95,
    confederation: 'UEFA' as const,
  };

  const finalLocalProfilePic = localPlayerProfilePicture || getStickerAvatarUrl(localPlayerName || 'You', 0);
  const finalOppProfilePic = oppPlayerProfilePicture || getStickerAvatarUrl(oppPlayerName || 'Opponent', 1);

  // Award prize pot once on mount if player won (or refund on draw)
  useEffect(() => {
    if (hasAwardedPrizeRef.current) return;
    hasAwardedPrizeRef.current = true;

    if (isWinner && onEarnCoins) {
      onEarnCoins(prizePot);
    } else if (isDraw && onEarnCoins) {
      // Refund entry fee on draw
      onEarnCoins(entryFee);
    }
  }, [isWinner, isDraw, prizePot, entryFee, onEarnCoins]);

  // Online Multiplayer Event Listeners
  useEffect(() => {
    const handleOpponentLeft = () => {
      setIsOpponentOffline(true);
      setRematchStatus('idle');
      setRematchNotice('Your opponent has left the wager room.');
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

    return () => {
      unsubDisconnect();
      unsubOpponentLeft();
      unsubPlayerLeft();
      unsubRoomUpdated();
      unsubRematchReq();
      unsubRematchAcc();
      unsubRematchDec();
    };
  }, [onlineMatchRoom, onPlayAgain]);

  const handleRequestRematch = () => {
    if (isOpponentOffline || !onlineMatchRoom) {
      onPlayAgain();
      return;
    }
    setRematchStatus('requesting');
    onlineMatchManager.requestRematch();
  };

  const handleAcceptRematch = () => {
    setRematchStatus('accepted');
    onlineMatchManager.acceptRematch();
  };

  const handleDeclineRematch = () => {
    setRematchStatus('idle');
    onlineMatchManager.declineRematch();
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-sky-400 via-blue-600 to-indigo-900 text-slate-900 flex flex-col justify-between p-3 sm:p-6 md:p-8 select-none relative overflow-x-hidden pb-12 sm:pb-16 touch-pan-y">
      {/* Background Stadium Glow Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-emerald-400/15 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between z-10 pt-1 pb-3 sm:pb-4 border-b border-black/15">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[18px] bg-amber-400 border-2 sm:border-[2.5px] border-black flex items-center justify-center text-black font-black text-xl shadow-[0_3px_0_0_#000] shrink-0">
            <Coins className="w-5 h-5 sm:w-7 sm:h-7 text-amber-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-wider text-black drop-shadow-xs">
                {tierInfo.name} Wager
              </h1>
              <span className="bg-black text-amber-300 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {tierInfo.badge}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-900 font-black uppercase tracking-wider">
              {isOpponentOffline
                ? 'Opponent Disconnected • Wager Match Results'
                : `Room #${onlineMatchRoom?.roomId || onlineMatchManager.currentRoom?.roomId || 'WAGER'} • Coin Duel Results`}
            </p>
          </div>
        </div>

        {/* Online / Offline Status Badge */}
        {isOpponentOffline ? (
          <span className="px-2.5 py-1 rounded-full bg-rose-500 border-2 border-black text-[10px] sm:text-xs font-black uppercase tracking-wider text-white shadow-[0_2px_0_0_#000] flex items-center gap-1.5 shrink-0">
            <WifiOff className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">OFFLINE</span>
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-emerald-400 border-2 border-black text-[10px] sm:text-xs font-black uppercase tracking-wider text-black shadow-[0_2px_0_0_#000] flex items-center gap-1.5 shrink-0">
            <Wifi className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">LIVE</span>
          </span>
        )}
      </header>

      {/* Main Container */}
      <main className="w-full max-w-xl mx-auto flex flex-col items-center gap-4 sm:gap-5 z-10 my-auto py-2 sm:py-4">
        {/* Opponent Left Alert Banner */}
        {isOpponentOffline && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full bg-rose-500 border-[3.5px] border-black rounded-[20px] p-3 sm:p-3.5 shadow-[0_4px_0_0_#000] text-white flex items-center justify-center gap-3 text-center"
          >
            <WifiOff className="w-5 h-5 shrink-0 text-white stroke-[2.5]" />
            <span className="font-black text-xs sm:text-sm uppercase tracking-wider">
              Opponent disconnected or left the wager room
            </span>
          </motion.div>
        )}

        {/* PRIMARY WAGER DUEL CARD */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="w-full bg-white text-black border-[3.5px] border-black rounded-[24px] p-4 sm:p-6 shadow-[0_8px_0_0_#000] flex flex-col gap-4 sm:gap-5"
        >
          {/* Outcome Header Banner */}
          <div
            className={`w-full py-3 px-4 rounded-[16px] border-[2.5px] border-black shadow-[0_3px_0_0_#000] text-center flex items-center justify-center gap-2 ${
              isWinner
                ? 'bg-emerald-400 text-black'
                : isDraw
                ? 'bg-amber-300 text-black'
                : 'bg-rose-500 text-white'
            }`}
          >
            {isWinner ? (
              <>
                <Crown className="w-6 h-6 text-black shrink-0 animate-bounce" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                    WAGER VICTORY!
                  </span>
                  <span className="text-xs sm:text-sm font-black uppercase bg-black text-emerald-300 px-2.5 py-0.5 rounded-full inline-block">
                    +{prizePot.toLocaleString()} COINS
                  </span>
                </div>
              </>
            ) : isDraw ? (
              <>
                <Shield className="w-6 h-6 text-black shrink-0" />
                <span className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                  MATCH DRAW • FEE REFUNDED
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 text-white shrink-0" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                    DEFEATED
                  </span>
                  <span className="text-xs sm:text-sm font-black uppercase bg-black/40 text-rose-100 px-2.5 py-0.5 rounded-full inline-block">
                    -{entryFee.toLocaleString()} COINS
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Versus Scoreboard */}
          <div className="flex items-center justify-between w-full px-1 sm:px-3">
            {/* Local Player */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] border-[2.5px] border-black overflow-hidden shadow-[0_3px_0_0_#000] bg-slate-100">
                  <img
                    src={finalLocalProfilePic}
                    alt={localPlayerName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-4 rounded-[3px] overflow-hidden border-[1.5px] border-black shadow-2xs">
                  <LazyFlagImage
                    src={getFlagUrl(country.code)}
                    alt={country.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span className="font-black text-xs sm:text-sm uppercase text-black truncate max-w-[110px] text-center">
                {localPlayerName}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                {getCountryAbbr(country)}
              </span>
            </div>

            {/* Score Box */}
            <div className="flex flex-col items-center px-4 sm:px-5 py-2.5 bg-amber-400 text-black border-[2.5px] border-black rounded-[16px] shadow-[0_3px_0_0_#000] shrink-0">
              <div className="flex items-center gap-2 font-mono font-black text-2xl sm:text-3xl">
                <span>{homeScore}</span>
                <span className="text-base text-black/60">:</span>
                <span>{awayScore}</span>
              </div>
              {hasPenalties && (
                <span className="text-[10px] font-black uppercase text-amber-950 mt-0.5">
                  PEN: {homePenalties} - {awayPenalties}
                </span>
              )}
            </div>

            {/* Opponent Player */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] border-[2.5px] border-black overflow-hidden shadow-[0_3px_0_0_#000] bg-purple-100">
                  <img
                    src={finalOppProfilePic}
                    alt={oppPlayerName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-4 rounded-[3px] overflow-hidden border-[1.5px] border-black shadow-2xs">
                  <LazyFlagImage
                    src={getFlagUrl(currentOpponent.code)}
                    alt={currentOpponent.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span className="font-black text-xs sm:text-sm uppercase text-black truncate max-w-[110px] text-center">
                {oppPlayerName}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                {getCountryAbbr(currentOpponent)}
              </span>
            </div>
          </div>

          {/* Compact Wager Coin Payout Summary */}
          <div className="grid grid-cols-3 gap-2 border-t-2 border-slate-200 pt-3 text-center">
            {/* Entry Fee */}
            <div className="bg-slate-50 border-[1.5px] border-black rounded-[12px] p-2 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-slate-500 uppercase">
                Entry Fee
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <CoinIcon className="w-3.5 h-3.5" />
                <span className="font-mono font-black text-xs sm:text-sm text-black">
                  {entryFee.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Total Arena Pot */}
            <div className="bg-amber-100 border-[1.5px] border-black rounded-[12px] p-2 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-amber-900 uppercase">
                Arena Pot
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <CoinIcon className="w-3.5 h-3.5" />
                <span className="font-mono font-black text-xs sm:text-sm text-amber-950">
                  {prizePot.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Net Result */}
            <div
              className={`border-[1.5px] border-black rounded-[12px] p-2 flex flex-col items-center justify-center ${
                isWinner
                  ? 'bg-emerald-100'
                  : isDraw
                  ? 'bg-slate-50'
                  : 'bg-rose-50'
              }`}
            >
              <span className="text-[10px] font-black text-slate-500 uppercase">
                Net Result
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <CoinIcon className="w-3.5 h-3.5" />
                <span
                  className={`font-mono font-black text-xs sm:text-sm ${
                    isWinner
                      ? 'text-emerald-700'
                      : isDraw
                      ? 'text-slate-700'
                      : 'text-rose-700'
                  }`}
                >
                  {isWinner
                    ? `+${netProfit.toLocaleString()}`
                    : isDraw
                    ? '0'
                    : `-${entryFee.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* REMATCH INVITATION TOAST */}
        <AnimatePresence>
          {rematchStatus === 'received_invitation' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full bg-amber-400 border-[3px] border-black rounded-[18px] p-3.5 shadow-[0_4px_0_0_#000] text-black flex items-center justify-between gap-3 select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Flame className="w-5 h-5 text-black shrink-0 animate-pulse" />
                <span className="font-black text-xs sm:text-sm uppercase truncate">
                  {oppPlayerName} challenges you to a Wager Rematch!
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleAcceptRematch}
                  className="px-3 py-1.5 rounded-[10px] bg-emerald-400 hover:bg-emerald-300 border-[2px] border-black font-black text-xs uppercase cursor-pointer shadow-xs active:scale-95"
                >
                  Accept
                </button>
                <button
                  onClick={handleDeclineRematch}
                  className="px-3 py-1.5 rounded-[10px] bg-rose-400 hover:bg-rose-300 border-[2px] border-black font-black text-xs uppercase cursor-pointer shadow-xs active:scale-95"
                >
                  Decline
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {rematchNotice && (
          <div className="w-full p-2.5 rounded-[12px] bg-white border-[2px] border-black text-slate-800 text-xs font-black text-center uppercase shadow-xs">
            {rematchNotice}
          </div>
        )}

        {/* ACTION BUTTONS: REMATCH / WAGER ARENA / HOME */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 pt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRequestRematch}
            disabled={rematchStatus === 'requesting' || isOpponentOffline}
            className={`w-full sm:flex-1 py-3 px-4 rounded-[18px] border-[3px] border-black shadow-[0_4px_0_0_#000] font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
              isOpponentOffline
                ? 'bg-slate-200 text-slate-400 border-slate-400 shadow-none cursor-not-allowed'
                : rematchStatus === 'requesting'
                ? 'bg-amber-300 text-black cursor-wait'
                : 'bg-amber-400 hover:bg-amber-300 text-black'
            }`}
          >
            {rematchStatus === 'requesting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>WAITING FOR OPPONENT...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>WAGER REMATCH</span>
              </>
            )}
          </motion.button>

          {onReturnToWagerArena && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReturnToWagerArena}
              className="w-full sm:w-auto py-3 px-5 rounded-[18px] border-[3px] border-black shadow-[0_4px_0_0_#000] font-black text-xs sm:text-sm uppercase tracking-wider bg-white hover:bg-slate-50 text-black flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Swords className="w-4 h-4" />
              <span>WAGER ARENA</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReturnToMenu}
            className="w-full sm:w-auto py-3 px-5 rounded-[18px] border-[3px] border-black shadow-[0_4px_0_0_#000] font-black text-xs sm:text-sm uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white border-black flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </motion.button>
        </div>
      </main>
    </div>
  );
}

