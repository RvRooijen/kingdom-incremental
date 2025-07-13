import { GameConfig } from '../../domain/entities/GameConfig';
import { 
  IGameConfigRepository, 
  VercelKVGameConfigRepository, 
  InMemoryGameConfigRepository 
} from '../../infrastructure/repositories/GameConfigRepository';

export class ConfigService {
  private static instance: ConfigService;
  private configRepository: IGameConfigRepository;
  private cachedConfig: GameConfig | null = null;
  private lastFetch: number = 0;
  private readonly cacheDuration = 60000; // 1 minute cache

  private constructor() {
    const useVercelKV = process.env['KV_REST_API_URL'] && process.env['NODE_ENV'] === 'production';
    this.configRepository = useVercelKV 
      ? new VercelKVGameConfigRepository()
      : new InMemoryGameConfigRepository();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public async getConfig(): Promise<GameConfig> {
    const now = Date.now();
    
    // Return cached config if it's still fresh
    if (this.cachedConfig && (now - this.lastFetch) < this.cacheDuration) {
      return this.cachedConfig;
    }

    // Fetch fresh config
    this.cachedConfig = await this.configRepository.getConfig();
    this.lastFetch = now;
    
    return this.cachedConfig;
  }

  public async updateConfig(config: GameConfig): Promise<void> {
    await this.configRepository.saveConfig(config);
    this.cachedConfig = config;
    this.lastFetch = Date.now();
  }

  public clearCache(): void {
    this.cachedConfig = null;
    this.lastFetch = 0;
  }
}