import { Achievement } from '../../src/domain/entities/Achievement';
import { AchievementService } from '../../src/domain/services/AchievementService';
import { Kingdom } from '../../src/domain/entities/Kingdom';
import { ResourceType } from '../../src/domain/value-objects/ResourceType';
import { AdvisorType } from '../../src/domain/value-objects/AdvisorType';

describe('Achievement System', () => {
  describe('Achievement Entity', () => {
    it('should create an achievement with basic properties', () => {
      const achievement = new Achievement(
        'first-kingdom',
        'First Kingdom',
        'Create your first kingdom',
        { type: 'kingdom_created' }
      );

      expect(achievement.id).toBe('first-kingdom');
      expect(achievement.name).toBe('First Kingdom');
      expect(achievement.description).toBe('Create your first kingdom');
      expect(achievement.isUnlocked).toBe(false);
      expect(achievement.requirement).toEqual({ type: 'kingdom_created' });
    });

    it('should have reward property', () => {
      const achievement = new Achievement(
        'resource-hoarder',
        'Resource Hoarder',
        'Accumulate 1000 gold',
        { type: 'resource', resource: ResourceType.GOLD, amount: 1000 },
        { resources: { [ResourceType.GOLD]: 100, [ResourceType.INFLUENCE]: 50 } }
      );

      expect(achievement.reward).toEqual({
        resources: { [ResourceType.GOLD]: 100, [ResourceType.INFLUENCE]: 50 }
      });
    });

    it('should unlock achievement', () => {
      const achievement = new Achievement(
        'test',
        'Test Achievement',
        'Test description',
        { type: 'kingdom_created' }
      );

      expect(achievement.isUnlocked).toBe(false);
      achievement.unlock();
      expect(achievement.isUnlocked).toBe(true);
    });

    it('should not unlock already unlocked achievement', () => {
      const achievement = new Achievement(
        'test',
        'Test Achievement',
        'Test description',
        { type: 'kingdom_created' }
      );

      achievement.unlock();
      expect(achievement.isUnlocked).toBe(true);
      
      // Should not throw when unlocking again
      achievement.unlock();
      expect(achievement.isUnlocked).toBe(true);
    });
  });

  describe('AchievementService', () => {
    let service: AchievementService;
    let kingdom: Kingdom;

    beforeEach(() => {
      service = new AchievementService();
      kingdom = new Kingdom('Test Kingdom');
    });

    describe('Achievement Definitions', () => {
      it('should have at least 10 achievement definitions', () => {
        const achievements = service.getAllAchievements();
        expect(achievements.length).toBeGreaterThanOrEqual(10);
      });

      it('should have required achievements', () => {
        const achievements = service.getAllAchievements();
        const ids = achievements.map(a => a.id);
        
        expect(ids).toContain('first-kingdom');
        expect(ids).toContain('resource-hoarder');
        expect(ids).toContain('popular-ruler');
        expect(ids).toContain('event-master');
        expect(ids).toContain('prestigious');
      });
    });

    describe('checkAchievements', () => {
      it('should unlock "First Kingdom" achievement when kingdom is created', () => {
        const unlockedAchievements = service.checkAchievements(kingdom);
        
        expect(unlockedAchievements).toHaveLength(1);
        expect(unlockedAchievements[0]?.id).toBe('first-kingdom');
      });

      it('should unlock "Resource Hoarder" achievement when gold reaches 1000', () => {
        // First check should unlock "First Kingdom"
        service.checkAchievements(kingdom);
        
        // Add gold
        kingdom.addResource(ResourceType.GOLD, 1000);
        
        const unlockedAchievements = service.checkAchievements(kingdom);
        
        // Both resource-hoarder and balanced-ruler should unlock (1000 gold = 1000 total)
        expect(unlockedAchievements.length).toBeGreaterThanOrEqual(1);
        const ids = unlockedAchievements.map(a => a.id);
        expect(ids).toContain('resource-hoarder');
      });

      it('should unlock "Popular Ruler" when all factions have > 60 approval', () => {
        service.checkAchievements(kingdom); // First Kingdom
        
        // Set all faction approvals to above 60
        for (const faction of kingdom.factions.values()) {
          const currentApproval = faction.approvalRating;
          faction.changeApproval(61 - currentApproval);
        }
        
        const unlockedAchievements = service.checkAchievements(kingdom);
        
        expect(unlockedAchievements).toHaveLength(1);
        expect(unlockedAchievements[0]?.id).toBe('popular-ruler');
      });

      it('should not unlock already unlocked achievements', () => {
        // First check unlocks "First Kingdom"
        const firstCheck = service.checkAchievements(kingdom);
        expect(firstCheck).toHaveLength(1);
        
        // Second check should return empty array
        const secondCheck = service.checkAchievements(kingdom);
        expect(secondCheck).toHaveLength(0);
      });

      it('should unlock multiple achievements at once', () => {
        service.checkAchievements(kingdom); // First Kingdom
        
        // Set conditions for multiple achievements
        kingdom.addResource(ResourceType.GOLD, 1000);
        kingdom.addResource(ResourceType.INFLUENCE, 500);
        
        const unlockedAchievements = service.checkAchievements(kingdom);
        
        expect(unlockedAchievements.length).toBeGreaterThanOrEqual(2);
        const ids = unlockedAchievements.map(a => a.id);
        expect(ids).toContain('resource-hoarder');
        expect(ids).toContain('influential');
      });
    });

    describe('unlockAchievement', () => {
      it('should apply rewards when unlocking achievement', () => {
        const achievement = service.getAllAchievements().find(a => a.id === 'resource-hoarder');
        const initialGold = kingdom.getResource(ResourceType.GOLD);
        
        service.unlockAchievement(achievement!, kingdom);
        
        expect(kingdom.getResource(ResourceType.GOLD)).toBeGreaterThan(initialGold);
      });

      it('should mark achievement as unlocked', () => {
        const achievement = service.getAllAchievements().find(a => a.id === 'first-kingdom');
        
        expect(achievement!.isUnlocked).toBe(false);
        service.unlockAchievement(achievement!, kingdom);
        expect(achievement!.isUnlocked).toBe(true);
      });

      it('should add achievement to kingdom unlocked achievements', () => {
        const achievement = service.getAllAchievements().find(a => a.id === 'first-kingdom');
        
        expect(kingdom.hasUnlockedAchievement('first-kingdom')).toBe(false);
        service.unlockAchievement(achievement!, kingdom);
        expect(kingdom.hasUnlockedAchievement('first-kingdom')).toBe(true);
      });
    });

    describe('Achievement Requirements', () => {
      it('should check resource requirements correctly', () => {
        const service = new AchievementService();
        
        // Test different resource levels
        kingdom.addResource(ResourceType.GOLD, 500);
        let achievements = service.checkAchievements(kingdom);
        expect(achievements.map(a => a.id)).not.toContain('resource-hoarder');
        
        kingdom.addResource(ResourceType.GOLD, 500); // Now 1000 total
        achievements = service.checkAchievements(kingdom);
        expect(achievements.map(a => a.id)).toContain('resource-hoarder');
      });

      it('should check faction requirements correctly', () => {
        service.checkAchievements(kingdom); // First Kingdom
        
        // Set some factions below 60
        const factions = Array.from(kingdom.factions.values());
        if (factions[0]) {
          factions[0].changeApproval(-20); // Set one faction to 30
        }
        
        let achievements = service.checkAchievements(kingdom);
        expect(achievements.map(a => a.id)).not.toContain('popular-ruler');
        
        // Set all factions above 60
        for (const faction of kingdom.factions.values()) {
          const currentApproval = faction.approvalRating;
          if (currentApproval < 61) {
            faction.changeApproval(61 - currentApproval);
          }
        }
        
        achievements = service.checkAchievements(kingdom);
        expect(achievements.map(a => a.id)).toContain('popular-ruler');
      });

      it('should check advisor requirements correctly', () => {
        service.checkAchievements(kingdom); // First Kingdom
        
        // Add advisors
        kingdom.addAdvisor(AdvisorType.TREASURER);
        kingdom.addAdvisor(AdvisorType.MARSHAL);
        
        let achievements = service.checkAchievements(kingdom);
        expect(achievements.map(a => a.id)).not.toContain('full-court');
        
        // Add remaining advisors
        kingdom.addAdvisor(AdvisorType.CHANCELLOR);
        kingdom.addAdvisor(AdvisorType.SPYMASTER);
        kingdom.addAdvisor(AdvisorType.COURT_CHAPLAIN);
        
        achievements = service.checkAchievements(kingdom);
        expect(achievements.map(a => a.id)).toContain('full-court');
      });

      it('should check event completion requirements', () => {
        service.checkAchievements(kingdom); // First Kingdom
        
        // Complete events
        for (let i = 0; i < 24; i++) {
          kingdom.incrementCompletedEvents();
        }
        
        let achievements = service.checkAchievements(kingdom);
        expect(achievements.map(a => a.id)).not.toContain('event-master');
        
        kingdom.incrementCompletedEvents(); // 25th event
        
        achievements = service.checkAchievements(kingdom);
        expect(achievements.map(a => a.id)).toContain('event-master');
      });

      it('should check prestige level requirements', () => {
        service.checkAchievements(kingdom); // First Kingdom
        
        // Need to complete events before prestige
        for (let i = 0; i < 10; i++) {
          kingdom.incrementCompletedEvents();
        }
        
        const prestigeResult = kingdom.performPrestige();
        expect(prestigeResult.success).toBe(true);
        
        const achievements = service.checkAchievements(kingdom);
        expect(achievements.map(a => a.id)).toContain('prestigious');
      });
    });
  });

  describe('Kingdom Integration', () => {
    let kingdom: Kingdom;

    beforeEach(() => {
      kingdom = new Kingdom('Test Kingdom');
    });

    it('should have unlockedAchievements set', () => {
      expect(kingdom.unlockedAchievements).toBeDefined();
      expect(kingdom.unlockedAchievements).toBeInstanceOf(Set);
    });

    it('should check achievements method', () => {
      const achievements = kingdom.checkAchievements();
      expect(Array.isArray(achievements)).toBe(true);
      expect(achievements.length).toBeGreaterThanOrEqual(1); // At least "First Kingdom"
    });

    it('should track unlocked achievements', () => {
      expect(kingdom.hasUnlockedAchievement('first-kingdom')).toBe(false);
      
      kingdom.checkAchievements();
      
      expect(kingdom.hasUnlockedAchievement('first-kingdom')).toBe(true);
    });

    it('should get all unlocked achievements', () => {
      expect(kingdom.getUnlockedAchievements()).toEqual([]);
      
      kingdom.checkAchievements();
      
      const unlocked = kingdom.getUnlockedAchievements();
      expect(unlocked).toContain('first-kingdom');
    });
  });
});