import { Country, COUNTRIES_DATA } from './countries';

export interface DivisionTierInfo {
  division: number; // 8 (lowest: Academy) to 1 (highest: Legendary)
  name: string;
  shortName: string;
  tierCategory: 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Elite' | 'Legendary';
  pointsToTransfer: number; // Points needed for promotion/transfer to next division
  pointsForTitle: number;   // Points needed to win division championship trophy
  pointsForSafety: number;  // Minimum points to avoid relegation (0 for Academy Division)
  pointsLostOnDefeat: number; // Points deducted on loss for this division tier
  totalMatches: number;     // 10 matches per season campaign
  coinRewardPromotion: number;
  coinRewardTitle: number;
  badgeColor: string;
  badgeBorder: string;
  badgeBg: string;
  description: string;
}

export const DIVISION_TIERS: Record<number, DivisionTierInfo> = {
  8: {
    division: 8,
    name: 'Academy Division',
    shortName: 'ACADEMY',
    tierCategory: 'Bronze',
    pointsToTransfer: 12,
    pointsForTitle: 16,
    pointsForSafety: 0,
    pointsLostOnDefeat: 0,
    totalMatches: 10,
    coinRewardPromotion: 250,
    coinRewardTitle: 500,
    badgeColor: 'text-amber-900',
    badgeBorder: 'border-amber-700',
    badgeBg: 'bg-amber-100',
    description: 'The starting proving ground for aspiring free kick talents.',
  },
  7: {
    division: 7,
    name: 'Amateur Division',
    shortName: 'AMATEUR',
    tierCategory: 'Bronze',
    pointsToTransfer: 13,
    pointsForTitle: 17,
    pointsForSafety: 4,
    pointsLostOnDefeat: 0,
    totalMatches: 10,
    coinRewardPromotion: 350,
    coinRewardTitle: 650,
    badgeColor: 'text-amber-950',
    badgeBorder: 'border-amber-800',
    badgeBg: 'bg-amber-200',
    description: 'Local competition heats up with sharper goalkeepers and tighter walls.',
  },
  6: {
    division: 6,
    name: 'Division 4',
    shortName: 'DIV 4',
    tierCategory: 'Silver',
    pointsToTransfer: 14,
    pointsForTitle: 18,
    pointsForSafety: 5,
    pointsLostOnDefeat: 1,
    totalMatches: 10,
    coinRewardPromotion: 450,
    coinRewardTitle: 850,
    badgeColor: 'text-slate-800',
    badgeBorder: 'border-slate-600',
    badgeBg: 'bg-slate-200',
    description: 'Disciplined defenders and agile keepers test your curve precision.',
  },
  5: {
    division: 5,
    name: 'Division 3',
    shortName: 'DIV 3',
    tierCategory: 'Silver',
    pointsToTransfer: 15,
    pointsForTitle: 19,
    pointsForSafety: 6,
    pointsLostOnDefeat: 1,
    totalMatches: 10,
    coinRewardPromotion: 600,
    coinRewardTitle: 1100,
    badgeColor: 'text-sky-900',
    badgeBorder: 'border-sky-600',
    badgeBg: 'bg-sky-100',
    description: 'High-intensity regional contenders battling for national prestige.',
  },
  4: {
    division: 4,
    name: 'Division 2',
    shortName: 'DIV 2',
    tierCategory: 'Gold',
    pointsToTransfer: 16,
    pointsForTitle: 20,
    pointsForSafety: 7,
    pointsLostOnDefeat: 1,
    totalMatches: 10,
    coinRewardPromotion: 750,
    coinRewardTitle: 1400,
    badgeColor: 'text-yellow-900',
    badgeBorder: 'border-yellow-600',
    badgeBg: 'bg-yellow-100',
    description: 'Nationwide spotlight with elite shot-stopping reactions and compact walls.',
  },
  3: {
    division: 3,
    name: 'Division 1',
    shortName: 'DIV 1',
    tierCategory: 'Gold',
    pointsToTransfer: 17,
    pointsForTitle: 21,
    pointsForSafety: 8,
    pointsLostOnDefeat: 2,
    totalMatches: 10,
    coinRewardPromotion: 950,
    coinRewardTitle: 1800,
    badgeColor: 'text-emerald-950',
    badgeBorder: 'border-emerald-700',
    badgeBg: 'bg-emerald-200',
    description: 'Top flight arena where every set piece can dictate championship dreams.',
  },
  2: {
    division: 2,
    name: 'Elite Division',
    shortName: 'ELITE',
    tierCategory: 'Diamond',
    pointsToTransfer: 18,
    pointsForTitle: 22,
    pointsForSafety: 9,
    pointsLostOnDefeat: 2,
    totalMatches: 10,
    coinRewardPromotion: 1300,
    coinRewardTitle: 2400,
    badgeColor: 'text-indigo-950',
    badgeBorder: 'border-indigo-600',
    badgeBg: 'bg-indigo-200',
    description: 'One step away from legendary immortality. Punishing wall setups and reflex keepers.',
  },
  1: {
    division: 1,
    name: 'Legendary Division',
    shortName: 'LEGENDARY',
    tierCategory: 'Legendary',
    pointsToTransfer: 99, // Pinnacle division
    pointsForTitle: 24,
    pointsForSafety: 10,
    pointsLostOnDefeat: 3,
    totalMatches: 10,
    coinRewardPromotion: 0,
    coinRewardTitle: 3500,
    badgeColor: 'text-purple-950',
    badgeBorder: 'border-purple-700',
    badgeBg: 'bg-gradient-to-r from-amber-200 via-yellow-300 to-purple-200',
    description: 'The pinnacle of free kick mastery. Dominate the world and lift the crown.',
  },
};

