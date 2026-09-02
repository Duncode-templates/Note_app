import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Globe, Check, Search, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES, SupportedLanguage } from '../utils/i18n';
import { crazyGamesSDK } from '../utils/crazyGamesSDK';

interface LanguageSelectionPageProps {
  onBack: () => void;
}

type RegionFilter = 'all' | 'popular' | 'europe' | 'americas' | 'asia_me';

interface ExtendedLanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  region: 'europe' | 'americas' | 'asia_me';
  popular?: boolean;
  samplePhrase: string;
  speakersInfo: string;
}

const EXTENDED_LANGUAGES: ExtendedLanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    region: 'europe',
    popular: true,
    samplePhrase: 'FREE KICK LEGENDS',
    speakersInfo: 'Global / International',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    region: 'europe',
    popular: true,
    samplePhrase: 'TIRO LIBRE DE LEYENDA',
    speakersInfo: 'España, México, Argentina & LatAm',
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    region: 'americas',
    popular: true,
    samplePhrase: 'LENDAS DO TIRO LIVRE',
    speakersInfo: 'Brasil & Portugal',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    region: 'europe',
    popular: true,
    samplePhrase: 'COUP FRANC DE LÉGENDE',
    speakersInfo: 'France, Belgique, Canada & Afrique',
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    region: 'europe',
    popular: true,
    samplePhrase: 'FREISTOSS-LEGENDEN',
    speakersInfo: 'Deutschland, Österreich & Schweiz',
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    region: 'europe',
    popular: true,
    samplePhrase: 'LEGGENDE DEI CALCI DI PUNIZIONE',
    speakersInfo: 'Italia & Svizzera',
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    region: 'europe',
    popular: true,
    samplePhrase: 'FRİKİK EFSANELERİ',
    speakersInfo: 'Türkiye & Kıbrıs',
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    region: 'europe',
    popular: true,
    samplePhrase: 'ЛЕГЕНДЫ ШТРАФНЫХ',
    speakersInfo: 'Россия, Казахстан, Беларусь',
  },
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    flag: '🇵🇱',
    region: 'europe',
    popular: false,
    samplePhrase: 'LEGENDA RZUTÓW WOLNYCH',
    speakersInfo: 'Polska',
  },
  {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    region: 'europe',
    popular: false,
    samplePhrase: 'VRIJE TRAP LEGENDES',
    speakersInfo: 'Nederland & België',
  },
  {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    region: 'asia_me',
    popular: false,
    samplePhrase: 'LEGENDA TENDANGAN BEBAS',
    speakersInfo: 'Indonesia',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    region: 'asia_me',
    popular: true,
    samplePhrase: 'フリーキックの伝説',
    speakersInfo: '日本 (Japan)',
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    region: 'asia_me',
    popular: true,
    samplePhrase: '프리킥의 전설',
    speakersInfo: '대한민국 (South Korea)',
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    region: 'asia_me',
    popular: false,
    samplePhrase: 'HUYỀN THOẠI ĐÁ PHẠT',
    speakersInfo: 'Việt Nam',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    region: 'asia_me',
    popular: true,
    samplePhrase: 'أساطير الركلات الحرة',
    speakersInfo: 'الشرق الأوسط وشمال أفريقيا (MENA)',
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '简体中文',
    flag: '🇨🇳',
    region: 'asia_me',
    popular: true,
    samplePhrase: '任意球传奇',
    speakersInfo: '中国大陆、新加坡及全球华人',
  },
];

