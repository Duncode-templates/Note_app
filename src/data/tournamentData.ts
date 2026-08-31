import { Country, COUNTRIES_DATA } from './countries';
import { crazyGamesSDK } from '../utils/crazyGamesSDK';

export type GroupLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';

export const GROUP_LETTERS: GroupLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export interface GroupTeamStanding {
  country: Country;
  group: GroupLetter;
  seed: number;
  mp: number; // Matches Played
  w: number;  // Wins
  d: number;  // Draws
  l: number;  // Losses
  gf: number; // Goals For
  ga: number; // Goals Against
  gd: number; // Goal Difference
  pts: number; // Points
}

export type TournamentStageType =
  | 'group'
  | 'round_of_16'
  | 'quarter_final'
  | 'semi_final'
  | 'final'
  | 'champion'
  | 'eliminated';

export interface TournamentMatch {
  id: string;
  group?: GroupLetter;
  matchday?: number; // 1, 2, 3 for group stage
  stage: 'group' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'final';
  stageName: string;
  homeTeam: Country;
  awayTeam: Country;
  homeScore?: number;
  awayScore?: number;
  isCompleted: boolean;
  isUserMatch: boolean;
}

export interface KnockoutMatch {
  id: string;
  stage: 'round_of_16' | 'quarter_final' | 'semi_final' | 'final';
  stageName: string;
  matchIndex: number; // index within current round (0..7 for R16, 0..3 for QF, 0..1 for SF, 0 for Final)
  homeTeam: Country | null;
  awayTeam: Country | null;
  homeScore?: number;
  awayScore?: number;
  homePenalties?: number;
  awayPenalties?: number;
  winner?: Country;
  isCompleted: boolean;
  isUserMatch: boolean;
  nextMatchId?: string;
  nextSlot?: 'home' | 'away';
}

export interface CompletedRoundData {
  stage: 'group_md1' | 'group_md2' | 'group_md3' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'final';
  stageTitle: string;
  userMatch: {
    homeTeam: Country;
    awayTeam: Country;
    homeScore: number;
    awayScore: number;
    homePenalties?: number;
    awayPenalties?: number;
    isUserWinner: boolean;
  };
  otherMatches: {
    id: string;
    stageName: string;
    homeTeam: Country;
    awayTeam: Country;
    homeScore: number;
    awayScore: number;
    homePenalties?: number;
    awayPenalties?: number;
    winner?: Country;
  }[];
}

export interface TournamentState {
  userCountry: Country;
  userGroup: GroupLetter;
  currentStage: TournamentStageType;
  currentMatchday: number; // 1, 2, 3 in group stage
  groups: Record<GroupLetter, GroupTeamStanding[]>;
  groupMatches: TournamentMatch[];
  knockoutMatches: KnockoutMatch[];
  isUserEliminated: boolean;
  isUserChampion: boolean;
  latestCompletedRound?: CompletedRoundData;
}

// 40 Qualified World Cup Countries pool
export const QUALIFIED_WORLD_CUP_CODES = [
  'us', 'ch', 'sn', 'sa',
  'mx', 'it', 'kr', 'ng',
  'ca', 'de', 'eg', 'au',
  'ar', 'at', 'dz', 'uz',
  'fr', 'uy', 'ci', 'qa',
  'es', 'co', 'cm', 'iq',
  'gb-eng', 'ec', 'ma', 'ir',
  'br', 'dk', 'gh', 'jp',
  'be', 'hr', 'ml', 'cr',
  'pt', 'nl', 'za', 'jm',
];

// Retrieve the 40 qualified country objects
export const QUALIFIED_WORLD_CUP_COUNTRIES: Country[] = [];

QUALIFIED_WORLD_CUP_CODES.forEach((code) => {
  const match = COUNTRIES_DATA.find((c) => c.code.toLowerCase() === code.toLowerCase());
  if (match && !QUALIFIED_WORLD_CUP_COUNTRIES.some((c) => c.id === match.id)) {
    QUALIFIED_WORLD_CUP_COUNTRIES.push(match);
  }
});

