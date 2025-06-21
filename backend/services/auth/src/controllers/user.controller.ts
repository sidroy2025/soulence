import { Response } from 'express';
import { AuthRequest } from '@soulence/middleware';
import { asyncHandler, NotFoundError, AuthorizationError } from '@soulence/utils';
import * as userService from '../services/user.service';

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  
  const profile = await userService.getUserProfile(userId);
  if (!profile) {
    throw new NotFoundError('User profile');
  }

  res.json({
    status: 'success',
    data: profile
  });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const updates = req.body;

  const updatedProfile = await userService.updateUserProfile(userId, updates);

  res.json({
    status: 'success',
    data: updatedProfile
  });
});

export const deleteAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { password } = req.body;

  // Verify password before deletion
  const isValid = await userService.verifyUserPassword(userId, password);
  if (!isValid) {
    throw new AuthorizationError('Invalid password');
  }

  await userService.deleteUser(userId);

  res.json({
    status: 'success',
    message: 'Account deleted successfully'
  });
});

export const getConsents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  
  const consents = await userService.getUserConsents(userId);

  res.json({
    status: 'success',
    data: consents
  });
});

export const grantConsent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { dataType, sharedWith, expiresAt } = req.body;

  const consent = await userService.createConsent(userId, dataType, sharedWith, expiresAt);

  res.status(201).json({
    status: 'success',
    data: consent
  });
});

export const revokeConsent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  await userService.revokeConsent(userId, id);

  res.json({
    status: 'success',
    message: 'Consent revoked successfully'
  });
});

export const getChildren = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parentId = req.user!.id;
  
  const children = await userService.getLinkedChildren(parentId);

  res.json({
    status: 'success',
    data: children
  });
});

export const linkChild = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parentId = req.user!.id;
  const { childId } = req.params;
  const { verificationCode } = req.body;

  await userService.linkParentToChild(parentId, childId, verificationCode);

  res.json({
    status: 'success',
    message: 'Child account linked successfully'
  });
});

export const getPatients = asyncHandler(async (req: AuthRequest, res: Response) => {
  const therapistId = req.user!.id;
  
  const patients = await userService.getTherapistPatients(therapistId);

  res.json({
    status: 'success',
    data: patients
  });
});

export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, role } = req.query;
  
  const users = await userService.getAllUsers({
    page: Number(page),
    limit: Number(limit),
    role: role as string
  });

  res.json({
    status: 'success',
    data: users
  });
});