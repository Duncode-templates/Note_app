export type MenuItemId = 'quick_play' | 'tournament' | 'survival' | 'wager_arena' | 'practice' | 'shop';

export type GameMode = 'match' | 'free_kick_training' | 'penalty_training' | 'survival' | 'division_match';

export type SuperpowerType = 'fireball' | 'laser_aim' | 'tornado' | 'thunderbolt' | null;

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
  gameMode: 'match' | 'penalty_training' | 'survival' | 'division_match';
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
