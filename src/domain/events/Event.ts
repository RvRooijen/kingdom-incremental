import { Resources } from '../value-objects/Resources';

export enum EventType {
  Political = 'Political',
  Economic = 'Economic',
  Military = 'Military',
  Social = 'Social',
  Diplomatic = 'Diplomatic'
}

export class ResourceRequirement {
  public readonly gold: number;
  public readonly influence: number;
  public readonly loyalty: number;
  public readonly population: number;
  public readonly militaryPower: number;

  constructor(resources: {
    gold: number;
    influence: number;
    loyalty: number;
    population: number;
    militaryPower: number;
  }) {
    this.gold = resources.gold;
    this.influence = resources.influence;
    this.loyalty = resources.loyalty;
    this.population = resources.population;
    this.militaryPower = resources.militaryPower;
  }

  isSatisfiedBy(available: Resources): boolean {
    return available.gold >= this.gold &&
           available.influence >= this.influence &&
           available.loyalty >= this.loyalty &&
           available.population >= this.population &&
           available.militaryPower >= this.militaryPower;
  }
}

export class EventConsequence {
  public readonly resourceChange: Resources;
  public readonly stabilityChange: number;
  public readonly loyaltyChange: number;
  public readonly description: string;

  constructor(params: {
    resourceChange: Resources;
    stabilityChange: number;
    loyaltyChange: number;
    description: string;
  }) {
    this.resourceChange = params.resourceChange;
    this.stabilityChange = params.stabilityChange;
    this.loyaltyChange = params.loyaltyChange;
    this.description = params.description;
  }
}

export class EventChoice {
  public readonly description: string;
  public readonly requirements: ResourceRequirement;
  public readonly immediateEffect: EventConsequence;
  public readonly longTermEffects: EventConsequence[];

  constructor(params: {
    description: string;
    requirements: ResourceRequirement;
    immediateEffect: EventConsequence;
    longTermEffects: EventConsequence[];
  }) {
    this.description = params.description;
    this.requirements = params.requirements;
    this.immediateEffect = params.immediateEffect;
    this.longTermEffects = params.longTermEffects;
  }

  canBeChosen(availableResources: Resources): boolean {
    return this.requirements.isSatisfiedBy(availableResources);
  }
}

export abstract class Event {
  public readonly id: string;
  public readonly title: string;
  public readonly description: string;
  public readonly type: EventType;
  public readonly choices: EventChoice[];
  public readonly expiresAt: Date | undefined;

  constructor(
    id: string,
    title: string,
    description: string,
    type: EventType,
    choices: EventChoice[],
    expiresAt?: Date
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.type = type;
    this.choices = choices;
    this.expiresAt = expiresAt;
  }

  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  getAvailableChoices(availableResources: Resources): EventChoice[] {
    return this.choices.filter(choice => choice.canBeChosen(availableResources));
  }
}