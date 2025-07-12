import { AggregateRoot } from './AggregateRoot';
import { Resources } from '../value-objects/Resources';
import { RoyalCourt } from '../value-objects/RoyalCourt';
import { Faction } from './Faction';
import { ResourceGenerator } from '../services/ResourceGenerator';
import { FactionService, FactionRelations } from '../services/FactionService';
import { FactionEvent } from '../events/FactionEvent';
import { Character } from './Character';
import { Advisor } from './Advisor';
import { CharacterType } from '../value-objects/CharacterType';
import { AdvisorType } from '../value-objects/AdvisorType';
import { ResourceType } from '../value-objects/ResourceType';

export class Kingdom extends AggregateRoot {
  private readonly _name: string;
  private _resources: Resources;
  private readonly _court: RoyalCourt;
  private readonly _factions: Map<string, Faction>;
  private readonly _resourceGenerator: ResourceGenerator;
  private readonly _factionService: FactionService;
  private readonly _characters: Character[] = [];
  private readonly _advisors: Advisor[] = [];
  private _lastCalculation: number = Date.now();
  private _resourceMap: Map<ResourceType, number> = new Map([
    [ResourceType.GOLD, 0],
    [ResourceType.INFLUENCE, 0],
    [ResourceType.FAITH, 0],
    [ResourceType.KNOWLEDGE, 0],
  ]);
  
  constructor(name: string) {
    super();
    this._name = name;
    this._resources = new Resources();
    this._court = new RoyalCourt();
    this._factions = this.initializeFactions();
    this._resourceGenerator = new ResourceGenerator();
    this._factionService = new FactionService();
  }

  get name(): string {
    return this._name;
  }

  get resources(): Resources {
    return this._resources;
  }

  get court(): RoyalCourt {
    return this._court;
  }

  get factions(): Map<string, Faction> {
    return new Map(this._factions);
  }

  private initializeFactions(): Map<string, Faction> {
    const factions = new Map<string, Faction>();
    
    factions.set('Nobility', new Faction('Nobility', 'The Noble Houses'));
    factions.set('Merchants', new Faction('Merchants', 'The Merchant Guild'));
    factions.set('Military', new Faction('Military', 'The Royal Army'));
    factions.set('Clergy', new Faction('Clergy', 'The Church'));
    factions.set('Commoners', new Faction('Commoners', 'The Common Folk'));
    
    return factions;
  }

  calculateResourceGeneration(timeElapsedSeconds: number): Resources {
    // Update resource generation with new system
    const progress = this._resourceGenerator.calculateOfflineProgress(this, timeElapsedSeconds);
    
    for (const [resource, amount] of progress) {
      this.addResource(resource, amount);
    }
    
    this._lastCalculation = Date.now();
    
    // Return generated resources in old format for compatibility
    const generatedResources = this._resourceGenerator.generateResources(this, timeElapsedSeconds);
    this._resources = this._resources.add(generatedResources);
    return generatedResources;
  }

  applyFactionChange(factionType: string, delta: number, applyRelations: boolean = false): void {
    const faction = this._factions.get(factionType);
    if (!faction) {
      throw new Error(`Faction ${factionType} does not exist`);
    }

    if (applyRelations) {
      // Apply change to all affected factions based on relations
      const impacts = this._factionService.calculateFactionImpact(this, factionType, delta);
      
      for (const [affectedFaction, impact] of Object.entries(impacts)) {
        const targetFaction = this._factions.get(affectedFaction);
        if (targetFaction && impact !== 0) {
          targetFaction.changeApproval(impact);
        }
      }
    } else {
      // Just apply to the single faction
      faction.changeApproval(delta);
    }

    // Add domain event for significant changes
    if (Math.abs(delta) >= 10) {
      this.addDomainEvent({
        aggregateId: this.id,
        eventType: 'FactionApprovalChanged',
        occurredAt: new Date(),
        faction: factionType,
        change: delta
      } as FactionEvent);
    }
  }

  checkFactionEvents(): FactionEvent[] {
    const events: FactionEvent[] = [];

    for (const faction of this._factions.values()) {
      // Let the FactionService determine if an event should be generated based on thresholds
      const event = this._factionService.generateFactionEvent(this.id, faction);
      if (event) {
        events.push(event);
        this.addDomainEvent(event);
      }
    }

    return events;
  }

  getFactionRelations(): FactionRelations {
    return this._factionService.getFactionRelations();
  }

  calculateFactionBonuses(): { [faction: string]: any } {
    const bonuses: { [faction: string]: any } = {};

    for (const [factionType, faction] of this._factions) {
      bonuses[factionType] = this._factionService.calculateMoodBonus(faction);
    }

    return bonuses;
  }

  getFactionPower(factionType: string): number {
    const faction = this._factions.get(factionType);
    if (!faction) {
      return 0;
    }

    return this._factionService.calculateFactionPower(factionType, faction.approvalRating);
  }

  getTotalStability(): number {
    let totalStability = 50; // Base stability

    // Add stability bonuses/penalties from all factions
    const bonuses = this.calculateFactionBonuses();
    for (const bonus of Object.values(bonuses)) {
      totalStability += bonus.stabilityBonus || 0;
    }

    // Cap between 0 and 100
    return Math.max(0, Math.min(100, totalStability));
  }

  // Character and Advisor management
  addCharacter(type: CharacterType): void {
    const character = new Character(type, `${type.toLowerCase()} ${this._characters.length + 1}`);
    this._characters.push(character);
  }

  getCharacters(): readonly Character[] {
    return [...this._characters];
  }

  addAdvisor(type: AdvisorType): void {
    const advisor = new Advisor(type, `${type.toLowerCase()} ${this._advisors.length + 1}`);
    this._advisors.push(advisor);
  }

  getAdvisors(): readonly Advisor[] {
    return [...this._advisors];
  }

  // Resource management with new system
  getResource(type: ResourceType): number {
    return this._resourceMap.get(type) || 0;
  }

  addResource(type: ResourceType, amount: number): void {
    const current = this.getResource(type);
    const limit = 10000; // Using the same limit from ResourceGenerator
    this._resourceMap.set(type, Math.min(current + amount, limit));
  }


  getGenerationRates(): Map<ResourceType, number> {
    return this._resourceGenerator.calculateGenerationRates(this);
  }

  getLastCalculation(): number {
    return this._lastCalculation;
  }
}