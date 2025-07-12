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

    // Map domain entities to match frontend expectations
    const kingdomData: any = {
      id: kingdom.id,
      name: kingdom.name,
      resources: {
        gold: kingdom.resources.gold,
        influence: kingdom.resources.influence,
        loyalty: kingdom.resources.loyalty,
        population: kingdom.resources.population,
        militaryPower: kingdom.resources.militaryPower
      },
      court: {
        king: {
          name: kingdom.court.king.name,
          title: kingdom.court.king.title
        },
        queen: {
          name: kingdom.court.queen.name,
          title: kingdom.court.queen.title
        },
        advisors: kingdom.court.advisors instanceof Array 
          ? kingdom.court.advisors 
          : Array.from(kingdom.court.advisors.values())
      },
      factions: Array.from(kingdom.factions.values()).map(faction => ({
        type: faction.type,
        name: faction.name,
        approvalRating: faction.approvalRating,
        mood: faction.mood
      })),
      prestigeLevel: kingdom.prestigeLevel || 0,
      completedEventsCount: kingdom.completedEventsCount || 0,
      generationRates: {
        gold: 1,
        influence: 1,
        faith: 0,
        knowledge: 0
      }
    };

    return kingdomData;
  }
}