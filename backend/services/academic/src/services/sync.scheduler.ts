import * as cron from 'node-cron';
import { Database, logger } from '@soulence/utils';
import { canvasSyncService } from './canvas.sync.service';
import { taskService } from './task.service';

export function startSyncScheduler(): void {
  // Sync Canvas data every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Starting scheduled Canvas sync');
    
    try {
      // Get all users with active Canvas connections
      const query = `
        SELECT DISTINCT user_id 
        FROM canvas_connections 
        WHERE is_active = true
      `;
      
      const result = await Database.query(query);
      const userIds = result.rows.map(row => row.user_id);
      
      logger.info(`Found ${userIds.length} users with active Canvas connections`);
      
      // Sync each user's data
      for (const userId of userIds) {
        try {
          await canvasSyncService.syncUserData(userId);
          await taskService.syncCanvasAssignmentsToTasks(userId);
        } catch (error) {
          logger.error(`Failed to sync Canvas data for user ${userId}:`, error);
        }
      }
      
      logger.info('Scheduled Canvas sync completed');
    } catch (error) {
      logger.error('Scheduled Canvas sync failed:', error);
    }
  });

  // Clean up old stress logs every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting cleanup of old stress logs');
    
    try {
      const query = `
        DELETE FROM academic_stress_logs
        WHERE calculated_at < NOW() - INTERVAL '90 days'
      `;
      
      const result = await Database.query(query);
      logger.info(`Deleted ${result.rowCount} old stress log entries`);
    } catch (error) {
      logger.error('Failed to clean up old stress logs:', error);
    }
  });

  // Recalculate stress levels every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Starting hourly stress level recalculation');
    
    try {
      // Get all users with assignments
      const query = `
        SELECT DISTINCT user_id 
        FROM assignments 
        WHERE workflow_state = 'published'
      `;
      
      const result = await Database.query(query);
      const userIds = result.rows.map(row => row.user_id);
      
      logger.info(`Recalculating stress levels for ${userIds.length} users`);
      
      // Recalculate stress for each user
      for (const userId of userIds) {
        try {
          const { academicStressService } = await import('./academic.stress.service');
          await academicStressService.calculateStressLevel(userId);
        } catch (error) {
          logger.error(`Failed to recalculate stress for user ${userId}:`, error);
        }
      }
      
      logger.info('Hourly stress recalculation completed');
    } catch (error) {
      logger.error('Hourly stress recalculation failed:', error);
    }
  });

  logger.info('Sync scheduler started');
}