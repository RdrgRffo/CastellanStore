import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../shared/middleware/authMiddleware.js';
import { createPaymentIntent, refundPayment, getStripeConfig } from './paymentController.js';
import { handleWebhook } from './paymentWebhook.js';

const router = Router();

// Webhook de Stripe (debe ir ANTES del middleware express.json global,
// pero como está en un router separado, necesita raw body)
// Nota: En index.ts registramos esta ruta con express.raw({ type: 'application/json' })
router.post('/webhook', handleWebhook);

// Rutas protegidas
router.post('/create-intent', authMiddleware, createPaymentIntent);
router.post('/refund', authMiddleware, adminMiddleware, refundPayment);
router.get('/config', getStripeConfig);

export default router;
