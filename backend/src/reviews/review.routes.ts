import { Router } from 'express';
import {
  getReviewsByWatch,
  createReview,
  updateReview,
  deleteReview,
  getUserReviews,
} from './reviewController.js';
import { authMiddleware } from '../shared/middleware/authMiddleware.js';

const router = Router();

// Rutas públicas
router.get('/watch/:watchId', getReviewsByWatch);

// Rutas protegidas (requieren autenticación)
router.post('/', authMiddleware, createReview);
router.put('/:id', authMiddleware, updateReview);
router.delete('/:id', authMiddleware, deleteReview);
router.get('/my-reviews', authMiddleware, getUserReviews);

export default router;
