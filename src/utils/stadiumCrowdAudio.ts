// High-Performance Dynamic Stadium Ambient & Crowd Chant Engine
// Uses uploaded Crowd-noise.mp3 for authentic stadium atmosphere.

import crowdNoiseSrc from '../assets/Crowd-noise.mp3';
import { isAudioMuted } from './mediaPreloader';

let crowdAudioElement: HTMLAudioElement | null = null;
let isCrowdRunning = false;
let isPracticeModeActive = false;
let crowdVolumeRampTimer: NodeJS.Timeout | null = null;

function rampCrowdVolume(targetVol: number, durationMs = 300) {
  if (!crowdAudioElement || isAudioMuted()) return;
  if (crowdVolumeRampTimer) clearInterval(crowdVolumeRampTimer);

  const startVol = crowdAudioElement.volume;
  const startTime = Date.now();

  crowdVolumeRampTimer = setInterval(() => {
    if (!crowdAudioElement) {
      if (crowdVolumeRampTimer) clearInterval(crowdVolumeRampTimer);
      return;
    }
    const elapsed = Date.now() - startTime;
    const progress = Math.min(1.0, elapsed / durationMs);
    crowdAudioElement.volume = startVol + (targetVol - startVol) * progress;

    if (progress >= 1.0) {
      if (crowdVolumeRampTimer) clearInterval(crowdVolumeRampTimer);
      crowdVolumeRampTimer = null;
    }
  }, 30);
}

function getCrowdAudioElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!crowdAudioElement) {
    crowdAudioElement = new Audio(crowdNoiseSrc);
    crowdAudioElement.loop = true;
    crowdAudioElement.preload = 'auto';
    crowdAudioElement.volume = isAudioMuted() ? 0 : 0.32;
  }
  return crowdAudioElement;
}

/**
 * Initializes and starts dynamic match stadium crowd chanting audio.
 */
export function startMatchCrowd(options: { isPractice?: boolean; isSurvival?: boolean } = {}) {
  if (typeof window === 'undefined') return;

  isPracticeModeActive = Boolean(options.isPractice);

  if (isPracticeModeActive) {
    stopMatchCrowd();
    return;
  }

  const audio = getCrowdAudioElement();
  if (!audio) return;

  isCrowdRunning = true;
  audio.muted = isAudioMuted();
  audio.volume = isAudioMuted() ? 0 : 0.32;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Auto-play was prevented by browser policy until user interacts
      const resumeOnInteract = () => {
        if (isCrowdRunning && !isAudioMuted() && audio.paused) {
          audio.play().catch(() => {});
        }
        window.removeEventListener('pointerdown', resumeOnInteract);
        window.removeEventListener('keydown', resumeOnInteract);
      };
      window.addEventListener('pointerdown', resumeOnInteract, { once: true, passive: true });
      window.addEventListener('keydown', resumeOnInteract, { once: true, passive: true });
    });
  }
}

/**
 * Stops and cleans up match crowd audio.
 */
export function stopMatchCrowd() {
  isCrowdRunning = false;
  if (crowdVolumeRampTimer) {
    clearInterval(crowdVolumeRampTimer);
    crowdVolumeRampTimer = null;
  }
  if (crowdAudioElement) {
    try {
      crowdAudioElement.pause();
      crowdAudioElement.currentTime = 0;
    } catch {}
  }
}

/**
 * Modulates ambient stadium intensity dynamically during match events
 */
export function setCrowdExcitement(
  level: 'normal' | 'buildup' | 'shot_inflight' | 'goal' | 'save_reaction' | 'miss_groan'
) {
  if (!isCrowdRunning || isPracticeModeActive || isAudioMuted() || typeof window === 'undefined') return;
  if (!crowdAudioElement) return;

  try {
    if (level === 'shot_inflight') {
      rampCrowdVolume(0.40, 200);
    } else if (level === 'goal') {
      rampCrowdVolume(0.50, 250);
      setTimeout(() => {
        if (isCrowdRunning && crowdAudioElement && !isAudioMuted()) {
          rampCrowdVolume(0.32, 600);
        }
      }, 3500);
    } else if (level === 'save_reaction' || level === 'miss_groan') {
      rampCrowdVolume(0.38, 200);
      setTimeout(() => {
        if (isCrowdRunning && crowdAudioElement && !isAudioMuted()) {
          rampCrowdVolume(0.32, 500);
        }
      }, 1600);
    } else {
      rampCrowdVolume(0.32, 300);
    }
  } catch {}
}

export function updateCrowdMuteState(isMuted: boolean) {
  if (!crowdAudioElement) return;
  try {
    if (crowdVolumeRampTimer) {
      clearInterval(crowdVolumeRampTimer);
      crowdVolumeRampTimer = null;
    }
    crowdAudioElement.muted = isMuted;
    crowdAudioElement.volume = isMuted ? 0 : 0.32;
    if (isMuted) {
      crowdAudioElement.pause();
    } else if (isCrowdRunning && crowdAudioElement.paused) {
      crowdAudioElement.play().catch(() => {});
    }
  } catch {}
}
