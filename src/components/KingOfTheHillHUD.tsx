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
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-300 text-black border-[2.5px] border-black shadow-[0_3px_0_0_#000] rounded-[14px] px-3 py-1 text-center">
              <Crown className="w-4 h-4 fill-black text-black stroke-[2] shrink-0" />
              <span className="font-mono font-black text-xs sm:text-sm uppercase tracking-wider text-black whitespace-nowrap">
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
            <div className="pointer-events-auto mt-0.5">
              <div
                className={`inline-flex items-center gap-2.5 backdrop-blur-md border-[3px] border-black shadow-[0_4px_0_0_#000] rounded-[16px] px-4 sm:px-5 py-2 sm:py-2.5 text-center transition-all ${
                  turnTimeLeft <= 3
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-amber-400 text-black font-black'
                }`}
              >
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 stroke-[2.5]" />
                <span className="font-mono font-black text-sm sm:text-base md:text-lg tracking-wider whitespace-nowrap">
                  Play time: {Math.max(0, turnTimeLeft)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Right HUD: Current Round UI displayed on the right side on larger screens */}
      {showLiveHUD && (
        <div className="hidden md:block fixed top-2 sm:top-3 right-2 sm:right-3 md:right-4 z-40 pointer-events-auto select-none">
          <div className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-black border-[2.5px] border-black shadow-[0_3px_0_0_#000] rounded-[14px] px-3.5 py-1.5 text-center">
            <Crown className="w-4 h-4 fill-amber-400 text-black stroke-[2.2] shrink-0" />
            <span className="font-mono font-black text-xs sm:text-[13px] uppercase tracking-wider text-black whitespace-nowrap">
              ROUND {matchState.currentRound}/{matchState.totalRounds}
            </span>
          </div>
        </div>
      )}

      {/* 2. Streamlined Elimination Announcement Modal (Clean & Concise) */}
      <AnimatePresence>
        {isEliminationScreenOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', stiffness: 450, damping: 26 }}
              className="w-full max-w-sm bg-white border-[3.5px] border-black rounded-[26px] p-5 shadow-[0_12px_0_0_#000] text-black text-center"
            >
              {/* Header Title */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-black/20 font-black text-xs uppercase tracking-wider mb-2">
                <Crown className="w-3.5 h-3.5 fill-amber-400 text-black shrink-0" />
                <span>ROUND {matchState.currentRound} COMPLETE</span>
              </div>

              {/* Who was eliminated */}
              {eliminatedThisRound.length > 0 ? (
                <div className="my-3 space-y-1.5">
                  {eliminatedThisRound.map((eliminated) => (
                    <div
                      key={eliminated.id}
                      className="flex items-center justify-between bg-rose-50 border-[2px] border-rose-400 rounded-[14px] px-3 py-2 text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-rose-600 bg-white shrink-0">
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
                        <span className="font-black text-xs sm:text-sm text-black truncate">
                          {eliminated.name} {eliminated.isLocalPlayer && '(YOU)'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase shrink-0">
                        ELIMINATED
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-xs font-bold uppercase tracking-wider my-3">
                  All finalists advance to the next stage!
                </p>
              )}

              {/* User advancement badge */}
              <div className="mb-4">
                {localPlayer?.isEliminated && localPlayer.eliminatedInRound === matchState.currentRound ? (
                  <div className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-300 rounded-[12px] py-1.5 px-3">
                    You have been eliminated from the tournament
                  </div>
                ) : (
                  <div className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-400 rounded-[12px] py-1.5 px-3 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>You advanced to Round {matchState.currentRound + 1}!</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 w-full">
                {isOnlineMatch && !isRoomLeader ? (
                  <div className="w-full py-3 px-3 rounded-[16px] font-black text-xs uppercase tracking-wider bg-slate-100 border-[2.5px] border-black text-slate-700 shadow-[0_2px_0_0_#000] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
                    <span>WAITING FOR ROOM LEADER...</span>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ y: 2, scale: 0.98 }}
                    onClick={onAdvanceToNextRound}
                    className="w-full py-3 px-4 rounded-[16px] font-black text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black border-[2.5px] border-black shadow-[0_4px_0_0_#000] cursor-pointer flex items-center justify-center gap-2 outline-none"
                  >
                    <span>
                      {matchState.currentRound >= matchState.totalRounds || isFinalRoundOver
                        ? 'SEE FINAL PODIUM'
                        : `CONTINUE TO ROUND ${matchState.currentRound + 1}`}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </motion.button>
                )}

                {onExit && (
                  <button
                    onClick={onExit}
                    className="w-full py-2 px-3 rounded-[12px] font-black text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black border border-black/30 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>EXIT TOURNAMENT</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
