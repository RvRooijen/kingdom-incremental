import { KingdomStateDto } from '../dtos/KingdomStateDto';
import { IKingdomRepository } from '../interfaces/IKingdomRepository';

export class GetKingdomStateQuery {
  constructor(
    private readonly kingdomRepository: IKingdomRepository
  ) {}

  async execute(kingdomId: string): Promise<KingdomStateDto | null> {
    if (!kingdomId) {
      throw new Error('Kingdom ID is required');
    }

    const kingdom = await this.kingdomRepository.findById(kingdomId);
    if (!kingdom) {
      return null;
    }

    // Map domain entities to DTOs
    return {
      kingdomId: kingdom.id,
      kingdomName: kingdom.name,
      rulerName: kingdom.court.king.name,
      resources: {
        gold: kingdom.resources.gold,
        influence: kingdom.resources.influence,
        loyalty: kingdom.resources.loyalty,
        population: kingdom.resources.population,
        militaryPower: kingdom.resources.militaryPower
      },
      advisors: Array.from(kingdom.court.advisors.entries()).map(([id, advisor]: [string, any]) => ({
        id,
        name: advisor.name || 'Unknown',
        specialty: advisor.specialty || 'Unknown',
        effectiveness: advisor.effectiveness || 0
      })),
      factions: Array.from(kingdom.factions.values()).map(faction => ({
        name: faction.name,
        description: faction.type,
        loyalty: faction.approvalRating,
        influence: faction.approvalRating // Using approval rating as a proxy for influence
      })),
      currentTurn: 1 // This would come from a game state service in a real implementation
    };
  }
}