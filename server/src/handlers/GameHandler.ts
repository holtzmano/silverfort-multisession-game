// server/src/handlers/GameHandler.ts
import { Socket } from 'socket.io';
import { GameService } from '../services/GameService.js';
import { LeaderboardService } from '../services/LeaderboardService.js';
import { RateLimitService } from '../services/RateLimitService.js';
import type { ClickPayload, SaveScorePayload, SocketEvents } from '../types/index.js';

export class GameHandler {
  private gameService: GameService;
  private leaderboardService: LeaderboardService;
  private rateLimitService: RateLimitService;

  constructor() {
    this.gameService = GameService.getInstance();
    this.leaderboardService = LeaderboardService.getInstance();
    this.rateLimitService = RateLimitService.getInstance();
  }

  public handleConnection(socket: Socket<SocketEvents>): void {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Send current state immediately
    socket.emit('state', this.gameService.getState());

    // Set up event handlers
    this.setupEventHandlers(socket);

    // Clean up on disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
      this.rateLimitService.removeClient(socket.id);
    });
  }

  private setupEventHandlers(socket: Socket<SocketEvents>): void {
    socket.on('getLeaderboard', () => {
      socket.emit('leaderboard', this.leaderboardService.getLeaderboard());
    });

    socket.on('saveScore', async (payload: SaveScorePayload) => {
      try {
        const gameState = this.gameService.getState();
        if (!gameState.gameOver) {
          console.warn(`⚠️ saveScore called before game over by ${socket.id}`);
          return;
        }

        const updatedLeaderboard = await this.leaderboardService.saveScore(
          payload.name, 
          gameState.score
        );
        
        socket.emit('leaderboard', updatedLeaderboard);
        console.log(`🏆 Saved score: ${payload.name} = ${gameState.score}`);
      } catch (error) {
        console.error('Error saving score:', error);
        socket.emit('errorEvent', 'Failed to save score');
      }
    });

    socket.on('click', (payload: ClickPayload) => {
      try {
        // Rate limiting
        if (!this.rateLimitService.isAllowed(socket.id)) {
          console.log(`🚫 Rate limited: ${socket.id}`);
          return;
        }

        // Validate payload
        if (!this.isValidClickPayload(payload)) {
          console.warn(`⚠️ Invalid click payload from ${socket.id}:`, payload);
          return;
        }

        // Apply move
        const beforeState = this.gameService.getState();
        const afterState = this.gameService.applyMove(payload.r, payload.c);
        
        // Check if state changed
        if (this.hasStateChanged(beforeState, afterState)) {
          // Broadcast to all clients (this would need to be injected)
          this.broadcastStateChange?.(afterState);
          console.log(
            `✅ Move applied at (${payload.r},${payload.c}) | ` +
            `score=${afterState.score}, turn=${afterState.turn}, gameOver=${afterState.gameOver}`
          );
        } else {
          console.log(`ℹ️ No-op move at (${payload.r},${payload.c}) (cooldown/gameOver/invalid)`);
        }
      } catch (error) {
        console.error('Error handling click:', error);
        socket.emit('errorEvent', 'Failed to process move');
      }
    });

    socket.on('reset', () => {
      try {
        const newState = this.gameService.reset();
        this.broadcastStateChange?.(newState);
        console.log(`🔄 Game reset by ${socket.id}`);
      } catch (error) {
        console.error('Error resetting game:', error);
        socket.emit('errorEvent', 'Failed to reset game');
      }
    });
  }

  private isValidClickPayload(payload: any): payload is ClickPayload {
    return (
      payload &&
      typeof payload.r === 'number' &&
      typeof payload.c === 'number' &&
      payload.r >= 0 && payload.r < 3 &&
      payload.c >= 0 && payload.c < 6
    );
  }

  private hasStateChanged(before: any, after: any): boolean {
    return (
      after !== before ||
      after.score !== before.score ||
      after.turn !== before.turn ||
      after.gameOver !== before.gameOver
    );
  }

  // This will be injected by the main server
  public broadcastStateChange?: (state: any) => void;
}
