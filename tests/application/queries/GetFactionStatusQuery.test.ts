import { GetFactionStatusQuery } from '../../../src/application/queries/GetFactionStatusQuery';
import { IKingdomRepository } from '../../../src/application/interfaces/IKingdomRepository';
import { Kingdom } from '../../../src/domain/entities/Kingdom';
import { Faction } from '../../../src/domain/entities/Faction';

describe('GetFactionStatusQuery', () => {
  let query: GetFactionStatusQuery;
  let mockKingdomRepository: jest.Mocked<IKingdomRepository>;

  beforeEach(() => {
    mockKingdomRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      exists: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn()
    };

    query = new GetFactionStatusQuery(mockKingdomRepository);
  });

  describe('execute', () => {
    it('should return faction status successfully', async () => {
      const mockKingdom = new Kingdom('Test Kingdom');
      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);

      const result = await query.execute('kingdom1');

      expect(result).toHaveLength(5);
      
      const nobilityFaction = result.find(f => f.type === 'Nobility');
      expect(nobilityFaction).toBeDefined();
      expect(nobilityFaction).toMatchObject({
        name: 'The Noble Houses',
        description: 'Nobility',
        loyalty: 50,
        influence: 50,
        mood: 'Neutral',
        type: 'Nobility'
      });

      const merchantsFaction = result.find(f => f.type === 'Merchants');
      expect(merchantsFaction).toBeDefined();
      expect(merchantsFaction).toMatchObject({
        name: 'The Merchant Guild',
        description: 'Merchants',
        loyalty: 50,
        influence: 50,
        mood: 'Neutral',
        type: 'Merchants'
      });
    });

    it('should throw error if kingdom ID is empty', async () => {
      await expect(query.execute('')).rejects.toThrow('Kingdom ID is required');
    });

    it('should throw error if kingdom not found', async () => {
      mockKingdomRepository.findById.mockResolvedValue(null);

      await expect(query.execute('non-existent-kingdom')).rejects.toThrow('Kingdom not found');
    });

    it('should reflect different faction moods based on approval rating', async () => {
      const mockKingdom = new Kingdom('Test Kingdom');
      
      // Create factions with different approval ratings
      const factions = new Map<string, Faction>();
      const hostile = new Faction('Nobility', 'The Noble Houses');
      hostile.changeApproval(-40); // Should be 10, making it Hostile
      
      const unhappy = new Faction('Merchants', 'The Merchant Guild');
      unhappy.changeApproval(-20); // Should be 30, making it Unhappy
      
      const neutral = new Faction('Military', 'The Royal Army');
      // Default is 50, should be Neutral
      
      const content = new Faction('Clergy', 'The Church');
      content.changeApproval(20); // Should be 70, making it Content
      
      const loyal = new Faction('Commoners', 'The Common Folk');
      loyal.changeApproval(40); // Should be 90, making it Loyal
      
      factions.set('Nobility', hostile);
      factions.set('Merchants', unhappy);
      factions.set('Military', neutral);
      factions.set('Clergy', content);
      factions.set('Commoners', loyal);
      
      // Mock the factions getter
      jest.spyOn(mockKingdom, 'factions', 'get').mockReturnValue(factions);
      
      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);

      const result = await query.execute('kingdom1');

      expect(result.find(f => f.type === 'Nobility')?.mood).toBe('Hostile');
      expect(result.find(f => f.type === 'Merchants')?.mood).toBe('Unhappy');
      expect(result.find(f => f.type === 'Military')?.mood).toBe('Neutral');
      expect(result.find(f => f.type === 'Clergy')?.mood).toBe('Content');
      expect(result.find(f => f.type === 'Commoners')?.mood).toBe('Loyal');
    });
  });
});