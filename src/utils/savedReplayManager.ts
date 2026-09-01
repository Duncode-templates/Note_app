import { SavedReplay, ReplayFrame } from '../types';
import { crazyGamesSDK } from './crazyGamesSDK';

export const SAVED_REPLAYS_KEY = 'fkl_saved_replays_v1';
const MAX_SAVED_REPLAYS = 25;

type ReplayListener = (replays: SavedReplay[]) => void;

class SavedReplayManager {
  private replays: SavedReplay[] = [];
  private listeners: Set<ReplayListener> = new Set();
  private isLoadedFromStorage = false;

  constructor() {
    this.init();
  }

  private init() {
    // 1. Synchronous initial load from memory or local cache
    try {
      const raw = crazyGamesSDK.getItemSync(SAVED_REPLAYS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.replays = parsed;
        }
      }
    } catch (e) {
      console.warn('[SavedReplayManager] Sync load notice:', e);
    }

    // 2. Asynchronous cloud load from CrazyGames SDK
    crazyGamesSDK.getItem(SAVED_REPLAYS_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.replays = parsed;
            this.notify();
          }
        } catch {}
      }
      this.isLoadedFromStorage = true;
    }).catch(() => {
      this.isLoadedFromStorage = true;
    });
  }

  /**
   * Subscribe to replay updates
   */
  public subscribe(listener: ReplayListener): () => void {
    this.listeners.add(listener);
    listener(this.replays);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn([...this.replays]);
      } catch (err) {
        console.error('[SavedReplayManager] Listener error:', err);
      }
    });
  }

  /**
   * Get all saved replays synchronously
   */
  public getReplays(): SavedReplay[] {
    return [...this.replays];
  }

  /**
   * Save a newly captured replay clip
   */
  public async saveReplay(data: {
    distance: number;
    isGoal: boolean;
    outcomeText: string;
    kickerCountryCode: string;
    kickerCountryName: string;
    opponentCountryCode: string;
    opponentCountryName: string;
    gameMode?: string;
    frames: ReplayFrame[];
  }): Promise<SavedReplay | null> {
    if (!data.frames || data.frames.length < 3) {
      console.warn('[SavedReplayManager] Cannot save empty or invalid replay clip');
      return null;
    }

    // Format current date & time
    const now = new Date();
    const formattedDate = now.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newReplay: SavedReplay = {
      id: `replay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      formattedDate,
      distance: data.distance,
      isGoal: data.isGoal,
      outcomeText: data.outcomeText || (data.isGoal ? 'GOAL' : 'SAVED'),
      kickerCountryCode: data.kickerCountryCode,
      kickerCountryName: data.kickerCountryName,
      opponentCountryCode: data.opponentCountryCode,
      opponentCountryName: data.opponentCountryName,
      gameMode: data.gameMode || 'Free Kick',
      frames: data.frames,
    };

    // Prepend new replay to front of list
    const updated = [newReplay, ...this.replays].slice(0, MAX_SAVED_REPLAYS);
    this.replays = updated;
    this.notify();

    // Persist via CrazyGames SDK & LocalStorage
    try {
      const payload = JSON.stringify(updated);
      await crazyGamesSDK.setItem(SAVED_REPLAYS_KEY, payload);
    } catch (err) {
      console.error('[SavedReplayManager] Save error:', err);
    }

    return newReplay;
  }

  /**
   * Delete a saved replay by ID
   */
  public async deleteReplay(id: string): Promise<void> {
    this.replays = this.replays.filter((r) => r.id !== id);
    this.notify();

    try {
      const payload = JSON.stringify(this.replays);
      await crazyGamesSDK.setItem(SAVED_REPLAYS_KEY, payload);
    } catch (err) {
      console.error('[SavedReplayManager] Delete error:', err);
    }
  }

  /**
   * Clear all saved replays
   */
  public async clearAll(): Promise<void> {
    this.replays = [];
    this.notify();
    try {
      await crazyGamesSDK.removeItem(SAVED_REPLAYS_KEY);
    } catch (err) {
      console.error('[SavedReplayManager] Clear error:', err);
    }
  }
}

export const savedReplayManager = new SavedReplayManager();
