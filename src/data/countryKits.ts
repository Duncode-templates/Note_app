export interface CountryKit {
  jerseyColor: string;
  secondaryColor?: string;
  pattern?: 'solid' | 'stripes' | 'checker' | 'sash' | 'hoops' | 'pinstripes' | 'halves';
  shortsColor: string;
  socksColor: string;
  collarColor?: string;
  sleeveTrimColor?: string;
  gkJerseyColor?: string;
  gkShortsColor?: string;
}

// Authentic HOME Kits for all national teams
export const COUNTRY_HOME_KITS: Record<string, CountryKit> = {
  // --- CONMEBOL ---
  ar: {
    jerseyColor: '#38bdf8', // Albiceleste Sky Blue
    secondaryColor: '#ffffff', // White Vertical Stripes
    pattern: 'stripes',
    shortsColor: '#0f172a', // Jet Black Shorts
    socksColor: '#ffffff',
    collarColor: '#0f172a',
    sleeveTrimColor: '#0f172a',
    gkJerseyColor: '#10b981', // Emerald Green GK
    gkShortsColor: '#0f172a',
  },
  br: {
    jerseyColor: '#facc15', // Canary Yellow
    secondaryColor: '#16a34a', // Green Collar & Trim
    pattern: 'solid',
    shortsColor: '#1d4ed8', // Royal Blue Shorts
    socksColor: '#ffffff',
    collarColor: '#16a34a',
    sleeveTrimColor: '#16a34a',
    gkJerseyColor: '#0f172a', // Midnight Black GK
    gkShortsColor: '#0f172a',
  },
  co: {
    jerseyColor: '#eab308', // Colombian Gold
    secondaryColor: '#1e3a8a', // Navy chest band / trim
    pattern: 'solid',
    shortsColor: '#1e3a8a', // Navy Shorts
    socksColor: '#dc2626', // Scarlet Red Socks
    collarColor: '#1e3a8a',
    sleeveTrimColor: '#dc2626',
    gkJerseyColor: '#d946ef', // Fuchsia Pink GK
    gkShortsColor: '#1e3a8a',
  },
  uy: {
    jerseyColor: '#38bdf8', // La Celeste Sky Blue
    secondaryColor: '#0f172a',
    pattern: 'solid',
    shortsColor: '#0f172a', // Black Shorts
    socksColor: '#0f172a', // Black Socks
    collarColor: '#0f172a',
    sleeveTrimColor: '#facc15',
    gkJerseyColor: '#f97316', // Bright Orange GK
    gkShortsColor: '#0f172a',
  },
  pe: {
    jerseyColor: '#ffffff', // Pure White
    secondaryColor: '#dc2626', // Iconic Red Diagonal Sash
    pattern: 'sash',
    shortsColor: '#ffffff', // White Shorts
    socksColor: '#ffffff',
    collarColor: '#dc2626',
    sleeveTrimColor: '#dc2626',
    gkJerseyColor: '#eab308', // Gold GK
    gkShortsColor: '#0f172a',
  },
  cl: {
    jerseyColor: '#dc2626', // La Roja Red
    secondaryColor: '#1d4ed8', // Blue Accents
    pattern: 'solid',
    shortsColor: '#1d4ed8', // Royal Blue Shorts
    socksColor: '#ffffff', // White Socks
    collarColor: '#1d4ed8',
    sleeveTrimColor: '#ffffff',
    gkJerseyColor: '#eab308',
    gkShortsColor: '#0f172a',
  },
  ec: {
    jerseyColor: '#fde047', // Vibrant Lemon Yellow
    secondaryColor: '#0284c7', // Sky Blue Accents
    pattern: 'solid',
    shortsColor: '#0284c7', // Sky Blue Shorts
    socksColor: '#dc2626', // Red Socks
    collarColor: '#0284c7',
    sleeveTrimColor: '#dc2626',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  py: {
    jerseyColor: '#dc2626', // Red & White Vertical Stripes
    secondaryColor: '#ffffff',
    pattern: 'stripes',
    shortsColor: '#1d4ed8', // Royal Blue Shorts
    socksColor: '#ffffff',
    collarColor: '#1d4ed8',
    sleeveTrimColor: '#1d4ed8',
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },
  ve: {
    jerseyColor: '#701a75', // La Vinotinto Deep Burgundy
    secondaryColor: '#facc15', // Gold Accents
    pattern: 'solid',
    shortsColor: '#701a75', // Vinotinto Shorts
    socksColor: '#701a75',
    collarColor: '#facc15',
    sleeveTrimColor: '#facc15',
    gkJerseyColor: '#0284c7',
    gkShortsColor: '#0f172a',
  },
  bo: {
    jerseyColor: '#16a34a', // Emerald Green
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#16a34a',
    collarColor: '#dc2626',
    sleeveTrimColor: '#facc15',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },

  // --- UEFA ---
  fr: {
    jerseyColor: '#1e3a8a', // Les Bleus Deep Navy/Royal Blue
    secondaryColor: '#facc15', // Golden Rooster Trim
    pattern: 'solid',
    shortsColor: '#ffffff', // White Shorts
    socksColor: '#dc2626', // Red Socks
    collarColor: '#ffffff',
    sleeveTrimColor: '#dc2626',
    gkJerseyColor: '#facc15', // Yellow GK
    gkShortsColor: '#1e3a8a',
  },
  es: {
    jerseyColor: '#b91c1c', // La Roja Vivid Crimson Red
    secondaryColor: '#f59e0b', // Spanish Gold Trim
    pattern: 'solid',
    shortsColor: '#172554', // Dark Indigo Navy Shorts
    socksColor: '#b91c1c',
    collarColor: '#f59e0b',
    sleeveTrimColor: '#f59e0b',
    gkJerseyColor: '#06b6d4', // Cyan GK
    gkShortsColor: '#0f172a',
  },
  'gb-eng': {
    jerseyColor: '#f8fafc', // Three Lions Pure White
    secondaryColor: '#1e3a8a', // Deep Navy Trim
    pattern: 'solid',
    shortsColor: '#172554', // Navy Shorts
    socksColor: '#ffffff',
    collarColor: '#1e3a8a',
    sleeveTrimColor: '#dc2626',
    gkJerseyColor: '#a855f7', // Purple GK
    gkShortsColor: '#172554',
  },
  be: {
    jerseyColor: '#1c1917', // Black base with Red & Yellow Flame/Trim
    secondaryColor: '#dc2626', // Red accents
    pattern: 'halves',
    shortsColor: '#1c1917',
    socksColor: '#dc2626',
    collarColor: '#facc15',
    sleeveTrimColor: '#facc15',
    gkJerseyColor: '#06b6d4',
    gkShortsColor: '#0f172a',
  },
  nl: {
    jerseyColor: '#ea580c', // KNVB Electric Oranje
    secondaryColor: '#1e3a8a', // Royal Blue Accents
    pattern: 'solid',
    shortsColor: '#ffffff', // White Shorts
    socksColor: '#ea580c', // Orange Socks
    collarColor: '#1e3a8a',
    sleeveTrimColor: '#1e3a8a',
    gkJerseyColor: '#10b981', // Turquoise Green GK
    gkShortsColor: '#0f172a',
  },
  pt: {
    jerseyColor: '#831843', // Deep Wine Red / Maroon
    secondaryColor: '#15803d', // Portuguese Forest Green
    pattern: 'halves',
    shortsColor: '#15803d', // Green Shorts
    socksColor: '#831843',
    collarColor: '#15803d',
    sleeveTrimColor: '#facc15',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  it: {
    jerseyColor: '#2563eb', // Azzurri Royal Blue
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#ffffff', // White Shorts
    socksColor: '#2563eb', // Blue Socks
    collarColor: '#ffffff',
    sleeveTrimColor: '#16a34a',
    gkJerseyColor: '#f97316', // Orange GK
    gkShortsColor: '#0f172a',
  },
  hr: {
    jerseyColor: '#dc2626', // Red & White Checkerboard
    secondaryColor: '#ffffff',
    pattern: 'checker',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#dc2626',
    sleeveTrimColor: '#dc2626',
    gkJerseyColor: '#0284c7', // Sky Blue GK
    gkShortsColor: '#0f172a',
  },
  de: {
    jerseyColor: '#ffffff', // DFB White
    secondaryColor: '#0f172a', // Black & Red/Gold chest band
    pattern: 'stripes',
    shortsColor: '#0f172a', // Jet Black Shorts
    socksColor: '#ffffff',
    collarColor: '#0f172a',
    sleeveTrimColor: '#dc2626',
    gkJerseyColor: '#db2777', // Magenta GK
    gkShortsColor: '#0f172a',
  },
  ch: {
    jerseyColor: '#e11d48', // Alpine Red
    secondaryColor: '#ffffff', // White pinstripes
    pattern: 'pinstripes',
    shortsColor: '#e11d48', // Red Shorts
    socksColor: '#e11d48',
    collarColor: '#ffffff',
    sleeveTrimColor: '#ffffff',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  dk: {
    jerseyColor: '#dc2626', // Danish Red
    secondaryColor: '#ffffff', // White Chevrons & Sleeves
    pattern: 'solid',
    shortsColor: '#ffffff', // White Shorts
    socksColor: '#dc2626',
    collarColor: '#ffffff',
    sleeveTrimColor: '#ffffff',
    gkJerseyColor: '#eab308',
    gkShortsColor: '#0f172a',
  },
  at: {
    jerseyColor: '#991b1b', // Carmine Scarlet Red
    secondaryColor: '#0f172a', // Black collar & trims
    pattern: 'solid',
    shortsColor: '#0f172a', // Black Shorts
    socksColor: '#991b1b',
    collarColor: '#0f172a',
    sleeveTrimColor: '#0f172a',
    gkJerseyColor: '#10b981', // Mint Green GK
    gkShortsColor: '#0f172a',
  },
  ua: {
    jerseyColor: '#facc15', // Ukrainian Yellow
    secondaryColor: '#2563eb', // Blue Vyshyvanka Trim
    pattern: 'solid',
    shortsColor: '#facc15', // Yellow Shorts
    socksColor: '#facc15',
    collarColor: '#2563eb',
    sleeveTrimColor: '#2563eb',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  se: {
    jerseyColor: '#facc15', // Swedish Yellow
    secondaryColor: '#2563eb', // Royal Blue Chest Band
    pattern: 'hoops',
    shortsColor: '#1d4ed8', // Royal Blue Shorts
    socksColor: '#facc15',
    collarColor: '#1d4ed8',
    sleeveTrimColor: '#1d4ed8',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  tr: {
    jerseyColor: '#b91c1c', // Turkish Red
    secondaryColor: '#ffffff', // White horizontal chest band
    pattern: 'hoops',
    shortsColor: '#b91c1c', // Red Shorts
    socksColor: '#b91c1c',
    collarColor: '#ffffff',
    sleeveTrimColor: '#ffffff',
    gkJerseyColor: '#0284c7',
    gkShortsColor: '#0f172a',
  },
  pl: {
    jerseyColor: '#ffffff', // Polish White
    secondaryColor: '#dc2626', // Red Crest & Collar
    pattern: 'solid',
    shortsColor: '#dc2626', // Red Shorts
    socksColor: '#ffffff',
    collarColor: '#dc2626',
    sleeveTrimColor: '#dc2626',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  hu: {
    jerseyColor: '#991b1b', // Hungarian Cherry Red
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#ffffff', // White Shorts
    socksColor: '#15803d', // Green Socks
    collarColor: '#15803d',
    sleeveTrimColor: '#ffffff',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  'gb-wls': {
    jerseyColor: '#dc2626', // Dragon Red
    secondaryColor: '#15803d', // Green Collar
    pattern: 'solid',
    shortsColor: '#ffffff', // White Shorts
    socksColor: '#dc2626',
    collarColor: '#15803d',
    sleeveTrimColor: '#facc15',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  sr: {
    jerseyColor: '#991b1b', // Serbian Dark Red
    secondaryColor: '#2563eb', // Blue & White Trim
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#991b1b',
    collarColor: '#2563eb',
    sleeveTrimColor: '#ffffff',
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },
  ru: {
    jerseyColor: '#831843', // Maroon Red
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#831843',
    collarColor: '#1d4ed8',
    gkJerseyColor: '#0284c7',
    gkShortsColor: '#0f172a',
  },
  cz: {
    jerseyColor: '#dc2626', // Czech Red
    secondaryColor: '#1d4ed8', // Blue Collar
    pattern: 'solid',
    shortsColor: '#1d4ed8', // Blue Shorts
    socksColor: '#dc2626',
    collarColor: '#1d4ed8',
    gkJerseyColor: '#eab308',
    gkShortsColor: '#0f172a',
  },
  sk: {
    jerseyColor: '#1e3a8a', // Deep Blue
    secondaryColor: '#0284c7',
    pattern: 'solid',
    shortsColor: '#1e3a8a',
    socksColor: '#1e3a8a',
    collarColor: '#dc2626',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  ro: {
    jerseyColor: '#facc15', // Yellow
    secondaryColor: '#dc2626',
    pattern: 'sash',
    shortsColor: '#1d4ed8', // Blue Shorts
    socksColor: '#dc2626', // Red Socks
    collarColor: '#1d4ed8',
    gkJerseyColor: '#15803d',
    gkShortsColor: '#0f172a',
  },
  gr: {
    jerseyColor: '#2563eb', // Hellenic Royal Blue
    secondaryColor: '#ffffff', // White cross
    pattern: 'pinstripes',
    shortsColor: '#2563eb',
    socksColor: '#2563eb',
    collarColor: '#ffffff',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  no: {
    jerseyColor: '#dc2626', // Norwegian Red
    secondaryColor: '#1e3a8a', // Navy Side Panel
    pattern: 'solid',
    shortsColor: '#1e3a8a', // Navy Shorts
    socksColor: '#ffffff',
    collarColor: '#ffffff',
    gkJerseyColor: '#0284c7',
    gkShortsColor: '#0f172a',
  },
  'gb-sct': {
    jerseyColor: '#0f172a', // Scotland Tartan Dark Navy
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#ffffff', // White Shorts
    socksColor: '#0f172a',
    collarColor: '#ffffff',
    gkJerseyColor: '#f97316',
    gkShortsColor: '#0f172a',
  },
  si: {
    jerseyColor: '#ffffff', // White with Triglav Green Mount
    secondaryColor: '#16a34a',
    pattern: 'sash',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#16a34a',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  ie: {
    jerseyColor: '#16a34a', // Shamrock Green
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#16a34a',
    collarColor: '#f97316', // Orange Collar
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  al: {
    jerseyColor: '#1c1917', // Black Eagle on Dark Red
    secondaryColor: '#dc2626',
    pattern: 'hoops',
    shortsColor: '#1c1917',
    socksColor: '#1c1917',
    collarColor: '#dc2626',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  fi: {
    jerseyColor: '#ffffff', // White with Nordic Blue Cross
    secondaryColor: '#1d4ed8',
    pattern: 'sash',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#1d4ed8',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },

  // --- CONCACAF ---
  us: {
    jerseyColor: '#ffffff', // USA White
    secondaryColor: '#1e3a8a', // Navy & Red sleeve bands
    pattern: 'stripes',
    shortsColor: '#1e3a8a', // Navy Shorts
    socksColor: '#ffffff',
    collarColor: '#dc2626',
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },
  mx: {
    jerseyColor: '#15803d', // Mexican Jade Green
    secondaryColor: '#dc2626', // Red Collar
    pattern: 'pinstripes',
    shortsColor: '#ffffff', // White Shorts
    socksColor: '#dc2626', // Red Socks
    collarColor: '#ffffff',
    sleeveTrimColor: '#dc2626',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  ca: {
    jerseyColor: '#b91c1c', // Canadian Maple Red
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#b91c1c',
    socksColor: '#b91c1c',
    collarColor: '#ffffff',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  cr: {
    jerseyColor: '#dc2626', // Ticos Red
    secondaryColor: '#1d4ed8', // Blue Accents
    pattern: 'solid',
    shortsColor: '#1d4ed8', // Blue Shorts
    socksColor: '#ffffff',
    collarColor: '#ffffff',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  hn: {
    jerseyColor: '#ffffff', // White with Blue Hoops
    secondaryColor: '#1d4ed8',
    pattern: 'hoops',
    shortsColor: '#1d4ed8',
    socksColor: '#ffffff',
    collarColor: '#1d4ed8',
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },
  jm: {
    jerseyColor: '#eab308', // Reggae Gold
    secondaryColor: '#15803d', // Green & Black geometric pattern
    pattern: 'checker',
    shortsColor: '#0f172a', // Black Shorts
    socksColor: '#eab308',
    collarColor: '#15803d',
    gkJerseyColor: '#0284c7',
    gkShortsColor: '#0f172a',
  },

  // --- CAF ---
  ma: {
    jerseyColor: '#991b1b', // Moroccan Dark Red
    secondaryColor: '#15803d', // Atlas Green Star & Collar
    pattern: 'solid',
    shortsColor: '#15803d', // Emerald Green Shorts
    socksColor: '#991b1b',
    collarColor: '#15803d',
    gkJerseyColor: '#0284c7',
    gkShortsColor: '#0f172a',
  },
  sn: {
    jerseyColor: '#ffffff', // Teranga White
    secondaryColor: '#16a34a', // Green/Yellow/Red Chevron
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#facc15',
    sleeveTrimColor: '#16a34a',
    gkJerseyColor: '#eab308',
    gkShortsColor: '#0f172a',
  },
  ng: {
    jerseyColor: '#22c55e', // Naija Electric Green
    secondaryColor: '#ffffff', // Iconic Zigzag Stripes
    pattern: 'stripes',
    shortsColor: '#ffffff',
    socksColor: '#22c55e',
    collarColor: '#0f172a',
    sleeveTrimColor: '#0f172a',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  dz: {
    jerseyColor: '#ffffff', // Desert Foxes White
    secondaryColor: '#15803d', // Green Sash
    pattern: 'sash',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#15803d',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  eg: {
    jerseyColor: '#dc2626', // Pharaohs Red
    secondaryColor: '#0f172a', // Black & Gold Trim
    pattern: 'solid',
    shortsColor: '#ffffff', // White Shorts
    socksColor: '#0f172a', // Black Socks
    collarColor: '#0f172a',
    sleeveTrimColor: '#facc15',
    gkJerseyColor: '#eab308',
    gkShortsColor: '#0f172a',
  },
  ci: {
    jerseyColor: '#ea580c', // Elephants Orange
    secondaryColor: '#15803d', // Green Collar
    pattern: 'solid',
    shortsColor: '#ea580c',
    socksColor: '#ea580c',
    collarColor: '#15803d',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  cm: {
    jerseyColor: '#15803d', // Indomitable Lions Green
    secondaryColor: '#dc2626', // Red Shorts
    pattern: 'solid',
    shortsColor: '#dc2626', // Red Shorts
    socksColor: '#facc15', // Yellow Socks
    collarColor: '#facc15',
    gkJerseyColor: '#eab308',
    gkShortsColor: '#0f172a',
  },
  gh: {
    jerseyColor: '#ffffff', // Black Stars White
    secondaryColor: '#0f172a', // Black Star on Chest
    pattern: 'solid',
    shortsColor: '#0f172a', // Black Shorts
    socksColor: '#ffffff',
    collarColor: '#facc15',
    gkJerseyColor: '#f97316',
    gkShortsColor: '#0f172a',
  },
  za: {
    jerseyColor: '#eab308', // Bafana Gold
    secondaryColor: '#15803d', // Green Shorts & Accents
    pattern: 'solid',
    shortsColor: '#15803d',
    socksColor: '#eab308',
    collarColor: '#15803d',
    gkJerseyColor: '#0284c7',
    gkShortsColor: '#0f172a',
  },

  // --- AFC ---
  jp: {
    jerseyColor: '#1e40af', // Samurai Navy Blue
    secondaryColor: '#ffffff', // White origami lines
    pattern: 'pinstripes',
    shortsColor: '#ffffff', // White Shorts
    socksColor: '#1e40af',
    collarColor: '#dc2626', // Red Collar
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },
  ir: {
    jerseyColor: '#ffffff', // White
    secondaryColor: '#16a34a', // Green & Red stripe
    pattern: 'hoops',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#dc2626',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  kr: {
    jerseyColor: '#e11d48', // Red Tigers Rose/Red
    secondaryColor: '#0f172a', // Black Accents
    pattern: 'solid',
    shortsColor: '#0f172a', // Black Shorts
    socksColor: '#e11d48',
    collarColor: '#0f172a',
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },
  au: {
    jerseyColor: '#f59e0b', // Socceroos Golden Wattle
    secondaryColor: '#166534', // Forest Green Shorts
    pattern: 'solid',
    shortsColor: '#166534',
    socksColor: '#f59e0b',
    collarColor: '#166534',
    gkJerseyColor: '#0284c7',
    gkShortsColor: '#0f172a',
  },
  sa: {
    jerseyColor: '#15803d', // Green Falcons Forest Green
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#15803d',
    collarColor: '#ffffff',
    gkJerseyColor: '#eab308',
    gkShortsColor: '#0f172a',
  },
  qa: {
    jerseyColor: '#701a75', // Maroon
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#701a75',
    socksColor: '#701a75',
    collarColor: '#ffffff',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  cn: {
    jerseyColor: '#dc2626', // Dragon Red
    secondaryColor: '#facc15', // Gold Trim
    pattern: 'solid',
    shortsColor: '#dc2626',
    socksColor: '#dc2626',
    collarColor: '#facc15',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  in: {
    jerseyColor: '#0284c7', // Blue Tigers Sky Blue
    secondaryColor: '#f97316', // Orange Trim
    pattern: 'stripes',
    shortsColor: '#0284c7',
    socksColor: '#0284c7',
    collarColor: '#f97316',
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },

  // --- OFC ---
  nz: {
    jerseyColor: '#09090b', // All Blacks Jet Black
    secondaryColor: '#ffffff', // Silver Fern White
    pattern: 'solid',
    shortsColor: '#09090b',
    socksColor: '#09090b',
    collarColor: '#ffffff',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
};

// Authentic AWAY Kits for all national teams (used when colors clash)
export const COUNTRY_AWAY_KITS: Record<string, CountryKit> = {
  ar: {
    jerseyColor: '#0f172a', // Midnight Purple/Navy
    secondaryColor: '#38bdf8', // Flame accents
    pattern: 'solid',
    shortsColor: '#0f172a',
    socksColor: '#0f172a',
    collarColor: '#38bdf8',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  br: {
    jerseyColor: '#1d4ed8', // Vibrant Cobalt Blue
    secondaryColor: '#22c55e', // Green feather trim
    pattern: 'solid',
    shortsColor: '#ffffff', // White shorts
    socksColor: '#1d4ed8',
    collarColor: '#22c55e',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  co: {
    jerseyColor: '#0f172a', // Obsidian Navy
    secondaryColor: '#f97316', // Neon Orange/Gold
    pattern: 'solid',
    shortsColor: '#0f172a',
    socksColor: '#0f172a',
    collarColor: '#f97316',
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },
  uy: {
    jerseyColor: '#ffffff', // Pure White
    secondaryColor: '#38bdf8', // Sky Blue & Gold
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#facc15',
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },
  pe: {
    jerseyColor: '#dc2626', // Scarlet Red
    secondaryColor: '#ffffff', // White Sash
    pattern: 'sash',
    shortsColor: '#dc2626',
    socksColor: '#dc2626',
    collarColor: '#ffffff',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  cl: {
    jerseyColor: '#ffffff', // Pure White
    secondaryColor: '#dc2626',
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#1d4ed8',
    collarColor: '#1d4ed8',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  ec: {
    jerseyColor: '#0f172a', // Dark Navy
    secondaryColor: '#facc15',
    pattern: 'solid',
    shortsColor: '#0f172a',
    socksColor: '#0f172a',
    collarColor: '#facc15',
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },
  py: {
    jerseyColor: '#38bdf8', // Sky Blue
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#38bdf8',
    socksColor: '#ffffff',
    collarColor: '#ffffff',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  ve: {
    jerseyColor: '#ffffff', // Pure White
    secondaryColor: '#701a75', // Burgundy Sash
    pattern: 'sash',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#701a75',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  bo: {
    jerseyColor: '#ffffff', // White
    secondaryColor: '#16a34a',
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#16a34a',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  fr: {
    jerseyColor: '#f8fafc', // Pure Off-White
    secondaryColor: '#1e3a8a', // Blue Toile Art
    pattern: 'pinstripes',
    shortsColor: '#1e3a8a', // Navy Shorts
    socksColor: '#ffffff',
    collarColor: '#1e3a8a',
    gkJerseyColor: '#dc2626',
    gkShortsColor: '#0f172a',
  },
  es: {
    jerseyColor: '#fef08a', // Pale Gold / Light Yellow
    secondaryColor: '#0284c7', // Sky Blue Trim
    pattern: 'solid',
    shortsColor: '#0284c7', // Sky Blue Shorts
    socksColor: '#fef08a',
    collarColor: '#0284c7',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  'gb-eng': {
    jerseyColor: '#dc2626', // Classic 1966 Crimson Red
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#ffffff', // White Shorts
    socksColor: '#dc2626',
    collarColor: '#1e3a8a',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  be: {
    jerseyColor: '#ffffff', // White
    secondaryColor: '#06b6d4', // Festival Cyan/Magenta Trim
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#06b6d4',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  nl: {
    jerseyColor: '#1e3a8a', // Royal Navy Blue
    secondaryColor: '#ea580c', // Bright Orange Collar/Accents
    pattern: 'solid',
    shortsColor: '#1e3a8a',
    socksColor: '#1e3a8a',
    collarColor: '#ea580c',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  pt: {
    jerseyColor: '#a7f3d0', // Mint Cyan / Off-White
    secondaryColor: '#0f172a', // Deep Navy & Gold
    pattern: 'solid',
    shortsColor: '#0f172a', // Navy Shorts
    socksColor: '#a7f3d0',
    collarColor: '#0f172a',
    gkJerseyColor: '#dc2626',
    gkShortsColor: '#0f172a',
  },
  it: {
    jerseyColor: '#ffffff', // Pure White
    secondaryColor: '#2563eb', // Azzurri Blue & Italian Tricolor
    pattern: 'sash',
    shortsColor: '#2563eb', // Blue Shorts
    socksColor: '#ffffff',
    collarColor: '#2563eb',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  hr: {
    jerseyColor: '#0f172a', // Dark Navy / Black
    secondaryColor: '#0284c7', // Sky Blue Checkerboard
    pattern: 'checker',
    shortsColor: '#0f172a',
    socksColor: '#0f172a',
    collarColor: '#0284c7',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  de: {
    jerseyColor: '#db2777', // Vibrant Hot Magenta / Purple Fade
    secondaryColor: '#581c87',
    pattern: 'halves',
    shortsColor: '#581c87', // Purple Shorts
    socksColor: '#db2777',
    collarColor: '#ffffff',
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },
  ch: {
    jerseyColor: '#ffffff', // Pure White
    secondaryColor: '#e11d48', // Red Cross
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#e11d48',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  dk: {
    jerseyColor: '#ffffff', // Pure White
    secondaryColor: '#dc2626', // Red Chevrons
    pattern: 'pinstripes',
    shortsColor: '#dc2626', // Red Shorts
    socksColor: '#ffffff',
    collarColor: '#dc2626',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  at: {
    jerseyColor: '#10b981', // Alpine Mint Turquoise
    secondaryColor: '#0f172a',
    pattern: 'solid',
    shortsColor: '#0f172a',
    socksColor: '#10b981',
    collarColor: '#0f172a',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  ua: {
    jerseyColor: '#1d4ed8', // Royal Blue
    secondaryColor: '#facc15', // Yellow Accents
    pattern: 'solid',
    shortsColor: '#1d4ed8',
    socksColor: '#1d4ed8',
    collarColor: '#facc15',
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },
  se: {
    jerseyColor: '#0f172a', // Midnight Navy
    secondaryColor: '#facc15', // Yellow Accents
    pattern: 'solid',
    shortsColor: '#0f172a',
    socksColor: '#0f172a',
    collarColor: '#facc15',
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },
  tr: {
    jerseyColor: '#ffffff', // Pure White
    secondaryColor: '#b91c1c', // Red Band
    pattern: 'hoops',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#b91c1c',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  pl: {
    jerseyColor: '#dc2626', // Full Scarlet Red
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#ffffff', // White Shorts
    socksColor: '#dc2626',
    collarColor: '#ffffff',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  hu: {
    jerseyColor: '#ffffff', // Pure White
    secondaryColor: '#991b1b', // Red & Green Bands
    pattern: 'stripes',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#15803d',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  'gb-wls': {
    jerseyColor: '#facc15', // Daffodil Yellow
    secondaryColor: '#15803d', // Green & Red Trim
    pattern: 'pinstripes',
    shortsColor: '#15803d', // Green Shorts
    socksColor: '#facc15',
    collarColor: '#dc2626',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  sr: {
    jerseyColor: '#ffffff', // White
    secondaryColor: '#991b1b',
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#2563eb',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  ru: {
    jerseyColor: '#ffffff',
    secondaryColor: '#831843',
    pattern: 'solid',
    shortsColor: '#831843',
    socksColor: '#ffffff',
    collarColor: '#831843',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  cz: {
    jerseyColor: '#ffffff',
    secondaryColor: '#1d4ed8',
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#1d4ed8',
    collarColor: '#dc2626',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  sk: {
    jerseyColor: '#ffffff',
    secondaryColor: '#1e3a8a',
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#dc2626',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  ro: {
    jerseyColor: '#dc2626', // Red
    secondaryColor: '#facc15',
    pattern: 'solid',
    shortsColor: '#dc2626',
    socksColor: '#dc2626',
    collarColor: '#1d4ed8',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  gr: {
    jerseyColor: '#ffffff',
    secondaryColor: '#2563eb',
    pattern: 'stripes',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#2563eb',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  no: {
    jerseyColor: '#ffffff',
    secondaryColor: '#1e3a8a',
    pattern: 'stripes',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#dc2626',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  'gb-sct': {
    jerseyColor: '#ffffff', // White
    secondaryColor: '#0284c7', // Sky Blue & Purple
    pattern: 'pinstripes',
    shortsColor: '#0284c7',
    socksColor: '#ffffff',
    collarColor: '#0f172a',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  si: {
    jerseyColor: '#16a34a', // Green
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#16a34a',
    socksColor: '#16a34a',
    collarColor: '#ffffff',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  ie: {
    jerseyColor: '#ffffff', // White
    secondaryColor: '#16a34a', // Green & Orange Stripes
    pattern: 'stripes',
    shortsColor: '#16a34a',
    socksColor: '#ffffff',
    collarColor: '#16a34a',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  al: {
    jerseyColor: '#ffffff',
    secondaryColor: '#1c1917',
    pattern: 'solid',
    shortsColor: '#1c1917',
    socksColor: '#ffffff',
    collarColor: '#dc2626',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  fi: {
    jerseyColor: '#1d4ed8', // Blue
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#1d4ed8',
    socksColor: '#1d4ed8',
    collarColor: '#ffffff',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  us: {
    jerseyColor: '#1e3a8a', // Deep Royal Navy
    secondaryColor: '#dc2626', // Red Tie-Dye Accents
    pattern: 'solid',
    shortsColor: '#1e3a8a',
    socksColor: '#1e3a8a',
    collarColor: '#ffffff',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  mx: {
    jerseyColor: '#fef3c7', // Bone White / Cream
    secondaryColor: '#831843', // Burgundy Aztec Pattern
    pattern: 'checker',
    shortsColor: '#15803d', // Green Shorts
    socksColor: '#fef3c7',
    collarColor: '#831843',
    gkJerseyColor: '#0284c7',
    gkShortsColor: '#0f172a',
  },
  ca: {
    jerseyColor: '#ffffff', // White
    secondaryColor: '#b91c1c',
    pattern: 'pinstripes',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#b91c1c',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  cr: {
    jerseyColor: '#ffffff',
    secondaryColor: '#dc2626',
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#1d4ed8',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  hn: {
    jerseyColor: '#1d4ed8', // Blue
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#1d4ed8',
    socksColor: '#1d4ed8',
    collarColor: '#ffffff',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  jm: {
    jerseyColor: '#15803d', // Emerald Green
    secondaryColor: '#eab308',
    pattern: 'pinstripes',
    shortsColor: '#15803d',
    socksColor: '#15803d',
    collarColor: '#0f172a',
    gkJerseyColor: '#dc2626',
    gkShortsColor: '#0f172a',
  },
  ma: {
    jerseyColor: '#ffffff', // White
    secondaryColor: '#15803d', // Green Geometric Star
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#991b1b',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  sn: {
    jerseyColor: '#15803d', // Green
    secondaryColor: '#facc15', // Yellow Star
    pattern: 'solid',
    shortsColor: '#15803d',
    socksColor: '#15803d',
    collarColor: '#dc2626',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  ng: {
    jerseyColor: '#052e16', // Deep Forest Green
    secondaryColor: '#22c55e', // Eagle Feathers
    pattern: 'solid',
    shortsColor: '#052e16',
    socksColor: '#052e16',
    collarColor: '#ffffff',
    gkJerseyColor: '#facc15',
    gkShortsColor: '#0f172a',
  },
  dz: {
    jerseyColor: '#15803d', // Green
    secondaryColor: '#ffffff',
    pattern: 'stripes',
    shortsColor: '#15803d',
    socksColor: '#15803d',
    collarColor: '#ffffff',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  eg: {
    jerseyColor: '#ffffff', // White
    secondaryColor: '#dc2626', // Gold & Red Trim
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#facc15',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  ci: {
    jerseyColor: '#ffffff', // White
    secondaryColor: '#ea580c', // Orange & Green
    pattern: 'stripes',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#15803d',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  cm: {
    jerseyColor: '#facc15', // Yellow
    secondaryColor: '#15803d',
    pattern: 'solid',
    shortsColor: '#15803d',
    socksColor: '#facc15',
    collarColor: '#dc2626',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  gh: {
    jerseyColor: '#dc2626', // Red
    secondaryColor: '#facc15',
    pattern: 'solid',
    shortsColor: '#dc2626',
    socksColor: '#dc2626',
    collarColor: '#0f172a',
    gkJerseyColor: '#0284c7',
    gkShortsColor: '#0f172a',
  },
  za: {
    jerseyColor: '#15803d', // Green
    secondaryColor: '#eab308',
    pattern: 'solid',
    shortsColor: '#eab308',
    socksColor: '#15803d',
    collarColor: '#ffffff',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  jp: {
    jerseyColor: '#ffffff', // Origami White
    secondaryColor: '#1e40af', // Red & Blue feathers
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#dc2626',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  ir: {
    jerseyColor: '#dc2626', // Red
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#dc2626',
    socksColor: '#dc2626',
    collarColor: '#16a34a',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  kr: {
    jerseyColor: '#ffffff', // White
    secondaryColor: '#0f172a', // Black & Red Tiger Stripes
    pattern: 'stripes',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#e11d48',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  au: {
    jerseyColor: '#0f766e', // Ocean Teal
    secondaryColor: '#f59e0b', // Gold Trim
    pattern: 'solid',
    shortsColor: '#0f766e',
    socksColor: '#0f766e',
    collarColor: '#f59e0b',
    gkJerseyColor: '#dc2626',
    gkShortsColor: '#0f172a',
  },
  sa: {
    jerseyColor: '#ffffff', // White
    secondaryColor: '#15803d',
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#15803d',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  qa: {
    jerseyColor: '#ffffff', // White
    secondaryColor: '#701a75',
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#701a75',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  cn: {
    jerseyColor: '#facc15', // Imperial Yellow
    secondaryColor: '#dc2626',
    pattern: 'solid',
    shortsColor: '#dc2626',
    socksColor: '#facc15',
    collarColor: '#dc2626',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  in: {
    jerseyColor: '#f97316', // Saffron Orange
    secondaryColor: '#ffffff',
    pattern: 'solid',
    shortsColor: '#15803d',
    socksColor: '#f97316',
    collarColor: '#0284c7',
    gkJerseyColor: '#0f172a',
    gkShortsColor: '#0f172a',
  },
  nz: {
    jerseyColor: '#ffffff', // All Whites Pure White
    secondaryColor: '#09090b', // Black Fern
    pattern: 'solid',
    shortsColor: '#ffffff',
    socksColor: '#ffffff',
    collarColor: '#09090b',
    gkJerseyColor: '#10b981',
    gkShortsColor: '#0f172a',
  },
};

// Fallback procedural generator if code is unknown
function generateKitFromCode(code: string, isAway = false): CountryKit {
  let hash = 0;
  const cleanCode = (code || 'team').toLowerCase();
  for (let i = 0; i < cleanCode.length; i++) {
    hash = cleanCode.charCodeAt(i) + ((hash << 5) - hash);
  }

  const primaryPalettes = [
    { jersey: '#dc2626', secondary: '#ffffff', shorts: '#ffffff', socks: '#dc2626', pattern: 'solid' as const },
    { jersey: '#1d4ed8', secondary: '#ffffff', shorts: '#ffffff', socks: '#1d4ed8', pattern: 'stripes' as const },
    { jersey: '#15803d', secondary: '#ffffff', shorts: '#15803d', socks: '#15803d', pattern: 'solid' as const },
    { jersey: '#facc15', secondary: '#1d4ed8', shorts: '#1d4ed8', socks: '#facc15', pattern: 'hoops' as const },
    { jersey: '#ffffff', secondary: '#dc2626', shorts: '#dc2626', socks: '#ffffff', pattern: 'sash' as const },
    { jersey: '#ea580c', secondary: '#0f172a', shorts: '#ffffff', socks: '#ea580c', pattern: 'solid' as const },
    { jersey: '#701a75', secondary: '#facc15', shorts: '#701a75', socks: '#701a75', pattern: 'solid' as const },
    { jersey: '#0f172a', secondary: '#ffffff', shorts: '#0f172a', socks: '#0f172a', pattern: 'pinstripes' as const },
  ];

  const awayPalettes = [
    { jersey: '#ffffff', secondary: '#0f172a', shorts: '#0f172a', socks: '#ffffff', pattern: 'solid' as const },
    { jersey: '#0f172a', secondary: '#facc15', shorts: '#0f172a', socks: '#0f172a', pattern: 'solid' as const },
    { jersey: '#facc15', secondary: '#15803d', shorts: '#15803d', socks: '#facc15', pattern: 'solid' as const },
    { jersey: '#0284c7', secondary: '#ffffff', shorts: '#ffffff', socks: '#0284c7', pattern: 'stripes' as const },
  ];

  const palettes = isAway ? awayPalettes : primaryPalettes;
  const selected = palettes[Math.abs(hash) % palettes.length];

  return {
    jerseyColor: selected.jersey,
    secondaryColor: selected.secondary,
    pattern: selected.pattern,
    shortsColor: selected.shorts,
    socksColor: selected.socks,
    collarColor: selected.secondary,
    gkJerseyColor: isAway ? '#dc2626' : '#10b981',
    gkShortsColor: '#0f172a',
  };
}

export function getCountryKit(code: string, isAway = false): CountryKit {
  const normalizedCode = code ? code.toLowerCase() : 'default';
  if (isAway && COUNTRY_AWAY_KITS[normalizedCode]) {
    return COUNTRY_AWAY_KITS[normalizedCode];
  }
  if (COUNTRY_HOME_KITS[normalizedCode]) {
    return COUNTRY_HOME_KITS[normalizedCode];
  }
  return generateKitFromCode(normalizedCode, isAway);
}

// Color Utility: Convert Hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16) || 0,
    g: parseInt(c.substring(2, 4), 16) || 0,
    b: parseInt(c.substring(4, 6), 16) || 0,
  };
}

// Color Utility: Euclidean distance between two colors in RGB space
function getColorDistance(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Color Category Identifier to prevent same-family clashes (e.g. Red vs Maroon, White vs Light Yellow, Yellow vs Gold)
function getColorFamily(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  // Very dark / black
  if (max < 55) return 'black';
  // Very light / white
  if (min > 200) return 'white';
  // Low saturation greys
  if (diff < 30) return 'neutral';

  if (r > 180 && g < 80 && b < 80) return 'red';
  if (r > 100 && g < 40 && b > 80) return 'burgundy';
  if (r > 180 && g > 150 && b < 60) return 'yellow';
  if (r > 180 && g > 70 && b < 40) return 'orange';
  if (g > 110 && r < 90 && b < 90) return 'green';
  if (b > 140 && r < 100) return 'blue';
  if (b > 80 && r < 60 && g < 60) return 'navy';
  if (r > 160 && b > 140 && g < 100) return 'magenta';

  return 'other';
}

/**
 * Intelligent Match Kit Resolution Engine:
 * Compares two teams' jerseys and shorts. If there is any visual clash,
 * the defending/away team automatically switches to their authentic AWAY kit
 * (or contrasting alternative) to guarantee 100% VISUAL DISTINCTION.
 */
export function resolveMatchKits(
  homeCode: string,
  awayCode: string
): {
  homeKit: CountryKit;
  awayKit: CountryKit;
  isAwayKitActive: boolean;
  gkKit: { jerseyColor: string; shortsColor: string };
} {
  const homeKit = getCountryKit(homeCode, false);
  const rawAwayKit = getCountryKit(awayCode, false);

  const homeFamily = getColorFamily(homeKit.jerseyColor);
  const awayFamily = getColorFamily(rawAwayKit.jerseyColor);
  const dist = getColorDistance(homeKit.jerseyColor, rawAwayKit.jerseyColor);

  // Check if they clash (same color family or RGB distance < 115)
  const isClash = homeFamily === awayFamily || dist < 115;

  let resolvedAwayKit: CountryKit;
  let isAwayKitActive = false;

  if (isClash) {
    // Try the authentic AWAY kit
    const altAwayKit = getCountryKit(awayCode, true);
    const altDist = getColorDistance(homeKit.jerseyColor, altAwayKit.jerseyColor);
    const altFamily = getColorFamily(altAwayKit.jerseyColor);

    if (altFamily !== homeFamily && altDist >= 115) {
      resolvedAwayKit = altAwayKit;
      isAwayKitActive = true;
    } else {
      // Fallback: guaranteed high-contrast inversion
      const isHomeLight = (hexToRgb(homeKit.jerseyColor).r * 299 + hexToRgb(homeKit.jerseyColor).g * 587 + hexToRgb(homeKit.jerseyColor).b * 114) / 1000 > 140;
      resolvedAwayKit = {
        jerseyColor: isHomeLight ? '#0f172a' : '#ffffff',
        secondaryColor: isHomeLight ? '#38bdf8' : '#dc2626',
        pattern: 'stripes',
        shortsColor: isHomeLight ? '#0f172a' : '#ffffff',
        socksColor: isHomeLight ? '#0f172a' : '#ffffff',
        collarColor: isHomeLight ? '#38bdf8' : '#dc2626',
      };
      isAwayKitActive = true;
    }
  } else {
    resolvedAwayKit = rawAwayKit;
    isAwayKitActive = false;
  }

  // Ensure Goalkeeper kit never clashes with either team's jersey
  const gkOptions = ['#84cc16', '#06b6d4', '#d946ef', '#facc15', '#f97316', '#0f172a', '#10b981'];
  let chosenGkJersey = resolvedAwayKit.gkJerseyColor || '#84cc16';

  const homeGkDist = getColorDistance(chosenGkJersey, homeKit.jerseyColor);
  const awayGkDist = getColorDistance(chosenGkJersey, resolvedAwayKit.jerseyColor);

  if (homeGkDist < 120 || awayGkDist < 120 || getColorFamily(chosenGkJersey) === homeFamily || getColorFamily(chosenGkJersey) === getColorFamily(resolvedAwayKit.jerseyColor)) {
    for (const opt of gkOptions) {
      if (
        getColorDistance(opt, homeKit.jerseyColor) >= 130 &&
        getColorDistance(opt, resolvedAwayKit.jerseyColor) >= 130 &&
        getColorFamily(opt) !== homeFamily &&
        getColorFamily(opt) !== getColorFamily(resolvedAwayKit.jerseyColor)
      ) {
        chosenGkJersey = opt;
        break;
      }
    }
  }

  return {
    homeKit,
    awayKit: resolvedAwayKit,
    isAwayKitActive,
    gkKit: {
      jerseyColor: chosenGkJersey,
      shortsColor: '#0f172a',
    },
  };
}
