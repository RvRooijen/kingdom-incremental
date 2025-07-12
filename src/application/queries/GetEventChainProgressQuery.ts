import { IEventRepository } from '../interfaces/IEventRepository';
import { ApplicationError } from '../errors/ApplicationError';

export interface EventChainProgressDto {
  chainId: string;
  chainTitle: string;
  currentPosition: number;
  totalEvents: number;
  isComplete: boolean;
  previousChoices: Array<{
    eventId: string;
    eventTitle: string;
    choiceId: string;
    choiceDescription: string;
    timestamp: Date;
  }>;
  nextEventId?: string;
  completionReward?: {
    title: string;
    description: string;
  };
}

export class GetEventChainProgressQuery {
  constructor(private eventRepository: IEventRepository) {}

  async execute(kingdomId: string, chainId: string): Promise<EventChainProgressDto | null> {
    // Get all events in the chain
    const chainEvents = await this.eventRepository.findByChainId(chainId);
    if (chainEvents.length === 0) {
      return null;
    }

    // Get choices made in this chain
    const chainChoices = await this.eventRepository.getChainChoices(kingdomId, chainId);
    const isComplete = await this.eventRepository.isChainComplete(kingdomId, chainId);

    // Build progress DTO
    const currentPosition = chainChoices.length;
    const totalEvents = chainEvents.length;
    
    // Get chain title from first event
    const chainTitle = this.getChainTitle(chainId);

    // Map choices to include event and choice details
    const previousChoices = await Promise.all(
      chainChoices.map(async (chainChoice) => {
        const event = await this.eventRepository.findById(chainChoice.eventId);
        const choice = event?.choices.find(c => c.id === chainChoice.choiceId);
        
        return {
          eventId: chainChoice.eventId,
          eventTitle: event?.title || 'Unknown Event',
          choiceId: chainChoice.choiceId,
          choiceDescription: choice?.description || 'Unknown Choice',
          timestamp: chainChoice.timestamp
        };
      })
    );

    // Get next event if not complete
    let nextEventId: string | undefined;
    if (!isComplete && currentPosition < totalEvents) {
      const lastCompletedEvent = chainEvents[currentPosition - 1];
      if (lastCompletedEvent?.chainData?.nextEventId) {
        nextEventId = lastCompletedEvent.chainData.nextEventId;
      }
    }

    // Get completion reward info if complete
    let completionReward: { title: string; description: string } | undefined;
    if (isComplete) {
      completionReward = this.getCompletionRewardInfo(chainId, chainChoices.map(c => c.choiceId));
    }

    return {
      chainId,
      chainTitle,
      currentPosition,
      totalEvents,
      isComplete,
      previousChoices,
      nextEventId,
      completionReward
    };
  }

  async getAllChainProgress(kingdomId: string): Promise<EventChainProgressDto[]> {
    // This would need to be implemented to track all active chains for a kingdom
    // For now, return empty array
    return [];
  }

  private getChainTitle(chainId: string): string {
    const titles: Record<string, string> = {
      'noble_rebellion': 'The Noble Rebellion',
      'merchant_expansion': 'Merchant Guild Expansion',
      'religious_awakening': 'Religious Awakening'
    };
    
    return titles[chainId] || 'Unknown Chain';
  }

  private getCompletionRewardInfo(
    chainId: string, 
    choiceIds: string[]
  ): { title: string; description: string } {
    // Determine path based on choices
    const peacefulChoices = choiceIds.filter(id => 
      id.includes('peaceful') || 
      id.includes('negotiate') || 
      id.includes('cooperate') ||
      id.includes('embrace')
    ).length;
    
    const aggressiveChoices = choiceIds.filter(id => 
      id.includes('force') || 
      id.includes('control') ||
      id.includes('suppress') ||
      id.includes('secular')
    ).length;

    const isPeacefulPath = peacefulChoices > aggressiveChoices;

    const rewards: Record<string, { peaceful: any; aggressive: any }> = {
      'noble_rebellion': {
        peaceful: {
          title: 'Diplomatic Victory',
          description: 'Your peaceful resolution of the noble rebellion has earned you great respect.'
        },
        aggressive: {
          title: 'Iron Fist Victory',
          description: 'You crushed the rebellion with force, establishing your dominance.'
        }
      },
      'merchant_expansion': {
        peaceful: {
          title: 'Economic Alliance',
          description: 'Your cooperation with the merchant guild has created a thriving economy.'
        },
        aggressive: {
          title: 'Royal Monopoly',
          description: 'You have established royal control over all major trade.'
        }
      },
      'religious_awakening': {
        peaceful: {
          title: 'Divine Blessing',
          description: 'Your embrace of the religious movement has united the kingdom in faith.'
        },
        aggressive: {
          title: 'Enlightened Rule',
          description: 'Your secular approach has modernized the kingdom.'
        }
      }
    };

    const chainRewards = rewards[chainId];
    if (!chainRewards) {
      return {
        title: 'Chain Complete',
        description: 'You have completed this event chain.'
      };
    }

    return isPeacefulPath ? chainRewards.peaceful : chainRewards.aggressive;
  }
}