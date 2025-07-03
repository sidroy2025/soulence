import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Database, Cache, logger } from '@soulence/utils';
import { 
  CanvasOAuthConfig, 
  CanvasTokenResponse,
  CanvasUser 
} from '../types/canvas.types';

export class CanvasAuthService {
  private config: CanvasOAuthConfig;
  private readonly STATE_CACHE_PREFIX = 'canvas:oauth:state:';
  private readonly TOKEN_CACHE_PREFIX = 'canvas:token:';
  private readonly STATE_EXPIRY = 600; // 10 minutes

  constructor() {
    this.config = {
      clientId: process.env.CANVAS_CLIENT_ID || '',
      clientSecret: process.env.CANVAS_CLIENT_SECRET || '',
      redirectUri: process.env.CANVAS_REDIRECT_URI || 'http://localhost:3000/canvas/callback',
      authorizationUrl: process.env.CANVAS_AUTH_URL || '',
      tokenUrl: process.env.CANVAS_TOKEN_URL || '',
      apiUrl: process.env.CANVAS_API_URL || ''
    };

    this.validateConfig();
  }

  private validateConfig() {
    const requiredFields = ['clientId', 'clientSecret', 'authorizationUrl', 'tokenUrl', 'apiUrl'];
    for (const field of requiredFields) {
      if (!this.config[field as keyof CanvasOAuthConfig]) {
        throw new Error(`Canvas OAuth config missing required field: ${field}`);
      }
    }
  }

