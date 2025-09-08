// server/src/index.ts
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { newGameState, applyMove, inBounds } from './game.js';
import type { GameState } from './game.js';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '../package.json' with { type: 'json' };

const LEADERBOARD_PATH = new URL('../leaderboard.json', import.meta.url);
const startedAt = Date.now();

async function saveLeaderboardAtomic(data: unknown) {
  const json = JSON.stringify(data, null, 2);
  const finalPath = LEADERBOARD_PATH;
  const dir = dirname(fileURLToPath(finalPath));
  const tmpPath = new URL(`leaderboard.tmp-${Date.now()}.json`, new URL(dir + '/', import.meta.url));
  await writeFile(tmpPath, json, 'utf8');
  await rename(tmpPath, finalPath); // same dir = atomic on most filesystems
}

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const app = express();
app.use(cors({ origin: CLIENT_ORIGINS, credentials: true }));
app.use(express.json());

// Health endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    version: (pkg as any).version,
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
  });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGINS, methods: ['GET', 'POST'] },
});

// ---- Single in-memory game state ----
let gameState: GameState = newGameState();

type LeaderboardEntry = { name: string; score: number; when: number };
let leaderboard: LeaderboardEntry[] = [];

(async () => {
  try {
    const raw = await readFile(LEADERBOARD_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) leaderboard = parsed.slice(0, 10);
  } catch {
    // File missing on first run: ignore
  }
})();

type ClickPayload = { r: number; c: number };

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // simple per-socket sliding window: max 10 clicks / 1000ms
  const clickTimes: number[] = [];

  // Request current leaderboard
  socket.on('getLeaderboard', () => {
    socket.emit('leaderboard', leaderboard);
  });

  // Save score at end of game
  socket.on('saveScore', (payload: { name: string }) => {
    if (!gameState.gameOver) {
      console.warn(`⚠️ saveScore called before game over by ${socket.id}`);
      return;
    }
    const raw = (payload?.name ?? '').trim();
    const name = raw.length ? raw.slice(0, 24) : 'Oren';

    leaderboard.push({ name, score: gameState.score, when: Date.now() });
    leaderboard.sort((a, b) => b.score - a.score || a.when - b.when);
    leaderboard = leaderboard.slice(0, 10);

    // send back the updated list to the caller
    socket.emit('leaderboard', leaderboard);

    saveLeaderboardAtomic(leaderboard).catch(() => { });

    console.log(`🏆 Saved score: ${name} = ${gameState.score}`);
  });

  // Send current state immediately
  socket.emit('state', gameState);

  // Handle click events
  socket.on('click', (payload: ClickPayload) => {
    // rate limit
    const now = Date.now();
    while (clickTimes.length && now - clickTimes[0]! > 1000) clickTimes.shift();
    if (clickTimes.length >= 10) {
      return; // client does not consume error events; no-op on rate limit
    }
    clickTimes.push(now);

    const { r, c } = payload ?? {};
    if (typeof r !== 'number' || typeof c !== 'number' || !inBounds(r, c)) {
      console.warn(`⚠️ Invalid click payload from ${socket.id}:`, payload);
      return;
    }

    const before = gameState;
    const after = applyMove(before, r, c);
    const changed =
      after !== before ||
      after.score !== before.score ||
      after.turn !== before.turn ||
      after.gameOver !== before.gameOver;

    if (changed) {
      gameState = after;
      io.emit('state', gameState); // broadcast to all clients
      console.log(`✅ Move applied at (${r},${c}) | score=${gameState.score}, turn=${gameState.turn}, gameOver=${gameState.gameOver}`);
    } else {
      console.log(`ℹ️ No-op move at (${r},${c}) (cooldown/gameOver/invalid)`);
    }
  });

  // Handle reset events
  socket.on('reset', () => {
    gameState = newGameState();
    io.emit('state', gameState);
    console.log(`🔄 Game reset by ${socket.id}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
