import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, Crown, Search, ArrowRight, X, Swords } from 'lucide-react';
import { COUNTRIES_DATA, Country } from '../data/countries';
import LazyFlagImage from './LazyFlagImage';
import { useTranslation } from '../utils/i18n';

interface KingOfTheHillCountrySelectionPageProps {
  onBack: () => void;
  onSelectCountry: (selectedCountry: Country) => void;
  initialCountry?: Country | null;
}

export default function KingOfTheHillCountrySelectionPage({
  onBack,
  onSelectCountry,
  initialCountry,
}: KingOfTheHillCountrySelectionPageProps) {
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(
    initialCountry || COUNTRIES_DATA[0] || null
  );
  const [searchTerm, setSearchTerm] = useState('');

  const countries = useMemo(() => {
    return [...COUNTRIES_DATA].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) return countries;
    const term = searchTerm.toLowerCase().trim();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)
    );
  }, [countries, searchTerm]);

  const handleCountryClick = (country: Country) => {
    setSelectedCountry(country);
  };

  const handleProceed = () => {
    if (selectedCountry) {
      onSelectCountry(selectedCountry);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.012,
        delayChildren: 0.04,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 12 },
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
      <div className="w-full max-w-7xl mx-auto p-3.5 sm:p-6 md:p-8 pb-36 flex flex-col relative min-h-full">
        {/* Top Navigation Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-5 pb-4 border-b-2 border-white/30"
        >
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ y: 3, scale: 0.97 }}
            onClick={onBack}
            className="px-4 py-2.5 rounded-[18px] font-black uppercase tracking-wider bg-white text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center gap-2 text-xs sm:text-sm outline-none shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            <span>{t('common.back', 'BACK')}</span>
          </motion.button>

          <div className="bg-white/95 border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[22px] px-4 sm:px-6 py-2.5 sm:py-3 text-left sm:text-right flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-amber-400 border-2 border-black flex items-center justify-center text-black shrink-0 shadow-xs">
              <Crown className="w-6 h-6 fill-black text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-black">
                  {t('koth.selectCountryTitle', 'SELECT YOUR COUNTRY')}
                </h1>
                <span className="hidden xs:inline-block bg-amber-400 text-black font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border border-black uppercase">
                  KNOCKOUT
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-700 font-bold uppercase tracking-wider">
                {t('koth.selectCountrySub', 'King of the Hill • Offline Sudden Death')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search Input Bar */}
        <div className="mb-5 flex items-center gap-3 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('country.searchPlaceholder', 'Search country...')}
              className="w-full bg-white/95 text-black placeholder-slate-400 pl-10 pr-9 py-2.5 rounded-[16px] border-[2.5px] border-black shadow-[0_4px_0_0_#000] text-xs sm:text-sm font-bold outline-none focus:bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="bg-amber-400 border-[2.5px] border-black shadow-[0_4px_0_0_#000] rounded-[16px] px-3.5 py-2.5 text-xs font-black text-black uppercase tracking-wider shrink-0">
            {filteredCountries.length} TEAMS
          </div>
        </div>

        {/* Country Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3.5"
        >
          {filteredCountries.map((country) => {
            const isSelected = selectedCountry?.code === country.code;

            return (
              <motion.div
                key={country.code}
                variants={cardVariants}
                whileHover={{ y: -3, scale: 1.03 }}
                whileTap={{ y: 2, scale: 0.97 }}
                onClick={() => handleCountryClick(country)}
                className={`relative rounded-[18px] sm:rounded-[20px] p-2.5 sm:p-3 flex flex-col items-center justify-between text-center cursor-pointer transition-all border-[3px] border-black ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-300 to-yellow-400 shadow-[0_6px_0_0_#000] ring-4 ring-amber-300/60 scale-[1.03]'
                    : 'bg-white/95 hover:bg-white shadow-[0_4px_0_0_#000]'
                }`}
              >
                {/* Flag Thumbnail */}
                <div className="w-full aspect-video rounded-[12px] overflow-hidden border-[2px] border-black/40 mb-2 shadow-inner bg-slate-200 relative">
                  <LazyFlagImage
                    countryCode={country.code}
                    alt={country.name}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black text-amber-300 border border-black flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Country Name & Code */}
                <span className="text-xs sm:text-sm font-black uppercase text-black truncate w-full tracking-wide">
                  {country.name}
                </span>
                <span className="text-[10px] font-extrabold uppercase text-slate-600">
                  {country.code.toUpperCase()}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <AnimatePresence>
        {selectedCountry && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-black/85 backdrop-blur-md border-t-[3.5px] border-black z-30 flex items-center justify-center"
          >
            <div className="w-full max-w-2xl flex items-center justify-between gap-3 sm:gap-4">
              {/* Selected Country Badge Preview */}
              <div className="flex items-center gap-2.5 sm:gap-3 bg-white/95 rounded-[18px] border-[2.5px] border-black px-3 py-2 sm:px-4 sm:py-2.5 shadow-[0_4px_0_0_#000] shrink-0">
                <div className="w-8 h-5 sm:w-10 sm:h-6 rounded-[6px] overflow-hidden border border-black/50 shrink-0">
                  <LazyFlagImage
                    countryCode={selectedCountry.code}
                    alt={selectedCountry.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500">
                    YOUR TEAM
                  </span>
                  <span className="text-xs sm:text-sm font-black text-black uppercase truncate max-w-[100px] sm:max-w-[150px]">
                    {selectedCountry.name}
                  </span>
                </div>
              </div>

              {/* Proceed to Lobby Button */}
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ y: 3, scale: 0.98 }}
                onClick={handleProceed}
                className="flex-1 max-w-sm py-3 sm:py-3.5 px-4 sm:px-6 rounded-[20px] font-black text-xs sm:text-sm md:text-base uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-center gap-2 outline-none"
              >
                <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                <span>{t('koth.proceedToLobby', 'PROCEED TO LOBBY')}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
