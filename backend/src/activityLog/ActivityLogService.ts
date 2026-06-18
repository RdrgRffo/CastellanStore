import ActivityLog from './ActivityLog.js';
import User from '../auth/User.js';
import Watch from '../catalog/Watch.js';
import Coupon from '../coupons/Coupon.js';
import Order from '../orders/Order.js';
import { notFound, badRequest } from '../shared/utils/AppError.js';

interface LogEntry {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  details?: string;
  previousState?: Record<string, any>;
}

/**
 * Resuelve el nombre de usuario a partir del userId si no se proporcionó userName.
 */
async function resolveUserName(userId?: string, providedName?: string): Promise<string | undefined> {
  if (providedName) return providedName;
  if (!userId) return undefined;
  try {
    const user = await User.findById(userId).select('name');
    return user?.name || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Registra una acción administrativa en el log de actividad.
 * Si no se proporciona userName pero sí userId, lo resuelve automáticamente.
 */
export async function logActivity(entry: LogEntry): Promise<void> {
  try {
    const userName = await resolveUserName(entry.userId, entry.userName);
    await ActivityLog.create({
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      userId: entry.userId,
      userName,
      details: entry.details,
      previousState: entry.previousState,
    });
  } catch (err) {
    console.error('[ActivityLog] Error al registrar actividad:', err);
  }
}

/**
 * Obtiene los logs de actividad con paginación.
 */
export async function getActivityLogs(page: number = 0, size: number = 20) {
  const skip = page * size;

  const [items, totalItems] = await Promise.all([
    ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(size),
    ActivityLog.countDocuments(),
  ]);

  return {
    data: items,
    page,
    size,
    totalItems,
    totalPages: Math.ceil(totalItems / size),
  };
}

/**
 * Revierte una acción registrada en el log de actividad.
 * Solo se puede revertir si el log tiene previousState.
 */
export async function rollbackActivity(logId: string, userId: string): Promise<any> {
  const log = await ActivityLog.findById(logId);
  if (!log) {
    throw notFound('Registro de actividad no encontrado');
  }

  if (!log.previousState) {
    throw badRequest('Esta acción no se puede revertir porque no tiene estado anterior guardado');
  }

  const { action, entity, entityId } = log;

  switch (action) {
    // === Acciones de producción ===
    case 'PRODUCT_UPDATE':
    case 'UPDATE_PRODUCT': {
      // Restaurar el producto a su estado anterior
      const updated = await Watch.findByIdAndUpdate(entityId, log.previousState, { new: true });
      if (!updated) throw notFound('Producto no encontrado');
      break;
    }
    case 'PRODUCT_DELETE': {
      // Re-crear el producto con el estado anterior
      await Watch.create(log.previousState);
      break;
    }
    case 'COUPON_UPDATE':
    case 'UPDATE_COUPON': {
      const updatedCoupon = await Coupon.findByIdAndUpdate(entityId, log.previousState, { new: true });
      if (!updatedCoupon) throw notFound('Cupón no encontrado');
      break;
    }
    case 'COUPON_DELETE':
    case 'DELETE_COUPON': {
      await Coupon.create(log.previousState);
      break;
    }
    case 'ORDER_STATUS':
    case 'UPDATE_STATUS': {
      // Restaurar el estado anterior del pedido
      const order = await Order.findById(entityId);
      if (!order) throw notFound('Pedido no encontrado');
      const oldStatus = log.previousState.oldStatus;
      if (!oldStatus) throw badRequest('No se pudo determinar el estado anterior');

      // Quitar la última entrada del historial (el cambio que estamos revirtiendo)
      if (order.statusHistory && order.statusHistory.length > 0) {
        order.statusHistory.pop();
      }
      order.status = oldStatus;
      await order.save();
      break;
    }
    case 'ROLE_CHANGE':
    case 'UPDATE_USER_ROLE': {
      const user = await User.findById(entityId);
      if (!user) throw notFound('Usuario no encontrado');
      user.role = log.previousState.oldRole;
      await user.save();
      break;
    }
    case 'BLOCK':
    case 'UNBLOCK':
    case 'BLOCK_USER':
    case 'UNBLOCK_USER': {
      const blockedUser = await User.findById(entityId);
      if (!blockedUser) throw notFound('Usuario no encontrado');
      (blockedUser as any).blocked = log.previousState.wasBlocked;
      await blockedUser.save();
      break;
    }
    case 'STOCK_UPDATE':
    case 'UPDATE_STOCK': {
      const product = await Watch.findById(entityId);
      if (!product) throw notFound('Producto no encontrado');
      product.stock = log.previousState.oldStock;
      await product.save();
      break;
    }
    default:
      throw badRequest(`No se puede revertir la acción "${action}"`);
  }

  // Registrar la acción de rollback
  await logActivity({
    action: 'ROLLBACK',
    entity,
    entityId,
    userId,
    details: `Acción revertida: ${action} — ${log.details || ''}`,
  });

  return { message: 'Acción revertida correctamente', revertedAction: action };
}
