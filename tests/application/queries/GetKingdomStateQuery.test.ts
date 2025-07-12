import { GetKingdomStateQuery } from '../../../src/application/queries/GetKingdomStateQuery';
import { IKingdomRepository } from '../../../src/application/interfaces/IKingdomRepository';
import { Kingdom } from '../../../src/domain/entities/Kingdom';

describe('GetKingdomStateQuery', () => {
  let query: GetKingdomStateQuery;
  let mockKingdomRepository: jest.Mocked<IKingdomRepository>;

  beforeEach(() => {
    mockKingdomRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      exists: jest.fn(),
      findByName: jest.fn()
    };

    query = new GetKingdomStateQuery(mockKingdomRepository);
  });

  describe('execute', () => {
    it('should return kingdom state successfully', async () => {
      const mockKingdom = new Kingdom('Test Kingdom');
      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);

      const result = await query.execute('kingdom1');

      expect(result).toBeDefined();
      expect(result?.kingdomId).toBe(mockKingdom.id);
      expect(result?.kingdomName).toBe('Test Kingdom');
      expect(result?.rulerName).toBe('The King');
      expect(result?.resources).toEqual({
        gold: 100,
        influence: 10,
        loyalty: 50,
        population: 1000,
        militaryPower: 10
      });
      expect(result?.advisors).toEqual([]);
      expect(result?.factions).toHaveLength(5);
      expect(result?.currentTurn).toBe(1);
    });

    it('should return faction information correctly', async () => {
      const mockKingdom = new Kingdom('Test Kingdom');
      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);

      const result = await query.execute('kingdom1');

      expect(result?.factions).toContainEqual({
        name: 'The Noble Houses',
        description: 'Nobility',
        loyalty: 50,
        influence: 50
      });
      expect(result?.factions).toContainEqual({
        name: 'The Merchant Guild',
        description: 'Merchants',
        loyalty: 50,
        influence: 50
      });
    });

    it('should throw error if kingdom ID is empty', async () => {
      await expect(query.execute('')).rejects.toThrow('Kingdom ID is required');
    });

    it('should return null if kingdom not found', async () => {
      mockKingdomRepository.findById.mockResolvedValue(null);

      const result = await query.execute('non-existent-kingdom');

      expect(result).toBeNull();
    });

    it('should handle advisors if present', async () => {
      const mockKingdom = new Kingdom('Test Kingdom');
      
      // Mock the court advisors Map to have some advisors
      const mockAdvisors = new Map([
        ['advisor1', { name: 'Merlin', specialty: 'Military', effectiveness: 85 }],
        ['advisor2', { name: 'Gandalf', specialty: 'Diplomatic', effectiveness: 90 }]
      ]);
      
      // We need to mock the getter since we can't modify the private property
      jest.spyOn(mockKingdom.court, 'advisors', 'get').mockReturnValue(mockAdvisors);

      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);

      const result = await query.execute('kingdom1');

      expect(result?.advisors).toHaveLength(2);
      expect(result?.advisors).toContainEqual({
        id: 'advisor1',
        name: 'Merlin',
        specialty: 'Military',
        effectiveness: 85
      });
      expect(result?.advisors).toContainEqual({
        id: 'advisor2',
        name: 'Gandalf',
        specialty: 'Diplomatic',
        effectiveness: 90
      });
    });
  });
});