import { EventDto } from '../dtos/EventDto';

export interface ChainChoice {
  eventId: string;
  choiceId: string;
  timestamp: Date;
}

export interface IEventRepository {
  findActiveEvents(kingdomId: string): Promise<EventDto[]>;
  findById(eventId: string): Promise<EventDto | null>;
  save(event: EventDto): Promise<void>;
  markAsProcessed(eventId: string, kingdomId: string): Promise<void>;
  
  // Chain-specific methods
  findByChainId(chainId: string): Promise<EventDto[]>;
  saveChainChoice(kingdomId: string, chainId: string, choice: ChainChoice): Promise<void>;
  getChainChoices(kingdomId: string, chainId: string): Promise<ChainChoice[]>;
  isChainComplete(kingdomId: string, chainId: string): Promise<boolean>;
}