// client/src/components/Leaderboard.tsx
import React from 'react';
import type { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
}

export function Leaderboard({ leaderboard }: LeaderboardProps) {
  if (leaderboard.length === 0) {
    return (
      <section className="leaderboard" aria-labelledby="lb-title">
        <h2 id="lb-title">Leaderboard</h2>
        <p className="muted">No scores yet.</p>
      </section>
    );
  }

  return (
    <section className="leaderboard" aria-labelledby="lb-title">
      <h2 id="lb-title">Leaderboard</h2>
      <ol>
        {leaderboard.map((entry, idx) => (
          <li key={`${entry.name}-${entry.when}-${idx}`}>
            <span className="lb-name">{entry.name || 'Oren'}</span>
            <span className="lb-score">{entry.score}</span>
            <span className="lb-when">{new Date(entry.when).toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
