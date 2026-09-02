/**
 * CrazyGames SDK v3 Integration Module
 *
 * Provides a typed, production-ready wrapper around all CrazyGames SDK v3 modules:
 * - SDK Initialization & Lifecycle (init, loadingStart, loadingStop, gameplayStart, gameplayStop, happytime)
 * - Multiplayer SDK (inviteLink, showInviteButton, hideInviteButton, URL invite param parsing)
 * - Ads SDK (midgame, rewarded, hasAdblock)
 * - Banners SDK (requestBanner, requestResponsiveBanner, clearBanner, clearAllBanners)
 * - User & Auth SDK (getUser, getUserToken, isUserAccountAvailable, showAuthPrompt, showAccountLinkPrompt, addAuthListener, systemInfo)
 * - Data Module SDK (setItem, getItem, getItemSync, removeItem, clear - persistent cloud storage)
 * - Automatic migration from legacy localStorage to CrazyGames Data SDK
 */

import {
  muteCrazyGamesAudio,
  unmuteCrazyGamesAudio,
  muteAllAudio,
  unmuteAllAudio,
} from './mediaPreloader';

export interface CrazyGamesUser {
  id?: string;
  username: string;
  profilePictureUrl?: string;
  avatarUrl?: string;
}

export interface CrazyGamesSystemInfo {
  countryCode?: string;
  browser?: { name?: string; version?: string };
  os?: { name?: string; version?: string };
  device?: { type?: 'desktop' | 'tablet' | 'mobile' };
}

export interface CrazyGamesAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error: any) => void;
}

export interface CrazyGamesBannerOptions {
  id: string;
  width?: number;
  height?: number;
}

// Global declaration for Window CrazyGames SDK
declare global {
  interface Window {
    CrazyGames?: {
      SDK?: {
        init: () => Promise<void>;
        game?: {
          loadingStart: () => void;
          loadingStop: () => void;
          gameplayStart: () => void;
          gameplayStop: () => void;
          happytime: () => void;
          inviteLink: (params?: Record<string, string>) => Promise<string>;
          showInviteButton: (params?: Record<string, string>) => void;
          hideInviteButton: () => void;
          showAuthPrompt: () => Promise<CrazyGamesUser | null>;
        };
        ad?: {
          requestAd: (adType: 'midgame' | 'rewarded', callbacks?: CrazyGamesAdCallbacks) => Promise<void>;
          hasAdblock: () => Promise<boolean>;
        };
        banner?: {
          requestBanner: (container: { id: string; width?: number; height?: number }) => Promise<void>;
          requestResponsiveBanner: (container: { id: string }) => Promise<void>;
          clearBanner: (containerId: string) => Promise<void>;
          clearAllBanners: () => Promise<void>;
        };
        user?: {
          getUser: () => Promise<CrazyGamesUser | null>;
          getUserToken: () => Promise<string | null>;
          isUserAccountAvailable: boolean;
          addAuthListener: (callback: (user: CrazyGamesUser | null) => void) => () => void;
          showAuthPrompt: () => Promise<CrazyGamesUser | null>;
          showAccountLinkPrompt: () => Promise<void>;
          systemInfo?: CrazyGamesSystemInfo;
        };
        data?: {
          setItem: (key: string, value: string) => Promise<void>;
          getItem: (key: string) => Promise<string | null>;
          removeItem: (key: string) => Promise<void>;
          clear: () => Promise<void>;
        };
        environment?: 'disabled' | 'local' | 'crazygames';
      };
    };
  }
}

// Memory cache for instantaneous sync reads while SDK operations resolve
const memoryDataStore = new Map<string, string>();

class CrazyGamesManager {
  private isInitialized: boolean = false;
  private initPromise: Promise<boolean> | null = null;
  private isGameplayActive: boolean = false;
  private isLoadingActive: boolean = false;
  private currentUser: CrazyGamesUser | null = null;
  private userListeners: Array<(user: CrazyGamesUser | null) => void> = [];

