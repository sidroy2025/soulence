import { Request, Response } from 'express';
import { logger } from '@soulence/utils';
import { canvasAuthService } from '../services/canvas.auth.service';
import { canvasSyncService } from '../services/canvas.sync.service';

export class CanvasController {
  /**
   * Initiate Canvas OAuth flow
   */
  async initiateOAuth(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      
      const { authUrl, state } = await canvasAuthService.generateAuthUrl(userId);
      
      res.json({
        success: true,
        data: {
          authUrl,
          state
        }
      });
    } catch (error) {
      logger.error('Canvas OAuth initiation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate Canvas authentication'
      });
    }
  }

  /**
   * Handle Canvas OAuth callback
   */
  async handleOAuthCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters'
        });
        return;
      }

      const result = await canvasAuthService.exchangeCodeForToken(
        code as string,
        state as string
      );
      
      // Start initial sync
      try {
        await canvasSyncService.syncUserData(result.userId);
      } catch (syncError) {
        logger.warn('Initial Canvas sync failed, but connection established:', syncError);
      }
      
      res.json({
        success: true,
        data: {
          message: 'Canvas connection established successfully',
          canvasUser: {
            id: result.token.user.id,
            name: result.token.user.name,
            email: result.token.user.email
          }
        }
      });
    } catch (error) {
      logger.error('Canvas OAuth callback failed:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to complete Canvas authentication'
      });
    }
  }

  /**
   * Disconnect Canvas integration
   */
  async disconnect(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      
      await canvasAuthService.disconnect(userId);
      
      res.json({
        success: true,
        data: {
          message: 'Canvas connection disconnected successfully'
        }
      });
    } catch (error) {
      logger.error('Canvas disconnect failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect Canvas integration'
      });
    }
  }

  /**
   * Get Canvas connection status
   */
  async getConnectionStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      
      const status = await canvasAuthService.getConnectionStatus(userId);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Failed to get Canvas connection status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get Canvas connection status'
      });
    }
  }

  /**
   * Manually trigger Canvas data sync
   */
  async syncData(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      
      const syncStatus = await canvasSyncService.syncUserData(userId);
      
      res.json({
        success: true,
        data: syncStatus
      });
    } catch (error) {
      logger.error('Manual Canvas sync failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync Canvas data'
      });
    }
  }

  /**
   * Get Canvas sync status
   */
  async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      
      const syncStatus = await canvasSyncService.getSyncStatus(userId);
      
      res.json({
        success: true,
        data: syncStatus
      });
    } catch (error) {
      logger.error('Failed to get Canvas sync status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get Canvas sync status'
      });
    }
  }
}

export const canvasController = new CanvasController();