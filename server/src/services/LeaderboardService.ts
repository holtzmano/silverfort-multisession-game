// server/src/services/LeaderboardService.ts
import { readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LeaderboardEntry } from '../types/index.js';
import { LEADERBOARD_CONFIG } from '../config/index.js';

export class LeaderboardService {
  private static instance: LeaderboardService;
  private leaderboard: LeaderboardEntry[] = [];
  private readonly leaderboardPath: URL;

  private constructor() {
    this.leaderboardPath = new URL('../leaderboard.json', import.meta.url);
    this.loadLeaderboard();
  }

  public static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  public getLeaderboard(): LeaderboardEntry[] {
    return [...this.leaderboard];
  }

  public async saveScore(name: string, score: number): Promise<LeaderboardEntry[]> {
    const processedName = this.processName(name);
    const entry: LeaderboardEntry = {
      name: processedName,
      score,
      when: Date.now(),
    };

    this.leaderboard.push(entry);
    this.leaderboard.sort((a, b) => b.score - a.score || a.when - b.when);
    this.leaderboard = this.leaderboard.slice(0, LEADERBOARD_CONFIG.MAX_ENTRIES);

    await this.persistLeaderboard();
    return this.getLeaderboard();
  }

  private processName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return LEADERBOARD_CONFIG.DEFAULT_NAME;
    }
    return trimmed.slice(0, LEADERBOARD_CONFIG.MAX_NAME_LENGTH);
  }

  private async loadLeaderboard(): Promise<void> {
    try {
      const raw = await readFile(this.leaderboardPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.leaderboard = parsed.slice(0, LEADERBOARD_CONFIG.MAX_ENTRIES);
      }
    } catch (error) {
      // File missing on first run: ignore
      console.log('No existing leaderboard file found, starting fresh');
    }
  }

  private async persistLeaderboard(): Promise<void> {
    try {
      await this.atomicWrite(this.leaderboard);
    } catch (error) {
      console.error('Failed to persist leaderboard:', error);
      // Don't throw - this is not critical for game functionality
    }
  }

  private async atomicWrite(data: unknown): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    const finalPath = this.leaderboardPath;
    const dir = dirname(fileURLToPath(finalPath));
    const tmpPath = new URL(
      `leaderboard.tmp-${Date.now()}.json`, 
      new URL(dir + '/', import.meta.url)
    );
    
    await writeFile(tmpPath, json, 'utf8');
    await rename(tmpPath, finalPath); // Atomic on most filesystems
  }
}
