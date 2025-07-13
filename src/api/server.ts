import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { KingdomController } from './controllers/KingdomController';
import { EventController } from './controllers/EventController';
import { DevAdminController } from './controllers/DevAdminController';
import { devAuthMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Serve static files
  app.use(express.static(path.join(__dirname, '../../public')));

  // Health check
  app.get('/health', async (_req, res) => {
    const hasKV = !!(process.env['KV_REST_API_URL'] && process.env['NODE_ENV'] === 'production');
    
    res.json({ 
      status: 'ok',
      database: hasKV ? 'vercel-kv' : 'in-memory',
      environment: process.env['NODE_ENV'] || 'development'
    });
  });

  // Controllers
  const kingdomController = new KingdomController();
  const eventController = new EventController();
  const devAdminController = new DevAdminController();

  // Kingdom routes
  app.get('/api/kingdoms/:id', kingdomController.getKingdom);
  app.post('/api/kingdoms', kingdomController.createKingdom);
  app.put('/api/kingdoms/:id/calculate', kingdomController.calculateTick);
  app.post('/api/kingdoms/:id/advisors', kingdomController.recruitAdvisor);
  app.post('/api/kingdoms/:id/prestige', kingdomController.performPrestige);

  // Event routes
  app.get('/api/kingdoms/:id/events', eventController.getEvents);
  app.post('/api/kingdoms/:id/events/:eventId/choose', eventController.chooseOption);
  app.post('/api/kingdoms/:id/events/activate', eventController.activateRandomEvents);

  // Dev Admin routes (protected with auth)
  app.use('/api/dev/*', devAuthMiddleware);
  
  // Main config endpoints
  app.get('/api/dev/config', devAdminController.getConfig);
  app.put('/api/dev/config', devAdminController.updateConfig);
  
  // Event management endpoints
  app.get('/api/dev/events', devAdminController.getEvents);
  app.post('/api/dev/events', devAdminController.createEvent);
  app.put('/api/dev/events/:id', devAdminController.updateEvent);
  app.delete('/api/dev/events/:id', devAdminController.deleteEvent);
  
  // Specific config section endpoints
  app.get('/api/dev/config/resources', devAdminController.getResourceConfig);
  app.put('/api/dev/config/resources', devAdminController.updateResourceConfig);
  app.get('/api/dev/config/advisors', devAdminController.getAdvisorConfig);
  app.put('/api/dev/config/advisors', devAdminController.updateAdvisorConfig);
  app.get('/api/dev/config/factions', devAdminController.getFactionConfig);
  app.put('/api/dev/config/factions', devAdminController.updateFactionConfig);
  app.get('/api/dev/config/achievements', devAdminController.getAchievementConfig);
  app.get('/api/dev/config/prestige', devAdminController.getPrestigeConfig);
  app.put('/api/dev/config/prestige', devAdminController.updatePrestigeConfig);

  // Serve the dev admin page
  app.get('/dev', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../public/dev.html'));
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};

// Start server if this file is run directly
if (require.main === module) {
  const PORT = process.env['PORT'] || 3000;
  const app = createApp();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
export default createApp();