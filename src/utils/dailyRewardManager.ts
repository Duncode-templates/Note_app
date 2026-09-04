import { crazyGamesSDK } from './crazyGamesSDK';

export const DAILY_REWARD_STORAGE_KEY = 'fkl_daily_reward_v1';
export const DAILY_REWARD_COINS = 10;

export interface DailyRewardData {
  lastClaimedDate: string | null; // YYYY-MM-DD
  streak: number; // 1 to 7
  totalClaimsCount: number;
}

export interface DailyRewardStatus {
  isAvailable: boolean;
  rewardCoins: number;
  streak: number;
  todayDateStr: string;
  lastClaimedDate: string | null;
  totalClaimsCount: number;
  timeUntilReset: {
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
  };
}

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(d: Date = new Date()): string {
  const yesterday = new Date(d);
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
}

export function getTimeUntilMidnight(): { hours: number; minutes: number; seconds: number; formatted: string } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return { hours, minutes, seconds, formatted };
}

class DailyRewardManager {
  private data: DailyRewardData = {
    lastClaimedDate: null,
    streak: 0,
    totalClaimsCount: 0,
  };

  private listeners: Array<(status: DailyRewardStatus) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = crazyGamesSDK.getItemSync(DAILY_REWARD_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.data = {
            lastClaimedDate: typeof parsed.lastClaimedDate === 'string' ? parsed.lastClaimedDate : null,
            streak: typeof parsed.streak === 'number' && parsed.streak >= 0 ? parsed.streak : 0,
            totalClaimsCount: typeof parsed.totalClaimsCount === 'number' ? parsed.totalClaimsCount : 0,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load daily reward state:', e);
    }
  }

  private saveToStorage() {
    try {
      crazyGamesSDK.setItem(DAILY_REWARD_STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save daily reward state:', e);
    }
    this.notify();
  }

  public async syncFromCloud(): Promise<void> {
    try {
      const raw = await crazyGamesSDK.getItem(DAILY_REWARD_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.data = {
            lastClaimedDate: typeof parsed.lastClaimedDate === 'string' ? parsed.lastClaimedDate : null,
            streak: typeof parsed.streak === 'number' && parsed.streak >= 0 ? parsed.streak : 0,
            totalClaimsCount: typeof parsed.totalClaimsCount === 'number' ? parsed.totalClaimsCount : 0,
          };
          this.notify();
        }
      }
    } catch (e) {
      console.warn('Cloud sync error for daily reward:', e);
    }
  }

  public getStatus(): DailyRewardStatus {
    const today = getLocalDateString();
    const isAvailable = this.data.lastClaimedDate !== today;
    const timeUntilReset = getTimeUntilMidnight();

    // Determine current streak preview
    let currentStreak = this.data.streak;
    if (this.data.lastClaimedDate) {
      const yesterday = getYesterdayDateString();
      if (this.data.lastClaimedDate !== today && this.data.lastClaimedDate !== yesterday) {
        // Streak was broken if neither today nor yesterday was claimed
        currentStreak = 0;
      }
    }

    return {
      isAvailable,
      rewardCoins: DAILY_REWARD_COINS,
      streak: currentStreak,
      todayDateStr: today,
      lastClaimedDate: this.data.lastClaimedDate,
      totalClaimsCount: this.data.totalClaimsCount,
      timeUntilReset,
    };
  }

  public claimReward(): { success: boolean; coinsEarned: number; newStreak: number } | null {
    const today = getLocalDateString();
    if (this.data.lastClaimedDate === today) {
      return null; // Already claimed today
    }

    const yesterday = getYesterdayDateString();
    let newStreak = 1;
    if (this.data.lastClaimedDate === yesterday) {
      newStreak = (this.data.streak % 7) + 1;
    } else {
      newStreak = 1;
    }

    this.data = {
      lastClaimedDate: today,
      streak: newStreak,
      totalClaimsCount: this.data.totalClaimsCount + 1,
    };

    this.saveToStorage();
    crazyGamesSDK.happytime();

    return {
      success: true,
      coinsEarned: DAILY_REWARD_COINS,
      newStreak,
    };
  }

  public subscribe(listener: (status: DailyRewardStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((l) => l(status));
  }
}

export const dailyRewardManager = new DailyRewardManager();
