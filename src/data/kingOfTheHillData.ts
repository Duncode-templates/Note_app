import { Country, COUNTRIES_DATA } from './countries';
import { KingOfTheHillContender, KingOfTheHillMatchState } from '../types';
import { getRandomBotProfile } from './botProfiles';
import { FREE_KICK_POSITIONS, FreeKickPosition } from '../components/Stadium3DView';

export interface KingWagerTier {
  id: 'free' | 'rookie' | 'pro' | 'champion';
  name: string;
  entryFee: number;
  prizePot4P: number;
  prizePot: number;
  badge: string;
  color: string;
}

export const KING_WAGER_TIERS: KingWagerTier[] = [
  {
    id: 'free',
    name: 'Free Kick Battle',
    entryFee: 0,
    prizePot4P: 30,
    prizePot: 30,
    badge: 'FREE',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'rookie',
    name: 'Rookie Contenders',
    entryFee: 50,
    prizePot4P: 200,
    prizePot: 200,
    badge: 'ROOKIE',
    color: 'from-sky-400 to-blue-500',
  },
  {
    id: 'pro',
    name: 'Pro Knockout Arena',
    entryFee: 250,
    prizePot4P: 1000,
    prizePot: 1000,
    badge: 'PRO',
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: 'champion',
    name: 'Crown of Champions',
    entryFee: 1000,
    prizePot4P: 4000,
    prizePot: 4000,
    badge: 'LEGEND',
    color: 'from-purple-500 to-rose-500',
  },
];

export interface KingRoundConfig {
  roundNumber: number;
  title: string;
  description: string;
  positionIndex: number;
  eliminateCount4P: number;
  timeLimitSec: number;
}

export const KING_ROUNDS_4P: KingRoundConfig[] = [
  {
    roundNumber: 1,
    title: 'ROUND 1: QUARTERFINAL (4 PLAYERS)',
    description: 'Each contender shoots 5 balls across 5 random positions. Lowest scorer is eliminated!',
    positionIndex: 18, // Default fallback
    eliminateCount4P: 1,
    timeLimitSec: 10,
  },
  {
    roundNumber: 2,
    title: 'ROUND 2: SEMIFINAL (3 PLAYERS)',
    description: '3 Contenders battle across 5 new random positions! Lowest scorer is eliminated!',
    positionIndex: 13,
    eliminateCount4P: 1,
    timeLimitSec: 10,
  },
  {
    roundNumber: 3,
    title: 'ROUND 3: GRAND FINAL (1V1)',
    description: 'Championship Decider across 5 random positions! Lowest scorer is eliminated, King crowned!',
    positionIndex: 8,
    eliminateCount4P: 1,
    timeLimitSec: 10,
  },
];

/**
 * Generates a fully randomized, shuffled sequence of all 30 free kick pitch positions.
 * Guarantees every single play / kick throughout King of the Hill draws a completely
 * distinct pitch position without repeating positions or having contenders share the same spot.
 */
export function generateShuffledPlayPositions(count = 30): number[] {
  const total = FREE_KICK_POSITIONS.length; // 30 available positions (0 to 29)
  const pool = Array.from({ length: total }, (_, i) => i);

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}

/**
 * Selects 5 distinct, random free kick positions for a round.
 * Guarantees no duplicate positions within the round so that each of the 5 balls
 * is shot from a completely unique pitch position, looping through all 5 positions.
 */
export function generateRandomRoundPositions(count = 5, excludeIndices?: number[]): number[] {
  const total = FREE_KICK_POSITIONS.length; // 30 available positions (0 to 29)
  const available = Array.from({ length: total }, (_, i) => i)
    .filter((i) => !excludeIndices || !excludeIndices.includes(i));

  // If available pool has enough items, use it; otherwise reset to full pool
  const pool = available.length >= count ? [...available] : Array.from({ length: total }, (_, i) => i);

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}

/**
 * Generates initial roster of contenders for the King of the Hill lobby (always 4 contenders)
 */
