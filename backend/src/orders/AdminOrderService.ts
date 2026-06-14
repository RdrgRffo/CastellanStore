import Order from './Order.js';
import Watch from '../catalog/Watch.js';
import User from '../auth/User.js';
import { eventBus } from '../shared/events/EventBus.js';
import { ORDER_CONFIRMED_EVENT, OrderConfirmedPayload } from '../shared/events/OrderConfirmedEvent.js';
import { ORDER_STATUS_CHANGED_EVENT, OrderStatusChangedPayload } from '../shared/events/OrderStatusChangedEvent.js';
import { notFound, badRequest } from '../shared/utils/AppError.js';
import { generateRectifyingInvoice } from '../invoicing/InvoiceService.js';
import { logActivity } from '../activityLog/ActivityLogService.js';

interface GetAllOrdersParams {
  status?: string;
  page: number;
  size: number;
}

export async function getOrderById(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw notFound('Pedido no encontrado');
  }
  return order;
}

export async function getAllOrders(params: GetAllOrdersParams) {
  const { status, page, size } = params;

  const filter: any = {};
  if (status) {
    filter.status = status;
  }

  const skip = page * size;

  const [items, totalItems] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(size),
    Order.countDocuments(filter),
  ]);

  return {
    data: items,
    page,
    size,
    totalItems,
    totalPages: Math.ceil(totalItems / size),
  };
}

// Transiciones de estado permitidas
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export async function updateOrderStatus(orderId: string, newStatus: string, changedBy: string = 'admin', changedByName?: string) {
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(newStatus)) {
    throw badRequest(`Estado inválido. Valores permitidos: ${validStatuses.join(', ')}`);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw notFound('Pedido no encontrado');
  }

  const oldStatus = order.status;

  // Validar transición permitida
  const allowed = ALLOWED_TRANSITIONS[oldStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw badRequest(`No se puede cambiar de "${oldStatus}" a "${newStatus}". Transiciones permitidas: ${allowed.join(', ') || 'ninguna'}`);
  }

  // Si se cancela un pedido que no estaba cancelado, restaurar stock
  if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
    for (const item of order.items) {
      await Watch.findByIdAndUpdate(item.watchId, { $inc: { stock: item.quantity } });
    }

    // Si el pedido ya había sido facturado (estaba en confirmed, shipped o delivered),
    // generar factura rectificativa
    if (oldStatus !== 'pending') {
      try {
        await generateRectifyingInvoice(
          order._id.toString(),
          order.orderNumber,
          'Cancelación por administrador'
        );
      } catch (err) {
        console.error(`[AdminOrderService] Error al generar factura rectificativa para ${order.orderNumber}:`, err);
      }
    }
  }

  // Si se confirma manualmente (de pending a confirmed), disparar evento de factura
  if (newStatus === 'confirmed' && oldStatus === 'pending') {
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
  }

  // Resolver el nombre del admin si no se proporcionó explícitamente
  if (!changedByName) {
    changedByName = changedBy;
    if (/^[a-f0-9]{24}$/i.test(changedBy)) {
      try {
        const adminUser = await User.findById(changedBy).select('name');
        if (adminUser && adminUser.name) {
          changedByName = adminUser.name;
        }
      } catch (err) {
        console.error(`[AdminOrderService] Error al buscar admin por ID ${changedBy}:`, err);
      }
    }
  }

  // Registrar en el historial de estados
  if (!order.statusHistory) {
    order.statusHistory = [];
  }
  order.statusHistory.push({
    status: newStatus,
    changedBy: changedByName,
    changedAt: new Date(),
  });

  order.status = newStatus as any;
  await order.save();

  // Emitir evento de cambio de estado para notificaciones
  await eventBus.emit(ORDER_STATUS_CHANGED_EVENT, {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    email: order.shippingInfo.email,
    oldStatus,
    newStatus,
    changedBy: changedByName,
  } as OrderStatusChangedPayload);

  await logActivity({
    action: 'ORDER_STATUS',
    entity: 'order',
    entityId: order._id.toString(),
    userId: /^[a-f0-9]{24}$/i.test(changedBy) ? changedBy : undefined,
    userName: changedByName !== changedBy ? changedByName : changedBy,
    details: `Estado cambiado de "${oldStatus}" a "${newStatus}" por ${changedByName}`,
    previousState: { oldStatus },
  });

  return order;
}
