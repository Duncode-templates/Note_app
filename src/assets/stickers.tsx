import React from 'react';

// Crisp, self-contained SVG Data URIs for sticker outcomes
const createSvgDataUri = (svgContent: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;

const svgGoal = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="46" fill="#10B981" stroke="#000" stroke-width="4"/>
  <circle cx="50" cy="50" r="38" fill="#34D399"/>
  <polygon points="50,18 63,38 85,38 67,52 74,74 50,60 26,74 33,52 15,38 37,38" fill="#FDE047" stroke="#000" stroke-width="2"/>
  <circle cx="50" cy="50" r="16" fill="#FFF" stroke="#000" stroke-width="3"/>
  <polygon points="50,38 58,45 55,54 45,54 42,45" fill="#000"/>
</svg>
`);

const svgSave = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="46" fill="#38BDF8" stroke="#000" stroke-width="4"/>
  <circle cx="50" cy="50" r="38" fill="#7DD3FC"/>
  <rect x="25" y="32" width="50" height="36" rx="10" fill="#F97316" stroke="#000" stroke-width="3"/>
  <circle cx="40" cy="50" r="6" fill="#FFF"/>
  <circle cx="60" cy="50" r="6" fill="#FFF"/>
  <circle cx="40" cy="50" r="3" fill="#000"/>
  <circle cx="60" cy="50" r="3" fill="#000"/>
</svg>
`);

const svgWoodwork = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="46" fill="#F59E0B" stroke="#000" stroke-width="4"/>
  <circle cx="50" cy="50" r="38" fill="#FCD34D"/>
  <rect x="20" y="24" width="60" height="12" rx="4" fill="#E2E8F0" stroke="#000" stroke-width="3"/>
  <line x1="30" y1="36" x2="30" y2="76" stroke="#E2E8F0" stroke-width="8" stroke-linecap="round"/>
  <line x1="70" y1="36" x2="70" y2="76" stroke="#E2E8F0" stroke-width="8" stroke-linecap="round"/>
  <polygon points="50,30 55,42 67,42 57,50 61,62 50,54 39,62 43,50 33,42 45,42" fill="#EF4444" stroke="#000" stroke-width="2"/>
</svg>
`);

const svgWall = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="46" fill="#F97316" stroke="#000" stroke-width="4"/>
  <circle cx="50" cy="50" r="38" fill="#FB923C"/>
  <rect x="22" y="30" width="16" height="42" rx="4" fill="#3B82F6" stroke="#000" stroke-width="2.5"/>
  <circle cx="30" cy="24" r="7" fill="#FDE047" stroke="#000" stroke-width="2"/>
  <rect x="42" y="28" width="16" height="44" rx="4" fill="#EF4444" stroke="#000" stroke-width="2.5"/>
  <circle cx="50" cy="22" r="7" fill="#FDE047" stroke="#000" stroke-width="2"/>
  <rect x="62" y="30" width="16" height="42" rx="4" fill="#10B981" stroke="#000" stroke-width="2.5"/>
  <circle cx="70" cy="24" r="7" fill="#FDE047" stroke="#000" stroke-width="2"/>
</svg>
`);

const svgMiss = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="46" fill="#EF4444" stroke="#000" stroke-width="4"/>
  <circle cx="50" cy="50" r="38" fill="#F87171"/>
  <line x1="30" y1="30" x2="70" y2="70" stroke="#FFF" stroke-width="8" stroke-linecap="round"/>
  <line x1="70" y1="30" x2="30" y2="70" stroke="#FFF" stroke-width="8" stroke-linecap="round"/>
</svg>
`);

export const STICKERS = {
  goal: svgGoal,
  save: svgSave,
  woodwork: svgWoodwork,
  wall: svgWall,
  miss: svgMiss,
} as const;

export interface OutcomeStickerData {
  img: string;
  tag: string;
  tagBg: string;
  bannerBg: string;
  tilt: string;
  type: 'goal' | 'save' | 'woodwork' | 'wall' | 'miss';
}

export function getOutcomeSticker(outcome: string): OutcomeStickerData {
  if (outcome === 'GOAL' || outcome === 'TEAMMATE STRIKE ON GOAL!' || outcome === 'AI TEAMMATE SHOT ON GOAL!') {
    return {
      img: STICKERS.goal,
      tag: 'GOLAZO!',
      tagBg: 'bg-amber-300 text-black',
      bannerBg: 'bg-emerald-400 text-black',
      tilt: '-rotate-3',
      type: 'goal',
    };
  }

  if (outcome === 'SAVED BY GOALKEEPER') {
    return {
      img: STICKERS.save,
      tag: 'DENIED!',
      tagBg: 'bg-cyan-300 text-black',
      bannerBg: 'bg-sky-400 text-black',
      tilt: 'rotate-3',
      type: 'save',
    };
  }

  if (outcome === 'HIT THE WOODWORK') {
    return {
      img: STICKERS.woodwork,
      tag: 'CLANG!',
      tagBg: 'bg-rose-500 text-white',
      bannerBg: 'bg-amber-400 text-black',
      tilt: '-rotate-3',
      type: 'woodwork',
    };
  }

  if (outcome === 'BLOCKED BY WALL' || outcome === 'CLEARED BY DEFENDER') {
    return {
      img: STICKERS.wall,
      tag: 'BLOCKED!',
      tagBg: 'bg-yellow-400 text-black',
      bannerBg: 'bg-orange-500 text-white',
      tilt: 'rotate-3',
      type: 'wall',
    };
  }

  // Default: Off Target / Missed
  return {
    img: STICKERS.miss,
    tag: outcome === 'OVER THE CROSSBAR' ? 'SKY HIGH!' : outcome === 'SHOT WIDE' ? 'WIDE!' : 'MISSED!',
    tagBg: 'bg-amber-300 text-black',
    bannerBg: 'bg-rose-500 text-white',
    tilt: 'rotate-3',
    type: 'miss',
  };
}

export function StickerGraphic({ type, className = 'w-16 h-16' }: { type: 'goal' | 'save' | 'woodwork' | 'wall' | 'miss'; className?: string }) {
  const imgSrc = STICKERS[type];
  return (
    <img
      src={imgSrc}
      alt={`${type} sticker`}
      className={`w-full h-full object-cover rounded-full ${className}`}
      referrerPolicy="no-referrer"
    />
  );
}