// Helper: Shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Generates a realistic score simulation between two AI countries with dynamic unpredictability
export function simulateScore(
  home: Country,
  away: Country,
  isKnockout = false
): {
  homeScore: number;
  awayScore: number;
  homePenalties?: number;
  awayPenalties?: number;
  winner?: Country;
} {
  // Moderate rating impact with high random variance so any team can cause upsets
  const ratingDiff = (home.rankPoints - away.rankPoints) / 18;
  const chaosFactor = (Math.random() - 0.5) * 1.6;

  let homeExp = 1.3 + (ratingDiff + chaosFactor) * 0.45;
  let awayExp = 1.2 - (ratingDiff + chaosFactor) * 0.45;

  homeExp = Math.max(0.4, Math.min(3.2, homeExp));
  awayExp = Math.max(0.3, Math.min(3.0, awayExp));

  const generateGoals = (lambda: number) => {
    const rand = Math.random();
    if (rand < 0.28) return Math.floor(lambda * 0.5);
    if (rand < 0.65) return Math.round(lambda);
    if (rand < 0.86) return Math.round(lambda + 1);
    if (rand < 0.96) return Math.round(lambda + 2);
    return Math.round(lambda + 3);
  };

  let homeScore = Math.max(0, Math.min(6, generateGoals(homeExp)));
  let awayScore = Math.max(0, Math.min(6, generateGoals(awayExp)));

  if (isKnockout && homeScore === awayScore) {
    // Penalty shootout
    const penBias = ratingDiff * 0.15;
    let homePen = 4 + (Math.random() > 0.5 - penBias ? 1 : 0);
    let awayPen = 4 + (Math.random() > 0.5 + penBias ? 1 : 0);

    if (homePen === awayPen) {
      if (Math.random() > 0.5 - penBias) homePen += 1;
      else awayPen += 1;
    }

    const winner = homePen > awayPen ? home : away;
    return { homeScore, awayScore, homePenalties: homePen, awayPenalties: awayPen, winner };
  }

  let winner: Country | undefined;
  if (homeScore > awayScore) winner = home;
  else if (awayScore > homeScore) winner = away;

  return { homeScore, awayScore, winner };
}

// Sort standings by: PTS (desc), GD (desc), GF (desc), rankPoints (desc)
export function sortGroupStandings(standings: GroupTeamStanding[]): GroupTeamStanding[] {
  return [...standings].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return b.country.rankPoints - a.country.rankPoints;
  });
}

// Creates an initial knockout bracket where all slots are empty (TBD)
export function createEmptyKnockoutBracket(): KnockoutMatch[] {
  const matches: KnockoutMatch[] = [];

  // Round of 16 (8 matches) - TBD
  for (let i = 0; i < 8; i++) {
    const nextQfIndex = Math.floor(i / 2);
    const nextSlot: 'home' | 'away' = i % 2 === 0 ? 'home' : 'away';

    matches.push({
      id: `r16_${i}`,
      stage: 'round_of_16',
      stageName: `Round of 16 • Match ${i + 1}`,
      matchIndex: i,
      homeTeam: null,
      awayTeam: null,
      isCompleted: false,
      isUserMatch: false,
      nextMatchId: `qf_${nextQfIndex}`,
      nextSlot,
    });
  }

  // Quarter Finals (4 matches) - TBD
  for (let i = 0; i < 4; i++) {
    const nextSfIndex = Math.floor(i / 2);
    const nextSlot: 'home' | 'away' = i % 2 === 0 ? 'home' : 'away';

    matches.push({
      id: `qf_${i}`,
      stage: 'quarter_final',
      stageName: `Quarter-Final ${i + 1}`,
      matchIndex: i,
      homeTeam: null,
      awayTeam: null,
      isCompleted: false,
      isUserMatch: false,
      nextMatchId: `sf_${nextSfIndex}`,
      nextSlot,
    });
  }

  // Semi Finals (2 matches) - TBD
  for (let i = 0; i < 2; i++) {
    const nextSlot: 'home' | 'away' = i === 0 ? 'home' : 'away';

    matches.push({
      id: `sf_${i}`,
      stage: 'semi_final',
      stageName: `Semi-Final ${i + 1}`,
      matchIndex: i,
      homeTeam: null,
      awayTeam: null,
      isCompleted: false,
      isUserMatch: false,
      nextMatchId: 'final_0',
      nextSlot,
    });
  }

  // Final (1 match) - TBD
  matches.push({
    id: 'final_0',
    stage: 'final',
    stageName: 'World Cup Final',
    matchIndex: 0,
    homeTeam: null,
    awayTeam: null,
    isCompleted: false,
    isUserMatch: false,
  });

  return matches;
}

