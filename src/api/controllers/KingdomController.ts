import { Request, Response, NextFunction } from 'express';
import { CreateKingdomCommand } from '../../application/commands/CreateKingdomCommand';
import { GetKingdomStateQuery } from '../../application/queries/GetKingdomStateQuery';
import { IKingdomRepository } from '../../application/interfaces/IKingdomRepository';
import { IUnitOfWork } from '../../application/interfaces/IUnitOfWork';
import { Kingdom } from '../../domain/entities/Kingdom';

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
    this.kingdomRepository = new MockKingdomRepository();
    this.unitOfWork = new MockUnitOfWork();
    this.createKingdomCommand = new CreateKingdomCommand(this.kingdomRepository, this.unitOfWork);
    this.getKingdomStateQuery = new GetKingdomStateQuery(this.kingdomRepository);
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
      
      // First check if kingdom exists using the query
      const kingdomState = await this.getKingdomStateQuery.execute(id);
      if (!kingdomState) {
        res.status(404).json({ error: 'Kingdom not found' });
        return;
      }
      
      // For now, just return the current state
      // In a real implementation, we would:
      // 1. Load the domain entity
      // 2. Calculate tick
      // 3. Save it
      // 4. Return the updated state
      res.json(kingdomState);
    } catch (error) {
      next(error);
    }
  };
}