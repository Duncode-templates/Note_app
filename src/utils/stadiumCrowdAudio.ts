// Dynamic Stadium Ambient & Crowd Chant Engine
import crowdNoiseAudioSrc from '../assets/Crowd-noise.mp3';
import { isEffectivelyMuted, subscribeAudioMuteState, getCrazyGamesSdkVolume } from './mediaPreloader';

export type CrowdExcitementLevel =
  | 'normal'
  | 'buildup'
  | 'shot_inflight'
  | 'goal'
  | 'save_reaction'
  | 'miss_groan';

const EXCITEMENT_VOLUMES: Record<CrowdExcitementLevel, number> = {
  normal: 0.35,
  buildup: 0.45,
  shot_inflight: 0.65,
  goal: 0.85,
  save_reaction: 0.55,
  miss_groan: 0.50,
};

let crowdAudioElement: HTMLAudioElement | null = null;
let currentExcitement: CrowdExcitementLevel = 'normal';
let isCrowdPlaying = false;
let fadeInterval: any = null;

function getCrowdAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!crowdAudioElement) {
    crowdAudioElement = new Audio(crowdNoiseAudioSrc);
    crowdAudioElement.loop = true;
    crowdAudioElement.preload = 'auto';
  }
  return crowdAudioElement;
}

function getTargetVolume(level: CrowdExcitementLevel = currentExcitement): number {
  if (isEffectivelyMuted()) return 0.0;
  const sdkVol = getCrazyGamesSdkVolume();
  const baseVol = EXCITEMENT_VOLUMES[level] || 0.35;
  return Math.max(0, Math.min(1.0, baseVol * sdkVol));
}

function smoothFadeTo(targetVol: number, durationMs: number = 300) {
  const audio = getCrowdAudio();
  if (!audio) return;

  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }

  const startVol = audio.volume;
  const startTime = performance.now();

  fadeInterval = setInterval(() => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1.0, elapsed / durationMs);
    const newVol = startVol + (targetVol - startVol) * progress;
    audio.volume = Math.max(0, Math.min(1.0, newVol));

    if (progress >= 1.0) {
      clearInterval(fadeInterval);
      fadeInterval = null;
      if (targetVol <= 0.001 && !isCrowdPlaying) {
        try {
          audio.pause();
        } catch {}
      }
    }
  }, 25);
}

/**
 * Starts looping ambient crowd noise for matches.
 */
export function startMatchCrowd(options: { isPractice?: boolean; isSurvival?: boolean; isKoth?: boolean } = {}) {
  if (options.isKoth) {
    stopMatchCrowd();
    return;
  }
  const audio = getCrowdAudio();
  if (!audio) return;

  isCrowdPlaying = true;
  currentExcitement = 'normal';

  const targetVol = getTargetVolume('normal');
  audio.volume = isEffectivelyMuted() ? 0.0 : Math.min(targetVol, 0.2);

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        smoothFadeTo(targetVol, 500);
      })
      .catch(() => {
        // Handled by browser user-interaction policy
      });
  }
}

/**
 * Stops stadium crowd audio with smooth fade out.
 */
export function stopMatchCrowd() {
  isCrowdPlaying = false;
  const audio = getCrowdAudio();
  if (!audio) return;

  smoothFadeTo(0.0, 400);
}

/**
 * Dynamically adjusts crowd volume based on match phase (aiming, shot in-flight, goal, save).
 */
export function setCrowdExcitement(level: CrowdExcitementLevel) {
  currentExcitement = level;
  if (!isCrowdPlaying) return;

  const targetVol = getTargetVolume(level);
  smoothFadeTo(targetVol, level === 'goal' ? 150 : 300);
}

/**
 * Updates crowd audio whenever global mute or CrazyGames volume changes.
 */
export function updateCrowdMuteState(isMuted: boolean) {
  const audio = getCrowdAudio();
  if (!audio) return;

  if (isMuted) {
    audio.volume = 0.0;
  } else if (isCrowdPlaying) {
    const targetVol = getTargetVolume(currentExcitement);
    smoothFadeTo(targetVol, 200);
  }
}

// Automatically subscribe to audio engine mute state changes
if (typeof window !== 'undefined') {
  subscribeAudioMuteState((isMuted) => {
    updateCrowdMuteState(isMuted);
  });
}
