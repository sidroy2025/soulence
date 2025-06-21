import { Pool } from 'pg';
import { createClient } from 'redis';
import { logger } from './logger';

// PostgreSQL connection
export class Database {
  private static pool: Pool;

  static async initialize() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'soulence',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: parseInt(process.env.DB_POOL_SIZE || '20'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    try {
      await this.pool.query('SELECT NOW()');
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  static getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    return this.pool;
  }

  static async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error('Query error', { text, error });
      throw error;
    }
  }

  static async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async close() {
    await this.pool.end();
  }
}

// Redis connection
export class Cache {
  private static client: ReturnType<typeof createClient>;

  static async initialize() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD
    });

    this.client.on('error', (err) => logger.error('Redis Client Error', err));
    this.client.on('connect', () => logger.info('Redis connection established'));

    await this.client.connect();
  }

  static getClient() {
    if (!this.client) {
      throw new Error('Redis not initialized');
    }
    return this.client;
  }

  static async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  static async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    if (expireSeconds) {
      await this.client.setEx(key, expireSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  static async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  static async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  static async close() {
    await this.client.quit();
  }
}