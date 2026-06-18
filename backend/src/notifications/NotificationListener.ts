import { eventBus } from '../shared/events/EventBus.js';
import { ORDER_CONFIRMED_EVENT, OrderConfirmedPayload } from '../shared/events/OrderConfirmedEvent.js';
import { ORDER_STATUS_CHANGED_EVENT, OrderStatusChangedPayload } from '../shared/events/OrderStatusChangedEvent.js';
import { USER_REGISTERED_EVENT, UserRegisteredPayload } from '../shared/events/UserRegisteredEvent.js';
import { notifyOrderConfirmed, notifyOrderStatusChanged, notifyUserRegistered } from './NotificationService.js';

/**
 * Escucha eventos de pedidos y usuarios, y envía notificaciones por email.
 */
export function registerNotificationListeners(): void {
  // Notificar cuando se confirma un pedido
  eventBus.on(ORDER_CONFIRMED_EVENT, async (payload: OrderConfirmedPayload) => {
    try {
      await notifyOrderConfirmed(payload.email, payload.orderNumber);
    } catch (err) {
      console.error(`[NotificationListener] Error al notificar pedido confirmado ${payload.orderNumber}:`, err);
    }
  });

  // Notificar cuando cambia el estado de un pedido
  eventBus.on(ORDER_STATUS_CHANGED_EVENT, async (payload: OrderStatusChangedPayload) => {
    try {
      await notifyOrderStatusChanged(payload.email, payload.orderNumber, payload.newStatus);
    } catch (err) {
      console.error(`[NotificationListener] Error al notificar cambio de estado ${payload.orderNumber}:`, err);
    }
  });

  // Notificar cuando un usuario se registra
  eventBus.on(USER_REGISTERED_EVENT, async (payload: UserRegisteredPayload) => {
    try {
      await notifyUserRegistered(payload.email, payload.name || 'Cliente', 'BIENVENIDA10');
    } catch (err) {
      console.error(`[NotificationListener] Error al notificar registro de ${payload.email}:`, err);
    }
  });
}
