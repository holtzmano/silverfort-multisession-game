import './App.css';
import { useGameState } from './hooks/useGameState';
import { useGameUI } from './hooks/useGameUI';
import { GameHeader } from './components/GameHeader';
import { GameOverBanner } from './components/GameOverBanner';
import { GameOverReason } from './components/GameOverReason';
import { SaveScoreForm } from './components/SaveScoreForm';
import { GameBoard } from './components/GameBoard';
import { Leaderboard } from './components/Leaderboard';
import { GameFooter } from './components/GameFooter';
import { LoadingScreen } from './components/LoadingScreen';
import { useEffect } from 'react';

export default function App() {
  const { 
    state, 
    leaderboard, 
    isConnected, 
    error, 
    clickCell, 
    reset, 
    getLeaderboard, 
    saveScore 
  } = useGameState();

  const {
    showLeaderboard,
    name,
    saved,
    canSave,
    toggleLeaderboard,
    setName,
    setSaved,
  } = useGameUI(state);

  // Load leaderboard when shown
  useEffect(() => {
    if (showLeaderboard) {
      getLeaderboard();
    }
  }, [showLeaderboard, getLeaderboard]);

  if (!state) {
    return <LoadingScreen />;
  }

  const handleSave = () => {
    const trimmed = name.trim();
    saveScore(trimmed);
    setSaved(true);
    if (showLeaderboard) {
      getLeaderboard();
    }
  };

  return (
    <div className="wrap">
      <main className="card">
        <GameHeader
          state={state}
          onToggleLeaderboard={toggleLeaderboard}
          onReset={reset}
          showLeaderboard={showLeaderboard}
        />

        {state.gameOver && <GameOverBanner />}

        {state.gameOver && state.loseInfo && (
          <GameOverReason loseInfo={state.loseInfo} />
        )}

        {state.gameOver && (
          <SaveScoreForm
            name={name}
            onNameChange={setName}
            onSave={handleSave}
            canSave={canSave}
            saved={saved}
          />
        )}

        <GameBoard state={state} onCellClick={clickCell} />

        {showLeaderboard && <Leaderboard leaderboard={leaderboard} />}

        <GameFooter state={state} />
      </main>
    </div>
  );
}
