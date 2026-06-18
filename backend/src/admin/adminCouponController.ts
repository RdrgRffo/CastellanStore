import { Response, NextFunction } from 'express';
import { AuthRequest } from '../shared/middleware/authMiddleware.js';
import Coupon from '../coupons/Coupon.js';
import { sendSuccess, sendCreated } from '../shared/utils/ApiResponse.js';
import { badRequest } from '../shared/utils/AppError.js';
import { logActivity } from '../activityLog/ActivityLogService.js';

export async function listCoupons(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '0', size = '20', search = '' } = req.query;
    const skip = Number(page) * Number(size);
    const filter: any = {};
    if (search) {
      filter.code = { $regex: search, $options: 'i' };
    }
    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(size)).lean(),
      Coupon.countDocuments(filter),
    ]);
    sendSuccess(res, {
      data: {
        coupons,
        page: Number(page),
        size: Number(size),
        total,
        totalPages: Math.ceil(total / Number(size)),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, type, discount, minAmount, maxUses, expiresAt } = req.body;
    if (!code || !type || discount === undefined) {
      throw badRequest('Faltan campos requeridos: code, type, discount');
    }
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      throw badRequest('Ya existe un cupón con ese código');
    }
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      discount,
      minAmount: minAmount || 0,
      maxUses: maxUses || null,
      expiresAt: expiresAt || null,
      active: true,
    });

    await logActivity({
      action: 'COUPON_CREATE',
      entity: 'coupon',
      entityId: coupon._id.toString(),
      userId: req.userId,
      userName: req.userName,
      details: `Cupón creado: ${coupon.code} (${type} - ${discount})`,
    });

    sendCreated(res, { data: coupon });
  } catch (err) {
    next(err);
  }
}

export async function updateCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    // Obtener estado anterior para rollback
    const oldCoupon = await Coupon.findById(id).lean();
    const previousState = oldCoupon ? {
      code: oldCoupon.code,
      type: oldCoupon.type,
      discount: oldCoupon.discount,
      minAmount: oldCoupon.minAmount,
      maxUses: oldCoupon.maxUses,
      expiresAt: oldCoupon.expiresAt,
      active: oldCoupon.active,
    } : undefined;

    const updates = req.body;
    const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true });
    if (!coupon) throw badRequest('Cupón no encontrado');

    await logActivity({
      action: 'COUPON_UPDATE',
      entity: 'coupon',
      entityId: id,
      userId: req.userId,
      userName: req.userName,
      details: `Cupón actualizado: ${coupon.code}`,
      previousState,
    });

    sendSuccess(res, { data: coupon });
  } catch (err) {
    next(err);
  }
}

export async function deleteCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    // Guardar estado anterior para rollback
    const oldCoupon = await Coupon.findById(id).lean();
    const previousState = oldCoupon ? {
      _id: oldCoupon._id,
      code: oldCoupon.code,
      type: oldCoupon.type,
      discount: oldCoupon.discount,
      minAmount: oldCoupon.minAmount,
      maxUses: oldCoupon.maxUses,
      expiresAt: oldCoupon.expiresAt,
      active: oldCoupon.active,
    } : undefined;

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) throw badRequest('Cupón no encontrado');

    await logActivity({
      action: 'COUPON_DELETE',
      entity: 'coupon',
      entityId: id,
      userId: req.userId,
      userName: req.userName,
      details: `Cupón eliminado: ${coupon.code}`,
      previousState,
    });

    sendSuccess(res, { data: { message: 'Cupón eliminado' } });
  } catch (err) {
    next(err);
  }
}
