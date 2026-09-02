import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ShoppingCart, X, Target, Coins, User, Flame, Zap, Swords, Wifi, Video, Bookmark, Globe } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faBullseye, faDumbbell, faFire, faCrosshairs } from '@fortawesome/free-solid-svg-icons';
import { MenuItemId, GameMode, OnlineMatchRoom, SavedReplay } from './types';
import CountrySelectionPage from './components/CountrySelectionPage';
import OnlineCountrySelectionPage from './components/OnlineCountrySelectionPage';
import TournamentTeamSelectionPage from './components/TournamentTeamSelectionPage';
import TournamentHubPage from './components/TournamentHubPage';
import StorePage from './components/StorePage';
import SavedReplaysPage from './components/SavedReplaysPage';
import LanguageSelectionPage from './components/LanguageSelectionPage';
import Stadium3DView from './components/Stadium3DView';
import OnlineMatchModal from './components/OnlineMatchModal';
import SurvivalHubModal from './components/SurvivalHubModal';
import WagerArenaSelectModal from './components/WagerArenaSelectModal';
import LazyFlagImage from './components/LazyFlagImage';
import TrophyImage from './components/TrophyImage';
import CoinIcon from './components/CoinIcon';
import { WagerTier } from './data/wagerArenas';
import { Country, getFlagUrl, COUNTRIES_DATA } from './data/countries';
import {
  TournamentState,
  TournamentMatch,
  KnockoutMatch,
  initTournamentState,
  applyMatchResultToGroups,
  simulateScore,
  processCompletedRound,
  loadTournamentState,
  loadTournamentStateAsync,
  saveTournamentState,
  clearTournamentState,
} from './data/tournamentData';
import { initAudioUnlockListener, preloadAudioBuffer, preloadImage } from './utils/mediaPreloader';
import { onlineMatchManager } from './utils/onlineMatchManager';
import { savedReplayManager } from './utils/savedReplayManager';
import { crazyGamesSDK } from './utils/crazyGamesSDK';
import { useTranslation, SUPPORTED_LANGUAGES } from './utils/i18n';

type ModalType = 'quick_play' | 'tournament' | 'practice' | null;
type ViewState = 'menu' | 'country_selection' | 'online_country_selection' | 'tournament_selection' | 'tournament_hub' | 'stadium' | 'store' | 'saved_replays' | 'language_selection';

const COINS_DATA_KEY = 'crazygames_user_coins';
const UNLOCKED_BALLS_KEY = 'fkl_unlocked_balls_v1';
const EQUIPPED_BALL_KEY = 'fkl_equipped_ball_v1';
const UNLOCKED_PITCHES_KEY = 'fkl_unlocked_pitches_v1';
const EQUIPPED_PITCH_KEY = 'fkl_equipped_pitch_v1';
const DEFAULT_START_COINS = 25;

function loadInitialCoins(): number {
  try {
    const raw = crazyGamesSDK.getItemSync(COINS_DATA_KEY);
    if (raw !== null && raw !== undefined) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load initial coins:', e);
  }
  return DEFAULT_START_COINS;
}

function loadInitialUnlockedBalls(): string[] {
  try {
    const raw = crazyGamesSDK.getItemSync(UNLOCKED_BALLS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure aero_tricolor_pro is always unlocked
        if (!parsed.includes('aero_tricolor_pro')) {
          return ['aero_tricolor_pro'];
        }
        return parsed;
      }
    }
  } catch {}
  return ['aero_tricolor_pro'];
}

function loadInitialEquippedBall(): string {
  try {
    const raw = crazyGamesSDK.getItemSync(EQUIPPED_BALL_KEY);
    if (raw && raw === 'aero_tricolor_pro') return raw;
  } catch {}
  return 'aero_tricolor_pro';
}

