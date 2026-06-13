import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError.js';
import { sendError } from './ApiResponse.js';

/**
 * Middleware global de manejo de errores.
 * Se registra al final de la cadena de middleware en index.ts.
 * Captura cualquier error lanzado en controllers/services y devuelve
 * una respuesta normalizada con ApiResponse.
 */
export function globalHandlerException(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log del error en desarrollo
  console.error(`[Error] ${err.message}`);

  // Si es un AppError (error controlado nuestro)
  if (err instanceof AppError) {
    sendError(res, {
      error: err.message,
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    sendError(res, {
      error: 'Error de validación',
      message: err.message,
      statusCode: 400,
    });
    return;
  }

  // Error de cast (ID inválido de MongoDB)
  if (err.name === 'CastError') {
    sendError(res, {
      error: 'ID inválido',
      message: 'El formato del ID no es válido',
      statusCode: 400,
    });
    return;
  }

  // Error de duplicado en MongoDB (código 11000)
  if ((err as any).code === 11000) {
    sendError(res, {
      error: 'El recurso ya existe',
      message: 'Ya existe un registro con ese valor único',
      statusCode: 409,
    });
    return;
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    sendError(res, {
      error: 'Token inválido',
      message: 'El token de autenticación no es válido',
      statusCode: 401,
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, {
      error: 'Token expirado',
      message: 'El token de autenticación ha expirado',
      statusCode: 401,
    });
    return;
  }

  // Error genérico no controlado
  sendError(res, {
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error inesperado',
    statusCode: 500,
  });
}
