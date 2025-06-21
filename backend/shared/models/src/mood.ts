import { v4 as uuidv4 } from 'uuid';

export interface MoodLog {
  id: string;
  userId: string;
  moodScore: number; // 1-10
  emotions: string[];
  notes?: string;
  loggedAt: Date;
}

export interface CrisisAlert {
  id: string;
  userId: string;
  severityLevel: number;
  triggerPattern: string;
  alertSent: boolean;
  createdAt: Date;
  notifiedContacts?: string[];
}

export interface MoodInsight {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  averageMood: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  dominantEmotions: string[];
  riskIndicators: {
    consistentLowMood: boolean;
    rapidDecline: boolean;
    crisisPatterns: boolean;
  };
  generatedAt: Date;
}

export class MoodModel {
  static createLog(userId: string, moodScore: number, emotions: string[], notes?: string): MoodLog {
    return {
      id: uuidv4(),
      userId,
      moodScore,
      emotions,
      notes,
      loggedAt: new Date()
    };
  }

  static detectCrisisPattern(moodLogs: MoodLog[]): boolean {
    if (moodLogs.length < 3) return false;
    
    const recentLogs = moodLogs.slice(-3);
    const avgScore = recentLogs.reduce((sum, log) => sum + log.moodScore, 0) / recentLogs.length;
    
    return avgScore <= 3;
  }
}