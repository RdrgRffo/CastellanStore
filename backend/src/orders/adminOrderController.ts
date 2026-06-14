import { Response, NextFunction } from 'express';
import { AuthRequest } from '../shared/middleware/authMiddleware.js';
import * as AdminOrderService from './AdminOrderService.js';
import { sendSuccess } from '../shared/utils/ApiResponse.js';

export async function getOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const order = await AdminOrderService.getOrderById(id);
    sendSuccess(res, { data: order });
  } catch (err) {
    next(err);
  }
}

export async function getAllOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, page = '0', size = '10' } = req.query;

    const result = await AdminOrderService.getAllOrders({
      status: status as string | undefined,
      page: Number(page),
      size: Number(size),
    });

    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const order = await AdminOrderService.updateOrderStatus(id, status, req.userId || 'admin', req.userName);
    sendSuccess(res, { data: order, message: 'Estado del pedido actualizado correctamente' });
  } catch (err) {
    next(err);
  }
}
