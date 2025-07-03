// Cross-Service Event Service
// Handles communication between Sleep Service and other Soulence services

import { db } from '../index';
import { SleepEvent } from '../types/sleep.types';

class CrossServiceEventService {
  /**
   * Publish a sleep-related event to other services
   */
  async publishSleepEvent(event: SleepEvent): Promise<void> {
    try {
      const query = `
        INSERT INTO cross_service_events (
          source_service, target_service, event_type, payload, processed, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `;

      // Determine target services based on event type
      const targetServices = this.getTargetServices(event.type);

      for (const targetService of targetServices) {
        await db.query(query, [
          'sleep',
          targetService,
          event.type,
          JSON.stringify({
            userId: event.userId,
            data: event.data,
            severity: event.severity,
            timestamp: event.timestamp
          }),
          false
        ]);
      }

      console.log(`Sleep event ${event.type} published to services: ${targetServices.join(', ')}`);
    } catch (error) {
      console.error('Error publishing sleep event:', error);
    }
  }

  /**
   * Process incoming events from other services
   */
  async processIncomingEvent(event: any): Promise<void> {
    try {
      switch (event.event_type) {
        case 'MOOD_LOG_CREATED':
          await this.handleMoodLogEvent(event);
          break;
        case 'ACADEMIC_STRESS_HIGH':
          await this.handleAcademicStressEvent(event);
          break;
        case 'CRISIS_ALERT_TRIGGERED':
          await this.handleCrisisAlertEvent(event);
          break;
        default:
          console.log(`Unhandled event type: ${event.event_type}`);
      }
    } catch (error) {
      console.error('Error processing incoming event:', error);
    }
  }

