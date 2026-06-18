import { Response, NextFunction } from 'express';
import { AuthRequest } from '../shared/middleware/authMiddleware.js';
import { getActivityLogs, rollbackActivity } from './ActivityLogService.js';
import { sendSuccess } from '../shared/utils/ApiResponse.js';

export async function listActivityLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '0', size = '20' } = req.query;
    const result = await getActivityLogs(Number(page), Number(size));
    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function rollbackLogAction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const logId = req.params.id as string;
    const result = await rollbackActivity(logId, req.userId || 'admin');
    sendSuccess(res, { data: result, message: result.message });
  } catch (err) {
    next(err);
  }
}
