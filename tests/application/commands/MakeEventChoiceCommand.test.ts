import { MakeEventChoiceCommand } from '../../../src/application/commands/MakeEventChoiceCommand';
import { IKingdomRepository } from '../../../src/application/interfaces/IKingdomRepository';
import { IEventRepository } from '../../../src/application/interfaces/IEventRepository';
import { IUnitOfWork } from '../../../src/application/interfaces/IUnitOfWork';
import { Kingdom } from '../../../src/domain/entities/Kingdom';
import { EventDto } from '../../../src/application/dtos/EventDto';

describe('MakeEventChoiceCommand', () => {
  let command: MakeEventChoiceCommand;
  let mockKingdomRepository: jest.Mocked<IKingdomRepository>;
  let mockEventRepository: jest.Mocked<IEventRepository>;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;

  beforeEach(() => {
    mockKingdomRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      exists: jest.fn(),
      findByName: jest.fn()
    };

    mockEventRepository = {
      findActiveEvents: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      markAsProcessed: jest.fn()
    };

    mockUnitOfWork = {
      begin: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    };

    command = new MakeEventChoiceCommand(
      mockKingdomRepository,
      mockEventRepository,
      mockUnitOfWork
    );
  });

  describe('execute', () => {
    const mockKingdom = new Kingdom('Test Kingdom');
    const mockEvent: EventDto = {
      id: 'event1',
      title: 'Trade Agreement',
      description: 'A merchant guild offers a trade agreement',
      type: 'Economic',
      choices: [
        {
          id: 'choice1',
          description: 'Accept the agreement',
          requirements: {
            gold: 50,
            influence: 10
          }
        },
        {
          id: 'choice2',
          description: 'Decline the agreement'
        }
      ],
      expiresInTurns: 3
    };

    it('should execute choice successfully', async () => {
      const input = {
        kingdomId: 'kingdom1',
        eventId: 'event1',
        choiceId: 'choice1'
      };

      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);
      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await command.execute(input);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully made choice');
      expect(result.resourceChanges).toBeDefined();
      expect(result.factionImpacts).toBeDefined();

      expect(mockUnitOfWork.begin).toHaveBeenCalled();
      expect(mockEventRepository.markAsProcessed).toHaveBeenCalledWith('event1', 'kingdom1');
      expect(mockKingdomRepository.save).toHaveBeenCalledWith(mockKingdom);
      expect(mockUnitOfWork.commit).toHaveBeenCalled();
    });

    it('should throw error if kingdom ID is missing', async () => {
      const input = {
        kingdomId: '',
        eventId: 'event1',
        choiceId: 'choice1'
      };

      await expect(command.execute(input)).rejects.toThrow('Kingdom ID is required');
    });

    it('should throw error if event ID is missing', async () => {
      const input = {
        kingdomId: 'kingdom1',
        eventId: '',
        choiceId: 'choice1'
      };

      await expect(command.execute(input)).rejects.toThrow('Event ID is required');
    });

    it('should throw error if choice ID is missing', async () => {
      const input = {
        kingdomId: 'kingdom1',
        eventId: 'event1',
        choiceId: ''
      };

      await expect(command.execute(input)).rejects.toThrow('Choice ID is required');
    });

    it('should throw error if kingdom not found', async () => {
      const input = {
        kingdomId: 'kingdom1',
        eventId: 'event1',
        choiceId: 'choice1'
      };

      mockKingdomRepository.findById.mockResolvedValue(null);

      await expect(command.execute(input)).rejects.toThrow('Kingdom not found');
    });

    it('should throw error if event not found', async () => {
      const input = {
        kingdomId: 'kingdom1',
        eventId: 'event1',
        choiceId: 'choice1'
      };

      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);
      mockEventRepository.findById.mockResolvedValue(null);

      await expect(command.execute(input)).rejects.toThrow('Event not found');
    });

    it('should throw error if choice not found', async () => {
      const input = {
        kingdomId: 'kingdom1',
        eventId: 'event1',
        choiceId: 'invalid-choice'
      };

      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);
      mockEventRepository.findById.mockResolvedValue(mockEvent);

      await expect(command.execute(input)).rejects.toThrow('Choice not found');
    });

    it('should throw error if insufficient resources', async () => {
      const input = {
        kingdomId: 'kingdom1',
        eventId: 'event1',
        choiceId: 'choice1'
      };

      // Kingdom starts with 100 gold, but we need a way to reduce it
      // Since Resources is immutable and Kingdom doesn't expose a way to change resources,
      // we'll use a different test approach
      
      const poorKingdom = new Kingdom('Poor Kingdom');
      // In a real implementation, we'd need a way to set initial resources
      
      mockKingdomRepository.findById.mockResolvedValue(poorKingdom);
      mockEventRepository.findById.mockResolvedValue({
        ...mockEvent,
        choices: [{
          id: 'choice1',
          description: 'Expensive choice',
          requirements: {
            gold: 1000 // More than default starting gold
          }
        }]
      });

      await expect(command.execute(input)).rejects.toThrow('Insufficient gold');
    });

    it('should rollback on error', async () => {
      const input = {
        kingdomId: 'kingdom1',
        eventId: 'event1',
        choiceId: 'choice1'
      };

      mockKingdomRepository.findById.mockResolvedValue(mockKingdom);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockKingdomRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(command.execute(input)).rejects.toThrow('Database error');
      expect(mockUnitOfWork.rollback).toHaveBeenCalled();
    });
  });
});