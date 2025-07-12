import { IEventRepository, ChainChoice } from '../../application/interfaces/IEventRepository';
import { EventDto } from '../../application/dtos/EventDto';

interface StoredEvent {
  event: EventDto;
  kingdomsProcessed: Set<string>;
  activeForKingdoms: Set<string>;
}

interface ChainProgress {
  chainId: string;
  kingdomId: string;
  choices: ChainChoice[];
  completedEventIds: Set<string>;
}

export class InMemoryEventRepository implements IEventRepository {
  private events: Map<string, StoredEvent> = new Map();
  private chainProgress: Map<string, ChainProgress> = new Map();
  private eventsByChain: Map<string, Set<string>> = new Map();

  async findActiveEvents(kingdomId: string): Promise<EventDto[]> {
    const activeEvents: EventDto[] = [];
    
    for (const storedEvent of this.events.values()) {
      if (storedEvent.activeForKingdoms.has(kingdomId) && 
          !storedEvent.kingdomsProcessed.has(kingdomId)) {
        activeEvents.push(storedEvent.event);
      }
    }
    
    return activeEvents;
  }

  async findById(eventId: string): Promise<EventDto | null> {
    const stored = this.events.get(eventId);
    return stored ? stored.event : null;
  }

  async save(event: EventDto): Promise<void> {
    const existingStored = this.events.get(event.id);
    
    const stored: StoredEvent = {
      event,
      kingdomsProcessed: existingStored?.kingdomsProcessed || new Set(),
      activeForKingdoms: existingStored?.activeForKingdoms || new Set()
    };
    
    this.events.set(event.id, stored);
    
    // Track events by chain
    if (event.chainData) {
      if (!this.eventsByChain.has(event.chainData.chainId)) {
        this.eventsByChain.set(event.chainData.chainId, new Set());
      }
      this.eventsByChain.get(event.chainData.chainId)!.add(event.id);
    }
  }

  async markAsProcessed(eventId: string, kingdomId: string): Promise<void> {
    const stored = this.events.get(eventId);
    if (stored) {
      stored.kingdomsProcessed.add(kingdomId);
      stored.activeForKingdoms.delete(kingdomId);
    }
  }

  async activateForKingdom(eventId: string, kingdomId: string): Promise<void> {
    const stored = this.events.get(eventId);
    if (stored) {
      stored.activeForKingdoms.add(kingdomId);
    }
  }

  // Chain-specific methods
  async findByChainId(chainId: string): Promise<EventDto[]> {
    const eventIds = this.eventsByChain.get(chainId) || new Set();
    const events: EventDto[] = [];
    
    for (const eventId of eventIds) {
      const event = await this.findById(eventId);
      if (event) {
        events.push(event);
      }
    }
    
    // Sort by chain position
    return events.sort((a, b) => 
      (a.chainData?.chainPosition || 0) - (b.chainData?.chainPosition || 0)
    );
  }

  async saveChainChoice(kingdomId: string, chainId: string, choice: ChainChoice): Promise<void> {
    const key = `${chainId}:${kingdomId}`;
    let progress = this.chainProgress.get(key);
    
    if (!progress) {
      progress = {
        chainId,
        kingdomId,
        choices: [],
        completedEventIds: new Set()
      };
      this.chainProgress.set(key, progress);
    }
    
    progress.choices.push(choice);
    progress.completedEventIds.add(choice.eventId);
  }

  async getChainChoices(kingdomId: string, chainId: string): Promise<ChainChoice[]> {
    const key = `${chainId}:${kingdomId}`;
    const progress = this.chainProgress.get(key);
    return progress ? [...progress.choices] : [];
  }

  async isChainComplete(kingdomId: string, chainId: string): Promise<boolean> {
    const key = `${chainId}:${kingdomId}`;
    const progress = this.chainProgress.get(key);
    
    if (!progress) {
      return false;
    }
    
    const chainEvents = await this.findByChainId(chainId);
    const lastEvent = chainEvents[chainEvents.length - 1];
    
    return lastEvent ? progress.completedEventIds.has(lastEvent.id) : false;
  }

  // Helper method to get next event in chain
  async getNextEventInChain(
    kingdomId: string, 
    currentEventId: string
  ): Promise<EventDto | null> {
    const currentEvent = await this.findById(currentEventId);
    if (!currentEvent?.chainData?.nextEventId) {
      return null;
    }
    
    const nextEvent = await this.findById(currentEvent.chainData.nextEventId);
    if (!nextEvent) {
      return null;
    }
    
    // Check if previous event was completed
    const key = `${currentEvent.chainData.chainId}:${kingdomId}`;
    const progress = this.chainProgress.get(key);
    
    if (progress?.completedEventIds.has(currentEventId)) {
      return nextEvent;
    }
    
    return null;
  }

  // Clear all data (useful for testing)
  clear(): void {
    this.events.clear();
    this.chainProgress.clear();
    this.eventsByChain.clear();
  }
}