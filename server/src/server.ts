// server/src/server.ts
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameHandler } from './handlers/GameHandler.js';
import { SERVER_CONFIG } from './config/index.js';
import pkg from '../package.json' with { type: 'json' };

const startedAt = Date.now();

export class GameServer {
  private app: express.Application;
  private httpServer: any;
  private io: Server;
  private gameHandler: GameHandler;

  constructor() {
    this.app = express();
    this.setupExpress();
    this.httpServer = createServer(this.app);
    this.setupSocketIO();
    this.gameHandler = new GameHandler();
    this.setupGameHandler();
  }

  private setupExpress(): void {
    this.app.use(cors({ 
      origin: SERVER_CONFIG.CLIENT_ORIGINS, 
      credentials: true 
    }));
    this.app.use(express.json());

    // Health endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'ok',
        version: (pkg as any).version,
        uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
      });
    });
  }

  private setupSocketIO(): void {
    this.io = new Server(this.httpServer, {
      cors: { 
        origin: SERVER_CONFIG.CLIENT_ORIGINS, 
        methods: ['GET', 'POST'] 
      },
    });
  }

  private setupGameHandler(): void {
    // Inject broadcast function
    this.gameHandler.broadcastStateChange = (state) => {
      this.io.emit('state', state);
    };

    // Handle connections
    this.io.on('connection', (socket) => {
      this.gameHandler.handleConnection(socket);
    });
  }

  public start(): void {
    this.httpServer.listen(SERVER_CONFIG.PORT, () => {
      console.log(`✅ Server listening on http://localhost:${SERVER_CONFIG.PORT}`);
    });
  }

  public getIO(): Server {
    return this.io;
  }

  public getApp(): express.Application {
    return this.app;
  }
}
