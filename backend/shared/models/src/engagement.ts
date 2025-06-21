import { v4 as uuidv4 } from 'uuid';

export enum SignalType {
  COMPLETION = 'completion',
  RETRY = 'retry',
  DURATION = 'duration',
  SKIP = 'skip',
  DROPOFF = 'dropoff'
}

export interface EngagementSignal {
  id: string;
  userId: string;
  sessionId: string;
  signalType: SignalType;
  signalValue: Record<string, any>;
  aiInteractionId?: string;
  context?: {
    questionDifficulty?: string;
    topic?: string;
    timeOfDay?: string;
  };
  recordedAt: Date;
}

export interface QualityMetric {
  id: string;
  metricType: 'response_quality' | 'quiz_accuracy' | 'user_satisfaction';
  entityId: string;
  entityType: string;
  score: number; // 0-1
  confidence: number; // 0-1
  calculatedBy: string;
  calculatedAt: Date;
  metadata?: Record<string, any>;
}

export interface AgentState {
  id: string;
  agentName: string;
  userId: string;
  stateData: Record<string, any>;
  lastUpdated: Date;
}

export class EngagementModel {
  static createSignal(
    userId: string,
    sessionId: string,
    signalType: SignalType,
    signalValue: Record<string, any>
  ): EngagementSignal {
    return {
      id: uuidv4(),
      userId,
      sessionId,
      signalType,
      signalValue,
      recordedAt: new Date()
    };
  }

  static calculateEngagementScore(signals: EngagementSignal[]): number {
    const weights = {
      [SignalType.COMPLETION]: 0.3,
      [SignalType.RETRY]: -0.4,
      [SignalType.DURATION]: 0.2,
      [SignalType.SKIP]: -0.3,
      [SignalType.DROPOFF]: -0.5
    };

    let totalWeight = 0;
    let weightedScore = 0;

    signals.forEach(signal => {
      const weight = Math.abs(weights[signal.signalType] || 0);
      totalWeight += weight;
      weightedScore += weight * weights[signal.signalType];
    });

    return Math.max(0, Math.min(1, 0.5 + (totalWeight > 0 ? weightedScore / totalWeight : 0)));
  }
}