import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, CircleDot, Layers } from 'lucide-react';

export type StoreTab = 'balls' | 'pitches';

interface StoreDropdownProps {
  value: StoreTab;
  onChange: (tab: StoreTab) => void;
  ballsCount?: number;
  pitchesCount?: number;
}

export default function StoreDropdown({
  value,
  onChange,
  ballsCount = 50,
  pitchesCount = 50,
}: StoreDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const options: { id: StoreTab; label: string; iconType: 'ball' | 'pitch'; count: number; desc: string }[] = [
    {
      id: 'balls',
      label: 'BALL STORE',
      iconType: 'ball',
      count: ballsCount,
      desc: '3D Textures & Pro Models',
    },
    {
      id: 'pitches',
      label: 'PITCH STORE',
      iconType: 'pitch',
      count: pitchesCount,
      desc: 'Stadium Grass & Turf Cuts',
    },
  ];

  const currentOption = options.find((opt) => opt.id === value) || options[0];

  const handleSelect = (tab: StoreTab) => {
    onChange(tab);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1 sm:flex-initial select-none z-30">
      {/* Custom Dropdown Trigger Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98, y: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto bg-white border-[3.5px] border-black shadow-[0_5px_0_0_#000] rounded-[18px] px-3.5 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-3 cursor-pointer outline-none transition-colors hover:bg-amber-50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-400 border-[1.5px] border-black flex items-center justify-center">
            {currentOption.iconType === 'ball' ? (
              <CircleDot className="w-3.5 h-3.5 text-black stroke-[3]" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-black stroke-[3]" />
            )}
          </div>
          <span className="font-black text-xs sm:text-sm md:text-base uppercase tracking-wider text-black">
            {currentOption.label}
          </span>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center ml-1"
        >
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-black stroke-[3.5]" />
        </motion.div>
      </motion.button>

      {/* Animated Dropdown Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-64 sm:w-72 bg-white border-[3.5px] border-black shadow-[0_8px_0_0_#000] rounded-[20px] p-2 flex flex-col gap-1.5 z-50 overflow-hidden"
            role="listbox"
          >
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 mb-1 flex items-center justify-between">
              <span>SELECT CATEGORY</span>
              <span className="text-amber-500 font-black">STORE</span>
            </div>

            {options.map((opt) => {
              const isSelected = opt.id === value;
              return (
                <motion.button
                  key={opt.id}
                  type="button"
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full p-2.5 sm:p-3 rounded-[14px] border-[2px] flex items-center justify-between text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-300 border-black shadow-[0_3px_0_0_#000] text-black'
                      : 'bg-slate-50 hover:bg-amber-100/70 border-slate-200 text-slate-800'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border-[2px] border-black/80 shadow-xs flex items-center justify-center">
                      {opt.iconType === 'ball' ? (
                        <CircleDot className="w-5 h-5 text-black stroke-[2.5]" />
                      ) : (
                        <Layers className="w-5 h-5 text-emerald-700 stroke-[2.5]" />
                      )}
                    </div>
                    <div>
                      <div className="font-black text-xs sm:text-sm uppercase tracking-wider text-black flex items-center gap-1.5">
                        <span>{opt.label}</span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-slate-600">
                        {opt.desc}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full border-[1.5px] ${
                        isSelected
                          ? 'bg-black text-white border-black'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      {opt.count}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-[1.5px] border-black">
                        <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
