export type BallStyle =
  | 'target_rings'
  | 'usa_chevron'
  | 'trionda'
  | 'pl_radar'
  | 'teal_leather'
  | 'star_mosaic'
  | 'tango'
  | 'rainbow_dodgeball'
  | 'aero_swirl'
  | 'standard'
  | 'vintage_leather'
  | 'star'
  | 'blaze'
  | 'cyber'
  | 'gold'
  | 'samba'
  | 'arctic'
  | 'vortex'
  | 'carbon'
  | 'matrix'
  | 'geo_pulse'
  | 'spear'
  | 'striped_band'
  | 'cross'
  | 'sakura';

export interface BallTextureItem {
  id: string;
  name: string;
  badge: string;
  description: string;
  price: number;
  unlockedByDefault?: boolean;
  theme: {
    baseColor: string;
    panelColor: string;
    trimColor: string;
    seamColor: string;
    textColor: string;
    brandLabel: string;
    subLabel: string;
    style: BallStyle;
  };
}

export type PitchPatternType =
  | 'stripes'
  | 'horizontal_stripes'
  | 'checkerboard'
  | 'rings'
  | 'diamond'
  | 'emerald'
  | 'chevron'
  | 'diagonal_stripes'
  | 'hexagonal'
  | 'starburst'
  | 'cross_hatch'
  | 'waves'
  | 'quadrant'
  | 'spiral'
  | 'boxes'
  | 'tartan'
  | 'circuits'
  | 'sunburst'
  | 'fine_grid'
  | 'herringbone';

export interface PitchPatternItem {
  id: string;
  name: string;
  badge: string;
  description: string;
  price: number;
  unlockedByDefault?: boolean;
  theme: {
    grassDark: string;
    grassLight: string;
    lineColor: string;
    patternType: PitchPatternType;
  };
}