// Initialize tournament state for chosen country with randomized groups
export function initTournamentState(userCountry: Country): TournamentState {
  const pool: Country[] = [];
  pool.push(userCountry);

  const otherCountries = QUALIFIED_WORLD_CUP_COUNTRIES.filter(
    (c) => c.id !== userCountry.id && c.code.toLowerCase() !== userCountry.code.toLowerCase()
  );

  const shuffledOthers = shuffleArray(otherCountries);
  for (let i = 0; i < 39 && i < shuffledOthers.length; i++) {
    pool.push(shuffledOthers[i]);
  }

  if (pool.length < 40) {
    const remaining = COUNTRIES_DATA.filter((c) => !pool.some((p) => p.id === c.id || p.code === c.code));
    const shuffledRemaining = shuffleArray(remaining);
    for (let i = 0; pool.length < 40 && i < shuffledRemaining.length; i++) {
      pool.push(shuffledRemaining[i]);
    }
  }

  const randomizedAll = shuffleArray(pool);

  const groups: Record<GroupLetter, GroupTeamStanding[]> = {
    A: [], B: [], C: [], D: [], E: [], F: [], G: [], H: [], I: [], J: [],
  };

  let userGroup: GroupLetter = 'A';
  const groupMatches: TournamentMatch[] = [];

  // Distribute 4 random teams to each of Groups A through J
  GROUP_LETTERS.forEach((grp, grpIndex) => {
    const startIndex = grpIndex * 4;
    const teamsInGroup = randomizedAll.slice(startIndex, startIndex + 4);

    teamsInGroup.forEach((countryObj, idx) => {
      const isUser = countryObj.id === userCountry.id || countryObj.code === userCountry.code;
      const actualCountry = isUser ? userCountry : countryObj;
      if (isUser) {
        userGroup = grp;
      }

      groups[grp].push({
        country: actualCountry,
        group: grp,
        seed: idx + 1,
        mp: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
      });
    });

    const [t0, t1, t2, t3] = groups[grp].map((s) => s.country);

    if (t0 && t1 && t2 && t3) {
      const pairings: [Country, Country, number][] = [
        [t0, t1, 1],
        [t2, t3, 1],
        [t0, t2, 2],
        [t1, t3, 2],
        [t0, t3, 3],
        [t1, t2, 3],
      ];

      pairings.forEach(([home, away, md], pIdx) => {
        const isUserMatch =
          home.id === userCountry.id ||
          home.code === userCountry.code ||
          away.id === userCountry.id ||
          away.code === userCountry.code;

        groupMatches.push({
          id: `match_${grp}_md${md}_${pIdx}`,
          group: grp,
          matchday: md,
          stage: 'group',
          stageName: `Group ${grp} • Matchday ${md}`,
          homeTeam: home,
          awayTeam: away,
          isCompleted: false,
          isUserMatch,
        });
      });
    }
  });

  // Sort fixtures chronologically: all Matchday 1 matches first, then Matchday 2, then Matchday 3
  groupMatches.sort((a, b) => {
    if (a.matchday !== b.matchday) return a.matchday - b.matchday;
    return a.group.localeCompare(b.group);
  });

  return {
    userCountry,
    userGroup,
    currentStage: 'group',
    currentMatchday: 1,
    groups,
    groupMatches,
    knockoutMatches: createEmptyKnockoutBracket(),
    isUserEliminated: false,
    isUserChampion: false,
  };
}

