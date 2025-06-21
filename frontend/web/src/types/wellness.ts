export interface MoodLog {
  id: string;
  userId: string;
  moodScore: number;
  emotions: string[];
  notes?: string;
  loggedAt: string;
}

export interface MoodStats {
  averageScore: number;
  lowestScore: number;
  highestScore: number;
  totalLogs: number;
  consecutiveDays: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface MoodResponse {
  status: string;
  data: {
    moodLogs: MoodLog[];
    stats: MoodStats;
  };
}

export interface CrisisAlert {
  id: string;
  userId: string;
  severityLevel: number;
  triggerPattern: string;
  alertSent: boolean;
  notifiedContacts: string[];
  createdAt: string;
}

export interface CrisisResources {
  helplines: Array<{
    name: string;
    number: string;
    available: string;
    description: string;
  }>;
  tips: string[];
  emergencyMessage: string;
}

export interface LogMoodRequest {
  moodScore: number;
  emotions?: string[];
  notes?: string;
}

// Predefined emotions for the mood picker
export const EMOTION_OPTIONS = [
  'happy', 'sad', 'angry', 'excited', 'anxious', 'calm', 
  'frustrated', 'content', 'overwhelmed', 'motivated',
  'lonely', 'grateful', 'stressed', 'hopeful', 'confused'
] as const;

export type EmotionType = typeof EMOTION_OPTIONS[number];