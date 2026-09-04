import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Swords, Skull, ShieldCheck, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { KingOfTheHillMatchState, KingOfTheHillContender, KingShotOutcome } from '../types';
import LazyFlagImage from './LazyFlagImage';
import { getCountryAbbr } from '../data/countries';
import { getStickerAvatarUrl } from '../data/botProfiles';
import { FREE_KICK_POSITIONS } from './Stadium3DView';

interface KingOfTheHillRoundUIProps {
  matchState: KingOfTheHillMatchState;
  activeContender: KingOfTheHillContender | undefined;
  isUserTurn: boolean;
  activeShotIndex: number;
  botCommentary?: string | null;
}

export default function KingOfTheHillRoundUI({
  matchState,
  activeContender,
  isUserTurn,
  activeShotIndex,
  botCommentary,
}: KingOfTheHillRoundUIProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const currentPos = FREE_KICK_POSITIONS[matchState.positionIndex] || FREE_KICK_POSITIONS[0];

  const aliveContenders = matchState.contenders.filter((c) => !c.isEliminated);
  const eliminatedCount = matchState.eliminatedCountThisRound;
  const safeCount = Math.max(1, aliveContenders.length - eliminatedCount);

  // Sort alive contenders by current round goals desc, then current round score desc
  const sortedAlive = [...aliveContenders].sort((a, b) => {
    // Put finished shooters with more goals higher
    if (b.currentRoundGoals !== a.currentRoundGoals) {
      return b.currentRoundGoals - a.currentRoundGoals;
    }
    return b.currentRoundScore - a.currentRoundScore;
  });

  const renderShotCircle = (outcome: KingShotOutcome | undefined, index: number, isCurrent = false) => {
    if (!outcome) {
      return (
        <div
          key={index}
          className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${
            isCurrent
              ? 'border-amber-400 bg-amber-400/30 text-amber-300 animate-pulse font-black'
              : 'border-slate-600 bg-slate-800/80 text-slate-500'
          }`}
        >
          {index + 1}
        </div>
      );
    }

    if (outcome === 'goal') {
      return (
        <div
          key={index}
          className="w-4 h-4 rounded-full bg-emerald-500 border border-black flex items-center justify-center text-[10px] text-white shadow-xs font-black"
          title="Goal"
        >
          ⚽
        </div>
      );
    }
    if (outcome === 'save') {
      return (
        <div
          key={index}
          className="w-4 h-4 rounded-full bg-amber-500 border border-black flex items-center justify-center text-[9px] text-black shadow-xs font-black"
          title="Saved"
        >
          🧤
        </div>
      );
    }
    if (outcome === 'post') {
      return (
        <div
          key={index}
          className="w-4 h-4 rounded-full bg-orange-500 border border-black flex items-center justify-center text-[9px] text-white shadow-xs font-black"
          title="Post"
        >
          💥
        </div>
      );
    }
    return (
      <div
        key={index}
        className="w-4 h-4 rounded-full bg-rose-600 border border-black flex items-center justify-center text-[9px] text-white shadow-xs font-black"
        title="Miss"
      >
        ❌
      </div>
    );
  };

  return (
    <div className="fixed top-[62px] sm:top-[68px] right-2 sm:right-4 z-30 w-[270px] sm:w-[320px] pointer-events-auto select-none">
      <div className="bg-black/90 backdrop-blur-md border-[2.5px] border-amber-400 rounded-[18px] shadow-[0_6px_0_0_#000] overflow-hidden text-white transition-all">
        {/* Current Round Header */}
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-3 py-2 bg-gradient-to-r from-slate-900 via-black to-slate-900 border-b border-amber-400/40 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-black text-[10px] border border-black shrink-0 shadow-xs">
              <Crown className="w-3.5 h-3.5 fill-black text-black" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300">
                ROUND {matchState.currentRound} OF {matchState.totalRounds}
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">
                {matchState.roundTitle.split(':')[1]?.trim() || matchState.roundTitle}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={isCollapsed ? 'Expand Round UI' : 'Collapse Round UI'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4 text-amber-300" /> : <ChevronUp className="w-4 h-4 text-amber-300" />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Elimination Rule Alert */}
              <div className={`border-b px-2.5 py-1 text-[9px] sm:text-[10px] font-black flex items-center justify-between uppercase ${
                eliminatedCount === 0
                  ? 'bg-amber-950/90 border-amber-800/60 text-amber-300'
                  : 'bg-rose-950/90 border-rose-800/60 text-rose-300'
              }`}>
                <span className="flex items-center gap-1">
                  {eliminatedCount === 0 ? (
                    <>
                      <Swords className="w-3 h-3 text-amber-400 shrink-0" />
                      FINAL 2 DUEL • SCORES CARRY OVER
                    </>
                  ) : (
                    <>
                      <Skull className="w-3 h-3 text-rose-400 shrink-0" />
                      LOWEST {eliminatedCount} {eliminatedCount === 1 ? 'SCORER IS' : 'SCORERS ARE'} ELIMINATED
                    </>
                  )}
                </span>
                <span className="text-slate-400 text-[8px] font-bold">5 SHOTS</span>
              </div>

              {/* Active Shooter Card */}
              {activeContender && (
                <div
                  className={`p-2 border-b transition-all ${
                    isUserTurn
                      ? 'bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-transparent border-amber-400/50'
                      : 'bg-gradient-to-r from-sky-600/20 via-sky-500/10 to-transparent border-sky-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 truncate max-w-[190px] sm:max-w-[230px]">
                      {/* Avatar Profile Picture */}
                      <div className="relative shrink-0">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40 bg-slate-800 shrink-0">
                          <img
                            src={activeContender.avatarUrl || getStickerAvatarUrl(activeContender.name, 0)}
                            alt={activeContender.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(activeContender.name, 0);
                            }}
                          />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-2 rounded-[2px] overflow-hidden border border-black/80">
                          <LazyFlagImage
                            countryCode={activeContender.countryCode}
                            alt={activeContender.countryName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 truncate overflow-hidden">
                        <span className="text-xs font-black truncate">
                          {isUserTurn ? 'YOUR TURN' : activeContender.name}
                        </span>
                        <span className="px-1 py-0.2 rounded bg-black/60 border border-white/20 font-mono font-black text-[8px] text-amber-300 shrink-0">
                          {getCountryAbbr(activeContender.countryCode) || activeContender.countryCode.slice(0, 3).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] font-black bg-black/60 px-1.5 py-0.2 rounded border border-white/20 text-amber-300">
                        SHOT {Math.min(5, activeShotIndex + 1)}/5
                      </span>
                    </div>
                  </div>

                  {/* 5 Shot Circles */}
                  <div className="flex items-center justify-between mt-1 px-1">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((i) =>
                        renderShotCircle(activeContender.currentRoundShots[i], i, i === activeShotIndex)
                      )}
                    </div>
                    <div className="text-[11px] font-black text-amber-300">
                      ⚽ {activeContender.currentRoundGoals} / 5 Goals
                    </div>
                  </div>

                  {/* Free Kick Spot Details */}
                  <div className="mt-1.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 flex items-center justify-between text-[9px]">
                    <span className="font-extrabold text-amber-300 flex items-center gap-1 truncate max-w-[170px]">
                      <span>📍 Pos {Math.min(5, activeShotIndex + 1)}/5:</span>
                      <span className="text-white font-bold truncate">{currentPos.name}</span>
                    </span>
                    <span className="font-mono text-amber-400 font-bold shrink-0">{currentPos.distance}m</span>
                  </div>

                  {/* Bot Live Commentary */}
                  {!isUserTurn && (
                    <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between gap-1">
                      <div className="text-[9px] font-bold text-sky-200 truncate animate-pulse">
                        {botCommentary || '⚡ Taking shot...'}
                      </div>
                    </div>
                  )}

                  {isUserTurn && (
                    <div className="mt-1 text-[8px] font-extrabold text-amber-300 flex items-center justify-center gap-1 animate-pulse">
                      <span>🎯 Swipe the ball to shoot your 5 goals!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Round Standings List */}
              <div className="p-2">
                <div className="flex items-center justify-between mb-1 px-0.5 text-[9px] font-black uppercase text-slate-400">
                  <span>ROUND STANDINGS</span>
                  <span className="text-emerald-400 font-bold">TOP {safeCount} ADVANCE</span>
                </div>

                <div className="flex flex-col gap-1 max-h-40 sm:max-h-48 overflow-y-auto pr-0.5">
                  {sortedAlive.map((contender, index) => {
                    const isSafe = index < safeCount;
                    const isCurrentShooter = contender.id === matchState.activeContenderId;
                    const hasFinished = contender.currentRoundShots.length >= 5;

                    return (
                      <React.Fragment key={contender.id}>
                        {/* Elimination Cutoff Line */}
                        {index === safeCount && (
                          <div className="my-0.5 border-t border-dashed border-rose-500 relative flex items-center justify-center py-0.5">
                            <span className="bg-rose-600 text-white text-[7px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                              💀 ELIMINATION CUTOFF
                            </span>
                          </div>
                        )}

                        <div
                          className={`flex items-center justify-between px-2 py-1 rounded-[8px] border text-[10px] sm:text-[11px] transition-all ${
                            contender.isLocalPlayer
                              ? 'bg-amber-400 text-black border-black font-black shadow-xs'
                              : isCurrentShooter
                              ? 'bg-sky-900/60 border-sky-400 text-white font-bold'
                              : isSafe
                              ? 'bg-slate-800/80 border-slate-700 text-white'
                              : 'bg-rose-950/70 border-rose-700/80 text-rose-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate max-w-[130px] sm:max-w-[155px]">
                            <div className="w-5 h-5 rounded-full overflow-hidden border border-black/40 shrink-0 bg-slate-800">
                              <img
                                src={contender.avatarUrl || getStickerAvatarUrl(contender.name, index)}
                                alt={contender.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(contender.name, index);
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-1 truncate">
                              <span className="truncate">
                                {contender.name} {contender.isLocalPlayer && '★'}
                              </span>
                              <span className="text-[8px] font-mono font-black opacity-80 shrink-0">
                                ({getCountryAbbr(contender.countryCode) || contender.countryCode.slice(0, 3).toUpperCase()})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 font-black text-[9px] sm:text-[10px]">
                            {/* Shot Dots Mini */}
                            <div className="flex items-center gap-0.5">
                              {[0, 1, 2, 3, 4].map((i) => {
                                const out = contender.currentRoundShots[i];
                                if (!out) {
                                  return <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-600" />;
                                }
                                if (out === 'goal') {
                                  return <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />;
                                }
                                return <div key={i} className="w-1.5 h-1.5 rounded-full bg-rose-500" />;
                              })}
                            </div>

                            <span className={contender.isLocalPlayer ? 'text-black' : 'text-amber-300'}>
                              ⚽{contender.currentRoundGoals}/5
                            </span>

                            {hasFinished && (
                              <span
                                className={`text-[8px] px-1 py-0.2 rounded font-black ${
                                  isSafe
                                    ? contender.isLocalPlayer
                                      ? 'bg-black text-amber-300'
                                      : 'bg-emerald-600 text-white'
                                    : 'bg-rose-600 text-white'
                                }`}
                              >
                                {isSafe ? 'SAFE' : 'RISK'}
                              </span>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
