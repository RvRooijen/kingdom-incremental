import { Kingdom } from '../entities/Kingdom';
import { ResourceType } from '../value-objects/ResourceType';

export interface PrestigeBonuses {
  resourceMultiplier: number;
  advisorSlots: number;
  factionRelationRetention: number;
}

export interface PrestigeResetData {
  newResources: Map<ResourceType, number>;
  retainedFactionRelations: Map<string, number>;
}

export interface PrestigeResult {
  success: boolean;
  error?: string;
  newPrestigeLevel?: number;
  bonuses?: PrestigeBonuses;
}

export class PrestigeService {
  private readonly EVENTS_REQUIRED_FOR_PRESTIGE = 10;
  private readonly BASE_RESOURCE_MULTIPLIER_PER_LEVEL = 0.1; // 10% per level
  private readonly ADVISOR_SLOTS_PER_LEVEL = 1;
  private readonly FACTION_RETENTION_PER_LEVEL = 0.1; // 10% per level
  private readonly MAX_FACTION_RETENTION = 0.9; // 90% max

  calculatePrestigeBonuses(prestigeLevel: number): PrestigeBonuses {
    return {
      resourceMultiplier: 1 + (prestigeLevel * this.BASE_RESOURCE_MULTIPLIER_PER_LEVEL),
      advisorSlots: prestigeLevel * this.ADVISOR_SLOTS_PER_LEVEL,
      factionRelationRetention: Math.min(
        prestigeLevel * this.FACTION_RETENTION_PER_LEVEL,
        this.MAX_FACTION_RETENTION
      )
    };
  }

  calculatePrestigePoints(kingdom: Kingdom): number {
    let points = 0;

    // Points from resources (1 point per 1000 resources)
    const resourceTypes = [
      ResourceType.GOLD,
      ResourceType.INFLUENCE,
      ResourceType.FAITH,
      ResourceType.KNOWLEDGE
    ];

    for (const type of resourceTypes) {
      points += Math.floor(kingdom.getResource(type) / 1000);
    }

    // Points from faction relations (1 point per 10 approval above 50)
    for (const faction of kingdom.factions.values()) {
      if (faction.approvalRating > 50) {
        points += Math.floor((faction.approvalRating - 50) / 10);
      }
    }

    // Points from advisors (5 points per advisor)
    points += kingdom.getAdvisors().length * 5;

    return points;
  }

  preparePrestigeReset(kingdom: Kingdom, newPrestigeLevel: number): PrestigeResetData {
    const bonuses = this.calculatePrestigeBonuses(newPrestigeLevel);
    
    // Reset resources to starting values
    const newResources = new Map<ResourceType, number>([
      [ResourceType.GOLD, 100], // Starting gold
      [ResourceType.INFLUENCE, 0],
      [ResourceType.FAITH, 0],
      [ResourceType.KNOWLEDGE, 0]
    ]);

    // Calculate retained faction relations
    const retainedFactionRelations = new Map<string, number>();
    for (const [factionName, faction] of kingdom.factions) {
      const currentApproval = faction.approvalRating;
      const baseApproval = 50;
      const difference = currentApproval - baseApproval;
      const retainedDifference = difference * bonuses.factionRelationRetention;
      retainedFactionRelations.set(factionName, retainedDifference);
    }

    return {
      newResources,
      retainedFactionRelations
    };
  }

  canPrestige(kingdom: Kingdom): boolean {
    return kingdom.completedEventsCount >= this.EVENTS_REQUIRED_FOR_PRESTIGE;
  }

  getPrestigeRequirements(): { eventsRequired: number } {
    return {
      eventsRequired: this.EVENTS_REQUIRED_FOR_PRESTIGE
    };
  }
}