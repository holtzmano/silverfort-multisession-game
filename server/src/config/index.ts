// server/src/config/index.ts
export const GAME_CONFIG = {
  SHAPES: ['Triangle', 'Square', 'Diamond', 'Circle'] as const,
  COLORS: ['Red', 'Green', 'Blue', 'Yellow'] as const,
  ROWS: 3,
  COLS: 6,
  COOLDOWN_TURNS: 3,
} as const;

export const SERVER_CONFIG = {
  PORT: Number(process.env.PORT) || 4000,
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
} as const;

export const RATE_LIMIT_CONFIG = {
  MAX_CLICKS: 10,
  WINDOW_MS: 1000,
} as const;

export const LEADERBOARD_CONFIG = {
  MAX_ENTRIES: 10,
  DEFAULT_NAME: 'Oren',
  MAX_NAME_LENGTH: 24,
} as const;
