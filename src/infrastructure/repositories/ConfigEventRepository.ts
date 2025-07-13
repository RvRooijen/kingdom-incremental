import { IEventRepository, ChainChoice } from '../../application/interfaces/IEventRepository';
import { EventDto, EventChoiceDto } from '../../application/dtos/EventDto';
import { ConfigService } from '../../application/services/ConfigService';
import { EventConfig, EventChoiceConfig } from '../../domain/entities/GameConfig';

interface StoredEventState {
  kingdomsProcessed: Set<string>;
  activeForKingdoms: Set<string>;
}

interface ChainProgress {
  chainId: string;
  kingdomId: string;
  choices: ChainChoice[];
  completedEventIds: Set<string>;
}

/**
 * Event repository that loads events from GameConfig
 * and tracks state in memory
 */
export class ConfigEventRepository implements IEventRepository {
  private configService: ConfigService;
  private eventStates: Map<string, StoredEventState> = new Map();
  private chainProgress: Map<string, ChainProgress> = new Map();

  constructor() {
    this.configService = ConfigService.getInstance();
  }

  private async getEventFromConfig(eventId: string): Promise<EventDto | null> {
    const config = await this.configService.getConfig();
    const eventConfig = config.events.find(e => e.id === eventId);
    
    if (!eventConfig) {
      return null;
    }

    return this.mapConfigToDto(eventConfig);
  }

  private mapConfigToDto(eventConfig: EventConfig): EventDto {
    // Map event type to match EventDto type
    const typeMap: { [key: string]: EventDto['type'] } = {
      'political': 'Political',
      'economic': 'Economic',
      'military': 'Military',
      'social': 'Social',
      'diplomatic': 'Diplomatic',
      'faction': 'Political' // Map faction to Political
    };

    const dto: EventDto = {
      id: eventConfig.id,
      title: eventConfig.title,
      description: eventConfig.description,
      type: typeMap[eventConfig.type] || 'Social',
      choices: eventConfig.choices.map(choice => {
        const requirements = this.mapChoiceRequirements(choice);
        const choiceDto: EventChoiceDto = {
          id: choice.id,
          description: choice.text // Map 'text' to 'description'
        };
        if (requirements) {
          choiceDto.requirements = requirements;
        }
        return choiceDto;
      }),
      expiresInTurns: 10 // Default expiration
    };
    
    return dto;
  }

  private mapChoiceRequirements(choice: EventChoiceConfig): EventChoiceDto['requirements'] | undefined {
    if (!choice.consequences.resources) {
      return undefined;
    }

    const requirements: EventChoiceDto['requirements'] = {};
    
    // Check if any resources are negative (costs)
    for (const [resource, amount] of Object.entries(choice.consequences.resources)) {
      if (amount < 0) {
        // Map resource types to DTO format
        switch (resource) {
          case 'GOLD':
            requirements.gold = Math.abs(amount);
            break;
          case 'INFLUENCE':
            requirements.influence = Math.abs(amount);
            break;
          case 'FAITH':
            requirements.loyalty = Math.abs(amount); // Map FAITH to loyalty
            break;
          case 'KNOWLEDGE':
            requirements.militaryPower = Math.abs(amount); // Map KNOWLEDGE to militaryPower
            break;
        }
      }
    }

    return Object.keys(requirements).length > 0 ? requirements : undefined;
  }

  async findActiveEvents(kingdomId: string): Promise<EventDto[]> {
    const config = await this.configService.getConfig();
    const activeEvents: EventDto[] = [];
    
    for (const eventConfig of config.events) {
      const state = this.getOrCreateState(eventConfig.id);
      
      if (state.activeForKingdoms.has(kingdomId) && 
          !state.kingdomsProcessed.has(kingdomId)) {
        activeEvents.push(this.mapConfigToDto(eventConfig));
      }
    }
    
    return activeEvents;
  }

  async findById(eventId: string): Promise<EventDto | null> {
    return this.getEventFromConfig(eventId);
  }

