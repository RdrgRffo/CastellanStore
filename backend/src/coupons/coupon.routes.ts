import { Router } from 'express';
import { validateCoupon } from './couponController.js';
import { authMiddleware } from '../shared/middleware/authMiddleware.js';

const router = Router();

router.post('/validate', authMiddleware, validateCoupon);

export default router;
