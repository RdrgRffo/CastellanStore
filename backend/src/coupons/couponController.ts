import { Request, Response, NextFunction } from 'express';
import * as CouponService from './CouponService.js';
import { sendSuccess } from '../shared/utils/ApiResponse.js';
import { AuthRequest } from '../shared/middleware/authMiddleware.js';

export async function validateCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, subtotal, items } = req.body;
    const result = await CouponService.validate(code, subtotal, req.userId, items);
    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}
