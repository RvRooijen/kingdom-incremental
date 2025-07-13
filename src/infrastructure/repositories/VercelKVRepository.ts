import { Kingdom } from '../../domain/entities/Kingdom';
import { IKingdomRepository } from '../../application/interfaces/IKingdomRepository';

// Dynamic import for Vercel KV to handle local development
let kv: any;
try {
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv;
} catch (error) {
  console.log('Vercel KV not available, using mock implementation');
}

export class VercelKVRepository implements IKingdomRepository {
  private readonly prefix = 'kingdom:';

  async findById(id: string): Promise<Kingdom | null> {
    if (!kv) return null;
    
    try {
      const data = await kv.get(`${this.prefix}${id}`);
      if (!data) return null;
      
      // Reconstruct Kingdom from stored data
      return this.deserializeKingdom(data);
    } catch (error) {
      console.error('Error finding kingdom:', error);
      return null;
    }
  }

  async findByName(name: string): Promise<Kingdom | null> {
    if (!kv) return null;
    
    // For simplicity, we'll store a name->id mapping
    const id = await kv.get(`kingdom-name:${name}`);
    if (!id) return null;
    return this.findById(id as string);
  }

  async save(kingdom: Kingdom): Promise<void> {
    if (!kv) {
      console.warn('KV not available, kingdom not persisted');
      return;
    }
    
    try {
      // Serialize kingdom to storable format
      const data = this.serializeKingdom(kingdom);
      
      // Store kingdom data
      await kv.set(`${this.prefix}${kingdom.id}`, data);
      
      // Store name->id mapping
      await kv.set(`kingdom-name:${kingdom.name}`, kingdom.id);
      
      // Set expiry to 30 days (optional)
      await kv.expire(`${this.prefix}${kingdom.id}`, 30 * 24 * 60 * 60);
    } catch (error) {
      console.error('Error saving kingdom:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    if (!kv) return false;
    
    const exists = await kv.exists(`${this.prefix}${id}`);
    return exists === 1;
  }

  async findAll(): Promise<Kingdom[]> {
    if (!kv) return [];
    
    // For large scale, implement pagination
    const keys = await kv.keys(`${this.prefix}*`);
    const kingdoms: Kingdom[] = [];
    
    for (const key of keys) {
      const data = await kv.get(key);
      if (data) {
        kingdoms.push(this.deserializeKingdom(data));
      }
    }
    
    return kingdoms;
  }

  private serializeKingdom(kingdom: Kingdom): any {
    // Import ResourceType for serialization
    const { ResourceType } = require('../../domain/value-objects/ResourceType');
    
    // Convert Kingdom to plain object for storage
    return {
      id: kingdom.id,
      name: kingdom.name,
      resources: {
        gold: kingdom.resources.gold,
        influence: kingdom.resources.influence,
        loyalty: kingdom.resources.loyalty,
        population: kingdom.resources.population,
        militaryPower: kingdom.resources.militaryPower
      },
      resourceMap: [
        [ResourceType.GOLD, kingdom.getResource(ResourceType.GOLD)],
        [ResourceType.INFLUENCE, kingdom.getResource(ResourceType.INFLUENCE)],
        [ResourceType.FAITH, kingdom.getResource(ResourceType.FAITH)],
        [ResourceType.KNOWLEDGE, kingdom.getResource(ResourceType.KNOWLEDGE)],
        [ResourceType.LOYALTY, kingdom.getResource(ResourceType.LOYALTY)]
      ],
      court: {
        king: {
          name: kingdom.court.king.name,
          title: kingdom.court.king.title
        },
        queen: {
          name: kingdom.court.queen.name,
          title: kingdom.court.queen.title
        },
        advisors: Array.from(kingdom.court.advisors.entries())
      },
      factions: Array.from(kingdom.factions.entries()).map(([key, faction]) => ({
        key,
        type: faction.type,
        name: faction.name,
        approvalRating: faction.approvalRating,
        mood: faction.mood
      })),
      prestigeLevel: kingdom.prestigeLevel || 0,
      completedEventsCount: kingdom.completedEventsCount || 0,
      lastCalculation: kingdom.getLastCalculation()
    };
  }

  private deserializeKingdom(data: any): Kingdom {
    // Use the static factory method to properly reconstruct the kingdom
    return Kingdom.fromStoredData(data);
  }
}