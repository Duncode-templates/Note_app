import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Country, COUNTRIES_DATA } from '../data/countries';
import { KingOfTheHillMatchState, KingOfTheHillContender, KingShotOutcome, OnlineMatchRoom } from '../types';
import {
  KING_ROUNDS_4P,
  calculateUserKingShotScore,
  generateRandomRoundPositions,
  generateShuffledPlayPositions,
} from '../data/kingOfTheHillData';
import Stadium3DView from './Stadium3DView';
import KingOfTheHillHUD from './KingOfTheHillHUD';
import KingOfTheHillResultsModal from './KingOfTheHillResultsModal';
import { onlineMatchManager } from '../utils/onlineMatchManager';

interface KingOfTheHillControllerProps {
  country: Country;
  initialMatchState: KingOfTheHillMatchState;
  onBack: () => void;
  onEarnCoins: (amount: number) => void;
  equippedBallId?: string;
  equippedPitchId?: string;
  onRematchRequested: (playerCount: 4, tierId: 'free' | 'rookie' | 'pro' | 'champion') => void;
  isOnline?: boolean;
  onlineRoom?: OnlineMatchRoom | null;
}

export default function KingOfTheHillController({
  country,
  initialMatchState,
  onBack,
  onEarnCoins,
  equippedBallId,
  equippedPitchId,
  onRematchRequested,
  isOnline = false,
  onlineRoom,
}: KingOfTheHillControllerProps) {
  const isOnlineMatch = Boolean(isOnline && (onlineRoom || onlineMatchManager.currentRoom));
  const [currentHostId, setCurrentHostId] = useState<string>(
    onlineMatchManager.currentRoom?.host?.id || initialMatchState.contenders[0]?.id || ''
  );
  const [leaderTransferNotice, setLeaderTransferNotice] = useState<string | null>(null);
  const isLocalHost = Boolean(
    !isOnlineMatch ||
    (currentHostId ? currentHostId === onlineMatchManager.localPlayerId : onlineMatchManager.currentRoom?.host?.id === onlineMatchManager.localPlayerId)
  );

  const [matchState, setMatchState] = useState<KingOfTheHillMatchState>(() => {
    if (!isOnlineMatch) return initialMatchState;
    return {
      ...initialMatchState,
      contenders: initialMatchState.contenders.map((c) => ({
        ...c,
        isLocalPlayer: c.id === onlineMatchManager.localPlayerId,
      })),
    };
  });
  const matchStateRef = useRef<KingOfTheHillMatchState>(matchState);
  useEffect(() => {
    matchStateRef.current = matchState;
  }, [matchState]);

  const [roundTimeLeft, setRoundTimeLeft] = useState<number>(initialMatchState.roundTimeLeft);
  const [isSceneLoading, setIsSceneLoading] = useState<boolean>(true);
  const [isEliminationScreenOpen, setIsEliminationScreenOpen] = useState<boolean>(false);
  const [hasAwardedCoins, setHasAwardedCoins] = useState<boolean>(false);

  // Pool of unique shuffled positions ensuring EVERY single play / turn is completely randomized
  const playPositionsPoolRef = useRef<number[]>(
    initialMatchState.roundPositions && initialMatchState.roundPositions.length >= 10
      ? [...initialMatchState.roundPositions]
      : generateShuffledPlayPositions(30)
  );
  const playPositionCursorRef = useRef<number>(1); // Index 0 was assigned to the initial play

  const getNextPlayPosition = useCallback((): number => {
    if (playPositionCursorRef.current >= playPositionsPoolRef.current.length) {
      const lastPos = playPositionsPoolRef.current[playPositionsPoolRef.current.length - 1];
      const newPool = generateShuffledPlayPositions(30);
      if (newPool[0] === lastPos && newPool.length > 1) {
        [newPool[0], newPool[1]] = [newPool[1], newPool[0]];
      }
      playPositionsPoolRef.current = newPool;
      playPositionCursorRef.current = 0;
    }
    const nextPos = playPositionsPoolRef.current[playPositionCursorRef.current];
    playPositionCursorRef.current += 1;
    return nextPos;
  }, []);

  const [forcedPositionIndex, setForcedPositionIndex] = useState<number>(
    initialMatchState.positionIndex ?? playPositionsPoolRef.current[0]
  );

  // Sequential Turn Management State (1 ball at a time for all players, 5 balls total per round)
  const [currentBallIndex, setCurrentBallIndex] = useState<number>(0);
  const currentBallIndexRef = useRef<number>(0);
  useEffect(() => {
    currentBallIndexRef.current = currentBallIndex;
  }, [currentBallIndex]);

  const [activeContenderId, setActiveContenderId] = useState<string>(initialMatchState.activeContenderId || '');
  const activeContenderIdRef = useRef<string>(activeContenderId);
  useEffect(() => {
    activeContenderIdRef.current = activeContenderId;
  }, [activeContenderId]);

  const [activeShotIndex, setActiveShotIndex] = useState<number>(0);
  const activeShotIndexRef = useRef<number>(0);
  useEffect(() => {
    activeShotIndexRef.current = activeShotIndex;
  }, [activeShotIndex]);

  const [kothTurnKey, setKothTurnKey] = useState<string>('');
  const [botCommentary, setBotCommentary] = useState<string | null>(null);

  // 10s Shot Timer per Player State & Ref
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(10);
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);

  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundsConfig = KING_ROUNDS_4P;

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    };
  }, []);

  /**
   * Transition to a specific contender and ball index in the 3D stadium.
   * Dynamically assigns a freshly randomized free kick pitch position for each play!
   * Starts a 10s countdown timer for this player's shot.
   */
  const transitionToTurn = useCallback((contenderId: string, ballIndex: number, newPositionIndex?: number) => {
    activeContenderIdRef.current = contenderId;
    setActiveContenderId(contenderId);
    activeShotIndexRef.current = ballIndex;
    setActiveShotIndex(ballIndex);

    // Apply the fresh random position for this contender's play
    const targetPosIndex = newPositionIndex !== undefined ? newPositionIndex : getNextPlayPosition();
    setForcedPositionIndex(targetPosIndex);

    // Reset and start 10s timer for this player's shot
    setTurnTimeLeft(10);
    if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    turnTimerRef.current = setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          if (turnTimerRef.current) clearInterval(turnTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const key = `koth_r${matchStateRef.current.currentRound}_b${ballIndex}_c${contenderId}_p${targetPosIndex}_${Date.now()}`;
    setKothTurnKey(key);

    setMatchState((prev) => ({
      ...prev,
      positionIndex: targetPosIndex,
      activeContenderId: contenderId,
      activeShotIndex: ballIndex,
    }));
  }, [getNextPlayPosition]);

  // Online Multiplayer Event Synchronization
  useEffect(() => {
    if (!isOnlineMatch) return;

    // 1. Listen for authoritative turn advance
    const unsubTurn = onlineMatchManager.on('koth_turn_advance', (payload) => {
      if (payload.contenders) {
        const normalizedContenders = payload.contenders.map((c: KingOfTheHillContender) => ({
          ...c,
          isLocalPlayer: c.id === onlineMatchManager.localPlayerId,
        }));
        setMatchState((prev) => ({
          ...prev,
          contenders: normalizedContenders,
          activeContenderId: payload.nextContenderId,
          activeShotIndex: payload.ballIndex,
          positionIndex: payload.positionIndex,
        }));
      }
      currentBallIndexRef.current = payload.ballIndex;
      setCurrentBallIndex(payload.ballIndex);
      transitionToTurn(payload.nextContenderId, payload.ballIndex, payload.positionIndex);
    });

    // 2. Listen for round elimination advance
    const unsubRound = onlineMatchManager.on('koth_round_elimination', (payload) => {
      const normalizedContenders = (payload.contenders || []).map((c: KingOfTheHillContender) => ({
        ...c,
        isLocalPlayer: c.id === onlineMatchManager.localPlayerId,
      }));
      setMatchState((prev) => ({
        ...prev,
        currentRound: payload.nextRound,
        contenders: normalizedContenders,
        positionIndex: payload.positionIndex,
        activeShotIndex: 0,
        status: 'round_active',
      }));
      currentBallIndexRef.current = 0;
      setCurrentBallIndex(0);
      setIsEliminationScreenOpen(false);
      setLeaderTransferNotice(null);

      const firstAlive = normalizedContenders.find((c: KingOfTheHillContender) => !c.isEliminated);
      if (firstAlive) {
        transitionToTurn(firstAlive.id, 0, payload.positionIndex);
      }
    });

    // 3. Listen for peer shot outcome synchronization
    const unsubShot = onlineMatchManager.on('koth_shot_outcome', (payload) => {
      setMatchState((prev) => {
        const nextContenders = prev.contenders.map((c) => {
          if (c.id === payload.contenderId) {
            return {
              ...c,
              currentRoundScore: payload.currentRoundScore,
              currentRoundGoals: payload.currentRoundGoals,
              currentRoundShots: payload.currentRoundShots,
              totalScore: payload.totalScore,
              totalGoals: payload.totalGoals,
            };
          }
          return c;
        });
        return { ...prev, contenders: nextContenders };
      });
    });

    // 4. Listen for host leadership transfer (e.g. host eliminated or left)
    const unsubHost = onlineMatchManager.on('host_transferred', (payload) => {
      if (payload?.newHost) {
        setCurrentHostId(payload.newHost.id);
        const isMe = payload.newHost.id === onlineMatchManager.localPlayerId;
        setLeaderTransferNotice(
          isMe
            ? '👑 YOU ARE NOW THE ROOM LEADER! Advance to the next round when ready.'
            : `👑 Room leader was eliminated! Title transferred to ${payload.newHost.name || 'player'} (still in game).`
        );
      }
    });

    // 5. Listen for tournament completion across all clients
    const unsubConcluded = onlineMatchManager.on('koth_match_concluded', (payload) => {
      setIsEliminationScreenOpen(false);
      if (payload?.contenders) {
        const remainingAlive = payload.contenders.filter((c: KingOfTheHillContender) => !c.isEliminated);
        concludeMatch(remainingAlive);
      }
    });

    // 6. Listen for players disconnecting during active match
    const unsubPlayerLeft = onlineMatchManager.on('player_left', (payload) => {
      if (payload?.playerId) {
        setMatchState((prev) => ({
          ...prev,
          contenders: prev.contenders.map((c) =>
            c.id === payload.playerId ? { ...c, isEliminated: true } : c
          ),
        }));
      }
    });

    return () => {
      unsubTurn();
      unsubRound();
      unsubShot();
      unsubHost();
      unsubConcluded();
      unsubPlayerLeft();
    };
  }, [isOnlineMatch, transitionToTurn]);

  // Helper to get active contender object
  const activeContender = matchState.contenders.find((c) => c.id === activeContenderId);
  const isUserTurn = Boolean(activeContender?.isLocalPlayer && !activeContender.isEliminated);

  // Active bot's country object for custom 3D team kits and stadium ambiance
  const activeOpponentCountry = activeContender
    ? COUNTRIES_DATA.find((c) => c.code.toLowerCase() === activeContender.countryCode.toLowerCase())
    : undefined;

  // Next alive contender's country for when user is shooting
  const firstAliveBot = matchState.contenders.find((c) => !c.isEliminated && !c.isLocalPlayer);
  const nextOpponentCountry = firstAliveBot
    ? COUNTRIES_DATA.find((c) => c.code.toLowerCase() === firstAliveBot.countryCode.toLowerCase())
    : undefined;

  /**
   * Evaluates eliminations at the end of the round:
   * Lowest goals/score are eliminated before proceeding to the next round
   */
  const resolveRoundEliminations = useCallback(() => {
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    if (turnTimerRef.current) clearInterval(turnTimerRef.current);

    const current = matchStateRef.current;
    const alive = current.contenders.filter((c) => !c.isEliminated);

    // Sort alive contenders by current round goals ascending (lowest goals first), then by score ascending
    const sortedByLowest = [...alive].sort((a, b) => {
      if (a.currentRoundGoals !== b.currentRoundGoals) {
        return a.currentRoundGoals - b.currentRoundGoals;
      }
      return a.currentRoundScore - b.currentRoundScore;
    });

    const eliminateTargetCount = Math.min(current.eliminatedCountThisRound, alive.length - 1);
    const eliminatedIds = new Set<string>();

    for (let i = 0; i < eliminateTargetCount; i++) {
      eliminatedIds.add(sortedByLowest[i].id);
    }

    const updatedContenders = current.contenders.map((c) => {
      if (eliminatedIds.has(c.id)) {
        return {
          ...c,
          isEliminated: true,
          eliminatedInRound: current.currentRound,
        };
      }
      return c;
    });

    // Check if the current room leader was eliminated in this round
    const effectiveHostId = currentHostId || onlineMatchManager.currentRoom?.host?.id || current.contenders[0]?.id;
    const isLeaderEliminated = eliminatedIds.has(effectiveHostId);

    if (isOnlineMatch && isLeaderEliminated) {
      const remainingAlive = updatedContenders.filter((c) => !c.isEliminated);
      // Prefer an active human contender, or the highest ranked survivor
      const nextLeader = remainingAlive.find((c) => !c.isBot) || remainingAlive[0];
      if (nextLeader) {
        if (isLocalHost || effectiveHostId === onlineMatchManager.localPlayerId) {
          onlineMatchManager.transferHostLeadershipToAlivePlayer(
            nextLeader.id,
            nextLeader.name,
            nextLeader.countryCode,
            nextLeader.avatarUrl
          );
        }
        setCurrentHostId(nextLeader.id);
        const isMe = nextLeader.id === onlineMatchManager.localPlayerId;
        setLeaderTransferNotice(
          isMe
            ? '👑 YOU ARE NOW THE ROOM LEADER! Advance the tournament to the next round.'
            : `👑 Room leader was eliminated! Title transferred to ${nextLeader.name} (still in the game).`
        );
      }
    }

    setMatchState((prev) => ({
      ...prev,
      contenders: updatedContenders,
      status: 'round_elimination',
    }));

    setIsEliminationScreenOpen(true);
  }, [currentHostId, isLocalHost, isOnlineMatch]);

  /**
   * Called when ANY shot completes physically in Stadium3DView (User OR Bot)
   * Enforces 1 ball at a time for all players before advancing to the next ball!
   */
  const handleShotComplete = useCallback(
    (
      isGoal: boolean,
      outcomeText: string,
      powerRatio: number,
      isBullseye = false
    ) => {
      const current = matchStateRef.current;
      const currentContender = current.contenders.find((c) => c.id === activeContenderIdRef.current);
      if (!currentContender || currentContender.isEliminated) return;

      const userResult = calculateUserKingShotScore(isGoal, outcomeText, powerRatio, isBullseye);
      const newShots: KingShotOutcome[] = [...currentContender.currentRoundShots, userResult.outcome];
      const newGoals = currentContender.currentRoundGoals + (isGoal ? 1 : 0);
      const newScore = currentContender.currentRoundScore + userResult.score;

      // Update state for this contender
      const nextContenders = current.contenders.map((c) => {
        if (c.id === currentContender.id) {
          return {
            ...c,
            currentRoundOutcome: userResult.outcome,
            currentRoundScore: newScore,
            currentRoundGoals: newGoals,
            currentRoundShots: newShots,
            currentRoundDetails: userResult.details,
            totalScore: c.totalScore + userResult.score,
            totalGoals: c.totalGoals + (isGoal ? 1 : 0),
          };
        }
        return c;
      });

      setMatchState((prev) => ({
        ...prev,
        contenders: nextContenders,
      }));

      // Broadcast shot outcome across online room
      if (isOnlineMatch && currentContender.isLocalPlayer) {
        onlineMatchManager.syncKothShotOutcome({
          contenderId: currentContender.id,
          currentRoundScore: newScore,
          currentRoundGoals: newGoals,
          currentRoundShots: newShots,
          totalScore: currentContender.totalScore + userResult.score,
          totalGoals: currentContender.totalGoals + (isGoal ? 1 : 0),
          outcome: userResult.outcome,
        });
      }

      const outcomeSymbol = isGoal
        ? 'GOAL!'
        : userResult.outcome === 'save'
        ? 'SAVED!'
        : userResult.outcome === 'post'
        ? 'POST!'
        : 'MISSED';
      setBotCommentary(`${currentContender.name} - Ball ${currentBallIndexRef.current + 1}/5: ${outcomeSymbol}`);

      // Calculate the next alive shooter
      const alive = nextContenders.filter((c) => !c.isEliminated);
      const currentShooterIdx = alive.findIndex((c) => c.id === currentContender.id);
      const nextShooterIdx = currentShooterIdx + 1;
      const currentBall = currentBallIndexRef.current;

      const advanceDelay = 1300;

      // In online mode, the active shooter (if human) or host (if bot) is responsible for advancing the turn
      const canAdvanceTurn = !isOnlineMatch || currentContender.isLocalPlayer || (isLocalHost && !currentContender.isHuman);

      if (canAdvanceTurn) {
        setTimeout(() => {
          if (nextShooterIdx < alive.length) {
            // Next alive contender steps up for their turn with a fresh, randomized position!
            const nextContender = alive[nextShooterIdx];
            const nextPosIndex = getNextPlayPosition();
            if (isOnlineMatch) {
              onlineMatchManager.advanceKothTurn(nextContender.id, currentBall, nextPosIndex, nextContenders);
            } else {
              transitionToTurn(nextContender.id, currentBall, nextPosIndex);
            }
          } else {
            // All alive contenders finished this ball!
            const nextBall = currentBall + 1;
            if (nextBall < 5) {
              // Next ball starts from the first alive contender with a fresh random position!
              const firstContender = alive[0];
              const nextPosIndex = getNextPlayPosition();
              if (isOnlineMatch) {
                onlineMatchManager.advanceKothTurn(firstContender.id, nextBall, nextPosIndex, nextContenders);
              } else {
                currentBallIndexRef.current = nextBall;
                setCurrentBallIndex(nextBall);
                transitionToTurn(firstContender.id, nextBall, nextPosIndex);
              }
            } else {
              // All 5 balls completed by all alive contenders!
              setBotCommentary('All 5 balls completed! Finalizing round standings...');
              setMatchState((prev) => {
                const finalizedContenders = prev.contenders.map((c) => {
                  if (!c.isEliminated) {
                    return {
                      ...c,
                      roundScores: [...c.roundScores, c.currentRoundScore],
                      roundGoals: [...c.roundGoals, c.currentRoundGoals],
                    };
                  }
                  return c;
                });
                return { ...prev, contenders: finalizedContenders };
              });

              setTimeout(() => {
                resolveRoundEliminations();
              }, 1200);
            }
          }
        }, advanceDelay);
      }
    },
    [
      isOnlineMatch,
      isLocalHost,
      resolveRoundEliminations,
      transitionToTurn,
      getNextPlayPosition,
    ]
  );

  /**
   * Starts a new round: generates a freshly shuffled sequence of positions and begins Ball 1
   */
  const startRound = useCallback(
    (roundNum: number) => {
      const config = roundsConfig.find((r) => r.roundNumber === roundNum) || roundsConfig[0];

      // Generate a freshly shuffled sequence of all pitch positions for the new round
      const newRoundPositions = generateShuffledPlayPositions(30);
      playPositionsPoolRef.current = newRoundPositions;
      playPositionCursorRef.current = 1;

      const firstPosIndex = newRoundPositions[0];
      setForcedPositionIndex(firstPosIndex);
      setIsEliminationScreenOpen(false);
      setRoundTimeLeft(config.timeLimitSec);
      setBotCommentary(null);

      if (roundTimerRef.current) clearInterval(roundTimerRef.current);

      const currentAlive = matchStateRef.current.contenders.filter((c) => !c.isEliminated);
      const firstShooter = currentAlive[0];

      currentBallIndexRef.current = 0;
      setCurrentBallIndex(0);

      // Reset round states
      setMatchState((prev) => {
        const updated = {
          ...prev,
          currentRound: roundNum,
          positionIndex: firstPosIndex,
          roundPositions: newRoundPositions,
          roundTitle: config.title,
          roundDescription: config.description,
          eliminatedCountThisRound: config.eliminateCount4P,
          roundTimeLeft: config.timeLimitSec,
          status: 'round_active' as const,
          activeContenderId: firstShooter ? firstShooter.id : undefined,
          activeShotIndex: 0,
          contenders: prev.contenders.map((c) => {
            if (c.isEliminated) return c;
            return {
              ...c,
              currentRoundScore: 0,
              currentRoundGoals: 0,
              currentRoundShots: [],
              currentRoundOutcome: 'waiting' as const,
              currentRoundDetails: undefined,
            };
          }),
        };
        return updated;
      });

      if (firstShooter) {
        transitionToTurn(firstShooter.id, 0, firstPosIndex);
      }
    },
    [roundsConfig, transitionToTurn]
  );

  // Start Round 1 on mount
  useEffect(() => {
    startRound(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Advance to next round or conclude match with champion podium
   */
  const handleAdvanceToNextRound = () => {
    // In online match, only the active room leader can trigger the advance
    if (isOnlineMatch && !isLocalHost) return;

    setIsEliminationScreenOpen(false);
    setLeaderTransferNotice(null);
    const current = matchStateRef.current;
    const remainingAlive = current.contenders.filter((c) => !c.isEliminated);

    if (current.currentRound >= current.totalRounds || remainingAlive.length <= 1) {
      concludeMatch(remainingAlive);
      if (isOnlineMatch && isLocalHost) {
        onlineMatchManager.send('koth_match_concluded', { contenders: current.contenders });
      }
    } else {
      const nextRound = current.currentRound + 1;
      startRound(nextRound);
      if (isOnlineMatch && isLocalHost) {
        const nextPosIndex = playPositionsPoolRef.current[0] || 0;
        onlineMatchManager.advanceKothRound(nextRound, current.contenders, nextPosIndex);
      }
    }
  };

  /**
   * Crown King of the Hill Champion
   */
  const concludeMatch = (remainingAlive: KingOfTheHillContender[]) => {
    const current = matchStateRef.current;

    // Rank contenders:
    // 1. Alive contenders first, sorted by total goals desc, then total score desc
    // 2. Eliminated contenders sorted by eliminated round desc, then total goals desc, then total score desc
    const finalRankings = [...current.contenders].sort((a, b) => {
      if (!a.isEliminated && b.isEliminated) return -1;
      if (a.isEliminated && !b.isEliminated) return 1;
      if (a.isEliminated && b.isEliminated) {
        const roundDiff = (b.eliminatedInRound || 0) - (a.eliminatedInRound || 0);
        if (roundDiff !== 0) return roundDiff;
      }
      if (b.totalGoals !== a.totalGoals) return b.totalGoals - a.totalGoals;
      return b.totalScore - a.totalScore;
    });

    const winner = finalRankings[0];

    // Award prize coins if local player wins champion crown
    let awardedCoins = 0;
    if (winner.isLocalPlayer && !hasAwardedCoins) {
      awardedCoins = current.prizePot || 500;
      onEarnCoins(awardedCoins);
      setHasAwardedCoins(true);
    }

    setMatchState((prev) => ({
      ...prev,
      status: 'champion_crowned',
      winnerId: winner.id,
    }));
  };

  const handleRematch = () => {
    onRematchRequested(4, matchState.wagerTier || 'free');
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-900 overflow-hidden select-none">
      {/* 3D Stadium Gameplay View */}
      <Stadium3DView
        country={isUserTurn ? country : (activeOpponentCountry || country)}
        opponentCountry={isUserTurn ? (nextOpponentCountry || country) : country}
        onBack={onBack}
        titleMode={`King of the Hill - Round ${matchState.currentRound}/${matchState.totalRounds}`}
        gameMode="king_of_the_hill"
        equippedBallId={equippedBallId}
        equippedPitchId={equippedPitchId}
        onEarnCoins={onEarnCoins}
        onKingOfTheHillShotComplete={handleShotComplete}
        forcedPositionIndex={forcedPositionIndex}
        onLoadingChange={setIsSceneLoading}
        forcedTurn={isUserTurn ? 'player' : 'ai'}
        kothTurnKey={kothTurnKey}
        kothShooterName={activeContender?.name}
        kothBallIndex={activeShotIndex}
        isKothGameOver={matchState.status === 'champion_crowned'}
      />

      {/* Live King of the Hill Knockout HUD & Overlays */}
      <KingOfTheHillHUD
        matchState={matchState}
        roundTimeLeft={roundTimeLeft}
        turnTimeLeft={turnTimeLeft}
        isEliminationScreenOpen={isEliminationScreenOpen}
        onAdvanceToNextRound={handleAdvanceToNextRound}
        isFinalRoundOver={matchState.currentRound >= matchState.totalRounds}
        activeContender={activeContender}
        isUserTurn={isUserTurn}
        activeShotIndex={activeShotIndex}
        botCommentary={botCommentary}
        isSceneLoading={isSceneLoading}
        onExit={onBack}
        onRematch={handleRematch}
        isOnlineMatch={isOnlineMatch}
        isRoomLeader={isLocalHost}
        roomLeaderName={
          matchState.contenders.find((c) => c.id === currentHostId)?.name ||
          onlineMatchManager.currentRoom?.host?.name ||
          'Room Leader'
        }
        leaderTransferNotice={leaderTransferNotice}
      />

      {/* Tournament Results Podium Modal */}
      <KingOfTheHillResultsModal
        isOpen={matchState.status === 'champion_crowned'}
        matchState={matchState}
        onRematch={handleRematch}
        onReturnToMenu={onBack}
        isOnline={isOnlineMatch}
      />
    </div>
  );
}
