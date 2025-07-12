import { ResourceType } from '../value-objects/ResourceType';

export interface AchievementRequirement {
  type: 'kingdom_created' | 'resource' | 'all_factions_approval' | 'events_completed' | 'prestige_level' | 'advisors' | 'total_resources';
  resource?: ResourceType;
  amount?: number;
  minApproval?: number;
  prestigeLevel?: number;
  advisorCount?: number;
}

export interface AchievementReward {
  resources?: { [key in ResourceType]?: number };
  multipliers?: { [key in ResourceType]?: number };
  other?: any;
}

export class Achievement {
  private _isUnlocked: boolean = false;

  constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _requirement: AchievementRequirement,
    private readonly _reward?: AchievementReward
  ) {}

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get requirement(): AchievementRequirement {
    return this._requirement;
  }

  get reward(): AchievementReward | undefined {
    return this._reward;
  }

  get isUnlocked(): boolean {
    return this._isUnlocked;
  }

  unlock(): void {
    this._isUnlocked = true;
  }
}