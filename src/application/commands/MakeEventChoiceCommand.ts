import { MakeEventChoiceInputDto, EventChoiceResultDto } from '../dtos/EventChoiceDto';
import { IKingdomRepository } from '../interfaces/IKingdomRepository';
import { IEventRepository } from '../interfaces/IEventRepository';
import { IUnitOfWork } from '../interfaces/IUnitOfWork';

export class MakeEventChoiceCommand {
  constructor(
    private readonly kingdomRepository: IKingdomRepository,
    private readonly eventRepository: IEventRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(input: MakeEventChoiceInputDto): Promise<EventChoiceResultDto> {
    // Validation
    if (!input.kingdomId) {
      throw new Error('Kingdom ID is required');
    }

    if (!input.eventId) {
      throw new Error('Event ID is required');
    }

    if (!input.choiceId) {
      throw new Error('Choice ID is required');
    }

    await this.unitOfWork.begin();

    try {
      // Fetch kingdom
      const kingdom = await this.kingdomRepository.findById(input.kingdomId);
      if (!kingdom) {
        throw new Error('Kingdom not found');
      }

      // Fetch event
      const event = await this.eventRepository.findById(input.eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Find the choice
      const choice = event.choices.find(c => c.id === input.choiceId);
      if (!choice) {
        throw new Error('Choice not found');
      }

      // Check requirements
      if (choice.requirements) {
        const resources = kingdom.resources;
        
        if (choice.requirements.gold && resources.gold < choice.requirements.gold) {
          throw new Error('Insufficient gold');
        }
        
        if (choice.requirements.influence && resources.influence < choice.requirements.influence) {
          throw new Error('Insufficient influence');
        }
        
        if (choice.requirements.loyalty && resources.loyalty < choice.requirements.loyalty) {
          throw new Error('Insufficient loyalty');
        }
        
        if (choice.requirements.militaryPower && resources.militaryPower < choice.requirements.militaryPower) {
          throw new Error('Insufficient military power');
        }
      }

      // Mark event as processed
      await this.eventRepository.markAsProcessed(input.eventId, input.kingdomId);

      // Save kingdom state
      await this.kingdomRepository.save(kingdom);
      await this.unitOfWork.commit();

      // Return result (in a real implementation, this would come from the event processing)
      return {
        success: true,
        message: `Successfully made choice: ${choice.description}`,
        resourceChanges: {
          gold: -10,
          influence: 5
        },
        factionImpacts: [
          {
            factionName: 'Merchants',
            loyaltyChange: 5,
            influenceChange: 2
          }
        ]
      };
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}