// Pure High-Definition Audio Engine for Soccer-kick, Ball-hit-player, Whistle, and Goal Cheer Audio
// Combines zero-latency Web Audio buffer playback, studio mastering equalizer & dynamics compressor.
import { KICK_AUDIO_BASE64, KEEPER_HIT_AUDIO_BASE64 } from '../assets/audioData';
import { STICKERS } from '../assets/stickers';
import { updateCrowdMuteState } from './stadiumCrowdAudio';
import whistleAudioSrc from '../assets/Whistle.mp3';
import goalCheerAudioSrc from '../assets/Goalcheer.mp3';
import crowdNoiseAudioSrc from '../assets/Crowd-noise.mp3';

export { whistleAudioSrc, goalCheerAudioSrc, crowdNoiseAudioSrc };

const AUDIO_SRC = KICK_AUDIO_BASE64 || '/Soccer-kick.mp3';
const KEEPER_HIT_AUDIO_SRC = KEEPER_HIT_AUDIO_BASE64 || '/Ball-hit-player.wav';
const WHISTLE_AUDIO_SRC = whistleAudioSrc;
const GOAL_CHEER_AUDIO_SRC = goalCheerAudioSrc;

const POOL_SIZE = 6;
const audioElementsPool: HTMLAudioElement[] = [];
const KEEPER_POOL_SIZE = 6;
const keeperHitAudioPool: HTMLAudioElement[] = [];
const WHISTLE_POOL_SIZE = 3;
const whistleAudioPool: HTMLAudioElement[] = [];
const GOAL_CHEER_POOL_SIZE = 2;
const goalCheerAudioPool: HTMLAudioElement[] = [];

// Mute states: CrazyGames SDK setting, SDK volume level, Ad playing, Tab visibility
let isSdkMutedGlobally = false;
let sdkVolumeLevel = 1.0;
let isAdMutedGlobally = false;
let isUserMutedGlobally = false;
let isTabHiddenMutedGlobally = false;

// Check initial CrazyGames URL mute/volume parameters (?muteAudio=true / ?volume=0 / ?muted=true)
try {
  if (typeof window !== 'undefined' && window.location) {
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get('muteAudio') === 'true' ||
      urlParams.get('muteAudio') === '1' ||
      urlParams.get('muted') === 'true'
    ) {
      isSdkMutedGlobally = true;
    }
    const volParam = urlParams.get('volume');
    if (volParam !== null) {
      const parsedVol = parseFloat(volParam);
      if (!isNaN(parsedVol)) {
        sdkVolumeLevel = Math.max(0, Math.min(1.0, parsedVol > 1 ? parsedVol / 100 : parsedVol));
        if (sdkVolumeLevel === 0) isSdkMutedGlobally = true;
      }
    }
  }
} catch {}

const audioMuteListeners = new Set<(isMuted: boolean) => void>();

export function isEffectivelyMuted(): boolean {
  return isSdkMutedGlobally || isAdMutedGlobally || isUserMutedGlobally || isTabHiddenMutedGlobally || sdkVolumeLevel <= 0.001;
}

export function isAudioMuted(): boolean {
  return isEffectivelyMuted();
}

export function getCrazyGamesSdkVolume(): number {
  return sdkVolumeLevel;
}

export function isUserMuted(): boolean {
  return isUserMutedGlobally;
}

export function isSdkMuted(): boolean {
  return isSdkMutedGlobally;
}

export function isAdMuted(): boolean {
  return isAdMutedGlobally;
}

export function subscribeAudioMuteState(listener: (isMuted: boolean) => void): () => void {
  audioMuteListeners.add(listener);
  listener(isEffectivelyMuted());
  return () => {
    audioMuteListeners.delete(listener);
  };
}

function notifyMuteListeners() {
  const muted = isEffectivelyMuted();
  audioMuteListeners.forEach((fn) => {
    try {
      fn(muted);
    } catch {}
  });
}

