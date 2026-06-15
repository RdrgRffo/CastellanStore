export interface OrderConfirmedPayload {
  orderId: string;
  orderNumber: string;
  email: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingInfo: {
    name: string;
    email: string;
    address: string;
    city: string;
    zip: string;
  };
}

export const ORDER_CONFIRMED_EVENT = 'order.confirmed';
