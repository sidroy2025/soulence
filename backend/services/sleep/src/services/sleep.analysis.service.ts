// Sleep Analysis Service
// Advanced sleep pattern detection and analysis algorithms

import { db } from '../index';
import { SleepSession, SleepPattern, SleepEvent } from '../types/sleep.types';
import { crossServiceEventService } from './cross.service.event.service';

class SleepAnalysisService {
  /**
   * Analyze a sleep session and trigger appropriate events
   */
  async analyzeSessionAndTriggerEvents(userId: string, session: SleepSession): Promise<void> {
    try {
      // Run pattern detection
      await this.detectAndUpdatePatterns(userId);
      
      // Check for immediate concerns
      await this.checkImmediateConcerns(userId, session);
      
      // Calculate correlations if we have enough data
      await this.updateCorrelations(userId);
      
      // Generate insights
      await this.generateInsights(userId);
      
    } catch (error) {
      console.error('Error in sleep analysis:', error);
    }
  }

  /**
   * Detect sleep patterns based on recent data
   */
  async detectAndUpdatePatterns(userId: string): Promise<void> {
    const patterns = await this.detectPatterns(userId);
    
    for (const pattern of patterns) {
      await this.saveOrUpdatePattern(userId, pattern);
    }
  }

  /**
   * Main pattern detection algorithm
   */
  private async detectPatterns(userId: string): Promise<any[]> {
    const detectedPatterns = [];
    
    // Get recent sleep data (last 21 days for pattern detection)
    const recentSessions = await this.getRecentSessions(userId, 21);
    
    if (recentSessions.length < 7) {
      // Need at least a week of data for pattern detection
      return detectedPatterns;
    }

    // Detect delayed sleep phase
    const delayedPhasePattern = this.detectDelayedSleepPhase(recentSessions);
    if (delayedPhasePattern) {
      detectedPatterns.push(delayedPhasePattern);
    }

    // Detect irregular sleep schedule
    const irregularPattern = this.detectIrregularSchedule(recentSessions);
    if (irregularPattern) {
      detectedPatterns.push(irregularPattern);
    }

    // Detect insufficient sleep
    const insufficientPattern = this.detectInsufficientSleep(recentSessions);
    if (insufficientPattern) {
      detectedPatterns.push(insufficientPattern);
    }

    // Detect fragmented sleep
    const fragmentedPattern = this.detectFragmentedSleep(recentSessions);
    if (fragmentedPattern) {
      detectedPatterns.push(fragmentedPattern);
    }

    // Detect sleep quality issues
    const qualityPattern = this.detectPoorQuality(recentSessions);
    if (qualityPattern) {
      detectedPatterns.push(qualityPattern);
    }

    return detectedPatterns;
  }

  /**
   * Detect delayed sleep phase syndrome
   */
  private detectDelayedSleepPhase(sessions: SleepSession[]): any | null {
    const bedtimes = sessions
      .filter(s => s.bedtime)
      .map(s => this.timeToMinutes(s.bedtime!));
    
    if (bedtimes.length < 5) return null;

    // Count nights with bedtime after 2 AM (or before 6 AM next day)
    const lateNights = bedtimes.filter(time => 
      time > 2 * 60 || time < 6 * 60 // After 2 AM or before 6 AM
    ).length;

    const lateNightPercentage = lateNights / bedtimes.length;
    
    if (lateNightPercentage >= 0.6) { // 60% or more late nights
      const avgBedtime = bedtimes.reduce((sum, time) => sum + time, 0) / bedtimes.length;
      const severity = lateNightPercentage >= 0.8 ? 'severe' : 
                     lateNightPercentage >= 0.7 ? 'moderate' : 'mild';

      return {
        patternType: 'delayed_phase',
        patternSubtype: severity,
        confidenceScore: Math.min(lateNightPercentage, 0.95),
        patternData: {
          averageBedtime: this.minutesToTime(avgBedtime),
          lateNightPercentage: lateNightPercentage,
          consecutiveLateNights: this.getMaxConsecutiveLateNights(bedtimes)
        },
        severityLevel: severity,
        interventionRecommended: severity !== 'mild'
      };
    }

    return null;
  }