  /**
   * Generate OAuth authorization URL with state parameter
   */
  async generateAuthUrl(userId: string): Promise<{ authUrl: string; state: string }> {
    try {
      const state = uuidv4();
      
      // Store state in Redis for verification
      await Cache.set(
        `${this.STATE_CACHE_PREFIX}${state}`,
        userId,
        this.STATE_EXPIRY
      );

      const params = new URLSearchParams({
        client_id: this.config.clientId,
        response_type: 'code',
        redirect_uri: this.config.redirectUri,
        state,
        scope: 'url:GET|/api/v1/users/self url:GET|/api/v1/courses url:GET|/api/v1/courses/:course_id/assignments url:GET|/api/v1/courses/:course_id/students/submissions'
      });

      const authUrl = `${this.config.authorizationUrl}?${params.toString()}`;
      
      logger.info('Generated Canvas OAuth URL', { userId, state });
      
      return { authUrl, state };
    } catch (error) {
      logger.error('Failed to generate Canvas auth URL:', error);
      throw new Error('Failed to generate Canvas authorization URL');
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<{ userId: string; token: CanvasTokenResponse }> {
    try {
      // Verify state parameter
      const userId = await Cache.get(`${this.STATE_CACHE_PREFIX}${state}`);
      if (!userId) {
        throw new Error('Invalid or expired state parameter');
      }

      // Clean up state from cache
      await Cache.del(`${this.STATE_CACHE_PREFIX}${state}`);

      // Exchange code for token
      const response = await axios.post(this.config.tokenUrl, {
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        code
      });

      const tokenData: CanvasTokenResponse = response.data;

      // Store token in database
      await this.storeToken(userId, tokenData);

      // Cache token for quick access
      await Cache.set(
        `${this.TOKEN_CACHE_PREFIX}${userId}`,
        JSON.stringify(tokenData),
        tokenData.expires_in || 3600
      );

      logger.info('Successfully exchanged Canvas code for token', { userId });

      return { userId, token: tokenData };
    } catch (error) {
      logger.error('Failed to exchange Canvas code for token:', error);
      throw new Error('Failed to complete Canvas authentication');
    }
  }

  /**
   * Store Canvas token in database
   */
  private async storeToken(userId: string, tokenData: CanvasTokenResponse): Promise<void> {
    const query = `
      INSERT INTO canvas_connections (
        user_id,
        canvas_user_id,
        access_token,
        refresh_token,
        expires_at,
        canvas_user_name,
        canvas_user_email,
        connected_at,
        last_synced_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET
        canvas_user_id = EXCLUDED.canvas_user_id,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        canvas_user_name = EXCLUDED.canvas_user_name,
        canvas_user_email = EXCLUDED.canvas_user_email,
        connected_at = NOW(),
        last_synced_at = NOW()
    `;

    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : new Date(Date.now() + 3600000); // Default 1 hour

    await Database.query(query, [
      userId,
      tokenData.user.id,
      tokenData.access_token,
      tokenData.refresh_token || null,
      expiresAt,
      tokenData.user.name,
      tokenData.user.email
    ]);
  }

  /**
   * Get Canvas access token for a user
   */
  async getAccessToken(userId: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = await Cache.get(`${this.TOKEN_CACHE_PREFIX}${userId}`);
      if (cached) {
        const tokenData = JSON.parse(cached);
        return tokenData.access_token;
      }

      // Get from database
      const query = `
        SELECT access_token, refresh_token, expires_at
        FROM canvas_connections
        WHERE user_id = $1 AND is_active = true
      `;

      const result = await Database.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const { access_token, refresh_token, expires_at } = result.rows[0];

      // Check if token is expired
      if (new Date(expires_at) < new Date()) {
        // TODO: Implement token refresh if Canvas supports it
        logger.warn('Canvas token expired for user', { userId });
        return null;
      }

      // Cache the token
      const ttl = Math.floor((new Date(expires_at).getTime() - Date.now()) / 1000);
      if (ttl > 0) {
        await Cache.set(
          `${this.TOKEN_CACHE_PREFIX}${userId}`,
          JSON.stringify({ access_token }),
          ttl
        );
      }

      return access_token;
    } catch (error) {
      logger.error('Failed to get Canvas access token:', error);
      return null;
    }
  }

  /**
   * Disconnect Canvas integration
   */
  async disconnect(userId: string): Promise<void> {
    try {
      // Mark connection as inactive in database
      const query = `
        UPDATE canvas_connections
        SET is_active = false, disconnected_at = NOW()
        WHERE user_id = $1
      `;

      await Database.query(query, [userId]);

      // Clear cache
      await Cache.del(`${this.TOKEN_CACHE_PREFIX}${userId}`);

      // Clear all related data
      await this.clearUserCanvasData(userId);

      logger.info('Canvas connection disconnected', { userId });
    } catch (error) {
      logger.error('Failed to disconnect Canvas:', error);
      throw new Error('Failed to disconnect Canvas integration');
    }
  }

  /**
   * Clear all Canvas data for a user
   */
  private async clearUserCanvasData(userId: string): Promise<void> {
    const queries = [
      'DELETE FROM assignment_submissions WHERE user_id = $1',
      'DELETE FROM assignments WHERE user_id = $1',
      'DELETE FROM courses WHERE user_id = $1'
    ];

    for (const query of queries) {
      await Database.query(query, [userId]);
    }
  }

  /**
   * Get Canvas connection status
   */
  async getConnectionStatus(userId: string): Promise<{
    isConnected: boolean;
    canvasUserName?: string;
    canvasUserEmail?: string;
    connectedAt?: Date;
    lastSyncedAt?: Date;
  }> {
    try {
      const query = `
        SELECT 
          is_active,
          canvas_user_name,
          canvas_user_email,
          connected_at,
          last_synced_at
        FROM canvas_connections
        WHERE user_id = $1
      `;

      const result = await Database.query(query, [userId]);

      if (result.rows.length === 0) {
        return { isConnected: false };
      }

      const connection = result.rows[0];

      return {
        isConnected: connection.is_active,
        canvasUserName: connection.canvas_user_name,
        canvasUserEmail: connection.canvas_user_email,
        connectedAt: connection.connected_at,
        lastSyncedAt: connection.last_synced_at
      };
    } catch (error) {
      logger.error('Failed to get Canvas connection status:', error);
      throw new Error('Failed to get Canvas connection status');
    }
  }

  /**
   * Make authenticated Canvas API request
   */
  async makeCanvasRequest<T>(userId: string, endpoint: string, method = 'GET', data?: any): Promise<T | null> {
    try {
      const accessToken = await this.getAccessToken(userId);
      if (!accessToken) {
        throw new Error('No valid Canvas access token');
      }

      const response = await axios({
        method,
        url: `${this.config.apiUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data
      });

      return response.data;
    } catch (error) {
      logger.error('Canvas API request failed:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token might be invalid, clear it
        await Cache.del(`${this.TOKEN_CACHE_PREFIX}${userId}`);
      }
      throw error;
    }
  }
}

export const canvasAuthService = new CanvasAuthService();