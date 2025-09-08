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
  turn: number;
  loseInfo?: LoseInfo | null;
};


export type LeaderboardEntry = { name: string; score: number; when: number };
