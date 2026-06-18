import { Router } from 'express';
import { authMiddleware } from '../shared/middleware/authMiddleware.js';
import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './addressController.js';

const router = Router();

// Todas las rutas de direcciones requieren autenticación
router.use(authMiddleware);

router.get('/', getAddresses);
router.get('/:id', getAddressById);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

export default router;
