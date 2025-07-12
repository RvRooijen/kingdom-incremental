import { Faction, FactionMood } from '../entities/Faction';
import { Kingdom } from '../entities/Kingdom';
import { FactionEvent } from '../events/FactionEvent';

export interface FactionBonus {
  resourceMultiplier: number;
  stabilityBonus: number;
  productionBonus?: number;
  tradeBonus?: number;
  militaryBonus?: number;
}

export interface FactionRelations {
  [faction: string]: {
    [otherFaction: string]: number; // -1 to 1, where -1 is hostile, 0 is neutral, 1 is allied
  };
}

export interface FactionImpact {
  [faction: string]: number;
}

export interface ApprovalThresholds {
  rebellion: number;
  unrest: number;
  discontent: number;
  stable: number;
  supportive: number;
}

export class FactionService {
  private readonly factionRelations: FactionRelations = {
    'Nobility': {
      'Merchants': -0.3,    // Compete for influence
      'Military': 0.2,      // Need protection
      'Clergy': 0.1,        // Traditional allies
      'Commoners': -0.6     // Class conflict
    },
    'Merchants': {
      'Nobility': -0.3,     // Compete for influence
      'Military': -0.4,     // Military requisitions hurt trade
      'Clergy': -0.2,       // Different values
      'Commoners': 0.1      // Provide jobs
    },
    'Military': {
      'Nobility': 0.2,      // Serve nobility
      'Merchants': -0.4,    // Requisitions vs trade
      'Clergy': 0,          // Neutral
      'Commoners': -0.2     // Conscription
    },
    'Clergy': {
      'Nobility': 0.1,      // Traditional support
      'Merchants': -0.2,    // Material vs spiritual
      'Military': 0,        // Neutral
      'Commoners': 0.3      // Pastoral care
    },
    'Commoners': {
      'Nobility': -0.6,     // Class conflict
      'Merchants': 0.1,     // Employment
      'Military': -0.2,     // Conscription
      'Clergy': 0.3         // Spiritual support
    }
  };

  private readonly factionPowerBase: { [faction: string]: number } = {
    'Nobility': 1.5,      // High influence
    'Merchants': 1.2,     // Economic power
    'Military': 1.3,      // Force
    'Clergy': 1.0,        // Spiritual influence
    'Commoners': 0.8      // Numbers but less individual power
  };

  private readonly approvalThresholds: { [faction: string]: ApprovalThresholds } = {
    'Nobility': {
      rebellion: 15,      // Quick to rebel
      unrest: 30,
      discontent: 45,
      stable: 60,
      supportive: 80
    },
    'Merchants': {
      rebellion: 10,      // Very quick to withdraw support
      unrest: 25,
      discontent: 40,
      stable: 55,
      supportive: 75
    },
    'Military': {
      rebellion: 20,      // Disciplined, slower to rebel
      unrest: 35,
      discontent: 50,
      stable: 65,
      supportive: 85
    },
    'Clergy': {
      rebellion: 25,      // Most patient
      unrest: 40,
      discontent: 55,
      stable: 70,
      supportive: 85
    },
    'Commoners': {
      rebellion: 20,      // Takes time to organize
      unrest: 35,
      discontent: 50,
      stable: 60,
      supportive: 75
    }
  };

  calculateMoodBonus(faction: Faction): FactionBonus {
    const baseBonus: FactionBonus = {
      resourceMultiplier: 1,
      stabilityBonus: 0
    };

    const mood: FactionMood = faction.mood;
    switch (mood) {
      case 'Hostile':
        baseBonus.resourceMultiplier = 0.6;
        baseBonus.stabilityBonus = -20;
        break;
      case 'Unhappy':
        baseBonus.resourceMultiplier = 0.8;
        baseBonus.stabilityBonus = -10;
        break;
      case 'Neutral':
        baseBonus.resourceMultiplier = 1;
        baseBonus.stabilityBonus = 0;
        break;
      case 'Content':
        baseBonus.resourceMultiplier = 1.1;
        baseBonus.stabilityBonus = 5;
        break;
      case 'Loyal':
        baseBonus.resourceMultiplier = 1.2;
        baseBonus.stabilityBonus = 10;
        break;
    }

    // Apply faction-specific bonuses
    this.applyFactionSpecificBonuses(faction, baseBonus);

    return baseBonus;
  }

  private applyFactionSpecificBonuses(faction: Faction, bonus: FactionBonus): void {
    switch (faction.type) {
      case 'Merchants':
        bonus.tradeBonus = (bonus.resourceMultiplier - 1) * 2; // Double impact on trade
        break;
      case 'Military':
        bonus.militaryBonus = (bonus.resourceMultiplier - 1) * 1.5; // Impact on military strength
        break;
      case 'Commoners':
        bonus.productionBonus = (bonus.resourceMultiplier - 1) * 1.5; // Impact on production
        break;
    }
  }

