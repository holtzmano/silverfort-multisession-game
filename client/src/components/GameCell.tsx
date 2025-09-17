// client/src/components/GameCell.tsx
import React from 'react';
import { ShapeIcon } from './ShapeIcon';
import type { Cell } from '../types';

interface GameCellProps {
  cell: Cell;
  row: number;
  col: number;
  disabled: boolean;
  isLossCell: boolean;
  isBlocker: boolean;
  onClick: (row: number, col: number) => void;
}

export function GameCell({ 
  cell, 
  row, 
  col, 
  disabled, 
  isLossCell, 
  isBlocker, 
  onClick 
}: GameCellProps) {
  const getCellClassName = () => {
    const baseClass = 'cell';
    const classes = [baseClass];
    
    if (disabled) classes.push('disabled');
    if (isLossCell) classes.push('loser');
    if (isBlocker) classes.push('blocker');
    
    return classes.join(' ');
  };

  const getAriaLabel = () => {
    const baseLabel = `row ${row + 1} col ${col + 1}, ${cell.shape}, ${cell.color}`;
    const cooldownLabel = cell.cooldown > 0 ? `, cooldown ${cell.cooldown}` : '';
    return baseLabel + cooldownLabel;
  };

  const getTitle = () => {
    const baseTitle = `${cell.shape} • ${cell.color}`;
    const cooldownTitle = cell.cooldown > 0 ? ` • cooldown ${cell.cooldown}` : '';
    return baseTitle + cooldownTitle;
  };

  return (
    <button
      role="gridcell"
      className={getCellClassName()}
      onClick={() => onClick(row, col)}
      disabled={disabled}
      aria-disabled={disabled}
      aria-label={getAriaLabel()}
      title={getTitle()}
    >
      <ShapeIcon shape={cell.shape} color={cell.color} />
      {cell.cooldown > 0 && <span className="badge">{cell.cooldown}</span>}
      {isLossCell && <span className="note">No move</span>}
    </button>
  );
}