  /**
   * Detect irregular sleep schedule
   */
  private detectIrregularSchedule(sessions: SleepSession[]): any | null {
    const bedtimes = sessions
      .filter(s => s.bedtime)
      .map(s => this.timeToMinutes(s.bedtime!));
    
    const wakeTimes = sessions
      .filter(s => s.wakeTime)
      .map(s => this.timeToMinutes(s.wakeTime!));

    if (bedtimes.length < 5 || wakeTimes.length < 5) return null;

    const bedtimeVariability = this.calculateStandardDeviation(bedtimes);
    const wakeTimeVariability = this.calculateStandardDeviation(wakeTimes);

    // High variability indicates irregular schedule
    const irregularityThreshold = 90; // 1.5 hours in minutes
    
    if (bedtimeVariability > irregularityThreshold || wakeTimeVariability > irregularityThreshold) {
      const severity = (bedtimeVariability > 150 || wakeTimeVariability > 150) ? 'severe' :
                      (bedtimeVariability > 120 || wakeTimeVariability > 120) ? 'moderate' : 'mild';

      return {
        patternType: 'irregular',
        patternSubtype: severity,
        confidenceScore: Math.min((Math.max(bedtimeVariability, wakeTimeVariability) / 180), 0.95),
        patternData: {
          bedtimeVariability: Math.round(bedtimeVariability),
          wakeTimeVariability: Math.round(wakeTimeVariability),
          scheduleConsistencyScore: Math.max(0, 100 - (bedtimeVariability + wakeTimeVariability) / 2)
        },
        severityLevel: severity,
        interventionRecommended: severity !== 'mild'
      };
    }

    return null;
  }

  /**
   * Detect insufficient sleep pattern
   */
  private detectInsufficientSleep(sessions: SleepSession[]): any | null {
    const durations = sessions
      .filter(s => s.totalSleepDuration && s.totalSleepDuration > 0)
      .map(s => s.totalSleepDuration!);

    if (durations.length < 5) return null;

    const insufficientThreshold = 6 * 60; // 6 hours
    const shortNights = durations.filter(d => d < insufficientThreshold).length;
    const shortNightPercentage = shortNights / durations.length;

    if (shortNightPercentage >= 0.5) { // 50% or more insufficient sleep
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const severity = avgDuration < 5 * 60 ? 'severe' :
                      avgDuration < 5.5 * 60 ? 'moderate' : 'mild';

      return {
        patternType: 'insufficient',
        patternSubtype: severity,
        confidenceScore: Math.min(shortNightPercentage + 0.2, 0.95),
        patternData: {
          averageDuration: Math.round(avgDuration),
          shortNightPercentage: shortNightPercentage,
          averageDeficit: Math.max(0, insufficientThreshold - avgDuration),
          weeklyDeficit: Math.max(0, (insufficientThreshold - avgDuration) * 7)
        },
        severityLevel: severity,
        interventionRecommended: true
      };
    }

    return null;
  }

  /**
   * Detect fragmented sleep pattern
   */
  private detectFragmentedSleep(sessions: SleepSession[]): any | null {
    const qualityScores = sessions
      .filter(s => s.qualityScore)
      .map(s => s.qualityScore!);

    const efficiencyScores = sessions
      .filter(s => s.sleepEfficiency)
      .map(s => s.sleepEfficiency!);

    if (qualityScores.length < 5) return null;

    const avgQuality = qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length;
    const avgEfficiency = efficiencyScores.length > 0 ? 
      efficiencyScores.reduce((sum, e) => sum + e, 0) / efficiencyScores.length : null;

    const lowQualityNights = qualityScores.filter(q => q <= 4).length;
    const lowQualityPercentage = lowQualityNights / qualityScores.length;

    // Consider fragmented if low quality AND low efficiency
    if (avgQuality <= 5 && lowQualityPercentage >= 0.4 && (avgEfficiency === null || avgEfficiency < 80)) {
      const severity = avgQuality <= 3 ? 'severe' :
                      avgQuality <= 4 ? 'moderate' : 'mild';

      return {
        patternType: 'fragmented',
        patternSubtype: severity,
        confidenceScore: Math.min(lowQualityPercentage + 0.3, 0.95),
        patternData: {
          averageQuality: parseFloat(avgQuality.toFixed(1)),
          averageEfficiency: avgEfficiency ? parseFloat(avgEfficiency.toFixed(1)) : null,
          lowQualityPercentage: lowQualityPercentage,
          fragmentationIndicators: this.analyzeFragmentationIndicators(sessions)
        },
        severityLevel: severity,
        interventionRecommended: severity !== 'mild'
      };
    }

    return null;
  }