// ============================================================================
// 32 DISTINCT 3D BALL TEXTURES (SORTED BY PRICE & RARITY - NO DUPLICATES)
// ============================================================================
export const BALL_TEXTURE_ITEMS: BallTextureItem[] = [
  // --- DEFAULT STARTER (0 COINS) ---
  {
    id: 'aero_tricolor_pro',
    name: 'Championship Tri-Color',
    badge: 'DEFAULT',
    description: 'Championship 18-panel aerodynamic design in royal blue, golden yellow, and pure white.',
    price: 0,
    unlockedByDefault: true,
    theme: {
      baseColor: '#ffffff',
      panelColor: '#1d4ed8',
      trimColor: '#facc15',
      seamColor: '#0f172a',
      textColor: '#000000',
      brandLabel: 'AERO',
      subLabel: 'PRO MATCH',
      style: 'aero_swirl',
    },
  },

  // --- TIER 1: CLUB / REGULAR (250 - 450 COINS) ---
  {
    id: 'telstar_classic_1970',
    name: 'Telstar Classic 1970',
    badge: 'CLASSIC',
    description: 'The legendary 32-panel black and white icon that defined soccer history.',
    price: 250,
    theme: {
      baseColor: '#ffffff',
      panelColor: '#111827',
      trimColor: '#64748b',
      seamColor: '#0f172a',
      textColor: '#ffffff',
      brandLabel: 'TELSTAR',
      subLabel: 'OFFICIAL',
      style: 'standard',
    },
  },
  {
    id: 'retro_rainbow_dodgeball',
    name: 'Retro Rainbow Grip',
    badge: 'ARCADE',
    description: 'Nostalgic 6-color spectrum playground ball with embossed waffle grip texture.',
    price: 350,
    theme: {
      baseColor: '#ef4444',
      panelColor: '#3b82f6',
      trimColor: '#eab308',
      seamColor: '#000000',
      textColor: '#ffffff',
      brandLabel: 'PLAYGROUND',
      subLabel: 'WAFFLE GRIP',
      style: 'rainbow_dodgeball',
    },
  },
  {
    id: 'tango_espana_classic',
    name: 'Tango España Classic',
    badge: 'VINTAGE',
    description: 'Iconic 20-triad Spanish tournament ball with signature black curved wing geometry.',
    price: 450,
    theme: {
      baseColor: '#ffffff',
      panelColor: '#09090b',
      trimColor: '#71717a',
      seamColor: '#18181b',
      textColor: '#000000',
      brandLabel: 'TANGO',
      subLabel: 'ESPANA',
      style: 'tango',
    },
  },

  // --- TIER 2: SEMI-PRO / DYNAMIC (600 - 950 COINS) ---
  {
    id: 'retro_target_rings_70s',
    name: 'Target Rings Retro 70s',
    badge: 'RETRO',
    description: 'Authentic 1970s concentric ring target ball with crimson bullseye and racing bands.',
    price: 600,
    theme: {
      baseColor: '#f8fafc',
      panelColor: '#ef4444',
      trimColor: '#22c55e',
      seamColor: '#0f172a',
      textColor: '#0f172a',
      brandLabel: 'TARGET',
      subLabel: 'BULLSEYE 70',
      style: 'target_rings',
    },
  },
  {
    id: 'velocity_crimson_swirl',
    name: 'Velocity Crimson Aero',
    badge: 'DYNAMIC',
    description: 'High-contrast ruby and carbon aerodynamic swirl panels with gold velocity trim.',
    price: 750,
    theme: {
      baseColor: '#f8fafc',
      panelColor: '#dc2626',
      trimColor: '#f59e0b',
      seamColor: '#1e293b',
      textColor: '#0f172a',
      brandLabel: 'VELOCITY',
      subLabel: 'AERO STRIKE',
      style: 'aero_swirl',
    },
  },
  {
    id: 'tango_azure_medallion',
    name: 'Tango Azure Medallion',
    badge: 'CLASSIC',
    description: 'Mediterranean royal blue triad panels with circular tournament crests and gold seams.',
    price: 850,
    theme: {
      baseColor: '#f8fafc',
      panelColor: '#1e40af',
      trimColor: '#fbbf24',
      seamColor: '#1e3a8a',
      textColor: '#ffffff',
      brandLabel: 'TANGO',
      subLabel: 'AZZURRO',
      style: 'tango',
    },
  },
  {
    id: 'sunset_horizon_dodgeball',
    name: 'Sunset Horizon Spectrum',
    badge: 'ARCADE',
    description: 'Vibrant sunset gradient shifting from hot coral pink to golden amber with micro-dots.',
    price: 950,
    theme: {
      baseColor: '#f43f5e',
      panelColor: '#fb923c',
      trimColor: '#fde047',
      seamColor: '#881337',
      textColor: '#ffffff',
      brandLabel: 'HORIZON',
      subLabel: 'SUNSET 90',
      style: 'rainbow_dodgeball',
    },
  },

  // --- TIER 3: NATIONAL / PREMIER (1,200 - 1,800 COINS) ---
  {
    id: 'usa_patriot_chevron',
    name: 'USA Patriot Chevron',
    badge: 'NATIONAL',
    description: 'Official Stars and Stripes distressed chevron panels with navy shield and crimson stars.',
    price: 1200,
    theme: {
      baseColor: '#ffffff',
      panelColor: '#dc2626',
      trimColor: '#1e3a8a',
      seamColor: '#0f172a',
      textColor: '#ffffff',
      brandLabel: 'USA',
      subLabel: 'SOCCER 2026',
      style: 'usa_chevron',
    },
  },
  {
    id: 'volt_flight_radar',
    name: 'Volt Flight Radar',
    badge: 'PREMIER',
    description: 'High-visibility electric volt match ball with flight radar contours and purple swoosh.',
    price: 1400,
    theme: {
      baseColor: '#eaf846',
      panelColor: '#6b21a8',
      trimColor: '#f97316',
      seamColor: '#18181b',
      textColor: '#18181b',
      brandLabel: 'FLIGHT',
      subLabel: 'RADAR ACADEMY',
      style: 'pl_radar',
    },
  },
  {
    id: 'solar_flare_target_rings',
    name: 'Solar Flare Target',
    badge: 'RETRO',
    description: 'Blazing orange and electric yellow bullseye rings with obsidian carbon accents.',
    price: 1600,
    theme: {
      baseColor: '#ffedd5',
      panelColor: '#ea580c',
      trimColor: '#facc15',
      seamColor: '#431407',
      textColor: '#ffffff',
      brandLabel: 'SOLAR',
      subLabel: 'STRIKER',
      style: 'target_rings',
    },
  },
  {
    id: 'infrared_premier_radar',
    name: 'Infrared Premier Radar',
    badge: 'PREMIER',
    description: 'Hyper-visible crimson and neon lime aerodynamic radar contours for winter floodlights.',
    price: 1800,
    theme: {
      baseColor: '#ff2a55',
      panelColor: '#10b981',
      trimColor: '#ffffff',
      seamColor: '#09090b',
      textColor: '#ffffff',
      brandLabel: 'PREMIER',
      subLabel: 'WINTER HI-VIS',
      style: 'pl_radar',
    },
  },

  // --- TIER 4: HERITAGE / CHAMPIONS (2,200 - 3,500 COINS) ---
  {
    id: 'vintage_tiento_1930',
    name: '1930 World Cup Tiento',
    badge: 'HERITAGE',
    description: 'Hand-stitched full-grain cowhide leather with authentic raw rawhide laces.',
    price: 2200,
    theme: {
      baseColor: '#854d0e',
      panelColor: '#713f12',
      trimColor: '#a16207',
      seamColor: '#422006',
      textColor: '#fef08a',
      brandLabel: 'TIENTO',
      subLabel: 'URUGUAY 1930',
      style: 'vintage_leather',
    },
  },
  {
    id: 'trionda_mundial_2026',
    name: 'Trionda Mundial 2026',
    badge: 'TOURNAMENT',
    description: 'North American tournament match ball featuring flowing tri-color ribbons and stars.',
    price: 2500,
    theme: {
      baseColor: '#ffffff',
      panelColor: '#1d4ed8',
      trimColor: '#059669',
      seamColor: '#0f172a',
      textColor: '#0f172a',
      brandLabel: 'TRIONDA',
      subLabel: 'MUNDIAL 26',
      style: 'trionda',
    },
  },
  {
    id: 'royal_teal_luxury_leather',
    name: 'Royal Teal Stitched Leather',
    badge: 'LUXURY',
    description: 'Deep peacock teal luxury hexagonal leather with 3D puffed pillowed embossing.',
    price: 2800,
    theme: {
      baseColor: '#0f4c5c',
      panelColor: '#0a2f3a',
      trimColor: '#14b8a6',
      seamColor: '#042f2e',
      textColor: '#5eead4',
      brandLabel: 'EXECUTIVE',
      subLabel: 'SADDLE STITCH',
      style: 'teal_leather',
    },
  },
  {
    id: 'fevernova_blaze_2002',
    name: 'Fevernova Blaze 2002',
    badge: 'ICON',
    description: 'Iconic Asian tournament shuriken flame blades with gold and crimson energy.',
    price: 3200,
    theme: {
      baseColor: '#fdfbf7',
      panelColor: '#b91c1c',
      trimColor: '#d97706',
      seamColor: '#78350f',
      textColor: '#b91c1c',
      brandLabel: 'FEVERNOVA',
      subLabel: 'KOREA JAPAN',
      style: 'blaze',
    },
  },
  {
    id: 'champions_starball_silver',
    name: 'Champions Starball Silver',
    badge: 'ELITE',
    description: 'Iconic European midnight navy stars over brushed platinum silver thermal panels.',
    price: 3500,
    theme: {
      baseColor: '#e2e8f0',
      panelColor: '#1e3a8a',
      trimColor: '#38bdf8',
      seamColor: '#0f172a',
      textColor: '#ffffff',
      brandLabel: 'CHAMPIONS',
      subLabel: 'STARBALL',
      style: 'star',
    },
  },

  // --- TIER 5: TOURNAMENT / MASTER (4,000 - 6,500 COINS) ---
  {
    id: 'aurora_borealis_trionda',
    name: 'Aurora Borealis Trionda',
    badge: 'TOURNAMENT',
    description: 'Luminescent polar green, violet, and electric cyan ribbons dancing across pearl white.',
    price: 4200,
    theme: {
      baseColor: '#f8fafc',
      panelColor: '#10b981',
      trimColor: '#8b5cf6',
      seamColor: '#064e3b',
      textColor: '#ffffff',
      brandLabel: 'TRIONDA',
      subLabel: 'AURORA POLAR',
      style: 'trionda',
    },
  },
  {
    id: 'islamic_star_mosaic',
    name: 'Star Mosaic Damascus',
    badge: 'MASTERPIECE',
    description: 'Intricate 8-pointed geometric star tessellations with brushed gold leaf inlays.',
    price: 4600,
    theme: {
      baseColor: '#ffffff',
      panelColor: '#0d9488',
      trimColor: '#d97706',
      seamColor: '#115e59',
      textColor: '#ffffff',
      brandLabel: 'MOSAIC',
      subLabel: 'DAMASCUS GOLD',
      style: 'star_mosaic',
    },
  },
  {
    id: 'emerald_monarch_leather',
    name: 'Emerald Monarch Leather',
    badge: 'LUXURY',
    description: 'Hand-buffed imperial emerald green calfskin with gold wax saddle stitch seams.',
    price: 5000,
    theme: {
      baseColor: '#064e3b',
      panelColor: '#022c22',
      trimColor: '#f59e0b',
      seamColor: '#022c22',
      textColor: '#fef08a',
      brandLabel: 'MONARCH',
      subLabel: 'SADDLE LEATHER',
      style: 'teal_leather',
    },
  },
  {
    id: 'nordic_valkyrie_chevron',
    name: 'Nordic Valkyrie Chevron',
    badge: 'NATIONAL',
    description: 'Scandinavian arctic navy and frost cyan geometric chevron panels with silver runes.',
    price: 5500,
    theme: {
      baseColor: '#f0f9ff',
      panelColor: '#0369a1',
      trimColor: '#38bdf8',
      seamColor: '#0c4a6e',
      textColor: '#ffffff',
      brandLabel: 'VALKYRIE',
      subLabel: 'NORDIC ICE',
      style: 'usa_chevron',
    },
  },
  {
    id: 'tokyo_sakura_blossom',
    name: 'Tokyo Sakura Blossom',
    badge: 'SPECIAL',
    description: 'Delicate pastel cherry blossom petals drifting over clean white aerodynamic panels.',
    price: 6000,
    theme: {
      baseColor: '#fff1f2',
      panelColor: '#f43f5e',
      trimColor: '#fb7185',
      seamColor: '#881337',
      textColor: '#4c0519',
      brandLabel: 'SAKURA',
      subLabel: 'TOKYO EDITION',
      style: 'sakura',
    },
  },
  {
    id: 'hyper_vortex_storm',
    name: 'Hyper Vortex Storm',
    badge: 'HIGH-TECH',
    description: 'High-speed aerodynamic cyclonic spirals designed for erratic knuckleball trajectories.',
    price: 6500,
    theme: {
      baseColor: '#0f172a',
      panelColor: '#06b6d4',
      trimColor: '#3b82f6',
      seamColor: '#0284c7',
      textColor: '#ffffff',
      brandLabel: 'VORTEX',
      subLabel: 'CYCLONE PRO',
      style: 'vortex',
    },
  },

  // --- TIER 6: MYTHIC / PRESTIGE (7,500 - 12,000 COINS) ---
  {
    id: 'cyberpunk_matrix_2077',
    name: 'Cyberpunk Matrix 2077',
    badge: 'FUTURISTIC',
    description: 'Neon magenta and cyan wireframe grid pulsating over a pitch black polymer core.',
    price: 7500,
    theme: {
      baseColor: '#030712',
      panelColor: '#ec4899',
      trimColor: '#06b6d4',
      seamColor: '#111827',
      textColor: '#38bdf8',
      brandLabel: 'CYBER',
      subLabel: 'SYNTHWAVE 77',
      style: 'cyber',
    },
  },
  {
    id: 'formula_carbon_aero',
    name: 'Formula Carbon Weave',
    badge: 'PRESTIGE',
    description: 'Ultralight aeronautical carbon fiber weave reinforced with electric volt pinstripes.',
    price: 8200,
    theme: {
      baseColor: '#0f172a',
      panelColor: '#1e293b',
      trimColor: '#84cc16',
      seamColor: '#020617',
      textColor: '#bef264',
      brandLabel: 'CARBON',
      subLabel: 'FORMULA 1',
      style: 'carbon',
    },
  },
  {
    id: 'glacial_frost_subzero',
    name: 'Glacial Frost Subzero',
    badge: 'FROST',
    description: 'Permafrost ice crystal geodesics with blinding crystalline highlights and frozen seams.',
    price: 9000,
    theme: {
      baseColor: '#f0fdf4',
      panelColor: '#0284c7',
      trimColor: '#bae6fd',
      seamColor: '#0369a1',
      textColor: '#ffffff',
      brandLabel: 'SUBZERO',
      subLabel: 'PERMAFROST',
      style: 'arctic',
    },
  },
  {
    id: 'byzantine_sapphire_mosaic',
    name: 'Byzantine Sapphire Mosaic',
    badge: 'ROYAL',
    description: 'Royal sapphire blue and pure 24K gold geometric tessellations inspired by royal palaces.',
    price: 9800,
    theme: {
      baseColor: '#ffffff',
      panelColor: '#1e3a8a',
      trimColor: '#fbbf24',
      seamColor: '#172554',
      textColor: '#fef08a',
      brandLabel: 'SAPPHIRE',
      subLabel: 'BYZANTIUM',
      style: 'star_mosaic',
    },
  },
  {
    id: 'midnight_obsidian_leather',
    name: 'Midnight Obsidian Leather',
    badge: 'ULTRA LUXURY',
    description: 'Stealth obsidian black embossed full-grain leather with metallic platinum saddle stitching.',
    price: 10500,
    theme: {
      baseColor: '#09090b',
      panelColor: '#18181b',
      trimColor: '#e4e4e7',
      seamColor: '#000000',
      textColor: '#f4f4f5',
      brandLabel: 'OBSIDIAN',
      subLabel: 'NOIR EDITION',
      style: 'teal_leather',
    },
  },
  {
    id: 'ballon_dor_24k_supreme',
    name: '24K Ballon d’Or Supreme',
    badge: 'SUPREME',
    description: 'Mirror-polished 24K solid gold plating crowned with the Ballon d’Or master crest.',
    price: 12000,
    theme: {
      baseColor: '#ffd700',
      panelColor: '#b8860b',
      trimColor: '#fff8dc',
      seamColor: '#5c4033',
      textColor: '#451a03',
      brandLabel: 'BALLON D\'OR',
      subLabel: 'SUPREME 24K',
      style: 'gold',
    },
  },
];

