import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';
import {
  BALL_TEXTURE_ITEMS,
  PITCH_PATTERN_ITEMS,
  BallTextureItem,
  PitchPatternItem,
} from '../data/storeItems';
import CoinIcon from './CoinIcon';
import StoreDropdown, { StoreTab } from './StoreDropdown';
import Ball3DThumbnail from './Ball3DThumbnail';
import PitchPatternThumbnail from './PitchPatternThumbnail';
import crazyGamesSDK from '../utils/crazyGamesSDK';

interface StorePageProps {
  coins: number;
  unlockedBallIds: string[];
  equippedBallId: string;
  unlockedPitchIds: string[];
  equippedPitchId: string;
  onBack: () => void;
  onUnlockBall: (id: string, price: number) => void;
  onEquipBall: (id: string) => void;
  onUnlockPitch: (id: string, price: number) => void;
  onEquipPitch: (id: string) => void;
  onAddCoins?: (amount: number) => void;
}

export default function StorePage({
  coins,
  unlockedBallIds,
  equippedBallId,
  unlockedPitchIds,
  equippedPitchId,
  onBack,
  onUnlockBall,
  onEquipBall,
  onUnlockPitch,
  onEquipPitch,
}: StorePageProps) {
  const [activeTab, setActiveTab] = useState<StoreTab>('balls');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleBuyOrEquipBall = (ball: BallTextureItem) => {
    const isUnlocked = unlockedBallIds.includes(ball.id);
    if (isUnlocked) {
      onEquipBall(ball.id);
      showToast(`EQUIPPED: ${ball.name.toUpperCase()}`);
    } else {
      if (coins >= ball.price) {
        onUnlockBall(ball.id, ball.price);
        onEquipBall(ball.id);
        crazyGamesSDK.happytime();
        showToast(`UNLOCKED & EQUIPPED: ${ball.name.toUpperCase()}`);
      } else {
        showToast(`NOT ENOUGH COINS! NEED ${ball.price - coins} MORE`);
      }
    }
  };

  const handleBuyOrEquipPitch = (pitch: PitchPatternItem) => {
    const isUnlocked = unlockedPitchIds.includes(pitch.id);
    if (isUnlocked) {
      onEquipPitch(pitch.id);
      showToast(`EQUIPPED: ${pitch.name.toUpperCase()}`);
    } else {
      if (coins >= pitch.price) {
        onUnlockPitch(pitch.id, pitch.price);
        onEquipPitch(pitch.id);
        crazyGamesSDK.happytime();
        showToast(`UNLOCKED & EQUIPPED: ${pitch.name.toUpperCase()}`);
      } else {
        showToast(`NOT ENOUGH COINS! NEED ${pitch.price - coins} MORE`);
      }
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 text-slate-900 select-none font-sans z-20 touch-pan-y overscroll-contain">
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 pb-36 min-h-full flex flex-col relative">
        {/* Top Bar: Back Button, Header, and Controls (Custom Dropdown + Coins) */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 mb-6 sm:mb-8">
          {/* Left: Back Button */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95, y: 2 }}
              onClick={onBack}
              className="bg-white border-[3.5px] border-black shadow-[0_5px_0_0_#000] px-4 sm:px-6 py-2 sm:py-2.5 rounded-[18px] font-black uppercase text-sm sm:text-base flex items-center gap-2 cursor-pointer outline-none select-none"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              <span>BACK</span>
            </motion.button>

            {/* On mobile: Store Title inline */}
            <div className="md:hidden text-right">
              <h1 className="text-2xl font-black uppercase tracking-wider text-amber-300 drop-shadow-[0_2px_0_#78350f]">
                STORE
              </h1>
            </div>
          </div>

          {/* Center: Store Title (Desktop/Tablet) */}
          <div className="hidden md:block text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-amber-500 drop-shadow-[0_4px_0_#78350f] [text-shadow:0_1px_0_#fef08a,0_2px_0_#f59e0b,0_3px_0_#d97706,0_4px_0_#b45309,0_5px_0_#78350f,0_6px_12px_rgba(0,0,0,0.6)]">
              STORE
            </h1>
            <p className="text-xs sm:text-sm font-black text-amber-200 uppercase tracking-widest drop-shadow-[0_2px_0_#000]">
              3D BALL TEXTURES &amp; PITCH PATTERNS
            </p>
          </div>

          {/* Right / Controls: Custom Drop-down Store Switcher + Coins Display */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 w-full md:w-auto justify-center md:justify-end">
            {/* Custom arcade-styled Drop-down switcher */}
            <StoreDropdown
              value={activeTab}
              onChange={(tab) => setActiveTab(tab)}
              ballsCount={BALL_TEXTURE_ITEMS.length}
              pitchesCount={PITCH_PATTERN_ITEMS.length}
            />

            {/* Coins Wallet Badge */}
            <div className="bg-white border-[3.5px] border-black shadow-[0_5px_0_0_#000] rounded-[18px] sm:rounded-full px-3.5 sm:px-5 py-2 flex items-center gap-2 sm:gap-2.5 shrink-0 select-none">
              <CoinIcon className="w-6 h-6 sm:w-8 sm:h-8" />
              <span className="text-sm sm:text-xl font-black text-black tracking-wider">
                {coins.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="w-full max-w-6xl mx-auto flex-1 pb-12">
          <AnimatePresence mode="wait">
            {activeTab === 'balls' ? (
              <motion.div
                key="balls-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6"
              >
                {BALL_TEXTURE_ITEMS.map((ball) => {
                  const isUnlocked = unlockedBallIds.includes(ball.id);
                  const isEquipped = equippedBallId === ball.id;
                  const canAfford = coins >= ball.price;

                  return (
                    <div
                      key={ball.id}
                      className={`bg-white border-[3px] sm:border-[3.5px] border-black rounded-[18px] sm:rounded-[24px] p-3 sm:p-5 shadow-[0_5px_0_0_#000] sm:shadow-[0_7px_0_0_#000] flex flex-col justify-between relative transition-all ${
                        isEquipped ? 'ring-3 sm:ring-4 ring-yellow-400 ring-offset-1 sm:ring-offset-2' : ''
                      }`}
                    >
                      {/* Top Status: Only show ACTIVE badge when equipped */}
                      <div className="flex items-center justify-end mb-1 sm:mb-2 min-h-[22px] sm:min-h-[26px]">
                        {isEquipped && (
                          <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border-[1.5px] sm:border-[2px] border-black bg-emerald-400 text-black flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            ACTIVE
                          </span>
                        )}
                      </div>

                      {/* 3D Captured Ball Sphere Visual Preview */}
                      <Ball3DThumbnail ball={ball} isEquipped={isEquipped} />

                      {/* Ball Info */}
                      <div className="mb-2.5 sm:mb-3.5 text-center">
                        <h3 className="text-xs sm:text-base font-black text-black uppercase tracking-wide leading-tight line-clamp-1">
                          {ball.name}
                        </h3>
                      </div>

                      {/* Action Button: Equip vs Buy */}
                      <div>
                        {isEquipped ? (
                          <button
                            disabled
                            className="w-full py-1.5 sm:py-2.5 rounded-[12px] sm:rounded-[16px] font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wider bg-slate-200 text-slate-700 border-[2px] sm:border-[2.5px] border-black cursor-default"
                          >
                            EQUIPPED
                          </button>
                        ) : isUnlocked ? (
                          <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98, y: 2 }}
                            onClick={() => handleBuyOrEquipBall(ball)}
                            className="w-full py-1.5 sm:py-2.5 rounded-[12px] sm:rounded-[16px] font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wider bg-emerald-400 text-black border-[2px] sm:border-[2.5px] border-black shadow-[0_3px_0_0_#000] sm:shadow-[0_4px_0_0_#000] cursor-pointer"
                          >
                            EQUIP
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98, y: 2 }}
                            onClick={() => handleBuyOrEquipBall(ball)}
                            className={`w-full py-1.5 sm:py-2.5 rounded-[12px] sm:rounded-[16px] font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wider border-[2px] sm:border-[2.5px] border-black shadow-[0_3px_0_0_#000] sm:shadow-[0_4px_0_0_#000] flex items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
                              canAfford
                                ? 'bg-amber-400 text-black'
                                : 'bg-rose-300 text-black opacity-80'
                            }`}
                          >
                            <span>UNLOCK</span>
                            <span className="px-2 py-0.5 rounded-full bg-black text-white text-[9px] sm:text-[11px] font-black flex items-center gap-1">
                              <CoinIcon className="w-3.5 h-3.5" />
                              <span>{ball.price}</span>
                            </span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="pitches-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6"
              >
                {PITCH_PATTERN_ITEMS.map((pitch) => {
                  const isUnlocked = unlockedPitchIds.includes(pitch.id);
                  const isEquipped = equippedPitchId === pitch.id;
                  const canAfford = coins >= pitch.price;

                  return (
                    <div
                      key={pitch.id}
                      className={`bg-white border-[3px] sm:border-[3.5px] border-black rounded-[18px] sm:rounded-[24px] p-3 sm:p-5 shadow-[0_5px_0_0_#000] sm:shadow-[0_7px_0_0_#000] flex flex-col justify-between relative transition-all ${
                        isEquipped ? 'ring-3 sm:ring-4 ring-emerald-400 ring-offset-1 sm:ring-offset-2' : ''
                      }`}
                    >
                      {/* Top Status: Only show ACTIVE badge when equipped */}
                      <div className="flex items-center justify-end mb-1 sm:mb-2 min-h-[22px] sm:min-h-[26px]">
                        {isEquipped && (
                          <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border-[1.5px] sm:border-[2px] border-black bg-emerald-400 text-black flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            ACTIVE
                          </span>
                        )}
                      </div>

                      {/* Pitch Pattern Visual Preview */}
                      <PitchPatternThumbnail pitch={pitch} isEquipped={isEquipped} />

                      {/* Pitch Info */}
                      <div className="mb-2.5 sm:mb-3.5 text-center">
                        <h3 className="text-xs sm:text-base font-black text-black uppercase tracking-wide leading-tight line-clamp-1">
                          {pitch.name}
                        </h3>
                      </div>

                      {/* Action Button: Equip vs Buy */}
                      <div>
                        {isEquipped ? (
                          <button
                            disabled
                            className="w-full py-1.5 sm:py-2.5 rounded-[12px] sm:rounded-[16px] font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wider bg-slate-200 text-slate-700 border-[2px] sm:border-[2.5px] border-black cursor-default"
                          >
                            EQUIPPED
                          </button>
                        ) : isUnlocked ? (
                          <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98, y: 2 }}
                            onClick={() => handleBuyOrEquipPitch(pitch)}
                            className="w-full py-1.5 sm:py-2.5 rounded-[12px] sm:rounded-[16px] font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wider bg-emerald-400 text-black border-[2px] sm:border-[2.5px] border-black shadow-[0_3px_0_0_#000] sm:shadow-[0_4px_0_0_#000] cursor-pointer"
                          >
                            EQUIP
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98, y: 2 }}
                            onClick={() => handleBuyOrEquipPitch(pitch)}
                            className={`w-full py-1.5 sm:py-2.5 rounded-[12px] sm:rounded-[16px] font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wider border-[2px] sm:border-[2.5px] border-black shadow-[0_3px_0_0_#000] sm:shadow-[0_4px_0_0_#000] flex items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
                              canAfford
                                ? 'bg-amber-400 text-black'
                                : 'bg-rose-300 text-black opacity-80'
                            }`}
                          >
                            <span>UNLOCK</span>
                            <span className="px-2 py-0.5 rounded-full bg-black text-white text-[9px] sm:text-[11px] font-black flex items-center gap-1">
                              <CoinIcon className="w-3.5 h-3.5" />
                              <span>{pitch.price}</span>
                            </span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Action Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-black text-white border-[3px] border-yellow-300 shadow-[0_8px_0_0_rgba(0,0,0,0.8)] px-6 py-3 rounded-full font-black text-sm uppercase tracking-wider"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