export interface DivisionMatchHistoryItem {
  id: string;
  divisionNumber: number;
  opponentCountry: Country;
  userScore: number;
  opponentScore: number;
  result: 'win' | 'draw' | 'loss';
  pointsEarned: number;
  date: string;
  matchNumberInSeason: number;
}

export interface DivisionStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  cleanSheets: number;
  titlesWon: number;
  promotions: number;
  relegations: number;
  bestDivision: number;
  currentStreak: number; // positive for win streak, negative for loss streak
}

export interface TableRow {
  position: number;
  country: Country;
  isUser: boolean;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface DivisionState {
  currentDivision: number; // 10 is lowest (starts at 10)
  seasonNumber: number;
  currentPoints: number;
  matchesPlayedThisSeason: number;
  matchesRemaining: number;
  currentRank: number; // e.g. 1 to 10 in league table
  nextOpponent: Country;
  seasonMatches: DivisionMatchHistoryItem[];
  allTimeHistory: DivisionMatchHistoryItem[];
  stats: DivisionStats;
  leagueTable: TableRow[];
  seasonStatus: 'in_progress' | 'promoted' | 'title_won' | 'relegated' | 'held';
  pendingSeasonReward?: {
    type: 'promotion' | 'title' | 'relegation' | 'held';
    title: string;
    coins: number;
    newDivision: number;
  } | null;
}

const STORAGE_KEY = 'fkl_division_state_v3';

export function getTierInfo(division: number): DivisionTierInfo {
  return DIVISION_TIERS[division] || DIVISION_TIERS[8];
}

/**
 * Returns a random country suitable for the current division level
 */
export function getRandomCountryForDivision(divisionLevel?: number, excludeCountry?: Country | null): Country {
  const pool = excludeCountry
    ? COUNTRIES_DATA.filter((c) => c.id !== excludeCountry.id && c.code !== excludeCountry.code)
    : COUNTRIES_DATA;
  return pool[Math.floor(Math.random() * pool.length)] || COUNTRIES_DATA[0];
}

/**
 * Returns a random opponent country suitable for the current division level
 */
export function getRandomOpponentForDivision(userCountry?: Country | null): Country {
  const pool = userCountry
    ? COUNTRIES_DATA.filter((c) => c.id !== userCountry.id && c.code !== userCountry.code)
    : COUNTRIES_DATA;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generates simulated league competitors for the 10-team division table
 */
export function generateInitialLeagueTable(
  userCountry: Country,
  currentDivision: number,
  userStats?: { won: number; drawn: number; lost: number; gf: number; ga: number; pts: number }
): TableRow[] {
  const otherCountries = COUNTRIES_DATA.filter(
    (c) => c.id !== userCountry.id && c.code !== userCountry.code
  );

  // Shuffle and pick 9 opponents
  const shuffled = [...otherCountries].sort(() => 0.5 - Math.random());
  const rivalNations = shuffled.slice(0, 9);

  const played = (userStats?.won || 0) + (userStats?.drawn || 0) + (userStats?.lost || 0);

  const userRow: TableRow = {
    position: 1,
    country: userCountry,
    isUser: true,
    played: played,
    won: userStats?.won || 0,
    drawn: userStats?.drawn || 0,
    lost: userStats?.lost || 0,
    goalsFor: userStats?.gf || 0,
    goalsAgainst: userStats?.ga || 0,
    goalDifference: (userStats?.gf || 0) - (userStats?.ga || 0),
    points: userStats?.pts || 0,
  };

  const rows: TableRow[] = [userRow];

  // Base point expectations based on played matches
  rivalNations.forEach((country) => {
    // Generate realistic AI record for matches played so far
    let aiWon = 0;
    let aiDrawn = 0;
    let aiLost = 0;
    let aiGF = 0;
    let aiGA = 0;

    for (let m = 0; m < played; m++) {
      const gf = Math.floor(Math.random() * 4);
      const ga = Math.floor(Math.random() * 3);
      aiGF += gf;
      aiGA += ga;
      if (gf > ga) aiWon++;
      else if (gf === ga) aiDrawn++;
      else aiLost++;
    }

    const aiPts = aiWon * 3 + aiDrawn;

    rows.push({
      position: 0,
      country,
      isUser: false,
      played,
      won: aiWon,
      drawn: aiDrawn,
      lost: aiLost,
      goalsFor: aiGF,
      goalsAgainst: aiGA,
      goalDifference: aiGF - aiGA,
      points: aiPts,
    });
  });

  return sortLeagueTable(rows);
}

export function sortLeagueTable(rows: TableRow[]): TableRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.country.name.localeCompare(b.country.name);
  });

  return sorted.map((row, idx) => ({
    ...row,
    position: idx + 1,
  }));
}