  generateFactionEvent(kingdomId: string, faction: Faction): FactionEvent | null {
    const thresholds = this.approvalThresholds[faction.type] || {
      rebellion: 20,
      unrest: 35,
      discontent: 50,
      stable: 65,
      supportive: 80
    };
    
    const approval = faction.approvalRating;

    if (approval <= thresholds.rebellion) {
      return this.createFactionEvent(
        kingdomId,
        faction.type,
        'critical',
        this.getRandomRebellionEvent(faction.type)
      );
    } else if (approval <= thresholds.unrest) {
      return this.createFactionEvent(
        kingdomId,
        faction.type,
        'severe',
        this.getRandomUnrestEvent(faction.type)
      );
    }
    // We only generate events for rebellion and unrest, not general discontent

    return null;
  }

  private createFactionEvent(
    kingdomId: string,
    faction: string,
    severity: 'mild' | 'moderate' | 'severe' | 'critical',
    eventInfo: { type: string; description: string }
  ): FactionEvent {
    return {
      aggregateId: kingdomId,
      eventType: eventInfo.type,
      occurredAt: new Date(),
      faction,
      severity,
      description: eventInfo.description
    };
  }

  private getRandomRebellionEvent(faction: string): { type: string; description: string } {
    const events: { [key: string]: { type: string; description: string }[] } = {
      'Nobility': [
        { type: 'FactionRebellion', description: 'Noble houses plot against the crown' },
        { type: 'NobleRevolt', description: 'Major lords withdraw their support' }
      ],
      'Merchants': [
        { type: 'EconomicSabotage', description: 'Merchants organize trade embargo' },
        { type: 'FactionRebellion', description: 'Guild masters refuse to pay taxes' }
      ],
      'Military': [
        { type: 'MilitaryCoup', description: 'Generals plot to seize power' },
        { type: 'FactionRebellion', description: 'Army units refuse orders' }
      ],
      'Clergy': [
        { type: 'ReligiousSchism', description: 'Church declares ruler illegitimate' },
        { type: 'FactionRebellion', description: 'Priests incite religious uprising' }
      ],
      'Commoners': [
        { type: 'PeasantUprising', description: 'Widespread riots in the streets' },
        { type: 'FactionRebellion', description: 'Common folk storm the palace gates' }
      ]
    };

    const factionEvents = events[faction] || [{ type: 'FactionRebellion', description: 'Faction rises in rebellion' }];
    return factionEvents[Math.floor(Math.random() * factionEvents.length)] || { type: 'FactionRebellion', description: 'Unknown rebellion' };
  }

  private getRandomUnrestEvent(faction: string): { type: string; description: string } {
    const events: { [key: string]: { type: string; description: string }[] } = {
      'Nobility': [
        { type: 'FactionUnrest', description: 'Noble families openly criticize the crown' },
        { type: 'NobleProtest', description: 'Lords refuse to attend court' }
      ],
      'Merchants': [
        { type: 'FactionUnrest', description: 'Merchants raise prices in protest' },
        { type: 'TradeStrike', description: 'Guilds threaten to close shops' }
      ],
      'Military': [
        { type: 'FactionUnrest', description: 'Soldiers grumble about conditions' },
        { type: 'MilitaryComplaint', description: 'Officers petition for better treatment' }
      ],
      'Clergy': [
        { type: 'FactionUnrest', description: 'Priests speak against royal policies' },
        { type: 'ReligiousProtest', description: 'Church bells ring in protest' }
      ],
      'Commoners': [
        { type: 'FactionUnrest', description: 'Angry crowds gather in squares' },
        { type: 'CommonerStrike', description: 'Workers abandon their posts' }
      ]
    };

    const factionEvents = events[faction] || [{ type: 'FactionUnrest', description: 'Faction shows signs of unrest' }];
    return factionEvents[Math.floor(Math.random() * factionEvents.length)] || { type: 'FactionUnrest', description: 'Unknown unrest' };
  }


  calculateFactionPower(factionType: string, approvalRating: number): number {
    const basePower = this.factionPowerBase[factionType] || 1.0;
    const approvalModifier = approvalRating / 100; // 0 to 1
    
    // Power drops significantly at low approval
    const effectiveModifier = approvalRating < 30 
      ? Math.pow(approvalModifier, 2) // Quadratic reduction
      : approvalModifier;

    return basePower * effectiveModifier;
  }

  calculateFactionImpact(_kingdom: Kingdom, targetFaction: string, change: number): FactionImpact {
    const impact: FactionImpact = {};
    
    // Direct impact on target faction
    impact[targetFaction] = change;

    // Calculate impact on other factions based on relations
    const relations = this.factionRelations[targetFaction];
    if (relations) {
      for (const [otherFaction, relationValue] of Object.entries(relations)) {
        // Negative relation means opposite effect
        // Positive relation means similar effect (but reduced)
        const relatedImpact = change * relationValue * 0.5; // 50% of the original change
        impact[otherFaction] = Math.round(relatedImpact);
      }
    }

    return impact;
  }

  getRequiredApprovalThresholds(factionType: string): ApprovalThresholds {
    return this.approvalThresholds[factionType] || {
      rebellion: 20,
      unrest: 35,
      discontent: 50,
      stable: 65,
      supportive: 80
    };
  }

  getFactionRelations(): FactionRelations {
    // Return a deep copy to prevent external modification
    const relations: FactionRelations = {};
    
    for (const [faction, factionRelations] of Object.entries(this.factionRelations)) {
      relations[faction] = { ...factionRelations };
    }

    return relations;
  }
}