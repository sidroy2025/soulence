export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isVerified: boolean;
}

export interface UserProfile {
  userId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  grade?: string;
  school?: string;
  parentEmails?: string[];
  therapistId?: string;
  preferences?: Record<string, any>;
}

export enum UserRole {
  STUDENT = 'student',
  PARENT = 'parent',
  THERAPIST = 'therapist'
}

export interface AuthResponse {
  status: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  parentEmail?: string;
}