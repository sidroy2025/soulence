// Sleep Service Types
// Comprehensive type definitions for sleep monitoring and analysis

export interface SleepSession {
  id: string;
  userId: string;
  sessionDate: string; // YYYY-MM-DD format
  
  // Sleep timing
  bedtime?: string; // ISO timestamp
  sleepOnset?: string; // ISO timestamp  
  wakeTime?: string; // ISO timestamp
  getUpTime?: string; // ISO timestamp
  
  // Calculated metrics
  totalSleepDuration?: number; // minutes
  sleepLatency?: number; // minutes to fall asleep
  sleepEfficiency?: number; // percentage
  wakeEpisodes?: number;
  
  // Quality ratings
  qualityScore?: number; // 1-10
  energyLevel?: number; // 1-10
  moodUponWaking?: string;
  
  // Environmental factors
  caffeineAfter2pm?: boolean;
  alcoholConsumed?: boolean;
  exerciseDay?: boolean;
  screenTimeBeforeBed?: number; // minutes
  roomTemperature?: 'cold' | 'cool' | 'comfortable' | 'warm' | 'hot';
  
  // Context
  stressLevelBeforeBed?: number; // 1-10
  notes?: string;
  
  // Meta
  dataSource: 'manual' | 'nest_hub' | 'digital_wellbeing' | 'estimated' | 'wearable';
  confidenceScore: number; // 0-1
  createdAt: string;
  updatedAt: string;
}

export interface CreateSleepSessionRequest {
  sessionDate: string;
  bedtime?: string;
  sleepOnset?: string;
  wakeTime?: string;
  getUpTime?: string;
  qualityScore?: number;
  energyLevel?: number;
  moodUponWaking?: string;
  caffeineAfter2pm?: boolean;
  alcoholConsumed?: boolean;
  exerciseDay?: boolean;
  screenTimeBeforeBed?: number;
  roomTemperature?: 'cold' | 'cool' | 'comfortable' | 'warm' | 'hot';
  stressLevelBeforeBed?: number;
  notes?: string;
}

export interface UpdateSleepSessionRequest extends Partial<CreateSleepSessionRequest> {
  id: string;
}

export interface SleepPattern {
  id: string;
  userId: string;
  patternType: 'normal' | 'delayed_phase' | 'advanced_phase' | 'irregular' | 'fragmented' | 'insufficient' | 'excessive';
  patternSubtype?: 'mild' | 'moderate' | 'severe';
  detectionDate: string;
  analysisPeriodStart: string;
  analysisPeriodEnd: string;
  confidenceScore: number; // 0-1
  patternData: Record<string, any>; // Pattern-specific metrics
  severityLevel: 'mild' | 'moderate' | 'severe';
  impactOnMood?: number; // correlation coefficient
  impactOnAcademic?: number; // correlation coefficient
  interventionRecommended: boolean;
  interventionTriggered: boolean;
  interventionType?: string;
  status: 'active' | 'improving' | 'resolved' | 'worsening';
  resolvedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SleepCorrelation {
  id: string;
  userId: string;
  correlationType: 'mood' | 'academic_stress' | 'task_completion' | 'crisis_risk' | 'energy_level';
  targetMetric: string;
  correlationCoefficient: number; // -1 to 1
  pValue?: number;
  confidenceIntervalLower?: number;
  confidenceIntervalUpper?: number;
  analysisPeriodStart: string;
  analysisPeriodEnd: string;
  dataPointsCount: number;
  minimumDataThresholdMet: boolean;
  strengthCategory: 'negligible' | 'weak' | 'moderate' | 'strong' | 'very_strong';
  practicalSignificance: boolean;
  sleepMetric: 'duration' | 'quality' | 'efficiency' | 'onset_time' | 'wake_time';
  optimalSleepRange?: Record<string, any>;
  insights?: Record<string, any>;
  recommendations?: Record<string, any>;
  calculatedAt: string;
  lastUpdated: string;
}

export interface SleepIntervention {
  id: string;
  userId: string;
  interventionType: 'bedtime_reminder' | 'sleep_hygiene_education' | 'schedule_adjustment' | 'crisis_escalation';
  triggerType: 'pattern_detection' | 'correlation_analysis' | 'manual_request' | 'crisis_threshold';
  triggerData?: Record<string, any>;
  title: string;
  message: string;
  actionItems?: Record<string, any>;
  resources?: Record<string, any>;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  personalizationData?: Record<string, any>;
  deliveryMethod: 'in_app' | 'email' | 'push_notification' | 'sms';
  deliveredAt?: string;
  acknowledgedAt?: string;
  completedAt?: string;
  userRating?: number; // 1-5
  behaviorChangeObserved?: boolean;
  sleepImprovementMeasured?: boolean;
  followUpNeeded: boolean;
  status: 'pending' | 'delivered' | 'acknowledged' | 'completed' | 'dismissed' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface SleepInsight {
  id: string;
  userId: string;
  insightType: 'pattern_discovery' | 'correlation_insight' | 'improvement_opportunity' | 'achievement' | 'warning';
  category: 'duration' | 'timing' | 'quality' | 'consistency' | 'health_impact';
  title: string;
  description: string;
  keyMetrics?: Record<string, any>;
  evidenceData?: Record<string, any>;
  actionable: boolean;
  recommendations?: Record<string, any>;
  difficultyLevel: 'easy' | 'moderate' | 'challenging';
  expectedImpact: 'low' | 'moderate' | 'high';
  relevanceScore: number; // 0-1
  priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
  shownToUser: boolean;
  shownAt?: string;
  dismissedByUser: boolean;
  dismissedAt?: string;
  userRating?: number; // 1-5
  validUntil?: string;
  dataPeriodStart: string;
  dataPeriodEnd: string;
  generatedAt: string;
  updatedAt: string;
}

// Analytics and summary types
export interface SleepAnalytics {
  userId: string;
  period: string; // '7d', '30d', '90d'
  
