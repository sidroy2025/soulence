import { v4 as uuidv4 } from 'uuid';

export enum ProcessingStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface Document {
  id: string;
  userId: string;
  filename: string;
  fileType: string;
  fileSize: number; // bytes
  s3Key: string;
  processingStatus: ProcessingStatus;
  ocrText?: string;
  qualityScore?: number; // 0-1
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkText: string;
  chunkIndex: number;
  embeddingId?: string; // Pinecone vector ID
  metadata: {
    topic?: string;
    concepts?: string[];
    difficulty?: string;
  };
  retrievalFrequency: number;
  lastRetrievedAt?: Date;
}

export interface QuizQuestion {
  id: string;
  userId: string;
  documentId: string;
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  difficulty: 'easy' | 'medium' | 'hard';
  qualityScore?: number;
  validationStatus: 'pending' | 'validated' | 'flagged';
  generatedAt: Date;
}

export class DocumentModel {
  static create(
    userId: string,
    filename: string,
    fileType: string,
    fileSize: number,
    s3Key: string
  ): Document {
    return {
      id: uuidv4(),
      userId,
      filename,
      fileType,
      fileSize,
      s3Key,
      processingStatus: ProcessingStatus.UPLOADED,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}