  /**
   * Handle mood log events to update sleep-mood correlations
   */
  private async handleMoodLogEvent(event: any): Promise<void> {
    const payload = JSON.parse(event.payload);
    const { userId, moodScore, emotions } = payload.data;

    // Check if this mood log correlates with recent sleep data
    const recentSleep = await this.getRecentSleepData(userId, 1);
    
    if (recentSleep.length > 0) {
      const sleepSession = recentSleep[0];
      
      // Calculate immediate correlation
      await this.updateSleepMoodCorrelation(userId, sleepSession, {
        moodScore,
        emotions,
        loggedAt: payload.timestamp
      });

      // If mood is very low and sleep was poor, trigger additional analysis
      if (moodScore <= 3 && sleepSession.qualityScore && sleepSession.qualityScore <= 4) {
        await this.publishSleepEvent({
          type: 'SLEEP_MOOD_CORRELATION',
          userId,
          data: {
            sleepQuality: sleepSession.qualityScore,
            sleepDuration: sleepSession.totalSleepDuration,
            moodScore,
            correlationType: 'poor_sleep_poor_mood',
            date: sleepSession.sessionDate
          },
          severity: 'high',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Mark event as processed
    await this.markEventProcessed(event.id);
  }

  /**
   * Handle academic stress events
   */
  private async handleAcademicStressEvent(event: any): Promise<void> {
    const payload = JSON.parse(event.payload);
    const { userId, stressLevel, factors } = payload.data;

    // Check if high academic stress correlates with sleep patterns
    const recentSleep = await this.getRecentSleepData(userId, 3);
    
    if (recentSleep.length >= 2) {
      const avgSleepDuration = recentSleep.reduce((sum, s) => sum + (s.totalSleepDuration || 0), 0) / recentSleep.length;
      const avgSleepQuality = recentSleep.reduce((sum, s) => sum + (s.qualityScore || 0), 0) / recentSleep.length;

      // If academic stress is high and sleep is poor, recommend sleep intervention
      if (stressLevel >= 7 && (avgSleepDuration < 6.5 * 60 || avgSleepQuality <= 5)) {
        await this.createSleepIntervention(userId, {
          type: 'academic_stress_sleep_intervention',
          trigger: 'high_academic_stress_poor_sleep',
          severity: 'high',
          academicStressLevel: stressLevel,
          recentSleepData: {
            avgDuration: avgSleepDuration,
            avgQuality: avgSleepQuality
          }
        });
      }
    }

    await this.markEventProcessed(event.id);
  }

  /**
   * Handle crisis alert events
   */
  private async handleCrisisAlertEvent(event: any): Promise<void> {
    const payload = JSON.parse(event.payload);
    const { userId, alertType, severity } = payload.data;

    // Add sleep context to crisis analysis
    const recentSleep = await this.getRecentSleepData(userId, 7);
    
    if (recentSleep.length > 0) {
      const sleepContextData = this.analyzeSleepContextForCrisis(recentSleep);
      
      // If sleep deprivation is severe, escalate the crisis alert
      if (sleepContextData.severeSleepDeprivation) {
        await this.publishSleepEvent({
          type: 'SLEEP_CRISIS_THRESHOLD',
          userId,
          data: {
            crisisAlertId: payload.data.alertId,
            sleepContext: sleepContextData,
            recommendation: 'immediate_sleep_intervention'
          },
          severity: 'critical',
          timestamp: new Date().toISOString()
        });
      }
    }

    await this.markEventProcessed(event.id);
  }

  /**
   * Create a sleep intervention
   */
  private async createSleepIntervention(userId: string, interventionData: any): Promise<void> {
    const query = `
      INSERT INTO sleep_interventions (
        user_id, intervention_type, trigger_type, trigger_data,
        title, message, severity_level, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
    `;

    const title = this.generateInterventionTitle(interventionData.type);
    const message = this.generateInterventionMessage(interventionData);

    await db.query(query, [
      userId,
      interventionData.type,
      interventionData.trigger,
      JSON.stringify(interventionData),
      title,
      message,
      interventionData.severity
    ]);

    console.log(`Sleep intervention created for user ${userId}: ${title}`);
  }

  /**
   * Update sleep-mood correlation data
   */
  private async updateSleepMoodCorrelation(userId: string, sleepSession: any, moodData: any): Promise<void> {
    // This would update the correlations table
    // For now, we'll log the correlation event
    console.log(`Updating sleep-mood correlation for user ${userId}:`, {
      sleepQuality: sleepSession.qualityScore,
      sleepDuration: sleepSession.totalSleepDuration,
      moodScore: moodData.moodScore,
      date: sleepSession.sessionDate
    });

    // TODO: Implement actual correlation calculation and storage
  }

  /**
   * Analyze sleep context for crisis situations
   */
  private analyzeSleepContextForCrisis(recentSleep: any[]): any {
    const avgDuration = recentSleep.reduce((sum, s) => sum + (s.totalSleepDuration || 0), 0) / recentSleep.length;
    const avgQuality = recentSleep.reduce((sum, s) => sum + (s.qualityScore || 0), 0) / recentSleep.length;
    
    const severeSleepDeprivation = avgDuration < 4 * 60 || // Less than 4 hours average
                                  recentSleep.filter(s => s.totalSleepDuration && s.totalSleepDuration < 4 * 60).length >= 2;

    const chronicPoorSleep = avgQuality <= 3 || 
                           recentSleep.filter(s => s.qualityScore && s.qualityScore <= 3).length >= 3;

    return {
      averageDuration: avgDuration,
      averageQuality: avgQuality,
      severeSleepDeprivation,
      chronicPoorSleep,
      sleepDataPoints: recentSleep.length,
      riskFactors: this.identifySleepRiskFactors(recentSleep)
    };
  }

  /**
   * Identify sleep-related risk factors
   */
  private identifySleepRiskFactors(recentSleep: any[]): string[] {
    const riskFactors = [];

    // Check for extreme bedtimes
    const extremeBedtimes = recentSleep.filter(s => {
      if (!s.bedtime) return false;
      const bedtimeHour = new Date(s.bedtime).getHours();
      return bedtimeHour >= 3 && bedtimeHour <= 6; // Between 3-6 AM
    });

    if (extremeBedtimes.length >= 2) {
      riskFactors.push('extreme_delayed_bedtime');
    }

    // Check for very short sleep consistently
    const shortSleepNights = recentSleep.filter(s => s.totalSleepDuration && s.totalSleepDuration < 5 * 60);
    if (shortSleepNights.length >= 3) {
      riskFactors.push('chronic_sleep_deprivation');
    }

    // Check for poor sleep efficiency
    const lowEfficiencyNights = recentSleep.filter(s => s.sleepEfficiency && s.sleepEfficiency < 70);
    if (lowEfficiencyNights.length >= 3) {
      riskFactors.push('poor_sleep_efficiency');
    }

    // Check for high stress before bed
    const highStressNights = recentSleep.filter(s => s.stressLevelBeforeBed && s.stressLevelBeforeBed >= 8);
    if (highStressNights.length >= 2) {
      riskFactors.push('high_bedtime_stress');
    }

    return riskFactors;
  }

  /**
   * Get recent sleep data for analysis
   */
  private async getRecentSleepData(userId: string, days: number): Promise<any[]> {
    const query = `
      SELECT * FROM sleep_sessions 
      WHERE user_id = $1 
        AND session_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY session_date DESC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Mark an event as processed
   */
  private async markEventProcessed(eventId: string): Promise<void> {
    const query = 'UPDATE cross_service_events SET processed = true, processed_at = NOW() WHERE id = $1';
    await db.query(query, [eventId]);
  }

  /**
   * Determine target services for event type
   */
  private getTargetServices(eventType: string): string[] {
    const eventTargets: { [key: string]: string[] } = {
      'SLEEP_QUALITY_POOR': ['wellness'],
      'SLEEP_PATTERN_CONCERNING': ['wellness', 'academic'],
      'SLEEP_DEPRIVATION_SEVERE': ['wellness'],
      'SLEEP_IMPROVEMENT_NEEDED': ['wellness'],
      'SLEEP_CRISIS_THRESHOLD': ['wellness'],
      'SLEEP_MOOD_CORRELATION': ['wellness'],
      'SLEEP_ACADEMIC_IMPACT': ['academic', 'wellness']
    };

    return eventTargets[eventType] || [];
  }

  /**
   * Generate intervention titles
   */
  private generateInterventionTitle(type: string): string {
    const titles: { [key: string]: string } = {
      'academic_stress_sleep_intervention': 'Sleep Support for Academic Stress',
      'crisis_sleep_support': 'Emergency Sleep Support',
      'pattern_intervention': 'Sleep Pattern Improvement',
      'quality_improvement': 'Sleep Quality Enhancement'
    };

    return titles[type] || 'Sleep Support Recommendation';
  }

  /**
   * Generate intervention messages
   */
  private generateInterventionMessage(data: any): string {
    switch (data.type) {
      case 'academic_stress_sleep_intervention':
        return `We've noticed high academic stress combined with poor sleep quality. Getting better sleep can significantly improve your ability to manage academic pressure. Consider prioritizing sleep to help with stress management.`;
      
      case 'crisis_sleep_support':
        return `Your recent sleep patterns may be contributing to your current crisis state. Severe sleep deprivation can worsen mental health symptoms. Please prioritize sleep and consider reaching out for immediate support.`;
      
      default:
        return `We've identified an opportunity to improve your sleep patterns, which can have a positive impact on your overall wellness.`;
    }
  }
}

export const crossServiceEventService = new CrossServiceEventService();