  /**
   * Detect poor sleep quality pattern
   */
  private detectPoorQuality(sessions: SleepSession[]): any | null {
    const qualityScores = sessions
      .filter(s => s.qualityScore)
      .map(s => s.qualityScore!);

    if (qualityScores.length < 5) return null;

    const avgQuality = qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length;
    const poorQualityNights = qualityScores.filter(q => q <= 4).length;
    const poorQualityPercentage = poorQualityNights / qualityScores.length;

    if (avgQuality <= 5 || poorQualityPercentage >= 0.4) {
      const severity = avgQuality <= 3 ? 'severe' :
                      avgQuality <= 4 ? 'moderate' : 'mild';

      return {
        patternType: 'poor_quality',
        patternSubtype: severity,
        confidenceScore: Math.min(poorQualityPercentage + 0.2, 0.95),
        patternData: {
          averageQuality: parseFloat(avgQuality.toFixed(1)),
          poorQualityPercentage: poorQualityPercentage,
          qualityTrend: this.calculateQualityTrend(qualityScores),
          contributingFactors: this.identifyQualityFactors(sessions)
        },
        severityLevel: severity,
        interventionRecommended: true
      };
    }

    return null;
  }

  /**
   * Check for immediate sleep concerns that need attention
   */
  private async checkImmediateConcerns(userId: string, session: SleepSession): Promise<void> {
    const events: SleepEvent[] = [];

    // Check for critically short sleep
    if (session.totalSleepDuration && session.totalSleepDuration < 4 * 60) { // < 4 hours
      events.push({
        type: 'SLEEP_DEPRIVATION_SEVERE',
        userId,
        data: {
          duration: session.totalSleepDuration,
          date: session.sessionDate,
          severity: 'critical'
        },
        severity: 'critical',
        timestamp: new Date().toISOString()
      });
    }

    // Check for very poor quality
    if (session.qualityScore && session.qualityScore <= 2) {
      events.push({
        type: 'SLEEP_QUALITY_POOR',
        userId,
        data: {
          qualityScore: session.qualityScore,
          date: session.sessionDate,
          duration: session.totalSleepDuration
        },
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    }

    // Check for extreme bedtime (crisis threshold)
    if (session.bedtime) {
      const bedtimeMinutes = this.timeToMinutes(session.bedtime);
      if (bedtimeMinutes > 4 * 60 && bedtimeMinutes < 6 * 60) { // Between 4-6 AM
        events.push({
          type: 'SLEEP_CRISIS_THRESHOLD',
          userId,
          data: {
            bedtime: session.bedtime,
            date: session.sessionDate,
            pattern: 'extremely_delayed'
          },
          severity: 'critical',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Send events to cross-service event system
    for (const event of events) {
      await crossServiceEventService.publishSleepEvent(event);
    }
  }

  /**
   * Update sleep correlations with other wellness metrics
   */
  private async updateCorrelations(userId: string): Promise<void> {
    // This would calculate correlations with mood, academic stress, etc.
    // Implementation would require data from other services
    console.log('Updating sleep correlations for user:', userId);
    // TODO: Implement correlation calculations
  }

  /**
   * Generate personalized insights based on sleep data
   */
  private async generateInsights(userId: string): Promise<void> {
    // This would generate actionable insights for the user
    console.log('Generating sleep insights for user:', userId);
    // TODO: Implement insight generation
  }

  /**
   * Helper: Get recent sleep sessions
   */
  private async getRecentSessions(userId: string, days: number): Promise<SleepSession[]> {
    const query = `
      SELECT * FROM sleep_sessions 
      WHERE user_id = $1 
        AND session_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY session_date DESC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows.map(row => this.mapDatabaseToSession(row));
  }

  /**
   * Save or update a detected pattern
   */
  private async saveOrUpdatePattern(userId: string, patternData: any): Promise<void> {
    const query = `
      INSERT INTO sleep_patterns (
        user_id, pattern_type, pattern_subtype, detection_date,
        analysis_period_start, analysis_period_end, confidence_score,
        pattern_data, severity_level, intervention_recommended
      ) VALUES (
        $1, $2, $3, CURRENT_DATE, CURRENT_DATE - INTERVAL '21 days', CURRENT_DATE,
        $4, $5, $6, $7
      )
      ON CONFLICT (user_id, pattern_type, detection_date)
      DO UPDATE SET
        pattern_subtype = EXCLUDED.pattern_subtype,
        confidence_score = EXCLUDED.confidence_score,
        pattern_data = EXCLUDED.pattern_data,
        severity_level = EXCLUDED.severity_level,
        intervention_recommended = EXCLUDED.intervention_recommended,
        updated_at = NOW()
    `;

    await db.query(query, [
      userId,
      patternData.patternType,
      patternData.patternSubtype,
      patternData.confidenceScore,
      JSON.stringify(patternData.patternData),
      patternData.severityLevel,
      patternData.interventionRecommended
    ]);
  }

  // Helper methods
  private timeToMinutes(timeString: string): number {
    const date = new Date(timeString);
    return date.getHours() * 60 + date.getMinutes();
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private getMaxConsecutiveLateNights(bedtimes: number[]): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const bedtime of bedtimes) {
      if (bedtime > 2 * 60 || bedtime < 6 * 60) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive;
  }

  private analyzeFragmentationIndicators(sessions: SleepSession[]): any {
    return {
      lowEfficiencyNights: sessions.filter(s => s.sleepEfficiency && s.sleepEfficiency < 80).length,
      highStressBeforeBed: sessions.filter(s => s.stressLevelBeforeBed && s.stressLevelBeforeBed >= 7).length,
      caffeineLateInDay: sessions.filter(s => s.caffeineAfter2pm).length,
      screenTimeIssues: sessions.filter(s => s.screenTimeBeforeBed && s.screenTimeBeforeBed > 60).length
    };
  }

  private calculateQualityTrend(qualityScores: number[]): 'improving' | 'declining' | 'stable' {
    if (qualityScores.length < 3) return 'stable';

    const recent = qualityScores.slice(0, Math.floor(qualityScores.length / 2));
    const older = qualityScores.slice(Math.floor(qualityScores.length / 2));

    const recentAvg = recent.reduce((sum, q) => sum + q, 0) / recent.length;
    const olderAvg = older.reduce((sum, q) => sum + q, 0) / older.length;

    const diff = recentAvg - olderAvg;
    
    if (diff > 0.5) return 'improving';
    if (diff < -0.5) return 'declining';
    return 'stable';
  }

  private identifyQualityFactors(sessions: SleepSession[]): any {
    return {
      stressCorrelation: this.calculateCorrelation(
        sessions.map(s => s.stressLevelBeforeBed).filter(Boolean),
        sessions.map(s => s.qualityScore).filter(Boolean)
      ),
      caffeineImpact: this.analyzeCaffeineImpact(sessions),
      screenTimeImpact: this.analyzeScreenTimeImpact(sessions),
      environmentalFactors: this.analyzeEnvironmentalFactors(sessions)
    };
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 3) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private analyzeCaffeineImpact(sessions: SleepSession[]): any {
    const withCaffeine = sessions.filter(s => s.caffeineAfter2pm);
    const withoutCaffeine = sessions.filter(s => s.caffeineAfter2pm === false);

    if (withCaffeine.length < 2 || withoutCaffeine.length < 2) return null;

    const avgQualityWithCaffeine = withCaffeine.reduce((sum, s) => sum + (s.qualityScore || 0), 0) / withCaffeine.length;
    const avgQualityWithoutCaffeine = withoutCaffeine.reduce((sum, s) => sum + (s.qualityScore || 0), 0) / withoutCaffeine.length;

    return {
      qualityDifference: avgQualityWithoutCaffeine - avgQualityWithCaffeine,
      samplesWithCaffeine: withCaffeine.length,
      samplesWithoutCaffeine: withoutCaffeine.length
    };
  }

  private analyzeScreenTimeImpact(sessions: SleepSession[]): any {
    const highScreenTime = sessions.filter(s => s.screenTimeBeforeBed && s.screenTimeBeforeBed > 60);
    const lowScreenTime = sessions.filter(s => s.screenTimeBeforeBed !== undefined && s.screenTimeBeforeBed <= 60);

    if (highScreenTime.length < 2 || lowScreenTime.length < 2) return null;

    const avgQualityHighScreen = highScreenTime.reduce((sum, s) => sum + (s.qualityScore || 0), 0) / highScreenTime.length;
    const avgQualityLowScreen = lowScreenTime.reduce((sum, s) => sum + (s.qualityScore || 0), 0) / lowScreenTime.length;

    return {
      qualityDifference: avgQualityLowScreen - avgQualityHighScreen,
      samplesHighScreen: highScreenTime.length,
      samplesLowScreen: lowScreenTime.length
    };
  }

  private analyzeEnvironmentalFactors(sessions: SleepSession[]): any {
    const roomTempCounts: { [key: string]: { count: number; avgQuality: number } } = {};

    sessions.filter(s => s.roomTemperature && s.qualityScore).forEach(s => {
      const temp = s.roomTemperature!;
      if (!roomTempCounts[temp]) {
        roomTempCounts[temp] = { count: 0, avgQuality: 0 };
      }
      roomTempCounts[temp].count++;
      roomTempCounts[temp].avgQuality += s.qualityScore!;
    });

    Object.keys(roomTempCounts).forEach(temp => {
      roomTempCounts[temp].avgQuality /= roomTempCounts[temp].count;
    });

    return roomTempCounts;
  }

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

export const sleepAnalysisService = new SleepAnalysisService();