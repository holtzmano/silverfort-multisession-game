// server/src/services/GameService.ts
import type { GameState, Board, Cell, Shape, Color, LoseInfo } from '../types/index.js';
import { GAME_CONFIG } from '../config/index.js';

export class GameService {
  private static instance: GameService;
  private gameState: GameState;

  private constructor() {
    this.gameState = this.createNewGame();
  }

  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  public getState(): GameState {
    return this.gameState;
  }

  public reset(): GameState {
    this.gameState = this.createNewGame();
    return this.gameState;
  }

  public applyMove(row: number, col: number): GameState {
    if (this.gameState.gameOver || !this.isValidPosition(row, col)) {
      return this.gameState;
    }

    const cell = this.gameState.board[row]?.[col];
    if (!cell || cell.cooldown > 0) {
      return this.gameState;
    }

    const allowedInfo = this.getAllowedInfo(this.gameState.board, row, col);
    if (allowedInfo.pairs.length === 0) {
      this.gameState = this.createGameOverState(row, col, allowedInfo);
      return this.gameState;
    }

    this.gameState = this.applyValidMove(row, col, allowedInfo);
    return this.gameState;
  }

  private createNewGame(): GameState {
    return {
      board: this.generateInitialBoard(),
      score: 0,
      gameOver: false,
      turn: 0,
      loseInfo: null,
    };
  }

  private generateInitialBoard(): Board {
    const board: Board = Array.from({ length: GAME_CONFIG.ROWS }, () =>
      Array.from({ length: GAME_CONFIG.COLS }, () => ({ 
        shape: 'Square' as Shape, 
        color: 'Red' as Color, 
        cooldown: 0 
      }))
    );

    for (let r = 0; r < GAME_CONFIG.ROWS; r++) {
      for (let c = 0; c < GAME_CONFIG.COLS; c++) {
        const adjShapes = new Set<Shape>();
        const adjColors = new Set<Color>();

        // Row-major fill: only consider already-filled neighbors (top/left)
        for (const [nr, nc] of this.getNeighborCoords(r, c)) {
          if (nr < r || (nr === r && nc < c)) {
            const neighbor = board[nr]![nc]!;
            adjShapes.add(neighbor.shape);
            adjColors.add(neighbor.color);
          }
        }

        const allowedShapes = GAME_CONFIG.SHAPES.filter(s => !adjShapes.has(s));
        const allowedColors = GAME_CONFIG.COLORS.filter(c => !adjColors.has(c));

        const shape = allowedShapes.length ? this.randomChoice(allowedShapes) : this.randomChoice(GAME_CONFIG.SHAPES);
        const color = allowedColors.length ? this.randomChoice(allowedColors) : this.randomChoice(GAME_CONFIG.COLORS);

        board[r]![c] = { shape, color, cooldown: 0 };
      }
    }
    return board;
  }

  private getNeighborCoords(r: number, c: number): Array<[number, number]> {
    const directions: Array<[number, number]> = [
      [-1, 0], // up
      [1, 0],  // down
      [0, -1], // left
      [0, 1],  // right
    ];
    return directions
      .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
      .filter(([rr, cc]) => this.isValidPosition(rr, cc));
  }

  private isValidPosition(r: number, c: number): boolean {
    return r >= 0 && r < GAME_CONFIG.ROWS && c >= 0 && c < GAME_CONFIG.COLS;
  }

  private getAllowedInfo(board: Board, r: number, c: number) {
    if (!this.isValidPosition(r, c)) {
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

    for (const [nr, nc] of this.getNeighborCoords(r, c)) {
      const neighbor = board[nr]![nc]!;
      adjShapesSet.add(neighbor.shape);
      adjColorsSet.add(neighbor.color);
    }

    const allowedShapes = GAME_CONFIG.SHAPES.filter(s => 
      !adjShapesSet.has(s) && s !== current.shape
    );
    const allowedColors = GAME_CONFIG.COLORS.filter(c => 
      !adjColorsSet.has(c) && c !== current.color
    );

    const pairs: Array<{ shape: Shape; color: Color }> = [];
    for (const shape of allowedShapes) {
      for (const color of allowedColors) {
        pairs.push({ shape, color });
      }
    }

    return {
      pairs,
      allowedShapes,
      allowedColors,
      adjShapes: Array.from(adjShapesSet),
      adjColors: Array.from(adjColorsSet),
    };
  }

  private createGameOverState(row: number, col: number, allowedInfo: any): GameState {
    return {
      ...this.gameState,
      gameOver: true,
      loseInfo: {
        cell: { r: row, c: col },
        reason: {
          shapesExhausted: allowedInfo.allowedShapes.length === 0,
          colorsExhausted: allowedInfo.allowedColors.length === 0,
          adjShapes: allowedInfo.adjShapes,
          adjColors: allowedInfo.adjColors,
          allowedShapes: allowedInfo.allowedShapes,
          allowedColors: allowedInfo.allowedColors,
        },
      },
    };
  }

  private applyValidMove(row: number, col: number, allowedInfo: any): GameState {
    // Copy board (avoid mutating original references)
    const newBoard: Board = this.gameState.board.map(row => 
      row.map(cell => ({ ...cell }))
    );

    // Decrement cooldowns globally for this turn
    for (let r = 0; r < GAME_CONFIG.ROWS; r++) {
      for (let c = 0; c < GAME_CONFIG.COLS; c++) {
        const cell = newBoard[r]![c]!;
        if (cell.cooldown > 0) {
          cell.cooldown = Math.max(0, cell.cooldown - 1);
        }
      }
    }

    // Apply random valid pair and set cooldown for clicked cell
    const choice = this.randomChoice(allowedInfo.pairs);
    newBoard[row]![col] = { 
      shape: choice.shape, 
      color: choice.color, 
      cooldown: GAME_CONFIG.COOLDOWN_TURNS 
    };

    return {
      board: newBoard,
      score: this.gameState.score + 1,
      gameOver: false,
      turn: this.gameState.turn + 1,
      loseInfo: null,
    };
  }

  private randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!;
  }
}
