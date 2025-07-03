// Sleep Service
// Core business logic for sleep tracking and analysis

import { Pool } from 'pg';
import { 
  SleepSession, 
  CreateSleepSessionRequest, 
  UpdateSleepSessionRequest,
  GetSleepSessionsParams,
  PaginatedSleepResponse 
} from '../types/sleep.types';
import { db } from '../index';
import { sleepAnalysisService } from './sleep.analysis.service';
import { crossServiceEventService } from './cross.service.event.service';

class SleepService {
  /**
   * Create a new sleep session
   */
  async createSession(userId: string, sessionData: CreateSleepSessionRequest): Promise<SleepSession> {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');

      // Calculate derived metrics if we have sufficient data
      const calculatedMetrics = this.calculateSleepMetrics(sessionData);

      const query = `
        INSERT INTO sleep_sessions (
          user_id, session_date, bedtime, sleep_onset, wake_time, get_up_time,
          total_sleep_duration, sleep_latency, sleep_efficiency, wake_episodes,
          quality_score, energy_level, mood_upon_waking,
          caffeine_after_2pm, alcohol_consumed, exercise_day, screen_time_before_bed,
          room_temperature, stress_level_before_bed, notes, data_source, confidence_score
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        ) 
        ON CONFLICT (user_id, session_date) 
        DO UPDATE SET
          bedtime = EXCLUDED.bedtime,
          sleep_onset = EXCLUDED.sleep_onset,
          wake_time = EXCLUDED.wake_time,
          get_up_time = EXCLUDED.get_up_time,
          total_sleep_duration = EXCLUDED.total_sleep_duration,
          sleep_latency = EXCLUDED.sleep_latency,
          sleep_efficiency = EXCLUDED.sleep_efficiency,
          wake_episodes = EXCLUDED.wake_episodes,
          quality_score = EXCLUDED.quality_score,
          energy_level = EXCLUDED.energy_level,
          mood_upon_waking = EXCLUDED.mood_upon_waking,
          caffeine_after_2pm = EXCLUDED.caffeine_after_2pm,
          alcohol_consumed = EXCLUDED.alcohol_consumed,
          exercise_day = EXCLUDED.exercise_day,
          screen_time_before_bed = EXCLUDED.screen_time_before_bed,
          room_temperature = EXCLUDED.room_temperature,
          stress_level_before_bed = EXCLUDED.stress_level_before_bed,
          notes = EXCLUDED.notes,
          data_source = EXCLUDED.data_source,
          confidence_score = EXCLUDED.confidence_score,
          updated_at = NOW()
        RETURNING *`;

      const values = [
        userId,
        sessionData.sessionDate,
        sessionData.bedtime,
        sessionData.sleepOnset,
        sessionData.wakeTime,
        sessionData.getUpTime,
        calculatedMetrics.totalSleepDuration,
        calculatedMetrics.sleepLatency,
        calculatedMetrics.sleepEfficiency,
        0, // wake_episodes - would need additional tracking
        sessionData.qualityScore,
        sessionData.energyLevel,
        sessionData.moodUponWaking,
        sessionData.caffeineAfter2pm || false,
        sessionData.alcoholConsumed || false,
        sessionData.exerciseDay || false,
        sessionData.screenTimeBeforeBed,
        sessionData.roomTemperature,
        sessionData.stressLevelBeforeBed,
        sessionData.notes,
        'manual',
        1.0 // confidence_score for manual entries
      ];

      const result = await client.query(query, values);
      const session = this.mapDatabaseToSession(result.rows[0]);

      await client.query('COMMIT');

      // Trigger pattern analysis and event generation asynchronously
      setImmediate(async () => {
        try {
          await sleepAnalysisService.analyzeSessionAndTriggerEvents(userId, session);
        } catch (error) {
          console.error('Error in post-session analysis:', error);
        }
      });

      return session;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get sleep sessions for a user with filtering and pagination
   */
  async getSessions(userId: string, params: GetSleepSessionsParams): Promise<{
    sessions: SleepSession[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['user_id = $1'];
    let queryParams: any[] = [userId];
    let paramIndex = 2;

    if (params.startDate) {
      whereConditions.push(`session_date >= $${paramIndex}`);
      queryParams.push(params.startDate);
      paramIndex++;
    }

    if (params.endDate) {
      whereConditions.push(`session_date <= $${paramIndex}`);
      queryParams.push(params.endDate);
      paramIndex++;
    }

    if (params.qualityFilter) {
      const qualityRanges = {
        poor: 'quality_score <= 3',
        fair: 'quality_score > 3 AND quality_score <= 6',
        good: 'quality_score > 6 AND quality_score <= 8',
        excellent: 'quality_score > 8'
      };
      whereConditions.push(`(${qualityRanges[params.qualityFilter]})`);
    }

    if (params.durationFilter) {
      const durationRanges = {
        insufficient: 'total_sleep_duration < 360', // < 6 hours
        short: 'total_sleep_duration >= 360 AND total_sleep_duration < 420', // 6-7 hours
        normal: 'total_sleep_duration >= 420 AND total_sleep_duration <= 540', // 7-9 hours
        long: 'total_sleep_duration > 540' // > 9 hours
      };
      whereConditions.push(`(${durationRanges[params.durationFilter]})`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM sleep_sessions WHERE ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Get sessions
    const dataQuery = `
      SELECT * FROM sleep_sessions 
      WHERE ${whereClause}
      ORDER BY session_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const dataResult = await db.query(dataQuery, queryParams);
    const sessions = dataResult.rows.map(row => this.mapDatabaseToSession(row));

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get a specific sleep session by ID
   */
  async getSessionById(userId: string, sessionId: string): Promise<SleepSession | null> {
    const query = 'SELECT * FROM sleep_sessions WHERE id = $1 AND user_id = $2';
    const result = await db.query(query, [sessionId, userId]);
    
    return result.rows.length > 0 ? this.mapDatabaseToSession(result.rows[0]) : null;
  }

  /**
   * Get sleep session by date
   */
  async getSessionByDate(userId: string, date: string): Promise<SleepSession | null> {
    const query = 'SELECT * FROM sleep_sessions WHERE user_id = $1 AND session_date = $2';
    const result = await db.query(query, [userId, date]);
    
    return result.rows.length > 0 ? this.mapDatabaseToSession(result.rows[0]) : null;
  }

  /**
   * Update a sleep session
   */
  async updateSession(userId: string, updateData: UpdateSleepSessionRequest): Promise<SleepSession | null> {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');

      // Get current session
      const currentQuery = 'SELECT * FROM sleep_sessions WHERE id = $1 AND user_id = $2';
      const currentResult = await client.query(currentQuery, [updateData.id, userId]);
      
      if (currentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const currentSession = currentResult.rows[0];
      
      // Merge update data with current data
      const mergedData = {
        sessionDate: updateData.sessionDate || currentSession.session_date,
        bedtime: updateData.bedtime !== undefined ? updateData.bedtime : currentSession.bedtime,
        sleepOnset: updateData.sleepOnset !== undefined ? updateData.sleepOnset : currentSession.sleep_onset,
        wakeTime: updateData.wakeTime !== undefined ? updateData.wakeTime : currentSession.wake_time,
        getUpTime: updateData.getUpTime !== undefined ? updateData.getUpTime : currentSession.get_up_time,
        qualityScore: updateData.qualityScore !== undefined ? updateData.qualityScore : currentSession.quality_score,
        energyLevel: updateData.energyLevel !== undefined ? updateData.energyLevel : currentSession.energy_level,
        moodUponWaking: updateData.moodUponWaking !== undefined ? updateData.moodUponWaking : currentSession.mood_upon_waking,
        caffeineAfter2pm: updateData.caffeineAfter2pm !== undefined ? updateData.caffeineAfter2pm : currentSession.caffeine_after_2pm,
        alcoholConsumed: updateData.alcoholConsumed !== undefined ? updateData.alcoholConsumed : currentSession.alcohol_consumed,
        exerciseDay: updateData.exerciseDay !== undefined ? updateData.exerciseDay : currentSession.exercise_day,
        screenTimeBeforeBed: updateData.screenTimeBeforeBed !== undefined ? updateData.screenTimeBeforeBed : currentSession.screen_time_before_bed,
        roomTemperature: updateData.roomTemperature !== undefined ? updateData.roomTemperature : currentSession.room_temperature,
        stressLevelBeforeBed: updateData.stressLevelBeforeBed !== undefined ? updateData.stressLevelBeforeBed : currentSession.stress_level_before_bed,
        notes: updateData.notes !== undefined ? updateData.notes : currentSession.notes,
      };

      // Recalculate metrics
      const calculatedMetrics = this.calculateSleepMetrics(mergedData);

      const updateQuery = `
        UPDATE sleep_sessions SET
          session_date = $2,
          bedtime = $3,
          sleep_onset = $4,
          wake_time = $5,
          get_up_time = $6,
          total_sleep_duration = $7,
          sleep_latency = $8,
          sleep_efficiency = $9,
          quality_score = $10,
          energy_level = $11,
          mood_upon_waking = $12,
          caffeine_after_2pm = $13,
          alcohol_consumed = $14,
          exercise_day = $15,
          screen_time_before_bed = $16,
          room_temperature = $17,
          stress_level_before_bed = $18,
          notes = $19,
          updated_at = NOW()
        WHERE id = $1 AND user_id = $20
        RETURNING *
      `;

      const values = [
        updateData.id,
        mergedData.sessionDate,
        mergedData.bedtime,
        mergedData.sleepOnset,
        mergedData.wakeTime,
        mergedData.getUpTime,
        calculatedMetrics.totalSleepDuration,
        calculatedMetrics.sleepLatency,
        calculatedMetrics.sleepEfficiency,
        mergedData.qualityScore,
        mergedData.energyLevel,
        mergedData.moodUponWaking,
        mergedData.caffeineAfter2pm,
        mergedData.alcoholConsumed,
        mergedData.exerciseDay,
        mergedData.screenTimeBeforeBed,
        mergedData.roomTemperature,
        mergedData.stressLevelBeforeBed,
        mergedData.notes,
        userId
      ];

      const result = await client.query(updateQuery, values);
      const session = this.mapDatabaseToSession(result.rows[0]);

      await client.query('COMMIT');

      // Trigger pattern analysis asynchronously
      setImmediate(async () => {
        try {
          await sleepAnalysisService.analyzeSessionAndTriggerEvents(userId, session);
        } catch (error) {
          console.error('Error in post-update analysis:', error);
        }
      });

      return session;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a sleep session
   */
  async deleteSession(userId: string, sessionId: string): Promise<boolean> {
    const query = 'DELETE FROM sleep_sessions WHERE id = $1 AND user_id = $2';
    const result = await db.query(query, [sessionId, userId]);
    
    return result.rowCount > 0;
  }

  /**
   * Get recent sleep summary
   */
  async getRecentSummary(userId: string, days: number = 7): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_sessions,
        AVG(total_sleep_duration) as avg_duration,
        AVG(quality_score) as avg_quality,
        AVG(sleep_efficiency) as avg_efficiency,
        AVG(energy_level) as avg_energy,
        MIN(total_sleep_duration) as min_duration,
        MAX(total_sleep_duration) as max_duration,
        COUNT(CASE WHEN quality_score <= 3 THEN 1 END) as poor_sleep_days,
        COUNT(CASE WHEN total_sleep_duration < 360 THEN 1 END) as insufficient_sleep_days
      FROM sleep_sessions 
      WHERE user_id = $1 
        AND session_date >= CURRENT_DATE - INTERVAL '${days} days'
        AND session_date <= CURRENT_DATE
    `;

    const result = await db.query(query, [userId]);
    const summary = result.rows[0];

    return {
      period: `${days} days`,
      totalSessions: parseInt(summary.total_sessions) || 0,
      averageDuration: summary.avg_duration ? Math.round(parseFloat(summary.avg_duration)) : null,
      averageQuality: summary.avg_quality ? parseFloat(summary.avg_quality).toFixed(1) : null,
      averageEfficiency: summary.avg_efficiency ? parseFloat(summary.avg_efficiency).toFixed(1) : null,
      averageEnergy: summary.avg_energy ? parseFloat(summary.avg_energy).toFixed(1) : null,
      minDuration: summary.min_duration ? parseInt(summary.min_duration) : null,
      maxDuration: summary.max_duration ? parseInt(summary.max_duration) : null,
      poorSleepDays: parseInt(summary.poor_sleep_days) || 0,
      insufficientSleepDays: parseInt(summary.insufficient_sleep_days) || 0,
      completionRate: days > 0 ? ((parseInt(summary.total_sessions) || 0) / days * 100).toFixed(1) : '0.0'
    };
  }

  /**
   * Calculate sleep metrics from session data
   */
  private calculateSleepMetrics(sessionData: any): {
    totalSleepDuration?: number;
    sleepLatency?: number;
    sleepEfficiency?: number;
  } {
    const metrics: any = {};

    // Calculate total sleep duration
    if (sessionData.sleepOnset && sessionData.wakeTime) {
      const sleepStart = new Date(sessionData.sleepOnset);
      const sleepEnd = new Date(sessionData.wakeTime);
      metrics.totalSleepDuration = Math.round((sleepEnd.getTime() - sleepStart.getTime()) / (1000 * 60));
    } else if (sessionData.bedtime && sessionData.wakeTime) {
      // Fallback: use bedtime if sleep onset not provided
      const bedtime = new Date(sessionData.bedtime);
      const wakeTime = new Date(sessionData.wakeTime);
      const totalTimeInBed = (wakeTime.getTime() - bedtime.getTime()) / (1000 * 60);
      
      // Estimate sleep duration (assume 15 min to fall asleep and 85% efficiency)
      metrics.totalSleepDuration = Math.round((totalTimeInBed - 15) * 0.85);
    }

    // Calculate sleep latency (time to fall asleep)
    if (sessionData.bedtime && sessionData.sleepOnset) {
      const bedtime = new Date(sessionData.bedtime);
      const sleepOnset = new Date(sessionData.sleepOnset);
      metrics.sleepLatency = Math.round((sleepOnset.getTime() - bedtime.getTime()) / (1000 * 60));
    }

    // Calculate sleep efficiency
    if (sessionData.bedtime && sessionData.wakeTime && metrics.totalSleepDuration) {
      const bedtime = new Date(sessionData.bedtime);
      const wakeTime = new Date(sessionData.wakeTime);
      const timeInBed = (wakeTime.getTime() - bedtime.getTime()) / (1000 * 60);
      
      if (timeInBed > 0) {
        metrics.sleepEfficiency = parseFloat(((metrics.totalSleepDuration / timeInBed) * 100).toFixed(2));
      }
    }

    return metrics;
  }

  /**
   * Map database row to SleepSession object
   */
  private mapDatabaseToSession(row: any): SleepSession {
    return {
      id: row.id,
      userId: row.user_id,
      sessionDate: row.session_date,
      bedtime: row.bedtime,
      sleepOnset: row.sleep_onset,
      wakeTime: row.wake_time,
      getUpTime: row.get_up_time,
      totalSleepDuration: row.total_sleep_duration,
      sleepLatency: row.sleep_latency,
      sleepEfficiency: row.sleep_efficiency,
      wakeEpisodes: row.wake_episodes,
      qualityScore: row.quality_score,
      energyLevel: row.energy_level,
      moodUponWaking: row.mood_upon_waking,
      caffeineAfter2pm: row.caffeine_after_2pm,
      alcoholConsumed: row.alcohol_consumed,
      exerciseDay: row.exercise_day,
      screenTimeBeforeBed: row.screen_time_before_bed,
      roomTemperature: row.room_temperature,
      stressLevelBeforeBed: row.stress_level_before_bed,
      notes: row.notes,
      dataSource: row.data_source,
      confidenceScore: row.confidence_score,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const sleepService = new SleepService();