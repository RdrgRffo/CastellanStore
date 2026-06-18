import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from './wishlistController.js';
import { authMiddleware } from '../shared/middleware/authMiddleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:watchId', removeFromWishlist);
router.get('/check/:watchId', checkWishlist);

export default router;
