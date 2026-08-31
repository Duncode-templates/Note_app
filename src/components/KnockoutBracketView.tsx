import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Check, Crown, Sparkles } from 'lucide-react';
import { Country, getFlagUrl, getCountryAbbr } from '../data/countries';
import { KnockoutMatch } from '../data/tournamentData';
import LazyFlagImage from './LazyFlagImage';
import TrophyImage from './TrophyImage';

interface KnockoutBracketViewProps {
  knockoutMatches: KnockoutMatch[];
  userCountry: Country;
  onPlayMatch: (match: KnockoutMatch) => void;
  isUserEliminated: boolean;
  isUserChampion: boolean;
  onSimulateAllRemaining?: () => void;
}

export default function KnockoutBracketView({
  knockoutMatches,
  userCountry,
  onPlayMatch,
  isUserEliminated,
  isUserChampion,
}: KnockoutBracketViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const r16Matches = knockoutMatches.filter((m) => m.stage === 'round_of_16');
  const qfMatches = knockoutMatches.filter((m) => m.stage === 'quarter_final');
  const sfMatches = knockoutMatches.filter((m) => m.stage === 'semi_final');
  const finalMatch = knockoutMatches.find((m) => m.stage === 'final');

  // Left wing (matches feeding into Semi-Final 1)
  const leftR16 = r16Matches.slice(0, 4);
  const leftQF = qfMatches.slice(0, 2);
  const leftSF = sfMatches[0] || null;

  // Right wing (matches feeding into Semi-Final 2)
  const rightR16 = r16Matches.slice(4, 8);
  const rightQF = qfMatches.slice(2, 4);
  const rightSF = sfMatches[1] || null;

  const championTeam = finalMatch?.winner;

  // Render a team row with strict 36px height
  const renderTeamRow = (
    team: Country | null,
    score?: number,
    penalties?: number,
    isWinner = false,
    isUser = false
  ) => {
    if (!team) {
      return (
        <div className="flex items-center justify-between px-2.5 h-[36px] text-slate-400 bg-slate-50 font-bold text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-3.5 bg-slate-200 rounded-[3px] border border-slate-300 flex items-center justify-center text-[8px] text-slate-400 font-mono">
              ?
            </div>
            <span className="italic text-slate-400 font-bold text-[11px]">TBD</span>
          </div>
          <span className="font-mono text-slate-400 text-xs">-</span>
        </div>
      );
    }

    return (
      <div
        className={`flex items-center justify-between px-2.5 h-[36px] transition-all ${
          isWinner
            ? 'bg-amber-100/95 text-black font-black'
            : isUser
            ? 'bg-emerald-100 text-slate-900 font-black'
            : 'bg-white text-slate-800 font-bold'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-3.5 rounded-[3px] border border-black overflow-hidden bg-slate-200 shrink-0 shadow-2xs">
            <LazyFlagImage src={getFlagUrl(team.code)} alt={team.name} className="w-full h-full object-cover" />
          </div>
          <span
            className="text-xs uppercase tracking-wider truncate max-w-[85px] font-mono font-black"
            title={team.name}
          >
            {getCountryAbbr(team)}
          </span>
          {isUser && (
            <span className="text-[8px] bg-emerald-500 text-white font-black px-1 py-0.2 rounded border border-black shrink-0">
              YOU
            </span>
          )}
          {isWinner && (
            <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3] shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-1 font-mono text-xs shrink-0 pl-1">
          {penalties !== undefined && (
            <span className="text-[9px] text-slate-600 font-bold">({penalties}p)</span>
          )}
          <span
            className={`px-1.5 py-0.5 rounded font-black text-xs ${
              score !== undefined ? 'bg-black text-amber-300 font-mono' : 'text-slate-400'
            }`}
          >
            {score !== undefined ? score : '-'}
          </span>
        </div>
      </div>
    );
  };

  // Render a Match Card Node with fixed 96px height
  const renderMatchCard = (match: KnockoutMatch | undefined, isNextPlayable: boolean, widthClass = 'w-44 sm:w-48') => {
    if (!match) return null;

    const isUserHome =
      Boolean(match.homeTeam && (match.homeTeam.id === userCountry.id || match.homeTeam.code === userCountry.code));
    const isUserAway =
      Boolean(match.awayTeam && (match.awayTeam.id === userCountry.id || match.awayTeam.code === userCountry.code));
    const isUserCard = isUserHome || isUserAway;

    const isHomeWinner = Boolean(
      match.winner && match.homeTeam && (match.winner.id === match.homeTeam.id || match.winner.code === match.homeTeam.code)
    );
    const isAwayWinner = Boolean(
      match.winner && match.awayTeam && (match.winner.id === match.awayTeam.id || match.winner.code === match.awayTeam.code)
    );

    const canPlay = isNextPlayable && isUserCard && !match.isCompleted && match.homeTeam && match.awayTeam;

    return (
      <div
        key={match.id}
        onClick={() => {
          if (canPlay) onPlayMatch(match);
        }}
        className={`${widthClass} h-[96px] rounded-[16px] border-[2.5px] border-black shadow-[0_4px_0_0_#000] overflow-hidden transition-all bg-white relative shrink-0 flex flex-col justify-between ${
          canPlay
            ? 'cursor-pointer ring-3 ring-emerald-400 hover:scale-[1.03] shadow-[0_4px_12px_rgba(16,185,129,0.45)]'
            : isUserCard
            ? 'ring-2 ring-amber-400'
            : ''
        }`}
      >
        {/* Match Header Tag (24px) */}
        <div className="h-6 bg-slate-900 text-white px-2.5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider shrink-0 border-b border-black">
          <span className="text-amber-400 truncate max-w-[110px]">{match.stageName}</span>
          {match.isCompleted ? (
            <span className="text-emerald-400 shrink-0">FT</span>
          ) : canPlay ? (
            <span className="text-emerald-300 font-black animate-pulse shrink-0 flex items-center gap-1">
              <Play className="w-2.5 h-2.5 fill-emerald-300" /> PLAY
            </span>
          ) : (
            <span className="text-slate-400 shrink-0">FIXTURE</span>
          )}
        </div>

        {/* Teams Container (72px: 2 x 36px) */}
        <div className="flex flex-col flex-1 divide-y divide-black/15 justify-center">
          {renderTeamRow(
            match.homeTeam,
            match.homeScore,
            match.homePenalties,
            isHomeWinner,
            isUserHome
          )}
          {renderTeamRow(
            match.awayTeam,
            match.awayScore,
            match.awayPenalties,
            isAwayWinner,
            isUserAway
          )}
        </div>
      </div>
    );
  };

  // Find the next active match for the user
  const activeUserKnockoutMatch = knockoutMatches.find(
    (m) => m.isUserMatch && !m.isCompleted && m.homeTeam && m.awayTeam
  );

  return (
    <div className="w-full flex flex-col items-center">
      {/* TWO-SIDED BRACKET CANVAS CONTAINER */}
      <div
        ref={containerRef}
        className="w-full bg-white/95 border-[3.5px] border-black rounded-[30px] p-4 sm:p-6 lg:p-8 shadow-[0_10px_0_0_#000] overflow-x-auto select-none scrollbar-thin scrollbar-thumb-black/30 scrollbar-track-slate-100"
      >
        <div className="min-w-[1300px] flex items-center justify-between relative py-2">

          {/* ======================================================== */}
          {/* LEFT WING: R16 -> QF -> SF1 -> Final                     */}
          {/* ======================================================== */}
          <div className="flex items-center">
            
            {/* Column 1: Left Round of 16 (4 Matches, Height: 480px) */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="px-3 py-1 bg-slate-900 text-amber-400 font-black text-[10px] uppercase tracking-wider rounded-full border-2 border-black shadow-xs whitespace-nowrap">
                ROUND OF 16
              </div>
              <div className="w-44 sm:w-48 h-[480px] relative">
                {/* Match 0 (Y: 0..96, Center: 48) */}
                <div className="absolute top-0 left-0">
                  {renderMatchCard(leftR16[0], Boolean(activeUserKnockoutMatch?.id === leftR16[0]?.id))}
                </div>
                {/* Match 1 (Y: 120..216, Center: 168) */}
                <div className="absolute top-[120px] left-0">
                  {renderMatchCard(leftR16[1], Boolean(activeUserKnockoutMatch?.id === leftR16[1]?.id))}
                </div>
                {/* Match 2 (Y: 264..360, Center: 312) */}
                <div className="absolute top-[264px] left-0">
                  {renderMatchCard(leftR16[2], Boolean(activeUserKnockoutMatch?.id === leftR16[2]?.id))}
                </div>
                {/* Match 3 (Y: 384..480, Center: 432) */}
                <div className="absolute top-[384px] left-0">
                  {renderMatchCard(leftR16[3], Boolean(activeUserKnockoutMatch?.id === leftR16[3]?.id))}
                </div>
              </div>
            </div>

            {/* SVG Connector: Left R16 -> Left QF (Height: 480px, mt-6 for header alignment) */}
            <div className="w-9 h-[480px] mt-6 shrink-0 pointer-events-none">
              <svg className="w-9 h-[480px]" viewBox="0 0 36 480" fill="none">
                {/* Upper Fork (R16[0], R16[1] -> QF[0]) */}
                <path
                  d="M 0 48 H 18 V 168 H 0 M 18 108 H 36"
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Lower Fork (R16[2], R16[3] -> QF[1]) */}
                <path
                  d="M 0 312 H 18 V 432 H 0 M 18 372 H 36"
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Column 2: Left Quarter-Finals (2 Matches, Height: 480px) */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="px-3 py-1 bg-slate-900 text-amber-400 font-black text-[10px] uppercase tracking-wider rounded-full border-2 border-black shadow-xs whitespace-nowrap">
                QUARTER-FINALS
              </div>
              <div className="w-44 sm:w-48 h-[480px] relative">
                {/* QF 0 (Y: 60..156, Center: 108) */}
                <div className="absolute top-[60px] left-0">
                  {renderMatchCard(leftQF[0], Boolean(activeUserKnockoutMatch?.id === leftQF[0]?.id))}
                </div>
                {/* QF 1 (Y: 324..420, Center: 372) */}
                <div className="absolute top-[324px] left-0">
                  {renderMatchCard(leftQF[1], Boolean(activeUserKnockoutMatch?.id === leftQF[1]?.id))}
                </div>
              </div>
            </div>

            {/* SVG Connector: Left QF -> Left SF (Height: 480px, mt-6 for header alignment) */}
            <div className="w-9 h-[480px] mt-6 shrink-0 pointer-events-none">
              <svg className="w-9 h-[480px]" viewBox="0 0 36 480" fill="none">
                {/* SF Fork (QF[0], QF[1] -> SF[0]) */}
                <path
                  d="M 0 108 H 18 V 372 H 0 M 18 240 H 36"
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Column 3: Left Semi-Final (1 Match, Height: 480px) */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="px-3 py-1 bg-slate-900 text-amber-400 font-black text-[10px] uppercase tracking-wider rounded-full border-2 border-black shadow-xs whitespace-nowrap">
                SEMI-FINAL 1
              </div>
              <div className="w-44 sm:w-48 h-[480px] relative">
                {/* SF 0 (Y: 192..288, Center: 240) */}
                <div className="absolute top-[192px] left-0">
                  {renderMatchCard(leftSF, Boolean(activeUserKnockoutMatch?.id === leftSF?.id))}
                </div>
              </div>
            </div>

            {/* SVG Connector: Left SF -> Center Final (mt-6 for header alignment) */}
            <div className="w-9 h-[480px] mt-6 shrink-0 pointer-events-none">
              <svg className="w-9 h-[480px]" viewBox="0 0 36 480" fill="none">
                <path
                  d="M 0 240 H 36"
                  stroke="#000"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>

          </div>

          {/* ======================================================== */}
          {/* CENTER STAGE: THE FREE KICK CUP & GRAND FINAL & PODIUM   */}
          {/* ======================================================== */}
          <div className="flex flex-col items-center gap-4 px-4 py-3.5 bg-gradient-to-b from-amber-100/90 via-amber-50 to-white border-[3.5px] border-black rounded-[28px] shadow-[0_8px_0_0_#000] z-10 shrink-0 w-64 sm:w-72 mx-1 mt-6">
            
            {/* Center Trophy Header */}
            <div className="flex flex-col items-center text-center pt-1">
              <div className="relative mb-1">
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center animate-pulse">
                  <TrophyImage className="w-full h-full drop-shadow-[0_4px_8px_rgba(245,158,11,0.6)]" />
                </div>
                <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-spin" />
              </div>
              
              <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-300 px-2.5 py-0.5 rounded-full border-2 border-black shadow-2xs">
                THE FREE KICK CUP
              </span>
              <h2 className="text-lg sm:text-xl font-black uppercase text-black tracking-wider mt-0.5">
                WORLD FINAL
              </h2>
            </div>

            {/* Grand Final Match Card (Centered at Y=240) */}
            <div className="w-full flex justify-center">
              {finalMatch &&
                renderMatchCard(
                  finalMatch,
                  Boolean(activeUserKnockoutMatch?.id === finalMatch.id),
                  'w-full max-w-[260px]'
                )}
            </div>

            {/* Champion Podium Box */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className={`w-full border-[2.5px] border-black rounded-[20px] p-3 shadow-[0_4px_0_0_#000] flex flex-col items-center text-center gap-1 relative overflow-hidden ${
                championTeam ? 'bg-amber-300' : 'bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1">
                <Crown className="w-4 h-4 text-amber-900" />
                <span className="text-[9px] font-black uppercase text-slate-900 tracking-wider">
                  FREE KICK CUP CHAMPION
                </span>
              </div>

              {championTeam ? (
                <div className="flex flex-col items-center gap-1 mt-0.5">
                  <div className="w-10 h-7 rounded-[4px] border border-black overflow-hidden shadow-xs bg-slate-200">
                    <LazyFlagImage
                      src={getFlagUrl(championTeam.code)}
                      alt={championTeam.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-mono font-black text-base uppercase text-black">
                    {getCountryAbbr(championTeam)}
                  </span>
                  <span className="text-[11px] font-black uppercase text-slate-800">
                    {championTeam.name}
                  </span>
                  <span className="text-[9px] font-black uppercase bg-black text-amber-300 px-2 py-0.5 rounded-full mt-0.5">
                    WORLD CHAMPIONS 🏆
                  </span>
                </div>
              ) : (
                <div className="py-1 flex flex-col items-center gap-0.5">
                  <span className="font-bold text-[11px] italic text-slate-600 uppercase">
                    Awaiting Final Conclusion
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold">
                    Winner lifts the Free Kick Cup
                  </span>
                </div>
              )}
            </motion.div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT WING: Final <- SF2 <- QF <- R16                    */}
          {/* ======================================================== */}
          <div className="flex items-center">
            
            {/* SVG Connector: Center Final -> Right SF (mt-6 for header alignment) */}
            <div className="w-9 h-[480px] mt-6 shrink-0 pointer-events-none">
              <svg className="w-9 h-[480px]" viewBox="0 0 36 480" fill="none">
                <path
                  d="M 0 240 H 36"
                  stroke="#000"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Column 4: Right Semi-Final (1 Match, Height: 480px) */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="px-3 py-1 bg-slate-900 text-amber-400 font-black text-[10px] uppercase tracking-wider rounded-full border-2 border-black shadow-xs whitespace-nowrap">
                SEMI-FINAL 2
              </div>
              <div className="w-44 sm:w-48 h-[480px] relative">
                {/* SF 1 (Y: 192..288, Center: 240) */}
                <div className="absolute top-[192px] left-0">
                  {renderMatchCard(rightSF, Boolean(activeUserKnockoutMatch?.id === rightSF?.id))}
                </div>
              </div>
            </div>

            {/* SVG Connector: Right SF <- Right QF (Height: 480px, mt-6 for header alignment) */}
            <div className="w-9 h-[480px] mt-6 shrink-0 pointer-events-none">
              <svg className="w-9 h-[480px]" viewBox="0 0 36 480" fill="none">
                {/* Right SF Fork (SF[1] <- QF[2], QF[3]) */}
                <path
                  d="M 36 108 H 18 V 372 H 36 M 18 240 H 0"
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Column 5: Right Quarter-Finals (2 Matches, Height: 480px) */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="px-3 py-1 bg-slate-900 text-amber-400 font-black text-[10px] uppercase tracking-wider rounded-full border-2 border-black shadow-xs whitespace-nowrap">
                QUARTER-FINALS
              </div>
              <div className="w-44 sm:w-48 h-[480px] relative">
                {/* QF 2 (Y: 60..156, Center: 108) */}
                <div className="absolute top-[60px] left-0">
                  {renderMatchCard(rightQF[0], Boolean(activeUserKnockoutMatch?.id === rightQF[0]?.id))}
                </div>
                {/* QF 3 (Y: 324..420, Center: 372) */}
                <div className="absolute top-[324px] left-0">
                  {renderMatchCard(rightQF[1], Boolean(activeUserKnockoutMatch?.id === rightQF[1]?.id))}
                </div>
              </div>
            </div>

            {/* SVG Connector: Right QF <- Right R16 (Height: 480px, mt-6 for header alignment) */}
            <div className="w-9 h-[480px] mt-6 shrink-0 pointer-events-none">
              <svg className="w-9 h-[480px]" viewBox="0 0 36 480" fill="none">
                {/* Upper Fork (QF[2] <- R16[4], R16[5]) */}
                <path
                  d="M 36 48 H 18 V 168 H 36 M 18 108 H 0"
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Lower Fork (QF[3] <- R16[6], R16[7]) */}
                <path
                  d="M 36 312 H 18 V 432 H 36 M 18 372 H 0"
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Column 6: Right Round of 16 (4 Matches, Height: 480px) */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="px-3 py-1 bg-slate-900 text-amber-400 font-black text-[10px] uppercase tracking-wider rounded-full border-2 border-black shadow-xs whitespace-nowrap">
                ROUND OF 16
              </div>
              <div className="w-44 sm:w-48 h-[480px] relative">
                {/* Match 4 (Y: 0..96, Center: 48) */}
                <div className="absolute top-0 left-0">
                  {renderMatchCard(rightR16[0], Boolean(activeUserKnockoutMatch?.id === rightR16[0]?.id))}
                </div>
                {/* Match 5 (Y: 120..216, Center: 168) */}
                <div className="absolute top-[120px] left-0">
                  {renderMatchCard(rightR16[1], Boolean(activeUserKnockoutMatch?.id === rightR16[1]?.id))}
                </div>
                {/* Match 6 (Y: 264..360, Center: 312) */}
                <div className="absolute top-[264px] left-0">
                  {renderMatchCard(rightR16[2], Boolean(activeUserKnockoutMatch?.id === rightR16[2]?.id))}
                </div>
                {/* Match 7 (Y: 384..480, Center: 432) */}
                <div className="absolute top-[384px] left-0">
                  {renderMatchCard(rightR16[3], Boolean(activeUserKnockoutMatch?.id === rightR16[3]?.id))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