export function getInitialDivisionState(userCountry?: Country | null): DivisionState {
  const uCountry = userCountry || COUNTRIES_DATA[0];
  const lowestDivision = 8; // Lowest division: Academy Division (8)
  const tierInfo = getTierInfo(lowestDivision);
  const nextOpp = getRandomOpponentForDivision(uCountry);
  const table = generateInitialLeagueTable(uCountry, lowestDivision, {
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    pts: 0,
  });

  return {
    currentDivision: lowestDivision,
    seasonNumber: 1,
    currentPoints: 0,
    matchesPlayedThisSeason: 0,
    matchesRemaining: tierInfo.totalMatches,
    currentRank: 10,
    nextOpponent: nextOpp,
    seasonMatches: [],
    allTimeHistory: [],
    stats: {
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
      cleanSheets: 0,
      titlesWon: 0,
      promotions: 0,
      relegations: 0,
      bestDivision: lowestDivision,
      currentStreak: 0,
    },
    leagueTable: table,
    seasonStatus: 'in_progress',
    pendingSeasonReward: null,
  };
}

export function loadDivisionState(userCountry?: Country | null): DivisionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DivisionState;
      if (parsed && typeof parsed.currentDivision === 'number') {
        // Verify division bounds (8 to 1)
        if (parsed.currentDivision < 1 || parsed.currentDivision > 8) {
          parsed.currentDivision = 8;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load division state from localStorage:', err);
  }
  return getInitialDivisionState(userCountry);
}

export function saveDivisionState(state: DivisionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save division state:', err);
  }
}

/**
 * Records a completed division match result, updates points, league table, stats, and checks promotion/relegation/title.
 */
