// client/src/components/GameHeader.tsx
import React from 'react';
import type { GameState } from '../types';

interface GameHeaderProps {
  state: GameState;
  onToggleLeaderboard: () => void;
  onReset: () => void;
  showLeaderboard: boolean;
}

export function GameHeader({ 
  state, 
  onToggleLeaderboard, 
  onReset, 
  showLeaderboard 
}: GameHeaderProps) {
  return (
    <header className="topbar">
      <h1>Multisession Game</h1>
      <div className="spacer" />
      <div className="score" aria-live="polite" role="status" aria-atomic="true">
        Score: {state.score}
      </div>
      <button className="btn" onClick={onToggleLeaderboard}>
        {showLeaderboard ? 'Hide Leaderboard' : 'Leaderboard'}
      </button>
      <button className="btn" onClick={onReset}>Reset</button>
    </header>
  );
}