function applyGlobalMuteState() {
  const muted = isEffectivelyMuted();
  const currentVolume = muted ? 0.0 : sdkVolumeLevel;
  updateCrowdMuteState(muted);

  if (sharedAudioCtx) {
    const now = sharedAudioCtx.currentTime;
    try {
      if (masterGainNode) {
        masterGainNode.gain.setValueAtTime(currentVolume, now);
      }
      if (sfxBusNode) {
        sfxBusNode.gain.setValueAtTime(currentVolume, now);
      }
      if (longSoundBusNode) {
        longSoundBusNode.gain.setValueAtTime(currentVolume, now);
      }
    } catch {}
  }

  // HTML5 audio elements mute & pause when muted
  for (const el of audioElementsPool) {
    try {
      el.muted = muted;
      if (muted) el.pause();
    } catch {}
  }
  for (const el of keeperHitAudioPool) {
    try {
      el.muted = muted;
      if (muted) el.pause();
    } catch {}
  }
  for (const el of whistleAudioPool) {
    try {
      el.muted = muted;
      if (muted) el.pause();
    } catch {}
  }
  for (const el of goalCheerAudioPool) {
    try {
      el.muted = muted;
      if (muted) el.pause();
    } catch {}
  }

  notifyMuteListeners();
}

/**
 * CrazyGames SDK Mute Setting updater (called when SDK settings change, volume button is toggled, or ?muteAudio=true)
 */
export function setCrazyGamesSdkMuteState(muted: boolean) {
  isSdkMutedGlobally = Boolean(muted);
  applyGlobalMuteState();
}

/**
 * CrazyGames SDK Volume updater (called when SDK volume setting changes)
 */
export function setCrazyGamesSdkVolume(volume: number) {
  if (typeof volume === 'number' && !isNaN(volume)) {
    const normalized = Math.max(0, Math.min(1.0, volume > 1 ? volume / 100 : volume));
    sdkVolumeLevel = normalized;
    if (normalized <= 0.001) {
      isSdkMutedGlobally = true;
    } else {
      isSdkMutedGlobally = false;
    }
  }
  applyGlobalMuteState();
}

/**
 * User manual in-game mute toggle
 */
export function setUserMuteState(muted: boolean) {
  isUserMutedGlobally = Boolean(muted);
  applyGlobalMuteState();
}

export function toggleUserMuteState(): boolean {
  setUserMuteState(!isUserMutedGlobally);
  return isUserMutedGlobally;
}

/**
 * CrazyGames SDK Ad Mute: Mutes all audio when video ads start
 */
export function muteCrazyGamesAudio() {
  isAdMutedGlobally = true;
  applyGlobalMuteState();
}

/**
 * CrazyGames SDK Ad Unmute: Restores audio when video ads finish
 */
export function unmuteCrazyGamesAudio() {
  isAdMutedGlobally = false;
  applyGlobalMuteState();
}

// Aliases for compatibility
export const muteAllAudio = muteCrazyGamesAudio;
export const unmuteAllAudio = unmuteCrazyGamesAudio;
export const muteLongSounds = muteCrazyGamesAudio;
export const unmuteLongSounds = unmuteCrazyGamesAudio;

export function isLongAudioMuted(): boolean {
  return isEffectivelyMuted();
}

// Handle browser tab visibility changes
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    isTabHiddenMutedGlobally = document.hidden;
    if (document.hidden && sharedAudioCtx && sharedAudioCtx.state === 'running') {
      sharedAudioCtx.suspend().catch(() => {});
    } else if (!document.hidden && sharedAudioCtx && sharedAudioCtx.state === 'suspended' && !isEffectivelyMuted()) {
      sharedAudioCtx.resume().catch(() => {});
    }
    applyGlobalMuteState();
  });
}

let kickAudioBuffer: AudioBuffer | null = null;
let keeperHitAudioBuffer: AudioBuffer | null = null;
let whistleAudioBuffer: AudioBuffer | null = null;
let goalCheerAudioBuffer: AudioBuffer | null = null;

let isDecodingKickAudio = false;
let isDecodingKeeperAudio = false;
let isDecodingWhistleAudio = false;
let isDecodingGoalCheerAudio = false;

let nextPoolIndex = 0;
let nextKeeperPoolIndex = 0;
let nextWhistlePoolIndex = 0;
let nextGoalCheerPoolIndex = 0;

