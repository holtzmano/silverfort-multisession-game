// server/scripts/smokeClient.ts
import { io } from 'socket.io-client';


const socket = io('http://localhost:4000');

socket.on('connect', () => {
  console.log('🧪 Connected as', socket.id);
  // After receiving the first state, click (0,0)
  setTimeout(() => {
    console.log('🧪 Emitting click (0,0)');
    socket.emit('click', { r: 0, c: 0 });
  }, 500);
});

socket.on('state', (state) => {
  console.log('🧪 State update:', {
    score: state.score,
    turn: state.turn,
    gameOver: state.gameOver,
    cell00: state.board?.[0]?.[0],
  });
});

socket.on('disconnect', (reason) => {
  console.log('🧪 Disconnected:', reason);
});
