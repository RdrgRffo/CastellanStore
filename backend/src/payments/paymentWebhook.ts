import { Request, Response } from 'express';
import Stripe from 'stripe';
import Order from '../orders/Order.js';
import { logActivity } from '../activityLog/ActivityLogService.js';
import { eventBus } from '../shared/events/EventBus.js';
import { ORDER_CONFIRMED_EVENT, OrderConfirmedPayload } from '../shared/events/OrderConfirmedEvent.js';
import { ORDER_STATUS_CHANGED_EVENT, OrderStatusChangedPayload } from '../shared/events/OrderStatusChangedEvent.js';

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
 * POST /api/v1/payments/webhook
 * Maneja los webhooks de Stripe (especialmente payment_intent.succeeded).
 * Express raw body middleware requerido (sin JSON.parse).
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET no configurado');
    res.status(200).json({ received: true });
    return;
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Error de firma:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Manejar el evento
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSucceeded(paymentIntent);
      break;
    }
    case 'payment_intent.payment_failed': {
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.warn('[Stripe Webhook] Pago fallido:', failedPayment.id);
      break;
    }
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      console.log('[Stripe Webhook] Cargo reembolsado:', charge.id);
      break;
    }
    default:
      console.log(`[Stripe Webhook] Evento no manejado: ${event.type}`);
  }

  res.json({ received: true });
}

/**
 * Cuando un pago se completa en Stripe, actualizamos el pedido asociado.
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    console.warn('[Stripe Webhook] PaymentIntent sin orderId en metadata:', paymentIntent.id);
    return;
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.warn('[Stripe Webhook] Pedido no encontrado:', orderId);
      return;
    }

    // Si el pedido ya está confirmado, no hacer nada
    if (order.status === 'confirmed') {
      return;
    }

    // Actualizar el pedido con la información del pago
    order.paymentInfo = {
      ...order.paymentInfo,
      stripePaymentIntentId: paymentIntent.id,
    };

    // Si el pedido estaba en 'pending', pasar a 'confirmed'
    if (order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        changedBy: 'stripe',
        changedAt: new Date(),
      });
    }

    await order.save();

    // ============================================
    // EMITIR EVENTOS DEL EVENT BUS
    // ============================================

    // 1. Emitir ORDER_CONFIRMED_EVENT para generar factura
    await eventBus.emit(ORDER_CONFIRMED_EVENT, {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      email: order.shippingInfo.email,
      items: order.items.map((item: any) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      total: order.total,
      shippingInfo: {
        name: order.shippingInfo.name,
        email: order.shippingInfo.email,
        address: order.shippingInfo.address,
        city: order.shippingInfo.city,
        zip: order.shippingInfo.zip,
      },
    } as OrderConfirmedPayload);

    // 2. Emitir ORDER_STATUS_CHANGED_EVENT para notificaciones
    await eventBus.emit(ORDER_STATUS_CHANGED_EVENT, {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      email: order.shippingInfo.email,
      oldStatus: 'pending',
      newStatus: 'confirmed',
      changedBy: 'stripe',
    } as OrderStatusChangedPayload);

    await logActivity({
      action: 'ORDER_STATUS',
      entity: 'order',
      entityId: order._id.toString(),
      userId: 'stripe',
      userName: 'Stripe Webhook',
      details: `Pago confirmado vía Stripe para pedido ${order.orderNumber}. PaymentIntent: ${paymentIntent.id}`,
      previousState: { oldStatus: 'pending' },
    });

    console.log(`[Stripe Webhook] Pedido ${order.orderNumber} confirmado por pago ${paymentIntent.id}`);
    console.log(`[Stripe Webhook] Eventos emitidos: ORDER_CONFIRMED_EVENT + ORDER_STATUS_CHANGED_EVENT`);
  } catch (err) {
    console.error('[Stripe Webhook] Error al procesar payment_intent.succeeded:', err);
  }
}
