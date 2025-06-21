import { v4 as uuidv4 } from 'uuid';
import { Database, Cache, AuthUtils } from '@soulence/utils';
import { User, UserModel, UserRole } from '@soulence/models';

const VERIFICATION_TOKEN_TTL = 24 * 60 * 60; // 24 hours
const RESET_TOKEN_TTL = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

export async function createUser(email: string, password: string, role: UserRole): Promise<User> {
  const hashedPassword = await AuthUtils.hashPassword(password);
  const user = UserModel.create(email, role);
  
  const query = `
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at, is_verified)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const values = [
    user.id,
    user.email,
    hashedPassword,
    user.role,
    user.createdAt,
    user.updatedAt,
    user.isVerified
  ];
  
  const result = await Database.query(query, values);
  return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<User & { password: string } | null> {
  const query = `
    SELECT id, email, password_hash as password, role, created_at, updated_at, last_login, is_verified
    FROM users
    WHERE email = $1
  `;
  
  const result = await Database.query(query, [email]);
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const query = `
    SELECT id, email, role, created_at, updated_at, last_login, is_verified
    FROM users
    WHERE id = $1
  `;
  
  const result = await Database.query(query, [id]);
  return result.rows[0] || null;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return AuthUtils.verifyPassword(password, hash);
}

export async function updateLastLogin(userId: string): Promise<void> {
  const query = `
    UPDATE users
    SET last_login = NOW()
    WHERE id = $1
  `;
  
  await Database.query(query, [userId]);
}

export async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const key = `refresh_token:${userId}:${token}`;
  await Cache.set(key, '1', REFRESH_TOKEN_TTL);
}

export async function validateRefreshToken(userId: string, token: string): Promise<boolean> {
  const key = `refresh_token:${userId}:${token}`;
  return Cache.exists(key);
}

export async function revokeRefreshTokens(userId: string): Promise<void> {
  // In production, you'd want to implement a more sophisticated approach
  // This is a simplified version that requires tracking all tokens
  const pattern = `refresh_token:${userId}:*`;
  const client = Cache.getClient();
  const keys = await client.keys(pattern);
  
  if (keys.length > 0) {
    await client.del(keys);
  }
}

export async function generateVerificationToken(userId: string): Promise<string> {
  const token = uuidv4();
  const key = `email_verification:${token}`;
  await Cache.set(key, userId, VERIFICATION_TOKEN_TTL);
  return token;
}

export async function validateVerificationToken(token: string): Promise<string | null> {
  const key = `email_verification:${token}`;
  const userId = await Cache.get(key);
  
  if (userId) {
    await Cache.delete(key);
  }
  
  return userId;
}

export async function verifyUserEmail(userId: string): Promise<void> {
  const query = `
    UPDATE users
    SET is_verified = true, updated_at = NOW()
    WHERE id = $1
  `;
  
  await Database.query(query, [userId]);
}

export async function generatePasswordResetToken(userId: string): Promise<string> {
  const token = uuidv4();
  const key = `password_reset:${token}`;
  await Cache.set(key, userId, RESET_TOKEN_TTL);
  return token;
}

export async function validatePasswordResetToken(token: string): Promise<string | null> {
  const key = `password_reset:${token}`;
  const userId = await Cache.get(key);
  
  if (userId) {
    await Cache.delete(key);
  }
  
  return userId;
}

export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  const hashedPassword = await AuthUtils.hashPassword(newPassword);
  
  const query = `
    UPDATE users
    SET password_hash = $1, updated_at = NOW()
    WHERE id = $2
  `;
  
  await Database.query(query, [hashedPassword, userId]);
}