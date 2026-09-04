import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crown,
  Skull,
  Swords,
  ArrowRight,
  LogOut,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { KingOfTheHillContender, KingOfTheHillMatchState } from '../types';
import LazyFlagImage from './LazyFlagImage';
import KingOfTheHillScoreboard from './KingOfTheHillScoreboard';
import { getCountryAbbr } from '../data/countries';
import { getStickerAvatarUrl } from '../data/botProfiles';

interface KingOfTheHillHUDProps {
  matchState: KingOfTheHillMatchState;
  roundTimeLeft: number;
  turnTimeLeft?: number;
  isEliminationScreenOpen: boolean;
  onAdvanceToNextRound: () => void;
  isFinalRoundOver: boolean;
  activeContender?: KingOfTheHillContender;
  isUserTurn: boolean;
  activeShotIndex: number;
  botCommentary?: string | null;
  isSceneLoading?: boolean;
  onExit?: () => void;
  onRematch?: () => void;
  isOnlineMatch?: boolean;
  isRoomLeader?: boolean;
  roomLeaderName?: string;
  leaderTransferNotice?: string | null;
}

export default function KingOfTheHillHUD({
  matchState,
  turnTimeLeft = 10,
  isEliminationScreenOpen,
  onAdvanceToNextRound,
  isFinalRoundOver,
  activeContender,
  isUserTurn,
  activeShotIndex,
  botCommentary,
  isSceneLoading = false,
  onExit,
  isOnlineMatch = false,
  isRoomLeader = true,
  roomLeaderName = 'Leader',
  leaderTransferNotice,
}: KingOfTheHillHUDProps) {
  const isMatchOver = matchState.status === 'champion_crowned';
  if (isMatchOver) {
    return null;
  }

  const showLiveHUD = !isSceneLoading && !isEliminationScreenOpen;
  const localPlayer = matchState.contenders.find((c) => c.isLocalPlayer);

  // Find the contender(s) eliminated in this round
  const eliminatedThisRound = matchState.contenders.filter(
    (c) => c.isEliminated && c.eliminatedInRound === matchState.currentRound
  );

  return (
    <div className="select-none">
      {/* 1. Left HUD: Round UI (smaller screens), Scoreboard, and Play Timer */}
      {showLiveHUD && (
        <div className="fixed top-2 sm:top-3 left-2 sm:left-3 md:left-4 z-40 flex flex-col items-start gap-1.5 sm:gap-2 pointer-events-none select-none w-[94vw] max-w-[280px] xs:max-w-[300px] sm:max-w-[320px]">
          {/* Round UI on smaller screens: displayed on TOP of the scoreboard */}
          <div className="md:hidden pointer-events-auto">
            <div className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-black border-[2px] sm:border-[2.5px] border-black shadow-[0_3px_0_0_#000] rounded-[12px] px-2.5 sm:px-3 py-1 text-center">
              <Crown className="w-3.5 h-3.5 fill-amber-400 text-black stroke-[2.2] shrink-0" />
              <span className="font-mono font-black text-[11px] sm:text-xs uppercase tracking-wider text-black whitespace-nowrap">
                ROUND {matchState.currentRound}/{matchState.totalRounds}
              </span>
            </div>
          </div>

          {/* Scoreboard: Strictly 2 in a row on all devices */}
          <div className="w-full pointer-events-auto">
            <KingOfTheHillScoreboard
              matchState={matchState}
              isUserTurn={isUserTurn}
              activeShotIndex={activeShotIndex}
            />
          </div>

          {/* Play Timer UI directly under the Scoreboard: only shows when the current user is playing */}
          {isUserTurn && (
            <div className="pointer-events-auto">
              <div
                className={`inline-flex items-center gap-2 backdrop-blur-md border-[2px] sm:border-[2.5px] border-black shadow-[0_3.5px_0_0_#000] rounded-[14px] px-3.5 sm:px-4 py-1.5 text-center transition-all ${
                  turnTimeLeft <= 3
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-amber-400 text-black font-black'
                }`}
              >
                <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 stroke-[2.3]" />
                <span className="font-mono font-black text-xs sm:text-sm md:text-[14px] tracking-wider whitespace-nowrap">
                  Play time: {turnTimeLeft}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Right HUD: Current Round UI displayed on the right side on larger screens */}
      {showLiveHUD && (
        <div className="hidden md:block fixed top-2 sm:top-3 right-2 sm:right-3 md:right-4 z-40 pointer-events-auto select-none">
          <div className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-black border-[2px] sm:border-[2.5px] border-black shadow-[0_3px_0_0_#000] rounded-[12px] px-3 py-1.5 text-center">
            <Crown className="w-4 h-4 fill-amber-400 text-black stroke-[2.2] shrink-0" />
            <span className="font-mono font-black text-xs sm:text-[13px] uppercase tracking-wider text-black whitespace-nowrap">
              ROUND {matchState.currentRound}/{matchState.totalRounds}
            </span>
          </div>
        </div>
      )}

      {/* 2. Round Results & Elimination Modal (When a round finishes) */}
      <AnimatePresence>
        {isEliminationScreenOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="w-full max-w-sm bg-white border-[3.5px] border-black rounded-[24px] p-4 sm:p-5 shadow-[0_12px_0_0_#000] text-black text-center"
            >
              {/* Header Icon */}
              <div
                className={`w-12 h-12 mx-auto mb-2 rounded-full border-[2.5px] border-black flex items-center justify-center shadow-xs ${
                  eliminatedThisRound.length === 0 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
              >
                {eliminatedThisRound.length === 0 ? (
                  <Swords className="w-6 h-6 text-black" />
                ) : (
                  <Skull className="w-6 h-6 text-white" />
                )}
              </div>

              {/* Round Badge */}
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 border border-black/20 font-black text-[10.5px] uppercase tracking-wider mb-1">
                ROUND {matchState.currentRound}
              </div>

              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-black mb-3">
                {eliminatedThisRound.length === 0 ? 'FINALISTS ADVANCE!' : 'ELIMINATION'}
              </h2>

              {/* Whom was eliminated */}
              {eliminatedThisRound.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {eliminatedThisRound.map((eliminated) => (
                    <div
                      key={eliminated.id}
                      className="flex items-center justify-between bg-rose-50 border-[2px] border-rose-400 rounded-[14px] p-2.5 text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-full overflow-hidden border-[2px] border-rose-600 bg-white shrink-0">
                            <img
                              src={eliminated.avatarUrl || getStickerAvatarUrl(eliminated.name, 0)}
                              alt={eliminated.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(
                                  eliminated.name,
                                  0
                                );
                              }}
                            />
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-2.5 rounded-[2px] overflow-hidden border border-black">
                            <LazyFlagImage
                              countryCode={eliminated.countryCode}
                              alt={eliminated.countryName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-xs sm:text-sm text-black truncate">
                            {eliminated.name} {eliminated.isLocalPlayer && '(YOU)'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase">
                            {eliminated.countryName || getCountryAbbr(eliminated.countryCode)}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded uppercase shrink-0">
                        OUT
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-3">
                  Both finalists advance to the Grand Final Decider!
                </p>
              )}

              {/* Leader Transfer Notice */}
              {leaderTransferNotice && (
                <div className="mb-3 text-[11px] font-black text-amber-950 bg-amber-100 border-[2px] border-amber-400 rounded-[12px] p-2 flex items-center justify-center gap-1.5 shadow-2xs text-center">
                  <Crown className="w-4 h-4 fill-amber-400 text-black shrink-0" />
                  <span>{leaderTransferNotice}</span>
                </div>
              )}

              {/* User status alert */}
              {localPlayer?.isEliminated && localPlayer.eliminatedInRound === matchState.currentRound ? (
                <div className="mb-3 text-xs text-rose-700 font-bold bg-rose-50 border border-rose-200 rounded-[12px] p-2">
                  You were eliminated from the hill!
                </div>
              ) : (
                <div className="mb-3 text-xs text-emerald-800 font-black flex items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-[12px] p-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>You advanced to Round {matchState.currentRound + 1}!</span>
                </div>
              )}

              {/* Action Buttons: Continue / Exit */}
              <div className="flex flex-col gap-2 w-full">
                {isOnlineMatch && !isRoomLeader ? (
                  <div className="w-full py-2.5 px-3 rounded-[14px] font-black text-xs uppercase tracking-wider bg-slate-100 border-[2.5px] border-black text-slate-700 shadow-[0_2px_0_0_#000] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
                    <span>WAITING FOR ROOM LEADER ({roomLeaderName || 'LEADER'}) TO CONTINUE...</span>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ y: 2, scale: 0.98 }}
                    onClick={onAdvanceToNextRound}
                    className="w-full py-2.5 px-3 rounded-[14px] font-black text-xs sm:text-sm uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-black border-[2.5px] border-black shadow-[0_3px_0_0_#000] cursor-pointer flex items-center justify-center gap-1.5 outline-none"
                  >
                    <Crown className="w-4 h-4 fill-black text-black" />
                    <span>
                      {matchState.currentRound >= matchState.totalRounds || isFinalRoundOver
                        ? 'FINAL RESULTS'
                        : isOnlineMatch
                        ? 'CONTINUE TO NEXT ROUND (LEADER)'
                        : 'NEXT ROUND'}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </motion.button>
                )}

                {onExit && (
                  <motion.button
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ y: 2, scale: 0.98 }}
                    onClick={onExit}
                    className="w-full py-2 px-3 rounded-[12px] font-black text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black border-[2px] border-black shadow-[0_2px_0_0_#000] cursor-pointer flex items-center justify-center gap-1 outline-none"
                  >
                    <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>EXIT TOURNAMENT</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
