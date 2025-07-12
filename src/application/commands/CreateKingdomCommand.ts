import { CreateKingdomInputDto, CreateKingdomOutputDto } from '../dtos/CreateKingdomDto';
import { IKingdomRepository } from '../interfaces/IKingdomRepository';
import { IUnitOfWork } from '../interfaces/IUnitOfWork';
import { Kingdom } from '../../domain/entities/Kingdom';
import { Ruler } from '../../domain/entities/Ruler';
import { ValidationError, ConflictError } from '../errors/ApplicationError';

export class CreateKingdomCommand {
  constructor(
    private readonly kingdomRepository: IKingdomRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(input: CreateKingdomInputDto): Promise<CreateKingdomOutputDto> {
    // Validation
    if (!input.kingdomName || input.kingdomName.trim().length === 0) {
      throw new ValidationError('Kingdom name is required');
    }

    if (!input.rulerName || input.rulerName.trim().length === 0) {
      throw new ValidationError('Ruler name is required');
    }

    if (input.kingdomName.length > 50) {
      throw new ValidationError('Kingdom name must be 50 characters or less');
    }

    if (input.rulerName.length > 50) {
      throw new ValidationError('Ruler name must be 50 characters or less');
    }

    // Check if kingdom name already exists
    const existingKingdom = await this.kingdomRepository.findByName(input.kingdomName);
    if (existingKingdom) {
      throw new ConflictError('A kingdom with this name already exists');
    }

    await this.unitOfWork.begin();

    try {
      // Create domain entities
      const kingdom = new Kingdom(input.kingdomName);
      const ruler = new Ruler('King', input.rulerName);
      
      // In a real implementation, we would associate the ruler with the kingdom
      // For now, we'll keep it simple
      
      await this.kingdomRepository.save(kingdom);
      await this.unitOfWork.commit();

      return {
        kingdomId: kingdom.id,
        kingdomName: kingdom.name,
        rulerName: ruler.name,
        createdAt: new Date()
      };
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}