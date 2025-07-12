import { EventChainService, ChainContext } from '../EventChainService';
import { Event, EventChoice, EventConsequence, EventType, ResourceRequirement } from '../../events/Event';
import { Resources } from '../../value-objects/Resources';

// Mock Event class for testing
class MockEvent extends Event {
  constructor(
    id: string,
    chainData?: {
      chainId?: string;
      nextEventId?: string;
      previousEventId?: string;
      chainPosition?: number;
      chainLength?: number;
    }
  ) {
    super(
      id,
      `Test Event ${id}`,
      'Test description',
      EventType.Political,
      [],
      undefined,
      chainData
    );
  }
}

describe('EventChainService', () => {
  let service: EventChainService;

  beforeEach(() => {
    service = new EventChainService();
  });

  describe('createEventChain', () => {
    it('should create a chain with proper links', () => {
      const events = [
        new MockEvent('event1'),
        new MockEvent('event2'),
        new MockEvent('event3')
      ];

      service.createEventChain(events);

      // Check first event
      expect(events[0].chainId).toBeDefined();
      expect(events[0].previousEventId).toBeUndefined();
      expect(events[0].nextEventId).toBe('event2');
      expect(events[0].chainPosition).toBe(1);
      expect(events[0].chainLength).toBe(3);

      // Check middle event
      expect(events[1].chainId).toBe(events[0].chainId);
      expect(events[1].previousEventId).toBe('event1');
      expect(events[1].nextEventId).toBe('event3');
      expect(events[1].chainPosition).toBe(2);
      expect(events[1].chainLength).toBe(3);

      // Check last event
      expect(events[2].chainId).toBe(events[0].chainId);
      expect(events[2].previousEventId).toBe('event2');
      expect(events[2].nextEventId).toBeUndefined();
      expect(events[2].chainPosition).toBe(3);
      expect(events[2].chainLength).toBe(3);
    });

    it('should throw error for chains with less than 2 events', () => {
      expect(() => {
        service.createEventChain([new MockEvent('single')]);
      }).toThrow('Event chain must contain at least 2 events');
    });
  });

  describe('getNextInChain', () => {
    it('should return next event id for chain event', () => {
      const event = new MockEvent('event1', {
        chainId: 'test-chain',
        nextEventId: 'event2',
        chainPosition: 1,
        chainLength: 2
      });

      expect(service.getNextInChain(event)).toBe('event2');
    });

    it('should return undefined for non-chain event', () => {
      const event = new MockEvent('standalone');
      expect(service.getNextInChain(event)).toBeUndefined();
    });
  });

  describe('processChainChoice', () => {
    it('should store choice and return next event id', () => {
      const event = new MockEvent('event1', {
        chainId: 'test-chain',
        nextEventId: 'event2',
        chainPosition: 1,
        chainLength: 2
      });

      const choice = new EventChoice({
        id: 'choice1',
        description: 'Test choice',
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
          description: 'Test effect'
        }),
        longTermEffects: []
      });

      const context: ChainContext = {
        chainId: 'test-chain',
        previousChoices: [],
        currentPosition: 1
      };

      const result = service.processChainChoice(event, choice, context);

      expect(result.nextEventId).toBe('event2');
      expect(context.previousChoices).toHaveLength(1);
      expect(context.previousChoices[0]).toEqual({
        eventId: 'event1',
        choiceId: 'choice1'
      });
    });

    it('should handle choice with modifiers', () => {
      const event = new MockEvent('event1', {
        chainId: 'test-chain',
        nextEventId: 'event2',
        chainPosition: 1,
        chainLength: 2
      });

      const choice = new EventChoice({
        id: 'choice1',
        description: 'Test choice',
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
          description: 'Test effect'
        }),
        longTermEffects: [],
        chainData: {
          nextEventModifier: 'aggressive_path'
        }
      });

      const context: ChainContext = {
        chainId: 'test-chain',
        previousChoices: [],
        currentPosition: 1
      };

      const result = service.processChainChoice(event, choice, context);

      expect(result.modifiers).toBeDefined();
      expect(result.modifiers?.get('choiceModifier')).toBe('aggressive_path');
    });
  });

  describe('getChainCompletionReward', () => {
    it('should return reward for noble rebellion peaceful path', () => {
      const context: ChainContext = {
        chainId: 'noble_rebellion',
        previousChoices: [
          { eventId: 'event1', choiceId: 'investigate_peacefully' },
          { eventId: 'event2', choiceId: 'negotiate_compromise' },
          { eventId: 'event3', choiceId: 'peaceful_resolution' }
        ],
        currentPosition: 3
      };

      const reward = service.getChainCompletionReward('noble_rebellion', context);

      expect(reward).toBeDefined();
      expect(reward?.title).toBe('Diplomatic Victory');
      expect(reward?.resources.gold).toBe(500);
      expect(reward?.resources.influence).toBe(200);
      expect(reward?.resources.loyalty).toBe(100);
    });

    it('should return reward for noble rebellion force path', () => {
      const context: ChainContext = {
        chainId: 'noble_rebellion',
        previousChoices: [
          { eventId: 'event1', choiceId: 'show_force' },
          { eventId: 'event2', choiceId: 'prepare_suppression' },
          { eventId: 'event3', choiceId: 'force_surrender' }
        ],
        currentPosition: 3
      };

      const reward = service.getChainCompletionReward('noble_rebellion', context);

      expect(reward).toBeDefined();
      expect(reward?.title).toBe('Iron Fist Victory');
      expect(reward?.resources.gold).toBe(200);
      expect(reward?.resources.militaryPower).toBe(150);
      expect(reward?.resources.loyalty).toBe(-50);
    });
  });

  describe('isChainComplete', () => {
    it('should return true for chain end event', () => {
      const event = new MockEvent('event3', {
        chainId: 'test-chain',
        previousEventId: 'event2',
        chainPosition: 3,
        chainLength: 3
      });

      expect(service.isChainComplete(event)).toBe(true);
    });

    it('should return false for non-end event', () => {
      const event = new MockEvent('event2', {
        chainId: 'test-chain',
        previousEventId: 'event1',
        nextEventId: 'event3',
        chainPosition: 2,
        chainLength: 3
      });

      expect(service.isChainComplete(event)).toBe(false);
    });
  });
});