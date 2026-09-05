export type MenuItemId = 'quick_play' | 'tournament' | 'survival' | 'wager_arena' | 'king_of_the_hill' | 'practice' | 'shop';

export type GameMode = 'match' | 'free_kick_training' | 'penalty_training' | 'survival' | 'division_match' | 'king_of_the_hill';

export type SuperpowerType = 'fireball' | 'laser_aim' | 'tornado' | 'thunderbolt' | null;

export type KingShotOutcome = 'goal' | 'save' | 'post' | 'miss';

export interface KingOfTheHillContender {
  id: string;
  name: string;
  countryCode: string;
  countryName: string;
  avatarUrl?: string | null;
  isLocalPlayer: boolean;
  isBot?: boolean;
  isEliminated: boolean;
  eliminatedInRound?: number;
  currentRoundScore: number;
  currentRoundGoals: number; // goals scored in current round (0 to 5)
  currentRoundShots: KingShotOutcome[]; // shots taken in current round (up to 5)
  currentRoundOutcome: 'waiting' | 'aiming' | 'shooting' | 'goal' | 'save' | 'post' | 'miss';
  currentRoundDetails?: string;
  roundScores: number[]; // points in each round [r1, r2, ...]
  roundGoals: number[]; // goals in each round [r1, r2, ...]
  roundOutcomes: KingShotOutcome[];
  totalScore: number;
  totalGoals: number;
  rank?: number;
}

export interface KingOfTheHillMatchState {
  matchId: string;
  playerCount: 4;
  currentRound: number; // 1, 2, 3, 4
  totalRounds: number;
  wagerTier?: 'free' | 'rookie' | 'pro' | 'champion';
  entryFee: number;
  prizePot: number;
  contenders: KingOfTheHillContender[];
  roundTimeLeft: number;
  status: 'matchmaking' | 'round_active' | 'round_elimination' | 'champion_crowned';
  positionIndex: number;
  roundPositions?: number[]; // 5 distinct random free kick positions for this round (1 per ball)
  roundTitle: string;
  roundDescription: string;
  eliminatedCountThisRound: number;
  activeContenderId?: string; // which contender is currently taking their turn
  activeShotIndex?: number; // 0 to 4 (shot 1 to 5)
}


export interface MenuItem {
  id: MenuItemId;
  label: string;
  subtext?: string;
  isStandout?: boolean;
}

export interface OnlinePlayer {
  id: string;
  name: string;
  countryCode: string | null;
  role: 'host' | 'guest';
  isReady: boolean;
  isLocal: boolean;
  profilePictureUrl?: string | null;
  isBot?: boolean;
  botProfileId?: string;
  lastSeen?: number;
}

export interface TargetSmashTarget {
  id: string;
  type: string;
  points: number;
  label: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
}

export interface TargetSmashStage {
  stageNumber: number;
  name: string;
  distance: number;
  xOffset: number;
  wallSize: number;
  targetScore: number;
  shotsAllowed: number;
  description: string;
  targets: TargetSmashTarget[];
}

export interface OnlineMatchRoom {
  roomId: string;
  host: OnlinePlayer;
  guest?: OnlinePlayer | null;
  gameMode: 'match' | 'penalty_training' | 'survival' | 'division_match' | 'king_of_the_hill';
  division?: number;
  wagerTier?: 'rookie' | 'pro' | 'champion' | 'legend';
  entryFee?: number;
  prizePot?: number;
  status: 'waiting' | 'selecting_country' | 'starting' | 'ready' | 'playing' | 'finished' | 'opponent_left' | 'cancelled';
  currentKickerRole: 'host' | 'guest';
  score: {
    host: number;
    guest: number;
  };
  survivalLives?: {
    host: number;
    guest: number;
  };
  turn: number;
  matchTime?: number;
  stoppageCountdown?: number | null;
  positionIndex?: number;
  gkStartX?: number;
  countdown?: number | null;
  countdownStartTime?: number | null;
  rematchRequestedBy?: 'host' | 'guest' | null;
  isOpponentDisconnected?: boolean;
  isMatchmaking?: boolean;
  isPublic?: boolean;
  maxPlayers?: number;
  players?: OnlinePlayer[];
  kothState?: KingOfTheHillMatchState;
  kickedPlayerIds?: string[];
  lastKickedPlayerId?: string;
  isBotMatch?: boolean;
  botProfileId?: string;
}

export interface OnlineShotPayload {
  kickerId: string;
  kickerRole: 'host' | 'guest';
  aimProgress: number;
  power: number;
  curveAmount: number;
  passToTeammate?: boolean;
  targetGoalX?: number;
  positionIndex?: number;
  gkStartX?: number;
  gkReactionDelay?: number;
  gkFlawType?: string;
  gkFlawOffset?: number;
  gkGambleSide?: number;
  timestamp?: number;
  shotId?: string;
  initialVelocity?: [number, number, number];
  shotGravity?: number;
  curveAccelMag?: number;
}

export interface OnlineShotOutcomePayload {
  outcome: string;
  isGoal: boolean;
  kickerRole: 'host' | 'guest';
  hostScore?: number;
  guestScore?: number;
  homeScore: number;
  awayScore: number;
  survivalLives?: {
    host: number;
    guest: number;
  };
}

export interface OnlineGKPayload {
  gkId: string;
  targetX: number;
  actionType: 'stay' | 'dive_left' | 'dive_right' | 'jump';
}

export interface OnlineTurnAdvancePayload {
  nextTurnRole: 'host' | 'guest';
  nextPositionIndex: number;
  hostScore?: number;
  guestScore?: number;
  homeScore: number;
  awayScore: number;
  survivalLives?: {
    host: number;
    guest: number;
  };
  turnNumber: number;
  matchTime?: number;
  stoppageCountdown?: number;
  gkStartX?: number;
}

export interface OnlineMatchEndedPayload {
  hostScore?: number;
  guestScore?: number;
  homeScore: number;
  awayScore: number;
  survivalLives?: {
    host: number;
    guest: number;
  };
}

export interface OnlineTeamChangePayload {
  role: 'host' | 'guest';
  countryCode: string;
}

export interface OnlineRematchPayload {
  role: 'host' | 'guest';
  status: 'requested' | 'accepted' | 'declined';
}

export interface EntitySnapshot {
  pos: [number, number, number];
  rot: [number, number, number];
  leftLegRot?: [number, number, number];
  rightLegRot?: [number, number, number];
  leftArmRot?: [number, number, number];
  rightArmRot?: [number, number, number];
  headRot?: [number, number, number];
}

export interface ReplayFrame {
  time: number; // ms from kick start
  ball: {
    pos: [number, number, number];
    rot: [number, number, number];
  };
  kicker: EntitySnapshot;
  gk: EntitySnapshot;
  wall: EntitySnapshot[];
  boxPlayers: EntitySnapshot[];
  goalVibePos?: [number, number, number];
}

export interface SavedReplay {
  id: string;
  createdAt: number;
  formattedDate: string;
  distance: number;
  isGoal: boolean;
  outcomeText: string;
  kickerCountryCode: string;
  kickerCountryName: string;
  opponentCountryCode: string;
  opponentCountryName: string;
  gameMode?: string;
  frames: ReplayFrame[];
}