export function generateKingOfTheHillContenders(
  localPlayerName: string,
  localPlayerCountry: Country,
  localPlayerAvatar?: string | null,
  playerCount: 4 = 4
): KingOfTheHillContender[] {
  const contenders: KingOfTheHillContender[] = [];

  // Add Local Player
  contenders.push({
    id: 'local_player',
    name: localPlayerName || 'Striker_Legend',
    countryCode: localPlayerCountry.code,
    countryName: localPlayerCountry.name,
    avatarUrl: localPlayerAvatar || null,
    isLocalPlayer: true,
    isBot: false,
    isEliminated: false,
    currentRoundScore: 0,
    currentRoundGoals: 0,
    currentRoundShots: [],
    currentRoundOutcome: 'waiting',
    roundScores: [],
    roundGoals: [],
    roundOutcomes: [],
    totalScore: 0,
    totalGoals: 0,
  });

  // Generate Distinct AI Contenders from Realistic Bot Roster (3 AI opponents for 4 total players)
  const usedCountryCodes = new Set<string>([localPlayerCountry.code.toLowerCase()]);
  const availableCountries = COUNTRIES_DATA.filter(
    (c) => c.code.toLowerCase() !== localPlayerCountry.code.toLowerCase()
  );

  const neededBots = 3;
  for (let i = 0; i < neededBots; i++) {
    const bot = getRandomBotProfile();
    // Pick unique country
    let country = availableCountries.find((c) => !usedCountryCodes.has(c.code.toLowerCase()));
    if (!country) {
      country = availableCountries[Math.floor(Math.random() * availableCountries.length)];
    }
    usedCountryCodes.add(country.code.toLowerCase());

    contenders.push({
      id: `bot_${bot.id}_${i}_${Math.random().toString(36).substr(2, 4)}`,
      name: bot.username,
      countryCode: country.code,
      countryName: country.name,
      avatarUrl: bot.avatarUrl,
      isLocalPlayer: false,
      isBot: true,
      isEliminated: false,
      currentRoundScore: 0,
      currentRoundGoals: 0,
      currentRoundShots: [],
      currentRoundOutcome: 'waiting',
      roundScores: [],
      roundGoals: [],
      roundOutcomes: [],
      totalScore: 0,
      totalGoals: 0,
    });
  }

  return contenders;
}

/**
 * Initializes a new King of the Hill tournament match state (always 4 players)
 */
