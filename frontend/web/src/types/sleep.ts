// Sleep Types for Frontend
// Type definitions for sleep monitoring interface

export interface SleepSession {
  id: string;
  userId: string;
  sessionDate: string; // YYYY-MM-DD
  
  // Sleep timing
  bedtime?: string; // ISO timestamp
  sleepOnset?: string; // ISO timestamp
  wakeTime?: string; // ISO timestamp
  getUpTime?: string; // ISO timestamp
  
  // Calculated metrics
  totalSleepDuration?: number; // minutes
  sleepLatency?: number; // minutes
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
  
  // Goals and achievements
  sleepGoals: {
    targetDuration: number; // minutes
    targetBedtime: string; // HH:MM
    targetWakeTime: string; // HH:MM
    targetQuality: number; // 1-10
  };
  
  goalsMetPercentage: {
    duration: number; // percentage
    bedtime: number; // percentage
    quality: number; // percentage
  };
}

export interface SleepInsight {
  id: string;
  type: 'pattern_discovery' | 'correlation_insight' | 'improvement_opportunity' | 'achievement' | 'warning';
  category: 'duration' | 'timing' | 'quality' | 'consistency' | 'health_impact';
  title: string;
  description: string;
  actionable: boolean;
  recommendations?: string[];
  difficulty: 'easy' | 'moderate' | 'challenging';
  expectedImpact: 'low' | 'moderate' | 'high';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface SleepPattern {
  id: string;
  patternType: 'normal' | 'delayed_phase' | 'advanced_phase' | 'irregular' | 'fragmented' | 'insufficient' | 'excessive';
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  detectedDate: string;
  confidenceScore: number;
  interventionRecommended: boolean;
}

export interface SleepCorrelation {
  type: 'mood' | 'academic_stress' | 'task_completion' | 'crisis_risk' | 'energy_level';
  correlation: number; // -1 to 1
  strength: 'negligible' | 'weak' | 'moderate' | 'strong' | 'very_strong';
  significance: number;
  description: string;
}

export interface SleepDashboardData {
  recentSessions: SleepSession[];
  todaysSession?: SleepSession;
  analytics: SleepAnalytics;
  insights: SleepInsight[];
  patterns: SleepPattern[];
  correlations: SleepCorrelation[];
  summary: {
    averageDuration: number;
    averageQuality: number;
    completionRate: number;
    streak: number;
  };
}

// Form data types
export interface SleepLogFormData {
  sessionDate: string;
  bedtime: string;
  wakeTime: string;
  qualityScore: number;
  energyLevel: number;
  moodUponWaking: string;
  stressLevelBeforeBed: number;
  caffeineAfter2pm: boolean;
  alcoholConsumed: boolean;
  exerciseDay: boolean;
  screenTimeBeforeBed: number;
  roomTemperature: 'cold' | 'cool' | 'comfortable' | 'warm' | 'hot';
  notes: string;
}

// API response types
export interface SleepApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Store state types
export interface SleepStore {
  // State
  sessions: SleepSession[];
  todaysSession: SleepSession | null;
  analytics: SleepAnalytics | null;
  insights: SleepInsight[];
  patterns: SleepPattern[];
  correlations: SleepCorrelation[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTodaysSession: () => Promise<void>;
  fetchSessions: (params?: any) => Promise<void>;
  fetchAnalytics: (period?: string) => Promise<void>;
  fetchInsights: () => Promise<void>;
  createSession: (sessionData: CreateSleepSessionRequest) => Promise<void>;
  updateSession: (id: string, sessionData: Partial<CreateSleepSessionRequest>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  clearError: () => void;
}