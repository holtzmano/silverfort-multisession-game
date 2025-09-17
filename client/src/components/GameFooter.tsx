// client/src/components/GameFooter.tsx
import React from 'react';
import type { GameState } from '../types';

interface GameFooterProps {
  state: GameState;
}

export function GameFooter({ state }: GameFooterProps) {
  return (
    <footer className="footbar">
      <span>Status: {state.gameOver ? 'Game Over' : 'Playing'}</span>
      <span>Turn: {state.turn}</span>
    </footer>
  );
}
