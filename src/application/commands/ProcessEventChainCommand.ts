import { IKingdomRepository } from '../interfaces/IKingdomRepository';
import { IEventRepository } from '../interfaces/IEventRepository';
import { IUnitOfWork } from '../interfaces/IUnitOfWork';
import { ApplicationError } from '../errors/ApplicationError';
import { EventChainService, ChainContext } from '../../domain/services/EventChainService';
import { EventChainManager } from '../../domain/services/EventChainManager';
import { Event } from '../../domain/events/Event';
import { Resources } from '../../domain/value-objects/Resources';

export interface ProcessEventChainDto {
  kingdomId: string;
  eventId: string;
  choiceId: string;
}

export class ProcessEventChainCommand {
  constructor(
    private kingdomRepository: IKingdomRepository,
    private eventRepository: IEventRepository,
    private unitOfWork: IUnitOfWork,
    private chainManager: EventChainManager
  ) {}

  async execute(dto: ProcessEventChainDto): Promise<void> {
    const kingdom = await this.kingdomRepository.findById(dto.kingdomId);
    if (!kingdom) {
      throw new ApplicationError('Kingdom not found', 404);
    }

    const eventDto = await this.eventRepository.findById(dto.eventId);
    if (!eventDto) {
      throw new ApplicationError('Event not found', 404);
    }

    // Check if event is part of a chain
    if (!eventDto.chainData) {
      throw new ApplicationError('Event is not part of a chain', 400);
    }

    const choice = eventDto.choices.find(c => c.id === dto.choiceId);
    if (!choice) {
      throw new ApplicationError('Invalid choice', 400);
    }

    // Get chain context
    const chainChoices = await this.eventRepository.getChainChoices(
      dto.kingdomId,
      eventDto.chainData.chainId
    );

    const context: ChainContext = {
      chainId: eventDto.chainData.chainId,
      previousChoices: chainChoices,
      currentPosition: eventDto.chainData.chainPosition
    };

    // Save the choice
    await this.eventRepository.saveChainChoice(
      dto.kingdomId,
      eventDto.chainData.chainId,
      {
        eventId: dto.eventId,
        choiceId: dto.choiceId,
        timestamp: new Date()
      }
    );

    // Mark event as processed
    await this.eventRepository.markAsProcessed(dto.eventId, dto.kingdomId);

    // Apply immediate effects (simplified - would need proper Event instance)
    if (choice.requirements) {
      const cost = new Resources({
        gold: choice.requirements.gold || 0,
        influence: choice.requirements.influence || 0,
        loyalty: choice.requirements.loyalty || 0,
        population: 0,
        militaryPower: choice.requirements.militaryPower || 0
      });
      kingdom.adjustResources(cost.negate());
    }

    // Check if this completes the chain
    const isLastEvent = !eventDto.chainData.nextEventId;
    if (isLastEvent) {
      // Process chain completion
      this.chainManager.processChainCompletion(
        kingdom,
        eventDto.chainData.chainId,
        context
      );
    } else {
      // Activate next event in chain
      const nextEvent = await this.eventRepository.findById(eventDto.chainData.nextEventId);
      if (nextEvent) {
        await this.eventRepository.activateForKingdom(
          eventDto.chainData.nextEventId,
          dto.kingdomId
        );
      }
    }

    // Save kingdom state
    await this.kingdomRepository.save(kingdom);
    await this.unitOfWork.commit();
  }
}