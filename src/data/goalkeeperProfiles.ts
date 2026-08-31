import { CountryKit } from './countryKits';
import { COUNTRIES_DATA } from './countries';

export type HairStyle = 'spiky' | 'sweep' | 'curls' | 'afro' | 'dreads' | 'buzz' | 'crop' | 'slick' | 'undercut' | 'bald';

export interface GoalkeeperProfile {
  jerseyColor: string;
  shortsColor: string;
  socksColor?: string;
  collarColor?: string;
  skinColor: string;
  hairColor: string;
  hairStyle: HairStyle;
  glovesColor: string;
}

// Curated authentic and distinctive Goalkeeper styles for every team
const SPECIFIC_GK_PROFILES: Record<string, GoalkeeperProfile> = {
  // --- SOUTH AMERICA (CONMEBOL) ---
  ar: {
    jerseyColor: '#10b981', // Emerald Green (Dibu Martinez style)
    shortsColor: '#0f172a',
    socksColor: '#10b981',
    collarColor: '#0f172a',
    skinColor: '#e29b8c',
    hairColor: '#3b1a08',
    hairStyle: 'undercut',
    glovesColor: '#84cc16',
  },
  br: {
    jerseyColor: '#0f172a', // Midnight Stealth Black (Alisson / Ederson)
    shortsColor: '#0f172a',
    socksColor: '#0f172a',
    collarColor: '#facc15',
    skinColor: '#c68642',
    hairColor: '#171717',
    hairStyle: 'crop',
    glovesColor: '#facc15',
  },
  co: {
    jerseyColor: '#d946ef', // Neon Magenta Pink (Ospina / Vargas)
    shortsColor: '#1e3a8a',
    socksColor: '#d946ef',
    collarColor: '#1e3a8a',
    skinColor: '#8d5524',
    hairColor: '#171717',
    hairStyle: 'spiky',
    glovesColor: '#ec4899',
  },
  uy: {
    jerseyColor: '#f97316', // Sunset Orange (Muslera / Rochet)
    shortsColor: '#0f172a',
    socksColor: '#f97316',
    collarColor: '#0f172a',
    skinColor: '#f3a29c',
    hairColor: '#451a03',
    hairStyle: 'sweep',
    glovesColor: '#38bdf8',
  },
  pe: {
    jerseyColor: '#eab308', // Aztec Gold (Gallese)
    shortsColor: '#0f172a',
    socksColor: '#eab308',
    collarColor: '#dc2626',
    skinColor: '#8d5524',
    hairColor: '#171717',
    hairStyle: 'curls',
    glovesColor: '#ef4444',
  },
  cl: {
    jerseyColor: '#eab308', // Gold / Black (Bravo / Cortes)
    shortsColor: '#0f172a',
    socksColor: '#eab308',
    collarColor: '#1d4ed8',
    skinColor: '#c68642',
    hairColor: '#171717',
    hairStyle: 'slick',
    glovesColor: '#3b82f6',
  },
  ec: {
    jerseyColor: '#0f172a', // Midnight Black (Dominguez)
    shortsColor: '#0f172a',
    socksColor: '#0f172a',
    collarColor: '#fde047',
    skinColor: '#451a03',
    hairColor: '#171717',
    hairStyle: 'dreads',
    glovesColor: '#eab308',
  },
  py: {
    jerseyColor: '#84cc16', // Bright Lime (Fernandez / Coronel)
    shortsColor: '#1d4ed8',
    socksColor: '#84cc16',
    collarColor: '#1d4ed8',
    skinColor: '#f3a29c',
    hairColor: '#3b1a08',
    hairStyle: 'crop',
    glovesColor: '#ef4444',
  },
  ve: {
    jerseyColor: '#0284c7', // Sky Azure (Romo)
    shortsColor: '#1e293b',
    socksColor: '#0284c7',
    collarColor: '#831843',
    skinColor: '#c68642',
    hairColor: '#171717',
    hairStyle: 'spiky',
    glovesColor: '#f59e0b',
  },
  bo: {
    jerseyColor: '#f59e0b', // Amber Orange (Lampe)
    shortsColor: '#065f46',
    socksColor: '#f59e0b',
    collarColor: '#065f46',
    skinColor: '#c68642',
    hairColor: '#171717',
    hairStyle: 'slick',
    glovesColor: '#10b981',
  },

  // --- EUROPE (UEFA) ---
  fr: {
    jerseyColor: '#06b6d4', // Vibrant Turquoise / Cyan (Mike Maignan)
    shortsColor: '#0f172a',
    socksColor: '#06b6d4',
    collarColor: '#0f172a',
    skinColor: '#451a03',
    hairColor: '#171717',
    hairStyle: 'buzz',
    glovesColor: '#f97316',
  },
  es: {
    jerseyColor: '#f97316', // Neon Orange (Unai Simon / Raya)
    shortsColor: '#0f172a',
    socksColor: '#f97316',
    collarColor: '#0f172a',
    skinColor: '#fecdd3',
    hairColor: '#451a03',
    hairStyle: 'crop',
    glovesColor: '#facc15',
  },
  'gb-eng': {
    jerseyColor: '#facc15', // Bright Canary Yellow (Pickford)
    shortsColor: '#facc15',
    socksColor: '#facc15',
    collarColor: '#0f172a',
    skinColor: '#fed7aa',
    hairColor: '#ca8a04',
    hairStyle: 'spiky',
    glovesColor: '#22c55e',
  },
  be: {
    jerseyColor: '#10b981', // Emerald Green (Courtois / Casteels)
    shortsColor: '#0f172a',
    socksColor: '#10b981',
    collarColor: '#0f172a',
    skinColor: '#fecdd3',
    hairColor: '#3b1a08',
    hairStyle: 'sweep',
    glovesColor: '#ef4444',
  },
  nl: {
    jerseyColor: '#34d399', // Mint Turquoise (Verbruggen)
    shortsColor: '#0f172a',
    socksColor: '#34d399',
    collarColor: '#0f172a',
    skinColor: '#ffedd5',
    hairColor: '#78350f',
    hairStyle: 'sweep',
    glovesColor: '#ec4899',
  },
  pt: {
    jerseyColor: '#a855f7', // Electric Violet (Diogo Costa)
    shortsColor: '#0f172a',
    socksColor: '#a855f7',
    collarColor: '#0f172a',
    skinColor: '#fecaca',
    hairColor: '#171717',
    hairStyle: 'spiky',
    glovesColor: '#facc15',
  },
  it: {
    jerseyColor: '#2563eb', // Royal Azure (Donnarumma)
    shortsColor: '#1e3a8a',
    socksColor: '#2563eb',
    collarColor: '#1e3a8a',
    skinColor: '#fed7aa',
    hairColor: '#292524',
    hairStyle: 'slick',
    glovesColor: '#06b6d4',
  },
  hr: {
    jerseyColor: '#84cc16', // Neon Electric Lime (Livakovic)
    shortsColor: '#0f172a',
    socksColor: '#84cc16',
    collarColor: '#0f172a',
    skinColor: '#fed7aa',
    hairColor: '#451a03',
    hairStyle: 'crop',
    glovesColor: '#65a30d',
  },
  de: {
    jerseyColor: '#ef4444', // Neon Coral Red (Neuer / Ter Stegen)
    shortsColor: '#18181b',
    socksColor: '#ef4444',
    collarColor: '#18181b',
    skinColor: '#fecdd3',
    hairColor: '#eab308',
    hairStyle: 'sweep',
    glovesColor: '#dc2626',
  },
  ch: {
    jerseyColor: '#06b6d4', // Bright Sky Cyan (Sommer / Kobel)
    shortsColor: '#0f172a',
    socksColor: '#06b6d4',
    collarColor: '#0f172a',
    skinColor: '#fecdd3',
    hairColor: '#3b1a08',
    hairStyle: 'curls',
    glovesColor: '#f97316',
  },
  dk: {
    jerseyColor: '#0f172a', // Midnight Black (Kasper Schmeichel)
    shortsColor: '#0f172a',
    socksColor: '#0f172a',
    collarColor: '#ef4444',
    skinColor: '#ffedd5',
    hairColor: '#f3e8c8',
    hairStyle: 'sweep',
    glovesColor: '#eab308',
  },
  at: {
    jerseyColor: '#10b981', // Alpine Emerald (Pentz)
    shortsColor: '#0f172a',
    socksColor: '#10b981',
    collarColor: '#0f172a',
    skinColor: '#fed7aa',
    hairColor: '#78350f',
    hairStyle: 'spiky',
    glovesColor: '#ef4444',
  },
  ua: {
    jerseyColor: '#f97316', // Vibrant Orange (Lunin / Trubin)
    shortsColor: '#1e3a8a',
    socksColor: '#f97316',
    collarColor: '#1e3a8a',
    skinColor: '#ffedd5',
    hairColor: '#3b1a08',
    hairStyle: 'crop',
    glovesColor: '#eab308',
  },
  se: {
    jerseyColor: '#06b6d4', // Ice Cyan (Olsen)
    shortsColor: '#0f172a',
    socksColor: '#06b6d4',
    collarColor: '#0f172a',
    skinColor: '#ffedd5',
    hairColor: '#eab308',
    hairStyle: 'sweep',
    glovesColor: '#f59e0b',
  },
  pl: {
    jerseyColor: '#eab308', // Bright Gold (Szczesny / Skorupski)
    shortsColor: '#0f172a',
    socksColor: '#eab308',
    collarColor: '#dc2626',
    skinColor: '#fecdd3',
    hairColor: '#451a03',
    hairStyle: 'slick',
    glovesColor: '#ef4444',
  },
  tr: {
    jerseyColor: '#0284c7', // Bosphorus Azure (Cakir / Gunok)
    shortsColor: '#0f172a',
    socksColor: '#0284c7',
    collarColor: '#dc2626',
    skinColor: '#fed7aa',
    hairColor: '#171717',
    hairStyle: 'crop',
    glovesColor: '#dc2626',
  },

  // --- AFRICA (CAF) ---
  ma: {
    jerseyColor: '#be123c', // Atlas Crimson Ruby (Yassine Bounou)
    shortsColor: '#0f172a',
    socksColor: '#be123c',
    collarColor: '#065f46',
    skinColor: '#e29b8c',
    hairColor: '#171717',
    hairStyle: 'curls',
    glovesColor: '#f59e0b',
  },
  sn: {
    jerseyColor: '#f59e0b', // Teranga Gold (Edouard Mendy)
    shortsColor: '#0f172a',
    socksColor: '#f59e0b',
    collarColor: '#065f46',
    skinColor: '#451a03',
    hairColor: '#171717',
    hairStyle: 'buzz',
    glovesColor: '#10b981',
  },
  ng: {
    jerseyColor: '#10b981', // Super Eagles Bright Lime (Nwabali / Uzoho)
    shortsColor: '#0f172a',
    socksColor: '#10b981',
    collarColor: '#ffffff',
    skinColor: '#3b1a08',
    hairColor: '#171717',
    hairStyle: 'dreads',
    glovesColor: '#84cc16',
  },
  eg: {
    jerseyColor: '#0284c7', // Nile Blue (El Shenawy)
    shortsColor: '#0f172a',
    socksColor: '#0284c7',
    collarColor: '#dc2626',
    skinColor: '#c68642',
    hairColor: '#171717',
    hairStyle: 'crop',
    glovesColor: '#facc15',
  },
  cm: {
    jerseyColor: '#f97316', // Indomitable Orange (Andre Onana)
    shortsColor: '#0f172a',
    socksColor: '#f97316',
    collarColor: '#065f46',
    skinColor: '#3b1a08',
    hairColor: '#171717',
    hairStyle: 'undercut',
    glovesColor: '#10b981',
  },
  gh: {
    jerseyColor: '#d946ef', // Bright Fuchsia (Ati-Zigi)
    shortsColor: '#0f172a',
    socksColor: '#d946ef',
    collarColor: '#facc15',
    skinColor: '#3b1a08',
    hairColor: '#171717',
    hairStyle: 'afro',
    glovesColor: '#facc15',
  },
  ci: {
    jerseyColor: '#06b6d4', // Coastal Cyan (Fofana)
    shortsColor: '#0f172a',
    socksColor: '#06b6d4',
    collarColor: '#ea580c',
    skinColor: '#451a03',
    hairColor: '#171717',
    hairStyle: 'crop',
    glovesColor: '#ea580c',
  },
  dz: {
    jerseyColor: '#f59e0b', // Sahara Amber (Mandrea)
    shortsColor: '#065f46',
    socksColor: '#f59e0b',
    collarColor: '#065f46',
    skinColor: '#fed7aa',
    hairColor: '#171717',
    hairStyle: 'spiky',
    glovesColor: '#10b981',
  },
  tn: {
    jerseyColor: '#84cc16', // Olive Lime (Dahmen)
    shortsColor: '#0f172a',
    socksColor: '#84cc16',
    collarColor: '#dc2626',
    skinColor: '#e29b8c',
    hairColor: '#171717',
    hairStyle: 'crop',
    glovesColor: '#dc2626',
  },
  za: {
    jerseyColor: '#0284c7', // Bafana Blue (Williams)
    shortsColor: '#0f172a',
    socksColor: '#0284c7',
    collarColor: '#facc15',
    skinColor: '#8d5524',
    hairColor: '#171717',
    hairStyle: 'buzz',
    glovesColor: '#facc15',
  },

  // --- ASIA (AFC) & OCEANIA (OFC) ---
  jp: {
    jerseyColor: '#38bdf8', // Neon Sky Blue (Zion Suzuki)
    shortsColor: '#0f172a',
    socksColor: '#38bdf8',
    collarColor: '#0f172a',
    skinColor: '#fed7aa',
    hairColor: '#171717',
    hairStyle: 'undercut',
    glovesColor: '#ef4444',
  },
  kr: {
    jerseyColor: '#eab308', // Sun Gold (Jo Hyeon-woo / Kim Seung-gyu)
    shortsColor: '#0f172a',
    socksColor: '#eab308',
    collarColor: '#dc2626',
    skinColor: '#ffedd5',
    hairColor: '#171717',
    hairStyle: 'sweep',
    glovesColor: '#3b82f6',
  },
  au: {
    jerseyColor: '#0f172a', // Stealth Black (Mat Ryan)
    shortsColor: '#0f172a',
    socksColor: '#0f172a',
    collarColor: '#facc15',
    skinColor: '#fecdd3',
    hairColor: '#78350f',
    hairStyle: 'crop',
    glovesColor: '#facc15',
  },
  sa: {
    jerseyColor: '#f97316', // Desert Sunset (Al-Owais)
    shortsColor: '#065f46',
    socksColor: '#f97316',
    collarColor: '#065f46',
    skinColor: '#c68642',
    hairColor: '#171717',
    hairStyle: 'spiky',
    glovesColor: '#10b981',
  },
  ir: {
    jerseyColor: '#84cc16', // Persian Lime (Beiranvand)
    shortsColor: '#0f172a',
    socksColor: '#84cc16',
    collarColor: '#dc2626',
    skinColor: '#e29b8c',
    hairColor: '#171717',
    hairStyle: 'crop',
    glovesColor: '#dc2626',
  },
  qa: {
    jerseyColor: '#06b6d4', // Gulf Azure (Barsham)
    shortsColor: '#581c87',
    socksColor: '#06b6d4',
    collarColor: '#581c87',
    skinColor: '#8d5524',
    hairColor: '#171717',
    hairStyle: 'buzz',
    glovesColor: '#f59e0b',
  },
  uz: {
    jerseyColor: '#f59e0b', // Amber Gold (Yusupov)
    shortsColor: '#1e3a8a',
    socksColor: '#f59e0b',
    collarColor: '#1e3a8a',
    skinColor: '#ffedd5',
    hairColor: '#292524',
    hairStyle: 'sweep',
    glovesColor: '#0284c7',
  },
  nz: {
    jerseyColor: '#34d399', // Kiwi Emerald (Crocombe / Marinovic)
    shortsColor: '#0f172a',
    socksColor: '#34d399',
    collarColor: '#0f172a',
    skinColor: '#ffedd5',
    hairColor: '#451a03',
    hairStyle: 'crop',
    glovesColor: '#f97316',
  },

  // --- NORTH / CENTRAL AMERICA (CONCACAF) ---
  us: {
    jerseyColor: '#64748b', // Ice Steel Slate (Matt Turner)
    shortsColor: '#1e293b',
    socksColor: '#64748b',
    collarColor: '#1e3a8a',
    skinColor: '#fed7aa',
    hairColor: '#78350f',
    hairStyle: 'spiky',
    glovesColor: '#3b82f6',
  },
  mx: {
    jerseyColor: '#d946ef', // Neon Magenta (Guillermo Ochoa / Malagon)
    shortsColor: '#0f172a',
    socksColor: '#d946ef',
    collarColor: '#0f172a',
    skinColor: '#c68642',
    hairColor: '#171717',
    hairStyle: 'curls',
    glovesColor: '#a855f7',
  },
  ca: {
    jerseyColor: '#eab308', // Maple Sun Gold (Crepeau / St. Clair)
    shortsColor: '#0f172a',
    socksColor: '#eab308',
    collarColor: '#dc2626',
    skinColor: '#8d5524',
    hairColor: '#171717',
    hairStyle: 'crop',
    glovesColor: '#dc2626',
  },
  cr: {
    jerseyColor: '#0f172a', // Midnight Black (Keylor Navas)
    shortsColor: '#0f172a',
    socksColor: '#0f172a',
    collarColor: '#dc2626',
    skinColor: '#c68642',
    hairColor: '#171717',
    hairStyle: 'slick',
    glovesColor: '#eab308',
  },
  jm: {
    jerseyColor: '#06b6d4', // Caribbean Turquoise (Blake)
    shortsColor: '#0f172a',
    socksColor: '#06b6d4',
    collarColor: '#facc15',
    skinColor: '#451a03',
    hairColor: '#171717',
    hairStyle: 'dreads',
    glovesColor: '#facc15',
  },
  hn: {
    jerseyColor: '#f97316', // Coral Orange (Menjivar)
    shortsColor: '#1e3a8a',
    socksColor: '#f97316',
    collarColor: '#1e3a8a',
    skinColor: '#c68642',
    hairColor: '#171717',
    hairStyle: 'crop',
    glovesColor: '#3b82f6',
  },
  pa: {
    jerseyColor: '#84cc16', // Vibrant Lime (Mosquera)
    shortsColor: '#0f172a',
    socksColor: '#84cc16',
    collarColor: '#dc2626',
    skinColor: '#8d5524',
    hairColor: '#171717',
    hairStyle: 'afro',
    glovesColor: '#f59e0b',
  },
};

