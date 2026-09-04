import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Globe, Bot, ArrowRight, HelpCircle } from 'lucide-react';
import { useTranslation } from '../utils/i18n';

interface KingOfTheHillSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'Online' | 'Offline') => void;
  onOpenRules?: () => void;
}

export default function KingOfTheHillSelectModal({
  isOpen,
  onClose,
  onSelectMode,
  onOpenRules,
}: KingOfTheHillSelectModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/75 backdrop-blur-sm select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', stiffness: 450, damping: 26 }}
          className="w-full max-w-lg bg-white border-[3.5px] sm:border-[4px] border-black rounded-[26px] p-5 sm:p-6 shadow-[0_14px_0_0_#000] relative text-black"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-slate-100 shadow-2xs z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Header Banner */}
          <div className="flex items-center gap-3 mb-4 pr-8">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 border-2 border-black flex items-center justify-center text-white shadow-xs shrink-0">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-200 fill-yellow-200" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                {t('koth.title', 'KING OF THE HILL')}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-bold uppercase tracking-wider">
                {t('koth.selectModePrompt', 'Select match mode:')}
              </p>
            </div>
          </div>

          {/* Rules & How to Play Quick Access Button */}
          {onOpenRules && (
            <button
              type="button"
              onClick={onOpenRules}
              className="w-full mb-4 py-2.5 px-3.5 rounded-[16px] bg-amber-50 hover:bg-amber-100 border-2 border-black text-black font-black text-xs uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
            >
              <span className="flex items-center gap-2 text-amber-950 font-black">
                <HelpCircle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                <span>{t('koth.viewRules', 'VIEW RULES & HOW TO PLAY')}</span>
              </span>
              <span className="text-[10px] font-black bg-black text-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                INFO
              </span>
            </button>
          )}

          {/* Mode Selection Options */}
          <div className="flex flex-col gap-3">
            {/* 1. ONLINE MULTIPLAYER */}
            <motion.button
              whileHover={{ y: -2, scale: 1.015 }}
              whileTap={{ y: 3, scale: 0.98 }}
              onClick={() => onSelectMode('Online')}
              className="w-full py-4 px-4 sm:px-5 rounded-[20px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] flex items-center justify-between cursor-pointer group outline-none text-left transition-transform"
            >
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-black/10 border border-black/20 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-black stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black text-black">
                      {t('common.online', 'ONLINE')}
                    </span>
                    <span className="text-[10px] font-black bg-black text-amber-300 px-2 py-0.5 rounded-full uppercase">
                      MULTIPLAYER
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 normal-case tracking-normal">
                    {t('koth.onlineSub', 'Challenge live players • Create room or invite friends')}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-black stroke-[3] group-hover:translate-x-1 transition-transform shrink-0" />
            </motion.button>

            {/* 2. OFFLINE KNOCKOUT */}
            <motion.button
              whileHover={{ y: -2, scale: 1.015 }}
              whileTap={{ y: 3, scale: 0.98 }}
              onClick={() => onSelectMode('Offline')}
              className="w-full py-4 px-4 sm:px-5 rounded-[20px] font-black uppercase tracking-wider bg-gradient-to-r from-sky-400 to-blue-500 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] flex items-center justify-between cursor-pointer group outline-none text-left transition-transform"
            >
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-black/10 border border-black/20 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-black stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black text-black">
                      {t('common.offline', 'OFFLINE')}
                    </span>
                    <span className="text-[10px] font-black bg-black text-sky-200 px-2 py-0.5 rounded-full uppercase">
                      4 PLAYERS
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-900 normal-case tracking-normal">
                    {t('koth.offlineSub', '4 Contenders • 3 Rounds Knockout vs Bots')}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-black stroke-[3] group-hover:translate-x-1 transition-transform shrink-0" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
