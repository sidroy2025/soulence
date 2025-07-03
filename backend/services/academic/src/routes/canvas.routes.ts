import { Router } from 'express';
import { canvasController } from '../controllers/canvas.controller';
import { authMiddleware } from '@soulence/middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Canvas OAuth routes
router.post('/auth', canvasController.initiateOAuth);
router.get('/callback', canvasController.handleOAuthCallback);
router.delete('/disconnect', canvasController.disconnect);
router.get('/status', canvasController.getConnectionStatus);

// Canvas sync routes
router.post('/sync', canvasController.syncData);
router.get('/sync/status', canvasController.getSyncStatus);

export { router as canvasRouter };