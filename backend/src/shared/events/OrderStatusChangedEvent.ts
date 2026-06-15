export const ORDER_STATUS_CHANGED_EVENT = 'order.status.changed';

export interface OrderStatusChangedPayload {
  orderId: string;
  orderNumber: string;
  email: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
}
