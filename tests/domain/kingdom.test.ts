import { Kingdom } from '../../src/domain/entities/Kingdom';

describe('Kingdom', () => {
  describe('Creation', () => {
    it('should create a kingdom with default resources', () => {
      // Arrange & Act
      const kingdom = new Kingdom('Test Kingdom');
      
      // Assert
      expect(kingdom.name).toBe('Test Kingdom');
      expect(kingdom.resources.gold).toBe(100);
      expect(kingdom.resources.influence).toBe(10);
      expect(kingdom.resources.loyalty).toBe(50);
      expect(kingdom.resources.population).toBe(1000);
      expect(kingdom.resources.militaryPower).toBe(10);
    });

    it('should have a unique id', () => {
      // Arrange & Act
      const kingdom1 = new Kingdom('Kingdom 1');
      const kingdom2 = new Kingdom('Kingdom 2');
      
      // Assert
      expect(kingdom1.id).toBeDefined();
      expect(kingdom2.id).toBeDefined();
      expect(kingdom1.id).not.toBe(kingdom2.id);
    });

    it('should initialize with king and queen', () => {
      // Arrange & Act
      const kingdom = new Kingdom('Test Kingdom');
      
      // Assert
      expect(kingdom.court.king).toBeDefined();
      expect(kingdom.court.king.name).toBe('The King');
      expect(kingdom.court.queen).toBeDefined();
      expect(kingdom.court.queen.name).toBe('The Queen');
    });

    it('should initialize with all factions at neutral standing', () => {
      // Arrange & Act
      const kingdom = new Kingdom('Test Kingdom');
      
      // Assert
      expect(kingdom.factions.size).toBe(5);
      
      const factionTypes = ['Nobility', 'Merchants', 'Military', 'Clergy', 'Commoners'];
      factionTypes.forEach(factionType => {
        const faction = kingdom.factions.get(factionType);
        expect(faction).toBeDefined();
        expect(faction?.approvalRating).toBe(50);
        expect(faction?.mood).toBe('Neutral');
      });
    });
  });
});