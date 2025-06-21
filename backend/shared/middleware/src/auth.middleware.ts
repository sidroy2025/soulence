import { Request, Response, NextFunction } from 'express';
import { AuthUtils, AuthenticationError, AuthorizationError } from '@soulence/utils';
import { UserRole } from '@soulence/models';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    permissions: string[];
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const payload = AuthUtils.verifyToken(token);
    
    req.user = {
      id: payload.sub,
      role: payload.role,
      permissions: payload.permissions
    };

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token expired'));
    } else if (error instanceof Error && error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Not authenticated'));
    }

    if (!req.user.permissions.includes(permission)) {
      return next(new AuthorizationError(`Missing required permission: ${permission}`));
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const payload = AuthUtils.verifyToken(token);
      req.user = {
        id: payload.sub,
        role: payload.role,
        permissions: payload.permissions
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};