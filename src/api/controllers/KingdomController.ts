import { Request, Response, NextFunction } from 'express';
import { CreateKingdomCommand } from '../../application/commands/CreateKingdomCommand';
import { GetKingdomStateQuery } from '../../application/queries/GetKingdomStateQuery';
import { IKingdomRepository } from '../../application/interfaces/IKingdomRepository';
import { IUnitOfWork } from '../../application/interfaces/IUnitOfWork';
import { Kingdom } from '../../domain/entities/Kingdom';
import { VercelKVRepository } from '../../infrastructure/repositories/VercelKVRepository';

// Mock implementation of IKingdomRepository
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
      kingdom.calculateResourceGeneration(1);
      
      // Save the updated kingdom
      await this.kingdomRepository.save(kingdom);
      
      // Return the updated state
      const updatedState = await this.getKingdomStateQuery.execute(id);
      res.json(updatedState);
    } catch (error) {
      next(error);
    }
  };
}