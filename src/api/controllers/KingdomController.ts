import { Request, Response, NextFunction } from 'express';
import { CreateKingdomCommand } from '../../application/commands/CreateKingdomCommand';
import { RecruitAdvisorCommand } from '../../application/commands/RecruitAdvisorCommand';
import { GetKingdomStateQuery } from '../../application/queries/GetKingdomStateQuery';
import { IKingdomRepository } from '../../application/interfaces/IKingdomRepository';
import { IUnitOfWork } from '../../application/interfaces/IUnitOfWork';
import { Kingdom } from '../../domain/entities/Kingdom';
import { VercelKVRepository } from '../../infrastructure/repositories/VercelKVRepository';

// Mock implementation of IKingdomRepository
class MockKingdomRepository implements IKingdomRepository {
  private kingdoms = new Map<string, Kingdom>();

  async findById(id: string): Promise<Kingdom | null> {
    const stored = this.kingdoms.get(id);
    if (!stored) return null;
    
    // Reconstruct the kingdom from stored data
    const kingdom = new Kingdom(stored.name);
    (kingdom as any).id = stored.id;
    (kingdom as any).resources = stored.resources;
    (kingdom as any).court = stored.court;
    (kingdom as any).factions = new Map(stored.factions);
    (kingdom as any).prestigeLevel = stored.prestigeLevel || 0;
    (kingdom as any)._completedEventsCount = stored.completedEventsCount || 0;
    
    return kingdom;
  }

  async findByName(name: string): Promise<Kingdom | null> {
    for (const [id, stored] of this.kingdoms.entries()) {
      if ((stored as any).name === name) {
        return this.findById(id);
      }
    }
    return null;
  }

  async save(kingdom: Kingdom): Promise<void> {
    // Create a deep copy to preserve the state
    const kingdomCopy = JSON.parse(JSON.stringify({
      id: kingdom.id,
      name: kingdom.name,
      resources: kingdom.resources,
      court: kingdom.court,
      factions: Array.from(kingdom.factions.entries()),
      prestigeLevel: kingdom.prestigeLevel || 0,
      completedEventsCount: kingdom.completedEventsCount || 0
    }));
    
    // Store the serialized version
    this.kingdoms.set(kingdom.id, kingdomCopy as any);
  }
  
  async exists(id: string): Promise<boolean> {
    return this.kingdoms.has(id);
  }

  async findAll(): Promise<Kingdom[]> {
    const kingdoms: Kingdom[] = [];
    for (const id of this.kingdoms.keys()) {
      const kingdom = await this.findById(id);
      if (kingdom) kingdoms.push(kingdom);
    }
    return kingdoms;
  }
}

// Mock implementation of IUnitOfWork
class MockUnitOfWork implements IUnitOfWork {
  async begin(): Promise<void> {
    // Mock implementation - in real app would start a transaction
  }

  async commit(): Promise<void> {
    // Mock implementation - in real app would commit the transaction
  }

  async rollback(): Promise<void> {
    // Mock implementation - in real app would rollback the transaction
  }
}

export class KingdomController {
  private createKingdomCommand: CreateKingdomCommand;
  private recruitAdvisorCommand: RecruitAdvisorCommand;
  private getKingdomStateQuery: GetKingdomStateQuery;
  private kingdomRepository: IKingdomRepository;
  private unitOfWork: IUnitOfWork;

  constructor() {
    // Use Vercel KV in production, mock in development
    const useVercelKV = process.env['KV_REST_API_URL'] && process.env['NODE_ENV'] === 'production';
    
    this.kingdomRepository = useVercelKV 
      ? new VercelKVRepository()
      : new MockKingdomRepository();
      
    this.unitOfWork = new MockUnitOfWork();
    this.createKingdomCommand = new CreateKingdomCommand(this.kingdomRepository, this.unitOfWork);
    this.recruitAdvisorCommand = new RecruitAdvisorCommand(this.kingdomRepository, this.unitOfWork);
    this.getKingdomStateQuery = new GetKingdomStateQuery(this.kingdomRepository);
    
    console.log(`Using ${useVercelKV ? 'Vercel KV' : 'Mock'} repository`);
  }

  getKingdom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Kingdom ID is required' });
        return;
      }
      
      const kingdomState = await this.getKingdomStateQuery.execute(id);
      
      if (!kingdomState) {
        res.status(404).json({ error: 'Kingdom not found' });
        return;
      }
      
      res.json(kingdomState);
    } catch (error) {
      next(error);
    }
  };

  createKingdom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { kingdomName, rulerName } = req.body;
      
      if (!kingdomName || !rulerName) {
        res.status(400).json({ error: 'Kingdom name and ruler name are required' });
        return;
      }
      
      const result = await this.createKingdomCommand.execute({
        kingdomName,
        rulerName
      });
      
      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.name === 'ConflictError') {
        res.status(409).json({ error: error.message });
        return;
      }
      next(error);
    }
  };

  calculateTick = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Kingdom ID is required' });
        return;
      }
      
      // Load the domain entity
      const kingdom = await this.kingdomRepository.findById(id);
      if (!kingdom) {
        res.status(404).json({ error: 'Kingdom not found' });
        return;
      }
      
      // Calculate resource generation (1 second tick)
      await kingdom.calculateResourceGeneration(1);
      
      // Save the updated kingdom
      await this.kingdomRepository.save(kingdom);
      
      // Return the updated state
      const updatedState = await this.getKingdomStateQuery.execute(id);
      res.json(updatedState);
    } catch (error) {
      next(error);
    }
  };

  recruitAdvisor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { advisorName, specialty } = req.body;
      
      if (!id) {
        res.status(400).json({ error: 'Kingdom ID is required' });
        return;
      }
      
      if (!advisorName || !specialty) {
        res.status(400).json({ error: 'Advisor name and specialty are required' });
        return;
      }
      
      const result = await this.recruitAdvisorCommand.execute({
        kingdomId: id,
        advisorName,
        specialty
      });
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
          cost: result.cost
        });
        return;
      }
      
      res.json(result);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('Invalid') || error.message.includes('required')) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  };

  performPrestige = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Kingdom ID is required' });
        return;
      }
      
      // Load the domain entity
      const kingdom = await this.kingdomRepository.findById(id);
      if (!kingdom) {
        res.status(404).json({ error: 'Kingdom not found' });
        return;
      }
      
      // Perform prestige
      const result = kingdom.performPrestige();
      
      if (!result.success) {
        res.status(400).json({ 
          success: false, 
          message: result.error 
        });
        return;
      }
      
      // Save the updated kingdom
      await this.kingdomRepository.save(kingdom);
      
      // Return the result
      res.json({
        success: true,
        prestigeLevel: result.newPrestigeLevel,
        bonuses: result.bonuses
      });
    } catch (error) {
      next(error);
    }
  };
}