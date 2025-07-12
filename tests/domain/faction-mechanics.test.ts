import { Kingdom } from '../../src/domain/entities/Kingdom';
import { Faction } from '../../src/domain/entities/Faction';
import { FactionService } from '../../src/domain/services/FactionService';

describe('Faction Mechanics', () => {
  let kingdom: Kingdom;
  let factionService: FactionService;

  beforeEach(() => {
    kingdom = new Kingdom('Test Kingdom');
    factionService = new FactionService();
  });

  describe('Kingdom Faction Methods', () => {
    describe('applyFactionChange', () => {
      it('should change faction approval rating', () => {
        const initialApproval = kingdom.factions.get('Nobility')?.approvalRating ?? 0;
        
        kingdom.applyFactionChange('Nobility', 10);
        
        const newApproval = kingdom.factions.get('Nobility')?.approvalRating ?? 0;
        expect(newApproval).toBe(initialApproval + 10);
      });

      it('should cap approval rating at 0 and 100', () => {
        kingdom.applyFactionChange('Merchants', -100);
        expect(kingdom.factions.get('Merchants')?.approvalRating).toBe(0);
        
        kingdom.applyFactionChange('Merchants', 150);
        expect(kingdom.factions.get('Merchants')?.approvalRating).toBe(100);
      });

      it('should update faction mood based on approval', () => {
        kingdom.applyFactionChange('Military', -40); // From 50 to 10
        expect(kingdom.factions.get('Military')?.mood).toBe('Hostile');
        
        kingdom.applyFactionChange('Military', 30); // From 10 to 40
        expect(kingdom.factions.get('Military')?.mood).toBe('Unhappy');
        
        kingdom.applyFactionChange('Military', 30); // From 40 to 70
        expect(kingdom.factions.get('Military')?.mood).toBe('Content');
      });

      it('should throw error for non-existent faction', () => {
        expect(() => kingdom.applyFactionChange('NonExistent', 10))
          .toThrow('Faction NonExistent does not exist');
      });
    });

    describe('checkFactionEvents', () => {
      it('should generate rebellion event when faction approval is below 20', () => {
        kingdom.applyFactionChange('Commoners', -35); // From 50 to 15
        
        const events = kingdom.checkFactionEvents();
        
        // Find the Commoners rebellion event
        const commonersEvent = events.find(e => e.faction === 'Commoners');
        expect(commonersEvent).toBeDefined();
        expect(commonersEvent!.eventType).toMatch(/FactionRebellion|PeasantUprising/);
      });

      it('should generate unrest event when faction approval is between rebellion and unrest thresholds', () => {
        kingdom.applyFactionChange('Clergy', -15); // From 50 to 35 (between 25 and 40 for Clergy)
        
        const events = kingdom.checkFactionEvents();
        
        // Find the Clergy unrest event
        const clergyEvent = events.find(e => e.faction === 'Clergy');
        expect(clergyEvent).toBeDefined();
        expect(clergyEvent!.eventType).toMatch(/FactionUnrest|ReligiousProtest/);
      });

      it('should not generate events when all factions are above 30 approval', () => {
        // All factions start at 50
        const events = kingdom.checkFactionEvents();
        
        expect(events).toHaveLength(0);
      });

      it('should generate multiple events for multiple unhappy factions', () => {
        kingdom.applyFactionChange('Nobility', -40); // To 10 (rebellion)
        kingdom.applyFactionChange('Merchants', -30); // To 20 (rebellion)
        
        const events = kingdom.checkFactionEvents();
        
        // Should only have events for factions in rebellion/unrest
        const rebellionEvents = events.filter(e => 
          e.faction === 'Nobility' || e.faction === 'Merchants'
        );
        expect(rebellionEvents.length).toBe(2);
        expect(rebellionEvents.map(e => e.faction)).toContain('Nobility');
        expect(rebellionEvents.map(e => e.faction)).toContain('Merchants');
      });
    });

    describe('getFactionRelations', () => {
      it('should return faction relationships', () => {
        const relations = kingdom.getFactionRelations();
        
        expect(relations).toBeDefined();
        expect(relations['Nobility']).toBeDefined();
        expect(relations['Nobility']?.['Commoners']).toBeLessThan(0); // Negative relation
        expect(relations['Merchants']?.['Military']).toBeLessThan(0); // Competing for resources
      });

      it('should have symmetric relations', () => {
        const relations = kingdom.getFactionRelations();
        
        // If Nobility dislikes Commoners, Commoners should dislike Nobility
        expect(relations['Nobility']?.['Commoners']).toBe(relations['Commoners']?.['Nobility']);
      });
    });
  });

  describe('Faction Interactions', () => {
    it('should affect related factions when one faction gains approval', () => {
      const initialCommonersApproval = kingdom.factions.get('Commoners')?.approvalRating ?? 0;
      
      // Helping nobility should hurt commoners
      kingdom.applyFactionChange('Nobility', 20, true); // true = apply relations
      
      const newCommonersApproval = kingdom.factions.get('Commoners')?.approvalRating ?? 0;
      expect(newCommonersApproval).toBeLessThan(initialCommonersApproval);
    });

    it('should calculate total faction impact correctly', () => {
      const impact = factionService.calculateFactionImpact(kingdom, 'Military', 15);
      
      expect(impact['Military']).toBe(15);
      expect(impact['Merchants']).toBeLessThan(0); // Military gains hurt merchants
      expect(impact['Clergy']).toBeCloseTo(0); // Neutral relation
    });
  });

  describe('FactionService', () => {
    describe('calculateMoodBonus', () => {
      it('should provide positive bonuses for happy factions', () => {
        const faction = new Faction('Test', 'Test Faction', 90, 'Loyal');
        const bonus = factionService.calculateMoodBonus(faction);
        
        expect(bonus.resourceMultiplier).toBeGreaterThan(1);
        expect(bonus.stabilityBonus).toBeGreaterThan(0);
      });

      it('should provide penalties for unhappy factions', () => {
        const faction = new Faction('Test', 'Test Faction', 10, 'Hostile');
        const bonus = factionService.calculateMoodBonus(faction);
        
        expect(bonus.resourceMultiplier).toBeLessThan(1);
        expect(bonus.stabilityBonus).toBeLessThan(0);
      });
    });

    describe('generateFactionEvent', () => {
      it('should generate appropriate events based on faction mood', () => {
        const hostileFaction = new Faction('Test', 'Test Faction', 10, 'Hostile');
        const event = factionService.generateFactionEvent(kingdom.id, hostileFaction);
        
        expect(event!.eventType).toMatch(/Rebellion|Revolt|Uprising/);
        expect(event!.severity).toBe('critical');
      });

      it('should generate severe events for unhappy factions', () => {
        const unhappyFaction = new Faction('Test', 'Test Faction', 30, 'Unhappy');
        const event = factionService.generateFactionEvent(kingdom.id, unhappyFaction);
        
        expect(event!.eventType).toMatch(/Protest|Strike|Complaint|FactionUnrest/);
        expect(event!.severity).toBe('severe');
      });

      it('should not generate negative events for content factions', () => {
        const contentFaction = new Faction('Test', 'Test Faction', 70, 'Content');
        const event = factionService.generateFactionEvent(kingdom.id, contentFaction);
        
        expect(event).toBeNull();
      });
    });

    describe('calculateFactionPower', () => {
      it('should calculate faction power based on type and approval', () => {
        const nobilityPower = factionService.calculateFactionPower('Nobility', 80);
        const commonersPower = factionService.calculateFactionPower('Commoners', 80);
        
        expect(nobilityPower).toBeGreaterThan(commonersPower); // Nobility has more influence
      });

      it('should reduce power for low approval factions', () => {
        const highApprovalPower = factionService.calculateFactionPower('Military', 90);
        const lowApprovalPower = factionService.calculateFactionPower('Military', 20);
        
        expect(lowApprovalPower).toBeLessThan(highApprovalPower);
      });
    });

    describe('getRequiredApprovalThresholds', () => {
      it('should return different thresholds for different faction types', () => {
        const nobilityThresholds = factionService.getRequiredApprovalThresholds('Nobility');
        const commonersThresholds = factionService.getRequiredApprovalThresholds('Commoners');
        
        expect(nobilityThresholds.rebellion).toBeLessThan(commonersThresholds.rebellion);
        // Nobility rebels more easily
      });
    });
  });

  describe('Game Balance', () => {
    it('should make it challenging to keep all factions happy', () => {
      // Simulate typical player actions - heavily favor some factions
      kingdom.applyFactionChange('Nobility', 30, true);
      kingdom.applyFactionChange('Military', 30, true);
      
      // Check that at least one faction lost approval
      // Commoners should be unhappy from both Nobility and Military gains
      const factionApprovals = Array.from(kingdom.factions.values())
        .map(f => f.approvalRating);
      const unhappyFactions = factionApprovals.filter(approval => approval < 50);
      
      expect(unhappyFactions.length).toBeGreaterThan(0);
    });

    it('should require strategic decisions to maintain stability', () => {
      // Try to maximize one faction
      for (let i = 0; i < 5; i++) {
        kingdom.applyFactionChange('Nobility', 10, true);
      }
      
      // Check consequences - Nobility gained 50, relations with Commoners is -0.6
      // So Commoners should lose 50 * 0.6 * 0.5 = 15 approval total
      const commoners = kingdom.factions.get('Commoners');
      const merchants = kingdom.factions.get('Merchants');
      
      expect(commoners?.approvalRating).toBeLessThan(40); // 50 - 15 = 35
      expect(merchants?.approvalRating).toBeLessThanOrEqual(45); // 50 - (50 * 0.3 * 0.5) = 42.5
    });

    it('should provide meaningful choices between factions', () => {
      const scenarioA = factionService.calculateFactionImpact(kingdom, 'Military', 20);
      const scenarioB = factionService.calculateFactionImpact(kingdom, 'Merchants', 20);
      
      // Different choices should have different impacts
      expect(scenarioA).not.toEqual(scenarioB);
      
      // Each choice should have trade-offs
      const scenarioANegatives = Object.values(scenarioA).filter(v => v < 0).length;
      const scenarioBNegatives = Object.values(scenarioB).filter(v => v < 0).length;
      
      expect(scenarioANegatives).toBeGreaterThan(0);
      expect(scenarioBNegatives).toBeGreaterThan(0);
    });
  });
});