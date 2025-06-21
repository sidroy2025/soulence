import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UserRole } from '@soulence/models';

export interface JWTPayload {
  sub: string;
  role: UserRole;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export class AuthUtils {
  private static readonly SALT_ROUNDS = 10;
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private static readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign({ sub: userId, type: 'refresh' }, this.JWT_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN
    });
  }

  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
  }

  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  static getPermissionsByRole(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      [UserRole.STUDENT]: ['read:own_data', 'write:own_data', 'share:with_consent'],
      [UserRole.PARENT]: ['read:shared_data', 'receive:alerts', 'view:reports'],
      [UserRole.THERAPIST]: ['read:shared_reports', 'generate:summaries', 'view:insights']
    };
    return permissions[role] || [];
  }
}