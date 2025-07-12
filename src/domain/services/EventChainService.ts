import { Event, EventChoice, EventConsequence } from '../events/Event';
import { Resources } from '../value-objects/Resources';

export interface ChainContext {
  chainId: string;
  previousChoices: { eventId: string; choiceId: string }[];
  currentPosition: number;
}

export interface ChainCompletionReward {
  resources: Resources;
  title: string;
  description: string;
  unlocks?: string[];
}

export class EventChainService {
  private chainRewards: Map<string, Map<string, ChainCompletionReward>>;
  
  constructor() {
    this.chainRewards = new Map();
    this.initializeChainRewards();
  }

  private initializeChainRewards(): void {
    // The Noble Rebellion rewards
    const nobleRewards = new Map<string, ChainCompletionReward>();
    nobleRewards.set('path_peaceful', {
      resources: new Resources({
        gold: 500,
        influence: 200,
        loyalty: 100,
        population: 50,
        militaryPower: 0
      }),
      title: 'Diplomatic Victory',
      description: 'Your peaceful resolution of the noble rebellion has earned you great respect.',
      unlocks: ['diplomatic_advisor_upgrade']
    });
    
    nobleRewards.set('path_force', {
      resources: new Resources({
        gold: 200,
        influence: 0,
        loyalty: -50,
        population: -100,
        militaryPower: 150
      }),
      title: 'Iron Fist Victory',
      description: 'You crushed the rebellion with force, establishing your dominance.',
      unlocks: ['military_advisor_upgrade']
    });
    
    this.chainRewards.set('noble_rebellion', nobleRewards);

    // Merchant Guild Expansion rewards
    const merchantRewards = new Map<string, ChainCompletionReward>();
    merchantRewards.set('path_cooperation', {
      resources: new Resources({
        gold: 1000,
        influence: 150,
        loyalty: 50,
        population: 200,
        militaryPower: 0
      }),
      title: 'Economic Alliance',
      description: 'Your cooperation with the merchant guild has created a thriving economy.',
      unlocks: ['trade_routes', 'merchant_quarter']
    });
    
    merchantRewards.set('path_control', {
      resources: new Resources({
        gold: 500,
        influence: 100,
        loyalty: 0,
        population: 100,
        militaryPower: 50
      }),
      title: 'Royal Monopoly',
      description: 'You have established royal control over all major trade.',
      unlocks: ['royal_market']
    });
    
    this.chainRewards.set('merchant_expansion', merchantRewards);

    // Religious Awakening rewards
    const religiousRewards = new Map<string, ChainCompletionReward>();
    religiousRewards.set('path_embrace', {
      resources: new Resources({
        gold: 300,
        influence: 300,
        loyalty: 200,
        population: 150,
        militaryPower: 0
      }),
      title: 'Divine Blessing',
      description: 'Your embrace of the religious movement has united the kingdom in faith.',
      unlocks: ['grand_cathedral', 'religious_advisor']
    });
    
    religiousRewards.set('path_secular', {
      resources: new Resources({
        gold: 600,
        influence: 50,
        loyalty: -25,
        population: 50,
        militaryPower: 100
      }),
      title: 'Enlightened Rule',
      description: 'Your secular approach has modernized the kingdom.',
      unlocks: ['university', 'science_advisor']
    });
    
    this.chainRewards.set('religious_awakening', religiousRewards);
  }

  createEventChain(events: Event[]): void {
    if (events.length < 2) {
      throw new Error('Event chain must contain at least 2 events');
    }

    const chainId = this.generateChainId();
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const chainData = {
        chainId,
        chainPosition: i + 1,
        chainLength: events.length,
        previousEventId: i > 0 ? events[i - 1].id : undefined,
        nextEventId: i < events.length - 1 ? events[i + 1].id : undefined
      };

      // Update event with chain data
      Object.assign(event, chainData);
    }
  }

  getNextInChain(currentEvent: Event): string | undefined {
    if (!currentEvent.isPartOfChain()) {
      return undefined;
    }
    return currentEvent.nextEventId;
  }

  processChainChoice(
    event: Event,
    choice: EventChoice,
    context: ChainContext
  ): { nextEventId?: string; modifiers?: Map<string, any> } {
    if (!event.isPartOfChain()) {
      return {};
    }

    // Store the choice in context
    context.previousChoices.push({
      eventId: event.id,
      choiceId: choice.id
    });

    const result: { nextEventId?: string; modifiers?: Map<string, any> } = {
      nextEventId: event.nextEventId
    };

    // Apply choice modifiers for next event
    if (choice.chainData?.nextEventModifier) {
      result.modifiers = new Map();
      result.modifiers.set('choiceModifier', choice.chainData.nextEventModifier);
    }

    return result;
  }

  getChainCompletionReward(
    chainId: string,
    context: ChainContext
  ): ChainCompletionReward | undefined {
    const chainRewards = this.chainRewards.get(chainId);
    if (!chainRewards) {
      return undefined;
    }

    // Determine path based on choices
    const path = this.determineChainPath(chainId, context.previousChoices);
    return chainRewards.get(path);
  }

  private determineChainPath(
    chainId: string,
    choices: { eventId: string; choiceId: string }[]
  ): string {
    // Simplified path determination based on majority of choices
    let peacefulCount = 0;
    let aggressiveCount = 0;

    for (const choice of choices) {
      if (choice.choiceId.includes('peaceful') || 
          choice.choiceId.includes('negotiate') || 
          choice.choiceId.includes('cooperate') ||
          choice.choiceId.includes('embrace')) {
        peacefulCount++;
      } else if (choice.choiceId.includes('force') || 
                 choice.choiceId.includes('control') ||
                 choice.choiceId.includes('suppress') ||
                 choice.choiceId.includes('secular')) {
        aggressiveCount++;
      }
    }

    if (chainId === 'noble_rebellion') {
      return peacefulCount > aggressiveCount ? 'path_peaceful' : 'path_force';
    } else if (chainId === 'merchant_expansion') {
      return peacefulCount > aggressiveCount ? 'path_cooperation' : 'path_control';
    } else if (chainId === 'religious_awakening') {
      return peacefulCount > aggressiveCount ? 'path_embrace' : 'path_secular';
    }

    return 'default';
  }

  private generateChainId(): string {
    return `chain_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  isChainComplete(event: Event): boolean {
    return event.isChainEnd();
  }

  getChainContext(chainId: string): ChainContext {
    return {
      chainId,
      previousChoices: [],
      currentPosition: 1
    };
  }
}