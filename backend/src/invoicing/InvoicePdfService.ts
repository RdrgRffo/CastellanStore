import PDFDocument from 'pdfkit';
import { IInvoice } from './Invoice.js';

const COMPANY = {
  name: 'Castellan Store S.L.',
  vatId: 'B-12345678',
  address: 'Calle del Relojero, 12',
  city: '28001 Madrid, España',
  email: 'facturacion@castellanstore.com',
  phone: '+34 912 345 678',
};

export function generateInvoicePdf(invoice: IInvoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // ============================================
    // ENCABEZADO
    // ============================================
    doc.fontSize(24).font('Helvetica-Bold').text('CASTELLAN STORE', 50, 50);
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
      .text('FACTURA', 50, 80);

    // Línea separadora
    doc.moveTo(50, 95).lineTo(545, 95).strokeColor('#cccccc').stroke();

    // ============================================
    // DATOS DEL EMISOR (Castellan Store)
    // ============================================
    const emitterY = 110;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
      .text('EMISOR', 50, emitterY);
    doc.fontSize(9).font('Helvetica').fillColor('#555555')
      .text(COMPANY.name, 50, emitterY + 16)
      .text(`NIF: ${COMPANY.vatId}`, 50, emitterY + 32)
      .text(COMPANY.address, 50, emitterY + 48)
      .text(COMPANY.city, 50, emitterY + 64)
      .text(`Tel: ${COMPANY.phone}`, 50, emitterY + 80)
      .text(`Email: ${COMPANY.email}`, 50, emitterY + 96);

    // ============================================
    // DATOS DEL CLIENTE
    // ============================================
    const clientX = 300;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
      .text('CLIENTE', clientX, emitterY);
    doc.fontSize(9).font('Helvetica').fillColor('#555555')
      .text(invoice.buyerInfo.name, clientX, emitterY + 16)
      .text(invoice.buyerInfo.address, clientX, emitterY + 32)
      .text(`${invoice.buyerInfo.city}, ${invoice.buyerInfo.zip}`, clientX, emitterY + 48)
      .text(`Email: ${invoice.buyerInfo.email}`, clientX, emitterY + 64);

    // ============================================
    // DATOS DE LA FACTURA
    // ============================================
    const invoiceInfoY = emitterY + 130;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
      .text('DATOS DE LA FACTURA', 50, invoiceInfoY);
    doc.fontSize(9).font('Helvetica').fillColor('#555555')
      .text(`Nº Factura: ${invoice.invoiceNumber}`, 50, invoiceInfoY + 16)
      .text(`Fecha de emisión: ${new Date(invoice.issuedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, invoiceInfoY + 32)
      .text(`Nº Pedido: ${(invoice as any).orderNumber || invoice.orderId}`, 50, invoiceInfoY + 48);

    // ============================================
    // TABLA DE PRODUCTOS
    // ============================================
    const tableTop = invoiceInfoY + 80;
    const tableHeaders = ['Producto', 'Cant.', 'Precio Ud.', 'Total'];
    const colWidths = [250, 50, 90, 90];
    const colPositions = [50, 300, 350, 440];

    // Cabecera de la tabla
    doc.rect(50, tableTop - 6, 495, 22).fill('#1a1a1a');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
    tableHeaders.forEach((header, i) => {
      doc.text(header, colPositions[i], tableTop, { width: colWidths[i], align: i === 0 ? 'left' : 'right' });
    });

    // Filas de productos
    let rowY = tableTop + 24;
    doc.fontSize(9).font('Helvetica').fillColor('#333333');

    invoice.items.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      const rowHeight = 20;

      // Alternar color de fondo
      if (index % 2 === 0) {
        doc.rect(50, rowY - 4, 495, rowHeight).fill('#f9f9f9');
      }

      doc.fillColor('#333333');
      doc.text(item.name, colPositions[0], rowY, { width: colWidths[0] });
      doc.text(String(item.quantity), colPositions[1], rowY, { width: colWidths[1], align: 'right' });
      doc.text(`${item.price.toFixed(2)} €`, colPositions[2], rowY, { width: colWidths[2], align: 'right' });
      doc.text(`${itemTotal.toFixed(2)} €`, colPositions[3], rowY, { width: colWidths[3], align: 'right' });

      rowY += rowHeight;
    });

    // Línea separadora
    doc.moveTo(50, rowY + 4).lineTo(545, rowY + 4).strokeColor('#cccccc').stroke();

    // ============================================
    // TOTALES
    // ============================================
    const totalsY = rowY + 16;
    const totalsX = 350;
    const lineHeight = 18;

    doc.fontSize(9).font('Helvetica').fillColor('#555555');
    doc.text('Subtotal:', totalsX, totalsY, { width: 145, align: 'right' });
    doc.text(`${invoice.subtotal.toFixed(2)} €`, totalsX + 100, totalsY, { width: 95, align: 'right' });

    if (invoice.discount > 0) {
      doc.text('Descuento:', totalsX, totalsY + lineHeight, { width: 145, align: 'right' });
      doc.text(`-${invoice.discount.toFixed(2)} €`, totalsX + 100, totalsY + lineHeight, { width: 95, align: 'right' });
    }

    const shippingLabelY = totalsY + (invoice.discount > 0 ? lineHeight * 2 : lineHeight);
    doc.text('Envío:', totalsX, shippingLabelY, { width: 145, align: 'right' });
    doc.text(`${invoice.shipping.toFixed(2)} €`, totalsX + 100, shippingLabelY, { width: 95, align: 'right' });

    const taxLabelY = shippingLabelY + lineHeight;
    doc.text(`IVA (${invoice.taxRate}%):`, totalsX, taxLabelY, { width: 145, align: 'right' });
    doc.text(`${invoice.taxAmount.toFixed(2)} €`, totalsX + 100, taxLabelY, { width: 95, align: 'right' });

    // Total final
    const totalY = taxLabelY + lineHeight + 4;
    doc.rect(totalsX - 10, totalY - 6, 205, 28).fill('#1a1a1a');
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('TOTAL:', totalsX, totalY, { width: 145, align: 'right' });
    doc.text(`${invoice.total.toFixed(2)} €`, totalsX + 100, totalY, { width: 95, align: 'right' });

    // ============================================
    // PIE DE PÁGINA
    // ============================================
    const footerY = 720;
    doc.moveTo(50, footerY - 10).lineTo(545, footerY - 10).strokeColor('#cccccc').stroke();
    doc.fontSize(8).font('Helvetica').fillColor('#999999')
      .text('Castellan Store S.L. - NIF: B-12345678 - Calle del Relojero, 12, 28001 Madrid', 50, footerY, { align: 'center' })
      .text('facturacion@castellanstore.com - Tel: +34 912 345 678', 50, footerY + 14, { align: 'center' });

    doc.end();
  });
}
