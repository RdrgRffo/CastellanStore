import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';

/**
 * Middleware que verifica que el usuario autenticado tenga uno de los roles permitidos.
 * Debe usarse DESPUÉS de authMiddleware.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.role || !roles.includes(req.role)) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. No tienes permisos para esta operación.',
        statusCode: 403,
      });
      return;
    }
    next();
  };
}
