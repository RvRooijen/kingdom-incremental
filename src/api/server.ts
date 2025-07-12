import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { KingdomController } from './controllers/KingdomController';
import { EventController } from './controllers/EventController';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Controllers
  const kingdomController = new KingdomController();
  const eventController = new EventController();

  // Kingdom routes
  app.get('/api/kingdoms/:id', kingdomController.getKingdom);
  app.post('/api/kingdoms', kingdomController.createKingdom);
  app.put('/api/kingdoms/:id/calculate', kingdomController.calculateTick);

  // Event routes
  app.get('/api/kingdoms/:id/events', eventController.getEvents);
  app.post('/api/kingdoms/:id/events/:eventId/choose', eventController.chooseOption);

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