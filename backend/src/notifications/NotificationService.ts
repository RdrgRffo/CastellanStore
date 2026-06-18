/**
 * Servicio de notificaciones transaccionales.
 * 
 * Envía emails con plantillas HTML atractivas usando Resend.
 * Si RESEND_API_KEY no está configurado, simula el envío en consola.
 */

import {
  sendEmail,
  welcomeEmailHtml,
  orderConfirmationHtml,
  orderStatusHtml,
  invoiceEmailHtml,
} from './EmailService.js';

/**
 * Notifica al cliente que su pedido ha sido confirmado.
 */
export async function notifyOrderConfirmed(
  email: string,
  orderNumber: string,
  options?: {
    name?: string;
    items?: Array<{ name: string; price: number; quantity: number }>;
    subtotal?: number;
    discount?: number;
    shipping?: number;
    total?: number;
    shippingAddress?: string;
  }
): Promise<void> {
  const name = options?.name || 'Cliente';
  const items = options?.items || [];
  const subtotal = options?.subtotal || 0;
  const discount = options?.discount || 0;
  const shipping = options?.shipping ?? 4.99;
  const total = options?.total || 0;
  const shippingAddress = options?.shippingAddress || '';

  const html = orderConfirmationHtml(name, orderNumber, items, subtotal, discount, shipping, total, shippingAddress);

  await sendEmail({
    to: email,
    subject: `✅ Pedido Confirmado — ${orderNumber}`,
    html,
  });
}

/**
 * Notifica al cliente que el estado de su pedido ha cambiado.
 */
export async function notifyOrderStatusChanged(
  email: string,
  orderNumber: string,
  newStatus: string,
  options?: {
    name?: string;
    trackingNumber?: string;
  }
): Promise<void> {
  const name = options?.name || 'Cliente';
  const trackingNumber = options?.trackingNumber;

  const html = orderStatusHtml(name, orderNumber, newStatus, trackingNumber);

  const statusEmojis: Record<string, string> = {
    pending: '⏳',
    confirmed: '✅',
    shipped: '📦',
    delivered: '🎉',
    cancelled: '❌',
  };

  await sendEmail({
    to: email,
    subject: `${statusEmojis[newStatus] || '📋'} Estado de Pedido Actualizado — ${orderNumber}`,
    html,
  });
}

/**
 * Notifica al usuario que se ha registrado correctamente.
 */
export async function notifyUserRegistered(
  email: string,
  name: string,
  couponCode: string
): Promise<void> {
  const html = welcomeEmailHtml(name, couponCode);

  await sendEmail({
    to: email,
    subject: '🎉 ¡Bienvenido a Castellan Store!',
    html,
  });
}

/**
 * Envía la factura de un pedido por email.
 */
export async function notifyInvoiceAvailable(
  email: string,
  name: string,
  orderNumber: string,
  pdfBase64?: string
): Promise<void> {
  const html = invoiceEmailHtml(name, orderNumber);

  const attachments = pdfBase64
    ? [{ filename: `factura-${orderNumber}.pdf`, content: pdfBase64, encoding: 'base64' }]
    : undefined;

  await sendEmail({
    to: email,
    subject: `📄 Factura disponible — ${orderNumber}`,
    html,
    attachments,
  });
}
