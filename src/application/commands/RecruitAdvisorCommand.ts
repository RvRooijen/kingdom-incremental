import { RecruitAdvisorInputDto, RecruitAdvisorOutputDto } from '../dtos/RecruitAdvisorDto';
import { IKingdomRepository } from '../interfaces/IKingdomRepository';
import { IUnitOfWork } from '../interfaces/IUnitOfWork';
import { ResourceType } from '../../domain/value-objects/ResourceType';

export class RecruitAdvisorCommand {
  constructor(
    private readonly kingdomRepository: IKingdomRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(input: RecruitAdvisorInputDto): Promise<RecruitAdvisorOutputDto> {
    // Validation
    if (!input.kingdomId) {
      throw new Error('Kingdom ID is required');
    }

    if (!input.advisorName || input.advisorName.trim().length === 0) {
      throw new Error('Advisor name is required');
    }

    if (input.advisorName.length > 50) {
      throw new Error('Advisor name must be 50 characters or less');
    }

    const validSpecialties = ['Military', 'Economic', 'Diplomatic', 'Religious', 'Administrative'];
    if (!validSpecialties.includes(input.specialty)) {
      throw new Error('Invalid specialty. Must be one of: ' + validSpecialties.join(', '));
    }

    await this.unitOfWork.begin();

    try {
      // Fetch kingdom
      const kingdom = await this.kingdomRepository.findById(input.kingdomId);
      if (!kingdom) {
        throw new Error('Kingdom not found');
      }

      // Define costs based on specialty
      const costs = {
        Military: { gold: 150, influence: 10 },
        Economic: { gold: 200, influence: 15 },
        Diplomatic: { gold: 100, influence: 25 },
        Religious: { gold: 100, influence: 20 },
        Administrative: { gold: 150, influence: 15 }
      };

      const cost = costs[input.specialty];

      // Check if kingdom has enough resources
      if (kingdom.getResource(ResourceType.GOLD) < cost.gold) {
        return {
          success: false,
          cost,
          message: 'Insufficient gold to recruit advisor'
        };
      }

      if (kingdom.getResource(ResourceType.INFLUENCE) < cost.influence) {
        return {
          success: false,
          cost,
          message: 'Insufficient influence to recruit advisor'
        };
      }

      // Check if court has space (assuming max 5 advisors)
      const currentAdvisorCount = kingdom.getAdvisors().length;
      if (currentAdvisorCount >= 5) {
        return {
          success: false,
          cost,
          message: 'Royal court is full. Maximum 5 advisors allowed.'
        };
      }

      // Generate advisor ID and effectiveness
      const advisorId = `advisor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const effectiveness = Math.floor(Math.random() * 30) + 70; // 70-100

      // Deduct resources from kingdom
      kingdom.addResource(ResourceType.GOLD, -cost.gold);
      kingdom.addResource(ResourceType.INFLUENCE, -cost.influence);
      
      // Add advisor to kingdom
      // Map specialty to AdvisorType
      const advisorTypeMap: { [key: string]: any } = {
        'treasurer': 'TREASURER',
        'spymaster': 'SPYMASTER',
        'chaplain': 'CHAPLAIN'
      };
      
      const advisorType = advisorTypeMap[input.specialty.toLowerCase()];
      if (advisorType) {
        kingdom.addAdvisor(advisorType);
      }

      await this.kingdomRepository.save(kingdom);
      await this.unitOfWork.commit();

      return {
        success: true,
        advisor: {
          id: advisorId,
          name: input.advisorName,
          specialty: input.specialty,
          effectiveness
        },
        cost,
        message: `Successfully recruited ${input.advisorName} as ${input.specialty} advisor`
      };
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}