/**
 * Shared reusable AudioContext with high-performance studio mastering pipeline:
 * [SFX Sources]        -> [SFX Bus (0..1)]       -\
 *                                                  -> [Master LowShelf -> MidPeak -> HighShelf -> Compressor] -> [Master Gain (0..1)] -> [Destination]
 * [Long Sound Sources] -> [Long Sound Bus (0..1)]-/
 */
let sharedAudioCtx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let sfxBusNode: GainNode | null = null;
let longSoundBusNode: GainNode | null = null;
let masterCompressorNode: DynamicsCompressorNode | null = null;
let eqLowShelfNode: BiquadFilterNode | null = null;
let eqMidPeakNode: BiquadFilterNode | null = null;
let eqHighShelfNode: BiquadFilterNode | null = null;

function setupMasterAudioPipeline(ctx: AudioContext) {
  if (sfxBusNode && longSoundBusNode && masterGainNode) return;

  try {
    const initGain = isEffectivelyMuted() ? 0.0 : 1.0;

    // Master Output Gain
    masterGainNode = ctx.createGain();
    masterGainNode.gain.setValueAtTime(initGain, ctx.currentTime);

    // 1. Two Independent Sub-Buses:
    sfxBusNode = ctx.createGain();
    sfxBusNode.gain.setValueAtTime(initGain, ctx.currentTime);

    longSoundBusNode = ctx.createGain();
    longSoundBusNode.gain.setValueAtTime(initGain, ctx.currentTime);

    // 2. Three-Band Mastering Equalizer
    eqLowShelfNode = ctx.createBiquadFilter();
    eqLowShelfNode.type = 'lowshelf';
    eqLowShelfNode.frequency.setValueAtTime(120, ctx.currentTime);
    eqLowShelfNode.gain.setValueAtTime(1.5, ctx.currentTime);

    eqMidPeakNode = ctx.createBiquadFilter();
    eqMidPeakNode.type = 'peaking';
    eqMidPeakNode.frequency.setValueAtTime(1600, ctx.currentTime);
    eqMidPeakNode.Q.setValueAtTime(1.0, ctx.currentTime);
    eqMidPeakNode.gain.setValueAtTime(-2.0, ctx.currentTime);

    eqHighShelfNode = ctx.createBiquadFilter();
    eqHighShelfNode.type = 'highshelf';
    eqHighShelfNode.frequency.setValueAtTime(7000, ctx.currentTime);
    eqHighShelfNode.gain.setValueAtTime(-2.5, ctx.currentTime);

    // 3. Studio Dynamics Compressor: Prevents clipping, levels peaks, stops audio lag
    masterCompressorNode = ctx.createDynamicsCompressor();
    masterCompressorNode.threshold.setValueAtTime(-14, ctx.currentTime);
    masterCompressorNode.knee.setValueAtTime(10, ctx.currentTime);
    masterCompressorNode.ratio.setValueAtTime(3.5, ctx.currentTime);
    masterCompressorNode.attack.setValueAtTime(0.003, ctx.currentTime);
    masterCompressorNode.release.setValueAtTime(0.18, ctx.currentTime);

    // Connect Pipeline:
    sfxBusNode.connect(eqLowShelfNode);
    longSoundBusNode.connect(eqLowShelfNode);

    eqLowShelfNode.connect(eqMidPeakNode);
    eqMidPeakNode.connect(eqHighShelfNode);
    eqHighShelfNode.connect(masterCompressorNode);
    masterCompressorNode.connect(masterGainNode);
    masterGainNode.connect(ctx.destination);
  } catch {
    // Pipeline fallback
  }
}

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
      setupMasterAudioPipeline(sharedAudioCtx);
    }
  }
  if (sharedAudioCtx) {
    if (!sfxBusNode || !longSoundBusNode || !masterGainNode) {
      setupMasterAudioPipeline(sharedAudioCtx);
    }
    if (sharedAudioCtx.state === 'suspended' && !isEffectivelyMuted()) {
      sharedAudioCtx.resume().catch(() => {});
    }
  }
  return sharedAudioCtx;
}

/**
 * Returns audio input node for short SFX (kicks, UI clicks, keeper blocks).
 */