export function recordDivisionMatchResult(
  prevState: DivisionState,
  userScore: number,
  opponentScore: number,
  opponentCountry: Country,
  userCountry: Country
): {
  updatedState: DivisionState;
  coinsEarned: number;
  eventMessage: string;
} {
  const tier = getTierInfo(prevState.currentDivision);
  const isWin = userScore > opponentScore;
  const isDraw = userScore === opponentScore;
  const isLoss = userScore < opponentScore;

  const lossPenalty = tier.pointsLostOnDefeat || 0;
  const pointsGained = isWin ? 3 : isDraw ? 1 : -lossPenalty;
  const newPoints = Math.max(0, prevState.currentPoints + pointsGained);
  const newMatchesPlayedThisSeason = prevState.matchesPlayedThisSeason + 1;
  const newMatchesRemaining = Math.max(0, tier.totalMatches - newMatchesPlayedThisSeason);

  // Match history entry
  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const matchEntry: DivisionMatchHistoryItem = {
    id: `div_match_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    divisionNumber: prevState.currentDivision,
    opponentCountry,
    userScore,
    opponentScore,
    result: isWin ? 'win' : isDraw ? 'draw' : 'loss',
    pointsEarned: pointsGained,
    date: dateStr,
    matchNumberInSeason: newMatchesPlayedThisSeason,
  };

  const updatedSeasonMatches = [matchEntry, ...prevState.seasonMatches];
  const updatedAllTimeHistory = [matchEntry, ...prevState.allTimeHistory];

  // Update All-time Stats
  const prevStats = prevState.stats;
  const newStreak = isWin
    ? Math.max(1, prevStats.currentStreak > 0 ? prevStats.currentStreak + 1 : 1)
    : isLoss
    ? Math.min(-1, prevStats.currentStreak < 0 ? prevStats.currentStreak - 1 : -1)
    : 0;

  const updatedStats: DivisionStats = {
    matchesPlayed: prevStats.matchesPlayed + 1,
    wins: prevStats.wins + (isWin ? 1 : 0),
    draws: prevStats.draws + (isDraw ? 1 : 0),
    losses: prevStats.losses + (isLoss ? 1 : 0),
    goalsScored: prevStats.goalsScored + userScore,
    goalsConceded: prevStats.goalsConceded + opponentScore,
    cleanSheets: prevStats.cleanSheets + (opponentScore === 0 ? 1 : 0),
    titlesWon: prevStats.titlesWon,
    promotions: prevStats.promotions,
    relegations: prevStats.relegations,
    bestDivision: Math.min(prevStats.bestDivision, prevState.currentDivision),
    currentStreak: newStreak,
  };

  // Base coin earnings for the match: 10 coins on Win, 0 coins on Draw, 0 coins on Loss
  let baseCoins = isWin ? 10 : 0;

  // Update League Table
  let currentTable = [...prevState.leagueTable];
  if (currentTable.length === 0) {
    currentTable = generateInitialLeagueTable(userCountry, prevState.currentDivision);
  }

  // Update user in table and simulate rivals
  currentTable = currentTable.map((row) => {
    if (row.isUser) {
      const gf = row.goalsFor + userScore;
      const ga = row.goalsAgainst + opponentScore;
      return {
        ...row,
        played: row.played + 1,
        won: row.won + (isWin ? 1 : 0),
        drawn: row.drawn + (isDraw ? 1 : 0),
        lost: row.lost + (isLoss ? 1 : 0),
        goalsFor: gf,
        goalsAgainst: ga,
        goalDifference: gf - ga,
        points: row.points + pointsGained,
      };
    } else {
      // Simulate rival match
      const rivalGF = Math.floor(Math.random() * 3);
      const rivalGA = Math.floor(Math.random() * 3);
      const rivalWon = rivalGF > rivalGA ? 1 : 0;
      const rivalDrawn = rivalGF === rivalGA ? 1 : 0;
      const rivalLost = rivalGF < rivalGA ? 1 : 0;
      const pts = rivalWon * 3 + rivalDrawn;
      const gf = row.goalsFor + rivalGF;
      const ga = row.goalsAgainst + rivalGA;
      return {
        ...row,
        played: row.played + 1,
        won: row.won + rivalWon,
        drawn: row.drawn + rivalDrawn,
        lost: row.lost + rivalLost,
        goalsFor: gf,
        goalsAgainst: ga,
        goalDifference: gf - ga,
        points: row.points + pts,
      };
    }
  });

  const sortedTable = sortLeagueTable(currentTable);
  const userRank = sortedTable.find((r) => r.isUser)?.position || 1;

  // Check Season Outcomes (Early Promotion, Title, Relegation or Season End)
  let seasonStatus: DivisionState['seasonStatus'] = 'in_progress';
  let pendingSeasonReward: DivisionState['pendingSeasonReward'] = null;
  let eventMessage = isWin
    ? 'Victory! +3 Points • +10 🪙'
    : isDraw
    ? 'Draw! +1 Point • 0 🪙'
    : lossPenalty > 0
    ? `Defeat! -${lossPenalty} Points • 0 🪙`
    : 'Defeat! +0 Points • 0 🪙';

  const isTitleWon = newPoints >= tier.pointsForTitle;
  const isTransferEarned = newPoints >= tier.pointsToTransfer && prevState.currentDivision > 1;
  const isSeasonOver = newMatchesRemaining === 0;

  if (isTitleWon) {
    seasonStatus = 'title_won';
    const nextDiv = Math.max(1, prevState.currentDivision - 1);
    const nextTier = getTierInfo(nextDiv);
    updatedStats.titlesWon += 1;
    if (prevState.currentDivision > 1) updatedStats.promotions += 1;
    updatedStats.bestDivision = Math.min(updatedStats.bestDivision, nextDiv);

    baseCoins += tier.coinRewardTitle;
    pendingSeasonReward = {
      type: 'title',
      title: `${tier.name.toUpperCase()} CHAMPIONS!`,
      coins: tier.coinRewardTitle,
      newDivision: nextDiv,
    };
    eventMessage = `🏆 Title Won! Promoted to ${nextTier.name}!`;
  } else if (isTransferEarned) {
    seasonStatus = 'promoted';
    const nextDiv = Math.max(1, prevState.currentDivision - 1);
    const nextTier = getTierInfo(nextDiv);
    updatedStats.promotions += 1;
    updatedStats.bestDivision = Math.min(updatedStats.bestDivision, nextDiv);

    baseCoins += tier.coinRewardPromotion;
    pendingSeasonReward = {
      type: 'promotion',
      title: `PROMOTED TO ${nextTier.name.toUpperCase()}!`,
      coins: tier.coinRewardPromotion,
      newDivision: nextDiv,
    };
    eventMessage = `🚀 Promotion Achieved! Welcome to ${nextTier.name}!`;
  } else if (isSeasonOver) {
    // Season ended without early promotion
    if (prevState.currentDivision < 8 && newPoints < tier.pointsForSafety) {
      // Relegated to lower division
      seasonStatus = 'relegated';
      const demotedDiv = Math.min(8, prevState.currentDivision + 1);
      const demotedTier = getTierInfo(demotedDiv);
      updatedStats.relegations += 1;
      pendingSeasonReward = {
        type: 'relegation',
        title: `RELEGATED TO ${demotedTier.name.toUpperCase()}`,
        coins: 50,
        newDivision: demotedDiv,
      };
      eventMessage = `⚠️ Relegated to ${demotedTier.name}. Fight back next season!`;
    } else {
      // Held in same division
      seasonStatus = 'held';
      pendingSeasonReward = {
        type: 'held',
        title: `${tier.name.toUpperCase()} RETAINED`,
        coins: 100,
        newDivision: prevState.currentDivision,
      };
      eventMessage = `Campaign completed. Retained ${tier.name}.`;
    }
  }

  const nextOpp = getRandomOpponentForDivision(userCountry);

  const updatedState: DivisionState = {
    ...prevState,
    currentPoints: newPoints,
    matchesPlayedThisSeason: newMatchesPlayedThisSeason,
    matchesRemaining: newMatchesRemaining,
    currentRank: userRank,
    nextOpponent: nextOpp,
    seasonMatches: updatedSeasonMatches,
    allTimeHistory: updatedAllTimeHistory,
    stats: updatedStats,
    leagueTable: sortedTable,
    seasonStatus,
    pendingSeasonReward,
  };

  saveDivisionState(updatedState);

  return {
    updatedState,
    coinsEarned: baseCoins,
    eventMessage,
  };
}

/**
 * Resets campaign for the new season (after promotion, title, or retention)
 */
export function startNewSeason(
  prevState: DivisionState,
  newDivision: number,
  userCountry: Country
): DivisionState {
  const tier = getTierInfo(newDivision);
  const nextOpp = getRandomOpponentForDivision(userCountry);
  const newTable = generateInitialLeagueTable(userCountry, newDivision);

  const state: DivisionState = {
    ...prevState,
    currentDivision: newDivision,
    seasonNumber: prevState.seasonNumber + 1,
    currentPoints: 0,
    matchesPlayedThisSeason: 0,
    matchesRemaining: tier.totalMatches,
    currentRank: 10,
    nextOpponent: nextOpp,
    seasonMatches: [],
    leagueTable: newTable,
    seasonStatus: 'in_progress',
    pendingSeasonReward: null,
  };

  saveDivisionState(state);
  return state;
}
