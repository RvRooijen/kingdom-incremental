import { EventDto } from '../dtos/EventDto';
import { IEventRepository } from '../interfaces/IEventRepository';

export class GetActiveEventsQuery {
  constructor(
    private readonly eventRepository: IEventRepository
  ) {}

  async execute(kingdomId: string): Promise<EventDto[]> {
    if (!kingdomId) {
      throw new Error('Kingdom ID is required');
    }

    const events = await this.eventRepository.findActiveEvents(kingdomId);
    
    // Sort by expiration (most urgent first)
    return events.sort((a, b) => a.expiresInTurns - b.expiresInTurns);
  }
}