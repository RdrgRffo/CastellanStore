import Stripe from 'stripe';
import { badRequest, notFound } from '../shared/utils/AppError.js';
import Order from '../orders/Order.js';
import { logActivity } from '../activityLog/ActivityLogService.js';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY no está configurada');
    }
    _stripe = new Stripe(secretKey, {
      apiVersion: '2025-03-31.basil' as any,
    });
  }
  return _stripe;
}

/**
 * Comprueba si Stripe está configurado (tiene STRIPE_SECRET_KEY).
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Crea un PaymentIntent en Stripe.
 * El pedido aún no existe en este punto; se pasa un orderNumber temporal
 * o se crea el pedido antes y se pasa su ID.
 */
export async function createPaymentIntent(data: {
  amount: number;
  currency?: string;
  orderId?: string;
  orderNumber?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripe();
  const amountInCents = Math.round(data.amount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: data.currency || 'eur',
    metadata: {
      orderId: data.orderId || '',
      orderNumber: data.orderNumber || '',
      ...data.metadata,
    },
    receipt_email: data.customerEmail,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
  };
}

/**
 * Confirma manualmente un PaymentIntent (útil para testing o flujos síncronos).
 * Normalmente Stripe confirma automáticamente con confirmCardPayment del lado cliente.
 */
export async function confirmPaymentIntent(paymentIntentId: string) {
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status === 'succeeded') {
    return paymentIntent;
  }
  throw badRequest('El pago no se ha completado');
}

/**
 * Reembolsa (refund) un PaymentIntent completo o parcial.
 * @param paymentIntentId - ID del PaymentIntent en Stripe
 * @param amount - Cantidad a reembolsar en euros (opcional, si es parcial)
 * @param reason - Razón del reembolso
 */
export async function refundPayment(
  paymentIntentId: string,
  amount?: number,
  reason?: string
) {
  const stripe = getStripe();
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
    reason: (reason as 'requested_by_customer' | 'duplicate' | 'fraudulent') || 'requested_by_customer',
  };

  if (amount) {
    refundParams.amount = Math.round(amount * 100);
  }

  const refund = await stripe.refunds.create(refundParams);

  return {
    refundId: refund.id,
    status: refund.status,
    amount: refund.amount,
  };
}

/**
 * Reembolsa el pago asociado a un pedido y actualiza su estado.
 * Registra la acción en ActivityLog.
 */
export async function refundOrderPayment(
  orderId: string,
  adminUserId: string,
  adminUserName: string,
  amount?: number,
  reason?: string
) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw notFound('Pedido no encontrado');
  }

  const paymentIntentId = order.paymentInfo?.stripePaymentIntentId;
  if (!paymentIntentId) {
    throw badRequest('Este pedido no tiene un pago asociado en Stripe');
  }

  // Verificar que no esté ya reembolsado
  if (order.paymentInfo?.stripeRefundId) {
    throw badRequest('Este pedido ya ha sido reembolsado');
  }

  const refund = await refundPayment(paymentIntentId, amount, reason);

  // Actualizar el pedido
  order.paymentInfo = {
    ...order.paymentInfo,
    stripeRefundId: refund.refundId,
  };
  order.status = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    changedBy: adminUserId,
    changedAt: new Date(),
  });
  await order.save();

  // Registrar en ActivityLog
  await logActivity({
    action: 'REFUND',
    entity: 'order',
    entityId: order._id.toString(),
    userId: adminUserId,
    userName: adminUserName,
    details: `Reembolso de ${amount ? `${amount}€` : 'importe completo'} para pedido ${order.orderNumber}. Refund ID: ${refund.refundId}`,
    previousState: {
      oldStatus: 'confirmed',
      stripeRefundId: null,
    },
  });

  return {
    order: order.toObject(),
    refund,
  };
}