// Apply match score to standings
export function applyMatchResultToGroups(
  groups: Record<GroupLetter, GroupTeamStanding[]>,
  group: GroupLetter,
  homeCountry: Country,
  awayCountry: Country,
  homeScore: number,
  awayScore: number
): Record<GroupLetter, GroupTeamStanding[]> {
  const updated = { ...groups };
  const currentStandings = [...(updated[group] || [])];

  const homeIdx = currentStandings.findIndex((s) => s.country.id === homeCountry.id || s.country.code === homeCountry.code);
  const awayIdx = currentStandings.findIndex((s) => s.country.id === awayCountry.id || s.country.code === awayCountry.code);

  if (homeIdx !== -1 && awayIdx !== -1) {
    const homeTeam = { ...currentStandings[homeIdx] };
    const awayTeam = { ...currentStandings[awayIdx] };

    homeTeam.mp += 1;
    awayTeam.mp += 1;
    homeTeam.gf += homeScore;
    homeTeam.ga += awayScore;
    homeTeam.gd = homeTeam.gf - homeTeam.ga;

    awayTeam.gf += awayScore;
    awayTeam.ga += homeScore;
    awayTeam.gd = awayTeam.gf - awayTeam.ga;

    if (homeScore > awayScore) {
      homeTeam.w += 1;
      homeTeam.pts += 3;
      awayTeam.l += 1;
    } else if (homeScore < awayScore) {
      awayTeam.w += 1;
      awayTeam.pts += 3;
      homeTeam.l += 1;
    } else {
      homeTeam.d += 1;
      homeTeam.pts += 1;
      awayTeam.d += 1;
      awayTeam.pts += 1;
    }

    currentStandings[homeIdx] = homeTeam;
    currentStandings[awayIdx] = awayTeam;
    updated[group] = sortGroupStandings(currentStandings);
  }

  return updated;
}

