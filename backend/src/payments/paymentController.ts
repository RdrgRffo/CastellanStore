import { Response, NextFunction } from 'express';
import { AuthRequest } from '../shared/middleware/authMiddleware.js';
import * as PaymentService from './PaymentService.js';
import { sendCreated, sendSuccess } from '../shared/utils/ApiResponse.js';

/**
 * POST /api/v1/payments/create-intent
 * Crea un PaymentIntent en Stripe para el checkout.
 */
export async function createPaymentIntent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { amount, currency, orderId, orderNumber, metadata } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'El importe es obligatorio y debe ser mayor que 0' });
      return;
    }

    const result = await PaymentService.createPaymentIntent({
      amount,
      currency,
      orderId,
      orderNumber,
      customerEmail: req.body.email,
      metadata,
    });

    sendCreated(res, { data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/payments/refund
 * Reembolsa el pago de un pedido (solo admin).
 */
export async function refundPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { orderId, amount, reason } = req.body;

    if (!orderId) {
      res.status(400).json({ error: 'orderId es obligatorio' });
      return;
    }

    const result = await PaymentService.refundOrderPayment(
      orderId,
      req.userId!,
      req.body.userName || 'Admin',
      amount,
      reason
    );

    sendSuccess(res, { data: result, message: 'Reembolso realizado correctamente' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/payments/config
 * Devuelve la clave pública de Stripe para el frontend.
 */
export function getStripeConfig(_req: AuthRequest, res: Response): void {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  });
}
