import React from 'react';
import { Trophy } from 'lucide-react';
import { KingOfTheHillMatchState } from '../types';
import LazyFlagImage from './LazyFlagImage';
import { getCountryAbbr } from '../data/countries';
import { getStickerAvatarUrl } from '../data/botProfiles';

interface KingOfTheHillScoreboardProps {
  matchState: KingOfTheHillMatchState;
  isUserTurn?: boolean;
  activeShotIndex?: number;
}

export default function KingOfTheHillScoreboard({
  matchState,
}: KingOfTheHillScoreboardProps) {
  // Sort contenders:
  // 1. Active contenders first (local player first, then other contenders)
  // 2. Eliminated contenders at end
  const sortedContenders = [...matchState.contenders].sort((a, b) => {
    if (!a.isEliminated && b.isEliminated) return -1;
    if (a.isEliminated && !b.isEliminated) return 1;
    if (a.isLocalPlayer && !b.isLocalPlayer) return -1;
    if (!a.isLocalPlayer && b.isLocalPlayer) return 1;
    return b.totalGoals - a.totalGoals;
  });

  return (
    <div className="w-full bg-white/95 backdrop-blur-md text-black border-[2.5px] sm:border-[3px] border-black shadow-[0_4px_0_0_#000] rounded-[16px] sm:rounded-[18px] p-2 sm:p-2.5 select-none transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-1 pb-1.5 mb-1.5 border-b-[1.5px] border-black/15">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-[5px] bg-amber-400 border border-black flex items-center justify-center shrink-0 shadow-2xs">
            <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black fill-black/20" />
          </div>
          <span className="font-mono font-black text-[10px] sm:text-[11px] uppercase tracking-wider text-black">
            SCOREBOARD
          </span>
        </div>

        <span className="font-mono font-bold text-[8px] sm:text-[8.5px] text-slate-500 uppercase tracking-wider">
          SUDDEN DEATH
        </span>
      </div>

      {/* Grid of All Contenders (User + AI) - Strictly 2 in a row on all devices */}
      <div className="grid grid-cols-2 gap-1.5 w-full">
        {sortedContenders.map((contender, index) => {
          const isShooterNow =
            contender.id === matchState.activeContenderId && !contender.isEliminated;
          const countryAbbr =
            getCountryAbbr(contender.countryCode) ||
            contender.countryCode.slice(0, 3).toUpperCase();
          const pfpUrl =
            contender.avatarUrl || getStickerAvatarUrl(contender.name, index);
          const displayName =
            contender.name || (contender.isLocalPlayer ? 'YOU' : `Bot ${index + 1}`);

          return (
            <div
              key={contender.id}
              className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-[12px] sm:rounded-[14px] border-[2px] transition-all min-w-0 ${
                isShooterNow
                  ? 'bg-amber-300 border-black shadow-[0_3px_0_0_#000] ring-2 ring-black scale-[1.01]'
                  : contender.isLocalPlayer
                  ? 'bg-amber-50 border-black shadow-[0_2px_0_0_#000]'
                  : contender.isEliminated
                  ? 'bg-slate-100 border-slate-300 opacity-40 grayscale shadow-none'
                  : 'bg-white border-black shadow-[0_2px_0_0_#000] hover:bg-slate-50'
              }`}
            >
              {/* Avatar + Flag */}
              <div className="relative shrink-0">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden border-[1.5px] ${
                    isShooterNow
                      ? 'border-black bg-white ring-1 ring-black'
                      : contender.isEliminated
                      ? 'border-slate-400 bg-slate-200'
                      : 'border-black bg-white'
                  } shadow-2xs shrink-0`}
                >
                  <img
                    src={pfpUrl}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(
                        contender.name,
                        index
                      );
                    }}
                  />
                </div>
                {/* Country Flag Badge */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-2.5 rounded-[2px] overflow-hidden border border-black shadow-xs shrink-0">
                  <LazyFlagImage
                    countryCode={contender.countryCode}
                    alt={contender.countryName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Name on top line, Round Dots directly under player name */}
              <div className="flex flex-col min-w-0 flex-1 justify-center leading-tight">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className={`font-black text-[10px] sm:text-[11px] truncate ${
                      contender.isEliminated ? 'text-slate-400 line-through' : 'text-black'
                    }`}
                    title={displayName}
                  >
                    {contender.isLocalPlayer ? 'YOU' : displayName}
                  </span>
                  {contender.isLocalPlayer && (
                    <span className="shrink-0 text-[7px] bg-amber-400 text-black font-black px-1 py-0.2 rounded border border-black leading-none">
                      ★
                    </span>
                  )}
                  <span className="text-[8px] font-bold text-slate-500 uppercase truncate">
                    {contender.isEliminated ? 'OUT' : countryAbbr}
                  </span>
                </div>

                {/* Round dots directly under player name */}
                <div className="flex items-center gap-1 mt-1">
                  {[0, 1, 2, 3, 4].map((ballIdx) => {
                    const shot = contender.currentRoundShots[ballIdx];
                    const isCurrentBall = isShooterNow && matchState.activeShotIndex === ballIdx;

                    let pipClass = 'bg-slate-200 border-slate-300';
                    if (shot === 'goal') {
                      pipClass = 'bg-emerald-500 border-black shadow-2xs';
                    } else if (shot === 'post' || shot === 'save') {
                      pipClass = 'bg-amber-400 border-black shadow-2xs';
                    } else if (shot === 'miss') {
                      pipClass = 'bg-rose-500 border-black shadow-2xs';
                    } else if (isCurrentBall) {
                      pipClass = 'bg-amber-400 border-black ring-2 ring-black animate-pulse';
                    }

                    return (
                      <div
                        key={ballIdx}
                        className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border ${pipClass} shrink-0 transition-all`}
                        title={`Ball ${ballIdx + 1}: ${shot || (isCurrentBall ? 'Shooting' : 'Pending')}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
