import { Request, Response, NextFunction } from 'express';
import { ProcessEventChainCommand } from '../../application/commands/ProcessEventChainCommand';
import { GetEventChainProgressQuery } from '../../application/queries/GetEventChainProgressQuery';
import { ApplicationError } from '../../application/errors/ApplicationError';

export class EventChainController {
  constructor(
    private processChainCommand: ProcessEventChainCommand,
    private getChainProgressQuery: GetEventChainProgressQuery
  ) {}

  async processChainChoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { kingdomId, eventId } = req.params;
      const { choiceId } = req.body;

      if (!choiceId) {
        throw new ApplicationError('Choice ID is required', 400);
      }

      await this.processChainCommand.execute({
        kingdomId,
        eventId,
        choiceId
      });

      res.status(200).json({
        success: true,
        message: 'Chain event choice processed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getChainProgress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { kingdomId, chainId } = req.params;

      const progress = await this.getChainProgressQuery.execute(
        kingdomId,
        chainId
      );

      if (!progress) {
        throw new ApplicationError('Chain not found or not started', 404);
      }

      res.status(200).json(progress);
    } catch (error) {
      next(error);
    }
  }

  async getAllChainProgress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { kingdomId } = req.params;

      const allProgress = await this.getChainProgressQuery.getAllChainProgress(
        kingdomId
      );

      res.status(200).json({
        chains: allProgress
      });
    } catch (error) {
      next(error);
    }
  }
}