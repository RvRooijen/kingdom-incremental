import { kv } from '@vercel/kv';
import { GameConfig } from '../../domain/entities/GameConfig';

export interface IGameConfigRepository {
  getConfig(): Promise<GameConfig>;
  saveConfig(config: GameConfig): Promise<void>;
}

export class VercelKVGameConfigRepository implements IGameConfigRepository {
  private readonly configKey = 'game_config';

  async getConfig(): Promise<GameConfig> {
    try {
      const stored = await kv.get(this.configKey);
      if (stored) {
        return GameConfig.fromJSON(stored);
      }
    } catch (error) {
      console.error('Error loading game config from Vercel KV:', error);
    }
    
    // Return default config if not found or error
    return new GameConfig();
  }

  async saveConfig(config: GameConfig): Promise<void> {
    await kv.set(this.configKey, config.toJSON());
  }
}

export class InMemoryGameConfigRepository implements IGameConfigRepository {
  private config: GameConfig = new GameConfig();

  async getConfig(): Promise<GameConfig> {
    return this.config;
  }

  async saveConfig(config: GameConfig): Promise<void> {
    this.config = config;
  }
}