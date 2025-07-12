import { GetActiveEventsQuery } from '../../../src/application/queries/GetActiveEventsQuery';
import { IEventRepository } from '../../../src/application/interfaces/IEventRepository';
import { EventDto } from '../../../src/application/dtos/EventDto';

describe('GetActiveEventsQuery', () => {
  let query: GetActiveEventsQuery;
  let mockEventRepository: jest.Mocked<IEventRepository>;

  beforeEach(() => {
    mockEventRepository = {
      findActiveEvents: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      markAsProcessed: jest.fn(),
      findByChainId: jest.fn(),
      saveChainChoice: jest.fn(),
      getChainChoices: jest.fn(),
      isChainComplete: jest.fn()
    };

    query = new GetActiveEventsQuery(mockEventRepository);
  });

  describe('execute', () => {
    const mockEvents: EventDto[] = [
      {
        id: 'event1',
        title: 'Trade Agreement',
        description: 'A merchant guild offers a trade agreement',
        type: 'Economic',
        choices: [
          {
            id: 'choice1',
            description: 'Accept the agreement',
            requirements: { gold: 50 }
          },
          {
            id: 'choice2',
            description: 'Decline the agreement'
          }
        ],
        expiresInTurns: 3
      },
      {
        id: 'event2',
        title: 'Urgent Military Threat',
        description: 'Bandits are threatening the borders',
        type: 'Military',
        choices: [
          {
            id: 'choice1',
            description: 'Send troops',
            requirements: { militaryPower: 20 }
          },
          {
            id: 'choice2',
            description: 'Pay them off',
            requirements: { gold: 100 }
          }
        ],
        expiresInTurns: 1
      },
      {
        id: 'event3',
        title: 'Religious Festival',
        description: 'The clergy requests funds for a festival',
        type: 'Religious',
        choices: [
          {
            id: 'choice1',
            description: 'Fund the festival',
            requirements: { gold: 30, influence: 5 }
          },
          {
            id: 'choice2',
            description: 'Decline politely'
          }
        ],
        expiresInTurns: 5
      }
    ];

    it('should return active events sorted by expiration', async () => {
      mockEventRepository.findActiveEvents.mockResolvedValue(mockEvents);

      const result = await query.execute('kingdom1');

      expect(result).toHaveLength(3);
      expect(result[0]?.id).toBe('event2'); // expires in 1 turn
      expect(result[1]?.id).toBe('event1'); // expires in 3 turns
      expect(result[2]?.id).toBe('event3'); // expires in 5 turns
    });

    it('should throw error if kingdom ID is empty', async () => {
      await expect(query.execute('')).rejects.toThrow('Kingdom ID is required');
    });

    it('should return empty array if no active events', async () => {
      mockEventRepository.findActiveEvents.mockResolvedValue([]);

      const result = await query.execute('kingdom1');

      expect(result).toEqual([]);
    });

    it('should handle events with same expiration correctly', async () => {
      const eventsWithSameExpiration: EventDto[] = [
        { ...mockEvents[0], expiresInTurns: 2 } as EventDto,
        { ...mockEvents[1], expiresInTurns: 2 } as EventDto,
        { ...mockEvents[2], expiresInTurns: 1 } as EventDto
      ];

      mockEventRepository.findActiveEvents.mockResolvedValue(eventsWithSameExpiration);

      const result = await query.execute('kingdom1');

      expect(result[0]?.expiresInTurns).toBe(1);
      expect(result[1]?.expiresInTurns).toBe(2);
      expect(result[2]?.expiresInTurns).toBe(2);
    });
  });
});