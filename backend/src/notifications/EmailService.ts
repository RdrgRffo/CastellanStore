/**
 * Servicio de email transaccional usando Resend.
 * 
 * Configuración:
 *   RESEND_API_KEY=re_xxxxxxxxxxxx
 *   RESEND_FROM=Castellan Store <no-reply@tudominio.com>
 * 
 * Las plantillas HTML son responsive y visualmente atractivas,
 * diseñadas para la identidad de marca de Castellan Store.
 */

const RESEND_API_URL = 'https://api.resend.com';

interface Attachment {
  filename: string;
  content: string;
  encoding: string;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}

/**
 * Obtiene la configuración de Resend desde variables de entorno.
 */
function getConfig(): { apiKey: string; from: string } {
  const apiKey = process.env.RESEND_API_KEY || '';
  const from = process.env.RESEND_FROM || 'Castellan Store <no-reply@castellanstore.com>';

  if (!apiKey) {
    console.warn('[EmailService] RESEND_API_KEY no configurado. Los emails se simularán en consola.');
  }

  return { apiKey, from };
}

/**
 * Envía un email usando la API de Resend.
 * Si no hay API key configurada, simula el envío en consola.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const { apiKey, from } = getConfig();

  if (!apiKey) {
    console.log(`\n[EMAIL SIMULATED]`);
    console.log(`  From:    ${from}`);
    console.log(`  To:      ${payload.to}`);
    console.log(`  Subject: ${payload.subject}`);
    console.log(`  Body:    ${payload.html.substring(0, 300).replace(/<[^>]*>/g, '')}...`);
    console.log(`[EMAIL SIMULATED - Set RESEND_API_KEY to send real emails]\n`);
    return;
  }

  try {
    const response = await fetch(`${RESEND_API_URL}/emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        attachments: payload.attachments,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error (${response.status}): ${error}`);
    }

    const result = await response.json();
    console.log(`[EmailService] Email enviado a ${payload.to} — ID: ${result.id}`);
  } catch (err) {
    console.error(`[EmailService] Error al enviar email a ${payload.to}:`, err);
    throw err;
  }
}

// ============================================
// PLANTILLAS HTML
// ============================================

const BRAND_COLOR = '#8B6B4A'; // Dorado/cobre de Castellan
const BG_COLOR = '#f4f4f4';
const CARD_BG = '#ffffff';
const TEXT_COLOR = '#333333';
const FOOTER_BG = '#1a1a2e';

function wrapHtml(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Castellan Store</title>
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:${CARD_BG};border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${FOOTER_BG},#16213e);padding:30px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;letter-spacing:2px;">CASTELLAN</h1>
              <p style="color:${BRAND_COLOR};margin:5px 0 0;font-size:14px;letter-spacing:4px;text-transform:uppercase;">Relojería Premium</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;color:${TEXT_COLOR};font-size:16px;line-height:1.6;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:${FOOTER_BG};padding:25px 40px;text-align:center;">
              <p style="color:#888;margin:0 0 8px;font-size:13px;">
                Castellan Store — Relojería Premium
              </p>
              <p style="color:#666;margin:0;font-size:12px;">
                © ${new Date().getFullYear()} Castellan Store. Todos los derechos reservados.
              </p>
              <p style="color:#555;margin:8px 0 0;font-size:11px;">
                Si tienes alguna pregunta, responde a este email o contacta con nosotros en
                <a href="mailto:soporte@castellanstore.com" style="color:${BRAND_COLOR};text-decoration:none;">soporte@castellanstore.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Plantilla de bienvenida — se envía al registrarse un usuario.
 */
export function welcomeEmailHtml(name: string, couponCode: string): string {
  return wrapHtml(`
    <h2 style="color:${BRAND_COLOR};margin:0 0 20px;">¡Bienvenido a Castellan Store, ${name}!</h2>
    <p>Nos alegra darte la bienvenida a nuestra comunidad de amantes de la relojería premium.</p>
    <p>Como regalo de bienvenida, aquí tienes un <strong>10% de descuento</strong> en tu primera compra:</p>
    <div style="background-color:#faf6f0;border:2px dashed ${BRAND_COLOR};border-radius:8px;padding:20px;text-align:center;margin:25px 0;">
      <p style="font-size:14px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Código de descuento</p>
      <p style="font-size:32px;font-weight:bold;color:${BRAND_COLOR};margin:0;letter-spacing:4px;">${couponCode}</p>
      <p style="font-size:13px;color:#999;margin:8px 0 0;">Válido por 30 días</p>
    </div>
    <p>Explora nuestra colección y encuentra el reloj perfecto para ti.</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/watches"
         style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
        Ver Colección
      </a>
    </div>
    <p style="color:#999;font-size:14px;">¡Gracias por unirte a nosotros!</p>
    <p style="color:#999;font-size:14px;">— El equipo de Castellan</p>
  `);
}

/**
 * Plantilla de confirmación de pedido — se envía al realizar una compra.
 */
