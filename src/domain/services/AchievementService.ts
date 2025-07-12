import { Achievement, AchievementRequirement } from '../entities/Achievement';
import { Kingdom } from '../entities/Kingdom';
import { ResourceType } from '../value-objects/ResourceType';

export class AchievementService {
  private achievements: Achievement[];

  constructor() {
    this.achievements = this.initializeAchievements();
  }

  private initializeAchievements(): Achievement[] {
    return [
      // Basic achievements
      new Achievement(
        'first-kingdom',
        'First Kingdom',
        'Create your first kingdom',
        { type: 'kingdom_created' },
        { resources: { [ResourceType.GOLD]: 50, [ResourceType.INFLUENCE]: 25 } }
      ),
      
      // Resource achievements
      new Achievement(
        'resource-hoarder',
        'Resource Hoarder',
        'Accumulate 1000 gold',
        { type: 'resource', resource: ResourceType.GOLD, amount: 1000 },
        { resources: { [ResourceType.GOLD]: 100, [ResourceType.INFLUENCE]: 50 } }
      ),
      
      new Achievement(
        'influential',
        'Influential',
        'Accumulate 500 influence',
        { type: 'resource', resource: ResourceType.INFLUENCE, amount: 500 },
        { resources: { [ResourceType.INFLUENCE]: 100, [ResourceType.FAITH]: 50 } }
      ),
      
      new Achievement(
        'faithful',
        'Faithful',
        'Accumulate 500 faith',
        { type: 'resource', resource: ResourceType.FAITH, amount: 500 },
        { resources: { [ResourceType.FAITH]: 100, [ResourceType.KNOWLEDGE]: 50 } }
      ),
      
      new Achievement(
        'scholar',
        'Scholar',
        'Accumulate 500 knowledge',
        { type: 'resource', resource: ResourceType.KNOWLEDGE, amount: 500 },
        { resources: { [ResourceType.KNOWLEDGE]: 100, [ResourceType.GOLD]: 50 } }
      ),
      
      new Achievement(
        'wealth-of-nations',
        'Wealth of Nations',
        'Accumulate 5000 gold',
        { type: 'resource', resource: ResourceType.GOLD, amount: 5000 },
        { resources: { [ResourceType.GOLD]: 500 }, multipliers: { [ResourceType.GOLD]: 1.1 } }
      ),
      
      // Faction achievements
      new Achievement(
        'popular-ruler',
        'Popular Ruler',
        'All factions have more than 60 approval',
        { type: 'all_factions_approval', minApproval: 60 },
        { resources: { [ResourceType.INFLUENCE]: 200 } }
      ),
      
      new Achievement(
        'beloved-monarch',
        'Beloved Monarch',
        'All factions have more than 80 approval',
        { type: 'all_factions_approval', minApproval: 80 },
        { resources: { [ResourceType.INFLUENCE]: 500 }, multipliers: { [ResourceType.INFLUENCE]: 1.2 } }
      ),
      
      // Event achievements
      new Achievement(
        'event-master',
        'Event Master',
        'Complete 25 events',
        { type: 'events_completed', amount: 25 },
        { resources: { [ResourceType.KNOWLEDGE]: 250 } }
      ),
      
      new Achievement(
        'event-legend',
        'Event Legend',
        'Complete 100 events',
        { type: 'events_completed', amount: 100 },
        { resources: { [ResourceType.KNOWLEDGE]: 1000 }, multipliers: { [ResourceType.KNOWLEDGE]: 1.15 } }
      ),
      
      // Prestige achievements
      new Achievement(
        'prestigious',
        'Prestigious',
        'Reach prestige level 1',
        { type: 'prestige_level', prestigeLevel: 1 },
        { multipliers: { [ResourceType.GOLD]: 1.25, [ResourceType.INFLUENCE]: 1.25 } }
      ),
      
      // Advisor achievements
      new Achievement(
        'full-court',
        'Full Court',
        'Have 5 advisors in your court',
        { type: 'advisors', advisorCount: 5 },
        { resources: { [ResourceType.INFLUENCE]: 300 } }
      ),
      
      // Combined resource achievements
      new Achievement(
        'balanced-ruler',
        'Balanced Ruler',
        'Have at least 1000 total resources',
        { type: 'total_resources', amount: 1000 },
        { resources: { 
          [ResourceType.GOLD]: 100,
          [ResourceType.INFLUENCE]: 100,
          [ResourceType.FAITH]: 100,
          [ResourceType.KNOWLEDGE]: 100
        }}
      ),
      
      new Achievement(
        'resource-magnate',
        'Resource Magnate',
        'Have at least 10000 total resources',
        { type: 'total_resources', amount: 10000 },
        { multipliers: { 
          [ResourceType.GOLD]: 1.1,
          [ResourceType.INFLUENCE]: 1.1,
          [ResourceType.FAITH]: 1.1,
          [ResourceType.KNOWLEDGE]: 1.1
        }}
      )
    ];
  }

  getAllAchievements(): Achievement[] {
    return [...this.achievements];
  }

  checkAchievements(kingdom: Kingdom): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of this.achievements) {
      if (!achievement.isUnlocked && this.checkRequirement(achievement.requirement, kingdom)) {
        this.unlockAchievement(achievement, kingdom);
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  private checkRequirement(requirement: AchievementRequirement, kingdom: Kingdom): boolean {
    switch (requirement.type) {
      case 'kingdom_created':
        return true; // Always true if kingdom exists

      case 'resource':
        if (!requirement.resource || requirement.amount === undefined) return false;
        return kingdom.getResource(requirement.resource) >= requirement.amount;

      case 'all_factions_approval':
        if (!requirement.minApproval) return false;
        for (const faction of kingdom.factions.values()) {
          if (faction.approvalRating < requirement.minApproval) {
            return false;
          }
        }
        return true;

      case 'events_completed':
        if (!requirement.amount) return false;
        return kingdom.completedEventsCount >= requirement.amount;

      case 'prestige_level':
        if (!requirement.prestigeLevel) return false;
        return kingdom.prestigeLevel >= requirement.prestigeLevel;

      case 'advisors':
        if (!requirement.advisorCount) return false;
        return kingdom.getAdvisors().length >= requirement.advisorCount;

      case 'total_resources':
        if (!requirement.amount) return false;
        const totalResources = 
          kingdom.getResource(ResourceType.GOLD) +
          kingdom.getResource(ResourceType.INFLUENCE) +
          kingdom.getResource(ResourceType.FAITH) +
          kingdom.getResource(ResourceType.KNOWLEDGE);
        return totalResources >= requirement.amount;

      default:
        return false;
    }
  }

  unlockAchievement(achievement: Achievement, kingdom: Kingdom): void {
    achievement.unlock();
    kingdom.addUnlockedAchievement(achievement.id);

    // Apply rewards
    if (achievement.reward) {
      if (achievement.reward.resources) {
        for (const [resource, amount] of Object.entries(achievement.reward.resources)) {
          kingdom.addResource(resource as ResourceType, amount);
        }
      }

      if (achievement.reward.multipliers) {
        // Multipliers would need to be implemented in the resource generation system
        // For now, we'll just track them in the kingdom
        kingdom.addAchievementMultipliers(achievement.reward.multipliers);
      }
    }
  }
}