// Builds the initial 16-team knockout bracket from qualified group teams
export function buildKnockoutBracket(
  groups: Record<GroupLetter, GroupTeamStanding[]>,
  userCountry: Country
): { knockoutMatches: KnockoutMatch[]; userQualified: boolean } {
  // Extract 1st and 2nd place teams from each group
  const groupWinners: Country[] = [];
  const groupRunnersUp: { country: Country; pts: number; gd: number; gf: number }[] = [];

  GROUP_LETTERS.forEach((grp) => {
    const sorted = sortGroupStandings(groups[grp] || []);
    if (sorted[0]) groupWinners.push(sorted[0].country);
    if (sorted[1]) {
      groupRunnersUp.push({
        country: sorted[1].country,
        pts: sorted[1].pts,
        gd: sorted[1].gd,
        gf: sorted[1].gf,
      });
    }
  });

  // Sort runners-up to find best 6
  groupRunnersUp.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  // Check if user is in top 2 of their group
  const userGrpStandings = sortGroupStandings(groups[groups[userCountry.id as GroupLetter] ? (userCountry.id as GroupLetter) : 'A'] || []);
  let userQualified = false;

  // Search all groups to see if user finished 1st or 2nd
  for (const grp of GROUP_LETTERS) {
    const standings = sortGroupStandings(groups[grp] || []);
    if (standings[0]?.country.id === userCountry.id || standings[0]?.country.code === userCountry.code) {
      userQualified = true;
      break;
    }
    if (standings[1]?.country.id === userCountry.id || standings[1]?.country.code === userCountry.code) {
      userQualified = true;
      break;
    }
  }

  // 16 qualified teams pool
  const qualified16: Country[] = [...groupWinners];
  // Add best 6 runners up
  const best6Runners = groupRunnersUp.slice(0, 6).map((r) => r.country);
  best6Runners.forEach((c) => {
    if (!qualified16.some((q) => q.id === c.id || q.code === c.code)) {
      qualified16.push(c);
    }
  });

  // Ensure 16 teams total
  if (qualified16.length < 16) {
    const remainingRunners = groupRunnersUp.slice(6).map((r) => r.country);
    for (const c of remainingRunners) {
      if (qualified16.length >= 16) break;
      if (!qualified16.some((q) => q.id === c.id || q.code === c.code)) {
        qualified16.push(c);
      }
    }
  }

  // If user qualified, ensure they are present in qualified16
  if (userQualified && !qualified16.some((c) => c.id === userCountry.id || c.code === userCountry.code)) {
    qualified16.pop();
    qualified16.push(userCountry);
  }

  // Shuffle teams for unpredictable, exciting bracket paths
  const shuffledTeams = shuffleArray(qualified16);

  // If user is in the bracket, place user into one match
  const matches: KnockoutMatch[] = [];

  // Round of 16 (8 matches)
  for (let i = 0; i < 8; i++) {
    const home = shuffledTeams[i * 2] || null;
    const away = shuffledTeams[i * 2 + 1] || null;
    const isUserMatch =
      Boolean((home && (home.id === userCountry.id || home.code === userCountry.code)) ||
      (away && (away.id === userCountry.id || away.code === userCountry.code)));

    const nextQfIndex = Math.floor(i / 2);
    const nextSlot: 'home' | 'away' = i % 2 === 0 ? 'home' : 'away';

    matches.push({
      id: `r16_${i}`,
      stage: 'round_of_16',
      stageName: `Round of 16 • Match ${i + 1}`,
      matchIndex: i,
      homeTeam: home,
      awayTeam: away,
      isCompleted: false,
      isUserMatch,
      nextMatchId: `qf_${nextQfIndex}`,
      nextSlot,
    });
  }

  // Quarter Finals (4 matches)
  for (let i = 0; i < 4; i++) {
    const nextSfIndex = Math.floor(i / 2);
    const nextSlot: 'home' | 'away' = i % 2 === 0 ? 'home' : 'away';

    matches.push({
      id: `qf_${i}`,
      stage: 'quarter_final',
      stageName: `Quarter-Final ${i + 1}`,
      matchIndex: i,
      homeTeam: null,
      awayTeam: null,
      isCompleted: false,
      isUserMatch: false,
      nextMatchId: `sf_${nextSfIndex}`,
      nextSlot,
    });
  }

  // Semi Finals (2 matches)
  for (let i = 0; i < 2; i++) {
    const nextSlot: 'home' | 'away' = i === 0 ? 'home' : 'away';

    matches.push({
      id: `sf_${i}`,
      stage: 'semi_final',
      stageName: `Semi-Final ${i + 1}`,
      matchIndex: i,
      homeTeam: null,
      awayTeam: null,
      isCompleted: false,
      isUserMatch: false,
      nextMatchId: 'final_0',
      nextSlot,
    });
  }

  // Final (1 match)
  matches.push({
    id: 'final_0',
    stage: 'final',
    stageName: 'World Cup Final',
    matchIndex: 0,
    homeTeam: null,
    awayTeam: null,
    isCompleted: false,
    isUserMatch: false,
  });

  return { knockoutMatches: matches, userQualified };
}

