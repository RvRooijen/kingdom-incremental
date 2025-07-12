import { Event } from '../events/Event';
import { createNobleRebellionChain } from '../events/chains/NobleRebellionChain';
import { createMerchantGuildChain } from '../events/chains/MerchantGuildChain';
import { createReligiousAwakeningChain } from '../events/chains/ReligiousAwakeningChain';
import { EventChainService, ChainContext } from './EventChainService';
import { Kingdom } from '../entities/Kingdom';

export interface EventChainSpawnCondition {
  chainId: string;
  minTurn: number;
  maxTurn?: number;
  minStability?: number;
  maxStability?: number;
  minGold?: number;
  minInfluence?: number;
  requiredUnlocks?: string[];
  probability: number;
  cooldownTurns: number;
}

export class EventChainManager {
  private chainService: EventChainService;
  private spawnConditions: Map<string, EventChainSpawnCondition>;
  private lastSpawnTurn: Map<string, number>;
  
  constructor() {
    this.chainService = new EventChainService();
    this.spawnConditions = new Map();
    this.lastSpawnTurn = new Map();
    this.initializeSpawnConditions();
  }

  private initializeSpawnConditions(): void {
    // Noble Rebellion spawn conditions
    this.spawnConditions.set('noble_rebellion', {
      chainId: 'noble_rebellion',
      minTurn: 10,
      maxTurn: 100,
      minStability: 0,
      maxStability: 60,
      minInfluence: 100,
      probability: 0.3,
      cooldownTurns: 20
    });

    // Merchant Guild Expansion spawn conditions
    this.spawnConditions.set('merchant_expansion', {
      chainId: 'merchant_expansion',
      minTurn: 15,
      minGold: 300,
      minInfluence: 150,
      probability: 0.4,
      cooldownTurns: 25
    });

    // Religious Awakening spawn conditions
    this.spawnConditions.set('religious_awakening', {
      chainId: 'religious_awakening',
      minTurn: 20,
      minStability: 30,
      probability: 0.35,
      cooldownTurns: 30
    });
  }

  public checkAndSpawnChains(kingdom: Kingdom, currentTurn: number): Event[] {
    const spawnedEvents: Event[] = [];
    
    for (const [chainId, condition] of this.spawnConditions) {
      if (this.shouldSpawnChain(kingdom, condition, currentTurn)) {
        const chain = this.createChain(chainId);
        if (chain && chain.length > 0) {
          // Only spawn the first event of the chain
          spawnedEvents.push(chain[0]);
          this.lastSpawnTurn.set(chainId, currentTurn);
        }
      }
    }
    
    return spawnedEvents;
  }

  private shouldSpawnChain(
    kingdom: Kingdom,
    condition: EventChainSpawnCondition,
    currentTurn: number
  ): boolean {
    // Check turn requirements
    if (currentTurn < condition.minTurn) return false;
    if (condition.maxTurn && currentTurn > condition.maxTurn) return false;
    
    // Check cooldown
    const lastSpawn = this.lastSpawnTurn.get(condition.chainId) || 0;
    if (currentTurn - lastSpawn < condition.cooldownTurns) return false;
    
    // Check resource requirements
    const resources = kingdom.getResources();
    if (condition.minGold && resources.gold < condition.minGold) return false;
    if (condition.minInfluence && resources.influence < condition.minInfluence) return false;
    
    // Check stability requirements
    const stability = kingdom.getStability();
    if (condition.minStability && stability < condition.minStability) return false;
    if (condition.maxStability && stability > condition.maxStability) return false;
    
    // Check probability
    return Math.random() < condition.probability;
  }

  private createChain(chainId: string): Event[] | null {
    switch (chainId) {
      case 'noble_rebellion':
        return createNobleRebellionChain();
      case 'merchant_expansion':
        return createMerchantGuildChain();
      case 'religious_awakening':
        return createReligiousAwakeningChain();
      default:
        return null;
    }
  }

  public getChainService(): EventChainService {
    return this.chainService;
  }

  public processChainCompletion(
    kingdom: Kingdom,
    chainId: string,
    context: ChainContext
  ): void {
    const reward = this.chainService.getChainCompletionReward(chainId, context);
    if (reward) {
      // Apply resource rewards
      kingdom.adjustResources(reward.resources);
      
      // TODO: Apply unlocks when unlock system is implemented
      // reward.unlocks?.forEach(unlock => kingdom.addUnlock(unlock));
      
      // Log the completion
      console.log(`Chain completed: ${chainId} - ${reward.title}`);
      console.log(reward.description);
    }
  }
}