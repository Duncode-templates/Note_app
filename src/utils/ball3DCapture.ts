import { BallTextureItem, BALL_TEXTURE_ITEMS } from '../data/storeItems';
import { renderBallTextureToContext, renderBall3DSphereToCanvas } from './ballTextureGenerator';

// Memory cache for captured 3D ball thumbnail image Data URLs
const ball3DThumbnailCache = new Map<string, string>();
const CACHE_VERSION = 'v2_';

// Try to hydrate cache from sessionStorage for instantaneous instant-loads
if (typeof window !== 'undefined' && window.sessionStorage) {
  try {
    BALL_TEXTURE_ITEMS.forEach((ball) => {
      const cached = window.sessionStorage.getItem(`ball_thumb_3d_${CACHE_VERSION}${ball.id}`);
      if (cached) {
        ball3DThumbnailCache.set(ball.id, cached);
      }
    });
  } catch {}
}

/**
 * Creates the authentic spherical texture canvas for a given ball
 * Optimized with high-efficiency resolution for instant non-blocking textures
 */
export function generateBallTextureCanvas(ballItem: BallTextureItem): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = 384;
  const height = 192;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  renderBallTextureToContext(ctx, width, height, ballItem);
  return canvas;
}

/**
 * Captures a crisp 3D rendered thumbnail image of the ball texture on a 3D sphere
 * Using ultra-fast direct raytraced spherical shading with studio lighting and shadow.
 */
export function captureBall3DThumbnail(ballItem: BallTextureItem): string {
  if (ball3DThumbnailCache.has(ballItem.id)) {
    return ball3DThumbnailCache.get(ballItem.id)!;
  }

  if (typeof document === 'undefined') {
    return '';
  }

  const renderSize = 220;
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = renderSize;
  offscreenCanvas.height = renderSize;

  const ctx = offscreenCanvas.getContext('2d');
  if (!ctx) return '';

  try {
    renderBall3DSphereToCanvas(ctx, renderSize, ballItem);

    const dataUrl = offscreenCanvas.toDataURL('image/png');
    ball3DThumbnailCache.set(ballItem.id, dataUrl);

    // Save in sessionStorage for persistent zero-lag reloads
    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(`ball_thumb_3d_${CACHE_VERSION}${ballItem.id}`, dataUrl);
      }
    } catch {}

    return dataUrl;
  } catch (err) {
    console.warn('Error rendering 3D ball thumbnail:', err);
    return '';
  }
}

// Queue system to process captures asynchronously one-by-one in idle frames
const asyncCaptureQueue: { ball: BallTextureItem; resolve: (url: string) => void }[] = [];
let isProcessingQueue = false;

function processNextInQueue() {
  if (asyncCaptureQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }

  isProcessingQueue = true;
  const item = asyncCaptureQueue.shift()!;

  // Use requestIdleCallback or setTimeout to avoid blocking main thread frames
  const runCapture = () => {
    try {
      const url = captureBall3DThumbnail(item.ball);
      item.resolve(url);
    } catch {
      item.resolve('');
    }

    // Schedule next after a frame so the browser stays responsive
    setTimeout(processNextInQueue, 16);
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runCapture, { timeout: 100 });
  } else {
    setTimeout(runCapture, 16);
  }
}

/**
 * Asynchronously captures the 3D thumbnail without blocking the main UI thread
 */
export function captureBall3DThumbnailAsync(ballItem: BallTextureItem): Promise<string> {
  if (ball3DThumbnailCache.has(ballItem.id)) {
    return Promise.resolve(ball3DThumbnailCache.get(ballItem.id)!);
  }

  return new Promise<string>((resolve) => {
    asyncCaptureQueue.push({ ball: ballItem, resolve });
    if (!isProcessingQueue) {
      processNextInQueue();
    }
  });
}

/**
 * Checks if a ball has an already cached 3D thumbnail
 */
export function getCachedBall3DThumbnail(ballId: string): string | null {
  return ball3DThumbnailCache.get(ballId) || null;
}
