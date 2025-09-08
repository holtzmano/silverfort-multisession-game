import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, LeaderboardEntry } from './types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000';

export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL, {
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[client] connected', socket.id);
    });

    socket.on('state', (next: GameState) => {
      setState(next);
    });

    socket.on('leaderboard', (entries: LeaderboardEntry[]) => {
      setLeaderboard(entries ?? []);
    });

    socket.on('errorEvent', (e) => {
      console.warn('[server]', e);
    });


    return () => {
      socket.off('state');
      socket.off('leaderboard');
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

  return { state, clickCell, reset, leaderboard, getLeaderboard, saveScore };
}
