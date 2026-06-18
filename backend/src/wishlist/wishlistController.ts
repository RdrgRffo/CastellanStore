import { Response, NextFunction } from 'express';
import * as WishlistService from './WishlistService.js';
import { sendSuccess } from '../shared/utils/ApiResponse.js';
import { AuthRequest } from '../shared/middleware/authMiddleware.js';
import { badRequest } from '../shared/utils/AppError.js';

export async function getWishlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const wishlist = await WishlistService.getWishlist(userId);
    sendSuccess(res, { data: wishlist });
  } catch (err) {
    next(err);
  }
}

export async function addToWishlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { watchId } = req.body;

    if (!watchId) throw badRequest('watchId es requerido');

    const wishlist = await WishlistService.addToWishlist(userId, watchId);
    sendSuccess(res, { data: wishlist, message: 'Añadido a la lista de deseos' });
  } catch (err) {
    next(err);
  }
}

export async function removeFromWishlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const watchId = req.params.watchId as string;

    if (!watchId) throw badRequest('watchId es requerido');

    const wishlist = await WishlistService.removeFromWishlist(userId, watchId);

    sendSuccess(res, { data: wishlist, message: 'Eliminado de la lista de deseos' });
  } catch (err) {
    next(err);
  }
}

export async function checkWishlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const watchId = req.params.watchId as string;

    if (!watchId) throw badRequest('watchId es requerido');

    const inWishlist = await WishlistService.isInWishlist(userId, watchId);

    sendSuccess(res, { data: { inWishlist } });
  } catch (err) {
    next(err);
  }
}
