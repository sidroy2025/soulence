import { Request } from 'express';
import { User } from '@soulence/models';

export interface AuthRequest extends Request {
  user?: User;
}