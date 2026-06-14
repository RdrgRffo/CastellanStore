import { Router } from 'express';
import { authMiddleware } from '../shared/middleware/authMiddleware.js';
import { createOrder, getUserOrders, confirmStripeOrder, cancelOrder } from './orderController.js';

const router = Router();

router.post('/', authMiddleware, createOrder);
router.get('/user', authMiddleware, getUserOrders);
router.patch('/:id/confirm-stripe', authMiddleware, confirmStripeOrder);
router.patch('/:id/cancel', authMiddleware, cancelOrder);

export default router;
