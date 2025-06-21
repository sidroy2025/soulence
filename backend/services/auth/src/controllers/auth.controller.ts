import { Request, Response } from 'express';
import { 
  asyncHandler, 
  AuthUtils, 
  ConflictError, 
  AuthenticationError,
  NotFoundError,
  logger 
} from '@soulence/utils';
import { UserModel, UserRole } from '@soulence/models';
import * as authService from '../services/auth.service';
import * as emailService from '../services/email.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role, parentEmail } = req.body;

  // Check if user already exists
  const existingUser = await authService.getUserByEmail(email);
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Create user
  const user = await authService.createUser(email, password, role as UserRole);

  // If student, send notification to parent
  if (role === UserRole.STUDENT && parentEmail) {
    await emailService.sendParentNotification(parentEmail, email);
  }

  // Send verification email
  const verificationToken = await authService.generateVerificationToken(user.id);
  await emailService.sendVerificationEmail(email, verificationToken);

  // Generate tokens
  const accessToken = AuthUtils.generateToken({
    sub: user.id,
    role: user.role,
    permissions: AuthUtils.getPermissionsByRole(user.role)
  });
  const refreshToken = AuthUtils.generateRefreshToken(user.id);

  // Store refresh token
  await authService.storeRefreshToken(user.id, refreshToken);

  res.status(201).json({
    status: 'success',
    message: 'Registration successful. Please verify your email.',
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Get user
  const user = await authService.getUserByEmail(email);
  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Verify password
  const isValidPassword = await authService.verifyPassword(password, user.password);
  if (!isValidPassword) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Check if email is verified
  if (!user.isVerified) {
    throw new AuthenticationError('Please verify your email before logging in');
  }

  // Update last login
  await authService.updateLastLogin(user.id);

  // Generate tokens
  const accessToken = AuthUtils.generateToken({
    sub: user.id,
    role: user.role,
    permissions: AuthUtils.getPermissionsByRole(user.role)
  });
  const refreshToken = AuthUtils.generateRefreshToken(user.id);

  // Store refresh token
  await authService.storeRefreshToken(user.id, refreshToken);

  res.json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AuthenticationError('Refresh token required');
  }

  // Verify refresh token
  const payload = AuthUtils.verifyToken(refreshToken);
  
  // Check if token exists in database
  const isValid = await authService.validateRefreshToken(payload.sub, refreshToken);
  if (!isValid) {
    throw new AuthenticationError('Invalid refresh token');
  }

  // Get user
  const user = await authService.getUserById(payload.sub);
  if (!user) {
    throw new NotFoundError('User');
  }

  // Generate new access token
  const accessToken = AuthUtils.generateToken({
    sub: user.id,
    role: user.role,
    permissions: AuthUtils.getPermissionsByRole(user.role)
  });

  res.json({
    status: 'success',
    data: {
      accessToken
    }
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);
  
  if (token) {
    const payload = AuthUtils.verifyToken(token);
    await authService.revokeRefreshTokens(payload.sub);
  }

  res.json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await authService.getUserByEmail(email);
  if (!user) {
    // Don't reveal if email exists
    res.json({
      status: 'success',
      message: 'If the email exists, a password reset link has been sent'
    });
    return;
  }

  // Generate reset token
  const resetToken = await authService.generatePasswordResetToken(user.id);
  
  // Send reset email
  await emailService.sendPasswordResetEmail(email, resetToken);

  res.json({
    status: 'success',
    message: 'If the email exists, a password reset link has been sent'
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  // Validate token
  const userId = await authService.validatePasswordResetToken(token);
  if (!userId) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  // Update password
  await authService.updatePassword(userId, newPassword);

  // Revoke all refresh tokens
  await authService.revokeRefreshTokens(userId);

  res.json({
    status: 'success',
    message: 'Password reset successful'
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  const userId = await authService.validateVerificationToken(token);
  if (!userId) {
    throw new AuthenticationError('Invalid or expired verification token');
  }

  await authService.verifyUserEmail(userId);

  res.json({
    status: 'success',
    message: 'Email verified successfully'
  });
});