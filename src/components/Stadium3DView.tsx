import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Play, Pause, RotateCcw, FastForward, Camera, Video, Compass, Bookmark, Check, Bot, Rotate3d, User, Flame, Zap, Sparkles, Target, Heart, Swords, Coins, LogOut } from 'lucide-react';
import { Country, getFlagUrl, getCountryAbbr, COUNTRIES_DATA } from '../data/countries';
import { getCountryKit, resolveMatchKits, CountryKit } from '../data/countryKits';
import { getTeamGoalkeeperProfile } from '../data/goalkeeperProfiles';
import { STICKERS, getOutcomeSticker } from '../assets/stickers';
import { getStickerAvatarUrl } from '../data/botProfiles';
import { BALL_TEXTURE_ITEMS, PITCH_PATTERN_ITEMS } from '../data/storeItems';
import { renderBallTextureToContext } from '../utils/ballTextureGenerator';
import { GameMode, OnlineMatchRoom, OnlineShotPayload, OnlineTurnAdvancePayload, OnlineShotOutcomePayload, SuperpowerType, SavedReplay, ReplayFrame, EntitySnapshot } from '../types';
import { savedReplayManager } from '../utils/savedReplayManager';
import { onlineMatchManager } from '../utils/onlineMatchManager';
import { WAGER_TIERS } from '../data/wagerArenas';
import {
  TournamentState,
  TournamentMatch,
  KnockoutMatch,
  CompletedRoundData,
  processCompletedRound,
} from '../data/tournamentData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol } from '@fortawesome/free-solid-svg-icons';
import LazyFlagImage from './LazyFlagImage';
import TrophyImage from './TrophyImage';
import MatchResultsPage from './MatchResultsPage';
import SurvivalOnlineResultsPage from './SurvivalOnlineResultsPage';
import WagerResultsPage from './WagerResultsPage';
import SurvivalGameOverModal from './SurvivalGameOverModal';
import { playKickSound, playKeeperHitSound, playBallHitPlayerSound, playWhistleSound, playGoalCheerSound, stopGoalCheerSound, playSuperpowerSound, playLockAimSound } from '../utils/mediaPreloader';
import { startMatchCrowd, stopMatchCrowd, setCrowdExcitement } from '../utils/stadiumCrowdAudio';
import { crazyGamesSDK } from '../utils/crazyGamesSDK';

interface Stadium3DViewProps {
  country: Country;
  opponentCountry?: Country;
  onBack: () => void;
  onReselectTeam?: () => void;
  titleMode?: string;
  gameMode?: GameMode;
  onSurvivalComplete?: (finalStreak: number, score: number) => void;
  onlineMatchRoom?: OnlineMatchRoom | null;
  tournamentState?: TournamentState | null;
  activeTournamentMatch?: TournamentMatch | KnockoutMatch | null;
  onMatchComplete?: (homeScore: number, awayScore: number) => void;
  onReturnToTournament?: (homeScore: number, awayScore: number, homePenalties?: number, awayPenalties?: number) => void;
  onReturnToDivisions?: (homeScore: number, awayScore: number) => void;
  equippedBallId?: string;
  equippedPitchId?: string;
  onEarnCoins?: (amount: number) => void;
  savedReplayClip?: SavedReplay | null;
}

export interface FreeKickPosition {
  id: number;
  name: string;
  distance: number; // in meters
  xOffset: number;  // in meters
  wallSize: number; // 1 to 4 defenders
  difficulty: 'normal' | 'hard';
  description: string;
}

export interface StadiumFan {
  root: THREE.Group;
  body: THREE.Mesh;
  head: THREE.Mesh;
  baseY: number;
  phaseSeed: number;
}

// 30 Explicit, Diverse Free Kick Positions across Pitch (10 Designated as Very Challenging/Hard)
export const FREE_KICK_POSITIONS: FreeKickPosition[] = [
  // --- 10 VERY CHALLENGING / HARD POSITIONS (1 - 10) --- (Pushed right to touchlines at X=±26m)
  { id: 1, name: 'Far Left Touchline', distance: 36, xOffset: -26.0, wallSize: 3, difficulty: 'hard', description: '36m acute angle directly on left touchline' },
  { id: 2, name: 'Extreme Left Flank', distance: 33, xOffset: -24.5, wallSize: 3, difficulty: 'hard', description: 'Sharp 33m angle on outer left flank' },
  { id: 3, name: 'Left Corner Arc Edge', distance: 37, xOffset: -25.5, wallSize: 3, difficulty: 'hard', description: '37m long-range curve from far left boundary' },
  { id: 4, name: 'Deep Left Wing', distance: 39, xOffset: -22.5, wallSize: 3, difficulty: 'hard', description: 'Ultra deep 39m left wing challenge' },
  { id: 5, name: 'Tight Left Box Edge', distance: 31, xOffset: -19.5, wallSize: 3, difficulty: 'hard', description: '31m acute angle from wide outer box' },
  { id: 6, name: 'Far Right Touchline', distance: 36, xOffset: 26.0, wallSize: 3, difficulty: 'hard', description: '36m acute angle directly on right touchline' },
  { id: 7, name: 'Extreme Right Flank', distance: 33, xOffset: 24.5, wallSize: 3, difficulty: 'hard', description: 'Sharp 33m angle on outer right flank' },
  { id: 8, name: 'Right Corner Arc Edge', distance: 37, xOffset: 25.5, wallSize: 3, difficulty: 'hard', description: '37m long-range curve from far right boundary' },
  { id: 9, name: 'Deep Right Wing', distance: 39, xOffset: 22.5, wallSize: 3, difficulty: 'hard', description: 'Ultra deep 39m right wing challenge' },
  { id: 10, name: 'Tight Right Box Edge', distance: 31, xOffset: 19.5, wallSize: 3, difficulty: 'hard', description: '31m acute angle from wide outer box' },

  // --- 20 NORMAL / BALANCED POSITIONS (11 - 30) ---
  { id: 11, name: 'Wide Left Channel', distance: 33, xOffset: -17.5, wallSize: 3, difficulty: 'normal', description: '33m wide left channel shot' },
  { id: 12, name: 'Left Side Pocket', distance: 35, xOffset: -15.5, wallSize: 3, difficulty: 'normal', description: '35m left side pocket' },
  { id: 13, name: 'Left Angle Arc', distance: 32, xOffset: -13.5, wallSize: 3, difficulty: 'normal', description: '32m angled left curl' },
  { id: 14, name: 'Left Box Corner', distance: 31, xOffset: -11.0, wallSize: 3, difficulty: 'normal', description: '31m left box corner' },
  { id: 15, name: 'Left Half-Space', distance: 34, xOffset: -8.0, wallSize: 2, difficulty: 'normal', description: '34m left half-space strike' },
  { id: 16, name: 'Center-Left Edge', distance: 32, xOffset: -5.0, wallSize: 3, difficulty: 'normal', description: '32m center-left edge' },
  { id: 17, name: 'Center-Left 30m', distance: 30, xOffset: -2.5, wallSize: 3, difficulty: 'normal', description: '30m central-left free kick' },
  { id: 18, name: 'Center-Left Deep', distance: 38, xOffset: -1.5, wallSize: 2, difficulty: 'normal', description: '38m deep central-left bomb' },
  { id: 19, name: 'Direct Central 30m', distance: 30, xOffset: 0.0, wallSize: 3, difficulty: 'normal', description: '30m direct central free kick' },
  { id: 20, name: 'Direct Central 32m', distance: 32, xOffset: 0.0, wallSize: 3, difficulty: 'normal', description: '32m central free kick' },
  { id: 21, name: 'Direct Central 35m', distance: 35, xOffset: 0.0, wallSize: 2, difficulty: 'normal', description: '35m central power shot' },
  { id: 22, name: 'Direct Central 39m', distance: 39, xOffset: 0.0, wallSize: 2, difficulty: 'normal', description: '39m long-range rocket' },
  { id: 23, name: 'Center-Right 30m', distance: 30, xOffset: 2.5, wallSize: 3, difficulty: 'normal', description: '30m central-right free kick' },
  { id: 24, name: 'Center-Right Edge', distance: 32, xOffset: 5.0, wallSize: 3, difficulty: 'normal', description: '32m center-right edge' },
  { id: 25, name: 'Center-Right Deep', distance: 38, xOffset: 1.5, wallSize: 2, difficulty: 'normal', description: '38m deep central-right bomb' },
  { id: 26, name: 'Right Half-Space', distance: 34, xOffset: 8.0, wallSize: 2, difficulty: 'normal', description: '34m right half-space strike' },
  { id: 27, name: 'Right Box Corner', distance: 31, xOffset: 11.0, wallSize: 3, difficulty: 'normal', description: '31m right box corner' },
  { id: 28, name: 'Right Angle Arc', distance: 32, xOffset: 13.5, wallSize: 3, difficulty: 'normal', description: '32m angled right curl' },
  { id: 29, name: 'Right Side Pocket', distance: 35, xOffset: 15.5, wallSize: 3, difficulty: 'normal', description: '35m right side pocket' },
  { id: 30, name: 'Wide Right Channel', distance: 33, xOffset: 17.5, wallSize: 3, difficulty: 'normal', description: '33m wide right channel shot' },
];

// Shifted penalty distance (40% increase from 16.5m -> 23.1m)
export const PENALTY_DISTANCE = 23.1;

// Module-level caches for custom ball, pitch, jersey textures, and player materials to avoid CPU recalculation & memory leaks
const soccerBallTextureMap = new Map<string, THREE.CanvasTexture>();
const pitchTextureMap = new Map<string, THREE.CanvasTexture>();
const jerseyTextureCache = new Map<string, THREE.CanvasTexture>();
const jerseyMaterialCache = new Map<string, THREE.MeshStandardMaterial>();
const playerStandardMatCache = new Map<string, THREE.MeshStandardMaterial>();

function getOrCreatePlayerStandardMat(color: string | number, roughness = 0.45, metalness = 0.0): THREE.MeshStandardMaterial {
  const key = `${color}_${roughness}_${metalness}`;
  let mat = playerStandardMatCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    playerStandardMatCache.set(key, mat);
  }
  return mat;
}

function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16) || 0;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// ============================================================================
// HIGH-PERFORMANCE GEOMETRY & SCRATCH OBJECT POOLS (ZERO GC PRESSURE)
// ============================================================================
const PLAYER_TORSO_GEO = new THREE.BoxGeometry(0.6, 0.9, 0.35);
const PLAYER_COLLAR_GEO = new THREE.BoxGeometry(0.32, 0.05, 0.24);
const PLAYER_SHOULDER_GEO = new THREE.BoxGeometry(0.18, 0.22, 0.37);
const PLAYER_SHORTS_GEO = new THREE.BoxGeometry(0.62, 0.3, 0.37);
const PLAYER_HEAD_GEO = new THREE.BoxGeometry(0.35, 0.35, 0.35);
const PLAYER_EYE_WHITE_GEO = new THREE.BoxGeometry(0.08, 0.08, 0.01);
const PLAYER_PUPIL_GEO = new THREE.BoxGeometry(0.04, 0.04, 0.012);
const PLAYER_EYEBROW_GEO = new THREE.BoxGeometry(0.09, 0.02, 0.012);
const PLAYER_MOUTH_GEO = new THREE.BoxGeometry(0.12, 0.02, 0.01);
const PLAYER_HAIR_GEO = new THREE.BoxGeometry(0.36, 0.12, 0.36);
const HAIR_SPIKY_TUFT_GEO = new THREE.BoxGeometry(0.18, 0.14, 0.28);
const HAIR_SPIKY_TUFT_SMALL_GEO = new THREE.BoxGeometry(0.14, 0.10, 0.20);
const HAIR_SWEEP_GEO = new THREE.BoxGeometry(0.38, 0.14, 0.38);
const HAIR_AFRO_GEO = new THREE.BoxGeometry(0.44, 0.24, 0.44);
const HAIR_CURLS_GEO = new THREE.BoxGeometry(0.40, 0.18, 0.40);
const HAIR_DREADS_BACK_GEO = new THREE.BoxGeometry(0.34, 0.30, 0.14);
const HAIR_BUZZ_GEO = new THREE.BoxGeometry(0.36, 0.05, 0.36);
const HAIR_UNDERCUT_GEO = new THREE.BoxGeometry(0.34, 0.15, 0.34);
const HAIR_SLICK_GEO = new THREE.BoxGeometry(0.36, 0.12, 0.40);
const PLAYER_LEG_GEO = new THREE.BoxGeometry(0.2, 0.55, 0.2);
const PLAYER_SHOE_GEO = new THREE.BoxGeometry(0.22, 0.09, 0.28);
const PLAYER_UPPER_ARM_GEO = new THREE.BoxGeometry(0.18, 0.28, 0.18);
const PLAYER_SLEEVE_TRIM_GEO = new THREE.BoxGeometry(0.185, 0.04, 0.185);
const PLAYER_LOWER_ARM_GEO = new THREE.BoxGeometry(0.16, 0.28, 0.16);
const PLAYER_GLOVE_GEO = new THREE.BoxGeometry(0.18, 0.30, 0.18);
const PLAYER_BAND_GEO = new THREE.BoxGeometry(0.19, 0.10, 0.19);
const PLAYER_BADGE_GEO = new THREE.BoxGeometry(0.04, 0.04, 0.20);
const BALL_GEO = new THREE.SphereGeometry(0.3015, 48, 48);

// Reusable Fan Geometries & Materials
const FAN_BODY_GEO = new THREE.BoxGeometry(0.57, 0.59, 0.42);
const FAN_HEAD_GEO = new THREE.BoxGeometry(0.37, 0.34, 0.37);
const FAN_UNIFIED_MAT = new THREE.MeshStandardMaterial({
  color: '#0d6b7a',
  roughness: 0.35,
  metalness: 0.15,
});

// Shared reusable materials
const MAT_EYE_WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff });
const MAT_PUPIL = new THREE.MeshBasicMaterial({ color: 0x000000 });
const MAT_EYEBROW = new THREE.MeshBasicMaterial({ color: 0x1e1917 });
const MAT_MOUTH = new THREE.MeshBasicMaterial({ color: 0x3a090b });
const MAT_BADGE_WHITE = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const MAT_CAPTAIN_BAND = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.3 });
const MAT_GK_GLOVES = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.35, metalness: 0.1 });

// Scratch objects for high frequency frame & physics calculations (eliminates thousands of allocations/sec)
const _scratchV3_1 = new THREE.Vector3();
const _scratchV3_2 = new THREE.Vector3();
const _scratchV3_3 = new THREE.Vector3();
const _scratchV3_4 = new THREE.Vector3();
const _scratchV3_5 = new THREE.Vector3();
const _scratchV3_6 = new THREE.Vector3();
const _scratchV3_7 = new THREE.Vector3();
const _scratchV3_8 = new THREE.Vector3();
const _scratchQuat_1 = new THREE.Quaternion();
const _scratchQuat_2 = new THREE.Quaternion();

// Reusable Aim Arrow Geometry & Materials
const AIM_ARROW_GEO = new THREE.PlaneGeometry(1.85, 4.2);
AIM_ARROW_GEO.translate(0, 2.1, 0);
let AIM_ARROW_MAT: THREE.MeshBasicMaterial | null = null;
let AIM_ARROW_SHADOW_MAT: THREE.MeshBasicMaterial | null = null;

// Static goalpost & crossbar collision segments
const GOAL_HALF_W = 8.05 / 2; // 4.025m
const GOAL_H = 2.68;
const GOAL_Z = -42.0;
const LEFT_POST_START = new THREE.Vector3(-GOAL_HALF_W, 0, GOAL_Z);
const LEFT_POST_END = new THREE.Vector3(-GOAL_HALF_W, GOAL_H, GOAL_Z);
const RIGHT_POST_START = new THREE.Vector3(GOAL_HALF_W, 0, GOAL_Z);
const RIGHT_POST_END = new THREE.Vector3(GOAL_HALF_W, GOAL_H, GOAL_Z);
const CROSSBAR_START = new THREE.Vector3(-GOAL_HALF_W, GOAL_H, GOAL_Z);
const CROSSBAR_END = new THREE.Vector3(GOAL_HALF_W, GOAL_H, GOAL_Z);

const GOAL_COLLISION_SEGMENTS = [
  { type: 'left_post', start: LEFT_POST_START, end: LEFT_POST_END, lineVec: LEFT_POST_END.clone().sub(LEFT_POST_START), lenSq: LEFT_POST_END.clone().sub(LEFT_POST_START).lengthSq() },
  { type: 'right_post', start: RIGHT_POST_START, end: RIGHT_POST_END, lineVec: RIGHT_POST_END.clone().sub(RIGHT_POST_START), lenSq: RIGHT_POST_END.clone().sub(RIGHT_POST_START).lengthSq() },
  { type: 'crossbar', start: CROSSBAR_START, end: CROSSBAR_END, lineVec: CROSSBAR_END.clone().sub(CROSSBAR_START), lenSq: CROSSBAR_END.clone().sub(CROSSBAR_START).lengthSq() },
];

/**
 * Computes dynamic maximum curve limit (in meters) based on power level.
 * Completely cancels curve at low power (<= 25%) for direct straight passes to teammates,
 * and scales smoothly up to full 32.0m swerves at higher power.
 */
function getDynamicMaxCurve(powerVal: number): number {
  if (powerVal <= 25) return 0.0;
  if (powerVal < 50) return 32.0 * Math.pow((powerVal - 25) / 25, 1.25);
  return 32.0;
}

/**
 * Calculates adaptive camera FOV.
 * On desktop/landscape screens (aspect >= 1.05), targets a balanced ~52° horizontal field of view
 * to cleanly frame the free kick scene with 50% reduced zoom closeness, avoiding wide empty pitch margins.
 * On mobile/tablet portrait views, retains the original 50° FOV.
 */
export function getAdaptiveCameraFov(aspect: number): number {
  if (aspect >= 1.05) {
    // Landscape screen (Desktop, laptop, widescreen window):
    // Calculate vertical FOV from balanced ~52° horizontal span
    const targetHFovRad = (52.0 * Math.PI) / 180.0;
    const vFovRad = 2.0 * Math.atan(Math.tan(targetHFovRad / 2.0) / aspect);
    const deg = (vFovRad * 180.0) / Math.PI;
    return Math.max(22.0, Math.min(42.0, deg));
  }
  // Mobile & tablet portrait original default FOV
  return 50.0;
}


/**
 * Creates 3D Directional Aim Arrow with Neo-Brutalist arcade styling matching the game's theme:
 * - Thick solid jet-black border & hard ground shadow (signature brutalist design)
 * - Vivid arcade amber-gold gradient body (#fde047 -> #f59e0b -> #ea580c)
 * - Directional arcade forward-pointing speed chevrons (>>>)
 * - Stylized ball cradle launch arc at base
 * - High-visibility winged arrowhead with sporty hazard trim & bright white center track
 */
let aimArrowTextureCache: THREE.CanvasTexture | null = null;
let aimArrowShadowTextureCache: THREE.CanvasTexture | null = null;

function createAimArrowTexture(): THREE.CanvasTexture {
  if (aimArrowTextureCache) return aimArrowTextureCache;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = 256;
  const shaftW = 54; // Generous bold shaft width (108px)
  const shaftBottom = 890;
  const headBaseY = 370;
  const headWingW = 180; // Bold wing width (360px)
  const headTipY = 70;

  // 1. Clean Crisp Jet-Black Outline (Thick Brutalist Edge)
  ctx.beginPath();
  ctx.moveTo(cx - shaftW - 10, shaftBottom + 10);
  ctx.lineTo(cx + shaftW + 10, shaftBottom + 10);
  ctx.lineTo(cx + shaftW + 10, headBaseY + 10);
  ctx.lineTo(cx + headWingW + 10, headBaseY + 10);
  ctx.lineTo(cx, headTipY - 14);
  ctx.lineTo(cx - headWingW - 10, headBaseY + 10);
  ctx.lineTo(cx - shaftW - 10, headBaseY + 10);
  ctx.closePath();

  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#000000';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // 2. Clean Vibrant Amber Arrow Body
  const grad = ctx.createLinearGradient(0, shaftBottom, 0, headTipY);
  grad.addColorStop(0, '#f59e0b');
  grad.addColorStop(0.5, '#fbbf24');
  grad.addColorStop(1, '#fef08a');

  ctx.beginPath();
  ctx.moveTo(cx - shaftW, shaftBottom);
  ctx.lineTo(cx + shaftW, shaftBottom);
  ctx.lineTo(cx + shaftW, headBaseY);
  ctx.lineTo(cx + headWingW, headBaseY);
  ctx.lineTo(cx, headTipY);
  ctx.lineTo(cx - headWingW, headBaseY);
  ctx.lineTo(cx - shaftW, headBaseY);
  ctx.closePath();

  ctx.fillStyle = grad;
  ctx.fill();

  // 3. Clean Forward Chevrons
  const chevronCount = 4;
  const chevronStart = shaftBottom - 70;
  const chevronEnd = headBaseY + 50;
  const step = (chevronStart - chevronEnd) / (chevronCount - 1);

  for (let i = 0; i < chevronCount; i++) {
    const cy = chevronStart - i * step;
    const cw = shaftW - 12;
    const ch = 38;

    ctx.beginPath();
    ctx.moveTo(cx - cw, cy);
    ctx.lineTo(cx, cy - ch);
    ctx.lineTo(cx + cw, cy);
    ctx.lineTo(cx + cw, cy - 14);
    ctx.lineTo(cx, cy - ch - 14);
    ctx.lineTo(cx - cw, cy - 14);
    ctx.closePath();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();
  }

  // 4. Subtle Tip Highlight Dart
  ctx.beginPath();
  ctx.moveTo(cx, headTipY + 36);
  ctx.lineTo(cx + 36, headBaseY - 24);
  ctx.lineTo(cx, headBaseY - 56);
  ctx.lineTo(cx - 36, headBaseY - 24);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  aimArrowTextureCache = texture;
  return texture;
}

function createAimArrowShadowTexture(): THREE.CanvasTexture {
  if (aimArrowShadowTextureCache) return aimArrowShadowTextureCache;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = 256;
  const shaftW = 54;
  const shaftBottom = 890;
  const headBaseY = 370;
  const headWingW = 180;
  const headTipY = 70;

  ctx.beginPath();
  ctx.moveTo(cx - shaftW - 8, shaftBottom + 8);
  ctx.lineTo(cx + shaftW + 8, shaftBottom + 8);
  ctx.lineTo(cx + shaftW + 8, headBaseY + 8);
  ctx.lineTo(cx + headWingW + 8, headBaseY + 8);
  ctx.lineTo(cx, headTipY - 10);
  ctx.lineTo(cx - headWingW - 8, headBaseY + 8);
  ctx.lineTo(cx - shaftW - 8, headBaseY + 8);
  ctx.closePath();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  aimArrowShadowTextureCache = texture;
  return texture;
}

/**
 * Creates 3D Directional Aim Arrow resting on the pitch pointing in aim direction
 */
function create3DAimArrow(): THREE.Group {
  const group = new THREE.Group();

  // 1. Ground Shadow Mesh (reusing cached texture, geometry, and material)
  if (!AIM_ARROW_SHADOW_MAT) {
    const shadowTex = createAimArrowShadowTexture();
    AIM_ARROW_SHADOW_MAT = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }

  const shadowMesh = new THREE.Mesh(AIM_ARROW_GEO, AIM_ARROW_SHADOW_MAT);
  shadowMesh.rotation.x = Math.PI / 2;
  shadowMesh.position.set(0.06, 0.02, -0.05);
  group.add(shadowMesh);

  // 2. Main Clean Graphic Arrow Mesh (reusing cached texture, geometry, and material)
  if (!AIM_ARROW_MAT) {
    const arrowTex = createAimArrowTexture();
    AIM_ARROW_MAT = new THREE.MeshBasicMaterial({
      map: arrowTex,
      transparent: true,
      alphaTest: 0.02,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  }

  const arrowMesh = new THREE.Mesh(AIM_ARROW_GEO, AIM_ARROW_MAT);
  arrowMesh.rotation.x = Math.PI / 2;
  arrowMesh.position.set(0, 0.038, 0);
  group.add(arrowMesh);

  // Arrow Scale update
  group.userData = {
    arrowMesh,
    shadowMesh,
    update: (_power: number = 50, _isDragging: boolean = false) => {
      arrowMesh.scale.set(1.0, 1.0, 1.0);
      shadowMesh.scale.set(1.0, 1.0, 1.0);
    }
  };

  return group;
}

/**
 * 3D Slingshot Trajectory Visualizer (Trajectory lines/dots removed per user specification)
 */
function create3DSlingshotVisualizer(): THREE.Group {
  const group = new THREE.Group();
  group.visible = false;
  group.userData = {
    update: () => {
      // Trajectory lines disabled
    },
  };
  return group;
}

/**
 * Calculates the dynamic aim target sweep span across the goal line based on free kick distance.
 * - Closer free kicks & penalty spot (dist <= 18m): span remains strictly 14.0m so closer ones do not increase.
 * - Further free kick positions (> 18m, up to 40m): span smoothly scales up with distance so the aim arrow
 *   moves in a wider, more spacious angle across the pitch instead of feeling constricted in a small space.
 */
function getAimTargetSpan(ballZ: number, goalLineZ: number = -42.0): number {
  const dist = Math.max(10.0, ballZ - goalLineZ);
  const baseSpan = 14.0;
  if (dist <= 18.0) {
    return baseSpan; // Closer free kicks & penalties own span does not increase
  }
  // Linear ramp with distance: e.g. at 25m: span ~ 18.9m, at 32m: span ~ 23.8m, at 38m: span ~ 28.0m
  const distScale = Math.min(2.1, 1.0 + (dist - 18.0) * 0.05);
  return baseSpan * distScale;
}

/**
 * Calculates realistic goalkeeper starting position on the goal line.
 * In professional football, goalkeepers position themselves to see the ball past the defensive wall:
 * - If the kick is on the LEFT side (ballX < -1.0), the keeper stands towards the RIGHT (opposite side) ~+1.35m to +2.30m
 * - If the kick is on the RIGHT side (ballX > 1.0), the keeper stands towards the LEFT (opposite side) ~-1.35m to -2.30m
 * - If the kick is CENTRAL (|ballX| <= 1.0) or a PENALTY, the keeper stands in center ~40% of the time, or shaded left/right ~30%/30% of the time.
 * This introduces high realism and creates realistic open goal space for the user to strike!
 */
export function calculateRealisticGoalkeeperStartX(ballX: number, isPenalty: boolean): number {
  if (isPenalty) {
    // In penalties the goalkeeper is positioned strictly in the center of the goal post (0.0)
    return 0.0;
  }

  const rng = Math.random();
  const absX = Math.abs(ballX);

  if (absX >= 1.0) {
    // Kick from side angle:
    // Real football tactic: GK guards the far post (opposite side of the defensive wall)
    const oppositeSign = ballX > 0 ? -1 : 1;
    
    if (rng < 0.76) {
      // Opposite side (far post side, giving striker open space on near side past wall)
      const offset = 1.35 + Math.random() * 0.95; // 1.35m to 2.30m
      return oppositeSign * offset;
    } else if (rng < 0.90) {
      // Centered stance
      return (Math.random() - 0.5) * 0.4; // -0.2m to +0.2m
    } else {
      // Moderate opposite shade
      return oppositeSign * (0.8 + Math.random() * 0.5);
    }
  } else {
    // Central free kick:
    // 40% center, 30% left side, 30% right side
    if (rng < 0.40) {
      return (Math.random() - 0.5) * 0.4;
    } else if (rng < 0.70) {
      return -1.2 - Math.random() * 0.8; // -1.2m to -2.0m
    } else {
      return 1.2 + Math.random() * 0.8;  // +1.2m to +2.0m
    }
  }
}

/**
 * Automatically & Intelligently calculates realistic ball curve (Magnus effect spin)
 * based on goalkeeper positioning, wall location, shot aim progress, power level, and pitch angle.
 */
function calculateIntelligentCurve(
  aimProgress: number,
  power: number,
  _ballPos: THREE.Vector3 | null,
  gkStartX: number,
  wallX?: number,
  _distance: number = 24,
  fkXOffset: number = 0
): number {
  const MAX_CURVE = 38.0;
  // Aim target progress: 0.0 (far left post) to 0.5 (center) to 1.0 (far right post)
  const aimDiff = aimProgress - 0.5; // negative = aiming left, positive = aiming right
  const isAimingLeft = aimDiff < -0.03;
  const isAimingRight = aimDiff > 0.03;

  let baseCurve = 0;

  if (isAimingLeft) {
    // Curving into the left side of the net:
    // Natural inside right-foot curl / banana bend around the wall into the top corner
    const severity = Math.min(1.0, Math.abs(aimDiff) / 0.45);
    baseCurve = 16.0 + severity * 12.0;

    // If wall is positioned on the left side, increase whip to bend cleanly around the outer perimeter of wall
    if (wallX !== undefined && wallX < 0) {
      baseCurve += 5.0;
    }

    // If goalkeeper is guarding the center or right (gkStartX >= -0.4), curving far left beats the keeper's reach
    if (gkStartX > -0.4) {
      baseCurve += 4.0;
    }

    // When ball starts on right side of pitch curling back into left side (natural inside banana curve)
    if (fkXOffset > 0.5) {
      baseCurve += 4.5;
    }
  } else if (isAimingRight) {
    // Curving into the right side of the net:
    // Natural inside left-foot / trivela bend around the wall into the right corner
    const severity = Math.min(1.0, Math.abs(aimDiff) / 0.45);
    baseCurve = -(16.0 + severity * 12.0);

    // If wall is on the right side
    if (wallX !== undefined && wallX > 0) {
      baseCurve -= 5.0;
    }

    // If keeper is positioned centrally or to the left (gkStartX <= 0.4)
    if (gkStartX < 0.4) {
      baseCurve -= 4.0;
    }

    // When ball starts on left side of pitch curling back into right side
    if (fkXOffset < -0.5) {
      baseCurve -= 4.5;
    }
  } else {
    // Center aim: subtle knuckle or bend depending on ball pitch offset
    if (fkXOffset > 2.0) {
      baseCurve = 8.0;
    } else if (fkXOffset < -2.0) {
      baseCurve = -8.0;
    } else {
      baseCurve = 0.0;
    }
  }

  // Power-dependent Magnus Aerodynamics:
  // - Low power (<= 25%): Completely cancelled (0.0 curve) for crisp, direct ground passes to teammates
  // - Low-to-mid power (26-49%): Progressive curve scaling so short passes stay on target
  // - Sweet spot zone (62-84%): Maximum aerodynamic Magnus lift, dip, and lateral curl
  // - Knuckleball / ultra-high power (88-100%): Tight, aggressive, high-velocity trajectory
  if (power <= 25) {
    return 0.0;
  } else if (power < 50) {
    const lowPowerRatio = (power - 25) / 25;
    baseCurve *= Math.pow(lowPowerRatio, 1.25);
  } else if (power >= 88) {
    baseCurve *= 0.88;
  } else if (power >= 62 && power <= 84) {
    baseCurve *= 1.15;
  }

  return THREE.MathUtils.clamp(baseCurve, -MAX_CURVE, MAX_CURVE);
}

// Power Charge Audio Synthesizer (Disabled as requested - power meter operates silently)
function startPowerChargeAudio() {
  // Silent power charging
}

function updatePowerChargeAudio(_powerPercent: number) {
  // Silent power charging
}

function stopPowerChargeAudio() {
  // Silent power charging
}

export default function Stadium3DView({
  country,
  opponentCountry,
  onBack,
  onReselectTeam,
  titleMode = 'Quick Play - Offline',
  gameMode = 'match',
  onSurvivalComplete,
  onlineMatchRoom,
  tournamentState,
  activeTournamentMatch,
  onMatchComplete,
  onReturnToTournament,
  onReturnToDivisions,
  equippedBallId = 'aero_tricolor_pro',
  equippedPitchId = 'classic_stripes',
  onEarnCoins,
  savedReplayClip,
}: Stadium3DViewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const freeKickGroupRef = useRef<THREE.Group | null>(null);
  const aimArrowGroupRef = useRef<THREE.Group | null>(null);
  const slingshotGroupRef = useRef<THREE.Group | null>(null);
  const curveArrowGroupRef = useRef<THREE.Group | null>(null);
  const targetRingRef = useRef<THREE.Group | null>(null);
  const fansListRef = useRef<StadiumFan[]>([]);
  const activePlayersListRef = useRef<THREE.Group[]>([]);
  const prevBallPosRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // Online Multiplayer State
  const isOnlineMatch = Boolean(onlineMatchRoom);
  const isLocalHost = onlineMatchRoom
    ? (onlineMatchManager.currentRoom
        ? (onlineMatchManager.currentRoom.host.id === onlineMatchManager.localPlayerId || onlineMatchManager.currentRoom.host.isLocal)
        : (onlineMatchRoom.host.id === onlineMatchManager.localPlayerId || onlineMatchRoom.host.isLocal))
    : true;
  const isBotMatch = Boolean(
    onlineMatchRoom?.guest?.id?.toLowerCase().startsWith('bot_') ||
    onlineMatchRoom?.host?.id?.toLowerCase().startsWith('bot_') ||
    onlineMatchManager.currentRoom?.guest?.id?.toLowerCase().startsWith('bot_') ||
    onlineMatchManager.currentRoom?.host?.id?.toLowerCase().startsWith('bot_') ||
    (onlineMatchRoom?.guest && !onlineMatchRoom.guest.isLocal && !onlineMatchRoom.guest.id?.startsWith('P_')) ||
    (onlineMatchManager.currentRoom?.guest && !onlineMatchManager.currentRoom.guest.isLocal && !onlineMatchManager.currentRoom.guest.id?.startsWith('P_'))
  );
  const [freeKickEpoch, setFreeKickEpoch] = useState<number>(0);

  // Mode Detections
  const isSurvival = gameMode === 'survival';
  const isWagerMatch = Boolean(
    onlineMatchRoom?.wagerTier ||
    onlineMatchRoom?.prizePot ||
    (titleMode?.toLowerCase().includes('wager') ?? false)
  );
  const wagerTierId = onlineMatchRoom?.wagerTier || 'rookie';
  const wagerTierInfo = WAGER_TIERS.find((t) => t.id === wagerTierId) || WAGER_TIERS[0];
  const wagerPrizePot = onlineMatchRoom?.prizePot || wagerTierInfo.prizePot;
  const wagerEntryFee = onlineMatchRoom?.entryFee || wagerTierInfo.entryFee;

  // Survival Mode States
  const [survivalLives, setSurvivalLives] = useState<number>(3);
  const survivalLivesRef = useRef<number>(3);
  useEffect(() => { survivalLivesRef.current = survivalLives; }, [survivalLives]);
  const [aiSurvivalLives, setAiSurvivalLives] = useState<number>(3);
  const aiSurvivalLivesRef = useRef<number>(3);
  useEffect(() => { aiSurvivalLivesRef.current = aiSurvivalLives; }, [aiSurvivalLives]);
  const [hostSurvivalLives, setHostSurvivalLives] = useState<number>(() => onlineMatchRoom?.survivalLives?.host ?? 3);
  const hostSurvivalLivesRef = useRef<number>(onlineMatchRoom?.survivalLives?.host ?? 3);
  useEffect(() => { hostSurvivalLivesRef.current = hostSurvivalLives; }, [hostSurvivalLives]);
  const [guestSurvivalLives, setGuestSurvivalLives] = useState<number>(() => onlineMatchRoom?.survivalLives?.guest ?? 3);
  const guestSurvivalLivesRef = useRef<number>(onlineMatchRoom?.survivalLives?.guest ?? 3);
  useEffect(() => { guestSurvivalLivesRef.current = guestSurvivalLives; }, [guestSurvivalLives]);
  const [survivalBestStreak, setSurvivalBestStreak] = useState<number>(() => {
    try {
      const raw = crazyGamesSDK.getItemSync('fkl_survival_best_streak_v1');
      if (raw) {
        const val = parseInt(raw, 10);
        if (!isNaN(val)) return val;
      }
    } catch {}
    return 0;
  });

  // Async load survival best streak from CrazyGames Data Module on mount
  useEffect(() => {
    crazyGamesSDK.getItem('fkl_survival_best_streak_v1').then((cloudVal) => {
      if (cloudVal) {
        const parsed = parseInt(cloudVal, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          setSurvivalBestStreak((prev) => Math.max(prev, parsed));
        }
      }
    }).catch(() => {});
  }, []);

  const [survivalStreak, setSurvivalStreak] = useState<number>(0);
  const survivalStreakRef = useRef<number>(0);
  useEffect(() => { survivalStreakRef.current = survivalStreak; }, [survivalStreak]);
  const [survivalScore, setSurvivalScore] = useState<number>(0);
  const [showSurvivalGameOver, setShowSurvivalGameOver] = useState<boolean>(false);
  const [hasUsedSurvivalRevive, setHasUsedSurvivalRevive] = useState<boolean>(false);

  // Superpowers State (Fireball, Laser Aim, Multiball)
  const [superpowerCharge, setSuperpowerCharge] = useState<number>(0);
  const [activeSuperpower, setActiveSuperpower] = useState<SuperpowerType | null>(null);
  const activeSuperpowerRef = useRef<SuperpowerType | null>(null);
  useEffect(() => { activeSuperpowerRef.current = activeSuperpower; }, [activeSuperpower]);

  const handleActivateSuperpower = (type: SuperpowerType) => {
    if (superpowerCharge < 100) return;
    setActiveSuperpower(type);
    activeSuperpowerRef.current = type;
    setSuperpowerCharge(0);
    playSuperpowerSound(type);
  };

  // Player Profiles & CrazyGames SDK Avatar Integration
  const localPlayerName = onlineMatchManager.localPlayerName || 'You';
  const rawLocalProfilePic = isOnlineMatch
    ? (isLocalHost
        ? (onlineMatchManager.currentRoom?.host?.profilePictureUrl || onlineMatchRoom?.host?.profilePictureUrl || onlineMatchManager.localPlayerProfilePictureUrl || null)
        : (onlineMatchManager.currentRoom?.guest?.profilePictureUrl || onlineMatchRoom?.guest?.profilePictureUrl || onlineMatchManager.localPlayerProfilePictureUrl || null))
    : (onlineMatchManager.localPlayerProfilePictureUrl || null);
  const localPlayerProfilePicture = rawLocalProfilePic || getStickerAvatarUrl(localPlayerName, 0);

  const oppPlayerName = isOnlineMatch
    ? (isLocalHost
        ? (onlineMatchManager.currentRoom?.guest?.name || onlineMatchRoom?.guest?.name || 'Online Opponent')
        : (onlineMatchManager.currentRoom?.host?.name || onlineMatchRoom?.host?.name || 'Room Host'))
    : (opponentCountry?.name || 'CPU Rival');

  const rawOppProfilePic = isOnlineMatch
    ? (isLocalHost
        ? (onlineMatchManager.currentRoom?.guest?.profilePictureUrl || onlineMatchRoom?.guest?.profilePictureUrl || null)
        : (onlineMatchManager.currentRoom?.host?.profilePictureUrl || onlineMatchRoom?.host?.profilePictureUrl || null))
    : null;
  const oppPlayerProfilePicture = rawOppProfilePic || getStickerAvatarUrl(oppPlayerName || 'Opponent', 1);

  // Smooth Camera Transition State
  const isCamInitializedRef = useRef<boolean>(false);
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const targetCamLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const targetCamFovRef = useRef<number>(48);
  const startCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const startCamLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const startCamFovRef = useRef<number>(48);
  const isTransitioningCamRef = useRef<boolean>(false);
  const transitionStartTimeRef = useRef<number>(0);
  const camTransitionDurationRef = useRef<number>(650);

  const [autoRotate, setAutoRotate] = useState(false);

  // Training / Practice Mode detection
  const isPenaltyTraining = gameMode === 'penalty_training' || (titleMode?.toLowerCase().includes('penalty') ?? false);
  const isFreeKickTraining = gameMode === 'free_kick_training' || ((titleMode?.toLowerCase().includes('free kick') && (titleMode?.toLowerCase().includes('training') || titleMode?.toLowerCase().includes('practice'))) ?? false);
  const isPracticeMode = isPenaltyTraining || isFreeKickTraining || ((titleMode?.toLowerCase().includes('training') || titleMode?.toLowerCase().includes('practice')) ?? false);
  const isWorldCupMatch = !isPracticeMode && Boolean(
    tournamentState ||
    activeTournamentMatch ||
    (titleMode?.toLowerCase().includes('tournament') ?? false) ||
    (titleMode?.toLowerCase().includes('world cup') ?? false) ||
    (titleMode?.toLowerCase().includes('global cup') ?? false) ||
    (titleMode?.toLowerCase().includes('custom cup') ?? false)
  );

  // Play-In Feature (15s action countdown): Disabled in Practice and Quick Play Offline, only active in Online matches
  const isPlayInFeatureActive = !isPracticeMode && isOnlineMatch;

  // Formats the exact current tournament match stage (e.g. Group Match, Round of 32, Round of 16, Quarter Finals, Semi Finals, Finals)
  const getWorldCupStageLabel = (): string => {
    // 1. Check activeTournamentMatch
    if (activeTournamentMatch) {
      const stage = (activeTournamentMatch.stage as string) || '';
      if (stage === 'group') {
        const md = (activeTournamentMatch as TournamentMatch).matchday;
        return md ? `GROUP MATCH ${md}` : 'GROUP MATCH';
      }
      if (stage === 'round_of_32' || stage.includes('32')) return 'ROUND OF 32';
      if (stage === 'round_of_16' || stage.includes('16')) return 'ROUND OF 16';
      if (stage === 'quarter_final' || stage.includes('quarter')) return 'QUARTER FINALS';
      if (stage === 'semi_final' || stage.includes('semi')) return 'SEMI FINALS';
      if (stage === 'final') return 'FINALS';
      if (activeTournamentMatch.stageName) {
        const sn = activeTournamentMatch.stageName.toLowerCase();
        if (sn.includes('round of 32') || sn.includes('r32')) return 'ROUND OF 32';
        if (sn.includes('round of 16') || sn.includes('r16')) return 'ROUND OF 16';
        if (sn.includes('quarter')) return 'QUARTER FINALS';
        if (sn.includes('semi')) return 'SEMI FINALS';
        if (sn.includes('final') && !sn.includes('semi') && !sn.includes('quarter')) return 'FINALS';
        if (sn.includes('group')) return 'GROUP MATCH';
        return activeTournamentMatch.stageName.toUpperCase();
      }
    }

    // 2. Check tournamentState
    if (tournamentState?.currentStage) {
      const stage = (tournamentState.currentStage as string) || '';
      if (stage === 'group') {
        const md = tournamentState.currentMatchday;
        return md ? `GROUP MATCH ${md}` : 'GROUP MATCH';
      }
      if (stage === 'round_of_32' || stage.includes('32')) return 'ROUND OF 32';
      if (stage === 'round_of_16' || stage.includes('16')) return 'ROUND OF 16';
      if (stage === 'quarter_final' || stage.includes('quarter')) return 'QUARTER FINALS';
      if (stage === 'semi_final' || stage.includes('semi')) return 'SEMI FINALS';
      if (stage === 'final') return 'FINALS';
      return stage.replace(/_/g, ' ').toUpperCase();
    }

    // 3. Check titleMode text
    if (titleMode) {
      const lower = titleMode.toLowerCase();
      if (lower.includes('round of 32') || lower.includes('r32')) return 'ROUND OF 32';
      if (lower.includes('round of 16') || lower.includes('r16')) return 'ROUND OF 16';
      if (lower.includes('quarter')) return 'QUARTER FINALS';
      if (lower.includes('semi')) return 'SEMI FINALS';
      if (lower.includes('final') && !lower.includes('semi') && !lower.includes('quarter')) return 'FINALS';
      if (lower.includes('group')) return 'GROUP MATCH';
    }

    return 'GROUP MATCH';
  };

  // Mode-Specific AI Maximum Goal Caps (Strict max 3 in all Offline Modes):
  // - Offline Mode (World Cup, Tournament, Quick Match, Survival, Wager): Strict maximum 3 goals
  // - FIFA World Cup Final: Max 3 goals
  // - FIFA World Cup Semi & Quarter Finals: Max 2 goals
  // - FIFA World Cup Group Stage & Round of 16/32: Max 2 goals
  // - Stadium Quick Match: Max 3 goals
  // - Survival Mode & Offline Wager: Max 3 goals
  // Note: These caps are maximum ceiling limits; the AI is not guaranteed or forced to reach 3 in all matches.
  const getAiMaxGoalCap = (): number => {
    if (isOnlineMatch && !isBotMatch) {
      return 99; // Human vs Human online: no artificial AI cap
    }
    if (isOnlineMatch && isBotMatch) {
      return 3; // Online Duel against AI bot: Max 3 goals
    }
    if (isWagerMatch) {
      return 3; // Coin Wager Mode: Max 3 goals against AI
    }
    if (isSurvival) {
      return 3; // Survival Mode: Max 3 goals against AI
    }
    if (isWorldCupMatch) {
      const stageLabel = getWorldCupStageLabel();
      if (stageLabel.includes('FINAL') && !stageLabel.includes('SEMI') && !stageLabel.includes('QUARTER')) {
        return 3; // World Cup Final: Max 3 goals
      }
      if (stageLabel.includes('SEMI') || stageLabel.includes('QUARTER')) {
        return 2; // Semi-Finals & Quarter-Finals: Max 2 goals
      }
      return 2; // Group Stage & Round of 16 / 32: Max 2 goals
    }
    return 3; // Stadium Quick Play: Max 3 goals
  };

  // Check if current match is specifically a Knockout Stage match (which requires a winner via penalties if drawn)
  const isKnockoutMatch = (() => {
    if (isPracticeMode || !isWorldCupMatch) return false;
    const stageLabel = getWorldCupStageLabel();
    if (stageLabel.startsWith('GROUP')) return false;
    return (
      stageLabel.includes('ROUND OF 32') ||
      stageLabel.includes('ROUND OF 16') ||
      stageLabel.includes('QUARTER') ||
      stageLabel.includes('SEMI') ||
      stageLabel.includes('FINAL')
    );
  })();

  const isKnockoutMatchRef = useRef<boolean>(isKnockoutMatch);
  useEffect(() => {
    isKnockoutMatchRef.current = isKnockoutMatch;
  }, [isKnockoutMatch]);

  const isPracticeModeRef = useRef<boolean>(isPracticeMode);
  const isPenaltyTrainingRef = useRef<boolean>(isPenaltyTraining);
  useEffect(() => {
    isPracticeModeRef.current = isPracticeMode;
    isPenaltyTrainingRef.current = isPenaltyTraining;
  }, [isPracticeMode, isPenaltyTraining]);

  // Active Position Index (0 to 29)
  const initialPosIndex = onlineMatchRoom?.positionIndex !== undefined
    ? onlineMatchRoom.positionIndex
    : Math.floor(Math.random() * FREE_KICK_POSITIONS.length);
  const [currentPosIndex, setCurrentPosIndex] = useState<number>(initialPosIndex);
  const currentPosIndexRef = useRef<number>(currentPosIndex);
  useEffect(() => {
    currentPosIndexRef.current = currentPosIndex;
  }, [currentPosIndex]);

  const activePosition = FREE_KICK_POSITIONS[currentPosIndex] || FREE_KICK_POSITIONS[0];

  // Scoreboard State
  const [currentLocalCountry, setCurrentLocalCountry] = useState<Country>(country);
  const [currentOpponentCountry, setCurrentOpponentCountry] = useState<Country | undefined>(opponentCountry);
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState<boolean>(
    Boolean(onlineMatchRoom?.isOpponentDisconnected || onlineMatchRoom?.status === 'opponent_left' || onlineMatchManager.currentRoom?.isOpponentDisconnected || onlineMatchManager.currentRoom?.status === 'opponent_left')
  );
  const [isOpponentQuitModalOpen, setIsOpponentQuitModalOpen] = useState<boolean>(false);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const homeScoreRef = useRef<number>(0);
  const awayScoreRef = useRef<number>(0);
  useEffect(() => {
    homeScoreRef.current = homeScore;
  }, [homeScore]);
  useEffect(() => {
    awayScoreRef.current = awayScore;
  }, [awayScore]);

  // Practice Match Stats (Goals Scored, Current Consecutive Streak, Best Peak Streak)
  const [practiceGoals, setPracticeGoals] = useState<number>(0);
  const [practiceStreak, setPracticeStreak] = useState<number>(0);
  const [practiceBestStreak, setPracticeBestStreak] = useState<number>(0);

  // Online Survival 100-Second Match Timer (Countdown from 100s to 0s)
  const [survivalOnlineTime, setSurvivalOnlineTime] = useState<number>(100);
  const survivalOnlineTimeRef = useRef<number>(100);
  useEffect(() => {
    survivalOnlineTimeRef.current = survivalOnlineTime;
  }, [survivalOnlineTime]);

  // Match Timer State (0 to 90 Match Minutes - disabled in Practice/Training/Survival)
  const [matchTime, setMatchTime] = useState<number>(0);
  const matchTimeRef = useRef<number>(0);
  useEffect(() => {
    matchTimeRef.current = matchTime;
  }, [matchTime]);

  const [stoppageSeconds, setStoppageSeconds] = useState<number | null>(null);
  const stoppageSecondsRef = useRef<number | null>(null);
  useEffect(() => {
    stoppageSecondsRef.current = stoppageSeconds;
  }, [stoppageSeconds]);
  const [stoppageCountdown, setStoppageCountdown] = useState<number>(0);
  const stoppageCountdownRef = useRef<number>(0);
  useEffect(() => {
    stoppageCountdownRef.current = stoppageCountdown;
  }, [stoppageCountdown]);

  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const isGameOverRef = useRef<boolean>(false);
  useEffect(() => {
    isGameOverRef.current = isGameOver;
  }, [isGameOver]);

  // Penalty Shootout State & Refs
  const [penaltyShootout, setPenaltyShootout] = useState<{
    isActive: boolean;
    homeKicks: (boolean | null)[];
    awayKicks: (boolean | null)[];
    homePenaltiesScore: number;
    awayPenaltiesScore: number;
    currentKicker: 'player' | 'ai';
    round: number;
    winner: 'player' | 'ai' | null;
    statusText: string;
  }>({
    isActive: false,
    homeKicks: [null, null, null, null, null],
    awayKicks: [null, null, null, null, null],
    homePenaltiesScore: 0,
    awayPenaltiesScore: 0,
    currentKicker: 'player',
    round: 1,
    winner: null,
    statusText: '',
  });

  const isPenaltyShootoutRef = useRef<boolean>(false);
  const penaltyShootoutRef = useRef(penaltyShootout);
  useEffect(() => {
    isPenaltyShootoutRef.current = penaltyShootout.isActive;
    penaltyShootoutRef.current = penaltyShootout;
  }, [penaltyShootout]);

  const [showPenaltyAnnouncement, setShowPenaltyAnnouncement] = useState<boolean>(false);

  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [roundResultData, setRoundResultData] = useState<CompletedRoundData | null>(null);

  useEffect(() => {
    if (isGameOver && tournamentState && activeTournamentMatch) {
      try {
        const { roundData } = processCompletedRound(
          tournamentState,
          activeTournamentMatch,
          homeScore,
          awayScore,
          penaltyShootout.isActive ? penaltyShootout.homePenaltiesScore : undefined,
          penaltyShootout.isActive ? penaltyShootout.awayPenaltiesScore : undefined
        );
        setRoundResultData(roundData);
      } catch (err) {
        console.error('Error processing tournament round:', err);
      }
    }
  }, [isGameOver, tournamentState, activeTournamentMatch, homeScore, awayScore, penaltyShootout]);

  // Match Statistics
  const [matchStats, setMatchStats] = useState({
    playerShots: 0,
    aiShots: 0,
    playerGoals: 0,
    aiGoals: 0,
    playerWoodwork: 0,
    aiWoodwork: 0,
  });
  const matchStatsRef = useRef(matchStats);
  useEffect(() => {
    matchStatsRef.current = matchStats;
  }, [matchStats]);

  const isTimeExpiredRef = useRef<boolean>(false);
  const [isTimeExpired, setIsTimeExpired] = useState<boolean>(false);

  // Kits for selected countries
  const myKit = getCountryKit(country.code);
  const oppCountryCode = opponentCountry ? opponentCountry.code : (country.code === 'br' ? 'ar' : 'br');
  const effectiveOppCountryCode = isOnlineMatch
    ? (isLocalHost
        ? (onlineMatchManager.currentRoom?.guest?.countryCode || onlineMatchRoom?.guest?.countryCode || opponentCountry?.code || oppCountryCode)
        : (onlineMatchManager.currentRoom?.host?.countryCode || onlineMatchRoom?.host?.countryCode || opponentCountry?.code || oppCountryCode))
    : (opponentCountry?.code || oppCountryCode);
  const effectiveOppCountryName = COUNTRIES_DATA.find((c) => c.code.toLowerCase() === effectiveOppCountryCode.toLowerCase())?.name || opponentCountry?.name || 'Opponent';
  const oppKit = getCountryKit(effectiveOppCountryCode);

  // Free Kick / Penalty Scenario State
  const [fkDistance, setFkDistance] = useState<number>(() => isPenaltyTraining ? PENALTY_DISTANCE : activePosition.distance);
  const [fkXOffset, setFkXOffset] = useState<number>(() => isPenaltyTraining ? 0.0 : activePosition.xOffset);
  const [targetCorner, setTargetCorner] = useState<'top-right' | 'top-left' | 'top-center' | 'low-right' | 'low-left'>('top-right');
  const [wallSize, setWallSize] = useState<number>(() => isPenaltyTraining ? 0 : activePosition.wallSize);

  // Step State Flow: 'aim' -> 'power' -> 'curve' -> 'kicking' -> 'finished'
  const [setupStep, setSetupStep] = useState<'aim' | 'power' | 'curve' | 'kicking' | 'finished'>('aim');

  // 15s Play-In Timer State & Ref (auto-kicks randomly if user doesn't shoot before 15s)
  const [playInTimer, setPlayInTimer] = useState<number>(15);
  const playInTimerRef = useRef<number>(15);
  const [turnEpoch, setTurnEpoch] = useState<number>(0);
  useEffect(() => {
    playInTimerRef.current = playInTimer;
  }, [playInTimer]);

  const MAX_CURVE_LIMIT = 32.0;
  const [aimProgress, setAimProgress] = useState<number>(0.5);
  const [power, setPower] = useState<number>(50);
  const [curveAmount, setCurveAmount] = useState<number>(0);
  const [shotOutcome, setShotOutcome] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // 3D Stadium Scene Loading Screen State & Progress
  const [sceneLoading, setSceneLoading] = useState<boolean>(!savedReplayClip);
  const [loadingProgress, setLoadingProgress] = useState<number>(savedReplayClip ? 100 : 0);
  const isSavedReplayModeRef = useRef<boolean>(Boolean(savedReplayClip));

  useEffect(() => {
    isSavedReplayModeRef.current = Boolean(savedReplayClip);
  }, [savedReplayClip]);

  useEffect(() => {
    if (savedReplayClip) {
      setLoadingProgress(100);
      setSceneLoading(false);
      crazyGamesSDK.loadingStop();
      crazyGamesSDK.gameplayStart();

      if (savedReplayClip.frames && savedReplayClip.frames.length > 1) {
        setFkDistance(savedReplayClip.distance || 25);
        activeReplayClipRef.current = [...savedReplayClip.frames];
        const totalDuration = savedReplayClip.frames[savedReplayClip.frames.length - 1].time;
        const cleanDuration = Math.max(200, totalDuration);
        replayDurationRef.current = cleanDuration;
        setReplayDuration(cleanDuration);
        replayPlayheadTimeRef.current = 0;
        setReplayPlayheadTime(0);
        replayIndexRef.current = 1;
        setReplayIndex(1);
        replayCamAngleRef.current = 'ball_tracking';
        setReplayCamAngle('ball_tracking');
        userInteractedWithReplayCamRef.current = false;
        isReplayPausedRef.current = false;
        setIsReplayPaused(false);
        replaySpeedRef.current = 0.65;
        setReplaySpeed(0.65);
        isReplayActiveRef.current = true;
        setIsReplayActive(true);

        setTimeout(() => {
          if (cameraRef.current && controlsRef.current && savedReplayClip.frames[0]) {
            const origSpotX = savedReplayClip.frames[0]?.ball?.pos[0] ?? 0;
            const origSpotZ = savedReplayClip.frames[0]?.ball?.pos[2] ?? (-42.0 + (savedReplayClip.distance || 25));
            cameraRef.current.position.set(origSpotX * 0.35, 3.8, origSpotZ + 7.5);
            controlsRef.current.target.set(origSpotX * 0.35, 1.2, origSpotZ - 10.0);
            cameraRef.current.fov = 48;
            cameraRef.current.updateProjectionMatrix();
            controlsRef.current.enabled = false;
            controlsRef.current.enableRotate = false;
            controlsRef.current.enableZoom = false;
            controlsRef.current.enablePan = false;
            controlsRef.current.update();
          }
        }, 100);
      }
      return () => {
        crazyGamesSDK.gameplayStop();
      };
    }

    crazyGamesSDK.loadingStart();
    
    // If this is a Wager Arena match, deduct the entry fee from the user at match start
    const entryFee = onlineMatchRoom?.entryFee;
    if (entryFee && entryFee > 0) {
      onEarnCoins?.(-entryFee);
    }

    const startTime = Date.now();
    const duration = 2400;
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setLoadingProgress(pct);
      if (elapsed >= duration) {
        clearInterval(progressInterval);
      }
    }, 30);

    // 2.4s loading duration with smooth transition to the first free kick position
    const timer = setTimeout(() => {
      setSceneLoading(false);
      crazyGamesSDK.loadingStop();
      crazyGamesSDK.gameplayStart();
    }, 2400);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
      crazyGamesSDK.gameplayStop();
    };
  }, []);

  // Turn State ('player' | 'ai')
  // In Online Matches: Room Host plays first (Turn 1: 'player' for Host, 'ai' for Guest)
  const initialTurn = isOnlineMatch ? (isLocalHost ? 'player' : 'ai') : 'player';
  const [currentTurn, setCurrentTurn] = useState<'player' | 'ai'>(initialTurn);
  const currentTurnRef = useRef<'player' | 'ai'>(initialTurn);
  useEffect(() => {
    currentTurnRef.current = currentTurn;
    if (aimArrowGroupRef.current) {
      aimArrowGroupRef.current.visible = currentTurn === 'player' && !isGameOver && !sceneLoading;
    }
    if (slingshotGroupRef.current) {
      slingshotGroupRef.current.visible = currentTurn === 'player' && !isGameOver && !sceneLoading;
    }
  }, [currentTurn, isGameOver, sceneLoading]);

  // AI Status State
  const [aiStepStatus, setAiStepStatus] = useState<string>('');
  const aiConsecutiveGoalsRef = useRef<number>(0);

  useEffect(() => {
    // Media unlock listener active
  }, []);

  // Dynamic Real Stadium Crowd Audio & Normal Chants Engine (Wind Sound in Survival Mode)
  useEffect(() => {
    if (!isPracticeMode && !sceneLoading) {
      startMatchCrowd({ isPractice: isPracticeMode, isSurvival: isSurvival });
    } else {
      stopMatchCrowd();
    }
    return () => {
      stopMatchCrowd();
      stopGoalCheerSound();
    };
  }, [isPracticeMode, sceneLoading, isSurvival]);

  const shotOutcomeRef = useRef<string | null>(null);
  const isPausedRef = useRef<boolean>(false);
  const pauseStartTimeRef = useRef<number>(0);

  // Synchronize pause state and shift time-tracking refs across pause duration
  useEffect(() => {
    isPausedRef.current = showExitModal;
    if (showExitModal) {
      pauseStartTimeRef.current = performance.now();
      crazyGamesSDK.gameplayStop();
    } else if (pauseStartTimeRef.current > 0) {
      const pauseDuration = performance.now() - pauseStartTimeRef.current;
      pauseStartTimeRef.current = 0;
      if (aimStartTimeRef.current > 0) aimStartTimeRef.current += pauseDuration;
      if (powerStartTimeRef.current > 0) powerStartTimeRef.current += pauseDuration;
      if (curveStartTimeRef.current > 0) curveStartTimeRef.current += pauseDuration;
      if (runStartTimeRef.current > 0) runStartTimeRef.current += pauseDuration;
      if (kickStartTimeRef.current > 0) kickStartTimeRef.current += pauseDuration;
      if (flightStartTimeRef.current > 0) flightStartTimeRef.current += pauseDuration;
      if (shotFinishedTimeRef.current > 0) shotFinishedTimeRef.current += pauseDuration;
      if (goalVibrationRef.current) goalVibrationRef.current.startTime += pauseDuration;
      crazyGamesSDK.gameplayStart();
    }
  }, [showExitModal]);

  // 90-Minute Match Timer Progression (Ticks up from 0' to 90'; disabled in practice/training/survival)
  useEffect(() => {
    if (sceneLoading || isPracticeMode || isSurvival || isGameOver || showExitModal || showResultsModal || isOpponentQuitModalOpen || isPenaltyShootoutRef.current) return;

    if (isOnlineMatch && !isLocalHost) {
      // GUEST: Ticks forward in sync with host
      const guestTimer = setInterval(() => {
        setMatchTime((prev) => (prev < 90 ? prev + 1 : 90));
      }, 1000);
      return () => clearInterval(guestTimer);
    }

    // HOST (Master Clock): authoritative tick up to 90'
    const timer = setInterval(() => {
      // Pause clock progression during replay clips so players don't lose match minutes
      if (isReplayActiveRef.current) return;

      setMatchTime((prev) => {
        const nextTime = prev < 90 ? prev + 1 : 90;
        if (isOnlineMatch && isLocalHost) {
          onlineMatchManager.syncMatchTime(nextTime);
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sceneLoading, isPracticeMode, isSurvival, isGameOver, showExitModal, showResultsModal, isOpponentQuitModalOpen, isOnlineMatch, isLocalHost]);

  // 100-Second Survival Match Timer Progression (Ticks down from 100s to 0s for Online & Offline)
  useEffect(() => {
    if (sceneLoading || isGameOver || showExitModal || showResultsModal || isOpponentQuitModalOpen || !isSurvival) return;

    if (isOnlineMatch && !isLocalHost) {
      // GUEST: Local countdown fallback in sync with host
      const guestSurvivalTimer = setInterval(() => {
        if (isReplayActiveRef.current) return;
        setSurvivalOnlineTime((prev) => {
          const nextVal = Math.max(0, prev - 1);
          if (nextVal === 0) {
            const isShotInFlight = shotPhaseRef.current !== 'idle' && shotPhaseRef.current !== 'finished';
            const isReplayOrFinishing = isReplayActiveRef.current || (shotPhaseRef.current === 'finished' && shotFinishedTimeRef.current > 0);
            if (!isShotInFlight && !isReplayOrFinishing) {
              concludeSurvivalMatchByLives(false);
            }
          }
          return nextVal;
        });
      }, 1000);
      return () => clearInterval(guestSurvivalTimer);
    }

    // HOST or OFFLINE (Master Clock): authoritative 100s countdown
    const hostSurvivalTimer = setInterval(() => {
      if (isReplayActiveRef.current) return;

      setSurvivalOnlineTime((prev) => {
        const nextTime = Math.max(0, prev - 1);
        if (isOnlineMatch && isLocalHost) {
          onlineMatchManager.syncMatchTime(nextTime, 0);
        }
        if (nextTime === 0) {
          const isShotInFlight = shotPhaseRef.current !== 'idle' && shotPhaseRef.current !== 'finished';
          const isReplayOrFinishing = isReplayActiveRef.current || (shotPhaseRef.current === 'finished' && shotFinishedTimeRef.current > 0);
          if (!isShotInFlight && !isReplayOrFinishing) {
            concludeSurvivalMatchByLives(isOnlineMatch && isLocalHost);
          }
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(hostSurvivalTimer);
  }, [sceneLoading, isGameOver, showExitModal, showResultsModal, isOpponentQuitModalOpen, isSurvival, isOnlineMatch, isLocalHost]);

  // Robust Watchdog Effect for Survival Timer Expiration
  useEffect(() => {
    if (sceneLoading || isGameOver || showExitModal || showResultsModal || isOpponentQuitModalOpen || !isSurvival) return;
    if (survivalOnlineTime > 0) return;

    const checkAndConcludeSurvival = () => {
      if (isGameOverRef.current) return;
      const isShotInFlight = shotPhaseRef.current !== 'idle' && shotPhaseRef.current !== 'finished';
      const isReplayOrFinishing = isReplayActiveRef.current || (shotPhaseRef.current === 'finished' && shotFinishedTimeRef.current > 0);
      if (isShotInFlight || isReplayOrFinishing) return;

      concludeSurvivalMatchByLives(isOnlineMatch && isLocalHost);
    };

    checkAndConcludeSurvival();
    const interval = setInterval(checkAndConcludeSurvival, 300);
    return () => clearInterval(interval);
  }, [survivalOnlineTime, sceneLoading, isGameOver, showExitModal, showResultsModal, isOpponentQuitModalOpen, isSurvival, isOnlineMatch, isLocalHost]);

  const startPenaltyShootout = () => {
    const initialShootout = {
      isActive: true,
      homeKicks: [null, null, null, null, null] as (boolean | null)[],
      awayKicks: [null, null, null, null, null] as (boolean | null)[],
      homePenaltiesScore: 0,
      awayPenaltiesScore: 0,
      currentKicker: 'player' as 'player' | 'ai',
      round: 1,
      winner: null as 'player' | 'ai' | null,
      statusText: 'ROUND 1 • YOUR PENALTY KICK',
    };
    setPenaltyShootout(initialShootout);
    penaltyShootoutRef.current = initialShootout;
    isPenaltyShootoutRef.current = true;
    setShowPenaltyAnnouncement(true);
    setTimeout(() => {
      setShowPenaltyAnnouncement(false);
    }, 2800);

    // Position ball on 11m penalty spot, clear wall, reset setup
    setFkDistance(PENALTY_DISTANCE);
    setFkXOffset(0.0);
    setWallSize(0);
    setCurrentTurn('player');
    currentTurnRef.current = 'player';
    setFreeKickEpoch((prev) => prev + 1);
    resetToDefaultState();
  };

  // Survival Conclusion: When 100s timer hits 0 or a player/AI loses all lives
  const concludeSurvivalMatchByLives = (syncOnline: boolean = true) => {
    if (isGameOverRef.current) return;

    const myLives = isOnlineMatch
      ? (isLocalHost ? hostSurvivalLivesRef.current : guestSurvivalLivesRef.current)
      : survivalLivesRef.current;
    const oppLives = isOnlineMatch
      ? (isLocalHost ? guestSurvivalLivesRef.current : hostSurvivalLivesRef.current)
      : aiSurvivalLivesRef.current;

    // Synchronize homeScore (player) and awayScore (opponent) to remaining lives for results page
    homeScoreRef.current = myLives;
    awayScoreRef.current = oppLives;
    setHomeScore(myLives);
    setAwayScore(oppLives);

    isGameOverRef.current = true;
    setIsGameOver(true);
    setShotOutcome(null);
    setShowResultsModal(true);
    stopGoalCheerSound();

    if (syncOnline && isOnlineMatch && isLocalHost) {
      onlineMatchManager.endMatch(hostSurvivalLivesRef.current, guestSurvivalLivesRef.current, {
        host: hostSurvivalLivesRef.current,
        guest: guestSurvivalLivesRef.current,
      });
    }

    onSurvivalComplete?.(survivalStreakRef.current, survivalScore);
    crazyGamesSDK.gameplayStop();

    // If player has more lives than opponent, trigger celebratory happytime
    if (myLives > oppLives) {
      crazyGamesSDK.happytime();
    }
  };

  // Unified Match Conclusion: Enforces equal turns, finishes any active shot/replay, plays referee whistle, and shows match results
  const concludeMatch = (syncOnline: boolean = true) => {
    if (isGameOverRef.current || isPenaltyShootoutRef.current) return;

    // In offline knockout matches, tie goes to penalty shootout
    if (!isOnlineMatch && homeScoreRef.current === awayScoreRef.current && isKnockoutMatchRef.current) {
      startPenaltyShootout();
      return;
    }

    isGameOverRef.current = true;
    setIsGameOver(true);
    setShotOutcome(null);
    setShowResultsModal(true);
    stopGoalCheerSound();

    if (syncOnline && isOnlineMatch && isLocalHost) {
      const hostScore = isLocalHost ? homeScoreRef.current : awayScoreRef.current;
      const guestScore = isLocalHost ? awayScoreRef.current : homeScoreRef.current;
      onlineMatchManager.endMatch(hostScore, guestScore);
    }

    crazyGamesSDK.gameplayStop();

    // Trigger celebratory SDK happytime if player won
    if (homeScoreRef.current > awayScoreRef.current) {
      crazyGamesSDK.happytime();
    }
  };

  // Stoppage / Extra Added Time Handler (When match reaches 90')
  useEffect(() => {
    if (sceneLoading || isPracticeMode || isSurvival || isGameOver || showExitModal || showResultsModal || isPenaltyShootoutRef.current || isOpponentQuitModalOpen) return;

    // In online matches, host manages stoppage time calculation and countdown
    if (isOnlineMatch && !isLocalHost) return;

    if (matchTime >= 90) {
      if (stoppageSeconds === null) {
        // When 90 minutes reached:
        // If score is drawn (homeScore === awayScore), add 3 to 5 stoppage minutes
        // If score is normal, add 2 to 4 stoppage minutes
        const isDrawn = homeScore === awayScore;
        const extraMinutes = isDrawn
          ? Math.floor(3 + Math.random() * 3)
          : Math.floor(2 + Math.random() * 3);
        
        setStoppageSeconds(extraMinutes);
        stoppageSecondsRef.current = extraMinutes;
        setStoppageCountdown(1);
        stoppageCountdownRef.current = 1;
        if (isOnlineMatch && isLocalHost) {
          onlineMatchManager.syncMatchTime(90, extraMinutes);
        }
      } else {
        const stoppageInterval = setInterval(() => {
          if (isReplayActiveRef.current) return;

          setStoppageCountdown((prev) => {
            const nextVal = prev + 1;
            if (isOnlineMatch && isLocalHost) {
              onlineMatchManager.syncMatchTime(90, nextVal);
            }
            if (prev >= (stoppageSeconds || 3)) {
              clearInterval(stoppageInterval);
              isTimeExpiredRef.current = true;
              setIsTimeExpired(true);

              const pShots = matchStatsRef.current.playerShots;
              const aShots = matchStatsRef.current.aiShots;
              const isShotInFlight = shotPhaseRef.current !== 'idle' && shotPhaseRef.current !== 'finished';
              const isReplayOrFinishing = isReplayActiveRef.current || (shotPhaseRef.current === 'finished' && shotFinishedTimeRef.current > 0);

              // Conclude when turns are balanced or if both took at least 1 shot and no shot is active
              if ((pShots === aShots || pShots >= aShots) && pShots > 0 && !isShotInFlight && !isReplayOrFinishing && currentTurnRef.current === 'player') {
                concludeMatch(true);
              }
              return prev;
            }
            return nextVal;
          });
        }, 1000);

        return () => clearInterval(stoppageInterval);
      }
    }
  }, [matchTime, stoppageSeconds, homeScore, awayScore, isGameOver, showExitModal, showResultsModal, isOpponentQuitModalOpen, isOnlineMatch, isLocalHost, isSurvival]);

  // Robust Watchdog Effect: Ensures match terminates deterministically when time is up without hanging
  useEffect(() => {
    if (sceneLoading || isPracticeMode || isSurvival || isGameOver || showExitModal || showResultsModal || isPenaltyShootoutRef.current || isOpponentQuitModalOpen) return;

    const timeIsUp = isTimeExpiredRef.current || (matchTimeRef.current >= 90 && stoppageSecondsRef.current !== null && stoppageCountdownRef.current >= (stoppageSecondsRef.current || 3));
    if (!timeIsUp) return;

    const checkAndConclude = () => {
      if (isGameOverRef.current || isPenaltyShootoutRef.current) return;
      const isShotInFlight = shotPhaseRef.current !== 'idle' && shotPhaseRef.current !== 'finished';
      const isReplayOrFinishing = isReplayActiveRef.current || (shotPhaseRef.current === 'finished' && shotFinishedTimeRef.current > 0);
      if (isShotInFlight || isReplayOrFinishing) return;

      const pShots = matchStatsRef.current.playerShots;
      const aShots = matchStatsRef.current.aiShots;
      const equalTurns = pShots === aShots;

      // Deterministic end: if turns are equal, or if player starts next round after full round finished
      if ((equalTurns && (pShots > 0 || isOnlineMatch)) || (timeIsUp && currentTurnRef.current === 'player' && pShots > 0 && aShots > 0 && pShots <= aShots)) {
        concludeMatch(true);
      }
    };

    // Immediate check
    checkAndConclude();

    // Continuous check every 400ms
    const interval = setInterval(checkAndConclude, 400);

    return () => {
      clearInterval(interval);
    };
  }, [isTimeExpired, stoppageCountdown, matchTime, sceneLoading, isPracticeMode, isGameOver, showExitModal, showResultsModal, isOpponentQuitModalOpen, isOnlineMatch, isLocalHost]);

  const triggerShotOutcome = (outcome: string) => {
    // If it's a GOAL, it is authoritative and overrides woodwork or any premature miss calls!
    const canSetOutcome =
      shotOutcomeRef.current === null ||
      (outcome === 'GOAL' && shotOutcomeRef.current !== 'GOAL');

    if (canSetOutcome) {
      const prevOutcome = shotOutcomeRef.current;
      shotOutcomeRef.current = outcome;
      setShotOutcome(outcome);

      // Trigger dynamic stadium crowd reaction based on shot outcome (disabled in training/practice modes)
      if (outcome === 'GOAL') {
        if (!isPracticeMode) {
          setCrowdExcitement('goal');
          playGoalCheerSound();
        }
      } else if (outcome === 'HIT THE WOODWORK' || outcome.toUpperCase().includes('SAVE') || outcome.toUpperCase().includes('DEFLECT')) {
        if (!isPracticeMode) {
          setCrowdExcitement('save_reaction');
        }
      } else if (outcome.toUpperCase().includes('WIDE') || outcome.toUpperCase().includes('CROSSBAR') || outcome.toUpperCase().includes('MISS') || outcome.toUpperCase().includes('OVER')) {
        if (!isPracticeMode) {
          setCrowdExcitement('miss_groan');
        }
      }

      // In online human vs human matches, defender's stats and outcome are synchronized authoritatively via network payload
      if (isOnlineMatch && !isBotMatch && !localShotFiredThisTurnRef.current) {
        return;
      }

      const isPlayer = currentTurnRef.current === 'player';

      const nextPShots = isPlayer && prevOutcome === null ? matchStatsRef.current.playerShots + 1 : matchStatsRef.current.playerShots;
      const nextAiShots = !isPlayer && prevOutcome === null ? matchStatsRef.current.aiShots + 1 : matchStatsRef.current.aiShots;
      const nextPGoals = isPlayer && outcome === 'GOAL' && prevOutcome !== 'GOAL' ? matchStatsRef.current.playerGoals + 1 : matchStatsRef.current.playerGoals;
      const nextAiGoals = !isPlayer && outcome === 'GOAL' && prevOutcome !== 'GOAL' ? matchStatsRef.current.aiGoals + 1 : matchStatsRef.current.aiGoals;
      const nextPWoodwork = isPlayer && outcome === 'HIT THE WOODWORK' ? matchStatsRef.current.playerWoodwork + 1 : matchStatsRef.current.playerWoodwork;
      const nextAiWoodwork = !isPlayer && outcome === 'HIT THE WOODWORK' ? matchStatsRef.current.aiWoodwork + 1 : matchStatsRef.current.aiWoodwork;

      const updatedStats = {
        playerShots: nextPShots,
        aiShots: nextAiShots,
        playerGoals: nextPGoals,
        aiGoals: nextAiGoals,
        playerWoodwork: nextPWoodwork,
        aiWoodwork: nextAiWoodwork,
      };
      matchStatsRef.current = updatedStats;
      setMatchStats(updatedStats);

      // Trigger celebratory Happy Time on player goals
      if (isPlayer && outcome === 'GOAL' && prevOutcome !== 'GOAL') {
        crazyGamesSDK.happytime();
      }

      if (isPenaltyShootoutRef.current) {
        const isGoal = outcome === 'GOAL';
        const currentShootout = { ...penaltyShootoutRef.current };
        const isPlayerKicking = currentShootout.currentKicker === 'player';
        const roundIdx = currentShootout.round - 1;

        if (isPlayerKicking) {
          const updatedHomeKicks = [...currentShootout.homeKicks];
          while (updatedHomeKicks.length <= roundIdx) updatedHomeKicks.push(null);
          updatedHomeKicks[roundIdx] = isGoal;
          currentShootout.homeKicks = updatedHomeKicks;
          if (isGoal) currentShootout.homePenaltiesScore += 1;
        } else {
          const updatedAwayKicks = [...currentShootout.awayKicks];
          while (updatedAwayKicks.length <= roundIdx) updatedAwayKicks.push(null);
          updatedAwayKicks[roundIdx] = isGoal;
          currentShootout.awayKicks = updatedAwayKicks;
          if (isGoal) currentShootout.awayPenaltiesScore += 1;
        }

        // Evaluate IFAB Penalty Shootout Winner
        const homeGoals = currentShootout.homePenaltiesScore;
        const awayGoals = currentShootout.awayPenaltiesScore;
        const homeKicksTaken = currentShootout.homeKicks.filter((k) => k !== null).length;
        const awayKicksTaken = currentShootout.awayKicks.filter((k) => k !== null).length;

        let winner: 'player' | 'ai' | null = null;

        if (currentShootout.round <= 5) {
          const homeRemaining = Math.max(0, 5 - homeKicksTaken);
          const awayRemaining = Math.max(0, 5 - awayKicksTaken);

          if (homeGoals > awayGoals + awayRemaining) {
            winner = 'player';
          } else if (awayGoals > homeGoals + homeRemaining) {
            winner = 'ai';
          } else if (homeKicksTaken >= 5 && awayKicksTaken >= 5 && homeKicksTaken === awayKicksTaken) {
            if (homeGoals > awayGoals) winner = 'player';
            else if (awayGoals > homeGoals) winner = 'ai';
            else {
              // Sudden death! Expand kick slots
              currentShootout.homeKicks.push(null);
              currentShootout.awayKicks.push(null);
            }
          }
        } else {
          // Sudden Death (Round > 5): check after both teams have kicked in the pair
          if (homeKicksTaken === awayKicksTaken) {
            if (homeGoals > awayGoals) winner = 'player';
            else if (awayGoals > homeGoals) winner = 'ai';
            else {
              // Next sudden death pair!
              currentShootout.homeKicks.push(null);
              currentShootout.awayKicks.push(null);
            }
          }
        }

        currentShootout.winner = winner;
        if (winner) {
          currentShootout.statusText = winner === 'player' ? 'YOU WON ON PENALTIES!' : 'OPPONENT WON ON PENALTIES!';
          if (winner === 'player') {
            crazyGamesSDK.happytime();
          }
        } else {
          const nextKicker = isPlayerKicking ? 'ai' : 'player';
          const nextRound = isPlayerKicking ? currentShootout.round : currentShootout.round + 1;
          currentShootout.currentKicker = nextKicker;
          currentShootout.round = nextRound;
          currentShootout.statusText = nextRound > 5
            ? `SUDDEN DEATH • ${nextKicker === 'player' ? 'YOUR KICK' : "OPPONENT'S KICK"}`
            : `ROUND ${nextRound} • ${nextKicker === 'player' ? 'YOUR KICK' : "OPPONENT'S KICK"}`;
        }

        penaltyShootoutRef.current = currentShootout;
        setPenaltyShootout(currentShootout);
      } else if (isOnlineMatch) {
        if (outcome === 'GOAL' && prevOutcome !== 'GOAL') {
          // Local client scored or opponent scored during 3D simulation
          let nextHome = homeScoreRef.current;
          let nextAway = awayScoreRef.current;

          if (currentTurnRef.current === 'player') {
            // Local player kicked and scored!
            nextHome += 1;
          } else {
            // Opponent/Bot kicked and scored!
            nextAway += 1;
          }

          homeScoreRef.current = nextHome;
          awayScoreRef.current = nextAway;
          setHomeScore(nextHome);
          setAwayScore(nextAway);

          if (localShotFiredThisTurnRef.current && !isBotMatch) {
            const kickerRole = isLocalHost ? 'host' : 'guest';
            const hostScore = isLocalHost ? nextHome : nextAway;
            const guestScore = isLocalHost ? nextAway : nextHome;
            onlineMatchManager.recordOutcome({
              outcome,
              isGoal: true,
              kickerRole,
              hostScore,
              guestScore,
              homeScore: hostScore,
              awayScore: guestScore,
              survivalLives: isSurvival ? {
                host: hostSurvivalLivesRef.current,
                guest: guestSurvivalLivesRef.current,
              } : undefined,
            });
          }
        } else if (localShotFiredThisTurnRef.current && !isBotMatch) {
          const kickerRole = isLocalHost ? 'host' : 'guest';
          const hostScore = isLocalHost ? homeScoreRef.current : awayScoreRef.current;
          const guestScore = isLocalHost ? awayScoreRef.current : homeScoreRef.current;
          onlineMatchManager.recordOutcome({
            outcome,
            isGoal: false,
            kickerRole,
            hostScore,
            guestScore,
            homeScore: hostScore,
            awayScore: guestScore,
            survivalLives: isSurvival ? {
              host: hostSurvivalLivesRef.current,
              guest: guestSurvivalLivesRef.current,
            } : undefined,
          });
        }
      } else {
        if (outcome === 'GOAL' && prevOutcome !== 'GOAL') {
          if (isPlayer) {
            const nextScore = homeScoreRef.current + 1;
            homeScoreRef.current = nextScore;
            setHomeScore(nextScore);
            aiConsecutiveGoalsRef.current = 0; // AI streak broken by player goal
            if (isPracticeModeRef.current) {
              setPracticeGoals((prev) => prev + 1);
              setPracticeStreak((prev) => {
                const nextStreak = prev + 1;
                setPracticeBestStreak((best) => Math.max(best, nextStreak));
                return nextStreak;
              });
            }
          } else {
            const nextScore = awayScoreRef.current + 1;
            awayScoreRef.current = nextScore;
            setAwayScore(nextScore);
            aiConsecutiveGoalsRef.current += 1; // Increment AI consecutive goal count
          }
        } else if (
          !isPlayer &&
          outcome !== 'GOAL' &&
          outcome !== 'TEAMMATE STRIKE ON GOAL!' &&
          outcome !== 'AI TEAMMATE SHOT ON GOAL!' &&
          outcome !== null
        ) {
          // AI missed, hit wall, woodwork, or saved -> reset consecutive streak to 0
          aiConsecutiveGoalsRef.current = 0;
        } else if (
          isPracticeModeRef.current &&
          prevOutcome === null &&
          outcome !== 'GOAL' &&
          outcome !== 'TEAMMATE STRIKE ON GOAL!' &&
          outcome !== 'AI TEAMMATE SHOT ON GOAL!'
        ) {
          // Any missed shot, save, woodwork, or clearance resets current consecutive streak
          setPracticeStreak(0);
        }
      }
    }
  };

  // Refs for Motion Easing and DOM Indicator Updates
  const currentAimRef = useRef<number>(0.5);
  const currentCurveRef = useRef<number>(0);
  const currentPowerRef = useRef<number>(0);
  const powerIndicatorRef = useRef<HTMLDivElement | null>(null);
  const curveIndicatorRef = useRef<HTMLDivElement | null>(null);
  const powerFillRef = useRef<HTMLDivElement | null>(null);
  const powerCursorRef = useRef<HTMLDivElement | null>(null);
  const powerCardRef = useRef<HTMLDivElement | null>(null);
  const powerLevelBadgeRef = useRef<HTMLSpanElement | null>(null);
  const powerStatusTextRef = useRef<HTMLDivElement | null>(null);
  const isHoldingPowerRef = useRef<boolean>(false);
  const powerHoldStartTimeRef = useRef<number>(0);
  const inputDownTimestampRef = useRef<number>(0);
  const lastVibrateMilestoneRef = useRef<number>(0);

  // High-performance Oscillator Timing Refs (synchronized directly in 60 FPS main loop)
  const setupStepRef = useRef<'aim' | 'power' | 'curve' | 'kicking' | 'finished'>('aim');
  const aimStartTimeRef = useRef<number>(performance.now());
  const powerStartTimeRef = useRef<number>(performance.now());
  const curveStartTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    setupStepRef.current = setupStep;
    const now = performance.now();
    if (setupStep === 'aim') {
      aimStartTimeRef.current = now;
    } else if (setupStep === 'power') {
      powerStartTimeRef.current = now;
    } else if (setupStep === 'curve') {
      curveStartTimeRef.current = now;
    }
  }, [setupStep]);

  // Pointer Drag Refs
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; aim: number; curve: number } | null>(null);
  const isSlingshotDraggingRef = useRef<boolean>(false);
  const slingshotStartPosRef = useRef<{ x: number; y: number; aim: number; power: number; curve: number } | null>(null);
  const slingshotPullWorldPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const [isSlingshotDragging, setIsSlingshotDragging] = useState<boolean>(false);
  const aftertouchVecRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const swerveDisplayRef = useRef<HTMLSpanElement>(null);
  const dipDisplayRef = useRef<HTMLSpanElement>(null);
  const dragPowerTextRef = useRef<HTMLSpanElement>(null);
  const dragPowerTierRef = useRef<HTMLSpanElement>(null);
  const dragPowerBarIndicatorRef = useRef<HTMLDivElement>(null);
  const floatingDragPowerTextRef = useRef<HTMLSpanElement>(null);
  const lastAimSyncTimeRef = useRef<number>(0);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Shot Animation & Physics Refs
  const shotPhaseRef = useRef<'idle' | 'running' | 'kicking' | 'flying' | 'hit_post' | 'finished'>('idle');
  const goalGroupRef = useRef<THREE.Group | null>(null);
  const goalVibrationRef = useRef<{ intensity: number; startTime: number } | null>(null);
  const runStartTimeRef = useRef<number>(0);
  const kickStartTimeRef = useRef<number>(0);
  const lastReplayRecordTimeRef = useRef<number>(0);
  const curveAccelMagRef = useRef<number>(0);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);
  const pitchMeshRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const kickerGroupRef = useRef<THREE.Group | null>(null);
  const gkGroupRef = useRef<THREE.Group | null>(null);
  const netMeshesRef = useRef<THREE.Mesh[]>([]);
  const grandstandMeshesRef = useRef<(THREE.Mesh | THREE.InstancedMesh)[]>([]);

  type GoalkeeperFlawType =
    | 'none'
    | 'premature_jump'
    | 'deceived_by_curve'
    | 'wrong_footed_gamble'
    | 'flat_footed_delay'
    | 'fingertip_spill';

  // Replay Snapshot Data Structures
  interface EntitySnapshot {
    pos: [number, number, number];
    rot: [number, number, number];
    leftLegRot?: [number, number, number];
    rightLegRot?: [number, number, number];
    leftArmRot?: [number, number, number];
    rightArmRot?: [number, number, number];
    headRot?: [number, number, number];
  }

  interface ReplayFrame {
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

  // 2-Angle Match Replay System States
  const [isReplayActive, setIsReplayActive] = useState<boolean>(false);
  const isReplayActiveRef = useRef<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(1); // 1 = Ball Tracking, 2 = Behind Goal
  const replayIndexRef = useRef<number>(1);
  const [replayCamAngle, setReplayCamAngle] = useState<'ball_tracking' | 'behind_goal' | 'orbit'>('ball_tracking');
  const replayCamAngleRef = useRef<'ball_tracking' | 'behind_goal' | 'orbit'>('ball_tracking');
  const [isReplayPaused, setIsReplayPaused] = useState<boolean>(false);
  const isReplayPausedRef = useRef<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(0.65); // 0.65x broadcast slow motion
  const replaySpeedRef = useRef<number>(0.65);
  const [replayPlayheadTime, setReplayPlayheadTime] = useState<number>(0);
  const replayPlayheadTimeRef = useRef<number>(0);
  const [replayDuration, setReplayDuration] = useState<number>(2000);
  const replayDurationRef = useRef<number>(2000);
  const userInteractedWithReplayCamRef = useRef<boolean>(false);
  const recordedReplayFramesRef = useRef<ReplayFrame[]>([]);
  const activeReplayClipRef = useRef<ReplayFrame[]>([]);
  const hasTriggeredReplayForShotRef = useRef<boolean>(false);
  const isAdvancingTurnRef = useRef<boolean>(false);
  const lastSceneSkipTimestampRef = useRef<number>(0);
  const turnStartTimeRef = useRef<number>(Date.now());
  const inputLockoutUntilRef = useRef<number>(0);
  const shotTakenTimestampRef = useRef<number>(0);

  const lockInputTemporarily = (durationMs: number = 800) => {
    inputLockoutUntilRef.current = Date.now() + durationMs;
  };

  const isInputLocked = () => {
    const now = Date.now();
    return (
      now < inputLockoutUntilRef.current ||
      now - lastSceneSkipTimestampRef.current < 750 ||
      now - turnStartTimeRef.current < 450 ||
      sceneLoading ||
      showExitModal ||
      showResultsModal ||
      isGameOver
    );
  };

  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);

  const handleSaveReplay = async () => {
    if (activeReplayClipRef.current.length < 2) return;
    setIsSavedToast(true);
    try {
      const kickerCountry = currentTurn === 'player' ? country : (opponentCountry || COUNTRIES_DATA[0]);
      const defendingCountry = currentTurn === 'player' ? (opponentCountry || COUNTRIES_DATA[0]) : country;
      await savedReplayManager.saveReplay({
        distance: fkDistance,
        isGoal: isGoalScoredRef.current,
        outcomeText: isGoalScoredRef.current ? 'GOAL' : (shotOutcomeRef.current?.toUpperCase() || 'SAVED'),
        kickerCountryCode: kickerCountry.code,
        kickerCountryName: kickerCountry.name,
        opponentCountryCode: defendingCountry.code,
        opponentCountryName: defendingCountry.name,
        gameMode: isSurvival ? 'Survival' : isWorldCupMatch ? 'World Cup' : isWagerMatch ? 'Wager Arena' : isOnlineMatch ? 'Online 1v1' : isPracticeMode ? 'Training' : 'Free Kick',
        frames: [...activeReplayClipRef.current],
      });
    } catch (err) {
      console.warn('Failed to save replay to storage:', err);
    }
    setTimeout(() => {
      setIsSavedToast(false);
    }, 2500);
  };

  const snapshotPlayer = (player: THREE.Group): EntitySnapshot => {
    const ud = player.userData || {};
    return {
      pos: [player.position.x, player.position.y, player.position.z],
      rot: [player.rotation.x, player.rotation.y, player.rotation.z],
      leftLegRot: ud.leftLegGroup ? [ud.leftLegGroup.rotation.x, ud.leftLegGroup.rotation.y, ud.leftLegGroup.rotation.z] : undefined,
      rightLegRot: ud.rightLegGroup ? [ud.rightLegGroup.rotation.x, ud.rightLegGroup.rotation.y, ud.rightLegGroup.rotation.z] : undefined,
      leftArmRot: ud.leftArmGroup ? [ud.leftArmGroup.rotation.x, ud.leftArmGroup.rotation.y, ud.leftArmGroup.rotation.z] : undefined,
      rightArmRot: ud.rightArmGroup ? [ud.rightArmGroup.rotation.x, ud.rightArmGroup.rotation.y, ud.rightArmGroup.rotation.z] : undefined,
      headRot: ud.headGroup ? [ud.headGroup.rotation.x, ud.headGroup.rotation.y, ud.headGroup.rotation.z] : undefined,
    };
  };

  const applyPlayerSnapshot = (player: THREE.Group, s0: EntitySnapshot, s1: EntitySnapshot, alpha: number) => {
    const lerp = THREE.MathUtils.lerp;
    player.position.set(
      lerp(s0.pos[0], s1.pos[0], alpha),
      lerp(s0.pos[1], s1.pos[1], alpha),
      lerp(s0.pos[2], s1.pos[2], alpha)
    );
    player.rotation.set(
      lerp(s0.rot[0], s1.rot[0], alpha),
      lerp(s0.rot[1], s1.rot[1], alpha),
      lerp(s0.rot[2], s1.rot[2], alpha)
    );
    const ud = player.userData || {};
    if (ud.leftLegGroup && s0.leftLegRot && s1.leftLegRot) {
      ud.leftLegGroup.rotation.set(
        lerp(s0.leftLegRot[0], s1.leftLegRot[0], alpha),
        lerp(s0.leftLegRot[1], s1.leftLegRot[1], alpha),
        lerp(s0.leftLegRot[2], s1.leftLegRot[2], alpha)
      );
    }
    if (ud.rightLegGroup && s0.rightLegRot && s1.rightLegRot) {
      ud.rightLegGroup.rotation.set(
        lerp(s0.rightLegRot[0], s1.rightLegRot[0], alpha),
        lerp(s0.rightLegRot[1], s1.rightLegRot[1], alpha),
        lerp(s0.rightLegRot[2], s1.rightLegRot[2], alpha)
      );
    }
    if (ud.leftArmGroup && s0.leftArmRot && s1.leftArmRot) {
      ud.leftArmGroup.rotation.set(
        lerp(s0.leftArmRot[0], s1.leftArmRot[0], alpha),
        lerp(s0.leftArmRot[1], s1.leftArmRot[1], alpha),
        lerp(s0.leftArmRot[2], s1.leftArmRot[2], alpha)
      );
    }
    if (ud.rightArmGroup && s0.rightArmRot && s1.rightArmRot) {
      ud.rightArmGroup.rotation.set(
        lerp(s0.rightArmRot[0], s1.rightArmRot[0], alpha),
        lerp(s0.rightArmRot[1], s1.rightArmRot[1], alpha),
        lerp(s0.rightArmRot[2], s1.rightArmRot[2], alpha)
      );
    }
    if (ud.headGroup && s0.headRot && s1.headRot) {
      ud.headGroup.rotation.set(
        lerp(s0.headRot[0], s1.headRot[0], alpha),
        lerp(s0.headRot[1], s1.headRot[1], alpha),
        lerp(s0.headRot[2], s1.headRot[2], alpha)
      );
    }
  };

  // Realistic Goalkeeper Physics State (Ground walking over on turf, jumping, and realistic flaw behaviors)
  interface GoalkeeperPhysicsState {
    state: 'ready' | 'walking' | 'jumping' | 'conceded' | 'celebrating';
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    rotX: number;
    rotY: number;
    rotZ: number;
    baseRotY: number;
    actionType: 'stay' | 'walk' | 'jump';
    hasReacted: boolean;
    hasJumped: boolean;
    jumpCompleted: boolean; // True once keeper lands from an early jump (grounded while ball arrives)
    walkCycle: number; // continuous leg stepping phase
    walkSpeed: number; // current lateral speed on turf
    targetX: number;
    targetY: number;
    reactionDelay: number; // human reaction lag
    flawType: GoalkeeperFlawType;
    flawOffset: number; // reading inaccuracy
    misjudgedCurve: boolean;
    gambleSide: number; // -1 (left) or +1 (right)
  }

  const gkPhysicsRef = useRef<GoalkeeperPhysicsState>({
    state: 'ready',
    pos: new THREE.Vector3(0, 0, -42.0),
    vel: new THREE.Vector3(0, 0, 0),
    rotX: 0,
    rotY: Math.PI,
    rotZ: 0,
    baseRotY: Math.PI,
    actionType: 'stay',
    hasReacted: false,
    hasJumped: false,
    jumpCompleted: false,
    walkCycle: 0,
    walkSpeed: 0,
    targetX: 0,
    targetY: 1.0,
    reactionDelay: 0.20,
    flawType: 'none',
    flawOffset: 0,
    misjudgedCurve: false,
    gambleSide: 1,
  });
  const gkReadyXRef = useRef<number>(0);

  const wallDefendersRef = useRef<THREE.Group[]>([]);
  const boxPlayersRef = useRef<THREE.Group[]>([]);
  const deflectionCooldownUntilRef = useRef<number>(0);
  const kickingPlayerAnimRef = useRef<{ player: THREE.Group; startTime: number; duration: number } | null>(null);
  const aiPassedToTeammateRef = useRef<boolean>(false);
  const aiPassTargetTeammateRef = useRef<THREE.Group | null>(null);
  const kickerStartPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const kickerTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const ballPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const ballVelRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const curveAccelVecRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const fkBallPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const kickerFacingAngleRef = useRef<number>(0);
  const angleToGoalRef = useRef<number>(0);
  const hasBouncedRef = useRef<boolean>(false);
  const isGoalScoredRef = useRef<boolean>(false);
  const shotCurveRef = useRef<THREE.QuadraticBezierCurve3 | null>(null);
  const shotFlightDurationRef = useRef<number>(0.5);
  const flightStartTimeRef = useRef<number>(0);
  const hitPostTimeRef = useRef<number>(0);
  const shotFinishedTimeRef = useRef<number>(0);
  const flightPointsRef = useRef<THREE.Vector3[]>([]);
  const flightTimeRef = useRef<number>(0);

  const lockedAimRef = useRef<number>(0.5);
  const lockedPowerRef = useRef<number>(50);
  const lockedCurveRef = useRef<number>(0);
  const shotGravityRef = useRef<number>(9.81);
  const localShotFiredThisTurnRef = useRef<boolean>(false);

  // Oscillators (Aim, Power, Curve) are updated synchronously inside the 60 FPS Three.js animate() loop
  // for ultra-smooth responsiveness and zero frame desynchronization on big screens.
  // Determine if it is the local player's turn to kick
  const isMyOnlineTurn = isOnlineMatch ? currentTurn === 'player' : currentTurn === 'player';

  // Online Multiplayer Event Listeners & State Synchronization
  useEffect(() => {
    if (!isOnlineMatch) return;

    const unsubShot = onlineMatchManager.on('shot_executed', (payload: OnlineShotPayload) => {
      // In bot matches, or if local player is currently kicking or striker, ignore remote shot
      if (isBotMatch || localShotFiredThisTurnRef.current || currentTurnRef.current === 'player') {
        return;
      }

      // Remote shot received - Defender is watching
      localShotFiredThisTurnRef.current = false;

      // Lock exact mechanics values and start run-up immediately
      lockedAimRef.current = payload.aimProgress;
      lockedPowerRef.current = payload.power;
      lockedCurveRef.current = payload.curveAmount;
      currentAimRef.current = payload.aimProgress;
      currentPowerRef.current = payload.power;
      currentCurveRef.current = payload.curveAmount;
      setAimProgress(payload.aimProgress);
      setPower(payload.power);
      setCurveAmount(payload.curveAmount);
      setSetupStep('kicking');

      // Sync Goalkeeper starting stance and simulation flaws so both peers see identical save/goal dynamics
      if (payload.gkStartX !== undefined && gkGroupRef.current) {
        gkReadyXRef.current = payload.gkStartX;
        gkGroupRef.current.position.set(payload.gkStartX, 0, -42.0);
        if (gkPhysicsRef.current) {
          gkPhysicsRef.current.pos.set(payload.gkStartX, 0, -42.0);
          if (payload.gkReactionDelay !== undefined) gkPhysicsRef.current.reactionDelay = payload.gkReactionDelay;
          if (payload.gkFlawType !== undefined) gkPhysicsRef.current.flawType = payload.gkFlawType as GoalkeeperFlawType;
          if (payload.gkFlawOffset !== undefined) gkPhysicsRef.current.flawOffset = payload.gkFlawOffset;
          if (payload.gkGambleSide !== undefined) gkPhysicsRef.current.gambleSide = payload.gkGambleSide;
        }
      }

      // Reduce size of the ball by 7% on shot lock
      if (ballMeshRef.current) {
        ballMeshRef.current.scale.set(0.93, 0.93, 0.93);
      }

      // Immediately launch kicker run-up sequence
      shotPhaseRef.current = 'running';
      runStartTimeRef.current = performance.now();
    });

    const unsubOutcome = onlineMatchManager.on('shot_outcome', (payload: OnlineShotOutcomePayload) => {
      // In bot matches, all outcomes are authoritative and calculated locally
      if (isBotMatch) return;

      // Synchronize survival lives for both players
      if (payload.survivalLives) {
        setHostSurvivalLives(payload.survivalLives.host);
        setGuestSurvivalLives(payload.survivalLives.guest);
        hostSurvivalLivesRef.current = payload.survivalLives.host;
        guestSurvivalLivesRef.current = payload.survivalLives.guest;
      }

      // If this client is the defender, accept striker's authoritative outcome and synchronized score
      if (!localShotFiredThisTurnRef.current) {
        shotOutcomeRef.current = payload.outcome;
        setShotOutcome(payload.outcome);
        if (payload.isGoal) {
          isGoalScoredRef.current = true;
        }
        const incomingHostScore = payload.hostScore !== undefined ? payload.hostScore : payload.homeScore;
        const incomingGuestScore = payload.guestScore !== undefined ? payload.guestScore : payload.awayScore;
        if (incomingHostScore !== undefined && incomingGuestScore !== undefined) {
          const myTargetScore = isLocalHost ? incomingHostScore : incomingGuestScore;
          const oppTargetScore = isLocalHost ? incomingGuestScore : incomingHostScore;
          homeScoreRef.current = myTargetScore;
          awayScoreRef.current = oppTargetScore;
          setHomeScore(myTargetScore);
          setAwayScore(oppTargetScore);
        }

        // Keep matchStats accurately synchronized for opponent's kick
        const isGoal = payload.isGoal || payload.outcome === 'GOAL';
        const isWoodwork = payload.outcome === 'HIT THE WOODWORK';
        const updatedStats = {
          ...matchStatsRef.current,
          aiShots: matchStatsRef.current.aiShots + 1,
          aiGoals: isGoal ? matchStatsRef.current.aiGoals + 1 : matchStatsRef.current.aiGoals,
          aiWoodwork: isWoodwork ? matchStatsRef.current.aiWoodwork + 1 : matchStatsRef.current.aiWoodwork,
        };
        matchStatsRef.current = updatedStats;
        setMatchStats(updatedStats);
      }
    });

    const unsubTurn = onlineMatchManager.on('turn_advanced', (payload: OnlineTurnAdvancePayload) => {
      // In bot matches or while local player has fired a shot or is currently kicking/flying, NEVER interrupt the local game loop
      if (isBotMatch || localShotFiredThisTurnRef.current || shotPhaseRef.current !== 'idle') {
        return;
      }

      localShotFiredThisTurnRef.current = false;

      // Synchronize survival lives for both players
      if (payload.survivalLives) {
        setHostSurvivalLives(payload.survivalLives.host);
        setGuestSurvivalLives(payload.survivalLives.guest);
        hostSurvivalLivesRef.current = payload.survivalLives.host;
        guestSurvivalLivesRef.current = payload.survivalLives.guest;
      }

      // Stop any active replay immediately
      stopGoalCheerSound();
      isReplayActiveRef.current = false;
      setIsReplayActive(false);
      userInteractedWithReplayCamRef.current = false;
      recordedReplayFramesRef.current = [];
      activeReplayClipRef.current = [];
      shotFinishedTimeRef.current = 0;
      hasTriggeredReplayForShotRef.current = false;

      if (controlsRef.current) {
        controlsRef.current.enabled = false;
        controlsRef.current.enableRotate = false;
        controlsRef.current.enableZoom = false;
        controlsRef.current.enablePan = false;
      }

      const isNowMyTurn = isLocalHost ? payload.nextTurnRole === 'host' : payload.nextTurnRole === 'guest';
      currentTurnRef.current = isNowMyTurn ? 'player' : 'ai';
      setCurrentTurn(isNowMyTurn ? 'player' : 'ai');

      const incomingHostScore = payload.hostScore !== undefined ? payload.hostScore : payload.homeScore;
      const incomingGuestScore = payload.guestScore !== undefined ? payload.guestScore : payload.awayScore;
      if (incomingHostScore !== undefined && incomingGuestScore !== undefined) {
        const myTargetScore = isLocalHost ? incomingHostScore : incomingGuestScore;
        const oppTargetScore = isLocalHost ? incomingGuestScore : incomingHostScore;
        homeScoreRef.current = myTargetScore;
        awayScoreRef.current = oppTargetScore;
        setHomeScore(myTargetScore);
        setAwayScore(oppTargetScore);
      }
      // Only guest aligns match clock from host payload, and never resets backward to 100
      if (!isLocalHost) {
        if (payload.matchTime !== undefined && (payload.matchTime <= matchTimeRef.current || matchTimeRef.current === 100)) {
          matchTimeRef.current = payload.matchTime;
          setMatchTime(payload.matchTime);
        }
        if (payload.stoppageCountdown !== undefined) {
          stoppageCountdownRef.current = payload.stoppageCountdown;
          setStoppageCountdown(payload.stoppageCountdown);
        }
      }

      selectPositionIndex(payload.nextPositionIndex, payload.gkStartX);
    });

    const unsubPosition = onlineMatchManager.on('sync_position', (payload) => {
      if (payload.positionIndex !== undefined) {
        selectPositionIndex(payload.positionIndex, payload.gkStartX);
      }
    });

    const unsubGkPos = onlineMatchManager.on('sync_gk_position', (payload) => {
      if (payload.gkStartX !== undefined) {
        gkReadyXRef.current = payload.gkStartX;
        if (gkGroupRef.current) {
          gkGroupRef.current.position.set(payload.gkStartX, 0, -42.0);
        }
        if (gkPhysicsRef.current) {
          gkPhysicsRef.current.pos.set(payload.gkStartX, 0, -42.0);
          gkPhysicsRef.current.targetX = payload.gkStartX;
        }
      }
    });

    const unsubAim = onlineMatchManager.on('sync_aim_curve', (payload) => {
      // When opponent is aiming, update internal aim progress for simulation (arrow remains invisible on defender screen)
      currentAimRef.current = payload.aimProgress;
      currentCurveRef.current = payload.curveAmount;
    });

    const unsubAftertouch = onlineMatchManager.on('sync_aftertouch', (payload) => {
      if (payload && payload.swerve !== undefined && payload.dip !== undefined) {
        aftertouchVecRef.current.x = payload.swerve;
        aftertouchVecRef.current.y = payload.dip;
        if (swerveDisplayRef.current) {
          swerveDisplayRef.current.textContent = `${Math.round(payload.swerve * 100)}%`;
        }
        if (dipDisplayRef.current) {
          dipDisplayRef.current.textContent = `${Math.round(payload.dip * 100)}%`;
        }
      }
    });

    const unsubSkip = onlineMatchManager.on('skip_replay', () => {
      stopReplayAndAdvance();
    });

    const unsubTime = onlineMatchManager.on('sync_match_time', (payload) => {
      // Only guest listens to sync_match_time from host
      if (isOnlineMatch && isLocalHost) return;

      if (payload.matchTime !== undefined) {
        if (isSurvival) {
          survivalOnlineTimeRef.current = payload.matchTime;
          setSurvivalOnlineTime(payload.matchTime);
          if (payload.matchTime === 0) {
            const isShotInFlight = shotPhaseRef.current !== 'idle' && shotPhaseRef.current !== 'finished';
            const isReplayOrFinishing = isReplayActiveRef.current || (shotPhaseRef.current === 'finished' && shotFinishedTimeRef.current > 0);
            if (!isShotInFlight && !isReplayOrFinishing) {
              concludeSurvivalMatchByLives(false);
            }
          }
        } else {
          matchTimeRef.current = payload.matchTime;
          setMatchTime(payload.matchTime);
        }
      }
      if (payload.stoppageCountdown !== undefined && !isSurvival) {
        setStoppageSeconds((curr) => (curr === null && payload.stoppageCountdown! > 0 ? payload.stoppageCountdown! : curr));
        stoppageCountdownRef.current = payload.stoppageCountdown;
        setStoppageCountdown(payload.stoppageCountdown);
        if (payload.matchTime === 0 && payload.stoppageCountdown === 0) {
          isTimeExpiredRef.current = true;
          setIsTimeExpired(true);
        }
      }
    });

    const unsubEnd = onlineMatchManager.on('match_ended', (payload) => {
      if (isBotMatch) return;
      if (isSurvival) {
        setSurvivalOnlineTime(0);
        survivalOnlineTimeRef.current = 0;
        if (payload.survivalLives) {
          hostSurvivalLivesRef.current = payload.survivalLives.host;
          guestSurvivalLivesRef.current = payload.survivalLives.guest;
          setHostSurvivalLives(payload.survivalLives.host);
          setGuestSurvivalLives(payload.survivalLives.guest);
        }
        const incomingHostScore = payload.hostScore !== undefined ? payload.hostScore : payload.homeScore;
        const incomingGuestScore = payload.guestScore !== undefined ? payload.guestScore : payload.awayScore;
        if (incomingHostScore !== undefined && incomingGuestScore !== undefined) {
          const myTargetScore = isLocalHost ? incomingHostScore : incomingGuestScore;
          const oppTargetScore = isLocalHost ? incomingGuestScore : incomingHostScore;
          homeScoreRef.current = myTargetScore;
          awayScoreRef.current = oppTargetScore;
          setHomeScore(myTargetScore);
          setAwayScore(oppTargetScore);
        }
        concludeSurvivalMatchByLives(false);
        return;
      }

      setMatchTime(90);
      setStoppageCountdown(stoppageSecondsRef.current || 3);
      const incomingHostScore = payload.hostScore !== undefined ? payload.hostScore : payload.homeScore;
      const incomingGuestScore = payload.guestScore !== undefined ? payload.guestScore : payload.awayScore;
      if (incomingHostScore !== undefined && incomingGuestScore !== undefined) {
        const myTargetScore = isLocalHost ? incomingHostScore : incomingGuestScore;
        const oppTargetScore = isLocalHost ? incomingGuestScore : incomingHostScore;
        homeScoreRef.current = myTargetScore;
        awayScoreRef.current = oppTargetScore;
        setHomeScore(myTargetScore);
        setAwayScore(oppTargetScore);
      }
      concludeMatch(false);
    });

    const unsubScore = onlineMatchManager.on('score_updated', (payload) => {
      if (isBotMatch) return;
      const incomingHostScore = payload.hostScore !== undefined ? payload.hostScore : payload.homeScore;
      const incomingGuestScore = payload.guestScore !== undefined ? payload.guestScore : payload.awayScore;
      if (incomingHostScore !== undefined && incomingGuestScore !== undefined) {
        const myTargetScore = isLocalHost ? incomingHostScore : incomingGuestScore;
        const oppTargetScore = isLocalHost ? incomingGuestScore : incomingHostScore;
        homeScoreRef.current = myTargetScore;
        awayScoreRef.current = oppTargetScore;
        setHomeScore(myTargetScore);
        setAwayScore(oppTargetScore);
      }
    });

    const unsubDisconnect = onlineMatchManager.on('opponent_disconnected', () => {
      if (isBotMatch) return;
      setIsOpponentDisconnected(true);
      setIsOpponentQuitModalOpen(true);
    });

    const unsubOpponentLeft = onlineMatchManager.on('opponent_left', () => {
      if (isBotMatch) return;
      setIsOpponentDisconnected(true);
      setIsOpponentQuitModalOpen(true);
    });

    const unsubPlayerLeft = onlineMatchManager.on('player_left', () => {
      setIsOpponentDisconnected(true);
      setIsOpponentQuitModalOpen(true);
    });

    const unsubRoomUpdated = onlineMatchManager.on('room_updated', (payload) => {
      if (payload.room?.isOpponentDisconnected || payload.room?.status === 'opponent_left' || payload.room?.status === 'cancelled') {
        setIsOpponentDisconnected(true);
        setIsOpponentQuitModalOpen(true);
      }
    });

    const unsubRematch = onlineMatchManager.on('rematch_accepted', (payload) => {
      handlePlayAgain(payload.positionIndex);
    });

    const unsubTeamChanged = onlineMatchManager.on('team_changed', (payload) => {
      const myRole = isLocalHost ? 'host' : 'guest';
      if (payload.role !== myRole && payload.countryCode) {
        const found = COUNTRIES_DATA.find((c) => c.code.toLowerCase() === payload.countryCode.toLowerCase());
        if (found) {
          setCurrentOpponentCountry(found);
        }
      }
    });

    return () => {
      unsubShot();
      unsubOutcome();
      unsubTurn();
      unsubPosition();
      unsubGkPos();
      unsubAim();
      unsubAftertouch();
      unsubSkip();
      unsubTime();
      unsubEnd();
      unsubScore();
      unsubDisconnect();
      unsubOpponentLeft();
      unsubPlayerLeft();
      unsubRoomUpdated();
      unsubRematch();
      unsubTeamChanged();
    };
  }, [isOnlineMatch, isLocalHost]);

  // Handle window/tab unload for online match cleanup
  useEffect(() => {
    const handleUnload = () => {
      if (isOnlineMatch) {
        onlineMatchManager.notifyDisconnect();
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [isOnlineMatch]);

  // AI OPPONENT AUTOMATION: Intelligent decision-making behind the scenes, then clean shot execution (Disabled in human online match or practice/training mode)
  useEffect(() => {
    if (isPracticeMode || (isOnlineMatch && !isBotMatch) || currentTurn !== 'ai' || showExitModal || showResultsModal || isGameOver || shotPhaseRef.current !== 'idle') {
      return;
    }

    let aiTimer: NodeJS.Timeout;
    const isPenaltyScenario = isPenaltyTraining || isPenaltyShootoutRef.current || penaltyShootout.isActive || isPenaltyTrainingRef.current;

    if (setupStep === 'aim') {
      setAiStepStatus(isPenaltyScenario ? 'AI SIZING UP GOALKEEPER...' : 'AI THINKING...');

      // Dynamic pacing: snappy 0.30s - 0.50s for penalty matches, 0.85s - 1.25s for tactical free kicks
      const aimDecisionDelay = isPenaltyScenario ? (300 + Math.random() * 200) : (850 + Math.random() * 400);

      aiTimer = setTimeout(() => {
        if (currentTurnRef.current !== 'ai' || isPausedRef.current || isGameOverRef.current) return;

        // Check for attacking teammates in the box with dangerous goal positioning
        const attackingTeammates = boxPlayersRef.current.filter(
          (p) => p && p.userData?.teamRole === 'attacker' && p.position.z < -25.0 && Math.abs(p.position.x) < 14.0
        );

        // AI kicker tactically evaluates whether an open teammate has an unobstructed strike channel
        const isAiOnConsecutiveStreak = aiConsecutiveGoalsRef.current >= 1;
        const passChance = isAiOnConsecutiveStreak ? 0.0 : 0.20;
        const willPassToTeammate =
          !isPenaltyScenario &&
          attackingTeammates.length > 0 &&
          Math.random() < passChance;
        aiPassedToTeammateRef.current = willPassToTeammate;

        if (willPassToTeammate) {
          const chosenTeammate = attackingTeammates[Math.floor(Math.random() * attackingTeammates.length)];
          aiPassTargetTeammateRef.current = chosenTeammate;
          const teammatePos = chosenTeammate.position;
          const ballPos = fkBallPosRef.current || new THREE.Vector3(0, 0.11, 0);
          const span = getAimTargetSpan(ballPos.z, -42.0);

          // Passing accuracy with natural human variance
          const passJitter = (Math.random() - 0.5) * 0.85;

          // Project line through teammate to the goal line z = -42.0 to calculate aimProgress
          const dirZ = teammatePos.z - ballPos.z;
          const dirX = (teammatePos.x + passJitter) - ballPos.x;
          let passAim = 0.5;
          if (Math.abs(dirZ) > 0.01) {
            const t = (-42.0 - ballPos.z) / dirZ;
            const targetGoalX = ballPos.x + dirX * t;
            passAim = Math.max(0.08, Math.min(0.92, 0.5 + targetGoalX / span));
          }

          lockedAimRef.current = passAim;
          currentAimRef.current = passAim;
          setAimProgress(passAim);
          setAiStepStatus('AI SPOTTED OPEN TEAMMATE!');
        } else if (isPenaltyScenario) {
          // --- RENEWED AI PENALTY INTELLIGENCE ---
          aiPassTargetTeammateRef.current = null;
          const ballPos = fkBallPosRef.current || new THREE.Vector3(0, 0.11, -42.0 + PENALTY_DISTANCE);
          const span = getAimTargetSpan(ballPos.z, -42.0);
          const gkX = gkReadyXRef.current || 0;

          // Penalty tactical evaluation: Read goalkeeper anticipation and stance
          const isSuddenDeath = penaltyShootout.round > 5;
          const openSide = gkX > 0.10 ? -1 : (gkX < -0.10 ? 1 : (Math.random() > 0.5 ? 1 : -1));
          
          let targetGoalX: number;
          const tacticRoll = Math.random();

          if (isAiOnConsecutiveStreak) {
            // Fair gameplay balance: add chance of saveable placement or slight overrun on streaks
            const balanceRoll = Math.random();
            if (balanceRoll < 0.60) {
              targetGoalX = gkX + (Math.random() - 0.5) * 1.2; // saveable reach
            } else if (balanceRoll < 0.85) {
              targetGoalX = openSide * (3.60 + Math.random() * 0.35); // woodwork brush
            } else {
              targetGoalX = openSide * (2.10 + Math.random() * 0.80);
            }
          } else if (isSuddenDeath) {
            // Sudden death: ice-cold clinical placement into unreachable corners
            targetGoalX = openSide * (2.75 + Math.random() * 0.65);
          } else if (tacticRoll < 0.45) {
            // Tactic 1: Clinical Low Corner Placement (Side-netting)
            targetGoalX = openSide * (2.55 + Math.random() * 0.85);
          } else if (tacticRoll < 0.78) {
            // Tactic 2: Upper 90 / Top Corner Strike
            targetGoalX = openSide * (2.40 + Math.random() * 0.90);
          } else if (tacticRoll < 0.92) {
            // Tactic 3: Driven Opposite Cross-Shot
            targetGoalX = -openSide * (1.80 + Math.random() * 0.90);
          } else {
            // Tactic 4: Subtle center placement if keeper committed to a side
            targetGoalX = (Math.random() - 0.5) * 0.60;
          }

          // Penalty aim calibration
          const penaltyAimJitter = (Math.random() - 0.5) * (isSuddenDeath ? 0.04 : 0.08);
          const targetAimBase = 0.5 + targetGoalX / span;
          const smartAim = Math.max(0.08, Math.min(0.92, targetAimBase + penaltyAimJitter));

          lockedAimRef.current = smartAim;
          currentAimRef.current = smartAim;
          setAimProgress(smartAim);
          setAiStepStatus(isSuddenDeath ? 'AI FOCUSING ON MATCH POINT...' : 'AI TARGETING THE CORNER...');
        } else {
          aiPassTargetTeammateRef.current = null;
          const ballPos = fkBallPosRef.current || new THREE.Vector3(0, 0.11, 0);
          const span = getAimTargetSpan(ballPos.z, -42.0);
          const gkX = gkReadyXRef.current || 0;

          // Match & Mode-Specific AI Goal Cap & Tactical Shot Calibration:
          // Offline Modes: Strict Maximum Cap of 3 goals (Finals/Quick Match: 3, Semi/QF: 2, Group/R16: 2).
          // Note: These caps are maximum ceiling limits; the AI is NOT forced to reach 3 goals in every match.
          // AI conversion rate is realistically balanced with skilled player goalkeeper saves, wall blocks, and misses.
          const isCapMode = (isWorldCupMatch || isBotMatch || isWagerMatch || isSurvival || (!isOnlineMatch && !isPenaltyScenario && !isPracticeMode));
          const maxAllowedAiGoals = getAiMaxGoalCap();
          const currentAiScore = awayScoreRef.current;
          const isAiAtMaxGoalCap = isCapMode && currentAiScore >= maxAllowedAiGoals;

          let targetGoalX: number;

          if (isAiAtMaxGoalCap) {
            // STRICT CAP ENFORCEMENT: AI has reached its match goal limit (maximum 3 in offline mode).
            // Produce competitive near-misses, woodwork strikes, wall blocks, or saveable shots so gameplay remains thrilling without scoring.
            const missTactic = Math.random();
            if (missTactic < 0.45) {
              // Direct saveable shot towards the goalkeeper's ready position
              targetGoalX = gkX + (Math.random() - 0.5) * 1.0;
            } else if (missTactic < 0.75) {
              // Thrilling woodwork / post hit
              const postSide = Math.random() > 0.5 ? 1 : -1;
              targetGoalX = postSide * (3.82 + Math.random() * 0.26);
            } else {
              // Wide or sliced effort past post
              const missSide = (fkXOffset || 0) > 0 ? 1 : -1;
              targetGoalX = missSide * (4.15 + Math.random() * 1.10);
            }
          } else if (isAiOnConsecutiveStreak) {
            // AI scored on previous turn: realistic momentum check with human variance
            const errorRoll = Math.random();
            if (errorRoll < 0.65) {
              targetGoalX = gkX + (Math.random() - 0.5) * 0.90;
            } else if (errorRoll < 0.85) {
              targetGoalX = (Math.random() > 0.5 ? 1 : -1) * (3.80 + Math.random() * 0.35);
            } else {
              targetGoalX = (fkXOffset || 0) * 0.65;
            }
          } else if (isCapMode) {
            // Realistic scoring distribution across match turns:
            // The AI only takes a high-danger corner shot ~16-20% of the time, allowing player goalkeeper to make authentic saves
            const clinicalDangerThreshold = maxAllowedAiGoals <= 2 ? 0.16 : 0.20;
            const clinicalRoll = Math.random();
            const openSide = gkX > 0.15 ? -1 : (gkX < -0.15 ? 1 : ((fkXOffset || 0) > 0 ? -1 : (Math.random() > 0.5 ? 1 : -1)));

            if (clinicalRoll < clinicalDangerThreshold) {
              // Dangerous attempt targeting open corners
              targetGoalX = openSide * (2.10 + Math.random() * 1.05);
            } else if (clinicalRoll < 0.70) {
              // Saveable on-target strike towards keeper's reach envelope
              targetGoalX = gkX + (Math.random() - 0.5) * 1.40;
            } else if (clinicalRoll < 0.86) {
              // Close shave / near post test
              targetGoalX = openSide * (3.78 + Math.random() * 0.40);
            } else {
              // Wide miss
              targetGoalX = (Math.random() > 0.5 ? 1 : -1) * (4.15 + Math.random() * 0.85);
            }
          } else {
            // Online / other modes: Fair distribution
            const openSide = gkX > 0.15 ? -1 : (gkX < -0.15 ? 1 : ((fkXOffset || 0) > 0 ? -1 : (Math.random() > 0.5 ? 1 : -1)));
            const shotStrategyRoll = Math.random();

            if (shotStrategyRoll < 0.24) {
              targetGoalX = openSide * (2.10 + Math.random() * 1.10);
            } else if (shotStrategyRoll < 0.70) {
              targetGoalX = openSide * (1.20 + Math.random() * 1.00);
            } else {
              targetGoalX = gkX + (Math.random() - 0.5) * 1.50;
            }
          }

          const humanJitter = (Math.random() - 0.5) * (isAiAtMaxGoalCap ? 0.22 : isAiOnConsecutiveStreak ? 0.18 : 0.12);
          const targetAimBase = 0.5 + targetGoalX / span;
          const smartAim = Math.max(0.06, Math.min(0.94, targetAimBase + humanJitter));

          lockedAimRef.current = smartAim;
          currentAimRef.current = smartAim;
          setAimProgress(smartAim);
        }

        setSetupStep('power');
      }, aimDecisionDelay);
    } else if (setupStep === 'power') {
      setAiStepStatus(
        isPenaltyScenario
          ? 'CALIBRATING PENALTY STRIKE...'
          : aiPassedToTeammateRef.current
          ? 'CALIBRATING PASS POWER...'
          : 'SELECTING TARGET POWER...'
      );
      const powerPause = isPenaltyScenario ? (160 + Math.random() * 100) : (350 + Math.random() * 250);
      aiTimer = setTimeout(() => {
        if (currentTurnRef.current !== 'ai' || isPausedRef.current || isGameOverRef.current) return;

        if (aiPassedToTeammateRef.current) {
          const passPower = THREE.MathUtils.clamp(
            Math.round(18 + (Math.random() - 0.5) * 8),
            12,
            26
          );

          lockedPowerRef.current = passPower;
          currentPowerRef.current = passPower;
          setPower(passPower);
        } else if (isPenaltyScenario) {
          // Penalty Power Calibration for 23.1m penalty spot
          const isSuddenDeath = penaltyShootout.round > 5;
          const isAiOnConsecutiveStreak = aiConsecutiveGoalsRef.current >= 1;
          
          // Tactical power selection for 23.1m:
          // Standard clinical penalty: 76-84 power
          // Top corner rocket: 86-92 power
          // Panenka / chip: 50-56 power
          let targetPower: number;
          const powerStyleRoll = Math.random();
          if (powerStyleRoll < 0.65) {
            targetPower = 78 + (Math.random() - 0.5) * 8; // Driven corner
          } else if (powerStyleRoll < 0.92) {
            targetPower = 88 + (Math.random() - 0.5) * 6; // Upper 90 blast
          } else {
            targetPower = 54 + (Math.random() - 0.5) * 4; // Delicate chip
          }

          if (isAiOnConsecutiveStreak) {
            targetPower += (Math.random() - 0.5) * 16;
          }

          const smartPenaltyPower = THREE.MathUtils.clamp(
            Math.round(targetPower),
            isAiOnConsecutiveStreak ? 50 : 64,
            isSuddenDeath ? 92 : 94
          );

          lockedPowerRef.current = smartPenaltyPower;
          currentPowerRef.current = smartPenaltyPower;
          setPower(smartPenaltyPower);
        } else {
          const isAiOnConsecutiveStreak = aiConsecutiveGoalsRef.current >= 1;
          let baseTargetPower = 74;
          if (fkDistance <= 22) baseTargetPower = 72;
          else if (fkDistance <= 26) baseTargetPower = 76;
          else if (fkDistance <= 30) baseTargetPower = 80;
          else baseTargetPower = 84;

          const powerVariance = isAiOnConsecutiveStreak ? 20 : 14;
          const smartPower = THREE.MathUtils.clamp(
            Math.round(baseTargetPower + (Math.random() - 0.5) * powerVariance),
            isAiOnConsecutiveStreak ? 54 : 60,
            isAiOnConsecutiveStreak ? 86 : 90
          );

          lockedPowerRef.current = smartPower;
          currentPowerRef.current = smartPower;
          setPower(smartPower);
        }

        // Automatic Intelligent Curve for AI
        const lockedAim = lockedAimRef.current ?? 0.5;
        const currentPow = lockedPowerRef.current ?? 75;
        let smartCurve = 0;

        if (aiPassedToTeammateRef.current) {
          smartCurve = (Math.random() - 0.5) * 0.006;
        } else if (isPenaltyScenario) {
          const curveDir = lockedAim < 0.5 ? 1 : -1;
          smartCurve = curveDir * (8.0 + Math.random() * 8.0);
        } else {
          smartCurve = calculateIntelligentCurve(
            lockedAim,
            currentPow,
            fkBallPosRef.current,
            gkReadyXRef.current || 0,
            wallDefendersRef.current[0]?.position.x,
            fkDistance,
            fkXOffset
          );
        }

        lockedCurveRef.current = smartCurve;
        currentCurveRef.current = smartCurve;
        setCurveAmount(smartCurve);
        setAiStepStatus('EXECUTING SHOT!');
        setSetupStep('kicking');
        triggerShotWithPower();
      }, powerPause);
    }

    return () => {
      if (aiTimer) clearTimeout(aiTimer);
    };
  }, [isPracticeMode, currentTurn, setupStep, showExitModal, showResultsModal, isGameOver, fkDistance, fkXOffset, penaltyShootout.round, penaltyShootout.isActive]);

  // Reset free kick entities to default standing state
  const resetToDefaultState = (forcedGkStartX?: number) => {
    stopGoalCheerSound();
    playWhistleSound();
    setSetupStep('aim');
    setPower(0);
    setAimProgress(0.5);
    setCurveAmount(0);
    setPlayInTimer(15);
    playInTimerRef.current = 15;
    setTurnEpoch((prev) => prev + 1);
    currentPowerRef.current = 0;
    currentAimRef.current = 0.5;
    currentCurveRef.current = 0;
    aimStartTimeRef.current = performance.now();
    powerStartTimeRef.current = performance.now();
    isHoldingPowerRef.current = false;
    powerHoldStartTimeRef.current = 0;
    lastVibrateMilestoneRef.current = 0;
    stopPowerChargeAudio();
    if (powerFillRef.current) powerFillRef.current.style.width = '0%';
    if (powerCursorRef.current) powerCursorRef.current.style.left = '0%';
    if (powerLevelBadgeRef.current) powerLevelBadgeRef.current.textContent = '0%';
    if (powerStatusTextRef.current) {
      powerStatusTextRef.current.textContent = 'HOLD SCREEN TO CHARGE • RELEASE TO STRIKE';
      powerStatusTextRef.current.className = 'text-center text-[9px] sm:text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mt-1.5';
    }
    if (powerCardRef.current) {
      powerCardRef.current.style.transform = 'translate3d(0, 0, 0)';
      powerCardRef.current.style.boxShadow = '0 6px 0 0 #000';
    }
    lockedAimRef.current = null;
    lockedPowerRef.current = null;
    lockedCurveRef.current = null;
    shotGravityRef.current = 9.81;
    shotPhaseRef.current = 'idle';
    shotOutcomeRef.current = null;
    isGoalScoredRef.current = false;
    deflectionCooldownUntilRef.current = 0;
    kickingPlayerAnimRef.current = null;
    aiPassedToTeammateRef.current = false;
    aiPassTargetTeammateRef.current = null;
    setShotOutcome(null);
    shotFinishedTimeRef.current = 0;
    hitPostTimeRef.current = 0;
    flightStartTimeRef.current = 0;
    runStartTimeRef.current = 0;
    hasTriggeredReplayForShotRef.current = false;
    isAdvancingTurnRef.current = false;

    // Reset Ball position, 1.0x scale, zero rotation and velocity
    if (ballMeshRef.current && fkBallPosRef.current) {
      ballMeshRef.current.position.copy(fkBallPosRef.current);
      ballMeshRef.current.scale.set(1.0, 1.0, 1.0);
      ballMeshRef.current.rotation.set(0, 0, 0);
      ballPosRef.current.copy(fkBallPosRef.current);
      ballVelRef.current.set(0, 0, 0);
    }

    // Reset Kicker position, facing rotation and upright limbs
    if (kickerGroupRef.current && kickerStartPosRef.current) {
      kickerGroupRef.current.position.copy(kickerStartPosRef.current);
      kickerGroupRef.current.rotation.set(0, kickerFacingAngleRef.current || 0, 0);
      const userData = kickerGroupRef.current.userData;
      if (userData.leftLegGroup) userData.leftLegGroup.rotation.set(0, 0, 0);
      if (userData.rightLegGroup) userData.rightLegGroup.rotation.set(0, 0, 0);
      if (userData.leftArmGroup) userData.leftArmGroup.rotation.set(0, 0, 0);
      if (userData.rightArmGroup) userData.rightArmGroup.rotation.set(0, 0, 0);
      if (userData.headGroup) userData.headGroup.rotation.set(0, 0, 0);
    }

    // Reset all player figures in free kick group (wall defenders, box players, GK)
    if (freeKickGroupRef.current) {
      freeKickGroupRef.current.traverse((child) => {
        if (child.userData && child.userData.isPlayerFigure) {
          child.position.y = 0;
          const ud = child.userData;
          const isWallPose = ud.defaultPose === 'wall';
          if (ud.leftArmGroup) ud.leftArmGroup.rotation.set(isWallPose ? Math.PI * 0.35 : 0, 0, 0);
          if (ud.rightArmGroup) ud.rightArmGroup.rotation.set(isWallPose ? Math.PI * 0.35 : 0, 0, 0);
          if (ud.leftLegGroup) ud.leftLegGroup.rotation.set(0, 0, 0);
          if (ud.rightLegGroup) ud.rightLegGroup.rotation.set(0, 0, 0);
          if (ud.headGroup) ud.headGroup.rotation.set(0, 0, 0);
        }
      });
    }

    // Reset Goalkeeper physics and realistic stance on goal line (side or center)
    const currentBallX = fkBallPosRef.current ? fkBallPosRef.current.x : (fkXOffset || 0);
    const startGkX = forcedGkStartX !== undefined
      ? forcedGkStartX
      : calculateRealisticGoalkeeperStartX(
          currentBallX,
          isPenaltyTrainingRef.current || isPenaltyShootoutRef.current
        );
    gkReadyXRef.current = startGkX;

    const targetBall = fkBallPosRef.current || new THREE.Vector3(0, 0.3015, 0);
    const dirToBall = targetBall.clone().sub(new THREE.Vector3(startGkX, 0, -42.0));
    const gkBaseRotY = Math.atan2(dirToBall.x, dirToBall.z);

    const isAiShooter = currentTurnRef.current === 'ai';
    const isAiOnConsecutive = isAiShooter && aiConsecutiveGoalsRef.current >= 1;
    const isPenaltyScenario = isPenaltyTraining || isPenaltyShootoutRef.current || penaltyShootout.isActive || isPenaltyTrainingRef.current;

    const flawRoll = Math.random();
    let flawType: GoalkeeperFlawType = 'none';
    let reactionDelay = isAiShooter
      ? (isPenaltyScenario ? (0.02 + Math.random() * 0.02) : (0.10 + Math.random() * 0.06))
      : (isPenaltyScenario ? (0.03 + Math.random() * 0.03) : (0.20 + Math.random() * 0.08));
    let misjudgedCurve = false;
    let flawOffset = isAiShooter
      ? (Math.random() - 0.5) * 0.15
      : (Math.random() - 0.5) * 0.40;
    let gambleSide = Math.random() > 0.5 ? 1 : -1;

    if (isAiShooter) {
      // When AI shoots, the player's goalkeeper is alert, agile, and properly defends the net
      if (flawRoll < 0.08) {
        // Minor curve perception misread on sharp bend
        flawType = 'deceived_by_curve';
        misjudgedCurve = true;
        flawOffset = (Math.random() - 0.5) * 0.35;
      } else {
        flawType = 'none';
      }
    } else if (!isAiOnConsecutive) {
      if (isPenaltyScenario) {
        // Penalty Specific Goalkeeper Behaviors (Lightning-quick reaction and dive response!)
        if (flawRoll < 0.25) {
          flawType = 'wrong_footed_gamble';
          reactionDelay = 0.02 + Math.random() * 0.03;
        } else if (flawRoll < 0.45) {
          flawType = 'premature_jump';
          reactionDelay = 0.03 + Math.random() * 0.03;
        } else if (flawRoll < 0.60) {
          flawType = 'fingertip_spill';
        } else {
          flawType = 'none';
        }
      } else {
        if (flawRoll < 0.20) {
          flawType = 'premature_jump';
          reactionDelay = 0.12 + Math.random() * 0.06;
        } else if (flawRoll < 0.40) {
          flawType = 'deceived_by_curve';
          misjudgedCurve = true;
          flawOffset = (Math.random() - 0.5) * 0.70;
        } else if (flawRoll < 0.55) {
          flawType = 'wrong_footed_gamble';
          reactionDelay = 0.14 + Math.random() * 0.08;
        } else if (flawRoll < 0.68) {
          flawType = 'flat_footed_delay';
          reactionDelay = 0.38 + Math.random() * 0.10;
        } else if (flawRoll < 0.78) {
          flawType = 'fingertip_spill';
        } else {
          flawType = 'none';
        }
      }
    }

    gkPhysicsRef.current = {
      state: 'ready',
      pos: new THREE.Vector3(startGkX, 0, -42.0),
      vel: new THREE.Vector3(0, 0, 0),
      rotX: 0,
      rotY: gkBaseRotY,
      rotZ: 0,
      baseRotY: gkBaseRotY,
      actionType: 'stay',
      hasReacted: false,
      hasJumped: false,
      jumpCompleted: false,
      walkCycle: 0,
      walkSpeed: 0,
      targetX: startGkX,
      targetY: 1.0,
      reactionDelay,
      flawType,
      flawOffset,
      misjudgedCurve,
      gambleSide,
    };

    if (gkGroupRef.current) {
      gkGroupRef.current.position.set(startGkX, 0, -42.0);
      gkGroupRef.current.rotation.set(0, gkBaseRotY, 0);
      const ud = gkGroupRef.current.userData;
      if (ud.leftArmGroup) ud.leftArmGroup.rotation.set(-0.55, 0.20, -0.35);
      if (ud.rightArmGroup) ud.rightArmGroup.rotation.set(-0.55, -0.20, 0.35);
      if (ud.leftLegGroup) ud.leftLegGroup.rotation.set(0, 0, 0);
      if (ud.rightLegGroup) ud.rightLegGroup.rotation.set(0, 0, 0);
      if (ud.headGroup) ud.headGroup.rotation.set(0, 0, 0);
    }

    if (aimArrowGroupRef.current) {
      aimArrowGroupRef.current.visible = currentTurnRef.current === 'player';
    }
    if (slingshotGroupRef.current) {
      slingshotGroupRef.current.visible = currentTurnRef.current === 'player';
    }

    aftertouchVecRef.current = { x: 0, y: 0 };
    if (swerveDisplayRef.current) swerveDisplayRef.current.textContent = '0%';
    if (dipDisplayRef.current) dipDisplayRef.current.textContent = '0%';
    isSlingshotDraggingRef.current = false;
    setIsSlingshotDragging(false);

    flightPointsRef.current = [];
    flightTimeRef.current = 0;
    hasBouncedRef.current = false;
    turnStartTimeRef.current = Date.now();
  };

  // Executes final strike with intelligent swerve and trajectory
  const executeShotNow = (overridePower?: number) => {
    if (currentTurnRef.current !== 'player' || shotPhaseRef.current !== 'idle' || isGameOver) return;
    isHoldingPowerRef.current = false;
    stopPowerChargeAudio();

    const finalPower = overridePower !== undefined
      ? overridePower
      : Math.max(18, Math.min(100, currentPowerRef.current || 25));
    lockedPowerRef.current = finalPower;
    setPower(finalPower);

    // Automatic Intelligent Curve based on goalkeeper, wall, aim, and power
    const smartCurve = calculateIntelligentCurve(
      lockedAimRef.current ?? 0.5,
      finalPower,
      fkBallPosRef.current,
      gkReadyXRef.current || 0,
      wallDefendersRef.current[0]?.position.x,
      fkDistance,
      fkXOffset
    );
    lockedCurveRef.current = smartCurve;
    currentCurveRef.current = smartCurve;
    setCurveAmount(smartCurve);
    setSetupStep('kicking');
    setupStepRef.current = 'kicking';
    triggerShotWithPower();
  };

  // Start charging power (locks aim if in 'aim' step, then charges power meter)
  const handleStartCharge = () => {
    if (currentTurnRef.current !== 'player' || shotPhaseRef.current !== 'idle' || isGameOver) return;
    if (isInputLocked() || isReplayActiveRef.current) return;

    inputDownTimestampRef.current = performance.now();

    if (setupStepRef.current === 'aim') {
      const aimVal = currentAimRef.current ?? 0.5;
      lockedAimRef.current = aimVal;
      setAimProgress(aimVal);

      // Play crisp snap / lock audio cue for immediate tactile feedback
      playLockAimSound(0.40);

      if (navigator.vibrate) {
        navigator.vibrate(22);
      }

      setSetupStep('power');
      setupStepRef.current = 'power';
      currentPowerRef.current = 18;
      isHoldingPowerRef.current = true;
      powerHoldStartTimeRef.current = performance.now();
      powerStartTimeRef.current = performance.now();
      lastVibrateMilestoneRef.current = 0;
      startPowerChargeAudio();

      if (powerFillRef.current) powerFillRef.current.style.width = '18%';
      if (powerCursorRef.current) powerCursorRef.current.style.left = '18%';
      if (powerLevelBadgeRef.current) {
        powerLevelBadgeRef.current.textContent = '18%';
        powerLevelBadgeRef.current.className = 'text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full bg-slate-200 text-black border border-black shadow-sm';
      }
      if (powerStatusTextRef.current) {
        powerStatusTextRef.current.textContent = 'CHARGING POWER... RELEASE TO STRIKE!';
        powerStatusTextRef.current.className = 'text-center text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-wide mt-1.5';
      }
      if (powerCardRef.current) {
        powerCardRef.current.style.transform = 'translate3d(0, 0, 0)';
        powerCardRef.current.style.boxShadow = '0 6px 0 0 #000';
      }
    } else if (setupStepRef.current === 'power') {
      if (!isHoldingPowerRef.current) {
        isHoldingPowerRef.current = true;
        powerHoldStartTimeRef.current = performance.now() - ((currentPowerRef.current || 18) / 100) * 1200;
        startPowerChargeAudio();
      }
    }
  };

  // Release screen / button: Locks power and executes shot with intelligent curve
  const handleReleaseCharge = () => {
    if (currentTurnRef.current !== 'player' || shotPhaseRef.current !== 'idle' || isGameOver) return;

    if (setupStepRef.current === 'power') {
      executeShotNow();
    }
  };

  // Step advancement / Quick Strike trigger
  const advanceStep = () => {
    if (currentTurn === 'ai' || isGameOver) return;
    if (Date.now() - lastSceneSkipTimestampRef.current < 200 || Date.now() - turnStartTimeRef.current < 200) return;

    if (shotPhaseRef.current === 'idle') {
      if (setupStepRef.current === 'aim') {
        handleStartCharge();
      } else if (setupStepRef.current === 'power') {
        executeShotNow();
      }
    } else if (setupStep === 'finished') {
      resetToDefaultState();
    }
  };

  // Select specific free kick position from the 30 preset positions
  const selectPositionIndex = (index: number, forcedGkStartX?: number) => {
    stopGoalCheerSound();
    const nextIndex = (index + FREE_KICK_POSITIONS.length) % FREE_KICK_POSITIONS.length;
    const pos = FREE_KICK_POSITIONS[nextIndex];

    // Forcefully stop any replay and clear recorded frames on position change
    isReplayActiveRef.current = false;
    setIsReplayActive(false);
    userInteractedWithReplayCamRef.current = false;
    recordedReplayFramesRef.current = [];
    activeReplayClipRef.current = [];
    shotFinishedTimeRef.current = 0;
    hitPostTimeRef.current = 0;
    hasTriggeredReplayForShotRef.current = false;
    turnStartTimeRef.current = Date.now();
    lastSceneSkipTimestampRef.current = Date.now();

    if (controlsRef.current) {
      controlsRef.current.enabled = false;
      controlsRef.current.enableRotate = false;
      controlsRef.current.enableZoom = false;
      controlsRef.current.enablePan = false;
    }

    setCurrentPosIndex(nextIndex);
    currentPosIndexRef.current = nextIndex;
    setFkDistance(pos.distance);
    setFkXOffset(pos.xOffset);
    setWallSize(pos.wallSize);
    setSetupStep('aim');
    setAimProgress(0.5);
    setCurveAmount(0);
    currentAimRef.current = 0.5;
    currentCurveRef.current = 0;
    currentPowerRef.current = 50;
    setCrowdExcitement('normal');

    const targetGkStartX = forcedGkStartX !== undefined
      ? forcedGkStartX
      : calculateRealisticGoalkeeperStartX(pos.xOffset, isPenaltyTrainingRef.current || isPenaltyShootoutRef.current);

    resetToDefaultState(targetGkStartX);
    setFreeKickEpoch((prev) => prev + 1);
  };

  const advanceToNextTurn = () => {
    stopGoalCheerSound();
    if (isAdvancingTurnRef.current) return;
    isAdvancingTurnRef.current = true;
    setCrowdExcitement('normal');
    setTimeout(() => {
      isAdvancingTurnRef.current = false;
    }, 500);

    shotFinishedTimeRef.current = 0;
    hasTriggeredReplayForShotRef.current = true;
    recordedReplayFramesRef.current = [];
    activeReplayClipRef.current = [];
    isReplayActiveRef.current = false;
    setIsReplayActive(false);

    if (isSurvival) {
      if (isOnlineMatch) {
        if (localShotFiredThisTurnRef.current) {
          localShotFiredThisTurnRef.current = false;
          const lastOutcome = shotOutcomeRef.current;
          const isGoal = isGoalScoredRef.current || lastOutcome === 'GOAL';

          let nextHostLives = hostSurvivalLivesRef.current;
          let nextGuestLives = guestSurvivalLivesRef.current;

          if (isGoal) {
            const nextStreak = survivalStreakRef.current + 1;
            survivalStreakRef.current = nextStreak;
            setSurvivalStreak(nextStreak);
            setSurvivalBestStreak((prev) => {
              const nb = Math.max(prev, nextStreak);
              try { crazyGamesSDK.setItem('fkl_survival_best_streak_v1', nb.toString()); } catch {}
              return nb;
            });
            const streakBonus = 100 * nextStreak;
            setSurvivalScore((prev) => prev + streakBonus);
            setSuperpowerCharge((prev) => Math.min(100, prev + 35));
          } else {
            if (isLocalHost) {
              nextHostLives = Math.max(0, hostSurvivalLivesRef.current - 1);
              hostSurvivalLivesRef.current = nextHostLives;
              setHostSurvivalLives(nextHostLives);
            } else {
              nextGuestLives = Math.max(0, guestSurvivalLivesRef.current - 1);
              guestSurvivalLivesRef.current = nextGuestLives;
              setGuestSurvivalLives(nextGuestLives);
            }
            setSuperpowerCharge((prev) => Math.max(0, prev - 20));
          }

          const myLives = isLocalHost ? nextHostLives : nextGuestLives;
          const nextRole = isLocalHost ? 'guest' : 'host';
          const recentIndex = currentPosIndexRef.current;
          const candidates = FREE_KICK_POSITIONS.map((_, i) => i).filter((i) => i !== recentIndex);
          const nextPosIdx = candidates.length > 0
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : (recentIndex + 1) % FREE_KICK_POSITIONS.length;

          const nextPos = FREE_KICK_POSITIONS[nextPosIdx];
          const nextGkStartX = calculateRealisticGoalkeeperStartX(nextPos.xOffset, false);
          const nextTurnNumber = (onlineMatchRoom?.turn ?? 1) + 1;

          onlineMatchManager.advanceOnlineTurn({
            nextTurnRole: nextRole,
            nextPositionIndex: nextPosIdx,
            hostScore: 0,
            guestScore: 0,
            homeScore: 0,
            awayScore: 0,
            turnNumber: nextTurnNumber,
            gkStartX: nextGkStartX,
            survivalLives: {
              host: nextHostLives,
              guest: nextGuestLives,
            },
          });

          const oppLives = isLocalHost ? nextGuestLives : nextHostLives;

          if (myLives <= 0 || oppLives <= 0 || survivalOnlineTimeRef.current <= 0) {
            concludeSurvivalMatchByLives(true);
            return;
          }

          currentTurnRef.current = 'ai';
          setCurrentTurn('ai');
          setActiveSuperpower(null);
          activeSuperpowerRef.current = null;
          selectPositionIndex(nextPosIdx, nextGkStartX);
        } else if (isBotMatch && currentTurnRef.current === 'ai') {
          // Bot opponent finished survival kick: advance turn back to player
          const lastOutcome = shotOutcomeRef.current;
          const isGoal = isGoalScoredRef.current || lastOutcome === 'GOAL';

          let nextHostLives = hostSurvivalLivesRef.current;
          let nextGuestLives = guestSurvivalLivesRef.current;

          if (!isGoal) {
            if (isLocalHost) {
              nextGuestLives = Math.max(0, guestSurvivalLivesRef.current - 1);
              guestSurvivalLivesRef.current = nextGuestLives;
              setGuestSurvivalLives(nextGuestLives);
            } else {
              nextHostLives = Math.max(0, hostSurvivalLivesRef.current - 1);
              hostSurvivalLivesRef.current = nextHostLives;
              setHostSurvivalLives(nextHostLives);
            }
          }

          const myLives = isLocalHost ? nextHostLives : nextGuestLives;
          const oppLives = isLocalHost ? nextGuestLives : nextHostLives;

          if (oppLives <= 0 || myLives <= 0 || survivalOnlineTimeRef.current <= 0) {
            concludeSurvivalMatchByLives(isLocalHost);
            return;
          }

          const recentIndex = currentPosIndexRef.current;
          const candidates = FREE_KICK_POSITIONS.map((_, i) => i).filter((i) => i !== recentIndex);
          const nextPosIdx = candidates.length > 0
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : (recentIndex + 1) % FREE_KICK_POSITIONS.length;

          const nextPos = FREE_KICK_POSITIONS[nextPosIdx];
          const nextGkStartX = calculateRealisticGoalkeeperStartX(nextPos.xOffset, false);

          currentTurnRef.current = 'player';
          setCurrentTurn('player');
          setActiveSuperpower(null);
          activeSuperpowerRef.current = null;
          selectPositionIndex(nextPosIdx, nextGkStartX);
        } else {
          // Defender finished watching opponent's kick
          const myLives = isLocalHost ? hostSurvivalLivesRef.current : guestSurvivalLivesRef.current;
          const oppLives = isLocalHost ? guestSurvivalLivesRef.current : hostSurvivalLivesRef.current;

          if (oppLives <= 0 || myLives <= 0 || survivalOnlineTimeRef.current <= 0) {
            concludeSurvivalMatchByLives(isLocalHost);
            return;
          }

          resetToDefaultState();
        }
        return;
      }

      // Offline Survival Mode (Turn-Based User vs AI)
      const lastOutcome = shotOutcomeRef.current;
      const isGoal = isGoalScoredRef.current || lastOutcome === 'GOAL';

      if (currentTurnRef.current === 'player') {
        // Player shot resolution
        if (isGoal) {
          const nextStreak = survivalStreakRef.current + 1;
          survivalStreakRef.current = nextStreak;
          setSurvivalStreak(nextStreak);
          setSurvivalBestStreak((prev) => {
            const nb = Math.max(prev, nextStreak);
            try { crazyGamesSDK.setItem('fkl_survival_best_streak_v1', nb.toString()); } catch {}
            return nb;
          });
          const streakBonus = 100 * nextStreak;
          setSurvivalScore((prev) => prev + streakBonus);
          setSuperpowerCharge((prev) => Math.min(100, prev + 35));
        } else {
          const remainingLives = Math.max(0, survivalLivesRef.current - 1);
          survivalLivesRef.current = remainingLives;
          setSurvivalLives(remainingLives);
          setSuperpowerCharge((prev) => Math.max(0, prev - 20));

          if (remainingLives <= 0 || survivalOnlineTimeRef.current <= 0) {
            concludeSurvivalMatchByLives(false);
            return;
          }
        }

        if (aiSurvivalLivesRef.current <= 0 || survivalOnlineTimeRef.current <= 0) {
          concludeSurvivalMatchByLives(false);
          return;
        }

        // Advance turn to AI
        currentTurnRef.current = 'ai';
        setCurrentTurn('ai');
        setActiveSuperpower(null);
        activeSuperpowerRef.current = null;
        randomizeFreeKick();
        return;
      } else {
        // AI shot resolution
        if (isGoal) {
          aiConsecutiveGoalsRef.current += 1;
        } else {
          aiConsecutiveGoalsRef.current = 0;
          const remainingAiLives = Math.max(0, aiSurvivalLivesRef.current - 1);
          aiSurvivalLivesRef.current = remainingAiLives;
          setAiSurvivalLives(remainingAiLives);

          if (remainingAiLives <= 0 || survivalOnlineTimeRef.current <= 0) {
            concludeSurvivalMatchByLives(false);
            return;
          }
        }

        if (survivalLivesRef.current <= 0 || survivalOnlineTimeRef.current <= 0) {
          concludeSurvivalMatchByLives(false);
          return;
        }

        // Advance turn back to Player
        currentTurnRef.current = 'player';
        setCurrentTurn('player');
        setActiveSuperpower(null);
        activeSuperpowerRef.current = null;
        randomizeFreeKick();
        return;
      }
    }

    if (isOnlineMatch) {
      // Only the client that actually fired the kick this turn triggers the turn advance
      if (localShotFiredThisTurnRef.current) {
        localShotFiredThisTurnRef.current = false;

        // Check if match time has expired
        const timeIsUp = isTimeExpiredRef.current || (matchTimeRef.current >= 90 && stoppageSecondsRef.current !== null && stoppageCountdownRef.current >= (stoppageSecondsRef.current || 3));
        const pShots = matchStatsRef.current.playerShots;
        const aShots = matchStatsRef.current.aiShots;

        // Equal turns have completed when both players have taken the same number of shots
        const equalTurnsCompleted = pShots === aShots && pShots > 0;

        if (timeIsUp && equalTurnsCompleted) {
          concludeMatch(true);
          return;
        }

        const nextRole = isLocalHost ? 'guest' : 'host';
        const recentIndex = currentPosIndexRef.current;
        const candidates = FREE_KICK_POSITIONS.map((_, i) => i).filter((i) => i !== recentIndex);
        const nextPosIdx = candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : (recentIndex + 1) % FREE_KICK_POSITIONS.length;

        const nextPos = FREE_KICK_POSITIONS[nextPosIdx];
        const nextGkStartX = calculateRealisticGoalkeeperStartX(nextPos.xOffset, false);
        const nextTurnNumber = (onlineMatchRoom?.turn ?? 1) + 1;
        const hostScore = isLocalHost ? homeScoreRef.current : awayScoreRef.current;
        const guestScore = isLocalHost ? awayScoreRef.current : homeScoreRef.current;
        onlineMatchManager.advanceOnlineTurn({
          nextTurnRole: nextRole,
          nextPositionIndex: nextPosIdx,
          hostScore,
          guestScore,
          homeScore: hostScore,
          awayScore: guestScore,
          turnNumber: nextTurnNumber,
          gkStartX: nextGkStartX,
          matchTime: matchTimeRef.current,
          stoppageCountdown: stoppageCountdownRef.current,
        });

        currentTurnRef.current = 'ai';
        setCurrentTurn('ai');
        selectPositionIndex(nextPosIdx, nextGkStartX);
      } else if (isBotMatch && currentTurnRef.current === 'ai') {
        // Bot completed its shot in online bot match: advance turn back to player
        const timeIsUp = isTimeExpiredRef.current || (matchTimeRef.current >= 90 && stoppageSecondsRef.current !== null && stoppageCountdownRef.current >= (stoppageSecondsRef.current || 3));
        const pShots = matchStatsRef.current.playerShots;
        const aShots = matchStatsRef.current.aiShots;
        const equalTurnsCompleted = pShots === aShots && pShots > 0;

        if (timeIsUp && equalTurnsCompleted) {
          concludeMatch(true);
          return;
        }

        const recentIndex = currentPosIndexRef.current;
        const candidates = FREE_KICK_POSITIONS.map((_, i) => i).filter((i) => i !== recentIndex);
        const nextPosIdx = candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : (recentIndex + 1) % FREE_KICK_POSITIONS.length;

        const nextPos = FREE_KICK_POSITIONS[nextPosIdx];
        const nextGkStartX = calculateRealisticGoalkeeperStartX(nextPos.xOffset, false);

        currentTurnRef.current = 'player';
        setCurrentTurn('player');
        selectPositionIndex(nextPosIdx, nextGkStartX);
      } else {
        // Defender completed watching the shot/replay: check if game finished or reset to default state
        const timeIsUp = isTimeExpiredRef.current || (matchTimeRef.current >= 90 && stoppageSecondsRef.current !== null && stoppageCountdownRef.current >= (stoppageSecondsRef.current || 3));
        const pShots = matchStatsRef.current.playerShots;
        const aShots = matchStatsRef.current.aiShots;
        const equalTurnsCompleted = pShots === aShots && pShots > 0;

        if (timeIsUp && equalTurnsCompleted) {
          concludeMatch(true);
          return;
        }

        resetToDefaultState();
      }
      return;
    }

    if (isPenaltyShootoutRef.current) {
      const currentShootout = penaltyShootoutRef.current;
      if (currentShootout.winner) {
        isGameOverRef.current = true;
        isPenaltyShootoutRef.current = false;
        setIsGameOver(true);
        setShowResultsModal(true);
        crazyGamesSDK.gameplayStop();
        if (currentShootout.winner === 'player') {
          crazyGamesSDK.happytime();
        }
      } else {
        const nextTurn = currentShootout.currentKicker;
        currentTurnRef.current = nextTurn;
        setCurrentTurn(nextTurn);
        setFkDistance(PENALTY_DISTANCE);
        setFkXOffset(0.0);
        setWallSize(0);
        resetToDefaultState();
      }
    } else if (!isGameOverRef.current) {
      if (isPracticeModeRef.current) {
        currentTurnRef.current = 'player';
        setCurrentTurn('player');
        randomizeFreeKick();
      } else {
        // In Match Mode: Check if time has expired AND both players have taken equal shots
        const timeIsUp = isTimeExpiredRef.current || (matchTimeRef.current >= 90 && stoppageSecondsRef.current !== null && stoppageCountdownRef.current >= (stoppageSecondsRef.current || 3));
        const pShots = matchStatsRef.current.playerShots;
        const aShots = matchStatsRef.current.aiShots;

        // Conclude when time is up and full round finished (equal turns or AI finished their reply)
        if (timeIsUp && ((pShots === aShots && pShots > 0) || (currentTurnRef.current === 'ai' && pShots > 0))) {
          concludeMatch(true);
          return;
        }

        const nextTurn = currentTurnRef.current === 'player' ? 'ai' : 'player';
        currentTurnRef.current = nextTurn;
        setCurrentTurn(nextTurn);
        randomizeFreeKick();
      }
    }
  };

  const startReplaySequence = () => {
    const isAnyPenaltyMode = isPenaltyTraining || isPenaltyShootoutRef.current || penaltyShootout.isActive || isPenaltyTrainingRef.current;
    if (isPracticeMode || isAnyPenaltyMode || recordedReplayFramesRef.current.length < 5) {
      advanceToNextTurn();
      return;
    }

    activeReplayClipRef.current = [...recordedReplayFramesRef.current];
    const totalDuration = activeReplayClipRef.current[activeReplayClipRef.current.length - 1].time;
    const cleanDuration = Math.max(200, totalDuration);
    replayDurationRef.current = cleanDuration;
    setReplayDuration(cleanDuration);

    replayPlayheadTimeRef.current = 0;
    setReplayPlayheadTime(0);
    replayIndexRef.current = 1;
    setReplayIndex(1);
    replayCamAngleRef.current = 'ball_tracking';
    setReplayCamAngle('ball_tracking');
    userInteractedWithReplayCamRef.current = false;
    isReplayPausedRef.current = false;
    setIsReplayPaused(false);

    // Goal Replay: Fixed 0.65x slow motion broadcast playback speed
    replaySpeedRef.current = 0.65;
    setReplaySpeed(0.65);

    isReplayActiveRef.current = true;
    setIsReplayActive(true);

    // Setup camera for Replay 1 (First Camera Ball Tracking: Centered Viewport Tracking)
    if (cameraRef.current && controlsRef.current) {
      const origSpotX = activeReplayClipRef.current[0]?.ball?.pos[0] ?? fkXOffset;
      const origSpotZ = activeReplayClipRef.current[0]?.ball?.pos[2] ?? (-42.0 + fkDistance);
      cameraRef.current.position.set(origSpotX * 0.35, 3.8, origSpotZ + 7.5);
      controlsRef.current.target.set(origSpotX * 0.35, 1.2, origSpotZ - 10.0);
      cameraRef.current.fov = 48;
      cameraRef.current.updateProjectionMatrix();
      controlsRef.current.enabled = false;
      controlsRef.current.enableRotate = false;
      controlsRef.current.enableZoom = false;
      controlsRef.current.enablePan = false;
      controlsRef.current.update();
    }
  };

  const switchReplayAngle = (angle: 'ball_tracking' | 'behind_goal', explicitIndex?: number) => {
    replayCamAngleRef.current = angle;
    setReplayCamAngle(angle);
    if (explicitIndex !== undefined) {
      replayIndexRef.current = explicitIndex;
      setReplayIndex(explicitIndex);
    } else {
      const idx = angle === 'ball_tracking' ? 1 : 2;
      replayIndexRef.current = idx;
      setReplayIndex(idx);
    }
    userInteractedWithReplayCamRef.current = false;

    if (!cameraRef.current || !controlsRef.current) return;

    if (angle === 'ball_tracking') {
      const origSpotX = activeReplayClipRef.current[0]?.ball?.pos[0] ?? fkXOffset;
      const origSpotZ = activeReplayClipRef.current[0]?.ball?.pos[2] ?? (-42.0 + fkDistance);
      cameraRef.current.position.set(origSpotX * 0.35, 3.8, origSpotZ + 7.5);
      controlsRef.current.target.set(origSpotX * 0.35, 1.2, origSpotZ - 10.0);
      cameraRef.current.fov = 48;
      cameraRef.current.updateProjectionMatrix();
      controlsRef.current.enabled = false;
      controlsRef.current.enableRotate = false;
      controlsRef.current.update();
    } else if (angle === 'behind_goal') {
      const origSpotX = activeReplayClipRef.current[0]?.ball?.pos[0] ?? fkXOffset;
      const origSpotZ = activeReplayClipRef.current[0]?.ball?.pos[2] ?? (-42.0 + fkDistance);
      cameraRef.current.position.set(origSpotX * 0.12, 6.8, -53.5);
      controlsRef.current.target.set(origSpotX, 0.40, origSpotZ);
      cameraRef.current.fov = 48;
      cameraRef.current.updateProjectionMatrix();
      controlsRef.current.enabled = false;
      controlsRef.current.enableRotate = false;
      controlsRef.current.update();
    }
  };

  const stopReplayAndAdvance = () => {
    stopGoalCheerSound();
    if (!isReplayActiveRef.current && shotPhaseRef.current !== 'finished') return;
    lastSceneSkipTimestampRef.current = Date.now();
    lockInputTemporarily(600);
    if (isOnlineMatch) {
      onlineMatchManager.skipReplay();
    }
    isReplayActiveRef.current = false;
    setIsReplayActive(false);
    userInteractedWithReplayCamRef.current = false;

    if (controlsRef.current) {
      controlsRef.current.enabled = false;
      controlsRef.current.enableRotate = false;
      controlsRef.current.enableZoom = false;
      controlsRef.current.enablePan = false;
    }
    advanceToNextTurn();
  };

  const toggleReplayPause = () => {
    const nextPaused = !isReplayPausedRef.current;
    isReplayPausedRef.current = nextPaused;
    setIsReplayPaused(nextPaused);
  };

  const restartReplayClip = () => {
    replayPlayheadTimeRef.current = 0;
    setReplayPlayheadTime(0);
    isReplayPausedRef.current = false;
    setIsReplayPaused(false);
  };

  const setReplayPlaybackSpeed = (speed: number) => {
    replaySpeedRef.current = speed;
    setReplaySpeed(speed);
  };

  const scrubReplayTime = (newTime: number) => {
    replayPlayheadTimeRef.current = newTime;
    setReplayPlayheadTime(newTime);
  };

  const randomizeFreeKick = () => {
    if (isPenaltyTraining) {
      setFkDistance(PENALTY_DISTANCE);
      setFkXOffset(0.0);
      setWallSize(0);
      resetToDefaultState(0.0);
      return;
    }
    const recentIndex = currentPosIndexRef.current;
    const candidates = FREE_KICK_POSITIONS.map((_, i) => i).filter((i) => i !== recentIndex);
    const randomIndex = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : (recentIndex + 1) % FREE_KICK_POSITIONS.length;

    const pos = FREE_KICK_POSITIONS[randomIndex];
    const targetGkStartX = calculateRealisticGoalkeeperStartX(pos.xOffset, false);

    if (isOnlineMatch && (isMyOnlineTurn || isLocalHost)) {
      onlineMatchManager.syncPosition(randomIndex, targetGkStartX);
    }

    selectPositionIndex(randomIndex, targetGkStartX);
  };

  const handlePlayAgain = (forcedPosIndex?: number) => {
    homeScoreRef.current = 0;
    awayScoreRef.current = 0;
    setHomeScore(0);
    setAwayScore(0);
    setPracticeGoals(0);
    setPracticeStreak(0);
    setPracticeBestStreak(0);
    matchTimeRef.current = 0;
    setMatchTime(0);
    setStoppageSeconds(null);
    stoppageCountdownRef.current = 0;
    setStoppageCountdown(0);
    isTimeExpiredRef.current = false;
    setIsTimeExpired(false);
    isGameOverRef.current = false;
    setIsGameOver(false);
    setShowResultsModal(false);
    setShowPenaltyAnnouncement(false);
    setIsOpponentQuitModalOpen(false);

    const resetStats = {
      playerShots: 0,
      aiShots: 0,
      playerGoals: 0,
      aiGoals: 0,
      playerWoodwork: 0,
      aiWoodwork: 0,
    };
    matchStatsRef.current = resetStats;
    setMatchStats(resetStats);

    setPenaltyShootout({
      isActive: false,
      homeKicks: [null, null, null, null, null],
      awayKicks: [null, null, null, null, null],
      homePenaltiesScore: 0,
      awayPenaltiesScore: 0,
      currentKicker: 'player',
      round: 1,
      winner: null,
      statusText: '',
    });
    isPenaltyShootoutRef.current = false;
    aiConsecutiveGoalsRef.current = 0;

    if (isSurvival) {
      setHostSurvivalLives(3);
      setGuestSurvivalLives(3);
      hostSurvivalLivesRef.current = 3;
      guestSurvivalLivesRef.current = 3;
      setSurvivalLives(3);
      survivalLivesRef.current = 3;
      setAiSurvivalLives(3);
      aiSurvivalLivesRef.current = 3;
      setSurvivalStreak(0);
      survivalStreakRef.current = 0;
      setSurvivalScore(0);
      setSurvivalOnlineTime(100);
      survivalOnlineTimeRef.current = 100;
    }

    // Reset shot outcome, flight, replays, and turn advancement flags
    stopGoalCheerSound();
    shotOutcomeRef.current = null;
    isGoalScoredRef.current = false;
    isAdvancingTurnRef.current = false;
    hasTriggeredReplayForShotRef.current = false;
    recordedReplayFramesRef.current = [];
    activeReplayClipRef.current = [];
    isReplayActiveRef.current = false;
    setIsReplayActive(false);
    localShotFiredThisTurnRef.current = false;
    crazyGamesSDK.gameplayStart();

    const initTurn = isOnlineMatch ? (isLocalHost ? 'player' : 'ai') : 'player';
    setCurrentTurn(initTurn);
    currentTurnRef.current = initTurn;

    if (isOnlineMatch && isLocalHost) {
      onlineMatchManager.syncMatchTime(isSurvival ? 100 : 0, undefined);
    }

    if (forcedPosIndex !== undefined) {
      const pos = FREE_KICK_POSITIONS[forcedPosIndex];
      const targetGkStartX = calculateRealisticGoalkeeperStartX(pos.xOffset, false);
      selectPositionIndex(forcedPosIndex, targetGkStartX);
      return;
    }

    // Guaranteed selection of a completely new free kick position different from recent
    const recentIndex = currentPosIndexRef.current;
    const candidates = FREE_KICK_POSITIONS.map((_, i) => i).filter((i) => i !== recentIndex);
    const nextIndex = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : (recentIndex + 1) % FREE_KICK_POSITIONS.length;
    
    const pos = FREE_KICK_POSITIONS[nextIndex];
    const targetGkStartX = calculateRealisticGoalkeeperStartX(pos.xOffset, false);

    if (isOnlineMatch && isLocalHost) {
      onlineMatchManager.syncPosition(nextIndex, targetGkStartX);
    }
    selectPositionIndex(nextIndex, targetGkStartX);
  };

  // Trigger kicker run-up and 7% ball scale reduction on locking power
  const triggerShotWithPower = () => {
    if (shotPhaseRef.current !== 'idle' || isGameOver) return;

    // In online match, broadcast shot to opponent immediately!
    if (isOnlineMatch && isMyOnlineTurn) {
      localShotFiredThisTurnRef.current = true;
      const gkPhys = gkPhysicsRef.current;
      const aimVal = lockedAimRef.current !== null && lockedAimRef.current !== undefined ? lockedAimRef.current : (currentAimRef.current ?? 0.5);
      const powerVal = lockedPowerRef.current !== null && lockedPowerRef.current !== undefined ? lockedPowerRef.current : (currentPowerRef.current ?? 50);
      const curveVal = lockedCurveRef.current !== null && lockedCurveRef.current !== undefined ? lockedCurveRef.current : (currentCurveRef.current ?? 0);

      lockedAimRef.current = aimVal;
      lockedPowerRef.current = powerVal;
      lockedCurveRef.current = curveVal;

      const shotData: OnlineShotPayload = {
        kickerId: onlineMatchManager.localPlayerId,
        kickerRole: isLocalHost ? 'host' : 'guest',
        aimProgress: aimVal,
        power: powerVal,
        curveAmount: curveVal,
        positionIndex: currentPosIndexRef.current,
        gkStartX: gkReadyXRef.current,
        gkReactionDelay: gkPhys?.reactionDelay,
        gkFlawType: gkPhys?.flawType,
        gkFlawOffset: gkPhys?.flawOffset,
        gkGambleSide: gkPhys?.gambleSide,
      };
      onlineMatchManager.executeShot(shotData);
    }

    // Reduce size of the ball by 7% when power is selected
    if (ballMeshRef.current) {
      ballMeshRef.current.scale.set(0.93, 0.93, 0.93);
    }

    // Trigger kicker run-up to the ball
    if (kickerGroupRef.current) {
      shotPhaseRef.current = 'running';
      runStartTimeRef.current = performance.now();
      shotTakenTimestampRef.current = Date.now();
      lockInputTemporarily(400); // 400ms input lockout immediately after shot is taken to prevent erratic aiming behavior
    }
  };

  // 15-Second Action Play-In Timer Countdown
  // If the user doesn't kick before the timer reaches 15s (expires at 0s), the kicker automatically kicks the ball randomly
  // Only active when isPlayInFeatureActive is true (Online Matches)
  useEffect(() => {
    if (
      !isPlayInFeatureActive ||
      sceneLoading ||
      currentTurn !== 'player' ||
      setupStep === 'kicking' ||
      setupStep === 'finished' ||
      shotPhaseRef.current !== 'idle' ||
      isGameOver ||
      showExitModal ||
      showResultsModal ||
      isReplayActive ||
      isOpponentQuitModalOpen
    ) {
      return;
    }

    const interval = setInterval(() => {
      setPlayInTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // 15s Timer expired! Kicker shoots randomly
          const randomAim = lockedAimRef.current !== null && lockedAimRef.current !== undefined
            ? lockedAimRef.current
            : (0.15 + Math.random() * 0.70);
          const randomPower = lockedPowerRef.current !== null && lockedPowerRef.current !== undefined
            ? lockedPowerRef.current
            : (62 + Math.floor(Math.random() * 26));
          const randomCurve = lockedCurveRef.current !== null && lockedCurveRef.current !== undefined
            ? lockedCurveRef.current
            : ((Math.random() - 0.5) * 0.045);

          lockedAimRef.current = randomAim;
          currentAimRef.current = randomAim;
          setAimProgress(randomAim);

          lockedPowerRef.current = randomPower;
          currentPowerRef.current = randomPower;
          setPower(randomPower);

          lockedCurveRef.current = randomCurve;
          currentCurveRef.current = randomCurve;
          setCurveAmount(randomCurve);

          setSetupStep('kicking');
          triggerShotWithPower();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isPlayInFeatureActive,
    sceneLoading,
    currentTurn,
    setupStep,
    isGameOver,
    showExitModal,
    showResultsModal,
    isReplayActive,
    isOpponentQuitModalOpen,
    turnEpoch,
  ]);

  const hasMovedRef = useRef<boolean>(false);

  // Keyboard & Global Pointer controls for In-Flight Aftertouch, Aim Lock, and Power Charge
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResultsModal || showSurvivalGameOver || showExitModal) return;

      // Skip replay on space / enter
      if (isReplayActiveRef.current) {
        if (e.key === ' ' || e.key === 'Enter' || e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          lastSceneSkipTimestampRef.current = Date.now();
          lockInputTemporarily(600);
          stopReplayAndAdvance();
          return;
        }
      }

      // Fast forward celebration if goal celebration is playing
      if (shotPhaseRef.current === 'finished' && shotFinishedTimeRef.current > 0 && Date.now() - shotFinishedTimeRef.current > 400) {
        if (e.key === ' ' || e.key === 'Enter' || e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          lastSceneSkipTimestampRef.current = Date.now();
          lockInputTemporarily(600);
          advanceToNextTurn();
          return;
        }
      }

      if (shotPhaseRef.current === 'flying') {
        // IN-FLIGHT AFTERTOUCH (Real-time Magnus swerve & dip via Arrow keys and WASD)
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a' || e.code === 'KeyA') {
          aftertouchVecRef.current.x = Math.max(-1.0, aftertouchVecRef.current.x - 0.40);
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd' || e.code === 'KeyD') {
          aftertouchVecRef.current.x = Math.min(1.0, aftertouchVecRef.current.x + 0.40);
        } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w' || e.code === 'KeyW') {
          aftertouchVecRef.current.y = Math.min(1.0, aftertouchVecRef.current.y + 0.35);
        } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's' || e.code === 'KeyS') {
          aftertouchVecRef.current.y = Math.max(-1.0, aftertouchVecRef.current.y - 0.35);
        }
        if (swerveDisplayRef.current) {
          swerveDisplayRef.current.textContent = `${Math.round(aftertouchVecRef.current.x * 100)}%`;
        }
        if (dipDisplayRef.current) {
          dipDisplayRef.current.textContent = `${Math.round(aftertouchVecRef.current.y * 100)}%`;
        }
        if (isOnlineMatch && isMyOnlineTurn) {
          onlineMatchManager.syncAftertouch(aftertouchVecRef.current.x, aftertouchVecRef.current.y);
        }
      } else if (shotPhaseRef.current === 'idle' && currentTurnRef.current === 'player') {
        if (e.key === ' ' || e.key === 'Enter' || e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          if (!e.repeat) {
            handleStartCharge();
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.code === 'Space' || e.code === 'Enter') {
        if (shotPhaseRef.current === 'idle' && currentTurnRef.current === 'player') {
          e.preventDefault();
          handleReleaseCharge();
        }
      }
    };

    const handleWindowPointerUp = () => {
      if (shotPhaseRef.current === 'idle' && currentTurnRef.current === 'player') {
        handleReleaseCharge();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerup', handleWindowPointerUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [showResultsModal, showSurvivalGameOver, showExitModal, fkDistance, fkXOffset]);

  // Pointer Handling: Start Hold to Charge on Pointer Down
  const handlePointerDown = (e: React.PointerEvent) => {
    if (showResultsModal || showSurvivalGameOver || showExitModal) {
      return;
    }

    if (isReplayActiveRef.current) {
      e.stopPropagation();
      lastSceneSkipTimestampRef.current = Date.now();
      lockInputTemporarily(600);
      stopReplayAndAdvance();
      return;
    }

    if (isInputLocked()) return;
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.pointer-events-auto') || (e.target as HTMLElement).closest('input')) {
      return;
    }

    // If a shot has finished and celebration/waiting is underway, allow tap to fast-forward
    if (shotPhaseRef.current === 'finished' && shotFinishedTimeRef.current > 0 && Date.now() - shotFinishedTimeRef.current > 600) {
      lastSceneSkipTimestampRef.current = Date.now();
      lockInputTemporarily(600);
      const isGoal = isGoalScoredRef.current || shotOutcomeRef.current === 'GOAL';
      const isAnyPenaltyMode = isPenaltyTraining || isPenaltyShootoutRef.current || penaltyShootout.isActive || isPenaltyTrainingRef.current;
      if (!isPracticeMode && !isAnyPenaltyMode && isGoal && recordedReplayFramesRef.current.length > 5 && !hasTriggeredReplayForShotRef.current) {
        hasTriggeredReplayForShotRef.current = true;
        startReplaySequence();
      } else {
        advanceToNextTurn();
      }
      return;
    }

    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    if (currentTurn === 'player' && shotPhaseRef.current === 'idle') {
      if (setupStepRef.current === 'aim') {
        handleStartCharge();
      } else if (setupStepRef.current === 'power') {
        if (!isHoldingPowerRef.current) {
          executeShotNow();
        }
      }
      return;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (sceneLoading || isGameOver || showResultsModal) return;

    if (isReplayActiveRef.current) {
      userInteractedWithReplayCamRef.current = true;
      setReplayCamAngle('orbit');
      return;
    }

    // In-Flight Aftertouch (Real-time swerve and dip from mouse / pointer movement)
    if (shotPhaseRef.current === 'flying') {
      const prevX = lastPointerPosRef.current.x || e.clientX;
      const prevY = lastPointerPosRef.current.y || e.clientY;
      const deltaX = (e.clientX - prevX) / 28.0;
      const deltaY = -(e.clientY - prevY) / 28.0;

      aftertouchVecRef.current.x = Math.max(-1.0, Math.min(1.0, aftertouchVecRef.current.x + deltaX));
      aftertouchVecRef.current.y = Math.max(-1.0, Math.min(1.0, aftertouchVecRef.current.y + deltaY));
      if (swerveDisplayRef.current) {
        swerveDisplayRef.current.textContent = `${Math.round(aftertouchVecRef.current.x * 100)}%`;
      }
      if (dipDisplayRef.current) {
        dipDisplayRef.current.textContent = `${Math.round(aftertouchVecRef.current.y * 100)}%`;
      }
      if (isOnlineMatch && isMyOnlineTurn) {
        onlineMatchManager.syncAftertouch(aftertouchVecRef.current.x, aftertouchVecRef.current.y);
      }
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    if (shotPhaseRef.current === 'idle' && currentTurnRef.current === 'player') {
      handleReleaseCharge();
    }
  };

  // Tap Interaction fallback
  const handleContainerClick = (e: React.MouseEvent) => {
    if (showResultsModal || showSurvivalGameOver || showExitModal) return;
    if (isInputLocked() || isReplayActiveRef.current || currentTurn === 'ai' || shotPhaseRef.current !== 'idle') return;
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.pointer-events-auto') || (e.target as HTMLElement).closest('input')) {
      return;
    }
  };

  // High-Definition Pitch Texture Creation (Daytime Vibrant Turf with Crisp Markings)
  const createPitchTexture = (maxAnisotropy: number, pitchId: string = equippedPitchId || 'classic_stripes') => {
    if (pitchTextureMap.has(pitchId)) return pitchTextureMap.get(pitchId)!;

    const pitchItem = PITCH_PATTERN_ITEMS.find((p) => p.id === pitchId) || PITCH_PATTERN_ITEMS[0];
    const { grassDark, grassLight, lineColor, patternType } = pitchItem.theme;

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 3072;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Base pitch grass color
    ctx.fillStyle = grassDark;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (patternType === 'stripes') {
      // Lawnmower stripe pattern (vertical stripes)
      const stripeCount = 20;
      const stripeWidth = canvas.width / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? grassDark : grassLight;
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, canvas.height);
      }
      const horizStripes = 24;
      const horizHeight = canvas.height / horizStripes;
      for (let j = 0; j < horizStripes; j++) {
        if (j % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
          ctx.fillRect(0, j * horizHeight, canvas.width, horizHeight);
        }
      }
    } else if (patternType === 'horizontal_stripes') {
      const stripeCount = 28;
      const stripeHeight = canvas.height / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? grassDark : grassLight;
        ctx.fillRect(0, i * stripeHeight, canvas.width, stripeHeight);
      }
    } else if (patternType === 'checkerboard') {
      const cols = 20;
      const rows = 30;
      const colW = canvas.width / cols;
      const rowH = canvas.height / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? grassDark : grassLight;
          ctx.fillRect(c * colW, r * rowH, colW, rowH);
        }
      }
    } else if (patternType === 'rings') {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxR = Math.hypot(canvas.width, canvas.height) / 2;
      const ringWidth = 80;
      const totalRings = Math.ceil(maxR / ringWidth);
      for (let ring = totalRings; ring >= 0; ring--) {
        ctx.fillStyle = ring % 2 === 0 ? grassLight : grassDark;
        ctx.beginPath();
        ctx.arc(cx, cy, (ring + 1) * ringWidth, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (patternType === 'diamond') {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 4);
      const stripeW = 90;
      const extent = Math.max(canvas.width, canvas.height) * 1.5;
      for (let x = -extent; x < extent; x += stripeW * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(x, -extent, stripeW, extent * 2);
      }
      ctx.restore();
    } else if (patternType === 'diagonal_stripes') {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 6);
      const stripeW = 85;
      const extent = Math.max(canvas.width, canvas.height) * 1.5;
      for (let x = -extent; x < extent; x += stripeW * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(x, -extent, stripeW, extent * 2);
      }
      ctx.restore();
    } else if (patternType === 'chevron' || patternType === 'herringbone') {
      const bandHeight = 96;
      const rows = Math.ceil(canvas.height / bandHeight);
      const midX = canvas.width / 2;
      for (let r = 0; r < rows; r++) {
        if (r % 2 === 0) {
          ctx.fillStyle = grassLight;
          ctx.beginPath();
          ctx.moveTo(0, r * bandHeight);
          ctx.lineTo(midX, r * bandHeight - 64);
          ctx.lineTo(canvas.width, r * bandHeight);
          ctx.lineTo(canvas.width, (r + 1) * bandHeight);
          ctx.lineTo(midX, (r + 1) * bandHeight - 64);
          ctx.lineTo(0, (r + 1) * bandHeight);
          ctx.closePath();
          ctx.fill();
        }
      }
    } else if (patternType === 'sunburst' || patternType === 'starburst') {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const numRays = 32;
      const rayAngle = (Math.PI * 2) / numRays;
      const maxR = Math.hypot(canvas.width, canvas.height);
      for (let i = 0; i < numRays; i += 2) {
        ctx.fillStyle = grassLight;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, i * rayAngle, (i + 1) * rayAngle);
        ctx.closePath();
        ctx.fill();
      }
    } else if (patternType === 'cross_hatch' || patternType === 'tartan') {
      const stripeW = 75;
      for (let x = 0; x < canvas.width; x += stripeW * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(x, 0, stripeW, canvas.height);
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let y = 0; y < canvas.height; y += stripeW * 2) {
        ctx.fillRect(0, y, canvas.width, stripeW);
      }
    } else if (patternType === 'hexagonal') {
      const hexRadius = 60;
      const hexHeight = Math.sqrt(3) * hexRadius;
      for (let y = 0; y < canvas.height + hexHeight; y += hexHeight * 0.75) {
        const row = Math.floor(y / (hexHeight * 0.75));
        const offsetX = (row % 2 === 0) ? 0 : hexRadius * 1.5;
        for (let x = -hexRadius * 2; x < canvas.width + hexRadius * 2; x += hexRadius * 3) {
          ctx.fillStyle = ((Math.floor(x / (hexRadius * 3)) + row) % 2 === 0) ? grassLight : grassDark;
          ctx.beginPath();
          for (let a = 0; a < 6; a++) {
            const angle = (Math.PI / 3) * a;
            const hx = x + offsetX + hexRadius * Math.cos(angle);
            const hy = y + hexRadius * Math.sin(angle);
            if (a === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    } else if (patternType === 'waves') {
      const waveH = 100;
      const rows = Math.ceil(canvas.height / waveH);
      for (let r = 0; r < rows; r++) {
        if (r % 2 === 0) {
          ctx.fillStyle = grassLight;
          ctx.beginPath();
          ctx.moveTo(0, r * waveH);
          for (let x = 0; x <= canvas.width; x += 32) {
            const yOffset = Math.sin((x / canvas.width) * Math.PI * 4) * 30;
            ctx.lineTo(x, r * waveH + yOffset);
          }
          ctx.lineTo(canvas.width, (r + 1) * waveH);
          for (let x = canvas.width; x >= 0; x -= 32) {
            const yOffset = Math.sin((x / canvas.width) * Math.PI * 4) * 30;
            ctx.lineTo(x, (r + 1) * waveH + yOffset);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    } else if (patternType === 'quadrant') {
      const midX = canvas.width / 2;
      const midY = canvas.height / 2;
      // Top Left & Bottom Right: Vertical stripes
      const stripeW = 60;
      for (let x = 0; x < midX; x += stripeW * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(x, 0, stripeW, midY);
      }
      for (let x = midX; x < canvas.width; x += stripeW * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(x, midY, stripeW, midY);
      }
      // Top Right & Bottom Left: Horizontal stripes
      const stripeH = 60;
      for (let y = 0; y < midY; y += stripeH * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(midX, y, midX, stripeH);
      }
      for (let y = midY; y < canvas.height; y += stripeH * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(0, y, midX, stripeH);
      }
    } else if (patternType === 'boxes') {
      const numBoxes = 16;
      const stepX = (canvas.width / 2) / numBoxes;
      const stepY = (canvas.height / 2) / numBoxes;
      for (let i = numBoxes; i >= 0; i--) {
        ctx.fillStyle = (i % 2 === 0) ? grassLight : grassDark;
        ctx.fillRect(
          (canvas.width / 2) - i * stepX,
          (canvas.height / 2) - i * stepY,
          i * stepX * 2,
          i * stepY * 2
        );
      }
    } else if (patternType === 'spiral') {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const totalRings = 24;
      const ringW = 60;
      for (let ring = totalRings; ring >= 0; ring--) {
        ctx.fillStyle = ring % 2 === 0 ? grassLight : grassDark;
        ctx.beginPath();
        ctx.arc(cx, cy, (ring + 1) * ringW, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (patternType === 'fine_grid') {
      const cols = 40;
      const rows = 60;
      const colW = canvas.width / cols;
      const rowH = canvas.height / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? grassDark : grassLight;
          ctx.fillRect(c * colW, r * rowH, colW, rowH);
        }
      }
    } else {
      // Default / emerald / fine weave
      const stripeCount = 28;
      const stripeWidth = canvas.width / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        if (i % 2 === 0) {
          ctx.fillStyle = grassLight;
          ctx.fillRect(i * stripeWidth, 0, stripeWidth, canvas.height);
        }
      }
      const horizStripes = 36;
      const horizHeight = canvas.height / horizStripes;
      for (let j = 0; j < horizStripes; j++) {
        if (j % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.fillRect(0, j * horizHeight, canvas.width, horizHeight);
        }
      }
    }

    // Pitch Line Markings - Thick High Visibility Turf Paint
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const padX = 128;
    const padY = 192;
    const pitchW = canvas.width - padX * 2;
    const pitchH = canvas.height - padY * 2;

    ctx.strokeRect(padX, padY, pitchW, pitchH);

    // Halfway Line
    ctx.beginPath();
    ctx.moveTo(padX, canvas.height / 2);
    ctx.lineTo(canvas.width - padX, canvas.height / 2);
    ctx.stroke();

    // Center Circle
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const centerCircleRadius = Math.round(pitchW * (9.15 / 68));

    ctx.beginPath();
    ctx.arc(centerX, centerY, centerCircleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Center Spot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();

    // FIFA Official Proportional Markings
    const pBoxW = Math.round(pitchW * (40.32 / 68));
    const pBoxH = Math.round(pitchH * (16.5 / 105));
    const pBoxLeft = centerX - pBoxW / 2;

    const gBoxW = Math.round(pitchW * (18.32 / 68));
    const gBoxH = Math.round(pitchH * (5.5 / 105));
    const gBoxLeft = centerX - gBoxW / 2;

    // Official FIFA penalty spot is 11.0 meters (12 yards) from the goal line
    const pitchPenSpotDist = Math.round(pitchH * (11.0 / 105));
    const penaltyArcRadius = Math.round(pitchW * (9.15 / 68));

    // --- Top Goal Area (North) ---
    const topPBoxY = padY;
    const topGBoxY = padY;
    const topPenSpotY = padY + pitchPenSpotDist;

    ctx.strokeRect(pBoxLeft, topPBoxY, pBoxW, pBoxH);
    ctx.strokeRect(gBoxLeft, topGBoxY, gBoxW, gBoxH);
    ctx.beginPath();
    ctx.arc(centerX, topPenSpotY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Arc ("D") outside the 16.5m penalty box
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, topPBoxY + pBoxH, canvas.width, canvas.height - (topPBoxY + pBoxH));
    ctx.clip();
    ctx.beginPath();
    ctx.arc(centerX, topPenSpotY, penaltyArcRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // --- Bottom Goal Area (South) ---
    const botPBoxY = padY + pitchH - pBoxH;
    const botGBoxY = padY + pitchH - gBoxH;
    const botPenSpotY = padY + pitchH - pitchPenSpotDist;

    ctx.strokeRect(pBoxLeft, botPBoxY, pBoxW, pBoxH);
    ctx.strokeRect(gBoxLeft, botGBoxY, gBoxW, gBoxH);
    ctx.beginPath();
    ctx.arc(centerX, botPenSpotY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Arc ("D") outside the 16.5m penalty box
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, botPBoxY);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(centerX, botPenSpotY, penaltyArcRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4 Corner Kick Arcs
    const cornerRadius = Math.round(pitchW * (1.0 / 68));
    ctx.beginPath();
    ctx.arc(padX, padY, cornerRadius, 0, Math.PI * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(padX + pitchW, padY, cornerRadius, Math.PI * 0.5, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(padX, padY + pitchH, cornerRadius, Math.PI * 1.5, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(padX + pitchW, padY + pitchH, cornerRadius, Math.PI, Math.PI * 1.5);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = Math.min(maxAnisotropy, 16);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    pitchTextureMap.set(pitchId, texture);
    return texture;
  };

  // Spherical 3D Projected Match Soccer Ball Texture (0% Distortion at Poles)
  const createSoccerBallTexture = (ballId: string = equippedBallId || 'aero_tricolor_pro') => {
    if (soccerBallTextureMap.has(ballId)) return soccerBallTextureMap.get(ballId)!;

    const ballItem = BALL_TEXTURE_ITEMS.find((b) => b.id === ballId) || BALL_TEXTURE_ITEMS[0];

    const canvas = document.createElement('canvas');
    const width = 1024;
    const height = 512;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    renderBallTextureToContext(ctx, width, height, ballItem);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 16;
    soccerBallTextureMap.set(ballId, texture);
    return texture;
  };

  /**
   * Updates realistic, subtle, human-like facial expressions (eye blinking, micro head shifts, gaze saccades)
   * and dynamic ball tracking (heads & eyes turning to follow the ball in flight or on the pitch).
   */
  const updatePlayerFacialExpressions = (
    playerGroup: THREE.Group,
    now: number,
    dt: number,
    ballWorldPos?: THREE.Vector3 | null,
    isBallActive?: boolean
  ) => {
    const ud = playerGroup.userData;
    if (!ud || !ud.facialState) return;

    const st = ud.facialState;
    const { headGroup, leftEyeWhite, rightEyeWhite, leftPupil, rightPupil, leftEyebrow, rightEyebrow } = ud;

    // 1. REALISTIC HUMAN EYE BLINKING
    if (!st.isBlinking && now >= st.nextBlinkTime) {
      st.isBlinking = true;
      st.blinkStartTime = now;
      st.blinkDuration = 120 + Math.random() * 60; // 120ms to 180ms human blink duration
      st.isDoubleBlink = Math.random() < 0.22; // 22% chance of natural human double blink
      st.doubleBlinkStage = 0;
    }

    if (st.isBlinking) {
      const elapsed = now - st.blinkStartTime;
      const progress = elapsed / st.blinkDuration;

      if (progress >= 0 && progress <= 1.0) {
        // Natural sine wave curve for eyelid closure (0 -> 1 -> 0)
        const blinkClosedness = Math.sin(progress * Math.PI);
        const eyeScaleY = Math.max(0.08, 1.0 - blinkClosedness * 0.92);

        if (leftEyeWhite) leftEyeWhite.scale.y = eyeScaleY;
        if (rightEyeWhite) rightEyeWhite.scale.y = eyeScaleY;
        if (leftPupil) leftPupil.scale.y = eyeScaleY;
        if (rightPupil) rightPupil.scale.y = eyeScaleY;

        // Subtle eyebrow dip during blink
        const eyebrowDip = blinkClosedness * 0.008;
        if (leftEyebrow) leftEyebrow.position.y = 0.11 - eyebrowDip;
        if (rightEyebrow) rightEyebrow.position.y = 0.11 - eyebrowDip;
      } else {
        // Finished current blink
        if (st.isDoubleBlink && st.doubleBlinkStage === 0) {
          // Trigger rapid second blink after a 120ms gap
          st.doubleBlinkStage = 1;
          st.blinkStartTime = now + 120;
          st.isDoubleBlink = false;
        } else {
          st.isBlinking = false;
          st.nextBlinkTime = now + 2200 + Math.random() * 4200; // 2.2s - 6.4s until next blink

          // Reset scales & positions
          if (leftEyeWhite) leftEyeWhite.scale.y = 1.0;
          if (rightEyeWhite) rightEyeWhite.scale.y = 1.0;
          if (leftPupil) leftPupil.scale.y = 1.0;
          if (rightPupil) rightPupil.scale.y = 1.0;
          if (leftEyebrow) leftEyebrow.position.y = 0.11;
          if (rightEyebrow) rightEyebrow.position.y = 0.11;
        }
      }
    }

    // Kicker rule: the kicker should ONLY look at the ball after it has been kicked (isBallActive === true)
    const canTrackBall = ud.isKicker ? (isBallActive === true) : true;

    // 2. DYNAMIC BALL TRACKING (HEAD & EYE GAZE FOLLOWING THE BALL)
    let isTrackingBall = false;

    if (canTrackBall && ballWorldPos && headGroup) {
      const shouldComputeGaze = isBallActive || !st.lastGazeUpdate || (now - st.lastGazeUpdate) >= 250;
      if (shouldComputeGaze) {
        st.lastGazeUpdate = now;
        // Get head world position into scratch vector
        headGroup.getWorldPosition(_scratchV3_1);

        _scratchV3_2.copy(ballWorldPos).sub(_scratchV3_1);
        const distToBall = _scratchV3_2.length();

        if (distToBall > 0.2) {
          _scratchV3_2.normalize();

          // Get player body's orientation in world space using scratch quaternions
          playerGroup.getWorldQuaternion(_scratchQuat_1);
          _scratchQuat_2.copy(_scratchQuat_1).invert();

          // Direction to ball in player body's local space (+Z is forward, +Y is up, +X is right)
          _scratchV3_2.applyQuaternion(_scratchQuat_2);

          // Compute yaw (left/right) and pitch (up/down into the sky or onto turf)
          const yawToBall = Math.atan2(_scratchV3_2.x, _scratchV3_2.z); // Radians
          const horizDist = Math.sqrt(_scratchV3_2.x * _scratchV3_2.x + _scratchV3_2.z * _scratchV3_2.z);
          const pitchToBall = Math.atan2(_scratchV3_2.y, horizDist); // Radians

          // A player turns their head if the ball is within their natural field of view / sight
          if (Math.abs(yawToBall) < 2.35) {
            st.hasBallInView = true;

            // Human neck movement limits:
            // Max yaw turn: +/- 80 degrees (+/- 1.40 rad)
            const targetYaw = Math.max(-1.40, Math.min(1.40, yawToBall));

            // Pitch limits: looking down (-0.5 rad / ~28 deg) or looking UP into sky (+1.25 rad / ~72 deg)
            // Since Three.js pitch up is negative rotation around local X:
            const targetPitch = -Math.max(-0.5, Math.min(1.25, pitchToBall));

            // Set targets for head rotation
            st.targetHeadRotY = targetYaw;
            st.targetHeadRotX = targetPitch;
            st.targetHeadRotZ = (yawToBall > 0 ? -0.06 : 0.06) * Math.sin(Math.abs(pitchToBall)); // Subtle head tilt when tracking high ball

            // Residual angle offset is handled by eye gaze (pupils moving in eye socket)
            const residualYaw = yawToBall - targetYaw;
            const residualPitch = pitchToBall - (-targetPitch);

            st.targetPupilX = Math.max(-0.028, Math.min(0.028, residualYaw * 0.04));
            st.targetPupilY = Math.max(-0.020, Math.min(0.020, residualPitch * 0.035));
          } else {
            st.hasBallInView = false;
          }
        }
      }
      isTrackingBall = Boolean(st.hasBallInView);
    }

    // 3. IDLE MICRO HEAD MOVEMENTS & EYE GAZE SACCADES (When not tracking active ball or for natural micro movement blend)
    if (!isTrackingBall) {
      if (ud.isKicker && !isBallActive) {
        // Free kick scene: kicker leans head forward and down, intensely focused on the ball and scene
        st.targetHeadRotX = 0.22;
        st.targetHeadRotY = ud.isLeftFooted ? 0.08 : -0.08;
        st.targetHeadRotZ = ud.isLeftFooted ? -0.04 : 0.04;
      } else if (now >= st.nextHeadMoveTime) {
        // Subtle pitch (+/-2 deg), yaw (+/-4 deg), roll (+/-1.1 deg)
        st.targetHeadRotX = (Math.random() - 0.5) * 0.07;
        st.targetHeadRotY = (Math.random() - 0.5) * 0.14;
        st.targetHeadRotZ = (Math.random() - 0.5) * 0.04;

        st.nextHeadMoveTime = now + 2600 + Math.random() * 5200;
      }

      if (now >= st.nextGazeTime) {
        st.targetPupilX = (Math.random() - 0.5) * 0.024;
        st.targetPupilY = (Math.random() - 0.5) * 0.016;

        st.nextGazeTime = now + 2400 + Math.random() * 4600;
      }
    }

    // Smooth head rotation lerp (faster tracking when ball is in flight, smooth gentle lerp during idle)
    if (headGroup) {
      const lerpSpeed = isTrackingBall ? (isBallActive ? 16.0 : 8.0) : 3.8;
      const factor = Math.min(1.0, dt * lerpSpeed);

      st.currentHeadRotX += (st.targetHeadRotX - st.currentHeadRotX) * factor;
      st.currentHeadRotY += (st.targetHeadRotY - st.currentHeadRotY) * factor;
      st.currentHeadRotZ += (st.targetHeadRotZ - st.currentHeadRotZ) * factor;

      headGroup.rotation.x = st.currentHeadRotX;
      headGroup.rotation.y = st.currentHeadRotY;
      headGroup.rotation.z = st.currentHeadRotZ;
    }

    // Smooth pupil gaze lerp
    const gazeLerpSpeed = isTrackingBall ? 18.0 : 5.0;
    const gazeFactor = Math.min(1.0, dt * gazeLerpSpeed);
    st.currentPupilX += (st.targetPupilX - st.currentPupilX) * gazeFactor;
    st.currentPupilY += (st.targetPupilY - st.currentPupilY) * gazeFactor;

    if (leftPupil) {
      leftPupil.position.x = st.baseLeftPupilX + st.currentPupilX;
      leftPupil.position.y = st.basePupilY + st.currentPupilY;
    }
    if (rightPupil) {
      rightPupil.position.x = st.baseRightPupilX + st.currentPupilX;
      rightPupil.position.y = st.basePupilY + st.currentPupilY;
    }
  };

  // Helper to check luminance for contrast text
  const isLightColor = (hex: string): boolean => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 0;
    const b = parseInt(c.substring(4, 6), 16) || 0;
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
  };

  // Helper to create clean 3D Block Player Character with authentic National Team Kits
  const createPlayerFigure = (options: {
    jerseyColor?: string;
    secondaryColor?: string;
    pattern?: 'solid' | 'stripes' | 'checker' | 'sash' | 'hoops' | 'pinstripes' | 'halves';
    shortsColor?: string;
    socksColor?: string;
    collarColor?: string;
    sleeveTrimColor?: string;
    skinColor?: string;
    hairColor?: string;
    hairStyle?: 'buzz' | 'crop' | 'sweep' | 'curls' | 'dreads' | 'undercut' | 'afro' | 'slick' | 'ponytail' | 'spiky' | 'bald';
    shoesColor?: string;
    glovesColor?: string;
    numberStr?: string;
    teamCode?: string;
    countryCode?: string;
    customKit?: CountryKit;
    hasArmband?: boolean;
    pose?: 'kicker' | 'wall' | 'gk' | 'referee';
    teamRole?: 'attacker' | 'defender';
  }) => {
    const group = new THREE.Group();

    // Resolve kit options if customKit or countryCode is passed
    const kit = options.customKit || (options.countryCode ? getCountryKit(options.countryCode) : undefined);

    const jerseyColor = options.jerseyColor || kit?.jerseyColor || '#ef4444';
    const secondaryColor = options.secondaryColor || kit?.secondaryColor || '#ffffff';
    const pattern = options.pattern || kit?.pattern || 'solid';
    const shortsColor = options.shortsColor || kit?.shortsColor || '#1e293b';
    const socksColor  = options.socksColor  || kit?.socksColor || jerseyColor;
    const collarColor = options.collarColor || kit?.collarColor || '#1e293b';
    const skinColor   = options.skinColor   || '#f9cbc5';
    const hairColor   = options.hairColor   || '#231e21';
    const hairStyle   = options.hairStyle   || 'crop';
    const shoesColor  = options.shoesColor  || '#10b981';
    const glovesColor = options.glovesColor || kit?.gkJerseyColor || '#f97316';

    // 2. Materials (Cached to eliminate garbage collection & WebGL leaks)
    const skinMat = getOrCreatePlayerStandardMat(skinColor, 0.45, 0.0);
    const shortsMat = getOrCreatePlayerStandardMat(shortsColor, 0.35, 0.05);
    const socksMat = getOrCreatePlayerStandardMat(socksColor, 0.35, 0.05);
    const shoesMat = getOrCreatePlayerStandardMat(shoesColor, 0.2, 0.1);
    const hairMat = getOrCreatePlayerStandardMat(hairColor, 0.5, 0.05);
    const gkGlovesMat = getOrCreatePlayerStandardMat(glovesColor, 0.35, 0.08);

    // Create Torso Jersey Materials (Front without number, Back with number, Sides/Top/Bottom clean)
    const createBaseJerseyCanvas = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Base Color
        ctx.fillStyle = jerseyColor;
        ctx.fillRect(0, 0, 256, 256);

        // Pattern
        if (pattern === 'stripes') {
          ctx.fillStyle = secondaryColor;
          const w = 32;
          for (let x = 0; x < 256; x += w * 2) {
            ctx.fillRect(x + 16, 0, w, 256);
          }
        } else if (pattern === 'hoops') {
          ctx.fillStyle = secondaryColor;
          const h = 32;
          for (let y = 0; y < 256; y += h * 2) {
            ctx.fillRect(0, y + 16, 256, h);
          }
        } else if (pattern === 'checker') {
          ctx.fillStyle = secondaryColor;
          const sz = 32;
          for (let x = 0; x < 256; x += sz) {
            for (let y = 0; y < 256; y += sz) {
              if ((Math.floor(x / sz) + Math.floor(y / sz)) % 2 === 0) {
                ctx.fillRect(x, y, sz, sz);
              }
            }
          }
        } else if (pattern === 'sash') {
          ctx.fillStyle = secondaryColor;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(60, 0);
          ctx.lineTo(256, 196);
          ctx.lineTo(256, 256);
          ctx.lineTo(196, 256);
          ctx.lineTo(0, 60);
          ctx.closePath();
          ctx.fill();
        } else if (pattern === 'pinstripes') {
          ctx.fillStyle = secondaryColor;
          for (let x = 16; x < 256; x += 32) {
            ctx.fillRect(x, 0, 4, 256);
          }
        } else if (pattern === 'halves') {
          ctx.fillStyle = secondaryColor;
          ctx.fillRect(128, 0, 128, 256);
        }

        // Top collar band
        ctx.fillStyle = collarColor;
        ctx.fillRect(0, 0, 256, 16);
      }
      return { canvas, ctx };
    };

    const isLight = isLightColor(jerseyColor);
    const textColor = isLight ? '#0f172a' : '#ffffff';

    // 1) Base/Side Material (Cached)
    const sideTexKey = `side_${jerseyColor}_${pattern}_${secondaryColor}_${collarColor}`;
    let sideTex = jerseyTextureCache.get(sideTexKey);
    if (!sideTex) {
      const { canvas } = createBaseJerseyCanvas();
      sideTex = new THREE.CanvasTexture(canvas);
      jerseyTextureCache.set(sideTexKey, sideTex);
    }
    let sideJerseyMat = jerseyMaterialCache.get(sideTexKey);
    if (!sideJerseyMat) {
      sideJerseyMat = new THREE.MeshStandardMaterial({
        map: sideTex,
        roughness: 0.35,
        metalness: 0.05,
      });
      jerseyMaterialCache.set(sideTexKey, sideJerseyMat);
    }

    // 2) Front Material (Team Code / Chest Crest only, NO shirt number - Cached)
    const frontTexKey = `front_${jerseyColor}_${pattern}_${secondaryColor}_${collarColor}_${options.teamCode || ''}`;
    let frontTex = jerseyTextureCache.get(frontTexKey);
    if (!frontTex) {
      const { canvas, ctx } = createBaseJerseyCanvas();
      if (ctx && options.teamCode) {
        ctx.fillStyle = textColor;
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(options.teamCode.toUpperCase(), 128, 68);
      }
      frontTex = new THREE.CanvasTexture(canvas);
      jerseyTextureCache.set(frontTexKey, frontTex);
    }
    let frontJerseyMat = jerseyMaterialCache.get(frontTexKey);
    if (!frontJerseyMat) {
      frontJerseyMat = new THREE.MeshStandardMaterial({
        map: frontTex,
        roughness: 0.35,
        metalness: 0.05,
      });
      jerseyMaterialCache.set(frontTexKey, frontJerseyMat);
    }

    // 3) Back Material (Shirt Number clearly displayed on back - Cached)
    const backTexKey = `back_${jerseyColor}_${pattern}_${secondaryColor}_${collarColor}_${options.teamCode || ''}_${options.numberStr || ''}`;
    let backTex = jerseyTextureCache.get(backTexKey);
    if (!backTex) {
      const { canvas, ctx } = createBaseJerseyCanvas();
      if (ctx) {
        if (options.teamCode) {
          ctx.fillStyle = textColor;
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(options.teamCode.toUpperCase(), 128, 52);
        }
        if (options.numberStr) {
          ctx.fillStyle = textColor;
          ctx.font = '900 110px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(options.numberStr, 128, 148);
        }
      }
      backTex = new THREE.CanvasTexture(canvas);
      jerseyTextureCache.set(backTexKey, backTex);
    }
    let backJerseyMat = jerseyMaterialCache.get(backTexKey);
    if (!backJerseyMat) {
      backJerseyMat = new THREE.MeshStandardMaterial({
        map: backTex,
        roughness: 0.35,
        metalness: 0.05,
      });
      jerseyMaterialCache.set(backTexKey, backJerseyMat);
    }

    // Torso multi-material array: [+X, -X, +Y, -Y, +Z (Front), -Z (Back)]
    const torsoMaterials = [
      sideJerseyMat,  // +X (Right)
      sideJerseyMat,  // -X (Left)
      sideJerseyMat,  // +Y (Top)
      sideJerseyMat,  // -Y (Bottom)
      frontJerseyMat, // +Z (Front - NO shirt number)
      backJerseyMat,  // -Z (Back - with shirt number)
    ];

    // -------------------------------------------------------------
    // 3. TORSO (Jersey Body)
    // -------------------------------------------------------------
    const torso = new THREE.Mesh(PLAYER_TORSO_GEO, torsoMaterials);
    torso.position.y = 1.05;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    // Dark Collar Crew Neck Trim on top of torso
    const collarMat = new THREE.MeshStandardMaterial({ color: collarColor, roughness: 0.3 });
    const collarMesh = new THREE.Mesh(PLAYER_COLLAR_GEO, collarMat);
    collarMesh.position.set(0, 1.49, 0);
    group.add(collarMesh);

    // Blocky Shoulder Sleeve Caps
    const leftShoulderCap = new THREE.Mesh(PLAYER_SHOULDER_GEO, sideJerseyMat);
    leftShoulderCap.position.set(-0.35, 1.39, 0);
    leftShoulderCap.castShadow = true;
    group.add(leftShoulderCap);

    const rightShoulderCap = new THREE.Mesh(PLAYER_SHOULDER_GEO, sideJerseyMat);
    rightShoulderCap.position.set(0.35, 1.39, 0);
    rightShoulderCap.castShadow = true;
    group.add(rightShoulderCap);

    // -------------------------------------------------------------
    // 4. SHORTS & INNER SPANDEX
    // -------------------------------------------------------------
    const shorts = new THREE.Mesh(PLAYER_SHORTS_GEO, shortsMat);
    shorts.position.y = 0.68;
    shorts.castShadow = true;
    shorts.receiveShadow = true;
    group.add(shorts);

    // -------------------------------------------------------------
    // 5. HEAD & FACE ASSEMBLY
    // -------------------------------------------------------------
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.5, 0); // Neck pivot point
    group.add(headGroup);

    // Head Block
    const head = new THREE.Mesh(PLAYER_HEAD_GEO, skinMat);
    head.position.set(0, 0.175, 0);
    head.castShadow = true;
    head.receiveShadow = true;
    headGroup.add(head);

    // Face Features Container
    const faceGroup = new THREE.Group();
    faceGroup.position.set(0, 0.175, 0.176); // Mounted on front face of head

    // Eye Whites
    const leftEyeWhite = new THREE.Mesh(PLAYER_EYE_WHITE_GEO, MAT_EYE_WHITE);
    leftEyeWhite.position.set(-0.08, 0.05, 0);
    faceGroup.add(leftEyeWhite);

    const rightEyeWhite = new THREE.Mesh(PLAYER_EYE_WHITE_GEO, MAT_EYE_WHITE);
    rightEyeWhite.position.set(0.08, 0.05, 0);
    faceGroup.add(rightEyeWhite);

    // Pupils
    const leftPupil = new THREE.Mesh(PLAYER_PUPIL_GEO, MAT_PUPIL);
    leftPupil.position.set(-0.08, 0.05, 0.002);
    faceGroup.add(leftPupil);

    const rightPupil = new THREE.Mesh(PLAYER_PUPIL_GEO, MAT_PUPIL);
    rightPupil.position.set(0.08, 0.05, 0.002);
    faceGroup.add(rightPupil);

    // Eyebrows
    const leftEyebrow = new THREE.Mesh(PLAYER_EYEBROW_GEO, MAT_EYEBROW);
    leftEyebrow.position.set(-0.08, 0.11, 0.002);
    faceGroup.add(leftEyebrow);

    const rightEyebrow = new THREE.Mesh(PLAYER_EYEBROW_GEO, MAT_EYEBROW);
    rightEyebrow.position.set(0.08, 0.11, 0.002);
    faceGroup.add(rightEyebrow);

    // Mouth
    const mouth = new THREE.Mesh(PLAYER_MOUTH_GEO, MAT_MOUTH);
    mouth.position.set(0, -0.06, 0.002);
    faceGroup.add(mouth);

    headGroup.add(faceGroup);

    // -------------------------------------------------------------
    // 6. HAIR (Unified normal hairstyle across all players, varying only by hairColor)
    // -------------------------------------------------------------
    const hair = new THREE.Mesh(PLAYER_HAIR_GEO, hairMat);
    hair.position.set(0, 0.35, 0);
    hair.castShadow = true;
    headGroup.add(hair);

    // -------------------------------------------------------------
    // 7. LEGS & CLEATS ASSEMBLY
    // -------------------------------------------------------------
    // Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.16, 0.55, 0); // Hip pivot point

    const leftLeg = new THREE.Mesh(PLAYER_LEG_GEO, socksMat);
    leftLeg.position.y = -0.275;
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;
    leftLegGroup.add(leftLeg);

    // Left Cleat Shoe
    const leftShoe = new THREE.Mesh(PLAYER_SHOE_GEO, shoesMat);
    leftShoe.position.set(0, -0.5, 0.04);
    leftShoe.castShadow = true;
    leftLegGroup.add(leftShoe);

    group.add(leftLegGroup);

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.16, 0.55, 0); // Hip pivot point

    const rightLeg = new THREE.Mesh(PLAYER_LEG_GEO, socksMat);
    rightLeg.position.y = -0.275;
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;
    rightLegGroup.add(rightLeg);

    // Right Cleat Shoe
    const rightShoe = new THREE.Mesh(PLAYER_SHOE_GEO, shoesMat);
    rightShoe.position.set(0, -0.5, 0.04);
    rightShoe.castShadow = true;
    rightLegGroup.add(rightShoe);

    group.add(rightLegGroup);

    // -------------------------------------------------------------
    // 8. ARMS (Sleeved Upper Arm + Armband + Skin Forearm)
    // -------------------------------------------------------------
    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.38, 1.35, 0); // Shoulder pivot

    // Left Upper Sleeve
    const leftSleeve = new THREE.Mesh(PLAYER_UPPER_ARM_GEO, sideJerseyMat);
    leftSleeve.position.y = -0.14;
    leftSleeve.castShadow = true;
    leftArmGroup.add(leftSleeve);

    // Left Sleeve Dark Trim
    const leftSleeveTrim = new THREE.Mesh(PLAYER_SLEEVE_TRIM_GEO, collarMat);
    leftSleeveTrim.position.y = -0.27;
    leftArmGroup.add(leftSleeveTrim);

    // Captain Armband on Left Arm
    if (options.hasArmband) {
      const band = new THREE.Mesh(PLAYER_BAND_GEO, MAT_CAPTAIN_BAND);
      band.position.y = -0.20;
      leftArmGroup.add(band);

      const badge = new THREE.Mesh(PLAYER_BADGE_GEO, MAT_BADGE_WHITE);
      badge.position.y = -0.20;
      leftArmGroup.add(badge);
    }

    // Lower Forearm & Hands / Goalkeeper Gloves
    let leftForearm: THREE.Mesh;
    let rightForearm: THREE.Mesh;

    if (options.pose === 'gk') {
      leftForearm = new THREE.Mesh(PLAYER_GLOVE_GEO, gkGlovesMat);
      rightForearm = new THREE.Mesh(PLAYER_GLOVE_GEO, gkGlovesMat);
    } else {
      leftForearm = new THREE.Mesh(PLAYER_LOWER_ARM_GEO, skinMat);
      rightForearm = new THREE.Mesh(PLAYER_LOWER_ARM_GEO, skinMat);
    }

    leftForearm.position.y = -0.42;
    leftForearm.castShadow = true;
    leftArmGroup.add(leftForearm);

    group.add(leftArmGroup);

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.38, 1.35, 0); // Shoulder pivot

    // Right Upper Sleeve
    const rightSleeve = new THREE.Mesh(PLAYER_UPPER_ARM_GEO, sideJerseyMat);
    rightSleeve.position.y = -0.14;
    rightSleeve.castShadow = true;
    rightArmGroup.add(rightSleeve);

    // Right Sleeve Dark Trim
    const rightSleeveTrim = new THREE.Mesh(PLAYER_SLEEVE_TRIM_GEO, collarMat);
    rightSleeveTrim.position.y = -0.27;
    rightArmGroup.add(rightSleeveTrim);

    rightForearm.position.y = -0.42;
    rightForearm.castShadow = true;
    rightArmGroup.add(rightForearm);

    group.add(rightArmGroup);

    // -------------------------------------------------------------
    // POSES
    // -------------------------------------------------------------
    if (options.pose === 'wall') {
      leftArmGroup.rotation.x = Math.PI * 0.35;
      rightArmGroup.rotation.x = Math.PI * 0.35;
    } else if (options.pose === 'gk') {
      leftArmGroup.rotation.set(-0.55, 0.20, -0.35);
      rightArmGroup.rotation.set(-0.55, -0.20, 0.35);
      leftLegGroup.rotation.set(0, 0, 0);
      rightLegGroup.rotation.set(0, 0, 0);
    }

    const nowInit = performance.now();
    group.userData = {
      isPlayerFigure: true,
      teamRole: options.teamRole || 'attacker',
      defaultPose: options.pose || 'kicker',
      headGroup,
      faceGroup,
      leftEyeWhite,
      rightEyeWhite,
      leftPupil,
      rightPupil,
      leftEyebrow,
      rightEyebrow,
      mouth,
      leftArmGroup,
      rightArmGroup,
      leftLegGroup,
      rightLegGroup,
      facialState: {
        nextBlinkTime: nowInit + 500 + Math.random() * 4500,
        isBlinking: false,
        blinkStartTime: 0,
        blinkDuration: 130 + Math.random() * 50,
        isDoubleBlink: false,
        doubleBlinkStage: 0,

        nextHeadMoveTime: nowInit + 1000 + Math.random() * 5000,
        targetHeadRotX: 0,
        targetHeadRotY: 0,
        targetHeadRotZ: 0,
        currentHeadRotX: 0,
        currentHeadRotY: 0,
        currentHeadRotZ: 0,

        nextGazeTime: nowInit + 1500 + Math.random() * 5500,
        targetPupilX: 0,
        targetPupilY: 0,
        currentPupilX: 0,
        currentPupilY: 0,

        baseLeftPupilX: -0.08,
        baseRightPupilX: 0.08,
        basePupilY: 0.05,
      }
    };

    return group;
  };

  // Synchronize pitch texture when equippedPitchId changes in Store
  useEffect(() => {
    if (pitchMeshRef.current && rendererRef.current) {
      const newTex = createPitchTexture(rendererRef.current.capabilities.getMaxAnisotropy(), equippedPitchId);
      if (pitchMeshRef.current.material instanceof THREE.MeshStandardMaterial) {
        pitchMeshRef.current.material.map = newTex;
        pitchMeshRef.current.material.needsUpdate = true;
      }
    }
  }, [equippedPitchId]);

  // Synchronize ball texture when equippedBallId changes in Store
  useEffect(() => {
    if (ballMeshRef.current) {
      const newTex = createSoccerBallTexture(equippedBallId);
      if (ballMeshRef.current.material instanceof THREE.MeshStandardMaterial) {
        ballMeshRef.current.material.map = newTex;
        ballMeshRef.current.material.needsUpdate = true;
      }
    }
  }, [equippedBallId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Bright Daytime Sky
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#38bdf8'); // Clear Sky Blue
    scene.fog = null; // Clear weather (No fog)

    // 2. Camera (Adaptive FOV: tight ~35° horizontal focus on landscape/desktop; original 50° FOV on mobile/tablet)
    const initAspect = container.clientWidth / Math.max(1, container.clientHeight);
    const initFov = getAdaptiveCameraFov(initAspect);
    const camera = new THREE.PerspectiveCamera(
      initFov,
      initAspect,
      0.1,
      1000
    );
    cameraRef.current = camera;
    
    // Camera will be dynamically positioned behind kicker in section 10

    // High-Definition Crisp Pixel Ratio Optimized for High-Res Displays (Ultra-Smooth 60 FPS on all screens)
    const getTargetPixelRatio = () => {
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const width = container ? container.clientWidth || window.innerWidth : 1200;
      // High-resolution big screen optimization:
      // On 1080p, 1440p, and 4K displays, capping to 1.0 (or max 1.15 on 1080p) eliminates fillrate choke while preserving 100% native HD sharpness
      if (width >= 1440) return Math.min(dpr, 1.0);
      if (width >= 1024) return Math.min(dpr, 1.0);
      if (width >= 768) return Math.min(dpr, 1.25);
      return Math.min(dpr, 1.5);
    };

    // 3. Renderer (High Fidelity ACES Filmic Tone-Mapped WebGL)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(getTargetPixelRatio());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Ultra-smooth soft shadows
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22; // Perfect vibrant contrast
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. OrbitControls (User Orbit Disabled so game can be played peacefully)
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enabled = false; // Manual orbit controls disabled
    controls.enableRotate = false; // Prevent camera rotation drag
    controls.enablePan = false;    // Prevent camera panning
    controls.enableZoom = false;   // Prevent camera zooming
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01; // Restrict camera below pitch level
    controls.minDistance = 3;
    controls.maxDistance = 180;
    
    // Focus target initially on the Wall and Goal
    controls.target.set(0, 1.8, -42.0 + fkDistance * 0.4);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;

    // 5. Perfect Atmospheric & Stadium Lighting Suite (+60% Visual Fidelity)
    // Realistic Sky-to-Grass Environmental Bounce
    const hemiLight = new THREE.HemisphereLight('#bae6fd', '#166534', 0.85);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight('#ffffff', 0.45);
    scene.add(ambientLight);

    // Primary High-Definition Directional Sunlight with Smooth Soft Shadows
    // Tightened shadow frustum focused directly on playing pitch & goal for maximum shadow resolution and 0 lag
    const sunLight = new THREE.DirectionalLight('#fffdf5', 1.88);
    sunLight.position.set(38, 65, 28);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 12;
    sunLight.shadow.camera.far = 145;
    sunLight.shadow.camera.left = -34;
    sunLight.shadow.camera.right = 34;
    sunLight.shadow.camera.top = 38;
    sunLight.shadow.camera.bottom = -48;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.normalBias = 0.02;
    sunLight.shadow.radius = 1.8; // Soft shadow edge dispersion
    scene.add(sunLight);

    // Secondary Stadium Floodlight Fill Light (West Tower)
    const stadiumFloodLight = new THREE.DirectionalLight('#e0f2fe', 0.65);
    stadiumFloodLight.position.set(-42, 55, -28);
    scene.add(stadiumFloodLight);

    // Stadium Rim Backlight (Accentuates player silhouettes & goal crossbars)
    const rimBackLight = new THREE.DirectionalLight('#bfdbfe', 0.40);
    rimBackLight.position.set(0, 28, -55);
    scene.add(rimBackLight);

    // 6. Pitch Base with Ultra-Crisp Turf & Markings
    const pitchTexture = createPitchTexture(renderer.capabilities.getMaxAnisotropy(), equippedPitchId);
    const pitchGeo = new THREE.PlaneGeometry(64, 96);
    const pitchMat = new THREE.MeshStandardMaterial({
      map: pitchTexture,
      roughness: 0.85,
      metalness: 0.05,
    });
    const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.receiveShadow = true;
    pitchMesh.matrixAutoUpdate = false;
    pitchMesh.updateMatrix();
    pitchMeshRef.current = pitchMesh;
    scene.add(pitchMesh);

    // Surrounding Concrete apron
    const apronGeo = new THREE.PlaneGeometry(120, 160);
    const apronMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.95 });
    const apronMesh = new THREE.Mesh(apronGeo, apronMat);
    apronMesh.rotation.x = -Math.PI / 2;
    apronMesh.position.y = -0.05;
    apronMesh.matrixAutoUpdate = false;
    apronMesh.updateMatrix();
    scene.add(apronMesh);

    // =========================================================================
    // 7. STADIUM GRANDSTAND SEATING (Ultra-Fast Merged Buffer Geometries: 4 Draw Calls Total)
    // =========================================================================
    const standChair1Mat = new THREE.MeshStandardMaterial({ color: '#4b5563', roughness: 0.5 }); // Slate Grey Seats
    const standChair2Mat = new THREE.MeshStandardMaterial({ color: '#374151', roughness: 0.5 }); // Dark Charcoal Seats
    const standAccentMat = new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.5 }); // Deep Graphite Accent Seats
    const standConcreteMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.8 }); // Dark Concrete Tier Steps

    const concreteGeometries: THREE.BufferGeometry[] = [];
    const chair1Geometries: THREE.BufferGeometry[] = [];
    const chair2Geometries: THREE.BufferGeometry[] = [];
    const accentGeometries: THREE.BufferGeometry[] = [];

    const tempMat4 = new THREE.Matrix4();
    const tempPos = new THREE.Vector3();
    const tempEuler = new THREE.Euler();
    const tempQuat = new THREE.Quaternion();
    const tempScale = new THREE.Vector3(1, 1, 1);

    const addTransformedBox = (
      targetList: THREE.BufferGeometry[],
      w: number, h: number, d: number,
      px: number, py: number, pz: number,
      rotY: number
    ) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      tempPos.set(px, py, pz);
      tempEuler.set(0, rotY, 0);
      tempQuat.setFromEuler(tempEuler);
      tempMat4.compose(tempPos, tempQuat, tempScale);
      geo.applyMatrix4(tempMat4);
      targetList.push(geo);
    };

    const buildGrandstandGeos = (x: number, z: number, width: number, length: number, rotY: number) => {
      const tierCount = 10;
      const cosR = Math.cos(rotY);
      const sinR = Math.sin(rotY);

      for (let i = 0; i < tierCount; i++) {
        const stepHeight = (i + 1) * 1.08;
        const stepDepth = 3.2;
        const stepLocalZ = -length / 2 + (i + 0.5) * stepDepth;

        // Step Concrete
        const stepX = x + (-stepLocalZ * sinR);
        const stepZ = z + (stepLocalZ * cosR);
        addTransformedBox(concreteGeometries, width, stepHeight, stepDepth, stepX, stepHeight / 2, stepZ, rotY);

        // Seating Row
        const targetList = i % 4 === 0 ? accentGeometries : (i % 2 === 0 ? chair1Geometries : chair2Geometries);

        // Cushion
        const cushLocalZ = stepLocalZ - 0.1;
        const cushX = x + (-cushLocalZ * sinR);
        const cushZ = z + (cushLocalZ * cosR);
        addTransformedBox(targetList, width, 0.12, stepDepth * 0.5, cushX, stepHeight + 0.06, cushZ, rotY);

        // Backrest
        const backLocalZ = stepLocalZ + 0.12;
        const backX = x + (-backLocalZ * sinR);
        const backZ = z + (backLocalZ * cosR);
        addTransformedBox(targetList, width, 0.27, 0.12, backX, stepHeight + 0.22, backZ, rotY);
      }
    };

    const buildCornerGrandstandGeos = (cx: number, cz: number, startAngle: number, endAngle: number) => {
      const tierCount = 10;
      const numSegments = 8;

      for (let i = 0; i < tierCount; i++) {
        const stepHeight = (i + 1) * 1.08;
        const stepDepth = 3.2;
        const radius = (i + 0.5) * stepDepth;
        const targetList = i % 4 === 0 ? accentGeometries : (i % 2 === 0 ? chair1Geometries : chair2Geometries);

        for (let j = 0; j <= numSegments; j++) {
          const t = j / numSegments;
          const angle = startAngle + t * (endAngle - startAngle);
          const px = cx + radius * Math.cos(angle);
          const pz = cz + radius * Math.sin(angle);
          const rotY = -angle + Math.PI / 2;
          const arcWidth = (radius * Math.abs(endAngle - startAngle)) / numSegments + 0.15;

          // Step Concrete Base
          addTransformedBox(concreteGeometries, arcWidth, stepHeight, stepDepth * 0.95, px, stepHeight / 2, pz, rotY);

          // Seat Base Cushion
          addTransformedBox(targetList, arcWidth, 0.12, stepDepth * 0.45, px, stepHeight + 0.06, pz, rotY);

          // Seat Backrest
          const backX = px + 0.2 * Math.cos(angle);
          const backZ = pz + 0.2 * Math.sin(angle);
          addTransformedBox(targetList, arcWidth, 0.27, 0.12, backX, stepHeight + 0.22, backZ, rotY);
        }
      }
    };

    // Build straight & corner stand geometries
    buildGrandstandGeos(-54, 0, 104, 32, Math.PI / 2);
    buildGrandstandGeos(54, 0, 104, 32, -Math.PI / 2);
    buildGrandstandGeos(0, -68, 76, 32, Math.PI);
    buildGrandstandGeos(0, 68, 76, 32, 0);

    buildCornerGrandstandGeos(-38, -52, Math.PI, Math.PI * 1.5);
    buildCornerGrandstandGeos(38, -52, Math.PI * 1.5, Math.PI * 2.0);
    buildCornerGrandstandGeos(-38, 52, Math.PI * 0.5, Math.PI);
    buildCornerGrandstandGeos(38, 52, 0, Math.PI * 0.5);

    // Merge and add 4 high performance static meshes
    if (concreteGeometries.length > 0) {
      const mergedConcrete = mergeGeometries(concreteGeometries, false);
      const concreteMesh = new THREE.Mesh(mergedConcrete, standConcreteMat);
      concreteMesh.receiveShadow = true;
      concreteMesh.matrixAutoUpdate = false;
      concreteMesh.updateMatrix();
      scene.add(concreteMesh);
      grandstandMeshesRef.current.push(concreteMesh);
      concreteGeometries.forEach((g) => g.dispose());
    }

    if (chair1Geometries.length > 0) {
      const mergedChair1 = mergeGeometries(chair1Geometries, false);
      const chair1Mesh = new THREE.Mesh(mergedChair1, standChair1Mat);
      chair1Mesh.matrixAutoUpdate = false;
      chair1Mesh.updateMatrix();
      scene.add(chair1Mesh);
      grandstandMeshesRef.current.push(chair1Mesh);
      chair1Geometries.forEach((g) => g.dispose());
    }

    if (chair2Geometries.length > 0) {
      const mergedChair2 = mergeGeometries(chair2Geometries, false);
      const chair2Mesh = new THREE.Mesh(mergedChair2, standChair2Mat);
      chair2Mesh.matrixAutoUpdate = false;
      chair2Mesh.updateMatrix();
      scene.add(chair2Mesh);
      grandstandMeshesRef.current.push(chair2Mesh);
      chair2Geometries.forEach((g) => g.dispose());
    }

    if (accentGeometries.length > 0) {
      const mergedAccent = mergeGeometries(accentGeometries, false);
      const accentMesh = new THREE.Mesh(mergedAccent, standAccentMat);
      accentMesh.matrixAutoUpdate = false;
      accentMesh.updateMatrix();
      scene.add(accentMesh);
      grandstandMeshesRef.current.push(accentMesh);
      accentGeometries.forEach((g) => g.dispose());
    }

    // 8. 4 Corner Flagpoles with Flags
    const createCornerFlag = (xPos: number, zPos: number) => {
      const flagGroup = new THREE.Group();
      flagGroup.position.set(xPos, 0, zPos);

      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 12);
      const poleMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.3 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 0.9;
      pole.castShadow = true;
      flagGroup.add(pole);

      const flagGeo = new THREE.PlaneGeometry(0.55, 0.38);
      const flagMat = new THREE.MeshStandardMaterial({
        color: '#dc2626',
        side: THREE.DoubleSide,
        roughness: 0.5,
      });
      const flagMesh = new THREE.Mesh(flagGeo, flagMat);
      flagMesh.position.set(0.28, 1.6, 0);
      flagMesh.castShadow = true;
      flagGroup.add(flagMesh);

      scene.add(flagGroup);
    };

    createCornerFlag(-28, -42);
    createCornerFlag(28, -42);
    createCornerFlag(-28, 42);
    createCornerFlag(28, 42);

    // 9. HIGH-QUALITY REALISTIC GOAL POSTS (North & South)
    const createGoalPost = (zPos: number, rotY: number) => {
      const goalGroup = new THREE.Group();
      goalGroup.position.set(0, 0, zPos);
      goalGroup.rotation.y = rotY;

      const postMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.1,
        metalness: 0.3,
      });

      const frameMat = new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.4,
        metalness: 0.8,
      });

      const postRadius = 0.154; // Increased 10% from 0.14
      const goalWidth = 8.05;   // Increased 10% from 7.32
      const goalHeight = 2.68;  // Increased 10% from 2.44
      const goalDepth = 3.60;   // Deep goal frame (3.60m depth)

      const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, goalHeight, 20);

      const leftPost = new THREE.Mesh(postGeo, postMat);
      leftPost.position.set(-goalWidth / 2, goalHeight / 2, 0);
      leftPost.castShadow = true;
      goalGroup.add(leftPost);

      const rightPost = new THREE.Mesh(postGeo, postMat);
      rightPost.position.set(goalWidth / 2, goalHeight / 2, 0);
      rightPost.castShadow = true;
      goalGroup.add(rightPost);

      const crossbarGeo = new THREE.CylinderGeometry(postRadius, postRadius, goalWidth, 20);
      const crossbar = new THREE.Mesh(crossbarGeo, postMat);
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(0, goalHeight, 0);
      crossbar.castShadow = true;
      goalGroup.add(crossbar);

      const elbowGeo = new THREE.SphereGeometry(postRadius * 1.02, 16, 16);
      const leftElbow = new THREE.Mesh(elbowGeo, postMat);
      leftElbow.position.set(-goalWidth / 2, goalHeight, 0);
      goalGroup.add(leftElbow);

      const rightElbow = new THREE.Mesh(elbowGeo, postMat);
      rightElbow.position.set(goalWidth / 2, goalHeight, 0);
      goalGroup.add(rightElbow);

      const rearGroundBarGeo = new THREE.CylinderGeometry(0.08, 0.08, goalWidth, 12);
      const rearGroundBar = new THREE.Mesh(rearGroundBarGeo, frameMat);
      rearGroundBar.rotation.z = Math.PI / 2;
      rearGroundBar.position.set(0, 0.08, -goalDepth);
      goalGroup.add(rearGroundBar);

      const sideGroundBarGeo = new THREE.CylinderGeometry(0.08, 0.08, goalDepth, 12);
      const leftSideBar = new THREE.Mesh(sideGroundBarGeo, frameMat);
      leftSideBar.rotation.x = Math.PI / 2;
      leftSideBar.position.set(-goalWidth / 2, 0.08, -goalDepth / 2);
      goalGroup.add(leftSideBar);

      const rightSideBar = new THREE.Mesh(sideGroundBarGeo, frameMat);
      rightSideBar.rotation.x = Math.PI / 2;
      rightSideBar.position.set(goalWidth / 2, 0.08, -goalDepth / 2);
      goalGroup.add(rightSideBar);

      const stanchionLen = Math.sqrt(goalHeight * goalHeight + goalDepth * goalDepth);
      const stanchionGeo = new THREE.CylinderGeometry(0.06, 0.06, stanchionLen, 12);

      const leftStanchion = new THREE.Mesh(stanchionGeo, frameMat);
      leftStanchion.position.set(-goalWidth / 2, goalHeight / 2, -goalDepth / 2);
      leftStanchion.rotation.x = Math.atan2(goalDepth, goalHeight);
      goalGroup.add(leftStanchion);

      const rightStanchion = new THREE.Mesh(stanchionGeo, frameMat);
      rightStanchion.position.set(goalWidth / 2, goalHeight / 2, -goalDepth / 2);
      rightStanchion.rotation.x = Math.atan2(goalDepth, goalHeight);
      goalGroup.add(rightStanchion);

      const pegGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.25, 12);
      const leftPeg = new THREE.Mesh(pegGeo, frameMat);
      leftPeg.position.set(-goalWidth / 2, 0.12, 0);
      goalGroup.add(leftPeg);

      const rightPeg = new THREE.Mesh(pegGeo, frameMat);
      rightPeg.position.set(goalWidth / 2, 0.12, 0);
      goalGroup.add(rightPeg);

      const netCanvas = document.createElement('canvas');
      netCanvas.width = 256;
      netCanvas.height = 256;
      const nCtx = netCanvas.getContext('2d');
      if (nCtx) {
        nCtx.fillStyle = 'rgba(0,0,0,0)';
        nCtx.fillRect(0, 0, 256, 256);
        nCtx.strokeStyle = '#ffffff';
        nCtx.lineWidth = 3;
        nCtx.shadowColor = 'rgba(0,0,0,0.3)';
        nCtx.shadowBlur = 2;

        const step = 16;
        for (let x = 0; x <= 256; x += step) {
          nCtx.beginPath();
          nCtx.moveTo(x, 0);
          nCtx.lineTo(x, 256);
          nCtx.stroke();
        }
        for (let y = 0; y <= 256; y += step) {
          nCtx.beginPath();
          nCtx.moveTo(0, y);
          nCtx.lineTo(256, y);
          nCtx.stroke();
        }
      }
      const netTexture = new THREE.CanvasTexture(netCanvas);
      netTexture.wrapS = THREE.RepeatWrapping;
      netTexture.wrapT = THREE.RepeatWrapping;
      netTexture.repeat.set(16, 12);

      const netMat = new THREE.MeshBasicMaterial({
        map: netTexture,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      });

      const backNet = new THREE.Mesh(new THREE.PlaneGeometry(goalWidth, goalHeight), netMat);
      backNet.position.set(0, goalHeight / 2, -goalDepth);
      goalGroup.add(backNet);
      netMeshesRef.current.push(backNet);

      const roofNet = new THREE.Mesh(new THREE.PlaneGeometry(goalWidth, goalDepth), netMat);
      roofNet.rotation.x = Math.PI / 2;
      roofNet.position.set(0, goalHeight, -goalDepth / 2);
      goalGroup.add(roofNet);
      netMeshesRef.current.push(roofNet);

      const sideNetGeo = new THREE.PlaneGeometry(goalDepth, goalHeight);
      const leftSideNet = new THREE.Mesh(sideNetGeo, netMat);
      leftSideNet.rotation.y = Math.PI / 2;
      leftSideNet.position.set(-goalWidth / 2, goalHeight / 2, -goalDepth / 2);
      goalGroup.add(leftSideNet);
      netMeshesRef.current.push(leftSideNet);

      const rightSideNet = new THREE.Mesh(sideNetGeo, netMat);
      rightSideNet.rotation.y = -Math.PI / 2;
      rightSideNet.position.set(goalWidth / 2, goalHeight / 2, -goalDepth / 2);
      goalGroup.add(rightSideNet);
      netMeshesRef.current.push(rightSideNet);

      scene.add(goalGroup);
      if (zPos === -42.0) {
        goalGroupRef.current = goalGroup;
      }
    };

    createGoalPost(-42.0, 0);
    createGoalPost(42.0, Math.PI);

    // =========================================================================
    // 10. HIGH-PERFORMANCE STADIUM FANS (Blocky Body & Head, Dark Aqua, Scattered to All Seats & Tiers)
    // Omitted in practice match modes (empty stadium / private practice session)
    // =========================================================================
    const createdFans: StadiumFan[] = [];

    if (!isPracticeModeRef.current) {
      // Deterministic pseudo-random generator for clean, reproducible organic crowd scattering
      let fanRngSeed = 42;
      const fanRng = () => {
        fanRngSeed = (fanRngSeed * 9301 + 49297) % 233280;
        return fanRngSeed / 233280;
      };

      const fanDefinitions: Array<{
        stand: 'north' | 'west' | 'east' | 'south' | 'corner_nw' | 'corner_ne' | 'corner_sw' | 'corner_se';
        tier: number;
        offset: number;
        depthJitter: number;
        angleJitter: number;
      }> = [];

      // 1. NORTH STAND (Scattered across all 10 tiers 0-9 behind North goal: 62 fans)
      for (let i = 0; i < 62; i++) {
        const tier = Math.floor(fanRng() * 10);
        const offset = -34.0 + fanRng() * 68.0;
        const depthJitter = (fanRng() - 0.5) * 0.7;
        const angleJitter = (fanRng() - 0.5) * 0.35;
        fanDefinitions.push({ stand: 'north', tier, offset, depthJitter, angleJitter });
      }

      // 2. SOUTH STAND (Scattered across all 10 tiers 0-9 behind South goal: 58 fans)
      for (let i = 0; i < 58; i++) {
        const tier = Math.floor(fanRng() * 10);
        const offset = -34.0 + fanRng() * 68.0;
        const depthJitter = (fanRng() - 0.5) * 0.7;
        const angleJitter = (fanRng() - 0.5) * 0.35;
        fanDefinitions.push({ stand: 'south', tier, offset, depthJitter, angleJitter });
      }

      // 3. WEST STAND (Scattered across all 10 tiers 0-9 along left touchline: 67 fans)
      for (let i = 0; i < 67; i++) {
        const tier = Math.floor(fanRng() * 10);
        const offset = -46.0 + fanRng() * 92.0;
        const depthJitter = (fanRng() - 0.5) * 0.7;
        const angleJitter = (fanRng() - 0.5) * 0.35;
        fanDefinitions.push({ stand: 'west', tier, offset, depthJitter, angleJitter });
      }

      // 4. EAST STAND (Scattered across all 10 tiers 0-9 along right touchline: 68 fans)
      for (let i = 0; i < 68; i++) {
        const tier = Math.floor(fanRng() * 10);
        const offset = -46.0 + fanRng() * 92.0;
        const depthJitter = (fanRng() - 0.5) * 0.7;
        const angleJitter = (fanRng() - 0.5) * 0.35;
        fanDefinitions.push({ stand: 'east', tier, offset, depthJitter, angleJitter });
      }

      // 5. NW CORNER (Curved section between North & West stands, tiers 0-9)
      for (let i = 0; i < 12; i++) {
        const tier = Math.floor(fanRng() * 10);
        const offset = Math.PI * (1.05 + fanRng() * 0.4);
        fanDefinitions.push({ stand: 'corner_nw', tier, offset, depthJitter: (fanRng() - 0.5) * 0.5, angleJitter: (fanRng() - 0.5) * 0.25 });
      }

      // 6. NE CORNER (Curved section between North & East stands, tiers 0-9)
      for (let i = 0; i < 12; i++) {
        const tier = Math.floor(fanRng() * 10);
        const offset = Math.PI * (1.55 + fanRng() * 0.4);
        fanDefinitions.push({ stand: 'corner_ne', tier, offset, depthJitter: (fanRng() - 0.5) * 0.5, angleJitter: (fanRng() - 0.5) * 0.25 });
      }

      // 7. SW CORNER (Curved section between South & West stands, tiers 0-9)
      for (let i = 0; i < 12; i++) {
        const tier = Math.floor(fanRng() * 10);
        const offset = Math.PI * (0.55 + fanRng() * 0.4);
        fanDefinitions.push({ stand: 'corner_sw', tier, offset, depthJitter: (fanRng() - 0.5) * 0.5, angleJitter: (fanRng() - 0.5) * 0.25 });
      }

      // 8. SE CORNER (Curved section between South & East stands, tiers 0-9)
      for (let i = 0; i < 12; i++) {
        const tier = Math.floor(fanRng() * 10);
        const offset = Math.PI * (0.05 + fanRng() * 0.4);
        fanDefinitions.push({ stand: 'corner_se', tier, offset, depthJitter: (fanRng() - 0.5) * 0.5, angleJitter: (fanRng() - 0.5) * 0.25 });
      }

      const fanCount = fanDefinitions.length;
      const fanBodyInstanced = new THREE.InstancedMesh(FAN_BODY_GEO, FAN_UNIFIED_MAT, fanCount);
      const fanHeadInstanced = new THREE.InstancedMesh(FAN_HEAD_GEO, FAN_UNIFIED_MAT, fanCount);
      fanBodyInstanced.castShadow = false;
      fanHeadInstanced.castShadow = false;
      fanBodyInstanced.matrixAutoUpdate = false;
      fanHeadInstanced.matrixAutoUpdate = false;

      const m4Body = new THREE.Matrix4();
      const m4Head = new THREE.Matrix4();
      const posBody = new THREE.Vector3();
      const posHead = new THREE.Vector3();
      const qFan = new THREE.Quaternion();
      const eulerFan = new THREE.Euler();
      const scale1 = new THREE.Vector3(1, 1, 1);

      fanDefinitions.forEach((def, index) => {
        const stepHeight = (def.tier + 1) * 1.08;
        const stepDepth = 3.2;
        const stepZ = -16.0 + (def.tier + 0.5) * stepDepth - 0.1 + (def.depthJitter || 0);

        let worldX = 0;
        let worldY = stepHeight + 0.05;
        let worldZ = 0;
        let fanRotY = 0;

        if (def.stand === 'north') {
          worldX = -def.offset;
          worldZ = -68.0 - stepZ;
        } else if (def.stand === 'south') {
          worldX = def.offset;
          worldZ = 68.0 + stepZ;
        } else if (def.stand === 'west') {
          worldX = -54.0 - stepZ;
          worldZ = def.offset;
        } else if (def.stand === 'east') {
          worldX = 54.0 + stepZ;
          worldZ = -def.offset;
        } else if (def.stand === 'corner_nw') {
          const radius = (def.tier + 0.5) * stepDepth + (def.depthJitter || 0);
          worldX = -38.0 + radius * Math.cos(def.offset);
          worldZ = -52.0 + radius * Math.sin(def.offset);
        } else if (def.stand === 'corner_ne') {
          const radius = (def.tier + 0.5) * stepDepth + (def.depthJitter || 0);
          worldX = 38.0 + radius * Math.cos(def.offset);
          worldZ = -52.0 + radius * Math.sin(def.offset);
        } else if (def.stand === 'corner_sw') {
          const radius = (def.tier + 0.5) * stepDepth + (def.depthJitter || 0);
          worldX = -38.0 + radius * Math.cos(def.offset);
          worldZ = 52.0 + radius * Math.sin(def.offset);
        } else if (def.stand === 'corner_se') {
          const radius = (def.tier + 0.5) * stepDepth + (def.depthJitter || 0);
          worldX = 38.0 + radius * Math.cos(def.offset);
          worldZ = 52.0 + radius * Math.sin(def.offset);
        }

        // Every fan accurately faces toward the pitch center (0, 0, 0)
        fanRotY = Math.atan2(-worldX, -worldZ) + def.angleJitter;

        eulerFan.set(0, fanRotY, 0);
        qFan.setFromEuler(eulerFan);

        posBody.set(worldX, worldY + 0.30, worldZ);
        m4Body.compose(posBody, qFan, scale1);
        fanBodyInstanced.setMatrixAt(index, m4Body);

        posHead.set(worldX, worldY + 0.76, worldZ);
        m4Head.compose(posHead, qFan, scale1);
        fanHeadInstanced.setMatrixAt(index, m4Head);
      });

      fanBodyInstanced.instanceMatrix.needsUpdate = true;
      fanHeadInstanced.instanceMatrix.needsUpdate = true;
      scene.add(fanBodyInstanced);
      scene.add(fanHeadInstanced);
      grandstandMeshesRef.current.push(fanBodyInstanced, fanHeadInstanced);
    }

    fansListRef.current = [];

    // Dynamic Free Kick Group (persists across scenario resets)
    const freeKickGroup = new THREE.Group();
    scene.add(freeKickGroup);
    freeKickGroupRef.current = freeKickGroup;

    sceneRef.current = scene;

    // 11. Lightweight Animation Loop
    let animFrameId: number;
    let lastTime = performance.now();
    let lastReplayUiUpdate = 0;

    const animate = () => {
      const now = performance.now();
      const dt = Math.min(0.033, (now - lastTime) / 1000.0);
      lastTime = now;

      if (!isPausedRef.current) {
        if (isReplayActiveRef.current) {
          const clip = activeReplayClipRef.current;
          if (clip && clip.length > 1) {
            if (!isReplayPausedRef.current) {
              replayPlayheadTimeRef.current += dt * 1000 * replaySpeedRef.current;
              // Throttle React state update to avoid heavy 60fps component re-renders
              if (now - lastReplayUiUpdate > 80) {
                lastReplayUiUpdate = now;
                setReplayPlayheadTime(replayPlayheadTimeRef.current);
              }
            }

            const curTime = replayPlayheadTimeRef.current;
            const totalDuration = replayDurationRef.current;

            // Frame search
            let idx = 0;
            while (idx < clip.length - 1 && clip[idx + 1].time <= curTime) {
              idx++;
            }
            const f0 = clip[idx];
            const f1 = clip[Math.min(idx + 1, clip.length - 1)];
            const span = f1.time - f0.time;
            const alpha = span > 0 ? THREE.MathUtils.clamp((curTime - f0.time) / span, 0, 1) : 0;

            // 1. Ball mesh
            if (ballMeshRef.current && f0.ball && f1.ball) {
              const lerp = THREE.MathUtils.lerp;
              ballMeshRef.current.position.set(
                lerp(f0.ball.pos[0], f1.ball.pos[0], alpha),
                lerp(f0.ball.pos[1], f1.ball.pos[1], alpha),
                lerp(f0.ball.pos[2], f1.ball.pos[2], alpha)
              );
              ballMeshRef.current.rotation.set(
                lerp(f0.ball.rot[0], f1.ball.rot[0], alpha),
                lerp(f0.ball.rot[1], f1.ball.rot[1], alpha),
                lerp(f0.ball.rot[2], f1.ball.rot[2], alpha)
              );
            }

            // 2. Kicker
            if (kickerGroupRef.current && f0.kicker && f1.kicker) {
              applyPlayerSnapshot(kickerGroupRef.current, f0.kicker, f1.kicker, alpha);
            }

            // 3. Goalkeeper
            if (gkGroupRef.current && f0.gk && f1.gk) {
              applyPlayerSnapshot(gkGroupRef.current, f0.gk, f1.gk, alpha);
            }

            // 4. Wall Defenders
            for (let i = 0; i < wallDefendersRef.current.length; i++) {
              const p = wallDefendersRef.current[i];
              if (f0.wall && f1.wall && f0.wall[i] && f1.wall[i]) {
                applyPlayerSnapshot(p, f0.wall[i], f1.wall[i], alpha);
              }
            }

            // 5. Box Players
            for (let i = 0; i < boxPlayersRef.current.length; i++) {
              const p = boxPlayersRef.current[i];
              if (f0.boxPlayers && f1.boxPlayers && f0.boxPlayers[i] && f1.boxPlayers[i]) {
                applyPlayerSnapshot(p, f0.boxPlayers[i], f1.boxPlayers[i], alpha);
              }
            }

            // 6. Goal Post Vibration
            if (goalGroupRef.current && f0.goalVibePos && f1.goalVibePos) {
              goalGroupRef.current.position.set(
                THREE.MathUtils.lerp(f0.goalVibePos[0], f1.goalVibePos[0], alpha),
                THREE.MathUtils.lerp(f0.goalVibePos[1], f1.goalVibePos[1], alpha),
                THREE.MathUtils.lerp(f0.goalVibePos[2], f1.goalVibePos[2], alpha)
              );
            }

            // Camera target and dynamic view tracking across replay scenes if user has not manually orbited
            if (!userInteractedWithReplayCamRef.current && cameraRef.current && controlsRef.current) {
              if (replayCamAngleRef.current === 'ball_tracking') {
                // 1. FIRST CAMERA VIEW: Follow and track the ball putting the ball on the center of the viewport across all screen sizes
                const ballPos = ballMeshRef.current ? ballMeshRef.current.position : _scratchV3_1.set(0, 0, -36.0);
                const origSpotX = activeReplayClipRef.current[0]?.ball?.pos[0] ?? fkXOffset;
                const origSpotZ = activeReplayClipRef.current[0]?.ball?.pos[2] ?? (-42.0 + fkDistance);

                // Strictly center target on the 3D ball
                controlsRef.current.target.copy(ballPos);

                const aspect = cameraRef.current.aspect || 1.0;
                const distScale = aspect < 1.0 ? 1.25 : 1.0;

                const camX = THREE.MathUtils.lerp(origSpotX * 0.30, ballPos.x * 0.40, 0.45);
                const camY = Math.max(3.6, ballPos.y + 2.2 * distScale);
                const camZ = THREE.MathUtils.lerp(origSpotZ + 7.5 * distScale, ballPos.z + 8.5 * distScale, 0.50);
                cameraRef.current.position.set(camX, camY, camZ);
              } else if (replayCamAngleRef.current === 'behind_goal') {
                // 2. SECOND REPLAY CAMERA: Elevated behind-the-goal TV broadcast view that dynamically tracks the ball
                const ballPos = ballMeshRef.current ? ballMeshRef.current.position : _scratchV3_1.set(0, 0.3, -36.0);
                const origSpotX = activeReplayClipRef.current[0]?.ball?.pos[0] ?? fkXOffset;

                // Dynamically track the ball's position throughout the entire flight path
                controlsRef.current.target.set(ballPos.x, Math.max(0.35, ballPos.y), ballPos.z);

                // Smoothly position the camera behind the goal, panning slightly to follow ball trajectory
                const aspect = cameraRef.current.aspect || 1.0;
                const distScale = aspect < 1.0 ? 1.15 : 1.0;
                const camX = THREE.MathUtils.lerp(origSpotX * 0.12, ballPos.x * 0.28, 0.35);
                const camY = Math.max(5.6, 6.8 + (ballPos.y - 1.2) * 0.35) * distScale;
                const camZ = -53.5;
                cameraRef.current.position.set(camX, camY, camZ);
              }
            }
            controls.update();

            // Auto-advance Replay 1 (Ball Tracking) -> Replay 2 (Behind Goal) -> Complete
            if (!isReplayPausedRef.current && curTime >= totalDuration + 400) {
              if (replayIndexRef.current === 1) {
                // Advance to Replay 2 (Behind Goal Cam)
                replayIndexRef.current = 2;
                setReplayIndex(2);
                switchReplayAngle('behind_goal');
                replayPlayheadTimeRef.current = 0;
                setReplayPlayheadTime(0);
              } else if (isSavedReplayModeRef.current) {
                // Loop back to Replay 1 for continuous highlight loop in saved replay viewer
                replayIndexRef.current = 1;
                setReplayIndex(1);
                switchReplayAngle('ball_tracking');
                replayPlayheadTimeRef.current = 0;
                setReplayPlayheadTime(0);
              } else {
                // Both Replays complete - advance to next turn/kick
                stopReplayAndAdvance();
              }
            }
          }

          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
          animFrameId = requestAnimationFrame(animate);
          return;
        }

        // Live Replay Frame Recorder (Captures the complete run-up, ball strike, flight, and net reaction at 30 FPS for silky-smooth performance)
        if (!isReplayActiveRef.current && (shotPhaseRef.current === 'running' || shotPhaseRef.current === 'kicking' || shotPhaseRef.current === 'flying' || shotPhaseRef.current === 'hit_post' || (shotPhaseRef.current === 'finished' && now - shotFinishedTimeRef.current < 1600))) {
          if ((runStartTimeRef.current > 0 || flightStartTimeRef.current > 0) && now - lastReplayRecordTimeRef.current >= 32) {
            lastReplayRecordTimeRef.current = now;
            const startTime = runStartTimeRef.current > 0 ? runStartTimeRef.current : flightStartTimeRef.current;
            const frameTime = Math.max(0, now - startTime);

            if (ballMeshRef.current && kickerGroupRef.current && gkGroupRef.current) {
              const frame: ReplayFrame = {
                time: frameTime,
                ball: {
                  pos: [ballMeshRef.current.position.x, ballMeshRef.current.position.y, ballMeshRef.current.position.z],
                  rot: [ballMeshRef.current.rotation.x, ballMeshRef.current.rotation.y, ballMeshRef.current.rotation.z],
                },
                kicker: snapshotPlayer(kickerGroupRef.current),
                gk: snapshotPlayer(gkGroupRef.current),
                wall: wallDefendersRef.current.map((w) => snapshotPlayer(w)),
                boxPlayers: boxPlayersRef.current.map((b) => snapshotPlayer(b)),
                goalVibePos: goalGroupRef.current ? [goalGroupRef.current.position.x, goalGroupRef.current.position.y, goalGroupRef.current.position.z] : undefined,
              };
              if (recordedReplayFramesRef.current.length >= 180) {
                recordedReplayFramesRef.current.shift();
              }
              recordedReplayFramesRef.current.push(frame);
            }
          }
        }

        if (isTransitioningCamRef.current && cameraRef.current && controlsRef.current) {
          const transElapsed = now - transitionStartTimeRef.current;
          const transDuration = camTransitionDurationRef.current || 650;
          const p = Math.min(1.0, transElapsed / transDuration);
          const easeP = 1 - Math.pow(1 - p, 3); // Smooth cubic ease out

          cameraRef.current.position.lerpVectors(startCamPosRef.current, targetCamPosRef.current, easeP);
          controlsRef.current.target.lerpVectors(startCamLookAtRef.current, targetCamLookAtRef.current, easeP);
          if (startCamFovRef.current && targetCamFovRef.current && Math.abs(startCamFovRef.current - targetCamFovRef.current) > 0.05) {
            cameraRef.current.fov = THREE.MathUtils.lerp(startCamFovRef.current, targetCamFovRef.current, easeP);
            cameraRef.current.updateProjectionMatrix();
          }
          controlsRef.current.update();

          if (p >= 1.0) {
            isTransitioningCamRef.current = false;
          }
        } else {
          controls.update();
        }

        let hasBallPos = false;
        if (ballMeshRef.current) {
          ballMeshRef.current.getWorldPosition(_scratchV3_3);
          hasBallPos = true;
        }
        const isBallActive = shotPhaseRef.current === 'flying' || shotPhaseRef.current === 'hit_post' || shotPhaseRef.current === 'goal' || shotPhaseRef.current === 'saved' || shotPhaseRef.current === 'blocked';

        // Update facial expressions, blinking & dynamic ball tracking for all players directly (no traversal)
        const activePlayers = activePlayersListRef.current;
        for (let i = 0; i < activePlayers.length; i++) {
          const player = activePlayers[i];
          if (player && player.userData && player.userData.facialState) {
            updatePlayerFacialExpressions(player, now, dt, hasBallPos ? _scratchV3_3 : null, isBallActive);
          }
        }

      // Animate player kick / deflection leg swing on contact
      if (kickingPlayerAnimRef.current) {
        const { player, startTime, duration } = kickingPlayerAnimRef.current;
        const elapsed = now - startTime;
        const p = Math.min(1.0, elapsed / duration);
        const leg = player.userData?.rightLegGroup || player.userData?.leftLegGroup;
        if (leg) {
          if (p < 0.35) {
            const sub = p / 0.35;
            leg.rotation.x = (Math.PI / 2.2) * sub;
          } else {
            const sub = (p - 0.35) / 0.65;
            leg.rotation.x = (Math.PI / 2.2) * (1 - sub);
          }
        }
        if (p >= 1.0) {
          if (leg) leg.rotation.x = 0;
          kickingPlayerAnimRef.current = null;
        }
      }

      const kicker = kickerGroupRef.current;
      const ball = ballMeshRef.current;
      const gk = gkGroupRef.current;

      // =========================================================================
      // REALISTIC GOALKEEPER MOVEMENT & PHYSICS SIMULATOR
      // Walking on ground, jumping with real gravity (9.81m/s²), turf friction, dives & saves
      // =========================================================================
      if (gk) {
        const gkPhys = gkPhysicsRef.current;
        const gkUd = gk.userData;
        const gkLeftArm = gkUd.leftArmGroup;
        const gkRightArm = gkUd.rightArmGroup;
        const gkLeftLeg = gkUd.leftLegGroup;
        const gkRightLeg = gkUd.rightLegGroup;
        const gkHead = gkUd.headGroup;

        const currentPhase = shotPhaseRef.current;
        const isGoalScoredNow = shotOutcomeRef.current === 'GOAL' || isGoalScoredRef.current;

        if (currentPhase === 'idle' || currentPhase === 'running' || currentPhase === 'kicking') {
          // --- 1. PRE-SHOT: CLEAN, SOLID READY STANCE ON GOAL LINE ---
          // Firm realistic stance at gkReadyXRef.current (opposite side of wall or center) - perfectly upright
          gkPhys.state = 'ready';
          gkPhys.pos.set(gkReadyXRef.current, 0, -42.0);
          gkPhys.vel.set(0, 0, 0);
          gkPhys.rotZ = 0;
          gkPhys.rotX = 0;
          gkPhys.walkCycle = 0;
          gkPhys.walkSpeed = 0;
          gkPhys.hasReacted = false;
          gkPhys.actionType = 'stay';

          // Fixed goal line orientation facing directly out towards the pitch / ball
          const targetBall = fkBallPosRef.current || new THREE.Vector3(0, 0.3015, 0);
          const dirToBall = targetBall.clone().sub(gkPhys.pos);
          const angleToBall = Math.atan2(dirToBall.x, dirToBall.z);
          gkPhys.baseRotY = angleToBall;
          gkPhys.rotY = angleToBall;

          // Stable feet on grass and ready gloves - straight standing posture
          if (gkLeftLeg) gkLeftLeg.rotation.set(0, 0, 0);
          if (gkRightLeg) gkRightLeg.rotation.set(0, 0, 0);
          if (gkLeftArm) gkLeftArm.rotation.set(-0.55, 0.20, -0.35);
          if (gkRightArm) gkRightArm.rotation.set(-0.55, -0.20, 0.35);
          if (gkHead) gkHead.rotation.set(0, 0, 0);
        } else if (currentPhase === 'flying') {
          // --- 2. ACTIVE FLIGHT: REALISTIC GOALKEEPER REACTION, AGILITY & FLAWED SIMULATION ---
          const bPos = ballPosRef.current;
          const bVel = ballVelRef.current;
          const flightElapsed = (now - flightStartTimeRef.current) / 1000.0;

          // Time for ball to reach goal line z = -42.0
          let tCross = 0.45;
          if (bVel.z < -0.2) {
            tCross = Math.max(0.01, (-42.0 - bPos.z) / bVel.z);
          } else if (bPos.z < -38.0) {
            tCross = Math.max(0.01, (-42.0 - bPos.z) / -18.0);
          }

          // Human Reaction Delay: During initial reaction window, GK tracks ball visually with stance before exploding laterally
          const hasReactedToStrike = flightElapsed >= gkPhys.reactionDelay;

          // Calculate Curve-Aware Trajectory Prediction with realistic optical perception & curve deception:
          // Early in flight, lateral swerve is visually masked by perspective, so keeper tracks heading vector.
          // As the ball gets closer, the bending arc reveals itself and the keeper adjusts.
          const curveX = curveAccelVecRef.current ? curveAccelVecRef.current.x : 0;
          const curvePerceptionProgress = Math.min(1.0, Math.max(0.10, (flightElapsed - 0.22) / 0.48));
          let effectiveCurveX = curveX * curvePerceptionProgress;

          if (gkPhys.flawType === 'deceived_by_curve') {
            // Deceived by curve: for the first ~0.52s of flight, keeper misreads the lateral bend (anticipates straight line or reverse curl)
            if (flightElapsed < 0.52 && bPos.z > -32.0) {
              effectiveCurveX = -curveX * 0.75;
            } else {
              effectiveCurveX = curveX * curvePerceptionProgress;
            }
          } else if (gkPhys.misjudgedCurve && flightElapsed < 0.44) {
            effectiveCurveX = curveX * 0.15;
          }

          let rawPredX = bPos.x + bVel.x * tCross + 0.5 * effectiveCurveX * tCross * tCross;

          if (gkPhys.flawType === 'wrong_footed_gamble' && flightElapsed < 0.45) {
            // Gambled dive towards one side early
            rawPredX = gkPhys.gambleSide * 2.2;
          }

          // Apply flaw offset to give human margin of error on tough corners
          const predX = THREE.MathUtils.clamp(
            rawPredX + gkPhys.flawOffset,
            -3.85,
            3.85
          );

          // Calculate raw unclamped crossing height at the goal line
          const rawPredY = bPos.y + bVel.y * tCross - 0.5 * (shotGravityRef.current || 9.81) * tCross * tCross;

          // Crossbar frame height is 2.44m (with bar cylinder radius ~0.12m = 2.56m max).
          // Ball is clearly flying over the goal if rawPredY > 2.48m or when trajectory is clearly higher than crossbar
          const isGoingOver = rawPredY > 2.48 || (bPos.z < -28.0 && bPos.y > 2.55 && bVel.y > -0.4);

          const predY = THREE.MathUtils.clamp(
            rawPredY,
            0.05,
            2.55
          );

          gkPhys.targetX = predX;
          gkPhys.targetY = predY;
          gkPhys.hasReacted = hasReactedToStrike;

          // Orient keeper upright facing the field/ball
          const dirToBall = bPos.clone().sub(gkPhys.pos);
          const angleToBall = Math.atan2(dirToBall.x, dirToBall.z);
          gkPhys.baseRotY = angleToBall;
          gkPhys.rotY = angleToBall;
          gkPhys.rotX = 0;
          gkPhys.rotZ = 0;

          if (isGoingOver) {
            // --- BALL GOING OVER THE GOAL: KEEPER STANDS STRAIGHT AND DOES NOT JUMP ---
            gkPhys.hasJumped = false;
            gkPhys.actionType = 'stay';
            gkPhys.pos.y = 0;
            gkPhys.vel.y = 0;
            gkPhys.rotX = 0;
            gkPhys.rotZ = 0;
            gkPhys.walkSpeed = THREE.MathUtils.lerp(gkPhys.walkSpeed, 0, dt * 14.0);

            // Perfectly upright standing straight posture
            if (gkLeftLeg) gkLeftLeg.rotation.set(0, 0, 0);
            if (gkRightLeg) gkRightLeg.rotation.set(0, 0, 0);
            if (gkLeftArm) gkLeftArm.rotation.set(-0.35, 0.10, -0.15);
            if (gkRightArm) gkRightArm.rotation.set(-0.35, -0.10, 0.15);
            if (gkHead) gkHead.rotation.set(0, 0, 0);
          } else if (!hasReactedToStrike) {
            // Reading the strike - focused ready anticipation stance
            if (gkHead) gkHead.rotation.set(0, 0, 0);
            gkPhys.pos.y = 0;
            gkPhys.vel.y = 0;
            gkPhys.rotX = 0;
            gkPhys.rotZ = 0;
            gkPhys.walkSpeed = THREE.MathUtils.lerp(gkPhys.walkSpeed, 0, dt * 14.0);
            if (gkLeftLeg) gkLeftLeg.rotation.set(0, 0, 0);
            if (gkRightLeg) gkRightLeg.rotation.set(0, 0, 0);
            if (gkLeftArm) gkLeftArm.rotation.set(-0.65, 0.25, -0.40);
            if (gkRightArm) gkRightArm.rotation.set(-0.65, -0.25, 0.40);
          } else {
            // Ball is threatening the goal frame & GK has reacted
            if (gkHead) gkHead.rotation.set(0, 0, 0);

            // 1. Walk across the goal line towards the ball's predicted X position
            const isAnyPenaltyMatch = isPenaltyTraining || isPenaltyShootoutRef.current || penaltyShootout.isActive || isPenaltyTrainingRef.current;
            const deltaX = gkPhys.targetX - gkPhys.pos.x;
            const urgencySpeed = deltaX / Math.max(0.04, tCross);
            const maxAgilitySpeed = isAnyPenaltyMatch ? 6.0 : 5.2; // Realistic walking pace along the goal line
            const desiredSpeed = THREE.MathUtils.clamp(urgencySpeed, -maxAgilitySpeed, maxAgilitySpeed);
            gkPhys.walkSpeed = THREE.MathUtils.lerp(gkPhys.walkSpeed, desiredSpeed, Math.min(1.0, dt * (isAnyPenaltyMatch ? 20.0 : 16.0)));
            gkPhys.pos.x += gkPhys.walkSpeed * dt;
            gkPhys.pos.x = THREE.MathUtils.clamp(gkPhys.pos.x, -3.75, 3.75);

            // 2. Straight-line vertical jump: triggers ONLY if the ball is high and within goal frame
            const isCloseToBallX = Math.abs(deltaX) < 1.25;
            const isHighBall = gkPhys.targetY > 1.35 && gkPhys.targetY <= 2.46;
            const isBallApproachingGoal = bPos.z < -35.5 || tCross < 0.38;

            if (
              !gkPhys.hasJumped &&
              !gkPhys.jumpCompleted &&
              isHighBall &&
              (isCloseToBallX || isBallApproachingGoal)
            ) {
              gkPhys.hasJumped = true;
              gkPhys.actionType = 'jump';
              gkPhys.state = 'jumping';
              // Straight vertical jump with capped height so keeper never exceeds or flies over the crossbar (max jump lift ~0.45m)
              const jumpLift = Math.min(0.45, Math.max(0.20, (gkPhys.targetY - 1.35) * 0.45));
              gkPhys.vel.y = Math.sqrt(2 * 18.0 * jumpLift);
            }

            // 3. Upright Straight-Line Jump Physics (Zero roll / tilt, strictly upright)
            gkPhys.rotZ = 0;
            gkPhys.rotX = 0;

            if (gkPhys.hasJumped && (gkPhys.pos.y > 0 || gkPhys.vel.y > 0)) {
              // Jump straight up and come straight down under brisk gravity (18.0 m/s²)
              gkPhys.vel.y -= 18.0 * dt;
              gkPhys.pos.y += gkPhys.vel.y * dt;
              gkPhys.pos.y = Math.min(0.50, Math.max(0, gkPhys.pos.y)); // Hard cap at 0.50m - stays firmly below crossbar

              if (gkPhys.pos.y > 0.01) {
                // Straight vertical jump with arms reaching upward for high ball
                if (gkLeftArm) gkLeftArm.rotation.set(-2.55, 0.20, -0.15);
                if (gkRightArm) gkRightArm.rotation.set(-2.55, -0.20, 0.15);
                if (gkLeftLeg) gkLeftLeg.rotation.set(0.12, 0, 0);
                if (gkRightLeg) gkRightLeg.rotation.set(0.12, 0, 0);
              } else {
                // Landed cleanly on the turf
                gkPhys.pos.y = 0;
                gkPhys.vel.y = 0;
                gkPhys.hasJumped = false;
                gkPhys.jumpCompleted = true;
                if (gkLeftLeg) gkLeftLeg.rotation.set(0, 0, 0);
                if (gkRightLeg) gkRightLeg.rotation.set(0, 0, 0);
                if (gkLeftArm) gkLeftArm.rotation.set(-0.55, 0.20, -0.25);
                if (gkRightArm) gkRightArm.rotation.set(-0.55, -0.20, 0.25);
              }
            } else if (gkPhys.jumpCompleted) {
              // Landed on grass
              gkPhys.pos.y = 0;
              gkPhys.vel.y = 0;
              gkPhys.walkSpeed = THREE.MathUtils.lerp(gkPhys.walkSpeed, 0, dt * 10.0);
              if (gkLeftLeg) gkLeftLeg.rotation.set(0, 0, 0);
              if (gkRightLeg) gkRightLeg.rotation.set(0, 0, 0);
              if (gkLeftArm) gkLeftArm.rotation.set(-0.50, 0.15, -0.25);
              if (gkRightArm) gkRightArm.rotation.set(-0.50, -0.15, 0.25);
            } else {
              // On the turf: natural walking motion towards the ball
              gkPhys.pos.y = 0;
              gkPhys.vel.y = 0;

              const isBallNearFace = bPos.z < -38.5 && Math.abs(deltaX) < 1.6;

              if (Math.abs(gkPhys.walkSpeed) > 0.15) {
                gkPhys.walkCycle += Math.abs(gkPhys.walkSpeed) * dt * 14.0;
                const legStride = Math.sin(gkPhys.walkCycle) * 0.70;

                if (gkLeftLeg) gkLeftLeg.rotation.set(legStride, 0, 0);
                if (gkRightLeg) gkRightLeg.rotation.set(-legStride, 0, 0);

                // Arms positioned to reach or block while walking
                if (isBallNearFace || gkPhys.targetY > 1.1) {
                  if (gkLeftArm) gkLeftArm.rotation.set(-1.60, 0.25, -0.25);
                  if (gkRightArm) gkRightArm.rotation.set(-1.60, -0.25, 0.25);
                } else {
                  if (gkLeftArm) gkLeftArm.rotation.set(-0.55, 0.20, -0.20);
                  if (gkRightArm) gkRightArm.rotation.set(-0.55, -0.20, 0.20);
                }
              } else {
                // Standing on the goal line
                if (gkLeftLeg) gkLeftLeg.rotation.set(0, 0, 0);
                if (gkRightLeg) gkRightLeg.rotation.set(0, 0, 0);

                if (isBallNearFace || gkPhys.targetY > 1.1) {
                  if (gkLeftArm) gkLeftArm.rotation.set(-1.65, 0.25, -0.25);
                  if (gkRightArm) gkRightArm.rotation.set(-1.65, -0.25, 0.25);
                } else {
                  if (gkLeftArm) gkLeftArm.rotation.set(-0.60, 0.25, -0.35);
                  if (gkRightArm) gkRightArm.rotation.set(-0.60, -0.25, 0.35);
                }
              }
            }
          }
        } else if (currentPhase === 'finished') {
          // --- 3. POST-SHOT FINISHED STATE (Strict gravity to ground) ---
          if (gkPhys.pos.y > 0) {
            gkPhys.vel.y -= 14.0 * dt;
            gkPhys.pos.y = Math.max(0, gkPhys.pos.y + gkPhys.vel.y * dt);
          } else {
            gkPhys.pos.y = 0;
            gkPhys.vel.y = 0;
          }
          gkPhys.vel.x = 0;
          gkPhys.rotZ = 0;
          gkPhys.rotX = 0;

          if (isGoalScoredNow && gkHead) {
            gkHead.rotation.y = THREE.MathUtils.lerp(gkHead.rotation.y, Math.PI * 0.75, dt * 3.0);
          }
        }

        // Apply simulated physics state to 3D Goalkeeper Figure Group
        gk.position.copy(gkPhys.pos);
        gk.position.z = -42.0;
        gk.rotation.x = gkPhys.rotX;
        gk.rotation.y = gkPhys.rotY;
        gk.rotation.z = gkPhys.rotZ;
      }

      // Unified Setup Step Oscillator & Simultaneous Power Updates inside main 60 FPS loop
      if (shotPhaseRef.current === 'idle' && currentTurnRef.current === 'player' && !isPausedRef.current) {
        const step = setupStepRef.current;
        if (step === 'aim') {
          // Aim Arrow Oscillation (Sweeps left and right across the goal)
          const aimElapsed = (now - aimStartTimeRef.current) % 2000;
          const aimProgress = aimElapsed / 2000;
          const aimNormalized = aimProgress <= 0.5 ? aimProgress * 2 : (1 - aimProgress) * 2;
          const aimSmoothed = (Math.sin((aimNormalized - 0.5) * Math.PI) + 1) / 2;
          const aimVal = 0.08 + aimSmoothed * 0.84;
          currentAimRef.current = aimVal;
        } else if (step === 'power') {
          let pVal: number;
          if (isHoldingPowerRef.current) {
            const elapsed = now - powerHoldStartTimeRef.current;
            const chargeDuration = 1200; // 1.2s to reach 100%
            pVal = Math.min(100, Math.max(0, Math.round((elapsed / chargeDuration) * 100)));
          } else {
            // Smoothly oscillate power back and forth between 18% and 100% for tap/click-based timing
            const powerOscElapsed = (now - (powerStartTimeRef.current || now)) % 1500;
            const norm = powerOscElapsed / 1500;
            const tri = norm <= 0.5 ? norm * 2 : (1 - norm) * 2;
            const smoothed = (Math.sin((tri - 0.5) * Math.PI) + 1) / 2;
            pVal = Math.round(18 + smoothed * 82);
          }
          currentPowerRef.current = pVal;

          // Real-time audio pitch & harmonic modulation (active when holding)
          if (isHoldingPowerRef.current) {
            updatePowerChargeAudio(pVal);
          }

          // Dynamic tactile vibration milestones
          if (pVal >= 33 && lastVibrateMilestoneRef.current < 33) {
            lastVibrateMilestoneRef.current = 33;
            if (navigator.vibrate) navigator.vibrate(10);
          } else if (pVal >= 68 && lastVibrateMilestoneRef.current < 68) {
            lastVibrateMilestoneRef.current = 68;
            if (navigator.vibrate) navigator.vibrate(18);
          } else if (pVal >= 88 && lastVibrateMilestoneRef.current < 88) {
            lastVibrateMilestoneRef.current = 88;
            if (navigator.vibrate) navigator.vibrate([15, 20, 15]);
          } else if (pVal >= 100 && lastVibrateMilestoneRef.current < 100) {
            lastVibrateMilestoneRef.current = 100;
            if (navigator.vibrate) navigator.vibrate([25, 25, 30]);
          }

          if (powerFillRef.current) {
            powerFillRef.current.style.width = `${pVal}%`;
          }
          if (powerCursorRef.current) {
            powerCursorRef.current.style.left = `${pVal}%`;
          }
          if (powerLevelBadgeRef.current) {
            powerLevelBadgeRef.current.textContent = `${pVal}%`;
            if (pVal >= 88) {
              powerLevelBadgeRef.current.className = 'text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full bg-rose-500 text-white border border-black shadow-sm';
            } else if (pVal >= 68) {
              powerLevelBadgeRef.current.className = 'text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full bg-emerald-400 text-black border border-black shadow-sm';
            } else if (pVal >= 35) {
              powerLevelBadgeRef.current.className = 'text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full bg-amber-400 text-black border border-black shadow-sm';
            } else {
              powerLevelBadgeRef.current.className = 'text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full bg-slate-200 text-black border border-black shadow-sm';
            }
          }
          if (powerStatusTextRef.current) {
            if (isHoldingPowerRef.current) {
              if (pVal >= 88) {
                powerStatusTextRef.current.textContent = '🔥 MAXIMUM ROCKET POWER!';
                powerStatusTextRef.current.className = 'text-center text-[9px] sm:text-[10px] font-black text-rose-600 uppercase tracking-wide mt-1.5 animate-pulse';
              } else if (pVal >= 68) {
                powerStatusTextRef.current.textContent = '⚡ SWEET SPOT! PERFECT LIFT & DIP';
                powerStatusTextRef.current.className = 'text-center text-[9px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-wide mt-1.5';
              } else if (pVal >= 35) {
                powerStatusTextRef.current.textContent = 'BUILDING VELOCITY...';
                powerStatusTextRef.current.className = 'text-center text-[9px] sm:text-[10px] font-black text-amber-600 uppercase tracking-wide mt-1.5';
              } else {
                powerStatusTextRef.current.textContent = 'CHARGING POWER...';
                powerStatusTextRef.current.className = 'text-center text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-wide mt-1.5';
              }
            } else {
              powerStatusTextRef.current.textContent = 'PRESS SPACEBAR / CLICK TO LOCK POWER & KICK';
              powerStatusTextRef.current.className = 'text-center text-[9px] sm:text-[10px] font-black text-amber-600 uppercase tracking-wide mt-1.5 animate-pulse';
            }
          }
          if (powerCardRef.current) {
            if (pVal >= 88) {
              const shakeX = (Math.random() - 0.5) * 2.5;
              const shakeY = (Math.random() - 0.5) * 2.5;
              powerCardRef.current.style.transform = `translate3d(${shakeX}px, ${shakeY}px, 0)`;
              powerCardRef.current.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.65), 0 6px 0 0 #000';
            } else if (pVal >= 68) {
              powerCardRef.current.style.transform = 'translate3d(0, 0, 0)';
              powerCardRef.current.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.55), 0 6px 0 0 #000';
            } else {
              powerCardRef.current.style.transform = 'translate3d(0, 0, 0)';
              powerCardRef.current.style.boxShadow = '0 6px 0 0 #000';
            }
          }
        }
      }

      // Update 3D Aim Arrow in real time during setup phase (player turn only)
      if (shotPhaseRef.current === 'idle' && fkBallPosRef.current) {
        const isPlayerTurn = currentTurnRef.current === 'player';
        if (aimArrowGroupRef.current) {
          aimArrowGroupRef.current.visible = isPlayerTurn;
        }
        if (slingshotGroupRef.current) {
          slingshotGroupRef.current.visible = false;
        }

        if (isPlayerTurn) {
          const goalLineZ = -42.0;
          const ballPos = fkBallPosRef.current;

          // Dynamic target span based on distance
          const activeAim = currentAimRef.current ?? 0.5;
          const activePower = currentPowerRef.current ?? 50;
          const span = getAimTargetSpan(ballPos.z, goalLineZ);
          const targetX = (activeAim - 0.5) * span;

          if (aimArrowGroupRef.current) {
            aimArrowGroupRef.current.position.set(ballPos.x, 0.05, ballPos.z);
            _scratchV3_1.set(targetX, 0.05, goalLineZ);
            aimArrowGroupRef.current.lookAt(_scratchV3_1);

            // Dynamic arrow scale based on power (increases in size with charged power)
            if (aimArrowGroupRef.current.userData?.update) {
              aimArrowGroupRef.current.userData.update(activePower, isSlingshotDraggingRef.current);
            }
          }
        }
      } else {
        if (slingshotGroupRef.current) {
          slingshotGroupRef.current.visible = false;
        }
      }

      if (kicker && ball) {
        const phase = shotPhaseRef.current;

        if (phase === 'running') {
          const runDuration = 310; // ms for fast, energetic, responsive run-up matching the run distance
          const elapsed = now - runStartTimeRef.current;
          const progress = Math.min(1.0, elapsed / runDuration);

          // Smooth quadratic acceleration towards the plant foot position
          const easeProgress = progress * progress * (3 - 2 * progress);
          kicker.position.lerpVectors(kickerStartPosRef.current, kickerTargetPosRef.current, easeProgress);

          // Face direction of run towards ball
          _scratchV3_2.subVectors(kickerTargetPosRef.current, kickerStartPosRef.current);
          if (_scratchV3_2.lengthSq() > 0.001) {
            const targetYAngle = Math.atan2(_scratchV3_2.x, _scratchV3_2.z);
            kicker.rotation.y += (targetYAngle - kicker.rotation.y) * 0.25;
          }

          const userData = kicker.userData;
          const isLeftFooted = userData.isLeftFooted ?? false;
          const kickingLeg = isLeftFooted ? userData.leftLegGroup : userData.rightLegGroup;
          const plantLeg = isLeftFooted ? userData.rightLegGroup : userData.leftLegGroup;
          const balanceArm = isLeftFooted ? userData.rightArmGroup : userData.leftArmGroup;
          const kickingArm = isLeftFooted ? userData.leftArmGroup : userData.rightArmGroup;

          if (progress < 0.65) {
            // Stage A: Athletic run-up strides (0% to 65% of run)
            const runFreq = elapsed * 0.022;
            kicker.position.y = Math.abs(Math.sin(runFreq)) * 0.04;
            kicker.rotation.x = 0.06 * (1 - easeProgress);

            const legSwing = Math.sin(runFreq) * 0.75;
            const armSwing = Math.cos(runFreq) * 0.65;

            if (kickingLeg) kickingLeg.rotation.x = -legSwing;
            if (plantLeg) plantLeg.rotation.x = legSwing;
            if (balanceArm) balanceArm.rotation.x = legSwing;
            if (kickingArm) kickingArm.rotation.x = -armSwing;
          } else {
            // Stage B: Fluid plant-and-strike motion (65% to 100%) - ZERO hesitation before impact
            const strikeSub = (progress - 0.65) / 0.35; // 0.0 to 1.0

            if (strikeSub < 0.40) {
              // Plant non-kicking foot & cock kicking leg far back
              const sub = strikeSub / 0.40;
              if (kickingLeg) kickingLeg.rotation.x = -Math.PI / 2.2 * sub;
              if (plantLeg) plantLeg.rotation.x = Math.PI / 8 * sub;
              if (balanceArm) balanceArm.rotation.z = (isLeftFooted ? 1 : -1) * Math.PI / 2.6 * sub;
              if (kickingArm) kickingArm.rotation.x = Math.PI / 4 * sub;
              kicker.rotation.x = -0.12 * sub;
            } else {
              // Whip kicking leg forward smoothly through the ball
              const sub = (strikeSub - 0.40) / 0.60;
              const smoothStrike = Math.sin(sub * Math.PI / 2);
              if (kickingLeg) {
                kickingLeg.rotation.x = -Math.PI / 2.2 + (Math.PI / 2.2 + Math.PI / 3.0) * smoothStrike;
              }
              if (plantLeg) plantLeg.rotation.x = Math.PI / 8 * (1 - sub);
              if (balanceArm) balanceArm.rotation.z = (isLeftFooted ? 1 : -1) * Math.PI / 2.6 * (1 - sub * 0.2);
              kicker.rotation.x = -0.12 + 0.10 * sub;
            }
          }

          // AT IMPACT (progress >= 1.0): Launch the ball directly along Arrow direction with selected Power & Curve!
          if (progress >= 1.0) {
            shotPhaseRef.current = 'flying';
            flightStartTimeRef.current = now;
            hitPostTimeRef.current = 0;
            flightTimeRef.current = 0;
            setCrowdExcitement('shot_inflight');

            // Play uploaded Soccer-kick sound on impact
            const currentPower = lockedPowerRef.current !== null && lockedPowerRef.current !== undefined ? lockedPowerRef.current : (currentPowerRef.current ?? 50);
            playKickSound(currentPower / 100);

            if (aimArrowGroupRef.current) aimArrowGroupRef.current.visible = false;
            if (slingshotGroupRef.current) slingshotGroupRef.current.visible = false;
            if (curveArrowGroupRef.current) curveArrowGroupRef.current.visible = false;

            const goalLineZ = -42.0;
            const currentAim = lockedAimRef.current !== null && lockedAimRef.current !== undefined ? lockedAimRef.current : (currentAimRef.current ?? 0.5);
            const currentCurve = lockedCurveRef.current !== null && lockedCurveRef.current !== undefined ? lockedCurveRef.current : (currentCurveRef.current ?? 0);

            const ballPos = ball.position;
            ballPosRef.current.copy(ballPos);

            const span = getAimTargetSpan(ballPos.z, goalLineZ);
            const targetX = (currentAim - 0.5) * span;
            _scratchV3_1.set(targetX, 0.05, goalLineZ);

            // 1. Horizontal Direction vector following the Aim Arrow
            _scratchV3_2.subVectors(_scratchV3_1, ballPos);
            _scratchV3_2.y = 0;
            _scratchV3_2.normalize();

            // 2. Power physics & ballistic trajectory allowing over-the-bar misses
            let vHoriz: number;
            let vY: number;

            if (aiPassedToTeammateRef.current && aiPassTargetTeammateRef.current) {
              const targetTeammate = aiPassTargetTeammateRef.current;
              _scratchV3_2.subVectors(targetTeammate.position, ballPos);
              _scratchV3_2.y = 0;
              _scratchV3_2.normalize();

              const passSpeed = 26.0; // 26 m/s crisp, direct ground pass
              vHoriz = passSpeed;
              vY = 0.05;
              shotGravityRef.current = 9.81;
            } else if (currentPower <= 20) {
              // Low power (0-20%): Flat driven ground pass/shot
              const pLower = Math.max(0.1, currentPower / 20.0);
              vHoriz = (30.0 + pLower * 12.0) * 1.20;
              vY = 0.2 + pLower * 1.0;
              shotGravityRef.current = 9.81;
            } else {
              // Power shots (20-100%): Dynamic trajectory with sweet spot clearance and over-the-crossbar power misses
              const pRatio = (currentPower - 20.0) / 80.0; // 0.0 (20% power) to 1.0 (100% power)
              vHoriz = (38.0 + pRatio * 24.0) * 1.20; // 45.6 m/s to 74.4 m/s

              const distToGoal = ballPos.distanceTo(_scratchV3_1);
              const tGoal = Math.max(0.12, distToGoal / vHoriz);
              const wallDist = Math.min(14.08, Math.max(11.62, distToGoal * 0.4576));
              const alpha = Math.min(0.85, Math.max(0.15, wallDist / distToGoal));

              let Ywall: number;
              let Ygoal: number;

              if (currentPower >= 85) {
                // 85% - 100% Over-Power Zone:
                // Heavy upward momentum: clears the wall cleanly (Ywall = 2.45m - 3.30m),
                // but soars OVER THE GOAL CROSSBAR (Ygoal = 2.58m at 85% up to 4.70m at 100% power)
                const tOver = (currentPower - 85.0) / 15.0; // 0.0 at 85%, 1.0 at 100%
                Ywall = 2.45 + tOver * 0.85; // 2.45m -> 3.30m
                Ygoal = 2.58 + Math.pow(tOver, 1.15) * 2.12; // 2.58m at 85% -> 4.70m at 100% (soars over the 2.44m crossbar!)
              } else if (currentPower >= 68) {
                // 68% - 84% Sweet Spot Power Zone:
                // Flies cleanly OVER the defensive wall (Ywall = 2.18m - 2.43m, exceeding wall height of 2.10m),
                // while dipping with sharp topspin under the crossbar (Ygoal = 1.65m - 2.38m into top corners & net)
                const tSweet = (currentPower - 68.0) / 17.0; // 0.0 at 68%, 1.0 at 84%
                Ywall = 2.18 + tSweet * 0.25; // 2.18m -> 2.43m
                Ygoal = 1.65 + Math.pow(tSweet, 1.05) * 0.73; // 1.65m -> 2.38m (cleanly under 2.44m crossbar)
              } else {
                // 20% - 67% Low-to-Mid Power:
                // Lower trajectories (can strike wall or stay low on goal)
                const tLow = Math.max(0, (currentPower - 20.0) / 48.0); // 0.0 at 20%, 1.0 at 68%
                Ywall = 0.50 + Math.pow(tLow, 0.95) * 1.65; // 0.50m -> 2.15m
                Ygoal = 0.40 + Math.pow(tLow, 0.95) * 1.25; // 0.40m -> 1.65m
              }

              // Analytical solver for required gravity / topspin dip:
              const denom = alpha * (1.0 - alpha) * tGoal * tGoal;
              const gShot = (2.0 * (Ywall - ballPos.y - alpha * (Ygoal - ballPos.y))) / denom;
              shotGravityRef.current = Math.max(9.81, gShot);

              // Initial vertical velocity:
              vY = (Ygoal - ballPos.y + 0.5 * shotGravityRef.current * tGoal * tGoal) / tGoal;
            }

            ballVelRef.current.set(
              _scratchV3_2.x * vHoriz,
              vY,
              _scratchV3_2.z * vHoriz
            );

            // 3. Sideways Curve Acceleration Vector (realistic aerodynamic Magnus curl around wall into the top corner)
            _scratchV3_3.set(-_scratchV3_2.z, 0, _scratchV3_2.x);
            const clampedCurve = Math.max(-MAX_CURVE_LIMIT, Math.min(MAX_CURVE_LIMIT, currentCurve));
            const curveRatio = clampedCurve / MAX_CURVE_LIMIT; // -1.0 to +1.0
            const curveSign = Math.sign(curveRatio);
            const absCurve = Math.abs(curveRatio);

            // Dynamic Magnus curve scaling: progressive whip that arcs cleanly into the goal
            // Cancel or scale down curve at low power so passes to teammates travel dead straight
            let powerCurveScale = 1.0;
            if (currentPower <= 25) {
              powerCurveScale = 0.0;
            } else if (currentPower < 50) {
              powerCurveScale = Math.pow((currentPower - 25) / 25, 1.25);
            }

            const boostedCurveMag = Math.pow(absCurve, 1.08) * 38.0 * powerCurveScale;
            const curveAccelMag = curveSign * boostedCurveMag;
            curveAccelMagRef.current = curveAccelMag;
            curveAccelVecRef.current.copy(_scratchV3_3).multiplyScalar(curveAccelMag);

            hasBouncedRef.current = false;
          }
        } else if (phase === 'flying' || phase === 'hit_post' || phase === 'finished') {
          const isGoalCelebrationActive = (shotOutcomeRef.current === 'GOAL' || isGoalScoredRef.current) && shotPhaseRef.current === 'finished';

          if (!isGoalCelebrationActive) {
            // Smooth athletic follow-through stance after kick
            const flightElapsed = now - flightStartTimeRef.current;
            const followThroughDecay = Math.exp(-flightElapsed / 220); // Smooth exponential decay back to balanced posture

            kicker.position.copy(kickerTargetPosRef.current);
            kicker.position.y = 0;
            kicker.rotation.x = -0.08 * followThroughDecay;

            const kickerUserData = kicker.userData;
            const isLeftFootedFollow = kickerUserData.isLeftFooted ?? false;
            const kickingLegGroup = isLeftFootedFollow ? kickerUserData.leftLegGroup : kickerUserData.rightLegGroup;
            const plantLegGroup = isLeftFootedFollow ? kickerUserData.rightLegGroup : kickerUserData.leftLegGroup;

            if (kickingLegGroup) {
              kickingLegGroup.rotation.x = (Math.PI / 3.2) * followThroughDecay; // Leg extended forward in follow-through
            }
            if (plantLegGroup) {
              plantLegGroup.rotation.x = 0;
            }
            if (kickerUserData.leftArmGroup) {
              kickerUserData.leftArmGroup.rotation.z = (-Math.PI / 3.0) * followThroughDecay;
            }
            if (kickerUserData.rightArmGroup) {
              kickerUserData.rightArmGroup.rotation.x = (Math.PI / 5.0) * followThroughDecay;
            }
          }

          const BALL_GROUND_Y = 0.3015;
          const currentCurve = currentCurveRef.current || 0;
          const clampedCurve = Math.max(-MAX_CURVE_LIMIT, Math.min(MAX_CURVE_LIMIT, currentCurve));

          // Goal Post Frame Vibration / Shaking Solver
          if (goalVibrationRef.current && goalGroupRef.current) {
            const vibeElapsed = (now - goalVibrationRef.current.startTime) / 1000.0;
            if (vibeElapsed < 0.65) {
              const decay = Math.exp(-vibeElapsed * 7.5);
              const freq = 42.0; // Metallic oscillation frequency
              const shakeX = Math.sin(vibeElapsed * freq) * goalVibrationRef.current.intensity * decay;
              const shakeY = Math.cos(vibeElapsed * freq * 1.3) * (shakeX * 0.4);
              goalGroupRef.current.position.set(shakeX, shakeY, -42.0);
            } else {
              goalGroupRef.current.position.set(0, 0, -42.0);
              goalVibrationRef.current = null;
            }
          }

          if (shotPhaseRef.current === 'flying' || shotPhaseRef.current === 'hit_post' || shotPhaseRef.current === 'finished') {
            const GRAVITY = shotGravityRef.current || 9.81;
            prevBallPosRef.current.copy(ballPosRef.current);
            const prevBallPos = prevBallPosRef.current;

            flightTimeRef.current += dt;

            // Physical gravity integration
            ballVelRef.current.y -= GRAVITY * dt;

            // Superpower: Fireball acceleration
            if (activeSuperpowerRef.current === 'fireball' && shotPhaseRef.current === 'flying') {
              ballVelRef.current.z *= (1 + 0.15 * dt);
            }

            // Apply authentic aerodynamic Magnus lateral curve and In-Flight Aftertouch forces
            if (shotPhaseRef.current === 'flying' && ballPosRef.current.z > -42.0) {
              if (activeSuperpowerRef.current !== 'laser_aim' && curveAccelMagRef.current !== 0) {
                const speedH = Math.hypot(ballVelRef.current.x, ballVelRef.current.z);
                if (speedH > 0.5) {
                  // True perpendicular Magnus force rotating seamlessly with flight vector
                  const perpX = -ballVelRef.current.z / speedH;
                  const perpZ = ballVelRef.current.x / speedH;
                  ballVelRef.current.x += perpX * curveAccelMagRef.current * dt;
                  ballVelRef.current.z += perpZ * curveAccelMagRef.current * dt;
                } else {
                  ballVelRef.current.x += curveAccelVecRef.current.x * dt;
                  ballVelRef.current.z += curveAccelVecRef.current.z * dt;
                }
              }

              // In-Flight Aftertouch (Real-time mid-air swerve & dip)
              if (aftertouchVecRef.current.x !== 0 || aftertouchVecRef.current.y !== 0) {
                ballVelRef.current.x += aftertouchVecRef.current.x * 28.0 * dt;
                ballVelRef.current.y += aftertouchVecRef.current.y * 16.0 * dt;
                // Smooth progressive damping
                aftertouchVecRef.current.x *= Math.max(0, 1 - 2.8 * dt);
                aftertouchVecRef.current.y *= Math.max(0, 1 - 2.8 * dt);
                if (Math.abs(aftertouchVecRef.current.x) < 0.02 && Math.abs(aftertouchVecRef.current.y) < 0.02) {
                  aftertouchVecRef.current = { x: 0, y: 0 };
                  if (swerveDisplayRef.current) swerveDisplayRef.current.textContent = '0%';
                  if (dipDisplayRef.current) dipDisplayRef.current.textContent = '0%';
                }
              }
            }

            // Aerodynamic air drag
            ballVelRef.current.x *= (1 - 0.01 * dt);
            ballVelRef.current.y *= (1 - 0.01 * dt);
            ballVelRef.current.z *= (1 - 0.01 * dt);

            // Integrate 3D velocity directly into ball position
            ballPosRef.current.addScaledVector(ballVelRef.current, dt);

            // Ground pitch bounce & grass rolling physics solver
            if (ballPosRef.current.y <= BALL_GROUND_Y) {
              ballPosRef.current.y = BALL_GROUND_Y;

              if (!hasBouncedRef.current && Math.abs(ballVelRef.current.y) > 0.5) {
                ballVelRef.current.x *= 0.90;
                ballVelRef.current.z *= 0.90;
                hasBouncedRef.current = true;
              }

              if (Math.abs(ballVelRef.current.y) > 0.8) {
                ballVelRef.current.y = -ballVelRef.current.y * 0.20;
              } else {
                ballVelRef.current.y = 0;
              }

              // Pitch grass rolling friction (smooth rolling friction so passes/low shots travel far)
              const isHitPostOrFinished = shotPhaseRef.current === 'hit_post' || shotPhaseRef.current === 'finished';
              const grassFriction = isHitPostOrFinished ? 6.5 : (hasBouncedRef.current ? 1.6 : 0.85);
              ballVelRef.current.x *= Math.max(0, 1 - grassFriction * dt);
              ballVelRef.current.z *= Math.max(0, 1 - grassFriction * dt);

              // Linear rolling deceleration on turf to bring rolling balls to a clean, natural stop
              const speedH = Math.hypot(ballVelRef.current.x, ballVelRef.current.z);
              if (speedH > 0.001) {
                const decel = (isHitPostOrFinished ? 9.5 : 2.5) * dt;
                const newSpeedH = Math.max(0, speedH - decel);
                const scale = newSpeedH / speedH;
                ballVelRef.current.x *= scale;
                ballVelRef.current.z *= scale;
              }

              // Pure realistic rolling spin on pitch grass matching forward/lateral velocity (omega = v / r)
              ball.rotation.x -= ballVelRef.current.z * dt * 3.2;
              ball.rotation.z += ballVelRef.current.x * dt * 3.2;
              ball.rotation.y += (clampedCurve / MAX_CURVE_LIMIT) * 4.0 * dt;
            } else {
              // In-air aerodynamic Magnus spin & topspin
              const speed = ballVelRef.current.length();
              const curveFactor = clampedCurve / MAX_CURVE_LIMIT;
              ball.rotation.x += dt * speed * 0.45; // Topspin / forward roll
              ball.rotation.y += dt * curveFactor * 26.0; // Dynamic fast Magnus swerve spin around Y
              ball.rotation.z += dt * curveFactor * speed * 0.45; // Lateral bank spin
            }

            // 1. Physical Field Players & Wall Collision (Attacking Teammates Strike on Goal vs Defending Clearances)
            if (shotPhaseRef.current === 'flying' && now > deflectionCooldownUntilRef.current) {
              const allFieldPlayers = [...wallDefendersRef.current, ...boxPlayersRef.current];

              // Fast swept continuous collision using scalar math (0 allocations per frame)
              const segStartX = prevBallPos.x;
              const segStartZ = prevBallPos.z;
              const segVecX = ballPosRef.current.x - segStartX;
              const segVecZ = ballPosRef.current.z - segStartZ;
              const segLenSq = segVecX * segVecX + segVecZ * segVecZ;

              for (let fIdx = 0; fIdx < allFieldPlayers.length; fIdx++) {
                const player = allFieldPlayers[fIdx];
                if (!player || player === kickerGroupRef.current) continue;

                const isTargetedPass = aiPassedToTeammateRef.current && aiPassTargetTeammateRef.current === player;

                const px = player.position.x;
                const pz = player.position.z;
                let tSeg = 0;
                if (segLenSq > 0.00001) {
                  const dot = (px - segStartX) * segVecX + (pz - segStartZ) * segVecZ;
                  tSeg = Math.max(0, Math.min(1, dot / segLenSq));
                }
                const closeX = segStartX + segVecX * tSeg;
                const closeZ = segStartZ + segVecZ * tSeg;
                const dx = closeX - px;
                const dz = closeZ - pz;
                const dist2D = Math.sqrt(dx * dx + dz * dz);
                const heightAtContact = prevBallPos.y + tSeg * (ballPosRef.current.y - prevBallPos.y);

                // Responsive collision threshold: 1.15m for attacking teammate pass reception (making ground/low-power passes smooth and responsive), 0.65m for general collision
                const role = player.userData?.teamRole || 'defender';
                const isAttackingTeammate = role === 'attacker';
                const collisionThreshold = isTargetedPass ? 1.20 : (isAttackingTeammate ? 1.15 : 0.65);

                if (dist2D <= collisionThreshold && heightAtContact >= 0.0 && heightAtContact <= 2.10) {
                  deflectionCooldownUntilRef.current = now + 500; // 500ms cooldown prevents duplicate collisions

                  // Animate player kicking leg & play impact sound
                  kickingPlayerAnimRef.current = {
                    player,
                    startTime: now,
                    duration: 320,
                  };
                  playBallHitPlayerSound(0.92);

                  if (role === 'attacker') {
                    // --- ATTACKING TEAMMATE: First-time strike with human finishing variance & flaws ---
                    ballPosRef.current.x = closeX;
                    ballPosRef.current.z = closeZ;
                    ballPosRef.current.y = Math.max(0.3015, heightAtContact);

                    const currentGkX = gkPhysicsRef.current ? gkPhysicsRef.current.pos.x : 0;

                    let goalTargetX: number;
                    let goalTargetY: number;
                    let strikeSpeed: number;

                    const finishRoll = Math.random();

                    if (finishRoll < 0.25) {
                      // Flaw 1 (25%): Scuffed / weak mis-hit rolling tamely along the pitch towards the goal
                      goalTargetX = (Math.random() - 0.5) * 3.5;
                      goalTargetY = 0.20 + Math.random() * 0.35;
                      strikeSpeed = 12.0 + Math.random() * 4.0;
                    } else if (finishRoll < 0.45) {
                      // Flaw 2 (20%): Blazed high over the crossbar into the crowd (2.75m-4.8m height)
                      goalTargetX = (Math.random() - 0.5) * 4.5;
                      goalTargetY = 2.75 + Math.random() * 2.0;
                      strikeSpeed = 18.0 + Math.random() * 5.0;
                    } else if (finishRoll < 0.62) {
                      // Flaw 3 (17%): Sliced or dragged wide of the goalpost (|X| > 3.85m)
                      const missSide = Math.random() > 0.5 ? 1 : -1;
                      goalTargetX = missSide * (3.85 + Math.random() * 1.5);
                      goalTargetY = 0.35 + Math.random() * 1.6;
                      strikeSpeed = 16.0 + Math.random() * 5.0;
                    } else if (finishRoll < 0.78) {
                      // Flaw 4 (16%): Rushed shot hit directly at the goalkeeper's body
                      goalTargetX = currentGkX + (Math.random() - 0.5) * 1.1;
                      goalTargetY = 0.50 + Math.random() * 1.2;
                      strikeSpeed = 15.0 + Math.random() * 5.0;
                    } else {
                      // Clean attempt (22%): Corner effort with human margin and fair flight speed (17-21 m/s)
                      const cornerSide = Math.random() > 0.5 ? 1 : -1;
                      goalTargetX = cornerSide * (1.8 + Math.random() * 1.4);
                      goalTargetY = 0.45 + Math.random() * 1.5;
                      strikeSpeed = 17.0 + Math.random() * 4.0;
                    }

                    const goalLineZ = -42.0;
                    _scratchV3_1.set(goalTargetX, goalTargetY, goalLineZ);

                    // Turn attacking player to face their strike towards the goal
                    _scratchV3_2.subVectors(_scratchV3_1, player.position);
                    _scratchV3_2.y = 0;
                    _scratchV3_2.normalize();
                    player.rotation.y = Math.atan2(_scratchV3_2.x, _scratchV3_2.z);

                    // Calculate strike velocity towards the net
                    const distToGoal = ballPosRef.current.distanceTo(_scratchV3_1);
                    const tFlight = Math.max(0.16, distToGoal / strikeSpeed);

                    const vX = (_scratchV3_1.x - ballPosRef.current.x) / tFlight;
                    const vZ = (_scratchV3_1.z - ballPosRef.current.z) / tFlight;
                    const vY = (_scratchV3_1.y - ballPosRef.current.y + 0.5 * 9.81 * tFlight * tFlight) / tFlight;

                    ballVelRef.current.set(vX, vY, vZ);
                    shotGravityRef.current = 9.81;
                    shotCurveRef.current = null;
                    curveAccelVecRef.current.set(0, 0, 0);
                    flightPointsRef.current = [];
                    hasBouncedRef.current = false;

                    // Reset goalkeeper physics state so keeper immediately reacts to teammate strike
                    if (gkPhysicsRef.current) {
                      gkPhysicsRef.current.hasJumped = false;
                      gkPhysicsRef.current.jumpCompleted = false;
                      gkPhysicsRef.current.hasReacted = false;
                      gkPhysicsRef.current.actionType = 'walk';
                      gkPhysicsRef.current.vel.y = 0;
                      gkPhysicsRef.current.walkSpeed = 0;
                      gkPhysicsRef.current.reactionDelay = 0.25 + Math.random() * 0.12;
                      gkPhysicsRef.current.flawType = Math.random() < 0.45 ? 'premature_jump' : (Math.random() < 0.3 ? 'deceived_by_curve' : 'none');
                    }

                    // Remain in 'flying' phase so it continues across the goal line to be saved, hit woodwork, or score!
                    shotPhaseRef.current = 'flying';
                    flightStartTimeRef.current = now;
                    setCrowdExcitement('shot_inflight');
                    // Note: Do NOT trigger premature outcome toast banner here while ball is live in flight!
                  } else {
                    // --- DEFENDING TEAM: Plays/clears in opposite direction away from the goal! ---
                    const clearAngle = (Math.random() - 0.5) * 1.2;
                    _scratchV3_1.set(
                      Math.sin(clearAngle),
                      0.35 + Math.random() * 0.35,
                      Math.abs(Math.cos(clearAngle)) // Always positive z (away from goal)
                    ).normalize();

                    // Turn defender to face their clearance direction
                    player.rotation.y = Math.atan2(_scratchV3_1.x, _scratchV3_1.z);

                    const clearSpeed = 22.0 + Math.random() * 6.0;
                    ballVelRef.current.set(
                      _scratchV3_1.x * clearSpeed,
                      _scratchV3_1.y * clearSpeed,
                      _scratchV3_1.z * clearSpeed
                    );

                    shotPhaseRef.current = 'finished';
                    shotFinishedTimeRef.current = now;
                    shotCurveRef.current = null;
                    curveAccelVecRef.current.set(0, 0, 0);
                    flightPointsRef.current = [];

                    if (player.userData?.defaultPose === 'wall') {
                      triggerShotOutcome('BLOCKED BY WALL');
                    } else {
                      triggerShotOutcome('CLEARED BY DEFENDER');
                    }
                  }
                  break;
                }
              }
            }

            // 2. Realistic Dynamic Goalkeeper Save & Catch Collision (Gloves reach, diving parry, & secure catches)
            if (gk && shotPhaseRef.current === 'flying' && ballPosRef.current.z <= -40.0 && ballPosRef.current.z >= -43.0) {
              const gkPhys = gkPhysicsRef.current;
              const dx = ballPosRef.current.x - gk.position.x;
              const dz = ballPosRef.current.z - gk.position.z;
              const ballY = ballPosRef.current.y;
              const gkY = gk.position.y;

              const isGroundedFromEarlyJump = gkPhys.jumpCompleted && gkPhys.pos.y === 0;
              const isAiShooter = currentTurnRef.current === 'ai';
              const isAiOnConsecutive = isAiShooter && aiConsecutiveGoalsRef.current >= 1;
              const isAiAtStageCap = isAiShooter && !isOnlineMatch && !isPracticeMode && awayScoreRef.current >= getAiMaxGoalCap();

              // Physical reach envelope based on dynamic action type (ground reach vs jumping dive catch)
              let reachRadiusX = isGroundedFromEarlyJump
                ? 0.55
                : isAiAtStageCap
                ? 2.35
                : isAiShooter
                ? 1.70
                : isAiOnConsecutive
                ? 1.45
                : 1.20;
              let minReachY = 0.0;
              let maxReachY = isGroundedFromEarlyJump
                ? 1.65
                : isAiAtStageCap
                ? 2.78
                : isAiShooter
                ? 2.65
                : isAiOnConsecutive
                ? 2.65
                : 2.35;

              if (gkPhys.hasJumped || gkPhys.actionType === 'jump' || isAiOnConsecutive || isAiAtStageCap || isAiShooter) {
                reachRadiusX = isAiAtStageCap ? 2.50 : isAiShooter ? 2.15 : isAiOnConsecutive ? 1.85 : 1.65; // Extended mid-air diving wingspan
                minReachY = Math.max(0, gkY - 0.15);
                maxReachY = Math.min(2.78, (isAiAtStageCap ? 2.78 : isAiShooter ? 2.72 : isAiOnConsecutive ? 2.68 : (gkY + 2.25)));
              }

              // Ball is within keeper's physical reach
              if (
                Math.abs(dx) <= reachRadiusX &&
                Math.abs(dz) <= 1.45 &&
                ballY >= minReachY &&
                ballY <= maxReachY
              ) {
                const impactSpeed = ballVelRef.current.length();
                const absCurve = Math.abs(currentCurveRef.current || 0);
                const absCurveMag = Math.abs(curveAccelMagRef.current || 0);
                const hasSignificantCurve = absCurve > 4.5 || absCurveMag > 5.0;

                // On high curve / bend or high speed shots, the ball is harder to hold
                const isFingertipEdge = Math.abs(dx) > reachRadiusX * 0.70 || ballY > maxReachY - 0.22 || (hasSignificantCurve && Math.abs(dx) > reachRadiusX * 0.45);
                const isSpill = !isAiShooter && !isAiOnConsecutive && !isAiAtStageCap && (
                  (gkPhys.flawType === 'fingertip_spill' && Math.random() < 0.75) ||
                  (hasSignificantCurve && isFingertipEdge && Math.random() < 0.50) ||
                  (impactSpeed > 22.0 && isFingertipEdge && Math.random() < 0.40)
                );

                if (isSpill) {
                  playKeeperHitSound(0.92);
                  // Deflects slightly off goalkeeper's fingertips into the goal
                  ballVelRef.current.x += (dx > 0 ? 1.8 : -1.8);
                  ballVelRef.current.z = Math.min(-10.0, ballVelRef.current.z * 0.9);
                } else {
                  // Check if ball is caught cleanly vs parried away
                  // Only allow Clean Catch on slow, straight, central shots directly into keeper's torso (never on curve balls)
                  const isCleanCatch = !hasSignificantCurve &&
                    absCurve < 3.5 &&
                    Math.abs(dx) <= 0.38 &&
                    ballY >= (gkY + 0.55) &&
                    ballY <= (gkY + 1.65) &&
                    impactSpeed <= 17.5 &&
                    !isFingertipEdge;

                  if (isCleanCatch) {
                    // CATCH MECHANIC: Secure the ball directly in goalkeeper's hands
                    playKeeperHitSound(0.88);
                    ballPosRef.current.set(gk.position.x, Math.max(0.35, gk.position.y + 1.15), -41.65);
                    ballVelRef.current.set(0, 0, 0);
                    shotPhaseRef.current = 'finished';
                    shotFinishedTimeRef.current = now;
                    shotCurveRef.current = null;
                    curveAccelVecRef.current.set(0, 0, 0);
                    flightPointsRef.current = [];
                    triggerShotOutcome('CAUGHT BY GOALKEEPER');

                    if (gk.userData.leftArmGroup) gk.userData.leftArmGroup.rotation.set(-1.65, 0.35, -0.40);
                    if (gk.userData.rightArmGroup) gk.userData.rightArmGroup.rotation.set(-1.65, -0.35, 0.40);
                  } else {
                    // PARRY / DIVING SAVE MECHANIC: Punch or tip the ball away to safety
                    playKeeperHitSound(0.98);
                    const parrySide = dx !== 0 ? (dx > 0 ? 1 : -1) : (Math.random() > 0.5 ? 1 : -1);
                    const parryDeflectX = parrySide * (3.5 + Math.random() * 5.0);
                    const parryDeflectY = ballY > 2.15 ? (3.5 + Math.random() * 3.5) : (1.8 + Math.random() * 2.5);
                    const parryDeflectZ = 12.0 + Math.random() * 8.0; // Pushed away towards the field

                    ballVelRef.current.set(parryDeflectX, parryDeflectY, parryDeflectZ);
                    shotPhaseRef.current = 'finished';
                    shotFinishedTimeRef.current = now;
                    shotCurveRef.current = null;
                    curveAccelVecRef.current.set(0, 0, 0);
                    flightPointsRef.current = [];
                    triggerShotOutcome(ballY > 2.25 ? 'BRILLIANT TIP OVER THE BAR' : 'SAVED BY GOALKEEPER');
                  }
                }
              }
            }

            // 4. Goalpost & Crossbar Rigid-Body Collision Solver
            if ((shotPhaseRef.current === 'flying' || shotPhaseRef.current === 'hit_post') && ballPosRef.current.z <= -41.0 && ballPosRef.current.z >= -43.0) {
              const collisionDist = 0.264; // postRadius (0.154m) + ballRadius (0.11m)

              for (let sIdx = 0; sIdx < GOAL_COLLISION_SEGMENTS.length; sIdx++) {
                const seg = GOAL_COLLISION_SEGMENTS[sIdx];
                const lenSq = seg.lenSq;
                let tSeg = 0;
                if (lenSq > 0) {
                  _scratchV3_1.copy(ballPosRef.current).sub(seg.start);
                  tSeg = Math.max(0, Math.min(1, _scratchV3_1.dot(seg.lineVec) / lenSq));
                }
                _scratchV3_2.copy(seg.start).addScaledVector(seg.lineVec, tSeg);
                const distToPost = ballPosRef.current.distanceTo(_scratchV3_2);

                if (distToPost < collisionDist) {
                  // Collision normal pointing outwards from post cylinder axis toward ball center
                  _scratchV3_1.copy(ballPosRef.current).sub(_scratchV3_2);
                  if (_scratchV3_1.lengthSq() < 0.00001) {
                    _scratchV3_1.set(0, 0, 1);
                  } else {
                    _scratchV3_1.normalize();
                  }

                  const normalVel = ballVelRef.current.dot(_scratchV3_1);
                  if (normalVel < 0) { // Ball is moving into post
                    const impactSpeed = ballVelRef.current.length();

                    // Realistic Elastic Restitution (e = 0.82) & Tangential Friction (mu = 0.18)
                    const restitution = 0.82;
                    const friction = 0.18;

                    // vNormal = normal * normalVel
                    _scratchV3_3.copy(_scratchV3_1).multiplyScalar(normalVel);
                    // vTangential = ballVel - vNormal
                    const tangX = ballVelRef.current.x - _scratchV3_3.x;
                    const tangY = ballVelRef.current.y - _scratchV3_3.y;
                    const tangZ = ballVelRef.current.z - _scratchV3_3.z;

                    // Vectorial reflection with energy absorption
                    ballVelRef.current.x = -restitution * _scratchV3_3.x + (1.0 - friction) * tangX;
                    ballVelRef.current.y = -restitution * _scratchV3_3.y + (1.0 - friction) * tangY;
                    ballVelRef.current.z = -restitution * _scratchV3_3.z + (1.0 - friction) * tangZ;

                    // Spin impulse: underside crossbar impact forces steep downward dip
                    if (seg.type === 'crossbar' && _scratchV3_1.y < 0) {
                      ballVelRef.current.y = -Math.abs(ballVelRef.current.y) - 1.2;
                    }

                    // Depenetration correction (push ball outside collision cylinder)
                    ballPosRef.current.copy(_scratchV3_2).addScaledVector(_scratchV3_1, collisionDist + 0.008);

                    // Trigger frame vibration
                    if (goalGroupRef.current) {
                      goalVibrationRef.current = {
                        intensity: Math.min(0.16, impactSpeed * 0.0045),
                        startTime: performance.now(),
                      };
                    }

                    // Transition phase to hit_post so curve stops but ballistic bounce continues
                    shotPhaseRef.current = 'hit_post';
                    if (hitPostTimeRef.current === 0) {
                      hitPostTimeRef.current = now;
                    }
                    shotCurveRef.current = null;
                    curveAccelVecRef.current.set(0, 0, 0);
                    flightPointsRef.current = [];
                    triggerShotOutcome('HIT THE WOODWORK');
                    break;
                  }
                }
              }
            }

            // Helper to accurately classify miss types
            const getMissType = (x: number, y: number) => {
              const isHigh = y > 2.68;
              const isWide = Math.abs(x) > 4.025;

              if (isHigh && !isWide) {
                return 'OVER THE CROSSBAR';
              } else if (isWide) {
                return 'SHOT WIDE';
              } else {
                return 'MISSED SHOT';
              }
            };

            // 5. Continuous Goal Line Crossing & Goal Determination
            const goalLineZ = -42.0;
            const prevZ = prevBallPos.z;
            const currZ = ballPosRef.current.z;

            // Check if ball crossed the goal line plane from in front to behind
            if ((shotPhaseRef.current === 'flying' || shotPhaseRef.current === 'hit_post') && prevZ > goalLineZ && currZ <= goalLineZ) {
              const denom = currZ - prevZ;
              const t = Math.abs(denom) > 0.00001 ? Math.max(0, Math.min(1, (goalLineZ - prevZ) / denom)) : 0.5;
              const crossX = prevBallPos.x + t * (ballPosRef.current.x - prevBallPos.x);
              const crossY = prevBallPos.y + t * (ballPosRef.current.y - prevBallPos.y);

              // Inside dimensions of goal frame: Width [-3.92, +3.92], Height [0.05, 2.65]
              const enteredInsideGoal = Math.abs(crossX) <= 3.92 && crossY <= 2.65 && crossY >= 0.02;

              if (enteredInsideGoal) {
                isGoalScoredRef.current = true;
                shotPhaseRef.current = 'finished';
                shotFinishedTimeRef.current = now;
                shotCurveRef.current = null;
                curveAccelVecRef.current.set(0, 0, 0);
                flightPointsRef.current = [];
                triggerShotOutcome('GOAL');

                // Maintain strong forward trajectory so ball buries deep into the back of net
                if (ballVelRef.current.z > -8.0) {
                  ballVelRef.current.z = -8.0;
                }
              } else {
                isGoalScoredRef.current = false;
                if (shotOutcomeRef.current === null) {
                  shotPhaseRef.current = 'finished';
                  shotFinishedTimeRef.current = now;
                  shotCurveRef.current = null;
                  curveAccelVecRef.current.set(0, 0, 0);
                  flightPointsRef.current = [];
                  triggerShotOutcome(getMissType(crossX, crossY));
                }
              }
            } else if (currZ <= goalLineZ && !isGoalScoredRef.current) {
              // Direct boundary safety check: if ball is behind goal line and within goal opening, trigger GOAL
              const insideGoalNow = Math.abs(ballPosRef.current.x) <= 3.92 && ballPosRef.current.y <= 2.65 && ballPosRef.current.y >= 0.02;
              if (insideGoalNow && (shotPhaseRef.current === 'flying' || shotPhaseRef.current === 'hit_post' || shotOutcomeRef.current === null || shotOutcomeRef.current === 'HIT THE WOODWORK')) {
                isGoalScoredRef.current = true;
                shotPhaseRef.current = 'finished';
                shotFinishedTimeRef.current = now;
                shotCurveRef.current = null;
                curveAccelVecRef.current.set(0, 0, 0);
                flightPointsRef.current = [];
                triggerShotOutcome('GOAL');
              }
            }

            // 6. Solid Goal Net Physical Barrier & Containment Solver
            if (ballPosRef.current.z <= -42.0) {
              if (isGoalScoredRef.current) {
                // A) INSIDE GOAL NET CONTAINMENT: Ball stays locked inside net and loses momentum
                const backNetZ = -45.45;
                if (ballPosRef.current.z <= backNetZ) {
                  ballPosRef.current.z = backNetZ;
                  ballVelRef.current.z = Math.abs(ballVelRef.current.z) * 0.05;
                  ballVelRef.current.x *= 0.15;
                  ballVelRef.current.y *= 0.15;
                }

                if (ballPosRef.current.x < -3.88) {
                  ballPosRef.current.x = -3.88;
                  ballVelRef.current.x = Math.abs(ballVelRef.current.x) * 0.15;
                } else if (ballPosRef.current.x > 3.88) {
                  ballPosRef.current.x = 3.88;
                  ballVelRef.current.x = -Math.abs(ballVelRef.current.x) * 0.15;
                }

                if (ballPosRef.current.y > 2.56) {
                  ballPosRef.current.y = 2.56;
                  ballVelRef.current.y = -Math.abs(ballVelRef.current.y) * 0.15;
                }

                // Front goal line containment barrier: once inside, ball cannot bounce back out past front posts
                if (ballPosRef.current.z > -42.08 && ballVelRef.current.z > 0) {
                  ballPosRef.current.z = -42.08;
                  ballVelRef.current.z = -Math.abs(ballVelRef.current.z) * 0.10;
                }
              } else {
                // B) OUTSIDE GOAL NET SOLID WALL: Missed ball CANNOT pass through sides, top, or back into goal
                const inZNetSpan = ballPosRef.current.z <= -42.0 && ballPosRef.current.z >= -45.85;

                if (inZNetSpan) {
                  // Solid Left Net Side Wall
                  if (ballPosRef.current.x > -4.18 && ballPosRef.current.x < -3.50 && ballPosRef.current.y <= 2.85) {
                    ballPosRef.current.x = -4.18;
                    ballVelRef.current.x = -Math.abs(ballVelRef.current.x) * 0.40;
                  }

                  // Solid Right Net Side Wall
                  if (ballPosRef.current.x < 4.18 && ballPosRef.current.x > 3.50 && ballPosRef.current.y <= 2.85) {
                    ballPosRef.current.x = 4.18;
                    ballVelRef.current.x = Math.abs(ballVelRef.current.x) * 0.40;
                  }

                  // Solid Roof Net Wall
                  if (ballPosRef.current.y < 2.85 && ballPosRef.current.y > 2.35 && Math.abs(ballPosRef.current.x) <= 4.18) {
                    ballPosRef.current.y = 2.85;
                    ballVelRef.current.y = Math.abs(ballVelRef.current.y) * 0.40;
                  }
                }

                // Solid Back Net Wall from behind
                if (ballPosRef.current.z > -45.80 && ballPosRef.current.z < -45.0 && Math.abs(ballPosRef.current.x) <= 4.18 && ballPosRef.current.y <= 2.85 && ballVelRef.current.z > 0) {
                  ballPosRef.current.z = -45.80;
                  ballVelRef.current.z = -Math.abs(ballVelRef.current.z) * 0.40;
                }
              }
            }

            ball.position.copy(ballPosRef.current);
          }

          // 7. Out of Bounds, Post Rebound or Stopped Roll Timeout
          if (shotPhaseRef.current === 'flying' || shotPhaseRef.current === 'hit_post') {
            const flightElapsed = flightStartTimeRef.current > 0 ? (now - flightStartTimeRef.current) : 3000;
            const hitPostElapsed = hitPostTimeRef.current > 0 ? (now - hitPostTimeRef.current) : 0;
            const isHitPost = shotPhaseRef.current === 'hit_post';

            const isOutOfBounds =
              ballPosRef.current.z < -48.0 ||
              ballPosRef.current.z > 20.0 || // Rebounded past midfield / forward out of active box
              Math.abs(ballPosRef.current.x) > 28.0 ||
              ballPosRef.current.y > 16.0;

            const isBallStoppedOnGround =
              (flightElapsed > 250 || isHitPost) &&
              ballVelRef.current.lengthSq() < (isHitPost ? 2.5 : 0.40) &&
              ballPosRef.current.y <= BALL_GROUND_Y + 0.12;

            // Woodwork timeout: If the ball struck the post and bounced outward (no goal),
            // allow a crisp ~0.6-0.9s rebound visual on pitch, then cleanly finish the shot and advance
            const isWoodworkReboundDone = isHitPost && (
              hitPostElapsed > 850 ||
              (hitPostElapsed > 300 && ballVelRef.current.lengthSq() < 3.5) ||
              (hitPostElapsed > 200 && ballPosRef.current.y <= BALL_GROUND_Y + 0.10)
            );

            // Absolute maximum failsafe timeout: no shot flight should ever exceed 3.2 seconds
            const isMaxFlightTimeout = flightElapsed > 3200;

            if (isOutOfBounds || isBallStoppedOnGround || isWoodworkReboundDone || isMaxFlightTimeout) {
              shotPhaseRef.current = 'finished';
              shotFinishedTimeRef.current = now;
              shotCurveRef.current = null;
              curveAccelVecRef.current.set(0, 0, 0);
              flightPointsRef.current = [];
              if (!shotOutcomeRef.current) {
                const isHigh = ballPosRef.current.y > 2.68;
                const isWide = Math.abs(ballPosRef.current.x) > 4.025;
                const missType = isHigh && !isWide ? 'OVER THE CROSSBAR' : isWide ? 'SHOT WIDE' : 'MISSED SHOT';
                triggerShotOutcome(missType);
              }
            }
          }

          // Continuous gameplay loop: Launch 2-Angle Match Replay ONLY when a goal is scored (wait 3.5 seconds for player goal celebrations first)
          if (shotPhaseRef.current === 'finished' && shotFinishedTimeRef.current > 0) {
            const elapsedFinished = now - shotFinishedTimeRef.current;
            const isGoal = isGoalScoredRef.current || shotOutcomeRef.current === 'GOAL';
            const waitTimeBeforeReplay = isGoal ? 3500 : 650; // 3.5s celebration delay on goal before triggering replay camera

            if (elapsedFinished > waitTimeBeforeReplay && !hasTriggeredReplayForShotRef.current) {
              hasTriggeredReplayForShotRef.current = true;
              const isAnyPenaltyMode = isPenaltyTraining || isPenaltyShootoutRef.current || penaltyShootout.isActive || isPenaltyTrainingRef.current;
              if (!isPracticeMode && !isAnyPenaltyMode && isGoal && recordedReplayFramesRef.current.length > 5) {
                startReplaySequence();
              } else {
                advanceToNextTurn();
              }
            } else if (elapsedFinished > 1400 && !isGoalScoredRef.current && shotOutcomeRef.current !== 'GOAL') {
              // Failsafe: If turn advance got stalled for non-goal outcome, force instant reset
              resetToDefaultState();
            }
          }
        }
      }
      }

      // Update Goal Celebration for all players when a team scores: jumping with hands up with smooth ease for 4.5s
      const isGoalCelebration = (shotOutcomeRef.current === 'GOAL' || isGoalScoredRef.current) && shotPhaseRef.current === 'finished' && shotFinishedTimeRef.current > 0;
      if (isGoalCelebration && freeKickGroupRef.current) {
        const elapsedGoal = now - shotFinishedTimeRef.current;
        const celebrationDuration = 4500;
        if (elapsedGoal >= 0 && elapsedGoal <= celebrationDuration) {
          // Smooth easing envelope for fluid initiation and soft landing before reset
          const easeIn = Math.min(1.0, elapsedGoal / 380);
          const easeOut = Math.max(0.0, Math.min(1.0, (celebrationDuration - elapsedGoal) / 450));
          const smoothStep = (t: number) => t * t * (3 - 2 * t);
          const celebrationIntensity = smoothStep(easeIn) * smoothStep(easeOut);

          const jumpPeriod = 720; // ms per smooth rhythmic jump cycle
          const activePlayers = activePlayersListRef.current;

          for (let pIdx = 0; pIdx < activePlayers.length; pIdx++) {
            const child = activePlayers[pIdx];
            if (!child || !child.userData || !child.userData.isPlayerFigure) continue;
            const ud = child.userData;
            const isScoringTeam = ud.teamRole === 'attacker';

            if (!isScoringTeam) {
              // Defending team (conceded goal): stays grounded without celebration
              child.position.y = 0;
              if (ud.headGroup) {
                // Subtle natural head hang in disappointment
                ud.headGroup.rotation.x = THREE.MathUtils.lerp(ud.headGroup.rotation.x, 0.20, 0.08 * celebrationIntensity);
              }
              continue;
            }

            const pPos = child.position;
            // Unique natural phase offset based on player coordinates to avoid robotic unison
            const phaseOffset = Math.abs(Math.sin((pPos.x * 2.3 + pPos.z * 1.7) || 0.73)) * 0.32;
            const cycleProgress = ((elapsedGoal / jumpPeriod) + phaseOffset) % 1.0;

            // Smooth parabolic jump with ease:
            // 0.00 - 0.12: fluid crouching prep
            // 0.12 - 0.82: airborne jump apex with sine ease
            // 0.82 - 1.00: soft knee cushion on landing
            let jumpY = 0;
            let legBend = 0;

            if (cycleProgress < 0.12) {
              const crouchT = cycleProgress / 0.12;
              const crouchEase = Math.sin(crouchT * Math.PI);
              jumpY = -0.04 * crouchEase * celebrationIntensity;
              legBend = 0.22 * crouchEase * celebrationIntensity;
            } else if (cycleProgress < 0.82) {
              const airT = (cycleProgress - 0.12) / 0.70;
              const airCurve = Math.sin(airT * Math.PI);
              jumpY = 0.55 * airCurve * celebrationIntensity;
              legBend = -0.22 * airCurve * celebrationIntensity;
            } else {
              const landT = (cycleProgress - 0.82) / 0.18;
              const landEase = Math.sin(landT * Math.PI);
              jumpY = -0.03 * landEase * celebrationIntensity;
              legBend = 0.18 * landEase * celebrationIntensity;
            }

            child.position.y = jumpY;

            // Hands Up Celebration Animation (Both hands lifted straight up towards the sky overhead)
            const pumpWave = Math.sin(elapsedGoal * 0.011 + phaseOffset * 6);
            const cheerSway = Math.cos(elapsedGoal * 0.008 + phaseOffset * 4);

            if (ud.leftArmGroup) {
              // High upward reach: rotation.x around -2.85 rad raises arm from hanging down to high overhead above the head
              const targetLeftX = THREE.MathUtils.lerp(0, -2.85 + pumpWave * 0.22, celebrationIntensity);
              const targetLeftZ = THREE.MathUtils.lerp(0, -0.32 + cheerSway * 0.08, celebrationIntensity);
              const targetLeftY = THREE.MathUtils.lerp(0, cheerSway * 0.08, celebrationIntensity);
              ud.leftArmGroup.rotation.x = THREE.MathUtils.lerp(ud.leftArmGroup.rotation.x, targetLeftX, 0.22);
              ud.leftArmGroup.rotation.z = THREE.MathUtils.lerp(ud.leftArmGroup.rotation.z, targetLeftZ, 0.22);
              ud.leftArmGroup.rotation.y = THREE.MathUtils.lerp(ud.leftArmGroup.rotation.y, targetLeftY, 0.22);
            }

            if (ud.rightArmGroup) {
              // High upward reach: rotation.x around -2.85 rad raises arm from hanging down to high overhead above the head
              const targetRightX = THREE.MathUtils.lerp(0, -2.85 + pumpWave * 0.22, celebrationIntensity);
              const targetRightZ = THREE.MathUtils.lerp(0, 0.32 - cheerSway * 0.08, celebrationIntensity);
              const targetRightY = THREE.MathUtils.lerp(0, -cheerSway * 0.08, celebrationIntensity);
              ud.rightArmGroup.rotation.x = THREE.MathUtils.lerp(ud.rightArmGroup.rotation.x, targetRightX, 0.22);
              ud.rightArmGroup.rotation.z = THREE.MathUtils.lerp(ud.rightArmGroup.rotation.z, targetRightZ, 0.22);
              ud.rightArmGroup.rotation.y = THREE.MathUtils.lerp(ud.rightArmGroup.rotation.y, targetRightY, 0.22);
            }

            if (ud.leftLegGroup) {
              ud.leftLegGroup.rotation.x = THREE.MathUtils.lerp(ud.leftLegGroup.rotation.x, legBend, 0.25);
            }
            if (ud.rightLegGroup) {
              ud.rightLegGroup.rotation.x = THREE.MathUtils.lerp(ud.rightLegGroup.rotation.x, legBend, 0.25);
            }

            if (ud.headGroup) {
              // Head tilted up looking up to the sky in celebratory triumph
              const targetHeadX = THREE.MathUtils.lerp(0, -0.38, celebrationIntensity);
              const targetHeadY = THREE.MathUtils.lerp(0, cheerSway * 0.12, celebrationIntensity);
              ud.headGroup.rotation.x = THREE.MathUtils.lerp(ud.headGroup.rotation.x, targetHeadX, 0.18);
              ud.headGroup.rotation.y = THREE.MathUtils.lerp(ud.headGroup.rotation.y, targetHeadY, 0.18);
            }
          }
        }
      }

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const aspect = container.clientWidth / Math.max(1, container.clientHeight);
      camera.aspect = aspect;
      camera.fov = getAdaptiveCameraFov(aspect);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(getTargetPixelRatio());
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
      renderer.dispose();
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      freeKickGroupRef.current = null;
      fansListRef.current = [];
      netMeshesRef.current = [];
      grandstandMeshesRef.current = [];
    };
  }, []); // Static stadium initialization runs ONCE on mount

  // Instantaneous Free Kick Scenario Update (0ms delay on resets/randomize)
  useEffect(() => {
    const freeKickGroup = freeKickGroupRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!freeKickGroup || !camera || !controls) return;

    // Clear previous free kick entities instantly
    freeKickGroup.clear();
    shotPhaseRef.current = 'idle';

    // Goal Line at z = -42.0 (matches exact pitch goal line marking), Goal Center at (0, 1.34, -42.0)
    const goalLineZ = -42.0;
    const goalCenter = new THREE.Vector3(0, 1.34, goalLineZ);

    // Free Kick Ball Coordinates (shifted 5% away from the goal line / wall)
    const effectiveFkDistance = fkDistance * 1.05;
    const fkBallPos = new THREE.Vector3(fkXOffset, 0.3015, goalLineZ + effectiveFkDistance);
    fkBallPosRef.current.copy(fkBallPos);

    // Direction vector from Ball -> Goal Center
    const dirToGoal = goalCenter.clone().sub(fkBallPos).normalize();
    const angleToGoal = Math.atan2(dirToGoal.x, dirToGoal.z);
    angleToGoalRef.current = angleToGoal;

    // Perpendicular vector for Defensive Wall line
    const wallPerp = new THREE.Vector3(-dirToGoal.z, 0, dirToGoal.x).normalize();

    const isLeftSide = fkXOffset < -1.5;
    const isRightSide = fkXOffset > 1.5;

    const rightPerp = new THREE.Vector3(-dirToGoal.z, 0, dirToGoal.x).normalize();

    const container = mountRef.current;
    const cWidth = container ? container.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1200);
    const cHeight = container && container.clientHeight > 0 ? container.clientHeight : (typeof window !== 'undefined' ? Math.max(1, window.innerHeight) : 800);
    const aspect = cWidth / Math.max(1, cHeight);
    const isLandscape = aspect >= 1.05;

    const targetFov = getAdaptiveCameraFov(aspect);

    // On big screen / desktop: shifted camera backwards a bit (from 14.5m to 17.2m-18.2m) and a very little bit downwards (from 5.8m to 4.9m-5.1m)
    const isBigScreen = isLandscape || cWidth >= 1024;
    const camBackDist = isBigScreen ? (cWidth >= 1600 ? 18.2 : 17.2) : 12.8;
    const camHeight = isBigScreen ? (cWidth >= 1600 ? 4.9 : 5.1) : 4.6;

    // Position camera behind the ball along the shot line
    const camPos = fkBallPos.clone().sub(dirToGoal.clone().multiplyScalar(camBackDist));
    camPos.y = camHeight;

    // Camera look-at target: focused straight down the shot trajectory towards the wall and goal mouth
    let targetPos: THREE.Vector3;
    if (isBigScreen) {
      const lookAheadDist = Math.min(18.0, Math.max(9.0, fkBallPos.distanceTo(goalCenter) * 0.48));
      targetPos = fkBallPos.clone().add(dirToGoal.clone().multiplyScalar(lookAheadDist));
      targetPos.y = 1.25;
    } else {
      targetPos = fkBallPos.clone().add(dirToGoal.clone().multiplyScalar(10.0));
      targetPos.y = 1.05;
    }

    if (!isCamInitializedRef.current) {
      isCamInitializedRef.current = true;
      const introFov = targetFov + 8;
      camera.fov = introFov;
      camera.updateProjectionMatrix();

      // Elevated stadium intro perspective that glides smoothly into the first free kick shooting position
      const introCamPos = new THREE.Vector3(
        camPos.x - dirToGoal.z * 14 - dirToGoal.x * 8,
        camPos.y + 12.5,
        camPos.z - dirToGoal.z * 16
      );
      const introTargetPos = fkBallPos.clone().add(dirToGoal.clone().multiplyScalar(6.0));
      introTargetPos.y = 1.6;

      camera.position.copy(introCamPos);
      controls.target.copy(introTargetPos);
      controls.update();

      startCamPosRef.current.copy(introCamPos);
      startCamLookAtRef.current.copy(introTargetPos);
      startCamFovRef.current = introFov;

      targetCamPosRef.current.copy(camPos);
      targetCamLookAtRef.current.copy(targetPos);
      targetCamFovRef.current = targetFov;

      camTransitionDurationRef.current = 2900; // Smooth 2.9s glide into free kick position matching the 3s intro
      transitionStartTimeRef.current = performance.now();
      isTransitioningCamRef.current = true;
    } else {
      startCamPosRef.current.copy(camera.position);
      startCamLookAtRef.current.copy(controls.target);
      startCamFovRef.current = camera.fov;
      targetCamPosRef.current.copy(camPos);
      targetCamLookAtRef.current.copy(targetPos);
      targetCamFovRef.current = targetFov;
      camTransitionDurationRef.current = 650;
      transitionStartTimeRef.current = performance.now();
      isTransitioningCamRef.current = true;
    }

    // Soccer Ball Mesh (0.3015m radius - 10% smaller)
    const ballTex = createSoccerBallTexture();
    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTex,
      roughness: 0.15,
      metalness: 0.05,
    });
    const ballMesh = new THREE.Mesh(BALL_GEO, ballMat);
    ballMesh.position.copy(fkBallPos);
    ballMesh.castShadow = true;
    ballMesh.receiveShadow = true;
    freeKickGroup.add(ballMesh);
    ballMeshRef.current = ballMesh;

    const isPlayerKicking = currentTurn === 'player';

    // Match Kits Resolution: Guarantees home & away teams and GK NEVER clash or look identical
    const activeOpponent = currentOpponentCountry || opponentCountry;
    const resolvedOppCountryCode = isOnlineMatch
      ? effectiveOppCountryCode
      : (activeOpponent ? activeOpponent.code : (country.code.toLowerCase() === 'br' ? 'ar' : 'br'));
    const matchKits = resolveMatchKits(country.code, resolvedOppCountryCode);
    const attackerKit = isPlayerKicking ? matchKits.homeKit : matchKits.awayKit;
    const defenderKit = isPlayerKicking ? matchKits.awayKit : matchKits.homeKit;
    const gkKit = matchKits.gkKit;

    // A) THE ATTACKING FREE KICK TAKER (#10 Star Captain)
    const attackerCountryCode = isPlayerKicking ? country.code : resolvedOppCountryCode;
    const attackerTeamCode = isPlayerKicking
      ? getCountryAbbr(country)
      : getCountryAbbr(activeOpponent || resolvedOppCountryCode);

    const defenderCountryCode = isPlayerKicking ? resolvedOppCountryCode : country.code;
    const defenderTeamCode = isPlayerKicking
      ? getCountryAbbr(activeOpponent || resolvedOppCountryCode)
      : getCountryAbbr(country);
    const effectiveDefenderKit = defenderKit;

    // Player kicker has a sleek athletic side-part sweep or spiky crest in rich chestnut / golden amber,
    // while AI kicker has a stylish modern crop in deep obsidian black or platinum
    const kickerHairColor = isPlayerKicking ? '#451a03' : '#171717';
    const kickerHairStyle: 'sweep' | 'spiky' = isPlayerKicking ? 'sweep' : 'spiky';

    const kickerFigure = createPlayerFigure({
      countryCode: attackerCountryCode,
      customKit: attackerKit,
      numberStr: '10',
      teamCode: attackerTeamCode,
      hasArmband: true,
      pose: 'kicker',
      teamRole: 'attacker',
      hairColor: kickerHairColor,
      hairStyle: kickerHairStyle,
    });

    // Swapped kicker footedness based on side of free kick:
    // Left side (fkXOffset < -1.0): Left-footed taker (strikes with left foot)
    // Right side (fkXOffset > 1.0): Right-footed taker (strikes with right foot)
    // Central: Alternates based on position ID
    const isLeftFooted = fkXOffset < -1.0 || (Math.abs(fkXOffset) <= 1.0 && (activePosition?.id ?? 0) % 2 === 0);
    kickerFigure.userData.isLeftFooted = isLeftFooted;

    const baseKickerOffset = 1.25 * 0.77; // ~0.96m (shifted 23% closer laterally)
    const kickerSideMultiplier = (isLeftSide || isRightSide) ? 1.40 : 1.0; // 40% extra side offset on wide kicks
    const kickerOffset = baseKickerOffset * kickerSideMultiplier;

    // Left-footed taker approaches from the RIGHT side (+rightPerp), Right-footed taker from the LEFT (-rightPerp)
    const kickerSideDir = isLeftFooted ? rightPerp.clone() : rightPerp.clone().negate();

    const kickerPos = fkBallPos.clone()
      .sub(dirToGoal.clone().multiplyScalar(2.8 * 0.77 * 1.10 * 1.07 * 1.05 * 1.05)) // Shifted backwards by an additional 5%
      .add(kickerSideDir.multiplyScalar(kickerOffset)); // dynamic side offset applied
    kickerPos.y = 0;
    kickerFigure.position.copy(kickerPos);

    // Save kicker start & target positions for run-up animation
    kickerStartPosRef.current.copy(kickerPos);
    const targetRunPos = fkBallPos.clone()
      .sub(dirToGoal.clone().multiplyScalar(0.48))
      .add(kickerSideDir.clone().multiplyScalar(0.20));
    targetRunPos.y = 0;
    kickerTargetPosRef.current.copy(targetRunPos);

    const dirToBall = fkBallPos.clone().sub(kickerPos).normalize();
    const kickerFacingAngle = Math.atan2(dirToBall.x, dirToBall.z);
    kickerFacingAngleRef.current = kickerFacingAngle;
    kickerFigure.rotation.y = kickerFacingAngle;
    kickerFigure.userData.isKicker = true;
    freeKickGroup.add(kickerFigure);
    kickerGroupRef.current = kickerFigure;

    // B) DEFENSIVE WALL (Brought 12% closer ~11.6m - 14.1m from ball - OMITTED during penalties)
    const distToGoalTotal = fkBallPos.distanceTo(goalCenter);
    const wallDist = Math.min(14.08, Math.max(11.62, distToGoalTotal * 0.4576));
    // In real football, defensive wall covers the near post, leaving the far post open for straight or curling shots
    const nearPostX = fkXOffset < -1.0 ? -2.6 : (fkXOffset > 1.0 ? 2.6 : 1.1);
    const wallTarget = new THREE.Vector3(nearPostX, 1.0, goalLineZ);
    const dirToWallTarget = wallTarget.clone().sub(fkBallPos).normalize();

    const wallCenter = fkBallPos.clone().add(dirToWallTarget.multiplyScalar(wallDist));
    wallCenter.y = 0;

    const occupiedPositions: THREE.Vector3[] = [
      fkBallPos.clone(),
      kickerPos.clone(),
      new THREE.Vector3(0, 0, goalLineZ), // Goalkeeper position
      new THREE.Vector3(-3.66, 0, goalLineZ), // Left goal post
      new THREE.Vector3(3.66, 0, goalLineZ),  // Right goal post
    ];

    const defCountryCode = defenderCountryCode;
    const defTeamCode = defenderTeamCode;

    const isPenaltyMode = isPenaltyTraining || isPenaltyShootoutRef.current || penaltyShootout.isActive;

    const wallDefendersList: THREE.Group[] = [];

    if (!isPenaltyMode && wallSize > 0) {
      const wallHairStyles: ('spiky' | 'crop' | 'sweep' | 'curls' | 'dreads' | 'afro' | 'buzz' | 'bald')[] = [
        'spiky',
        'sweep',
        'afro',
        'curls',
        'dreads',
        'buzz',
        'bald',
      ];

      const wallHairColors = [
        '#171717', // Jet Black
        '#eab308', // Golden Blonde
        '#451a03', // Deep Espresso Brown
        '#9a3412', // Auburn / Copper Red
        '#78350f', // Warm Chestnut Brown
        '#f3e8c8', // Bleached / Platinum Blonde
        '#292524', // Dark Charcoal
      ];

      for (let idx = 0; idx < wallSize; idx++) {
        const defender = createPlayerFigure({
          countryCode: defCountryCode,
          customKit: effectiveDefenderKit,
          skinColor: idx % 2 === 0 ? '#e29b8c' : '#f3a29c',
          hairColor: wallHairColors[idx % wallHairColors.length],
          hairStyle: wallHairStyles[idx % wallHairStyles.length],
          numberStr: `${idx + 2}`,
          teamCode: defTeamCode,
          pose: 'wall',
          teamRole: 'defender',
        });

        const offsetFactor = (idx - (wallSize - 1) / 2) * 0.78;
        const defPos = wallCenter.clone().add(wallPerp.clone().multiplyScalar(offsetFactor));
        defPos.y = 0;
        defender.position.copy(defPos);
        defender.rotation.y = angleToGoal + Math.PI; // Facing kicker and ball
        freeKickGroup.add(defender);
        wallDefendersList.push(defender);

        occupiedPositions.push(defPos.clone());
      }
    }
    wallDefendersRef.current = wallDefendersList;

    // C) THE GOALKEEPER (Spawned on realistic side opposite to free kick angle, or center)
    const startGkX = calculateRealisticGoalkeeperStartX(
      fkBallPos.x,
      isPenaltyTraining || isPenaltyShootoutRef.current
    );
    gkReadyXRef.current = startGkX;

    const gkPos = new THREE.Vector3(startGkX, 0, goalLineZ);
    const dirGkToBall = fkBallPos.clone().sub(gkPos);
    const gkAngleToBall = Math.atan2(dirGkToBall.x, dirGkToBall.z);

    const gkProfile = getTeamGoalkeeperProfile(defCountryCode);
    const gkFigure = createPlayerFigure({
      jerseyColor: gkProfile.jerseyColor,
      shortsColor: gkProfile.shortsColor,
      socksColor: gkProfile.socksColor,
      collarColor: gkProfile.collarColor,
      skinColor: gkProfile.skinColor,
      hairColor: gkProfile.hairColor,
      hairStyle: gkProfile.hairStyle,
      glovesColor: gkProfile.glovesColor,
      numberStr: '1',
      teamCode: defTeamCode,
      pose: 'gk',
      teamRole: 'defender',
    });
    gkFigure.position.copy(gkPos);
    gkFigure.rotation.y = gkAngleToBall; // Facing field and kicker
    freeKickGroup.add(gkFigure);
    gkGroupRef.current = gkFigure;

    // D) RANDOMIZED PLAYERS IN PENALTY BOX (Denser coverage for HARD positions; OMITTED in penalty mode so ONLY kicker and keeper are on the pitch)
    const boxPlayersList: THREE.Group[] = [];
    if (!isPenaltyMode) {
      const skinPalette = ['#e29b8c', '#f3a29c', '#d97706', '#8d5524', '#c68642', '#ffdbac'];
      const hairPalette = [
        '#171717', // Jet Black
        '#eab308', // Golden Blonde
        '#451a03', // Dark Espresso
        '#9a3412', // Auburn / Copper Red
        '#78350f', // Warm Chestnut
        '#f3e8c8', // Bleached Platinum
      ];
      const boxHairStyles: ('spiky' | 'crop' | 'sweep' | 'curls' | 'dreads' | 'afro' | 'buzz' | 'bald')[] = [
        'sweep',
        'spiky',
        'afro',
        'curls',
        'dreads',
        'buzz',
        'bald',
      ];

      const boxGoalTarget = new THREE.Vector3(0, 0, goalLineZ);
      const leftPostPos = new THREE.Vector3(-3.66, 0, goalLineZ);
      const rightPostPos = new THREE.Vector3(3.66, 0, goalLineZ);

      const wallToGoalDist = wallCenter.distanceTo(boxGoalTarget);

      // Spawn 4 players in the box (2 attacking teammates, 2 defending opponents)
      const numBoxPlayers = 4;

      // Deterministic prime fallback positions inside penalty area
      const fallbackPositions = [
        new THREE.Vector3(-3.8, 0, goalLineZ + 9.5),  // Left penalty channel (Attacker #1)
        new THREE.Vector3(3.8, 0, goalLineZ + 9.5),   // Right penalty channel (Defender #1)
        new THREE.Vector3(0.0, 0, goalLineZ + 12.0),  // Penalty spot / top of box (Attacker #2)
        new THREE.Vector3(-1.8, 0, goalLineZ + 6.8),  // 6-yard edge (Defender #2)
      ];

      for (let pIdx = 0; pIdx < numBoxPlayers; pIdx++) {
        const isAttacker = pIdx % 2 === 0;

        let placed = false;
        const minPlayerDist = 3.2; // Wide separation prevents cramping
        const candidatePos = new THREE.Vector3();

        for (let attempt = 0; attempt < 60; attempt++) {
          // Deterministic pseudo-random seeding so players never jump around
          const seed1 = Math.sin(pIdx * 12.9898 + fkDistance * 78.233 + fkXOffset * 43.12 + attempt * 9.1) * 43758.5453;
          const seed2 = Math.sin(pIdx * 34.123 + fkDistance * 19.821 + fkXOffset * 82.34 + attempt * 17.3) * 12345.6789;
          const rand1 = seed1 - Math.floor(seed1);
          const rand2 = seed2 - Math.floor(seed2);

          const lerpFactor = 0.22 + rand1 * 0.48;
          const axisPos = wallCenter.clone().lerp(boxGoalTarget, lerpFactor);

          const sideOffset = (rand2 * 2 - 1) * 7.5;
          const testPos = axisPos.clone().add(rightPerp.clone().multiplyScalar(sideOffset));
          testPos.y = 0;

          if (
            Math.abs(testPos.x) > 14.5 ||
            testPos.z < goalLineZ + 3.2 ||
            testPos.distanceTo(leftPostPos) < 3.2 ||
            testPos.distanceTo(rightPostPos) < 3.2
          ) {
            continue;
          }

          let tooClose = false;
          for (const occ of occupiedPositions) {
            if (testPos.distanceTo(occ) < minPlayerDist) {
              tooClose = true;
              break;
            }
          }

          if (!tooClose) {
            candidatePos.copy(testPos);
            occupiedPositions.push(testPos.clone());
            placed = true;
            break;
          }
        }

        if (!placed) {
          // Use reliable fallback position
          candidatePos.copy(fallbackPositions[pIdx % fallbackPositions.length]);
          occupiedPositions.push(candidatePos.clone());
          placed = true;
        }

        if (placed) {
          const boxCountryCode = isAttacker ? attackerCountryCode : defenderCountryCode;
          const teamCodeStr = isAttacker ? attackerTeamCode : defenderTeamCode;
          const boxKit = isAttacker ? attackerKit : effectiveDefenderKit;

          const boxPlayer = createPlayerFigure({
            countryCode: boxCountryCode,
            customKit: boxKit,
            skinColor: skinPalette[pIdx % skinPalette.length],
            hairColor: hairPalette[pIdx % hairPalette.length],
            hairStyle: boxHairStyles[pIdx % boxHairStyles.length],
            numberStr: `${pIdx + 3}`,
            teamCode: teamCodeStr,
            teamRole: isAttacker ? 'attacker' : 'defender',
          });

          boxPlayer.position.copy(candidatePos);

          const dirToBallVector = fkBallPos.clone().sub(candidatePos).normalize();
          const faceAngle = Math.atan2(dirToBallVector.x, dirToBallVector.z);
          boxPlayer.rotation.y = faceAngle;

          freeKickGroup.add(boxPlayer);
          boxPlayersList.push(boxPlayer);
        }
      }
    }
    boxPlayersRef.current = boxPlayersList;
    activePlayersListRef.current = [kickerFigure, ...wallDefendersList, gkFigure, ...boxPlayersList];

    // E) 3D MOVING AIM ARROW & 3D SLINGSHOT TRAJECTORY VISUALIZER
    const aimArrowMesh = create3DAimArrow();
    aimArrowMesh.visible = currentTurn === 'player';
    freeKickGroup.add(aimArrowMesh);
    aimArrowGroupRef.current = aimArrowMesh;

    const slingshotMesh = create3DSlingshotVisualizer();
    slingshotMesh.visible = currentTurn === 'player';
    freeKickGroup.add(slingshotMesh);
    slingshotGroupRef.current = slingshotMesh;

    targetRingRef.current = null;
  }, [country, opponentCountry, currentOpponentCountry, fkDistance, fkXOffset, targetCorner, wallSize, currentTurn, isPenaltyTraining, penaltyShootout.isActive, freeKickEpoch]);

  // Handle Controls Auto-Rotate Toggle
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  const currentMaxCurve = getDynamicMaxCurve(power);
  const isAtCurveLimit = Math.abs(curveAmount) >= currentMaxCurve - 0.05;

  return (
    <div 
      onClick={handleContainerClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="fixed inset-0 w-full h-full h-[100dvh] max-h-[100dvh] bg-sky-400 text-white overflow-hidden select-none font-sans cursor-grab active:cursor-grabbing touch-none"
    >
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Simple Clean Themed Match Loading Screen */}
      <AnimatePresence>
        {sceneLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-8 bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 text-white select-none pointer-events-auto overflow-hidden font-sans"
          >
            {/* Ambient Background Stadium Glows */}
            <div className="absolute -top-24 -left-24 w-80 sm:w-96 h-80 sm:h-96 bg-white/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-80 sm:w-96 h-80 sm:h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] sm:w-[600px] h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top spacer for vertical balance */}
            <div className="w-full h-8" />

            {/* Centered Rotating Football Emblem */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-2xl animate-pulse" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2.0, ease: 'linear' }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-[3.5px] border-black shadow-[0_6px_0_0_#000] flex items-center justify-center relative z-10"
              >
                <FontAwesomeIcon icon={faFutbol} className="w-12 h-12 sm:w-14 sm:h-14 text-black" />
              </motion.div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col gap-2 pb-4 sm:pb-6">
              <div className="w-full bg-slate-950/85 border-[3px] border-black rounded-full p-1 shadow-[0_4px_0_0_#000] overflow-hidden">
                <div
                  className="h-3 sm:h-3.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 transition-all duration-75 relative overflow-hidden"
                  style={{ width: `${Math.max(10, loadingProgress)}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.3)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.3)_50%,rgba(255,255,255,0.3)_75%,transparent_75%,transparent)] bg-[length:12px_12px] animate-[pulse_1s_ease-in-out_infinite]" />
                </div>
              </div>
              <div className="flex items-center justify-between px-2 text-xs sm:text-sm font-black uppercase tracking-wider text-amber-200 drop-shadow-md">
                <span>LOADING MATCH...</span>
                <span>{loadingProgress}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Match Results Screen Overlay on Game Over */}
      <AnimatePresence>
        {showResultsModal && isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden pointer-events-auto bg-slate-900 overscroll-y-contain touch-pan-y"
          >
            {isWagerMatch ? (
              <WagerResultsPage
                country={currentLocalCountry}
                opponentCountry={currentOpponentCountry}
                homeScore={homeScore}
                awayScore={awayScore}
                homePenalties={penaltyShootout.isActive ? penaltyShootout.homePenaltiesScore : undefined}
                awayPenalties={penaltyShootout.isActive ? penaltyShootout.awayPenaltiesScore : undefined}
                matchStats={matchStats}
                onlineMatchRoom={onlineMatchRoom}
                localPlayerName={localPlayerName}
                localPlayerProfilePicture={localPlayerProfilePicture}
                oppPlayerName={isOnlineMatch ? oppPlayerName : (currentOpponentCountry?.name || 'CPU Rival')}
                oppPlayerProfilePicture={oppPlayerProfilePicture}
                isOpponentDisconnected={isOnlineMatch ? (isOpponentDisconnected || isOpponentQuitModalOpen || Boolean(onlineMatchRoom?.isOpponentDisconnected || onlineMatchRoom?.status === 'opponent_left' || onlineMatchManager.currentRoom?.isOpponentDisconnected || onlineMatchManager.currentRoom?.status === 'opponent_left')) : false}
                onEarnCoins={onEarnCoins}
                onPlayAgain={() => handlePlayAgain()}
                onReturnToMenu={onBack}
                onReturnToWagerArena={() => {
                  if (onReselectTeam) onReselectTeam();
                  else onBack();
                }}
              />
            ) : isSurvival ? (
              <SurvivalOnlineResultsPage
                country={currentLocalCountry}
                opponentCountry={currentOpponentCountry}
                playerLives={isOnlineMatch ? (isLocalHost ? hostSurvivalLives : guestSurvivalLives) : survivalLives}
                opponentLives={isOnlineMatch ? (isLocalHost ? guestSurvivalLives : hostSurvivalLives) : aiSurvivalLives}
                survivalStreak={survivalStreak}
                bestStreak={survivalBestStreak}
                survivalScore={survivalScore}
                onlineMatchRoom={onlineMatchRoom}
                localPlayerName={localPlayerName}
                localPlayerProfilePicture={localPlayerProfilePicture}
                oppPlayerName={isOnlineMatch ? oppPlayerName : (currentOpponentCountry?.name || 'CPU Rival')}
                oppPlayerProfilePicture={oppPlayerProfilePicture}
                isOpponentDisconnected={isOnlineMatch ? (isOpponentDisconnected || isOpponentQuitModalOpen || Boolean(onlineMatchRoom?.isOpponentDisconnected || onlineMatchRoom?.status === 'opponent_left' || onlineMatchManager.currentRoom?.isOpponentDisconnected || onlineMatchManager.currentRoom?.status === 'opponent_left')) : false}
                onPlayAgain={() => handlePlayAgain()}
                onReturnToMenu={onBack}
              />
            ) : (
              <MatchResultsPage
                country={currentLocalCountry}
                opponentCountry={currentOpponentCountry}
                homeScore={homeScore}
                awayScore={awayScore}
                homePenalties={penaltyShootout.isActive ? penaltyShootout.homePenaltiesScore : undefined}
                awayPenalties={penaltyShootout.isActive ? penaltyShootout.awayPenaltiesScore : undefined}
                roundData={roundResultData || undefined}
                matchStats={matchStats}
                titleMode={titleMode}
                onlineMatchRoom={onlineMatchRoom}
                localPlayerName={localPlayerName}
                localPlayerProfilePicture={localPlayerProfilePicture}
                oppPlayerName={oppPlayerName}
                oppPlayerProfilePicture={oppPlayerProfilePicture}
                isOpponentDisconnected={isOpponentDisconnected || isOpponentQuitModalOpen || Boolean(onlineMatchRoom?.isOpponentDisconnected || onlineMatchRoom?.status === 'opponent_left' || onlineMatchManager.currentRoom?.isOpponentDisconnected || onlineMatchManager.currentRoom?.status === 'opponent_left')}
                onPlayAgain={() => handlePlayAgain()}
                onOpponentCountryChange={(newC) => setCurrentOpponentCountry(newC)}
                onLocalCountryChange={(newC) => setCurrentLocalCountry(newC)}
                onReselectTeam={() => {
                  if (onReselectTeam) onReselectTeam();
                  else onBack();
                }}
                onReturnToMenu={onBack}
                onReturnToDivisions={
                  onReturnToDivisions
                    ? () => onReturnToDivisions(homeScore, awayScore)
                    : undefined
                }
                onReturnToTournament={
                  onReturnToTournament
                    ? () =>
                        onReturnToTournament(
                          homeScore,
                          awayScore,
                          penaltyShootout.isActive ? penaltyShootout.homePenaltiesScore : undefined,
                          penaltyShootout.isActive ? penaltyShootout.awayPenaltiesScore : undefined
                        )
                    : undefined
                }
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Survival Game Over Modal */}
      <SurvivalGameOverModal
        isOpen={showSurvivalGameOver}
        streak={survivalStreak}
        score={survivalScore}
        isNewBest={false}
        onReviveWithAd={() => {
          setHasUsedSurvivalRevive(true);
          setShowSurvivalGameOver(false);
          setSurvivalLives(1);
          survivalLivesRef.current = 1;
          resetToDefaultState();
        }}
        onPlayAgain={() => {
          setShowSurvivalGameOver(false);
          setSurvivalLives(3);
          survivalLivesRef.current = 3;
          setSurvivalStreak(0);
          survivalStreakRef.current = 0;
          setSurvivalScore(0);
          setHasUsedSurvivalRevive(false);
          setSuperpowerCharge(0);
          resetToDefaultState();
        }}
        onExit={onBack}
        canRevive={!hasUsedSurvivalRevive}
      />

      {/* Penalty Shootout Announcement Modal (Text-Only) */}
      <AnimatePresence>
        {showPenaltyAnnouncement && !showResultsModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs pointer-events-auto"
          >
            <div className="bg-amber-400 border-[4px] border-black rounded-[24px] p-6 sm:p-8 max-w-md w-full shadow-[0_8px_0_0_#000] text-center flex flex-col items-center gap-3">
              <span className="font-black text-xs uppercase tracking-widest bg-black text-amber-300 px-3.5 py-1 rounded-full">
                FULL TIME DRAW • {homeScore} - {awayScore}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-black tracking-tight">
                PENALTY SHOOTOUT
              </h2>
              <p className="text-xs sm:text-sm font-bold text-black/90 uppercase tracking-wide leading-relaxed">
                The match has ended in a draw. Proceeding to a 5-kick penalty shootout to decide the winner.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Layout Bar: Dynamically stretches across the screen based on screen width */}
      {!isReplayActive && !showResultsModal && (
        <header className="absolute top-0 left-0 right-0 w-full p-2 sm:p-3 md:p-4 lg:p-5 z-20 pointer-events-none flex flex-col md:flex-row items-start md:items-start justify-between gap-2 md:gap-4">
        
        {/* Left Column: Scoreboard or Practice Drill HUD + Match Outcome Banner */}
        <div className="flex flex-col items-start gap-1.5 sm:gap-2 md:gap-2.5 pointer-events-auto">
          {isSurvival ? (
            <div id="survival-hud-container" className="flex flex-col items-start gap-1.5 sm:gap-2">
              {/* TOP: Health Score & Dual Player Lives Card (User & Opponent with Flags, Names, and Health Hearts) */}
              <div id="survival-health-score-card" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-xs text-black border-[2.5px] md:border-[3px] border-black shadow-[0_3px_0_0_#000] md:shadow-[0_4px_0_0_#000] rounded-[14px] sm:rounded-[16px] p-1.5 sm:p-2 select-none min-w-[260px] sm:min-w-[320px]">
                {/* Local Player Health & Lives Card */}
                <div id="survival-player-health-card" className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[10px] border-[1.5px] transition-all flex-1 ${
                  (isOnlineMatch ? isMyOnlineTurn : currentTurn === 'player') ? 'bg-amber-100/90 border-amber-500 shadow-xs ring-2 ring-amber-400/40' : 'bg-slate-50/90 border-slate-300'
                }`}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isOnlineMatch && (
                      <div className="w-5.5 h-5.5 rounded-full overflow-hidden border-[1.5px] border-black bg-white shadow-2xs shrink-0">
                        <img
                          src={localPlayerProfilePicture}
                          alt={localPlayerName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(localPlayerName || 'You', 0);
                          }}
                        />
                      </div>
                    )}
                    <LazyFlagImage
                      src={getFlagUrl(country.code)}
                      alt={country.name}
                      className="w-5.5 h-3.5 sm:w-6 sm:h-4 rounded-[3px] overflow-hidden shrink-0 border border-black shadow-2xs"
                    />
                    <span className="font-black text-xs uppercase tracking-tight text-black truncate max-w-[80px] sm:max-w-[110px]">
                      {country.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {[1, 2, 3].map((heartIdx) => {
                      const myLives = isOnlineMatch
                        ? (isLocalHost ? hostSurvivalLives : guestSurvivalLives)
                        : survivalLives;
                      return (
                        <Heart
                          key={`my-life-${heartIdx}`}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            heartIdx <= myLives
                              ? 'text-rose-500 fill-rose-500'
                              : 'text-slate-300 fill-slate-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                <span className="text-[10px] font-black text-slate-400 uppercase text-center hidden sm:block">VS</span>

                {/* Opponent Health & Lives Card */}
                <div id="survival-opponent-health-card" className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[10px] border-[1.5px] transition-all flex-1 ${
                  (isOnlineMatch ? !isMyOnlineTurn : currentTurn === 'ai') ? 'bg-amber-100/90 border-amber-500 shadow-xs ring-2 ring-amber-400/40' : 'bg-slate-50/90 border-slate-300'
                }`}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isOnlineMatch && (
                      <div className="w-5.5 h-5.5 rounded-full overflow-hidden border-[1.5px] border-black bg-purple-100 shadow-2xs shrink-0">
                        <img
                          src={oppPlayerProfilePicture}
                          alt={oppPlayerName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(oppPlayerName || 'Opponent', 1);
                          }}
                        />
                      </div>
                    )}
                    <LazyFlagImage
                      src={getFlagUrl(effectiveOppCountryCode)}
                      alt={effectiveOppCountryName}
                      className="w-5.5 h-3.5 sm:w-6 sm:h-4 rounded-[3px] overflow-hidden shrink-0 border border-black shadow-2xs"
                    />
                    <span className="font-black text-xs uppercase tracking-tight text-black truncate max-w-[80px] sm:max-w-[110px]">
                      {effectiveOppCountryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {[1, 2, 3].map((heartIdx) => {
                      const oppLives = isOnlineMatch
                        ? (isLocalHost ? guestSurvivalLives : hostSurvivalLives)
                        : aiSurvivalLives;
                      return (
                        <Heart
                          key={`opp-life-${heartIdx}`}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            heartIdx <= oppLives
                              ? 'text-rose-500 fill-rose-500'
                              : 'text-slate-300 fill-slate-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* UNDER: Other UI (Survival Mode Badge, 100s Countdown Timer, and Current Streak) */}
              <div id="survival-sub-controls-row" className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {/* Survival Mode Badge */}
                <div id="survival-mode-badge" className="flex items-center gap-2 md:gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-amber-500 to-rose-600 text-white border-[2.5px] md:border-[3px] border-black shadow-[0_3px_0_0_#000] md:shadow-[0_4px_0_0_#000] rounded-[14px] sm:rounded-[16px] md:rounded-[18px] select-none shrink-0">
                  <Flame className="w-4 h-4 md:w-5 md:h-5 text-amber-300 fill-amber-300 animate-pulse" />
                  <span className="font-black text-[11px] sm:text-xs md:text-xs uppercase tracking-wider text-white">
                    SURVIVAL 1V1
                  </span>
                </div>

                {/* 100s Survival Match Countdown Timer */}
                <div id="survival-timer-badge" className={`flex items-center gap-1.5 border-[2.5px] md:border-[3px] border-black shadow-[0_2.5px_0_0_#000] md:shadow-[0_3.5px_0_0_#000] rounded-[12px] sm:rounded-[14px] md:rounded-[16px] px-2.5 sm:px-3 md:px-3.5 py-1 sm:py-1.5 md:py-1.5 select-none transition-colors ${
                  survivalOnlineTime <= 10
                    ? 'bg-rose-500 text-white animate-pulse'
                    : survivalOnlineTime <= 30
                    ? 'bg-amber-300 text-black'
                    : 'bg-white/95 backdrop-blur-xs text-black'
                }`}>
                  <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] ${
                    survivalOnlineTime <= 10 ? 'text-white' : 'text-slate-800'
                  }`} />
                  <span className="text-[10px] sm:text-xs md:text-xs font-black uppercase tracking-wider">
                    TIME
                  </span>
                  <span className={`font-mono font-black text-xs sm:text-xs md:text-sm px-2 sm:px-2.5 md:px-2.5 py-0.5 rounded-[6px] md:rounded-[7px] border-[1.5px] border-black shadow-2xs text-center min-w-[44px] ${
                    survivalOnlineTime <= 10
                      ? 'bg-white text-rose-600'
                      : survivalOnlineTime <= 30
                      ? 'bg-amber-100 text-amber-950'
                      : 'bg-slate-100 text-slate-950'
                  }`}>
                    {survivalOnlineTime}s
                  </span>
                </div>

                {/* Current Streak Card */}
                <div id="survival-streak-badge" className="flex items-center gap-1.5 bg-white/95 backdrop-blur-xs text-black border-[2.5px] md:border-[3px] border-black shadow-[0_2.5px_0_0_#000] md:shadow-[0_3.5px_0_0_#000] rounded-[12px] sm:rounded-[14px] md:rounded-[16px] px-2.5 sm:px-3 md:px-3.5 py-1 sm:py-1.5 md:py-1.5 select-none">
                  <span className="text-[10px] sm:text-xs md:text-xs font-black uppercase text-amber-950 tracking-wider">
                    STREAK
                  </span>
                  <span className="bg-amber-400 text-black font-black text-xs sm:text-xs md:text-sm px-2 sm:px-2.5 md:px-2.5 py-0.5 rounded-[6px] md:rounded-[7px] border-[1.5px] md:border-[1.5px] border-black font-mono shadow-2xs text-center">
                    {survivalStreak} 🔥
                  </span>
                </div>
              </div>
            </div>
          ) : isPracticeMode ? (
            <div className="flex flex-col items-start gap-1 sm:gap-1.5 md:gap-2">
              {/* 1. Country & Drill Badge UI Card */}
              <div className="flex items-center gap-2 md:gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 md:px-4 md:py-2 bg-amber-400 text-black border-[2.5px] md:border-[3px] border-black shadow-[0_3px_0_0_#000] md:shadow-[0_4px_0_0_#000] rounded-[14px] sm:rounded-[16px] md:rounded-[18px] select-none shrink-0">
                <LazyFlagImage
                  src={getFlagUrl(country.code)}
                  alt={country.name}
                  className="w-6 h-4 sm:w-6.5 sm:h-4.2 md:w-7.5 md:h-5 rounded-[3px] md:rounded-[4px] overflow-hidden shrink-0 border border-black shadow-2xs"
                />
                <span className="font-black text-[11px] sm:text-xs md:text-xs uppercase tracking-wider text-black">
                  {isPenaltyTraining ? 'PENALTY TRAINING' : 'FREE KICK TRAINING'}
                </span>
              </div>

              {/* 2. Goals UI Card */}
              <div className="flex items-center justify-between gap-2.5 sm:gap-3 md:gap-3.5 bg-white/95 backdrop-blur-xs text-black border-[2.5px] md:border-[3px] border-black shadow-[0_2.5px_0_0_#000] md:shadow-[0_3.5px_0_0_#000] rounded-[12px] sm:rounded-[14px] md:rounded-[16px] px-2.5 sm:px-3 md:px-3.5 py-1 sm:py-1.5 md:py-1.5 min-w-[115px] sm:min-w-[125px] md:min-w-[145px] select-none">
                <span className="text-[10px] sm:text-xs md:text-xs font-black uppercase text-emerald-950 tracking-wider">
                  GOALS
                </span>
                <span className="bg-emerald-400 text-black font-black text-xs sm:text-xs md:text-sm px-2 sm:px-2.5 md:px-2.5 py-0.5 rounded-[6px] md:rounded-[7px] border-[1.5px] md:border-[1.5px] border-black font-mono shadow-2xs min-w-[22px] sm:min-w-[26px] md:min-w-[28px] text-center">
                  {practiceGoals}
                </span>
              </div>

              {/* 3. Streak UI Card */}
              <div className="flex items-center justify-between gap-2.5 sm:gap-3 md:gap-3.5 bg-white/95 backdrop-blur-xs text-black border-[2.5px] md:border-[3px] border-black shadow-[0_2.5px_0_0_#000] md:shadow-[0_3.5px_0_0_#000] rounded-[12px] sm:rounded-[14px] md:rounded-[16px] px-2.5 sm:px-3 md:px-3.5 py-1 sm:py-1.5 md:py-1.5 min-w-[115px] sm:min-w-[125px] md:min-w-[145px] select-none">
                <span className="text-[10px] sm:text-xs md:text-xs font-black uppercase text-amber-950 tracking-wider">
                  STREAK
                </span>
                <span className={`font-black text-xs sm:text-xs md:text-sm px-2 sm:px-2.5 md:px-2.5 py-0.5 rounded-[6px] md:rounded-[7px] border-[1.5px] md:border-[1.5px] border-black font-mono shadow-2xs min-w-[22px] sm:min-w-[26px] md:min-w-[28px] text-center ${practiceStreak > 0 ? 'bg-amber-400 text-black' : 'bg-slate-100 text-slate-600'}`}>
                  {practiceStreak}
                </span>
              </div>

              {/* 4. Best Streak UI Card */}
              <div className="flex items-center justify-between gap-2.5 sm:gap-3 md:gap-3.5 bg-white/95 backdrop-blur-xs text-black border-[2.5px] md:border-[3px] border-black shadow-[0_2.5px_0_0_#000] md:shadow-[0_3.5px_0_0_#000] rounded-[12px] sm:rounded-[14px] md:rounded-[16px] px-2.5 sm:px-3 md:px-3.5 py-1 sm:py-1.5 md:py-1.5 min-w-[115px] sm:min-w-[125px] md:min-w-[145px] select-none">
                <span className="text-[10px] sm:text-xs md:text-xs font-black uppercase text-purple-950 tracking-wider">
                  BEST
                </span>
                <span className="bg-purple-300 text-black font-black text-xs sm:text-xs md:text-sm px-2 sm:px-2.5 md:px-2.5 py-0.5 rounded-[6px] md:rounded-[7px] border-[1.5px] md:border-[1.5px] border-black font-mono shadow-2xs min-w-[22px] sm:min-w-[26px] md:min-w-[28px] text-center">
                  {practiceBestStreak}
                </span>
              </div>
            </div>
          ) : (
            <div>
              {penaltyShootout.isActive ? (
                /* Penalty Shootout Scoreboard - App Theme Redesign */
                <div className="flex flex-col items-center bg-white/95 backdrop-blur-md text-black border-[3px] md:border-[3.5px] border-black shadow-[0_5px_0_0_#000] md:shadow-[0_6px_0_0_#000] rounded-[18px] md:rounded-[22px] p-2.5 sm:p-3 select-none min-w-[290px] sm:min-w-[350px] md:min-w-[390px]">
                  {/* Header Row */}
                  <div className="flex items-center justify-between w-full pb-1.5 mb-1.5 border-b-2 border-black/15">
                    <span className="text-[10px] sm:text-xs md:text-xs font-black uppercase bg-black text-amber-300 px-2.5 py-0.5 rounded-full tracking-wider shadow-2xs">
                      PENALTY SHOOTOUT
                    </span>
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-400 border-[1.5px] border-black text-black shadow-2xs">
                      {penaltyShootout.round > 5 ? 'SUDDEN DEATH' : `ROUND ${penaltyShootout.round}/5`}
                    </span>
                  </div>

                  {/* Teams, Score & Kick Dots */}
                  <div className="flex items-center justify-between w-full gap-2 sm:gap-3 md:gap-4">
                    {/* Home Team */}
                    <div id="penalty-home-team" className="flex flex-col items-center gap-1 flex-1">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        {isOnlineMatch && (
                          <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full overflow-hidden border-[1.5px] border-black bg-white shadow-2xs shrink-0">
                            <img
                              src={localPlayerProfilePicture}
                              alt={localPlayerName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(localPlayerName || 'You', 0);
                              }}
                            />
                          </div>
                        )}
                        <LazyFlagImage
                          src={getFlagUrl(country.code)}
                          alt={country.name}
                          className="w-5.5 h-3.5 sm:w-6 sm:h-4 md:w-7 md:h-4.5 rounded-[3px] md:rounded-[4px] overflow-hidden shrink-0 border-[1.5px] border-black shadow-2xs"
                        />
                        <span className="font-black text-xs sm:text-xs md:text-sm uppercase text-black max-w-[70px] sm:max-w-[90px] truncate">
                          {getCountryAbbr(country)}
                        </span>
                      </div>
                      {/* Home Kick Indicators */}
                      <div className="flex items-center gap-1 md:gap-1 mt-0.5">
                        {penaltyShootout.homeKicks.map((kick, idx) => (
                          <div
                            key={`home-kick-${idx}`}
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 rounded-full flex items-center justify-center border-[1.5px] md:border-[2px] font-black text-[9px] sm:text-[10px] md:text-[11px] shadow-2xs ${
                              kick === true
                                ? 'bg-emerald-400 border-black text-black'
                                : kick === false
                                ? 'bg-rose-500 border-black text-white'
                                : idx === penaltyShootout.round - 1 && currentTurn === 'player'
                                ? 'bg-amber-300 border-black animate-pulse text-black'
                                : 'bg-slate-200 border-slate-300 text-transparent'
                            }`}
                          >
                            {kick === true ? '✓' : kick === false ? '✕' : ''}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Penalty Score */}
                    <div className="flex items-center gap-1 px-3 sm:px-3.5 md:px-4 py-0.5 sm:py-1 md:py-1 bg-amber-400 text-black rounded-[10px] md:rounded-[12px] border-[2px] md:border-[2.5px] border-black font-mono font-black text-sm sm:text-base md:text-xl shrink-0 shadow-[0_2px_0_0_#000]">
                      <span>{penaltyShootout.homePenaltiesScore}</span>
                      <span className="text-xs md:text-sm text-black/70 font-bold">-</span>
                      <span>{penaltyShootout.awayPenaltiesScore}</span>
                    </div>

                    {/* Away Team */}
                    <div id="penalty-away-team" className="flex flex-col items-center gap-1 flex-1">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="font-black text-xs sm:text-xs md:text-sm uppercase text-black max-w-[70px] sm:max-w-[90px] truncate">
                          {getCountryAbbr(opponentCountry || oppCountryCode)}
                        </span>
                        <LazyFlagImage
                          src={getFlagUrl(oppCountryCode)}
                          alt={(opponentCountry || { name: 'Opponent' }).name}
                          className="w-5.5 h-3.5 sm:w-6 sm:h-4 md:w-7 md:h-4.5 rounded-[3px] md:rounded-[4px] overflow-hidden shrink-0 border-[1.5px] border-black shadow-2xs"
                        />
                        {isOnlineMatch && (
                          <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full overflow-hidden border-[1.5px] border-black bg-purple-100 shadow-2xs shrink-0">
                            <img
                              src={oppPlayerProfilePicture}
                              alt={oppPlayerName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(oppPlayerName || 'Opponent', 1);
                              }}
                            />
                          </div>
                        )}
                      </div>
                      {/* Away Kick Indicators */}
                      <div className="flex items-center gap-1 md:gap-1 mt-0.5">
                        {penaltyShootout.awayKicks.map((kick, idx) => (
                          <div
                            key={`away-kick-${idx}`}
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 rounded-full flex items-center justify-center border-[1.5px] md:border-[2px] font-black text-[9px] sm:text-[10px] md:text-[11px] shadow-2xs ${
                              kick === true
                                ? 'bg-emerald-400 border-black text-black'
                                : kick === false
                                ? 'bg-rose-500 border-black text-white'
                                : idx === penaltyShootout.round - 1 && currentTurn === 'ai'
                                ? 'bg-amber-300 border-black animate-pulse text-black'
                                : 'bg-slate-200 border-slate-300 text-transparent'
                            }`}
                          >
                            {kick === true ? '✓' : kick === false ? '✕' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Turn Prompt Pill */}
                  <div className={`mt-2 px-3 py-0.5 rounded-full text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider border-[1.5px] border-black shadow-2xs ${
                    currentTurn === 'player'
                      ? 'bg-emerald-400 text-black animate-pulse'
                      : 'bg-purple-600 text-white'
                  }`}>
                    {currentTurn === 'player' ? 'YOUR TURN TO KICK' : (isOnlineMatch ? 'OPPONENT TAKING PENALTY...' : 'AI TAKING PENALTY...')}
                  </div>
                </div>
              ) : (
                /* Unified Football Match Scoreboard (Competitive Match Mode) - Crisp, Clean Proportions */
                <div className="flex items-center bg-white text-black border-[3px] md:border-[3.5px] border-black shadow-[0_4px_0_0_#000] md:shadow-[0_5px_0_0_#000] rounded-[16px] sm:rounded-[18px] md:rounded-[20px] overflow-hidden select-none">
                  {/* Home Team */}
                  <div id="scoreboard-home-team" className={`flex items-center gap-1.5 sm:gap-2 md:gap-2 px-2.5 sm:px-3 md:px-3.5 py-1.5 sm:py-2 md:py-2 border-r-2 md:border-r-[2.5px] border-black transition-colors ${currentTurn === 'player' ? 'bg-amber-100' : 'bg-slate-50'}`}>
                    {isOnlineMatch && (
                      <div className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 md:w-7 md:h-7 rounded-full overflow-hidden border-[1.5px] md:border-[2px] border-black bg-white shadow-2xs shrink-0">
                        <img
                          src={localPlayerProfilePicture}
                          alt={localPlayerName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(localPlayerName || 'You', 0);
                          }}
                        />
                      </div>
                    )}
                    <LazyFlagImage
                      src={getFlagUrl(country.code)}
                      alt={country.name}
                      className="w-5.5 h-3.5 sm:w-6.5 sm:h-4.2 md:w-7 md:h-4.5 rounded-[3px] md:rounded-[4px] overflow-hidden shrink-0 border border-black shadow-2xs"
                    />
                    <span className="font-black text-xs sm:text-xs md:text-sm uppercase tracking-wider text-black max-w-[65px] sm:max-w-[85px] md:max-w-[100px] truncate">
                      {getCountryAbbr(country)}
                    </span>
                  </div>

                  {/* Live Score Display */}
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-1.5 px-2.5 sm:px-3 md:px-3.5 py-1 sm:py-1.5 md:py-1.5 bg-amber-400 border-r-2 md:border-r-[2.5px] border-black">
                    <span className="bg-white text-black font-black text-sm sm:text-base md:text-lg min-w-[24px] sm:min-w-[28px] md:min-w-[32px] h-6.5 sm:h-7.5 md:h-8.5 rounded-[6px] md:rounded-[8px] border-[1.5px] md:border-[2px] border-black flex items-center justify-center font-mono shadow-xs">
                      {homeScore}
                    </span>
                    <span className="text-black font-black text-xs sm:text-xs md:text-sm animate-pulse">:</span>
                    <span className="bg-white text-black font-black text-sm sm:text-base md:text-lg min-w-[24px] sm:min-w-[28px] md:min-w-[32px] h-6.5 sm:h-7.5 md:h-8.5 rounded-[6px] md:rounded-[8px] border-[1.5px] md:border-[2px] border-black flex items-center justify-center font-mono shadow-xs">
                      {awayScore}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div id="scoreboard-away-team" className={`flex items-center gap-1.5 sm:gap-2 md:gap-2 px-2.5 sm:px-3 md:px-3.5 py-1.5 sm:py-2 md:py-2 border-r-2 md:border-r-[2.5px] border-black transition-colors ${currentTurn === 'ai' ? 'bg-purple-100' : 'bg-slate-50'}`}>
                    <span className="font-black text-xs sm:text-xs md:text-sm uppercase tracking-wider text-black max-w-[65px] sm:max-w-[85px] md:max-w-[100px] truncate">
                      {getCountryAbbr(opponentCountry || oppCountryCode)}
                    </span>
                    <LazyFlagImage
                      src={getFlagUrl(oppCountryCode)}
                      alt={(opponentCountry || { name: 'Opponent' }).name}
                      className="w-5.5 h-3.5 sm:w-6.5 sm:h-4.2 md:w-7 md:h-4.5 rounded-[3px] md:rounded-[4px] overflow-hidden shrink-0 border border-black shadow-2xs"
                    />
                    {isOnlineMatch && (
                      <div className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 md:w-7 md:h-7 rounded-full overflow-hidden border-[1.5px] md:border-[2px] border-black bg-purple-100 shadow-2xs shrink-0">
                        <img
                          src={oppPlayerProfilePicture}
                          alt={oppPlayerName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getStickerAvatarUrl(oppPlayerName || 'Opponent', 1);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Game Time */}
                  <div className={`flex items-center gap-1 sm:gap-1.5 md:gap-1.5 px-2.5 sm:px-3 md:px-3.5 py-1.5 sm:py-2 md:py-2 transition-colors font-mono font-black text-xs sm:text-xs md:text-sm tracking-tight ${
                    isGameOver
                      ? 'bg-rose-600 text-white font-black animate-pulse'
                      : matchTime >= 90
                      ? 'bg-amber-400 text-black font-black'
                      : matchTime >= 80
                      ? 'bg-amber-300 text-black'
                      : 'bg-slate-100 text-black'
                  }`}>
                    <Clock className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 stroke-[2.5] shrink-0" />
                    <span>
                      {isGameOver
                        ? 'FT'
                        : matchTime < 90
                        ? `${matchTime}'`
                        : stoppageSeconds !== null
                        ? `90'+${Math.min(stoppageCountdown, stoppageSeconds)}'`
                        : "90'"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 15s Play-In Action Timer Badge (Top-Left Gameplay Clock) - Only active in Online Matches */}
          {isPlayInFeatureActive &&
            currentTurn === 'player' &&
            shotPhaseRef.current === 'idle' &&
            setupStep !== 'kicking' &&
            setupStep !== 'finished' &&
            !isGameOver &&
            !sceneLoading && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-[12px] sm:rounded-[14px] md:rounded-[16px] border-[2.5px] md:border-[3px] border-black shadow-[0_3px_0_0_#000] md:shadow-[0_4px_0_0_#000] select-none font-mono transition-all ${
                  playInTimer <= 5
                    ? 'bg-rose-500 text-white animate-pulse'
                    : playInTimer <= 9
                    ? 'bg-amber-400 text-black'
                    : 'bg-emerald-400 text-black'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  PLAY IN:
                </span>
                <span className="font-black text-xs sm:text-sm md:text-base min-w-[22px]">
                  {playInTimer}s
                </span>
              </motion.div>
            )}

        </div>

        {/* Right Column: World Cup Stage Badge or Wager Match Badge */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto select-none self-end md:self-auto shrink-0 mt-1 md:mt-0">
          {isWagerMatch && (
            <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-black border-[2.5px] sm:border-[3px] md:border-[3.5px] border-black shadow-[0_3px_0_0_#000] sm:shadow-[0_4px_0_0_#000] md:shadow-[0_5px_0_0_#000] rounded-[14px] sm:rounded-[16px] md:rounded-[18px] px-2.5 sm:px-3.5 md:px-4 py-1 sm:py-1.5 md:py-2 flex items-center gap-2 sm:gap-2.5 md:gap-3 hover:scale-105 transition-transform animate-pulse">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center shrink-0 bg-black rounded-[10px] text-amber-300 shadow-2xs">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-[11px] sm:text-xs md:text-xs uppercase tracking-wider text-black leading-tight whitespace-nowrap">
                    WAGER MATCH
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-950 bg-white/90 px-1.5 py-0.2 rounded-full border border-black/20">
                    {wagerTierInfo.badge}
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] md:text-[11px] font-mono font-black uppercase tracking-tight text-amber-950 bg-amber-300/90 px-1.5 sm:px-2 py-0.5 rounded-[5px] md:rounded-[6px] border border-amber-950/20 mt-0.5 leading-tight whitespace-nowrap">
                  💰 POT: {wagerPrizePot.toLocaleString()} COINS
                </span>
              </div>
            </div>
          )}

          {isWorldCupMatch && !isWagerMatch && (
            <div className="bg-amber-400 text-black border-[2.5px] sm:border-[3px] md:border-[3.5px] border-black shadow-[0_3px_0_0_#000] sm:shadow-[0_4px_0_0_#000] md:shadow-[0_5px_0_0_#000] rounded-[14px] sm:rounded-[16px] md:rounded-[18px] px-2.5 sm:px-3.5 md:px-4 py-1 sm:py-1.5 md:py-2 flex items-center gap-2 sm:gap-2.5 md:gap-3 hover:scale-105 transition-transform">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
                <TrophyImage className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-black text-[11px] sm:text-xs md:text-xs uppercase tracking-wider text-black leading-tight whitespace-nowrap">
                  FIFA WORLD CUP
                </span>
                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider text-amber-950 bg-amber-300/90 px-1.5 sm:px-2 py-0.5 rounded-[5px] md:rounded-[6px] border border-amber-950/20 mt-0.5 leading-tight whitespace-nowrap">
                  {getWorldCupStageLabel()}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>
      )}

      {/* UNIFIED OUTCOME STICKER BANNER (Slides in from the left and stays on the left) */}
      <AnimatePresence>
        {!isReplayActive && !showResultsModal && !isPracticeMode && !isSurvival && shotOutcome && (() => {
          const outcomeInfo = getOutcomeSticker(shotOutcome);

          return (
            <div className="fixed top-18 sm:top-22 md:top-26 left-3 sm:left-4 md:left-6 z-50 pointer-events-none select-none">
              <motion.div
                key={shotOutcome}
                initial={{ opacity: 0, x: -140, scale: 0.85, rotate: -4 }}
                animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, x: -140, scale: 0.85, rotate: -4 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                className="flex items-center"
              >
                <div
                  className={`relative pl-3 pr-5 sm:pl-3.5 sm:pr-6 py-2 sm:py-2.5 md:py-3 rounded-[24px] md:rounded-[28px] border-[3.5px] md:border-[4px] border-black shadow-[0_8px_0_0_#000] md:shadow-[0_10px_0_0_#000] font-black uppercase tracking-wider flex items-center gap-3 sm:gap-4 md:gap-4.5 whitespace-nowrap select-none overflow-visible ${outcomeInfo.bannerBg}`}
                >
                  {/* Cartoon Die-cut Sticker Vector Graphic with comic badge */}
                  <div className={`relative shrink-0 ${outcomeInfo.tilt} transition-transform duration-150`}>
                    <div className="w-13 h-13 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full overflow-hidden flex items-center justify-center border-[3px] md:border-[3.5px] border-black bg-white ring-4 ring-white shadow-[0_4px_0_0_#000]">
                      <img src={outcomeInfo.img} alt={outcomeInfo.tag} className="w-full h-full object-cover" />
                    </div>
                    <span
                      className={`absolute -bottom-1.5 -right-1 px-2 py-0.5 rounded-[7px] border-[2px] border-black font-black text-[10px] sm:text-xs tracking-wider shadow-[0_2px_0_0_#000] ${outcomeInfo.tagBg}`}
                    >
                      {outcomeInfo.tag}
                    </span>
                  </div>

                  {/* Outcome Text Headline */}
                  <div className="flex flex-col justify-center text-left">
                    <span className="text-[10px] sm:text-xs font-black tracking-widest text-black/75">
                      {outcomeInfo.tag}
                    </span>
                    <span className="font-black text-base sm:text-xl md:text-2xl lg:text-3xl tracking-wider text-black drop-shadow-sm">
                      {shotOutcome}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* MATCH REPLAY BROADCAST OVERLAY: Clean, Cinematic & Minimalist */}
      <AnimatePresence>
        {isReplayActive && !showResultsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-40 select-none"
          >
            {/* TOP CENTER: Minimal Replay Indicator */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-2.5 sm:top-4 md:top-4.5 left-1/2 -translate-x-1/2 z-40 flex items-center pointer-events-auto select-none"
            >
              <div className="flex items-center gap-1.5 bg-slate-950/90 text-white border-[2.5px] md:border-[3px] border-black rounded-[12px] md:rounded-[14px] px-2.5 sm:px-3.5 py-1 sm:py-1.5 shadow-[0_3px_0_0_#000] backdrop-blur-md">
                <span className={`w-2 h-2 rounded-full border border-white ${isReplayPaused ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'}`} />
                <span className="font-black text-[10px] sm:text-xs md:text-xs tracking-widest text-white uppercase">
                  {savedReplayClip ? 'SAVED HIGHLIGHT • ' : ''}{isReplayPaused ? 'PAUSED' : 'REPLAY'} {replayIndex}/2 • {
                    replayCamAngle === 'ball_tracking'
                      ? 'BALL TRACKING'
                      : 'BEHIND GOAL'
                  }
                </span>
              </div>
            </div>

            {/* TOP RIGHT: Replay Actions (Save & Skip Buttons OR Exit Button) */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 md:top-4.5 md:right-4.5 z-40 flex items-center gap-2 pointer-events-auto select-none"
            >
              {savedReplayClip ? (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBack();
                  }}
                  className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-400 active:scale-95 text-white font-black text-[10px] sm:text-xs md:text-xs uppercase tracking-wider px-3 sm:px-4 py-1.5 sm:py-2 rounded-[12px] md:rounded-[14px] border-[2.5px] md:border-[3px] border-black shadow-[0_3px_0_0_#000] cursor-pointer transition-all"
                  title="Exit Replay Viewer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>EXIT REPLAY</span>
                </button>
              ) : (
                <>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveReplay();
                    }}
                    className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-black text-[10px] sm:text-xs md:text-xs uppercase tracking-wider px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-[12px] md:rounded-[14px] border-[2.5px] md:border-[3px] border-black shadow-[0_3px_0_0_#000] cursor-pointer transition-all"
                    title="Save Replay Moment"
                  >
                    {isSavedToast ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>SAVED</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>SAVE</span>
                      </>
                    )}
                  </button>

                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      lastSceneSkipTimestampRef.current = Date.now();
                      stopReplayAndAdvance();
                    }}
                    className="flex items-center gap-1 bg-white hover:bg-slate-100 active:scale-95 text-black font-black text-[10px] sm:text-xs md:text-xs uppercase tracking-wider px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-[12px] md:rounded-[14px] border-[2.5px] md:border-[3px] border-black shadow-[0_3px_0_0_#000] cursor-pointer transition-all"
                    title="Skip Replay"
                  >
                    <FastForward className="w-3.5 h-3.5 fill-black" />
                    <span>SKIP</span>
                  </button>
                </>
              )}
            </div>

            {/* BOTTOM LEFT: Broadcast Card with Flag, Team Name, Distance Meter, and Goalkeeper Profile */}
            <motion.div
              initial={{ opacity: 0, x: -160 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -160 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26, delay: 0.1 }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 md:bottom-5 md:left-5 z-40 pointer-events-auto select-none max-w-[240px] sm:max-w-[270px] md:max-w-[290px]"
            >
              <div className="bg-white/95 backdrop-blur-md border-[2.5px] md:border-[3px] border-black rounded-[16px] sm:rounded-[20px] p-2.5 sm:p-3 md:p-3.5 shadow-[0_4px_0_0_#000] md:shadow-[0_5px_0_0_#000] flex flex-col gap-2 text-black">
                {/* Team / Country & Free Kick Meter Row */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <LazyFlagImage
                      src={getFlagUrl(currentTurn === 'player' ? country.code : oppCountryCode)}
                      alt={currentTurn === 'player' ? country.name : (opponentCountry?.name || 'Opponent')}
                      className="w-7 h-4.8 sm:w-8 sm:h-5.5 rounded-[3px] border border-black object-cover shadow-2xs shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-black text-[11px] sm:text-xs uppercase tracking-wide truncate text-black">
                        {currentTurn === 'player' ? country.name : (opponentCountry?.name || 'AI OPPONENT')}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        {isPenaltyTraining || penaltyShootout.isActive ? 'PENALTY' : 'FREE KICK'}
                      </span>
                    </div>
                  </div>

                  {/* Free Kick Meter Badge */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-wider">
                      METER
                    </span>
                    <span className="font-mono font-black text-[11px] sm:text-xs md:text-xs px-1.5 py-0.5 bg-amber-400 text-black border border-black rounded-[6px] shadow-2xs">
                      {fkDistance.toFixed(1)}m
                    </span>
                  </div>
                </div>

                {/* AI / Goalkeeper Profile Row */}
                <div className="flex items-center gap-2 p-1.5 sm:p-2 bg-slate-100/90 rounded-[11px] border border-black/80">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] bg-purple-600 border border-black flex items-center justify-center text-amber-300 font-black text-xs shrink-0 shadow-2xs">
                    <Bot className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[9px] sm:text-[10px] uppercase text-slate-900 truncate">
                        {currentTurn === 'player' ? 'AI GOALKEEPER' : 'AI STRIKER'}
                      </span>
                      <span className="text-[8px] font-bold px-1 py-0.2 bg-purple-200 text-purple-900 rounded border border-purple-400">
                        PRO
                      </span>
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 truncate">
                      {currentTurn === 'player'
                        ? `${opponentCountry?.name || 'AI'} Defense Simulation`
                        : `${opponentCountry?.name || 'AI'} Precision Free Kick`}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* BOTTOM RIGHT: Minimal Play/Pause Button */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 md:bottom-4.5 md:right-4.5 z-40 pointer-events-auto select-none flex items-center gap-2"
            >
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleReplayPause();
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-95 text-black border-[2.5px] md:border-[3px] border-black shadow-[0_4px_0_0_#000] flex items-center justify-center cursor-pointer transition-all"
                title={isReplayPaused ? "Play Replay" : "Pause Replay"}
              >
                {isReplayPaused ? (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-black ml-0.5" />
                ) : (
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-black" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Control Bar: Slingshot Launcher & In-Flight Aftertouch Control HUD */}
      {!isReplayActive && !showResultsModal && (
        <div className="absolute bottom-2.5 left-2.5 sm:bottom-3.5 sm:left-3.5 md:bottom-4.5 md:left-4.5 z-30 pointer-events-none flex flex-col items-start gap-1.5">
        
        {/* Slingshot Launcher & Opponent Status Cards */}
        <div className="pointer-events-auto shrink-0">
          {(isOnlineMatch ? !isMyOnlineTurn : currentTurn === 'ai') ? (
            <div className="bg-purple-950/90 text-white border-[2.5px] sm:border-[3px] md:border-[3.5px] border-black rounded-[16px] sm:rounded-[20px] md:rounded-[22px] p-2 sm:p-3 md:p-3.5 shadow-[0_3px_0_0_#000] sm:shadow-[0_4px_0_0_#000] md:shadow-[0_5px_0_0_#000] min-w-[190px] sm:min-w-[250px] md:min-w-[280px] flex items-center gap-2 sm:gap-2.5 md:gap-3 select-none backdrop-blur-md animate-in fade-in duration-200">
              <div className="relative shrink-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-purple-600 border-[1.5px] md:border-[2px] border-black flex items-center justify-center font-black text-[10px] sm:text-xs md:text-xs text-amber-300 z-10 relative">
                  {isOnlineMatch ? '1v1' : 'AI'}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1">
                  <span>{isOnlineMatch ? `${opponentCountry?.name || 'OPPONENT'} TURN` : 'AI OPPONENT TURN'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                </span>
                <span className="text-[9px] sm:text-xs md:text-xs font-black text-white uppercase tracking-wider">
                  {isOnlineMatch ? 'WAITING FOR OPPONENT TO STRIKE...' : (aiStepStatus || 'PREPARING FREE KICK...')}
                </span>
              </div>
            </div>
          ) : setupStep === 'aim' ? (
            /* Bottom Left Sleek Compact Aim Direction Card */
            <motion.div
              key="aim-card"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 440, damping: 28 }}
              className="bg-white/95 backdrop-blur-sm border-[2.5px] sm:border-[3px] border-black rounded-[18px] sm:rounded-[20px] p-2.5 sm:p-3 shadow-[0_4px_0_0_#000] w-[200px] xs:w-[220px] sm:w-[240px] flex flex-col gap-1.5 select-none pointer-events-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-black shrink-0" />
                  <h3 className="font-black text-[11px] sm:text-xs uppercase tracking-wider text-black">
                    AIM DIRECTION
                  </h3>
                </div>
                <span className="text-[8px] sm:text-[8.5px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 border border-black text-black animate-pulse">
                  SWEEPING
                </span>
              </div>

              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleStartCharge();
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 active:scale-95 text-black py-2 px-2.5 rounded-[13px] border-[2px] border-black shadow-[0_2.5px_0_0_#000] font-black text-[10.5px] sm:text-xs uppercase tracking-wider cursor-pointer transition-all mt-0.5"
              >
                <Flame className="w-3.5 h-3.5 text-black shrink-0 fill-black" />
                <span>HOLD TO CHARGE POWER</span>
              </button>

              <div className="text-center text-[7.5px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-tight">
                HOLD SPACEBAR / SCREEN • RELEASE TO STRIKE
              </div>
            </motion.div>
          ) : setupStep === 'power' ? (
            /* Bottom Left Sleek Power Meter Card */
            <motion.div
              key="power-card"
              ref={powerCardRef}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 440, damping: 28 }}
              className="bg-white/95 backdrop-blur-sm border-[2.5px] sm:border-[3px] border-black rounded-[18px] sm:rounded-[20px] p-2.5 sm:p-3 shadow-[0_4px_0_0_#000] w-[200px] xs:w-[220px] sm:w-[240px] flex flex-col select-none pointer-events-auto transition-[box-shadow] duration-75"
            >
              {/* Header with Title & Dynamic Power Level */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-500" />
                  <h3 className="text-black font-black text-[11px] sm:text-xs tracking-wider uppercase">
                    SHOT POWER
                  </h3>
                </div>
                <span
                  ref={powerLevelBadgeRef}
                  className="text-[9.5px] sm:text-[10.5px] font-black px-1.5 py-0.5 rounded-full bg-slate-200 text-black border border-black shadow-sm"
                >
                  0%
                </span>
              </div>

              {/* Power Meter Rounded Pill Frame */}
              <div className="relative h-6 sm:h-7 w-full rounded-full border-[2px] sm:border-[2.5px] border-black overflow-hidden bg-slate-900 shadow-inner">
                {/* Dynamic Colored Gradient Fill */}
                <div
                  ref={powerFillRef}
                  className="absolute top-0 bottom-0 left-0 bg-[linear-gradient(to_right,#22c55e_0%,#84cc16_30%,#facc15_50%,#f59e0b_68%,#ea580c_85%,#ef4444_100%)] transition-none"
                  style={{ width: '0%' }}
                />

                {/* Section Dividers */}
                <div className="absolute left-[33%] top-0 bottom-0 w-[1.5px] bg-black/40 z-10" />
                <div className="absolute left-[67%] top-0 bottom-0 w-[1.5px] bg-black/40 z-10" />

                {/* Crisp White Cursor Needle */}
                <div
                  ref={powerCursorRef}
                  className="absolute top-0 bottom-0 w-3 bg-white border-[2px] border-black rounded-[2.5px] shadow-[0_0_6px_rgba(255,255,255,0.9)] z-20 -ml-[6px]"
                  style={{ left: '0%' }}
                />
              </div>

              {/* Labels under the bar */}
              <div className="flex justify-between items-center px-1 mt-1 text-[9px] sm:text-[9.5px] font-black text-slate-700 uppercase tracking-wider">
                <span>WEAK</span>
                <span className="text-amber-600">SWEET SPOT</span>
                <span>MAX</span>
              </div>

              {/* Action Button to Strike */}
              <button
                onPointerUp={(e) => {
                  e.stopPropagation();
                  executeShotNow();
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-400 via-amber-300 to-amber-400 hover:from-emerald-300 hover:to-amber-300 active:scale-95 text-black py-1.5 px-2.5 rounded-[12px] border-[2px] border-black shadow-[0_2px_0_0_#000] font-black text-[10px] sm:text-xs uppercase tracking-wider cursor-pointer transition-all mt-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-black shrink-0 fill-black" />
                <span>RELEASE TO STRIKE!</span>
              </button>

              {/* Live Status Text */}
              <div
                ref={powerStatusTextRef}
                className="text-center text-[8px] sm:text-[8.5px] font-black text-slate-500 uppercase tracking-tight mt-1"
              >
                CHARGING POWER...
              </div>
            </motion.div>
          ) : null}
        </div>

      </div>
      )}

      {/* Floating Drag Power Badge Over Pitch during Aim Drag */}
      {currentTurn === 'player' && shotPhaseRef.current === 'idle' && setupStep === 'aim' && isSlingshotDragging && (
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-black/90 backdrop-blur-md border-[2.5px] border-white text-white rounded-full px-4 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100">
          <span className="text-[10px] sm:text-xs font-black tracking-wider text-amber-400 uppercase">SHOT POWER</span>
          <span ref={floatingDragPowerTextRef} className="text-sm sm:text-base font-black text-white">
            {currentPowerRef.current ?? 20}%
          </span>
        </div>
      )}

      {/* Bottom Right Controls: Mode-Specific Exit Button */}
      {!isReplayActive && !showResultsModal && (
        <div className="absolute bottom-2.5 right-2.5 sm:bottom-3.5 sm:right-3.5 md:bottom-4.5 md:right-4.5 z-30 pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowExitModal(true);
            }}
            className="flex items-center gap-1.5 sm:gap-2 bg-rose-500 hover:bg-rose-400 active:scale-95 text-white px-3 py-1.5 sm:px-3.5 sm:py-2 md:px-4 md:py-2.5 rounded-[12px] sm:rounded-[15px] md:rounded-[18px] border-[2.5px] sm:border-[3px] md:border-[3px] border-black shadow-[0_3px_0_0_#000] sm:shadow-[0_4px_0_0_#000] md:shadow-[0_5px_0_0_#000] font-black text-[10px] sm:text-xs md:text-xs uppercase tracking-wider cursor-pointer transition-all select-none"
            title={
              isPracticeMode
                ? "Exit training drills and return to main menu"
                : isWorldCupMatch
                ? "Forfeit World Cup match"
                : isWagerMatch
                ? "Surrender coin wager"
                : isSurvival
                ? "End survival run"
                : isOnlineMatch
                ? "Leave online match"
                : "Exit game and return to main menu"
            }
          >
            <span>
              {isPracticeMode
                ? 'EXIT TRAINING'
                : isWorldCupMatch
                ? 'FORFEIT MATCH'
                : isWagerMatch
                ? 'FORFEIT WAGER'
                : isSurvival
                ? 'END SURVIVAL'
                : isOnlineMatch
                ? 'LEAVE MATCH'
                : 'EXIT GAME'}
            </span>
          </button>
        </div>
      )}

      {/* Mode-Specific Quit Confirmation Modal Overlay */}
      <AnimatePresence>
        {showExitModal && (() => {
          const config = (() => {
            if (isWorldCupMatch) {
              return {
                badge: '🏆 FIFA WORLD CUP',
                badgeColor: 'bg-amber-400 text-black',
                title: 'FORFEIT MATCH?',
                subtitle: 'Leaving now counts as an automatic defeat.',
                confirmText: 'FORFEIT',
              };
            }
            if (isWagerMatch) {
              const prizePot = (onlineMatchRoom?.prizePot || wagerPrizePot || 0);
              return {
                badge: `⚔️ COIN WAGER • ${prizePot.toLocaleString()}`,
                badgeColor: 'bg-yellow-400 text-black',
                title: 'SURRENDER WAGER?',
                subtitle: `Forfeiting will surrender your ${wagerEntryFee.toLocaleString()} coin stake.`,
                confirmText: 'SURRENDER',
              };
            }
            if (isSurvival) {
              return {
                badge: '🔥 SURVIVAL ARENA',
                badgeColor: 'bg-rose-500 text-white',
                title: 'END SURVIVAL?',
                subtitle: `Current streak: ${survivalStreak} shots. Run will conclude immediately.`,
                confirmText: 'END RUN',
              };
            }
            if (isOnlineMatch) {
              return {
                badge: '⚡ ONLINE DUEL',
                badgeColor: 'bg-cyan-400 text-black',
                title: 'LEAVE MATCH?',
                subtitle: 'Disconnecting will award a forfeit win to your opponent.',
                confirmText: 'LEAVE',
              };
            }
            if (isPracticeMode) {
              return {
                badge: '🎯 PRACTICE DRILLS',
                badgeColor: 'bg-emerald-400 text-black',
                title: 'EXIT TRAINING?',
                subtitle: 'Return to the main menu at any time.',
                confirmText: 'EXIT',
              };
            }
            return {
              badge: '⚽ QUICK MATCH',
              badgeColor: 'bg-sky-400 text-black',
              title: 'QUIT MATCH?',
              subtitle: 'Current match progress will not be saved.',
              confirmText: 'QUIT',
            };
          })();

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto select-none"
              onClick={() => setShowExitModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 12 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white border-[3.5px] border-black rounded-[24px] p-5 sm:p-6 max-w-xs sm:max-w-sm w-full shadow-[0_8px_0_0_#000] text-black flex flex-col items-center text-center gap-3.5"
              >
                {/* Header Mode Badge */}
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-0.5 rounded-full border-[2px] border-black font-black text-[10px] sm:text-xs uppercase tracking-wider ${config.badgeColor} shadow-[0_2px_0_0_#000]`}>
                    {config.badge}
                  </div>
                </div>

                {/* Title & Concise Subtitle */}
                <div className="flex flex-col gap-1 w-full">
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                    {config.title}
                  </h3>
                  <p className="text-xs font-bold text-slate-600 leading-snug">
                    {config.subtitle}
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2.5 w-full mt-1">
                  <button
                    onClick={() => setShowExitModal(false)}
                    className="py-2.5 px-3 rounded-[14px] bg-slate-100 hover:bg-slate-200 active:scale-95 text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[0_3px_0_0_#000] cursor-pointer transition-all"
                  >
                    CONTINUE
                  </button>
                  <button
                    onClick={() => {
                      if (isOnlineMatch) {
                        onlineMatchManager.notifyDisconnect();
                        onlineMatchManager.leaveRoom();
                      }
                      onBack();
                    }}
                    className="py-2.5 px-3 rounded-[14px] bg-rose-500 hover:bg-rose-400 active:scale-95 text-white font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[0_3px_0_0_#000] cursor-pointer transition-all"
                  >
                    {config.confirmText}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Opponent Left / Disconnected Gameplay Modal */}
      <AnimatePresence>
        {isOpponentQuitModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto select-none"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="bg-white border-[4px] border-black rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-[0_12px_0_0_#000] text-black relative flex flex-col items-center text-center gap-5"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-100 border-[3.5px] border-black text-rose-600 flex items-center justify-center font-black text-3xl shadow-sm">
                !
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black">
                  OPPONENT LEFT THE MATCH
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
                  Your opponent has disconnected or quit the game. The match has automatically ended.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsOpponentQuitModalOpen(false);
                  setIsOpponentDisconnected(true);
                  setIsGameOver(true);
                  setShowResultsModal(true);
                }}
                className="w-full py-4 px-6 rounded-[22px] bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-black font-black text-sm sm:text-base uppercase tracking-wider border-[3.5px] border-black shadow-[0_6px_0_0_#000] cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>CONTINUE TO RESULTS PAGE →</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
