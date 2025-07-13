import { Request, Response, NextFunction } from 'express';
import { GameConfig, EventConfig, ResourceConfig, AdvisorConfig } from '../../domain/entities/GameConfig';
import { 
  IGameConfigRepository, 
  VercelKVGameConfigRepository, 
  InMemoryGameConfigRepository 
} from '../../infrastructure/repositories/GameConfigRepository';
import { v4 as uuidv4 } from 'uuid';
import { ResourceType } from '../../domain/value-objects/ResourceType';
import { AdvisorType } from '../../domain/value-objects/AdvisorType';

export class DevAdminController {
  private configRepository: IGameConfigRepository;

  constructor() {
    const useVercelKV = process.env['KV_REST_API_URL'] && process.env['NODE_ENV'] === 'production';
    this.configRepository = useVercelKV 
      ? new VercelKVGameConfigRepository()
      : new InMemoryGameConfigRepository();
  }

  // Get all game configuration
  getConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await this.configRepository.getConfig();
      res.json(config.toJSON());
    } catch (error) {
      next(error);
    }
  };

  // Update game configuration
  updateConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const configData = req.body;
      
      if (!configData) {
        res.status(400).json({ error: 'Configuration data is required' });
        return;
      }

      // Validate and parse the configuration
      const config = GameConfig.fromJSON(configData);
      
      // Save the updated configuration
      await this.configRepository.saveConfig(config);
      
      res.json({ 
        success: true, 
        message: 'Configuration updated successfully',
        config: config.toJSON()
      });
    } catch (error: any) {
      if (error.message.includes('Invalid')) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  };

  // Get all events
  getEvents = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await this.configRepository.getConfig();
      res.json(config.events);
    } catch (error) {
      next(error);
    }
  };

  // Create a new event
  createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const eventData = req.body;
      
      if (!eventData) {
        res.status(400).json({ error: 'Event data is required' });
        return;
      }

      // Validate required fields
      if (!eventData.title || !eventData.description || !eventData.type || !eventData.choices) {
        res.status(400).json({ 
          error: 'Missing required fields: title, description, type, and choices are required' 
        });
        return;
      }

      // Create new event with generated ID
      const newEvent: EventConfig = {
        id: uuidv4(),
        title: eventData.title,
        description: eventData.description,
        type: eventData.type,
        weight: eventData.weight || 1,
        requirements: eventData.requirements,
        choices: eventData.choices.map((choice: any) => ({
          id: uuidv4(),
          text: choice.text,
          consequences: choice.consequences
        }))
      };

      // Load current config
      const config = await this.configRepository.getConfig();
      
      // Add new event
      config.events.push(newEvent);
      
      // Save updated config
      await this.configRepository.saveConfig(config);
      
      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        event: newEvent
      });
    } catch (error) {
      next(error);
    }
  };

  // Update an existing event
  updateEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const eventData = req.body;
      
      if (!id) {
        res.status(400).json({ error: 'Event ID is required' });
        return;
      }
      
      if (!eventData) {
        res.status(400).json({ error: 'Event data is required' });
        return;
      }

      // Load current config
      const config = await this.configRepository.getConfig();
      
      // Find event index
      const eventIndex = config.events.findIndex(e => e.id === id);
      
      if (eventIndex === -1) {
        res.status(404).json({ error: 'Event not found' });
        return;
      }

      // Update event
      config.events[eventIndex] = {
        ...config.events[eventIndex],
        ...eventData,
        id: id // Preserve original ID
      };
      
      // Save updated config
      await this.configRepository.saveConfig(config);
      
      res.json({
        success: true,
        message: 'Event updated successfully',
        event: config.events[eventIndex]
      });
    } catch (error) {
      next(error);
    }
  };

  // Delete an event
  deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Event ID is required' });
        return;
      }

      // Load current config
      const config = await this.configRepository.getConfig();
      
      // Find event index
      const eventIndex = config.events.findIndex(e => e.id === id);
      
      if (eventIndex === -1) {
        res.status(404).json({ error: 'Event not found' });
        return;
      }

      // Remove event
      config.events.splice(eventIndex, 1);
      
      // Save updated config
      await this.configRepository.saveConfig(config);
      
      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  // Get specific configuration sections
  getResourceConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await this.configRepository.getConfig();
      res.json(Object.fromEntries(config.resources));
    } catch (error) {
      next(error);
    }
  };

  getAdvisorConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await this.configRepository.getConfig();
      res.json(Object.fromEntries(config.advisors));
    } catch (error) {
      next(error);
    }
  };

  getFactionConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await this.configRepository.getConfig();
      res.json(config.factions);
    } catch (error) {
      next(error);
    }
  };

  getAchievementConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await this.configRepository.getConfig();
      res.json(config.achievements);
    } catch (error) {
      next(error);
    }
  };

  getPrestigeConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await this.configRepository.getConfig();
      res.json({
        ...config.prestige,
        baseRequirement: Object.fromEntries(config.prestige.baseRequirement)
      });
    } catch (error) {
      next(error);
    }
  };

  // Update specific configuration sections
  updateResourceConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resourceConfig = req.body;
      
      if (!resourceConfig) {
        res.status(400).json({ error: 'Resource configuration data is required' });
        return;
      }

      const config = await this.configRepository.getConfig();
      config.resources = new Map(
        Object.entries(resourceConfig).map(([key, value]) => [
          key as ResourceType,
          value as ResourceConfig
        ])
      );
      await this.configRepository.saveConfig(config);
      
      res.json({ 
        success: true, 
        message: 'Resource configuration updated successfully' 
      });
    } catch (error) {
      next(error);
    }
  };

  updateAdvisorConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const advisorConfig = req.body;
      
      if (!advisorConfig) {
        res.status(400).json({ error: 'Advisor configuration data is required' });
        return;
      }

      const config = await this.configRepository.getConfig();
      config.advisors = new Map(
        Object.entries(advisorConfig).map(([key, value]: [string, any]) => [
          key as AdvisorType,
          {
            ...value,
            baseCost: new Map(
              Object.entries(value.baseCost).map(([rKey, rValue]) => [
                rKey as ResourceType,
                rValue as number
              ])
            )
          } as AdvisorConfig
        ])
      );
      await this.configRepository.saveConfig(config);
      
      res.json({ 
        success: true, 
        message: 'Advisor configuration updated successfully' 
      });
    } catch (error) {
      next(error);
    }
  };

  updateFactionConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const factionConfig = req.body;
      
      if (!factionConfig || !Array.isArray(factionConfig)) {
        res.status(400).json({ error: 'Faction configuration array is required' });
        return;
      }

      const config = await this.configRepository.getConfig();
      config.factions = factionConfig;
      await this.configRepository.saveConfig(config);
      
      res.json({ 
        success: true, 
        message: 'Faction configuration updated successfully' 
      });
    } catch (error) {
      next(error);
    }
  };

  updatePrestigeConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prestigeConfig = req.body;
      
      if (!prestigeConfig) {
        res.status(400).json({ error: 'Prestige configuration data is required' });
        return;
      }

      const config = await this.configRepository.getConfig();
      config.prestige = {
        ...prestigeConfig,
        baseRequirement: new Map(Object.entries(prestigeConfig.baseRequirement))
      };
      await this.configRepository.saveConfig(config);
      
      res.json({ 
        success: true, 
        message: 'Prestige configuration updated successfully' 
      });
    } catch (error) {
      next(error);
    }
  };
}