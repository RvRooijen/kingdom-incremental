import { ResourceType } from '../value-objects/ResourceType';
import { AdvisorType } from '../value-objects/AdvisorType';

export interface ResourceConfig {
  baseGenerationRate: number;
  advisorMultiplier: number;
  prestigeMultiplier: number;
  baseCost: number;
  costMultiplier: number;
}

export interface AdvisorConfig {
  baseCost: Map<ResourceType, number>;
  effectMultiplier: number;
  maxCount: number;
}

export interface FactionConfig {
  name: string;
  description: string;
  baseInfluence: number;
  maxInfluence: number;
  decayRate: number;
  eventWeight: number;
  bonuses: {
    resourceType: ResourceType;
    multiplier: number;
  }[];
}

export interface EventConfig {
  id: string;
  title: string;
  description: string;
  type: 'political' | 'economic' | 'military' | 'social' | 'diplomatic' | 'faction';
  weight: number;
  requirements?: {
    minResources?: Map<ResourceType, number>;
    minPrestigeLevel?: number;
    minFactionInfluence?: Map<string, number>;
  };
  choices: EventChoiceConfig[];
}

export interface EventChoiceConfig {
  id: string;
  text: string;
  consequences: EventConsequenceConfig;
}

export interface EventConsequenceConfig {
  resources?: Map<ResourceType, number>;
  factionInfluence?: Map<string, number>;
  description: string;
  achievement?: string;
}

export interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  requirements: {
    resources?: Map<ResourceType, number>;
    prestigeLevel?: number;
    advisorCount?: number;
    completedEvents?: number;
    factionInfluence?: Map<string, number>;
  };
  reward?: {
    prestigeBonus?: number;
    resourceMultiplier?: Map<ResourceType, number>;
  };
}

export interface PrestigeConfig {
  baseRequirement: Map<ResourceType, number>;
  requirementMultiplier: number;
  bonusPerLevel: {
    resourceMultiplier: number;
    advisorCostReduction: number;
    eventFrequencyBonus: number;
  };
}

export class GameConfig {
  public resources: Map<ResourceType, ResourceConfig>;
  public advisors: Map<AdvisorType, AdvisorConfig>;
  public factions: FactionConfig[];
  public events: EventConfig[];
  public achievements: AchievementConfig[];
  public prestige: PrestigeConfig;
  public general: {
    tickRate: number;
    saveInterval: number;
    maxActiveEvents: number;
    eventSpawnChance: number;
  };

  constructor() {
    // Default configuration
    this.resources = new Map([
      [ResourceType.GOLD, {
        baseGenerationRate: 1,
        advisorMultiplier: 1.5,
        prestigeMultiplier: 1.2,
        baseCost: 100,
        costMultiplier: 1.5
      }],
      [ResourceType.INFLUENCE, {
        baseGenerationRate: 0.8,
        advisorMultiplier: 1.3,
        prestigeMultiplier: 1.15,
        baseCost: 150,
        costMultiplier: 1.4
      }],
      [ResourceType.FAITH, {
        baseGenerationRate: 0.5,
        advisorMultiplier: 2,
        prestigeMultiplier: 1.25,
        baseCost: 200,
        costMultiplier: 1.8
      }],
      [ResourceType.KNOWLEDGE, {
        baseGenerationRate: 0.3,
        advisorMultiplier: 2.5,
        prestigeMultiplier: 1.3,
        baseCost: 300,
        costMultiplier: 2
      }],
      [ResourceType.LOYALTY, {
        baseGenerationRate: 0.2,
        advisorMultiplier: 3,
        prestigeMultiplier: 1.1,
        baseCost: 100,
        costMultiplier: 1.5
      }]
    ]);

    this.advisors = new Map([
      [AdvisorType.TREASURER, {
        baseCost: new Map([[ResourceType.GOLD, 100]]),
        effectMultiplier: 1.5,
        maxCount: 10
      }],
      [AdvisorType.CHANCELLOR, {
        baseCost: new Map([[ResourceType.GOLD, 150], [ResourceType.INFLUENCE, 50]]),
        effectMultiplier: 1.8,
        maxCount: 8
      }],
      [AdvisorType.MARSHAL, {
        baseCost: new Map([[ResourceType.GOLD, 200], [ResourceType.INFLUENCE, 30]]),
        effectMultiplier: 2,
        maxCount: 6
      }],
      [AdvisorType.SPYMASTER, {
        baseCost: new Map([[ResourceType.GOLD, 250], [ResourceType.KNOWLEDGE, 50]]),
        effectMultiplier: 2.2,
        maxCount: 5
      }],
      [AdvisorType.COURT_CHAPLAIN, {
        baseCost: new Map([[ResourceType.GOLD, 180], [ResourceType.FAITH, 40]]),
        effectMultiplier: 1.6,
        maxCount: 6
      }]
    ]);

    this.factions = [
      {
        name: 'Nobility',
        description: 'The aristocratic elite of your kingdom',
        baseInfluence: 30,
        maxInfluence: 100,
        decayRate: 0.1,
        eventWeight: 1.5,
        bonuses: [
          { resourceType: ResourceType.GOLD, multiplier: 1.2 },
          { resourceType: ResourceType.INFLUENCE, multiplier: 1.1 }
        ]
      },
      {
        name: 'Clergy',
        description: 'The religious leaders and spiritual guides',
        baseInfluence: 25,
        maxInfluence: 100,
        decayRate: 0.05,
        eventWeight: 1.3,
        bonuses: [
          { resourceType: ResourceType.FAITH, multiplier: 1.3 }
        ]
      },
      {
        name: 'Merchants',
        description: 'The traders and business owners',
        baseInfluence: 20,
        maxInfluence: 100,
        decayRate: 0.15,
        eventWeight: 1.2,
        bonuses: [
          { resourceType: ResourceType.GOLD, multiplier: 1.5 }
        ]
      },
      {
        name: 'Commoners',
        description: 'The common people of your kingdom',
        baseInfluence: 15,
        maxInfluence: 100,
        decayRate: 0.2,
        eventWeight: 1,
        bonuses: [
          { resourceType: ResourceType.INFLUENCE, multiplier: 1.3 }
        ]
      },
      {
        name: 'Military',
        description: 'The armed forces and warriors',
        baseInfluence: 25,
        maxInfluence: 100,
        decayRate: 0.1,
        eventWeight: 1.4,
        bonuses: [
          { resourceType: ResourceType.INFLUENCE, multiplier: 1.2 },
          { resourceType: ResourceType.GOLD, multiplier: 1.1 }
        ]
      }
    ];

    this.events = [];
    this.achievements = [];
    
    this.prestige = {
      baseRequirement: new Map([
        [ResourceType.GOLD, 1000],
        [ResourceType.INFLUENCE, 500],
        [ResourceType.FAITH, 300],
        [ResourceType.KNOWLEDGE, 200]
      ]),
      requirementMultiplier: 2.5,
      bonusPerLevel: {
        resourceMultiplier: 0.1,
        advisorCostReduction: 0.05,
        eventFrequencyBonus: 0.1
      }
    };

    this.general = {
      tickRate: 1000,
      saveInterval: 30000,
      maxActiveEvents: 3,
      eventSpawnChance: 0.05
    };
  }

