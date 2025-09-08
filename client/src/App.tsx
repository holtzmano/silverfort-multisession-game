import './App.css';
import { useGame } from './useGame';
import { ShapeIcon } from './components/ShapeIcon';
import { useEffect, useState } from 'react';

const isNeighbor = (r: number, c: number, rr: number, cc: number) =>
  (Math.abs(r - rr) === 1 && c === cc) || (Math.abs(c - cc) === 1 && r === rr);

export default function App() {
  const { state, clickCell, reset, leaderboard, getLeaderboard, saveScore } = useGame();
  const [showLB, setShowLB] = useState(false);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (showLB) getLeaderboard();
  }, [showLB, getLeaderboard]);

  useEffect(() => {
    if (state && !state.gameOver) {
      setSaved(false);
      setName('');
    }
  }, [state]);

  if (!state) {
    return (
      <div className="wrap">
        <h1>Loading…</h1>
      </div>
    );
  }

  const lost = state.gameOver ? state.loseInfo ?? null : null;

  const canSave = Boolean(state.gameOver && !saved);

  const onSave = () => {
    const trimmed = name.trim();
    saveScore(trimmed); // server coerces empty to 'Oren'
    setSaved(true);
    if (showLB) getLeaderboard();
  };

  return (
    <div className="wrap">
      <main className="card">
        <header className="topbar">
          <h1>Multisession Game</h1>
          <div className="spacer" />
          <div className="score" aria-live="polite">Score: {state.score}</div>
          <button className="btn" onClick={() => setShowLB((s) => !s)}>
            {showLB ? 'Hide Leaderboard' : 'Leaderboard'}
          </button>
          <button className="btn" onClick={reset}>Reset</button>
        </header>

        {state.gameOver && (
          <div className="banner" role="alert" aria-live="assertive">
            Game Over
          </div>
        )}

        {/* Reason panel when game over */}
        {lost && (
          <div className="reason">
            <strong>Why?</strong>{' '}
            {lost.reason.allowedColors.length === 0 && lost.reason.allowedShapes.length === 0
              ? 'No shape or color available.'
              : lost.reason.allowedColors.length === 0
                ? 'No color available.'
                : 'No shape available.'}{' '}
            <div className="muted" style={{ marginTop: 6 }}>
              <div>Adj shapes: {lost.reason.adjShapes.join(', ') || '—'}</div>
              <div>Adj colors: {lost.reason.adjColors.join(', ') || '—'}</div>
              <div>Allowed shapes: {lost.reason.allowedShapes.join(', ') || '—'}</div>
              <div>Allowed colors: {lost.reason.allowedColors.join(', ') || '—'}</div>
            </div>
          </div>
        )}


        {/* Save score row (on game over) */}
        {state.gameOver && (
          <div className="save-row">
            <input
              type="text"
              placeholder="Nickname (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              aria-label="Nickname"
            />
            <button className="primary" disabled={!canSave} onClick={onSave}>
              {saved ? 'Saved ✓' : 'Save Score'}
            </button>
          </div>
        )}

        <div
          className={`board ${state.gameOver ? 'gameover' : ''}`}
          role="grid"
          aria-label="Game board 3 rows by 6 columns"
          style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
        >
          {state.board.map((row, r) =>
            row.map((cell, c) => {
              const disabled = state.gameOver || cell.cooldown > 0;
              const isLossCell = !!lost && r === lost.cell.r && c === lost.cell.c;
              const isBlocker = !!lost && isNeighbor(r, c, lost.cell.r, lost.cell.c);

              return (
                <button
                  key={`${r}-${c}`}
                  role="gridcell"
                  className={`cell ${disabled ? 'disabled' : ''} ${isLossCell ? 'loser' : ''} ${isBlocker ? 'blocker' : ''}`}
                  onClick={() => clickCell(r, c)}
                  disabled={disabled}
                  aria-disabled={disabled}
                  aria-label={`row ${r + 1} col ${c + 1}, ${cell.shape}, ${cell.color}${cell.cooldown > 0 ? `, cooldown ${cell.cooldown}` : ''}`}
                  title={`${cell.shape} • ${cell.color}${cell.cooldown > 0 ? ` • cooldown ${cell.cooldown}` : ''}`}
                >
                  <ShapeIcon shape={cell.shape} color={cell.color} />
                  {cell.cooldown > 0 && <span className="badge">{cell.cooldown}</span>}
                  {isLossCell && <span className="note">No move</span>}
                </button>
              );
            })
          )}
        </div>

        {/* Leaderboard panel */}
        {showLB && (
          <section className="leaderboard" aria-labelledby="lb-title">
            <h2 id="lb-title">Leaderboard</h2>
            {leaderboard.length === 0 ? (
              <p className="muted">No scores yet.</p>
            ) : (
              <ol>
                {leaderboard.map((e, idx) => (
                  <li key={`${e.name}-${e.when}-${idx}`}>
                    <span className="lb-name">{e.name || 'Oren'}</span>
                    <span className="lb-score">{e.score}</span>
                    <span className="lb-when">{new Date(e.when).toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        <footer className="footbar">
          <span>Status: {state.gameOver ? 'Game Over' : 'Playing'}</span>
          <span>Turn: {state.turn}</span>
        </footer>
      </main>
    </div>
  );
}
