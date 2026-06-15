import { OrderConfirmedPayload } from '../shared/events/OrderConfirmedEvent.js';
import { generateInvoice } from './InvoiceService.js';

export async function handleOrderConfirmed(payload: OrderConfirmedPayload): Promise<void> {
  // 1. Generar factura
  await generateInvoice(payload);

  // 2. Simular envío de email de confirmación
  console.log(`[Email] Enviando confirmación de pedido a ${payload.email}`);
  console.log(`[Email] Asunto: Pedido #${payload.orderNumber} confirmado`);
  console.log(`[Email] Cuerpo: Gracias por tu compra en Castellan Store.`);
  console.log(`[Email] Total: ${payload.total}€`);
  console.log(`[Email] Productos:`);
  payload.items.forEach(item => {
    console.log(`[Email]   - ${item.name} x${item.quantity} = ${item.price * item.quantity}€`);
  });
  console.log(`[Email] Dirección de envío: ${payload.shippingInfo.address}, ${payload.shippingInfo.city}`);
  console.log(`[Email] Factura disponible en: /api/v1/invoices/${payload.orderNumber}`);
}
