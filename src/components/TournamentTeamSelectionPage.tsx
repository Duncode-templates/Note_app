import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Trophy, Search, Check, Globe } from 'lucide-react';
import { Country, getFlagUrl } from '../data/countries';
import { QUALIFIED_WORLD_CUP_COUNTRIES } from '../data/tournamentData';
import LazyFlagImage from './LazyFlagImage';
import TrophyImage from './TrophyImage';

interface TournamentTeamSelectionPageProps {
  onBack: () => void;
  onSelectCountry: (selectedCountry: Country) => void;
}

export default function TournamentTeamSelectionPage({
  onBack,
  onSelectCountry,
}: TournamentTeamSelectionPageProps) {
  const [selectedTeam, setSelectedTeam] = useState<Country | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCountries = useMemo(() => {
    return QUALIFIED_WORLD_CUP_COUNTRIES.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.abbr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.confederation.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.015,
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
        {/* Top Navigation & Header */}
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

        <div className="bg-white border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[22px] px-5 py-3 flex items-center gap-3 sm:gap-4 text-left sm:text-right">
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
            <TrophyImage className="w-full h-full" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-black">
              SELECT YOUR TEAM
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-700 font-bold uppercase tracking-widest mt-0.5">
              FIFA World Cup • 40 Qualified Nations (Groups A – J)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search and Instruction Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search country or group..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-full border-2 border-black text-xs sm:text-sm font-bold placeholder:text-slate-400 uppercase tracking-wider shadow-[0_3px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Status Pill */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-black font-black uppercase px-4 py-2 bg-amber-400 border-2 border-black rounded-full shadow-[0_3px_0_0_#000]">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>{filteredCountries.length} Qualified Nations</span>
          </span>
          <span className="hidden sm:inline-block text-slate-900 font-bold">• Tap to Select</span>
        </div>
      </div>

      {/* Grid of 40 Qualified World Cup Teams */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
      >
        {filteredCountries.map((country) => {
          const isSelected = selectedTeam?.id === country.id;

          return (
            <motion.button
              key={country.id}
              variants={cardVariants}
              whileHover={{ y: -3, scale: 1.03 }}
              whileTap={{ y: 4, scale: 0.95, boxShadow: '0px 1px 0px 0px #000' }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              onClick={() => setSelectedTeam(isSelected ? null : country)}
              className={`flex flex-col p-3 rounded-[22px] text-left cursor-pointer relative overflow-hidden transition-all outline-none focus:outline-none ${
                isSelected
                  ? 'bg-emerald-100 text-black border-[4px] border-emerald-500 shadow-[0_7px_0_0_#059669] ring-4 ring-emerald-300 scale-[1.02]'
                  : 'bg-white text-black border-[3px] border-black shadow-[0_5px_0_0_#000] hover:border-black'
              }`}
            >
              {/* Selected Badge Overlay */}
              {isSelected && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white font-black text-[9px] uppercase px-2.5 py-1 rounded-bl-[12px] border-b-2 border-l-2 border-black flex items-center gap-1 shadow-xs z-10">
                  <Check className="w-3 h-3 stroke-[3]" /> SELECTED
                </div>
              )}

              {/* Top Row: OVR Rating & Confederation */}
              <div className="flex items-center justify-between w-full mb-1.5 min-h-[22px]">
                <span
                  className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full border-2 border-black ${
                    isSelected ? 'bg-emerald-400 text-black' : 'bg-amber-400 text-black'
                  }`}
                >
                  {country.rankPoints} OVR
                </span>

                <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 border border-black uppercase">
                  {country.confederation}
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

              {/* Country Name & Confederation */}
              <div className="flex flex-col mt-1.5 w-full">
                <span
                  className="font-black text-xs sm:text-sm uppercase tracking-wider leading-tight truncate w-full text-black"
                  title={country.name}
                >
                  {country.name}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  {country.confederation}
                </span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Sticky Bottom Bar with Confirmation Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-[3.5px] border-black p-3.5 sm:p-4 shadow-[0_-8px_20px_rgba(0,0,0,0.25)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Selected Team Info Box */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            {selectedTeam ? (
              <div className="flex items-center gap-2.5 bg-emerald-100 border-2 border-black rounded-2xl px-3.5 py-2 shadow-[0_3px_0_0_#000]">
                <div className="w-7 h-5 rounded border border-black overflow-hidden bg-slate-200 shrink-0">
                  <LazyFlagImage
                    src={getFlagUrl(selectedTeam.code)}
                    alt={selectedTeam.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs sm:text-sm uppercase text-black">
                      {selectedTeam.name}
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.2 bg-amber-400 text-black border border-black rounded">
                      {selectedTeam.rankPoints} OVR
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Random Group Draw on Tournament Entry
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 border-2 border-dashed border-slate-400 rounded-2xl px-4 py-2.5 text-xs font-black uppercase text-slate-400">
                TAP ANY COUNTRY TO SELECT YOUR TEAM
              </div>
            )}
          </div>

          {/* Action Button: Enter Tournament */}
          <button
            disabled={!selectedTeam}
            onClick={() => {
              if (selectedTeam) {
                onSelectCountry(selectedTeam);
              }
            }}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-[22px] font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all text-xs sm:text-sm select-none ${
              selectedTeam
                ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-black border-[3.5px] border-black shadow-[0_6px_0_0_#000] cursor-pointer'
                : 'bg-slate-200 text-slate-400 border-[2.5px] border-slate-300 cursor-not-allowed opacity-60'
            }`}
          >
            <span>ENTER WORLD CUP (GROUPS A - J)</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>
      </div>
    </motion.div>
  );
}