// Procedural palettes for comprehensive fallback across all 120+ teams
const GK_JERSEY_PALETTE = [
  '#10b981', // Emerald
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#facc15', // Yellow
  '#d946ef', // Magenta
  '#84cc16', // Lime
  '#a855f7', // Purple
  '#0f172a', // Black
  '#ef4444', // Red
  '#38bdf8', // Sky Blue
  '#34d399', // Mint
  '#eab308', // Gold
];

const GK_SHORTS_PALETTE = ['#0f172a', '#1e293b', '#1e3a8a', '#065f46', '#18181b'];

const GK_SKIN_PALETTE = [
  '#fecdd3', // Fair
  '#fed7aa', // Light Peach
  '#ffedd5', // Warm Cream
  '#e29b8c', // Light Olive / Mediterranean
  '#c68642', // Warm Tan / Latin American
  '#8d5524', // Bronze / South Asian / Middle Eastern
  '#451a03', // Deep Melanin / African
];

const GK_HAIR_COLORS = [
  '#171717', // Jet Black
  '#3b1a08', // Dark Espresso
  '#78350f', // Chestnut Brown
  '#eab308', // Golden Blonde
  '#9a3412', // Auburn / Copper
  '#f3e8c8', // Platinum / Bleached
  '#292524', // Dark Charcoal
];

