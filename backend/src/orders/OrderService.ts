import { v4 as uuidv4 } from 'uuid';
import Order from './Order.js';
import Watch from '../catalog/Watch.js';
import { eventBus } from '../shared/events/EventBus.js';
import { ORDER_CONFIRMED_EVENT, OrderConfirmedPayload } from '../shared/events/OrderConfirmedEvent.js';
import { ORDER_STATUS_CHANGED_EVENT, OrderStatusChangedPayload } from '../shared/events/OrderStatusChangedEvent.js';
import { badRequest, notFound } from '../shared/utils/AppError.js';
import { generateRectifyingInvoice } from '../invoicing/InvoiceService.js';

function generateOrderNumber(): string {
  const shortId = uuidv4().split('-')[0].toUpperCase();
  return `CAST-${shortId}`;
}

/**
 * Añade una entrada al historial de estados de un pedido.
 */
function addStatusHistoryEntry(order: any, newStatus: string, changedBy: string = 'system') {
  if (!order.statusHistory) {
    order.statusHistory = [];
  }
  order.statusHistory.push({
    status: newStatus,
    changedBy,
    changedAt: new Date(),
  });
}

export async function create(data: {
  userId?: string;
  items: any[];
  subtotal: number;
  discount: number;
  shipping: number;
  shippingMethod?: string;
  total: number;
  couponCode?: string;
  shippingInfo: any;
  paymentInfo?: any;
  /** Si es true, el pedido se crea en 'pending' y se confirma vía webhook de Stripe */
  useStripe?: boolean;
}) {
  const isStripePayment = data.useStripe === true;

  const orderData: any = {
    orderNumber: generateOrderNumber(),
    items: data.items,
    subtotal: data.subtotal,
    discount: data.discount,
    shipping: data.shipping,
    shippingMethod: data.shippingMethod || 'standard',
    total: data.total,
    couponCode: data.couponCode,
    shippingInfo: data.shippingInfo,
    paymentInfo: {
      cardLastFour: data.paymentInfo?.cardNumber?.slice(-4) || '',
      cardName: data.paymentInfo?.cardName || '',
    },
    // Si es pago con Stripe, el pedido nace en 'pending' y el webhook lo confirma
    status: isStripePayment ? 'pending' : 'confirmed',
    statusHistory: isStripePayment
      ? [{ status: 'pending', changedBy: 'system', changedAt: new Date() }]
      : [{ status: 'confirmed', changedBy: 'system', changedAt: new Date() }],
  };

  if (data.userId) {
    orderData.userId = data.userId;
  }

  const order = await Order.create(orderData);

  // Si NO es pago con Stripe, emitir evento de confirmación inmediatamente
  if (!isStripePayment) {
    await eventBus.emit(ORDER_CONFIRMED_EVENT, {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      email: data.shippingInfo.email,
      items: data.items.map((item: any) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal: data.subtotal,
      discount: data.discount,
      shipping: data.shipping,
      total: data.total,
      shippingInfo: {
        name: data.shippingInfo.name,
        email: data.shippingInfo.email,
        address: data.shippingInfo.address,
        city: data.shippingInfo.city,
        zip: data.shippingInfo.zip,
      },
    } as OrderConfirmedPayload);
  } else {
    console.log(`[OrderService] Pedido ${order.orderNumber} creado en 'pending' — esperando confirmación de Stripe`);
  }

  return order;
}

/**
 * Cancela un pedido en estado 'pending'.
 * Solo el propietario del pedido puede cancelarlo.
 */
/**
 * Confirma un pedido que estaba en 'pending' después de un pago exitoso con Stripe.
 * Esto se llama desde el frontend cuando Stripe confirma el pago, como fallback
 * por si el webhook de Stripe no está configurado.
 */
export async function confirmStripeOrder(orderId: string, paymentIntentId: string) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw notFound('Pedido no encontrado');
  }

  if (order.status !== 'pending') {
    // Si ya está confirmado, no hay problema
    return order;
  }

  // Actualizar el pedido
  order.status = 'confirmed';
  order.paymentInfo = {
    ...order.paymentInfo,
    stripePaymentIntentId: paymentIntentId,
  };
  addStatusHistoryEntry(order, 'confirmed', 'stripe');
  await order.save();

  // Emitir evento de confirmación para generar factura y notificaciones
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

  await eventBus.emit(ORDER_STATUS_CHANGED_EVENT, {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    email: order.shippingInfo.email,
    oldStatus: 'pending',
    newStatus: 'confirmed',
    changedBy: 'stripe',
  } as OrderStatusChangedPayload);

  console.log(`[OrderService] Pedido ${order.orderNumber} confirmado tras pago Stripe (${paymentIntentId})`);
  return order;
}

export async function cancelOrder(orderId: string, userId: string) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw notFound('Pedido no encontrado');
  }

  // Verificar que el pedido pertenece al usuario
  if (order.userId?.toString() !== userId) {
    throw badRequest('No puedes cancelar un pedido que no te pertenece');
  }

  // Solo se puede cancelar si está en 'pending' o 'confirmed'
  if (order.status !== 'pending' && order.status !== 'confirmed') {
    throw badRequest('Solo puedes cancelar pedidos en estado pendiente o confirmado');
  }

  // Restaurar stock de los productos
  for (const item of order.items) {
    await Watch.findByIdAndUpdate(item.watchId, { $inc: { stock: item.quantity } });
  }

  // Actualizar estado y registrar en historial
  order.status = 'cancelled';
  addStatusHistoryEntry(order, 'cancelled', userId);
  await order.save();

  // Emitir evento de cambio de estado
  await eventBus.emit(ORDER_STATUS_CHANGED_EVENT, {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    email: order.shippingInfo.email,
    oldStatus: 'pending',
    newStatus: 'cancelled',
    changedBy: userId,
  } as OrderStatusChangedPayload);

  return order;
}
