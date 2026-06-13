import { Request, Response, NextFunction } from 'express';
import * as AuthService from './AuthService.js';
import { AuthRequest } from '../shared/middleware/authMiddleware.js';
import { sendSuccess, sendCreated } from '../shared/utils/ApiResponse.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, birthDate, name } = req.body;
    const result = await AuthService.registerLocal(email, password, birthDate, name);
    sendCreated(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await AuthService.loginLocal(email, password);
    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idToken } = req.body;
    const result = await AuthService.loginWithGoogle(idToken);
    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { birthDate } = req.body;
    const result = await AuthService.updateProfile(req.userId!, birthDate);
    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await AuthService.getProfile(req.userId!);
    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}