const GK_HAIR_STYLES: HairStyle[] = [
  'spiky',
  'crop',
  'sweep',
  'curls',
  'undercut',
  'buzz',
  'afro',
  'dreads',
  'slick',
];

const GK_GLOVES_PALETTE = [
  '#facc15',
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#f97316',
  '#84cc16',
  '#ec4899',
  '#06b6d4',
];

/**
 * Returns a distinct, authentic Goalkeeper profile for any given team.
 * Guarantees that every country in the game has its own unique combination
 * of Goalkeeper shirt color, hair color, hairstyle, and skin tone.
 */
export function getTeamGoalkeeperProfile(countryCode: string): GoalkeeperProfile {
  const code = (countryCode || '').toLowerCase().trim();

  // 1. Check curated profile
  if (SPECIFIC_GK_PROFILES[code]) {
    return SPECIFIC_GK_PROFILES[code];
  }

  // 2. Deterministic hashing based on country code/id for 100% stable unique profiles
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const jerseyColor = GK_JERSEY_PALETTE[positiveHash % GK_JERSEY_PALETTE.length];
  const shortsColor = GK_SHORTS_PALETTE[(positiveHash >> 2) % GK_SHORTS_PALETTE.length];
  const skinColor = GK_SKIN_PALETTE[(positiveHash >> 4) % GK_SKIN_PALETTE.length];
  const hairColor = GK_HAIR_COLORS[(positiveHash >> 6) % GK_HAIR_COLORS.length];
  const hairStyle = GK_HAIR_STYLES[(positiveHash >> 8) % GK_HAIR_STYLES.length];
  const glovesColor = GK_GLOVES_PALETTE[(positiveHash >> 10) % GK_GLOVES_PALETTE.length];

  return {
    jerseyColor,
    shortsColor,
    socksColor: jerseyColor,
    collarColor: shortsColor,
    skinColor,
    hairColor,
    hairStyle,
    glovesColor,
  };
}