  public toJSON(): object {
    return {
      resources: Object.fromEntries(this.resources),
      advisors: Object.fromEntries(
        Array.from(this.advisors.entries()).map(([key, value]) => [
          key,
          {
            ...value,
            baseCost: Object.fromEntries(value.baseCost)
          }
        ])
      ),
      factions: this.factions,
      events: this.events,
      achievements: this.achievements,
      prestige: {
        ...this.prestige,
        baseRequirement: Object.fromEntries(this.prestige.baseRequirement)
      },
      general: this.general
    };
  }

  public static fromJSON(json: any): GameConfig {
    const config = new GameConfig();
    
    if (json.resources) {
      config.resources = new Map(
        Object.entries(json.resources).map(([key, value]) => [
          key as ResourceType,
          value as ResourceConfig
        ])
      );
    }
    
    if (json.advisors) {
      config.advisors = new Map(
        Object.entries(json.advisors).map(([key, value]: [string, any]) => [
          key as AdvisorType,
          {
            ...value,
            baseCost: new Map(Object.entries(value.baseCost))
          }
        ])
      );
    }
    
    if (json.factions) {
      config.factions = json.factions;
    }
    
    if (json.events) {
      config.events = json.events.map((event: any) => ({
        ...event,
        requirements: event.requirements ? {
          ...event.requirements,
          minResources: event.requirements.minResources ? 
            new Map(Object.entries(event.requirements.minResources)) : undefined,
          minFactionInfluence: event.requirements.minFactionInfluence ?
            new Map(Object.entries(event.requirements.minFactionInfluence)) : undefined
        } : undefined,
        choices: event.choices.map((choice: any) => ({
          ...choice,
          consequences: {
            ...choice.consequences,
            resources: choice.consequences.resources ?
              new Map(Object.entries(choice.consequences.resources)) : undefined,
            factionInfluence: choice.consequences.factionInfluence ?
              new Map(Object.entries(choice.consequences.factionInfluence)) : undefined
          }
        }))
      }));
    }
    
    if (json.achievements) {
      config.achievements = json.achievements.map((achievement: any) => ({
        ...achievement,
        requirements: {
          ...achievement.requirements,
          resources: achievement.requirements.resources ?
            new Map(Object.entries(achievement.requirements.resources)) : undefined,
          factionInfluence: achievement.requirements.factionInfluence ?
            new Map(Object.entries(achievement.requirements.factionInfluence)) : undefined
        },
        reward: achievement.reward ? {
          ...achievement.reward,
          resourceMultiplier: achievement.reward.resourceMultiplier ?
            new Map(Object.entries(achievement.reward.resourceMultiplier)) : undefined
        } : undefined
      }));
    }
    
    if (json.prestige) {
      config.prestige = {
        ...json.prestige,
        baseRequirement: new Map(Object.entries(json.prestige.baseRequirement))
      };
    }
    
    if (json.general) {
      config.general = json.general;
    }
    
    return config;
  }
}