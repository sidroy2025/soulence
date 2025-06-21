import { v4 as uuidv4 } from 'uuid';
import { Database, logger } from '@soulence/utils';
import * as notificationService from './notification.service';

interface CreateCrisisAlertInput {
  userId: string;
  severityLevel: number;
  triggerPattern: string;
  emotions?: string[];
}

export async function createCrisisAlert(input: CreateCrisisAlertInput): Promise<void> {
  const id = uuidv4();
  
  // Save to database
  const query = `
    INSERT INTO crisis_alerts (id, user_id, severity_level, trigger_pattern, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `;
  
  const values = [id, input.userId, input.severityLevel, input.triggerPattern];
  const result = await Database.query(query, values);
  const alert = result.rows[0];
  
  logger.error(`Crisis alert created: User ${input.userId}, Severity ${input.severityLevel}`);
  
  // Get user's emergency contacts
  const contacts = await getEmergencyContacts(input.userId);
  
  // Send notifications
  if (contacts.therapist) {
    await notificationService.notifyTherapist(contacts.therapist, alert);
  }
  
  if (contacts.parents && input.severityLevel <= 2) {
    await notificationService.notifyParents(contacts.parents, alert);
  }
  
  // Send supportive message to user
  await notificationService.sendSupportMessage(input.userId, input.severityLevel);
  
  // Update alert status
  await Database.query(
    'UPDATE crisis_alerts SET alert_sent = true, notified_contacts = $1 WHERE id = $2',
    [Object.keys(contacts), id]
  );
}

async function getEmergencyContacts(userId: string) {
  // Get therapist
  const therapistQuery = `
    SELECT t.id, t.email, up.first_name, up.last_name
    FROM therapist_patient_links tpl
    JOIN users t ON t.id = tpl.therapist_id
    LEFT JOIN user_profiles up ON up.user_id = t.id
    WHERE tpl.patient_id = $1 AND tpl.is_active = true
  `;
  
  const therapistResult = await Database.query(therapistQuery, [userId]);
  
  // Get parents
  const parentQuery = `
    SELECT p.id, p.email, up.first_name, up.last_name
    FROM parent_child_links pcl
    JOIN users p ON p.id = pcl.parent_id
    LEFT JOIN user_profiles up ON up.user_id = p.id
    WHERE pcl.child_id = $1 AND pcl.is_active = true
  `;
  
  const parentResult = await Database.query(parentQuery, [userId]);
  
  return {
    therapist: therapistResult.rows[0] || null,
    parents: parentResult.rows || []
  };
}

export async function getCrisisHistory(userId: string, limit: number = 10) {
  const query = `
    SELECT * FROM crisis_alerts
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;
  
  const result = await Database.query(query, [userId, limit]);
  return result.rows;
}

export async function getCrisisStats(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const query = `
    SELECT 
      COUNT(*) as total_alerts,
      AVG(severity_level) as avg_severity,
      MIN(severity_level) as min_severity,
      MAX(created_at) as last_alert
    FROM crisis_alerts
    WHERE user_id = $1 AND created_at >= $2
  `;
  
  const result = await Database.query(query, [userId, startDate.toISOString()]);
  return result.rows[0];
}