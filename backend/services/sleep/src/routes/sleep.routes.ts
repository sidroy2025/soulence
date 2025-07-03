// Sleep Routes
// RESTful API routes for sleep session management

import { Router } from 'express';
import { sleepController } from '../controllers/sleep.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Sleep session CRUD operations
router.post('/sessions', sleepController.createSession.bind(sleepController));
router.get('/sessions', sleepController.getSessions.bind(sleepController));
router.get('/sessions/today', sleepController.getTodaysSession.bind(sleepController));
router.get('/sessions/summary', sleepController.getRecentSummary.bind(sleepController));
router.get('/sessions/:id', sleepController.getSessionById.bind(sleepController));
router.put('/sessions/:id', sleepController.updateSession.bind(sleepController));
router.delete('/sessions/:id', sleepController.deleteSession.bind(sleepController));
router.get('/sessions/date/:date', sleepController.getSessionByDate.bind(sleepController));

export { router as sleepRouter };