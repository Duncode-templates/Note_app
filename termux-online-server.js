/**
 * ============================================================================
 * ⚽ FREE KICK CHAMPIONS - MULTIPLAYER ONLINE MATCH SERVER (TERMUX READY) ⚽
 * ============================================================================
 *
 * This server runs on Android Termux (or any Node.js environment) to host
 * real-time 1v1 online matches between players over Wi-Fi, Hotspot, or Internet!
 *
 * HOW TO RUN ON TERMUX:
 * 1. Open Termux on your Android device
 * 2. Run: pkg update && pkg install nodejs git
 * 3. Run: npm install ws
 * 4. Run: node termux-online-server.js
 * 
 * Your friends on the same Wi-Fi or Mobile Hotspot can connect using your IP!
 * To play over the internet, you can use ngrok, localtunnel, or cloudflared:
 *    npx localtunnel --port 8080
 * ============================================================================
 */

import http from 'http';
import os from 'os';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Active Match Rooms Map: roomId -> RoomState
const rooms = new Map();

/**
 * Generate unique 5-digit Room Code (e.g. "58291", "10492")
 */
function generateRoomCode() {
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  return rooms.has(code) ? generateRoomCode() : code;
}

/**
 * Get all local network IP addresses for easy connection in Termux
 */
function getLocalIPAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ name, address: iface.address });
      }
    }
  }
  return addresses;
}

