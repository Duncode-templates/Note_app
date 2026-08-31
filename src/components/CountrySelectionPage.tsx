import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, Shield, Crosshair, ArrowRight, X } from 'lucide-react';
import { COUNTRIES_DATA, Country, getFlagUrl } from '../data/countries';
import LazyFlagImage from './LazyFlagImage';

interface CountrySelectionPageProps {
  onBack: () => void;
  onSelectCountry: (myTeam: Country, opponentTeam?: Country) => void;
  titleMode?: string;
}

export default function CountrySelectionPage({
  onBack,
  onSelectCountry,
  titleMode = 'Quick Play - Offline',
}: CountrySelectionPageProps) {
  const [myTeam, setMyTeam] = useState<Country | null>(null);
  const [opponentTeam, setOpponentTeam] = useState<Country | null>(null);

  const countries = useMemo(() => {
    return [...COUNTRIES_DATA].sort(() => Math.random() - 0.5);
  }, []);

  const handleCardClick = (country: Country) => {
    if (myTeam?.id === country.id) {
      // Unselect My Team if clicked again
      setMyTeam(null);
    } else if (opponentTeam?.id === country.id) {
      // Unselect Opponent Team if clicked again
      setOpponentTeam(null);
    } else if (!myTeam) {
      // Select as My Team
      setMyTeam(country);
    } else if (!opponentTeam) {
      // Select as Opponent Team
      setOpponentTeam(country);
    } else {
      // Both selected: replace Opponent Team
      setOpponentTeam(country);
    }
  };

  const isBothSelected = Boolean(myTeam && opponentTeam);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.012,
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.88, y: 15 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 450, damping: 25 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 text-slate-900 select-none font-sans z-20 touch-pan-y overscroll-contain"
    >
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 pb-44 flex flex-col relative min-h-full">
        {/* Top Navigation Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-black/20"
        >
        <motion.button
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ y: 4, scale: 0.97, boxShadow: '0px 1px 0px 0px #000' }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          onClick={onBack}
          className="px-4 py-2.5 rounded-[18px] font-black uppercase tracking-wider bg-white text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center gap-2 text-xs sm:text-sm outline-none focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5 text-black" />
          <span>Back to Menu</span>
        </motion.button>

        <div className="bg-white border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[22px] px-5 py-3 text-left sm:text-right">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-black">
            SELECT MATCH TEAMS
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-700 font-bold uppercase tracking-widest mt-0.5">
            {titleMode} • 120 National Teams
          </p>
        </div>
      </motion.div>



      {/* Grid Header Info */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="flex items-center justify-between text-xs text-black font-black uppercase mb-4 px-2 tracking-wider bg-amber-400/90 border-2 border-black rounded-full py-1.5 px-4 shadow-[0_3px_0_0_#000]"
      >
        <span>120 Teams Available</span>
        <span>Tap Card to Select / Unselect</span>
      </motion.div>

      {/* 3D Staggered Grid of 120 Countries */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
      >
        {countries.map((country) => {
          const isMyTeam = myTeam?.id === country.id;
          const isOpponent = opponentTeam?.id === country.id;

          return (
            <motion.button
              key={country.id}
              variants={cardVariants}
              whileHover={{ y: -3, scale: 1.03 }}
              whileTap={{ y: 4, scale: 0.95, boxShadow: '0px 1px 0px 0px #000' }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              onClick={() => handleCardClick(country)}
              className={`flex flex-col p-3 rounded-[22px] text-left cursor-pointer relative overflow-hidden transition-all outline-none focus:outline-none ${
                isMyTeam
                  ? 'bg-emerald-100 text-black border-[4px] border-emerald-500 shadow-[0_6px_0_0_#059669] ring-2 ring-emerald-300'
                  : isOpponent
                  ? 'bg-rose-100 text-black border-[4px] border-rose-500 shadow-[0_6px_0_0_#e11d48] ring-2 ring-rose-300'
                  : 'bg-white text-black border-[3px] border-black shadow-[0_5px_0_0_#000]'
              }`}
            >
              {/* Selected Badge Overlay */}
              {isMyTeam && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white font-black text-[9px] uppercase px-2.5 py-1 rounded-bl-[12px] border-b-2 border-l-2 border-black flex items-center gap-1 shadow-xs z-10">
                  <Check className="w-3 h-3 stroke-[3]" /> MY TEAM
                </div>
              )}
              {isOpponent && (
                <div className="absolute top-0 right-0 bg-rose-500 text-white font-black text-[9px] uppercase px-2.5 py-1 rounded-bl-[12px] border-b-2 border-l-2 border-black flex items-center gap-1 shadow-xs z-10">
                  <Crosshair className="w-3 h-3 stroke-[3]" /> OPPONENT
                </div>
              )}

              {/* Top Row: OVR Rating */}
              <div className="flex items-center justify-start w-full mb-2 min-h-[22px]">
                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full border-2 border-black ${
                  isMyTeam ? 'bg-emerald-400 text-black' : isOpponent ? 'bg-rose-400 text-black' : 'bg-amber-400 text-black'
                }`}>
                  {country.rankPoints} OVR
                </span>
              </div>

              {/* Flag Image Box */}
              <div className="w-full aspect-[3/2] rounded-[12px] border-2 border-black overflow-hidden shadow-sm my-1 bg-slate-100 relative">
                <LazyFlagImage
                  src={getFlagUrl(country.code)}
                  alt={`${country.name} Flag`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Country Name */}
              <span
                className="font-black text-xs sm:text-sm uppercase tracking-wider leading-tight mt-1.5 truncate w-full text-black"
                title={country.name}
              >
                {country.name}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Sticky Bottom UI with Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-[3.5px] border-black p-3.5 sm:p-4 shadow-[0_-8px_20px_rgba(0,0,0,0.25)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left Team Matchup Display */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              {myTeam ? (
                <div className="flex items-center gap-2 bg-emerald-100 border-2 border-black rounded-xl px-3 py-1.5 shadow-[0_2px_0_0_#000]">
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">MY TEAM</span>
                  <div className="w-5 h-3.5 rounded border border-black overflow-hidden bg-slate-200">
                    <LazyFlagImage src={getFlagUrl(myTeam.code)} alt={myTeam.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-black text-xs uppercase text-black">{myTeam.name}</span>
                </div>
              ) : (
                <div className="bg-slate-100 border-2 border-dashed border-slate-400 rounded-xl px-3 py-1.5 text-[11px] font-black uppercase text-slate-400">
                  MY TEAM
                </div>
              )}

              <span className="font-black text-xs uppercase text-slate-400 px-1">VS</span>

              {opponentTeam ? (
                <div className="flex items-center gap-2 bg-rose-100 border-2 border-black rounded-xl px-3 py-1.5 shadow-[0_2px_0_0_#000]">
                  <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">OPPONENT</span>
                  <div className="w-5 h-3.5 rounded border border-black overflow-hidden bg-slate-200">
                    <LazyFlagImage src={getFlagUrl(opponentTeam.code)} alt={opponentTeam.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-black text-xs uppercase text-black">{opponentTeam.name}</span>
                </div>
              ) : (
                <div className="bg-slate-100 border-2 border-dashed border-slate-400 rounded-xl px-3 py-1.5 text-[11px] font-black uppercase text-slate-400">
                  OPPONENT
                </div>
              )}
            </div>
          </div>

          {/* Right Continue Button */}
          <button
            disabled={!isBothSelected}
            onClick={() => {
              if (myTeam && opponentTeam) {
                onSelectCountry(myTeam, opponentTeam);
              }
            }}
            className={`w-full sm:w-auto px-7 py-3.5 rounded-[22px] font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all text-xs sm:text-sm select-none ${
              isBothSelected
                ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-black border-[3.5px] border-black shadow-[0_5px_0_0_#000] cursor-pointer'
                : 'bg-slate-200 text-slate-400 border-[2.5px] border-slate-300 cursor-not-allowed opacity-60'
            }`}
          >
            <span>CONTINUE TO MATCH</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>
      </div>
    </motion.div>
  );
}
