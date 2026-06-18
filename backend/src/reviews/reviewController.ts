import { Response, NextFunction } from 'express';
import * as ReviewService from './ReviewService.js';
import { sendSuccess, sendCreated } from '../shared/utils/ApiResponse.js';
import { AuthRequest } from '../shared/middleware/authMiddleware.js';
import { badRequest } from '../shared/utils/AppError.js';

export async function getReviewsByWatch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const watchId = req.params.watchId as string;
    const page = req.query.page ? Number(req.query.page as string) : 0;
    const size = req.query.size ? Number(req.query.size as string) : 10;

    const result = await ReviewService.getByWatch(watchId, page, size);
    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function createReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { watchId, rating, title, comment } = req.body;
    const userId = req.userId!;

    if (!watchId || !rating || !title || !comment) {
      throw badRequest('Faltan campos requeridos: watchId, rating, title, comment');
    }

    if (rating < 1 || rating > 5) {
      throw badRequest('La puntuación debe estar entre 1 y 5');
    }

    const review = await ReviewService.create({
      watchId,
      userId,
      userName: req.body.userName || 'Usuario',
      rating,
      title,
      comment,
    });

    sendCreated(res, { data: review, message: 'Reseña creada correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function updateReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const userId = req.userId!;
    const { rating, title, comment } = req.body;

    const review = await ReviewService.update(id, userId, { rating, title, comment });
    sendSuccess(res, { data: review, message: 'Reseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const userId = req.userId!;

    await ReviewService.remove(id, userId);
    sendSuccess(res, { message: 'Reseña eliminada correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function getUserReviews(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const reviews = await ReviewService.getByUser(userId);
    sendSuccess(res, { data: reviews });
  } catch (err) {
    next(err);
  }
}
