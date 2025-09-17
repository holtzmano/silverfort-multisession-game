// client/src/components/GameBoard.tsx
import React from 'react';
import { GameCell } from './GameCell';
import type { GameState, LoseInfo } from '../types';

interface GameBoardProps {
  state: GameState;
  onCellClick: (row: number, col: number) => void;
}

export function GameBoard({ state, onCellClick }: GameBoardProps) {
  const isNeighbor = (r: number, c: number, rr: number, cc: number) =>
    (Math.abs(r - rr) === 1 && c === cc) || (Math.abs(c - cc) === 1 && r === rr);

  const lost = state.gameOver ? state.loseInfo ?? null : null;

  const getCellProps = (row: number, col: number, cell: any) => {
    const disabled = state.gameOver || cell.cooldown > 0;
    const isLossCell = !!lost && row === lost.cell.r && col === lost.cell.c;
    const isBlocker = !!lost && isNeighbor(row, col, lost.cell.r, lost.cell.c);

    return {
      cell,
      row,
      col,
      disabled,
      isLossCell,
      isBlocker,
      onClick: onCellClick,
    };
  };

  return (
    <div
      className={`board ${state.gameOver ? 'gameover' : ''}`}
      role="grid"
      aria-label="Game board 3 rows by 6 columns"
      style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
    >
      {state.board.map((row, r) =>
        row.map((cell, c) => (
          <GameCell
            key={`${r}-${c}`}
            {...getCellProps(r, c, cell)}
          />
        ))
      )}
    </div>
  );
}
