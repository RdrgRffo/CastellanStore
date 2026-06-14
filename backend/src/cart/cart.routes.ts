import { Router } from 'express';
import { authMiddleware } from '../shared/middleware/authMiddleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart,
} from './cartController.js';

const router = Router();

// Todas las rutas de carrito requieren autenticación
router.use(authMiddleware);

router.get('/', getCart);
router.post('/', addToCart);
router.post('/sync', syncCart);
router.put('/:watchId', updateCartItem);
router.delete('/:watchId', removeFromCart);
router.delete('/', clearCart);

export default router;