function loadInitialUnlockedPitches(): string[] {
  try {
    const raw = crazyGamesSDK.getItemSync(UNLOCKED_PITCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return ['classic_stripes'];
}

function loadInitialEquippedPitch(): string {
  try {
    const raw = crazyGamesSDK.getItemSync(EQUIPPED_PITCH_KEY);
    if (raw) return raw;
  } catch {}
  return 'classic_stripes';
}

const SURVIVAL_BEST_KEY = 'fkl_survival_best_streak_v1';

function loadInitialSurvivalBest(): number {
  try {
    const raw = crazyGamesSDK.getItemSync(SURVIVAL_BEST_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch {}
  return 0;
}

export default function App() {
  const { t, language } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [onlineModalGameMode, setOnlineModalGameMode] = useState<'match' | 'penalty_training' | 'survival'>('match');
  const [onlineModalWagerTier, setOnlineModalWagerTier] = useState<WagerTier | undefined>(undefined);
  const [isWagerArenaModalOpen, setIsWagerArenaModalOpen] = useState(false);
  const [isSurvivalModalOpen, setIsSurvivalModalOpen] = useState(false);
  const [bestSurvivalStreak, setBestSurvivalStreak] = useState<number>(() => loadInitialSurvivalBest());
  const [activeSavedReplay, setActiveSavedReplay] = useState<SavedReplay | null>(null);
  const [savedReplaysCount, setSavedReplaysCount] = useState<number>(() => savedReplayManager.getReplays().length);
  const [isTournamentComingSoonOpen, setIsTournamentComingSoonOpen] = useState(false);
  const [isAdsComingSoonOpen, setIsAdsComingSoonOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('menu');
  const [modeContext, setModeContext] = useState<string>('Quick Play - Offline');
  const [gameMode, setGameMode] = useState<GameMode>('match');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [opponentCountry, setOpponentCountry] = useState<Country | null>(null);
  const [coins, setCoins] = useState<number>(() => loadInitialCoins());
  const [activeOnlineRoom, setActiveOnlineRoom] = useState<OnlineMatchRoom | null>(null);

  // Subscribe to Saved Replays updates
  useEffect(() => {
    const unsubscribe = savedReplayManager.subscribe((replays) => {
      setSavedReplaysCount(replays.length);
    });
    return unsubscribe;
  }, []);

  // Store Customization States (Loaded from CrazyGames SDK Data Module)
  const [unlockedBallIds, setUnlockedBallIds] = useState<string[]>(() => loadInitialUnlockedBalls());
  const [equippedBallId, setEquippedBallId] = useState<string>(() => loadInitialEquippedBall());
  const [unlockedPitchIds, setUnlockedPitchIds] = useState<string[]>(() => loadInitialUnlockedPitches());
  const [equippedPitchId, setEquippedPitchId] = useState<string>(() => loadInitialEquippedPitch());

  const updateCoins = (updater: number | ((prev: number) => number)) => {
    setCoins((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const clamped = Math.max(0, next);
      crazyGamesSDK.setItem(COINS_DATA_KEY, String(clamped));
      return clamped;
    });
  };

  // Active Tournament State (Loaded from CrazyGames SDK Data Module)
  const [tournamentState, setTournamentState] = useState<TournamentState | null>(() => {
    return loadTournamentState();
  });
  const [activeTournamentMatch, setActiveTournamentMatch] = useState<TournamentMatch | KnockoutMatch | null>(null);

  // User Profile State (Synchronized with CrazyGames SDK User)
  const [playerName, setPlayerName] = useState<string>(() => {
    return onlineMatchManager.localPlayerName || 'Striker_Legend';
  });
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(() => {
    return onlineMatchManager.localPlayerProfilePictureUrl || null;
  });

  // CrazyGames SDK Initialization & Asset Preloading
  useEffect(() => {
    // Eagerly unlock audio pipeline & pre-decode assets on first load
    initAudioUnlockListener();
    preloadAudioBuffer();
    preloadImage('/Trophy.png');
    preloadImage('Trophy.png');

    const initSDK = async () => {
      try {
        await crazyGamesSDK.init();
        const user = await crazyGamesSDK.getUser();
        if (user) {
          if (user.username) {
            setPlayerName(user.username);
          }
          const userAvatar = user.profilePictureUrl || user.avatarUrl || null;
          if (userAvatar) {
            setUserProfilePicture(userAvatar);
          }
          onlineMatchManager.setPlayerInfo(user.username || playerName, undefined, userAvatar);
        }
        // Async re-check saved tournament state in cloud data
        const cloudTournament = await loadTournamentStateAsync();
        if (cloudTournament) {
          setTournamentState(cloudTournament);
        }

        // Async re-check saved coins from CrazyGames Cloud Data Centre
        try {
          const cloudCoinsRaw = await crazyGamesSDK.getItem(COINS_DATA_KEY);
          if (cloudCoinsRaw !== null && cloudCoinsRaw !== undefined) {
            const parsed = parseInt(cloudCoinsRaw, 10);
            if (!isNaN(parsed) && parsed >= 0) {
              setCoins(parsed);
            }
          } else {
            // New user default starting 25 coins saved to CrazyGames data centre
            crazyGamesSDK.setItem(COINS_DATA_KEY, String(DEFAULT_START_COINS));
          }
        } catch (e) {
          console.warn('Coins cloud load error:', e);
        }

        // Async re-check store customizations from CrazyGames Cloud Data Centre
        try {
          const cloudBalls = await crazyGamesSDK.getItem(UNLOCKED_BALLS_KEY);
          if (cloudBalls) {
            const parsed = JSON.parse(cloudBalls);
            if (Array.isArray(parsed) && parsed.length > 0) setUnlockedBallIds(parsed);
          }
          const cloudEquippedBall = await crazyGamesSDK.getItem(EQUIPPED_BALL_KEY);
          if (cloudEquippedBall) setEquippedBallId(cloudEquippedBall);

          const cloudPitches = await crazyGamesSDK.getItem(UNLOCKED_PITCHES_KEY);
          if (cloudPitches) {
            const parsed = JSON.parse(cloudPitches);
            if (Array.isArray(parsed) && parsed.length > 0) setUnlockedPitchIds(parsed);
          }
          const cloudEquippedPitch = await crazyGamesSDK.getItem(EQUIPPED_PITCH_KEY);
          if (cloudEquippedPitch) setEquippedPitchId(cloudEquippedPitch);

          // Async re-check survival best streak from CrazyGames Cloud Data Module
          const cloudSurvival = await crazyGamesSDK.getItem(SURVIVAL_BEST_KEY);
          if (cloudSurvival) {
            const parsed = parseInt(cloudSurvival, 10);
            if (!isNaN(parsed) && parsed >= 0) {
              setBestSurvivalStreak((prev) => Math.max(prev, parsed));
            }
          }
        } catch {}

        // Check if user entered via a CrazyGames invite link with roomId
        const inviteRoomId = crazyGamesSDK.getInviteParam('roomId');
        if (inviteRoomId && inviteRoomId.length >= 4) {
          console.log('🎮 [CrazyGames Multiplayer] Detected invite room ID from URL:', inviteRoomId);
          setIsOnlineModalOpen(false);
          setActiveModal(null);
          const joined = await onlineMatchManager.joinRoom(inviteRoomId);
          if (joined && onlineMatchManager.currentRoom) {
            setActiveOnlineRoom(onlineMatchManager.currentRoom);
            setModeContext('Online 1v1 Match');
            setCurrentView('online_country_selection');
          }
        }
      } catch (err) {
        console.warn('SDK init error:', err);
      } finally {
        crazyGamesSDK.loadingStop();
      }
    };

    initSDK();
  }, []);

  // CrazyGames Gameplay Start / Stop Lifecycle Compliance & Survival Best Sync
  useEffect(() => {
    if (currentView === 'stadium') {
      crazyGamesSDK.gameplayStart();
    } else {
      crazyGamesSDK.gameplayStop();
      if (currentView === 'menu') {
        setBestSurvivalStreak(loadInitialSurvivalBest());
      }
    }
  }, [currentView]);

  const handleSelect = (id: MenuItemId) => {
    if (id === 'quick_play' || id === 'tournament' || id === 'practice') {
      setActiveModal(id);
      setSelectedOption(id === 'quick_play' ? 'Quick Play' : id === 'tournament' ? 'Tournament' : 'Practice');
    } else if (id === 'survival') {
      setIsSurvivalModalOpen(true);
    } else if (id === 'wager_arena') {
      setIsWagerArenaModalOpen(true);
    } else if (id === 'shop') {
      setCurrentView('store');
    } else {
      setSelectedOption(id);
    }
  };

  const handleSelectWagerTier = (tier: WagerTier) => {
    setIsWagerArenaModalOpen(false);
    setOnlineModalWagerTier(tier);
    setOnlineModalGameMode('match');
    setIsOnlineModalOpen(true);
  };

  const handleChooseSurvivalMode = (mode: 'Online' | 'Offline') => {
    setIsSurvivalModalOpen(false);
    setOnlineModalWagerTier(undefined);
    setGameMode('survival');
    if (mode === 'Offline') {
      setModeContext('Survival Master - Offline');
      setCurrentView('country_selection');
    } else {
      setOnlineModalGameMode('survival');
      setIsOnlineModalOpen(true);
    }
  };

  const handleStartSurvival = () => {
    handleChooseSurvivalMode('Offline');
  };

  const handleSurvivalCompleted = (finalStreak: number, score: number) => {
    setBestSurvivalStreak((prev) => {
      const best = Math.max(prev, finalStreak);
      crazyGamesSDK.setItem(SURVIVAL_BEST_KEY, String(best));
      return best;
    });
  };

  const handleChooseMode = (category: 'Quick Play' | 'Tournament', mode: 'Online' | 'Offline') => {
    setActiveModal(null);
    setGameMode('match');
    if (mode === 'Offline') {
      if (category === 'Tournament') {
        setModeContext('World Cup Tournament - Offline');
        if (tournamentState && !tournamentState.isUserEliminated && !tournamentState.isUserChampion) {
          setCurrentView('tournament_hub');
        } else {
          setCurrentView('tournament_selection');
        }
      } else {
        setModeContext(`${category} - Offline`);
        setCurrentView('country_selection');
      }
    } else {
      // Open the 3-button Online Match Modal directly!
      setOnlineModalGameMode('match');
      setIsOnlineModalOpen(true);
    }
  };

  // Tournament Flow Handlers
  const handleTournamentTeamSelected = (myTeam: Country) => {
    const initialState = initTournamentState(myTeam);
    setTournamentState(initialState);
    saveTournamentState(initialState);
    setSelectedCountry(myTeam);
    setCurrentView('tournament_hub');
  };

  const handlePlayTournamentMatch = (match: TournamentMatch | KnockoutMatch) => {
    if (!tournamentState) return;

    setActiveTournamentMatch(match);
    setSelectedCountry(tournamentState.userCountry);

    const isUserHome = Boolean(
      match.homeTeam &&
      (match.homeTeam.id === tournamentState.userCountry.id ||
        match.homeTeam.code === tournamentState.userCountry.code)
    );
    const opp = isUserHome ? match.awayTeam : match.homeTeam;

    setOpponentCountry(opp || null);
    setGameMode('match');
    setModeContext(`World Cup • ${match.stageName}`);
    setCurrentView('stadium');
  };

  const handleTournamentMatchCompleted = (
    homeScore: number,
    awayScore: number,
    homePenalties?: number,
    awayPenalties?: number
  ) => {
    if (!tournamentState || !activeTournamentMatch) {
      setCurrentView('tournament_hub');
      return;
    }

    const { updatedState } = processCompletedRound(
      tournamentState,
      activeTournamentMatch,
      homeScore,
      awayScore,
      homePenalties,
      awayPenalties
    );

    setTournamentState(updatedState);
    saveTournamentState(updatedState);
    setActiveTournamentMatch(null);
    setCurrentView('tournament_hub');
  };

  const handleChooseFreeKickPractice = () => {
    setActiveModal(null);
    // Pick two distinct random teams so the user straight up enters the match
    const team1 = COUNTRIES_DATA[Math.floor(Math.random() * COUNTRIES_DATA.length)];
    const otherTeams = COUNTRIES_DATA.filter((c) => c.id !== team1.id);
    const team2 = otherTeams[Math.floor(Math.random() * otherTeams.length)];

    setSelectedCountry(team1);
    setOpponentCountry(team2);
    setGameMode('free_kick_training');
    setModeContext(`Free Kick Training • ${team1.name} vs ${team2.name}`);
    setSelectedOption(`Free Kick Training • ${team1.name} vs ${team2.name}`);
    setCurrentView('stadium');
  };

  const handleChoosePenaltyPractice = () => {
    setActiveModal(null);
    // Pick two distinct random teams
    const team1 = COUNTRIES_DATA[Math.floor(Math.random() * COUNTRIES_DATA.length)];
    const otherTeams = COUNTRIES_DATA.filter((c) => c.id !== team1.id);
    const team2 = otherTeams[Math.floor(Math.random() * otherTeams.length)];

    setSelectedCountry(team1);
    setOpponentCountry(team2);
    setGameMode('penalty_training');
    setModeContext(`Penalty Training • ${team1.name} vs ${team2.name}`);
    setSelectedOption(`Penalty Training • ${team1.name} vs ${team2.name}`);
    setCurrentView('stadium');
  };

  const handleCountryConfirmed = (myTeam: Country, opponent?: Country) => {
    setSelectedCountry(myTeam);
    setOpponentCountry(opponent || null);
    setActiveOnlineRoom(null);
    if (gameMode === 'survival') {
      setModeContext(`Survival Master • 3 Lives • ${myTeam.name} vs ${opponent?.name || 'AI'}`);
      setSelectedOption(`Survival Master • ${myTeam.name} vs ${opponent?.name || 'AI'}`);
    } else {
      setSelectedOption(`${modeContext} • ${myTeam.name} ${opponent ? `vs ${opponent.name}` : ''}`);
    }
    setCurrentView('stadium');
  };

  const handleOnlineRoomConnected = (room: OnlineMatchRoom) => {
    setActiveOnlineRoom(room);
    setIsOnlineModalOpen(false);
    setCurrentView('online_country_selection');
  };

  const handleStartOnlineMatch = (myTeam: Country, oppTeam: Country, room: OnlineMatchRoom) => {
    const finalRoom = room || activeOnlineRoom || onlineMatchManager.currentRoom;
    setSelectedCountry(myTeam);
    setOpponentCountry(oppTeam);
    if (finalRoom) {
      setActiveOnlineRoom(finalRoom);
      const isWager = Boolean(finalRoom.wagerTier);
      const resolvedGameMode = isWager ? 'match' : (finalRoom.gameMode || 'match');
      setGameMode(resolvedGameMode);
      if (isWager) {
        setModeContext(`Coin Wager Match (${(finalRoom.prizePot || 0).toLocaleString()} Pot) • Room ${finalRoom.roomId || 'ONLINE'}`);
        setSelectedOption(`Wager Match • ${(finalRoom.prizePot || 0).toLocaleString()} Coins Pot • ${myTeam.name} vs ${oppTeam.name}`);
      } else if (finalRoom.gameMode === 'survival') {
        setModeContext(`Online 1v1 Survival • Room ${finalRoom.roomId || 'ONLINE'}`);
        setSelectedOption(`Online Survival • ${myTeam.name} vs ${oppTeam.name}`);
      } else {
        setModeContext(`1v1 Online Match • Room ${finalRoom.roomId || 'ONLINE'}`);
        setSelectedOption(`Online Match • ${myTeam.name} vs ${oppTeam.name}`);
      }
    } else {
      setGameMode(onlineModalGameMode === 'survival' ? 'survival' : 'match');
      setModeContext(onlineModalGameMode === 'survival' ? 'Online 1v1 Survival' : '1v1 Online Match');
      setSelectedOption(`Online Match • ${myTeam.name} vs ${oppTeam.name}`);
    }
    setCurrentView('stadium');
  };

  if (currentView === 'stadium' && selectedCountry) {
    const isTournament = Boolean(activeTournamentMatch || modeContext.toLowerCase().includes('world cup'));

    return (
      <Stadium3DView
        country={selectedCountry}
        opponentCountry={opponentCountry || undefined}
        titleMode={modeContext}
        gameMode={gameMode}
        onSurvivalComplete={handleSurvivalCompleted}
        onlineMatchRoom={activeOnlineRoom}
        tournamentState={isTournament ? tournamentState : null}
        activeTournamentMatch={isTournament ? activeTournamentMatch : null}
        equippedBallId={equippedBallId}
        equippedPitchId={equippedPitchId}
        savedReplayClip={activeSavedReplay}
        onEarnCoins={(amount) => {
          updateCoins((prev) => prev + amount);
        }}
        onBack={() => {
          if (activeSavedReplay) {
            setActiveSavedReplay(null);
            setCurrentView('saved_replays');
          } else if (activeOnlineRoom) {
            onlineMatchManager.leaveRoom();
            setActiveOnlineRoom(null);
            setCurrentView('menu');
          } else if (isTournament && tournamentState) {
            setCurrentView('tournament_hub');
          } else {
            setCurrentView('menu');
          }
        }}
        onReselectTeam={() => {
          if (activeSavedReplay) {
            setActiveSavedReplay(null);
            setCurrentView('saved_replays');
            return;
          }
          if (activeOnlineRoom) {
            const wasWager = Boolean(activeOnlineRoom.wagerTier);
            onlineMatchManager.leaveRoom();
            setActiveOnlineRoom(null);
            setCurrentView('menu');
            if (wasWager) {
              setIsWagerArenaModalOpen(true);
            } else {
              setIsOnlineModalOpen(true);
            }
          } else if (isTournament) {
            setCurrentView('tournament_selection');
          } else {
            setCurrentView('country_selection');
          }
        }}
        onReturnToTournament={isTournament ? handleTournamentMatchCompleted : undefined}
      />
    );
  }

  if (currentView === 'store') {
    return (
      <StorePage
        coins={coins}
        unlockedBallIds={unlockedBallIds}
        equippedBallId={equippedBallId}
        unlockedPitchIds={unlockedPitchIds}
        equippedPitchId={equippedPitchId}
        onBack={() => setCurrentView('menu')}
        onUnlockBall={(id, price) => {
          updateCoins((c) => Math.max(0, c - price));
          setUnlockedBallIds((prev) => {
            const updated = prev.includes(id) ? prev : [...prev, id];
            crazyGamesSDK.setItem(UNLOCKED_BALLS_KEY, JSON.stringify(updated));
            return updated;
          });
        }}
        onEquipBall={(id) => {
          setEquippedBallId(id);
          crazyGamesSDK.setItem(EQUIPPED_BALL_KEY, id);
        }}
        onUnlockPitch={(id, price) => {
          updateCoins((c) => Math.max(0, c - price));
          setUnlockedPitchIds((prev) => {
            const updated = prev.includes(id) ? prev : [...prev, id];
            crazyGamesSDK.setItem(UNLOCKED_PITCHES_KEY, JSON.stringify(updated));
            return updated;
          });
        }}
        onEquipPitch={(id) => {
          setEquippedPitchId(id);
          crazyGamesSDK.setItem(EQUIPPED_PITCH_KEY, id);
        }}
        onAddCoins={(amount) => updateCoins((c) => c + amount)}
      />
    );
  }

  if (currentView === 'tournament_selection') {
    return (
      <TournamentTeamSelectionPage
        onBack={() => setCurrentView('menu')}
        onSelectCountry={handleTournamentTeamSelected}
      />
    );
  }

  if (currentView === 'tournament_hub' && tournamentState) {
    return (
      <TournamentHubPage
        tournamentState={tournamentState}
        onBackToMenu={() => setCurrentView('menu')}
        onPlayMatch={handlePlayTournamentMatch}
        onUpdateTournament={(updatedState) => {
          setTournamentState(updatedState);
          saveTournamentState(updatedState);
        }}
        onCancelTournament={() => {
          clearTournamentState();
          setTournamentState(null);
          setActiveTournamentMatch(null);
          setCurrentView('menu');
        }}
      />
    );
  }

  if (currentView === 'online_country_selection' && activeOnlineRoom) {
    return (
      <OnlineCountrySelectionPage
        room={activeOnlineRoom}
        onBack={() => {
          setActiveOnlineRoom(null);
          setCurrentView('menu');
        }}
        onMatchStart={handleStartOnlineMatch}
      />
    );
  }

  if (currentView === 'saved_replays') {
    return (
      <SavedReplaysPage
        playerName={playerName}
        userProfilePicture={userProfilePicture}
        coins={coins}
        bestSurvivalStreak={bestSurvivalStreak}
        onBack={() => setCurrentView('menu')}
        onQuickPlay={() => {
          setModeContext('Quick Play - Offline');
          setGameMode('match');
          setCurrentView('country_selection');
        }}
        onPlayReplay={(replay) => {
          setActiveSavedReplay(replay);
          const kicker = COUNTRIES_DATA.find((c) => c.code === replay.kickerCountryCode) || COUNTRIES_DATA[0];
          const defender = COUNTRIES_DATA.find((c) => c.code === replay.opponentCountryCode) || COUNTRIES_DATA[1];
          setSelectedCountry(kicker);
          setOpponentCountry(defender);
          setModeContext(`Replay • ${replay.kickerCountryName} vs ${replay.opponentCountryName}`);
          setCurrentView('stadium');
        }}
      />
    );
  }

  if (currentView === 'country_selection') {
    return (
      <CountrySelectionPage
        titleMode={modeContext}
        onBack={() => setCurrentView('menu')}
        onSelectCountry={handleCountryConfirmed}
      />
    );
  }

  if (currentView === 'language_selection') {
    return (
      <LanguageSelectionPage
        onBack={() => setCurrentView('menu')}
      />
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full h-[100dvh] max-h-[100dvh] bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 text-slate-900 flex flex-col items-center justify-center p-3 sm:p-6 select-none font-sans overflow-y-auto">
      
      {/* Top Left Coin Display Bar with +50 ADS Button */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 lg:top-10 lg:left-10 z-20 flex items-center gap-2 sm:gap-3"
      >
        <div className="bg-white/95 backdrop-blur-md border-[3px] md:border-[4px] lg:border-[4.5px] border-black shadow-[0_5px_0_0_#000] md:shadow-[0_7px_0_0_#000] lg:shadow-[0_9px_0_0_#000] rounded-full px-3.5 sm:px-4 md:px-5 lg:px-7 py-1.5 sm:py-2 md:py-2.5 lg:py-3.5 flex items-center gap-2.5 sm:gap-3 md:gap-4">
          <CoinIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-11 lg:h-11" />
          <span className="text-base sm:text-lg md:text-2xl lg:text-3xl font-black text-black tracking-wider">
            {coins.toLocaleString()}
          </span>
        </div>

        {/* +50 COINS Video Ads Button */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95, y: 1 }}
          onClick={() => {
            crazyGamesSDK.requestAd('rewarded', {
              adStarted: () => {},
              adFinished: () => {
                updateCoins((prev) => prev + 50);
              },
              adError: () => {
                setIsAdsComingSoonOpen(true);
              },
            }).catch(() => {
              setIsAdsComingSoonOpen(true);
            });
          }}
          className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 border-[3px] md:border-[4px] lg:border-[4.5px] border-black shadow-[0_5px_0_0_#000] md:shadow-[0_7px_0_0_#000] lg:shadow-[0_9px_0_0_#000] rounded-full px-3 sm:px-4 md:px-5 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3.5 flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none outline-none"
          title={t('common.watchAdCoins', 'Watch video ad for +50 free coins')}
        >
          <Video className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-black fill-black shrink-0" />
          <span className="font-black text-xs sm:text-sm md:text-base lg:text-lg text-black uppercase tracking-wider whitespace-nowrap">
            +50 {t('common.coins', 'COINS')}
          </span>
        </motion.button>
      </motion.div>

      {/* Top Right Language Selector Button */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 lg:top-10 lg:right-10 z-20 flex items-center gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95, y: 1 }}
          onClick={() => setCurrentView('language_selection')}
          className="bg-white/95 hover:bg-white backdrop-blur-md border-[3px] md:border-[3.5px] border-black shadow-[0_5px_0_0_#000] md:shadow-[0_7px_0_0_#000] rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2 cursor-pointer select-none outline-none transition-colors"
          title={t('nav.language', 'Language')}
        >
          <div className="w-5 h-3.5 sm:w-6 sm:h-4 rounded-[4px] border border-black overflow-hidden bg-slate-200 shrink-0">
            <LazyFlagImage
              countryCode={SUPPORTED_LANGUAGES.find((l) => l.code === language)?.countryCode || 'gb'}
              alt="Language Flag"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs sm:text-sm font-black text-black uppercase tracking-wider">
            {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.code.toUpperCase() || 'EN'}
          </span>
          <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
        </motion.button>
      </motion.div>

      {/* Center Wrapper: Title positioned nicely right above buttons as before */}
      <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl flex flex-col items-center justify-center">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-3 sm:mb-6 md:mb-8"
        >
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-amber-500 drop-shadow-[0_4px_0_#78350f] sm:drop-shadow-[0_6px_0_#78350f] [text-shadow:0_1px_0_#fef08a,0_2px_0_#f59e0b,0_3px_0_#d97706,0_4px_0_#b45309,0_5px_0_#78350f,0_8px_16px_rgba(0,0,0,0.7)] select-none">
            {t('game.title', 'FREE KICK LEGENDS')}
          </h1>
        </motion.div>

        {/* Main Menu Buttons Container - Sequential Stagger Entrance */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
              },
            },
          }}
          className="w-full flex flex-col gap-2.5 sm:gap-4 md:gap-4.5"
        >

          {/* Quick Play Button */}
          <motion.button
            variants={{
              hidden: { opacity: 0, x: -60, scale: 0.95 },
              visible: {
                opacity: 1,
                x: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 400, damping: 24 },
              },
            }}
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ y: 5, scale: 0.98, boxShadow: '0px 2px 0px 0px #000' }}
            onClick={() => handleSelect('quick_play')}
            className="w-full bg-white border-[3px] sm:border-[3.5px] border-black shadow-[0_5px_0_0_#000] sm:shadow-[0_7px_0_0_#000] rounded-[18px] sm:rounded-[22px] p-3 sm:p-4 md:p-5 text-left font-black cursor-pointer flex items-center justify-between outline-none focus:outline-none relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                <Play className="w-8 h-8 sm:w-11 sm:h-11 fill-black text-black ml-0.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl md:text-2xl font-black text-black uppercase tracking-wider">
                  {t('menu.quickPlay', 'QUICK PLAY')}
                </span>
                <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wider">
                  {t('menu.quickPlaySub', 'ONLINE & OFFLINE MATCHES')}
                </span>
              </div>
            </div>

            {/* Small Network Online Icon on the right (shifted downwards) */}
            <div
              className="flex items-center gap-1 bg-slate-100 text-slate-800 border-[1.5px] border-black rounded-full px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-2xs shrink-0 translate-y-1.5 sm:translate-y-2 mt-auto"
              title={t('menu.onlineMultiplayer', 'Online Multiplayer Available')}
            >
              <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 stroke-[2.5]" />
              <span className="hidden xs:inline">{t('common.online', 'ONLINE')}</span>
            </div>
          </motion.button>

          {/* Survival Mode (NEW Game Mode) */}
          <motion.button
            variants={{
              hidden: { opacity: 0, x: -60, scale: 0.95 },
              visible: {
                opacity: 1,
                x: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 400, damping: 24 },
              },
            }}
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ y: 5, scale: 0.98, boxShadow: '0px 2px 0px 0px #000' }}
            onClick={() => handleSelect('survival')}
            className="w-full bg-gradient-to-r from-orange-400 via-rose-300 to-amber-300 border-[3px] sm:border-[3.5px] border-black shadow-[0_5px_0_0_#000] sm:shadow-[0_7px_0_0_#000] rounded-[18px] sm:rounded-[22px] p-3 sm:p-4 md:p-5 text-left font-black cursor-pointer flex items-center justify-between outline-none focus:outline-none relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-500 border-[2.5px] border-black rounded-[14px] flex items-center justify-center shrink-0 shadow-xs">
                <Flame className="w-6 h-6 sm:w-8 sm:h-8 fill-white text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl md:text-2xl font-black text-black uppercase tracking-wider">
                    {t('menu.survivalMode', 'SURVIVAL MODE')}
                  </span>
                  <span className="bg-black text-amber-300 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border border-black uppercase tracking-wider">
                    {t('survival.threeLives', '3 LIVES')}
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm font-bold text-rose-950 uppercase tracking-wider">
                  {t('survival.endlessStreak', 'Endless Streak')} • {t('survival.best', 'Best')}: {bestSurvivalStreak} 🔥
                </span>
              </div>
            </div>

            {/* Right Controls: Network Online Icon & Streak Badge (shifted downwards) */}
            <div className="flex items-center gap-1.5 shrink-0 translate-y-1.5 sm:translate-y-2 mt-auto">
              <div
                className="flex items-center gap-1 bg-emerald-500 text-white border-[1.5px] border-black rounded-full px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-2xs"
                title={t('survival.onlineAvailable', 'Online 1v1 Survival Available')}
              >
                <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white stroke-[2.5]" />
                <span className="hidden xs:inline">{t('common.online', 'ONLINE')}</span>
              </div>
              <div className="hidden xs:flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-full border-[2px] border-black font-black text-xs text-black uppercase">
                <span>🔥 {t('survival.streak', 'STREAK')}</span>
              </div>
            </div>
          </motion.button>

          {/* High-Stakes Coin Wager Arena (Online-Only 1v1 Duels) */}
          <motion.button
            variants={{
              hidden: { opacity: 0, x: -60, scale: 0.95 },
              visible: {
                opacity: 1,
                x: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 400, damping: 24 },
              },
            }}
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ y: 5, scale: 0.98, boxShadow: '0px 2px 0px 0px #000' }}
            onClick={() => handleSelect('wager_arena')}
            className="w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 border-[3px] sm:border-[3.5px] border-black shadow-[0_5px_0_0_#000] sm:shadow-[0_7px_0_0_#000] rounded-[18px] sm:rounded-[22px] p-3 sm:p-4 md:p-5 text-left font-black cursor-pointer flex items-center justify-between outline-none focus:outline-none relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500 border-[2.5px] border-black rounded-[14px] flex items-center justify-center shrink-0 shadow-xs">
                <Swords className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl md:text-2xl font-black text-black uppercase tracking-wider">
                  {t('menu.wagerArena', 'COIN WAGER ARENA')}
                </span>
                <span className="text-[11px] sm:text-xs md:text-sm font-bold text-amber-950 uppercase tracking-wider">
                  {t('wager.betCoinsPot', 'Bet Coins • Winner Takes Entire Pot')}
                </span>
              </div>
            </div>

            {/* Right Controls: Network Online Icon & Duel Badge (shifted downwards) */}
            <div className="flex items-center gap-1.5 shrink-0 translate-y-1.5 sm:translate-y-2 mt-auto">
              <div
                className="flex items-center gap-1 bg-black text-emerald-400 border-[1.5px] border-black rounded-full px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-2xs"
                title={t('wager.onlineDuel', 'Online 1v1 Coin Wager Match')}
              >
                <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 stroke-[2.5]" />
                <span className="hidden xs:inline">{t('common.online', 'ONLINE')}</span>
              </div>
              <div className="hidden xs:flex items-center gap-1.5 bg-black text-amber-300 px-3 py-1.5 rounded-full border-[2px] border-black font-black text-xs uppercase shadow-xs">
                <Coins className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('wager.duel', 'DUEL')}</span>
              </div>
            </div>
          </motion.button>

          {/* FIFA World Cup Button */}
          <motion.button
            variants={{
              hidden: { opacity: 0, x: -60, scale: 0.95 },
              visible: {
                opacity: 1,
                x: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 400, damping: 24 },
              },
            }}
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ y: 5, scale: 0.98, boxShadow: '0px 2px 0px 0px #000' }}
            onClick={() => handleSelect('tournament')}
            className="w-full bg-white border-[3px] sm:border-[3.5px] border-black shadow-[0_5px_0_0_#000] sm:shadow-[0_7px_0_0_#000] rounded-[18px] sm:rounded-[22px] p-3 sm:p-4 md:p-5 text-left font-black cursor-pointer flex items-center justify-between outline-none focus:outline-none relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                <TrophyImage className="w-9 h-9 sm:w-11 sm:h-11" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl md:text-2xl font-black text-black uppercase tracking-wider">
                  {t('menu.worldCup', 'FIFA WORLD CUP')}
                </span>
                <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wider">
                  {t('menu.tournamentFormat', 'Tournament Format')}
                </span>
              </div>
            </div>
          </motion.button>

          {/* Practice Button */}
          <motion.button
            variants={{
              hidden: { opacity: 0, x: -60, scale: 0.95 },
              visible: {
                opacity: 1,
                x: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 400, damping: 24 },
              },
            }}
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ y: 5, scale: 0.98, boxShadow: '0px 2px 0px 0px #000' }}
            onClick={() => handleSelect('practice')}
            className="w-full bg-white border-[3px] sm:border-[3.5px] border-black shadow-[0_5px_0_0_#000] sm:shadow-[0_7px_0_0_#000] rounded-[18px] sm:rounded-[22px] p-3 sm:p-4 md:p-5 text-left font-black cursor-pointer flex items-center justify-between outline-none focus:outline-none relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faFutbol} className="text-2xl sm:text-3xl md:text-4xl text-black" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl md:text-2xl font-black text-black uppercase tracking-wider">
                  {t('menu.practice', 'PRACTICE')}
                </span>
                <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wider">
                  {t('menu.practiceSub', 'Free Kick Training')}
                </span>
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* User Profile Card (Clickable to view Profile & Saved Replays) */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 400, damping: 24 }}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setCurrentView('saved_replays')}
          className="mt-4 sm:mt-5 bg-white/95 hover:bg-white backdrop-blur-md border-[3px] border-black shadow-[0_4px_0_0_#000] hover:shadow-[0_6px_0_0_#000] rounded-[18px] sm:rounded-[20px] px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all group"
          title="Click to view Profile and Saved Replays"
        >
          {/* Profile Picture (Avatar) */}
          <div className="relative shrink-0">
            {userProfilePicture ? (
              <img
                src={userProfilePicture}
                alt={playerName}
                referrerPolicy="no-referrer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-[12px] border-[2px] border-black object-cover shadow-inner bg-slate-200"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[12px] bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 border-[2px] border-black flex items-center justify-center text-white shadow-inner">
                <User className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-[1.5px] border-white rounded-full shadow-xs" />

            {/* Red Notification Icon on Avatar if Saved Replays exist */}
            {savedReplaysCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 border-[1.5px] border-white rounded-full flex items-center justify-center shadow-xs animate-pulse"
                title={`${savedReplaysCount} Saved Replays`}
              >
                <Video className="w-2 h-2 text-white fill-white" />
              </span>
            )}
          </div>

          {/* Player Name & Saved Replays prompt */}
          <div className="flex flex-col text-left">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">
              {playerName}
            </span>
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-500 group-hover:text-amber-600 transition-colors">
              {t('profile.savedReplaysStats', 'SAVED REPLAYS & STATS')} →
            </span>
          </div>

          {/* Red Saved Replays Icon & Counter Badge on Profile UI if user has saved replays */}
          {savedReplaysCount > 0 && (
            <div
              className="ml-auto flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full px-2 py-0.5 border-[1.5px] border-black shadow-xs shrink-0"
              title={`${savedReplaysCount} ${t('replays.title', 'Saved Replays')}`}
            >
              <Video className="w-3 h-3 fill-white text-white" />
              <span className="text-[10px] font-black tracking-tight">{savedReplaysCount}</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Right Shop Button - Responsive Scaling for Bigger Screens */}
      <motion.button
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.65, type: 'spring', stiffness: 350, damping: 22 }}
        whileHover={{ y: -2, scale: 1.03 }}
        whileTap={{ y: 4, scale: 0.97, boxShadow: '0px 2px 0px 0px #000' }}
        onClick={() => handleSelect('shop')}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 lg:bottom-10 lg:right-10 z-40 bg-purple-500 text-white border-[3px] sm:border-[3.5px] md:border-[4.5px] border-black shadow-[0_5px_0_0_#000] sm:shadow-[0_6px_0_0_#000] md:shadow-[0_9px_0_0_#000] px-3.5 py-2 sm:px-5 sm:py-3 md:px-7 md:py-4 rounded-[18px] sm:rounded-[22px] md:rounded-[26px] font-black cursor-pointer flex items-center gap-2 sm:gap-3 md:gap-4 outline-none focus:outline-none"
      >
        <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-300 shrink-0" />
        <span className="text-xs sm:text-base md:text-xl font-black uppercase tracking-wider">
          {t('menu.shop', 'SHOP')}
        </span>
      </motion.button>

      {/* Quick Play Modal */}
      <AnimatePresence>
        {activeModal === 'quick_play' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 25 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="w-full max-w-md bg-white border-[4px] border-black rounded-[28px] p-6 sm:p-8 shadow-[0_12px_0_0_#000] relative text-black"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black mb-1">
                {t('menu.quickPlay', 'QUICK PLAY')}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mb-6 font-bold uppercase tracking-wider">
                {t('quickPlay.selectMode', 'Select match mode:')}
              </p>

              <div className="flex flex-col gap-3.5">
                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  onClick={() => handleChooseMode('Quick Play', 'Online')}
                  className="w-full py-3.5 sm:py-4 px-5 rounded-[18px] font-black text-base sm:text-lg uppercase tracking-wider bg-amber-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-between outline-none focus:outline-none"
                >
                  <span>{t('common.online', 'ONLINE')}</span>
                  <span className="text-[10px] sm:text-xs bg-black text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                    {t('quickPlay.ranked', 'Ranked')}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  onClick={() => handleChooseMode('Quick Play', 'Offline')}
                  className="w-full py-3.5 sm:py-4 px-5 rounded-[18px] font-black text-base sm:text-lg uppercase tracking-wider bg-sky-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-between outline-none focus:outline-none"
                >
                  <span>{t('common.offline', 'OFFLINE')}</span>
                  <span className="text-[10px] sm:text-xs bg-black text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                    {t('quickPlay.vsAi', 'Vs AI / Local')}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tournament Modal */}
      <AnimatePresence>
        {activeModal === 'tournament' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 25 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="w-full max-w-md bg-white border-[4px] border-black rounded-[28px] p-6 sm:p-8 shadow-[0_12px_0_0_#000] relative text-black"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black mb-1">
                {t('menu.worldCup', 'FIFA WORLD CUP')}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mb-6 font-bold uppercase tracking-wider">
                {t('tournament.selectFormat', 'Select game format:')}
              </p>

              <div className="flex flex-col gap-3.5">
                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  onClick={() => {
                    setActiveModal(null);
                    setIsTournamentComingSoonOpen(true);
                  }}
                  className="w-full py-3.5 sm:py-4 px-5 rounded-[18px] font-black text-base sm:text-lg uppercase tracking-wider bg-amber-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-between outline-none focus:outline-none"
                >
                  <span>{t('common.online', 'ONLINE')}</span>
                  <span className="text-[10px] sm:text-xs bg-black text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                    {t('tournament.globalCup', 'Global Cup')}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  onClick={() => handleChooseMode('Tournament', 'Offline')}
                  className="w-full py-3.5 sm:py-4 px-5 rounded-[18px] font-black text-base sm:text-lg uppercase tracking-wider bg-sky-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-between outline-none focus:outline-none"
                >
                  <span>{t('common.offline', 'OFFLINE')}</span>
                  <span className="text-[10px] sm:text-xs bg-black text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                    {t('tournament.customCup', 'Custom Cup')}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Practice Modal */}
      <AnimatePresence>
        {activeModal === 'practice' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 25 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="w-full max-w-md bg-white border-[4px] border-black rounded-[28px] p-6 sm:p-8 shadow-[0_12px_0_0_#000] relative text-black"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black mb-1">
                {t('menu.practice', 'PRACTICE')}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mb-6 font-bold uppercase tracking-wider">
                {t('practice.selectDrill', 'Select practice training drill:')}
              </p>

              <div className="flex flex-col gap-3.5">
                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  onClick={handleChooseFreeKickPractice}
                  className="w-full py-3.5 sm:py-4 px-5 rounded-[18px] font-black text-base sm:text-lg uppercase tracking-wider bg-amber-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-between outline-none focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faFutbol} className="text-xl text-black" />
                    <div className="flex flex-col text-left">
                      <span>{t('practice.freeKick', 'FREE KICK')}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-800 normal-case">
                        {t('practice.freeKickSub', 'Instant Play • Wall defense & angle drills')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs bg-black text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                    {t('practice.instant', 'Instant')}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  onClick={handleChoosePenaltyPractice}
                  className="w-full py-3.5 sm:py-4 px-5 rounded-[18px] font-black text-base sm:text-lg uppercase tracking-wider bg-sky-400 text-black border-[3px] border-black shadow-[0_5px_0_0_#000] cursor-pointer flex items-center justify-between outline-none focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-black" />
                    <div className="flex flex-col text-left">
                      <span>{t('practice.penalty', 'PENALTY')}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-800 normal-case">
                        {t('practice.penaltySub', '1v1 vs GK • Untimed')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs bg-black text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                    {t('practice.random', 'Random')}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Online 1v1 Match Modal */}
      <OnlineMatchModal
        isOpen={isOnlineModalOpen}
        selectedCountry={selectedCountry || COUNTRIES_DATA[0]}
        gameMode={onlineModalGameMode}
        wagerTier={onlineModalWagerTier?.id}
        entryFee={onlineModalWagerTier?.entryFee}
        prizePot={onlineModalWagerTier?.prizePot}
        title={
          onlineModalWagerTier
            ? `${onlineModalWagerTier.name} ${t('wager.arena', 'Arena')}`
            : onlineModalGameMode === 'survival'
            ? t('survival.onlineSurvivalTitle', 'ONLINE SURVIVAL 1V1')
            : t('online.matchTitle', 'ONLINE MATCH')
        }
        subtitle={
          onlineModalWagerTier
            ? `${t('wager.bet', 'Bet')} ${onlineModalWagerTier.entryFee.toLocaleString()} ${t('common.coins', 'Coins')} • ${t('wager.winnerTakes', 'Winner Takes')} ${onlineModalWagerTier.prizePot.toLocaleString()} ${t('common.coins', 'Coins')} ${t('wager.prizePot', 'Prize Pot!')}`
            : onlineModalGameMode === 'survival'
            ? t('survival.onlineSurvivalSubtitle', '3 Lives • Live 1v1 Survival Duel • Endless Streak Challenge')
            : t('online.matchSubtitle', 'Connect and pick your country together in real-time:')
        }
        onClose={() => {
          setIsOnlineModalOpen(false);
          setOnlineModalWagerTier(undefined);
        }}
        onRoomConnected={handleOnlineRoomConnected}
      />

      {/* Online Tournament Coming Soon Modal */}
      <AnimatePresence>
        {isTournamentComingSoonOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 25 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="w-full max-w-md bg-white border-[4px] border-black rounded-[28px] p-6 sm:p-7 shadow-[0_14px_0_0_#000] relative text-black select-none text-center"
            >
              {/* Close Top Button */}
              <button
                onClick={() => setIsTournamentComingSoonOpen(false)}
                className="absolute top-4 right-4 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-slate-100 shadow-2xs"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Glowing Trophy Icon */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl animate-pulse" />
                <TrophyImage className="w-full h-full relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]" />
              </div>

              {/* Coming Soon Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 border-[2px] border-black shadow-[0_2px_0_0_#000] text-black font-black text-xs uppercase tracking-wider mb-2">
                <span>🚀 {t('tournament.inDevelopment', 'IN DEVELOPMENT')}</span>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black mb-1.5">
                {t('tournament.onlineWorldCup', 'ONLINE FIFA WORLD CUP')}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-bold uppercase tracking-wider mb-5">
                {t('tournament.multiplayerWorldCup', 'Multiplayer World Cups & Knockout Brackets')}
              </p>

              {/* Feature Preview Cards */}
              <div className="w-full bg-slate-50 border-[2.5px] border-black rounded-[20px] p-3.5 sm:p-4 flex flex-col gap-2.5 mb-6 text-left shadow-inner">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🏆</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-black uppercase">
                      {t('tournament.knockoutBrackets', '16-Player Knockout Brackets')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {t('tournament.knockoutBracketsSub', 'Real-time elimination cups with live brackets')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 border-t border-slate-200 pt-2">
                  <span className="text-base">🌍</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-black uppercase">
                      {t('tournament.globalLeaderboards', 'Global Season Leaderboards')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {t('tournament.globalLeaderboardsSub', 'Earn ranking points & trophy badges')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 border-t border-slate-200 pt-2">
                  <span className="text-base">🥇</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-black uppercase">
                      {t('tournament.exclusiveUnlockables', 'Exclusive Champion Kits & Balls')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {t('tournament.exclusiveUnlockablesSub', 'Special custom unlockables for tournament winners')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98, boxShadow: '0px 1px 0px 0px #000' }}
                  onClick={() => {
                    setIsTournamentComingSoonOpen(false);
                    setModeContext('World Cup Tournament - Offline');
                    setCurrentView('tournament_selection');
                  }}
                  className="w-full py-3.5 px-5 rounded-[18px] font-black text-sm uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-green-400 text-black border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer flex items-center justify-center gap-2 outline-none"
                >
                  <span>{t('tournament.playOfflineNow', 'PLAY OFFLINE WORLD CUP NOW')}</span>
                  <span className="text-base">→</span>
                </motion.button>

                <motion.button
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ y: 4, scale: 0.98 }}
                  onClick={() => setIsTournamentComingSoonOpen(false)}
                  className="w-full py-2.5 rounded-[16px] font-black text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-800 border-[2px] border-black cursor-pointer"
                >
                  {t('common.close', 'CLOSE')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rewarded Ads +50 Coins Coming Soon Modal */}
      <AnimatePresence>
        {isAdsComingSoonOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsAdsComingSoonOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 25 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white border-[4px] border-black rounded-[28px] p-6 sm:p-7 shadow-[0_14px_0_0_#000] relative text-black select-none text-center"
            >
              {/* Close Top Button */}
              <button
                onClick={() => setIsAdsComingSoonOpen(false)}
                className="absolute top-4 right-4 text-black hover:bg-rose-500 hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-full border-2 border-black transition-all cursor-pointer bg-slate-100 shadow-2xs"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Coin Icon Header */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse" />
                <CoinIcon className="w-16 h-16 sm:w-20 sm:h-20 relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]" />
              </div>

              {/* Coming Soon / Info Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 border-[2px] border-black shadow-[0_2px_0_0_#000] text-black font-black text-xs uppercase tracking-wider mb-2">
                <Video className="w-3.5 h-3.5 fill-black text-black" />
                <span>{t('ads.videoReward', 'VIDEO REWARD')}</span>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black mb-1.5">
                +50 {t('ads.coinsReward', 'COINS REWARD')}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-bold uppercase tracking-wider mb-5">
                {t('ads.watchToEarn', 'Watch video ads to earn +50 free coins')}
              </p>

              {/* Info Box */}
              <div className="w-full bg-slate-50 border-[2.5px] border-black rounded-[20px] p-4 flex flex-col gap-2.5 mb-6 text-left shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-400 border-[2px] border-black flex items-center justify-center shrink-0 font-black text-sm">
                    +50
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-black uppercase">{t('ads.instantBoost', 'Instant Coin Boost')}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {t('ads.integrationFinalizing', 'Rewarded ads integration is currently being finalized.')}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-2 text-[11px] font-bold text-slate-600 text-center">
                  {t('ads.unlockAllItems', 'Unlock all 50 ball textures and 50 stadium pitch patterns with coin rewards!')}
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ y: 4, scale: 0.98 }}
                onClick={() => setIsAdsComingSoonOpen(false)}
                className="w-full py-3.5 px-5 rounded-[18px] font-black text-sm uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-black border-[3px] border-black shadow-[0_4px_0_0_#000] cursor-pointer outline-none"
              >
                {t('common.gotIt', 'GOT IT')}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Survival Hub Modal */}
      <SurvivalHubModal
        isOpen={isSurvivalModalOpen}
        onClose={() => setIsSurvivalModalOpen(false)}
        onSelectMode={handleChooseSurvivalMode}
        onStartSurvival={handleStartSurvival}
        bestStreak={bestSurvivalStreak}
      />

      {/* High-Stakes Coin Wager Arena Tier Selection Modal */}
      <WagerArenaSelectModal
        isOpen={isWagerArenaModalOpen}
        userCoins={coins}
        onClose={() => setIsWagerArenaModalOpen(false)}
        onSelectTier={handleSelectWagerTier}
      />
    </div>
  );
}