// Progresses the knockout bracket after completing matches
export function updateKnockoutBracket(
  currentMatches: KnockoutMatch[],
  completedMatch: KnockoutMatch,
  userCountry: Country
): KnockoutMatch[] {
  const updated = currentMatches.map((m) => {
    if (m.id === completedMatch.id) {
      return completedMatch;
    }
    return m;
  });

  if (completedMatch.winner && completedMatch.nextMatchId && completedMatch.nextSlot) {
    const nextIdx = updated.findIndex((m) => m.id === completedMatch.nextMatchId);
    if (nextIdx !== -1) {
      const nextMatch = { ...updated[nextIdx] };
      if (completedMatch.nextSlot === 'home') {
        nextMatch.homeTeam = completedMatch.winner;
      } else {
        nextMatch.awayTeam = completedMatch.winner;
      }

      // Check if user is now in next match
      nextMatch.isUserMatch = Boolean(
        (nextMatch.homeTeam && (nextMatch.homeTeam.id === userCountry.id || nextMatch.homeTeam.code === userCountry.code)) ||
        (nextMatch.awayTeam && (nextMatch.awayTeam.id === userCountry.id || nextMatch.awayTeam.code === userCountry.code))
      );

      updated[nextIdx] = nextMatch;
    }
  }

  return updated;
}

// Simulates all remaining knockout matches all the way to the Final when user is eliminated
export function simulateEntireRemainingKnockout(
  knockoutMatches: KnockoutMatch[],
  userCountry: Country
): KnockoutMatch[] {
  let updated = [...knockoutMatches];

  const stages: ('round_of_16' | 'quarter_final' | 'semi_final' | 'final')[] = [
    'round_of_16',
    'quarter_final',
    'semi_final',
    'final',
  ];

  for (const stage of stages) {
    // Repeatedly simulate any ready match in this stage until all matches in this stage are complete
    let hadPending = true;
    while (hadPending) {
      hadPending = false;
      for (let i = 0; i < updated.length; i++) {
        const m = updated[i];
        if (m.stage === stage && !m.isCompleted && m.homeTeam && m.awayTeam) {
          const sim = simulateScore(m.homeTeam, m.awayTeam, true);
          const completed: KnockoutMatch = {
            ...m,
            homeScore: sim.homeScore,
            awayScore: sim.awayScore,
            homePenalties: sim.homePenalties,
            awayPenalties: sim.awayPenalties,
            winner: sim.winner,
            isCompleted: true,
          };
          updated = updateKnockoutBracket(updated, completed, userCountry);
          hadPending = true;
        }
      }
    }
  }

  return updated;
}

