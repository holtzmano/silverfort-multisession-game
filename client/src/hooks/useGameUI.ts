// client/src/hooks/useGameUI.ts
import { useEffect, useState } from 'react';
import type { GameState } from '../types';

export function useGameUI(state: GameState | null) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  // Reset UI state when game starts
  useEffect(() => {
    if (state && !state.gameOver) {
      setSaved(false);
      setName('');
    }
  }, [state]);

  const toggleLeaderboard = () => {
    setShowLeaderboard(prev => !prev);
  };

  const canSave = Boolean(state?.gameOver && !saved);

  return {
    showLeaderboard,
    name,
    saved,
    canSave,
    toggleLeaderboard,
    setName,
    setSaved,
  };
}
