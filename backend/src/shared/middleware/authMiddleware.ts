import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
  userName?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token no proporcionado' });
    return;
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string; name?: string };
    req.userId = decoded.userId;
    req.role = decoded.role;
    req.userName = decoded.name;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

/**
 * Middleware para rutas de administrador.
 * Debe usarse después de authMiddleware.
 */
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.role !== 'ROLE_MANAGER' && req.role !== 'ROLE_ADMIN') {
    res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador' });
    return;
  }
  next();
}