  // Basic metrics
  averageSleepDuration: number; // minutes
  averageQualityScore: number;
  averageEfficiency: number;
  averageEnergyLevel: number;
  
  // Sleep timing
  averageBedtime: string; // HH:MM format
  averageWakeTime: string; // HH:MM format
  averageSleepLatency: number; // minutes
  
  // Consistency metrics
  bedtimeVariability: number; // standard deviation in minutes
  wakeTimeVariability: number; // standard deviation in minutes
  sleepDurationVariability: number; // standard deviation in minutes
  
  // Quality trends
  qualityTrend: 'improving' | 'declining' | 'stable';
  durationTrend: 'increasing' | 'decreasing' | 'stable';
  
  // Pattern summary
  activePatterns: SleepPattern[];
  significantCorrelations: SleepCorrelation[];
  
  // Weekly breakdown
  weeklyBreakdown: {
    dayOfWeek: string;
    averageDuration: number;
    averageQuality: number;
    averageBedtime: string;
  }[];
  
  // Goals and achievements
  sleepGoals: {
    targetDuration: number; // minutes
    targetBedtime: string; // HH:MM
    targetWakeTime: string; // HH:MM
    targetQuality: number; // 1-10
  };
  
  goalsMetPercentage: {
    duration: number; // percentage of days meeting duration goal
    bedtime: number; // percentage of days meeting bedtime goal
    quality: number; // percentage of days meeting quality goal
  };
}

export interface SleepDashboardData {
  recentSessions: SleepSession[];
  analytics: SleepAnalytics;
  insights: SleepInsight[];
  activeInterventions: SleepIntervention[];
  correlationSummary: {
    moodCorrelation: number;
    academicCorrelation: number;
    strongestCorrelation: {
      type: string;
      coefficient: number;
      description: string;
    };
  };
}

// Cross-service integration types
export interface SleepEvent {
  type: 'SLEEP_QUALITY_POOR' | 'SLEEP_PATTERN_CONCERNING' | 'SLEEP_DEPRIVATION_SEVERE' | 'SLEEP_IMPROVEMENT_NEEDED' | 'SLEEP_CRISIS_THRESHOLD' | 'SLEEP_MOOD_CORRELATION' | 'SLEEP_ACADEMIC_IMPACT';
  userId: string;
  data: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

// API Response types
export interface SleepServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedSleepResponse<T> extends SleepServiceResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request parameter types
export interface GetSleepSessionsParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
  qualityFilter?: 'poor' | 'fair' | 'good' | 'excellent';
  durationFilter?: 'insufficient' | 'short' | 'normal' | 'long';
}

export interface GetAnalyticsParams {
  period: '7d' | '30d' | '90d' | 'custom';
  startDate?: string; // For custom period
  endDate?: string; // For custom period
  includePatterns?: boolean;
  includeCorrelations?: boolean;
  includeInsights?: boolean;
}

// Validation schemas (for use with Joi)
export interface SleepValidationSchemas {
  createSession: any;
  updateSession: any;
  getSessionsParams: any;
  getAnalyticsParams: any;
}