export default function LanguageSelectionPage({ onBack }: LanguageSelectionPageProps) {
  const { language, setLanguage, t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  const handleSelectLanguage = (code: SupportedLanguage, nativeName: string) => {
    setLanguage(code);
    crazyGamesSDK.happytime();
    showToast(`${t('nav.language', 'Language')} updated to ${nativeName}!`);
  };

  const handleAutoDetect = () => {
    const detectedLang = crazyGamesSDK.getLanguage();
    const match = SUPPORTED_LANGUAGES.find((l) => l.code === detectedLang);
    if (match) {
      setLanguage(match.code as SupportedLanguage);
      showToast(`Auto-detected: ${match.nativeName} (${match.name})`);
    } else {
      setLanguage('en');
      showToast(`Auto-detected: English (Default)`);
    }
  };

  // Filter languages based on search query and region filter
  const filteredLanguages = useMemo(() => {
    return EXTENDED_LANGUAGES.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.nativeName.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.speakersInfo.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (regionFilter === 'popular') return !!item.popular;
      if (regionFilter === 'europe') return item.region === 'europe';
      if (regionFilter === 'americas') return item.region === 'americas';
      if (regionFilter === 'asia_me') return item.region === 'asia_me';

      return true;
    });
  }, [searchQuery, regionFilter]);

  const activeLangData = EXTENDED_LANGUAGES.find((l) => l.code === language) || EXTENDED_LANGUAGES[0];

  return (
    <div className="fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 text-slate-900 select-none font-sans z-20 touch-pan-y overscroll-contain">
      <div className="w-full max-w-6xl mx-auto p-3 sm:p-5 md:p-8 pb-32 min-h-full flex flex-col relative">
        
        {/* Top Navigation Bar */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 mb-5 sm:mb-7">
          
          {/* Back Button */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95, y: 2 }}
              onClick={onBack}
              className="bg-white hover:bg-slate-100 border-[3.5px] border-black shadow-[0_5px_0_0_#000] px-4 sm:px-6 py-2 sm:py-2.5 rounded-[18px] font-black uppercase text-sm sm:text-base flex items-center gap-2 cursor-pointer outline-none select-none transition-colors"
            >
              <ArrowLeft className="w-5 h-5 stroke-[3] text-black" />
              <span className="text-black font-black">{t('common.back', 'BACK')}</span>
            </motion.button>
          </div>

          {/* Main Title Center */}
          <div className="text-center flex-1">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-amber-500 drop-shadow-[0_4px_0_#78350f] [text-shadow:0_1px_0_#fef08a,0_2px_0_#f59e0b,0_3px_0_#d97706,0_4px_0_#b45309,0_5px_0_#78350f,0_8px_16px_rgba(0,0,0,0.6)]">
              {t('lang.title', 'SELECT LANGUAGE')}
            </h1>
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-sky-100 drop-shadow-sm mt-1">
              {t('lang.subtitle', 'CrazyGames Global Localization • 16 Languages')}
            </p>
          </div>

          {/* Right Active Language Indicator Pill */}
          <div className="flex items-center gap-2">
            <div className="bg-black/80 backdrop-blur-md border-[3px] border-black shadow-[0_5px_0_0_#000] rounded-full px-4 py-2 flex items-center gap-2.5 text-white">
              <span className="text-xl leading-none">{activeLangData.flag}</span>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest leading-none">
                  {t('common.active', 'ACTIVE')}
                </span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white leading-tight">
                  {activeLangData.nativeName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Current Language Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[22px] p-4 sm:p-5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border-[3px] border-black flex items-center justify-center text-3xl sm:text-4xl shadow-md shrink-0">
              {activeLangData.flag}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-black text-amber-300 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {t('lang.currentlyActive', 'CURRENTLY ACTIVE')}
                </span>
                <span className="text-xs font-black uppercase text-amber-950">
                  {activeLangData.name} ({activeLangData.code.toUpperCase()})
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-black uppercase tracking-wide mt-0.5">
                {activeLangData.nativeName}
              </h2>
              <p className="text-xs sm:text-sm font-extrabold text-amber-950 italic">
                "{t('game.title', activeLangData.samplePhrase)}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAutoDetect}
              className="bg-black hover:bg-neutral-800 text-white border-[2.5px] border-black shadow-[0_3px_0_0_#000] px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              title="Detect language automatically from CrazyGames platform or browser"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('lang.autoDetect', 'AUTO-DETECT')}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Search & Region Filter Bar */}
        <div className="w-full bg-white/95 backdrop-blur-md border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[22px] p-3.5 sm:p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Input Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('lang.searchPlaceholder', 'Search language (e.g. Spanish, 日本語)...')}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-[2px] border-black rounded-xl text-xs sm:text-sm font-black text-black placeholder-slate-500 uppercase tracking-wider outline-none focus:bg-white focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-black"
              >
                ✕
              </button>
            )}
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {(
              [
                { id: 'all', label: t('lang.tabAll', 'All (16)') },
                { id: 'popular', label: t('lang.tabPopular', '⭐ Popular') },
                { id: 'europe', label: t('lang.tabEurope', '🇪🇺 Europe') },
                { id: 'americas', label: t('lang.tabAmericas', '🌎 Americas') },
                { id: 'asia_me', label: t('lang.tabAsiaMe', '🌏 Asia & ME') },
              ] as const
            ).map((tab) => {
              const isActive = regionFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRegionFilter(tab.id as RegionFilter)}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider border-[2px] border-black transition-all cursor-pointer whitespace-nowrap select-none ${
                    isActive
                      ? 'bg-amber-400 text-black shadow-[0_3px_0_0_#000] -translate-y-0.5'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 flex-1">
          {filteredLanguages.map((item) => {
            const isSelected = language === item.code;
            return (
              <motion.button
                key={item.code}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelectLanguage(item.code, item.nativeName)}
                className={`relative flex flex-col justify-between p-4 rounded-[20px] border-[3.5px] border-black transition-all duration-150 text-left cursor-pointer outline-none select-none ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-400 shadow-[0_6px_0_0_#000] ring-4 ring-amber-400/50'
                    : 'bg-white hover:bg-slate-50 shadow-[0_5px_0_0_#000]'
                }`}
              >
                {/* Top Row: Flag & Selection Badge */}
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl leading-none drop-shadow-sm">{item.flag}</span>
                    <span className="text-[11px] font-black uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded-md text-black">
                      {item.code.toUpperCase()}
                    </span>
                  </div>

                  {isSelected ? (
                    <div className="flex items-center gap-1 bg-black text-amber-300 px-2.5 py-1 rounded-full border-[1.5px] border-black font-black text-[10px] uppercase tracking-wider shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3] text-amber-300" />
                      <span>{t('common.active', 'ACTIVE')}</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-[2px] border-slate-300 bg-slate-100 flex items-center justify-center group-hover:border-black" />
                  )}
                </div>

                {/* Center Names */}
                <div className="my-1">
                  <h3 className="text-lg sm:text-xl font-black text-black tracking-tight leading-tight">
                    {item.nativeName}
                  </h3>
                  <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mt-0.5">
                    {item.name}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1 line-clamp-1">
                    {item.speakersInfo}
                  </div>
                </div>

                {/* Bottom Sample Preview Pill */}
                <div className="mt-3 pt-2.5 border-t border-black/10 flex items-center justify-between w-full">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 truncate max-w-[80%]">
                    {item.samplePhrase}
                  </span>
                  <span className="text-xs font-black text-black">
                    {isSelected ? '✓' : '→'}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Empty Search State */}
        {filteredLanguages.length === 0 && (
          <div className="w-full py-16 bg-white/90 backdrop-blur-md border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[22px] text-center p-6 flex flex-col items-center justify-center">
            <Globe className="w-12 h-12 text-slate-400 mb-3" />
            <h3 className="text-xl font-black text-black uppercase tracking-wider">
              {t('lang.noMatches', 'No matching languages found')}
            </h3>
            <p className="text-xs font-bold text-slate-600 mt-1">
              {t('lang.noMatchesDesc', 'Try searching with another keyword or reset the filter.')}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setRegionFilter('all');
              }}
              className="mt-4 bg-amber-400 hover:bg-amber-300 text-black border-[2.5px] border-black px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer"
            >
              {t('lang.resetFilters', 'Reset Filters')}
            </button>
          </div>
        )}

        {/* Bottom CrazyGames SDK Auto-Sync Footer Notice */}
        <div className="mt-8 bg-black/80 backdrop-blur-md border-[3.5px] border-black shadow-[0_6px_0_0_#000] rounded-[20px] p-4 sm:p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black text-xl shrink-0">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-400 uppercase tracking-widest">
                {t('lang.sdkSyncTitle', 'CrazyGames SDK Cloud Sync')}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-300 font-bold">
                {t('lang.sdkSyncDesc', 'Your preferred language is instantly stored and remembered across all gameplay sessions.')}
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95, y: 1 }}
            onClick={onBack}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 text-black border-[3px] border-black shadow-[0_4px_0_0_#000] px-6 py-3 rounded-[16px] font-black text-sm uppercase tracking-wider cursor-pointer transition-colors shrink-0"
          >
            {t('common.done', 'DONE & RETURN')} →
          </motion.button>
        </div>

        {/* Toast Notification Notification Popup */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-amber-300 border-[3px] border-amber-400 shadow-[0_6px_0_0_#000] px-6 py-3 rounded-full font-black text-sm uppercase tracking-wider flex items-center gap-2"
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
