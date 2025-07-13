import { Request, Response, NextFunction } from 'express';
import { CreateKingdomCommand } from '../../application/commands/CreateKingdomCommand';
import { RecruitAdvisorCommand } from '../../application/commands/RecruitAdvisorCommand';
import { GetKingdomStateQuery } from '../../application/queries/GetKingdomStateQuery';
import { IKingdomRepository } from '../../application/interfaces/IKingdomRepository';
import { IUnitOfWork } from '../../application/interfaces/IUnitOfWork';
import { Kingdom } from '../../domain/entities/Kingdom';
import { VercelKVRepository } from '../../infrastructure/repositories/VercelKVRepository';
import { ResourceType } from '../../domain/value-objects/ResourceType';

// Mock implementation of IKingdomRepository
class MockKingdomRepository implements IKingdomRepository {
  private kingdoms = new Map<string, Kingdom>();

  async findById(id: string): Promise<Kingdom | null> {
    const stored = this.kingdoms.get(id);
    if (!stored) return null;
    
    // Use the static factory method to reconstruct the kingdom
    return Kingdom.fromStoredData(stored);
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
    // Create a serialized version with all necessary data
    const kingdomData = {
      id: kingdom.id,
      name: kingdom.name,
      resources: {
        gold: kingdom.resources.gold,
        influence: kingdom.resources.influence,
        loyalty: kingdom.resources.loyalty,
        population: kingdom.resources.population,
        militaryPower: kingdom.resources.militaryPower
      },
      resourceMap: [
        [ResourceType.GOLD, kingdom.getResource(ResourceType.GOLD)],
        [ResourceType.INFLUENCE, kingdom.getResource(ResourceType.INFLUENCE)],
        [ResourceType.FAITH, kingdom.getResource(ResourceType.FAITH)],
        [ResourceType.KNOWLEDGE, kingdom.getResource(ResourceType.KNOWLEDGE)]
      ],
      court: kingdom.court,
      factions: Array.from(kingdom.factions.entries()).map(([key, faction]) => ({
        key,
        type: faction.type,
        name: faction.name,
        approvalRating: faction.approvalRating,
        mood: faction.mood
      })),
      prestigeLevel: kingdom.prestigeLevel || 0,
      completedEventsCount: kingdom.completedEventsCount || 0,
      lastCalculation: kingdom.getLastCalculation()
    };
    
    // Store the serialized version
    this.kingdoms.set(kingdom.id, kingdomData as any);
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
      
      // Load kingdom and calculate offline progress
      const kingdom = await this.kingdomRepository.findById(id);
      if (!kingdom) {
        res.status(404).json({ error: 'Kingdom not found' });
        return;
      }
      
      // Calculate offline progress since last calculation
      const now = Date.now();
      const lastCalc = kingdom.getLastCalculation();
      const timeElapsed = Math.floor((now - lastCalc) / 1000); // seconds
      
      if (timeElapsed > 0) {
        // Apply offline progress
        await kingdom.calculateResourceGeneration(timeElapsed);
        
        // Save the updated kingdom
        await this.kingdomRepository.save(kingdom);
      }
      
      // Get the updated state
      const kingdomState = await this.getKingdomStateQuery.execute(id);
      
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