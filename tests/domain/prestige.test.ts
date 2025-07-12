import { Kingdom } from '../../src/domain/entities/Kingdom';
import { PrestigeService } from '../../src/domain/services/PrestigeService';
import { ResourceType } from '../../src/domain/value-objects/ResourceType';
import { CharacterType } from '../../src/domain/value-objects/CharacterType';

describe('Prestige System', () => {
  let kingdom: Kingdom;
  let prestigeService: PrestigeService;

  beforeEach(() => {
    kingdom = new Kingdom('Test Kingdom');
    prestigeService = new PrestigeService();
  });

  describe('Kingdom Prestige Properties', () => {
    it('should initialize with prestige level 0', () => {
      expect(kingdom.prestigeLevel).toBe(0);
    });

    it('should track completed events count', () => {
      expect(kingdom.completedEventsCount).toBe(0);
    });

    it('should calculate prestige bonuses correctly', () => {
      const bonuses = kingdom.getPrestigeBonuses();
      expect(bonuses.resourceMultiplier).toBe(1.0); // No bonus at prestige 0
      expect(bonuses.advisorSlots).toBe(0); // No extra slots at prestige 0
      expect(bonuses.factionRelationRetention).toBe(0); // 0% retention at prestige 0
    });
  });

  describe('Prestige Requirements', () => {
    it('should not allow prestige with less than 10 completed events', () => {
      expect(kingdom.canPrestige()).toBe(false);
    });

    it('should allow prestige with exactly 10 completed events', () => {
      // Simulate completing 10 events
      for (let i = 0; i < 10; i++) {
        kingdom.incrementCompletedEvents();
      }
      expect(kingdom.canPrestige()).toBe(true);
    });

    it('should allow prestige with more than 10 completed events', () => {
      // Simulate completing 15 events
      for (let i = 0; i < 15; i++) {
        kingdom.incrementCompletedEvents();
      }
      expect(kingdom.canPrestige()).toBe(true);
    });
  });

  describe('Performing Prestige', () => {
    beforeEach(() => {
      // Setup kingdom with resources and completed events
      kingdom.addResource(ResourceType.GOLD, 1000);
      kingdom.addResource(ResourceType.INFLUENCE, 500);
      kingdom.addResource(ResourceType.FAITH, 300);
      kingdom.addResource(ResourceType.KNOWLEDGE, 200);
      
      // Set faction relations
      kingdom.applyFactionChange('Nobility', 20);
      kingdom.applyFactionChange('Merchants', 30);
      kingdom.applyFactionChange('Military', -10);
      
      // Complete required events
      for (let i = 0; i < 10; i++) {
        kingdom.incrementCompletedEvents();
      }
    });

    it('should increase prestige level by 1', () => {
      const result = kingdom.performPrestige();
      expect(result.success).toBe(true);
      expect(kingdom.prestigeLevel).toBe(1);
    });

    it('should reset resources to starting values', () => {
      kingdom.performPrestige();
      
      expect(kingdom.getResource(ResourceType.GOLD)).toBe(100); // Starting gold
      expect(kingdom.getResource(ResourceType.INFLUENCE)).toBe(0);
      expect(kingdom.getResource(ResourceType.FAITH)).toBe(0);
      expect(kingdom.getResource(ResourceType.KNOWLEDGE)).toBe(0);
    });

    it('should reset completed events count', () => {
      kingdom.performPrestige();
      expect(kingdom.completedEventsCount).toBe(0);
    });

    it('should partially retain faction relations based on prestige level', () => {
      kingdom.performPrestige();
      
      // At prestige level 1, retain 10% of faction relations
      const nobility = kingdom.factions.get('Nobility');
      const merchants = kingdom.factions.get('Merchants');
      const military = kingdom.factions.get('Military');
      
      expect(nobility?.approvalRating).toBeCloseTo(52, 0); // 50 + (20 * 0.1)
      expect(merchants?.approvalRating).toBeCloseTo(53, 0); // 50 + (30 * 0.1)
      expect(military?.approvalRating).toBeCloseTo(49, 0); // 50 + (-10 * 0.1)
    });

    it('should not allow prestige without meeting requirements', () => {
      // Reset completed events
      kingdom = new Kingdom('Test Kingdom');
      
      const result = kingdom.performPrestige();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient completed events. Required: 10, Current: 0');
      expect(kingdom.prestigeLevel).toBe(0);
    });

    it('should apply resource generation bonus after prestige', () => {
      kingdom.performPrestige();
      
      const bonuses = kingdom.getPrestigeBonuses();
      expect(bonuses.resourceMultiplier).toBe(1.1); // +10% at prestige 1
    });

    it('should unlock additional advisor slots', () => {
      kingdom.performPrestige();
      
      const bonuses = kingdom.getPrestigeBonuses();
      expect(bonuses.advisorSlots).toBe(1); // 1 extra slot at prestige 1
    });
  });

  describe('PrestigeService', () => {
    it('should calculate prestige bonuses correctly', () => {
      const bonuses = prestigeService.calculatePrestigeBonuses(0);
      expect(bonuses.resourceMultiplier).toBe(1.0);
      expect(bonuses.advisorSlots).toBe(0);
      expect(bonuses.factionRelationRetention).toBe(0);
    });

    it('should increase bonuses with prestige level', () => {
      const bonuses1 = prestigeService.calculatePrestigeBonuses(1);
      expect(bonuses1.resourceMultiplier).toBe(1.1);
      expect(bonuses1.advisorSlots).toBe(1);
      expect(bonuses1.factionRelationRetention).toBe(0.1);

      const bonuses5 = prestigeService.calculatePrestigeBonuses(5);
      expect(bonuses5.resourceMultiplier).toBe(1.5);
      expect(bonuses5.advisorSlots).toBe(5);
      expect(bonuses5.factionRelationRetention).toBe(0.5);
    });

    it('should cap faction relation retention at 90%', () => {
      const bonuses = prestigeService.calculatePrestigeBonuses(10);
      expect(bonuses.factionRelationRetention).toBe(0.9); // Capped at 90%
    });

    it('should calculate prestige points based on kingdom progress', () => {
      // Add resources and progress
      kingdom.addResource(ResourceType.GOLD, 10000);
      kingdom.addResource(ResourceType.INFLUENCE, 5000);
      
      const points = prestigeService.calculatePrestigePoints(kingdom);
      expect(points).toBeGreaterThan(0);
    });

    it('should provide prestige reset data', () => {
      // Setup kingdom state
      kingdom.addResource(ResourceType.GOLD, 1000);
      kingdom.applyFactionChange('Nobility', 30);
      
      const resetData = prestigeService.preparePrestigeReset(kingdom, 1);
      
      expect(resetData.newResources.get(ResourceType.GOLD)).toBe(100);
      expect(resetData.retainedFactionRelations.get('Nobility')).toBeCloseTo(3, 0); // 30 * 0.1
    });
  });

  describe('Multiple Prestige Levels', () => {
    it('should handle multiple prestiges correctly', () => {
      // First prestige
      for (let i = 0; i < 10; i++) {
        kingdom.incrementCompletedEvents();
      }
      kingdom.performPrestige();
      expect(kingdom.prestigeLevel).toBe(1);

      // Second prestige
      for (let i = 0; i < 10; i++) {
        kingdom.incrementCompletedEvents();
      }
      kingdom.performPrestige();
      expect(kingdom.prestigeLevel).toBe(2);

      const bonuses = kingdom.getPrestigeBonuses();
      expect(bonuses.resourceMultiplier).toBe(1.2); // +20% at prestige 2
      expect(bonuses.advisorSlots).toBe(2);
      expect(bonuses.factionRelationRetention).toBe(0.2);
    });
  });

  describe('Resource Generation with Prestige Bonus', () => {
    it('should apply prestige multiplier to resource generation', () => {
      // Add a king character to generate gold
      kingdom.addCharacter(CharacterType.KING);
      
      // Perform prestige to get bonus
      for (let i = 0; i < 10; i++) {
        kingdom.incrementCompletedEvents();
      }
      kingdom.performPrestige();

      // Re-add king after prestige (characters are cleared)
      kingdom.addCharacter(CharacterType.KING);

      // Check that generation rates include prestige bonus
      const rates = kingdom.getGenerationRates();
      const baseGoldRate = 1; // Base generation rate from king
      const expectedGoldRate = baseGoldRate * 1.1; // With 10% prestige bonus
      
      expect(rates.get(ResourceType.GOLD)).toBeCloseTo(expectedGoldRate, 2);
    });
  });
});