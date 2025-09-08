// server/src/game.ts

// ----- Types -----
export type Shape = 'Triangle' | 'Square' | 'Diamond' | 'Circle';
export type Color = 'Red' | 'Green' | 'Blue' | 'Yellow';

export type Cell = { shape: Shape; color: Color; cooldown: number };
export type Board = Cell[][];

export type LoseInfo = {
  cell: { r: number; c: number };
  reason: {
    shapesExhausted: boolean;
    colorsExhausted: boolean;
    adjShapes: Shape[];
    adjColors: Color[];
    allowedShapes: Shape[];
    allowedColors: Color[];
  };
};

export type GameState = {
  board: Board;
  score: number;
  gameOver: boolean;
  turn: number; // increments on each valid move
  loseInfo?: LoseInfo | null;
};

// ----- Constants -----
export const SHAPES: Shape[] = ['Triangle', 'Square', 'Diamond', 'Circle'];
export const COLORS: Color[] = ['Red', 'Green', 'Blue', 'Yellow'];
export const ROWS = 3;
export const COLS = 6;

// ----- Utils -----
const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
export const inBounds = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

export const getNeighborCoords = (r: number, c: number): Array<[number, number]> => {
  const dirs: Array<[number, number]> = [
    [-1, 0], // up
    [1, 0],  // down
    [0, -1], // left
    [0, 1],  // right
  ];
  return dirs
    .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
    .filter(([rr, cc]) => inBounds(rr, cc));
};

// ----- Initial board generation -----
// Ensures no orthogonal neighbors share the same shape OR color at start.
export const generateInitialBoard = (): Board => {
  const board: Board = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ shape: 'Square' as Shape, color: 'Red' as Color, cooldown: 0 }))
  );

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const adjShapes = new Set<Shape>();
      const adjColors = new Set<Color>();

      // Row-major fill: only consider already-filled neighbors (top/left)
      for (const [nr, nc] of getNeighborCoords(r, c)) {
        if (nr < r || (nr === r && nc < c)) {
          const n = board[nr]![nc]!;
          adjShapes.add(n.shape);
          adjColors.add(n.color);
        }
      }

      const allowedShapes = SHAPES.filter((s) => !adjShapes.has(s));
      const allowedColors = COLORS.filter((cl) => !adjColors.has(cl));

      const shape = allowedShapes.length ? rand(allowedShapes) : rand(SHAPES);
      const color = allowedColors.length ? rand(allowedColors) : rand(COLORS);

      board[r]![c] = { shape, color, cooldown: 0 };
    }
  }
  return board;
};

// ----- Allowed info for a click -----
// Returns valid pairs and the intermediate sets used to compute them.
// Rules: orthogonal neighbors only; BOTH shape and color must change.
export const getAllowedInfo = (board: Board, r: number, c: number) => {
  if (!inBounds(r, c)) {
    return {
      pairs: [] as Array<{ shape: Shape; color: Color }>,
      allowedShapes: [] as Shape[],
      allowedColors: [] as Color[],
      adjShapes: [] as Shape[],
      adjColors: [] as Color[],
    };
  }

  const current = board[r]![c]!;
  const adjShapesSet = new Set<Shape>();
  const adjColorsSet = new Set<Color>();

  for (const [nr, nc] of getNeighborCoords(r, c)) {
    const n = board[nr]![nc]!;
    adjShapesSet.add(n.shape);
    adjColorsSet.add(n.color);
  }

  const allowedShapes = SHAPES.filter((s) => !adjShapesSet.has(s) && s !== current.shape);
  const allowedColors = COLORS.filter((cl) => !adjColorsSet.has(cl) && cl !== current.color);

  const pairs: Array<{ shape: Shape; color: Color }> = [];
  for (const s of allowedShapes) {
    for (const cl of allowedColors) {
      pairs.push({ shape: s, color: cl });
    }
  }

  return {
    pairs,
    allowedShapes,
    allowedColors,
    adjShapes: Array.from(adjShapesSet),
    adjColors: Array.from(adjColorsSet),
  };
};

// Keep the original helper for compatibility
// (removed unused getAllowedPairs wrapper)

// ----- Game state helpers -----
export const newGameState = (): GameState => ({
  board: generateInitialBoard(),
  score: 0,
  gameOver: false,
  turn: 0,
  loseInfo: null,
});

// Apply a move (if valid). If no valid pairs exist -> game over with loseInfo.
export const applyMove = (state: GameState, r: number, c: number): GameState => {
  if (state.gameOver || !inBounds(r, c)) return state;

  const cell = state.board[r]?.[c];
  if (!cell || cell.cooldown > 0) return state;

  const info = getAllowedInfo(state.board, r, c);
  if (info.pairs.length === 0) {
    return {
      ...state,
      gameOver: true,
      loseInfo: {
        cell: { r, c },
        reason: {
          shapesExhausted: info.allowedShapes.length === 0,
          colorsExhausted: info.allowedColors.length === 0,
          adjShapes: info.adjShapes,
          adjColors: info.adjColors,
          allowedShapes: info.allowedShapes,
          allowedColors: info.allowedColors,
        },
      },
    };
  }

  // Copy board (avoid mutating original references)
  const newBoard: Board = state.board.map((row) => row.map((cell) => ({ ...cell })));

  // Decrement cooldowns globally for this turn
  for (let rr = 0; rr < ROWS; rr++) {
    for (let cc = 0; cc < COLS; cc++) {
      const cur = newBoard[rr]![cc]!;
      if (cur.cooldown > 0) cur.cooldown = Math.max(0, cur.cooldown - 1);
    }
  }

  // Apply random valid pair and set cooldown to 3 for clicked cell
  const choice = rand(info.pairs);
  newBoard[r]![c] = { shape: choice.shape, color: choice.color, cooldown: 3 };

  return {
    board: newBoard,
    score: state.score + 1,
    gameOver: false,
    turn: state.turn + 1,
    loseInfo: null, // clear previous lose metadata
  };
};
