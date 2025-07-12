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
      findByName: jest.fn(),
      findAll: jest.fn()
    };

    query = new GetKingdomStateQuery(mockKingdomRepository);
  });

  describe('execute', () => {
    it('should return kingdom state successfully', async () => {
      const mockKingdom = new Kingdom('Test Kingdom');
      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);

      const result = await query.execute('kingdom1');

      expect(result).toBeDefined();
      expect((result as any)?.id).toBe(mockKingdom.id);
      expect((result as any)?.name).toBe('Test Kingdom');
      expect(result?.resources).toEqual({
        gold: 100,
        influence: 10,
        loyalty: 50,
        population: 1000,
        militaryPower: 10
      });
      expect((result as any)?.court.advisors).toEqual([]);
      expect(result?.factions).toHaveLength(5);
      expect((result as any)?.prestigeLevel).toBe(0);
      expect((result as any)?.completedEventsCount).toBe(0);
    });

    it('should return faction information correctly', async () => {
      const mockKingdom = new Kingdom('Test Kingdom');
      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);

      const result = await query.execute('kingdom1');

      expect(result?.factions).toContainEqual({
        type: 'Nobility',
        name: 'The Noble Houses',
        approvalRating: 50,
        mood: 'Neutral'
      });
      expect(result?.factions).toContainEqual({
        type: 'Merchants',
        name: 'The Merchant Guild',
        approvalRating: 50,
        mood: 'Neutral'
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

      expect((result as any)?.court.advisors).toHaveLength(2);
      const advisorsArray = Array.from((result as any)?.court.advisors.values() || []);
      expect(advisorsArray).toContainEqual({
        name: 'Merlin',
        specialty: 'Military',
        effectiveness: 85
      });
      expect(advisorsArray).toContainEqual({
        name: 'Gandalf',
        specialty: 'Diplomatic',
        effectiveness: 90
      });
    });
  });
});