  /**
   * Initializes the CrazyGames SDK v3 safely
   */
  public async init(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Wait a brief moment if window.CrazyGames is still loading
        if (typeof window !== 'undefined' && !window.CrazyGames?.SDK) {
          for (let i = 0; i < 15; i++) {
            if (window.CrazyGames?.SDK) break;
            await new Promise((r) => setTimeout(r, 100));
          }
        }

        if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.init) {
          try {
            await window.CrazyGames.SDK.init();
            this.isInitialized = true;
            console.log('🎮 [CrazyGames SDK v3] Successfully initialized');
          } catch (initErr) {
            console.warn('[CrazyGames SDK v3] init() returned notice:', initErr);
            this.isInitialized = true;
          }

          // Safe trigger loading start now that SDK is initialized
          if (this.isLoadingActive || !this.isGameplayActive) {
            try {
              if (window.CrazyGames.SDK.game?.loadingStart) {
                window.CrazyGames.SDK.game.loadingStart();
                this.isLoadingActive = true;
              }
            } catch {}
          }

          // Setup user auth listener if available
          if (window.CrazyGames.SDK.user?.addAuthListener) {
            try {
              window.CrazyGames.SDK.user.addAuthListener((user) => {
                this.currentUser = user;
                this.notifyUserListeners(user);
              });
            } catch (e) {
              console.warn('[CrazyGames SDK] addAuthListener notice:', e);
            }
          }

          // Fetch initial user profile
          try {
            if (window.CrazyGames.SDK.user?.getUser) {
              const user = await window.CrazyGames.SDK.user.getUser();
              if (user) {
                this.currentUser = user;
                this.notifyUserListeners(user);
              }
            }
          } catch (e) {
            console.warn('[CrazyGames SDK] getUser notice:', e);
          }

          // Migrate any legacy data from localStorage into CrazyGames Data Module
          await this.migrateLegacyLocalStorage();

          return true;
        } else {
          console.log('🎮 [CrazyGames SDK] Operating with integrated fallback engine');
          this.isInitialized = true;
          await this.migrateLegacyLocalStorage();
          return false;
        }
      } catch (error) {
        console.warn('🎮 [CrazyGames SDK] Initialization fallback mode active:', error);
        this.isInitialized = true;
        await this.migrateLegacyLocalStorage();
        return false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Migrates all legacy items from localStorage directly to CrazyGames Data SDK, then cleans localStorage
   */
  public async migrateLegacyLocalStorage(): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const knownKeys = [
        'fkl_division_state_v3',
        'fkl_division_state_v2',
        'fkl_division_state_v1',
        'fk_tournament_state_v1',
        'crazygames_user_coins',
        'fkl_coins_v1',
        'fkl_unlocked_balls_v1',
        'fkl_equipped_ball_v1',
        'fkl_unlocked_pitches_v1',
        'fkl_equipped_pitch_v1',
        'fkl_player_name_v1',
        'fkl_custom_kits_v2',
        'fkl_survival_best_streak_v1',
        'fkl_survival_guide_seen_v1',
        'fkl_saved_replays_v1',
      ];

      for (const key of knownKeys) {
        const val = localStorage.getItem(key);
        if (val !== null && val !== undefined) {
          memoryDataStore.set(key, val);
          if (this.isInitialized && window.CrazyGames?.SDK?.data?.setItem) {
            try {
              await window.CrazyGames.SDK.data.setItem(key, val);
            } catch {}
          }
          try {
            localStorage.removeItem(key);
          } catch {}
        }
      }
    } catch (e) {
      console.warn('[CrazyGames SDK Data] Migration notice:', e);
    }
  }

  // ==========================================
  // MULTIPLAYER SDK MODULE (Invite & Rooms)
  // ==========================================

  /**
   * Generates a multiplayer invite link with custom parameters (e.g., { roomId: "12345" })
   */
  public async inviteLink(params: Record<string, string> = {}): Promise<string> {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }

    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game?.inviteLink) {
        const link = await window.CrazyGames.SDK.game.inviteLink(params);
        if (link) return link;
      }
    } catch (e) {
      console.warn('[CrazyGames SDK Multiplayer] inviteLink fallback notice:', e);
    }

    // Fallback: Construct standard URL with query parameters
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      Object.entries(params).forEach(([key, val]) => {
        url.searchParams.set(key, val);
      });
      return url.toString();
    }
    return '';
  }

  /**
   * Displays the native CrazyGames multiplayer invite button overlay
   */
  public showInviteButton(params: Record<string, string> = {}): void {
    if (!this.isInitialized) return;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game?.showInviteButton) {
        window.CrazyGames.SDK.game.showInviteButton(params);
      }
    } catch (e) {
      console.warn('[CrazyGames SDK Multiplayer] showInviteButton notice:', e);
    }
  }

  /**
   * Hides the native CrazyGames multiplayer invite button overlay
   */
  public hideInviteButton(): void {
    if (!this.isInitialized) return;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game?.hideInviteButton) {
        window.CrazyGames.SDK.game.hideInviteButton();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK Multiplayer] hideInviteButton notice:', e);
    }
  }

  /**
   * Parses the room ID or invite parameter from the current URL if opened via a CrazyGames invite link
   */
  public getInviteParam(paramKey: string = 'roomId'): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      // Check primary paramKey as well as common variations
      const variations = [paramKey, 'roomId', 'room', 'cg_room_id', 'inviteCode', 'code'];
      for (const key of variations) {
        const val = urlParams.get(key);
        if (val) return val.trim().toUpperCase();
      }

      // Check hash params if present
      if (window.location.hash) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          for (const key of variations) {
            const val = hashParams.get(key);
            if (val) return val.trim().toUpperCase();
          }
        }
      }
    } catch (e) {
      console.warn('[CrazyGames SDK Multiplayer] Error parsing invite params:', e);
    }
    return null;
  }

  // ==========================================
  // ADS SDK MODULE (Midgame & Rewarded)
  // ==========================================

  /**
   * Requests a midgame or rewarded video advertisement with automatic audio mute handling
   */
  public async requestAd(adType: 'midgame' | 'rewarded', callbacks?: CrazyGamesAdCallbacks): Promise<void> {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }

    const wrappedCallbacks: CrazyGamesAdCallbacks = {
      adStarted: () => {
        try {
          muteCrazyGamesAudio();
        } catch {}
        if (callbacks?.adStarted) callbacks.adStarted();
      },
      adFinished: () => {
        try {
          unmuteCrazyGamesAudio();
        } catch {}
        if (callbacks?.adFinished) callbacks.adFinished();
      },
      adError: (err) => {
        try {
          unmuteCrazyGamesAudio();
        } catch {}
        if (callbacks?.adError) callbacks.adError(err);
      },
    };

    if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.ad?.requestAd) {
      try {
        await window.CrazyGames.SDK.ad.requestAd(adType, wrappedCallbacks);
      } catch (err) {
        console.warn(`[CrazyGames SDK Ads] requestAd(${adType}) error:`, err);
        wrappedCallbacks.adError?.(err);
        wrappedCallbacks.adFinished?.();
      }
    } else {
      // Fallback simulation for local/dev
      console.log(`[CrazyGames SDK Ads Mock] Simulating ${adType} ad`);
      wrappedCallbacks.adStarted?.();
      setTimeout(() => {
        wrappedCallbacks.adFinished?.();
      }, 1200);
    }
  }

  /**
   * Convenience helper to show a rewarded ad and trigger onReward callback on completion
   */
  public async requestRewardedAd(onReward: () => void, onError?: (err: any) => void): Promise<void> {
    let rewarded = false;
    await this.requestAd('rewarded', {
      adStarted: () => {},
      adFinished: () => {
        rewarded = true;
        onReward();
      },
      adError: (err) => {
        console.warn('[CrazyGames SDK] Rewarded ad error:', err);
        if (onError) onError(err);
        else if (!rewarded) {
          // If error occurs, still gracefully finish
        }
      },
    });
  }

  /**
   * Convenience helper to show a midgame interstitial ad
   */
  public async requestMidgameAd(onFinished?: () => void): Promise<void> {
    await this.requestAd('midgame', {
      adFinished: () => {
        if (onFinished) onFinished();
      },
      adError: () => {
        if (onFinished) onFinished();
      },
    });
  }

  /**
   * Checks whether the player is using an ad blocker
   */
  public async hasAdblock(): Promise<boolean> {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.ad?.hasAdblock) {
        return await window.CrazyGames.SDK.ad.hasAdblock();
      }
    } catch (e) {
      // Ignore
    }
    return false;
  }

  // ==========================================
  // BANNERS SDK MODULE
  // ==========================================

  /**
   * Requests a banner ad inside the specified container element
   */
  public async requestBanner(options: CrazyGamesBannerOptions): Promise<void> {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.banner?.requestBanner) {
        await window.CrazyGames.SDK.banner.requestBanner(options);
      }
    } catch (e) {
      console.warn('[CrazyGames SDK Banner] requestBanner notice:', e);
    }
  }

  /**
   * Requests a responsive banner ad
   */
  public async requestResponsiveBanner(containerId: string): Promise<void> {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.banner?.requestResponsiveBanner) {
        await window.CrazyGames.SDK.banner.requestResponsiveBanner({ id: containerId });
      }
    } catch (e) {
      console.warn('[CrazyGames SDK Banner] requestResponsiveBanner notice:', e);
    }
  }

  /**
   * Clears a banner ad container
   */
  public async clearBanner(containerId: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.banner?.clearBanner) {
        await window.CrazyGames.SDK.banner.clearBanner(containerId);
      }
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Clears all banner ads
   */
  public async clearAllBanners(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.banner?.clearAllBanners) {
        await window.CrazyGames.SDK.banner.clearAllBanners();
      }
    } catch (e) {
      // Ignore
    }
  }

  // ==========================================
  // LOADING SDK MODULE
  // ==========================================

  /**
   * Call when loading starts (assets, scene loading, matchmaking)
   */
  public loadingStart(): void {
    if (this.isLoadingActive) return;
    this.isLoadingActive = true;
    if (!this.isInitialized) return;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game?.loadingStart) {
        window.CrazyGames.SDK.game.loadingStart();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] loadingStart notice:', e);
    }
  }

  /**
   * Call when loading has finished and the user can play or interact with the menu
   */
  public loadingStop(): void {
    if (!this.isLoadingActive) return;
    this.isLoadingActive = false;
    if (!this.isInitialized) return;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game?.loadingStop) {
        window.CrazyGames.SDK.game.loadingStop();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] loadingStop notice:', e);
    }
  }

  // ==========================================
  // GAMEPLAY SDK MODULE
  // ==========================================

  /**
   * Call when active gameplay starts (kicking off match, free kicks, training)
   */
  public gameplayStart(): void {
    if (this.isGameplayActive) return;
    this.isGameplayActive = true;
    if (!this.isInitialized) return;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game?.gameplayStart) {
        window.CrazyGames.SDK.game.gameplayStart();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] gameplayStart notice:', e);
    }
  }

  /**
   * Call when active gameplay stops (match ends, paused, returning to hub/menu)
   */
  public gameplayStop(): void {
    if (!this.isGameplayActive) return;
    this.isGameplayActive = false;
    if (!this.isInitialized) return;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game?.gameplayStop) {
        window.CrazyGames.SDK.game.gameplayStop();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] gameplayStop notice:', e);
    }
  }

  /**
   * Call when something celebrating/exciting occurs (championship won, hattrick, legendary goal)
   */
  public happytime(): void {
    if (!this.isInitialized) return;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game?.happytime) {
        window.CrazyGames.SDK.game.happytime();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] happytime notice:', e);
    }
  }

  // ==========================================
  // USER & AUTH SDK MODULE
  // ==========================================

  /**
   * Returns current user information if authenticated
   */
  public async getUser(): Promise<CrazyGamesUser | null> {
    if (this.currentUser) return this.currentUser;
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    if (!this.isInitialized) return null;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.user?.getUser) {
        const user = await window.CrazyGames.SDK.user.getUser();
        if (user) {
          this.currentUser = user;
          return user;
        }
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] getUser error:', e);
    }
    return null;
  }

  /**
   * Returns current user synchronously from in-memory cache
   */
  public getCurrentUser(): CrazyGamesUser | null {
    return this.currentUser;
  }

  /**
   * Returns JWT token for backend authentication if available
   */
  public async getUserToken(): Promise<string | null> {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    if (!this.isInitialized) return null;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.user?.getUserToken) {
        return await window.CrazyGames.SDK.user.getUserToken();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] getUserToken error:', e);
    }
    return null;
  }

  /**
   * Check if CrazyGames user accounts are supported in current environment
   */
  public isUserAccountAvailable(): boolean {
    if (!this.isInitialized) return false;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.user) {
        return Boolean(window.CrazyGames.SDK.user.isUserAccountAvailable);
      }
    } catch (e) {
      // Ignored
    }
    return false;
  }

  /**
   * Triggers CrazyGames login / auth prompt modal
   */
  public async showAuthPrompt(): Promise<CrazyGamesUser | null> {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    if (!this.isInitialized) return null;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.user?.showAuthPrompt) {
        const user = await window.CrazyGames.SDK.user.showAuthPrompt();
        if (user) {
          this.currentUser = user;
          this.notifyUserListeners(user);
        }
        return user;
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] showAuthPrompt error:', e);
    }
    return null;
  }

  /**
   * Triggers CrazyGames account link prompt modal
   */
  public async showAccountLinkPrompt(): Promise<void> {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    if (!this.isInitialized) return;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.user?.showAccountLinkPrompt) {
        await window.CrazyGames.SDK.user.showAccountLinkPrompt();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] showAccountLinkPrompt notice:', e);
    }
  }

  /**
   * Listen for user login/logout changes
   */
  public onUserChange(callback: (user: CrazyGamesUser | null) => void): () => void {
    this.userListeners.push(callback);
    if (this.currentUser) {
      callback(this.currentUser);
    }
    return () => {
      this.userListeners = this.userListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyUserListeners(user: CrazyGamesUser | null): void {
    for (const listener of this.userListeners) {
      try {
        listener(user);
      } catch (err) {
        console.error('[CrazyGames SDK] User listener exception:', err);
      }
    }
  }

  /**
   * Retrieve platform system/device info
   */
  public getSystemInfo(): CrazyGamesSystemInfo | null {
    if (!this.isInitialized) return null;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.user?.systemInfo) {
        return window.CrazyGames.SDK.user.systemInfo;
      }
    } catch (e) {
      // Ignored
    }
    return null;
  }

  /**
   * Retrieve platform language or system country code for localization
   */
  public getLanguage(): string {
    const sysInfo = this.getSystemInfo();
    if (sysInfo?.countryCode) {
      return sysInfo.countryCode.toLowerCase();
    }
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const paramLang = params.get('lang') || params.get('locale');
      if (paramLang) return paramLang.toLowerCase();
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      return navigator.language.substring(0, 2).toLowerCase();
    }
    return 'en';
  }

  // ==========================================
  // DATA MODULE SDK (Cloud Key-Value Storage)
  // ==========================================

  /**
   * Persist a string item to CrazyGames cloud data storage (with in-memory fallback, no localStorage)
   */
  public async setItem(key: string, value: string): Promise<void> {
    // 1. Update in-memory cache for instant synchronous access
    memoryDataStore.set(key, value);

    // 2. Clean localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }

    // 3. Persist to CrazyGames cloud data module when initialized
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    if (!this.isInitialized) return;

    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.data?.setItem) {
        await window.CrazyGames.SDK.data.setItem(key, value);
      }
    } catch (e) {
      console.warn('[CrazyGames SDK Data] setItem error:', e);
    }
  }

  /**
   * Retrieve a string item from CrazyGames cloud data storage
   */
  public async getItem(key: string): Promise<string | null> {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }

    // 1. Attempt retrieval from CrazyGames SDK Data
    if (this.isInitialized) {
      try {
        if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.data?.getItem) {
          const cloudVal = await window.CrazyGames.SDK.data.getItem(key);
          if (cloudVal !== null && cloudVal !== undefined) {
            memoryDataStore.set(key, cloudVal);
            return cloudVal;
          }
        }
      } catch (e) {
        console.warn('[CrazyGames SDK Data] getItem error:', e);
      }
    }

    // 2. Check memory store
    if (memoryDataStore.has(key)) {
      return memoryDataStore.get(key) || null;
    }

    // 3. Check legacy localStorage once, migrate and clear
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const legacyVal = localStorage.getItem(key);
        if (legacyVal !== null && legacyVal !== undefined) {
          memoryDataStore.set(key, legacyVal);
          localStorage.removeItem(key);
          if (this.isInitialized && window.CrazyGames?.SDK?.data?.setItem) {
            window.CrazyGames.SDK.data.setItem(key, legacyVal).catch(() => {});
          }
          return legacyVal;
        }
      } catch {}
    }

    return null;
  }

  /**
   * Synchronous item read from memory cache
   */
  public getItemSync(key: string): string | null {
    if (memoryDataStore.has(key)) {
      return memoryDataStore.get(key) || null;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const legacy = localStorage.getItem(key);
        if (legacy !== null && legacy !== undefined) {
          memoryDataStore.set(key, legacy);
          localStorage.removeItem(key);
          return legacy;
        }
      } catch {}
    }
    return null;
  }

  /**
   * Remove item from CrazyGames data storage and memory cache
   */
  public async removeItem(key: string): Promise<void> {
    memoryDataStore.delete(key);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }

    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    if (!this.isInitialized) return;

    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.data?.removeItem) {
        await window.CrazyGames.SDK.data.removeItem(key);
      }
    } catch (e) {
      console.warn('[CrazyGames SDK Data] removeItem error:', e);
    }
  }

  /**
   * Clear all items from CrazyGames data storage
   */
  public async clear(): Promise<void> {
    memoryDataStore.clear();

    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    if (!this.isInitialized) return;

    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.data?.clear) {
        await window.CrazyGames.SDK.data.clear();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK Data] clear error:', e);
    }
  }
}

export const crazyGamesSDK = new CrazyGamesManager();
export default crazyGamesSDK;


