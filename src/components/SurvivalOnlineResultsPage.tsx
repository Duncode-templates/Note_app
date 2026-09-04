import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, RotateCcw, Home, Flame, Trophy, Shield, Check, X, Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react';
import { Country, getFlagUrl, getCountryAbbr } from '../data/countries';
import { OnlineMatchRoom } from '../types';
import { onlineMatchManager } from '../utils/onlineMatchManager';
import { useTranslation } from '../utils/i18n';

interface SurvivalOnlineResultsPageProps {
  country: Country;
  opponentCountry: Country | null;
  playerLives: number;
  opponentLives: number;
  survivalStreak?: number;
  bestStreak?: number;
  survivalScore?: number;
  onlineMatchRoom?: OnlineMatchRoom | null;
  localPlayerName?: string;
  localPlayerProfilePicture?: string;
  oppPlayerName?: string;
  oppPlayerProfilePicture?: string;
  isOpponentDisconnected?: boolean;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export const SurvivalOnlineResultsPage: React.FC<SurvivalOnlineResultsPageProps> = ({
  country,
  opponentCountry,
  playerLives,
  opponentLives,
  onlineMatchRoom,
  localPlayerName = 'You',
  localPlayerProfilePicture,
  oppPlayerName = 'Opponent',
  oppPlayerProfilePicture,
  isOpponentDisconnected = false,
  onPlayAgain,
  onReturnToMenu,
}) => {
  const { t } = useTranslation();
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

  const isPlayerWinner = playerLives > opponentLives;
  const isDraw = playerLives === opponentLives;
  const isPlayerDefeated = opponentLives > playerLives;

  const currentOpponent = opponentCountry || {
    id: 'opp',
    code: 'fr',
    abbr: 'FRA',
    name: 'France',
    rankPoints: 95,
    confederation: 'UEFA' as const,
  };

  // Online Multiplayer Event Listeners
  useEffect(() => {
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

  const renderHeartMeter = (lives: number) => {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {[1, 2, 3].map((heartIndex) => {
          const isAlive = heartIndex <= lives;
          return (
            <motion.div
              key={heartIndex}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * heartIndex, type: 'spring' }}
              className={`p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border-[2.5px] border-black transition-all ${
                isAlive
                  ? 'bg-rose-500 shadow-[0_3px_0_0_#000]'
                  : 'bg-slate-200 opacity-40 shadow-none border-dashed'
              }`}
            >
              <Heart
                className={`w-5 h-5 sm:w-7 sm:h-7 ${
                  isAlive
                    ? 'text-white fill-white drop-shadow-xs'
                    : 'text-slate-400 fill-slate-300'
                }`}
              />
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-sky-400 via-blue-600 to-indigo-900 text-slate-900 flex flex-col justify-between p-3 sm:p-6 md:p-8 select-none relative overflow-x-hidden pb-12 sm:pb-16 touch-pan-y">
      {/* Background Stadium Glow Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-emerald-400/15 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-10 pt-1 pb-3 sm:pb-4 border-b border-black/15">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[18px] bg-amber-400 border-2 sm:border-[2.5px] border-black flex items-center justify-center text-black font-black text-xl shadow-[0_3px_0_0_#000] shrink-0">
            <Flame className="w-5 h-5 sm:w-7 sm:h-7 text-amber-950 fill-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-wider text-black drop-shadow-xs">
                {onlineMatchRoom ? t('survival.onlineDuel', 'ONLINE SURVIVAL 1v1 DUEL') : t('survival.duel', 'SURVIVAL 1v1 DUEL')}
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-900 font-black uppercase tracking-wider">
              {onlineMatchRoom
                ? `100s • ${t('survival.livesRemaining', 'Lives Survival Results')} • ROOM #${onlineMatchRoom?.roomId || onlineMatchManager.currentRoom?.roomId || 'ONLINE'}`
                : `100s • ${t('survival.livesRemaining', 'Lives Survival Results')} • Player vs AI`}
            </p>
          </div>
        </div>
      </header>

      {/* Main Duel Content */}
      <main className="w-full max-w-6xl mx-auto flex flex-col items-center gap-4 sm:gap-6 z-10 my-auto py-3 sm:py-6">
        
        {/* Opponent Left Notice Alert */}
        {isOpponentOffline && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-rose-500 border-[3.5px] border-black rounded-[22px] p-3 sm:p-4 shadow-[0_6px_0_0_#000] text-white flex items-center justify-center gap-3 text-center"
          >
            <WifiOff className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-white stroke-[3]" />
            <div className="flex flex-col text-left sm:text-center">
              <span className="font-black text-xs sm:text-sm md:text-base uppercase tracking-wider">
                {t('match.opponentLeftTitle', 'OPPONENT HAS LEFT THE MATCH')}
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-rose-100">
                {t('match.opponentLeftDesc', 'Your opponent disconnected or returned to the main menu.')}
              </span>
            </div>
          </motion.div>
        )}

        {/* Outcome Banner */}
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: -15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className="w-full flex flex-col items-center text-center gap-1.5"
        >
          <div
            className={`w-full max-w-2xl py-3 sm:py-4 px-4 sm:px-8 rounded-[22px] sm:rounded-[28px] border-[3.5px] border-black shadow-[0_6px_0_0_#000] font-black text-xl sm:text-3xl md:text-4xl uppercase tracking-wider flex items-center justify-center gap-2 sm:gap-3 flex-wrap ${
              isPlayerWinner
                ? 'bg-amber-300 text-black'
                : isDraw
                ? 'bg-sky-200 text-black'
                : 'bg-rose-500 text-white'
            }`}
          >
            {isPlayerWinner && <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-900 fill-amber-500 animate-bounce" />}
            {isDraw && <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-slate-900 fill-amber-500" />}
            {isPlayerDefeated && <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
            <span>
              {isPlayerWinner
                ? t('result.survivalVictory', 'SURVIVAL VICTORY!')
                : isDraw
                ? t('result.draw', 'HONOURS EVEN (TIE)')
                : t('result.survivalDefeat', 'SURVIVAL DEFEAT')}
            </span>
          </div>
        </motion.div>

        {/* HERO SCOREBOARD CARD: 1V1 SURVIVAL DUEL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="w-full bg-white text-black border-[3.5px] sm:border-[4px] border-black rounded-[24px] sm:rounded-[36px] p-4 sm:p-7 shadow-[0_10px_0_0_#000] relative overflow-hidden"
        >
          {/* Top Tag */}
          <div className="flex items-center justify-between mb-3 sm:mb-5 pb-2.5 border-b-2 border-black/10">
            <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse inline-block" />
              {t('survival.livesRemaining', 'FINAL REMAINING LIVES')} • 1v1 DUEL
            </span>
          </div>

          {/* Head-to-Head Duel Cards Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6 items-stretch">
            {/* Player 1 (You) */}
            <div className={`flex flex-col justify-between gap-3.5 sm:gap-5 p-4 sm:p-6 rounded-[20px] sm:rounded-[26px] border-[3px] border-black transition-all ${
              isPlayerWinner
                ? 'bg-gradient-to-b from-emerald-100/90 to-amber-50/80 border-emerald-500 shadow-[0_5px_0_0_#000]'
                : 'bg-slate-50 shadow-[0_4px_0_0_#000]'
            }`}>
              <div className="w-full flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 sm:w-16 sm:h-11 md:w-20 md:h-14 rounded-lg sm:rounded-xl border-2 border-black overflow-hidden shadow-xs shrink-0 bg-slate-900 flex items-center justify-center">
                    <img
                      src={getFlagUrl(country.code)}
                      alt={country.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-base sm:text-xl md:text-2xl font-black uppercase text-black tracking-tight sm:tracking-wide">
                        {country.name}
                      </span>
                      <span className="text-[9px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-black border border-black shadow-2xs">
                        {t('common.you', 'YOU')}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-600 font-black">
                      {localPlayerName} • {getCountryAbbr(country)}
                    </div>
                  </div>
                </div>

                {isPlayerWinner && (
                  <span className="px-2.5 py-1 bg-emerald-500 text-white font-black text-[10px] sm:text-xs uppercase rounded-lg border border-black shadow-xs shrink-0">
                    {t('status.winner', 'WINNER')}
                  </span>
                )}
              </div>

              {/* Heart Lives Display */}
              <div className="w-full flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border-2 border-black/20 shadow-inner">
                {renderHeartMeter(playerLives)}
                <span className={`text-xs sm:text-sm font-black uppercase tracking-wider mt-0.5 ${
                  playerLives > 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {playerLives} / 3 {t('survival.livesRemaining', 'LIVES')} {playerLives === 0 ? `(${t('status.eliminated', 'ELIMINATED')})` : `(${t('status.survived', 'SURVIVED')})`}
                </span>
              </div>
            </div>

            {/* Player 2 (Opponent) */}
            <div className={`flex flex-col justify-between gap-3.5 sm:gap-5 p-4 sm:p-6 rounded-[20px] sm:rounded-[26px] border-[3px] border-black transition-all ${
              isPlayerDefeated
                ? 'bg-gradient-to-b from-rose-100/90 to-amber-50/80 border-rose-500 shadow-[0_5px_0_0_#000]'
                : 'bg-slate-50 shadow-[0_4px_0_0_#000]'
            }`}>
              <div className="w-full flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 sm:w-16 sm:h-11 md:w-20 md:h-14 rounded-lg sm:rounded-xl border-2 border-black overflow-hidden shadow-xs shrink-0 bg-slate-900 flex items-center justify-center">
                    <img
                      src={getFlagUrl(currentOpponent.code)}
                      alt={currentOpponent.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-base sm:text-xl md:text-2xl font-black uppercase text-black tracking-tight sm:tracking-wide">
                        {currentOpponent.name}
                      </span>
                      <span className="text-[9px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 border border-black shadow-2xs">
                        {t('common.opponent', 'OPPONENT')}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-600 font-black">
                      {oppPlayerName} • {getCountryAbbr(currentOpponent)}
                    </div>
                  </div>
                </div>

                {isPlayerDefeated && (
                  <span className="px-2.5 py-1 bg-emerald-500 text-white font-black text-[10px] sm:text-xs uppercase rounded-lg border border-black shadow-xs shrink-0">
                    {t('status.winner', 'WINNER')}
                  </span>
                )}
              </div>

              {/* Heart Lives Display */}
              <div className="w-full flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border-2 border-black/20 shadow-inner">
                {renderHeartMeter(opponentLives)}
                <span className={`text-xs sm:text-sm font-black uppercase tracking-wider mt-0.5 ${
                  opponentLives > 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {opponentLives} / 3 {t('survival.livesRemaining', 'LIVES')} {opponentLives === 0 ? `(${t('status.eliminated', 'ELIMINATED')})` : `(${t('status.survived', 'SURVIVED')})`}
                </span>
              </div>
            </div>
          </div>

          {/* Status / Notice Messages */}
          {rematchNotice && (
            <div className="w-full mt-3 py-2 px-3 bg-amber-200 border-2 border-black rounded-xl text-center text-xs sm:text-sm font-black text-black">
              {rematchNotice}
            </div>
          )}

          {/* Rematch invitation prompt */}
          {rematchStatus === 'received_invitation' && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full mt-3 p-3.5 sm:p-4 bg-amber-300 text-black border-[3px] border-black rounded-2xl shadow-[0_4px_0_0_#000] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
            >
              <div>
                <div className="font-black text-xs sm:text-base uppercase tracking-wide">
                  {t('rematch.survivalRequested', 'Opponent requested a Survival Rematch!')}
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-800">
                  {t('rematch.survivalDesc', 'Accept to jump right back into the 1v1 Survival Duel!')}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleAcceptRematch}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase rounded-xl border-2 border-black shadow-[0_2px_0_0_#000] cursor-pointer"
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  {t('rematch.accept', 'Accept')}
                </button>
                <button
                  onClick={handleDeclineRematch}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase rounded-xl border-2 border-black shadow-[0_2px_0_0_#000] cursor-pointer"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  {t('rematch.decline', 'Decline')}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Bottom Action Buttons: STRICTLY 2 BUTTONS (PLAY AGAIN & GO BACK TO MENU) */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 pt-3 sm:pt-4 border-t border-black/15 z-10">
        {/* BUTTON 1: PLAY AGAIN / REMATCH */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98, y: 2 }}
          onClick={rematchStatus === 'received_invitation' ? handleAcceptRematch : handleRequestRematch}
          disabled={rematchStatus === 'requesting' || rematchStatus === 'accepted'}
          className={`w-full sm:flex-1 py-3.5 sm:py-4 px-6 rounded-[18px] sm:rounded-[22px] border-[3.5px] border-black font-black text-sm sm:text-base md:text-lg uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_5px_0_0_#000] transition-colors ${
            rematchStatus === 'requesting'
              ? 'bg-amber-400 text-black opacity-80 cursor-wait'
              : rematchStatus === 'accepted'
              ? 'bg-emerald-500 text-white cursor-wait'
              : 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-black'
          }`}
        >
          {rematchStatus === 'requesting' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t('match.waitingOpponent', 'Waiting for Opponent...')}</span>
            </>
          ) : rematchStatus === 'accepted' ? (
            <>
              <Check className="w-5 h-5" />
              <span>{t('rematch.starting', 'Starting Rematch...')}</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-5 h-5 stroke-[2.5]" />
              <span>{t('btn.playAgain', 'PLAY AGAIN')}</span>
            </>
          )}
        </motion.button>

        {/* BUTTON 2: GO BACK TO MENU */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98, y: 2 }}
          onClick={onReturnToMenu}
          className="w-full sm:flex-1 py-3.5 sm:py-4 px-6 rounded-[18px] sm:rounded-[22px] border-[3.5px] border-black bg-white hover:bg-slate-100 text-black font-black text-sm sm:text-base md:text-lg uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_5px_0_0_#000] transition-colors"
        >
          <Home className="w-5 h-5 stroke-[2.5]" />
          <span>{t('btn.returnMenu', 'GO BACK TO MENU')}</span>
        </motion.button>
      </footer>
    </div>
  );
};

export default SurvivalOnlineResultsPage;
