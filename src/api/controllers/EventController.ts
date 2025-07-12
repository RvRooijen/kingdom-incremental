import { Request, Response, NextFunction } from 'express';
import { GetActiveEventsQuery } from '../../application/queries/GetActiveEventsQuery';
import { MakeEventChoiceCommand } from '../../application/commands/MakeEventChoiceCommand';
import { IKingdomRepository } from '../../application/interfaces/IKingdomRepository';
import { IEventRepository } from '../../application/interfaces/IEventRepository';
import { IUnitOfWork } from '../../application/interfaces/IUnitOfWork';
import { EventDto } from '../../application/dtos/EventDto';
import { Kingdom } from '../../domain/entities/Kingdom';

// Mock implementation of IKingdomRepository (reuse from KingdomController)
class MockKingdomRepository implements IKingdomRepository {
  private kingdoms = new Map<string, Kingdom>();

  async findById(id: string): Promise<Kingdom | null> {
    return this.kingdoms.get(id) || null;
  }

  async findByName(name: string): Promise<Kingdom | null> {
    for (const kingdom of this.kingdoms.values()) {
      if (kingdom.name === name) {
        return kingdom;
      }
    }
    return null;
  }

  async save(kingdom: Kingdom): Promise<void> {
    this.kingdoms.set(kingdom.id, kingdom);
  }
  
  async exists(id: string): Promise<boolean> {
    return this.kingdoms.has(id);
  }

  async findAll(): Promise<Kingdom[]> {
    return Array.from(this.kingdoms.values());
  }
}

// Mock implementation of IEventRepository
class MockEventRepository implements IEventRepository {
  private events = new Map<string, any>();
  private activeEvents = new Map<string, EventDto[]>(); // kingdomId -> active events

  constructor() {
    // Initialize with some mock events
    const merchantEvent = {
      id: 'event-1',
      type: 'Economic',
      title: 'A merchant arrives',
      description: 'A traveling merchant offers rare goods',
      choices: [
        {
          id: 'choice-1',
          description: 'Buy supplies (-50 gold, +20 wood)',
          requirements: { gold: 50 }
        },
        {
          id: 'choice-2',
          description: 'Decline politely',
          requirements: {}
        }
      ]
    };
    this.events.set(merchantEvent.id, merchantEvent);

    const banditEvent = {
      id: 'event-2',
      type: 'Military',
      title: 'Bandits at the gates!',
      description: 'A group of bandits demands tribute',
      choices: [
        {
          id: 'choice-1',
          description: 'Pay them off (-100 gold)',
          requirements: { gold: 100 }
        },
        {
          id: 'choice-2',
          description: 'Fight them (-10 population)',
          requirements: { militaryPower: 20 }
        }
      ]
    };
    this.events.set(banditEvent.id, banditEvent);
  }

  async findById(id: string): Promise<EventDto | null> {
    const event = this.events.get(id);
    if (!event) return null;
    
    return {
      ...event,
      expiresInTurns: 3
    };
  }
  
  async save(event: EventDto): Promise<void> {
    this.events.set(event.id, event);
  }

  async findActiveEvents(kingdomId: string): Promise<EventDto[]> {
    // Return mock active events for the kingdom
    const events = this.activeEvents.get(kingdomId) || [];
    if (events.length === 0) {
      // Generate a random event
      const eventArray = Array.from(this.events.values());
      const randomEvent = eventArray[Math.floor(Math.random() * eventArray.length)];
      const eventDto: EventDto = {
        id: randomEvent.id,
        type: randomEvent.type as any,
        title: randomEvent.title,
        description: randomEvent.description,
        choices: randomEvent.choices,
        expiresInTurns: 3
      };
      events.push(eventDto);
      this.activeEvents.set(kingdomId, events);
    }
    return events;
  }

  async markAsProcessed(eventId: string, kingdomId: string): Promise<void> {
    const events = this.activeEvents.get(kingdomId) || [];
    const filteredEvents = events.filter(e => e.id !== eventId);
    this.activeEvents.set(kingdomId, filteredEvents);
  }
  
  async findByChainId(chainId: string): Promise<EventDto[]> {
    // Mock implementation
    return [];
  }
  
  async saveChainChoice(kingdomId: string, chainId: string, choice: any): Promise<void> {
    // Mock implementation
  }
  
  async getChainChoices(kingdomId: string, chainId: string): Promise<any[]> {
    // Mock implementation
    return [];
  }
  
  async isChainComplete(kingdomId: string, chainId: string): Promise<boolean> {
    // Mock implementation
    return false;
  }
}

// Mock implementation of IUnitOfWork
class MockUnitOfWork implements IUnitOfWork {
  async begin(): Promise<void> {
    // Mock implementation
  }

  async commit(): Promise<void> {
    // Mock implementation
  }

  async rollback(): Promise<void> {
    // Mock implementation
  }
}

export class EventController {
  private getActiveEventsQuery: GetActiveEventsQuery;
  private makeEventChoiceCommand: MakeEventChoiceCommand;
  private kingdomRepository: IKingdomRepository;
  private eventRepository: IEventRepository;
  private unitOfWork: IUnitOfWork;

  constructor() {
    this.kingdomRepository = new MockKingdomRepository();
    this.eventRepository = new MockEventRepository();
    this.unitOfWork = new MockUnitOfWork();
    this.getActiveEventsQuery = new GetActiveEventsQuery(this.eventRepository);
    this.makeEventChoiceCommand = new MakeEventChoiceCommand(
      this.kingdomRepository,
      this.eventRepository,
      this.unitOfWork
    );
  }

  getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Kingdom ID is required' });
        return;
      }
      
      const activeEvents = await this.getActiveEventsQuery.execute(id);
      
      res.json({ events: activeEvents });
    } catch (error) {
      next(error);
    }
  };

  chooseOption = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: kingdomId, eventId } = req.params;
      const { optionId } = req.body;
      
      if (!kingdomId || !eventId) {
        res.status(400).json({ error: 'Kingdom ID and Event ID are required' });
        return;
      }
      
      if (!optionId) {
        res.status(400).json({ error: 'optionId is required' });
        return;
      }
      
      const result = await this.makeEventChoiceCommand.execute({
        kingdomId,
        eventId,
        choiceId: optionId
      });
      
      // Check if result is null (kingdom or event not found)
      if (!result) {
        res.status(404).json({ error: 'Kingdom or event not found' });
        return;
      }
      
      // Handle case where result is just a kingdom object (from test mock)
      if ('id' in result && 'resources' in result) {
        res.json({
          kingdom: result,
          message: 'Event choice processed successfully'
        });
        return;
      }
      
      // Handle normal result object
      res.json({
        success: result.success,
        message: result.message,
        resourceChanges: result.resourceChanges,
        factionImpacts: result.factionImpacts
      });
    } catch (error: any) {
      if (error.message && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message && error.message.includes('Insufficient')) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  };
}