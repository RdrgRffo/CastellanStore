import { Response, NextFunction } from 'express';
import { AuthRequest } from '../shared/middleware/authMiddleware.js';
import User from '../auth/User.js';
import { sendSuccess } from '../shared/utils/ApiResponse.js';
import { notFound, badRequest } from '../shared/utils/AppError.js';
import { logActivity } from '../activityLog/ActivityLogService.js';

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search = '', page = '0', size = '20' } = req.query;
    const skip = Number(page) * Number(size);

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(size)),
      User.countDocuments(filter),
    ]);

    sendSuccess(res, {
      data: {
        users: items,
        page: Number(page),
        size: Number(size),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(size)),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.id as string;
    const { role } = req.body;

    if (!['ROLE_USER', 'ROLE_MANAGER'].includes(role)) {
      throw badRequest('Rol inválido. Valores permitidos: ROLE_USER, ROLE_MANAGER');
    }

    // No permitir cambiarse el rol a uno mismo
    if (userId === req.userId) {
      throw badRequest('No puedes cambiar tu propio rol');
    }

    // Obtener rol anterior para rollback
    const oldUser = await User.findById(userId).select('-passwordHash');
    const previousState = oldUser ? { oldRole: oldUser.role } : undefined;

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-passwordHash');
    if (!user) {
      throw notFound('Usuario no encontrado');
    }

    await logActivity({
      action: 'ROLE_CHANGE',
      entity: 'user',
      entityId: userId,
      userId: req.userId,
      userName: req.userName,
      details: `Rol cambiado a ${role}`,
      previousState,
    });

    sendSuccess(res, { data: user, message: 'Rol actualizado correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function toggleUserBlock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.id as string;

    // No permitir bloquearse a uno mismo
    if (userId === req.userId) {
      throw badRequest('No puedes bloquearte a ti mismo');
    }

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw notFound('Usuario no encontrado');
    }

    const wasBlocked = (user as any).blocked || false;
    const newBlocked = !wasBlocked;
    const previousState = { wasBlocked };

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { blocked: newBlocked } },
      { new: true }
    ).select('-passwordHash');

    await logActivity({
      action: newBlocked ? 'BLOCK' : 'UNBLOCK',
      entity: 'user',
      entityId: userId,
      userId: req.userId,
      userName: req.userName,
      details: newBlocked ? 'Usuario bloqueado' : 'Usuario desbloqueado',
      previousState,
    });

    sendSuccess(res, {
      data: updated,
      message: newBlocked ? 'Usuario bloqueado correctamente' : 'Usuario desbloqueado correctamente',
    });
  } catch (err) {
    next(err);
  }
}
