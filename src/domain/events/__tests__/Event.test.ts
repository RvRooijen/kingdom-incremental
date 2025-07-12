import { Event, EventType, EventChoice, EventConsequence, ResourceRequirement } from '../Event';
import { Resources } from '../../value-objects/Resources';

// Concrete implementation for testing
class TestEvent extends Event {
  constructor(
    id: string,
    chainData?: {
      nextEventId?: string;
      previousEventId?: string;
      chainId?: string;
      chainPosition?: number;
      chainLength?: number;
    }
  ) {
    const choices = [
      new EventChoice({
        id: 'choice1',
        description: 'Test choice',
        requirements: new ResourceRequirement({
          gold: 100,
          influence: 0,
          loyalty: 0,
          population: 0,
          militaryPower: 0
        }),
        immediateEffect: new EventConsequence({
          resourceChange: new Resources({
            gold: -100,
            influence: 0,
            loyalty: 0,
            population: 0,
            militaryPower: 0
          }),
          stabilityChange: 0,
          loyaltyChange: 0,
          description: 'Test effect'
        }),
        longTermEffects: []
      })
    ];

    super(
      id,
      'Test Event',
      'Test description',
      EventType.Political,
      choices,
      undefined,
      chainData
    );
  }
}

describe('Event', () => {
  describe('chain functionality', () => {
    it('should correctly identify chain events', () => {
      const chainEvent = new TestEvent('event1', {
        chainId: 'test-chain',
        chainPosition: 1,
        chainLength: 3
      });
      
      const standaloneEvent = new TestEvent('event2');
      
      expect(chainEvent.isPartOfChain()).toBe(true);
      expect(standaloneEvent.isPartOfChain()).toBe(false);
    });

    it('should identify chain start events', () => {
      const startEvent = new TestEvent('event1', {
        chainId: 'test-chain',
        nextEventId: 'event2',
        chainPosition: 1,
        chainLength: 3
      });
      
      const middleEvent = new TestEvent('event2', {
        chainId: 'test-chain',
        previousEventId: 'event1',
        nextEventId: 'event3',
        chainPosition: 2,
        chainLength: 3
      });
      
      expect(startEvent.isChainStart()).toBe(true);
      expect(middleEvent.isChainStart()).toBe(false);
    });

    it('should identify chain end events', () => {
      const middleEvent = new TestEvent('event2', {
        chainId: 'test-chain',
        previousEventId: 'event1',
        nextEventId: 'event3',
        chainPosition: 2,
        chainLength: 3
      });
      
      const endEvent = new TestEvent('event3', {
        chainId: 'test-chain',
        previousEventId: 'event2',
        chainPosition: 3,
        chainLength: 3
      });
      
      expect(middleEvent.isChainEnd()).toBe(false);
      expect(endEvent.isChainEnd()).toBe(true);
    });

    it('should return correct chain progress', () => {
      const event1 = new TestEvent('event1', {
        chainId: 'test-chain',
        chainPosition: 1,
        chainLength: 3
      });
      
      const event2 = new TestEvent('event2', {
        chainId: 'test-chain',
        chainPosition: 2,
        chainLength: 3
      });
      
      const event3 = new TestEvent('event3', {
        chainId: 'test-chain',
        chainPosition: 3,
        chainLength: 3
      });
      
      expect(event1.getChainProgress()).toBe('1/3');
      expect(event2.getChainProgress()).toBe('2/3');
      expect(event3.getChainProgress()).toBe('3/3');
    });

    it('should return empty progress for non-chain events', () => {
      const event = new TestEvent('standalone');
      expect(event.getChainProgress()).toBe('');
    });
  });

  describe('EventChoice with chain data', () => {
    it('should store chain data in choices', () => {
      const choice = new EventChoice({
        id: 'test-choice',
        description: 'Test choice with chain data',
        requirements: new ResourceRequirement({
          gold: 0,
          influence: 0,
          loyalty: 0,
          population: 0,
          militaryPower: 0
        }),
        immediateEffect: new EventConsequence({
          resourceChange: new Resources({
            gold: 0,
            influence: 0,
            loyalty: 0,
            population: 0,
            militaryPower: 0
          }),
          stabilityChange: 0,
          loyaltyChange: 0,
          description: 'Test'
        }),
        longTermEffects: [],
        chainData: {
          nextEventModifier: 'peaceful_path',
          unlockConditions: ['diplomacy_5', 'gold_1000']
        }
      });

      expect(choice.chainData).toBeDefined();
      expect(choice.chainData?.nextEventModifier).toBe('peaceful_path');
      expect(choice.chainData?.unlockConditions).toEqual(['diplomacy_5', 'gold_1000']);
    });
  });
});