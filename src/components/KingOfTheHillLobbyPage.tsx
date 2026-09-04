import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Crown,
  Shuffle,
  Play,
  User,
  Bot,
  Swords,
  CheckCircle2,
  Clock,
  Flame,
} from 'lucide-react';
import { Country } from '../data/countries';
import { KingOfTheHillContender } from '../types';
import { generateKingOfTheHillContenders } from '../data/kingOfTheHillData';
import LazyFlagImage from './LazyFlagImage';
import { useTranslation } from '../utils/i18n';

interface KingOfTheHillLobbyPageProps {
  userCountry: Country;
  playerName: string;
  userProfilePicture?: string | null;
  onBack: () => void;
  onStartMatch: (contenders: KingOfTheHillContender[], playerCount: 4) => void;
}

export default function KingOfTheHillLobbyPage({
  userCountry,
  playerName,
  userProfilePicture,
  onBack,
  onStartMatch,
}: KingOfTheHillLobbyPageProps) {
  const { t } = useTranslation();
  const playerCount: 4 = 4;
  const [contenders, setContenders] = useState<KingOfTheHillContender[]>(() =>
    generateKingOfTheHillContenders(playerName, userCountry, userProfilePicture, 4)
  );
  const [isShuffling, setIsShuffling] = useState(false);

  // Sync roster when props change
  useEffect(() => {
    const updated = generateKingOfTheHillContenders(playerName, userCountry, userProfilePicture, 4);
    setContenders(updated);
  }, [playerName, userCountry, userProfilePicture]);

  const handleShuffleBots = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const updated = generateKingOfTheHillContenders(playerName, userCountry, userProfilePicture, 4);
      setContenders(updated);
      setIsShuffling(false);
    }, 200);
  };

  const handlePlay = () => {
    onStartMatch(contenders, 4);
  };

  const localContender = contenders.find((c) => c.isLocalPlayer) || contenders[0];
  const botContenders = contenders.filter((c) => !c.isLocalPlayer);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 text-slate-900 select-none font-sans z-20 touch-pan-y overscroll-contain"
    >
      {/* Subtle Turf Pattern Accents */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      <div className="w-full max-w-4xl mx-auto p-3 sm:p-6 md:p-8 pb-40 flex flex-col relative min-h-full">
        {/* Top Header Navigation & Title Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-5 pb-4 border-b-[3px] border-white/30"
        >
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ y: 3, scale: 0.97 }}
            onClick={onBack}
            className="px-4 py-2.5 rounded-[18px] font-black uppercase tracking-wider bg-white text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center gap-2 text-xs sm:text-sm outline-none shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            <span>{t('koth.changeCountry', 'CHANGE COUNTRY')}</span>
          </motion.button>

          {/* Lobby Neo-Brutalist Title Card */}
          <div className="bg-white border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[22px] px-4 sm:px-6 py-2.5 sm:py-3 text-left sm:text-right flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[16px] bg-gradient-to-tr from-amber-400 to-yellow-300 border-[2.5px] border-black flex items-center justify-center text-black shrink-0 shadow-xs">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 fill-black text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-black">
                  {t('koth.lobbyTitle', 'KING OF THE HILL')}
                </h1>
                <span className="bg-emerald-500 text-white font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border-[1.5px] border-black uppercase shadow-2xs">
                  {t('koth.readyToPlay', 'READY')}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-700 font-extrabold uppercase tracking-wider">
                4 CONTENDERS • ELIMINATION SHOOTOUT
              </p>
            </div>
          </div>
        </motion.div>

        {/* Feature Badges Ticker: 10s Timer, 5 Balls, Elimination */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 sm:mb-5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="flex items-center bg-amber-400 text-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-[14px] sm:rounded-[16px] border-[2px] sm:border-[2.5px] border-black gap-1 sm:gap-1.5 shadow-[0_2.5px_0_0_#000] sm:shadow-[0_3px_0_0_#000] font-black text-[10px] sm:text-xs uppercase tracking-wider">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black stroke-[2.5]" />
              <span>10S PER SHOT</span>
            </div>

            <div className="flex items-center bg-white text-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-[14px] sm:rounded-[16px] border-[2px] sm:border-[2.5px] border-black gap-1 sm:gap-1.5 shadow-[0_2.5px_0_0_#000] sm:shadow-[0_3px_0_0_#000] font-black text-[10px] sm:text-xs uppercase tracking-wider">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 fill-orange-500" />
              <span>5 BALLS PER ROUND</span>
            </div>

            <div className="flex items-center bg-slate-900 text-amber-300 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-[14px] sm:rounded-[16px] border-[2px] sm:border-[2.5px] border-black gap-1 sm:gap-1.5 shadow-[0_2.5px_0_0_#000] sm:shadow-[0_3px_0_0_#000] font-black text-[10px] sm:text-xs uppercase tracking-wider">
              <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-300 text-amber-300" />
              <span>SURVIVE 4 ROUNDS</span>
            </div>
          </div>

          {/* Shuffle Opponents Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98, y: 1 }}
            onClick={handleShuffleBots}
            disabled={isShuffling}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-[14px] sm:rounded-[16px] bg-white hover:bg-slate-100 text-black font-black text-[11px] sm:text-sm uppercase tracking-wider border-[2px] sm:border-[2.5px] border-black shadow-[0_2.5px_0_0_#000] sm:shadow-[0_3px_0_0_#000] cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 outline-none shrink-0"
          >
            <Shuffle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{t('koth.shuffleBots', 'SHUFFLE OPPONENTS')}</span>
          </motion.button>
        </div>

        {/* Header Label for Match Contenders */}
        <div className="max-w-2xl mx-auto w-full text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] text-xs font-black uppercase tracking-wider mb-2 sm:mb-2.5 flex items-center gap-2">
          <Swords className="w-4 h-4 text-amber-300 drop-shadow-none" />
          <span>{t('koth.rosterHeader', 'MATCH CONTENDERS')} (4)</span>
        </div>

        {/* 2-in-1 Line Contenders Grid on Mobile & Desktop (2 Columns x 2 Rows) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 max-w-2xl mx-auto w-full">
          {/* 1. LOCAL PLAYER CARD (YOU) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-b from-amber-200 via-amber-300 to-yellow-400 rounded-[16px] sm:rounded-[22px] border-[2.5px] sm:border-[3.5px] border-black p-2.5 sm:p-4 shadow-[0_4px_0_0_#000] sm:shadow-[0_6px_0_0_#000] flex flex-col justify-between relative overflow-hidden"
          >
            {/* Player Ribbon */}
            <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 bg-black text-amber-300 px-1.5 sm:px-2.5 py-0.2 sm:py-0.5 rounded-full font-black text-[8px] sm:text-[10px] uppercase tracking-wider flex items-center gap-0.5 sm:gap-1 border border-black shadow-xs">
              <Crown className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-amber-300 text-amber-300" />
              <span>YOU</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3.5 mb-2 sm:mb-3 mt-1 sm:mt-0">
              {/* Avatar */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-[12px] sm:rounded-[18px] bg-white border-[2px] sm:border-[2.5px] border-black overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                {userProfilePicture ? (
                  <img
                    src={userProfilePicture}
                    alt={playerName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                )}
              </div>

              {/* Player details */}
              <div className="flex flex-col text-left overflow-hidden min-w-0 w-full">
                <span className="text-xs sm:text-base font-black uppercase text-black truncate leading-tight">
                  {localContender.name}
                </span>
                <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                  <div className="w-4.5 h-3 sm:w-6 sm:h-4 rounded-[2px] sm:rounded-[3px] overflow-hidden border border-black/60 shrink-0">
                    <LazyFlagImage
                      countryCode={localContender.countryCode}
                      alt={localContender.countryName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-extrabold uppercase text-slate-900 truncate">
                    {localContender.countryName}
                  </span>
                </div>
              </div>
            </div>

            {/* Status footer */}
            <div className="bg-black/15 rounded-[10px] sm:rounded-[14px] py-1 px-1.5 sm:py-1.5 sm:px-3 flex items-center justify-between text-[8px] sm:text-[10px] font-black text-black uppercase border border-black/20">
              <span className="flex items-center gap-1 text-emerald-950 font-black truncate">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-800 fill-emerald-400 shrink-0" />
                <span className="truncate">READY</span>
              </span>
              <span className="bg-black text-amber-300 px-1.5 sm:px-2.5 py-0.2 sm:py-0.5 rounded-full text-[8px] sm:text-[9px] font-black border border-black shrink-0">
                #1
              </span>
            </div>
          </motion.div>

          {/* 2. BOT CONTENDERS (3 BOTS) */}
          {botContenders.map((bot, index) => (
            <motion.div
              key={bot.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (index + 1) * 0.04 }}
              className="bg-white rounded-[16px] sm:rounded-[22px] border-[2.5px] sm:border-[3.5px] border-black p-2.5 sm:p-4 shadow-[0_4px_0_0_#000] sm:shadow-[0_5px_0_0_#000] flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3.5 mb-2 sm:mb-3 mt-1 sm:mt-0">
                {/* Avatar */}
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-[12px] sm:rounded-[18px] bg-slate-100 border-[2.5px] border-black overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                  {bot.avatarUrl ? (
                    <img
                      src={bot.avatarUrl}
                      alt={bot.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700" />
                  )}
                </div>

                {/* Bot details */}
                <div className="flex flex-col text-left overflow-hidden min-w-0 w-full">
                  <span className="text-xs sm:text-base font-black uppercase text-black truncate leading-tight">
                    {bot.name}
                  </span>
                  <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                    <div className="w-4.5 h-3 sm:w-6 sm:h-4 rounded-[2px] sm:rounded-[3px] overflow-hidden border border-black/50 shrink-0">
                      <LazyFlagImage
                        countryCode={bot.countryCode}
                        alt={bot.countryName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase text-slate-700 truncate">
                      {bot.countryName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status footer */}
              <div className="bg-slate-100 rounded-[10px] sm:rounded-[14px] py-1 px-1.5 sm:py-1.5 sm:px-3 flex items-center justify-between text-[8px] sm:text-[10px] font-black text-slate-800 uppercase border-[1.5px] border-slate-300">
                <span className="flex items-center gap-1 text-slate-700 font-extrabold truncate">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse border border-black/40 shrink-0" />
                  <span className="truncate">READY</span>
                </span>
                <span className="text-[8px] sm:text-[9px] bg-slate-200 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-slate-800 font-black border border-slate-300 shrink-0">
                  #{index + 2}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Short Engaging Paragraph Text Directly Under the Players Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="max-w-2xl mx-auto w-full mt-4 bg-white/95 border-[3.5px] border-black rounded-[22px] p-4 sm:p-5 shadow-[0_6px_0_0_#000] flex flex-col sm:flex-row items-center sm:items-start gap-3.5 sm:gap-4"
        >
          <div className="w-12 h-12 rounded-[16px] bg-gradient-to-tr from-amber-400 to-yellow-300 border-[2.5px] border-black flex items-center justify-center text-black shrink-0 shadow-xs">
            <Crown className="w-6 h-6 fill-black text-black" />
          </div>
          <div className="flex flex-col text-center sm:text-left">
            <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-black flex items-center justify-center sm:justify-start gap-1.5">
              <span>SURVIVE THE HILL • FREE KICK BATTLE</span>
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed mt-1">
              Step onto the turf against 3 hungry national contenders in a 3-round knockout tournament! In every round, each player takes 5 free kicks in turn with only <span className="text-black font-black underline decoration-amber-500 decoration-2">10 seconds</span> on the clock to aim, power, and bury the ball. Precision is everything—the lowest scorer gets eliminated each round across 3 rounds until one supreme striker claims the King of the Hill crown!
            </p>
          </div>
        </motion.div>
      </div>

      {/* Fixed Bottom Action Bar with PLAY Button */}
      <div className="fixed bottom-0 left-0 right-0 p-3.5 sm:p-4 bg-black/90 backdrop-blur-md border-t-[3.5px] border-black z-30 flex items-center justify-center">
        <div className="w-full max-w-xl flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 text-white">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-amber-400 border-[2.5px] border-black flex items-center justify-center text-black shrink-0 shadow-xs">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 fill-black" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase text-amber-300">
                {playerCount} PLAYERS • FREE ELIMINATION
              </span>
              <span className="text-xs sm:text-sm font-black uppercase text-white truncate max-w-[160px] sm:max-w-[220px]">
                {localContender.countryName} vs 3 CONTENDERS
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ y: -2, scale: 1.03 }}
            whileTap={{ y: 3, scale: 0.97 }}
            onClick={handlePlay}
            className="flex-1 max-w-xs py-3.5 px-6 rounded-[22px] font-black text-sm sm:text-base md:text-lg uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-black border-[3.5px] border-black shadow-[0_6px_0_0_#000] cursor-pointer flex items-center justify-center gap-2 outline-none"
          >
            <Play className="w-5 h-5 fill-black text-black stroke-[2.5]" />
            <span>{t('common.playGame', 'PLAY GAME')}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