// ============================================================================
// 24 DISTINCT STADIUM PITCH PATTERNS (SORTED BY PRICE & RARITY)
// ============================================================================
export const PITCH_PATTERN_ITEMS: PitchPatternItem[] = [
  // --- DEFAULT STARTER (0 COINS) ---
  {
    id: 'classic_stripes_default',
    name: 'Premier Vertical Stripes',
    badge: 'DEFAULT',
    description: 'Traditional Premier League manicured vertical turf stripes.',
    price: 0,
    unlockedByDefault: true,
    theme: {
      grassDark: '#1e5e22',
      grassLight: '#2e7d32',
      lineColor: '#ffffff',
      patternType: 'stripes',
    },
  },

  // --- TIER 1: COMMON / CLUB (250 - 450 COINS) ---
  {
    id: 'horizontal_turf_mow',
    name: 'Horizontal Crosscut Turf',
    badge: 'CLASSIC',
    description: 'Transverse horizontal roller striping across the full width of the pitch.',
    price: 250,
    theme: {
      grassDark: '#1b5e20',
      grassLight: '#338a3e',
      lineColor: '#ffffff',
      patternType: 'horizontal_stripes',
    },
  },
  {
    id: 'checkerboard_pro_lawn',
    name: 'Classic Checkerboard',
    badge: 'PRO',
    description: 'Precision dual-directional checkerboard lawn mower cut.',
    price: 350,
    theme: {
      grassDark: '#19571e',
      grassLight: '#2f8238',
      lineColor: '#ffffff',
      patternType: 'checkerboard',
    },
  },
  {
    id: 'diagonal_blades_pitch',
    name: 'Diagonal Cross Stripes',
    badge: 'DYNAMIC',
    description: 'Sharp 45-degree diagonal turf bands flowing dynamically across the field.',
    price: 450,
    theme: {
      grassDark: '#1d5422',
      grassLight: '#358a3e',
      lineColor: '#ffffff',
      patternType: 'diagonal_stripes',
    },
  },

  // --- TIER 2: SEMI-PRO / PATTERN (600 - 950 COINS) ---
  {
    id: 'concentric_rings_bullseye',
    name: 'Concentric Center Rings',
    badge: 'RINGS',
    description: 'Hypnotic concentric circular bands radiating outwards from the penalty spot.',
    price: 600,
    theme: {
      grassDark: '#164e1c',
      grassLight: '#2c7a33',
      lineColor: '#ffffff',
      patternType: 'rings',
    },
  },
  {
    id: 'diamond_cut_emerald',
    name: 'Diamond Harlequin Turf',
    badge: 'GEOMETRIC',
    description: 'Interlocking 45-degree diamond harlequin prisms across the entire pitch.',
    price: 750,
    theme: {
      grassDark: '#144d1a',
      grassLight: '#2d8435',
      lineColor: '#ffffff',
      patternType: 'diamond',
    },
  },
  {
    id: 'chevron_speed_turf',
    name: 'Forward Chevron V-Pattern',
    badge: 'SPEED',
    description: 'Aggressive forward-pointing V-cut chevrons aimed directly toward the goal.',
    price: 850,
    theme: {
      grassDark: '#18521d',
      grassLight: '#32873a',
      lineColor: '#ffffff',
      patternType: 'chevron',
    },
  },
  {
    id: 'hexagonal_honeycomb_pitch',
    name: 'Hexagonal Honeycomb Lawn',
    badge: 'MODERN',
    description: 'Futuristic interlocking hexagonal cells creating a high-tech stadium grid.',
    price: 950,
    theme: {
      grassDark: '#17501c',
      grassLight: '#2f8538',
      lineColor: '#ffffff',
      patternType: 'hexagonal',
    },
  },

  // --- TIER 3: NATIONAL / PREMIER (1,200 - 1,800 COINS) ---
  {
    id: 'cross_hatch_championship',
    name: 'Championship Cross-Hatch',
    badge: 'ELITE',
    description: 'High-density micro cross-hatch turf weave used in major cup finals.',
    price: 1200,
    theme: {
      grassDark: '#134717',
      grassLight: '#2b7e31',
      lineColor: '#ffffff',
      patternType: 'cross_hatch',
    },
  },
  {
    id: 'emerald_gem_facets',
    name: 'Emerald Facet Prism',
    badge: 'JEWEL',
    description: 'Deep royal emerald facets glistening under high-output stadium floodlights.',
    price: 1450,
    theme: {
      grassDark: '#0e3d13',
      grassLight: '#23732a',
      lineColor: '#f0fdf4',
      patternType: 'emerald',
    },
  },
  {
    id: 'oceanic_waves_pitch',
    name: 'Oceanic Tidal Waves',
    badge: 'FLOW',
    description: 'Organic curving sinusoidal wave bands undulating across the playing surface.',
    price: 1700,
    theme: {
      grassDark: '#114a22',
      grassLight: '#27803a',
      lineColor: '#ffffff',
      patternType: 'waves',
    },
  },

  // --- TIER 4: TOURNAMENT / HERITAGE (2,200 - 3,500 COINS) ---
  {
    id: 'starburst_flame_stadium',
    name: 'Radiant Starburst Arena',
    badge: 'TOURNAMENT',
    description: 'Explosive radial starburst sunbeams radiating outwards from the goalmouth.',
    price: 2200,
    theme: {
      grassDark: '#16531c',
      grassLight: '#348e3e',
      lineColor: '#ffffff',
      patternType: 'starburst',
    },
  },
  {
    id: 'quadrant_tactical_zones',
    name: 'Tactical Quadrant Grid',
    badge: 'TACTICAL',
    description: 'Master tactical coaching quadrants dividing the field into precision zones.',
    price: 2700,
    theme: {
      grassDark: '#154e1a',
      grassLight: '#2d8234',
      lineColor: '#ffffff',
      patternType: 'quadrant',
    },
  },
  {
    id: 'boxes_mosaic_mosaic',
    name: 'Boxes Mosaic Grid',
    badge: 'MOSAIC',
    description: 'Nested geometric rectangular boxes creating a structured modern carpet.',
    price: 3200,
    theme: {
      grassDark: '#124817',
      grassLight: '#2c7f32',
      lineColor: '#ffffff',
      patternType: 'boxes',
    },
  },

  // --- TIER 5: MASTER / LUXURY (4,200 - 6,500 COINS) ---
  {
    id: 'scottish_tartan_plaid',
    name: 'Scottish Highland Tartan',
    badge: 'HERITAGE',
    description: 'Traditional interlocking tartan plaid woven by precision stadium agronomists.',
    price: 4200,
    theme: {
      grassDark: '#0f3f14',
      grassLight: '#26772d',
      lineColor: '#ffffff',
      patternType: 'tartan',
    },
  },
  {
    id: 'cyber_circuits_pitch',
    name: 'Cyber Circuit Board',
    badge: 'CYBER',
    description: 'Bioluminescent cybernetic motherboard circuit traces etched into dark turf.',
    price: 5000,
    theme: {
      grassDark: '#0a3011',
      grassLight: '#1d6323',
      lineColor: '#86efac',
      patternType: 'circuits',
    },
  },
  {
    id: 'spiral_galaxy_vortex',
    name: 'Spiral Galaxy Vortex',
    badge: 'COSMIC',
    description: 'Hypnotic logarithmic spiral arms sweeping seamlessly around the center circle.',
    price: 5800,
    theme: {
      grassDark: '#114619',
      grassLight: '#2d8438',
      lineColor: '#ffffff',
      patternType: 'spiral',
    },
  },
  {
    id: 'sunburst_zenith_arena',
    name: 'Sunburst Zenith Arena',
    badge: 'PRESTIGE',
    description: 'Solar flare fan beams radiating across the full pitch from penalty line to half.',
    price: 6500,
    theme: {
      grassDark: '#18561f',
      grassLight: '#389643',
      lineColor: '#fef08a',
      patternType: 'sunburst',
    },
  },

  // --- TIER 6: MYTHIC / MASTERPIECE (7,800 - 12,000 COINS) ---
  {
    id: 'herringbone_elite_parquet',
    name: 'Herringbone Royal Parquet',
    badge: 'ROYAL',
    description: 'Intricate angled herringbone parquet weave worthy of the world championship final.',
    price: 7800,
    theme: {
      grassDark: '#0e3b12',
      grassLight: '#24742a',
      lineColor: '#ffffff',
      patternType: 'herringbone',
    },
  },
  {
    id: 'fine_grid_luxury_carpet',
    name: 'Fine Micro-Grid Master',
    badge: 'MASTERPIECE',
    description: 'Ultra-high density 2-inch micro checkerboard weave crafted to millimeter perfection.',
    price: 9500,
    theme: {
      grassDark: '#0d3811',
      grassLight: '#216c27',
      lineColor: '#ffffff',
      patternType: 'fine_grid',
    },
  },
  {
    id: 'celestial_champions_arena',
    name: 'Celestial Champions Arena',
    badge: 'SUPREME',
    description: 'Grand final pristine diamond turf with gold-tinted tournament boundary lines.',
    price: 12000,
    theme: {
      grassDark: '#082f0c',
      grassLight: '#1c6522',
      lineColor: '#fde047',
      patternType: 'diamond',
    },
  },
];
