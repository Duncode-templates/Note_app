/**
 * Online Match Multiplayer Client Manager
 * Hybrid Synchronizer:
 * 1. WebRTC PeerJS P2P (Sub-millisecond latency for live physics, aim, shot, and turn sync)
 * 2. Firebase Firestore (Persistent Realtime State, Room discovery, Country Selection, Countdown, Fallback Sync)
 * 3. WebSocket Relay (Local / Termux dedicated server)
 * 4. BroadcastChannel (Local browser tabs instant testing)
 */

import { Peer, DataConnection } from 'peerjs';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  runTransaction,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { OnlinePlayer, OnlineMatchRoom, OnlineShotPayload, OnlineGKPayload, OnlineTurnAdvancePayload, OnlineShotOutcomePayload } from '../types';
import {
  getRandomBotProfile,
  getBotProfileForWagerTier,
  getBotProfileForSurvival,
  getBotInstinctCountry,
  BotProfile,
} from '../data/botProfiles';
import { COUNTRIES_DATA } from '../data/countries';

export type OnlineEventCallback = (payload: any) => void;

class OnlineMatchManager {
  private ws: WebSocket | null = null;
  private peer: Peer | null = null;
  private peerConn: DataConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private firestoreUnsub: Unsubscribe | null = null;
  private listeners: Map<string, Set<OnlineEventCallback>> = new Map();
  private lastProcessedShotTimestamp: number = 0;
  private matchmakingInterval: any = null;
  private botFallbackTimer: any = null;

  public localPlayerId: string = 'P_' + Math.random().toString(36).substring(2, 8).toUpperCase();
  public localPlayerName: string = 'Striker_' + Math.floor(100 + Math.random() * 900);
  public localPlayerProfilePictureUrl: string | null = null;
  public currentRoom: OnlineMatchRoom | null = null;
  public serverUrl: string = 'ws://localhost:8080';
  public isConnected: boolean = false;
  public isUsingLocalRelay: boolean = false;
  public isUsingP2P: boolean = false;
  public isUsingFirestore: boolean = true;
  public isSearchingMatchmaking: boolean = false;

