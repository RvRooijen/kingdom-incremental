import { Kingdom } from '../../domain/entities/Kingdom';
import { Ruler } from '../../domain/entities/Ruler';
import { CharacterType } from '../../domain/value-objects/CharacterType';
import { Resources } from '../../domain/value-objects/Resources';
import { EventChainManager } from '../../domain/services/EventChainManager';
import { InMemoryEventRepository } from '../../infrastructure/repositories/InMemoryEventRepository';
import { createNobleRebellionChain } from '../../domain/events/chains/NobleRebellionChain';
import { EventDto } from '../../application/dtos/EventDto';

describe('Event Chain Integration', () => {
  let kingdom: Kingdom;
  let chainManager: EventChainManager;
  let eventRepository: InMemoryEventRepository;

  beforeEach(() => {
    const ruler = new Ruler('ruler-1', 'Test Ruler', CharacterType.Diplomatic, {
      diplomacy: 5,
      warfare: 5,
      stewardship: 5,
      intrigue: 5,
      learning: 5
    });

    kingdom = new Kingdom('kingdom-1', 'Test Kingdom', ruler);
    chainManager = new EventChainManager();
    eventRepository = new InMemoryEventRepository();
  });

  describe('Noble Rebellion Chain Flow', () => {
    it('should complete a full chain with peaceful choices', async () => {
      // Setup kingdom for noble rebellion
      kingdom.adjustResources(new Resources({
        gold: 1000,
        influence: 500,
        loyalty: 50,
        population: 1000,
        militaryPower: 200
      }));

      // Create and save chain events
      const chain = createNobleRebellionChain();
      for (const event of chain) {
        const eventDto: EventDto = {
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type as any,
          choices: event.choices.map(c => ({
            id: c.id,
            description: c.description,
            requirements: {
              gold: c.requirements.gold,
              influence: c.requirements.influence,
              loyalty: c.requirements.loyalty,
              militaryPower: c.requirements.militaryPower
            },
            chainData: c.chainData
          })),
          expiresInTurns: 10,
          chainData: event.chainData ? {
            chainId: event.chainId!,
            nextEventId: event.nextEventId,
            previousEventId: event.previousEventId,
            chainPosition: event.chainPosition!,
            chainLength: event.chainLength!
          } : undefined
        };
        await eventRepository.save(eventDto);
      }

      // Activate first event
      await eventRepository.activateForKingdom(chain[0].id, kingdom.id);

      // Process first event - peaceful choice
      await eventRepository.saveChainChoice(kingdom.id, 'noble_rebellion', {
        eventId: chain[0].id,
        choiceId: 'investigate_peacefully',
        timestamp: new Date()
      });
      await eventRepository.markAsProcessed(chain[0].id, kingdom.id);

      // Activate and process second event
      await eventRepository.activateForKingdom(chain[1].id, kingdom.id);
      await eventRepository.saveChainChoice(kingdom.id, 'noble_rebellion', {
        eventId: chain[1].id,
        choiceId: 'negotiate_compromise',
        timestamp: new Date()
      });
      await eventRepository.markAsProcessed(chain[1].id, kingdom.id);

      // Activate and process third event
      await eventRepository.activateForKingdom(chain[2].id, kingdom.id);
      await eventRepository.saveChainChoice(kingdom.id, 'noble_rebellion', {
        eventId: chain[2].id,
        choiceId: 'peaceful_resolution',
        timestamp: new Date()
      });
      await eventRepository.markAsProcessed(chain[2].id, kingdom.id);

      // Verify chain is complete
      const isComplete = await eventRepository.isChainComplete(kingdom.id, 'noble_rebellion');
      expect(isComplete).toBe(true);

      // Get chain context
      const choices = await eventRepository.getChainChoices(kingdom.id, 'noble_rebellion');
      const context = {
        chainId: 'noble_rebellion',
        previousChoices: choices,
        currentPosition: 3
      };

      // Process completion
      const initialResources = kingdom.getResources();
      chainManager.processChainCompletion(kingdom, 'noble_rebellion', context);
      const finalResources = kingdom.getResources();

      // Verify peaceful path rewards
      expect(finalResources.gold).toBe(initialResources.gold + 500);
      expect(finalResources.influence).toBe(initialResources.influence + 200);
      expect(finalResources.loyalty).toBe(initialResources.loyalty + 100);
    });

    it('should handle aggressive path differently', async () => {
      // Setup
      kingdom.adjustResources(new Resources({
        gold: 1000,
        influence: 200,
        loyalty: 50,
        population: 1000,
        militaryPower: 600
      }));

      const chain = createNobleRebellionChain();
      
      // Make aggressive choices
      const aggressiveChoices = [
        { eventId: chain[0].id, choiceId: 'show_force' },
        { eventId: chain[1].id, choiceId: 'prepare_suppression' },
        { eventId: chain[2].id, choiceId: 'force_surrender' }
      ];

      for (const choice of aggressiveChoices) {
        await eventRepository.saveChainChoice(kingdom.id, 'noble_rebellion', {
          ...choice,
          timestamp: new Date()
        });
      }

      // Process completion
      const context = {
        chainId: 'noble_rebellion',
        previousChoices: await eventRepository.getChainChoices(kingdom.id, 'noble_rebellion'),
        currentPosition: 3
      };

      const initialResources = kingdom.getResources();
      chainManager.processChainCompletion(kingdom, 'noble_rebellion', context);
      const finalResources = kingdom.getResources();

      // Verify aggressive path rewards
      expect(finalResources.gold).toBe(initialResources.gold + 200);
      expect(finalResources.militaryPower).toBe(initialResources.militaryPower + 150);
      expect(finalResources.loyalty).toBe(initialResources.loyalty - 50);
    });
  });

  describe('Chain Spawning', () => {
    it('should spawn chains when conditions are met', () => {
      // Setup perfect conditions
      kingdom.adjustResources(new Resources({
        gold: 1000,
        influence: 300,
        loyalty: 50,
        population: 1000,
        militaryPower: 300
      }));

      // Mock Math.random to ensure spawn
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.1);

      // Check spawning at different turns
      const turn20Events = chainManager.checkAndSpawnChains(kingdom, 20);
      expect(turn20Events.length).toBeGreaterThan(0);

      // Verify spawned events are chain starts
      for (const event of turn20Events) {
        expect(event.isChainStart()).toBe(true);
        expect(event.chainPosition).toBe(1);
      }

      mockRandom.mockRestore();
    });
  });

  describe('Chain Repository Operations', () => {
    it('should correctly track chain progress', async () => {
      const chainId = 'test-chain';
      const choices = [
        { eventId: 'event1', choiceId: 'choice1', timestamp: new Date() },
        { eventId: 'event2', choiceId: 'choice2', timestamp: new Date() }
      ];

      for (const choice of choices) {
        await eventRepository.saveChainChoice(kingdom.id, chainId, choice);
      }

      const savedChoices = await eventRepository.getChainChoices(kingdom.id, chainId);
      expect(savedChoices).toHaveLength(2);
      expect(savedChoices[0].choiceId).toBe('choice1');
      expect(savedChoices[1].choiceId).toBe('choice2');
    });

    it('should find events by chain id', async () => {
      const chain = createNobleRebellionChain();
      
      for (const event of chain) {
        const eventDto: EventDto = {
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type as any,
          choices: [],
          expiresInTurns: 10,
          chainData: {
            chainId: 'noble_rebellion',
            chainPosition: event.chainPosition!,
            chainLength: event.chainLength!,
            nextEventId: event.nextEventId,
            previousEventId: event.previousEventId
          }
        };
        await eventRepository.save(eventDto);
      }

      const chainEvents = await eventRepository.findByChainId('noble_rebellion');
      expect(chainEvents).toHaveLength(3);
      expect(chainEvents[0].chainData?.chainPosition).toBe(1);
      expect(chainEvents[1].chainData?.chainPosition).toBe(2);
      expect(chainEvents[2].chainData?.chainPosition).toBe(3);
    });
  });
});