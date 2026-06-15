import { Request, Response, NextFunction } from 'express';
import { getInvoiceByOrderNumber } from './InvoiceService.js';
import { generateInvoicePdf } from './InvoicePdfService.js';
import { sendSuccess, sendNotFound } from '../shared/utils/ApiResponse.js';

export async function getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orderNumber = req.params.orderNumber as string;
    const invoice = await getInvoiceByOrderNumber(orderNumber);

    if (!invoice) {
      sendNotFound(res, 'Factura no encontrada para este pedido');
      return;
    }

    sendSuccess(res, { data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function downloadInvoicePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orderNumber = req.params.orderNumber as string;
    const invoice = await getInvoiceByOrderNumber(orderNumber);

    if (!invoice) {
      sendNotFound(res, 'Factura no encontrada para este pedido');
      return;
    }

    const pdfBuffer = await generateInvoicePdf(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura-${orderNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}
