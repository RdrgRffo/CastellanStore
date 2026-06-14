import { Response, NextFunction } from 'express';
import { AuthRequest } from '../shared/middleware/authMiddleware.js';
import * as OrderService from './OrderService.js';
import { sendCreated, sendSuccess } from '../shared/utils/ApiResponse.js';
import Order from './Order.js';

export async function createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orderData = {
      ...req.body,
      userId: req.userId,
      // Si el frontend envía useStripe: true, el pedido se crea en 'pending'
      useStripe: req.body.useStripe === true,
    };
    const order = await OrderService.create(orderData);
    sendCreated(res, { data: order });
  } catch (err) {
    next(err);
  }
}

export async function getUserOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '0', size = '10' } = req.query;
    const skip = Number(page) * Number(size);

    const [items, totalItems] = await Promise.all([
      Order.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(size)),
      Order.countDocuments({ userId: req.userId }),
    ]);

    sendSuccess(res, {
      data: {
        orders: items,
        page: Number(page),
        size: Number(size),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(size)),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function confirmStripeOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orderId = req.params.id as string;
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      res.status(400).json({ success: false, message: 'paymentIntentId es requerido' });
      return;
    }
    const order = await OrderService.confirmStripeOrder(orderId, paymentIntentId);
    sendSuccess(res, { data: order, message: 'Pedido confirmado correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orderId = req.params.id as string;
    const order = await OrderService.cancelOrder(orderId, req.userId!);
    sendSuccess(res, { data: order, message: 'Pedido cancelado correctamente' });
  } catch (err) {
    next(err);
  }
}
