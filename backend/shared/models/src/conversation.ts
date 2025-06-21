import { v4 as uuidv4 } from 'uuid';

export enum MessageType {
  USER = 'user',
  AI = 'ai'
}

export interface AIConversation {
  id: string;
  userId: string;
  sessionId: string;
  messageType: MessageType;
  content: string;
  createdAt: Date;
  metadata?: {
    confidence?: number;
    tokensUsed?: number;
    processingTime?: number;
  };
}

export interface AIInteraction {
  id: string;
  userId: string;
  sessionId: string;
  interactionType: 'query' | 'quiz_generation' | 'explanation';
  inputText: string;
  outputText: string;
  confidenceScore?: number;
  processingTimeMs?: number;
  feedbackScore?: number;
  createdAt: Date;
}

export interface ConversationSession {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  messageCount: number;
  purpose?: string;
  mood?: number;
}

export class ConversationModel {
  static createMessage(
    userId: string,
    sessionId: string,
    messageType: MessageType,
    content: string
  ): AIConversation {
    return {
      id: uuidv4(),
      userId,
      sessionId,
      messageType,
      content,
      createdAt: new Date()
    };
  }

  static createSession(userId: string, purpose?: string): ConversationSession {
    return {
      id: uuidv4(),
      userId,
      startedAt: new Date(),
      messageCount: 0,
      purpose
    };
  }
}