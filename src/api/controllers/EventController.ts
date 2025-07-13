import { Request, Response, NextFunction } from 'express';
import { GetActiveEventsQuery } from '../../application/queries/GetActiveEventsQuery';
import { MakeEventChoiceCommand } from '../../application/commands/MakeEventChoiceCommand';
import { IKingdomRepository } from '../../application/interfaces/IKingdomRepository';
import { IEventRepository } from '../../application/interfaces/IEventRepository';
import { IUnitOfWork } from '../../application/interfaces/IUnitOfWork';
import { Kingdom } from '../../domain/entities/Kingdom';
import { ConfigEventRepository } from '../../infrastructure/repositories/ConfigEventRepository';
import { VercelKVRepository } from '../../infrastructure/repositories/VercelKVRepository';

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
    // Use Vercel KV in production, mock in development
    const useVercelKV = process.env['KV_REST_API_URL'] && process.env['NODE_ENV'] === 'production';
    
    this.kingdomRepository = useVercelKV 
      ? new VercelKVRepository()
      : new MockKingdomRepository();
      
    // Use ConfigEventRepository to load events from GameConfig
    this.eventRepository = new ConfigEventRepository();
    this.unitOfWork = new MockUnitOfWork();
    
    this.getActiveEventsQuery = new GetActiveEventsQuery(this.eventRepository);
    this.makeEventChoiceCommand = new MakeEventChoiceCommand(
      this.kingdomRepository,
      this.eventRepository,
      this.unitOfWork
    );
    
    console.log(`Using ${useVercelKV ? 'Vercel KV' : 'Mock'} kingdom repository`);
    console.log('Using ConfigEventRepository for events');
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

  activateRandomEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: kingdomId } = req.params;
      
      if (!kingdomId) {
        res.status(400).json({ error: 'Kingdom ID is required' });
        return;
      }
      
      // Get the kingdom
      const kingdom = await this.kingdomRepository.findById(kingdomId);
      if (!kingdom) {
        res.status(404).json({ error: 'Kingdom not found' });
        return;
      }
      
      // Activate random events based on game config
      if (this.eventRepository instanceof ConfigEventRepository) {
        await this.eventRepository.activateRandomEvents(kingdomId, kingdom, 3);
      }
      
      // Get the newly activated events
      const activeEvents = await this.getActiveEventsQuery.execute(kingdomId);
      
      res.json({ 
        success: true,
        message: `Activated ${activeEvents.length} events`,
        events: activeEvents 
      });
    } catch (error) {
      next(error);
    }
  };
}