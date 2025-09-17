// client/src/components/GameOverReason.tsx
import React from 'react';
import type { LoseInfo } from '../types';

interface GameOverReasonProps {
  loseInfo: LoseInfo;
}

export function GameOverReason({ loseInfo }: GameOverReasonProps) {
  const { reason } = loseInfo;
  
  const getReasonText = () => {
    if (reason.allowedColors.length === 0 && reason.allowedShapes.length === 0) {
      return 'No shape or color available.';
    }
    if (reason.allowedColors.length === 0) {
      return 'No color available.';
    }
    return 'No shape available.';
  };

  return (
    <div className="reason">
      <strong>Why?</strong> {getReasonText()}
      <div className="muted" style={{ marginTop: 6 }}>
        <div>Adj shapes: {reason.adjShapes.join(', ') || '—'}</div>
        <div>Adj colors: {reason.adjColors.join(', ') || '—'}</div>
        <div>Allowed shapes: {reason.allowedShapes.join(', ') || '—'}</div>
        <div>Allowed colors: {reason.allowedColors.join(', ') || '—'}</div>
      </div>
    </div>
  );
}