// HTTP Server for Health Checks and Room Status Info
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || '/';

  if (url === '/api/rooms' || url === '/rooms') {
    const publicRooms = Array.from(rooms.values()).map((r) => ({
      id: r.id,
      playerCount: r.players.length,
      status: r.status,
      gameMode: r.gameMode,
      hostName: r.players[0]?.name || 'Player 1',
      hostCountry: r.players[0]?.country || 'BRA',
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: publicRooms.length, rooms: publicRooms }));
    return;
  }

  if (url === '/health' || url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'online',
        uptime: process.uptime(),
        activeRooms: rooms.size,
        connectedSockets: wss.clients.size,
        timestamp: Date.now(),
      })
    );
    return;
  }

  // Default HTML Dashboard
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Free Kick Champions - Match Server</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
        .card { background: #1e293b; border: 2px solid #334155; border-radius: 16px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #f59e0b; margin-top: 0; display: flex; align-items: center; gap: 8px; font-size: 24px; }
        .badge { background: #10b981; color: #000; font-weight: 900; padding: 4px 10px; border-radius: 999px; font-size: 12px; }
        .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
        .stat-box { background: #0f172a; padding: 12px; border-radius: 10px; border: 1px solid #334155; }
        .stat-num { font-size: 22px; font-weight: bold; color: #38bdf8; }
        .stat-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; }
        pre { background: #000; color: #4ade80; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
        .footer { font-size: 12px; color: #64748b; margin-top: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>⚽ Free Kick Champions Server <span class="badge">ONLINE</span></h1>
        <p>Your Termux multiplayer match server is running and ready for matches!</p>
        
        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-num">${rooms.size}</div>
            <div class="stat-label">Active Match Rooms</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${wss.clients.size}</div>
            <div class="stat-label">Connected Players</div>
          </div>
        </div>

        <h3>📱 How to Connect in App:</h3>
        <p>In the game's Online Match menu, enter your server address:</p>
        <pre>ws://${getLocalIPAddresses()[0]?.address || 'localhost'}:${PORT}</pre>
        
        <div class="footer">Termux Node.js Match Relay Server • Version 1.0.0</div>
      </div>
    </body>
    </html>
  `);
});

// WebSocket Server for Real-Time Match Relay
const wss = new WebSocketServer({ server });

/**
 * Broadcast an event to all players in a room
 */
function broadcastToRoom(roomId, event, payload, excludeWs = null) {
  const room = rooms.get(roomId);
  if (!room) return;

  const message = JSON.stringify({ event, payload });
  for (const p of room.players) {
    if (p.ws !== excludeWs && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(message);
    }
  }
}

/**
 * Send event to a specific websocket
 */
function send(ws, event, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, payload }));
  }
}

wss.on('connection', (ws) => {
  let playerRoomId = null;
  let playerId = 'P_' + Math.random().toString(36).substring(2, 9);
  let playerName = 'Player';
  let playerCountry = 'BRA';

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { event, payload } = data;

      switch (event) {
        // --- 1. CREATE ROOM ---
        case 'create_room': {
          const roomId = (payload?.customCode || generateRoomCode()).toUpperCase();
          playerName = payload?.playerName || 'Player 1';
          playerCountry = payload?.country || 'BRA';
          const gameMode = payload?.gameMode || 'free_kick_match';

          const newRoom = {
            id: roomId,
            gameMode,
            status: 'waiting', // waiting, playing, finished
            turn: 1,
            currentKickerId: playerId,
            score: {
              player1: 0,
              player2: 0,
            },
            stats: {
              p1Shots: 0,
              p2Shots: 0,
              p1Goals: 0,
              p2Goals: 0,
            },
            currentFkPosition: payload?.initialPosition || { distance: 24, xOffset: 0, wallSize: 4 },
            players: [
              {
                id: playerId,
                ws,
                role: 'host', // host = player 1
                name: playerName,
                country: playerCountry,
                ready: false,
              },
            ],
          };

          rooms.set(roomId, newRoom);
          playerRoomId = roomId;

          send(ws, 'room_created', {
            roomId,
            playerId,
            role: 'host',
            room: {
              id: roomId,
              gameMode,
              players: newRoom.players.map((p) => ({ id: p.id, name: p.name, country: p.country, role: p.role })),
            },
          });
          console.log(`[ROOM CREATED] Code: ${roomId} by ${playerName} (${playerCountry})`);
          break;
        }

        // --- 2. JOIN ROOM ---
        case 'join_room': {
          const roomId = (payload?.roomId || '').toUpperCase();
          playerName = payload?.playerName || 'Player 2';
          playerCountry = payload?.country || 'ARG';

          const room = rooms.get(roomId);
          if (!room) {
            send(ws, 'error', { message: 'Room not found! Check the room code.' });
            return;
          }

          if (room.players.length >= 2) {
            send(ws, 'error', { message: 'Room is already full (2/2 players).' });
            return;
          }

          playerRoomId = roomId;
          const guestPlayer = {
            id: playerId,
            ws,
            role: 'guest', // guest = player 2
            name: playerName,
            country: playerCountry,
            ready: false,
          };
          room.players.push(guestPlayer);
          room.status = 'ready';

          send(ws, 'room_joined', {
            roomId,
            playerId,
            role: 'guest',
            gameMode: room.gameMode,
            currentFkPosition: room.currentFkPosition,
            players: room.players.map((p) => ({ id: p.id, name: p.name, country: p.country, role: p.role })),
          });

          // Notify host that guest has joined
          broadcastToRoom(roomId, 'player_joined', {
            player: { id: playerId, name: playerName, country: playerCountry, role: 'guest' },
            players: room.players.map((p) => ({ id: p.id, name: p.name, country: p.country, role: p.role })),
          }, ws);

          console.log(`[ROOM JOINED] ${playerName} joined Room ${roomId}`);
          break;
        }

        // --- 3. PLAYER READY / START MATCH ---
        case 'player_ready': {
          if (!playerRoomId) return;
          const room = rooms.get(playerRoomId);
          if (!room) return;

          const p = room.players.find((x) => x.id === playerId);
          if (p) p.ready = true;

          const allReady = room.players.length === 2 && room.players.every((x) => x.ready);
          if (allReady) {
            room.status = 'playing';
            room.currentKickerId = room.players[0].id; // Host kicks first
            broadcastToRoom(playerRoomId, 'match_start', {
              currentKickerId: room.currentKickerId,
              kickerCountry: room.players[0].country,
              goalkeeperCountry: room.players[1].country,
              position: room.currentFkPosition,
              turn: 1,
            });
            console.log(`[MATCH STARTED] Room ${playerRoomId} - Game On!`);
          } else {
            broadcastToRoom(playerRoomId, 'player_status_updated', {
              playerId,
              ready: true,
            });
          }
          break;
        }

        // --- 4. REAL-TIME AIM & CURVE SYNC ---
        case 'sync_aim_curve': {
          if (!playerRoomId) return;
          // Relay aim/curve updates to opponent so they can see live indicators
          broadcastToRoom(playerRoomId, 'opponent_aim_update', payload, ws);
          break;
        }

        // --- 5. GOALKEEPER POSITION SYNC ---
        case 'sync_goalkeeper_move': {
          if (!playerRoomId) return;
          // Relay real-time manual GK movement/dive intent to the opponent
          broadcastToRoom(playerRoomId, 'opponent_gk_update', payload, ws);
          break;
        }

        // --- 6. SHOT TRIGGERED ---
        case 'shot_executed': {
          if (!playerRoomId) return;
          const room = rooms.get(playerRoomId);
          if (!room) return;

          // Payload contains: aimProgress, power, curveAmount, shotGravity, passToTeammate, targetTeammateIndex
          broadcastToRoom(playerRoomId, 'shot_received', {
            kickerId: playerId,
            ...payload,
          }, ws);
          console.log(`[SHOT EXECUTED] Room ${playerRoomId} by ${playerName}: Power=${payload?.power}%`);
          break;
        }

        // --- 7. SHOT OUTCOME RESOLUTION ---
        case 'shot_outcome': {
          if (!playerRoomId) return;
          const room = rooms.get(playerRoomId);
          if (!room) return;

          const { outcome, isGoal, isWoodwork } = payload;
          const isPlayer1Kicker = room.currentKickerId === room.players[0]?.id;

          if (isPlayer1Kicker) {
            room.stats.p1Shots++;
            if (isGoal) {
              room.score.player1++;
              room.stats.p1Goals++;
            }
          } else {
            room.stats.p2Shots++;
            if (isGoal) {
              room.score.player2++;
              room.stats.p2Goals++;
            }
          }

          // Switch Kicker for next turn
          const nextKicker = isPlayer1Kicker ? room.players[1]?.id : room.players[0]?.id;
          room.currentKickerId = nextKicker;
          room.turn++;

          broadcastToRoom(playerRoomId, 'turn_result', {
            outcome,
            isGoal,
            isWoodwork,
            score: room.score,
            stats: room.stats,
            nextKickerId: nextKicker,
            nextTurn: room.turn,
            nextPosition: payload?.nextPosition || room.currentFkPosition,
          });
          break;
        }

        // --- 8. SKIP REPLAY SYNC ---
        case 'skip_replay': {
          if (!playerRoomId) return;
          broadcastToRoom(playerRoomId, 'replay_skipped', {}, ws);
          break;
        }

        // --- 9. IN-GAME REACTION / EMOJI / CHAT ---
        case 'send_reaction': {
          if (!playerRoomId) return;
          broadcastToRoom(playerRoomId, 'reaction_received', {
            senderId: playerId,
            senderName: playerName,
            stickerId: payload?.stickerId,
            text: payload?.text,
          }, ws);
          break;
        }

        // --- 10. REMATCH REQUEST ---
        case 'request_rematch': {
          if (!playerRoomId) return;
          const room = rooms.get(playerRoomId);
          if (!room) return;

          room.score = { player1: 0, player2: 0 };
          room.turn = 1;
          room.status = 'playing';
          room.currentKickerId = room.players[0]?.id;

          broadcastToRoom(playerRoomId, 'rematch_started', {
            currentKickerId: room.currentKickerId,
            score: room.score,
          });
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[WS ERROR]', err);
    }
  });

  ws.on('close', () => {
    if (playerRoomId && rooms.has(playerRoomId)) {
      const room = rooms.get(playerRoomId);
      if (room) {
        room.players = room.players.filter((p) => p.id !== playerId);
        if (room.players.length === 0) {
          rooms.delete(playerRoomId);
          console.log(`[ROOM CLOSED] Room ${playerRoomId} deleted`);
        } else {
          broadcastToRoom(playerRoomId, 'opponent_disconnected', {
            message: `${playerName} disconnected from the match.`,
          });
          room.status = 'waiting';
        }
      }
    }
  });
});

// Start Server & Display Termux Banner
server.listen(PORT, HOST, () => {
  const ips = getLocalIPAddresses();
  console.clear();
  console.log('\x1b[33m%s\x1b[0m', '===========================================================');
  console.log('\x1b[32m%s\x1b[0m', '  ⚽ FREE KICK CHAMPIONS - MULTIPLAYER SERVER (ONLINE) ⚽');
  console.log('\x1b[33m%s\x1b[0m', '===========================================================');
  console.log(`\x1b[36m✔ Server Port:\x1b[0m ${PORT}`);
  console.log(`\x1b[36m✔ Local Access:\x1b[0m http://localhost:${PORT}`);
  console.log('\x1b[35m%s\x1b[0m', '--- CONNECT FROM OTHER DEVICES (Same Wi-Fi / Hotspot) ---');
  if (ips.length > 0) {
    ips.forEach((ip) => {
      console.log(`  📱 Network [${ip.name}]: \x1b[32mws://${ip.address}:${PORT}\x1b[0m`);
    });
  } else {
    console.log(`  📱 Localhost: ws://127.0.0.1:${PORT}`);
  }
  console.log('\x1b[33m%s\x1b[0m', '-----------------------------------------------------------');
  console.log('\x1b[90mWaiting for players to create or join match rooms...\x1b[0m\n');
});
