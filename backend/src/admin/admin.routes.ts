import { Router } from 'express';
import { authMiddleware } from '../shared/middleware/authMiddleware.js';
import { requireRole } from '../shared/middleware/requireRole.js';
import { searchProducts, getProduct, createProduct, updateProduct, deleteProduct, updateStock, uploadProductImage, uploadGalleryImages } from '../catalog/adminProductController.js';
import { upload, processAndUploadImage, processAndUploadGalleryImages } from '../shared/middleware/uploadMiddleware.js';
import { getAllOrders, getOrder, updateOrderStatus } from '../orders/adminOrderController.js';
import { getDashboard } from './adminDashboardController.js';
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from './adminCouponController.js';
import { listUsers, updateUserRole, toggleUserBlock } from './adminUserController.js';
import { listActivityLogs, rollbackLogAction } from '../activityLog/activityLogController.js';

const router = Router();

// Todas las rutas admin requieren autenticación + rol de manager
router.use(authMiddleware, requireRole('ROLE_MANAGER'));

// Dashboard
router.get('/dashboard', getDashboard);

// Productos
router.get('/products', searchProducts);
router.get('/products/:id', getProduct);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.patch('/products/:id/stock', updateStock);
router.post('/products/upload-image', upload.single('image'), processAndUploadImage, uploadProductImage);
router.post('/products/upload-gallery', upload.array('images', 10), processAndUploadGalleryImages, uploadGalleryImages);

// Pedidos
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrder);
router.patch('/orders/:id/status', updateOrderStatus);

// Cupones
router.get('/coupons', listCoupons);
router.post('/coupons', createCoupon);
router.patch('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Usuarios
router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/block', toggleUserBlock);

// Logs de actividad
router.get('/activity-logs', listActivityLogs);
router.post('/activity-logs/:id/rollback', rollbackLogAction);

export default router;
