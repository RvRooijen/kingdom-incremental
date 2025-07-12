import { EventDto } from '../dtos/EventDto';

export interface IEventRepository {
  findActiveEvents(kingdomId: string): Promise<EventDto[]>;
  findById(eventId: string): Promise<EventDto | null>;
  save(event: EventDto): Promise<void>;
  markAsProcessed(eventId: string, kingdomId: string): Promise<void>;
}