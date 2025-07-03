import { Database, logger } from '@soulence/utils';
import { differenceInHours, differenceInDays } from 'date-fns';

interface StressIndicator {
  type: string;
  value: number;
  weight: number;
}

export class AcademicStressService {
  private readonly STRESS_WEIGHTS = {
    OVERDUE_ASSIGNMENT: 2.0,
    DUE_WITHIN_24H: 1.5,
    GRADE_DECLINE: 1.0,
    HIGH_ASSIGNMENT_DENSITY: 1.0,
    MISSING_SUBMISSION: 1.8,
    LOW_GRADE: 1.2
  };

  /**
   * Calculate academic stress level for a user
   */
  async calculateStressLevel(userId: string): Promise<{
    level: 'low' | 'medium' | 'high';
    score: number;
    indicators: StressIndicator[];
  }> {
    try {
      const indicators: StressIndicator[] = [];

      // Get overdue assignments
      const overdueCount = await this.getOverdueAssignmentsCount(userId);
      if (overdueCount > 0) {
        indicators.push({
          type: 'overdue_assignments',
          value: overdueCount,
          weight: this.STRESS_WEIGHTS.OVERDUE_ASSIGNMENT
        });
      }

      // Get assignments due within 24 hours
      const urgentCount = await this.getUrgentAssignmentsCount(userId);
      if (urgentCount > 0) {
        indicators.push({
          type: 'urgent_assignments',
          value: urgentCount,
          weight: this.STRESS_WEIGHTS.DUE_WITHIN_24H
        });
      }

      // Check for grade decline
      const gradeDecline = await this.checkGradeDecline(userId);
      if (gradeDecline > 0) {
        indicators.push({
          type: 'grade_decline',
          value: gradeDecline,
          weight: this.STRESS_WEIGHTS.GRADE_DECLINE
        });
      }

      // Calculate assignment density
      const density = await this.calculateAssignmentDensity(userId);
      if (density > 3) { // More than 3 assignments per week
        indicators.push({
          type: 'high_assignment_density',
          value: density,
          weight: this.STRESS_WEIGHTS.HIGH_ASSIGNMENT_DENSITY
        });
      }

      // Check for missing submissions
      const missingCount = await this.getMissingSubmissionsCount(userId);
      if (missingCount > 0) {
        indicators.push({
          type: 'missing_submissions',
          value: missingCount,
          weight: this.STRESS_WEIGHTS.MISSING_SUBMISSION
        });
      }

      // Calculate total stress score
      const stressScore = indicators.reduce((total, indicator) => {
        return total + (indicator.value * indicator.weight);
      }, 0);

      // Determine stress level
      let level: 'low' | 'medium' | 'high';
      if (stressScore >= 8) {
        level = 'high';
      } else if (stressScore >= 4) {
        level = 'medium';
      } else {
        level = 'low';
      }

      // Store stress level in database
      await this.storeStressLevel(userId, level, stressScore, indicators);

      // If stress is high, trigger wellness service integration
      if (level === 'high') {
        await this.notifyWellnessService(userId, stressScore, indicators);
      }

      logger.info('Calculated academic stress level', { userId, level, score: stressScore });

      return { level, score: stressScore, indicators };
    } catch (error) {
      logger.error('Failed to calculate academic stress:', error);
      throw error;
    }
  }

  /**
   * Get count of overdue assignments
   */
  private async getOverdueAssignmentsCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM assignments a
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
      WHERE a.user_id = $1
        AND a.due_date < NOW()
        AND a.workflow_state = 'published'
        AND (s.id IS NULL OR s.workflow_state != 'submitted')
    `;

    const result = await Database.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get count of assignments due within 24 hours
   */
  private async getUrgentAssignmentsCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM assignments a
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
      WHERE a.user_id = $1
        AND a.due_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
        AND a.workflow_state = 'published'
        AND (s.id IS NULL OR s.workflow_state != 'submitted')
    `;

