import { Router } from 'express';
import { getInvoice, downloadInvoicePdf } from './invoiceController.js';

const router = Router();

router.get('/:orderNumber', getInvoice);
router.get('/:orderNumber/pdf', downloadInvoicePdf);

export default router;
