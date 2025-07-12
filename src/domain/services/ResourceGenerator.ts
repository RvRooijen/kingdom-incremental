import { Kingdom } from '../entities/Kingdom';
import { ResourceType } from '../value-objects/ResourceType';
import { CharacterType } from '../value-objects/CharacterType';
import { AdvisorType } from '../value-objects/AdvisorType';
import { Resources } from '../value-objects/Resources';

export class ResourceGenerator {
  private static readonly RESOURCE_LIMITS = new Map<ResourceType, number>([
    [ResourceType.GOLD, 10000],
    [ResourceType.INFLUENCE, 10000],
    [ResourceType.FAITH, 10000],
    [ResourceType.KNOWLEDGE, 10000],
  ]);

  private static readonly CHARACTER_GENERATION = new Map<CharacterType, Map<ResourceType, number>>([
    [CharacterType.KING, new Map([[ResourceType.GOLD, 1]])],
    [CharacterType.QUEEN, new Map([[ResourceType.INFLUENCE, 1]])],
  ]);

  private static readonly ADVISOR_BONUSES = new Map<AdvisorType, { resource: ResourceType; bonus: number }>([
    [AdvisorType.TREASURER, { resource: ResourceType.GOLD, bonus: 0.5 }],
  ]);

  calculateGenerationRates(kingdom: Kingdom): Map<ResourceType, number> {
    const rates = new Map<ResourceType, number>([
      [ResourceType.GOLD, 0],
      [ResourceType.INFLUENCE, 0],
      [ResourceType.FAITH, 0],
      [ResourceType.KNOWLEDGE, 0],
    ]);

    // Calculate base generation from characters
    const characters = kingdom.getCharacters();
    for (const character of characters) {
      const generation = ResourceGenerator.CHARACTER_GENERATION.get(character.type);
      if (generation) {
        for (const [resource, amount] of generation) {
          rates.set(resource, (rates.get(resource) || 0) + amount);
        }
      }
    }

    // Apply advisor bonuses
    const advisors = kingdom.getAdvisors();
    for (const advisor of advisors) {
      const bonus = ResourceGenerator.ADVISOR_BONUSES.get(advisor.type);
      if (bonus) {
        const currentRate = rates.get(bonus.resource) || 0;
        rates.set(bonus.resource, currentRate * (1 + bonus.bonus));
      }
    }

    // Apply prestige bonus to all resources
    const prestigeBonuses = kingdom.getPrestigeBonuses();
    for (const [resource, rate] of rates) {
      rates.set(resource, rate * prestigeBonuses.resourceMultiplier);
    }

    return rates;
  }

  calculateOfflineProgress(kingdom: Kingdom, seconds: number): Map<ResourceType, number> {
    const rates = this.calculateGenerationRates(kingdom);
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
  generateResources(kingdom: Kingdom, timeElapsedSeconds: number): Resources {
    const rates = this.calculateGenerationRates(kingdom);
    
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