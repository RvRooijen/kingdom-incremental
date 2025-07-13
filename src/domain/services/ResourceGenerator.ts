import { Kingdom } from '../entities/Kingdom';
import { ResourceType } from '../value-objects/ResourceType';
import { Resources } from '../value-objects/Resources';
import { GameConfig } from '../entities/GameConfig';
import { ConfigService } from '../../application/services/ConfigService';

export class ResourceGenerator {
  private static readonly RESOURCE_LIMITS = new Map<ResourceType, number>([
    [ResourceType.GOLD, 10000],
    [ResourceType.INFLUENCE, 10000],
    [ResourceType.FAITH, 10000],
    [ResourceType.KNOWLEDGE, 10000],
  ]);


  private configService: ConfigService;
  private config: GameConfig | null = null;

  constructor() {
    this.configService = ConfigService.getInstance();
  }

  private async getConfig(): Promise<GameConfig> {
    if (!this.config) {
      this.config = await this.configService.getConfig();
    }
    return this.config;
  }

  async calculateGenerationRates(kingdom: Kingdom): Promise<Map<ResourceType, number>> {
    const config = await this.getConfig();
    const rates = new Map<ResourceType, number>();

    // Initialize rates from config
    for (const [resourceType, resourceConfig] of config.resources) {
      rates.set(resourceType, resourceConfig.baseGenerationRate);
    }

    // Apply advisor bonuses from config
    const advisors = kingdom.getAdvisors();
    for (const advisor of advisors) {
      const advisorConfig = config.advisors.get(advisor.type);
      if (advisorConfig) {
        // Apply bonus to all resources based on advisor type
        for (const [resourceType, currentRate] of rates) {
          const resourceConfig = config.resources.get(resourceType);
          if (resourceConfig) {
            rates.set(resourceType, currentRate * advisorConfig.effectMultiplier);
          }
        }
      }
    }

    // Apply prestige bonus to all resources
    const prestigeBonuses = kingdom.getPrestigeBonuses();
    for (const [resource, rate] of rates) {
      const resourceConfig = config.resources.get(resource);
      if (resourceConfig) {
        rates.set(resource, rate * prestigeBonuses.resourceMultiplier * resourceConfig.prestigeMultiplier);
      }
    }

    // Apply faction bonuses
    for (const faction of config.factions) {
      const factionEntity = kingdom.factions.get(faction.name);
      if (factionEntity && factionEntity.approvalRating > 50) {
        const factionBonus = (factionEntity.approvalRating - 50) / 100; // 0 to 0.5 bonus
        for (const bonus of faction.bonuses) {
          const currentRate = rates.get(bonus.resourceType) || 0;
          rates.set(bonus.resourceType, currentRate * (1 + factionBonus * (bonus.multiplier - 1)));
        }
      }
    }

    return rates;
  }

  async calculateOfflineProgress(kingdom: Kingdom, seconds: number): Promise<Map<ResourceType, number>> {
    const rates = await this.calculateGenerationRates(kingdom);
    const progress = new Map<ResourceType, number>();

    for (const [resource, rate] of rates) {
      const currentAmount = kingdom.getResource(resource);
      const limit = ResourceGenerator.RESOURCE_LIMITS.get(resource) || 0;
      const maxGeneration = Math.max(0, limit - currentAmount);
      const theoreticalGeneration = rate * seconds;
      
      progress.set(resource, Math.min(theoreticalGeneration, maxGeneration));
    }

    return progress;
  }

  // Legacy method for compatibility with existing code
  async generateResources(kingdom: Kingdom, timeElapsedSeconds: number): Promise<Resources> {
    const rates = await this.calculateGenerationRates(kingdom);
    
    const goldGeneration = (rates.get(ResourceType.GOLD) || 0) * timeElapsedSeconds;
    const influenceGeneration = (rates.get(ResourceType.INFLUENCE) || 0) * timeElapsedSeconds;
    
    // Return in the old Resources format
    return new Resources(
      goldGeneration,
      influenceGeneration,
      0, // loyalty
      0, // population
      0  // militaryPower
    );
  }
}