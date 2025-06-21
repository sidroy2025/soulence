import { v4 as uuidv4 } from 'uuid';

export enum UserRole {
  STUDENT = 'student',
  PARENT = 'parent',
  THERAPIST = 'therapist'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isVerified: boolean;
}

export interface UserConsent {
  id: string;
  userId: string;
  dataType: string;
  sharedWith: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface UserProfile {
  userId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  grade?: string;
  school?: string;
  parentEmails?: string[];
  therapistId?: string;
  preferences: {
    notifications: boolean;
    dailyReminders: boolean;
    crisisAlerts: boolean;
    dataSharing: {
      mood: boolean;
      academic: boolean;
      ai_interactions: boolean;
    };
  };
}

export class UserModel {
  static create(email: string, role: UserRole): User {
    return {
      id: uuidv4(),
      email,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false
    };
  }
}