// Full Round Processor: Simulates all other simultaneous matches, updates standings/brackets, and prepares round summary data
export function processCompletedRound(
  currentState: TournamentState,
  activeMatch: TournamentMatch | KnockoutMatch,
  playedUserScore: number,
  playedOpponentScore: number,
  playedUserPenalties?: number,
  playedOpponentPenalties?: number
): { updatedState: TournamentState; roundData: CompletedRoundData } {
  const userCountry = currentState.userCountry;
  const isGroup = activeMatch.stage === 'group';

  // Determine if the user was the homeTeam or awayTeam in the fixture
  const isUserHome = Boolean(
    activeMatch.homeTeam &&
    (activeMatch.homeTeam.id === userCountry.id || activeMatch.homeTeam.code === userCountry.code)
  );

  // Map fixture scores based on home/away assignment
  const fixtureHomeScore = isUserHome ? playedUserScore : playedOpponentScore;
  const fixtureAwayScore = isUserHome ? playedOpponentScore : playedUserScore;
  const fixtureHomePenalties = isUserHome ? playedUserPenalties : playedOpponentPenalties;
  const fixtureAwayPenalties = isUserHome ? playedOpponentPenalties : playedUserPenalties;

  const hasPenalties = playedUserPenalties !== undefined && playedOpponentPenalties !== undefined;
  const isUserWinner = hasPenalties
    ? (playedUserPenalties || 0) > (playedOpponentPenalties || 0)
    : playedUserScore > playedOpponentScore;

  if (isGroup) {
    const groupMatch = activeMatch as TournamentMatch;
    let updatedGroups = { ...currentState.groups };

    // Apply player match to group with correctly mapped fixture scores
    if (groupMatch.group) {
      updatedGroups = applyMatchResultToGroups(
        updatedGroups,
        groupMatch.group,
        groupMatch.homeTeam,
        groupMatch.awayTeam,
        fixtureHomeScore,
        fixtureAwayScore
      );
    }

    const currentMd = currentState.currentMatchday;
    const otherRoundResults: CompletedRoundData['otherMatches'] = [];

    const updatedGroupMatches = currentState.groupMatches.map((m) => {
      if (m.id === groupMatch.id) {
        return {
          ...m,
          homeScore: fixtureHomeScore,
          awayScore: fixtureAwayScore,
          isCompleted: true,
        };
      } else if (m.matchday === currentMd && !m.isCompleted && !m.isUserMatch) {
        // Simultaneously simulate all other group matches for this matchday
        const sim = simulateScore(m.homeTeam, m.awayTeam);
        if (m.group) {
          updatedGroups = applyMatchResultToGroups(
            updatedGroups,
            m.group,
            m.homeTeam,
            m.awayTeam,
            sim.homeScore,
            sim.awayScore
          );
        }

        otherRoundResults.push({
          id: m.id,
          stageName: m.stageName,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeScore: sim.homeScore,
          awayScore: sim.awayScore,
          winner: sim.winner,
        });

        return {
          ...m,
          homeScore: sim.homeScore,
          awayScore: sim.awayScore,
          isCompleted: true,
        };
      }
      return m;
    });

    let nextMatchday = currentMd;
    let nextStage: TournamentStageType = 'group';
    let knockoutMatches = [...currentState.knockoutMatches];
    let isUserEliminated = currentState.isUserEliminated;

    if (currentMd < 3) {
      nextMatchday = currentMd + 1;
      // Keep knockout matches empty (TBD) while still in group stage
    } else {
      // Group stage completed! Build official Knockout Bracket with qualified teams for Round of 16
      const bracketResult = buildKnockoutBracket(updatedGroups, userCountry);
      knockoutMatches = bracketResult.knockoutMatches;
      if (bracketResult.userQualified) {
        nextStage = 'round_of_16';
      } else {
        nextStage = 'eliminated';
        isUserEliminated = true;
        // User knocked out in group stage: SIMULTANEOUSLY SIMULATE ALL MATCHES TO THE FINAL!
        knockoutMatches = simulateEntireRemainingKnockout(knockoutMatches, userCountry);
      }
    }

    const roundData: CompletedRoundData = {
      stage: currentMd === 1 ? 'group_md1' : currentMd === 2 ? 'group_md2' : 'group_md3',
      stageTitle: `World Cup 2026 • Group Matchday ${currentMd}`,
      userMatch: {
        homeTeam: groupMatch.homeTeam,
        awayTeam: groupMatch.awayTeam,
        homeScore: fixtureHomeScore,
        awayScore: fixtureAwayScore,
        isUserWinner,
      },
      otherMatches: otherRoundResults,
    };

    const updatedState: TournamentState = {
      ...currentState,
      groups: updatedGroups,
      groupMatches: updatedGroupMatches,
      knockoutMatches,
      currentMatchday: nextMatchday,
      currentStage: nextStage,
      isUserEliminated,
      latestCompletedRound: roundData,
    };

    saveTournamentState(updatedState);

    return { updatedState, roundData };
  } else {
    // Knockout Stage Match
    const koMatch = activeMatch as KnockoutMatch;
    const stage = koMatch.stage;

    // Determine user match winner based on who won the game
    const userMatchWinner: Country = isUserWinner
      ? userCountry
      : (isUserHome ? koMatch.awayTeam! : koMatch.homeTeam!);

    const completedUserMatch: KnockoutMatch = {
      ...koMatch,
      homeScore: fixtureHomeScore,
      awayScore: fixtureAwayScore,
      homePenalties: fixtureHomePenalties,
      awayPenalties: fixtureAwayPenalties,
      winner: userMatchWinner,
      isCompleted: true,
    };

    let updatedKnockout = updateKnockoutBracket(
      currentState.knockoutMatches,
      completedUserMatch,
      userCountry
    );

    const otherRoundResults: CompletedRoundData['otherMatches'] = [];

    // Simultaneously simulate all other matches in this knockout stage
    updatedKnockout.forEach((m) => {
      if (m.stage === stage && m.id !== koMatch.id && !m.isCompleted && m.homeTeam && m.awayTeam) {
        const sim = simulateScore(m.homeTeam, m.awayTeam, true);
        const simCompleted: KnockoutMatch = {
          ...m,
          homeScore: sim.homeScore,
          awayScore: sim.awayScore,
          homePenalties: sim.homePenalties,
          awayPenalties: sim.awayPenalties,
          winner: sim.winner,
          isCompleted: true,
        };

        updatedKnockout = updateKnockoutBracket(updatedKnockout, simCompleted, userCountry);

        otherRoundResults.push({
          id: m.id,
          stageName: m.stageName,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeScore: sim.homeScore,
          awayScore: sim.awayScore,
          homePenalties: sim.homePenalties,
          awayPenalties: sim.awayPenalties,
          winner: sim.winner,
        });
      }
    });

    let nextStage: TournamentStageType = currentState.currentStage;
    let isUserChampion = false;
    let isUserEliminated = currentState.isUserEliminated;

    if (isUserWinner) {
      if (stage === 'round_of_16') nextStage = 'quarter_final';
      else if (stage === 'quarter_final') nextStage = 'semi_final';
      else if (stage === 'semi_final') nextStage = 'final';
      else if (stage === 'final') {
        nextStage = 'champion';
        isUserChampion = true;
      }
    } else {
      isUserEliminated = true;
      nextStage = 'eliminated';
      // User knocked out in knockout round: SIMULTANEOUSLY SIMULATE ALL REMAINING MATCHES TO THE FINAL!
      updatedKnockout = simulateEntireRemainingKnockout(updatedKnockout, userCountry);
    }

    const roundData: CompletedRoundData = {
      stage: stage as CompletedRoundData['stage'],
      stageTitle: `World Cup 2026 • ${koMatch.stageName}`,
      userMatch: {
        homeTeam: koMatch.homeTeam!,
        awayTeam: koMatch.awayTeam!,
        homeScore: fixtureHomeScore,
        awayScore: fixtureAwayScore,
        homePenalties: fixtureHomePenalties,
        awayPenalties: fixtureAwayPenalties,
        isUserWinner,
      },
      otherMatches: otherRoundResults,
    };

    const updatedState: TournamentState = {
      ...currentState,
      knockoutMatches: updatedKnockout,
      currentStage: nextStage,
      isUserChampion,
      isUserEliminated,
      latestCompletedRound: roundData,
    };

    // Automatically persist updated tournament state into CrazyGames Data SDK
    saveTournamentState(updatedState);

    return { updatedState, roundData };
  }
}

export const TOURNAMENT_STORAGE_KEY = 'fk_tournament_state_v1';

export function saveTournamentState(state: TournamentState | null): void {
  try {
    if (state) {
      crazyGamesSDK.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(state));
    } else {
      crazyGamesSDK.removeItem(TOURNAMENT_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Failed to save tournament state to crazyGamesSDK:', err);
  }
}

export function loadTournamentState(): TournamentState | null {
  try {
    const raw = crazyGamesSDK.getItemSync(TOURNAMENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TournamentState;
      if (parsed && parsed.userCountry && parsed.groups && parsed.currentStage) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load tournament state from crazyGamesSDK data:', err);
  }
  return null;
}

export async function loadTournamentStateAsync(): Promise<TournamentState | null> {
  try {
    const raw = await crazyGamesSDK.getItem(TOURNAMENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TournamentState;
      if (parsed && parsed.userCountry && parsed.groups && parsed.currentStage) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load tournament state async from crazyGamesSDK:', err);
  }
  return null;
}

export function clearTournamentState(): void {
  try {
    crazyGamesSDK.removeItem(TOURNAMENT_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear tournament state from crazyGamesSDK:', err);
  }
}