export function getSfxAudioInput(): AudioNode | null {
  if (isEffectivelyMuted()) return null;
  const ctx = getSharedAudioContext();
  if (!ctx) return null;
  if (!sfxBusNode) {
    setupMasterAudioPipeline(ctx);
  }
  return sfxBusNode || ctx.destination;
}

/**
 * Returns audio input node for long sound effects, celebrations, and music.
 */
export function getLongSoundAudioInput(): AudioNode | null {
  if (isEffectivelyMuted()) return null;
  const ctx = getSharedAudioContext();
  if (!ctx) return null;
  if (!longSoundBusNode) {
    setupMasterAudioPipeline(ctx);
  }
  return longSoundBusNode || ctx.destination;
}

export function getMasterAudioInput(): AudioNode | null {
  return getSfxAudioInput();
}

/**
 * Helper to convert Base64 string to ArrayBuffer for Web Audio decoding
 */
function base64ToArrayBuffer(base64Data: string): ArrayBuffer {
  const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Decodes the kick, keeper hit, whistle, and goal cheer audio into native AudioBuffers once for 0ms latency playback
 */
function decodeNativeAudioBuffers() {
  if (typeof window === 'undefined') return;
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  if (!kickAudioBuffer && !isDecodingKickAudio && KICK_AUDIO_BASE64) {
    isDecodingKickAudio = true;
    try {
      const arrayBuf = base64ToArrayBuffer(KICK_AUDIO_BASE64);
      ctx.decodeAudioData(
        arrayBuf,
        (decoded) => {
          kickAudioBuffer = decoded;
          isDecodingKickAudio = false;
        },
        () => {
          isDecodingKickAudio = false;
        }
      );
    } catch {
      isDecodingKickAudio = false;
    }
  }

  if (!keeperHitAudioBuffer && !isDecodingKeeperAudio && KEEPER_HIT_AUDIO_BASE64) {
    isDecodingKeeperAudio = true;
    try {
      const arrayBuf = base64ToArrayBuffer(KEEPER_HIT_AUDIO_BASE64);
      ctx.decodeAudioData(
        arrayBuf,
        (decoded) => {
          keeperHitAudioBuffer = decoded;
          isDecodingKeeperAudio = false;
        },
        () => {
          isDecodingKeeperAudio = false;
        }
      );
    } catch {
      isDecodingKeeperAudio = false;
    }
  }

  if (!whistleAudioBuffer && !isDecodingWhistleAudio && WHISTLE_AUDIO_SRC) {
    isDecodingWhistleAudio = true;
    try {
      fetch(WHISTLE_AUDIO_SRC)
        .then((res) => res.arrayBuffer())
        .then((arrayBuf) => {
          ctx.decodeAudioData(
            arrayBuf,
            (decoded) => {
              whistleAudioBuffer = decoded;
              isDecodingWhistleAudio = false;
            },
            () => {
              isDecodingWhistleAudio = false;
            }
          );
        })
        .catch(() => {
          isDecodingWhistleAudio = false;
        });
    } catch {
      isDecodingWhistleAudio = false;
    }
  }

  if (!goalCheerAudioBuffer && !isDecodingGoalCheerAudio && GOAL_CHEER_AUDIO_SRC) {
    isDecodingGoalCheerAudio = true;
    try {
      fetch(GOAL_CHEER_AUDIO_SRC)
        .then((res) => res.arrayBuffer())
        .then((arrayBuf) => {
          ctx.decodeAudioData(
            arrayBuf,
            (decoded) => {
              goalCheerAudioBuffer = decoded;
              isDecodingGoalCheerAudio = false;
            },
            () => {
              isDecodingGoalCheerAudio = false;
            }
          );
        })
        .catch(() => {
          isDecodingGoalCheerAudio = false;
        });
    } catch {
      isDecodingGoalCheerAudio = false;
    }
  }
}

/**
 * Pre-decodes image files with memory cache.
 */
const imagePromiseCache = new Map<string, Promise<void>>();

export function preloadImage(src: string): Promise<void> {
  if (typeof window === 'undefined' || !src) {
    return Promise.resolve();
  }
  const cached = imagePromiseCache.get(src);
  if (cached) return cached;

  const promise = new Promise<void>((resolve) => {
    const img = new Image();
    img.src = src;
    if (img.complete) {
      resolve();
      return;
    }
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });

  imagePromiseCache.set(src, promise);
  return promise;
}

/**
 * Preload sticker graphics safely after cache initialization
 */
if (typeof window !== 'undefined') {
  Object.values(STICKERS).forEach((imgSrc) => {
    preloadImage(imgSrc);
  });
}

/**
 * Initializes and unlocks the real HTML5 Audio audio elements pool and Web Audio context.
 */
export function initAudioUnlockListener() {
  if (typeof window === 'undefined') return;

  const ctx = getSharedAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  decodeNativeAudioBuffers();

  if (audioElementsPool.length === 0) {
    for (let i = 0; i < POOL_SIZE; i++) {
      const audio = new Audio(AUDIO_SRC);
      audio.preload = 'auto';
      audioElementsPool.push(audio);
    }
  }

  if (keeperHitAudioPool.length === 0) {
    for (let i = 0; i < KEEPER_POOL_SIZE; i++) {
      const audio = new Audio(KEEPER_HIT_AUDIO_SRC);
      audio.preload = 'auto';
      keeperHitAudioPool.push(audio);
    }
  }

  if (whistleAudioPool.length === 0) {
    for (let i = 0; i < WHISTLE_POOL_SIZE; i++) {
      const audio = new Audio(WHISTLE_AUDIO_SRC);
      audio.preload = 'auto';
      whistleAudioPool.push(audio);
    }
  }

  if (goalCheerAudioPool.length === 0) {
    for (let i = 0; i < GOAL_CHEER_POOL_SIZE; i++) {
      const audio = new Audio(GOAL_CHEER_AUDIO_SRC);
      audio.preload = 'auto';
      goalCheerAudioPool.push(audio);
    }
  }

  const unlock = () => {
    const context = getSharedAudioContext();
    if (context && context.state === 'suspended') {
      context.resume().catch(() => {});
    }
    decodeNativeAudioBuffers();

    for (const el of audioElementsPool) {
      try {
        el.load();
      } catch {
        // Ignore
      }
    }
    for (const el of keeperHitAudioPool) {
      try {
        el.load();
      } catch {
        // Ignore
      }
    }
    for (const el of whistleAudioPool) {
      try {
        el.load();
      } catch {
        // Ignore
      }
    }
    for (const el of goalCheerAudioPool) {
      try {
        el.load();
      } catch {
        // Ignore
      }
    }
  };

  const interactionEvents = ['pointerdown', 'touchstart', 'mousedown', 'click', 'keydown'];
  const handler = () => {
    unlock();
  };

  interactionEvents.forEach((evt) => {
    window.addEventListener(evt, handler, { capture: true, passive: true });
  });
}

/**
 * Preloads the audio files in background.
 */
export function preloadAudioBuffer() {
  if (typeof window === 'undefined') return;
  initAudioUnlockListener();
  decodeNativeAudioBuffers();
}

/**
 * Synthesizes a punchy authentic soccer ball strike in Web Audio API as an ultra-fast supplementary layer.
 */
function playSyntheticKickImpact(ctx: AudioContext, normPower: number) {
  const now = ctx.currentTime;
  const sfxInput = getSfxAudioInput();
  if (!sfxInput) return;

  // 1. Deep Sub-bass Thump (ball core/bladder compression: 110Hz -> 38Hz)
  const oscThump = ctx.createOscillator();
  const gainThump = ctx.createGain();
  oscThump.type = 'sine';
  const startFreq = 100 + normPower * 35;
  oscThump.frequency.setValueAtTime(startFreq, now);
  oscThump.frequency.exponentialRampToValueAtTime(36, now + 0.08);

  gainThump.gain.setValueAtTime(normPower * 0.85, now);
  gainThump.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

  oscThump.connect(gainThump);
  gainThump.connect(sfxInput);
  oscThump.start(now);
  oscThump.stop(now + 0.1);

  // 2. Leather Impact Punch (casing crack: 220Hz -> 65Hz)
  const oscPunch = ctx.createOscillator();
  const gainPunch = ctx.createGain();
  oscPunch.type = 'triangle';
  oscPunch.frequency.setValueAtTime(240, now);
  oscPunch.frequency.exponentialRampToValueAtTime(55, now + 0.045);

  gainPunch.gain.setValueAtTime(normPower * 0.65, now);
  gainPunch.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  oscPunch.connect(gainPunch);
  gainPunch.connect(sfxInput);
  oscPunch.start(now);
  oscPunch.stop(now + 0.055);
}

/**
 * Plays the real Soccer-kick sound with Web Audio Buffer (0ms latency), HTML5 Audio pool, and punchy impact response.
 */
export function playKickSound(powerRatio = 0.5) {
  if (isEffectivelyMuted()) return;
  const normPower = Math.max(0.35, Math.min(1.0, powerRatio));

  try {
    const ctx = getSharedAudioContext();
    let playedWithWebAudio = false;

    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const sfxInput = getSfxAudioInput();

      if (kickAudioBuffer && sfxInput) {
        const source = ctx.createBufferSource();
        source.buffer = kickAudioBuffer;

        // Subtle natural pitch modulation based on strike power
        source.playbackRate.value = 0.96 + normPower * 0.12;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(Math.min(1.0, normPower * 1.1), ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(sfxInput);
        source.start(ctx.currentTime);
        playedWithWebAudio = true;
      } else {
        // Trigger synthetic kick sound if buffer is still decoding
        playSyntheticKickImpact(ctx, normPower);
        playedWithWebAudio = true;
      }
    }

    // Secondary fallback: HTML5 Audio pool
    if (!playedWithWebAudio) {
      if (audioElementsPool.length === 0) {
        initAudioUnlockListener();
      }
      if (audioElementsPool.length > 0) {
        let audioToPlay: HTMLAudioElement | null = null;
        for (let i = 0; i < audioElementsPool.length; i++) {
          const audio = audioElementsPool[i];
          if (audio.paused || audio.ended) {
            audioToPlay = audio;
            break;
          }
        }
        if (!audioToPlay) {
          audioToPlay = audioElementsPool[nextPoolIndex];
          nextPoolIndex = (nextPoolIndex + 1) % audioElementsPool.length;
        }
        if (audioToPlay) {
          audioToPlay.currentTime = 0;
          audioToPlay.volume = normPower;
          const p = audioToPlay.play();
          if (p !== undefined) {
            p.catch(() => {});
          }
        }
      }
    }
  } catch {
    // Ignore
  }
}

/**
 * Strictly plays the uploaded Ball-hit-player.wav audio file when the ball hits
 * the goalkeeper (saves, dives, parries, catches, fingertip tips) or player blocks.
 */
export function playKeeperHitSound(volume = 0.9) {
  if (isEffectivelyMuted()) return;
  const normVol = Math.max(0.2, Math.min(1.0, volume));

  try {
    const ctx = getSharedAudioContext();
    let playedWithWebAudio = false;

    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const sfxInput = getSfxAudioInput();

      if (keeperHitAudioBuffer && sfxInput) {
        const source = ctx.createBufferSource();
        source.buffer = keeperHitAudioBuffer;
        source.playbackRate.value = 0.98 + Math.random() * 0.06;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(normVol, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(sfxInput);
        source.start(ctx.currentTime);
        playedWithWebAudio = true;
      }
    }

    if (!playedWithWebAudio) {
      if (keeperHitAudioPool.length === 0) {
        initAudioUnlockListener();
      }
      if (keeperHitAudioPool.length > 0) {
        let audioToPlay: HTMLAudioElement | null = null;
        for (let i = 0; i < keeperHitAudioPool.length; i++) {
          const audio = keeperHitAudioPool[i];
          if (audio.paused || audio.ended) {
            audioToPlay = audio;
            break;
          }
        }
        if (!audioToPlay) {
          audioToPlay = keeperHitAudioPool[nextKeeperPoolIndex];
          nextKeeperPoolIndex = (nextKeeperPoolIndex + 1) % keeperHitAudioPool.length;
        }
        if (audioToPlay) {
          audioToPlay.currentTime = 0;
          audioToPlay.volume = normVol;
          const p = audioToPlay.play();
          if (p !== undefined) {
            p.catch(() => {});
          }
        }
      }
    }
  } catch {
    // Ignore
  }
}

export const playBallHitPlayerSound = playKeeperHitSound;

/**
 * Plays the uploaded Whistle.mp3 audio file when the kicker is about to play the ball.
 */
export function playWhistleSound(volume = 0.75) {
  if (isEffectivelyMuted()) return;
  const normVol = Math.max(0.1, Math.min(1.0, volume));

  try {
    const ctx = getSharedAudioContext();
    let playedWithWebAudio = false;

    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const longSoundInput = getLongSoundAudioInput();

      if (whistleAudioBuffer && longSoundInput) {
        const source = ctx.createBufferSource();
        source.buffer = whistleAudioBuffer;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(normVol, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(longSoundInput);
        source.start(ctx.currentTime);
        playedWithWebAudio = true;
      }
    }

    if (!playedWithWebAudio) {
      if (whistleAudioPool.length === 0) {
        initAudioUnlockListener();
      }
      if (whistleAudioPool.length > 0) {
        let audioToPlay: HTMLAudioElement | null = null;
        for (let i = 0; i < whistleAudioPool.length; i++) {
          const audio = whistleAudioPool[i];
          if (audio.paused || audio.ended) {
            audioToPlay = audio;
            break;
          }
        }
        if (!audioToPlay) {
          audioToPlay = whistleAudioPool[nextWhistlePoolIndex];
          nextWhistlePoolIndex = (nextWhistlePoolIndex + 1) % whistleAudioPool.length;
        }
        if (audioToPlay) {
          audioToPlay.currentTime = 0;
          audioToPlay.volume = normVol;
          const p = audioToPlay.play();
          if (p !== undefined) {
            p.catch(() => {});
          }
        }
      }
    }
  } catch {}
}

export const playRefereeWhistle = playWhistleSound;

/**
 * Goal sound & crowd cheer removed as requested
 */
export function playGoalCheerSound(_volume = 0.85) {
  // Goal sound removed as requested
}

export const playGoalSound = playGoalCheerSound;

export function stopGoalCheerSound() {
  // Goal sound removed as requested
}

export const stopGoalSound = stopGoalCheerSound;

/**
 * Target hit sound disabled
 */
export function playTargetHitSound(_isBullseye = false) {
  // Disabled
}

/**
 * Superpower sound disabled
 */
export function playSuperpowerSound(_powerType: string) {
  // Disabled
}

// Auto-run unlock listener on module import
if (typeof window !== 'undefined') {
  initAudioUnlockListener();
}

/**
 * Button click sound.
 */
export function playButtonClickSound(volume = 0.12) {
  if (isEffectivelyMuted()) return;
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    const sfxInput = getSfxAudioInput();
    if (!sfxInput) return;
    const now = ctx.currentTime;

    const oscThud = ctx.createOscillator();
    const gainThud = ctx.createGain();
    oscThud.type = 'sine';
    oscThud.frequency.setValueAtTime(140, now);
    oscThud.frequency.exponentialRampToValueAtTime(45, now + 0.035);

    gainThud.gain.setValueAtTime(volume * 0.8, now);
    gainThud.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

    oscThud.connect(gainThud);
    gainThud.connect(sfxInput);
    oscThud.start(now);
    oscThud.stop(now + 0.04);
  } catch {
    // Ignore audio context errors
  }
}

/**
 * Clean audio cue for locking aim and power (disabled as requested).
 */
export function playLockAimSound(_volume = 0.25) {
  // Power meter sounds completely silenced as requested
}

/**
 * Global UI interaction listener: Automatically plays satisfying click sound on all button clicks
 */
if (typeof window !== 'undefined') {
  let lastClickSoundTime = 0;
  window.addEventListener(
    'pointerdown',
    (e) => {
      try {
        const target = (e.target as HTMLElement)?.closest(
          'button, [role="button"], input[type="button"], input[type="submit"], a[href], .cursor-pointer'
        );
        if (target) {
          // Debounce rapid multi-touches within 45ms to avoid clipping
          const now = Date.now();
          if (now - lastClickSoundTime > 45) {
            lastClickSoundTime = now;
            playButtonClickSound(0.24);
          }
        }
      } catch {}
    },
    { capture: true, passive: true }
  );
}