  async save(_event: EventDto): Promise<void> {
    // For config-based events, we don't save new events
    // This method is here for compatibility with dynamic events
    console.warn('ConfigEventRepository.save() called - events should be managed through GameConfig');
  }

  async markAsProcessed(eventId: string, kingdomId: string): Promise<void> {
    const state = this.getOrCreateState(eventId);
    state.kingdomsProcessed.add(kingdomId);
    state.activeForKingdoms.delete(kingdomId);
  }

  async activateForKingdom(eventId: string, kingdomId: string): Promise<void> {
    const state = this.getOrCreateState(eventId);
    state.activeForKingdoms.add(kingdomId);
  }

  private getOrCreateState(eventId: string): StoredEventState {
    if (!this.eventStates.has(eventId)) {
      this.eventStates.set(eventId, {
        kingdomsProcessed: new Set(),
        activeForKingdoms: new Set()
      });
    }
    return this.eventStates.get(eventId)!;
  }

  // Chain-specific methods (minimal implementation for config events)
  async findByChainId(_chainId: string): Promise<EventDto[]> {
    // Config events don't support chains by default
    return [];
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

  async isChainComplete(_kingdomId: string, _chainId: string): Promise<boolean> {
    // Config events don't support chains by default
    return false;
  }

  async getNextEventInChain(
    _kingdomId: string, 
    _currentEventId: string
  ): Promise<EventDto | null> {
    // Config events don't support chains by default
    return null;
  }

  clear(): void {
    this.eventStates.clear();
    this.chainProgress.clear();
  }

  /**
   * Randomly activate events for a kingdom based on weight and requirements
   */
  async activateRandomEvents(kingdomId: string, kingdom: any, maxEvents: number = 3): Promise<void> {
    const config = await this.configService.getConfig();
    const eligibleEvents: EventConfig[] = [];
    
    // Filter events that meet requirements and haven't been processed
    for (const eventConfig of config.events) {
      const state = this.getOrCreateState(eventConfig.id);
      
      if (state.kingdomsProcessed.has(kingdomId)) {
        continue; // Skip already processed events
      }
      
      if (state.activeForKingdoms.has(kingdomId)) {
        continue; // Skip already active events
      }
      
      // Check requirements
      if (eventConfig.requirements) {
        let meetsRequirements = true;
        
        // Check resource requirements
        if (eventConfig.requirements.minResources) {
          for (const [resource, amount] of eventConfig.requirements.minResources) {
            if (kingdom.getResource(resource) < amount) {
              meetsRequirements = false;
              break;
            }
          }
        }
        
        // Check prestige requirements
        if (eventConfig.requirements.minPrestigeLevel && 
            kingdom.prestigeLevel < eventConfig.requirements.minPrestigeLevel) {
          meetsRequirements = false;
        }
        
        // Check faction requirements
        if (eventConfig.requirements.minFactionInfluence) {
          for (const [faction, influence] of eventConfig.requirements.minFactionInfluence) {
            const factionEntity = kingdom.factions.get(faction);
            if (!factionEntity || factionEntity.approvalRating < influence) {
              meetsRequirements = false;
              break;
            }
          }
        }
        
        if (!meetsRequirements) {
          continue;
        }
      }
      
      eligibleEvents.push(eventConfig);
    }
    
    // Randomly select events based on weight
    const selectedEvents: EventConfig[] = [];
    const totalWeight = eligibleEvents.reduce((sum, e) => sum + (e.weight || 1), 0);
    
    while (selectedEvents.length < maxEvents && eligibleEvents.length > 0) {
      let random = Math.random() * totalWeight;
      
      for (let i = 0; i < eligibleEvents.length; i++) {
        const event = eligibleEvents[i];
        if (event) {
          random -= (event.weight || 1);
          
          if (random <= 0) {
            selectedEvents.push(event);
            eligibleEvents.splice(i, 1);
            await this.activateForKingdom(event.id, kingdomId);
            break;
          }
        }
      }
    }
  }
}