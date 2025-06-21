import { v4 as uuidv4 } from 'uuid';
import { Database, Cache, logger } from '@soulence/utils';
import { MoodLog, UserRole } from '@soulence/models';
import * as crisisService from './crisis.service';
import * as timeSeriesService from './timeseries.service';

interface CreateMoodLogInput {
  userId: string;
  moodScore: number;
  emotions: string[];
  notes: string | null;
}

interface MoodStats {
  averageScore: number;
  lowestScore: number;
  highestScore: number;
  totalLogs: number;
  consecutiveDays: number;
  trend: 'improving' | 'declining' | 'stable';
}

// Create a new mood log
export async function createMoodLog(input: CreateMoodLogInput): Promise<MoodLog> {
  const id = uuidv4();
  const query = `
    INSERT INTO mood_logs (id, user_id, mood_score, emotions, notes, logged_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  
  const values = [id, input.userId, input.moodScore, input.emotions, input.notes];
  const result = await Database.query(query, values);
  
  // Cache today's mood for quick access
  const cacheKey = `mood:today:${input.userId}`;
  await Cache.set(cacheKey, JSON.stringify(result.rows[0]), 86400); // 24 hours
  
  return result.rows[0];
}

// Get mood history with pagination
export async function getMoodHistory(
  userId: string, 
  startDate?: string, 
  endDate?: string, 
  limit: number = 30
): Promise<MoodLog[]> {
  let query = `
    SELECT * FROM mood_logs 
    WHERE user_id = $1
  `;
  const values: any[] = [userId];
  let paramCount = 1;

  if (startDate) {
    paramCount++;
    query += ` AND logged_at >= $${paramCount}`;
    values.push(startDate);
  }

  if (endDate) {
    paramCount++;
    query += ` AND logged_at <= $${paramCount}`;
    values.push(endDate);
  }

  query += ` ORDER BY logged_at DESC LIMIT $${paramCount + 1}`;
  values.push(limit);

  const result = await Database.query(query, values);
  return result.rows;
}

// Get today's mood if logged
export async function getTodayMood(userId: string): Promise<MoodLog | null> {
  // Check cache first
  const cacheKey = `mood:today:${userId}`;
  const cached = await Cache.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  // Query database
  const query = `
    SELECT * FROM mood_logs 
    WHERE user_id = $1 
    AND DATE(logged_at) = CURRENT_DATE
    ORDER BY logged_at DESC
    LIMIT 1
  `;
  
  const result = await Database.query(query, [userId]);
  
  if (result.rows.length > 0) {
    // Cache the result
    await Cache.set(cacheKey, JSON.stringify(result.rows[0]), 86400);
    return result.rows[0];
  }
  
  return null;
}

// Calculate mood statistics
export async function calculateMoodStats(moodLogs: MoodLog[]): Promise<MoodStats> {
  if (moodLogs.length === 0) {
    return {
      averageScore: 0,
      lowestScore: 0,
      highestScore: 0,
      totalLogs: 0,
      consecutiveDays: 0,
      trend: 'stable'
    };
  }

  const scores = moodLogs.map(log => log.moodScore);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const lowestScore = Math.min(...scores);
  const highestScore = Math.max(...scores);

  // Calculate consecutive days
  const consecutiveDays = calculateConsecutiveDays(moodLogs);

  // Determine trend (compare last 7 days to previous 7 days)
  const trend = calculateTrend(moodLogs);

  return {
    averageScore: Math.round(averageScore * 10) / 10,
    lowestScore,
    highestScore,
    totalLogs: moodLogs.length,
    consecutiveDays,
    trend
  };
}

// Analyze mood trends over a period
export async function analyzeMoodTrends(userId: string, period: string): Promise<any> {
  const days = parsePeriod(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const query = `
    SELECT 
      DATE(logged_at) as date,
      AVG(mood_score) as avg_score,
      COUNT(*) as log_count,
      array_agg(DISTINCT unnest(emotions)) as common_emotions
    FROM mood_logs
    WHERE user_id = $1 AND logged_at >= $2
    GROUP BY DATE(logged_at)
    ORDER BY date DESC
  `;

  const result = await Database.query(query, [userId, startDate.toISOString()]);
  
  return {
    dailyAverages: result.rows,
    period,
    dataPoints: result.rows.length
  };
}

// Generate insights based on mood data
export async function generateInsights(userId: string, trends: any): Promise<string[]> {
  const insights: string[] = [];
  
  // Analyze daily averages
  if (trends.dailyAverages.length > 0) {
    const avgScores = trends.dailyAverages.map((d: any) => d.avg_score);
    const overallAvg = avgScores.reduce((a: number, b: number) => a + b, 0) / avgScores.length;
    
    if (overallAvg < 4) {
      insights.push("Your mood has been consistently low. Consider reaching out to someone you trust.");
    } else if (overallAvg > 7) {
      insights.push("You've been feeling great lately! Keep up whatever you're doing.");
    }
    
    // Check for volatility
    const variance = calculateVariance(avgScores);
    if (variance > 2) {
      insights.push("Your mood has been fluctuating significantly. Try to identify triggers.");
    }
  }
  
  return insights;
}

// Trigger crisis protocol for low mood scores
export async function triggerCrisisProtocol(userId: string, moodLog: MoodLog): Promise<void> {
  logger.warn(`Crisis protocol triggered for user ${userId} with mood score ${moodLog.moodScore}`);
  
  // Create crisis alert
  await crisisService.createCrisisAlert({
    userId,
    severityLevel: moodLog.moodScore,
    triggerPattern: `Low mood score: ${moodLog.moodScore}`,
    emotions: moodLog.emotions
  });
  
  // TODO: Implement notification system
  // - Notify therapist if assigned
  // - Send supportive message to user
  // - Provide crisis resources
}

// Log to time-series database for analytics
export async function logToTimeSeries(userId: string, moodScore: number): Promise<void> {
  try {
    await timeSeriesService.writeMoodData(userId, moodScore);
  } catch (error) {
    logger.error('Failed to log to time series database:', error);
    // Don't fail the request if time-series logging fails
  }
}

// Check if user can update mood log
export async function canUpdateMoodLog(userId: string, moodId: string): Promise<boolean> {
  const query = `
    SELECT user_id, logged_at 
    FROM mood_logs 
    WHERE id = $1
  `;
  
  const result = await Database.query(query, [moodId]);
  
  if (result.rows.length === 0) {
    return false;
  }
  
  const moodLog = result.rows[0];
  
  // Check ownership
  if (moodLog.user_id !== userId) {
    return false;
  }
  
  // Check time constraint (1 hour)
  const loggedAt = new Date(moodLog.logged_at);
  const now = new Date();
  const hoursSince = (now.getTime() - loggedAt.getTime()) / (1000 * 60 * 60);
  
  return hoursSince <= 1;
}

// Update mood log
export async function updateMoodLog(
  moodId: string, 
  updates: Partial<CreateMoodLogInput>
): Promise<MoodLog> {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramCount = 0;

  if (updates.moodScore !== undefined) {
    paramCount++;
    setClauses.push(`mood_score = $${paramCount}`);
    values.push(updates.moodScore);
  }

  if (updates.emotions !== undefined) {
    paramCount++;
    setClauses.push(`emotions = $${paramCount}`);
    values.push(updates.emotions);
  }

  if (updates.notes !== undefined) {
    paramCount++;
    setClauses.push(`notes = $${paramCount}`);
    values.push(updates.notes);
  }

  paramCount++;
  values.push(moodId);

  const query = `
    UPDATE mood_logs 
    SET ${setClauses.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await Database.query(query, values);
  return result.rows[0];
}

// Check if user can delete mood log
export async function canDeleteMoodLog(
  userId: string, 
  userRole: UserRole, 
  moodId: string
): Promise<boolean> {
  // Admins/therapists can always delete
  if (userRole === UserRole.THERAPIST) {
    return true;
  }

  // Students can only delete their own within 1 hour
  return canUpdateMoodLog(userId, moodId);
}

// Delete mood log
export async function deleteMoodLog(moodId: string): Promise<void> {
  await Database.query('DELETE FROM mood_logs WHERE id = $1', [moodId]);
}

// Helper functions
function calculateConsecutiveDays(moodLogs: MoodLog[]): number {
  if (moodLogs.length === 0) return 0;
  
  let consecutive = 1;
  const sortedLogs = [...moodLogs].sort((a, b) => 
    new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
  );
  
  for (let i = 1; i < sortedLogs.length; i++) {
    const prevDate = new Date(sortedLogs[i - 1].loggedAt);
    const currDate = new Date(sortedLogs[i].loggedAt);
    
    const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      consecutive++;
    } else {
      break;
    }
  }
  
  return consecutive;
}

function calculateTrend(moodLogs: MoodLog[]): 'improving' | 'declining' | 'stable' {
  if (moodLogs.length < 14) return 'stable';
  
  const recent = moodLogs.slice(0, 7);
  const previous = moodLogs.slice(7, 14);
  
  const recentAvg = recent.reduce((sum, log) => sum + log.moodScore, 0) / recent.length;
  const previousAvg = previous.reduce((sum, log) => sum + log.moodScore, 0) / previous.length;
  
  const difference = recentAvg - previousAvg;
  
  if (difference > 0.5) return 'improving';
  if (difference < -0.5) return 'declining';
  return 'stable';
}

function parsePeriod(period: string): number {
  const match = period.match(/(\d+)([dwmy])/);
  if (!match) return 7; // Default to 7 days
  
  const [, num, unit] = match;
  const value = parseInt(num);
  
  switch (unit) {
    case 'd': return value;
    case 'w': return value * 7;
    case 'm': return value * 30;
    case 'y': return value * 365;
    default: return 7;
  }
}

function calculateVariance(scores: number[]): number {
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / scores.length);
}