    const result = await Database.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Check for grade decline across courses
   */
  private async checkGradeDecline(userId: string): Promise<number> {
    const query = `
      WITH grade_history AS (
        SELECT 
          c.id as course_id,
          c.current_grade,
          LAG(c.current_grade) OVER (PARTITION BY c.id ORDER BY c.last_synced) as previous_grade
        FROM courses c
        WHERE c.user_id = $1
          AND c.current_grade IS NOT NULL
      )
      SELECT COUNT(*) as declining_courses
      FROM grade_history
      WHERE previous_grade IS NOT NULL
        AND current_grade < previous_grade - 5
    `;

    const result = await Database.query(query, [userId]);
    return parseInt(result.rows[0].declining_courses);
  }

  /**
   * Calculate assignment density (assignments per week)
   */
  private async calculateAssignmentDensity(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM assignments
      WHERE user_id = $1
        AND due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        AND workflow_state = 'published'
    `;

    const result = await Database.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get count of missing submissions
   */
  private async getMissingSubmissionsCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM assignment_submissions
      WHERE user_id = $1
        AND missing = true
    `;

    const result = await Database.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Store calculated stress level
   */
  private async storeStressLevel(
    userId: string, 
    level: string, 
    score: number, 
    indicators: StressIndicator[]
  ): Promise<void> {
    const query = `
      INSERT INTO academic_stress_logs (
        id,
        user_id,
        stress_level,
        stress_score,
        indicators,
        calculated_at
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, NOW()
      )
    `;

    await Database.query(query, [
      userId,
      level,
      score,
      JSON.stringify(indicators)
    ]);
  }

  /**
   * Notify wellness service about high academic stress
   */
  private async notifyWellnessService(
    userId: string, 
    stressScore: number, 
    indicators: StressIndicator[]
  ): Promise<void> {
    // This would typically make an API call to the wellness service
    // For now, we'll just log it
    logger.warn('High academic stress detected', {
      userId,
      stressScore,
      indicators: indicators.map(i => ({ type: i.type, value: i.value }))
    });

    // Store notification in database for wellness service to pick up
    const query = `
      INSERT INTO cross_service_events (
        id,
        source_service,
        target_service,
        event_type,
        user_id,
        payload,
        created_at
      ) VALUES (
        gen_random_uuid(),
        'academic',
        'wellness',
        'high_academic_stress',
        $1,
        $2,
        NOW()
      )
    `;

    await Database.query(query, [
      userId,
      JSON.stringify({ stressScore, indicators })
    ]);
  }

  /**
   * Get current stress level for a user
   */
  async getCurrentStressLevel(userId: string): Promise<{
    level: string;
    score: number;
    lastCalculated: Date;
    indicators: StressIndicator[];
  } | null> {
    const query = `
      SELECT 
        stress_level,
        stress_score,
        indicators,
        calculated_at
      FROM academic_stress_logs
      WHERE user_id = $1
      ORDER BY calculated_at DESC
      LIMIT 1
    `;

    const result = await Database.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      level: row.stress_level,
      score: row.stress_score,
      lastCalculated: row.calculated_at,
      indicators: JSON.parse(row.indicators)
    };
  }

  /**
   * Get stress level trends over time
   */
  async getStressTrends(userId: string, days: number = 30): Promise<{
    date: Date;
    level: string;
    score: number;
  }[]> {
    const query = `
      SELECT 
        DATE(calculated_at) as date,
        AVG(stress_score) as avg_score,
        MODE() WITHIN GROUP (ORDER BY stress_level) as dominant_level
      FROM academic_stress_logs
      WHERE user_id = $1
        AND calculated_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(calculated_at)
      ORDER BY date DESC
    `;

    const result = await Database.query(query, [userId]);
    
    return result.rows.map(row => ({
      date: row.date,
      level: row.dominant_level,
      score: parseFloat(row.avg_score)
    }));
  }
}

export const academicStressService = new AcademicStressService();