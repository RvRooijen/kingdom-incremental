import { FactionDto } from '../dtos/KingdomStateDto';
import { IKingdomRepository } from '../interfaces/IKingdomRepository';

export interface FactionStatusDto extends FactionDto {
  mood: string;
  type: string;
}

export class GetFactionStatusQuery {
  constructor(
    private readonly kingdomRepository: IKingdomRepository
  ) {}

  async execute(kingdomId: string): Promise<FactionStatusDto[]> {
    if (!kingdomId) {
      throw new Error('Kingdom ID is required');
    }

    const kingdom = await this.kingdomRepository.findById(kingdomId);
    if (!kingdom) {
      throw new Error('Kingdom not found');
    }

    return Array.from(kingdom.factions.values()).map(faction => ({
      name: faction.name,
      description: faction.type,
      loyalty: faction.approvalRating,
      influence: faction.approvalRating,
      mood: faction.mood,
      type: faction.type
    }));
  }
}