  constructor() {
    // 1. Initialize BroadcastChannel for instant local testing across tabs
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('fk_online_matches');
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      }
    } catch {}
  }

  public setPlayerInfo(name: string, _countryCode?: string, profilePictureUrl?: string | null) {
    this.localPlayerName = name;
    if (profilePictureUrl !== undefined) {
      this.localPlayerProfilePictureUrl = profilePictureUrl;
    }
  }

  /**
   * Initializes WebRTC P2P Host Room using 5-digit code
   */
  private initPeerHost(roomId: string) {
    try {
      if (this.peer) {
        try { this.peer.destroy(); } catch {}
      }

      const peerId = `fkl-match-${roomId}`;
      this.peer = new Peer(peerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });

      this.peer.on('open', () => {
        this.isUsingP2P = true;
      });

      this.peer.on('connection', (conn) => {
        this.peerConn = conn;
        conn.on('open', () => {
          this.isUsingP2P = true;
          if (this.currentRoom) {
            conn.send({
              event: 'player_joined_ack',
              payload: { room: this.currentRoom },
              senderId: this.localPlayerId,
            });
          }
        });

        conn.on('data', (data: any) => {
          this.handleIncomingMessage(data);
        });

        conn.on('close', () => {
          if (this.currentRoom) {
            this.currentRoom.isOpponentDisconnected = true;
            this.currentRoom.status = 'opponent_left';
          }
          this.emit('opponent_disconnected', { message: 'Opponent disconnected from session' });
          this.emit('player_left', { message: 'Opponent disconnected' });
        });
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS Host:', err);
      });
    } catch (e) {
      console.warn('PeerJS init failed:', e);
    }
  }

  /**
   * Connects as WebRTC P2P Guest to host's 5-digit code
   */
  private initPeerGuest(roomId: string, _countryCode?: string | null) {
    try {
      if (this.peer) {
        try { this.peer.destroy(); } catch {}
      }

      this.peer = new Peer({
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });

      this.peer.on('open', () => {
        const targetPeerId = `fkl-match-${roomId}`;
        const conn = this.peer!.connect(targetPeerId, { reliable: true });
        this.peerConn = conn;

        conn.on('open', () => {
          this.isUsingP2P = true;
          conn.send({
            event: 'join_room',
            payload: {
              roomId,
              playerName: this.localPlayerName,
              playerId: this.localPlayerId,
            },
            senderId: this.localPlayerId,
          });
        });

        conn.on('data', (data: any) => {
          this.handleIncomingMessage(data);
        });

        conn.on('close', () => {
          if (this.currentRoom) {
            this.currentRoom.isOpponentDisconnected = true;
            this.currentRoom.status = 'opponent_left';
          }
          this.emit('opponent_disconnected', { message: 'Host disconnected from session' });
          this.emit('player_left', { message: 'Host disconnected' });
        });
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS Guest:', err);
      });
    } catch (e) {
      console.warn('PeerJS guest init failed:', e);
    }
  }

  /**
   * Subscribes to Firestore room document in real time
   */
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private startHeartbeat(roomId: string) {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
      if (!this.currentRoom || this.currentRoom.roomId !== roomId) {
        this.stopHeartbeat();
        return;
      }
      try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          updatedAt: Date.now(),
        });
      } catch {}
    }, 3000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private listenToFirestoreRoom(roomId: string) {
    if (this.firestoreUnsub) {
      this.firestoreUnsub();
      this.firestoreUnsub = null;
    }

    try {
      const roomRef = doc(db, 'rooms', roomId);
      this.firestoreUnsub = onSnapshot(roomRef, (snapshot) => {
        if (!snapshot.exists()) {
          if (this.currentRoom && this.currentRoom.status !== 'waiting') {
            this.currentRoom.status = 'opponent_left';
            this.currentRoom.isOpponentDisconnected = true;
            this.emit('opponent_disconnected', { message: 'Room has been closed or opponent left' });
            this.emit('opponent_left', { message: 'Opponent has left the room' });
          }
          return;
        }

        const roomData = snapshot.data() as any;
        if (!roomData) return;
        const isHost = this.localPlayerId === roomData.host?.id;

        // Preserve active in-memory timer progression across snapshot triggers
        let activeMatchTime = this.currentRoom?.matchTime ?? 100;
        let activeStoppageCountdown = this.currentRoom?.stoppageCountdown ?? null;
        if (roomData.status === 'playing' && this.currentRoom?.status !== 'playing') {
          activeMatchTime = 100;
          activeStoppageCountdown = null;
        } else if (roomData.status === 'finished') {
          activeMatchTime = 0;
          activeStoppageCountdown = 0;
        }

        const updatedRoom: OnlineMatchRoom = {
          roomId: roomData.roomId || roomId || snapshot.id,
          host: {
            id: roomData.host?.id || '',
            name: roomData.host?.name || 'Host',
            countryCode: roomData.host?.countryCode || null,
            role: 'host',
            isReady: roomData.host?.isReady || false,
            isLocal: isHost,
            profilePictureUrl: roomData.host?.profilePictureUrl || null,
          },
          guest: roomData.guest
            ? {
                id: roomData.guest.id || '',
                name: roomData.guest.name || 'Guest',
                countryCode: roomData.guest.countryCode || null,
                role: 'guest',
                isReady: roomData.guest.isReady || false,
                isLocal: !isHost,
                profilePictureUrl: roomData.guest.profilePictureUrl || null,
              }
            : null,
          gameMode: roomData.gameMode || 'match',
          division: roomData.division ?? undefined,
          wagerTier: roomData.wagerTier ?? undefined,
          entryFee: roomData.entryFee ?? undefined,
          prizePot: roomData.prizePot ?? undefined,
          status: roomData.status || 'waiting',
          currentKickerRole: roomData.currentKickerRole || 'host',
          score: roomData.score || { host: 0, guest: 0 },
          turn: roomData.turn || 1,
          matchTime: activeMatchTime,
          stoppageCountdown: activeStoppageCountdown,
          positionIndex: roomData.positionIndex ?? 0,
          gkStartX: roomData.gkStartX,
          countdown: roomData.countdown ?? null,
          countdownStartTime: roomData.countdownStartTime ?? null,
          rematchRequestedBy: roomData.rematchRequestedBy ?? null,
          isOpponentDisconnected: Boolean(roomData.isOpponentDisconnected || roomData.status === 'opponent_left' || roomData.status === 'cancelled'),
        };

        const prevRoom = this.currentRoom;
        this.currentRoom = updatedRoom;

        // Emit general room update
        this.emit('room_updated', { room: updatedRoom });

        // If match ended in Firestore
        if (updatedRoom.status === 'finished' && prevRoom?.status !== 'finished') {
          this.emit('match_ended', {
            hostScore: updatedRoom.score.host,
            guestScore: updatedRoom.score.guest,
            homeScore: updatedRoom.score.host,
            awayScore: updatedRoom.score.guest,
          });
        }

        // If opponent disconnected / left in Firestore
        if (
          (updatedRoom.status === 'opponent_left' || updatedRoom.status === 'cancelled' || updatedRoom.isOpponentDisconnected) &&
          (!prevRoom || (prevRoom.status !== 'opponent_left' && prevRoom.status !== 'cancelled' && !prevRoom.isOpponentDisconnected))
        ) {
          this.emit('opponent_disconnected', { message: 'Opponent has left or disconnected' });
          this.emit('opponent_left', { message: 'Opponent has left or disconnected' });
        }

        // If guest just joined or status transitioned to selecting_country
        if (
          updatedRoom.status === 'selecting_country' &&
          (prevRoom?.status === 'waiting' || !prevRoom?.guest) &&
          updatedRoom.guest
        ) {
          this.emit('player_joined', { player: updatedRoom.guest, room: updatedRoom });
        }

        // If country selections changed
        if (
          prevRoom?.host.countryCode !== updatedRoom.host.countryCode ||
          prevRoom?.guest?.countryCode !== updatedRoom.guest?.countryCode
        ) {
          this.emit('country_selection_updated', {
            hostCountry: updatedRoom.host.countryCode,
            guestCountry: updatedRoom.guest?.countryCode,
            room: updatedRoom,
          });
          this.emit('team_changed', {
            hostCountry: updatedRoom.host.countryCode,
            guestCountry: updatedRoom.guest?.countryCode,
            room: updatedRoom,
          });
        }

        // If countdown started
        if (updatedRoom.status === 'starting' && prevRoom?.status !== 'starting') {
          this.emit('countdown_started', {
            countdownStartTime: updatedRoom.countdownStartTime,
            room: updatedRoom,
          });
        }

        // If match started or restarted via rematch
        if (updatedRoom.status === 'playing' && prevRoom?.status !== 'playing') {
          this.emit('match_start', {
            currentKickerRole: 'host',
            turn: 1,
            positionIndex: updatedRoom.positionIndex,
            gkStartX: updatedRoom.gkStartX,
            room: updatedRoom,
          });
        }

        // If rematch requested or changed
        if (updatedRoom.rematchRequestedBy !== prevRoom?.rematchRequestedBy) {
          if (updatedRoom.rematchRequestedBy) {
            this.emit('rematch_requested', { role: updatedRoom.rematchRequestedBy });
          } else {
            this.emit('rematch_cancelled', {});
          }
        }

        // In bot matches, the entire match is strictly simulated locally by the client.
        // We MUST NEVER emit remote multiplayer game events (turn_advanced, shot_executed, score_updated) from Firestore snapshots in bot matches.
        const isBot = this.isCurrentRoomBotMatch();

        if (!isBot) {
          // If Goalkeeper position synchronized
          if (
            updatedRoom.gkStartX !== undefined &&
            prevRoom?.gkStartX !== updatedRoom.gkStartX
          ) {
            this.emit('sync_gk_position', { gkStartX: updatedRoom.gkStartX });
          }

          // If score or survival lives updated in Firestore
          if (
            prevRoom &&
            (prevRoom.score.host !== updatedRoom.score.host ||
              prevRoom.score.guest !== updatedRoom.score.guest ||
              prevRoom.survivalLives?.host !== updatedRoom.survivalLives?.host ||
              prevRoom.survivalLives?.guest !== updatedRoom.survivalLives?.guest)
          ) {
            this.emit('score_updated', {
              hostScore: updatedRoom.score.host,
              guestScore: updatedRoom.score.guest,
              homeScore: updatedRoom.score.host,
              awayScore: updatedRoom.score.guest,
              survivalLives: updatedRoom.survivalLives,
            });
          }

          // If turn / kicker role / position updated from remote in Firestore
          if (
            prevRoom &&
            prevRoom.status === 'playing' &&
            updatedRoom.status === 'playing' &&
            (prevRoom.turn !== updatedRoom.turn ||
              prevRoom.currentKickerRole !== updatedRoom.currentKickerRole ||
              prevRoom.positionIndex !== updatedRoom.positionIndex)
          ) {
            this.emit('turn_advanced', {
              nextTurnRole: updatedRoom.currentKickerRole,
              nextPositionIndex: updatedRoom.positionIndex ?? 0,
              hostScore: updatedRoom.score.host,
              guestScore: updatedRoom.score.guest,
              homeScore: updatedRoom.score.host,
              awayScore: updatedRoom.score.guest,
              survivalLives: updatedRoom.survivalLives,
              turnNumber: updatedRoom.turn,
              matchTime: this.currentRoom?.matchTime,
              stoppageCountdown: this.currentRoom?.stoppageCountdown ?? undefined,
              gkStartX: updatedRoom.gkStartX,
            });
          }

          // If a real-time shot was executed via Firestore
          if (
            roomData.lastShot &&
            roomData.lastShot.timestamp &&
            roomData.lastShot.timestamp > this.lastProcessedShotTimestamp
          ) {
            this.lastProcessedShotTimestamp = roomData.lastShot.timestamp;
            if (roomData.lastShot.kickerId !== this.localPlayerId) {
              this.emit('shot_executed', roomData.lastShot);
            }
          }
        }
      });
    } catch (err) {
      console.warn('Firestore subscription error:', err);
    }
  }

  public isCurrentRoomBotMatch(): boolean {
    if (!this.currentRoom) return false;
    const guestId = this.currentRoom.guest?.id?.toLowerCase() || '';
    const hostId = this.currentRoom.host?.id?.toLowerCase() || '';
    return (
      guestId.startsWith('bot_') ||
      hostId.startsWith('bot_') ||
      (Boolean(this.currentRoom.guest) && !this.currentRoom.guest!.isLocal && !guestId.startsWith('p_')) ||
      (Boolean(this.currentRoom.host) && !this.currentRoom.host.isLocal && !hostId.startsWith('p_'))
    );
  }

  public connectToServer(url?: string): Promise<boolean> {
    if (url) this.serverUrl = url;

    return new Promise((resolve) => {
      try {
        if (this.ws) {
          try { this.ws.close(); } catch {}
        }

        const targetUrl = this.serverUrl.startsWith('ws://') || this.serverUrl.startsWith('wss://')
          ? this.serverUrl
          : `ws://${this.serverUrl}`;

        this.ws = new WebSocket(targetUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.isUsingLocalRelay = false;
          this.emit('connected', { url: targetUrl });
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleIncomingMessage(data);
          } catch (err) {
            console.error('WS Parse Error', err);
          }
        };

        this.ws.onerror = () => {
          this.isConnected = false;
          this.isUsingLocalRelay = true;
          resolve(false);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
        };

        setTimeout(() => {
          if (!this.isConnected) {
            this.isUsingLocalRelay = true;
            resolve(false);
          }
        }, 2000);
      } catch (err) {
        this.isUsingLocalRelay = true;
        resolve(false);
      }
    });
  }

  public send(event: string, payload: any) {
    const message = { event, payload, senderId: this.localPlayerId, timestamp: Date.now() };

    // 1. Send via WebRTC P2P Data Connection if open
    if (this.peerConn && this.peerConn.open) {
      try {
        this.peerConn.send(message);
      } catch {}
    }

    // 2. Send via WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ event, payload }));
      } catch {}
    }

    // 3. Broadcast via BroadcastChannel for multi-tab / local relay
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch {}
    }
  }

  private handleIncomingMessage(data: { event: string; payload: any; senderId?: string }) {
    if (!data || !data.event) return;
    if (data.senderId && data.senderId === this.localPlayerId) return;

    const { event, payload } = data;

    if (event === 'join_room') {
      if (this.currentRoom && this.currentRoom.host.isLocal) {
        const guestCountry = payload.country || null;
        const nextStatus = 'selecting_country';

        this.currentRoom.guest = {
          id: data.senderId || payload.playerId || 'guest',
          name: payload.playerName || 'Guest Player',
          countryCode: guestCountry,
          role: 'guest',
          isReady: Boolean(guestCountry),
          isLocal: false,
          profilePictureUrl: payload.profilePictureUrl || null,
        };
        this.currentRoom.status = nextStatus;

        // Update Firestore
        this.updateFirestoreRoom({
          guest: {
            id: this.currentRoom.guest.id,
            name: this.currentRoom.guest.name,
            countryCode: this.currentRoom.guest.countryCode,
            isReady: Boolean(guestCountry),
            profilePictureUrl: payload.profilePictureUrl || null,
          },
          status: nextStatus,
          updatedAt: Date.now(),
        });

        // Notify over socket/peer
        this.send('room_joined', {
          roomId: this.currentRoom.roomId,
          role: 'guest',
          gameMode: this.currentRoom.gameMode,
          status: nextStatus,
          positionIndex: this.currentRoom.positionIndex ?? 0,
          players: [
            { id: this.currentRoom.host.id, name: this.currentRoom.host.name, country: this.currentRoom.host.countryCode, role: 'host' },
            { id: this.currentRoom.guest.id, name: this.currentRoom.guest.name, country: this.currentRoom.guest.countryCode, role: 'guest' },
          ],
        });

        this.emit('player_joined', { player: this.currentRoom.guest, room: this.currentRoom });
      }
    } else if (event === 'country_selected') {
      if (this.currentRoom) {
        if (payload.role === 'host') {
          this.currentRoom.host.countryCode = payload.countryCode;
        } else if (payload.role === 'guest' && this.currentRoom.guest) {
          this.currentRoom.guest.countryCode = payload.countryCode;
        }
        this.emit('country_selection_updated', {
          hostCountry: this.currentRoom.host.countryCode,
          guestCountry: this.currentRoom.guest?.countryCode,
          room: this.currentRoom,
        });

        // If both countries are selected and countdown hasn't started yet, initiate countdown
        const hostCode = this.currentRoom.host.countryCode;
        const guestCode = this.currentRoom.guest?.countryCode;
        if (hostCode && guestCode && this.currentRoom.status !== 'starting' && this.currentRoom.status !== 'playing') {
          const startTime = Date.now();
          this.currentRoom.status = 'starting';
          this.currentRoom.countdownStartTime = startTime;
          this.emit('countdown_started', {
            countdownStartTime: startTime,
            room: this.currentRoom,
          });
        }
      }
    } else if (event === 'countdown_started') {
      if (this.currentRoom) {
        this.currentRoom.status = 'starting';
        this.currentRoom.countdownStartTime = payload.countdownStartTime || Date.now();
        this.emit('countdown_started', {
          countdownStartTime: this.currentRoom.countdownStartTime,
          room: this.currentRoom,
        });
      }
    } else if (event === 'match_start') {
      if (this.currentRoom) {
        this.currentRoom.status = 'playing';
        this.currentRoom.currentKickerRole = 'host';
        if (payload.positionIndex !== undefined) {
          this.currentRoom.positionIndex = payload.positionIndex;
        }
        this.emit('match_start', {
          currentKickerRole: 'host',
          turn: 1,
          positionIndex: this.currentRoom.positionIndex,
          room: this.currentRoom,
        });
      }
    } else if (event === 'sync_position') {
      if (this.currentRoom && payload.positionIndex !== undefined) {
        this.currentRoom.positionIndex = payload.positionIndex;
      }
    } else if (event === 'sync_gk_position') {
      if (this.currentRoom && payload.gkStartX !== undefined) {
        this.currentRoom.gkStartX = payload.gkStartX;
      }
    } else if (event === 'shot_executed') {
      if (payload.timestamp) {
        this.lastProcessedShotTimestamp = Math.max(this.lastProcessedShotTimestamp, payload.timestamp);
      }
    } else if (event === 'shot_outcome') {
      if (this.currentRoom) {
        const hostScore = payload.hostScore !== undefined ? payload.hostScore : payload.homeScore;
        const guestScore = payload.guestScore !== undefined ? payload.guestScore : payload.awayScore;
        if (hostScore !== undefined && guestScore !== undefined) {
          this.currentRoom.score = {
            host: hostScore,
            guest: guestScore,
          };
        }
      }
    } else if (event === 'turn_advanced') {
      if (this.currentRoom) {
        this.currentRoom.currentKickerRole = payload.nextTurnRole;
        this.currentRoom.positionIndex = payload.nextPositionIndex;
        this.currentRoom.turn = payload.turnNumber;
        if (payload.gkStartX !== undefined) {
          this.currentRoom.gkStartX = payload.gkStartX;
        }
        if (payload.matchTime !== undefined) {
          this.currentRoom.matchTime = payload.matchTime;
        }
        if (payload.stoppageCountdown !== undefined) {
          this.currentRoom.stoppageCountdown = payload.stoppageCountdown;
        }
        const hostScore = payload.hostScore !== undefined ? payload.hostScore : payload.homeScore;
        const guestScore = payload.guestScore !== undefined ? payload.guestScore : payload.awayScore;
        if (hostScore !== undefined && guestScore !== undefined) {
          this.currentRoom.score = {
            host: hostScore,
            guest: guestScore,
          };
        }
      }
    } else if (event === 'sync_match_time') {
      if (this.currentRoom) {
        if (payload.matchTime !== undefined) {
          this.currentRoom.matchTime = payload.matchTime;
        }
        if (payload.stoppageCountdown !== undefined) {
          this.currentRoom.stoppageCountdown = payload.stoppageCountdown;
        }
      }
    } else if (event === 'match_ended') {
      if (this.currentRoom) {
        this.currentRoom.status = 'finished';
        this.currentRoom.matchTime = 0;
        this.currentRoom.stoppageCountdown = 0;
        const hostScore = payload.hostScore !== undefined ? payload.hostScore : payload.homeScore;
        const guestScore = payload.guestScore !== undefined ? payload.guestScore : payload.awayScore;
        if (hostScore !== undefined && guestScore !== undefined) {
          this.currentRoom.score = {
            host: hostScore,
            guest: guestScore,
          };
        }
      }
    } else if (event === 'team_changed') {
      if (this.currentRoom && payload.role && payload.countryCode) {
        if (payload.role === 'host') {
          this.currentRoom.host.countryCode = payload.countryCode;
        } else if (this.currentRoom.guest) {
          this.currentRoom.guest.countryCode = payload.countryCode;
        }
      }
    } else if (event === 'rematch_requested') {
      if (this.currentRoom) {
        this.currentRoom.rematchRequestedBy = payload.role;
      }
    } else if (event === 'rematch_accepted') {
      if (this.currentRoom) {
        this.currentRoom.status = 'playing';
        this.currentRoom.score = { host: 0, guest: 0 };
        this.currentRoom.turn = 1;
        this.currentRoom.matchTime = 100;
        this.currentRoom.stoppageCountdown = null;
        this.currentRoom.rematchRequestedBy = null;
        if (payload.positionIndex !== undefined) {
          this.currentRoom.positionIndex = payload.positionIndex;
        }
      }
    } else if (event === 'rematch_declined' || event === 'rematch_cancelled') {
      if (this.currentRoom) {
        this.currentRoom.rematchRequestedBy = null;
      }
    } else if (event === 'opponent_left' || event === 'leave_room') {
      if (this.currentRoom) {
        this.currentRoom.status = 'opponent_left';
        this.currentRoom.isOpponentDisconnected = true;
      }
      this.emit('opponent_disconnected', { message: 'Opponent has left the room' });
    }

    this.emit(event, payload);
  }

  private async updateFirestoreRoom(partialData: Record<string, any>) {
    if (!this.currentRoom?.roomId) return;
    try {
      const roomRef = doc(db, 'rooms', this.currentRoom.roomId);
      await updateDoc(roomRef, partialData);
    } catch (err) {
      console.warn('Firestore update warning:', err);
    }
  }

  // --- PUBLIC MATCH ACTIONS ---

  /**
   * Robust Online Matchmaking Engine
   * 1. Searches Firestore for active open waiting matchmaking rooms from other players (<45s old)
   * 2. Atomically claims an open room via Firestore transaction
   * 3. If no room claimed, creates a new waiting matchmaking room and listens for incoming players
   * 4. Periodically re-evaluates pool to guarantee fast pairing if players search simultaneously
   */
  public async findMatch(
    gameMode: 'match' | 'penalty_training' | 'survival' = 'match',
    wagerTier?: 'rookie' | 'pro' | 'champion' | 'legend',
    entryFee?: number,
    prizePot?: number
  ): Promise<boolean> {
    await this.cancelMatchmaking();
    this.isSearchingMatchmaking = true;

    try {
      // 1. Query candidate waiting matchmaking rooms in Firestore
      const roomsCol = collection(db, 'rooms');
      const queryConstraints: any[] = [
        where('status', '==', 'waiting'),
        where('isMatchmaking', '==', true),
        where('gameMode', '==', gameMode),
      ];

      if (wagerTier) {
        queryConstraints.push(where('wagerTier', '==', wagerTier));
      }

      queryConstraints.push(limit(15));
      const q = query(roomsCol, ...queryConstraints);

      const snap = await getDocs(q);
      const candidates: any[] = [];
      const now = Date.now();

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data) return;
        const roomDocId = data.roomId || docSnap.id;
        const roomAge = now - (data.createdAt || 0);
        const lastActiveAge = now - (data.updatedAt || data.createdAt || 0);

        // Discard & clean up cancelled, disconnected or stale matchmaking searches older than 12s
        if (
          data.status !== 'waiting' ||
          data.isMatchmaking !== true ||
          data.isOpponentDisconnected ||
          data.guest ||
          lastActiveAge > 12000 ||
          roomAge > 45000
        ) {
          // Clean up dead document in background
          try {
            if (roomDocId) {
              deleteDoc(doc(db, 'rooms', roomDocId)).catch(() => {});
            }
          } catch {}
          return;
        }

        if (data.host?.id !== this.localPlayerId) {
          candidates.push({ ...data, roomId: roomDocId });
        }
      });

      // Sort by creation time (oldest waiting player claimed first)
      candidates.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      for (const cand of candidates) {
        if (!this.isSearchingMatchmaking || !cand?.roomId) return false;
        const targetRoomId = cand.roomId;

        try {
          const roomRef = doc(db, 'rooms', targetRoomId);
          let claimed = false;

          await runTransaction(db, async (transaction) => {
            const freshDoc = await transaction.get(roomRef);
            if (!freshDoc.exists()) return;
            const freshData = freshDoc.data();
            const freshAge = Date.now() - (freshData.updatedAt || freshData.createdAt || 0);
            if (freshAge > 15000) return; // Stale

            if (
              freshData.status === 'waiting' &&
              freshData.isMatchmaking === true &&
              !freshData.isOpponentDisconnected &&
              !freshData.guest &&
              freshData.host?.id !== this.localPlayerId
            ) {
              const guestPlayer = {
                id: this.localPlayerId,
                name: this.localPlayerName,
                countryCode: null,
                isReady: false,
                profilePictureUrl: this.localPlayerProfilePictureUrl,
              };
              transaction.update(roomRef, {
                guest: guestPlayer,
                status: 'selecting_country',
                updatedAt: Date.now(),
              });
              claimed = true;
            }
          });

          if (claimed) {
            this.isSearchingMatchmaking = false;
            const guestPlayer: OnlinePlayer = {
              id: this.localPlayerId,
              name: this.localPlayerName,
              countryCode: null,
              role: 'guest',
              isReady: false,
              isLocal: true,
              profilePictureUrl: this.localPlayerProfilePictureUrl,
            };

            this.currentRoom = {
              roomId: targetRoomId,
              host: {
                id: cand.host.id,
                name: cand.host.name,
                countryCode: cand.host.countryCode || null,
                role: 'host',
                isReady: cand.host.isReady || false,
                isLocal: false,
                profilePictureUrl: cand.host.profilePictureUrl || null,
              },
              guest: guestPlayer,
              gameMode: cand.gameMode || gameMode,
              wagerTier: cand.wagerTier || wagerTier,
              entryFee: cand.entryFee ?? entryFee,
              prizePot: cand.prizePot ?? prizePot,
              status: 'selecting_country',
              currentKickerRole: 'host',
              score: { host: 0, guest: 0 },
              survivalLives: (cand.gameMode || gameMode) === 'survival' ? { host: 3, guest: 3 } : undefined,
              turn: 1,
              positionIndex: cand.positionIndex ?? 0,
              countdown: null,
              countdownStartTime: null,
              isMatchmaking: true,
            };

            this.listenToFirestoreRoom(targetRoomId);
            this.startHeartbeat(targetRoomId);
            this.initPeerGuest(targetRoomId);
            this.send('join_room', {
              roomId: targetRoomId,
              playerName: this.localPlayerName,
              playerId: this.localPlayerId,
            });

            this.emit('room_joined', { roomId: targetRoomId, role: 'guest', room: this.currentRoom });
            return true;
          }
        } catch (claimErr) {
          console.warn('Candidate claim attempt error:', claimErr);
        }
      }

      // 2. If no candidate claimed, create our own waiting matchmaking room
      if (!this.isSearchingMatchmaking) return false;

      const createdRoomId = await this.createRoom(gameMode, undefined, true, undefined, null, wagerTier, entryFee, prizePot);

      // Bot Fallback Timer: After 15 seconds of waiting without a real player, smoothly pair with a realistic bot opponent
      if (this.botFallbackTimer) {
        clearTimeout(this.botFallbackTimer);
      }
      this.botFallbackTimer = setTimeout(async () => {
        if (
          !this.isSearchingMatchmaking ||
          !this.currentRoom ||
          this.currentRoom.guest ||
          this.currentRoom.status !== 'waiting'
        ) {
          return;
        }

        if (this.matchmakingInterval) {
          clearInterval(this.matchmakingInterval);
          this.matchmakingInterval = null;
        }
        this.isSearchingMatchmaking = false;

        let bot: BotProfile;
        if (wagerTier) {
          bot = getBotProfileForWagerTier(wagerTier, [this.localPlayerName]);
        } else if (gameMode === 'survival') {
          bot = getBotProfileForSurvival(0, [this.localPlayerName]);
        } else {
          bot = getRandomBotProfile([this.localPlayerName]);
        }

        const botPlayer: OnlinePlayer = {
          id: bot.id,
          name: bot.username,
          countryCode: null,
          role: 'guest',
          isReady: true,
          isLocal: false,
          profilePictureUrl: bot.avatarUrl,
        };

        this.currentRoom.guest = botPlayer;
        this.currentRoom.isMatchmaking = false;

        await this.updateFirestoreRoom({
          guest: {
            id: bot.id,
            name: bot.username,
            countryCode: null,
            isReady: true,
            profilePictureUrl: bot.avatarUrl,
          },
          isMatchmaking: false,
          updatedAt: Date.now(),
        }).catch(() => {});

        this.emit('player_joined', { guest: botPlayer, room: this.currentRoom });
        this.emit('room_joined', { roomId: this.currentRoom.roomId, role: 'host', room: this.currentRoom });
      }, 15000);

      // Periodically check if another searching player created an older room or if someone joined
      this.matchmakingInterval = setInterval(async () => {
        if (
          !this.isSearchingMatchmaking ||
          !this.currentRoom ||
          this.currentRoom.guest ||
          this.currentRoom.status !== 'waiting'
        ) {
          if (this.matchmakingInterval) {
            clearInterval(this.matchmakingInterval);
            this.matchmakingInterval = null;
          }
          return;
        }

        try {
          const freshSnap = await getDocs(q);
          const freshCandidates: any[] = [];
          const currentCreatedAt = (this.currentRoom as any)?.createdAt || Date.now();
          const checkNow = Date.now();

          freshSnap.forEach((d) => {
            const data = d.data();
            if (!data) return;
            const rId = data.roomId || d.id;
            const lastActiveAge = checkNow - (data.updatedAt || data.createdAt || 0);

            if (lastActiveAge > 15000) {
              if (rId) {
                try { deleteDoc(doc(db, 'rooms', rId)).catch(() => {}); } catch {}
              }
              return;
            }

            if (
              rId &&
              rId !== createdRoomId &&
              data.host?.id !== this.localPlayerId &&
              data.status === 'waiting' &&
              !data.guest
            ) {
              freshCandidates.push({ ...data, roomId: rId });
            }
          });

          if (freshCandidates.length > 0) {
            freshCandidates.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            const target = freshCandidates[0];
            if ((target.createdAt || 0) < currentCreatedAt) {
              // Switch to joining the earlier created room
              if (this.matchmakingInterval) {
                clearInterval(this.matchmakingInterval);
                this.matchmakingInterval = null;
              }
              await this.cancelMatchmaking();
              await this.findMatch(gameMode, wagerTier, entryFee, prizePot);
            }
          }
        } catch (e) {
          console.warn('Periodic match check error:', e);
        }
      }, 2500);

      return true;
    } catch (error: any) {
      console.error('Find match error:', error);
      this.isSearchingMatchmaking = false;
      this.emit('error', {
        message: error?.message || 'Matchmaking encountered a network issue. Please try again.',
      });
      return false;
    }
  }

  /**
   * Division Matchmaking: Finds or creates an online division league match
   */
  public async findDivisionMatch(divisionLevel: number, countryCode: string): Promise<boolean> {
    await this.cancelMatchmaking();
    this.isSearchingMatchmaking = true;

    try {
      const roomsCol = collection(db, 'rooms');
      const q = query(
        roomsCol,
        where('status', '==', 'waiting'),
        where('isMatchmaking', '==', true),
        where('gameMode', '==', 'division_match'),
        where('divisionLevel', '==', divisionLevel),
        limit(10)
      );

      const snap = await getDocs(q);
      const candidates: any[] = [];
      const now = Date.now();

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data) return;
        const roomDocId = data.roomId || docSnap.id;
        const age = now - (data.createdAt || data.updatedAt || now);
        if (
          data.status !== 'waiting' ||
          data.isMatchmaking !== true ||
          data.isOpponentDisconnected ||
          data.guest ||
          age > 20000
        ) {
          try {
            if (roomDocId) {
              deleteDoc(doc(db, 'rooms', roomDocId)).catch(() => {});
            }
          } catch {}
          return;
        }

        if (data.host?.id !== this.localPlayerId) {
          candidates.push({ ...data, roomId: roomDocId });
        }
      });

      for (const cand of candidates) {
        const targetRoomId = cand.roomId;
        try {
          const roomRef = doc(db, 'rooms', targetRoomId);
          let claimed = false;

          await runTransaction(db, async (transaction) => {
            const freshSnap = await transaction.get(roomRef);
            if (!freshSnap.exists()) return;
            const freshData = freshSnap.data();

            if (
              freshData.status === 'waiting' &&
              freshData.isMatchmaking === true &&
              !freshData.isOpponentDisconnected &&
              !freshData.guest &&
              freshData.host?.id !== this.localPlayerId
            ) {
              const guestPlayer = {
                id: this.localPlayerId,
                name: this.localPlayerName,
                countryCode,
                isReady: true,
                profilePictureUrl: this.localPlayerProfilePictureUrl,
              };
              transaction.update(roomRef, {
                guest: guestPlayer,
                status: 'playing',
                updatedAt: Date.now(),
              });
              claimed = true;
            }
          });

          if (claimed) {
            this.isSearchingMatchmaking = false;
            const guestPlayer: OnlinePlayer = {
              id: this.localPlayerId,
              name: this.localPlayerName,
              countryCode,
              role: 'guest',
              isReady: true,
              isLocal: true,
              profilePictureUrl: this.localPlayerProfilePictureUrl,
            };

            this.currentRoom = {
              roomId: targetRoomId,
              host: {
                id: cand.host.id,
                name: cand.host.name,
                countryCode: cand.host.countryCode || null,
                role: 'host',
                isReady: true,
                isLocal: false,
                profilePictureUrl: cand.host.profilePictureUrl || null,
              },
              guest: guestPlayer,
              gameMode: 'division_match',
              status: 'playing',
              currentKickerRole: 'host',
              score: { host: 0, guest: 0 },
              turn: 1,
              positionIndex: cand.positionIndex ?? 0,
              countdown: null,
              countdownStartTime: null,
              isMatchmaking: true,
            };

            this.listenToFirestoreRoom(targetRoomId);
            this.startHeartbeat(targetRoomId);
            this.initPeerGuest(targetRoomId);
            this.send('join_room', {
              roomId: targetRoomId,
              playerName: this.localPlayerName,
              playerId: this.localPlayerId,
              country: countryCode,
            });

            this.emit('division_match_found', {
              room: this.currentRoom,
              myRole: 'guest',
              hostCountryCode: cand.host?.countryCode,
              guestCountryCode: countryCode,
            });
            return true;
          }
        } catch (err) {
          console.warn('Division candidate claim error:', err);
        }
      }

      // Create own division room if none available
      if (!this.isSearchingMatchmaking) return false;
      const roomId = this.generateRoomCode();
      const hostPlayer: OnlinePlayer = {
        id: this.localPlayerId,
        name: this.localPlayerName,
        countryCode,
        role: 'host',
        isReady: true,
        isLocal: true,
        profilePictureUrl: this.localPlayerProfilePictureUrl,
      };

      this.currentRoom = {
        roomId,
        host: hostPlayer,
        guest: null,
        gameMode: 'division_match',
        status: 'waiting',
        currentKickerRole: 'host',
        score: { host: 0, guest: 0 },
        turn: 1,
        positionIndex: Math.floor(Math.random() * 30),
        countdown: null,
        countdownStartTime: null,
        isMatchmaking: true,
      };

      const roomRef = doc(db, 'rooms', roomId);
      await setDoc(roomRef, {
        roomId,
        host: {
          id: hostPlayer.id,
          name: hostPlayer.name,
          countryCode: hostPlayer.countryCode,
          isReady: true,
          profilePictureUrl: hostPlayer.profilePictureUrl,
        },
        guest: null,
        gameMode: 'division_match',
        divisionLevel,
        status: 'waiting',
        currentKickerRole: 'host',
        score: { host: 0, guest: 0 },
        turn: 1,
        positionIndex: this.currentRoom.positionIndex,
        isMatchmaking: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      this.listenToFirestoreRoom(roomId);
      this.startHeartbeat(roomId);
      this.initPeerHost(roomId);

      // Bot Fallback Timer for Division Matchmaking: After 15 seconds of searching, pair with a division bot
      if (this.botFallbackTimer) {
        clearTimeout(this.botFallbackTimer);
      }
      this.botFallbackTimer = setTimeout(async () => {
        if (!this.isSearchingMatchmaking || !this.currentRoom || this.currentRoom.guest) {
          return;
        }
        this.isSearchingMatchmaking = false;

        const bot = getRandomBotProfile([this.localPlayerName]);
        const botCountry = getBotInstinctCountry(bot);
        const botCountryCode = botCountry.code;
        const botPlayer: OnlinePlayer = {
          id: bot.id,
          name: bot.username,
          countryCode: botCountryCode,
          role: 'guest',
          isReady: true,
          isLocal: false,
          profilePictureUrl: bot.avatarUrl,
        };

        this.currentRoom.guest = botPlayer;
        this.currentRoom.status = 'playing';
        this.currentRoom.isMatchmaking = false;

        await this.updateFirestoreRoom({
          guest: {
            id: bot.id,
            name: bot.username,
            countryCode: botCountryCode,
            isReady: true,
            profilePictureUrl: bot.avatarUrl,
          },
          status: 'playing',
          isMatchmaking: false,
          updatedAt: Date.now(),
        }).catch(() => {});

        this.emit('division_match_found', {
          room: this.currentRoom,
          myRole: 'host',
          hostCountryCode: countryCode,
          guestCountryCode: botCountryCode,
        });
      }, 15000);

      return true;
    } catch (error: any) {
      console.error('Find division match error:', error);
      this.isSearchingMatchmaking = false;
      if (this.botFallbackTimer) {
        clearTimeout(this.botFallbackTimer);
        this.botFallbackTimer = null;
      }
      this.emit('error', {
        message: error?.message || 'Division matchmaking failed.',
      });
      return false;
    }
  }

  public async cancelMatchmaking() {
    this.isSearchingMatchmaking = false;
    if (this.botFallbackTimer) {
      clearTimeout(this.botFallbackTimer);
      this.botFallbackTimer = null;
    }
    if (this.matchmakingInterval) {
      clearInterval(this.matchmakingInterval);
      this.matchmakingInterval = null;
    }
    this.stopHeartbeat();

    if (this.currentRoom) {
      const roomId = this.currentRoom.roomId;
      const isWaiting = this.currentRoom.status === 'waiting' || this.currentRoom.isMatchmaking;

      try {
        this.send('opponent_left', { roomId, playerId: this.localPlayerId });
        this.send('leave_room', { roomId, playerId: this.localPlayerId });
      } catch {}

      try {
        const roomRef = doc(db, 'rooms', roomId);
        if (isWaiting) {
          await updateDoc(roomRef, {
            status: 'cancelled',
            isMatchmaking: false,
            isOpponentDisconnected: true,
            leftPlayerId: this.localPlayerId,
            updatedAt: Date.now(),
          }).catch(() => {});
          await deleteDoc(roomRef).catch(() => {});
        } else {
          await updateDoc(roomRef, {
            status: 'opponent_left',
            isOpponentDisconnected: true,
            leftPlayerId: this.localPlayerId,
            updatedAt: Date.now(),
          }).catch(() => {});
        }
      } catch {}
    }

    await this.leaveRoom();
    this.emit('matchmaking_cancelled', {});
  }

  public async createRoom(
    gameMode: 'match' | 'penalty_training' | 'survival' = 'match',
    customCode?: string,
    isMatchmaking: boolean = false,
    division?: number,
    preSelectedCountryCode?: string | null,
    wagerTier?: 'rookie' | 'pro' | 'champion' | 'legend',
    entryFee?: number,
    prizePot?: number
  ): Promise<string> {
    const roomId = (customCode || this.generateRoomCode()).toUpperCase();
    const initialPosIndex = Math.floor(Math.random() * 30);
    const createdAt = Date.now();

    const hostPlayer: OnlinePlayer = {
      id: this.localPlayerId,
      name: this.localPlayerName,
      countryCode: preSelectedCountryCode || null,
      role: 'host',
      isReady: Boolean(preSelectedCountryCode),
      isLocal: true,
      profilePictureUrl: this.localPlayerProfilePictureUrl,
    };

    this.currentRoom = {
      roomId,
      host: hostPlayer,
      guest: null,
      gameMode,
      division,
      wagerTier,
      entryFee,
      prizePot,
      status: 'waiting',
      currentKickerRole: 'host',
      score: { host: 0, guest: 0 },
      survivalLives: gameMode === 'survival' ? { host: 3, guest: 3 } : undefined,
      turn: 1,
      positionIndex: initialPosIndex,
      countdown: null,
      countdownStartTime: null,
      isMatchmaking,
    };
    (this.currentRoom as any).createdAt = createdAt;

    // 1. Initialize Firestore room doc
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await setDoc(roomRef, {
        roomId,
        createdAt,
        updatedAt: createdAt,
        status: 'waiting',
        gameMode,
        division: division ?? null,
        wagerTier: wagerTier ?? null,
        entryFee: entryFee ?? null,
        prizePot: prizePot ?? null,
        isMatchmaking,
        currentKickerRole: 'host',
        score: { host: 0, guest: 0 },
        survivalLives: gameMode === 'survival' ? { host: 3, guest: 3 } : null,
        turn: 1,
        positionIndex: initialPosIndex,
        countdown: null,
        countdownStartTime: null,
        host: {
          id: this.localPlayerId,
          name: this.localPlayerName,
          countryCode: preSelectedCountryCode || null,
          isReady: Boolean(preSelectedCountryCode),
          profilePictureUrl: this.localPlayerProfilePictureUrl,
        },
        guest: null,
      });
    } catch (e: any) {
      console.warn('Firestore create error, falling back to P2P/local:', e);
    }

    // 2. Start Firestore snapshot listener & heartbeat
    this.listenToFirestoreRoom(roomId);
    this.startHeartbeat(roomId);

    // 3. Initialize WebRTC P2P
    this.initPeerHost(roomId);

    this.emit('room_created', { roomId, room: this.currentRoom });
    return roomId;
  }

  public async joinRoom(roomIdInput: string): Promise<boolean> {
    const code = roomIdInput.trim().toUpperCase();
    if (!code || code.length < 4) {
      this.emit('error', { message: 'Please enter a valid 5-digit room code.' });
      return false;
    }

    // 1. Fetch Firestore room data
    try {
      const roomRef = doc(db, 'rooms', code);
      const snap = await getDoc(roomRef);

      if (!snap.exists()) {
        this.emit('error', { message: `Room #${code} was not found. Please verify the code.` });
        return false;
      }

      const data = snap.data() as any;

      if (data.status === 'cancelled') {
        this.emit('error', { message: `Room #${code} has been cancelled by the host.` });
        return false;
      }

      if (data.status === 'opponent_left') {
        this.emit('error', { message: `Room #${code} has already ended.` });
        return false;
      }

      if (data.status !== 'waiting' && data.guest && data.guest.id !== this.localPlayerId) {
        this.emit('error', { message: `Room #${code} is full or a match is already in progress.` });
        return false;
      }

      const guestPlayer: OnlinePlayer = {
        id: this.localPlayerId,
        name: this.localPlayerName,
        countryCode: null,
        role: 'guest',
        isReady: false,
        isLocal: true,
        profilePictureUrl: this.localPlayerProfilePictureUrl,
      };

      await updateDoc(roomRef, {
        guest: {
          id: guestPlayer.id,
          name: guestPlayer.name,
          countryCode: null,
          isReady: false,
          profilePictureUrl: this.localPlayerProfilePictureUrl,
        },
        status: 'selecting_country',
      });

      this.currentRoom = {
        roomId: code,
        host: {
          id: data.host.id,
          name: data.host.name,
          countryCode: data.host.countryCode || null,
          role: 'host',
          isReady: data.host.isReady || false,
          isLocal: false,
          profilePictureUrl: data.host.profilePictureUrl || null,
        },
        guest: guestPlayer,
        gameMode: data.gameMode || 'match',
        status: 'selecting_country',
        currentKickerRole: 'host',
        score: { host: 0, guest: 0 },
        turn: 1,
        positionIndex: data.positionIndex ?? 0,
        countdown: null,
        countdownStartTime: null,
        isMatchmaking: data.isMatchmaking || false,
      };

      this.listenToFirestoreRoom(code);
    } catch (e: any) {
      console.warn('Firestore join warning:', e);
      if (e?.message && !e.message.includes('permission')) {
        this.emit('error', { message: e.message });
      }
    }

    // 2. Connect via WebRTC P2P
    this.initPeerGuest(code);

    // 3. Send join message over WebRTC & WS
    this.send('join_room', {
      roomId: code,
      playerName: this.localPlayerName,
      playerId: this.localPlayerId,
    });

    this.emit('room_joined', { roomId: code, role: 'guest', room: this.currentRoom });
    return true;
  }

  /**
   * Called when player picks a country on the Country Selection Page
   */
  public async selectCountry(countryCode: string) {
    if (!this.currentRoom) return;

    const isHost = this.currentRoom.host.isLocal;
    const myRole = isHost ? 'host' : 'guest';

    if (isHost) {
      this.currentRoom.host.countryCode = countryCode;
    } else if (this.currentRoom.guest) {
      this.currentRoom.guest.countryCode = countryCode;
    }

    // 1. Broadcast over WebRTC / WebSocket
    this.send('country_selected', {
      role: myRole,
      playerId: this.localPlayerId,
      countryCode,
    });

    // 2. Check if both have selected countries
    const hostCode = this.currentRoom.host.countryCode;
    const guestCode = this.currentRoom.guest?.countryCode;
    const bothSelected = Boolean(hostCode && guestCode);

    const updatePayload: Record<string, any> = {};
    if (isHost) {
      updatePayload['host.countryCode'] = countryCode;
    } else {
      updatePayload['guest.countryCode'] = countryCode;
    }

    if (bothSelected && this.currentRoom.status !== 'starting' && this.currentRoom.status !== 'playing') {
      const startTime = Date.now();
      updatePayload['status'] = 'starting';
      updatePayload['countdownStartTime'] = startTime;
      updatePayload['countdown'] = 3;
      this.currentRoom.status = 'starting';
      this.currentRoom.countdownStartTime = startTime;

      this.send('countdown_started', { countdownStartTime: startTime });
      this.emit('countdown_started', { countdownStartTime: startTime, room: this.currentRoom });
    }

    this.emit('country_selection_updated', {
      hostCountry: this.currentRoom.host.countryCode,
      guestCountry: this.currentRoom.guest?.countryCode,
      room: this.currentRoom,
    });

    // 3. Write to Firestore
    await this.updateFirestoreRoom(updatePayload);
  }

  /**
   * Called when a bot opponent picks a country on the Country Selection Page
   */
  public async botSelectCountry(countryCode: string) {
    if (!this.currentRoom) return;

    const isBotGuest = Boolean(
      this.currentRoom.guest &&
      (this.currentRoom.guest.id?.toLowerCase().startsWith('bot_') || (!this.currentRoom.guest.isLocal && !this.currentRoom.guest.id?.startsWith('P_')))
    );
    const isBotHost = Boolean(
      this.currentRoom.host &&
      (this.currentRoom.host.id?.toLowerCase().startsWith('bot_') || (!this.currentRoom.host.isLocal && !this.currentRoom.host.id?.startsWith('P_')))
    );

    const updatePayload: Record<string, any> = {};

    if (isBotGuest && this.currentRoom.guest) {
      this.currentRoom.guest.countryCode = countryCode;
      updatePayload['guest.countryCode'] = countryCode;
    } else if (isBotHost && this.currentRoom.host) {
      this.currentRoom.host.countryCode = countryCode;
      updatePayload['host.countryCode'] = countryCode;
    } else if (this.currentRoom.guest) {
      this.currentRoom.guest.countryCode = countryCode;
      updatePayload['guest.countryCode'] = countryCode;
    }

    const hostCode = this.currentRoom.host.countryCode;
    const guestCode = this.currentRoom.guest?.countryCode;
    const bothSelected = Boolean(hostCode && guestCode);

    if (bothSelected && this.currentRoom.status !== 'starting' && this.currentRoom.status !== 'playing') {
      const startTime = Date.now();
      updatePayload['status'] = 'starting';
      updatePayload['countdownStartTime'] = startTime;
      updatePayload['countdown'] = 3;
      this.currentRoom.status = 'starting';
      this.currentRoom.countdownStartTime = startTime;
      this.currentRoom.countdown = 3;

      this.send('countdown_started', { countdownStartTime: startTime });
      this.emit('countdown_started', { countdownStartTime: startTime, room: { ...this.currentRoom } });
    }

    const clonedRoom: OnlineMatchRoom = {
      ...this.currentRoom,
      host: { ...this.currentRoom.host },
      guest: this.currentRoom.guest ? { ...this.currentRoom.guest } : null,
    };
    this.currentRoom = clonedRoom;

    this.emit('country_selection_updated', {
      hostCountry: this.currentRoom.host.countryCode,
      guestCountry: this.currentRoom.guest?.countryCode,
      room: this.currentRoom,
    });
    this.emit('room_updated', { room: this.currentRoom });

    await this.updateFirestoreRoom(updatePayload);
  }

  /**
   * Final transition to match start after countdown
   */
  public async startMatch() {
    if (!this.currentRoom) return;

    this.currentRoom.status = 'playing';
    this.currentRoom.currentKickerRole = 'host'; // Creator of room kicks first!

    await this.updateFirestoreRoom({
      status: 'playing',
      currentKickerRole: 'host',
    });

    this.send('match_start', {
      roomId: this.currentRoom.roomId,
      currentKickerRole: 'host',
      turn: 1,
      positionIndex: this.currentRoom.positionIndex ?? 0,
    });

    this.emit('match_start', {
      currentKickerRole: 'host',
      turn: 1,
      positionIndex: this.currentRoom.positionIndex ?? 0,
      room: this.currentRoom,
    });
  }

  public setReady(isReady: boolean = true) {
    if (!this.currentRoom) return;

    if (this.currentRoom.host.isLocal) {
      this.currentRoom.host.isReady = isReady;
    } else if (this.currentRoom.guest) {
      this.currentRoom.guest.isReady = isReady;
    }

    this.send('player_ready', {
      playerId: this.localPlayerId,
      isReady,
    });
  }

  public syncAim(aimProgress: number, curveAmount: number) {
    this.send('sync_aim_curve', {
      aimProgress,
      curveAmount,
    });
  }

  public syncAimCurve(aimProgress: number, curveAmount: number) {
    this.syncAim(aimProgress, curveAmount);
  }

  public syncAftertouch(swerve: number, dip: number) {
    this.send('sync_aftertouch', {
      swerve,
      dip,
    });
  }

  public syncGoalkeeperMove(targetX: number, actionType: string) {
    this.send('sync_goalkeeper_move', {
      targetX,
      actionType,
    });
  }

  public syncGKPosition(gkStartX: number) {
    if (this.currentRoom) {
      this.currentRoom.gkStartX = gkStartX;
    }
    this.send('sync_gk_position', { gkStartX });
    this.updateFirestoreRoom({ gkStartX });
  }

  public syncPosition(positionIndex: number, gkStartX?: number) {
    if (this.currentRoom) {
      this.currentRoom.positionIndex = positionIndex;
      if (gkStartX !== undefined) {
        this.currentRoom.gkStartX = gkStartX;
      }
    }
    this.send('sync_position', { positionIndex, gkStartX });
    this.updateFirestoreRoom({ positionIndex, ...(gkStartX !== undefined ? { gkStartX } : {}) });
  }

  public advanceOnlineTurn(turnData: OnlineTurnAdvancePayload) {
    const hostScore = turnData.hostScore !== undefined ? turnData.hostScore : turnData.homeScore;
    const guestScore = turnData.guestScore !== undefined ? turnData.guestScore : turnData.awayScore;

    if (this.currentRoom) {
      this.currentRoom.currentKickerRole = turnData.nextTurnRole;
      this.currentRoom.positionIndex = turnData.nextPositionIndex;
      this.currentRoom.turn = turnData.turnNumber;
      if (turnData.gkStartX !== undefined) {
        this.currentRoom.gkStartX = turnData.gkStartX;
      }
      this.currentRoom.score = {
        host: hostScore,
        guest: guestScore,
      };
      if (turnData.survivalLives) {
        this.currentRoom.survivalLives = turnData.survivalLives;
      }
    }

    // Broadcast across WebRTC & local relays
    this.send('turn_advanced', {
      ...turnData,
      hostScore,
      guestScore,
      homeScore: hostScore,
      awayScore: guestScore,
    });

    // Persist in Firestore
    this.updateFirestoreRoom({
      currentKickerRole: turnData.nextTurnRole,
      positionIndex: turnData.nextPositionIndex,
      turn: turnData.turnNumber,
      ...(turnData.gkStartX !== undefined ? { gkStartX: turnData.gkStartX } : {}),
      ...(turnData.survivalLives !== undefined ? { survivalLives: turnData.survivalLives } : {}),
      score: {
        host: hostScore,
        guest: guestScore,
      },
    });
  }

  public executeShot(shotData: OnlineShotPayload) {
    const payloadWithTimestamp: OnlineShotPayload & { timestamp: number } = {
      ...shotData,
      timestamp: Date.now(),
    };
    this.lastProcessedShotTimestamp = payloadWithTimestamp.timestamp;

    // Send over P2P/WebSocket/BroadcastChannel
    this.send('shot_executed', payloadWithTimestamp);

    // Also persist in Firestore for 100% reliable cross-device delivery
    if (!this.isCurrentRoomBotMatch()) {
      this.updateFirestoreRoom({
        lastShot: payloadWithTimestamp,
      });
    }
  }

  public recordOutcome(outcomeData: OnlineShotOutcomePayload) {
    const hostScore = outcomeData.hostScore !== undefined ? outcomeData.hostScore : outcomeData.homeScore;
    const guestScore = outcomeData.guestScore !== undefined ? outcomeData.guestScore : outcomeData.awayScore;

    this.send('shot_outcome', {
      ...outcomeData,
      hostScore,
      guestScore,
      homeScore: hostScore,
      awayScore: guestScore,
    });
    if (this.currentRoom) {
      this.currentRoom.score = {
        host: hostScore,
        guest: guestScore,
      };
      if (outcomeData.survivalLives) {
        this.currentRoom.survivalLives = outcomeData.survivalLives;
      }
    }
    this.updateFirestoreRoom({
      score: {
        host: hostScore,
        guest: guestScore,
      },
      ...(outcomeData.survivalLives !== undefined ? { survivalLives: outcomeData.survivalLives } : {}),
    });
  }

  public skipReplay() {
    this.send('skip_replay', {});
  }

  public syncMatchTime(matchTime: number, stoppageCountdown?: number) {
    if (this.currentRoom) {
      this.currentRoom.matchTime = matchTime;
      if (stoppageCountdown !== undefined) {
        this.currentRoom.stoppageCountdown = stoppageCountdown;
      }
    }
    // Real-time sub-millisecond clock sync via direct channels (P2P / WebSocket / BroadcastChannel)
    this.send('sync_match_time', { matchTime, stoppageCountdown });
  }

  public endMatch(hostScore: number, guestScore: number, survivalLives?: { host: number; guest: number }) {
    if (this.currentRoom) {
      this.currentRoom.status = 'finished';
      this.currentRoom.matchTime = 0;
      this.currentRoom.stoppageCountdown = 0;
      this.currentRoom.score = { host: hostScore, guest: guestScore };
      if (survivalLives) {
        this.currentRoom.survivalLives = survivalLives;
      }
    }
    this.send('match_ended', { hostScore, guestScore, homeScore: hostScore, awayScore: guestScore, survivalLives });
    this.updateFirestoreRoom({
      status: 'finished',
      matchTime: 0,
      stoppageCountdown: 0,
      score: { host: hostScore, guest: guestScore },
      ...(survivalLives !== undefined ? { survivalLives } : {}),
    });

    // If match was against an AI bot, bot remains in room during results review before gracefully disconnecting
    if (this.isCurrentRoomBotMatch()) {
      setTimeout(() => {
        if (this.currentRoom && this.currentRoom.status === 'finished') {
          this.currentRoom.isOpponentDisconnected = true;
          this.currentRoom.status = 'opponent_left';
          this.updateFirestoreRoom({
            isOpponentDisconnected: true,
            status: 'opponent_left',
          }).catch(() => {});
          this.emit('opponent_disconnected', { message: 'Opponent disconnected from match' });
          this.emit('opponent_left', { message: 'Opponent left the match' });
          this.emit('room_updated', { room: this.currentRoom });
        }
      }, 20000);
    }
  }

  public async changeTeam(countryCode: string) {
    if (!this.currentRoom) return;
    const isHost = this.currentRoom.host.isLocal;
    const myRole: 'host' | 'guest' = isHost ? 'host' : 'guest';

    if (isHost) {
      this.currentRoom.host.countryCode = countryCode;
    } else if (this.currentRoom.guest) {
      this.currentRoom.guest.countryCode = countryCode;
    }

    this.send('team_changed', {
      role: myRole,
      countryCode,
      playerId: this.localPlayerId,
    });

    const updatePayload: Record<string, any> = {};
    if (isHost) {
      updatePayload['host.countryCode'] = countryCode;
    } else {
      updatePayload['guest.countryCode'] = countryCode;
    }

    await this.updateFirestoreRoom(updatePayload);

    this.emit('team_changed', {
      role: myRole,
      countryCode,
      room: this.currentRoom,
    });
  }

  public requestRematch() {
    if (!this.currentRoom) return;
    const isHost = this.currentRoom.host.isLocal;
    const myRole = isHost ? 'host' : 'guest';

    this.currentRoom.rematchRequestedBy = myRole;

    this.send('rematch_requested', {
      role: myRole,
      playerId: this.localPlayerId,
    });

    this.updateFirestoreRoom({
      rematchRequestedBy: myRole,
    });

    this.emit('rematch_requested', { role: myRole });
  }

  public acceptRematch(newPositionIndex?: number) {
    if (!this.currentRoom) return;
    const posIdx = newPositionIndex ?? Math.floor(Math.random() * 30);

    this.currentRoom.status = 'playing';
    this.currentRoom.score = { host: 0, guest: 0 };
    this.currentRoom.turn = 1;
    this.currentRoom.matchTime = 100;
    this.currentRoom.stoppageCountdown = null;
    this.currentRoom.positionIndex = posIdx;
    this.currentRoom.rematchRequestedBy = null;
    this.currentRoom.currentKickerRole = 'host';

    this.send('rematch_accepted', {
      positionIndex: posIdx,
    });

    this.updateFirestoreRoom({
      status: 'playing',
      score: { host: 0, guest: 0 },
      turn: 1,
      matchTime: 100,
      stoppageCountdown: null,
      positionIndex: posIdx,
      rematchRequestedBy: null,
      currentKickerRole: 'host',
    });

    this.emit('rematch_accepted', { positionIndex: posIdx, room: this.currentRoom });
    this.emit('match_start', {
      currentKickerRole: 'host',
      turn: 1,
      positionIndex: posIdx,
      room: this.currentRoom,
    });
  }

  public declineRematch() {
    if (!this.currentRoom) return;
    const isHost = this.currentRoom.host.isLocal;
    const myRole = isHost ? 'host' : 'guest';

    this.currentRoom.rematchRequestedBy = null;

    this.send('rematch_declined', {
      role: myRole,
      playerId: this.localPlayerId,
    });

    this.updateFirestoreRoom({
      rematchRequestedBy: null,
    });

    this.emit('rematch_declined', { role: myRole });
  }

  public notifyDisconnect() {
    this.stopHeartbeat();
    if (this.currentRoom) {
      const roomId = this.currentRoom.roomId;
      const isWaiting = this.currentRoom.status === 'waiting' || this.currentRoom.isMatchmaking;

      try {
        this.send('opponent_left', { roomId, playerId: this.localPlayerId });
        this.send('leave_room', { roomId, playerId: this.localPlayerId });
      } catch {}

      try {
        const roomRef = doc(db, 'rooms', roomId);
        if (isWaiting) {
          updateDoc(roomRef, {
            status: 'cancelled',
            isMatchmaking: false,
            isOpponentDisconnected: true,
            leftPlayerId: this.localPlayerId,
            updatedAt: Date.now(),
          }).then(() => {
            deleteDoc(roomRef).catch(() => {});
          }).catch(() => {});
        } else {
          updateDoc(roomRef, {
            status: 'opponent_left',
            isOpponentDisconnected: true,
            leftPlayerId: this.localPlayerId,
            updatedAt: Date.now(),
          }).catch(() => {});
        }
      } catch {}

      this.currentRoom.status = 'opponent_left';
      this.currentRoom.isOpponentDisconnected = true;
    }
  }

  public leaveRoom() {
    this.isSearchingMatchmaking = false;
    if (this.botFallbackTimer) {
      clearTimeout(this.botFallbackTimer);
      this.botFallbackTimer = null;
    }
    if (this.matchmakingInterval) {
      clearInterval(this.matchmakingInterval);
      this.matchmakingInterval = null;
    }
    this.stopHeartbeat();

    if (this.currentRoom) {
      const room = this.currentRoom;
      const roomId = room.roomId;
      const isWaiting = room.status === 'waiting' || room.isMatchmaking;

      try {
        this.send('opponent_left', { roomId, playerId: this.localPlayerId });
        this.send('leave_room', { roomId, playerId: this.localPlayerId });
      } catch {}

      try {
        const roomRef = doc(db, 'rooms', roomId);
        if (isWaiting) {
          updateDoc(roomRef, {
            status: 'cancelled',
            isMatchmaking: false,
            isOpponentDisconnected: true,
            leftPlayerId: this.localPlayerId,
            updatedAt: Date.now(),
          }).then(() => {
            deleteDoc(roomRef).catch(() => {});
          }).catch(() => {});
        } else {
          updateDoc(roomRef, {
            status: 'opponent_left',
            isOpponentDisconnected: true,
            leftPlayerId: this.localPlayerId,
            updatedAt: Date.now(),
          }).catch(() => {});
        }
      } catch {}
    }

    if (this.firestoreUnsub) {
      try { this.firestoreUnsub(); } catch {}
      this.firestoreUnsub = null;
    }

    if (this.peerConn) {
      try { this.peerConn.close(); } catch {}
      this.peerConn = null;
    }

    if (this.peer) {
      try { this.peer.destroy(); } catch {}
      this.peer = null;
    }

    this.currentRoom = null;
    this.emit('room_left', {});
  }

  /**
   * Explicitly terminates all active socket/peer listeners, stops matchmaking timers,
   * unsubscribes from Firestore, and completely wipes the room state and event listeners.
   */
  public cleanup() {
    this.isSearchingMatchmaking = false;
    if (this.botFallbackTimer) {
      clearTimeout(this.botFallbackTimer);
      this.botFallbackTimer = null;
    }
    if (this.matchmakingInterval) {
      clearInterval(this.matchmakingInterval);
      this.matchmakingInterval = null;
    }
    this.stopHeartbeat();

    // 1. Terminate room in Firestore and notify opponent
    if (this.currentRoom) {
      const room = this.currentRoom;
      const isWaiting = room.status === 'waiting';

      try {
        this.send('opponent_left', { roomId: room.roomId, playerId: this.localPlayerId });
        this.send('leave_room', { roomId: room.roomId, playerId: this.localPlayerId });
      } catch {}

      if (isWaiting) {
        try {
          const roomRef = doc(db, 'rooms', room.roomId);
          deleteDoc(roomRef).catch(() => updateDoc(roomRef, { status: 'cancelled', isOpponentDisconnected: true }));
        } catch {}
      } else {
        this.updateFirestoreRoom({
          status: 'opponent_left',
          isOpponentDisconnected: true,
          leftPlayerId: this.localPlayerId,
          updatedAt: Date.now(),
        });
      }
    }

    // 2. Unsubscribe Firestore listener
    if (this.firestoreUnsub) {
      try { this.firestoreUnsub(); } catch {}
      this.firestoreUnsub = null;
    }

    // 3. Close & destroy WebRTC peer connections
    if (this.peerConn) {
      try { this.peerConn.close(); } catch {}
      this.peerConn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch {}
      this.peer = null;
    }

    // 4. Terminate WebSocket connection
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    this.isConnected = false;
    this.isUsingP2P = false;

    // 5. Clear room state
    this.currentRoom = null;

    // 6. Clear all registered listeners
    this.listeners.clear();
  }

  // --- EVENT EMITTER UTILITIES ---

  public on(event: string, callback: OnlineEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: OnlineEventCallback) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  public emit(event: string, payload: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }
  }

  private generateRoomCode(): string {
    // Generate 5-digit numeric code (10000 to 99999)
    return Math.floor(10000 + Math.random() * 90000).toString();
  }
}

export const onlineMatchManager = new OnlineMatchManager();
