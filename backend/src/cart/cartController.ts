import { Response, NextFunction } from 'express';
import { AuthRequest } from '../shared/middleware/authMiddleware.js';
import * as CartService from './CartService.js';
import { sendSuccess } from '../shared/utils/ApiResponse.js';

export async function getCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const cart = await CartService.getCart(req.userId!);
    sendSuccess(res, { data: cart });
  } catch (err) {
    next(err);
  }
}

export async function addToCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { watchId, quantity } = req.body;
    const cart = await CartService.addItem(req.userId!, watchId as string, quantity || 1);
    sendSuccess(res, { data: cart, message: 'Producto añadido al carrito' });
  } catch (err) {
    next(err);
  }
}

export async function updateCartItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const watchId = req.params.watchId as string;
    const { quantity } = req.body;
    const cart = await CartService.updateItemQuantity(req.userId!, watchId, quantity);
    sendSuccess(res, { data: cart, message: 'Cantidad actualizada' });
  } catch (err) {
    next(err);
  }
}

export async function removeFromCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const watchId = req.params.watchId as string;
    const cart = await CartService.removeItem(req.userId!, watchId);
    sendSuccess(res, { data: cart, message: 'Producto eliminado del carrito' });
  } catch (err) {
    next(err);
  }
}

export async function clearCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const cart = await CartService.clearCart(req.userId!);
    sendSuccess(res, { data: cart, message: 'Carrito vaciado' });
  } catch (err) {
    next(err);
  }
}

export async function syncCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items } = req.body;
    const cart = await CartService.syncCart(req.userId!, items);
    sendSuccess(res, { data: cart, message: 'Carrito sincronizado' });
  } catch (err) {
    next(err);
  }
}
