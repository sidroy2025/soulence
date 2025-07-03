// Authentication Middleware
// Validates JWT tokens and sets user context

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // For demo purposes, we'll use a simplified auth check
    // In production, this would validate JWT tokens from the Auth Service
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For demo mode, allow requests without auth but with a default user
      if (process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true') {
        req.user = {
          id: 'demo-user-id',
          email: 'demo@soulence.com',
          role: 'student'
        };
        next();
        return;
      }
      
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // In demo mode, accept any token
    if (process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true') {
      req.user = {
        id: 'demo-user-id',
        email: 'demo@soulence.com',
        role: 'student'
      };
      next();
      return;
    }

    // Production JWT validation
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        error: 'Server configuration error',
        message: 'Authentication service not properly configured'
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || 'student'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token expired'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};