import { EventChainManager } from '../EventChainManager';
import { Kingdom } from '../../entities/Kingdom';
import { Resources } from '../../value-objects/Resources';
import { Ruler } from '../../entities/Ruler';
import { CharacterType } from '../../value-objects/CharacterType';

describe('EventChainManager', () => {
  let manager: EventChainManager;
  let kingdom: Kingdom;

  beforeEach(() => {
    manager = new EventChainManager();
    
    const ruler = new Ruler('ruler-1', 'Test Ruler', CharacterType.Diplomatic, {
      diplomacy: 5,
      warfare: 5,
      stewardship: 5,
      intrigue: 5,
      learning: 5
    });

    kingdom = new Kingdom('kingdom-1', 'Test Kingdom', ruler);
  });

  describe('checkAndSpawnChains', () => {
    it('should not spawn chains before minimum turn', () => {
      const events = manager.checkAndSpawnChains(kingdom, 5);
      expect(events).toHaveLength(0);
    });

    it('should spawn noble rebellion when conditions are met', () => {
      // Set up conditions for noble rebellion
      kingdom.adjustResources(new Resources({
        gold: 500,
        influence: 200,
        loyalty: 0,
        population: 0,
        militaryPower: 0
      }));
      
      // Set low stability (noble rebellion spawns at low stability)
      for (let i = 0; i < 5; i++) {
        kingdom.adjustResources(new Resources({
          gold: 0,
          influence: 0,
          loyalty: -20,
          population: 0,
          militaryPower: 0
        }));
      }

      // Mock random to ensure spawn
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.1);
      
      const events = manager.checkAndSpawnChains(kingdom, 20);
      
      // Should spawn at least one event
      const nobleRebellionEvent = events.find(e => e.id === 'noble_rebellion_1');
      expect(nobleRebellionEvent).toBeDefined();
      
      mockRandom.mockRestore();
    });

    it('should respect cooldown periods', () => {
      // Setup conditions
      kingdom.adjustResources(new Resources({
        gold: 1000,
        influence: 500,
        loyalty: 100,
        population: 0,
        militaryPower: 0
      }));

      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.1);
      
      // First spawn
      const events1 = manager.checkAndSpawnChains(kingdom, 20);
      expect(events1.length).toBeGreaterThan(0);
      
      // Try to spawn again immediately - should fail due to cooldown
      const events2 = manager.checkAndSpawnChains(kingdom, 21);
      expect(events2).toHaveLength(0);
      
      // Try after cooldown period
      const events3 = manager.checkAndSpawnChains(kingdom, 50);
      expect(events3.length).toBeGreaterThan(0);
      
      mockRandom.mockRestore();
    });

    it('should check resource requirements for merchant chain', () => {
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.1);
      
      // Without enough gold
      const events1 = manager.checkAndSpawnChains(kingdom, 20);
      const merchantEvent1 = events1.find(e => e.id === 'merchant_guild_1');
      expect(merchantEvent1).toBeUndefined();
      
      // With enough resources
      kingdom.adjustResources(new Resources({
        gold: 500,
        influence: 200,
        loyalty: 0,
        population: 0,
        militaryPower: 0
      }));
      
      const events2 = manager.checkAndSpawnChains(kingdom, 20);
      const merchantEvent2 = events2.find(e => e.id === 'merchant_guild_1');
      expect(merchantEvent2).toBeDefined();
      
      mockRandom.mockRestore();
    });
  });

  describe('processChainCompletion', () => {
    it('should apply completion rewards', () => {
      const initialResources = kingdom.getResources();
      
      const context = {
        chainId: 'noble_rebellion',
        previousChoices: [
          { eventId: 'noble_rebellion_1', choiceId: 'investigate_peacefully' },
          { eventId: 'noble_rebellion_2', choiceId: 'negotiate_compromise' },
          { eventId: 'noble_rebellion_3', choiceId: 'peaceful_resolution' }
        ],
        currentPosition: 3
      };
      
      manager.processChainCompletion(kingdom, 'noble_rebellion', context);
      
      const newResources = kingdom.getResources();
      
      // Should have received peaceful path rewards
      expect(newResources.gold).toBe(initialResources.gold + 500);
      expect(newResources.influence).toBe(initialResources.influence + 200);
      expect(newResources.loyalty).toBe(initialResources.loyalty + 100);
    });
  });

  describe('chain spawning probability', () => {
    it('should spawn chains based on probability', () => {
      // Setup perfect conditions for all chains
      kingdom.adjustResources(new Resources({
        gold: 2000,
        influence: 500,
        loyalty: 100,
        population: 0,
        militaryPower: 0
      }));
      
      let spawnCounts = {
        noble: 0,
        merchant: 0,
        religious: 0
      };
      
      // Run many times to test probability
      for (let i = 0; i < 100; i++) {
        const events = manager.checkAndSpawnChains(kingdom, 30 + i * 30); // Ensure cooldown passes
        
        events.forEach(event => {
          if (event.id === 'noble_rebellion_1') spawnCounts.noble++;
          if (event.id === 'merchant_guild_1') spawnCounts.merchant++;
          if (event.id === 'religious_awakening_1') spawnCounts.religious++;
        });
      }
      
      // Each chain should have spawned at least once
      expect(spawnCounts.noble).toBeGreaterThan(0);
      expect(spawnCounts.merchant).toBeGreaterThan(0);
      expect(spawnCounts.religious).toBeGreaterThan(0);
      
      // Merchant chain (0.4 probability) should spawn more than noble (0.3)
      expect(spawnCounts.merchant).toBeGreaterThan(spawnCounts.noble);
    });
  });
});