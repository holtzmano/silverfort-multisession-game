// server/src/services/RateLimitService.ts
import { RATE_LIMIT_CONFIG } from '../config/index.js';

export class RateLimitService {
  private static instance: RateLimitService;
  private readonly clientWindows = new Map<string, number[]>();

  private constructor() {}

  public static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  public isAllowed(clientId: string): boolean {
    const now = Date.now();
    const window = this.clientWindows.get(clientId) || [];
    
    // Remove old requests outside the window
    const validRequests = window.filter(time => now - time <= RATE_LIMIT_CONFIG.WINDOW_MS);
    
    // Check if under limit
    if (validRequests.length >= RATE_LIMIT_CONFIG.MAX_CLICKS) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.clientWindows.set(clientId, validRequests);
    
    return true;
  }

  public recordRequest(clientId: string): void {
    const now = Date.now();
    const window = this.clientWindows.get(clientId) || [];
    window.push(now);
    this.clientWindows.set(clientId, window);
  }

  public cleanup(): void {
    const now = Date.now();
    for (const [clientId, window] of this.clientWindows.entries()) {
      const validRequests = window.filter(time => now - time <= RATE_LIMIT_CONFIG.WINDOW_MS);
      if (validRequests.length === 0) {
        this.clientWindows.delete(clientId);
      } else {
        this.clientWindows.set(clientId, validRequests);
      }
    }
  }

  public removeClient(clientId: string): void {
    this.clientWindows.delete(clientId);
  }
}
