import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, RefreshCw, Zap, Globe } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES, SupportedLanguage } from '../utils/i18n';
import { crazyGamesSDK } from '../utils/crazyGamesSDK';
import LazyFlagImage from './LazyFlagImage';

interface LanguageSelectionPageProps {
  onBack: () => void;
}

export default function LanguageSelectionPage({ onBack }: LanguageSelectionPageProps) {
  const { language, setLanguage, t } = useTranslation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleSelectLanguage = (code: SupportedLanguage, nativeName: string) => {
    setLanguage(code);
    crazyGamesSDK.happytime();
    showToast(`${nativeName} (${code.toUpperCase()}) selected`);
  };

  const handleAutoDetect = () => {
    const detectedLang = crazyGamesSDK.getLanguage();
    const match = SUPPORTED_LANGUAGES.find((l) => l.code === detectedLang);
    if (match) {
      setLanguage(match.code as SupportedLanguage);
      showToast(`Auto-detected: ${match.nativeName}`);
    } else {
      setLanguage('en');
      showToast(`Auto-detected: English`);
    }
  };

  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 450, damping: 25 },
    },
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 text-slate-900 select-none font-sans z-20 touch-pan-y overscroll-contain">
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8 pb-32 min-h-full flex flex-col relative">
        
        {/* Top Navigation Bar */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b-2 border-black/20"
        >
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ y: 3, scale: 0.97 }}
            onClick={onBack}
            className="px-4 py-2.5 rounded-[18px] font-black uppercase tracking-wider bg-white text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center gap-2 text-xs sm:text-sm outline-none"
          >
            <ArrowLeft className="w-5 h-5 text-black stroke-[2.5]" />
            <span>{t('common.back', 'Back')}</span>
          </motion.button>

          <div className="bg-white border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[22px] px-5 py-2.5 text-left sm:text-right">
            <h1 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-black">
              {t('lang.title', 'SELECT LANGUAGE')}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-700 font-bold uppercase tracking-widest mt-0.5">
              16 {t('lang.supportedLanguages', 'Supported Languages')}
            </p>
          </div>
        </motion.div>

        {/* Info & Quick Auto-Detect Bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex items-center justify-between gap-3 text-xs text-black font-black uppercase mb-5 px-4 py-2.5 bg-amber-400 border-[3px] border-black rounded-[18px] shadow-[0_4px_0_0_#000]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-5 rounded-[6px] border-[1.5px] border-black overflow-hidden bg-slate-200 shrink-0 shadow-xs">
              <LazyFlagImage
                countryCode={activeLang.countryCode}
                alt={`${activeLang.name} Flag`}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[11px] sm:text-xs font-black uppercase">
              {t('common.active', 'Active')}: <strong className="text-black">{activeLang.nativeName}</strong> ({activeLang.name})
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleAutoDetect}
            className="bg-black hover:bg-neutral-800 text-white border-[2px] border-black px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-amber-300" />
            <span>{t('lang.autoDetect', 'Auto-Detect')}</span>
          </motion.button>
        </motion.div>

        {/* Normal Sized Language Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 flex-1"
        >
          {SUPPORTED_LANGUAGES.map((item) => {
            const isSelected = language === item.code;
            return (
              <motion.button
                key={item.code}
                variants={cardVariants}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ y: 2, scale: 0.98 }}
                onClick={() => handleSelectLanguage(item.code as SupportedLanguage, item.nativeName)}
                className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-[20px] text-left cursor-pointer relative transition-all outline-none ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-400 text-black border-[3.5px] border-black shadow-[0_5px_0_0_#000] ring-2 ring-amber-400'
                    : 'bg-white text-black border-[3px] border-black shadow-[0_4px_0_0_#000] hover:bg-slate-50'
                }`}
              >
                {/* Real Flag Image Box */}
                <div className="w-11 h-8 sm:w-12 sm:h-8.5 rounded-lg border-[2px] border-black overflow-hidden bg-slate-200 shrink-0 shadow-xs">
                  <LazyFlagImage
                    countryCode={item.countryCode}
                    alt={`${item.name} Flag`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Language Names */}
                <div className="flex-1 min-w-0">
                  <div className="font-black text-xs sm:text-sm text-black truncate leading-tight">
                    {item.nativeName}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider truncate mt-0.5">
                    {item.name}
                  </div>
                </div>

                {/* Selected Checkmark */}
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-black text-amber-300 flex items-center justify-center shrink-0 border border-black shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Toast Notification Popup */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-amber-300 border-[3px] border-amber-400 shadow-[0_6px_0_0_#000] px-5 py-2.5 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

