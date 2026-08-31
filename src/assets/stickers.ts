const stickerGoal = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <radialGradient id="bgG" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="60%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </radialGradient>
  </defs>
  <rect width="300" height="300" rx="40" fill="url(#bgG)" stroke="#ffffff" stroke-width="8"/>
  <circle cx="150" cy="120" r="55" fill="#ffffff" stroke="#0f172a" stroke-width="5"/>
  <polygon points="150,85 175,103 165,133 135,133 125,103" fill="#0f172a"/>
  <text x="150" y="245" font-size="46" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle" fill="#ffffff" stroke="#7f1d1d" stroke-width="4">GOAL!</text>
</svg>
`)}`;

const stickerSave = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <radialGradient id="bgS" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a5f3fc"/>
      <stop offset="60%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#1e40af"/>
    </radialGradient>
  </defs>
  <rect width="300" height="300" rx="40" fill="url(#bgS)" stroke="#ffffff" stroke-width="8"/>
  <path d="M110 80 Q150 50 190 80 L190 150 Q150 210 110 150 Z" fill="#ffffff" stroke="#0f172a" stroke-width="6"/>
  <text x="150" y="250" font-size="44" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle" fill="#ffffff" stroke="#1e3a8a" stroke-width="4">SAVED!</text>
</svg>
`)}`;

const stickerWoodwork = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <radialGradient id="bgW" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="60%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </radialGradient>
  </defs>
  <rect width="300" height="300" rx="40" fill="url(#bgW)" stroke="#ffffff" stroke-width="8"/>
  <rect x="70" y="70" width="160" height="24" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>
  <rect x="70" y="70" width="24" height="110" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>
  <text x="150" y="245" font-size="42" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle" fill="#ffffff" stroke="#7c2d12" stroke-width="4">POST!</text>
</svg>
`)}`;

const stickerWall = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <radialGradient id="bgWall" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="60%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </radialGradient>
  </defs>
  <rect width="300" height="300" rx="40" fill="url(#bgWall)" stroke="#ffffff" stroke-width="8"/>
  <rect x="70" y="90" width="45" height="85" rx="8" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>
  <rect x="127" y="80" width="45" height="95" rx="8" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>
  <rect x="185" y="90" width="45" height="85" rx="8" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>
  <text x="150" y="245" font-size="40" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle" fill="#ffffff" stroke="#854d0e" stroke-width="4">WALL!</text>
</svg>
`)}`;

const stickerMiss = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <radialGradient id="bgM" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fca5a5"/>
      <stop offset="60%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </radialGradient>
  </defs>
  <rect width="300" height="300" rx="40" fill="url(#bgM)" stroke="#ffffff" stroke-width="8"/>
  <path d="M80 80 L220 200 M220 80 L80 200" stroke="#ffffff" stroke-width="24" stroke-linecap="round"/>
  <text x="150" y="260" font-size="42" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle" fill="#ffffff" stroke="#7f1d1d" stroke-width="4">MISSED!</text>
</svg>
`)}`;

export const STICKERS = {
  goal: stickerGoal,
  save: stickerSave,
  woodwork: stickerWoodwork,
  wall: stickerWall,
  miss: stickerMiss,
} as const;

export interface OutcomeStickerData {
  img: string;
  tag: string;
  tagBg: string;
  bannerBg: string;
  tilt: string;
}

export function getOutcomeSticker(outcome: string): OutcomeStickerData {
  if (outcome === 'GOAL' || outcome === 'TEAMMATE STRIKE ON GOAL!' || outcome === 'AI TEAMMATE SHOT ON GOAL!') {
    return {
      img: STICKERS.goal,
      tag: 'GOLAZO!',
      tagBg: 'bg-amber-300 text-black',
      bannerBg: 'bg-emerald-400 text-black',
      tilt: '-rotate-3',
    };
  }

  if (outcome === 'SAVED BY GOALKEEPER') {
    return {
      img: STICKERS.save,
      tag: 'DENIED!',
      tagBg: 'bg-cyan-300 text-black',
      bannerBg: 'bg-sky-400 text-black',
      tilt: 'rotate-3',
    };
  }

  if (outcome === 'HIT THE WOODWORK') {
    return {
      img: STICKERS.woodwork,
      tag: 'CLANG!',
      tagBg: 'bg-rose-500 text-white',
      bannerBg: 'bg-amber-400 text-black',
      tilt: '-rotate-3',
    };
  }

  if (outcome === 'BLOCKED BY WALL' || outcome === 'CLEARED BY DEFENDER') {
    return {
      img: STICKERS.wall,
      tag: 'BLOCKED!',
      tagBg: 'bg-yellow-400 text-black',
      bannerBg: 'bg-orange-500 text-white',
      tilt: 'rotate-3',
    };
  }

  // Default: Off Target / Missed
  return {
    img: STICKERS.miss,
    tag: outcome === 'OVER THE CROSSBAR' ? 'SKY HIGH!' : outcome === 'SHOT WIDE' ? 'WIDE!' : 'MISSED!',
    tagBg: 'bg-amber-300 text-black',
    bannerBg: 'bg-rose-500 text-white',
    tilt: 'rotate-3',
  };
}