export function createKingOfTheHillMatch(
  localPlayerName: string,
  localPlayerCountry: Country,
  localPlayerAvatar?: string | null,
  playerCount: 4 = 4,
  tierId: 'free' | 'rookie' | 'pro' | 'champion' = 'free',
  existingContenders?: KingOfTheHillContender[]
): KingOfTheHillMatchState {
  const selectedTier = KING_WAGER_TIERS.find((t) => t.id === tierId) || KING_WAGER_TIERS[0];
  const prizePot = selectedTier.prizePot;
  const rounds = KING_ROUNDS_4P;
  const firstRound = rounds[0];

  const contenders =
    existingContenders && existingContenders.length === 4
      ? existingContenders.map((c) => ({
          ...c,
          isEliminated: false,
          eliminatedInRound: undefined,
          currentRoundScore: 0,
          currentRoundGoals: 0,
          currentRoundShots: [],
          currentRoundOutcome: 'waiting' as const,
          currentRoundDetails: undefined,
          roundScores: [],
          roundGoals: [],
          roundOutcomes: [],
          totalScore: 0,
          totalGoals: 0,
        }))
      : generateKingOfTheHillContenders(
          localPlayerName,
          localPlayerCountry,
          localPlayerAvatar,
          4
        );

  // When existingContenders are passed (e.g. from online lobby), preserve their exact order
  // so the room leader remains at index 0. Only reorder if auto-generating offline contenders.
  const localPlayerIndex = contenders.findIndex((c) => c.isLocalPlayer);
  let sortedContenders = [...contenders];
  if (!existingContenders && localPlayerIndex > 0) {
    const [localP] = sortedContenders.splice(localPlayerIndex, 1);
    sortedContenders.unshift(localP);
  }

  // Generate fully randomized play positions across all 30 pitch positions
  const shuffledPositions = generateShuffledPlayPositions(30);

  return {
    matchId: `koth_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    playerCount: 4,
    currentRound: 1,
    totalRounds: rounds.length,
    wagerTier: tierId,
    entryFee: selectedTier.entryFee,
    prizePot,
    contenders: sortedContenders,
    roundTimeLeft: firstRound.timeLimitSec,
    status: 'round_active',
    positionIndex: shuffledPositions[0],
    roundPositions: shuffledPositions,
    roundTitle: firstRound.title,
    roundDescription: firstRound.description,
    eliminatedCountThisRound: firstRound.eliminateCount4P,
    activeContenderId: sortedContenders[0]?.id,
    activeShotIndex: 0,
  };
}

/**
 * Simulates a realistic shot for an AI contender in King of the Hill
 */
export function simulateBotKingShot(roundNumber: number): {
  outcome: 'goal' | 'save' | 'post' | 'miss';
  score: number;
  details: string;
} {
  // Goal probability: AI contenders are sharp and competitive, scoring consistently
  const goalProb = roundNumber === 1 ? 0.82 : roundNumber === 2 ? 0.78 : roundNumber === 3 ? 0.74 : 0.70;
  const roll = Math.random();

  if (roll < goalProb) {
    // Goal scored! Calculate precision score (550 - 980)
    const qualityRoll = Math.random();
    let score = 550;
    let details = 'Standard Goal';

    if (qualityRoll > 0.85) {
      score = 900 + Math.floor(Math.random() * 85);
      details = 'Top Corner Rocket';
    } else if (qualityRoll > 0.60) {
      score = 780 + Math.floor(Math.random() * 110);
      details = 'Upper Side Netting';
    } else if (qualityRoll > 0.30) {
      score = 650 + Math.floor(Math.random() * 90);
      details = 'Clean Strike';
    } else {
      score = 520 + Math.floor(Math.random() * 60);
      details = 'Low Driven Finish';
    }

    return { outcome: 'goal', score, details };
  } else if (roll < goalProb + 0.16) {
    // Saved by GK
    return { outcome: 'save', score: 50, details: 'Goalkeeper Parried' };
  } else if (roll < goalProb + 0.22) {
    // Hit Post / Crossbar
    return { outcome: 'post', score: 100, details: 'Hit Woodwork!' };
  } else {
    // Missed
    return { outcome: 'miss', score: 0, details: 'Shot Wide / Over' };
  }
}

/**
 * Calculates user shot score based on outcome, distance, power, and placement
 */
export function calculateUserKingShotScore(
  isGoal: boolean,
  outcomeText: string,
  powerRatio: number,
  isBullseye = false
): { score: number; outcome: 'goal' | 'save' | 'post' | 'miss'; details: string } {
  if (isGoal) {
    let base = 600;
    let bonus = Math.floor(powerRatio * 200);
    let details = 'Goal Scored';

    if (isBullseye || outcomeText.toLowerCase().includes('top') || outcomeText.toLowerCase().includes('corner') || outcomeText.toLowerCase().includes('upper')) {
      base = 800;
      bonus += 150;
      details = 'Top Corner Screamer!';
    } else if (outcomeText.toLowerCase().includes('swerved') || outcomeText.toLowerCase().includes('curled')) {
      base = 720;
      bonus += 100;
      details = 'Curled Masterclass';
    } else if (outcomeText.toLowerCase().includes('power') || powerRatio > 0.8) {
      base = 700;
      bonus += 80;
      details = 'Power Rocket';
    }

    const score = Math.min(1000, base + bonus);
    return { score, outcome: 'goal', details };
  }

  const lower = outcomeText.toLowerCase();
  if (lower.includes('post') || lower.includes('crossbar') || lower.includes('woodwork')) {
    return { score: 100, outcome: 'post', details: 'Hit Woodwork' };
  }
  if (lower.includes('save') || lower.includes('caught') || lower.includes('fingertip') || lower.includes('parried')) {
    return { score: 50, outcome: 'save', details: 'Goalkeeper Save' };
  }
  return { score: 0, outcome: 'miss', details: 'Shot Missed' };
}