export function orderConfirmationHtml(
  name: string,
  orderNumber: string,
  items: Array<{ name: string; price: number; quantity: number }>,
  subtotal: number,
  discount: number,
  shipping: number,
  total: number,
  shippingAddress: string
): string {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee;color:${TEXT_COLOR};">
        ${item.name} <span style="color:#999;font-size:14px;">x${item.quantity}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;color:${TEXT_COLOR};">
        ${(item.price * item.quantity).toFixed(2)}€
      </td>
    </tr>
  `).join('');

  return wrapHtml(`
    <h2 style="color:${BRAND_COLOR};margin:0 0 10px;">¡Pedido Confirmado!</h2>
    <p style="color:#666;font-size:14px;">Hola <strong>${name}</strong>, tu pedido ha sido confirmado.</p>

    <div style="background-color:#f9f9f9;border-radius:8px;padding:15px 20px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#666;">NÚMERO DE PEDIDO</p>
      <p style="margin:5px 0 0;font-size:22px;font-weight:bold;color:${BRAND_COLOR};letter-spacing:2px;">${orderNumber}</p>
    </div>

    <h3 style="color:${TEXT_COLOR};margin:25px 0 10px;font-size:16px;">Resumen del pedido</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;">
      ${itemsHtml}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:15px;font-size:15px;">
      <tr>
        <td style="padding:5px 0;color:#666;">Subtotal</td>
        <td style="padding:5px 0;text-align:right;color:${TEXT_COLOR};">${subtotal.toFixed(2)}€</td>
      </tr>
      ${discount > 0 ? `
      <tr>
        <td style="padding:5px 0;color:#666;">Descuento</td>
        <td style="padding:5px 0;text-align:right;color:#e74c3c;">-${discount.toFixed(2)}€</td>
      </tr>` : ''}
      <tr>
        <td style="padding:5px 0;color:#666;">Envío</td>
        <td style="padding:5px 0;text-align:right;color:${TEXT_COLOR};">${shipping === 0 ? 'Gratis' : shipping.toFixed(2) + '€'}</td>
      </tr>
      <tr>
        <td style="padding:10px 0 5px;border-top:2px solid ${BRAND_COLOR};font-weight:bold;font-size:18px;color:${TEXT_COLOR};">Total</td>
        <td style="padding:10px 0 5px;border-top:2px solid ${BRAND_COLOR};text-align:right;font-weight:bold;font-size:18px;color:${BRAND_COLOR};">${total.toFixed(2)}€</td>
      </tr>
    </table>

    <h3 style="color:${TEXT_COLOR};margin:25px 0 10px;font-size:16px;">Dirección de envío</h3>
    <p style="color:#666;font-size:14px;margin:0;">${shippingAddress}</p>

    <p style="color:#999;font-size:14px;margin-top:25px;">
      Recibirás una notificación cuando tu pedido sea enviado.
      Puedes consultar el estado en tu panel de usuario.
    </p>

    <div style="text-align:center;margin:30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${orderNumber}"
         style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
        Ver mi pedido
      </a>
    </div>
  `);
}

/**
 * Plantilla de cambio de estado de pedido.
 */
export function orderStatusHtml(
  name: string,
  orderNumber: string,
  newStatus: string,
  trackingNumber?: string
): string {
  const statusLabels: Record<string, { label: string; icon: string; message: string }> = {
    pending: { label: 'Pendiente', icon: '⏳', message: 'Tu pedido está pendiente de procesar.' },
    confirmed: { label: 'Confirmado', icon: '✅', message: 'Tu pedido ha sido confirmado y estamos preparándolo.' },
    shipped: { label: 'Enviado', icon: '📦', message: '¡Tu pedido está en camino!' },
    delivered: { label: 'Entregado', icon: '🎉', message: 'Tu pedido ha sido entregado. ¡Esperamos que lo disfrutes!' },
    cancelled: { label: 'Cancelado', icon: '❌', message: 'Tu pedido ha sido cancelado.' },
  };

  const statusInfo = statusLabels[newStatus] || { label: newStatus, icon: '📋', message: 'El estado de tu pedido ha cambiado.' };

  return wrapHtml(`
    <h2 style="color:${BRAND_COLOR};margin:0 0 10px;">Actualización de tu pedido</h2>
    <p style="color:#666;font-size:14px;">Hola <strong>${name}</strong>, el estado de tu pedido ha cambiado.</p>

    <div style="background-color:#f9f9f9;border-radius:8px;padding:15px 20px;margin:20px 0;text-align:center;">
      <p style="font-size:48px;margin:0;">${statusInfo.icon}</p>
      <p style="margin:10px 0 5px;font-size:13px;color:#666;">ESTADO ACTUAL</p>
      <p style="margin:0;font-size:24px;font-weight:bold;color:${BRAND_COLOR};letter-spacing:2px;">${statusInfo.label}</p>
    </div>

    <p style="font-size:16px;color:${TEXT_COLOR};text-align:center;">${statusInfo.message}</p>

    <div style="background-color:#f9f9f9;border-radius:8px;padding:15px 20px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#666;">NÚMERO DE PEDIDO</p>
      <p style="margin:5px 0 0;font-size:18px;font-weight:bold;color:${TEXT_COLOR};">${orderNumber}</p>
      ${trackingNumber ? `
      <p style="margin:15px 0 0;font-size:13px;color:#666;">NÚMERO DE SEGUIMIENTO</p>
      <p style="margin:5px 0 0;font-size:18px;font-weight:bold;color:${BRAND_COLOR};">${trackingNumber}</p>` : ''}
    </div>

    <div style="text-align:center;margin:30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${orderNumber}"
         style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
        Ver mi pedido
      </a>
    </div>
  `);
}

/**
 * Plantilla para adjuntar factura PDF.
 */
export function invoiceEmailHtml(name: string, orderNumber: string): string {
  return wrapHtml(`
    <h2 style="color:${BRAND_COLOR};margin:0 0 10px;">Factura de tu pedido</h2>
    <p style="color:#666;font-size:14px;">Hola <strong>${name}</strong>,</p>
    <p>Adjuntamos la factura correspondiente a tu pedido <strong>${orderNumber}</strong>.</p>
    <p>Puedes descargarla también desde tu panel de usuario en cualquier momento.</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/invoices/${orderNumber}"
         style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
        Ver mis facturas
      </a>
    </div>
  `);
}
