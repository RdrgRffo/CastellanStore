import Invoice from './Invoice.js';
import { OrderConfirmedPayload } from '../shared/events/OrderConfirmedEvent.js';
import { sendEmail } from '../notifications/EmailService.js';
import { generateInvoicePdf } from './InvoicePdfService.js';

const TAX_RATE = 21; // IVA 21%

async function getNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^FACT-${year}-` },
  }).sort({ invoiceNumber: -1 });

  let nextNum = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-');
    nextNum = parseInt(parts[2], 10) + 1;
  }

  return `FACT-${year}-${String(nextNum).padStart(4, '0')}`;
}

async function getNextRectifyingInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^RECT-${year}-` },
  }).sort({ invoiceNumber: -1 });

  let nextNum = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-');
    nextNum = parseInt(parts[2], 10) + 1;
  }

  return `RECT-${year}-${String(nextNum).padStart(4, '0')}`;
}

export async function generateInvoice(payload: OrderConfirmedPayload) {
  const invoiceNumber = await getNextInvoiceNumber();
  const taxableBase = payload.subtotal - payload.discount + payload.shipping;
  const taxAmount = Math.round((taxableBase * TAX_RATE) / 100 * 100) / 100;
  const totalWithTax = taxableBase + taxAmount;

  const invoice = await Invoice.create({
    orderId: payload.orderId,
    invoiceNumber,
    buyerInfo: {
      name: payload.shippingInfo.name,
      email: payload.email,
      address: payload.shippingInfo.address,
      city: payload.shippingInfo.city,
      zip: payload.shippingInfo.zip,
    },
    items: payload.items,
    subtotal: payload.subtotal,
    discount: payload.discount,
    shipping: payload.shipping,
    taxRate: TAX_RATE,
    taxAmount,
    total: totalWithTax,
    issuedAt: new Date(),
  });

  console.log(`[Invoice] Factura ${invoiceNumber} generada para ${payload.email}`);

  // Enviar factura por email con PDF adjunto
  try {
    const invoiceObj = await Invoice.findById(invoice._id).lean();
    if (invoiceObj) {
      (invoiceObj as any).orderNumber = payload.orderNumber;
      const pdfBuffer = await generateInvoicePdf(invoiceObj as any);
      const pdfBase64 = pdfBuffer.toString('base64');

      await sendEmail({
        to: payload.email,
        subject: `Tu factura de Castellan Store - ${invoiceNumber}`,
        html: `
          <h1>¡Gracias por tu compra!</h1>
          <p>Adjuntamos la factura <strong>${invoiceNumber}</strong> para tu pedido <strong>${payload.orderNumber}</strong>.</p>
          <p><strong>Total:</strong> ${totalWithTax.toFixed(2)} € (IVA ${TAX_RATE}% incluido)</p>
          <p>Puedes descargar la factura desde tu panel de usuario en cualquier momento.</p>
          <hr>
          <p>Castellan Store — Relojería Premium</p>
        `,
        attachments: [{
          filename: `factura-${payload.orderNumber}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
        }],
      });
    }
  } catch (err) {
    console.error(`[Invoice] Error al enviar factura ${invoiceNumber} por email:`, err);
  }

  return invoice;
}

/**
 * Genera una factura rectificativa cuando se cancela un pedido ya facturado.
 * La factura rectificativa tiene importes negativos y referencia a la factura original.
 */
export async function generateRectifyingInvoice(orderId: string, orderNumber: string, reason: string = 'Cancelación del pedido') {
  const originalInvoice = await Invoice.findOne({ orderId });
  if (!originalInvoice) {
    console.log(`[Invoice] No hay factura original para el pedido ${orderNumber}, no se genera rectificativa`);
    return null;
  }

  // Si ya está cancelada, no generar otra rectificativa
  if (originalInvoice.status === 'cancelled') {
    console.log(`[Invoice] La factura ${originalInvoice.invoiceNumber} ya está cancelada`);
    return originalInvoice;
  }

  const rectifyingNumber = await getNextRectifyingInvoiceNumber();

  // Crear factura rectificativa con importes negativos
  const rectifyingInvoice = await Invoice.create({
    orderId,
    invoiceNumber: rectifyingNumber,
    rectifiesInvoice: originalInvoice.invoiceNumber,
    buyerInfo: { ...originalInvoice.buyerInfo },
    items: originalInvoice.items.map(item => ({
      ...item,
      price: -Math.abs(item.price),
    })),
    subtotal: -Math.abs(originalInvoice.subtotal),
    discount: -Math.abs(originalInvoice.discount),
    shipping: -Math.abs(originalInvoice.shipping),
    taxRate: TAX_RATE,
    taxAmount: -Math.abs(originalInvoice.taxAmount),
    total: -Math.abs(originalInvoice.total),
    status: 'issued',
    issuedAt: new Date(),
  });

  // Marcar la factura original como cancelada
  originalInvoice.status = 'cancelled';
  await originalInvoice.save();

  console.log(`[Invoice] Factura rectificativa ${rectifyingNumber} generada para pedido ${orderNumber}`);
  console.log(`[Invoice] Factura original ${originalInvoice.invoiceNumber} marcada como cancelada`);

  // Notificar al cliente
  try {
    await sendEmail({
      to: originalInvoice.buyerInfo.email,
      subject: `Factura rectificativa - ${rectifyingNumber}`,
      html: `
        <h1>Factura Rectificativa</h1>
        <p>Se ha generado la factura rectificativa <strong>${rectifyingNumber}</strong> para el pedido <strong>${orderNumber}</strong>.</p>
        <p><strong>Motivo:</strong> ${reason}</p>
        <p>La factura original <strong>${originalInvoice.invoiceNumber}</strong> ha sido anulada.</p>
        <p>El importe de ${Math.abs(originalInvoice.total).toFixed(2)} € será reembolsado según el método de pago utilizado.</p>
        <hr>
        <p>Castellan Store — Relojería Premium</p>
      `,
    });
  } catch (err) {
    console.error(`[Invoice] Error al notificar factura rectificativa ${rectifyingNumber}:`, err);
  }

  return rectifyingInvoice;
}

export async function getInvoiceByOrderNumber(orderNumber: string) {
  const { default: Order } = await import('../orders/Order.js');
  const order = await Order.findOne({ orderNumber });
  if (!order) return null;

  const invoice = await Invoice.findOne({ orderId: order._id });
  if (!invoice) return null;

  // Añadir el orderNumber a la factura para mostrarlo en el PDF
  const invoiceObj = invoice.toObject();
  (invoiceObj as any).orderNumber = order.orderNumber;
  return invoiceObj;
}
