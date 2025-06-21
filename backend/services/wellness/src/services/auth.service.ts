import axios from 'axios';
import { logger } from '@soulence/utils';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Verify user token with auth service
export async function verifyUser(token: string): Promise<any> {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/v1/users/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data.data;
  } catch (error) {
    logger.error('Failed to verify user with auth service:', error);
    throw new Error('Authentication failed');
  }
}

// Get user details from auth service
export async function getUserDetails(userId: string, token: string): Promise<any> {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data.data;
  } catch (error) {
    logger.error('Failed to get user details:', error);
    throw error;
  }
}