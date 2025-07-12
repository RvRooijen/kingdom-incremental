import { RecruitAdvisorCommand } from '../../../src/application/commands/RecruitAdvisorCommand';
import { IKingdomRepository } from '../../../src/application/interfaces/IKingdomRepository';
import { IUnitOfWork } from '../../../src/application/interfaces/IUnitOfWork';
import { Kingdom } from '../../../src/domain/entities/Kingdom';

describe('RecruitAdvisorCommand', () => {
  let command: RecruitAdvisorCommand;
  let mockKingdomRepository: jest.Mocked<IKingdomRepository>;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;

  beforeEach(() => {
    mockKingdomRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      exists: jest.fn(),
      findByName: jest.fn()
    };

    mockUnitOfWork = {
      begin: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    };

    command = new RecruitAdvisorCommand(mockKingdomRepository, mockUnitOfWork);
  });

  describe('execute', () => {
    const mockKingdom = new Kingdom('Test Kingdom');

    it('should recruit advisor successfully when all conditions are met', async () => {
      // For this test, we need to mock a kingdom with enough resources
      // We'll need to create a mock that bypasses the resource checks
      const input = {
        kingdomId: 'kingdom1',
        advisorName: 'Test Advisor',
        specialty: 'Military' as const
      };

      // Mock a kingdom with plenty of resources
      const richKingdom = new Kingdom('Rich Kingdom');
      // Mock the resources getter to return high values
      jest.spyOn(richKingdom, 'resources', 'get').mockReturnValue({
        gold: 1000,
        influence: 100,
        loyalty: 50,
        population: 1000,
        militaryPower: 10,
        add: jest.fn(),
        subtract: jest.fn()
      } as any);

      mockKingdomRepository.findById.mockResolvedValue(richKingdom);
      mockKingdomRepository.save.mockResolvedValue(undefined);

      const result = await command.execute(input);

      expect(result.success).toBe(true);
      expect(result.advisor).toBeDefined();
      expect(result.advisor?.name).toBe('Test Advisor');
      expect(result.advisor?.specialty).toBe('Military');
      expect(result.advisor?.effectiveness).toBeGreaterThanOrEqual(70);
      expect(result.advisor?.effectiveness).toBeLessThanOrEqual(100);

      expect(mockUnitOfWork.begin).toHaveBeenCalled();
      expect(mockKingdomRepository.save).toHaveBeenCalledWith(richKingdom);
      expect(mockUnitOfWork.commit).toHaveBeenCalled();
    });

    it('should fail when insufficient gold for military advisor', async () => {
      const input = {
        kingdomId: 'kingdom1',
        advisorName: 'Merlin',
        specialty: 'Military' as const
      };

      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);
      mockKingdomRepository.save.mockResolvedValue(undefined);

      const result = await command.execute(input);

      // The command returns false when resources are insufficient
      // Since the default kingdom starts with 100 gold and we need 150 for Military advisor
      expect(result.success).toBe(false);
      expect(result.cost).toEqual({ gold: 150, influence: 10 });
      expect(result.message).toContain('Insufficient gold');

      expect(mockUnitOfWork.begin).toHaveBeenCalled();
    });

    it('should fail to recruit diplomatic advisor due to insufficient influence', async () => {
      const input = {
        kingdomId: 'kingdom1',
        advisorName: 'Ambassador Wilhelm',
        specialty: 'Diplomatic' as const // Costs 100 gold (ok), 25 influence (not enough)
      };

      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);
      mockKingdomRepository.save.mockResolvedValue(undefined);

      const result = await command.execute(input);

      // Kingdom starts with 10 influence, but needs 25
      expect(result.success).toBe(false);
      expect(result.cost).toEqual({ gold: 100, influence: 25 });
      expect(result.message).toContain('Insufficient influence');

      expect(mockUnitOfWork.begin).toHaveBeenCalled();
    });

    it('should throw error if kingdom ID is missing', async () => {
      const input = {
        kingdomId: '',
        advisorName: 'Merlin',
        specialty: 'Military' as const
      };

      await expect(command.execute(input)).rejects.toThrow('Kingdom ID is required');
    });

    it('should throw error if advisor name is empty', async () => {
      const input = {
        kingdomId: 'kingdom1',
        advisorName: '',
        specialty: 'Military' as const
      };

      await expect(command.execute(input)).rejects.toThrow('Advisor name is required');
    });

    it('should throw error if advisor name is too long', async () => {
      const input = {
        kingdomId: 'kingdom1',
        advisorName: 'A'.repeat(51),
        specialty: 'Military' as const
      };

      await expect(command.execute(input)).rejects.toThrow('Advisor name must be 50 characters or less');
    });

    it('should throw error if specialty is invalid', async () => {
      const input = {
        kingdomId: 'kingdom1',
        advisorName: 'Merlin',
        specialty: 'Invalid' as any
      };

      await expect(command.execute(input)).rejects.toThrow('Invalid specialty');
    });

    it('should throw error if kingdom not found', async () => {
      const input = {
        kingdomId: 'kingdom1',
        advisorName: 'Merlin',
        specialty: 'Military' as const
      };

      mockKingdomRepository.findById.mockResolvedValue(null);

      await expect(command.execute(input)).rejects.toThrow('Kingdom not found');
    });

    it('should return appropriate costs for each specialty', async () => {
      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);

      const specialties = [
        { type: 'Military' as const, cost: { gold: 150, influence: 10 } },
        { type: 'Economic' as const, cost: { gold: 200, influence: 15 } },
        { type: 'Diplomatic' as const, cost: { gold: 100, influence: 25 } },
        { type: 'Religious' as const, cost: { gold: 100, influence: 20 } },
        { type: 'Administrative' as const, cost: { gold: 150, influence: 15 } }
      ];

      for (const { type, cost } of specialties) {
        const result = await command.execute({
          kingdomId: 'kingdom1',
          advisorName: 'Test Advisor',
          specialty: type
        });

        expect(result.cost).toEqual(cost);
      }
    });

    it('should fail if insufficient gold', async () => {
      const input = {
        kingdomId: 'kingdom1',
        advisorName: 'Expensive Advisor',
        specialty: 'Economic' as const // Costs 200 gold
      };

      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);

      const result = await command.execute(input);
      
      // Kingdom starts with 100 gold, but Economic advisor costs 200
      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient gold');
    });

    it('should not rollback when insufficient resources', async () => {
      const input = {
        kingdomId: 'kingdom1',
        advisorName: 'Test Advisor',
        specialty: 'Religious' as const // Costs 100 gold, 20 influence (not enough)
      };

      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);

      const result = await command.execute(input);

      // Should return failure but not throw
      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient influence');
      expect(mockUnitOfWork.rollback).not.toHaveBeenCalled();
    });
  });
});