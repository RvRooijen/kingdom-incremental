import { CreateKingdomCommand } from '../../../src/application/commands/CreateKingdomCommand';
import { IKingdomRepository } from '../../../src/application/interfaces/IKingdomRepository';
import { IUnitOfWork } from '../../../src/application/interfaces/IUnitOfWork';
import { Kingdom } from '../../../src/domain/entities/Kingdom';

describe('CreateKingdomCommand', () => {
  let command: CreateKingdomCommand;
  let mockKingdomRepository: jest.Mocked<IKingdomRepository>;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;

  beforeEach(() => {
    mockKingdomRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      exists: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn()
    };

    mockUnitOfWork = {
      begin: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    };

    command = new CreateKingdomCommand(mockKingdomRepository, mockUnitOfWork);
  });

  describe('execute', () => {
    it('should create a kingdom successfully', async () => {
      const input = {
        kingdomName: 'Avalon',
        rulerName: 'Arthur'
      };

      mockKingdomRepository.findByName.mockResolvedValue(null);
      mockKingdomRepository.save.mockResolvedValue(undefined);

      const result = await command.execute(input);

      expect(result).toMatchObject({
        kingdomName: 'Avalon',
        rulerName: 'Arthur'
      });
      expect(result.kingdomId).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);

      expect(mockUnitOfWork.begin).toHaveBeenCalled();
      expect(mockKingdomRepository.save).toHaveBeenCalled();
      expect(mockUnitOfWork.commit).toHaveBeenCalled();
    });

    it('should throw error if kingdom name is empty', async () => {
      const input = {
        kingdomName: '',
        rulerName: 'Arthur'
      };

      await expect(command.execute(input)).rejects.toThrow('Kingdom name is required');
    });

    it('should throw error if ruler name is empty', async () => {
      const input = {
        kingdomName: 'Avalon',
        rulerName: ''
      };

      await expect(command.execute(input)).rejects.toThrow('Ruler name is required');
    });

    it('should throw error if kingdom name is too long', async () => {
      const input = {
        kingdomName: 'A'.repeat(51),
        rulerName: 'Arthur'
      };

      await expect(command.execute(input)).rejects.toThrow('Kingdom name must be 50 characters or less');
    });

    it('should throw error if ruler name is too long', async () => {
      const input = {
        kingdomName: 'Avalon',
        rulerName: 'A'.repeat(51)
      };

      await expect(command.execute(input)).rejects.toThrow('Ruler name must be 50 characters or less');
    });

    it('should throw error if kingdom name already exists', async () => {
      const input = {
        kingdomName: 'Avalon',
        rulerName: 'Arthur'
      };

      const existingKingdom = new Kingdom('Avalon');
      mockKingdomRepository.findByName.mockResolvedValue(existingKingdom);

      await expect(command.execute(input)).rejects.toThrow('A kingdom with this name already exists');
    });

    it('should rollback on error', async () => {
      const input = {
        kingdomName: 'Avalon',
        rulerName: 'Arthur'
      };

      mockKingdomRepository.findByName.mockResolvedValue(null);
      mockKingdomRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(command.execute(input)).rejects.toThrow('Database error');
      expect(mockUnitOfWork.rollback).toHaveBeenCalled();
    });
  });
});