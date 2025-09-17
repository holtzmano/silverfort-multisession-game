// client/src/hooks/useGameState.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, LeaderboardEntry } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000';

export function useGameState() {
  const [state, setState] = useState<GameState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[client] connected', socket.id);
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('[client] disconnected');
      setIsConnected(false);
    });

    socket.on('state', (next: GameState) => {
      setState(next);
    });

    socket.on('leaderboard', (entries: LeaderboardEntry[]) => {
      setLeaderboard(entries ?? []);
    });

    socket.on('errorEvent', (errorMessage: string) => {
      console.warn('[server]', errorMessage);
      setError(errorMessage);
    });

    return () => {
      socket.off('state');
      socket.off('leaderboard');
      socket.off('errorEvent');
      socket.disconnect();
    };
  }, []);

  const clickCell = useCallback(
    (r: number, c: number) => {
      if (!socketRef.current || !state || state.gameOver) return;
      const cell = state.board[r][c];
      if (cell.cooldown > 0) return;
      socketRef.current.emit('click', { r, c });
    },
    [state]
  );

  const reset = useCallback(() => {
    socketRef.current?.emit('reset');
  }, []);

  const getLeaderboard = useCallback(() => {
    socketRef.current?.emit('getLeaderboard');
  }, []);

  const saveScore = useCallback((name: string) => {
    if (!state?.gameOver) return;
    socketRef.current?.emit('saveScore', { name });
  }, [state?.gameOver]);

  return {
    state,
    leaderboard,
    isConnected,
    error,
    clickCell,
    reset,
    getLeaderboard,
    saveScore,
  };
}
